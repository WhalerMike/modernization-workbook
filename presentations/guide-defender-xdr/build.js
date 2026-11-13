// Companion guide — Defender XDR Engineering & Operations: An Implementation Guide.
// A narrated Why / What / Who / How deck of about 15 minutes (16 narrated slides, then a backup section).
// The guide is a draft awaiting the editor's review: the title slide and its narration say so.
//   Why:   a license is not a defended endpoint; the reference architecture, its boundaries and control planes.
//   What:  government-cloud availability by feature; the ten gates on one page.
//   Who:   unified RBAC roles through PIM, and the RACI.
//   How:   Gate 1 roles and the Graph read path; Gate 2 onboarding and sensor health; Gate 3 prevention through audit;
//          Gate 4 Attack Surface Reduction audit, warn, block; Gate 5 exposure management without Exposure Management;
//          Gate 6 incidents; Gate 7 detections as code; Gates 8 and 9 identity signals and automation boundaries;
//          Gate 10 operations, metrics and evidence; dangers, what couldn't be verified and where to go next.
// Sources: docs/books/guides/defender-xdr-implementation.md and the sources it footnotes (Microsoft Learn's Defender
// for Endpoint, Defender XDR, Defender for Identity, Defender for Cloud Apps, Security Exposure Management and Microsoft
// Graph security API pages; read November 11, 2026; listed in docs/books/guides/_verification/defender-xdr-implementation.md),
// and the book chapters the guide links (Book 05, Chapters 08 to 10; Book 12, Chapters 03, 05, 06, 11 and 12;
// Book 11, Chapter 10). The commands on the slides are the guide's, with its placeholders; long ones are continued
// PowerShell-style with a backtick or shortened by dropping an Out-File tail. No new facts.
// The speaker notes are the narration (spoken by narrate.py), written to be heard: acronyms the voice misreads are spelled
// out, and every source is named by its original or a book by its title, never by a workbook book number.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/guide-defender-xdr/build.js \
//                      presentations/guide-defender-xdr/Guide_Defender_XDR.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Defender XDR Engineering & Operations: An Implementation Guide",
  footer: "Federal Modernization Workbook  ·  Companion guide: Defender XDR engineering and operations (draft)",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Guide_Defender_XDR.pptx";
const G = "Companion guide, Defender XDR";

