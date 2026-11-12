// Companion guide — Zero Trust Assessment: An Implementation Guide.
// A narrated Why / What / Who / How deck of about 15 minutes (15 narrated slides, then a backup section).
//   Why:   a score isn't a verdict; what the tool checks and the four things it isn't; run it alongside ScubaGear.
//   What:  the ten steps on one page; government-cloud availability, where Learn is silent and where it differs.
//   Who:   consent once, run as an eligible reader; the RACI.
//   How:   the host and the output folder; connecting in each cloud; the run and its hashes; statuses and the taxonomy;
//          the closure register; reconciling with ScubaGear and Security Hub CSPM; re-run, compare and seal;
//          dangers, what couldn't be verified, and where the training path starts.
// Sources: docs/books/guides/zero-trust-assessment-implementation.md and the sources it footnotes (Microsoft Learn's
// Zero Trust Assessment pages and per-service pages, the tool's 3.1.0 source and guide, AWS, NIST; read November 11, 2026;
// listed in docs/books/guides/_verification/zero-trust-assessment-implementation.md), and Book 11, Chapter 05, which the
// guide links for ScubaGear and BOD 25-01. The commands on the slides are the guide's; long ones are continued
// PowerShell-style with a backtick. No new facts.
// The speaker notes are the narration (spoken by narrate.py), written to be heard: acronyms the voice misreads are spelled
// out, and every source is named by its original or a book by its title, never by a workbook book number.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/guide-zero-trust-assessment/build.js \
//                      presentations/guide-zero-trust-assessment/Guide_Zero_Trust_Assessment.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Zero Trust Assessment: An Implementation Guide",
  footer: "Federal Modernization Workbook  ·  Companion guide: Zero Trust Assessment, an implementation guide",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Guide_Zero_Trust_Assessment.pptx";
const G = "Companion guide, Zero Trust Assessment";

// ------------------------------------------------------------------ code panel (as in the service account guide's deck)
// A light panel with monospaced text (Consolas). Lines starting with "#" are comments, in teal.
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
    color: /^\s*#/.test(l) ? HEX.teal : HEX.ink } }));
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
  const s = titleSlide(SWHY, "The Zero Trust Assessment: evidence, not a verdict", "An implementation guide: ten steps from the first consent to a sealed evidence package");
  txt(s, "Session map", [
    { text: "Why: a score isn't a verdict   ·   What: the ten steps, and the government clouds", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Who: consent once, run as a reader; the RACI", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "How: host, connect, run, read, normalize, register, reconcile, re-run and seal; dangers and the training path", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: Zero Trust Assessment, an implementation guide. Microsoft's Zero Trust Assessment tells you, test by test, how a tenant's configuration compares with Microsoft's Zero Trust guidance. It doesn't tell you what to fix first, what a skipped test means, or when a finding is closed. Those are the program's to decide, and the guide is how. Its facts come from Microsoft Learn's three Zero Trust Assessment pages and the tool's own source and guide at release three point one point oh, read on November eleventh, 2026. The program's own rules are called design guidance. Nothing in the guide was run against a live tenant. We'll go in four parts: why, what, who, and how.`,
  `${G} — opening statement, "In this guide," "How to read this guide."`);
}

// ================================================================== 2 Why: a score isn't a verdict
{
  const s = content(SWHY, "Why this matters: a score isn't a verdict");
  tag(s, "Why");
  const p1 = panel(s, "Tells", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHAT THE REPORT TELLS YOU", null, [
    "Test by test, how the tenant's configuration compares with Microsoft's Zero Trust guidance",
    "It reads configuration on the day it runs",
  ], 13);
  const p2 = panel(s, "Doesnt", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "WHAT IT DOESN'T TELL YOU", null, [
    "What to fix first",
    "What a skipped test means",
    "When a finding is closed",
  ], 13);
  const p3 = panel(s, "Goal", 0.6, Math.max(p1, p2) + 0.2, FULL, null, HEX.teal, HEX.tealTint, "THE GUIDE'S GOAL FOR EVERY RUN", null, [
    "Scoped, authorized and pinned to a tool version; the output stays inside the boundary",
    "Every result recorded twice: the tool's value and the normalized one",
    "Every finding with an owner, a route to the page that remediates it and a weighted place in the backlog",
    "Every run compared with the last and sealed as evidence",
  ], 13);
  callout(s, "Ready", p3 + 0.25, 0.9, "FaScaleBalanced", HEX.navy, "Ready for closure: ",
    "every applicable state has evidence and a reassessment shows a Pass. The authorizing official or assessor decides.");
  sources(s, "Sources: Guide, \"How to read this guide,\" \"The track at a glance\"; Book 11, Ch 10 (evidence, not verdicts).");
  notes(s,
`Here's the idea the guide is built on: a score is not a verdict. The report compares each setting with Microsoft's guidance, and it reads configuration on the day it runs. It can't tell you which finding to fix first, what a skipped test means, or when a finding is closed. Those decisions belong to named people, and the report is the evidence they decide with, as the Zero Trust and Assessment book argues in its chapter, Evidence, Not Verdicts. So every run is scoped, authorized and pinned to a tool version, and its output stays inside the boundary. Every result is recorded twice, the tool's value and a normalized one. Every finding gets an owner, a route to the page that remediates it, and a weighted place in the backlog. Every run is compared with the last and sealed. A finding is ready for closure when every applicable state has evidence and a reassessment shows a pass; the authorizing official or the assessor decides.`,
  `${G} — "How to read this guide," "The track at a glance"; Book 11, Chapter 10 — "Evidence, not verdicts."`);
}

