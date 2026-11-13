// Global Secure Access learning path, Module 6: Rings, rollback and the evidence package — the module's narrated deck.
// Teaches docs/training/global-secure-access/06-rings-rollback-and-the-evidence-package.md, Learn-style: objectives, the
// concepts (the rings and coexistence, branches and TIC parity, the RACI and closure, the control states and evidence
// catalog, the metrics, the rollback order), Lab 2's exact commands in a test tenant (not run by the authors, as the page
// says; the path has no Lab 1), the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page and the Global Secure Access implementation guide it sends the learner to (Steps 11 and 12,
// RACI, control states, evidence catalog, metrics, dangers, rollback, and their footnotes); the deck adds none.
// Helpers: ../training-gsa-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-gsa-module-6/build.js \
//                      presentations/training-gsa-module-6/Training_GSA_Module_6.pptx
const P = require("../training-gsa-module-1/shared.js")({
  title: "Module 6: Rings, rollback and the evidence package",
  footer: "Federal Modernization Workbook  ·  Global Secure Access learning path, Module 6: Rings, rollback and the evidence package",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_GSA_Module_6.pptx";
const M = "Training, Global Secure Access, Module 6";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 6: Rings, rollback and the evidence package", "Global Secure Access as the Identity-Aware Network · Steps 11 and 12",
    ["The rings  ·  Coexistence and branches  ·  Who decides closure", "The evidence and the metrics  ·  The rollback order  ·  Lab 2 in a test tenant"]);
  notes(s,
`Welcome to Module 6 of Global Secure Access as the Identity-Aware Network: rings, rollback and the evidence package. Modules 1 to 5 built every piece for a pilot. This module makes it a migration, and then hands an assessor the evidence. It covers Steps 11 and 12 of the Global Secure Access implementation guide, with its RACI, evidence catalog, metrics, dangers and rollback, and takes about forty minutes, plus a lab that rolls your whole test tenant back.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a pilot becomes a migration, then evidence");
  tag(s, "Why");
  const l = panel(s, "Move", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "A MIGRATION", null, [
    "Users move ring by ring",
    "Each ring exits on measured criteria",
    "A VPN route goes only after its wave holds",
    "Anything can be rolled back in a known order",
  ], 13);
  const r = panel(s, "Close", 0.6 + W2 + G2, 1.45, W2, null, HEX.teal, HEX.tealTint, "THEN EVIDENCE", null, [
    "One package per network finding",
    "Configuration, test, operational, exception, reassessment",
    "The assessor recommends; the authorizing official decides",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.navy, "This module: ",
    "the rings, coexistence and branches, who decides, the evidence and metrics, and the rollback order you rehearse in the lab.");
  sources(s, "Sources: Module 6, \"Introduction\"; Guide, Step 11, RACI, Evidence catalog, Rollback; Zero Trust and Assessment, Chapter 10.");
  notes(s,
`Why does this matter? A pilot isn't a deployment. In this module the pilot becomes a migration: users move ring by ring, each ring exits on criteria you measure, the V P N route for an application goes only after its wave holds, and anything can be rolled back in a known order. Then each network finding gets an evidence package an assessor can check: configuration, test, operational, exception, and reassessment evidence. The assessor recommends a finding ready for closure, and the authorizing official decides. In the lab, you rehearse the rollback on your test tenant, and keep the exports that show the state before and after it.`,
  `${M} — "Introduction"; guide, Step 11, "RACI," "Evidence catalog," "Rollback"; Zero Trust and Assessment, Chapter 10 (the closure chain).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "Run the four rings with exit criteria and backout triggers set ahead",
    "Keep the VPN, DirectAccess and another SSE working during the move",
    "Say who is responsible and accountable, and who decides closure",
    "Assemble the five kinds of evidence for each finding",
    "Compute the coverage metrics, and roll back in the guide's order",
  ], [
    "Modules 1 to 5, and their labs",
    "Zero Trust and Assessment, Chapter 10: the closure chain",
    "Lab 2: a test tenant, never production",
  ], 40);
  sources(s, "Sources: Module 6, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll run the four rings, with exit criteria and backout triggers set before each one starts. You'll keep the V P N, DirectAccess and another security service edge working beside the service during the move, and explain branch parity. You'll say who is responsible and accountable for each activity, and who decides closure. You'll assemble the five kinds of evidence for each network finding. And you'll compute the guide's coverage metrics, and roll back in the guide's order. You need Modules 1 to 5 and their labs, and Zero Trust and Assessment, chapter ten, for the closure chain. The lab runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Rings
{
  const s = content(SC, "Unit 1: four rings, each with exit criteria");
  tag(s, "How");
  const tb = table(s, "Rings", 1.45, [1.0, 4.35, 6.8], ["Ring", "Scope", "Exit criteria"], [
    ["0", "The implementing team", "Every step's Validate passed; break-glass rehearsed"],
    ["1", "Pilot, fewer than 20 users across roles and sites", "10 business days; no unresolved Sev-2; client on all pilot devices; report-only clean"],
    ["2", "About 10% of users, including one branch", "20 business days; help desk volume within threshold; TLS failure rate under 1%"],
    ["3", "Everyone in scope, in waves", "Per wave, ring 2's criteria; each VPN route removed only after the wave holds"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Safe", tb + 0.25, 1.4, "FaTriangleExclamation", HEX.red, "Change safety: ",
    "emergency access excluded from every policy and tested as each ring starts; backout triggers set ahead; a new profile or connector restructure is a major change.");
  sources(s, "Sources: Module 6, Unit 1; Guide, Step 11.1 (rings; change safety); Common operations for Global Secure Access (change categories).");
  notes(s,
`Unit 1 is the rings. Ring zero is the implementing team; it exits when every step's Validate has passed and break-glass has been rehearsed. Ring one is the pilot, fewer than twenty users across roles and sites, for ten business days, with no unresolved severity-two ticket, the client active on every pilot device, and clean report-only results. Ring two is about ten percent of users, including one branch, for twenty business days, with help desk volume within the agreed threshold and a T L S failure rate under one percent. Ring three is everyone in scope, in waves by organization, each wave meeting ring two's criteria, and each application's V P N route removed only after its wave holds. Around every ring: the emergency access group is excluded from every policy in Steps 5 to 10 and tested the day each ring starts; backout triggers are set in advance; and, as Learn categorizes changes, enabling a new traffic profile or restructuring connector groups is a major change for the change advisory board.`,
  `${M} — Unit 1 "The rings and coexistence"; guide, Step 11.1 (rings table; emergency access; change window; backout triggers; post-change validation); Microsoft Learn — "Common operations for Microsoft Entra Global Secure Access."`);
}

