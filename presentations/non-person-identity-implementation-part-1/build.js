// Implementation guide — Non-Person Identity, IMPLEMENTATION SERIES, PART 1:
// inventory, decisions and credential rules (implementation guide Gates G1–G3).
//   Orientation:        the six gates on one page; the record, the roles and the licenses.
//   G1 — Inventory:     every kind of non-person identity; the join to a record, owners and sponsor; the register; the owner check.
//   G2 — Decision:      five targets from the matrix; proposal, disposition and waves in code.
//   G3 — Credentials:   the tenant policy; the vault, the upload and secrets by exception; the policy diff and the rotation plan.
//   Close:              the handoff to Part 2 (Gates G4–G6, SQL Server, AI agents, evidence, rollback).
// Sources: docs/books/guides/non-person-identity-implementation.md, the developer workbook
// docs/project-plans/developer-workbooks/non-person-identity/ (Chapters 01–04, Lab 1 of each), the kit
// examples/non-person-identity, and the real Lab 1 captures in data/kit-captures/npi/. No new external facts.
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js);
// the code panel and the one-line statement are the ADM deeper dive's, as the HR-Driven Identity implementation series uses them.
// Every terminal line on a slide is read from data/kit-captures/npi/NN-k.txt at build time, so it stays the kit's real output;
// a panel whose lines are cut, wrapped or left out says so in its label.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/non-person-identity-implementation-part-1/build.js \
//                      presentations/non-person-identity-implementation-part-1/Non_Person_Identity_Implementation_Part_1.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Non-Person Identity — Implementation, Part 1",
  footer: "Federal Modernization Workbook  ·  Non-Person Identity — Implementation, Part 1: G1–G3",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Non_Person_Identity_Implementation_Part_1.pptx";
const IG = "Non-person identity implementation guide";
const WB = "Developer workbook, Building Non-Person Identity";

// ------------------------------------------------------------------ captures
// cap("01-4", [0, 1, 2], { max, mode }) returns those lines of data/kit-captures/npi/01-4.txt (0-based).
// A prompt line (PS>) longer than max is continued PowerShell-style (" `", then ">>     ").
// An output line longer than max is cut with "…" (mode "cut") or wrapped with a four-space indent (mode "wrap").
const CAP = path.join(__dirname, "..", "..", "data", "kit-captures", "npi");
const cap = (id, idx, o = {}) => {
  const all = fs.readFileSync(path.join(CAP, `${id}.txt`), "utf8").replace(/\r/g, "").split("\n");
  const pick = idx === "all" ? all.filter((l, k) => k < all.length - 1 || l.length) : idx.map((k) => {
    if (all[k] === undefined) throw new Error(`capture ${id} has no line ${k}`);
    return all[k];
  });
  const max = o.max || 999;
  const out = [];
  for (const line of pick) {
    if (line.length <= max) { out.push(line); continue; }
    if (/^PS> /.test(line)) {
      let rest = line, first = true;
      while (rest.length > (first ? max : max - 7)) {
        const room = (first ? max : max - 7) - 2;
        const cut = rest.lastIndexOf(" ", room);
        out.push((first ? "" : ">>     ") + rest.slice(0, cut) + " `");
        rest = rest.slice(cut + 1); first = false;
      }
      out.push((first ? "" : ">>     ") + rest);
    } else if (o.mode === "wrap") {
      let rest = line, first = true;
      while (rest.length > (first ? max : max - 4)) {
        const room = first ? max : max - 4;
        const cut = rest.lastIndexOf(" ", room);
        out.push((first ? "" : "    ") + rest.slice(0, cut));
        rest = rest.slice(cut + 1); first = false;
      }
      out.push((first ? "" : "    ") + rest);
    } else {
      out.push(line.slice(0, max - 1).trimEnd() + "…");
    }
  }
  return out;
};
// Characters that fit on one line of a code panel of width w at pt points (the width check's own rule).
const fitChars = (w, pt = 10.5) => Math.floor((w - 0.4) / (0.55 * pt / 72));

// ------------------------------------------------------------------ code panel
// A light panel with monospaced text (Consolas). Lines starting with "#" are comments, in teal.
// Returns the panel's bottom edge and warns when a line is too wide or the panel runs into the Sources line.
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