// ================================================================== 3 Why: what it checks, four things it isn't
{
  const s = content(SWHY, "What the tool checks, and four things it isn't");
  tag(s, "Why");
  const p1 = panel(s, "Checks", 0.6, 1.45, FULL, null, HEX.navy, HEX.navyTint, "WHAT IT CHECKS", null, [
    "Hundreds of items from Microsoft's configuration guidance for Entra, Intune, Azure networking and Purview, aligned with the Secure Future Initiative and the Zero Trust pillars",
    "Release 3.1.0: 364 tests across seven pillars: Identity, Devices, Network, Data, Infrastructure, Security Operations and AI",
  ], 13);
  const tb = table(s, "Isnt", p1 + 0.2, [2.7, 9.45], ["It isn't", "What the guide says"], [
    ["A verdict", "It reads configuration on the day it runs. A finding is evidence for a decision a named person makes; a pass rate is not a maturity stage"],
    ["A substitute for ScubaGear", "BOD 25-01 names CISA's SCuBA tools; ScubaGear covers Exchange Online mail flow, Teams, SharePoint sharing and Power Platform, which it doesn't test"],
    ["A supported product", "A community project maintained by Microsoft employees, provided as is, not supported through any Microsoft support program"],
    ["A detector", "Learn's Global Secure Access operations guidance calls it a configuration-posture check, not a real-time detector, to be paired with alerts"],
  ], { fontSize: 12, limit: 5.9 });
  line(s, "Authority", "Optional in federal terms: no directive requires it. The program runs it as Risk-based recommended, for breadth ScubaGear doesn't cover.",
    tb + 0.12, 0.6, 13.5);
  sources(s, "Sources: Guide, Step 1, \"How to read this guide\"; Microsoft Learn, What is the Zero Trust Assessment?; Operate Microsoft Entra Private Access; Zero Trust Assessment README.");
  notes(s,
`What does it check? Microsoft Learn says it tests hundreds of items from Microsoft's configuration guidance for Entra, Intune, Azure networking and Purview. Release three point one point oh holds three hundred sixty-four tests across seven pillars: identity, devices, network, data, infrastructure, security operations, and A I. The guide names four things it isn't. It isn't a verdict: a pass rate isn't a maturity stage. It isn't a substitute for ScubaGear, which comes next. It isn't a supported product: its read me calls it a community project maintained by Microsoft employees, provided as is, outside any Microsoft support program. And it isn't a detector: Learn's Global Secure Access guidance calls it a configuration-posture check, to be paired with alerts. In federal terms it's optional. The program runs it as risk-based recommended, for the breadth ScubaGear doesn't cover.`,
  `${G} — Step 1, "How to read this guide" (Labels); Microsoft Learn — "What is the Zero Trust Assessment?," "Operate Microsoft Entra Private Access"; Zero Trust Assessment repository, README (3.1.0); release 3.1.0.`);
}

// ================================================================== 4 Why: alongside ScubaGear
{
  const s = content(SWHY, "Run it alongside ScubaGear, never instead");
  tag(s, "Why");
  const p1 = panel(s, "Scuba", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "SCUBAGEAR: THE BOD 25-01 TOOL", null, [
    "BOD 25-01 names CISA's SCuBA assessment tools; the Zero Trust Assessment isn't one",
    "Covers Exchange Online, Teams, SharePoint and Power Platform, which the Zero Trust Assessment doesn't test",
    "22 of BOD 25-01's 50 mandatory Microsoft 365 policies sit in those four products",
  ], 13);
  const p2 = panel(s, "ZTA", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "ZERO TRUST ASSESSMENT: BREADTH", null, [
    "Devices, network, data and security operations, which ScubaGear doesn't cover",
    "Overlaps ScubaGear mostly on Entra ID identity and email threat policies",
    "A shared area isn't a duplicate check: only a subset have a true one-to-one counterpart",
  ], 13);
  const p3 = panel(s, "Both", 0.6, Math.max(p1, p2) + 0.2, FULL, null, HEX.teal, HEX.tealTint, "WHEN BOTH FAIL THE SAME SETTING", null, [
    "The ScubaGear finding is the BOD 25-01 deviation and carries the directive's reporting",
    "The Zero Trust Assessment finding is supporting evidence for the same control; nothing in the guide reports to CISA",
  ], 13);
  callout(s, "Drop", p3 + 0.25, 0.9, "FaTriangleExclamation", HEX.red, "Dropping ScubaGear ",
    "because \"the Zero Trust Assessment covers identity\" leaves mandatory policies unassessed and stops the reporting BOD 25-01 requires.");
  sources(s, "Sources: Guide, Step 1, Step 9, \"Federal requirements and KSIs\"; Book 11, Ch 05; CISA BOD 25-01; CISA ScubaGear.");
  notes(s,
`So run it alongside ScubaGear, never instead. CISA's directive B O D twenty-five oh-one names CISA's SCuBA tools, and the Zero Trust Assessment isn't one of them. ScubaGear covers Exchange Online, Teams, SharePoint and Power Platform, which the Zero Trust Assessment doesn't test, and the Zero Trust and Assessment book counts twenty-two of the directive's fifty mandatory Microsoft three sixty-five policies in those four products. The Zero Trust Assessment brings breadth instead: devices, network, data and security operations. The two overlap mostly on Entra I D identity and email threat policies, and a shared area isn't a duplicate check. When both fail the same setting, the ScubaGear finding is the directive's deviation and carries its reporting; the Zero Trust Assessment finding is supporting evidence for the same control. Nothing in this guide reports to CISA.`,
  `${G} — Step 1 ("Not a substitute for ScubaGear"), Step 9 ("ScubaGear"), "Federal requirements and KSIs"; Book 11, Chapter 05 — "Where they overlap, and where they don't," "What this means for an agency."`);
}
endModule(SWHY);

