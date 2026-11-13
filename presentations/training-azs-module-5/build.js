// Azure Security Engineering learning path, Module 5: Policy, drift and evidence — the module's narrated deck.
// Teaches docs/training/azure-security/05-policy-drift-and-evidence.md, Learn-style: objectives, the concepts (one
// security initiative at the intermediate root, DoNotEnforce then Default, remediation, exemptions that expire, the
// monthly export; the DDoS runbook, the recurring reviews, the RACI, the metrics, control states and closure), where
// agencies are, the lab's exact commands in a test management group (not run by the authors, as the page says; the module
// has no Lab 1), the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the
// module page and the Azure Security Engineering implementation guide it sends the learner to (Steps 9 and 10, RACI,
// Evidence catalog, Metrics, Control states, Dangers, and their footnotes) or the path's verification log; the deck adds
// none. Helpers: ../training-azs-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-azs-module-5/build.js \
//                      presentations/training-azs-module-5/Training_AZS_Module_5.pptx
const P = require("../training-azs-module-1/shared.js")({
  title: "Module 5: Policy, drift and evidence",
  footer: "Federal Modernization Workbook  ·  Azure Security Engineering learning path, Module 5: Policy, drift and evidence",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_AZS_Module_5.pptx";
const M = "Training, Azure Security Engineering, Module 5";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;
const LAB = "LAB 2  ·  A TEST MANAGEMENT GROUP, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: Policy, drift and evidence", "Azure Security Engineering · Hold it in place, run it, and hand the assessor the evidence",
    ["One security initiative  ·  Audit, then enforce  ·  Exemptions that expire  ·  The monthly export", "The runbook and reviews  ·  Metrics  ·  Control states  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 5, the last module of the Azure Security Engineering learning path: policy, drift and evidence. Everything you engineered in Modules 1 to 4 can drift. Policy holds it in place and reports what drifted; the operating model gives each control an owner, a cadence and a test; and the evidence catalog turns both into what an assessor can inspect. This module covers Steps 9 and 10 of the Azure Security Engineering implementation guide, and takes about fifty minutes, plus a lab in your own test management group.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: everything you built can drift");
  tag(s, "Why");
  const l = panel(s, "Drift", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "WHAT DRIFT LOOKS LIKE", null, [
    "A new public IP in a workload subscription, outside DDoS and WAF",
    "A WAF switched back to detection",
    "A vault created with public access on",
  ], 13);
  const r = panel(s, "Hold", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHAT HOLDS IT", null, [
    "Policy: the security initiative, enforced, with expiring exemptions",
    "Operations: an owner, a cadence and a test for each control",
    "Evidence an assessor can inspect",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaArrowsRotate", HEX.red, "This module: ",
    "turn Steps 3 to 8 into policy, run them, measure coverage rather than settings, and get each finding ready for the assessor's decision.");
  sources(s, "Sources: Module 5, \"Introduction\"; Guide, Steps 9 and 10, \"Dangers\"; Governance, Drift and Evidence, Ch. 02.");
  notes(s,
`Why does this matter? Governance, Drift and Evidence makes the case that drift is the primary threat, and the guide's dangers table shows what it looks like here. A new public I P appears in a workload subscription, outside DDoS protection and the web application firewall. A firewall policy gets switched back to detection. A vault is created with public access on. Nothing you engineered in Modules 1 to 4 stays put on its own. Three things hold it. Policy: one security initiative, enforced, with exemptions that expire. Operations: an owner, a cadence and a test for every control. And evidence an assessor can inspect. This module turns Steps 3 to 8 into policy, runs them, measures coverage rather than settings, and gets each finding ready for the assessor's decision.`,
  `${M} — "Introduction"; guide, Step 9 (opening), Step 10 (opening), "Dangers"; Book 13, Chapter 02.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Gather the security definitions into one initiative, then enforce",
    "Explain remediation, and what stays after a rollback",
    "Create an exemption with a category and an expiry",
    "Run the DDoS runbook and the reviews; read the RACI",
    "Compute the metrics as coverage; say when a finding is ready",
  ], [
    "Modules 1 to 4",
    "Cloud Boundary, Ch. 05, and Governance, Drift and Evidence, Ch. 02: skim",
    "Lab 2: a test management group",
  ], 50);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll gather the security definitions into one initiative, and move it from do-not-enforce to default after a compliance review. You'll explain what a remediation task does, and what stays after a rollback. You'll create an exemption with a category and an expiry, and find the ones past it. You'll run the DDoS incident runbook and the recurring reviews, and read the RACI. And you'll compute the guide's metrics as protected coverage, not settings, and say what makes a finding ready for closure. You need Modules 1 to 4, and a skim of two chapters: Chapter 05 of Cloud Boundary and Landing Zone, on enforcing without breaking things, and Chapter 02 of Governance, Drift and Evidence.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Initiative
{
  const s = content(SC, "Unit 1: one initiative, audit first, then enforce");
  tag(s, "How");
  const c = code(s, "Pol", 0.6, 1.45, 12.15, [
    "# Look up each definition's name in the cloud you're in (built-ins differ by cloud)",
    "az policy definition list --query \"[?displayName=='Virtual networks should be protected by Azure DDoS Protection'].{name:name, ...}\"",
    "# Assign at the intermediate root in DoNotEnforce, with a managed identity for deployIfNotExists and modify",
    "az policy assignment create --name azs-security --policy-set-definition <initiative-name> --scope <mg-scope> `",
    "    --enforcement-mode DoNotEnforce --mi-system-assigned --location <location> --role Contributor --identity-scope <mg-scope>",
    "# After the compliance review: Default; then a remediation task per deployIfNotExists or modify policy",
    "az policy assignment update --name azs-security --scope <mg-scope> --enforcement-mode Default",
    "az policy remediation create --name azs-ddos-remediation --policy-assignment azs-security --definition-reference-id <reference-id> ...",
  ], { label: "THE GUIDE'S STEP 9 COMMANDS (SHORTENED: <mg-scope> IS THE MANAGEMENT GROUP'S SCOPE)", pt: 10.5 });
  const p1 = panel(s, "In", 0.6, c + 0.2, W2, null, HEX.navy, HEX.navyTint, "WHAT GOES IN", null, [
    "DDoS and its logs; WAF enabled and its mode; private DNS and public access; Key Vault",
  ], 12);
  const p2 = panel(s, "Role", 0.6 + W2 + G2, c + 0.2, W2, null, HEX.amber, HEX.amberTint, "THE NARROWEST ROLE", null, [
    "Grant the role each definition names, not Contributor, where the initiative allows (design guidance)",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! policy panels may overflow");
  sources(s, "Sources: Module 5, Unit 1; Guide, Step 9 (steps 1 to 3); Azure Policy assignment structure; Azure Web Application Firewall and Azure Policy.");
  notes(s,
`Unit 1 is the guide's Step 9. Gather the security definitions from Steps 3 to 8 into one initiative, assigned at the intermediate root: DDoS protection on virtual networks and its logs, the firewall-enabled and firewall-mode policies that Learn's page, Azure Web Application Firewall and Azure Policy, describes, the private D N S and public-access policies, and the Key Vault policies. Built-in definitions differ by cloud, so look each one up by display name in the cloud you're in. Assign the initiative in do-not-enforce mode first. Policies with deploy-if-not-exists or modify effects need a managed identity and a role; grant the narrowest role each definition names, not Contributor, where the initiative allows it. After at least one evaluation cycle and a review of the non-compliant list with owners, switch to Default. Then run a remediation task for each deploy-if-not-exists or modify policy, to fix what already exists.`,
  `${M} — Unit 1; guide, Step 9 (steps 1 to 3; How template); Microsoft Learn — "Azure Policy assignment structure," "Azure Web Application Firewall and Azure Policy."`);
}

// ================================================================== 5 Exemptions
{
  const s = content(SC, "Exemptions expire, and compliance is filed monthly");
  tag(s, "Who");
  const tb = table(s, "Ex", 1.45, [2.6, 9.55], ["Category", "When (Learn's exemption structure)"], [
    ["Mitigated", "The policy's intent is met another way"],
    ["Waiver", "Non-compliance is accepted for a time"],
    ["Expired", "Kept for the record, but no longer honored"],
  ], { fontSize: 12.5, limit: 3.4 });
  const c = code(s, "Ex", 0.6, tb + 0.2, 12.15, [
    "az policy exemption create --name <exemption-name> --policy-assignment <assignment-id> --exemption-category Waiver `",
    "    --expires-on <expiry> --scope <rg-scope> --description \"<decision record reference>\"",
    "# Each month",
    "az policy state summarize --management-group <mg-id> -o json > out/policy-summary.json",
    "az policy state list --management-group <mg-id> --filter \"complianceState eq 'NonCompliant'\" -o json > out/policy-noncompliant.json",
  ], { label: "THE GUIDE'S STEP 9 COMMANDS (SHORTENED)", pt: 10.5 });
  line(s, "Rules", "No notScopes for convenience. Rollback is DoNotEnforce, in minutes; resources a remediation created stay until removed.", c + 0.2, 0.5, 13.5);
  sources(s, "Sources: Module 5, Unit 1; Guide, Step 9 (steps 4 and 5, How template); Azure Policy exemption structure; Azure Policy assignment structure.");
  notes(s,
`Exemptions expire. Learn's page on the Azure Policy exemption structure gives two categories: Mitigated, when the policy's intent is met another way, and Waiver, when non-compliance is accepted for a time. Every exemption gets an expiry and a reference to its decision record. And once it expires, Learn says it's kept for the record but no longer honored, so the resource shows as non-compliant again. The guide adds a rule: exemptions only, never not-scopes for convenience. Each month, export compliance: the summary, and the list of non-compliant resources, filed as evidence. Rollback, if enforcement breaks something, is the assignment back to do-not-enforce, in minutes. One caution: resources a remediation task created stay until someone removes them.`,
  `${M} — Unit 1; guide, Step 9 (steps 4 and 5; How template: rollback, exclusions); Microsoft Learn — "Azure Policy exemption structure," "Azure Policy assignment structure."`);
}

// ================================================================== 6 Runbook and cadence
{
  const s = content(SC, "Unit 2: the DDoS runbook and the review calendar");
  tag(s, "Who");
  const p1 = panel(s, "Run", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "A DDOS ATTACK (DESIGN GUIDANCE, ON LEARN)", null, [
    "The alert pages the security monitor; Defender for Cloud raises the mitigation alert",
    "Check application health and the WAF logs for a layer-7 part; lower rate limits by emergency change",
    "Not enough: a severity A request for Rapid Response",
    "After: mitigation logs, timeline, any cost-protection claim, the after-action report",
  ], 12);
  const tb = table(s, "Cad", 1.45, [1.55, 4.4], ["Cadence", "Review"], [
    ["Weekly", "Exposure register; new and ownerless IPs"],
    ["Monthly", "Compliance export; exemptions; WAF false positives"],
    ["Quarterly", "DDoS coverage and cost; firewall rules; vault access; WAF rule set"],
    ["Twice a year", "Front Door failover; vault restore test"],
    ["Yearly", "DDoS simulation; decision records re-read"],
  ], { fontSize: 11.5, limit: 6.5, x: 0.6 + W2 + G2 });
  if (Math.max(p1, tb) > 6.61) console.warn("  ! runbook may overflow");
  sources(s, "Sources: Module 5, Unit 2; Guide, Step 10 (incident response, recurring reviews), RACI; Secure your Azure DDoS Protection deployment; Layer 7 DDoS protection.");
  notes(s,
`Unit 2 is the guide's Step 10, the operating model. Its DDoS runbook is design guidance, built on Learn's response strategy. The under-attack alert pages the security monitor, and Defender for Cloud raises the mitigation alert. The monitor checks application health, and the firewall logs for a layer seven component, with the top-talker queries from Learn's page on application layer DDoS protection; the platform owner lowers the rate limits through an emergency change if needed. If mitigation isn't enough, open a severity A request for Rapid Response, under Network Protection. Afterwards: the mitigation logs, the timeline, any cost-protection claim, and an after-action report. The review calendar is design guidance too: the exposure register weekly; compliance, exemptions and firewall false positives monthly; coverage, cost, firewall rules, vault access and the rule set quarterly; failover and a vault restore twice a year; and a DDoS simulation every year. The guide's RACI names who does each.`,
  `${M} — Unit 2; guide, Step 10 (Incident response for a DDoS attack; Recurring reviews), RACI; Microsoft Learn — "Secure your Azure DDoS Protection deployment," "Azure DDoS Protection fundamental best practices," "Layer 7 DDoS protection."`);
}

// ================================================================== 7 Metrics and closure
{
  const s = content(SC, "Measure coverage, then let the assessor decide");
  tag(s, "What");
  const tb = table(s, "Met", 1.45, [3.0, 6.75, 2.4], ["Metric (design guidance)", "How it's computed", "Target"], [
    ["Exposure ownership", "Register rows with an owner ÷ all rows", "100%"],
    ["DDoS coverage", "Public IPs with Network or IP Protection ÷ public IPs (excluding NAT gateway IPs)", "100%"],
    ["WAF prevention coverage", "HTTP endpoints behind a WAF in Prevention with body inspection ÷ all", "100%"],
    ["Egress inspection", "Workload subnets whose effective default route is the firewall ÷ subnets", "100%"],
    ["Exemption hygiene", "Exemptions past expiry without renewal", "0"],
  ], { fontSize: 11.5, limit: 5.0 });
  callout(s, "Close", tb + 0.2, 1.05, "FaScaleBalanced", HEX.navy, "Ready for closure ",
    "when every applicable state (Designed, Configured, Enforced, Evidenced, Operated) has evidence; the authorizing official or assessor decides.");
  sources(s, "Sources: Module 5, Unit 2; Guide, \"Metrics,\" \"Control states and assessment mapping,\" \"Evidence catalog\"; Zero Trust and Assessment, Ch. 10.");
  notes(s,
`Measure protected coverage and effectiveness, not that a setting exists. The guide's metrics are design guidance, and each divides what's protected and tested by what exists. Exposure ownership: register rows with an owner, over all rows, target a hundred percent. DDoS coverage: public I Ps with Network or I P Protection, over public I Ps, excluding NAT gateway I Ps. Web application firewall prevention coverage, origin lock-down, egress inspection, private pass, vault posture, policy compliance, and exemption hygiene, where the target is zero exemptions past their expiry. Then closure. A finding the guide addresses is ready for closure when every applicable control state, Designed, Configured, Enforced, Evidenced and Operated, has evidence; the authorizing official or assessor decides. Findings from a Zero Trust assessment enter the closure chain that Zero Trust and Assessment sets out, weighted by exposure and blast radius, not pass rate.`,
  `${M} — Unit 2; guide, "Metrics," "Control states and assessment mapping," "Evidence catalog," Step 10 (opening); Book 11, Chapter 10.`);
}

// ================================================================== 8 Gov
{
  const s = content(SC, "Where agencies are: look built-ins up in your cloud");
  tag(s, "Who");
  const p1 = panel(s, "Pol", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "AZURE POLICY", null, [
    "No variation listed between commercial Azure and Azure Government",
    "FedRAMP initiatives exist in separate versions for each cloud",
  ], 12.5);
  const p2 = panel(s, "Built", 0.6 + W3 + G3, 1.45, W3, null, HEX.amber, HEX.amberTint, "BUILT-IN DEFINITIONS", null, [
    "Differ by cloud: the guide lists them by display name",
    "Look each up where you are, as the lab does",
  ], 12.5);
  const p3 = panel(s, "Env", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.red, HEX.redTint, "A DANGER OF ITS OWN", null, [
    "Assuming commercial features in Azure Government",
    "A test the cloud can't run: an environment decision, not a failure",
  ], 12.5);
  callout(s, "GCC", Math.max(p1, p2, p3) + 0.3, 0.95, "FaCloud", HEX.teal, "GCC first: ",
    "a GCC tenant's commercial subscriptions run Step 9 as written; Azure Government needs its own initiative versions and definition names.");
  sources(s, "Sources: Module 5, Unit 3; Guide, \"Government-cloud availability\" (Azure Policy), \"What couldn't be verified,\" \"Dangers\"; Compare Azure Government and global Azure.");
  notes(s,
`Where are agencies? Learn's comparison page lists no variation in Azure Policy between commercial Azure and Azure Government. But the fed-ramp initiatives exist in separate versions for each cloud, as Cloud Boundary and Landing Zone notes, and built-in definitions differ by cloud. That's why the guide lists them by display name, and has you look each one up in the cloud you're in, as the lab does. In G C C, the workbook's baseline, the commercial subscriptions run Step 9 as written. In Azure Government, use its own initiative versions and definition names. And the guide lists assuming commercial features in Azure Government as a danger of its own: a test the cloud can't run is recorded as an environment decision, not a failed control.`,
  `${M} — Unit 3; guide, "Government-cloud availability" (Azure Policy row), "What couldn't be verified" (built-in policy names), "Dangers"; Microsoft Learn — "Compare Azure Government and global Azure"; Book 10, Chapter 05.`);
}
endModule(SC);

// ================================================================== 9 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 4: enforcement, the export, exemptions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: the initiative's enforcement mode",
    "az policy assignment show --name azs-security --scope /providers/Microsoft.Management/managementGroups/<mg-id> `",
    "    --query \"{name:name, enforcementMode:enforcementMode}\"",
    "# Step 2: one built-in definition, looked up in the cloud you're in (shortened)",
    "az policy definition list --query \"[?displayName=='Virtual networks should be protected by Azure DDoS Protection'] ...\" -o json",
    "# Step 3: this month's compliance",
    "New-Item -ItemType Directory -Force -Path out",
    "az policy state summarize --management-group <mg-id> -o json > out/policy-summary.json",
    "az policy state list --management-group <mg-id> --filter \"complianceState eq 'NonCompliant'\" -o json > out/policy-noncompliant.json",
    "# Step 4: the exemptions, with category and expiry (Learn's management-group example)",
    "az policy exemption list --management-group <mg-id> --filter \"atScopeAndBelow()\" `",
    "    --query \"[].{name:name, category:exemptionCategory, expiresOn:expiresOn}\" -o table",
  ], { label: LAB, pt: 10.5 });
  line(s, "Expect", "Expected (the guide's Validate): the summary shows the initiative's compliance; no exemption past its expiry without a renewal decision.", c + 0.15, 0.55, 13);
  sources(s, "Sources: Module 5, \"Exercise: Lab 2,\" steps 1 to 4; Guide, Step 9 (Validate); az policy exemption list reference.");
  notes(s,
`The lab exports the evidence Step 9 files each month, from a test management group where someone has assigned the guide's security initiative. Every command reads, the only thing written is a folder on your machine, and the authors haven't run it. Step one shows the initiative's enforcement mode: do-not-enforce during the audit phase, Default once the compliance review has passed. Step two looks up one built-in definition in the cloud you're in. Step three exports this month's compliance: the summary and the non-compliant list. The guide's Validate step says the summary shows the initiative's compliance. Step four lists the exemptions with their category and expiry, using the management-group example from Learn's reference for the exemption list command. Expect no exemption past its expiry without a renewal decision, and none without an expiry.`,
  `${M} — "Exercise: Lab 2, a test subscription," "You need," steps 1 to 4; guide, Step 9 (Validate); Microsoft Learn — Azure CLI "az policy exemption" (read November 13, 2026, per the path's verification log).`);
}