// ================================================================== 5 Coexistence
{
  const s = content(SC, "Coexistence during the move, and branch parity");
  tag(s, "Who");
  const tb = table(s, "Co", 1.45, [3.3, 8.85], ["Beside", "What the guide does"], [
    ["The VPN", "Stays for apps not yet published, split-include where it supports it; a route goes after 10 business days with no traffic"],
    ["DirectAccess", "Can't coexist with Private Access on the same device"],
    ["An OS or browser proxy", "Learn's PAC guidance: exclude every FQDN and IP the client tunnels"],
    ["A third-party SSE", "Follows its coexistence page on Learn, for bypasses both ways"],
    ["A branch remote network", "Microsoft and internet profiles, no Private Access; baseline profile only, no Conditional Access"],
  ], { fontSize: 12, limit: 5.1 });
  callout(s, "Parity", tb + 0.25, 1.15, "FaBuilding", HEX.teal, "TIC parity: ",
    "the guide keeps the client on managed devices at branches, and uses the remote network for devices without one.");
  sources(s, "Sources: Module 6, Unit 1; Guide, Step 11.2, 11.3, Validate, TIC 3.0 alignment; Known limitations for Global Secure Access; Network and Transport, Chapters 05 and 11.");
  notes(s,
`During the move, everything runs side by side. The V P N stays for applications not yet published, in split-include mode where it supports it, so Private Access and the V P N don't contend for the same routes; a V P N route is removed only after the V P N's own logs show no traffic for that application for ten business days. DirectAccess can't coexist with Private Access on the same device. Where a proxy is set at the operating system or browser level, Learn's P A C file guidance excludes every F Q D N and I P the client tunnels. A third-party security service edge kept for internet traffic follows its coexistence page on Learn, for the bypasses in both directions. And branches: a remote network carries the Microsoft and internet profiles, not Private Access, and applies only the baseline profile, with no Conditional Access. That's a parity gap under tick's Branch Office use case, so the guide keeps the client on managed devices at branches, and uses the remote network for devices without one.`,
  `${M} — Unit 1; guide, Step 11.2, 11.3, Step 11 Validate, "TIC 3.0 alignment" (Branch Office Use Case); Microsoft Learn — "Known limitations"; Network and Transport, Chapters 05 and 11.`);
}

