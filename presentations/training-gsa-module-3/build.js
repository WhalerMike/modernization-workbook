// Global Secure Access learning path, Module 3: The compliant network and tenant restrictions — the module's narrated deck.
// Teaches docs/training/global-secure-access/03-compliant-network-and-tenant-restrictions.md, Learn-style: objectives,
// the concepts (the compliant network check, its failure modes and Universal CAE, universal tenant restrictions), Lab 2's
// exact commands in a test tenant (not run by the authors, as the page says; the path has no Lab 1), the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page and the Global
// Secure Access implementation guide it sends the learner to (Steps 7 and 8 and their footnotes); the deck adds none.
// Helpers: ../training-gsa-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-gsa-module-3/build.js \
//                      presentations/training-gsa-module-3/Training_GSA_Module_3.pptx
const P = require("../training-gsa-module-1/shared.js")({
  title: "Module 3: The compliant network and tenant restrictions",
  footer: "Federal Modernization Workbook  ·  Global Secure Access learning path, Module 3: The compliant network and tenant restrictions",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_GSA_Module_3.pptx";
const M = "Training, Global Secure Access, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: Compliant network and tenant restrictions", "Global Secure Access as the Identity-Aware Network · Steps 7 and 8",
    ["The compliant network check  ·  Its failure modes  ·  Universal CAE", "Universal tenant restrictions  ·  The four-case test  ·  Lab 2 in a test tenant"]);
  notes(s,
`Welcome to Module 3 of Global Secure Access as the Identity-Aware Network: the compliant network and tenant restrictions. These are the two signals only Microsoft Entra can produce from the network, and both come with the Microsoft traffic profile you enabled in Module 2. Both can lock people out, so this module teaches their failure modes first, and runs them in report-only or a pilot before they block anyone. It covers Steps 7 and 8 of the Global Secure Access implementation guide, and takes about forty-five minutes, plus a lab in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a stolen token, and a personal tenant");
  tag(s, "Why");
  const l = panel(s, "CN", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "THE COMPLIANT NETWORK CHECK", null, [
    "Binds sign-in and token use to the agency's own path",
    "A token stolen and replayed from elsewhere fails",
    "Interrupts credential access and defense evasion",
  ], 13);
  const r = panel(s, "TR", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "UNIVERSAL TENANT RESTRICTIONS", null, [
    "Agency devices sign in only to approved tenants",
    "No personal or hostile tenant from an agency device",
    "Interrupts exfiltration",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Both can lock people out: ",
    "learn the failure modes first, and run each in report-only or a pilot before it blocks anyone.");
  sources(s, "Sources: Module 3, \"Introduction\"; Guide, Steps 7 and 8, Assessment mapping; Enable compliant network check with Conditional Access; Turn on Universal Tenant Restrictions.");
  notes(s,
`Why do these two matter? The compliant network check binds sign-in and token use to the agency's own path, so a token stolen and replayed from somewhere else fails. In attack terms, it interrupts credential access and defense evasion. Universal tenant restrictions keep agency devices from signing in to a personal or hostile tenant, which interrupts exfiltration. Both are powerful, and both can lock people out. So in this module you learn their failure modes first, and you run each in report-only or a pilot before it blocks anyone.`,
  `${M} — "Introduction"; guide, Step 7 and Step 8 (assessment mapping callouts).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Explain what the compliant network check denies, and when",
    "Create the pilot policy in report-only, with the right exclusions",
    "List the five failure modes and the design response to each",
    "Turn on universal tenant restrictions, and say which data planes it reaches",
    "Run Learn's four-case test and read the block log",
  ], [
    "Module 2: the Microsoft traffic profile and signaling on",
    "Access and Privilege, Appendix C: tenant restrictions v2",
    "Lab 2: a test tenant, never production",
  ], 45);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll explain what the compliant network check denies at authentication, and what it denies in near real time. You'll create the pilot policy in report-only, with the emergency access group and the Intune applications excluded. You'll list the five failure modes and the design response to each, including a service outage. You'll turn on universal tenant restrictions after the tenant restrictions version two policy, and say which data planes it reaches. And you'll run Learn's four-case test and read the block log. You need Module 2, with the Microsoft traffic profile and signaling on, and Access and Privilege, appendix C, for the tenant restrictions policy. The lab runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Compliant network
{
  const s = content(SC, "Unit 1: what the compliant network check denies");
  tag(s, "What");
  const p1 = panel(s, "Pass", 0.6, 1.45, W3, null, HEX.teal, HEX.tealTint, "IT PASSES", null, [
    "Only for users on this tenant's Global Secure Access",
    "From the client, or a remote network",
  ], 12.5);
  const p2 = panel(s, "Auth", 0.6 + W3 + G3, 1.45, W3, null, HEX.red, HEX.redTint, "AT AUTHENTICATION", null, [
    "Denies a replayed refresh token",
  ], 12.5);
  const p3 = panel(s, "CAE", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.navy, HEX.navyTint, "IN NEAR REAL TIME", null, [
    "Rejects a replayed access token, with services that support CAE, such as Microsoft Graph",
  ], 12.5);
  const tb = table(s, "Policy", Math.max(p1, p2, p3) + 0.25, [3.4, 8.75], ["The pilot policy", "What it holds"], [
    ["Block", "All resources, for the pilot, from every location except All Compliant Network locations"],
    ["Exclude", "The emergency access group; Microsoft Intune Enrollment and Microsoft Intune, to avoid a circular dependency"],
    ["State", "Report-only for 10 business days (Learn's example goes straight to On)"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: Module 3, Unit 1; Guide, Step 7.1 to 7.3; Enable compliant network check with Conditional Access.");
  notes(s,
`Unit 1 is the compliant network check. It passes only for users connected through this tenant's Global Secure Access, from the client or a remote network. At authentication, it denies a replayed refresh token. And with services that support Continuous Access Evaluation, such as Microsoft Graph, it rejects a replayed access token in near real time. Turning signaling on creates a named location, All Compliant Network locations. The pilot policy blocks all resources, for the pilot group, from every location except that one. It excludes the emergency access group, and, following Learn, Microsoft Intune Enrollment and Microsoft Intune, to avoid a circular dependency where devices enroll. Learn's example sets the policy straight to on. The guide, like every library policy, starts in report-only, for ten business days.`,
  `${M} — Unit 1 "The compliant network check"; guide, Step 7.1, 7.2, 7.3 and How-section; Microsoft Learn — "Enable compliant network check with Conditional Access."`);
}

// ================================================================== 5 Failure modes
{
  const s = content(SC, "Unit 2: five failure modes, before you enforce");
  tag(s, "What");
  const tb = table(s, "Fail", 1.45, [3.4, 4.2, 4.55], ["Failure", "What happens", "Design response"], [
    ["Client disabled or missing", "Blocked at the next authentication", "Restrict disabling; a help desk reinstall script"],
    ["Service outage", "Resources the check protects are unreachable", "Microsoft's break-glass scripts to report-only, rehearsed"],
    ["Signaling off, policies On", "Users can be blocked", "Policies to report-only first, signaling last"],
    ["Private Access app in scope", "The check isn't supported there", "Step 6's per-app policies instead"],
    ["Mobile devices", "Defender resources need exclusions", "Out of the Windows pilot; record the exclusion"],
  ], { fontSize: 11.5, limit: 5.2 });
  callout(s, "UCAE", tb + 0.25, 1.15, "FaArrowsRotate", HEX.navy, "Universal CAE: ",
    "client 1.8.239.0 or later; tokens revoked in near real time. Learn: don't disable CAE here. The guide decides strict location enforcement per policy.");
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 7.4, Validate; Enable compliant network check with Conditional Access; Known limitations for Global Secure Access; Zero Trust: Protect networks.");
  notes(s,
`Unit 2 is the failure modes, which you learn before you enforce. A disabled or missing client is blocked at the next authentication; existing sessions continue until reauthentication. The response is to restrict disabling and give the help desk a reinstall script. In a Global Secure Access outage, users can't reach the resources the check protects. Microsoft's break-glass scripts switch these policies to report-only, and the guide rehearses them and records them in the contingency plan. Turning signaling off while policies are on blocks users, so the rollback order is policies first, signaling last. The check isn't supported for Private Access apps, which get the per-app policies of Module 4 instead. And mobile devices need Defender exclusions, outside this Windows pilot. One more piece: Universal Continuous Access Evaluation. The Windows client one point eight point two thirty-nine or later uses Universal C A E tokens, revoked in near real time. Learn's recommendation is not to disable C A E for these workloads, and the guide decides strict location enforcement per policy, not tenant-wide.`,
  `${M} — Unit 2 "The failure modes, and Universal CAE"; guide, Step 7.4 (failure modes table), Step 7 Validate (Universal CAE); Microsoft Learn — "Enable compliant network check," "Known limitations," "Configure Microsoft Entra for Zero Trust: Protect networks."`);
}

// ================================================================== 6 UTR
{
  const s = content(SC, "Unit 3: universal tenant restrictions");
  tag(s, "How");
  const p1 = panel(s, "First", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "THE POLICY FIRST", null, [
    "Tenant restrictions v2: default block",
    "Partner policies for the agency's other tenants and each approved partner",
  ], 12.5);
  const p2 = panel(s, "Tag", 0.6 + W3 + G3, 1.45, W3, null, HEX.teal, HEX.tealTint, "THEN TAGGING", null, [
    "Applies the policy to devices with the client, or on a remote network",
    "No proxy needed",
  ], 12.5);
  const p3 = panel(s, "Planes", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.amber, HEX.amberTint, "WHAT IT REACHES", null, [
    "Sign-in and the Microsoft Graph data plane",
    "Not SharePoint or Exchange data planes",
  ], 12.5);
  callout(s, "Wide", Math.max(p1, p2, p3) + 0.3, 1.25, "FaTriangleExclamation", HEX.red, "Tenant-wide, no report-only: ",
    "its pilot is the Microsoft traffic profile's assignment, read daily through the block query. Rollback turns tagging off; the policy stays.");
  sources(s, "Sources: Module 3, Unit 3; Guide, Step 8; Microsoft Learn, Turn on Universal Tenant Restrictions; crossTenantAccessSettings (beta).");
  notes(s,
`Unit 3 is universal tenant restrictions. The tenant restrictions version two policy comes first: default block, with partner policies for the agency's own other tenants and each approved partner, as Access and Privilege, appendix C, sets it. Then tagging applies that policy to devices with the client, or on a remote network, without a proxy, so users can sign in only to tenants and applications the policy allows. Know its reach: it covers the authentication plane and the Microsoft Graph data plane, not the SharePoint or Exchange data planes, which only device-side signaling reaches. The setting is tenant-wide, and the pages the guide read show no report-only mode. So its pilot is the Microsoft traffic profile's assignment, with the block query read daily. The rollback turns tagging off; the policy stays.`,
  `${M} — Unit 3 "Universal tenant restrictions"; guide, Step 8 (8.1, 8.2, How-section); Microsoft Learn — "Turn on Universal Tenant Restrictions," "crossTenantAccessSettings resource type."`);
}

// ================================================================== 7 Four-case test + where agencies are
{
  const s = content(SC, "Learn's four-case test, and where agencies are");
  tag(s, "Who");
  const tb = table(s, "Cases", 1.45, [6.6, 5.55], ["Case, from a pilot device with the client on", "Expected"], [
    ["A member of the agency's tenant", "Signs in normally"],
    ["An account from an allowed partner tenant", "Signs in"],
    ["An account from a tenant that isn't allowed", "Blocked (sign-in error 5000211)"],
    ["A guest in the agency's tenant", "Isn't evaluated"],
  ], { fontSize: 12.5, limit: 4.3 });
  callout(s, "Where", tb + 0.3, 1.25, "FaRoute", HEX.teal, "Where agencies are: ",
    "both features come with P1 or P2 and are available in GCC. Without the Microsoft traffic profile, the interim path is named-location Conditional Access and TRv2 by Group Policy.");
  sources(s, "Sources: Module 3, Unit 3, Where agencies are; Guide, Step 8 Validate, Step 1.3; Microsoft Learn, Turn on Universal Tenant Restrictions; Operate the Microsoft traffic profile.");
  notes(s,
`How do you know tenant restrictions work? Learn's four-case test, run from a pilot device with the client on. A member of the agency's own tenant signs in normally. An account from an allowed partner tenant signs in. An account from a tenant that isn't allowed is blocked, and Learn's block query finds it by error five million two hundred eleven. And a guest in the agency's tenant isn't evaluated. Record each outcome. Now, where are agencies? Both features come with Entra I D P one or P two and the Microsoft traffic profile, are generally available, and are available in G C C by Learn's product-wide statement. Where the Microsoft traffic profile isn't adopted yet, the interim path is named-location Conditional Access and device-side tenant restrictions version two by Group Policy.`,
  `${M} — Unit 3 (Where agencies are); guide, Step 8 Validate (four-case test; error 5000211 query), Step 1.3; Microsoft Learn — "Turn on Universal Tenant Restrictions," "Operate ... Microsoft traffic profile."`);
}

// ================================================================== 8 How-sections side by side
{
  const s = content(SC, "Pilot, enforce, roll back: the two side by side");
  tag(s, "How");
  const tb = table(s, "How", 1.45, [2.6, 4.75, 4.8], ["", "Compliant network (Step 7)", "Tenant restrictions (Step 8)"], [
    ["Audit phase", "Report-only, 10 business days, reading the would-be blocks", "No report-only: the pilot group, block query read daily"],
    ["Enforcement", "State to enabled for the pilot, then ring groups", "Widens with the Microsoft profile's rings"],
    ["Rollback", "Policy back to report-only; in an outage, the break-glass script", "Tagging disabled; the TRv2 policy stays"],
    ["Exclusions", "Emergency access (tested quarterly), Intune apps; service accounts by workload identity policy", "None at the tagging layer; partners as TRv2 policies with owner and review date"],
    ["Telemetry", "The sign-in query; Token/Device Inconsistency alert", "The block query; Increased External Tenant Activity alert"],
    ["Day two", "Policy owner; security monitor watches blocks not through the service", "Identity engineer owns the partner list, reviewed quarterly"],
  ], { fontSize: 11, limit: 6.5 });
  sources(s, "Sources: Module 3, Units 1 to 3; Guide, Step 7 and Step 8 How-sections; Security Operations and Telemetry, Chapter 03 (alerts).");
  notes(s,
`Here are the two How-sections side by side. The audit phase: the compliant network policy runs in report-only for ten business days, reading the would-be blocks; tenant restrictions have no report-only mode, so the pilot group is the audit phase, with the block query read daily. Enforcement: the compliant network policy's state goes to enabled for the pilot, then ring groups are added; tenant restrictions widen with the Microsoft profile's rings. Rollback: the policy goes back to report-only, and in an outage the break-glass script does it; for tenant restrictions, tagging is disabled and the policy stays. Exclusions: the emergency access group, tested each quarter, and the Intune apps, with service accounts handled by workload identity policies instead; tenant restrictions have none at the tagging layer, and partner allowances are policies with an owner and a review date. Telemetry: the sign-in query and the token or device inconsistency alert, and for tenant restrictions the block query and the increased external tenant activity alert. On day two, the security monitor watches compliant network blocks that didn't come through the service, which are either an attack or a broken client, and the identity engineer reviews the partner list each quarter.`,
  `${M} — Units 1 to 3; guide, Step 7 How-section, Step 8 How-section; Security Operations and Telemetry, Chapter 03 (Global Secure Access logs and alerts).`);
}
endModule(SC);

