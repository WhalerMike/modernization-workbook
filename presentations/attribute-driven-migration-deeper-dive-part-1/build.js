// Companion guide — Attribute-Driven Migration to Entra ID, DEEPER DIVE IMPLEMENTATION, PART 1:
// reading the tree to flowing attributes (implementation guide Gates 0–3), with a current-state baseline.
//   Orientation:                the four gates on one page.
//   Current-state baseline:     tracing real joiner, mover and leaver events; where each number comes from.
//   Gate 0 — Read the tree:     the Start Kit run and output; the decision record; what the overview simplified.
//   Gate 1 — Schema and slots:  the user slot register; one store, one writer, one owner.
//   Gate 2 — Prove:             the HR checks and their inputs; reading a failing check; threshold, writers, logs.
//   Gate 3 — Sync:              landing zones and mappings; the /bulkUpload record; the match trap and the
//                               Connect Sync deadline; proving it flowed and backing it out.
//   Close:                      the handoff to Part 2 (Gates 4–6).
// Sources: docs/project-plans/developer-workbooks/attribute-driven-migration/implementation-guide.md and its plan
// (data/project-plans/attribute-driven-migration.yaml), the companion guide, the chapters they cite, the research page
// docs/books/guides/hcm-entra-implementation.md, and examples/ (start-kit, validation-kit, hcm-entra). No new external facts.
// The slide helpers come from the technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/attribute-driven-migration-deeper-dive-part-1/build.js \
//                      presentations/attribute-driven-migration-deeper-dive-part-1/Attribute_Driven_Migration_Deeper_Dive_Part_1.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Attribute-Driven Migration to Entra ID — Deeper Dive Implementation, Part 1",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration — Deeper Dive, Part 1: Gates 0–3",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Attribute_Driven_Migration_Deeper_Dive_Part_1.pptx";
const IG = "Attribute-Driven Migration implementation guide";

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
const SB = "Current-state baseline";
const SG0 = "Gate 0 — Read the tree";
const SG1 = "Gate 1 — Schema and slots";
const SG2 = "Gate 2 — Prove the attributes";
const SG3 = "Gate 3 — Map through sync";
const SC = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Part 1: Reading the tree to flowing attributes", "Attribute-Driven Migration to Entra ID — deeper dive implementation, Gates 0–3");
  txt(s, "Session map", [
    { text: "Current-state baseline   ·   Gate 0 Read the tree   ·   Gate 1 Schema and slots", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Gate 2 Prove the attributes   ·   Gate 3 Map them through sync", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 2: Gates 4–6  ·  Part 3: Gates 7–9", options: { color: HEX.ink, breakLine: true } },
    { text: "Commands, slots, checks and rollback  ·  design guidance labeled as such", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 9.6, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 1 of the deeper dive implementation of the Attribute-Driven Migration to Entra ID. The two-part technical deep dive explained the model and the four tracks. This series goes one level down, to the work an engineer actually runs: the commands, the attribute slots, the validation checks and what their output looks like, and the rollback for each step.

It follows the implementation guide's ten gates and the project plan that schedules them, with its task IDs, A zero point one onward, and its decisions, D-A1 onward. Part 1 covers Gates 0 to 3: reading the OU tree, fixing the schema and the coded slots, proving the attributes are true, and mapping them through sync. Before Gate 0 it adds something the guide assumes but doesn't spell out: a baseline of how joiners, movers and leavers are handled today, measured from real events. Part 2 covers Gates 4 to 6, and Part 3 Gates 7 to 9.

Two labels apply throughout. Facts come from the workbook's chapters, guides and example code, and the program's own recommendations are marked design guidance. The example code is illustrative and fixture-tested, not proven against a live tenant.`,
  `${IG}, "In this guide," "How to use this guide," "The path on one page"; project plan, Attribute-Driven Migration.`);
}

// ================================================================== 2 Gates on one page
{
  const s = content(S0, "Gates 0–3 on one page: done when, proved by");
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [1.75, 3.55, 2.85, 1.6, 2.4], ["Gate", "Done when", "Validate with", "Plan tasks", "Rollback"], [
    ["0 The tree read", "The tree's encoding in Git, split by track, with a decision for every group", "Start Kit counts; VK-INT-07 (beta, Intune track); VK-NPI-06 (non-person track)", "A0.1–A0.4, AG0", "Nothing: read-only"],
    ["1 Schema and slots", "Every attribute that drives access has one store, one writer and one owner", "VK-HR-01 and VK-HR-04 (the key's carrier)", "A1.1–A1.4, D-A1, D-A2, AG1", "Change a slot only before a rule reads it"],
    ["2 Attributes proven", "Threshold met on the pilot; other writers removed; logs leaving Entra ID", "VK-HR-01 to 04", "A2.1–A2.3, D-A3, AG2", "Restore a write permission by recorded change, with an end date"],
    ["3 Attributes flowing", "Every slot arrives in Entra ID as HR sent it; shadow differences explained", "VK-SYNC-01 on a sample, with the sync reconciliation report", "A3.1, AG3", "Scope the population back out; never delete synced users"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Key", tb + 0.25, 0.95, "FaIdCard", HEX.navy, "The worked key: ",
    "an existing enterprise ID the agency already issues, carried in employeeId (at most 16 characters). The guide's placeholder value is E0042137.");
  sources(s, "Sources: Implementation guide, \"The path on one page,\" \"Rollback at a glance,\" \"One identifier through every gate\"; project plan tasks A0.1–A3.1; Book 03, Ch 04.");
  notes(s,
`Here are the four gates of Part 1 on one page, as the implementation guide lays them out. Each one has a done-when statement, a validation step, the plan tasks it carries out, and a rollback.

Gate 0, the tree read, is done when the tree's encoding is in Git, split by track, with a decision for every group. The Start Kit's counts prove it. VK-INT-07, a beta check the Intune track runs, reads Group Policy analytics for the computer half of the GPO split, and VK-NPI-06, which the non-person track runs, lists the AD service accounts to hand over. Plan tasks A0.1 to A0.4, gate AG0. Nothing to roll back: it's read-only.

Gate 1, schema and slots, is done when every attribute that drives access has one store, one writer and one owner. VK-HR-01 and VK-HR-04 measure the key's carrier. Decisions D-A1, the schema, and D-A2, the slot register. Rollback: a slot can change only until a rule reads it.

Gate 2, attributes proven, is done when the correlation threshold is met on the pilot, the other writers are removed and logs are leaving Entra ID. VK-HR-01 to 04 prove it, and D-A3 is the threshold. Rollback is a recorded change that restores a write permission, with an end date.

Gate 3, attributes flowing, is done when every slot arrives in Entra ID as HR sent it and shadow differences are explained. VK-SYNC-01 compares the coded slots for a sample of users in AD with the same slots in Entra ID; it reads values, not the sync configuration, so the sync reconciliation report still covers the rest. Rollback: scope the population back out, and never delete synced users in Entra ID.

One identifier runs through every gate: the enterprise person key, an existing enterprise ID the agency already issues, carried in employeeId, which holds at most 16 characters. The guide uses E0042137 as a placeholder for the analyst's key.`,
  `${IG}, "The path on one page," "Rollback at a glance," "One identifier through every gate"; Book 03, Chapter 04 — "One person, layered identifiers."`);
}
endModule(S0);

// ================================================================== 3 Baseline: trace events
{
  const s = content(SB, "Baseline: trace the last real events, not the process");
  tag(s, "Why");
  const tb = table(s, "Trace", 1.45, [1.0, 3.95, 2.85], ["Event", "Trace each timestamp, from the record", "The number it gives today"], [
    ["Joiner", "HR hire action date → ticket → account created → groups added → device assigned", "Joiner readiness: account, licenses and baseline access at the start of day one"],
    ["Mover", "HR transfer effective date → ticket → groups added and removed → old access reviewed", "Transfer-to-review interval"],
    ["Leaver", "HR separation effective date → ticket → account disabled → sessions and credentials revoked", "Separation-to-block and separation-to-revocation intervals"],
  ], { fontSize: 12.5, limit: 6.6 });
  const pb = panel(s, "Ask", 8.65, 1.45, 4.1, null, HEX.amber, HEX.amberTint, "HOW TO ASK (DESIGN GUIDANCE)", null, [
    "\"Show me the last one you did,\" not \"describe the process\"",
    "Real joiner, mover and leaver events from the last 90 days",
    "Each timestamp from a record, not from memory",
    "A step with no record is a finding, not a gap to fill in",
  ], 13.5);
  callout(s, "NoEvents", Math.max(tb, pb) + 0.3, 1.0, "FaUserClock", HEX.red, "Why it has to be traced: ",
    "none of these numbers exists in a ticket-driven estate, because the events they measure aren't recorded as events.");
  sources(s, "Sources: Book 03, Ch 11 (\"The measured lifecycle\": metrics and their definitions); Ch 08. Sampling method and interview rule: design guidance.");
  notes(s,
`Before Gate 0 touches the tree, measure how each task is done today. The implementation guide assumes this baseline but doesn't spell it out, so this slide and the next are the method, labeled design guidance where they go beyond the books.

Trace real events. Take joiner, mover and leaver events from the last 90 days and follow each one through its records. For a joiner: the HR hire action date, the ticket, when the account was created, when groups were added, and when a device was assigned. For a mover: the transfer effective date, the ticket, the group adds and removals, and whether the old access was ever reviewed. For a leaver: the separation effective date, the ticket, when the account was disabled, and when sessions and credentials were revoked.

Each trace gives you one of Book 03's lifecycle metrics as it stands today: joiner readiness, the share of new hires whose account, licenses and baseline access exist at the start of day one; the transfer-to-review interval; and the separation-to-block and separation-to-revocation intervals, which are what PS-4 asks for.

How to ask, as design guidance: "show me the last one you did," not "describe the process." The described process is what people believe happens. The last real one is what does. Take each timestamp from a record, not from memory, and treat a step with no record as a finding.

The reason it has to be traced by hand is Book 03's own point: none of these numbers exists in a ticket-driven estate, because the events they measure aren't recorded as events. That's the gap the whole migration closes.`,
  `Book 03, Chapter 11 — "The measured lifecycle"; Chapter 08 — "Joiner," "Mover," "Leaver." Sampling window and interview rule: design guidance.`);
}

// ================================================================== 4 Baseline evidence
{
  const s = content(SB, "Baseline evidence: where each number comes from");
  tag(s, "How");
  const tb = table(s, "Evidence", 1.45, [2.6, 5.15, 4.4], ["Source", "What it gives the baseline", "Read it with"], [
    ["Start Kit (the forest)", "Users and enabled users; orphaned adminCount accounts; empty groups; stale computers; hand-made OU delegations", "Summary\\StartKitSummary.md, from a Tier A run"],
    ["VK-HR-01 to 04 and an HR export", "Correlation coverage; empty coded slots; counts per organization code against HR; duplicate keys", "Invoke-ValidationKit.ps1 -Track HR with hr-export.csv in the input folder"],
    ["Group-change audit", "Group membership changes and who made them: the mover and leaver trail", "Entra audit log (30 days with P1 or P2) and AD change auditing"],
    ["HR separation vs. disable", "Stale access: terminated in HR, still enabled in the directory; the separation-to-block interval", "The HR extract joined to the directory on employeeId"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Retention", tb + 0.25, 1.0, "FaTriangleExclamation", HEX.red, "The retention trap: ",
    "Entra ID's audit log keeps 30 days with P1 or P2 and isn't retroactive. A 90-day trace leans on HR records, tickets and AD; route the logs out now.");
  sources(s, "Sources: Start Kit README; validation kit README (VK-HR-01–04, inputs); Book 03, Ch 11 (evidence by event, drift classes). 90-day window: design guidance.");
  notes(s,
`Four sources give the baseline its numbers, and all of them are read-only.

The Start Kit reads the forest. Its one-page summary counts users and enabled users, orphaned adminCount accounts, empty groups and stale computers, and its OU output carries the delegations someone made by hand. A Tier A run, a standard account with no added rights, is enough to start.

The validation kit's four HR checks read the tenant. VK-HR-01 gives correlation coverage, enabled accounts without an employee I D. VK-HR-02 gives empty coded slots. VK-HR-03 compares the count of users per organization code with an HR export, a file called hr-export.csv with two columns, the code and the count. VK-HR-04 finds duplicate keys. Run before Gate 1, expect them to fail broadly. That's the baseline, not a problem.

The group-change audit gives the mover and leaver trail: group membership changes and who made them, from the Entra audit log and AD change auditing. Where a specific event ID isn't in the workbook, describe the evidence rather than guess at one.

And the HR separation date against the disable date gives the stale-access class from Book 03's drift table, a worker terminated in HR and still enabled in the directory, and the separation-to-block interval, by joining the HR extract to the directory on the employee I D.

The trap is retention. Entra ID's audit log keeps 30 days with P1 or P2, and it isn't retroactive. So a 90-day trace leans on HR records, tickets and AD, and the first action out of the baseline is to route Entra's logs out, which Gate 2 makes a gate item anyway.`,
  `Start Kit README, "What it counts"; validation kit README, "Inputs"; Book 03, Chapter 11 — "The evidence each event leaves," "Drift between HR and the directory." 90-day window: design guidance.`);
}
endModule(SB);

// ================================================================== 5 Gate 0: Start Kit
{
  const s = content(SG0, "Gate 0: run the Start Kit, read-only, Tier A first");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 7.55, [
    "# Tier A: a standard account with no added rights.",
    "# Test-FMPReadAccess runs first and lists the gaps.",
    ".\\Invoke-FMPStartKit.ps1 -OutputPath D:\\Assessment",
    "",
    "# Tier B: only the narrow, time-bound read delegations",
    ".\\Invoke-FMPStartKit.ps1 -OutputPath D:\\Assessment -Tier B",
    "",
    "# A later run, compared with the first, file by file",
    "Compare-FMPAssessments -BaselinePath <run-1>\\<domain> `",
    "                       -CurrentPath  <run-2>\\<domain>",
  ], { label: "COMMANDS (A0.1)" });
  code(s, "Tree", 0.6, c1 + 0.2, 7.55, [
    "<run-id>\\            YYYY-MM-DD-HHmm-<host>-tierA, in UTC",
    "├── AssessmentManifest.json    SHA-256 of every other file",
    "├── Summary\\StartKitSummary.md  counts, each traced to a file",
    "├── Preflight\\DelegationRequest.md",
    "└── <each domain>\\  OUs\\ GPOs\\ Objects\\ ServiceAccounts\\",
  ], { label: "WHAT A RUN WRITES" });
  panel(s, "Keep", 8.4, 1.45, 4.35, null, HEX.navy, HEX.navyTint, "KEEP FOR GATE 0", null, [
    "Every OU with its size and its non-inherited access-control entries",
    "GPO links at domain, OU and site",
    "\"Not collected\" means not collected, never zero",
    "Tell security operations the window and account first: broad enumeration looks like reconnaissance",
  ], 13);
  sources(s, "Sources: Start Kit README (Run it; rights each part needs; what a run writes); Compare-FMPAssessments help; Implementation guide, Gate 0; Book 02, Ch 07–08.");
  notes(s,
`Gate 0, task A0.1: export the tree. The tool is the Start Kit, and the whole gate is read-only.

Start at Tier A: a dedicated standard account with no added rights. Every run starts with Test-FMPReadAccess, which records what this forest lets a default account read and writes the gaps out as a delegation request. Then the run itself: Invoke-FMPStartKit with an output path. Only if Tier A can't read what Gate 0 needs, for example OUs whose ACLs aren't readable by default, add Tier B, the narrow, read-only, time-bound delegations Book 02's Chapters 07 and 08 describe. The assessment never uses Domain Admins.

Each run lands in a folder named for the date, time, host and tier, in UTC. The manifest is written last and holds the SHA-256 of every other file, so the inventory you commit to Git is provably the one that ran. The summary counts OUs and their delegations, GPOs, empty, unlinked, conflicting and site-linked, users, groups, computers and service accounts, each traced to its source file. A second run compares with the first, file by file, using Compare-FMPAssessments with a baseline path and a current path.

What to keep for Gate 0: every OU with its size and its non-inherited access-control entries, which is where the hand-made delegations live; the GPO inventory with links at domain, OU and site; and the record of what read-only discovery couldn't see. A count that couldn't be collected says "not collected," never zero. And tell security operations the window, the account and the query pattern first, because broad directory enumeration looks like reconnaissance.`,
  `${IG}, Gate 0, steps 1 and Validate; Start Kit README, "Run it," "Rights each part needs," "What a run writes"; Book 02, Chapter 07 — "Recording what read-only discovery couldn't see"; Chapter 08 — "OU hierarchy and delegation."`);
}

// ================================================================== 6 Gate 0: decision record
{
  const s = content(SG0, "Gate 0: the decision record, one row per group");
  tag(s, "Who");
  const tb = table(s, "Groups", 1.45, [3.6, 2.35, 1.95], ["Group characteristic (A0.2)", "Decision", "Why"], [
    ["Used only for on-premises resource ACLs", "Keep in AD; don't sync", "A cloud copy adds nothing"],
    ["Used for on-premises and cloud resources", "Synchronize", "AD stays the source during transition"],
    ["Used only for cloud resources", "Convert to cloud-only", "Removes the AD dependency"],
    ["Membership follows attributes exactly", "Convert to dynamic", "No manual membership"],
    ["No members or no resource assignments", "Retire", "Shrinks the surface"],
  ], { fontSize: 11.5, limit: 6.6 });
  const pb = panel(s, "Map", 8.75, 1.45, 4.0, null, HEX.teal, HEX.tealTint, "OU-TO-UNIT MAP (A0.3) AND TAGS", null, [
    "GPO scoping → Conditional Access and Intune",
    "Delegation → administrative units; over servers, Azure RBAC scopes",
    "Logical organization → attributes and dynamic groups",
    "Tag every OU and GPO half with its track (A0.4)",
  ], 12.5);
  panel(s, "Traps", 0.6, Math.max(tb, pb) + 0.2, 12.15, null, HEX.red, HEX.redTint, "TRAPS TO RECORD; HANDOFFS", null, [
    "A site-linked GPO looks unlinked to an OU-only search. adminCount overstates privilege: it stays set after an account leaves a protected group.",
    "VK-NPI-06 lists AD service accounts with non-expiring or old passwords, SPNs, or a type other than gMSA: those rows go to the non-person track.",
    "VK-INT-07 (Graph beta, -IncludeBeta) lists GPOs in Intune's Group Policy analytics not ready to migrate: its rows feed the computer half of the split.",
  ], 12.5);
  sources(s, "Sources: Book 02, Ch 09 (per-group decision; organizational units; AdminSDHolder); Implementation guide, Gate 0 steps 2–6, Validate, Evidence.");
  notes(s,
`The rest of Gate 0 is a decision record in Git, one row per group and one per GPO half. No kit check reads the decisions; the record is the evidence.

Task A0.2 decides every security group, using Book 02's table. A group used only for on-premises resource ACLs stays in AD and isn't synced, because a cloud copy adds nothing. One used for both on-premises and cloud resources is synchronized, with AD as the source during the transition. One used only for cloud resources converts to cloud-only. One whose membership really follows department, location or role converts to dynamic. And one with no members or no resource assignments is retired. Convert to dynamic only when membership really follows the attributes, which matters on the next slide.

Task A0.3 drafts the OU-to-unit mapping. GPO scoping goes to Conditional Access and Intune, delegation to administrative units, and logical organization to attributes and dynamic groups. Delegation over servers becomes Azure RBAC scopes instead. In the running example, the export shows the finance OU's help desk was delegated password reset by hand; that's what Gate 4's division unit has to reproduce. Task A0.4 tags every OU and every GPO half with its track, because a GPO's user and computer halves can belong to different tracks.

Record two traps. A GPO linked at a site looks unlinked to a search that only walks OUs. And adminCount overstates current privilege, because it stays set after an account leaves a protected group. Finally, the service accounts: VK-NPI-06 lists those with passwords that never expire, old passwords, SPNs or a type other than gMSA, and those rows go to the non-person guide's Step 1. For the computer half of the GPO split, the Intune track runs VK-INT-07, a beta check: it lists each GPO imported into Intune's Group Policy analytics with its migration readiness, flags those that aren't complete, and, with a gpo-scope.csv input, every in-scope GPO that was never imported. The gate owner is the identity engineering lead.`,
  `${IG}, Gate 0, steps 2–6, Validate and Evidence; Book 02, Chapter 09 — "The per-group decision," "Organizational units," "AdminSDHolder and protected groups."`);
}

// ================================================================== 7 What the overview simplified
{
  const s = content(SG0, "What the overview simplified");
  tag(s, "Why");
  const w = 3.9, gap = 0.225;
  const a = panel(s, "Simp1", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "DESIGN GUIDANCE", "Some OUs don't map", [
    "An OU may exist for one hand-made delegation, one GPO link or a sync filter",
    "Server delegation becomes Azure RBAC, not a unit",
    "Service-account OUs leave for the non-person track",
    "Record each odd OU in the decision record; don't force it into the table",
  ], 12.5);
  const b = panel(s, "Simp2", 0.6 + w + gap, 1.45, w, null, HEX.teal, HEX.tealTint, "DESIGN GUIDANCE", "HR codes aren't always boundaries", [
    "Convert a group only when its membership really follows the codes",
    "Members who don't fit: fix the source, or a reviewed exception group",
    "HR has late and future-dated actions: past three days late, a leaver needs the on-demand path",
    "Worker types go beyond employee and contractor: interns, volunteers, pending workers",
  ], 12.5);
  const c = panel(s, "Simp3", 0.6 + 2 * (w + gap), 1.45, w, null, HEX.red, HEX.redTint, "DESIGN GUIDANCE", "Removing writers is a project", [
    "Help desk and self-service edits to the access slots",
    "Exchange custom-attribute cmdlets: slots 1–15 came from the Exchange schema",
    "Write rights on the target OUs",
    "Find every writer in the audit logs first; after Gate 2, any other write is drift",
  ], 12.5);
  if (process.env.FIT) console.log(`  simplified: ${a.toFixed(2)} ${b.toFixed(2)} ${c.toFixed(2)}`);
  sources(s, "Sources: Book 02, Ch 09 (OUs; filtering; converting groups); Book 03, Ch 04, 06, 08, 11; Guide, attribute stores; HCM example README. Framing: design guidance.");
  notes(s,
`One honest slide. The overview decks had to simplify, and three simplifications bite at this depth. All three are the program's reading, design guidance, built on what the books say.

First, the OU-to-attribute table hides OUs that don't map. The table sends each OU function somewhere: GPO scoping, delegation, logical organization. Real trees hold OUs that exist for one hand-made delegation, one GPO link, or to be left out of sync by OU filtering. Server OUs map their delegation to Azure RBAC, not to a unit, and service-account OUs leave for the non-person track. Put each odd OU in the decision record; don't force it into the table.

Second, HR codes aren't always access boundaries. Book 02 says convert a group to dynamic only when its membership really follows department, location or role, and members who don't fit need remediation at the source or an explicit, reviewed exception group. HR also has its own timing: future-dated actions, and separations recorded late. A separation entered more than three days after its effective date misses Lifecycle Workflows' scheduled trigger and needs the on-demand path. And worker types go beyond employee and contractor, to interns, volunteers, and Oracle's pending workers and nonworkers, which the example pipeline refuses on purpose.

Third, removing the other writers can be a project in itself. The help desk and self-service edits, Exchange's custom-attribute cmdlets, because extension attributes 1 to 15 came from the Exchange schema, and write rights on the target OUs. Find every writer in the audit logs before you remove anything. After Gate 2, any other write is drift.`,
  `Book 02, Chapter 09 — "Organizational units," "Filtering," "Converting static groups to dynamic groups"; Book 03, Chapter 04 — "The worker-type boundary"; Chapter 06 — "Writers"; Chapter 08; companion guide, attribute stores; HCM example README. Framing: design guidance.`);
}
endModule(SG0);

// ================================================================== 8 Gate 1: slot register
{
  const s = content(SG1, "Gate 1: the user slot register, slot by slot");
  tag(s, "What");
  table(s, "Slots", 1.45, [2.45, 3.6, 3.0, 3.1], ["Carrier", "Meaning", "Writer", "Read by"], [
    ["employeeId", "Enterprise person key, at most 16 characters", "Provisioning service", "Matching; joins; VK-HR-01, VK-HR-04"],
    ["extensionAttribute1", "Job code", "Core HCM, inbound provisioning", "Microsoft's Oracle worksheet slot"],
    ["extensionAttribute2 / 3", "Hire / leave date, AD-side carriers", "Core HCM HireDate / TermDate", "Sync rule → employeeHireDate / employeeLeaveDateTime"],
    ["extensionAttribute4", "Region code", "Core HCM duty station", "Dynamic groups"],
    ["extensionAttribute5 / 6", "Cost center code / division code", "Core HCM", "License groups / units, mover trigger"],
    ["extensionAttribute7", "Account type: Standard, Service, Privileged", "Identity team; transitional sync rule", "Admins persona"],
    ["extensionAttribute9", "Clearance level", "Personnel security system", "Restricted access packages"],
    ["extensionAttribute10", "Organization code, such as FIN-LED", "Core HCM department ID", "Dynamic groups and units"],
    ["extensionAttribute11", "Worker type code: EMP, CTR", "Core HCM worker type", "Internals persona (rules can't read employeeType)"],
    ["extensionAttribute12", "Position category", "Core HCM job family", "Mover trigger; auto-assignment"],
    ["extensionAttribute15", "DoNotSync", "Identity operations, in AD", "Sync scoping filter only"],
  ], { fontSize: 11, limit: 6.55 });
  sources(s, "Sources: Book 03, Ch 06, \"Program attribute map\" (slots 8, 13, 14 reserved; slots 4–9 and 15 proposed: design guidance); Ch 04 (employeeId limit).");
  notes(s,
`Gate 1, decision D-A2: the coded slot register. This is Book 03's program attribute map for user objects, the one assignment the whole workbook uses.

The key comes first. employeeId carries the enterprise person key, at most 16 characters, written only by the provisioning service, and it's what matching and every join run on.

Slot 1 is the job code, from Microsoft's Oracle worksheet. Slots 2 and 3 are the hire and leave dates, AD-side carriers, because AD has no hire-date attribute; a sync rule maps them to employeeHireDate and employeeLeaveDateTime, which Lifecycle Workflows read. Slot 4 is the region code. Slots 5 and 6 mirror cost center and division, because employeeOrgData holds them but rules can't read it. Slot 7 is account type, standard, service or privileged, written by the identity team, and during the transition derived by a sync rule from OU placement. Slot 9 is clearance, from the personnel security system.

The three that drive access are 10, 11 and 12: the organization code, such as FIN-LED for the analyst; the worker type code, EMP or CTR, because rules can't read employeeType; and the position category. Slot 15 is DoNotSync, read only by a sync scoping filter, never by an access rule. Slots 8, 13 and 14 are reserved.

Slots 1 to 3 follow Microsoft's worksheet; the rest are the workbook's proposals, design guidance, to confirm before Phase 1 closes. Device objects have their own fifteen slots, written through Graph, so they never collide with these; the Intune guide owns them.`,
  `${IG}, Gate 1, step 4; Book 03, Chapter 06 — "Program attribute map," "Design rules"; Chapter 04 — "One person, layered identifiers."`);
}

// ================================================================== 9 Gate 1: one store, one writer
{
  const s = content(SG1, "Gate 1: one store, one writer, one owner");
  tag(s, "Who");
  const a = panel(s, "Store", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "D-A1  THE STORE, IN ORDER (DATA ARCHITECT)", null, [
    "Native properties first",
    "extensionAttribute1–15 for what rules read",
    "Directory extensions when more slots are needed",
    "Custom security attributes for sensitive values rules don't need",
    "Devices: device properties; servers: Azure tags; PIV: certificateUserIds",
  ], 12.5);
  const b = panel(s, "Writers", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "A1.3  ONE WRITER PER SLOT; LIST THE REST", null, [
    "The provisioning service is the only writer of every schema field",
    "List for removal at Gate 2: help desk, self-service and Exchange-admin paths",
    "Codes, never display strings, in anything a rule reads; HR owns the code lists",
    "Other tracks' authorities (A1.4): procurement record, asset record, owning system",
  ], 12.5);
  const c = code(s, "Measure", 0.6, Math.max(a, b) + 0.2, 12.15, [
    "# Measure the key's carrier before anything depends on it. Expect findings: Gate 2 closes them.",
    ".\\Invoke-ValidationKit.ps1 -OutputPath D:\\Validation -CheckId VK-HR-01, VK-HR-04",
  ], { label: "VALIDATE (GATE 1)" });
  line(s, "Rollback", "Rollback: a slot can change until a rule reads it. After that, every rule, filter and policy that reads it is rewritten, so sign the register before Gate 4.", c + 0.2, 0.62, 14);
  sources(s, "Sources: Implementation guide, Gate 1 (steps 3–6, Validate, Rollback); Guide, attribute stores; Book 03, Ch 06 (\"Writers\"); validation kit README (-CheckId).");
  notes(s,
`The rest of Gate 1 is three rules: one store, one writer, one owner per attribute.

Decision D-A1 picks the store, and the data architect decides it, using the store table in its order. Native properties first. Then extension attributes 1 to 15 for anything a rule has to read. Then directory extensions when more slots are needed. Custom security attributes hold sensitive values that rules don't need, because dynamic rules can't read them. Devices use device properties, servers Azure tags, and the PIV binding certificateUserIds. Pick the store by who has to read it.

Task A1.3 names the single writer for every slot. The provisioning service is the only writer of every schema field: the API-driven inbound app for cloud-mastered users, and the provisioning agent plus sync for AD-mastered ones. Every other write path to the access slots, the help desk, self-service and Exchange administration, goes on a list for removal at Gate 2. Codes, never display strings, go in anything a rule reads, and HR owns the code lists. Task A1.4 names the other tracks' authorities: the procurement record for devices, the asset record for servers, and the owning system's record for non-person identities. None of them is HR.

Validate with the kit: run VK-HR-01 and VK-HR-04 by check ID. Together they measure the key's carrier, enabled accounts without an employee I D and duplicate keys. Expect findings here; Gate 2 closes them. The rest of the evidence is the signed schema and slot register, and the gate owner is the ICAM governance body.

Rollback is the reason to sign early. A slot can change until a rule reads it. After that, every rule, filter and policy that reads it has to be rewritten.`,
  `${IG}, Gate 1, steps 3–6, Validate, Rollback; companion guide, "The attribute stores, in the order to reach for them"; Book 03, Chapter 06 — "Writers"; validation kit README, "Run it."`);
}
endModule(SG1);

// ================================================================== 10 Gate 2: run the HR checks
{
  const s = content(SG2, "Gate 2: run the HR checks against an HR export");
  tag(s, "How");
  const c1 = code(s, "Run2", 0.6, 1.45, 12.15, [
    "# Delegated sign-in with only the read scopes these checks need (User.Read.All; Global Reader). -Cloud gcc is the default.",
    ".\\Invoke-ValidationKit.ps1 -OutputPath D:\\Validation -Track HR, DG -InputPath D:\\Inputs",
  ], { label: "COMMAND (A2.1)", pt: 11 });
  const c2 = code(s, "Inputs", 0.6, c1 + 0.2, 5.4, [
    "# D:\\Inputs\\exceptions.csv",
    "UserPrincipalName,Owner,Reason",
    "breakglass@contoso.example,Identity team lead,...",
    "svcbreak@contoso.example,,...",
    "",
    "# D:\\Inputs\\hr-export.csv",
    "OrgCode,Count",
    "ORG-A,3",
    "ORG-B,3",
    "ORG-D,1",
  ], { label: "INPUT FILES (THE KIT'S FICTIONAL FIXTURE)", pt: 11 });
  const tb = table(s, "HRChecks", c1 + 0.2, [1.3, 5.25], ["Check", "Fails when"], [
    ["VK-HR-01", "An enabled member has no employeeId and no exception with an owner"],
    ["VK-HR-02", "A coded slot is empty: extensionAttribute10, 11 or 12"],
    ["VK-HR-03", "Users per code in slot 10 differ from hr-export.csv; no export: NotApplicable"],
    ["VK-HR-04", "One employeeId is held by more than one user, in any state"],
  ], { x: 6.2, fontSize: 12, limit: 6.6 });
  if (process.env.FIT) console.log(`  run2: inputs ${c2.toFixed(2)}, checks ${tb.toFixed(2)}`);
  sources(s, "Sources: Validation kit README (Run it; Inputs; permissions; -Cloud); Checks/HR.ps1; fixture tests/fixtures/fail; Implementation guide, Gate 2, step 1.");
  notes(s,
`Gate 2, task A2.1: baseline coverage with the validation kit's HR checks, first on the pilot cohort and then on the estate.

The command is the one the guide shows: Invoke-ValidationKit, with an output path, the HR and D G tracks, and an input path. It signs in with delegated permissions and asks for exactly the read scopes the selected checks need; for the HR checks that's User.Read.All, with Global Reader for the signed-in user. The cloud switch defaults to G C C, which uses the worldwide Graph endpoint. The D G checks belong to Gate 4; at this gate, read the HR rows.

Two input files make the HR checks meaningful. exceptions.csv lists accounts that legitimately have no key, such as emergency access accounts, each with an owner and a reason. An exception with no owner doesn't count. hr-export.csv carries two columns, the organization code and the count of workers HR holds for it. The values on the slide are the kit's own fictional fixture, not real data. Without the export, VK-HR-03 reports NotApplicable, never Pass.

What makes each check fail. VK-HR-01: an enabled member user with no employee I D and no owned exception. VK-HR-02: an empty organization code, worker type or position category slot, extension attributes 10, 11 and 12. VK-HR-03: the count of users per code in slot 10 differs from the HR export. VK-HR-04: one employee I D held by more than one user, in any state, enabled or not.

Then fix every wrong value at the source, never in the copy, and run the device and server coverage checks the track guides use too.`,
  `${IG}, Gate 2, step 1 and Validate; validation kit README, "Run it," "Inputs," "Permissions each check needs"; examples/validation-kit/powershell/ValidationKit/Checks/HR.ps1.`);
}

// ================================================================== 11 Reading a failing check
{
  const s = content(SG2, "Reading a failing check: status, count, rows");
  tag(s, "How");
  const c = code(s, "Result", 0.6, 1.45, 7.6, [
    "VK-HR-01   Status Fail   Count 3",
    "  Finding  svcbreak@contoso.example",
    "           No employeeId; listed as an exception",
    "           but the exception names no owner",
    "",
    "VK-HR-03   Status Fail   Count 3",
    "  Info     ORG-A   Counts agree",
    "  Finding  ORG-B   EntraId 2   HrExport 3   Difference -1",
    "  Finding  ORG-C   EntraId 1   HrExport 0   Difference 1",
    "  Finding  ORG-D   EntraId 0   HrExport 1   Difference -1",
    "",
    "VK-HR-04   Status Fail   Count 1",
    "  Finding  E1002   employeeId held by more than one user",
  ], { label: "THE FIXTURE'S RESULTS, AS ROWS", pt: 11 });
  const p = panel(s, "Read", 8.45, 1.45, 4.3, null, HEX.navy, HEX.navyTint, "HOW TO READ IT", null, [
    "Fail: at least one Finding row",
    "Warn: needs review, not a finding",
    "NotApplicable: nothing to check, or an input missing; never Pass",
    "Error: a read failed; never Pass",
    "Count: Finding and Warn rows; Info rows are context",
  ], 12.5);
  code(s, "Folder", 8.45, p + 0.2, 4.3, [
    "<run-id>\\Results\\ValidationResults.csv",
    "<run-id>\\Details\\VK-HR-03.csv",
    "<run-id>\\Summary\\ValidationSummary.md",
    "<run-id>\\ValidationManifest.json",
  ], { label: "WHERE IT LANDS", pt: 10.5 });
  sources(s, "Sources: Validation kit README (What a check returns; What a run writes); Checks/HR.ps1 issue text; tests/fixtures/fail and Checks.Tests.ps1 (counts).");
  notes(s,
`This is what a failing check looks like, using the kit's own fictional "fail" fixture, drawn as rows.

Every check returns one object: the check ID, its status, a count, detail rows with a severity, the object, its ID, the issue and the detail, and the evidence, meaning every query sent with its time, the permissions it needed and the release stage.

Read VK-HR-01 first. Status Fail, count 3: three enabled member accounts with no employee I D. One row is the trap from the input file. The svcbreak account is listed in exceptions.csv, but with no owner, so the check still reports it, and says why: listed as an exception, but the exception names no owner. Name an owner, or correlate the account.

VK-HR-03 is the reconciliation. ORG-A agrees, an Info row that doesn't count. ORG-B has two users in Entra ID and three in HR, so a worker is missing a code or carrying the wrong one. ORG-C has a user in Entra and nobody in HR: a code HR doesn't hold, a value someone typed. ORG-D has a worker in HR and nobody in Entra. Each one is fixed at the source, never in the directory.

VK-HR-04 finds one key held by two users. In the running example, that's the analyst's key on an old test account.

The statuses: Fail means at least one Finding row. Warn means review, not a finding. NotApplicable means nothing to check or a missing input, and Error means a read failed; neither is ever a Pass. Everything lands in a run folder: the results file, a details file per check, a one-page summary, and a manifest with the hash of every file. That folder is Gate 2's evidence.`,
  `Validation kit README, "What a check returns," "What a run writes"; examples/validation-kit/powershell/ValidationKit/Checks/HR.ps1; tests/fixtures/fail; tests/powershell/Checks.Tests.ps1; ${IG}, Gate 2, running example.`);
}

// ================================================================== 12 Gate 2: threshold, writers, logs
{
  const s = content(SG2, "Gate 2: threshold, writers out, logs out");
  tag(s, "Who");
  const w = 3.9, gap = 0.225;
  const a = panel(s, "Threshold", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "D-A3  AUTHORIZING OFFICIAL", "The threshold", [
    "Set through the agency's risk governance",
    "99% of the pilot cohort: a proposed start, not a rule",
    "Risk-tiered is usually better",
    "Every enabled account correlated, or on a dated exception list with an owner",
  ], 12.5);
  const b = panel(s, "Writers2", 0.6 + w + gap, 1.45, w, null, HEX.teal, HEX.tealTint, "A2.2  IDENTITY ENGINEERING", "The other writers", [
    "AD: write rights on the target OUs",
    "AD: Exchange's custom-attribute cmdlets",
    "Entra ID: help desk and self-service paths to the access slots",
    "After this, any other write is drift",
  ], 12.5);
  const c = panel(s, "Logs", 0.6 + 2 * (w + gap), 1.45, w, null, HEX.amber, HEX.amberTint, "A2.3  SECURITY OPERATIONS", "The logs", [
    "Sign-in, audit and provisioning logs out before the pilot's first change",
    "To Azure Monitor, a storage account or the SIEM",
    "Audit: 30 days with P1 or P2; provisioning: 30 days with a premium edition",
    "Not retroactive",
  ], 12.5);
  callout(s, "Example2", Math.max(a, b, c) + 0.25, 1.05, "FaUserCheck", HEX.navy, "Running example: ",
    "VK-HR-04 finds the analyst's key on an old test account too. HR confirms the real record; the test account is disabled and listed, not deleted.");
  sources(s, "Sources: Implementation guide, Gate 2 (steps 3–5, example, Validate, Rollback); project plan D-A3; Book 03, Ch 06 (Writers), Ch 11 (evidence), Ch 12.");
  notes(s,
`Three more steps close Gate 2, each with its own owner.

Decision D-A3 is the correlation threshold, and the authorizing official sets it through the agency's risk governance. Ninety-nine percent of the pilot cohort is a proposed starting point, not a rule; a risk-tiered threshold, stricter for privileged and leaver-sensitive populations, is usually better. Either way, every enabled account is correlated or on a dated exception list, and every exception has an owner.

Task A2.2 removes the other writers. In AD, the write rights on the target OUs and Exchange's custom-attribute cmdlets. In Entra ID, the help desk and self-service paths to the access slots. From here on, any other write is drift: Book 03's unauthorized-write class, found in the Entra audit log and AD change auditing.

Task A2.3 routes the logs out. Entra ID's sign-in, audit and provisioning logs go to Azure Monitor, a storage account or the agency's SIEM before the pilot's first change. The audit log keeps 30 days with P1 or P2, the provisioning log 30 days with a premium edition, and neither is retroactive.

The running example: VK-HR-04 finds one other account carrying the analyst's key, an old test account. HR confirms which record is real, and the second account is disabled and listed. It isn't deleted.

The gate owner is the CISO. Expect a burst of high-severity findings in the first month; that's the measurement working. Rollback: restore a removed write permission through a recorded change, for a named reason and an end date. A corrected HR value is corrected again at the source.`,
  `${IG}, Gate 2, steps 3–5, running example, Validate, Rollback, Evidence; project plan, D-A3; Book 03, Chapter 06 — "Writers"; Chapter 11 — "The evidence each event leaves"; Chapter 12 — "Sequencing principle."`);
}
endModule(SG2);

// ================================================================== 13 Gate 3: landing zones and mappings
{
  const s = content(SG3, "Gate 3: two landing zones, one carrier, mapped");
  tag(s, "What");
  const a = panel(s, "Zones", 0.6, 1.45, 5.0, null, HEX.navy, HEX.navyTint, "LANDING ZONES AND ENGINE", null, [
    "AD-landed: HR → provisioning agent → AD → sync; the Entra copies are read-only",
    "Cloud-mastered: HR writes Entra ID directly",
    "Same carrier in both, so a rule never asks which zone",
    "Cloud Sync unless a Connect-only need applies; password hash sync everywhere",
  ], 12.5);
  const tb = table(s, "Flow", 1.45, [1.75, 2.15, 3.0], ["A3.1 mapping", "From", "To, and the catch"], [
    ["Hire date", "extensionAttribute2", "employeeHireDate; AD string format yyyyMMddHHmmss.fZ"],
    ["Leave date", "extensionAttribute3", "employeeLeaveDateTime; same format"],
    ["Account type", "OU placement", "extensionAttribute7: transitional; Gate 8 removes it"],
    ["DoNotSync", "extensionAttribute15", "Scoping filter; Cloud Sync has only basic attribute filtering"],
  ], { x: 5.85, fontSize: 11.5, limit: 6.6 });
  code(s, "Rule", 0.6, Math.max(a, tb) + 0.2, 12.15, [
    "# Book 02's transitional rule (Connect Sync expression), target extensionAttribute7: a bridge, not an end state",
    "IIF(CBool(InStr(LCase([distinguishedName]),\"ou=service accounts\")),\"Service\",\"Standard\")",
    "# The AD app's date conversion (inference: test the format string in your tenant)",
    "FormatDateTime([urn:...:User:HireDate], , \"yyyy-MM-ddTHH:mm:ssZ\", \"yyyyMMddHHmmss.fZ\")",
  ], { label: "EXPRESSIONS", pt: 11 });
  sources(s, "Sources: Implementation guide, Gate 3 (steps 1–3); Book 02, Ch 09 (engine; filtering; attribute flow); Book 03, Ch 05, 06; HCM example README (dates).");
  notes(s,
`Gate 3 is the plumbing between HR, AD and Entra ID while they coexist, and its failures are quiet.

Know the two landing zones. For most users today, HR writes into AD through the provisioning agent, and sync carries the values up, so the Entra copies are read-only. For cloud-mastered users, HR writes Entra ID directly. The two converge population by population, so use the same carrier in both, and a rule on extension attribute 10 works whichever zone a user came from.

Identity engineering chooses the engine: Cloud Sync, unless a Connect-only requirement applies, such as more than 150,000 objects in a domain, groups over 50,000 members, advanced sync rules or cross-forest references. Password hash sync everywhere.

Task A3.1 maps the slot register through sync. Put every carrier in the provisioning apps' target lists. Map the dates for AD-landed users: slot 2 to employeeHireDate and slot 3 to employeeLeaveDateTime. For an AD string attribute, Microsoft's required format is the compact one on the slide, and the example code's README shows the conversion expression for the AD app, labeled an inference to test in your tenant.

Add the transitional rule that derives account type, slot 7, from OU placement. Book 02 prints the expression: if the distinguished name contains the service accounts OU, Service, otherwise Standard. It's a bridge, not an end state, because it reads placement, exactly the habit the migration retires. Record that Gate 8 removes it.

And add the DoNotSync scoping filter on slot 15. Connect Sync filters on attribute values in its sync rules; Cloud Sync supports only basic attribute filtering, so check that the filter you need is one it can express.`,
  `${IG}, Gate 3, steps 1–3; Book 02, Chapter 09 — "Cloud Sync or Connect Sync," "Filtering," "Attribute flow and transformations"; Book 03, Chapter 05 — "Two landing zones"; Chapter 06; HCM example README, "The mapping it applies."`);
}

// ================================================================== 14 Gate 3: the /bulkUpload record
{
  const s = content(SG3, "Gate 3: the /bulkUpload record, sent whole");
  tag(s, "How");
  const c = code(s, "Scim", 0.6, 1.45, 7.2, [
    "{ \"schemas\": [\"urn:ietf:params:scim:api:messages:2.0:BulkRequest\"],",
    "  \"Operations\": [ { \"method\": \"POST\", \"bulkId\": \"100003\",",
    "    \"path\": \"/Users\", \"data\": {",
    "      \"schemas\": [ ...core, enterprise, extension... ],",
    "      \"externalId\": \"100003\", \"active\": false,",
    "      \"name\": { ... }, \"displayName\": \"...\",",
    "      \"title\": \"Management Analyst\",",
    "      \"urn:ietf:params:scim:schemas:extension:enterprise:2.0:User\": {",
    "        \"employeeNumber\": \"100003\", \"division\": \"Operations\",",
    "        \"department\": \"Program Operations\", \"costCenter\": \"CC-4100\",",
    "        \"manager\": { \"value\": \"100000\" } },",
    "      \"urn:ietf:params:scim:schemas:extension:contoso:1.0:User\": {",
    "        \"workerTypeCode\": \"EMP\", \"orgCode\": \"ORG-100\",",
    "        \"positionCategory\": \"PRO\", \"JobCode\": \"MA-0343\",",
    "        \"HireDate\": \"2018-01-08T10:00:00Z\",",
    "        \"TermDate\": \"2026-10-24T04:00:00Z\" } } } ] }",
  ], { label: "ONE OPERATION FROM THE EXAMPLE'S EXPECTED OUTPUT (TRIMMED)", pt: 11 });
  const p = panel(s, "Contract", 8.05, 1.45, 4.7, null, HEX.navy, HEX.navyTint, "THE CONTRACT", null, [
    "application/scim+json; at most 50 operations",
    "202 Accepted, with a Location header to the provisioning logs",
    "externalId matches employeeId; no match creates a user",
    "POST only: an update is the same record again",
    "Pace to 40 calls in any 5 seconds",
    "Send the whole record: an omitted attribute can clear the target",
  ], 12);
  code(s, "Client", 8.05, p + 0.2, 4.7, [
    "python python/hcm_to_scim.py \\",
    "  --extract hcm_extract.csv \\",
    "  --as-of 2026-10-25 --out out",
    "# exit 0 ready, 1 error,",
    "# 2 some quarantined, 3 run held",
  ], { label: "DRY RUN FIRST (THE DEFAULT)", pt: 10.5 });
  sources(s, "Sources: examples/hcm-entra (README; expected_bulk_request.json); research page, Part 1 \"The contract\"; Book 03, Ch 05; Implementation guide, Gate 3, step 5.");
  notes(s,
`This is the record HR sends, the SCIM bulk request to the provisioning app's bulkUpload endpoint. It's one operation from the example code's expected output, trimmed; the worker is fictional.

Read it from the top. A BulkRequest holds operations, at most 50 per call. Each is a POST to Users. externalId carries the person number, and by default it matches employeeId; if no user matches, the job creates one. active is false here, because this worker is a leaver. Under the enterprise extension: employeeNumber, department, division, cost center, and the manager, whose value is the manager's own externalId, which the service resolves. Under the agency's own extension namespace, a placeholder here: the worker type code, the organization code that lands in slot 10, the position category, the job code, and the hire and termination dates in UTC.

The contract around it. Content type application/scim+json. The service answers 202 Accepted with a Location header that points at the provisioning logs, which is where you read each record's result. There's only POST: an update is another POST of the same record. Pace to 40 calls in any five seconds, the stricter of the two published limits.

The rule that matters most: send the complete record every time, for full and delta runs alike, because an omitted attribute can clear the target value when clearing is turned on.

The example client dry-runs by default: it validates, writes the payloads, a validation report and a quarantine file, and sends nothing. Exit code 0 means ready, 1 an error, 2 some records quarantined, and 3 the run is held because it would disable more accounts than the limit allows. Before the first real send, start the job, set the notification email, turn on accidental-deletions prevention, and send five to ten records first.`,
  `${IG}, Gate 3, step 5; examples/hcm-entra README and tests/fixtures/expected_bulk_request.json; research page "Building Book 03's HR Pipeline," Part 1 — "The provisioning apps," "The contract"; Book 03, Chapter 05.`);
}

// ================================================================== 15 Gate 3: match trap and deadline
{
  const s = content(SG3, "Gate 3: the match trap and the April 7, 2027 deadline");
  tag(s, "Why");
  const tb = table(s, "Match", 1.45, [1.35, 5.4], ["Match", "How Entra ID finds the existing object"], [
    ["Hard", "sourceAnchor (Base64 of ms-DS-ConsistencyGuid, or objectGUID) against onPremisesImmutableId; AD becomes the source"],
    ["Soft", "userPrincipalName and the primary SMTP in proxyAddresses; only if the cloud object has no onPremisesImmutableId"],
    ["Both", "Overwrite the cloud object's attributes with on-premises values, the password hash too under PHS: clean AD first"],
  ], { fontSize: 11.5, limit: 6.6 });
  const tb2 = table(s, "Block", tb + 0.2, [4.2, 2.55], ["Tenant setting", "Outside a planned window"], [
    ["BlockSoftMatchEnabled", "Blocked"],
    ["BlockCloudObjectTakeoverThroughHardMatchEnabled", "Blocked"],
  ], { fontSize: 11.5, limit: 6.6 });
  const p = panel(s, "Deadline", 7.6, 1.45, 5.15, null, HEX.red, HEX.redTint, "CONNECT SYNC: APRIL 7, 2027", null, [
    "Version 2.6.84.0 or later and application-based authentication, or all sync fails",
    "The upgrade alone isn't enough: run the wizard's application-based authentication option",
    "Over an existing ADSync database, use 2.6.91.0 or later",
    "One active Connect Sync server per tenant",
  ], 12.5);
  line(s, "July", "Since July 1, 2026, Entra ID blocks a hard match onto an account with onPremisesObjectIdentifier set, or one holding or eligible for a privileged role.",
    Math.max(tb2, p) + 0.2, 0.62, 13.5);
  sources(s, "Sources: Book 02, Ch 09 (\"Soft match and hard match,\" \"Connect Sync deadline,\" one active server); Implementation guide, Gate 3, steps 4 and 6.");
  notes(s,
`Two Gate 3 traps, and both are quiet until they aren't.

The first is matching. When sync adds an object that might already exist in the cloud, Entra ID looks for a hard match first: the incoming source anchor, by default the Base64 form of ms-DS-ConsistencyGuid, against the cloud object's onPremisesImmutableId. A hard match makes AD the source of authority for that object. With no hard match, it tries a soft match on userPrincipalName and the primary SMTP address, but only if the cloud object has no immutable ID yet.

The trap is what a match does. Either one overwrites the cloud object's attributes with the on-premises values, including the password hash under password hash sync. If AD still carries stale codes, a match reverts them across a population at the next cycle. So clean AD first, and keep both tenant settings, the soft-match block and the hard-match takeover block, blocked except during a planned matching window. And since July 1, 2026, Entra ID itself blocks a hard match onto an account that already has an on-premises object identifier, or holds or is eligible for a privileged role, whichever engine you use.

The second trap is a date. Every server still running Connect Sync must be on version 2.6.84.0 or later and configured for application-based authentication by April 7, 2027; from that date, sync fails on a server that doesn't meet both. The upgrade alone isn't enough: run the wizard and choose to configure application-based authentication. Installing over an existing ADSync database can fail, so use 2.6.91.0 or later there. And never run two active Connect Sync servers against one tenant.`,
  `${IG}, Gate 3, steps 4 and 6; Book 02, Chapter 09 — "Soft match and hard match," "Connect Sync deadline: April 7, 2027," "One active Connect Sync server per tenant."`);
}

// ================================================================== 16 Gate 3: proving and backing out
{
  const s = content(SG3, "Gate 3: proving it flowed, and backing it out");
  tag(s, "How");
  const tb = table(s, "Prove", 1.45, [2.75, 3.85, 1.3], ["Evidence (AG3)", "Pass when", "From"], [
    ["VK-SYNC-01 (slot values)", "No sample row missing in Entra, no key held twice, no slot that differs", "The kit"],
    ["Object counts; sync errors", "Within ±1%; none", "Book 02 Ph 1"],
    ["Initial full sync", "Reconciled before deltas", "Book 03 Ph 3"],
    ["Shadow mode", "Every pipeline-vs-directory difference explained", "Book 03 Ph 3"],
    ["Unmatched-record creations", "Zero", "Book 03 Ph 3"],
    ["VK-HR-02 and VK-HR-03, re-run", "Coverage and counts per code match Gate 2's", "The kit"],
  ], { fontSize: 11.5, limit: 6.6 });
  const p = panel(s, "Back", 8.65, 1.45, 4.1, null, HEX.amber, HEX.amberTint, "ROLLBACK", null, [
    "Turn the scoping filter back to exclude the population; the next cycle removes the values",
    "Never delete synced users in Entra ID: the next sync restores them",
    "Pause the provisioning job from an operator role; don't Restart: it purges staged payloads",
  ], 12.5);
  const c = code(s, "Sync01", 0.6, Math.max(tb, p) + 0.2, 12.15, [
    "# D:\Inputs\ad-slot-export.csv, a sample exported from AD: EmployeeId,extensionAttribute10,extensionAttribute11,extensionAttribute12",
    ".\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track SYNC, HR -InputPath D:\Inputs",
    "# Reads values, not the sync configuration, scoping or match blocking: the reconciliation report covers those",
  ], { label: "VALIDATE (GATE 3)", pt: 10.5 });
  line(s, "Ex3", "Running example: FIN-LED in slot 10 and the hire date in slot 2 land in AD; sync carries both up, and the Entra copy matches what HR sent.",
    c + 0.2, 0.6, 13.5);
  sources(s, "Sources: Implementation guide, Gate 3 (Validate, Rollback, Evidence); validation kit README, Checks/SYNC.ps1; Book 02, Ch 10 (Ph 1); Book 03, Ch 08, 12 (Ph 3).");
  notes(s,
`Gate 3 now has a kit check, VK-SYNC-01, and it covers part of the gate. It takes an input the program keeps: ad-slot-export.csv, a sample of users exported from AD with the employee ID and one column per coded slot, extension attributes 10 to 12. It compares those values with the same slots in Entra ID, joined on employeeId, and reports three things: a sample row with no Entra user holding the key, a key held by more than one Entra user, and each slot whose value differs. Run it with the SYNC track and the input path. Without the export it reports NotApplicable, never Pass.

It reads values, not the sync configuration, scoping filters, error log or match blocking, so the rest of the evidence still comes from the reconciliation report. From Book 02's Phase 1: object counts within plus or minus one percent, no sync errors, and an attribute spot check, which VK-SYNC-01 now makes repeatable. From Book 03's Phase 3: the initial full sync reconciled before deltas start, then shadow mode, with every difference between the pipeline and the directory explained, and zero unmatched-record creations. An unmatched creation is a duplicate identity, which is exactly what Gate 2's correlation was meant to prevent. Then re-run VK-HR-02 and VK-HR-03 after the first full sync: the coverage and the counts per organization code should match Gate 2's. If they don't, a slot didn't arrive.

The running example: the analyst's record lands in AD with FIN-LED in slot 10 and the hire date in slot 2. Sync carries both up, and the Entra copy matches what HR sent. The gate owner is the identity engineering lead.

Rollback. Turn the scoping filter back to exclude the population, and let the next cycle remove the values from scope. Don't delete synced users in Entra ID; the next sync restores them. For the provisioning job, pause it from an operator role, which keeps its state, and don't use Restart, which purges the payloads waiting to be processed.

The evidence for the record: the sync configuration export, the reconciliation report, the shadow-mode difference log with each difference explained, VK-SYNC-01's result for the sample, and the before and after VK-HR-02 and VK-HR-03 results.`,
  `${IG}, Gate 3, Validate, Rollback, Evidence; Book 02, Chapter 10 — "Phase 1: sync deployment and initial sync"; Book 03, Chapter 08 — "Deletion"; Chapter 12 — "Phase 3: hybrid go-live (pilot)"; research page, "Testing and cutover."`);
}
endModule(SG3);

// ================================================================== 17 Handoff
{
  const s = content(SC, "Handing Gates 0–3 to Part 2");
  tag(s, "How");
  const tb = table(s, "Pack", 1.45, [2.0, 6.25, 3.9], ["Gate", "Evidence in Git", "What Part 2 reads from it"], [
    ["0 The tree read", "Start Kit run and manifest; group decision record; OU-to-unit map; track tags", "Gate 4: the per-group decision and the unit map"],
    ["1 Schema and slots", "Signed schema, slot register and AD-to-Entra mapping", "Gate 4 and 5: every rule and persona reads the register"],
    ["2 Attributes proven", "Kit run folder; threshold decision; owned exceptions; writer removals; log routing", "Gate 4: rules grant access only to proven values"],
    ["3 Attributes flowing", "Sync export; reconciliation report; shadow-mode log; VK-SYNC-01; VK-HR-02, 03 before and after", "Gate 4: live pilot data for the shadow comparison"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "Next", tb + 0.25, 1.0, "FaRoute", HEX.teal, "Part 2: ",
    "Gates 4 to 6: the dynamic group library and administrative units, the Conditional Access personas and targeting conventions, and PIV binding.");
  sources(s, "Sources: Implementation guide, Gates 0–3 Evidence; Gate 4 Prerequisites; \"Where the kits stop\"; \"In this guide.\"");
  notes(s,
`To close Part 1, here's what each gate leaves in Git, and what Part 2 reads from it.

Gate 0 leaves the Start Kit run with its manifest, the group decision record, the OU-to-unit mapping and the track tag for every OU and GPO half. Gate 4 reads the per-group decision and the unit map.

Gate 1 leaves the signed schema, the slot register and the AD-to-Entra mapping. Every rule in Gate 4 and every persona in Gate 5 reads the register, which is why it's signed first.

Gate 2 leaves the validation kit's run folder, the threshold decision, the exception list with owners and dates, the change records that removed the other writers, and the log routing configuration. Gate 4's rules grant access only to values that have been proven.

Gate 3 leaves the sync configuration export, the reconciliation report, the shadow-mode difference log, VK-SYNC-01's sample result, and the before and after VK-HR-02 and VK-HR-03 results. Gate 4 needs live pilot data for its shadow comparison against the groups it replaces.

The kits don't read everything. No check reads Gate 0's decisions, and VK-SYNC-01 reads slot values, not the sync configuration, scoping or match blocking. The guide's "where the kits stop" table names the stand-in evidence for each.

Part 2 takes Gates 4 to 6: the dynamic group library and administrative units, the Conditional Access personas and the device, server and non-person targeting conventions, and PIV and CAC binding. The attributes are now true and flowing. Next, the mechanisms that read them.`,
  `${IG}, Gates 0–3, Evidence; Gate 4, Prerequisites; "Where the kits stop"; "In this guide."`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation, baseline and Gate 0", [
  "Attribute-Driven Migration implementation guide: \"How to use this guide,\" \"One identifier through every gate,\" \"The path on one page,\" \"Prerequisites,\" Gate 0, \"Where the kits stop,\" \"Rollback at a glance.\" Project plan: Attribute-Driven Migration (tasks A0.1–A0.4, AG0).",
  "Book 03, Ch 04 (enterprise person key; employeeId at most 16 characters; worker-type boundary); Ch 08 (joiner, mover, leaver; three-day catch-up); Ch 11 (\"The measured lifecycle,\" evidence by event, drift classes, retention).",
  "Book 02, Ch 07 (recording what read-only discovery couldn't see); Ch 08 (OU hierarchy and delegation; what to collect); Ch 09 (per-group decision; converting static groups; organizational units; filtering; AdminSDHolder).",
  "examples/start-kit README (what it counts; rights each part needs; run it; what a run writes) and FMPADAssessment.psm1 (Compare-FMPAssessments). examples/validation-kit README (VK-INT-07, VK-NPI-06; inputs).",
  "Design guidance in this part: the baseline's 90-day sampling window and the \"show me the last one you did\" interview rule; the framing of \"What the overview simplified.\"",
]);
sourceSlide("Sources: Gates 1 and 2", [
  "Attribute-Driven Migration implementation guide: Gate 1 (steps, Validate, Rollback, Evidence); Gate 2 (steps, running example, Validate, Rollback, Evidence). Project plan: tasks A1.1–A1.4, A2.1–A2.3; decisions D-A1, D-A2, D-A3.",
  "Companion guide: \"The attribute stores, in the order to reach for them\"; Stage 1; Stage 2.",
  "Book 03, Ch 06 (\"Program attribute map\": user slots, reserved slots 8, 13, 14; device slots; \"Design rules\"; \"Writers\"); Ch 11; Ch 12 (sequencing principle; Phase 1 gate).",
  "examples/validation-kit: README (what a check returns; permissions; run it; inputs; what a run writes); powershell/ValidationKit/Checks/HR.ps1 (issue text); tests/fixtures/fail (exceptions.csv, hr-export.csv, users.json) and tests/powershell/Checks.Tests.ps1 (expected counts).",
]);
sourceSlide("Sources: Gate 3 and the handoff", [
  "Attribute-Driven Migration implementation guide: Gate 3 (steps 1–6, running example, Validate, Rollback, Evidence); Gate 4 prerequisites; \"Where the kits stop.\" Project plan: task A3.1, gate AG3.",
  "examples/validation-kit: README (VK-SYNC-01, ad-slot-export.csv, known limits; VK-INT-07, gpo-scope.csv) and powershell/ValidationKit/Checks/SYNC.ps1.",
  "Book 02, Ch 09: \"Cloud Sync or Connect Sync,\" \"Connect Sync deadline: April 7, 2027,\" \"Filtering,\" \"Attribute flow and transformations,\" \"One active Connect Sync server per tenant,\" \"Soft match and hard match.\" Ch 10: \"Phase 1: sync deployment and initial sync.\"",
  "Book 03, Ch 05 (two landing zones; the middleware's duties; complete record); Ch 08 (deletion); Ch 12 (Phase 3: hybrid go-live pilot).",
  "Research page \"Building Book 03's HR Pipeline\": Part 1 (provisioning apps, the contract, permissions, quarantine), Part 3 (mapping), \"Testing and cutover.\"",
  "examples/hcm-entra: README (mapping, rules, run it, exit codes, before the first real run) and tests/fixtures/expected_bulk_request.json. Date-format expression: the README's inference, to test in the tenant.",
]);

finish(OUT);