const S0 = "Orientation";
const SG1 = "G1 — Inventory";
const SG2 = "G2 — Decision";
const SG3 = "G3 — Credential rules";
const SC = "Close";
const FULL = 12.15;
const NFULL = fitChars(FULL); // 146 characters at 10.5 pt

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Part 1: Inventory, decisions and credential rules", "Non-Person Identity — implementation, Gates G1–G3");
  txt(s, "Session map", [
    { text: "G1 Inventory every non-person identity   ·   G2 Decide each identity's target", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "G3 Set the credential rules", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 2: G4 Least privilege  ·  G5 Conversion  ·  G6 Lifecycle  ·  SQL Server, AI agents, evidence, rollback", options: { color: HEX.ink, breakLine: true } },
    { text: "Steps, Lab 1 commands and real output, federal evidence, government-cloud availability and rollback", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 1 of the implementation series for Non-Person Identity. The guide opens with the problem in one line: a person leaves and HR tells you; a service account's owner leaves and nothing tells you. So this track has to build the record that HR provides for everyone else, and it does that as six gates an operator can run.

This series stays at the level of those gates. For each one: what "done" means, the steps, the commands from the developer workbook's first lab with what the kit really prints, the federal requirement the gate supports and the evidence an ISSO keeps, what's available in GCC and the US Government clouds as the guide and the workbook state it, and how to roll the gate back.

Part 1 covers Gates G1 to G3: inventory every non-person identity, decide each one's target, and set the credential rules. Part 2 covers G4 to G6, least privilege, conversion with a parallel run and the lifecycle, and then SQL Server's principals, AI agents, the evidence an assessor reads and rollback.

Two labels apply throughout. The program's own recommendations are marked design guidance, and conclusions the sources support but don't state are marked inference. The workbook's code is illustrative and fixture-tested, not proven against a live tenant or domain.`,
  `${IG}, "In this guide," "How to read this guide," "The path on one page."`);
}

// ================================================================== 2 Gates on one page
{
  const s = content(S0, "The six gates on one page: done when, proved by");
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [2.3, 7.35, 2.5], ["Gate", "Done when", "Validate with"], [
    ["G1 Inventory", "Every non-person identity is listed, typed and joined to a record with an owner and a sponsor", "VK-NPI-01, 06, 07, 08"],
    ["G2 Decision", "Every identity has a target and a date; high-risk accounts are first", "VK-NPI-03, 06"],
    ["G3 Credential rules", "The tenant blocks new secrets and caps lifetimes; existing credentials are on a rotation calendar in a vault", "VK-NPI-02, 03"],
    ["G4 Least privilege", "High-privilege grants are justified or removed; Tier 1 single-tenant service principals have a workload identity policy", "VK-NPI-04, 05, 07"],
    ["G5 Conversion", "Converted identities authenticate without stored secrets; legacy accounts are disabled after a clean parallel run", "VK-NPI-03, 06"],
    ["G6 Lifecycle", "Owner change, orphan, review and decommission paths run and leave records", "VK-NPI-01, 02, 08, 09"],
  ], { fontSize: 12, limit: 5.55 });
  line(s, "Parts", "Part 1: G1–G3. Part 2: G4–G6. The workbook's chapters use the project plan's gates: its Gate 0 and Gate 1 fall in G1 here, its Gate 2 is G2 (inference).",
    tb + 0.15, 0.6, 13.5);
  sources(s, "Sources: Implementation guide, \"The path on one page,\" \"How to read this guide\" (the kit checks); Developer workbook, index (chapters and plan gates).");
  notes(s,
`Here are all six gates on one page, as the guide lays them out, with the validation kit checks each one names. The checks are read-only: they read Microsoft Graph, Azure Resource Graph or an export, and report. None of them changes the tenant or the forest.

G1, inventory, is done when every non-person identity is listed, typed and joined to a record with an owner and a sponsor, proved with VK-NPI-01, 06, 07 and 08.

G2, decision, is done when every identity has a target and a date, with high-risk accounts first, proved with VK-NPI-03 and 06.

G3, credential rules, is done when the tenant blocks new secrets and caps lifetimes, and existing credentials are on a rotation calendar in a vault, proved with VK-NPI-02 and 03.

Part 2 then takes G4, least privilege; G5, conversion with a clean parallel run; and G6, the lifecycle paths for owner change, orphans, reviews and decommissioning.

One note on numbering. The developer workbook's chapters follow the non-person identity project plan, whose gates are numbered differently. Its Gate 0, the inventory, and Gate 1, ownership, both fall inside the guide's G1; its Gate 2, a decision for every account, is the guide's G2. That mapping is our reading of the two documents, so it's marked inference.`,
  `${IG}, "The path on one page"; "How to read this guide" — the validation kit; ${WB}, index — "Chapters."`);
}

// ================================================================== 3 Prerequisites
{
  const s = content(S0, "Before G1: the record, the roles and the licenses");
  tag(s, "What");
  const tb = table(s, "Record", 1.45, [2.75, 4.85], ["Field in the record", "Why"], [
    ["System or application ID", "The join key; Entra apps point at it through serviceManagementReference, which survives one person leaving"],
    ["Technical owner (two named people)", "Manages configuration and credentials"],
    ["Sponsor (a federal employee)", "Answers for purpose and retirement; their HR lifecycle drives the identity's events"],
    ["Identity type and object ID", "sAMAccountName, application ID, service principal object ID, managed identity resource ID or agent identity ID"],
    ["Target and decision date; credential type, expiry and vault", "The outcomes of G2 and G3"],
    ["Risk tier", "Sets the approver and the review cadence"],
  ], { fontSize: 11.5, limit: 6.6 });
  panel(s, "Run", 8.45, 1.45, 4.3, null, HEX.teal, HEX.tealTint, "ROLES, LICENSES, WHERE IT RUNS", null, [
    "Collection needs reader roles only; the checks sign in with a certificate or a managed identity, never a secret",
    "Roles that change configuration come later, through PIM",
    "Free: managed identities, workload identity federation, app management policies, sign-in and audit logs",
    "Workload ID Premium: Conditional Access and ID Protection for workload identities",
    "In GCC, Entra ID runs in Microsoft's commercial cloud",
  ], 12);
  sources(s, "Sources: Implementation guide, \"The track at a glance,\" \"Prerequisites\" (the record, roles, licenses), \"How to read this guide\" (GCC).");
  notes(s,
`Before G1, the guide asks for three things: the record each identity joins to, the roles, and the licenses.

The record. The source of truth for this track is the owning system's record, the system inventory or CMDB, the app registration and, for AI, the AI use-case inventory. HR isn't, and Book 03 deliberately leaves non-person identities out of the human-worker pattern. The system inventory is the master; that's design guidance. Before Step 1, agree the fields every record carries: the system or application ID as the join key, which Entra applications point at through serviceManagementReference, the field Microsoft recommends for a team contact that survives one person leaving; two named technical owners; a sponsor who is a federal employee, whose HR lifecycle drives the identity's events; the identity type and object ID; the target and decision date from G2; the credential type, expiry and vault location from G3; and a risk tier, which sets the approver and the review cadence.

Roles. Collection needs reader roles only: Application.Read.All, Directory.Read.All, RoleManagement.Read.Directory, AuditLog.Read.All and Policy.Read.All, plus Azure Reader on the subscriptions in scope. The checks sign in as an app registration with a certificate or a managed identity, never a secret. Roles that change configuration come in later steps, through PIM.

Licenses. Managed identities, workload identity federation, application management policies and the logs are free. Workload ID Premium adds Conditional Access and ID Protection for workload identities. The audience is an agency at FedRAMP Moderate, usually in Microsoft 365 GCC, where Entra ID runs in Microsoft's commercial cloud.`,
  `${IG}, "The track at a glance"; "Prerequisites" — "The record each identity joins to," "Roles," "Licenses"; "How to read this guide."`);
}
endModule(S0);

// ================================================================== 4 G1: every kind
{
  const s = content(SG1, "G1: inventory every kind of non-person identity");
  tag(s, "What");
  const tb = table(s, "Kinds", 1.45, [2.75, 3.95, 5.45], ["Kind (step)", "Read with", "Record"], [
    ["AD service accounts, MSAs, gMSAs, dMSAs (1a)", "Book 02's read-only Get-FMPServiceAccountInventory; add dMSAs on Windows Server 2025 domains", "Password never expires, password age, SPNs, last logon; which hosts can retrieve each gMSA's password. \"Stale\" is a lead, not a verdict"],
    ["App registrations and service principals (1b)", "Book 04's read-only inventory script", "Owners, credentials, permissions; servicePrincipalType (a Legacy one has no app registration); multitenant and first-party marked; the property lock"],
    ["Managed identities (1c)", "servicePrincipalType eq 'ManagedIdentity'; Azure Resource Graph", "Azure and Graph role assignments; system- or user-assigned: a user-assigned identity is the type that orphans"],
    ["Federated credentials (1d)", "Each app registration and user-assigned identity", "Issuer, subject and audience; at most 20 per object"],
    ["AI agents (1e)", "Book 17's read-only listing, where Agent ID is exposed", "Agents running as ordinary service principals too; each joined to the AI use-case inventory"],
  ], { fontSize: 11, limit: 6.0 });
  line(s, "Why", "Consent creates service principals and Microsoft services provision their own: the inventory is always larger than the list of apps anyone asked for.",
    tb + 0.15, 0.55, 13.5);
  sources(s, "Sources: Implementation guide, Step 1, 1a–1e (Learn facts footnoted: service principal types, finding managed identities, their missing app object).");
  notes(s,
`G1 starts from one fact in Book 04: consent creates service principals and Microsoft services provision their own, so the inventory is always larger than the list of apps anyone asked for. Inventory first; decide later.

1a, Active Directory. Run Book 02's read-only discovery function, Get-FMPServiceAccountInventory. It finds user objects with SPNs, service prefixes or service descriptions, records password never expires, the days since the password changed, the SPN count, last logon and group count, and lists MSAs and gMSAs separately. Add dMSAs where a domain runs at the Windows Server 2025 level. Treat stale as a lead and confirm it against domain controller and Entra sign-in logs before anything is retired. And record which hosts can retrieve each gMSA's password: that list is the gMSA's real blast radius.

1b, app registrations and service principals. Run Book 04's read-only inventory script, and record each service principal's type: Application, ManagedIdentity, Legacy, or ServiceIdentity, which Microsoft's schema uses for an agent identity. A legacy service principal can hold credentials with no app registration, so an app-registration-only review never sees it. Mark multitenant and Microsoft first-party principals, which workload Conditional Access can't reach, and record the app instance property lock.

1c, managed identities. List them with the filter Microsoft documents, and read their Azure and Graph role assignments; a managed identity has no application object. A user-assigned identity outlives its resources and must be deleted explicitly, so it's the type that orphans.

1d, export every federated credential's issuer, subject and audience; an object holds at most 20. 1e, list agent identities with their sponsors where the tenant exposes Agent ID, and the agents that run as ordinary service principals, each joined to the AI use-case inventory.`,
  `${IG}, Step 1 — 1a to 1e; Book 02, Chapter 09 — "Discovering service accounts"; Book 04, Chapter 05 — "A read-only inventory to start from"; Book 17, Chapter 05.`);
}

// ================================================================== 5 G1: join, owners, sponsor
{
  const s = content(SG1, "G1: join each identity to a record, owner and sponsor");
  tag(s, "Who");
  const w = 3.9, g = 0.225;
  const p1 = panel(s, "Join", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "STEP 1F: THE JOIN", null, [
    "Every identity from 1a to 1e joins a record in the system inventory",
    "An app registration: serviceManagementReference where it's set; otherwise search by name and owner, then interview",
    "Find the application owner before the account is touched; one nobody will own is a retirement candidate",
  ], 12.5);
  const p2 = panel(s, "Owners", 0.6 + w + g, 1.45, w, null, HEX.teal, HEX.tealTint, "TWO OWNERS, NEVER ACCOUNTS", null, [
    "Two human owners on every app registration and service principal, never service accounts",
    "Owners hold only the people who configure the app: an owner can add a credential and act as the app",
    "The business approver goes in the registry and in serviceManagementReference",
  ], 12.5);
  const p3 = panel(s, "Sponsor", 0.6 + 2 * (w + g), 1.45, w, null, HEX.red, HEX.redTint, "A FEDERAL SPONSOR", null, [
    "A federal employee mastered in HR",
    "A contractor can build or run a workload, but can't be its only sponsor",
    "Book 17's rule for agents; the program applies it to all non-person identities (design guidance)",
  ], 12.5);
  panel(s, "Interim", 0.6, Math.max(p1, p2, p3) + 0.2, FULL, null, HEX.amber, HEX.amberTint, "OPTIONAL TAGS, AND THE INTERIM PATH FOR AGENTS", null, [
    "Optionally tag service principals with custom security attributes such as SystemId, Environment and Tier; G4 reuses them for Conditional Access filters",
    "Where the tenant doesn't expose the agent features, run this guide on the service principals the agents run as",
  ], 12.5);
  sources(s, "Sources: Implementation guide, Step 1, 1f; \"AI agents\" (where the features aren't available); Book 02, Ch 09, 10; Book 04, Ch 05; Book 17, Ch 05.");
  notes(s,
`Step 1f joins every identity to a record and names its people.

The join. Every identity from 1a to 1e joins a record in the system inventory. For an app registration, use serviceManagementReference where it's set; otherwise search by name and owner, then interview. Book 02's Phase 4 says to identify the application owner before the account is touched, and the companion guide says an account nobody will own is a retirement candidate.

Owners. Two human owners for every app registration and service principal, never service accounts: that's Book 02. Book 04 adds why the list stays short. An owner can add a credential and act as the app, so the Owners list holds only the people who configure it, and the business approver goes in the registry and in serviceManagementReference.

Sponsor. A sponsor who is a federal employee mastered in HR. A contractor can build or run a workload but can't be its only sponsor. That rule is Book 17's, for agents; the program applies it to every non-person identity, which is design guidance.

Optionally, tag service principals with custom security attributes such as SystemId, Environment and Tier. Microsoft suggests it for a filterable inventory and for attribute-based decisions, and Step 4 uses the same attributes for Conditional Access filters.

And the interim path for AI. Where the tenant doesn't expose the agent features, the guide says to run its lifecycle on the service principals the agents run as. For GCC High and DoD, Microsoft has published no availability for the agent features, so the guide treats them as unavailable there.`,
  `${IG}, Step 1 — 1f; "AI agents"; Book 02, Chapter 09 — "Governing service principals"; Chapter 10 — "Phase 4"; Book 04, Chapter 05 — "Ownership"; Book 17, Chapter 05.`);
}

// ================================================================== 6 G1 in code: the register
{
  const s = content(SG1, "G1 in code: one register, and the HIGH-risk rows");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, FULL, cap("01-3", "all", { max: NFULL }),
    { label: "CHAPTER 01, LAB 1, STEP 3 (examples/non-person-identity: a fictional estate, no tenant, no domain)", pt: 10.5 });
  const c2 = code(s, "High", 0.6, c1 + 0.15, FULL, cap("01-4", [0, 1, 2, 3, 5, 7, 8, 10], { max: NFULL }),
    { label: "STEP 4: FIVE OF THE EIGHT HIGH-RISK ROWS (THREE ROWS LEFT OUT; LONG LINES CUT AT …)", pt: 10.5 });
  const w = 5.95;
  const p1 = panel(s, "Rules", 0.6, c2 + 0.15, w, null, HEX.navy, HEX.navyTint, "WHAT THE FINDINGS FLAG", null, [
    "NPI-INV-01: HIGH risk: password never expires, unchanged over 365 days, a privileged AD group, unconstrained delegation or a high-privilege Graph permission",
    "NPI-INV-08: found only by a password that never expires; may be a person",
  ], 11.5);
  const p2 = panel(s, "Reads", 0.6 + w + 0.25, c2 + 0.15, w, null, HEX.teal, HEX.tealTint, "WHAT IT READS AND WRITES", null, [
    "Application.Read.All, Directory.Read.All, Azure Reader, the default AD read (step 2)",
    "Never disables, moves or deletes; SQL Server accounts go to the Data Platform plan",
  ], 11.5);
  if (process.env.FIT) console.log(`  register panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 01 (the register; risk and targets; the findings; Lab 1, steps 2–4); data/kit-captures/npi/01-3, 01-4.");
  notes(s,
`The developer workbook's Chapter 01 builds the register in code, in examples/non-person-identity. It starts from Microsoft Learn's own commands for finding service accounts and service principals, and its script for exporting app registrations' secrets and certificates, kept as pinned copies and run against stand-ins. Then it builds what they leave out: one read of Active Directory and Entra into one register, with an owner count, credential kind, risk, candidate target and stale lead on every row.

Lab 1 runs it against a fictional estate, with no tenant and no domain. Step 3 prints the summary you see: thirty-five identities, fifteen in AD and twenty in Entra; eight HIGH, nineteen LOW and eight MEDIUM; eight Findings, eleven Warns and three Info, with three accounts handed to the Data Platform plan. The manifest records the tenant, every request and a SHA-256 per file.

Step 4 lists the HIGH-risk rows. On the slide: svc-hrsync, password never expires and unchanged in 2,800 days; svc-backup, in Backup Operators; jdoe, password never expires, and found only by that criterion, so NPI-INV-08 asks whether it's a person; svc-webfront, trusted for unconstrained delegation; and the Mail Automation app registration, holding Directory.ReadWrite.All. The three rows left out are svc-sqlprod, svc-oldftp and gmsa-ops$.

The risk rule is the plan's, extended by Book 02's 365 days, and the candidate target is Book 02's matrix; both are design guidance, and Chapter 03 makes the decision. The code reads with Application.Read.All, Directory.Read.All, Azure Reader and the default AD read, and it never disables, moves or deletes anything.`,
  `${WB}, Chapter 01 — "The register," "Risk, targets, stale leads and the hand-off," "The findings," "Lab 1: fixtures, no tenant," steps 2–4; data/kit-captures/npi/01-3.txt, 01-4.txt.`);
}