// ================================================================== 6 RACI and closure
{
  const s = content(SC, "Unit 2: who does what, and who decides closure");
  tag(s, "Who");
  const tb = table(s, "RACI", 1.45, [3.4, 8.75], ["Role", "What the guide's RACI gives it"], [
    ["Policy owner", "Accountable: decision, architecture, profiles, policies and exclusions, TLS scope, exception register"],
    ["Platform owner", "Responsible: builds them; network security and identity engineers"],
    ["Operator", "Client rings, connectors and DC sensors"],
    ["Security monitor", "Alerts, freshness and metrics"],
    ["Help desk", "Tier-1 user issues"],
    ["Assessor", "Independent; assesses the evidence and recommends a finding ready for closure"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "Decide", tb + 0.25, 1.1, "FaLandmark", HEX.navy, "Closure: ",
    "the authorizing official decides, or the assessor for an assessment finding. Learn's advice is at least two people per role.");
  sources(s, "Sources: Module 6, Unit 2; Guide, RACI; Common operations for Global Secure Access; Global Secure Access operations guide.");
  notes(s,
`Unit 2 is who does what. Microsoft's operations guide gives a RACI with a service owner, network security engineer, identity engineer, S O C analyst, help desk and platform operations. The guide maps those to six roles and adds the assessor, who is independent of the work. The policy owner, the service owner with the I S S O consulted, is accountable for the decision record, the architecture, the traffic profiles, the Conditional Access policies and their exclusions, the T L S inspection scope, and the exception register. The platform owner, the network security and identity engineers, is responsible for building them. Operators run the client rings, the connectors and the domain controller sensors. The security monitor owns alerts, log freshness and the metrics. The help desk takes tier-one user issues. The assessor assesses the evidence and recommends a finding ready for closure, and the authorizing official decides, or the assessor for an assessment finding. Learn's advice is at least two people for every role.`,
  `${M} — Unit 2 "Who does what, and the evidence"; guide, "RACI"; Microsoft Learn — "Common operations for Microsoft Entra Global Secure Access" (RACI), "Microsoft Entra Global Secure Access operations guide."`);
}

// ================================================================== 7 Evidence
{
  const s = content(SC, "Five states, five kinds of evidence");
  tag(s, "What");
  const tb = table(s, "Ev", 1.45, [2.6, 9.55], ["Kind", "What it is, and when"], [
    ["Configuration", "The hashed Graph export, rerun before every change; decision and architecture records; diagnostic setting GET"],
    ["Test", "Each Validate record, expected and observed: health check, source IP, block, ports, disable-and-retry, four cases, issuer, klist"],
    ["Operational", "The queries on the day-two cadence: sign-in share, traffic, blocks, TLS outcomes, freshness, device usage"],
    ["Exception", "The register: every exclusion and bypass, with approver and expiry"],
    ["Reassessment", "The Zero Trust Assessment rerun after each ring, each finding's closure chain entry updated"],
  ], { fontSize: 11.5, limit: 5.0 });
  callout(s, "States", tb + 0.25, 1.2, "FaFileShield", HEX.teal, "Ready for closure ",
    "when every applicable state (Designed, Configured, Enforced, Evidenced, Operated) has evidence. A test skipped for want of a license is a licensing result, not a failed control.");
  sources(s, "Sources: Module 6, Unit 2; Guide, The control states and the closure chain, Evidence catalog; Zero Trust and Assessment, Chapter 10.");
  notes(s,
`What goes in the package? The guide's evidence catalog has five kinds. Configuration: the hashed Graph export, rerun before every change, plus the decision and architecture records and the diagnostic setting GET. Test: each Validate record, expected and observed, from the client health check through the source I P comparison, the blocked category, the port tests, the disable-and-retry test, the four cases, the T L S issuer, and the klist test. Operational: the queries, run on the day-two cadence. Exception: the register, with every exclusion and bypass, its approver and its expiry. And reassessment: the Zero Trust Assessment rerun after each ring, with each network finding's closure chain entry updated. A finding is ready for closure when every applicable control state, designed, configured, enforced, evidenced and operated, has evidence. And a Zero Trust Assessment test skipped because the tenant has no Internet Access or Private Access license is a licensing result, not a failed control.`,
  `${M} — Unit 2; guide, "The control states and the closure chain," "Evidence catalog" (and its checklist); Zero Trust and Assessment, Chapter 10 (closure chain; normalized result taxonomy).`);
}

// ================================================================== 8 Metrics and rollback
{
  const s = content(SC, "Unit 3: metrics, then the rollback order");
  tag(s, "How");
  const tb = table(s, "Met", 1.45, [4.6, 3.3], ["Metric", "Starting target"], [
    ["Client coverage", "98% after ring 3"],
    ["Sign-ins through the service", "95%"],
    ["Compliant network enforcement", "100% after ring 3"],
    ["Quick Access residual; unassigned apps", "0; 0"],
    ["TLS failure share; certificate life", "Under 1%; over 90 days"],
    ["Tables with no rows in 24 hours", "0"],
  ], { fontSize: 11.5, limit: 6.5 });
  panel(s, "Order", 8.75, 1.45, 4.0, tb - 1.45, HEX.red, HEX.redTint, "ROLLBACK, NEWEST FIRST", null, [
    "1 Policies (10, 7, 6, 5) to report-only",
    "2 Security profile links removed",
    "3 Tenant restrictions tagging off",
    "4 Groups out of the profiles",
    "5 The VPN route restored",
    "6 Signaling off, last",
  ], 12);
  callout(s, "Rec", tb + 0.25, 0.95, "FaClipboardCheck", HEX.teal, "Every rollback is a change with a record, ",
    "followed by the Step 2.1 export, so the evidence shows the state after it.");
  sources(s, "Sources: Module 6, Unit 3; Guide, Metrics, Dangers, Rollback.");
  notes(s,
`Unit 3. The metrics measure protected coverage, not whether a setting exists. Client coverage, ninety-eight percent after ring three. Sign-ins through the service, ninety-five percent. Compliant network enforcement, a hundred percent after ring three. The Quick Access residual, and apps without an assignment or policy, both zero. The T L S failure share under one percent, with more than ninety days of certificate life. And no table silent for twenty-four hours. Then the rollback. In an incident that touches several steps, reverse newest first: Conditional Access policies from Steps 10, 7, 6 and 5 to report-only; the security profile links removed; universal tenant restrictions tagging turned off; the affected groups removed from the traffic profiles; the V P N route restored; and signaling turned off last, only after no policy depends on it. Every rollback is a change with a record, followed by the Step 2.1 export, so the evidence shows the state after it.`,
  `${M} — Unit 3 "Metrics, dangers and rollback"; guide, "Metrics" (targets), "Rollback" (order), "Dangers."`);
}
endModule(SC);

// ================================================================== 9 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 4: measure, export, report-only");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1, in the workspace's Logs: Step 4's sign-in share, Step 9's TLS outcomes, Step 12's freshness query",
    "# Step 2: the evidence export, the guide's Step 2.1, into gsa-config-<date>-ring1, with manifest.csv",
    "# Step 3: list the NET- policies and the three forwarding profiles, with their ids",
    "$pol.value | Where-Object { $_.displayName -like \"NET-*\" } | Select-Object id, displayName, state",
    "# Step 4: Conditional Access to report-only, Steps 10, 7, 6 and 5 in that order",
    "$ro = '{\"state\":\"enabledForReportingButNotEnforced\"}'",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../v1.0/identity/conditionalAccess/policies/<admin-policy-id>\" -Body $ro ...",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../policies/<cn-policy-id>\" -Body $ro ...    # then <pa-policy-id>, <ia-policy-id>",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  FULL COMMANDS ON THE MODULE PAGE", pt: 10.5 });
  callout(s, "Exit", c + 0.3, 1.15, "FaClipboardCheck", HEX.teal, "The ring exit record: ",
    "each of ring 1's criteria with its measured value, from the queries, Module 2's device usage summary and Modules 3 and 4's report-only results.");
  sources(s, "Sources: Module 6, \"Exercise: Lab 2,\" steps 1 to 4; Guide, Step 11.1, Step 2.1, Rollback.");
  notes(s,
`The lab runs in a test tenant, never production, and the authors haven't run it. It removes what Modules 1 to 5 built. Step one measures ring one's exit criteria: in the workspace, run Step 4's sign-in share, Step 9's T L S outcomes and Step 12's freshness query, and write the ring exit record, each criterion with its measured value, from these queries, Module 2's device usage summary, and the report-only results of Modules 3 and 4. A table with no rows in twenty-four hours fails the freshness metric. Step two takes the evidence export, the guide's Step 2.1, into a dated ring-one folder with its hash manifest. Step three lists the I D's the rollback needs: the four test policies and the three forwarding profiles. And step four starts the rollback in the guide's order: each Conditional Access policy to report-only, Steps 10, 7, 6, then 5.`,
  `${M} — "Exercise: Lab 2, a test tenant," steps 1 to 4; guide, Step 11.1 (ring 1 exit criteria), Step 2.1, "Rollback."`);
}

// ================================================================== 10 Lab part 2
{
  const s = content(SL, "Lab 2, steps 5 to 12: the rest, in order, then clean up");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 5: the TLS policy in Learn's order (unlink, delete, certificate); the filtering policy's CA to disabled",
    "# Step 6: tagging off (the TRv2 policy stays)",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../beta/networkAccess/settings/crossTenantAccess\" -Body '{\"networkPacketTaggingStatus\":\"disabled\"}' ...",
    "# Step 7: groups out of each profile's assignments, then each profile {\"state\":\"disabled\"}",
    "# Step 8: signaling off, last",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../beta/networkAccess/settings/conditionalAccess\" -Body '{\"signalingStatus\":\"disabled\"}' ...",
    "# Step 9: the export again, into gsa-config-<date>-rolled-back",
    "# Steps 10 to 12: delete the test policies, apps, profile and policy; remove the QUIC rule;",
    "#                 delete the gsa-network-telemetry diagnostic setting (in Bash)",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  FULL COMMANDS ON THE MODULE PAGE", pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.15, "FaClipboardCheck", HEX.teal, "Expect, in the rolled-back export: ",
    "three profiles disabled, signaling and tagging disabled, no NET- policy enabled. Keep the lab folder: it is the path's evidence package.");
  sources(s, "Sources: Module 6, \"Exercise: Lab 2,\" steps 5 to 12; Guide, Rollback, Step 5, 8, 9 and 12 rollbacks.");
  notes(s,
`Step five removes the security profile's links. The T L S inspection policy comes out in Learn's order: unlink it from the pilot profile, delete the policy, then remove the certificate. The filtering policy's Conditional Access policy goes to disabled, the Step 5 rollback. Step six turns off tenant restrictions tagging; the tenant restrictions policy itself stays. Step seven takes the groups out of each profile's assignments in the admin center, then disables the three profiles. In production, the next line of the rollback is restoring the V P N route. Step eight turns off signaling, last, now that no policy enforces on it. Step nine takes the export again, so the evidence shows the state after the rollback: three profiles disabled, signaling and tagging disabled, and no test policy enabled. Steps ten to twelve clean up: delete the test policies, apps, profile and filtering policy; remove the QUIC rule; and delete the telemetry setting. In production, that last one ends the evidence trail and happens only by change. Keep the lab folder; it's the path's evidence package.`,
  `${M} — "Exercise: Lab 2," steps 5 to 12; guide, "Rollback," Step 5 (Rollback), Step 8 (Rollback), Step 9 (Rollback, Learn's order), Step 12 (Rollback).`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 6");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.7, 3.2, 4.25], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["CM-3, CM-4, CP-2: each wave moved with exit criteria, rollback and validation", "KSI-CMT-LMC, KSI-CMT-VTD", "Ring exit records with the criteria and their measured values"],
    ["AU-2, AU-6, AU-12, SI-4: network logs exported, fresh, reviewed and shared as agreed", "KSI-MLA-OSM, KSI-MLA-LET, KSI-MLA-RVL", "Diagnostic setting GET, freshness result, the CISA telemetry agreement"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.15, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. Step 12's logging is mandated in part, by OMB M-26-14 and TIC 3.0's telemetry requirement; the specific measures are the program's.");
  sources(s, "Sources: Module 6, \"The federal requirement\"; Guide, Federal requirements and KSIs, by step, Step 12; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; OMB M-26-14.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five. The rings support C M three, C M four and C P two: each wave moved with exit criteria, rollback and validation. The evidence is the ring exit records, with the criteria and their measured values. The telemetry supports A U two, A U six, A U twelve and S I four: network logs exported, fresh, reviewed, and shared as agreed. The evidence is the diagnostic setting GET, the freshness result, and the CISA telemetry agreement. Step 12's logging is mandated in part, by O M B memo M twenty-six fourteen and tick three point oh's telemetry requirement; the specific measures are the program's. Each row lines up with fed-ramp twenty X indicators. The evidence supports the controls; the assessor decides.`,
  `${M} — "The federal requirement" table; guide, "Federal requirements and KSIs, by step" (Steps 11 and 12), Step 12 (Authority).`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on Module 6", [
    { q: "When is the VPN route for a migrated application removed?", options: ["a. As soon as the application is published in Private Access", "b. After the wave holds, with the VPN's logs showing no traffic for it for 10 business days", "c. At the end of ring 1"] },
    { q: "In the guide's rollback, what comes last?", options: ["a. Conditional Access policies to report-only", "b. Removing the groups from the traffic profiles", "c. Disabling signaling, only after no policy depends on it"] },
  ], "1 b: after the wave holds and the VPN logs are quiet. 2 c: signaling off, last.");
  sources(s, "Sources: Module 6, \"Knowledge check,\" questions 1 and 3; Units 1 and 3; Guide, Step 11 Validate, Rollback.");
  notes(s,
`Check yourself with two questions. First: when is the V P N route for a migrated application removed? The answer is b: only after the wave holds, with the V P N's own logs showing no traffic for that application for ten business days. Second: in the guide's rollback, what comes last? The answer is c: disabling signaling, only after no policy depends on it; turning it off earlier can block users. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 3, and "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary: moved in rings, rolled back in order");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Measured a ring's exit criteria",
    "Took the evidence export before the change",
    "Rolled the test tenant back in the guide's order",
    "Took the export again, and cleaned up",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "THE PATH IS DONE", null, [
    "Next: the guide's checklist, and the Zero Trust Assessment rerun after each ring",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the ring exit record, the ring 1 and rolled-back exports with their manifests, the rollback change record, the exception register, and the CISA telemetry agreement.");
  sources(s, "Sources: Module 6, \"Summary\"; learning path index; Guide, Implementation checklist.");
  notes(s,
`To sum up. You measured a ring's exit criteria, took the evidence export before the change, rolled the test tenant back in the guide's order, took the export again to show the state after the rollback, and removed the lab's test objects. The evidence an I S S O keeps from this module: the ring exit record with each criterion's measured value, the ring one and rolled-back exports with their manifests, the rollback change record, and the exception register. In production, add the CISA telemetry agreement and the Zero Trust Assessment rerun after each ring, with each network finding's closure chain entry updated. That completes the path. From here, work through the guide's implementation checklist, one ring at a time.`,
  `${M} — "Summary"; guide, "Implementation checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 6 deck", [
  "Module page: docs/training/global-secure-access/06-rings-rollback-and-the-evidence-package.md (Global Secure Access as the Identity-Aware Network, Module 6); the path's verification log is docs/training/global-secure-access/_verification/learning-path.md.",
  "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide: Steps 11 and 12, TIC 3.0 alignment, The control states and the closure chain, RACI, Evidence catalog, Metrics, Dangers, Rollback, Implementation checklist; its footnotes carry each source, read November 11, 2026.",
  "Microsoft Learn: Common operations for Global Secure Access; Microsoft Entra Global Secure Access operations guide; Known limitations for Global Secure Access; Microsoft Global Secure Access deployment guide for Microsoft Traffic.",
  "Zero Trust and Assessment, Chapter 10; Network and Transport, Chapters 05 and 11. NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; OMB M-26-14; TIC 3.0 Remote User Use Case v2.2; TIC 3.0 Branch Office Use Case v3.0.",
  "Lab 2's commands are the module page's, abbreviated on the slides, with the guide's placeholders; the path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