// ================================================================== 5 What: the ten steps
{
  const s = content(SWHAT, "The ten steps on one page");
  tag(s, "What");
  const tb = table(s, "Path", 1.4, [2.75, 5.9, 3.5], ["Step", "Done when", "Validate with"], [
    ["1 Decide and scope", "The decision record is approved: scope, account, cadence, version, output handling", "The signed record"],
    ["2 Prepare the host", "A clean host has PowerShell 7.6 and the pinned module, and a protected report folder", "Get-Module -ListAvailable"],
    ["3 Consent and roles", "Consent granted once; the run account holds read roles only; the grants reviewed", "The grant review's output"],
    ["4 Connect in each cloud", "Every service connects in the tenant's own cloud", "Get-MgContext; connection messages"],
    ["5 Run it", "The report and export exist and are hashed", "The export's SHA-256"],
    ["6 Read the report", "Pillar owners have read their tabs; skips and errors are noted", "The reading notes"],
    ["7 Normalize", "Every result normalized; no unmapped value", "Invoke-ZtaNormalize.ps1"],
    ["8 Register and route", "Every finding has an owner, a family and a page", "Invoke-ZtaRegister.ps1"],
    ["9 Reconcile", "Overlapping findings matched through the setting and the control", "The reconciliation table"],
    ["10 Re-run and keep evidence", "On the calendar, compared with the last, and sealed", "Invoke-ZtaEvidence.ps1 -Check"],
  ], { fontSize: 11.5, limit: 6.0 });
  line(s, "Kit", "Steps 7 to 10 run the results kit, examples/zta-results: it reads files only, never the tenant.", tb + 0.12, 0.4, 13.5);
  sources(s, "Sources: Guide, \"The path on one page,\" \"Prerequisites\"; the guide's results kit (examples/zta-results).");
  notes(s,
`Here's the path on one page, each step with a done-when and a way to validate it. One: decide and scope, until the decision record is approved. Two: a clean host with PowerShell seven point six, the pinned module, and a protected report folder. Three: consent once, give the run account read roles only, and review the grants. Four: connect every service in the tenant's own cloud. Five: run it, and hash the export. Six: pillar owners read their tabs and note skips and errors. Seven: normalize every result. Eight: register every finding with an owner, a family and a page. Nine: reconcile overlapping findings through the setting and the control. Ten: re-run on a schedule, compare, and seal the evidence. Steps seven to ten run the guide's results kit, which reads files only and never touches the tenant.`,
  `${G} — "The path on one page," "Prerequisites" ("For the kit").`);
}

// ================================================================== 6 What: government clouds
{
  const s = content(SWHAT, "Government clouds: where Learn is silent or differs");
  tag(s, "What");
  const tb = table(s, "Gov", 1.4, [2.6, 2.75, 3.35, 3.45], ["Capability", "Commercial and GCC", "GCC High", "DoD"], [
    ["The tool (Connect-ZtAssessment)", "-Environment Global", "-Environment USGov; not yet specified on Learn", "-Environment USGovDoD; not yet specified on Learn"],
    ["Microsoft Graph (Learn)", "graph.microsoft.com; GCC uses worldwide", "graph.microsoft.us", "dod-graph.microsoft.us"],
    ["Exchange Online (Learn)", "O365Default, no parameter", "O365USGovGCCHigh", "O365USGovDoD"],
    [{ text: "Security & Compliance", options: { bold: true } }, "Default endpoint", "ps.compliance.protection.office365.us", { text: "Learn: compliance.dod.microsoft.com; the tool: l5.ps.compliance.protection.office365.us", options: { color: HEX.red, bold: true } }],
    ["Azure (Learn)", "AzureCloud", "AzureUSGovernment", "AzureUSGovernment"],
    ["SharePoint Online admin", "-admin.sharepoint.com", "Tool infers -admin.sharepoint.us; pass it explicitly", "Tool infers -admin.sharepoint.us; DoD's URL not yet specified"],
    ["Azure Information Protection", "Default", "AzureUSGovernment (tool source only)", "AzureUSGovernment (tool source only)"],
  ], { fontSize: 10.5, limit: 5.6 });
  line(s, "Interim", "Interim path: one pillar at a time (-Pillar Identity needs only Graph) in a test tenant of the same cloud; ScubaGear stays the federal baseline tool.",
    tb + 0.12, 0.6, 13.5);
  sources(s, "Sources: Guide, \"Government-cloud availability\"; Microsoft Learn, Microsoft Graph national cloud deployments; Connect to Exchange Online PowerShell; Exchange app-only authentication.");
  notes(s,
`Does it work in a government cloud? Microsoft Learn's three Zero Trust Assessment pages don't say. The tool's three point one point oh source does: its connect command takes an environment, Global, U S Gov or U S Gov D O D, and an Exchange environment name. Each service it signs in to is documented per cloud on Learn, and the guide matches the tool's parameters to those pages. One place they conflict: for Security and Compliance in D O D, Learn gives compliance dot D O D dot microsoft dot com, and the tool's source uses a different address. Which one works wasn't tested. For SharePoint, the tool infers a sharepoint dot U S admin address, so pass it explicitly; D O D's isn't specified. Until a run is proved in your cloud, run one pillar at a time in a test tenant of the same cloud, and keep ScubaGear as the federal baseline tool.`,
  `${G} — "Government-cloud availability" (table and interim path); Microsoft Learn — "Microsoft Graph national cloud deployments," "Connect to Exchange Online PowerShell," "App-only authentication for unattended scripts in Exchange Online PowerShell and Security & Compliance PowerShell," "Quickstart: Connect to Azure Government with PowerShell"; the tool's 3.1.0 source, Connect-ZtAssessment.ps1.`);
}
endModule(SWHAT);