// ================================================================== 7 G1 in code: owners and the orphan plan
{
  const s = content(SG1, "G1 in code: two human owners and the orphan plan");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, FULL, cap("02-4", "all", { max: NFULL }),
    { label: "CHAPTER 02, LAB 1, STEP 3 (after Chapter 01's step 3): CHECK OWNERSHIP AND BUILD THE PLAN", pt: 10.5 });
  const c2 = code(s, "Find", 0.6, c1 + 0.15, 2.7, cap("02-5", [1, 2, 3, 4, 5, 6, 7]),
    { label: "STEP 4 OUTPUT ONLY", pt: 10.5 });
  const c3 = code(s, "Plan", 3.5, c1 + 0.15, 4.75, cap("02-6", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    { label: "STEP 5 OUTPUT ONLY", pt: 10.5 });
  panel(s, "Rules", 8.45, c1 + 0.15, 4.3, null, HEX.navy, HEX.navyTint, "WHAT THE CHECK FLAGS", null, [
    "NPI-OWN-01, -02: no valid human owner, or only one; a guest, a service principal or a disabled user doesn't count",
    "NPI-OWN-06, -07: no service-management reference, or one that names no active record",
    "NPI-OWN-08: an AD account with no valid application owner",
    "The plan's writes run later, under G6's orphan rule",
  ], 11.5);
  if (process.env.FIT) console.log(`  owner panels bottom ${Math.max(c2, c3).toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 02 (the check; the orphan rule as a plan; Lab 1, steps 3–5); data/kit-captures/npi/02-4, 02-5, 02-6.");
  notes(s,
`Chapter 02 checks ownership over Chapter 01's register, and refuses a register whose SHA-256 isn't its manifest's. It starts from Learn's Graph tutorial query for service principals with no owner or one owner, and shows why that isn't the check: it counts the wrong owners on the wrong object and can't see Active Directory.

So the code reads each owner once with User.Read.All and counts an owner only if it's a user, a member and enabled: a guest, a service principal or a disabled user doesn't count. It wants a service-management reference that names an active record in the system inventory, and an application owner for every AD account, from an owners file kept with the record.

Step 3: twenty-two identities checked, seven orphan candidates, twenty Findings, three Warns and one Info. Step 4 groups the Findings: two apps with no valid owner, four with one, six with no reference, three whose reference is free text, a retired record or an unknown one, and five AD accounts with no valid owner.

Step 5 is the orphan rule as a plan: ten actions, three of them writes, two disables and one owner added from a claim. The Build Pipeline claim named a guest and is refused. A reviewer approves the plan by its hash, and the write path refuses any other.

Two notes for the gate. The workbook follows the plan's decision D-N2, disable once the identity governance officer confirms, then a 30-day claim window; the guide's Step 6 states Book 04's order, 30 days and then suspension, and the workbook leaves that difference open for the CISO. And the writes belong to the orphan rule, which is G6, in Part 2.`,
  `${WB}, Chapter 02 — "The rule the code holds," "The check," "The orphan rule as a plan," "Lab 1," steps 3–5; ${IG}, Step 6 — "Orphans."`);
}