// ================================================================== 10 Lab part 2
{
  const s = content(SL, "Lab 2, steps 5 and 6: two metrics, then back out");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 5: exposure ownership and DDoS coverage from the register (the arithmetic is the path's; query shortened)",
    "az graph query -q \"Resources | where type =~ 'microsoft.network/publicipaddresses' | project id, name, ddosMode = ..., owner = ...\" `",
    "    --first 1000 -o json > out/public-ips.json",
    "$ips = (Get-Content -Raw out/public-ips.json | ConvertFrom-Json).data",
    "'Exposure ownership: {0} of {1}' -f @($ips | Where-Object { $_.owner }).Count, @($ips).Count",
    "'DDoS coverage: {0} of {1}' -f @($ips | Where-Object { $_.ddosMode -in 'Enabled', 'VirtualNetworkInherited' }).Count, @($ips).Count",
    "# Step 6: file the exports with date, cloud, subscription and tester if this is a real review; otherwise delete",
    "Remove-Item -Recurse -Force out",
  ], { label: LAB, pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The guide's target for both is 100%: ",
    "exclude public IPs on NAT gateways by hand, as the DDoS coverage metric says.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2,\" steps 5 and 6; Guide, \"Metrics,\" \"Evidence catalog\"; Module 1, Lab 2.");
  notes(s,
`Step five computes two of the guide's metrics from the exposure register. It reruns Module 1's public I P query, then counts. Exposure ownership is the rows with an owner over all rows. DDoS coverage is the rows whose DDoS mode is Enabled or Virtual Network Inherited, over all rows. The arithmetic is the path's own; the definitions are the guide's metrics table. Exclude public I Ps on NAT gateways by hand, as the DDoS coverage metric says, because DDoS protection doesn't cover them. The guide's target for both is a hundred percent. Step six backs it out. The lab created nothing in Azure. If this is a real review, file the exports with their date, the cloud and subscription, and the tester, as the guide's evidence pattern asks. Otherwise, delete the folder.`,
  `${M} — "Exercise: Lab 2," steps 5 and 6; guide, "Metrics," "Evidence catalog" (filing each item).`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["Step 9: CM-2 baseline configuration, CM-6 configuration settings, CA-7 continuous monitoring", "KSI-SVC-ACM, KSI-CNA-EIS, KSI-MLA-EVC", "The monthly export, the exemption register"],
    ["Step 10: IR-4 incident handling, CP-4 contingency plan testing, AU-6 audit record review", "KSI-INR-RIR, KSI-INR-AAR, KSI-RPL-TRC, KSI-MLA-OSM", "Review records, exercises, after-action reports"],
  ], { fontSize: 12, limit: 4.8 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The steps support the controls; ",
    "the organization sets their parameters, and the assessor decides. The cadence is the program's; the controls ask for the activity.");
  sources(s, "Sources: Module 5, \"The federal requirement,\" \"Summary\"; Guide, Step 10 (Authority), \"Federal requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five, as the guide's requirements table maps it. Step 9 supports C M two, baseline configuration, C M six, configuration settings, and C A seven, continuous monitoring; its evidence is the monthly compliance export and the exemption register. Step 10 supports I R four, incident handling, C P four, contingency plan testing, and A U six, audit record review; its evidence is the review records, the exercises, and the after-action reports. The guide notes that those controls ask for incident handling, contingency plan testing and continuous monitoring at Moderate, and that the cadence is the program's own. Each row lines up with the fed-ramp twenty X key security indicators the guide names. The steps support these controls; the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; "Summary"; guide, Step 10 (Authority), "Federal requirements and KSIs" (rows 9 and 10).`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on Module 5", [
    { q: "An exemption's expiry date has passed. What happens?", options: ["a. It is deleted automatically", "b. It is kept for the record but no longer honored; expired exemptions are reported monthly", "c. It renews for another year"] },
    { q: "When is a finding this guide addresses ready for closure?", options: ["a. When the Zero Trust assessment shows a pass", "b. When every applicable control state has evidence; the authorizing official or assessor decides", "c. When the platform owner signs the RACI"] },
  ], "1 b: kept, not honored. 2 b: evidence for every applicable state; the assessor decides.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 2 and 5; Units 1 and 2; Guide, Step 9, \"Control states and assessment mapping.\"");
  notes(s,
`Check yourself with two questions. First: an exemption's expiry date has passed. What happens? The answer is b: it's kept for the record but no longer honored, and the guide reports expired exemptions every month. Second: when is a finding this guide addresses ready for closure? The answer is b: when every applicable control state has evidence. The authorizing official or assessor decides; a pass in an assessment isn't the decision. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 2 and 5, and "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary: held in place, run, and evidenced");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked the initiative's enforcement, and the monthly export",
    "Listed exemptions with their category and expiry",
    "Walked the DDoS runbook and the review calendar",
    "Computed two metrics as coverage, toward closure",
  ], 13.5);
  const r = panel(s, "Done", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "THE PATH IS COMPLETE", "What's next", [
    "The guide's implementation checklist; the developer workbook, with fixture labs, is planned",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "initiative and assignment exports, monthly compliance, deny events, the exemption register, the RACI and calendar, review and exercise records, and signed accepted risks.");
  sources(s, "Sources: Module 5, \"Summary\"; learning path index; Guide, \"Implementation checklist,\" \"The guide's pieces.\"");
  notes(s,
`To sum up. You checked the security initiative's enforcement mode and exported the month's compliance. You listed the exemptions with their category and expiry. You walked the DDoS runbook and the review calendar. And you computed two of the guide's metrics as coverage, the kind of evidence that gets a finding ready for the assessor's decision. The evidence an I S S O keeps from this module: the initiative and assignment exports, the monthly compliance exports, deny events, the exemption register with its decision records, the RACI and review calendar, review and exercise records, and accepted risks with the authorizing official's signature. That completes the path. The guide's implementation checklist puts all ten steps on one page, and a developer workbook, with labs on fixtures, is planned.`,
  `${M} — "Summary," "Continue the path"; guide, "Implementation checklist," "How to read this guide" (the guide's pieces).`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/azure-security/05-policy-drift-and-evidence.md (Azure Security Engineering learning path, Module 5), a draft; the path's verification log is docs/training/azure-security/_verification/learning-path.md.",
  "Azure Security Engineering (implementation guide): Steps 9 and 10; RACI; Evidence catalog; Metrics; Control states and assessment mapping; Federal requirements and KSIs; Dangers; Implementation checklist. Its footnotes carry each source, read November 11, 2026: Microsoft Learn, Azure Policy assignment structure; Azure Policy exemption structure; Azure Web Application Firewall and Azure Policy; Secure your Azure DDoS Protection deployment; DDoS fundamental best practices; Layer 7 DDoS protection; Compare Azure Government and global Azure.",
  "Read for the lab, November 13, 2026: Azure CLI, az policy exemption.",
  "Cloud Boundary and Landing Zone, Chapter 05; Governance, Drift and Evidence, Chapter 02; Zero Trust and Assessment, Chapter 10. NIST SP 800-53 Rev. 5 (CM-2, CM-6, CA-7, IR-4, CP-4, AU-6); FedRAMP 20x KSIs, as the guide's requirements table maps them.",
  "The lab's commands are the page's, with its placeholders; the module has no Lab 1, and the lab wasn't run by the authors.",
]);

finish(OUT);