// ================================================================== 7 Who: consent and the RACI
{
  const s = content(SWHO, "Consent once, run as a reader: who does what");
  tag(s, "Who");
  const p1 = panel(s, "Consent", 0.6, 1.45, W2, null, HEX.teal, HEX.tealTint, "CONSENT ONCE, AS A CONSENT ADMINISTRATOR", null, [
    "Tool's guide: Cloud Application Administrator or Application Administrator; Learn says Global Administrator",
    "Graph read permissions: Learn lists 21, the 3.1.0 source requests 34",
    "A dedicated application (-ClientId), not the shared Graph PowerShell app (design guidance)",
  ], 12);
  const p2 = panel(s, "Run", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "RUN AS AN ELIGIBLE READER", null, [
    "A dedicated run account, roles activated through PIM before each run",
    "Global Reader, Security Reader and the other read roles; no Global Administrator",
    "SharePoint Administrator is the one write-capable role the run needs",
  ], 12);
  const tb = table(s, "RACI", Math.max(p1, p2) + 0.2, [5.0, 3.95, 3.2], ["Activity (from the guide's RACI)", "Responsible", "Accountable"], [
    ["Decision record and tool version; run, hash, store", "Assessment operators", "CISO / ISSO"],
    ["Consent and run account", "Identity-plane owner", "CISO / ISSO"],
    ["Normalize and register", "Assessment operators", "Zero Trust program lead"],
    ["Route unrouted findings, set priority", "ZT program lead; pillar owners", "Zero Trust program lead"],
    ["Standing exceptions", "CISO / ISSO", "Authorizing official"],
    ["Closure of a finding", "Pillar owners", "AO (POA&M); assessors (finding)"],
  ], { fontSize: 11, limit: 6.55 });
  fit("RACI", tb);
  sources(s, "Sources: Guide, Step 3, \"RACI\"; Microsoft Learn, Get started with the Zero Trust Assessment; Graph PowerShell authentication cmdlets; Run the Zero Trust Assessment.");
  notes(s,
`Now, who. The first connection asks an administrator to consent to the tool's Microsoft Graph read permissions; later runs don't ask again unless a new version adds one. The sources differ on who. Learn says a Global Administrator. The tool's guide for three point one point oh says a Cloud Application Administrator or Application Administrator, and that consent assigns no runtime role. Learn lists twenty-one permissions; the source requests thirty-four, all read. The program follows the tool's guide. The consent administrator consents and doesn't run the assessment. The run account is a dedicated reader whose roles are activated through pim before each run; SharePoint Administrator is the one write-capable role it needs. Consent lands on the shared Graph PowerShell application by default, so the program uses a dedicated one. The guide's RACI names who is responsible and accountable for each activity.`,
  `${G} — Step 3 (consent and roles by source; what consent leaves behind), "RACI"; Microsoft Learn — "Get started with the Zero Trust Assessment," "Authentication module cmdlets in Microsoft Graph PowerShell"; the tool's guide, 3.1.0.`);
}
endModule(SWHO);

// ================================================================== 8 How: host and output
{
  const s = content(SHOW, "Step 2: a clean host and a protected output folder");
  tag(s, "How");
  const c = code(s, "Host", 0.6, 1.4, FULL, [
    "# A clean PowerShell 7 session on the dedicated host; install the pinned version (expected: 3.1.0, PowerShell 7.6 or later)",
    "pwsh -NoProfile",
    "$PSVersionTable.PSVersion",
    "Install-PSResource -Name ZeroTrustAssessment -Version 3.1.0 -Scope CurrentUser",
    "Get-Module -ListAvailable ZeroTrustAssessment | Select-Object Name, Version",
    "# A new, empty report folder per run, restricted to the run account and the custodians",
    "New-Item -ItemType Directory -Path <report-folder>",
    "icacls <report-folder> /inheritance:r /grant:r \"${env:USERDOMAIN}\\${env:USERNAME}:(OI)(CI)F\" \"BUILTIN\\Administrators:(OI)(CI)F\"",
    "# Step 10: move the unaltered export into evidence, hash the copy, then delete the local folder",
    "Copy-Item -Recurse <report-folder> <evidence-folder>\\exports\\<run-date>",
    "Get-FileHash -Algorithm SHA256 -LiteralPath <evidence-folder>\\exports\\<run-date>\\zt-export\\ZeroTrustAssessmentReport.json",
    "Remove-Item -Recurse -Force <report-folder>",
  ], { label: "THE GUIDE'S COMMANDS (PLACEHOLDERS IN ANGLE BRACKETS)", pt: 10.5 });
  const p1 = panel(s, "Why", 0.6, c + 0.15, W2, null, HEX.red, HEX.redTint, "THE OUTPUT IS A MAP OF THE TENANT", null, [
    "Learn: share only with authorized personnel, store securely, delete the folder after",
    "Tool's guide: exports and logs can hold personal data; the PowerShell log folder stays",
  ], 11.5);
  const p2 = panel(s, "Host", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "THE HOST", null, [
    "Learn says PowerShell 7; the tool's guide asks 7.6 for its pinned Exchange module",
    "Windows for SharePoint and AIP checks; elsewhere they're skipped",
  ], 11.5);
  fit("Host panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Step 2, Step 10, \"Prerequisites\"; Microsoft Learn, Get started with the Zero Trust Assessment; Run the Zero Trust Assessment (the tool's guide, 3.1.0).");
  notes(s,
`Now how, starting with the host. The report and export hold tenant information an attacker could use. Learn says to share them only with authorized personnel, store the report securely, and delete the generated folder when the assessment is complete. The tool's guide adds that exports and logs can hold personal information, and that deleting the report folder doesn't remove the PowerShell logging folder. So open a clean PowerShell session on a dedicated host inside the boundary. Learn says PowerShell seven; the tool's guide asks for seven point six, for its pinned Exchange module. Install and pin the version the decision record names. Create a new, empty report folder for each run, restricted to the run account and the evidence custodians. In step ten, the unaltered export moves into the evidence repository, the copy is hashed, and the local folder is deleted.`,
  `${G} — Step 2, steps 1 to 3; Step 10, step 3; "Prerequisites"; Microsoft Learn — "Get started with the Zero Trust Assessment"; the tool's guide, 3.1.0 (data handling; install).`);
}