// ================================================================== 8 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 5: the policy, report-only first");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: confirm signaling; read the compliant network named location (its id is <compliant-location-id>)",
    "$loc.value | Where-Object { $_.'@odata.type' -eq '#microsoft.graph.compliantNetworkNamedLocation' } | Select-Object id, displayName",
    "# Step 2: the Intune applications to exclude",
    "Get-MgServicePrincipal -Filter \"displayName eq 'Microsoft Intune Enrollment'\" | Select-Object AppId",
    "# Step 3: NET-CN-Require-Compliant-Network-Pilot, state enabledForReportingButNotEnforced: block, pilot group,",
    "#         emergency access and the Intune apps excluded, every location but <compliant-location-id>",
    "# Step 4, in the workspace's Logs: the would-be blocks, by result and by IsThroughGlobalSecureAccess",
    "# Step 5: briefly On for the pilot, Learn's disable-and-retry test, then back to report-only",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../v1.0/identity/conditionalAccess/policies/<cn-policy-id>\" -Body '{\"state\":\"enabled\"}' ...",
    "Invoke-MgGraphRequest -Method PATCH -Uri \"...<cn-policy-id>\" -Body '{\"state\":\"enabledForReportingButNotEnforced\"}' ...",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  FULL COMMANDS ON THE MODULE PAGE", pt: 10 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expect: ",
    "a reportOnlyFailure through the service is a defect to fix. With the policy On and the client off: \"You can't access this right now.\"");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2,\" steps 1 to 5; Guide, Step 7.1 to 7.3, Validate, How-section.");
  notes(s,
`The lab runs in a test tenant, never production, and the authors haven't run it. You need Module 2's lab done, the emergency access group, a tenant restrictions policy with one allowed partner, and test accounts in three tenants. Step one confirms signaling and reads the compliant network named location. Step two finds the two Intune applications to exclude. Step three creates the pilot policy in report-only, with the guide's exact body. Step four reads the would-be blocks in the workspace. The guide reads them for ten business days; a report-only failure from a sign-in that came through the service is a defect to fix before enforcement. In a test tenant the lab shortens that; in production, never. Step five proves the block. Confirm your emergency access account isn't in the pilot, set the policy on, and on the pilot device disable the client and sign in again in a new browser session. Expect "You can't access this right now." Then put the policy back in report-only.`,
  `${M} — "Exercise: Lab 2, a test tenant," steps 1 to 5; guide, Step 7.1 to 7.3, Validate, How-section (Enforcement, Rollback).`);
}