// ------------------------------------------------------------------ code panel (as in the Zero Trust Assessment guide's deck)
// A light panel with monospaced text (Consolas). Lines starting with "#" or "//" are comments, in teal.
const CODE_FILL = "F1F5F9";
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 11;
  const lh = pt / 72 * 1.2;
  const top = y + 0.1 + (o.label ? 0.27 : 0);
  const h = (top - y) + lines.length * lh + 0.14;
  box(s, name, x, y, w, h, CODE_FILL, HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
  const widest = Math.max(...lines.map((l) => l.length));
  const need = widest * 0.55 * pt / 72 + 0.4;
  if (need > w + 0.01) console.warn(`  ! ${name} code may overflow its width: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
  const runs = lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1,
    color: /^\s*(#|\/\/)/.test(l) ? HEX.teal : HEX.ink } }));
  txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
  const bottom = y + h;
  if (bottom > (o.limit || 6.6) + 0.01) console.warn(`  ! ${name} code may overflow: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars (${need.toFixed(2)} of ${w.toFixed(2)} in)`);
  return bottom;
};

// A one-line plain statement under a table or panel (navy, bold), with a fit check.
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  if (process.env.FIT) console.log(`  line ${name}: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};
const fit = (what, bottom) => { if (process.env.FIT) console.log(`  ${what} bottom ${bottom.toFixed(2)}`); if (bottom > 6.61) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const SWHY = "Why", SWHAT = "What", SWHO = "Who", SHOW = "How";
const FULL = 12.15;
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = titleSlide(SWHY, "Defender XDR: from a license to a defended endpoint", "An implementation guide: ten gates from service access to the evidence an assessor reads");
  // The guide is a draft: say so before anything else on the slide.
  box(s, "Draft notice", 0.8, 0.55, 7.9, 0.75, "FFFFFF", HEX.red);
  txt(s, "Draft notice text", [
    { text: "DRAFT GUIDE, AWAITING THE EDITOR'S REVIEW.  ", options: { bold: true, color: HEX.red } },
    { text: "Recheck it after the review; nothing in it was run in a tenant." },
  ], { x: 1.0, y: 0.6, w: 7.55, h: 0.65, fontSize: 14, valign: "middle", color: HEX.ink });
  txt(s, "Session map", [
    { text: "Why: a license is not a defended endpoint   ·   What: the clouds, feature by feature, and the ten gates", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Who: unified RBAC roles through PIM; the RACI", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "How: access, onboarding, prevention, ASR, exposure, incidents, hunting, signals, automation, evidence", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: Defender X D R Engineering and Operations, an implementation guide. One thing first: the guide is a draft, awaiting the editor's review, so recheck it after the review. Its idea fits in a sentence. A Defender license is not a defended endpoint: the sensor has to be on every device and healthy, the prevention settings have to be enforced and not just configured, and every alert has to end in a decision someone can show. The guide covers Windows clients and Windows Server only, for a civilian agency at fed-ramp Moderate in Microsoft three sixty-five G C C. Its facts were read on Microsoft Learn on November eleventh, 2026, and nothing in it was run in a tenant. We'll go in four parts: why, what, who, and how.`,
  `${G} — status: draft; opening statement, "In this guide," "How to read this guide."`);
}

// ================================================================== 2 Why: a license is not a defended endpoint
{
  const s = content(SWHY, "Why this matters: a license is not a defended endpoint");
  tag(s, "Why");
  const p1 = panel(s, "Goal", 0.6, 1.45, FULL, null, HEX.navy, HEX.navyTint, "THE GOAL (RISK-BASED RECOMMENDED: THE PROGRAM'S POSITION)", null, [
    "Every Windows device onboarded and reporting; prevention enforced at the strength the design chose",
    "Every Attack Surface Reduction rule in block, or in a recorded exception",
    "Every alert in one incident queue with an owner; the evidence for all of it on request",
  ], 13);
  const tb = table(s, "States", p1 + 0.2, [2.2, 4.6, 5.35], ["Control state", "Where in the guide", "Evidence"], [
    ["Designed", "The decision record, Gate 1", "The signed decision record per feature"],
    ["Configured", "Gates 2 to 4 and 9, audit and pilot", "Intune and Defender portal policy exports"],
    ["Enforced", "Gates 3 and 4 enforcement rings; Gate 9", "Block mode, ring assignment, exclusion register"],
    ["Evidenced", "Every Validate step; the synthetic events", "The test record, its event and the query that found it"],
    ["Operated", "Gate 10", "Owner, cadence, metrics run, drift and health alerts"],
  ], { fontSize: 11.5, limit: 6.0 });
  line(s, "Closure", "Ready for closure when every applicable state has evidence. The authorizing official or assessor decides.", tb + 0.12, 0.4, 13.5);
  sources(s, "Sources: Guide, \"The track at a glance\" (goal, done when, control states); Book 00, App. D (control states); Book 11, Ch 10 (the closure chain).");
  notes(s,
`Here's the goal the guide sets, as the program's own risk-based position. Every Windows device the agency owns is onboarded and reporting. Its prevention settings are enforced at the strength the design chose. Every Attack Surface Reduction rule is in block, or in a recorded exception. Every alert lands in one incident queue with an owner. And the evidence for all of it can be produced on request. The guide walks each feature through five control states. Designed is the decision record. Configured is the audit and pilot phase, shown by policy exports. Enforced is block mode on the rings, with the exclusion register. Evidenced is a test record and the event it produced. Operated is an owner, a cadence and drift alerts. A finding is ready for closure when every applicable state has evidence; the authorizing official or the assessor decides.`,
  `${G} — "The track at a glance" (goal, done when, control states); Book 00, Appendix D; Book 11, Chapter 10 — "The closure chain."`);
}

// ================================================================== 3 Why: architecture
{
  const s = content(SWHY, "Two boundaries, one control plane per setting");
  tag(s, "Why");
  const p1 = panel(s, "Bound", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "TRUST BOUNDARIES", null, [
    "The agency's: devices, the SOC's Sentinel workspace, automation, the evidence store",
    "Microsoft's: Defender XDR and its control planes, built in Azure US Government for a US Government tenant",
    "GCC, GCC High and DoD each have their own portal; every crossing is authenticated by Entra ID",
  ], 12.5);
  const p2 = panel(s, "Planes", 0.6 + W2 + G2, 1.45, W2, null, HEX.teal, HEX.tealTint, "CONTROL PLANES", null, [
    "Intune endpoint security policies, assigned to Entra device groups (device objects only)",
    "The Defender portal: automation levels, device groups, attack disruption exclusions, custom detections",
    "Windows Server through Defender for Servers and security settings management",
  ], 12.5);
  const p3 = panel(s, "Flow", 0.6, Math.max(p1, p2) + 0.2, FULL, null, HEX.amber, HEX.amberTint, "DATA FLOWS", null, [
    "Sensor and antivirus telemetry to the tenant's Defender instance; Endpoint, Identity, Office 365 and Cloud Apps alerts become incidents",
    "Advanced hunting holds 30 days; the SOC reads through the Graph security API; the XDR connector carries incidents to Sentinel",
    "Servers in AWS, Google Cloud or Oracle Cloud Infrastructure reach Defender the same way Azure Arc reaches them",
  ], 12.5);
  callout(s, "One", p3 + 0.2, 0.85, "FaTriangleExclamation", HEX.red, "One control plane per setting: ",
    "for Attack Surface Reduction, Group Policy wins over Intune by default unless MDMWinsOverGP is set. Don't set a rule in both.");
  sources(s, "Sources: Guide, \"Reference architecture\"; Microsoft Defender for US Government; Configure ASR rules and exclusions; Monitor ASR rule activity; Book 05, Ch 09 and 10.");
  notes(s,
`The architecture has two trust boundaries. The agency's holds the devices, the S O C's Sentinel workspace, automation and the evidence store. Microsoft's holds Defender X D R and its control planes. Microsoft Learn says that for a U S Government tenant it's built in the Azure U S Government environment, and G C C, G C C High and D O D each have their own portal. Intune is the recommended tool for Defender settings, through endpoint security policies, and they're assigned to Entra device groups, because Defender management supports device objects only. Automation levels, device groups and custom detections live in the Defender portal. Telemetry flows to the tenant's instance, alerts become incidents, and advanced hunting keeps thirty days. Servers in A W S, Google Cloud or Oracle Cloud Infrastructure arrive the way Azure Arc reaches them. And use one control plane per setting: Group Policy wins over Intune by default.`,
  `${G} — "Reference architecture" (trust boundaries, control planes, data flows); Microsoft Learn — "Microsoft Defender for US Government," "Configure attack surface reduction (ASR) rules and exclusions," "Monitor attack surface reduction (ASR) rule activity"; Book 05, Chapters 09 and 10.`);
}
endModule(SWHY);

// ================================================================== 4 What: government clouds
{
  const s = content(SWHAT, "Government clouds: what's there and what Learn doesn't say");
  tag(s, "What");
  const NA = (t) => ({ text: t, options: { color: HEX.red, bold: true } });
  const tb = table(s, "Gov", 1.4, [4.2, 3.25, 2.35, 2.35], ["Feature (Learn, November 11, 2026)", "GCC", "GCC High", "DoD"], [
    ["Defender for Endpoint; security settings management", "Available", "Available", "Available"],
    ["Defender portal", "security.microsoft.com", "security.microsoft.us", "security.apps.mil"],
    ["Graph security API: incidents, hunting", "Available (worldwide Graph host)", "US Government L4", "US Government L5"],
    ["Defender Vulnerability Management", "Available, minus two features", "Same", "Same"],
    ["Security Exposure Management", NA("Not available: Public Cloud only"), NA("Not available"), NA("Not available")],
    ["Defender for Identity; Defender for Cloud Apps", "Available; App Governance alerts on the roadmap", "Same", "Same"],
    ["Graph custom detection rules", "Not yet specified", "Not yet specified", "Not yet specified"],
    ["Automatic attack disruption", "Not yet specified", "Not yet specified", "Not yet specified"],
    ["Web content filtering on Windows", "Not yet specified", "Not yet specified", "Not yet specified"],
  ], { fontSize: 10.5, limit: 5.75 });
  line(s, "NYS", "\"Not yet specified\" means Learn doesn't say; it doesn't mean available. A feature the tenant isn't licensed for is a licensing decision, not a failed control.",
    tb + 0.1, 0.6, 13);
  sources(s, "Sources: Guide, \"Government-cloud availability by feature,\" \"Prerequisites\"; Microsoft Defender for US Government; Defender for Endpoint for US Government customers.");
  notes(s,
`What does the government cloud give you? Microsoft Learn says Defender for Endpoint, prevention through remediation, is available in G C C, G C C High and D O D, and so is security settings management for servers. Each cloud has its own portal. G C C reads incidents and runs hunting through the worldwide Graph host. Vulnerability Management is there, minus two features. Defender for Identity and Defender for Cloud Apps are available, with App Governance alerts listed as roadmap items. Then the gaps. Microsoft Security Exposure Management, which holds attack paths and the exposure graph, is Public Cloud only. Learn doesn't say whether Graph custom detection rules, automatic attack disruption, or web content filtering on Windows reach these clouds. The guide's rule: not yet specified means Learn doesn't say, not that it's available. And an unlicensed feature is a licensing decision, not a failed control.`,
  `${G} — "Government-cloud availability by feature" (table, the 90-day and three-month notes), "Prerequisites" (Licenses); Microsoft Learn — "Microsoft Defender for US Government," "Microsoft Defender for Endpoint for US Government customers," "What is Microsoft Security Exposure Management?," "Microsoft Defender for Identity for US Government offerings," "Microsoft Defender for Cloud Apps for US Government offerings," "List incidents," "security: runHuntingQuery."`);
}

// ================================================================== 5 What: the ten gates
{
  const s = content(SWHAT, "The ten gates on one page");
  tag(s, "What");
  const tb = table(s, "Path", 1.4, [3.0, 5.85, 3.3], ["Gate", "Done when", "Validate with"], [
    ["G1 Architecture and access", "Unified RBAC roles active; the SOC reads incidents through Graph in its own cloud", "Get-MgSecurityIncident -Top 5"],
    ["G2 Endpoint onboarding", "Every in-scope device onboarded with an active sensor, or excepted", "DeviceInfo coverage query"],
    ["G3 Endpoint prevention", "Antivirus, firewall, tamper, network protection and controlled folder access enforced", "Get-MpComputerStatus; audit queries"],
    ["G4 Attack Surface Reduction", "Every rule through audit and warn into block; exclusions recorded", "Get-MpPreference; DeviceEvents"],
    ["G5 Exposure management", "Vulnerabilities flow to owned remediation", "DeviceTvmSoftwareVulnerabilities"],
    ["G6 XDR incidents", "One queue, a severity table, every incident classified", "Incident export with alerts"],
    ["G7 Advanced hunting", "Detections in a repository, deployed through Graph after a test", "runHuntingQuery on the dataset"],
    ["G8 Identity and cloud apps", "Identity and Cloud Apps feed incidents; cross-source query in use", "AlertEvidence correlation"],
    ["G9 Automation", "Automation levels set to the ladder; disruption exclusions recorded", "Device group export"],
    ["G10 Operations and evidence", "Metrics and evidence catalog monthly; an exercise each quarter", "The monthly evidence run"],
  ], { fontSize: 11, limit: 6.05 });
  line(s, "Order", "Gates 1 and 2 first. Gates 3 and 4 need Gate 2; Gates 5 to 9 need Gates 1 and 2; Gate 10 runs once the others have evidence.", tb + 0.1, 0.4, 12.5);
  sources(s, "Sources: Guide, \"The path on one page,\" \"What the books cover, and where each topic lives.\"");
  notes(s,
`Here's the path on one page: ten gates, each with a done-when and a validate step. Gate one, architecture and access: unified roles are active and the S O C reads incidents through Graph in its own cloud. Two, onboarding: every in-scope device has an active sensor, or an exception. Three, prevention: antivirus, firewall, tamper protection, network protection and controlled folder access, enforced. Four, Attack Surface Reduction: every rule through audit and warn into block. Five, exposure: vulnerabilities flow to an owner. Six, incidents: one queue, a severity table, everything classified. Seven, hunting: detections live in a repository and deploy through Graph after a test. Eight, identity and cloud-app signals in the same incidents. Nine, automation set to the response ladder. Ten, metrics and evidence every month. Gates one and two come first; gate ten runs once the others have evidence.`,
  `${G} — "The path on one page" (table and the dependency note); "What the books cover, and where each topic lives."`);
}
endModule(SWHAT);

// ================================================================== 6 Who: roles and RACI
{
  const s = content(SWHO, "Who does what: roles through PIM and the RACI");
  tag(s, "Who");
  const p1 = panel(s, "Roles", 0.6, 1.45, FULL, null, HEX.teal, HEX.tealTint, "UNIFIED RBAC ROLES (RISK-BASED RECOMMENDED), ASSIGNED TO GROUPS PIM GOVERNS", null, [
    "Read (Security data basics) for analysts and the assessor; responder adds Alerts, Response and Basic live response",
    "Detection engineer: Detection tuning (Manage); Advanced live response only for Tier 0 analysts",
    "Endpoint Security Manager in Intune for policies; Security Administrator in Entra ID to activate unified RBAC",
  ], 12.5);
  const tb = table(s, "RACI", p1 + 0.2, [5.35, 3.4, 3.4], ["Activity (from the guide's RACI)", "Responsible", "Accountable"], [
    ["Decision record per feature", "Platform owner", "Policy owner (ISSO / CISO delegate)"],
    ["Onboarding and sensor health", "Operator", "Platform owner"],
    ["Prevention and ASR policies, rings; exclusions", "Platform owner; operator", "Policy owner"],
    ["Incident triage and containment; detections", "Security monitor (SOC)", "Security monitor (SOC)"],
    ["Automation levels, attack disruption exclusions", "Operator; SOC", "Policy owner"],
    ["Warn-mode unblock requests", "Help desk", "—"],
    ["Assessment of the evidence", "Assessor", "Assessor"],
  ], { fontSize: 11, limit: 6.55 });
  fit("RACI", tb);
  sources(s, "Sources: Guide, Step 1, \"Prerequisites\" (roles), \"RACI\"; Create custom roles with Defender unified RBAC; Activate Defender unified RBAC; Book 12, Ch 10.");
  notes(s,
`Now, who. The guide builds custom roles in Defender's unified role-based access control, assigned to groups that privileged identity management governs, so no one holds a standing role. A read role, called Security data basics, for analysts and the assessor's read-only account. A responder role that adds alerts, response and basic live response. A detection engineer role with Detection tuning, manage, which the custom detection A P I accepts. Advanced live response only for Tier zero analysts. Intune's Endpoint Security Manager creates the policies, and Microsoft Learn says activating unified roles needs at least Security Administrator in Entra I D. The RACI follows Security Operations and Telemetry and the devices book. The policy owner, an I S S O or see-so delegate, is accountable for decisions, policies and exclusions. The S O C owns incidents and detections, the help desk owns warn-mode unblock requests, and the assessor owns the assessment.`,
  `${G} — Step 1 (steps 1 and 2), "Prerequisites" (Roles), "RACI"; Microsoft Learn — "Create custom roles with Microsoft Defender unified RBAC," "Activate Microsoft Defender unified role-based access control (URBAC)"; Book 12, Chapter 10; Book 05, Chapter 06.`);
}
endModule(SWHO);

// ================================================================== 7 How: G1 Graph read path
{
  const s = content(SHOW, "Gate 1: activate the roles, then read in the right cloud");
  tag(s, "How");
  const c = code(s, "G1", 0.6, 1.4, FULL, [
    "# <graph-environment>: Global for GCC; USGov for GCC High; USGovDoD for DoD",
    "Install-Module Microsoft.Graph.Authentication, Microsoft.Graph.Security -Scope CurrentUser",
    "Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All",
    "# Validate: up to five incidents (or an empty list in a new tenant), and no permission error",
    "Get-MgSecurityIncident -Top 5 | Select-Object Id, DisplayName, Severity, Status, CreatedDateTime",
  ], { label: "THE GUIDE'S COMMANDS (PLACEHOLDERS IN ANGLE BRACKETS)", pt: 10.5 });
  const p1 = panel(s, "Order", 0.6, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "CREATE, THEN ACTIVATE", null, [
    "Create every role and assignment before turning on each workload in Workload settings",
    "Rollback: deactivate the workload; the earlier model's roles return",
  ], 11.5);
  const p2 = panel(s, "Perm", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.teal, HEX.tealTint, "LEAST PRIVILEGE", null, [
    "SecurityIncident.Read.All lists incidents; ThreatHunting.Read.All runs hunting queries",
    "The user also needs Security Reader, Global Reader, Security Operator or Security Administrator",
  ], 11.5);
  const p3 = panel(s, "Wrong", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.red, HEX.redTint, "THE WRONG CLOUD PASSES", null, [
    "A GCC High tenant read from the worldwide host returns nothing, and an empty list looks like a pass",
    "Check the tenant on every run",
  ], 11.5);
  fit("G1 panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 1, \"Dangers\"; Microsoft Graph, List incidents; security: runHuntingQuery; Graph national cloud deployments; Activate Defender unified RBAC.");
  notes(s,
`Now how, gate by gate. Gate one builds the roles in the Defender portal, then activates unified role-based access control workload by workload. Create every role and assignment first. Rollback is to deactivate the workload, and the earlier roles return. Then connect the S O C's read path in the tenant's own cloud: Global for G C C, U S Gov for G C C High, U S Gov D O D for D O D. Microsoft Learn names Security Incident dot Read dot All as the least-privileged permission to list incidents, and the signed-in user also needs a reader or operator role. Threat Hunting dot Read dot All runs hunting queries. Validate by listing five incidents. A pass is a list, or an empty one in a new tenant, with no permission error. But watch the danger the guide names: read a G C C High tenant from the worldwide host, and the empty list looks like a pass.`,
  `${G} — Step 1 (steps 2 and 3, Rollback, Validate), "Dangers" (A Graph session in the wrong cloud); Microsoft Learn — "List incidents," "security: runHuntingQuery," "National cloud deployments," "Activate Microsoft Defender unified role-based access control (URBAC)."`);
}

// ================================================================== 8 How: G2 onboarding
{
  const s = content(SHOW, "Gate 2: prove the sensor is on and healthy everywhere");
  tag(s, "How");
  const c = code(s, "G2", 0.6, 1.4, FULL, [
    "# On <pilot-device>: the sensor runs, and OnboardingState = 1",
    "sc.exe query sense",
    "Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows Advanced Threat Protection\\Status' -Name OnboardingState",
    "# Across the fleet, through Graph, so the result can be filed",
    "$q = 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId |",
    "  where OSPlatform startswith \"Windows\" | summarize Devices = count() by OnboardingStatus, SensorHealthState'",
    "Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $q } | ConvertTo-Json -Depth 5 |",
    "  Out-File <evidence-folder>/g2-coverage.json",
  ], { label: "THE GUIDE'S COMMANDS (THE QUERY IS ONE STRING, WRAPPED HERE)", pt: 10.5 });
  const p1 = panel(s, "On", 0.6, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "ONBOARD BY PLANE", null, [
    "Clients: Intune's EDR policy, ring 0 then 1, then 2 and 3",
    "Servers: Defender for Servers on Arc; Windows Server 2019 needs KB4586839 first",
  ], 11.5);
  const p2 = panel(s, "Health", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.teal, HEX.tealTint, "SENSOR HEALTH VALUES", null, [
    "Active; Inactive (typically 7 days or more); No sensor data; Impaired communications; Misconfigured",
    "Not Active for 7 days is a ticket",
  ], 11.5);
  const p3 = panel(s, "Ex", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.red, HEX.redTint, "EXCEPTIONS AND ROLLBACK", null, [
    "Unreachable devices: register, with a compensating control",
    "Offboarding package expires in 7 days; never deploy with onboarding",
  ], 11.5);
  fit("G2 panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 2; Troubleshoot Defender for Endpoint onboarding; DeviceInfo; Device inventory field reference; Onboard Windows devices by using Intune.");
  notes(s,
`Gate two proves the sensor is on. Clients onboard through Intune's E D R policy, ring zero, then one, then two and three; servers through Defender for Servers on Azure Arc. Microsoft Learn says Windows Server twenty nineteen needs a specific update before onboarding, so it reaches the right government environment. On a pilot device, query the sense service and read the onboarding state, which should be one. Across the fleet, run the coverage query through Graph and file the result. Learn lists five sensor health values: active; inactive, typically after seven days without contact; no sensor data; impaired communications; and misconfigured. A device that isn't active for seven days becomes a ticket. A device the sensor can't reach goes in the exception register with a compensating control. And rollback is an offboarding package, which expires seven days after download and must never go to a device with the onboarding one.`,
  `${G} — Step 2 (Prerequisites, Pilot, Enforcement, Rollback, Exclusions, Telemetry, Validate, Day-two); Microsoft Learn — "Troubleshoot Microsoft Defender for Endpoint onboarding issues," "DeviceInfo," "Device inventory field reference," "Onboard Windows devices to Microsoft Defender for Endpoint by using Microsoft Intune," "Microsoft Defender for Endpoint for US Government customers."`);
}

// ================================================================== 9 How: G3 prevention
{
  const s = content(SHOW, "Gate 3: prevention goes through audit before it blocks");
  tag(s, "How");
  const c = code(s, "G3", 0.6, 1.4, FULL, [
    "# On <pilot-device>: tamper and real-time protection (True = on); modes (network protection 0 off, 1 block, 2 audit)",
    "Get-MpComputerStatus | Select-Object IsTamperProtected, RealTimeProtectionEnabled",
    "Get-MpPreference | Select-Object EnableNetworkProtection, AllowNetworkProtectionOnWinServer, `",
    "    AllowDatagramProcessingOnWinServer, EnableControlledFolderAccess",
    "Get-NetFirewallProfile -PolicyStore ActiveStore | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction",
  ], { label: "THE GUIDE'S VALIDATE COMMANDS", pt: 10.5 });
  const tb = table(s, "Rings", c + 0.15, [1.0, 2.6, 8.55], ["Ring", "Scope", "Exit criteria (change safety)"], [
    ["0", "Implementing team", "Audit events reviewed; test site blocked; no help-desk call"],
    ["1", "Pilot group", "Two weeks; every audited line-of-business block has an allow entry or a decision"],
    ["2", "Early adopters", "One week; \"Defender block\" help-desk calls under the threshold set before the change"],
    ["3", "Everyone in scope", "Post-change validation passes on a sample per site"],
  ], { fontSize: 11, limit: 5.6 });
  line(s, "Audit", "Network protection and controlled folder access have audit modes (value 2). Antivirus, firewall and tamper protection don't: they go straight to ring 1 with backout triggers.",
    tb + 0.1, 0.6, 12.5);
  sources(s, "Sources: Guide, Step 3; Configure tamper protection; Configure network protection; Configure controlled folder access; Get-NetFirewallProfile; Book 05, Ch 08.");
  notes(s,
`Gate three is prevention. Antivirus, firewall and tamper protection carry the values from the devices book's policy library; the guide adds network protection, web protection and controlled folder access, and proves each one. Network protection and controlled folder access both have an audit mode, value two, that logs what they would block. Run them in audit on rings zero and one for at least two weeks, read the audit events weekly, and add allowed applications before enforcing. Antivirus, firewall and tamper protection have no audit mode, so they go straight to ring one with backout triggers. Then enforce ring by ring, with exit criteria for each. On a device, Microsoft Learn's commands show tamper and real-time protection, the modes, and the firewall profiles as enforced. Rollback sets the mode back to audit. Learn says tamper protection is turned off only from the console that set it.`,
  `${G} — Step 3 (Prerequisites, Pilot, Report-only or audit phase, Enforcement and the ring table, Rollback, Validate); Microsoft Learn — "Configure tamper protection for Microsoft Defender Antivirus on Windows," "Configure network protection in Microsoft Defender Antivirus," "Configure controlled folder access (CFA)," Get-NetFirewallProfile; Book 05, Chapter 08.`);
}

// ================================================================== 10 How: G4 ASR
{
  const s = content(SHOW, "Gate 4: Attack Surface Reduction: audit, warn, block");
  tag(s, "How");
  const tb = table(s, "ASR", 1.4, [2.0, 2.4, 7.75], ["Ring", "Mode (value)", "Exit criteria"], [
    ["1", "Audit (2), 30 days", "Every audited rule hit has an exclusion, a fix or a decision"],
    ["1, then 2", "Warn (6), 14 days", "Unblock requests counted; no business-critical app left without a per-rule exclusion"],
    ["1, 2, then 3", "Block (1)", "Blocks per rule per week stable; help-desk volume under the threshold"],
  ], { fontSize: 11.5, limit: 3.3 });
  const c = code(s, "G4", 0.6, tb + 0.15, FULL, [
    "// Fleet events by rule, last 30 days (Learn's query)",
    "DeviceEvents | where Timestamp > ago(30d) | where ActionType startswith \"Asr\" | summarize EventCount=count() by ActionType",
  ], { label: "THE GUIDE'S KQL", pt: 10.5 });
  const p1 = panel(s, "Warn", 0.6, c + 0.15, W3, null, HEX.amber, HEX.amberTint, "WARN IS FRICTION, NOT A BYPASS", null, [
    "Unblock needs administrator approval since platform 4.18.26060",
    "Two rules have no warn: the LSASS and Office injection rules",
  ], 11.5);
  const p2 = panel(s, "Ex", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.navy, HEX.navyTint, "EXCLUSIONS OVER STEPPING BACK", null, [
    "Per-rule exclusions, a file path before a folder",
    "Rollback: one stage back; Microsoft prefers an exclusion",
  ], 11.5);
  const p3 = panel(s, "Srv", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.red, HEX.redTint, "SERVERS: TRUST THE DEVICE", null, [
    "Known issue: Server OS shown compliant without enforcement",
    "Check Get-MpPreference and events instead",
  ], 11.5);
  fit("G4 panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 4; ASR rules overview; Configure ASR rules and exclusions; Test your ASR rules deployment; Monitor ASR rule activity; Book 05, Ch 08 (ES-005).");
  notes(s,
`Gate four is Attack Surface Reduction. The devices book's policy names the rules; this guide carries each stage. Microsoft Learn recommends putting all rules in audit at once on ring one, to see which ones everyday business triggers. Audit for thirty days, and decide an exclusion or a fix for every hit. Then warn for fourteen days, which shows users the block with a way to proceed. Warn is friction, not a bypass: since platform four point eighteen point two six oh six oh, unblocking needs administrator approval, and a persistent need belongs in a per-rule exclusion. Two rules don't support warn, the credential-stealing rule for the local security authority and the Office code-injection rule, so they go from audit straight to block. Rollback moves a rule one stage back, but Microsoft says an exclusion is better. On servers, Learn lists a known issue where a rule shows compliant without being enforced, so check the device itself.`,
  `${G} — Step 4 (Prerequisites, Pilot, Report-only or audit phase, Enforcement and the ring table, Rollback, Exclusions, Telemetry, Validate); Microsoft Learn — "Attack surface reduction (ASR) rules overview," "Configure attack surface reduction (ASR) rules and exclusions," "Test your attack surface reduction (ASR) rules deployment," "Monitor attack surface reduction (ASR) rule activity"; Book 05, Chapter 08 (ES-005).`);
}

// ================================================================== 11 How: G5 exposure
{
  const s = content(SHOW, "Gate 5: exposure management without Exposure Management");
  tag(s, "How");
  const p1 = panel(s, "Fact", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "THE FACT THAT SHAPES THE GATE", null, [
    "Security Exposure Management (attack paths, the exposure graph, critical asset management): Public Cloud only",
    "A Zero Trust Assessment test that needs it is not applicable in the tenant's cloud: a disposition, not a failure",
  ], 12.5);
  const p2 = panel(s, "Has", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHAT THE GOVERNMENT CLOUDS DO HAVE", null, [
    "Defender Vulnerability Management core and premium, without report inaccuracy and request CVE support",
    "Secure Score, with some recommendations missing",
  ], 12.5);
  const c = code(s, "G5", 0.6, Math.max(p1, p2) + 0.2, FULL, [
    "// Interim path: exposed and internet-facing Windows devices, with the owner from the decision record",
    "DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId",
    "| where ExposureLevel == \"High\" or IsInternetFacing == true",
    "| project DeviceName, ExposureLevel, IsInternetFacing, AssetValue, MachineGroup",
  ], { label: "THE GUIDE'S KQL", pt: 10.5 });
  line(s, "Own", "The Tier 0 inventory from Access and Privilege is the critical-asset list. A vulnerability without an owner is a finding against CM-8, not just RA-5. The DeviceTvm tables stay in Defender: Sentinel can't query them.",
    c + 0.15, 0.85, 13);
  sources(s, "Sources: Guide, Step 5; What is Microsoft Security Exposure Management?; Defender for Endpoint for US Government customers; DeviceInfo; DeviceTvmSoftwareVulnerabilities.");
  notes(s,
`Gate five covers what Defender adds to the vulnerability program that Security Operations and Telemetry runs, and what it can't do in a government cloud. Microsoft Learn says Security Exposure Management, which holds attack paths, the exposure graph and critical asset management, is available in Public Cloud only, not in U S Government clouds. So a Zero Trust Assessment test that needs it is recorded as not applicable in the tenant's cloud. That's a disposition, not a failure. What the government clouds do have is Vulnerability Management, core and premium, without two features, and Secure Score with some recommendations missing. The interim path for attack paths: prioritize by exposure level and internet-facing devices from the device info table, and use the Tier zero inventory from Access and Privilege as the critical-asset list. A vulnerability without an owner is a finding against the inventory control, C M eight. And Sentinel can't query the vulnerability tables.`,
  `${G} — Step 5 (the government-cloud fact, interim path, ownership, how-section notes, Validate); Microsoft Learn — "What is Microsoft Security Exposure Management?," "Microsoft Defender for Endpoint for US Government customers," "DeviceInfo," "DeviceTvmSoftwareVulnerabilities"; Book 11, Chapter 10 — "A normalized result taxonomy"; Book 12, Chapter 06.`);
}

// ================================================================== 12 How: G6 incidents
{
  const s = content(SHOW, "Gate 6: one incident queue and a severity table");
  tag(s, "How");
  const tb = table(s, "Sev", 1.4, [2.6, 1.9, 4.0, 3.65], ["Incident severity", "Triage within", "Containment rung", "Hand-off"], [
    ["High", "1 hour", "L3 gated: the playbook prepares, a named approver releases", "IR lead and ISSO; US-CERT reporting decision under the IR plan"],
    ["Medium", "24 hours", "L2 advise: enrich and ticket", "Analyst decides"],
    ["Low or informational", "72 hours", "L1 observe", "Tuning review if recurring"],
  ], { fontSize: 11.5, limit: 3.6 });
  const c = code(s, "G6", 0.6, tb + 0.15, FULL, [
    "Get-MgSecurityIncident -Filter \"status eq 'active'\" -All |",
    "  Select-Object Id, DisplayName, Severity, AssignedTo, CreatedDateTime |",
    "  Export-Csv <evidence-folder>/g6-open-incidents.csv -NoTypeInformation",
    "Get-MgSecurityIncident -IncidentId <incident-id> -ExpandProperty alerts | ConvertTo-Json -Depth 10",
  ], { label: "VALIDATE: OPEN INCIDENTS AND THEIR ALERTS, EXPORTED FOR THE RECORD", pt: 10.5 });
  const p1 = panel(s, "Never", 0.6, c + 0.15, W2, null, HEX.red, HEX.redTint, "A HUMAN DECIDES", null, [
    "Servers and privileged or emergency accounts are never contained by a playbook",
  ], 11.5);
  const p2 = panel(s, "Close", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "PASS", null, [
    "Every open incident has an owner; every resolved one, a classification and determination",
  ], 11.5);
  fit("G6 panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Step 6; Microsoft Graph, List incidents; Book 12, Ch 11 (the response ladder); Book 13, App. B (response windows).");
  notes(s,
`Gate six is incidents. Microsoft Learn says Defender X D R correlates alerts that share attack techniques or an attacker into one incident. The response ladder and device isolation belong to Security Operations and Telemetry; this gate fixes severity, triage, evidence and hand-off. The severity table is the program's design. A high incident is triaged within an hour and contained on a gated rung, where the playbook prepares and a named approver releases, with the incident response lead and the I S S O deciding on U S cert reporting. A medium one within twenty-four hours, enriched and ticketed. A low one within seventy-two hours, observed, with a tuning review if it recurs. Servers and privileged or emergency accounts are never contained by a playbook; a human decides. To validate, export the open incidents and one incident with its alerts. Every open incident has an owner, and every closed one carries a classification and determination.`,
  `${G} — Step 6 (Enforcement: the severity table; Rollback; Exclusions; Validate); Microsoft Learn — "List incidents"; Book 12, Chapter 11 — "The response ladder"; Book 13, Appendix B.`);
}

// ================================================================== 13 How: G7 detections as code
{
  const s = content(SHOW, "Gate 7: detections as code, tested before they're enabled");
  tag(s, "How");
  const c = code(s, "G7", 0.6, 1.4, FULL, [
    "# The rule file starts with \"status\": \"disabled\" until its test passes; no automated actions (Gate 9 owns containment)",
    "Connect-MgGraph -Environment <graph-environment> -Scopes ThreatHunting.Read.All,CustomDetection.ReadWrite.All",
    "$rule = Get-Content <rule-file> -Raw | ConvertFrom-Json",
    "Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $rule.queryCondition.queryText; Timespan = 'P30D' }",
    "# Deploy, then enable by changing status in the repository file, reviewed and redeployed",
    "Invoke-MgGraphRequest -Method POST -Uri 'v1.0/security/rules/detectionRules' `",
    "    -Body (Get-Content <rule-file> -Raw) -ContentType 'application/json'",
  ], { label: "THE GUIDE'S COMMANDS (THE TEST OUTPUT GOES TO <evidence-folder>)", pt: 10.5 });
  const p1 = panel(s, "Valid", 0.6, c + 0.2, W3, null, HEX.teal, HEX.tealTint, "VALIDATION DATASETS", null, [
    "A known-bad event it must find; a known-good window it stays quiet in",
    "Advanced hunting holds 30 days, so the window is at most 30",
  ], 11.5);
  const p2 = panel(s, "Gov", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.amber, HEX.amberTint, "GOVERNMENT CLOUDS", null, [
    "The hunting API: US Government L4 and L5",
    "detectionRules: not yet specified; in GCC High and DoD, create the rule in the portal from the same file",
  ], 11.5);
  const p3 = panel(s, "Match", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.navy, HEX.navyTint, "PASS", null, [
    "Every repository rule deployed with the same query and status",
    "None deployed that isn't in the repository",
  ], 11.5);
  fit("G7 panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 7; Microsoft Graph, Create detectionRule; security: runHuntingQuery; Use the Microsoft Graph security API; Book 12, Ch 11 (rule lifecycle).");
  notes(s,
`Gate seven puts detections in a repository and deploys them through the Graph A P I, following the rule lifecycle in Security Operations and Telemetry. Each rule file starts disabled, and leaves out automated actions, because containment stays on the ladder. Every rule has a validation dataset: a known-bad event it must find, and a known-good window it must stay quiet in. A rule that can't be shown to fire isn't finished. Test the query against the last thirty days, which is all advanced hunting keeps, then post the file to the detection rules endpoint. Enabling is a change to the status in the repository, reviewed and redeployed. Microsoft Learn's hunting A P I is available in U S Government L four and L five, but the detection rules A P I has no national cloud table, so in G C C High and D O D, create the rule in the portal from the same file. Pass: the deployed rules match the repository, exactly.`,
  `${G} — Step 7 (Prerequisites, schema governance, validation datasets, steps 1 to 3, Rollback, Validate); Microsoft Learn — "Create detectionRule," "security: runHuntingQuery," "Use the Microsoft Graph security API" (Custom detections); Book 12, Chapter 11 — "Rule lifecycle and testing."`);
}

// ================================================================== 14 How: G8 and G9
{
  const s = content(SHOW, "Gates 8 and 9: correlate the signals, bound the automation");
  tag(s, "How");
  const p1 = panel(s, "G8", 0.6, 1.45, W2, null, HEX.teal, HEX.tealTint, "GATE 8: IDENTITY AND CLOUD-APP SIGNALS", null, [
    "Defender for Identity sensors on domain controllers, AD FS, AD CS and Entra Connect servers",
    "GCC sensors reach *.atp.gcc.azure.com; GCC High and DoD, *.atp.azure.us",
    "Gaps: App Governance alerts on the roadmap; Cloud Apps behaviors in BehaviorInfo not in GCC",
    "Validate: an AlertEvidence query finds users with alerts from more than one source",
  ], 12);
  const p2 = panel(s, "G9", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "GATE 9: AUTOMATION WITH APPROVAL BOUNDARIES", null, [
    "Pilot: ring 1 at Semi - require approval for all folders; two weeks of approvals reviewed",
    "Workstations to Full, Microsoft's recommended level; servers stay at a Semi level",
    "Attack disruption exclusions: emergency access and the SOC's own service accounts",
    "Contain User needs sensor v10.8470 or later",
  ], 12);
  const c = code(s, "G9", 0.6, Math.max(p1, p2) + 0.2, FULL, [
    "# The sensor version on <pilot-device>, for Contain User (Learn's command)",
    "Get-ItemProperty -Path 'Registry::HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows Advanced Threat Protection\\Status' `",
    "    -Name \"MsSenseDllVersion\"",
  ], { pt: 10.5 });
  line(s, "Undo", "Every attack disruption action can be undone by the security team. Its government-cloud availability is not yet specified.", c + 0.12, 0.4, 13);
  sources(s, "Sources: Guide, Steps 8 and 9; Defender for Identity for US Government; Configure automatic attack disruption; Exclude assets from automated responses.");
  notes(s,
`Gates eight and nine. Gate eight puts identity and S A A S behavior into the same incidents as the endpoint. Defender for Identity's sensors go on domain controllers, A D F S, A D C S and Entra Connect servers, starting with one domain controller per domain. Microsoft Learn gives each cloud its own sensor endpoint. Two gaps: App Governance alerts are roadmap items, and Cloud Apps behaviors aren't in G C C. Validate with a correlation query: users with alerts from more than one source. Gate nine sets Defender's automation to match the response ladder. Pilot ring one's device group at the semi level that requires approval for all folders, and review two weeks of approvals. Then workstations go to full, which Learn recommends, and servers stay at a semi level, because the program never isolates a server autonomously. Exclude the emergency access accounts and the S O C's own service accounts from attack disruption. Every disruption action can be undone.`,
  `${G} — Step 8 (Prerequisites, how-section notes, Validate); Step 9 (Prerequisites, Pilot, Report-only, Enforcement, Rollback, Exclusions, Validate); Microsoft Learn — "Microsoft Defender for Identity for US Government offerings," "Microsoft Defender for Cloud Apps for US Government offerings," "Understand the advanced hunting schema," "Configure automatic attack disruption in Microsoft Defender XDR," "Exclude assets from automated responses in automatic attack disruption," "Automatic attack disruption in Microsoft Defender."`);
}

// ================================================================== 15 How: G10 operations, metrics, evidence
{
  const s = content(SHOW, "Gate 10: measure protected coverage, not settings");
  tag(s, "How");
  const tb = table(s, "Metrics", 1.4, [3.2, 5.15, 3.8], ["Metric (targets are the program's)", "Formula", "Why it isn't configuration presence"], [
    ["Protected coverage", "Devices with an Active sensor ÷ in-scope devices in the CM-8 inventory", "A policy says nothing about devices that never checked in"],
    ["Enforcement depth", "Devices with every ASR rule in block (or excepted) ÷ onboarded devices", "Audit mode is configured but protects nothing"],
    ["Mean time to triage and contain", "Incident creation to first assignment, and to containment, by severity", "Detection that waits is a warehouse"],
    ["Detection validity", "Enabled detections with a passing known-bad test this quarter ÷ enabled", "A rule that can't fire isn't a control"],
    ["Synthetic-event success", "Synthetic events that produced their expected alert ÷ events run", "End-to-end proof of telemetry and route"],
  ], { fontSize: 10.5, limit: 4.7 });
  const tc = table(s, "Cadence", tb + 0.15, [4.2, 2.0, 5.95], ["Activity", "Cadence", "Output"], [
    ["Sensor health; prevention and ASR drift", "Weekly", "Coverage file and tickets; policy export diff against the last approved"],
    ["Detection tuning; exception review; exercise", "Quarterly", "Test outputs; expired exceptions removed; exercise record"],
    ["Metrics and evidence package", "Monthly", "The query files and the incident export, hashed into SHA256SUMS.csv"],
  ], { fontSize: 10.5, limit: 6.55 });
  fit("Cadence", tc);
  sources(s, "Sources: Guide, Step 10, \"Synthetic events,\" \"Metrics,\" \"Evidence catalog\"; Book 12, Ch 12 (the metric set; the reporting rhythm).");
  notes(s,
`Gate ten makes it operate. The guide's metrics measure protected coverage and effectiveness, not whether a setting exists. Protected coverage is devices with an active sensor over the in-scope devices in the inventory, because a policy says nothing about devices that never checked in. Enforcement depth counts devices with every Attack Surface Reduction rule in block, because audit mode protects nothing. Mean time to triage and contain, by severity: detection that waits is a warehouse. Detection validity: a rule that can't be shown to fire isn't a control. And synthetic-event success: the detection test, the network protection test site, and each rule's demonstration, run on ring zero, each producing its expected event. The cadence is weekly for sensor health and drift, quarterly for tuning, exceptions and an exercise, and monthly for the evidence run, which runs the read-only queries, exports the incidents and hashes every file for the I S S O.`,
  `${G} — Step 10 (the cadence table, the monthly evidence run, Validate), "Synthetic events," "Metrics," "Evidence catalog"; Book 12, Chapter 12 — "The metric set," "The reporting rhythm."`);
}

// ================================================================== 16 How: dangers, open questions, next
{
  const s = content(SHOW, "Dangers, open questions and where to go next");
  tag(s, "How");
  const tb = table(s, "Dangers", 1.4, [4.6, 7.55], ["Danger", "The guard"], [
    ["A rule assigned to user groups", "Assign to Entra device groups: Defender management supports device objects only"],
    ["Intune and Group Policy both set a rule", "One control plane per setting; MDMWinsOverGP only by decision"],
    ["Server compliance shows enforced when it isn't", "Verify on the server with Get-MpPreference and events"],
    ["Exposure Management assumed in a government cloud", "Record not applicable; Gate 5's interim path"],
    ["Attack disruption contains a server or an emergency account", "Server groups at a semi level; emergency accounts excluded"],
    ["Hunting evidence older than 30 days requested", "The monthly run files the results; Sentinel keeps the streamed tables"],
  ], { fontSize: 11, limit: 4.75 });
  const p1 = panel(s, "Open", 0.6, tb + 0.15, W2, null, HEX.red, HEX.redTint, "WHAT COULDN'T BE VERIFIED", null, [
    "detectionRules, attack disruption and Windows web content filtering in government clouds",
    "The detection test on Windows 10 and 11 (Learn lists servers); nothing run in a tenant",
  ], 11.5);
  const p2 = panel(s, "Next", 0.6 + W2 + G2, tb + 0.15, W2, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "Security Operations and Telemetry: SIEM, vulnerabilities, response, metrics",
    "The Devices book: the endpoint policy library and servers under Azure Arc",
  ], 11.5);
  fit("Close panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, \"Dangers and how to avoid them,\" \"What couldn't be verified,\" \"Back to the books\"; Configure ASR rules and exclusions; Run a detection test.");
  notes(s,
`To close, the dangers. A rule assigned to user groups never applies, because Defender management supports device objects only. Intune and Group Policy both setting a rule means Group Policy silently wins. A server's compliance report can show a rule enforced when it isn't, so check the server. Exposure Management assumed in a government cloud stalls the work, or makes an assessment test read as failed. Attack disruption containing a server or an emergency account means an outage or a lockout. And hunting evidence older than thirty days isn't there, so the monthly run files it. The guide is plain about what it couldn't verify: the detection rules A P I, attack disruption and web content filtering in government clouds, and the detection test on Windows ten and eleven, which Learn's page doesn't list. Nothing was run in a tenant. Next, read Security Operations and Telemetry and the devices book, which own the design. Thank you.`,
  `${G} — "Dangers and how to avoid them," "What couldn't be verified," "Back to the books"; Microsoft Learn — "Configure attack surface reduction (ASR) rules and exclusions," "Run a detection test on a device recently onboarded to Microsoft Defender for Endpoint."`);
}
endModule(SHOW);

// ================================================================== Backup
backup();
sourceSlide("Sources: the guide and Microsoft Learn", [
  "Defender XDR Engineering & Operations: An Implementation Guide (companion guide, draft): \"How to read this guide,\" \"The track at a glance,\" \"Reference architecture,\" \"Government-cloud availability by feature,\" \"Prerequisites,\" \"RACI,\" \"The path on one page,\" Steps 1 to 10, \"Synthetic events,\" \"Metrics,\" \"Evidence catalog,\" \"Requirements and KSIs,\" \"Dangers,\" \"What couldn't be verified.\" Its verification log lists every claim.",
  "Microsoft Learn, government clouds, read November 11, 2026: Microsoft Defender for US Government; Defender for Endpoint for US Government customers; Defender for Identity for US Government; Defender for Cloud Apps for US Government; What is Microsoft Security Exposure Management?; Graph national cloud deployments.",
  "Microsoft Learn, endpoint: Onboard Windows devices by using Intune; Troubleshoot Defender for Endpoint onboarding; Run a detection test; Device inventory field reference; Configure tamper protection; Configure network protection; Configure controlled folder access; ASR rules overview; Configure ASR rules and exclusions; Test your ASR rules deployment; Monitor ASR rule activity.",
  "Microsoft Learn, XDR and Graph: Create custom roles with Defender unified RBAC; Activate Defender unified RBAC; List incidents; security: runHuntingQuery; Create detectionRule; Use the Microsoft Graph security API; DeviceInfo; DeviceTvmSoftwareVulnerabilities; Configure automatic attack disruption; Exclude assets from automated responses.",
]);
sourceSlide("Sources: federal requirements and the books", [
  "Federal requirements: NIST SP 800-53 Rev. 5 (AC-2, AC-6, AU-6, AU-9, AU-11, CA-7, CM-3, CM-6, CM-7, CM-8, IR-3 to IR-6, RA-5, SC-7, SI-2, SI-3, SI-4, SI-7); OMB M-22-09; FedRAMP 20x KSIs, as Book 12 and Book 05 map them (design guidance).",
  "Book 05, Ch 06 (who owns the endpoint), Ch 07 (the GPO sunset program), Ch 08 (endpoint security policies ES-001 to ES-005), Ch 09 (servers under Azure Arc), Ch 10 (operating and evidencing the fleet).",
  "Book 12, Ch 03 (identity telemetry), Ch 05 (from log warehouse to detection), Ch 06 (vulnerability management), Ch 10 (who runs security operations), Ch 11 (detection engineering and response), Ch 12 (evidence, metrics and continuous monitoring). Book 11, Ch 10 (evidence, not verdicts); Book 00, App. D.",
]);

finish(OUT);