// ================================================================== 9 How: connect in each cloud
{
  const s = content(SHOW, "Step 4: connect in the tenant's own cloud");
  tag(s, "How");
  const c = code(s, "Connect", 0.6, 1.4, FULL, [
    "# Commercial and GCC (GCC uses the worldwide endpoints)",
    "Connect-ZtAssessment -Tenant <tenant> -Environment Global -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>",
    "# GCC High",
    "Connect-ZtAssessment -Tenant <tenant> -Environment USGov -ExchangeEnvironmentName O365USGovGCCHigh `",
    "    -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>",
    "# DoD",
    "Connect-ZtAssessment -Tenant <tenant> -Environment USGovDoD -ExchangeEnvironmentName O365USGovDoD `",
    "    -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>",
    "# Then confirm the tenant and the cloud the session is in",
    "Get-MgContext | Format-List TenantId, Environment, Account, Scopes",
    "Get-AzContext | Format-List Tenant, Environment, Subscription",
  ], { label: "THE GUIDE'S COMMANDS: THE TOOL'S 3.1.0 SOURCE, MATCHED TO LEARN'S PER-SERVICE PAGES", pt: 10.5 });
  const p1 = panel(s, "Sep", 0.6, c + 0.15, W3, null, HEX.navy, HEX.navyTint, "SEPARATE SIGN-INS", null, [
    "Graph, Azure, Exchange Online, Security & Compliance, SharePoint Online, AIP",
    "A Graph connection doesn't grant the others",
  ], 11.5);
  const p2 = panel(s, "SPO", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.amber, HEX.amberTint, "ALWAYS PASS -SharePointAdminUrl", null, [
    "Otherwise the tool infers it from the initial domain",
    "In GCC High and DoD it infers a sharepoint.us address",
  ], 11.5);
  const p3 = panel(s, "Fail", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.red, HEX.redTint, "IF A SERVICE WON'T CONNECT", null, [
    "Connect the rest with -Service Graph,Azure and run",
    "Record those tests as Skipped-Disconnected, with the reason",
  ], 11.5);
  fit("Connect panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 4, \"Government-cloud availability\"; Run the Zero Trust Assessment (the tool's guide, 3.1.0); Microsoft Graph national cloud deployments.");
  notes(s,
`Step four connects. The tool signs in separately to Microsoft Graph, Azure, Exchange Online, Security and Compliance, SharePoint Online and Azure Information Protection, and a Graph connection doesn't grant the others. Learn's get-started page shows only the commercial command, so the guide takes each cloud's parameters from the tool's source. Commercial and G C C use the Global environment. G C C High uses U S Gov with its Exchange environment name, and D O D uses U S Gov D O D with its own. Then confirm the tenant and cloud with Get M G Context and Get A Z Context. Pass the SharePoint admin U R L in every cloud, or the tool infers one. If a service won't connect, connect the rest, run, and record its tests as skipped, disconnected, with the reason. In D O D, if the Purview tests skip as disconnected, check the conflicting address first.`,
  `${G} — Step 4 (steps, the SharePoint and DoD notes, interim path); "Government-cloud availability"; the tool's guide and source, 3.1.0; Microsoft Learn — "Microsoft Graph national cloud deployments."`);
}