// ================================================================== 9 Lab part 2
{
  const s = content(SL, "Lab 2, steps 6 to 9: tagging and the four cases");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 6: read back the tenant restrictions v2 policy",
    "Invoke-MgGraphRequest -Method GET -Uri \"https://graph.microsoft.com/beta/policies/crossTenantAccessPolicy/default\" | ...",
    "Invoke-MgGraphRequest -Method GET -Uri \"https://graph.microsoft.com/beta/policies/crossTenantAccessPolicy/partners\" | ...",
    "# Step 7: turn on tagging (tenant-wide; acts on everyone the Microsoft traffic profile carries)",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../beta/networkAccess/settings/crossTenantAccess\" -Body '{\"networkPacketTaggingStatus\":\"enabled\"}' ...",
    "# Step 8: Learn's four-case test, from the pilot device with the client on",
    "# Step 9, in the workspace's Logs: the blocks",
    "SigninLogs | where TimeGenerated > ago(30d)",
    "| where Identity contains \"Tenant Restriction\" and ResultType == 5000211",
    "| summarize Blocked = count() by AppDisplayName, ResourceDisplayName, ResourceTenantId",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expect: ",
    "tagging enabled; the four outcomes as Learn states them; case 3's sign-in in the block query. Keep both in place: Module 6 rolls them back.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2,\" steps 6 to 9; Guide, Step 8.1, 8.2 and Validate.");
  notes(s,
`Step six reads back the tenant restrictions version two policy, default and partners, and writes both to files. Step seven turns on tagging. Remember it's tenant-wide: it acts on everyone the Microsoft traffic profile carries, which in this lab is the pilot group. The GET should show network packet tagging status enabled. Step eight runs Learn's four-case test from the pilot device with the client on: a member, an allowed partner, a tenant that isn't allowed, and a guest. Record each outcome. Step nine reads the blocks in the workspace, with Learn's query on error five million two hundred eleven; case three's sign-in appears there. Keep the compliant network policy in report-only and tagging on. Module 6 rolls them back, in the guide's order.`,
  `${M} — "Exercise: Lab 2," steps 6 to 9; guide, Step 8.1, 8.2, Validate.`);
}
endModule(SL);