// ================================================================== 8 G1: requirement, evidence, rollback
{
  const s = content(SG1, "G1: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.85, 6.3], ["Requirement", "What the ISSO keeps"], [
    ["AC-2 Account Management: non-person identities are a defined account type with an owner and a sponsor", "The Step 1 record; VK-NPI-01 and VK-NPI-08 runs"],
    ["IA-4 Identifier Management: each identity has its own identifier, joined to its record and never reused", "The record, keyed by object ID and system ID"],
  ], { fontSize: 12, limit: 6.6 });
  const w = 5.95;
  const p1 = panel(s, "Validate", 0.6, tb + 0.2, w, null, HEX.amber, HEX.amberTint, "VALIDATE (G1)", null, [
    "VK-NPI-06: AD accounts with password never expires, a password over the threshold (365 days), an SPN, or not a gMSA or dMSA: each joined or listed as unowned",
    "VK-NPI-01: zero apps and service principals with no owner; one owner carries a dated finding",
    "VK-NPI-07: every managed identity with its role assignments; VK-NPI-08: every agent identity with a sponsor",
    "Owner: the identity governance office; the CMDB owner signs the join (design guidance)",
  ], 11.5);
  const p2 = panel(s, "Avail", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "AVAILABILITY AND ROLLBACK", null, [
    "The inventory's Graph reads list the global service, US Government L4 and L5; GCC uses graph.microsoft.com, GCC High graph.microsoft.us",
    "Agent ID: generally available in commercial and, with documented gaps, in GCC; no published availability for GCC High and DoD",
    "Rollback: nothing to roll back; the inventory is read-only",
  ], 11.5);
  if (process.env.FIT) console.log(`  G1 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, \"Evidence,\" Validate (G1), \"AI agents,\" \"Rollback\"; Developer workbook, Ch 01 (which cloud, for this read).");
  notes(s,
`G1's federal side. The guide's evidence table maps by requirement, and where a book maps a control, that book governs.

AC-2, account management: non-person identities are a defined account type with an owner and a sponsor. The evidence is the Step 1 record and the VK-NPI-01 and VK-NPI-08 runs. IA-4, identifier management: each identity has its own identifier, joined to its record and never reused. The evidence is the record, keyed by object ID and system ID.

Validate. VK-NPI-06 reports every AD account with password never expires, a password older than the threshold, where Book 02's script treats more than 365 days as high risk, an SPN, or a type other than gMSA or dMSA; every row is joined to a record or listed as unowned. VK-NPI-01 reports zero service principals and app registrations with no owner, and those with one owner each carry a dated finding. VK-NPI-07 lists every managed identity with its role assignments, with every user-assigned one joined to a record. VK-NPI-08 lists every agent identity with a sponsor, where the tenant exposes Agent ID. The gate owner is the identity governance office, with the CMDB owner signing that the join is complete; that's design guidance.

Availability. The workbook's Chapter 01 says the Graph calls whose pages carry a national cloud table list the global service, US Government L4 and L5. GCC uses the worldwide hosts; GCC High uses graph.microsoft.us. Agent ID is generally available in commercial and, with documented gaps, in GCC; for GCC High and DoD Microsoft has published nothing.

Rollback: nothing to roll back. The inventory is read-only.`,
  `${IG}, "Evidence"; Step 1 — "Validate (G1 Inventory)"; "AI agents"; "Rollback"; ${WB}, Chapter 01 — "Which cloud and which directory, for this read."`);
}
endModule(SG1);

// ================================================================== 9 G2: the matrix
{
  const s = content(SG2, "G2: five targets, decided by type and where it runs");
  tag(s, "What");
  const tb = table(s, "Matrix", 1.45, [3.75, 4.2, 4.2], ["What you found", "Where the workload runs", "Target"], [
    ["Disabled, unused, or no owner after Step 1", "Anywhere", "Retire (G6)"],
    ["Traditional account", "Azure resource", "Managed identity, user-assigned preferred"],
    ["Traditional account calling Entra-protected APIs", "A host with an OIDC issuer: GitHub Actions, Kubernetes, Google Cloud, AWS", "App registration with a federated credential"],
    ["Traditional account calling Entra-protected APIs", "No issuer and not in Azure, such as an on-premises scheduler", "App registration with a certificate, or a managed identity if Arc-enabled"],
    ["Traditional account, Kerberos only", "On premises", "gMSA, or a dMSA on a Windows Server 2025 domain"],
    ["MSA", "On premises", "gMSA first: an MSA or gMSA can't be migrated to a dMSA"],
    ["gMSA or dMSA", "Staying on premises; hybrid", "Keep; a hybrid gMSA adds an app registration for the cloud calls"],
    ["App registration with a client secret", "Any", "A managed identity, then federation, then a certificate"],
  ], { fontSize: 11, limit: 5.95 });
  line(s, "Order", "High-risk accounts first. A gMSA needs a KDS root key; domain controllers wait up to 10 hours after it's created before allowing a gMSA.",
    tb + 0.12, 0.55, 13.5);
  sources(s, "Sources: Implementation guide, Step 2 (the decision table condensed from Book 02, Ch 09; order of work; gMSA prerequisites, Learn footnoted).");
  notes(s,
`G2 gives every identity one of five ends: retire it; convert it to a gMSA, or a dMSA on a Windows Server 2025 domain; or move it to a managed identity, a federated credential or a certificate credential. Book 02's migration path matrix decides by account type and by where the workload runs. Its rule: no stored secrets; managed identities for Azure-hosted workloads; federation where the workload already has a trusted issuer; certificates only where neither applies.

The table is the guide's, condensed from Book 02. Anything disabled, unused or still unowned after Step 1 is retired, through G6. A traditional account on an Azure resource moves to a managed identity, user-assigned preferred. One calling Entra-protected APIs from a host with an OIDC issuer, GitHub Actions, Kubernetes, Google Cloud, AWS or another OIDC platform, gets an app registration with a federated credential; with no issuer and not in Azure, a certificate, or a managed identity if the host is Arc-enabled. A Kerberos-only account on premises goes to a gMSA or a dMSA. An MSA is upgraded to a gMSA first, because an MSA or gMSA can't be migrated to a dMSA. A gMSA or dMSA staying on premises is kept, and a hybrid gMSA adds an app registration for its cloud calls. An app registration with a client secret is re-credentialed to a managed identity, then federation, then a certificate.

Order of work: high-risk accounts first, password never expires or over-privileged. And plan the gMSA prerequisite. A gMSA needs a KDS root key, created once per domain, and Learn says domain controllers wait up to ten hours after it's created before they allow a gMSA. Microsoft recommends gMSAs for on-premises services unless a service doesn't support them, and says to test first.`,
  `${IG}, Step 2 — the decision table, "Order of work," "Prerequisites for a gMSA"; Book 02, Chapter 09 — "The migration path matrix"; Chapter 10 — "Phase 4."`);
}

// ================================================================== 10 G2 in code
{
  const s = content(SG2, "G2 in code: propose, check each decision, plan waves");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, FULL, cap("03-3", [2, 3, 4, 5, 6, 7], { max: NFULL, mode: "wrap" }),
    { label: "CHAPTER 03, LAB 1, STEP 3 (CHAPTERS 01 AND 02 RUN FIRST, NOT SHOWN; LONG LINES WRAPPED)", pt: 10.5 });
  const c2 = code(s, "Find", 0.6, c1 + 0.15, 5.6, cap("03-5", [1, 2, 3, 4, 6, 9, 10, 12, 14]),
    { label: "STEP 5: THE SEVEN FINDINGS (WARN AND INFO ROWS LEFT OUT)", pt: 10.5 });
  panel(s, "Apart", 6.4, c1 + 0.15, 6.35, null, HEX.navy, HEX.navyTint, "THREE THINGS KEPT APART", null, [
    "The proposal (N2.1): the matrix's target, by type, location and credential",
    "The disposition (D-N3): the application owner's: retire, re-platform, keep with an end date, or keep on Kerberos with an SPN owner",
    "The gate: every account decided, HIGH-risk in wave 1, a rollback per wave, the Premium scope decided",
    "Two reads (a user, the subscriptions); no writes",
  ], 11.5);
  if (process.env.FIT) console.log(`  matrix bottom ${c2.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 03 (the decisions the code holds; the rules; Lab 1, steps 3 and 5); data/kit-captures/npi/03-3, 03-5.");
  notes(s,
`Chapter 03 holds Book 02's matrix as reviewed data, config/migration-matrix.json, and keeps three things apart that are easy to blur. The proposal, plan task N2.1, comes from the matrix. The disposition, decision D-N3, is the application owner's, account by account: retire, re-platform, keep with an end date, or keep on Kerberos with an SPN owner and an end date the authorizing official accepts. An owner may choose a target the matrix didn't propose, with a reason. And the gate is the ISSO's.

Step 3 runs Chapters 01 and 02, then the matrix. Twenty-one identities are in scope and twenty get a proposal; three are handed off, one waits for confirmation and ten are out of scope. Eighteen of twenty-two have a disposition. Two waves are planned. The Workload ID Premium decision is Tier 1, with two identities in scope and two units held. Seven Findings, four Warns, one Info, and the gate is not met, with the open findings counted per criterion.

The seven Findings on the slide: svc-hrsync is HIGH-risk but in wave 2; svc-oldftp has no disposition; svc-webfront is kept on Kerberos with no SPN owner; dmsa-hrsync$ is kept with no end date before AD retires; HR Connector has no proposal, because nobody recorded where it runs; wave 2 has no rollback owner; and Vendor Portal is on the premium list but is multitenant, so Conditional Access can't cover it.

The code reads two things, the SPN and rollback owners with User.Read.All, and the tenant's subscriptions with LicenseAssignment.Read.All, and it writes nothing.`,
  `${WB}, Chapter 03 — "The decisions the code holds," "The proposal," "The disposition and the waves," "Gate 2," "Lab 1," steps 3 and 5.`);
}

// ================================================================== 11 G2: requirement, evidence, rollback
{
  const s = content(SG2, "G2: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.85, 6.3], ["Requirement this gate feeds (inference)", "What the ISSO keeps"], [
    ["IA-5 Authenticator Management: managed identities and federation first, no new secrets", "Each row's target, in the order the matrix sets"],
    ["AC-2(3) Disable Accounts: orphaned and retired identities are disabled", "Retire decisions, carried out in G6's decommission tickets"],
    ["Book 02's Phase 4: the books' gate for service accounts", "The record: a target and a decide-by date per row"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 5.95;
  const p1 = panel(s, "Validate", 0.6, tb + 0.2, w, null, HEX.amber, HEX.amberTint, "VALIDATE (G2)", null, [
    "Every row in the Step 1 record has a target and a decide-by date",
    "VK-NPI-06: every high-risk AD account is in the first conversion wave, or retired",
    "VK-NPI-03: every app holding secrets has a credential target, or an exception naming why it can't move",
    "Owner: the application owner, with the identity governance office",
  ], 11.5);
  const p2 = panel(s, "Avail", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "AVAILABILITY, INTERIM PATH, ROLLBACK", null, [
    "Workload ID Premium: in Azure Government through the account manager; its free trial isn't",
    "dMSA: only on a Windows Server 2025 domain, and every host must support it",
    "Interim: keep on Kerberos, islanded, with an SPN owner and an end date the authorizing official accepts",
    "Rollback: re-decide; the record keeps the history; each wave records its own rollback",
  ], 11.5);
  if (process.env.FIT) console.log(`  G2 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, \"Evidence,\" Step 2, Validate (G2), \"Licenses,\" \"Rollback\"; Developer workbook, Ch 03 (disposition, waves, D-N4, cloud).");
  notes(s,
`G2's federal side. The guide's evidence table maps by requirement, not by gate, so which rows G2 feeds is our reading, marked inference.

IA-5, authenticator management: the guide's row reads managed identities and federation first, certificates in a vault, no new secrets. G2's targets set that order for every identity. AC-2 enhancement 3, disable accounts: orphaned and retired identities are disabled, so the retire decisions here become G6's decommission tickets. And Book 02's Phase 4 is the books' gate for service accounts; the record, a target and a decide-by date for every row, is what it reads.

Validate. Every row in the Step 1 record has a target and a decide-by date. VK-NPI-06: every high-risk AD account, password never expires or a password older than the threshold, is scheduled in the first conversion wave or retired. VK-NPI-03 lists apps that hold secrets; each one has a credential target, or an exception record naming why it can't move. The gate owner is the application owner, with the identity governance office.

Availability. The guide says Workload ID Premium is available in Azure Government clouds through the account manager, and its free trial isn't; Chapter 03 adds that a GCC tenant signs in to the worldwide cloud, so the trial question for it is a test-tenant check. A dMSA needs a Windows Server 2025 domain, and every host that uses it must support dMSAs.

Interim path: the workbook's keep-on-Kerberos disposition, islanded with an SPN owner and an end date the authorizing official accepts. Rollback: re-decide; the record keeps the history. Chapter 03 also records each wave's rollback from its members' targets.`,
  `${IG}, "Evidence"; Step 2 — "Validate (G2 Decision)"; "Licenses"; "Rollback"; ${WB}, Chapter 03 — "The decisions the code holds," "Which cloud, for these reads," "The disposition and the waves."`);
}
endModule(SG2);

// ================================================================== 12 G3: the tenant policy
{
  const s = content(SG3, "G3: the tenant policy blocks secrets, caps certificates");
  tag(s, "What");
  const c1 = code(s, "Diff", 0.6, 1.45, FULL, cap("04-5", "all", { max: NFULL }),
    { label: "CHAPTER 04, LAB 1, STEP 4: THE POLICY DIFF AGAINST A FICTIONAL TENANT (EFFECTIVE DATE 2026-11-15)", pt: 10.5 });
  const tb = table(s, "Scuba", c1 + 0.2, [3.3, 5.0, 3.85], ["ScubaGear 2.0.0 (SHOULD)", "Checks", "The program's policy"], [
    ["MS.AAD.5.5v1", "Application password addition blocked", "New secrets blocked"],
    ["MS.AAD.5.6v1", "Password lifetime at most 180 days", "No new secrets at all"],
    ["MS.AAD.5.7v1", "Certificate lifetime at most 365 days", "The 180-day cap meets it"],
  ], { fontSize: 11.5, limit: 5.95 });
  line(s, "Two", "Two rotation numbers: an existing workload moves onto a certificate rotated at least yearly while it's fixed; every new registration starts under the 180-day cap.",
    tb + 0.12, 0.55, 13.5);
  sources(s, "Sources: Implementation guide, Step 3, steps 1–3; Developer workbook, Ch 04 (the program's policy; Lab 1, step 4); data/kit-captures/npi/04-5.");
  notes(s,
`G3 sets the credential rules. The program's rules are design guidance from the books: no long-lived secrets; managed identities first, then federated credentials, then certificates, with client secrets only by documented exception; and every certificate in a vault and on a rotation calendar.

Step 1 turns on the application management policy: a tenant-wide default that blocks new password secrets and symmetric keys and caps new certificates at 180 days. Those are Microsoft's recommended settings and the program's choice. Each restriction can apply only to apps created after a chosen date; set it to the policy's effective date, so the rule binds new registrations while the old ones are fixed in G5. The policy covers agent identity blueprints too, which are application objects.

The panel is the workbook's Chapter 04 diff, from Lab 1 against a fictional tenant whose default policy is disabled. Turning it on is a Change; every restriction is an Add, on both application and service principal objects, because Learn's admin center expects the two copies of a restriction in the same state. The tenant's customPasswordAddition, which the reviewed file doesn't name, is kept: the PATCH never drops or loosens a restriction.

Step 2 reconciles two rotation numbers. Book 02 allows annual rotation for certificates on accounts being migrated, and Book 04 caps new ones at 180 days. An existing workload moves onto a certificate rotated at least yearly while it's fixed, and every new registration starts under the cap.

Step 3 maps the policy to SCuBA. ScubaGear 2.0.0 checks three SHOULD policies, MS.AAD.5.5v1 to 5.7v1. None is a BOD 25-01 required configuration. The 180-day cap meets MS.AAD.5.7v1.`,
  `${IG}, Step 3 — the program's rules, steps 1–3; ${WB}, Chapter 04 — "The rules the code holds," "The policy: read, compare, plan," "Lab 1," step 4; Book 04, Chapter 05; Book 17, Chapter 06.`);
}

// ================================================================== 13 G3: vault, upload, exceptions
{
  const s = content(SG3, "G3: the vault, the upload, and secrets by exception");
  tag(s, "How");
  const w = 3.9, g = 0.225;
  const p1 = panel(s, "Vault", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "STEPS 4–5: VAULT TO DIRECTORY", null, [
    "Private keys in Azure Key Vault or an HSM, never on a file share",
    "Key Vault renews automatically only self-signed or partnered-CA certificates (DigiCert, GlobalSign); an agency PKI's get email alerts",
    "A renewed certificate doesn't change the app registration: automate the upload, or make it a named owner's dated task",
  ], 12);
  const p2 = panel(s, "Secrets", 0.6 + w + g, 1.45, w, null, HEX.red, HEX.redTint, "STEP 6: SECRETS BY EXCEPTION", null, [
    "Approved by the identity governance office and the CISO",
    "At most six months; never renewed automatically",
    "While it exists: in Key Vault, with the shortest lifetime the app tolerates and automated rotation",
  ], 12);
  const p3 = panel(s, "AD", 0.6 + 2 * (w + g), 1.45, w, null, HEX.teal, HEX.tealTint, "STEPS 7–8: AD AND FEDERATION", null, [
    "A gMSA's password: 240 random bytes, changed every 30 days by default; the interval is set only at creation",
    "A traditional account that stays: a long random password in the vault, a rotation owner and a date",
    "A new federated credential is a credential change: approved, issuer and subject recorded, audience api://AzureADTokenExchange",
  ], 12);
  callout(s, "Never", Math.max(p1, p2, p3) + 0.25, 0.95, "FaKey", HEX.amber, "Password never expires: ",
    "removed, or carried with a dated exception (design guidance). Which CA signs workload certificates is Book 07's decision.");
  sources(s, "Sources: Implementation guide, Step 3, steps 4–8 (Learn footnoted: Key Vault autorotation; Arc certificate rotation; gMSA passwords); Book 04, Ch 06.");
  notes(s,
`The rest of G3 is about where credentials live and how they change.

Step 4 puts certificates in a vault: private keys in Azure Key Vault or an HSM, never on a file share. Learn says Key Vault renews certificates automatically only when they're self-signed or come from a CA partnered with Key Vault, DigiCert and GlobalSign. Certificates from other CAs, including an agency PKI, aren't renewed automatically; their lifetime action can still send email alerts before expiry. Which CA signs workload certificates is the cryptographic architecture's decision, in Book 07.

Step 5 closes the loop between vault and directory. A renewed certificate in Key Vault doesn't by itself change the credential on the app registration. Microsoft's own procedure for SQL Server on Arc uploads the new certificate to the app registration as a separate step and removes the old one after 24 hours. So automate that upload in the pipeline, or make it a named owner's task with a date.

Step 6: secrets by exception only. A client secret needs the identity governance office and the CISO to approve it, lasts at most six months and is never renewed automatically. While it exists, keep it in Key Vault with the shortest lifetime the app tolerates and automated rotation.

Step 7, the AD side. A gMSA's password is 240 bytes, randomly generated, and changed by Windows every 30 days by default; the interval can be set only when the account is created. A traditional account that has to stay gets a long random password in the vault, a rotation owner and a date, and password never expires is removed or carries a dated exception, which is design guidance.

Step 8: a new federated credential is a credential change. It needs the owner's and the governance office's approval, its issuer and subject are recorded, and its audience is api://AzureADTokenExchange.`,
  `${IG}, Step 3, steps 4–8; Book 04, Chapter 05 — "Workload identity federation"; Chapter 06 — "Exceptions"; Book 02, Chapter 09 — "Workload identity federation"; Book 07.`);
}

// ================================================================== 14 G3 in code
{
  const s = content(SG3, "G3 in code: compare the policy, plan the rotation");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, FULL, [...cap("04-4", "all", { max: NFULL }), ...cap("04-7", "all", { max: NFULL })],
    { label: "CHAPTER 04, LAB 1, STEPS 3 AND 6 (AFTER CHAPTER 01'S STEP 3); LONG COMMANDS CONTINUED WITH `", pt: 10.5 });
  const c2 = code(s, "Plan", 0.6, c1 + 0.15, 5.2, cap("04-8", [1, 2, 3, 4, 5, 6, 7, 8, 9]),
    { label: "STEP 7 OUTPUT (COMMAND LEFT OUT)", pt: 10.5 });
  panel(s, "Rot", 6.0, c1 + 0.15, 6.75, null, HEX.navy, HEX.navyTint, "A ROTATION, STEP BY STEP (DESIGN GUIDANCE)", null, [
    "Raised 60 days before expiry; approved by an owner who is an enabled member",
    "Key Vault makes the next version from its own policy; the new certificate goes on beside the old one",
    "The owner records the workload signs in with it; 7 days later the old one comes off",
    "Secrets are replaced, not rotated",
  ], 11.5);
  if (process.env.FIT) console.log(`  rotation bottom ${c2.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 04 (the policy plan; rotation; the separate write path; Lab 1, steps 3, 6 and 7); data/kit-captures/npi/04-4, 04-7, 04-8.");
  notes(s,
`Chapter 04 holds the policy as reviewed JSON, config/app-management-policy.json, compares it with the tenant, and turns the difference into a plan. It starts from Learn's Graph samples for the default policy and app management policies, and its configuration procedure, pinned and sent to fakes.

Step 3, against the fictional tenant: the default is disabled, one app management policy exists, seven app registrations. The diff has six Adds, one Change and one KeepExisting. Twelve Findings, one Warn, one Info. The plan has ten actions, eight of them writes: the default policy PATCH; one exception policy, with a record number and an end date, created and assigned; and the app instance property lock on five apps. Nothing is sent, and the plan's hash is what a reviewer approves. The one Warn is an app management policy nobody reviewed; the plan reports it and never touches it.

Step 6 builds the rotation plan. Book 04's rule is that rotation is raised automatically before expiry and approved by the owner. Key Vault can renew on a schedule, but Entra ID renews nothing on the app registration, so the code joins the two: a request raised 60 days before expiry, an owner's approval, the next version from the vault's own policy, the new certificate added beside the old one, the owner's record that the workload signs in with it, and the old one removed seven days later. The numbers are design guidance.

Step 7: Vendor Portal's certificate is renewed in Key Vault; Deploy Bot's new one is attached; HR Connector's old one is removed. Legacy Reports' certificate isn't in the vault and lasts 730 days, and three apps still hold secrets, which are replaced, not rotated. The write path is delegated, needs the approved hash, and never sends DELETE.`,
  `${WB}, Chapter 04 — "The policy: read, compare, plan," "Rotation: the plan," "The separate write path," "Lab 1," steps 3, 6 and 7.`);
}

// ================================================================== 15 G3: requirement, evidence, rollback
{
  const s = content(SG3, "G3: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.85, 6.3], ["Requirement", "What the ISSO keeps"], [
    ["IA-5 Authenticator Management; IA-5(2): managed identities and federation first, certificates in a vault and rotated, no new secrets", "The app management policy export; VK-NPI-02 and VK-NPI-03 runs; the rotation calendar"],
    ["CISA SCuBA MS.AAD.5.5v1 to 5.7v1 (SHOULD, ScubaGear 2.0.0)", "The ScubaGear report; VK-NPI-02"],
    ["AU-2, AU-6, AU-12: credential changes are logged and reviewed", "Audit entries for credential adds, in logs routed to the SIEM"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 5.95;
  const p1 = panel(s, "Validate", 0.6, tb + 0.2, w, null, HEX.amber, HEX.amberTint, "VALIDATE (G3)", null, [
    "VK-NPI-02: nothing issued after the effective date runs past the cap; every credential expiring within 60 days (design guidance) has an owner and a renewal date",
    "VK-NPI-03: every app still on secrets is in a Step 5 wave or has an exception with an end date",
    "The ScubaGear result for MS.AAD.5.5v1 to 5.7v1, filed with the gate",
  ], 11.5);
  const p2 = panel(s, "Avail", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "AVAILABILITY, INTERIM PATH, ROLLBACK", null, [
    "App management policies: free; the policy pages list the global service, US Government L4 and L5",
    "Key Vault: vault.azure.net for GCC's commercial Azure, vault.usgovcloudapi.net in Azure Government",
    "Interim: yearly rotation while a workload is fixed; secrets by exception, six months at most",
    "Rollback: a per-application policy exception with an end date, in the exception register",
  ], 11.5);
  if (process.env.FIT) console.log(`  G3 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, \"Evidence,\" Step 3, Validate (G3), \"Licenses,\" \"Rollback\"; Developer workbook, Ch 04 (licensing; which cloud).");
  notes(s,
`G3's federal side.

IA-5, authenticator management, and IA-5 enhancement 2: managed identities and federation first, certificates in a vault and rotated, no new secrets. The ISSO keeps the application management policy export, the VK-NPI-02 and VK-NPI-03 runs, and the rotation calendar. CISA's SCuBA policies MS.AAD.5.5v1 to 5.7v1 are SHOULD policies in ScubaGear 2.0.0: no app passwords, password and certificate lifetimes capped; the evidence is the ScubaGear report and VK-NPI-02. And AU-2, AU-6 and AU-12 cover credential changes: the evidence is the audit entries for credential adds, in logs routed out of Entra ID to the SIEM.

Validate. VK-NPI-02 reports each secret and certificate with its lifetime and days to expiry. Pass: no credential issued after the policy's effective date runs longer than the cap, 180 days for certificates and no new secrets, and every credential that expires within N days, where the program uses 60, design guidance, has an owner and a renewal date. VK-NPI-03 reports apps that still use secrets; each is either in a Step 5 wave or has an exception with an end date. The ScubaGear result for MS.AAD.5.5v1 to 5.7v1 is filed with the gate.

Availability. The guide lists application management policies as free, and the workbook's Chapter 04 says every policy page it calls lists the global service, US Government L4 and L5. Key Vault's host is vault.azure.net in commercial Azure, which GCC's estate uses, and vault.usgovcloudapi.net in Azure Government.

Interim path: existing workloads move onto certificates rotated at least yearly while they're fixed, and secrets live only by exception, six months at most. Rollback: a per-application policy exception with an end date, in the exception register.`,
  `${IG}, "Evidence"; Step 3 — steps 2 and 6, "Validate (G3 Credential rules)"; "Licenses"; "Rollback"; ${WB}, Chapter 04 — "The rules the code holds," "Which cloud, for these reads and writes."`);
}
endModule(SG3);

// ================================================================== 16 Handoff
{
  const s = content(SC, "Handing G1–G3 to Part 2");
  tag(s, "How");
  const tb = table(s, "Pack", 1.45, [2.1, 5.25, 4.8], ["Gate", "In the evidence file", "What Part 2 reads from it"], [
    ["G1 Inventory", "The record: owners, sponsors, risk; the register and its manifest; the Data Platform hand-off", "G4 restores a removed grant from the Step 1 export; G6 runs the orphan rule; SQL Server and AI agents join their records"],
    ["G2 Decision", "A target and a decide-by date per row; the waves and their rollback; the Workload ID Premium scope", "G4 licenses Tier 1 single-tenant service principals; G5 converts wave by wave, with a 30-day parallel run"],
    ["G3 Credential rules", "The policy export; the rotation calendar; exceptions with end dates; the ScubaGear result", "G5 removes a secret once the new credential carries traffic; G6 runs VK-NPI-02 weekly"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Next", tb + 0.25, 1.2, "FaRoute", HEX.teal, "Next: ",
    "Part 2 takes G4 to G6, then SQL Server, AI agents, the evidence and rollback. To build Part 1's code: Building Non-Person Identity, Chapters 01 to 04, each with its labs and a narrated tour.");
  sources(s, "Sources: Implementation guide, \"Evidence,\" \"Rollback,\" Steps 4–6, \"SQL Server,\" \"AI agents\"; Developer workbook, index (chapters; tours).");
  notes(s,
`To close Part 1, here's what each gate leaves in the evidence file, and what Part 2 reads from it.

G1 leaves the record, with owners, sponsors and risk, the register and its manifest, and the Data Platform hand-off of SQL Server accounts. In G4, a removed grant is restored only through approval, from the Step 1 export. G6 runs the orphan rule over the ownership findings, and Part 2's SQL Server and AI agent sections join their principals and agents to records in Step 1.

G2 leaves a target and a decide-by date for every row, the waves and their rollback, and the Workload ID Premium scope. G4 assigns Tier 1 single-tenant service principals directly to workload identity policies, which needs Premium. G5 is Book 02's Phase 4: it converts wave by wave, runs old and new in parallel for 30 days, and disables the legacy account rather than deleting it.

G3 leaves the policy export, the rotation calendar, the exceptions with their end dates and the ScubaGear result. In G5, an app registration losing a secret drops it only after the new credential has carried production traffic, and in G6 VK-NPI-02 runs weekly, so no production credential expires unplanned.

Part 2 covers least privilege, conversion and the lifecycle, then SQL Server's service and application principals, AI agents, the evidence an assessor reads, and rollback.

To build Part 1's code, use the developer workbook, Building Non-Person Identity: Chapters 01 to 04, each with a fixture lab and a test-tenant step, and each with a narrated chapter tour. The Labs page lists every lab with what it needs.`,
  `${IG}, "Evidence"; "Rollback"; Steps 4–6; "SQL Server service and application principals"; "AI agents"; ${WB}, index — "Chapters," "Narrated chapter tours."`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation and G1", [
  "Non-Person Identity: An Implementation Guide: \"In this guide,\" \"How to read this guide\" (the validation kit), \"The track at a glance,\" \"Prerequisites\" (the record, roles, licenses), \"The path on one page,\" Step 1 (1a–1f, Validate), \"AI agents,\" \"Evidence,\" \"Rollback.\"",
  "Microsoft Learn pages the guide footnotes for G1: servicePrincipal properties (servicePrincipalType); securing managed identities; managed identities FAQ; RBAC overview, governing workload identities (all read October 29, 2026).",
  "Developer workbook, Building Non-Person Identity: index (chapters, plan gates); Chapter 01 (the register; risk, targets and stale leads; the findings; which cloud; Lab 1); Chapter 02 (the rule the code holds; the check; the orphan rule as a plan; Lab 1).",
  "examples/non-person-identity: Invoke-NpiInventory.ps1, Invoke-NpiOwnership.ps1, config/register.json, config/calls.json, tests/fixtures/estate.json and tests/fixtures/inputs. Captures: data/kit-captures/npi/01-3, 01-4, 02-4, 02-5, 02-6.",
  "Design guidance in this part: the system inventory as master; the federal sponsor for every identity; the CMDB owner's sign-off; the risk rule and candidate targets; the orphan plan's claim window; the 60-day renewal window; the 7-day overlap.",
]);
sourceSlide("Sources: G2", [
  "Non-Person Identity: An Implementation Guide: Step 2 (the decision table, order of work, gMSA prerequisites, Validate); \"Licenses\" (Workload ID Premium in Azure Government); \"Evidence\"; \"Rollback.\"",
  "Microsoft Learn pages the guide footnotes for G2: Create a KDS root key; Secure group managed service accounts; Workload ID FAQ (all read October 29, 2026).",
  "Book 02, Ch 09 (the migration path matrix); Ch 10 (Phase 4, order of work); Book 04, Ch 05 (managed identities).",
  "Developer workbook, Chapter 03 (the decisions the code holds; the proposal, N2.1; the disposition, D-N3, and the waves, N2.2; the Workload ID Premium scope, D-N4; Gate 2; which cloud; Lab 1, steps 3 and 5).",
  "examples/non-person-identity: Invoke-NpiMatrix.ps1, config/migration-matrix.json, config/calls-ch03.json, tests/fixtures/ch03. Captures: data/kit-captures/npi/03-3, 03-5.",
]);
sourceSlide("Sources: G3 and the handoff", [
  "Non-Person Identity: An Implementation Guide: Step 3 (the program's rules, steps 1–8, Validate); \"Evidence\"; \"Licenses\"; \"Rollback\"; Steps 4–6, \"SQL Server service and application principals\" and \"AI agents\" (for the handoff).",
  "Microsoft Learn pages the guide footnotes for G3: application management policies (roles); Key Vault certificate autorotation; Rotate certificates (SQL Server enabled by Azure Arc); Secure group managed service accounts; Service accounts, password policy (all read October 29, 2026).",
  "Book 04, Ch 05 (credentials; app management policies; workload identity federation); Ch 06 (exceptions); Book 17, Ch 06 (enforcing the order; SCuBA MS.AAD.5.5v1 to 5.7v1); Book 02, Ch 09; Book 07.",
  "Developer workbook, Chapter 04 (the rules the code holds; the policy plan; rotation; the separate write path; which cloud; Lab 1, steps 3, 4, 6 and 7). examples/non-person-identity: Invoke-NpiCredentialPolicy.ps1, Invoke-NpiRotation.ps1, config/app-management-policy.json, config/rotation.json, tests/fixtures/ch04.",
  "Captures: data/kit-captures/npi/04-4, 04-5, 04-7, 04-8. Part 2: Non-Person Identity — implementation, Part 2 (G4–G6, SQL Server, AI agents, evidence, rollback).",
]);

finish(OUT);