// ================================================================== 10 How: run and hash
{
  const s = content(SHOW, "Step 5: run it, then hash the export first");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.4, FULL, [
    "# Run in the connected session; -DisableTelemetry is the CISO's decision in the decision record",
    "Invoke-ZtAssessment -Path <report-folder> -DisableTelemetry -NoBrowser",
    "# As soon as it finishes, before anyone opens or copies it",
    "Get-FileHash -Algorithm SHA256 -LiteralPath <report-folder>\\zt-export\\ZeroTrustAssessmentReport.json",
    "Get-ChildItem <report-folder> -Recurse -File | Get-FileHash -Algorithm SHA256 |",
    "    Export-Csv <report-folder>\\..\\run-hashes.csv -NoTypeInformation",
    "# If the run fails: a support package, in the same session, to a separate protected folder",
    "New-PSFSupportPackage -Path <report-folder>-support -Force",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN AND THE TOOL'S GUIDE", pt: 10.5 });
  const p1 = panel(s, "Long", 0.6, c + 0.15, W3, null, HEX.amber, HEX.amberTint, "READ-ONLY, AND LONG", null, [
    "Read-only; stores its data locally",
    "Can take over 24 hours on a large tenant: Learn says don't stop it, even with warnings",
  ], 11.5);
  const p2 = panel(s, "Flags", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.navy, HEX.navyTint, "TWO FLAGS", null, [
    "-DisableTelemetry suppresses the one event, which carries the tenant ID",
    "-NoBrowser keeps the report off a shared screen",
  ], 11.5);
  const p3 = panel(s, "Writes", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.red, HEX.redTint, "WHAT IT WRITES", null, [
    "Two HTML reports, and zt-export: the JSON the kit reads, entities, a database, logs",
    "Everything under zt-export is assessment data",
  ], 11.5);
  fit("Run panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 5; Microsoft Learn, Get started with the Zero Trust Assessment; Run the Zero Trust Assessment (the tool's guide, 3.1.0).");
  notes(s,
`Step five runs it. The assessment is read-only and stores its data locally. On a large tenant it can take more than twenty-four hours, and Learn says not to stop it, even if it logs warnings or errors. The disable-telemetry switch suppresses the one telemetry event, which carries the tenant I D; using it is the see-so's decision. The no-browser switch keeps the report off a shared screen. As soon as the run finishes, before anyone opens or copies anything, hash the export, S H A two fifty-six, and hash every file into a C S V. Those hashes show the output wasn't modified. If the run fails, capture a support package in the same session, to a separate protected folder. Everything under the zt-export folder, including the jay-son report data the kit reads, is assessment data, not just logs.`,
  `${G} — Step 5 (steps 1 to 3, the outputs, Validate); Microsoft Learn — "Get started with the Zero Trust Assessment"; the tool's guide, 3.1.0 (run, telemetry, outputs).`);
}

// ================================================================== 11 How: statuses and the taxonomy
{
  const s = content(SHOW, "Steps 6 and 7: a skipped test is not a failed control");
  tag(s, "How");
  const tb = table(s, "Tax", 1.4, [2.45, 6.6, 3.1], ["Normalized result", "Zero Trust Assessment 3.1.0", "Counted as"], [
    ["Pass", "Passed", "Evidence of conformance for that run"],
    ["Fail", "Failed; Investigate until reviewed", "A finding"],
    ["Planned", "Planned (UnderConstruction)", "Neither"],
    ["Skipped-Licensing", "NotLicensedEntraIDP1, …P2, …Governance, …WorkloadID; NotLicensedIntune; NoCompatibleLicenseFound", "Neither; a licensing decision"],
    ["Skipped-Disconnected", "NotConnectedAzure, …Exchange, …SecurityCompliance, …ToService; NoAzureAccess", "Neither; fix the run's scope"],
    ["Skipped-Not-Applicable", "NotApplicable, NotDotGovDomain, NotSupported", "Neither; NotSupported a boundary finding"],
    ["Unable-to-Evaluate", "Error; TimeoutReached; any status or reason the taxonomy doesn't list", "Neither; fix the run or verify by hand"],
  ], { fontSize: 11, limit: 5.3 });
  const c = code(s, "Norm", 0.6, tb + 0.15, FULL, [
    "./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder> -OutputPath out/<run-date> -ReviewsPath <reviews-file>",
  ], { pt: 10.5, limit: 6.0 });
  line(s, "Gov", "In a federal tenant, NotDotGovDomain usually means the .gov domain isn't verified. In GCC High and DoD, a failed impersonation test is a boundary finding.",
    c + 0.1, 0.55, 13);
  sources(s, "Sources: Guide, Steps 6 and 7; Microsoft Learn, Zero Trust Assessment terminology; Exchange Online for US government; the tool's 3.1.0 source; Book 11, Ch 10.");
  notes(s,
`Steps six and seven read the results. Each pillar owner reads their tab. Every test ends in one of six statuses: passed, failed, investigate, skipped, planned, or error. Investigate means a person needs to look, and skipped carries a reason, such as not licensed or not connected. The kit records every result twice: the tool's value, unchanged, and one of seven normalized results. That's the rule in the title. A skipped test is not a failed control, and it's not a pass. It goes in its own column, with its reason: a licensing decision, or a run to fix. Investigate counts as a finding until a recorded review confirms or dismisses it. Two federal cases. Not dot gov domain usually means the agency's dot gov domain isn't verified in the tenant. And Learn says impersonation protection isn't yet available in G C C High and D O D, so a failed impersonation test there is a boundary finding.`,
  `${G} — Step 6 (statuses, the rubric, the GCC High example), Step 7 (the taxonomy, NotDotGovDomain, steps); Microsoft Learn — "Zero Trust assessment terminology," "Exchange Online for US government environments"; the tool's 3.1.0 source; Book 11, Chapter 10 — "A normalized result taxonomy."`);
}

// ================================================================== 12 How: closure register
{
  const s = content(SHOW, "Step 8: the closure register routes every finding");
  tag(s, "How");
  const tb = table(s, "Fam", 1.4, [3.15, 3.2, 5.8], ["Finding family (some of them)", "Remediation page", "Evidence that shows it's ready for closure"], [
    ["Emergency access", "Book 04, Ch 04", "Two cloud-only emergency accounts with phishing-resistant credentials; the sign-in alert fired on a test"],
    ["Standing privilege and PIM", "Book 04, Ch 08", "The PIM role-setting export; no permanent active assignment outside the exception register"],
    ["Conditional Access gaps", "Book 04, Ch 07", "The policy export; report-only results reviewed; a test sign-in blocked as designed"],
    ["Application secrets", "Book 13, Ch 14", "No secret outside the exception register; each moved workload on a managed identity or certificate"],
    ["Device compliance gaps", "Book 05, Ch 10", "Compliance policy exports; device-based Conditional Access enforced; a noncompliant test device refused"],
    ["Audit and visibility gaps", "Book 12, Ch 02", "Diagnostic settings exports; every expected table arriving; the completeness check passing"],
    ["Skipped or unevaluated tests", "Book 11, Ch 10", "Step 7's dispositions, each with its reason and decision"],
  ], { fontSize: 10.5, limit: 5.1 });
  const c = code(s, "Reg", 0.6, tb + 0.15, FULL, [
    "./Invoke-ZtaRegister.ps1 -RunPath out/<run-date> -OutputPath out/<run-date>-register -ExceptionsPath <exceptions-file>",
  ], { pt: 10.5, limit: 5.7 });
  line(s, "Unrouted", "No family: the Zero Trust program lead routes it. An exception with an expiry is the CISO's; one without is the AO's. The kit never marks ready for closure.",
    c + 0.1, 0.55, 13);
  sources(s, "Sources: Guide, Step 8 (\"Where each finding family is remediated\"; \"Weigh, then order\"; \"Exceptions\"); Book 11, Ch 08 and 10.");
  notes(s,
`Step eight opens the closure register. Every finding gets one entry with the closure chain's fields, from the Zero Trust and Assessment book: the finding and tool version, the attack path, the owner, dependencies, the change, pilot, enforcement and test, the evidence, residual risk, reassessment and weighting. Each finding family routes to the page that remediates it, with the evidence that shows it's ready for closure. Emergency access goes to Access and Privilege, with a test sign-in that fired its alert. Conditional Access gaps go to its policy library, with a test sign-in blocked as designed. Skipped tests go to step seven's dispositions. A finding with no family goes to the Zero Trust program lead. The kit sets a default priority, and the owner writes the rationale. An exception with an expiry is the see-so's decision; one without is the authorizing official's. The kit never marks a finding ready for closure.`,
  `${G} — Step 8 (the closure chain fields, the family table, unrouted findings, "Weigh, then order," "Exceptions"); Book 11, Chapters 08 and 10; Book 04, Chapters 04, 07 and 08; Book 13, Chapter 14; Book 05, Chapter 10; Book 12, Chapter 02.`);
}

// ================================================================== 13 How: reconcile
{
  const s = content(SHOW, "Step 9: reconcile through the setting and the control");
  tag(s, "How");
  const p1 = panel(s, "Spine", 0.6, 1.45, FULL, null, HEX.teal, HEX.tealTint, "ONE SPINE FOR TOOLS WITH DIFFERENT IDENTIFIERS", null, [
    "Match each tool to the setting itself and the NIST SP 800-53 control it supports, not tool to tool",
    "Two tools failing the same setting under the same control: one finding, two pieces of evidence, one owner",
  ], 12.5);
  const p2 = panel(s, "Scuba", 0.6, p1 + 0.2, W2, null, HEX.navy, HEX.navyTint, "SCUBAGEAR", null, [
    "CISA maps every SCuBA policy to SP 800-53 Rev. 5 controls in the FedRAMP High baseline",
    "Where both fail, the ScubaGear finding is the BOD 25-01 deviation",
  ], 12);
  const p3 = panel(s, "SH", 0.6 + W2 + G2, p1 + 0.2, W2, null, HEX.amber, HEX.amberTint, "AWS SECURITY HUB CSPM", null, [
    "Its NIST SP 800-53 Rev. 5 standard supports a subset, automated checks only",
    "Each finding's related requirements, such as NIST.800-53.r5 AC-4, are the spine",
    "PASSED with no resources means nothing was evaluated: read it with the inventory",
  ], 12);
  const tb = table(s, "Status", Math.max(p2, p3) + 0.2, [3.0, 9.15], ["Security Hub CSPM status", "Normalized (the program's mapping)"], [
    ["PASSED; FAILED", "Pass; Fail"],
    ["WARNING; NOT_AVAILABLE", "Unable-to-Evaluate; NOT_AVAILABLE is Skipped-Not-Applicable when the reason is not applicable"],
  ], { fontSize: 11, limit: 6.1 });
  line(s, "Other", "Oracle Cloud Infrastructure Cloud Guard and Google Cloud Security Command Center: Book 12, Ch 08 compares them.", tb + 0.1, 0.35, 12.5);
  sources(s, "Sources: Guide, Step 9; Book 11, Ch 05 and 10; NIST SP 800-53 Rev. 5 in Security Hub CSPM; AWS Security Hub CSPM compliance status.");
  notes(s,
`Step nine reconciles. Tools with different identifiers can't be matched directly, so the program matches each to a common spine: the setting, and the control it supports in the NIST special publication eight hundred fifty-three. Two tools failing the same setting under the same control are one finding, with two pieces of evidence and one owner. CISA maps every SCuBA policy to those controls in the fed-ramp High baseline. On AWS, Security Hub's standard for that publication supports a subset of it, with automated checks only, and each finding lists its related requirements: that's the spine. Its statuses map to the taxonomy, and A W S warns that a control with no resources passes at the account level, so a pass can mean nothing was evaluated. On the other clouds, Oracle Cloud Infrastructure's Cloud Guard and Google Cloud's Security Command Center are compared in Security Operations and Telemetry.`,
  `${G} — Step 9 (the spine, ScubaGear, Security Hub CSPM, the status mapping, other clouds); Book 11, Chapters 05 and 10; Book 12, Chapter 08; AWS — "NIST SP 800-53 Revision 5 in Security Hub CSPM," "Evaluating compliance status and control status."`);
}

// ================================================================== 14 How: re-run, compare, seal
{
  const s = content(SHOW, "Step 10: re-run, compare and seal the evidence");
  tag(s, "How");
  const c = code(s, "Seal", 0.6, 1.4, FULL, [
    "# Compare with the last run: new, regressed, fixed, still open, and no longer evaluated",
    "./Invoke-ZtaCompare.ps1 -PreviousPath <previous-run> -CurrentPath <current-run> -OutputPath out/<run-date>-compare",
    "# Seal each output folder as a chained record (also -register and -compare), then check the package",
    "./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/<run-date> -Operator '<role>'",
    "./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -Check -Package re-run -RunDate <run-date>",
    "# The ISSO can check the folder without the kit, in a POSIX shell",
    "cd <evidence-folder> && sha256sum -c SHA256SUMS",
  ], { label: "THE GUIDE'S COMMANDS, FROM THE RESULTS KIT", pt: 10.5 });
  const tb = table(s, "Cadence", c + 0.15, [3.3, 5.85, 3.0], ["When (design guidance)", "What", "Owner"], [
    ["Monthly", "Full run; assessment results and the POA&M regenerated", "Operators; the ISSO"],
    ["After each remediation wave", "A run of the affected pillar, so a fix is closed by evidence, not a ticket", "The pillar owner"],
    ["Before a tool upgrade", "A run of the new version in the test tenant, compared with the old", "Assessment operators"],
    ["Quarterly", "Trend review: which findings regress, which dispositions recur", "The ISSM"],
  ], { fontSize: 11, limit: 5.6 });
  line(s, "NLE", "\"No longer evaluated\" is not fixed. Runs from different tool versions are refused until someone records that they reviewed the change.",
    tb + 0.1, 0.55, 13);
  sources(s, "Sources: Guide, Step 10; Book 15, Ch 12 (cadence); Microsoft Learn, Operate Microsoft Entra Private Access (the scheduled digest playbook).");
  notes(s,
`Step ten makes it repeatable. The kit compares each run with the last: new, regressed, fixed, still open, and no longer evaluated. That last class matters most. A finding the tool skipped this time isn't fixed: fix the run and run it again. Runs from different tool versions are refused until someone records a review of the change. Then seal the evidence: each output folder becomes a chained record with its controls, every file's hash, and the previous record's hash, which the I S S O can check without the kit. The cadence is design guidance from the day-two runbook in Compliance Automation and Day-2 Operations: monthly, after each remediation wave, before a tool upgrade, and quarterly. Learn's weekly digest playbook comes with two cautions: report counts, not its pass rate, and whether it runs against three point one point oh isn't yet specified.`,
  `${G} — Step 10 (steps 1 and 2, the cadence table, the digest playbook); Book 15, Chapter 12 — "The cadence by control family"; Microsoft Learn — "Operate Microsoft Entra Private Access," "Operate Microsoft Entra Internet Access."`);
}

// ================================================================== 15 How: dangers, open questions, training
{
  const s = content(SHOW, "Dangers, open questions and where training starts");
  tag(s, "How");
  const tb = table(s, "Dangers", 1.4, [4.3, 7.85], ["Danger", "The guard"], [
    ["A skipped test counted as a failure, or as a pass", "Step 7's taxonomy; skipped results in their own columns, with their reasons"],
    ["A finding \"fixed\" because the next run skipped it", "The comparison's no-longer-evaluated class; fix the run and re-run"],
    ["The pass rate as the maturity score", "Counts by normalized result and pillar; the weighted register"],
    ["The Zero Trust Assessment instead of ScubaGear", "Run both; Step 9"],
    ["Global Administrator for every run; consent on the shared app", "Consent once; a dedicated reader with eligible roles; a dedicated application"],
    ["Wrong cloud, or the report folder left on the host", "Step 4's per-cloud commands and Get-MgContext; Step 10's move and delete"],
  ], { fontSize: 11, limit: 4.6 });
  const p1 = panel(s, "Open", 0.6, tb + 0.15, W2, null, HEX.red, HEX.redTint, "WHAT COULDN'T BE VERIFIED", null, [
    "Government clouds on Learn; DoD's Security & Compliance address; DoD's SharePoint admin URL",
    "Which run roles apply; Graph scopes in GCC High and DoD; nothing run against a tenant",
  ], 11.5);
  const p2 = panel(s, "Train", 0.6 + W2 + G2, tb + 0.15, W2, null, HEX.teal, HEX.tealTint, "WHERE TRAINING STARTS", null, [
    "The Zero Trust Assessment as Evidence: four modules, each with a knowledge check",
    "Module 1, Evidence, not a verdict: Lab 1 on the kit's fictional fixtures, no tenant",
  ], 11.5);
  fit("Close panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, \"Dangers and how to avoid them,\" \"What couldn't be verified,\" \"Labs for this guide\"; learning path, The Zero Trust Assessment as Evidence.");
  notes(s,
`To close, the dangers. Counting a skipped test as a failure or a pass. Calling a finding fixed because the next run skipped it. Treating the pass rate as a maturity score. Running the Zero Trust Assessment instead of ScubaGear. Global Administrator for every run, or consent on the shared Graph application. And the wrong cloud, or a report folder left on the host. Each has its guard in the steps. The guide is plain about what it couldn't verify: government clouds on Learn, D O D's Security and Compliance address and SharePoint admin U R L, which run roles apply, and Graph permissions in G C C High and D O D. Nothing was run against a tenant. To practice, start the learning path, The Zero Trust Assessment as Evidence: four modules, each with a knowledge check. Module one's first lab runs on the kit's fictional fixtures, with no tenant. Thank you.`,
  `${G} — "Dangers and how to avoid them," "What couldn't be verified," "Labs for this guide"; learning path, The Zero Trust Assessment as Evidence, Module 1.`);
}
endModule(SHOW);

// ================================================================== Backup
backup();
sourceSlide("Sources: the guide, the tool and the clouds", [
  "Zero Trust Assessment: An Implementation Guide (companion guide): \"How to read this guide,\" \"The track at a glance,\" \"Prerequisites,\" \"Government-cloud availability,\" \"The path on one page,\" Steps 1 to 10, \"RACI,\" \"Federal requirements and KSIs,\" \"Dangers,\" \"What couldn't be verified.\" Its verification log lists every claim.",
  "Microsoft Learn, read November 11, 2026: What is the Zero Trust Assessment?; Get started with the Zero Trust Assessment; Zero Trust assessment terminology; Operate Microsoft Entra Private Access and Operate Microsoft Entra Internet Access (the scheduled digest playbook).",
  "The tool, release 3.1.0 (October 20, 2026): Zero Trust Assessment release 3.1.0; Zero Trust Assessment README; Run the Zero Trust Assessment (the tool's guide); its source for Connect-ZtAssessment, Get-ZtGraphScope, the statuses and the skip reasons.",
  "Microsoft Learn, per cloud: Microsoft Graph national cloud deployments; Graph PowerShell authentication cmdlets; Connect to Exchange Online PowerShell; Exchange app-only authentication; Connect to Azure Government with PowerShell; Exchange Online for US government.",
]);
sourceSlide("Sources: reconciliation, requirements and the books", [
  "CISA BOD 25-01; CISA ScubaGear. AWS: NIST SP 800-53 Rev. 5 in Security Hub CSPM; AWS Security Hub CSPM compliance status; AWS Security Hub CSPM in AWS GovCloud (US).",
  "Federal requirements: NIST SP 800-53 Rev. 5 (CA-2, CA-5, CA-7, CM-6, CM-8, AC-2, AC-6, AU-9, AU-11, RA-7, SI-12); FedRAMP 20x Key Security Indicators, as Book 13, App. A maps them (design guidance).",
  "Book 11, Ch 05 (the two tools), Ch 07 (who owns Zero Trust), Ch 08 (close before you assess), Ch 09 (running the assessment), Ch 10 (evidence, not verdicts); Book 15, Ch 12 (cadence); Book 12, Ch 08 (posture tools on other clouds).",
  "The scripted steps: the guide's results kit, examples/zta-results. Training: the learning path The Zero Trust Assessment as Evidence, four modules with Lab 1 on fixtures and Lab 2 in a test tenant.",
]);

finish(OUT);