// ================================================================== 10 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.7, 3.2, 4.25], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["AC-3, AC-12, SC-23: sign-in and token use bound to the agency's path", "KSI-IAM-ELP, KSI-CNA-ULN, KSI-IAM-APM", "Policy export, named location, report-only results, disable-and-retry test, break-glass rehearsal"],
    ["AC-20, AC-20(1), AC-4: devices sign in only to approved tenants", "KSI-IAM-ELP, KSI-CNA-MAT", "TRv2 exports, tagging GET, the four-case test record"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. The program's mapping also lines Step 7 up with OMB M-22-09's identity and network verification.");
  sources(s, "Sources: Module 3, \"The federal requirement\"; Guide, Federal requirements and KSIs, by step; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; OMB M-22-09.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five. The compliant network check supports A C three, A C twelve and S C twenty-three: sign-in and token use bound to the agency's path. The evidence is the policy export, the named location, the report-only results, the disable-and-retry test, and the break-glass rehearsal record. Universal tenant restrictions support A C twenty, its enhancement one, and A C four: agency devices sign in only to approved tenants. The evidence is the tenant restrictions exports, the tagging GET, and the four-case test record. Each row lines up with fed-ramp twenty X indicators, and the program's mapping lines Step 7 up with O M B memo M twenty-two oh nine's identity and network verification. The evidence supports the controls; the assessor decides.`,
  `${M} — "The federal requirement" table; guide, "Federal requirements and KSIs, by step" (Steps 7 and 8).`);
}

// ================================================================== 11 Check
{
  const s = check(SS, "Check yourself: two questions on Module 3", [
    { q: "In a Global Secure Access outage, what keeps users working?", options: ["a. Nothing; the check fails open", "b. Microsoft's break-glass scripts that switch the policies to report-only, rehearsed and in the contingency plan", "c. Turning signaling off first"] },
    { q: "Which data planes do universal tenant restrictions reach?", options: ["a. Every Microsoft 365 data plane", "b. The authentication plane and the Microsoft Graph data plane, not SharePoint or Exchange", "c. Only the authentication plane"] },
  ], "1 b: the rehearsed break-glass scripts. 2 b: sign-in and Graph, not SharePoint or Exchange.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 3 and 4; Units 2 and 3; Guide, Step 7.4, Step 8.");
  notes(s,
`Check yourself with two questions. First: in a Global Secure Access outage, what keeps users working? The answer is b: Microsoft's break-glass scripts that switch the policies to report-only, rehearsed and recorded in the contingency plan. Turning signaling off first would block users, not save them. Second: which data planes do universal tenant restrictions reach? The answer is b: the authentication plane and the Microsoft Graph data plane, not SharePoint or Exchange. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 3 and 4, and "Check your answers."`);
}

// ================================================================== 12 Summary
{
  const s = content(SS, "Summary: two signals, proved before they block");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Created the compliant network policy in report-only",
    "Read what it would have blocked, then proved the block",
    "Put it back in report-only",
    "Turned on tenant restrictions tagging and tested four cases",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4", [
    "Private applications and administrative paths: one path per application",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the policy export, named location, report-only results, disable-and-retry record, break-glass rehearsal, TRv2 exports, tagging GET, four-case record and block query.");
  sources(s, "Sources: Module 3, \"Summary\"; learning path index; Module 4.");
  notes(s,
`To sum up. You created the compliant network policy in report-only, read what it would have blocked, proved that it blocks a sign-in without the client, and put it back in report-only. Then you turned on universal tenant restrictions and tested all four cases. The evidence an I S S O keeps from this module: the policy export and the named location, the report-only results, the disable-and-retry record, the break-glass rehearsal record, the tenant restrictions exports, the tagging GET, the four-case record, and the block query result. Next is Module 4, private applications and administrative paths, where each application gets its own path instead of the V P N's address pool.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/global-secure-access/03-compliant-network-and-tenant-restrictions.md (Global Secure Access as the Identity-Aware Network, Module 3); the path's verification log is docs/training/global-secure-access/_verification/learning-path.md.",
  "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide: Steps 7 and 8, Step 1.3, Federal requirements and KSIs, by step; its footnotes carry each source, read November 11, 2026.",
  "Microsoft Learn: Enable compliant network check with Conditional Access; Tutorial: Enable the compliant network check; Known limitations for Global Secure Access; Configure Microsoft Entra for Zero Trust: Protect networks; Turn on Universal Tenant Restrictions; crossTenantAccessSettings (beta); Operate the Microsoft traffic profile.",
  "Access and Privilege, Appendix C (tenant restrictions v2). NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; OMB M-22-09.",
  "Lab 2's commands are the module page's, abbreviated on the slides, with the guide's placeholders; the path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
