// Attribute-Driven Migration to Entra ID — Deeper Dive Implementation, PART 2: Gates 4 to 6.
//   Gate 4: the dynamic group library (rule text, guards, rule tests, shadow diff, memberOf, deltas) and administrative units.
//   Gate 5: Conditional Access personas, device targeting, and moving Group Policy for devices and servers ("adopt, don't
//           build"), with one owning tool per setting for fleets Ansible already runs.
//   Gate 6: the PIV and CAC binding (certificateUserIds, affinity, the writer, the open pilot).
// Follows docs/project-plans/developer-workbooks/attribute-driven-migration/implementation-guide.md and data/project-plans/attribute-driven-migration.yaml.
// Every fact, command, rule and payload is taken from a workbook chapter, a guide, docs/research or examples/; nothing is
// added from outside. Design guidance is labeled; beta and preview features carry their stage.
// Shared builders come from ../attribute-driven-migration-technical-part-1/slides.js (only its helpers are used here).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/attribute-driven-migration-deeper-dive-part-2/build.js \
//                      presentations/attribute-driven-migration-deeper-dive-part-2/Attribute_Driven_Migration_Deeper_Dive_Part_2.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Attribute-Driven Migration to Entra ID — Deeper Dive Implementation, Part 2",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration — Deeper Dive, Part 2: Gates 4–6",
});
const { D, HEX, txt, tag, content, titleSlide, notes, endModule, section, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const box = D.box;
const OUT = process.argv[2] || "Attribute_Driven_Migration_Deeper_Dive_Part_2.pptx";
const IG = "Attribute-Driven Migration implementation guide";

const M1 = "Gate 4 — Groups and units";
const M2 = "Gate 5 — Targeting and moving Group Policy";
const M3 = "Gate 6 — PIV and CAC binding";

// ------------------------------------------------------------------ local helpers
const LIMIT = 6.6;
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// A code panel: light fill, Consolas, a small caps label. Returns the bottom edge. Wrap estimate: Consolas ~0.55 em.
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 11;
  const lh = pt / 72 * 1.2;
  const per = Math.max(1, Math.floor((w - 0.3) / (0.55 * pt / 72)));
  const n = lines.reduce((a, l) => a + Math.max(1, Math.ceil(l.length / per)), 0);
  const top = y + 0.1 + (o.label ? 0.28 : 0);
  const need = top + n * lh + 0.12;
  const h = o.h || Math.ceil((need - y) * 20) / 20;
  box(s, name, x, y, w, h, "F1F5F9", HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.15, y: y + 0.08, w: w - 0.3, h: 0.26, fontSize: 11, bold: true, color: HEX.slate });
  txt(s, `${name} code`, lines.map((l, k) => ({ text: l === "" ? " " : l, options: { breakLine: k < lines.length - 1 } })),
    { x: x + 0.15, y: top, w: w - 0.3, h: y + h - top - 0.06, fontSize: pt, fontFace: "Consolas", color: HEX.navy, paraSpaceAfter: 0 });
  if (need > y + h + 0.02) console.warn(`  ! ${name} code may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  for (const l of lines) if (l.length > per) console.warn(`  ! ${name} code line wraps (${l.length} > ${per} chars): ${l.slice(0, 50)}`);
  warn(`${name} code`, y + h);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${(y + h).toFixed(2)} in`);
  return y + h;
};

// A numbered step card for a left-to-right flow.
const step = (s, name, x, y, w, h, n, head, body, color) => {
  box(s, name, x, y, w, h, "FFFFFF", color);
  txt(s, `${name} text`, [
    { text: `${n}  ${head}`, options: { bold: true, color, fontSize: 13, breakLine: true } },
    { text: body, options: { fontSize: 11.5, color: HEX.ink } },
  ], { x: x + 0.12, y: y + 0.1, w: w - 0.24, h: h - 0.15, paraSpaceAfter: 3 });
  const need = y + 0.1 + 0.3 + Math.ceil((body.length * 0.5 * 11.5 / 72) / (w - 0.34)) * 11.5 / 72 * 1.2 + 0.1;
  if (need > y + h + 0.02) console.warn(`  ! ${name} step may overflow: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  warn(`${name} step`, y + h);
};

// ================================================================== 1 Title
section("Orientation");
{
  const s = titleSlide("Orientation", "Part 2: Groups, targeting and moving Group Policy", "Attribute-Driven Migration to Entra ID — deeper dive implementation, Gates 4 to 6");
  txt(s, "Session map", [
    { text: "Gate 4  The dynamic group library and administrative units", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Gate 5  Personas, device targeting, moving Group Policy   ·   Gate 6  PIV binding", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 1: Gates 0–3   ·   Part 3: Gates 7–9", options: { color: HEX.ink, breakLine: true } },
    { text: "Facts as the workbook states them  ·  design guidance and beta features labeled", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 9.6, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 2 of the deeper dive implementation series on attribute-driven migration from Active Directory to Microsoft Entra ID. The series sits below the two-part technical deep dive: it works at the level an engineer runs, with the rule text, the commands and their parameters, the input files the validation kit reads, what a failing check looks like, and the rollback for each gate.

It follows the workbook's implementation guide, which runs the migration's shared foundation as ten gates, and the project plan that schedules them, with task IDs and decisions. Part 1 covered Gates 0 to 3: reading the OU tree, the schema and coded slots, proving the attributes, and mapping them through sync. Part 2 covers Gates 4 to 6. Gate 4 is the dynamic group library and the administrative units. Gate 5 is the Conditional Access personas and the targeting conventions, and the core of this part, moving Group Policy for devices and for servers by adopting Microsoft's tools rather than building our own. Gate 6 is the PIV and CAC certificate binding. Part 3 covers Gates 7 to 9.

The labels are the series' usual ones. Facts come from the workbook's chapters and guides, which carry their Microsoft Learn sources. The program's recommendations are marked design guidance. Beta and preview features carry their stage.`,
  `${IG}, "How to use this guide," "The path on one page"; project plan (data/project-plans/attribute-driven-migration.yaml).`);
}

// ================================================================== 2 At a glance
{
  const s = content("Orientation", "Gates 4–6 at a glance, and the slots they read");
  tag(s, "What");
  const tb = table(s, "Glance", 1.45, [2.0, 4.2, 3.2, 1.45, 1.3], ["Gate", "Done when", "Validate with", "Plan", "Owner"], [
    ["4  Group library and units", "Every rule on codes with guards, tested and shadowed; every unit mirrors its group", "VK-DG-01 to VK-DG-07", "A4.1–A4.4, D-A4", "Identity eng. lead"],
    ["5  Targeting conventions", "Personas from codes, grants paired with blocks; device, server and non-person conventions handed off", "VK-CA-01, VK-HR-02; ca-export kept as the record; VK-INT-01, VK-INT-04, VK-ARC-01, VK-NPI-01", "A5.1–A5.4, D-A5", "CISO"],
    ["6  PIV binding", "Every pilot card holder bound; high affinity piloted", "VK-PIV-01 (by account); the pilot's sign-in logs", "A6.1, A6.2, D-A6, D-A7", "CISO"],
  ], { fontSize: 11.5, limit: 4.3 });
  const a = panel(s, "UserSlots", 0.6, tb + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "USER SLOTS (PROGRAM ATTRIBUTE MAP)", null, [
    "extensionAttribute10: organization code (FIN-LED)",
    "extensionAttribute11: worker type (EMP, CTR)",
    "extensionAttribute12: position category (ANALYST)",
    "extensionAttribute6: division code; extensionAttribute7: account type",
  ], 12.5);
  panel(s, "DeviceSlots", 6.85, tb + 0.25, 5.9, a - tb - 0.25, HEX.teal, HEX.tealTint, "DEVICE SLOTS (THE DEVICE'S OWN SET)", null, [
    "extensionAttribute11: security tier (Tier0, Tier1, Tier2)",
    "extensionAttribute12: device role (PAW, Kiosk)",
    "extensionAttribute13: environment (Production, Staging, Dev)",
    "Written by provisioning, not from the user's record",
  ], 12.5);
  sources(s, "Sources: Implementation guide, \"The path on one page\"; project plan, Phases 4–6; Book 03, Ch 06 attribute map; Book 02, Ch 05; Book 04, Ch 03; Book 05, Ch 08. Codes are placeholders.");
  notes(s,
`What Part 2 delivers, gate by gate, from the implementation guide's path on one page.

Gate 4, the group library and units, is done when every governed rule is written on codes with its guards, tested and shadowed, and every administrative unit's rule mirrors its group's. The validation kit's seven dynamic group checks, VK-DG-01 to 07, prove it. Plan tasks A4.1 to A4.4 and decision D-A4; the gate owner is the identity engineering lead.

Gate 5, the targeting conventions, is done when the personas come from codes, every grant has its paired block, and the device, server and non-person conventions are handed to their track guides. VK-CA-01 checks the personas on the users condition: the emergency-access exclusion, governed groups only, and grant and block pairs; the automation reference's ca-export stays the record, with VK-HR-02's empty-slot list. The track guides' checks measure the conventions: VK-INT-01 and 04 for devices, VK-ARC-01 for servers, VK-NPI-01 for owners. Tasks A5.1 to A5.4, decision D-A5; the CISO owns it.

Gate 6, the PIV binding, is done when every pilot card holder is bound and high affinity has been piloted. VK-PIV-01 measures binding coverage and affinity for the pilot card holders, by account; the pilot's sign-in logs show the rest. Tasks A6.1 and A6.2, decisions D-A6 and D-A7; the CISO owns it.

Below the table, the slots this part reads, from the program attribute map. On users: organization code in extensionAttribute10, worker type in 11, position category in 12, the division code in 6, and account type in 7, which the Admins persona reads. Devices have their own set: security tier in 11, device role in 12 and environment in 13, written by device provisioning. The codes are placeholders for the agency's own lists.`,
  `${IG}, "The path on one page," "Where the kits stop"; project plan, Phases 4–6; Book 03, Chapter 06 — "Program attribute map"; Book 02, Chapter 05 — "Division AUs"; Book 04, Chapter 03 — "Personas"; Book 05, Chapter 08 — "The device attribute schema."`);
}
endModule("Orientation");

// ================================================================== Gate 4
section(M1);

// 3 Rule text
{
  const s = content(M1, "Rule text: two patterns, with every guard");
  tag(s, "How");
  const c1 = code(s, "Node", 0.6, 1.45, 7.35, [
    '(user.accountEnabled -eq true) -and (user.userType -eq "Member")',
    '  -and (user.extensionAttribute10 -eq "FIN-LED")',
    "",
    '(user.accountEnabled -eq true) -and (user.userType -eq "Member")',
    '  -and (user.extensionAttribute10 -in ["FIN-LED","FIN-AP"])',
  ], { label: "PATTERN 1 · NODE QUERY: ONE CODE, OR -in FOR A ROLL-UP (BOOK 03 CH 10)", pt: 11.5 });
  code(s, "Functional", 0.6, c1 + 0.2, 7.35, [
    '(user.accountEnabled -eq true) -and (user.userType -eq "Member")',
    '  -and (user.extensionAttribute10 -in ["FIN-LED","FIN-AP"])',
    '  -and (user.extensionAttribute12 -eq "ANALYST")',
  ], { label: "PATTERN 2 · FUNCTIONAL QUERY: ORGANIZATION × POSITION (BOOK 06 CH 17)", pt: 11.5 });
  panel(s, "Guards", 8.2, 1.45, 4.55, null, HEX.red, HEX.redTint, "EVERY ACCESS RULE", null, [
    "accountEnabled -eq true and userType -eq \"Member\": VK-DG-01 flags a rule missing either",
    "Excludes agents' user accounts: user rules include them unless excluded. The books give no clause; prove yours with VK-DG-03 (design guidance)",
    "Codes in slots 10–12, never department, jobTitle or companyName (VK-DG-02)",
    "-eq and -in, not -match, -contains or -or chains",
    "Body ≤ 3,072 characters; ≤ 15,000 dynamic groups, units included",
    "Privileged groups stay assigned",
  ], 12);
  sources(s, "Sources: Book 03, Ch 10 \"Rule patterns\"; Book 01, Ch 04 \"The two query patterns\"; Book 06, Ch 17 \"Choosing the attributes\"; implementation guide, Gate 4. Codes are placeholders.");
  notes(s,
`Gate 4 starts with the rule text, because in this model a rule is an access grant. Plan task A4.1.

Every governed group uses one of two patterns, from Book 01 Chapter 04. Pattern 1 is the node query: users at one place in the organization, by organization code in slot 10. A roll-up over several codes uses the in operator with a bracketed list rather than a chain of ors. Pattern 2 is the functional query: an organizational attribute crossed with another coded attribute, here position category in slot 12, which answers a question that isn't about position in the tree. The rule text on the slide is Book 03 Chapter 10's and Book 06 Chapter 17's.

Every access rule carries two guards: user.accountEnabled equal to true, and user.userType equal to Member, which keeps out disabled accounts and guests. VK-DG-01 reports any dynamic user group whose rule lacks either. An agent's user account is a kind of user in Entra ID, and user rules evaluate it like any other user unless the rule excludes it, so every rule that grants workforce access adds that exclusion. The books don't spell out the clause, so write it against the agency's agent accounts and prove it with a named-user test.

Rules read codes, never display names: VK-DG-02 flags department, jobTitle and companyName, because a rule on a display string breaks the next time someone retypes it. Prefer eq and in to match and contains. A rule body can't exceed 3,072 characters, and a tenant can have at most 15,000 dynamic groups, with dynamic administrative units counting against the same total. Rules can't read employeeType, employeeOrgData or manager, which is why the coded slots exist. And privileged groups stay assigned: role-assignable groups need assigned membership, and HR decides only eligibility.`,
  `${IG}, Gate 4 steps 1–4; Book 01, Chapter 04 — "The two query patterns"; Book 03, Chapter 10 — "Rule patterns," "Limits and efficiency," "Where dynamic membership stops"; Book 06, Chapter 17 — "Choosing the attributes"; validation kit, Checks/DG.ps1 (VK-DG-01, VK-DG-02).`);
}

// 4 Test and shadow
{
  const s = content(M1, "Test, then shadow: VK-DG-03 and VK-DG-04");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    ".\\Invoke-ValidationKit.ps1 -OutputPath D:\\Validation -Track HR, DG -InputPath D:\\Inputs",
  ], { label: "RUN (DELEGATED SIGN-IN, ONLY THE READ SCOPES THE CHECKS NEED)", pt: 11.5 });
  const c2 = code(s, "Inputs", 0.6, c + 0.2, 6.3, [
    "rule-tests.json",
    '[{ "Label": "alice-in-ORG-A",',
    '   "GroupId": "<group-id>",',
    '   "MemberId": "<user-id>", "Expected": true }]',
    "",
    "shadow-pairs.csv",
    "CurrentGroupId,ProposedGroupId",
    "<group-it-replaces>,<proposed-dynamic-group>",
  ], { label: "INPUT FILES IN D:\\INPUTS (KIT README; FIXTURE SHAPES)", pt: 11 });
  const t = table(s, "Fails", c + 0.2, [1.25, 4.35], ["Check", "What a failing row says"], [
    ["VK-DG-03", "\"Rule evaluation differs from the expected membership\" (Graph beta evaluateDynamicMembership; delegated only, Groups Administrator; app-only gives Error)"],
    ["VK-DG-04", "\"Added by the proposed group\" or \"Removed by the proposed group\": a Finding, since ShadowAllowedDifferences defaults to 0"],
    ["Any", "A missing input gives NotApplicable, never Pass"],
  ], { x: 7.15, fontSize: 11, limit: 6.5 });
  if (process.env.FIT) console.log(`  test: inputs ${c2.toFixed(2)}, table ${t.toFixed(2)}`);
  callout(s, "Rollback", Math.max(c2, t) + 0.2, 0.75, "FaArrowsRotate", HEX.amber, "Rollback: ",
    "a new group grants nothing until assigned. Unassign it, keep the old group, revert the rule from Git.");
  sources(s, "Sources: Validation kit README (run, inputs, VK-DG-03 note) and Checks/DG.ps1; implementation guide, Gate 4 Validate and Rollback; Book 06, Ch 17 \"Writing, naming and testing rules.\"");
  notes(s,
`Next, prove each rule before it grants anything: plan tasks A4.2 and A4.4. The validation kit is read-only. Run it as the README shows, with the HR and DG tracks, delegated sign-in with only the read scopes those checks need, and an input folder.

VK-DG-03 reads rule-tests.json. Each test has a label, the member's object ID, either the group ID or the proposed membership rule, and Expected, true or false. The kit calls Graph's beta evaluateDynamicMembership action, which evaluates a rule and changes nothing; it's the only non-GET call in the kit, and a test pins it there. Microsoft lists no application permission for it, so the check runs delegated only, as at least a Groups Administrator, the same role the portal's Validate rules tab needs; an app-only run reports Error. A result that differs from Expected is a Finding: "Rule evaluation differs from the expected membership." Test people who should match and people who shouldn't.

VK-DG-04 reads shadow-pairs.csv: the current group's ID and the proposed dynamic group's ID. It lists every member the proposed group adds and removes. The allowed number of differences defaults to zero, so every add and remove is a Finding until it's explained in the record, before any rule grants production access. Book 06's sequence is the same: create the group with nothing attached, wait for processing to report Update complete, compare, explain.

A missing input makes a check NotApplicable, never Pass. Rule changes go under change control, because one edit can remove hundreds of people at once. Rollback: a new dynamic group grants nothing until it's assigned, so unassign it and leave the group it replaces in place; revert a rule change from the rule history in Git.`,
  `${IG}, Gate 4 steps 5–6, "Validate (Gate 4)," "Rollback"; validation kit README — "Run it," "Inputs," "Known limits" (VK-DG-03); Checks/DG.ps1; Book 06, Chapter 17 — "Writing, naming and testing rules."`);
}

// 5 memberOf and deltas
{
  const s = content(M1, "The memberOf preview ends; watch membership deltas");
  tag(s, "Why");
  callout(s, "MemberOf", 1.45, 0.85, "FaTriangleExclamation", HEX.red, "November 3, 2026: ",
    "the memberOf rule preview ends, and groups, units and auto-assignment policies that use it freeze in their last state.");
  const tb = table(s, "Watch", 2.5, [1.25, 3.0, 3.85], ["Check", "Reads", "Finding"], [
    ["VK-DG-06", "Every dynamic group's rule and processing state", "Processing Paused; any rule using memberOf"],
    ["VK-DG-05", "membership-snapshot.json from the last run", "Count changed by more than 10% and at least 5 members (DeltaThresholdPercent, DeltaThresholdMinimum)"],
  ], { fontSize: 11.5, limit: 6.5 });
  const c = code(s, "Snapshot", 0.6, tb + 0.2, 8.1, [
    "<OutputPath>\\<run-id>\\Snapshot\\membership-snapshot.json",
    "  -> copy to D:\\Inputs: the next run's VK-DG-05 input",
  ], { label: "THE FIRST RUN WRITES THE BASELINE; TAKE IT AT GATE 4", pt: 11 });
  if (process.env.FIT) console.log(`  memberof: snapshot ${c.toFixed(2)}`);
  panel(s, "Timing", 8.95, 2.5, 3.8, null, HEX.amber, HEX.amberTint, "PROCESSING TIME", null, [
    "Usually a few hours; can exceed 24",
    "Bulk change (over 500 groups or 20,000 membership changes): pause nonessential groups 24 hours, resume in phases",
    "Urgent removal: disable and revoke sessions",
  ], 12);
  sources(s, "Sources: Implementation guide, Gate 4 step 3; companion guide, Limits; Book 02, Ch 09; Book 06, Ch 17; validation kit README and Checks/DG.ps1 (VK-DG-05, VK-DG-06).");
  notes(s,
`Two things change membership without anyone editing a rule, and Gate 4 has to watch both.

The first is a date. The memberOf rule preview ends on November 3, 2026, and groups, units and auto-assignment policies that use it freeze in their last state. So Gate 4 uses no memberOf at all, and flattens nested chains instead of rebuilding them. VK-DG-06 reports any rule that still uses memberOf, and any group whose membershipRuleProcessingState is Paused, because a paused rule leaves membership frozen while every other check passes.

The second is volume. VK-DG-05 reads every dynamic group's transitive member count and compares it with membership-snapshot.json from the previous run. A change of more than 10 percent and at least 5 members is a Finding; both thresholds are options. With no previous snapshot it reports NotApplicable and writes this run's counts as the baseline, in the run's Snapshot folder, which becomes the next run's input. Take that first snapshot at Gate 4, so the mover proof in Part 3 has something to compare against.

And plan around processing time. Membership is usually processed within a few hours but can take more than 24, depending on tenant size, the number of groups, the volume of changes and rule complexity. For bulk changes, Microsoft's examples are more than 500 groups or more than 20,000 membership changes, it recommends pausing nonessential dynamic groups, waiting at least 24 hours, then resuming in phases. A rule change removes members who no longer match. Urgent removal doesn't wait for a rule: disable the account and revoke sessions.`,
  `${IG}, Gate 4 step 3, "Validate (Gate 4)"; companion guide, "Limits: rule limits," "Latency"; Book 02, Chapter 09 — "Nested groups," "Dynamic group rule syntax"; Book 06, Chapter 17 — "Writing, naming and testing rules"; validation kit, Checks/DG.ps1 (VK-DG-05, VK-DG-06) and README "What a run writes."`);
}

// 6 Administrative units
{
  const s = content(M1, "Administrative units: three tiers, restriction first");
  tag(s, "Who");
  const tb = table(s, "Tiers", 1.45, [2.1, 3.45, 6.6], ["Tier", "Example", "Scope or rule"], [
    ["1  Tenant readers", "Global Reader, Security Reader, Reports Reader", "Tenant scope: these roles can't be scoped to a unit"],
    ["2  Department", "AU-Department-Finance", '(user.extensionAttribute10 -in ["FIN-LED","FIN-AP"]), the same roll-up as its group'],
    ["3  Division, on demand", "AU-IT-CyberOps", '(user.extensionAttribute6 -eq "IT-CYBEROPS"): slot 6, a readable copy of the division'],
  ], { fontSize: 11.5, limit: 6.5 });
  const c = code(s, "Assign", 0.6, tb + 0.2, 7.0, [
    "New-MgRoleManagementDirectoryRoleAssignment `",
    "  -DirectoryScopeId ('/administrativeUnits/' + $au.Id) `",
    "  -PrincipalId $group.Id -RoleDefinitionId $role.Id",
    "",
    "au-group-map.csv: AdministrativeUnitId,GroupId",
    "restricted-au-reasons.csv: AdministrativeUnitId,Reason,DecisionRef",
  ], { label: "SCOPED ROLE TO A ROLE-ASSIGNABLE GROUP (BOOK 02 CH 05) · VK-DG-07 INPUTS", pt: 11 });
  const p = panel(s, "Restrict", 7.85, tb + 0.2, 4.9, null, HEX.red, HEX.redTint, "RESTRICTION: DECIDE BEFORE CREATION (D-A4)", null, [
    "Default no; it can't be changed afterward",
    "Members leave PIM, entitlement management, Lifecycle Workflows and access reviews",
    "At most 100 restricted units",
    "VK-DG-07: unit rule unlike its group's; restricted unit with no reason",
  ], 12);
  if (process.env.FIT) console.log(`  au: code ${c.toFixed(2)}, panel ${p.toFixed(2)}`);
  sources(s, "Sources: Book 02, Ch 05 (three tiers, registry, code, restriction); Book 03, Ch 10; implementation guide, Gate 4 steps 7–9; validation kit README and Checks/DG.ps1 (VK-DG-07).");
  notes(s,
`Administrative units replace OU delegation, in Book 02 Chapter 05's three tiers. Plan task A4.3.

Tier 1 is read-only visibility across the tenant. Its roles, Global Reader, Security Reader and Reports Reader, can't be assigned at unit scope, so they're assigned at tenant scope; units don't restrict reading anyway. Tier 2 is the department unit. Its rule lists every organization code in the department, the roll-up form of the node query, and it changes together with the matching group's rule when HR adds a code. Tier 3 is the division unit, created on demand. It reads the division code in slot 6, extensionAttribute6, a copy of the division that rules can read. Where division codes repeat across departments, add the department's organization codes to the rule.

Scoped roles go to role-assignable groups whose members are eligible through PIM. The code is Book 02's illustrative assignment: the scope string slash administrativeUnits slash the unit's ID grants management of the unit's members, not of the unit itself. Create each unit and its scoped assignment before the groups it holds, per Book 06's Runbook R07.

The decision that can't be undone is restriction, D-A4, owned by identity engineering. Decide it before the unit exists. The default is no: restriction can't be changed afterward, and it takes the unit's users and groups out of PIM, entitlement management, Lifecycle Workflows and access reviews. Reserve it for small sets, such as executives and break-glass accounts. A tenant can have at most 100.

VK-DG-07 reads au-group-map.csv and reports any mapped unit that isn't dynamic, or whose rule differs from its group's. It reads restricted-au-reasons.csv and reports any restricted unit with no recorded reason. Know what a unit doesn't do: units don't nest, they limit who can change members, not who can see them, and in GCC High and DoD, where dynamic units aren't available, an automation job keeps membership current.`,
  `${IG}, Gate 4 steps 7–9, "Validate (Gate 4)"; project plan D-A4, A4.3; Book 02, Chapter 05 — "The three-tier model," "Administrative unit registry," "Illustrative code," "Restricted management: a per-AU decision"; Book 03, Chapter 10 — "Administrative units"; validation kit, Checks/DG.ps1 (VK-DG-07).`);
}
endModule(M1);

// ================================================================== Gate 5
section(M2);

// 7 Personas
{
  const s = content(M2, "Conditional Access personas from slot 11");
  tag(s, "Who");
  const tb = table(s, "Personas", 1.45, [1.5, 4.85], ["Persona", "Group, and how it's populated"], [
    ["Internals", "CA-Persona-Internals: dynamic, extensionAttribute11 in {EMP, CTR}"],
    ["Admins", "CA-Persona-Admins: extensionAttribute7 = Privileged, or the PIM-eligible population"],
    ["Break-glass", "CA-Exclude-EmergencyAccess: assigned, two members; excluded from every blocking policy"],
  ], { fontSize: 11.5, limit: 4.2 });
  const p = panel(s, "Pairs", 7.2, 1.45, 5.55, null, HEX.red, HEX.redTint, "GRANT PAIRED WITH BLOCK (BOOK 04 CH 03)", null, [
    "Policy 1, grant: Finance group to the payroll app, require phishing-resistant MFA and a compliant device",
    "Policy 2, block: all users except Finance to the payroll app",
    "Without policy 2, anyone else gets a token with no controls",
  ], 12);
  const y2 = Math.max(tb, p) + 0.2;
  const c = code(s, "Export", 0.6, y2, 6.6, [
    ".\\Invoke-ValidationKit.ps1 -OutputPath D:\\Validation `",
    "  -Track CA -InputPath D:\\Inputs",
    "emergency-access-groups.csv: GroupId,Name",
    "governed-groups.csv: GroupId,Name,Owner",
    "",
    "# The record: ms-automation, app-only, Policy.Read.All",
    "Invoke-FmwEntraTask -Task ca-export -OutDirectory <folder>",
  ], { label: "VK-CA-01 (Policy.Read.All) · INPUTS · ca-export", pt: 11 });
  const t = table(s, "Ca01", y2, [5.3], ["What a failing VK-CA-01 row says"], [
    ["\"Emergency-access group not excluded\""],
    ["\"Targets a group outside the governed-group list\""],
    ["\"Grant with no paired block: everyone outside its groups gets a token without its controls\""],
    ["Users condition only: read the export for blocks narrower than their grants; add VK-HR-02's empty-slot-11 list"],
  ], { x: 7.45, fontSize: 11, firstBold: false, limit: 6.5 });
  if (process.env.FIT) console.log(`  personas: code ${c.toFixed(2)}, table ${t.toFixed(2)}`);
  sources(s, "Sources: Book 04, Ch 03 (personas, pairs, exclusions); implementation guide, Gate 5 Validate; validation kit README, Checks/CA.ps1; ms-automation README, FmwGraph.psm1.");
  notes(s,
`Gate 5 retires Group Policy inheritance for people, and the risk is policies that look strict but restrict nothing. Plan task A5.1.

Personas come from coded attributes. The Internals persona group, CA-Persona-Internals, is dynamic on the worker type code in slot 11, EMP or CTR. The Admins group reads account type in slot 7, Privileged, or the PIM-eligible population; target administrators by group, because role targeting covers built-in roles only and doesn't reach roles scoped to a unit. The emergency-access group is assigned, with two members, and excluded from every policy that blocks or restricts sign-in.

Pair every grant with a block. Access tokens are issued when no policy's conditions trigger a control, so a policy that grants Finance the payroll app with strong controls says nothing about anyone else. The second policy blocks all users except Finance.

Report empty slots before enforcement. A policy that includes a dynamic group silently misses every user whose attribute is empty, an exclusion nobody approved. VK-HR-02 lists users with an empty slot 11.

The persona set is decision D-A5, and the CISO decides. Run report-only for two to four weeks, then enforce in waves behind a monitoring gate, with the emergency-access group excluded. Rollback is a policy back to report-only.

VK-CA-01 validates it. It reads every enabled and report-only policy that targets users, with Policy.Read.All, and reports three things. A policy that doesn't exclude a group in emergency-access-groups.csv. A policy that targets a group outside governed-groups.csv. And a grant on groups with no paired block, meaning no block on all users, for an overlapping application, that excludes every group the grant includes. Microsoft-managed policies are read like any other, because they need the emergency-access exclusion too.

It reads the users condition only. It doesn't compare platforms, locations or client apps, so a block narrower than its grant passes. That's why the Microsoft automation reference's ca-export stays the record: it signs in as an application with a certificate or a managed identity, needs Policy.Read.All, and writes one sorted JSON file per policy plus the named locations, with a summary of state and grant controls. Read it for narrow blocks, keep the report-only review, and add VK-HR-02's list of users with an empty slot 11, who sit outside every persona built from it.`,
  `${IG}, Gate 5 steps 1–5, "Validate (Gate 5)," "Where the kits stop," "Rollback"; project plan A5.1, D-A5; Book 04, Chapter 03 — "Users, groups, roles and workload identities," "Policies come in pairs," "Exclusions," "Personas"; validation kit README and Checks/CA.ps1 (VK-CA-01); examples/ms-automation README and powershell/FmwGraph.psm1 (ca-export).`);
}

// 8 Devices
{
  const s = content(M2, "Device targeting: device slots, groups, filters");
  tag(s, "How");
  const c = code(s, "Dev", 0.6, 1.45, 7.6, [
    "$params = @{ extensionAttributes = @{",
    "  extensionAttribute11 = 'Tier0'; extensionAttribute13 = 'Production' } }",
    "Update-MgDevice -DeviceId $deviceObjectId -BodyParameter $params",
    "",
    "# Dynamic device group: only where the rule reads a slot",
    '(device.extensionAttribute11 -eq "Tier0")',
    '(device.extensionAttribute12 -in ["Kiosk","SharedDevice"])',
    "",
    "# Assignment filter: Intune properties, never slots",
    '(device.deviceOwnership -eq "Corporate")',
    '(device.enrollmentProfileName -startsWith "FMP-Kiosk")',
  ], { label: "PROVISIONING WRITES THE SLOTS (APP-ONLY: Device.ReadWrite.All) · BOOK 05 CH 08", pt: 11 });
  const p = panel(s, "Rules", 8.45, 1.45, 4.3, null, HEX.teal, HEX.tealTint, "THE CONVENTION (A5.2)", null, [
    "A device rule can never read its owner's attributes",
    "A filter on a slot doesn't evaluate",
    "Time-sensitive: user group or All devices, plus a filter",
    "Never a dynamic device group as an exclusion",
    "Servers (A5.3): Arc tags use the same codes; resource groups are the delegation scope",
  ], 12);
  const tb = table(s, "IntChecks", Math.max(c, p) + 0.2, [1.3, 10.85], ["Check", "What a failing row says"], [
    ["VK-INT-01", "\"Managed device missing provisioning-written attributes\" (tier, role or environment; Device.Read.All)"],
    ["VK-INT-04", "\"Exclusion uses a dynamic device group\" (DeviceManagementConfiguration.Read.All, Group.Read.All; settings catalog beta with -IncludeBeta)"],
  ], { fontSize: 11, limit: 6.5 });
  if (process.env.FIT) console.log(`  devices: table ${tb.toFixed(2)}`);
  sources(s, "Sources: Book 05, Ch 08 (device schema, assignment strategy, templates); implementation guide, Gate 5 steps 6–7; validation kit README, Catalog.ps1 and Checks/INT.ps1.");
  notes(s,
`Gate 5 also sets the conventions the device and server tracks build their targeting on; the track guides run the targeting itself. Plan tasks A5.2 and A5.3.

Devices first. Device attributes come from device provisioning, never from the user's record, and a device rule can never read its owner's attributes. The convention: tier, role and environment are written to the device's own slots at registration by the device provisioning service. Book 05's sample is a delegated call by at least an Intune Administrator; an unattended provisioning service runs app-only with Device.ReadWrite.All, and app-only calls can update only extensionAttributes, which is all it writes. Note the device object ID, not the device ID.

Use dynamic device groups only where a rule must read those slots, and assignment filters otherwise. Filters can't read device extension attributes: a filter on extensionAttribute11 or 13 doesn't evaluate. They work on Intune properties such as ownership, trust type, enrollment profile, model and OS SKU. For time-sensitive assignment Microsoft's guidance is a user group, or All devices for userless devices, with a filter. And never use a dynamic device group as an exclusion, because a late membership calculation can let the policy reach the device first.

Two checks measure it. VK-INT-01 reports managed devices missing the provisioning-written slots. VK-INT-04 lists policy assignments on dynamic device groups against filters, and flags any exclusion that uses a dynamic device group.

Servers: once connected, an Arc server is an Azure resource whose tags are its attributes, drawn from the asset record at onboarding. The tag taxonomy uses the same codes as the device slots where the fact is the same, and resource groups, not tags, are the delegation scope. Non-person identities record owners and sponsors by the enterprise person key.`,
  `${IG}, Gate 5 steps 6–9, "Validate (Gate 5)"; project plan A5.2–A5.4; Book 05, Chapter 08 — "The device attribute schema," "Assignment strategy," "Writing a device attribute," "Assignment filter examples"; validation kit, Checks/INT.ps1 (VK-INT-01, VK-INT-04).`);
}

// 9 Device GPOs: adopt
{
  const s = content(M2, "Moving device GPOs: adopt Microsoft's tools");
  tag(s, "How");
  const W = 2.33, G2 = 0.125, Y = 1.45, H = 2.35;
  const steps = [
    ["Find conflicts", "Policy Analyzer and GPO2PolicyRules (Security Compliance Toolkit): redundant and conflicting values, offline, from GPO backups", HEX.navy],
    ["Export", "Every GPO as XML, with links, security filtering and WMI filters", HEX.navy],
    ["Import", "Devices > Group Policy analytics: per setting, its MDM equivalent, CSP and OMA-URI. Windows only", HEX.teal],
    ["Classify", "Required, obsolete, high-risk or redundant; a decision record per setting; gpresult baseline per tier", HEX.teal],
    ["Check as data", "VK-INT-07 (beta): readiness per GPO; GPOs targeted in AD not complete; in-scope GPOs never imported", HEX.amber],
  ];
  steps.forEach(([h, b, col], k) => step(s, `Step${k + 1}`, 0.6 + k * (W + G2), Y, W, H, k + 1, h, b, col));
  const c = code(s, "Gpa", 0.6, Y + H + 0.2, 7.3, [
    "Get-GPOReport -All -ReportType Xml",
    "",
    "GET /beta/deviceManagement/groupPolicyMigrationReports",
    "  DeviceManagementConfiguration.Read.All; never create (ReadWrite)",
    ".\\Invoke-ValidationKit.ps1 -OutputPath D:\\Validation -Track INT `",
    "  -InputPath D:\\Inputs -IncludeBeta   # gpo-scope.csv: every in-scope GPO",
  ], { label: "THE SHAPE GROUP POLICY ANALYTICS IMPORTS · VK-INT-07 READS THE REPORTS", pt: 11 });
  const p = panel(s, "Baselines", 8.15, Y + H + 0.2, 4.6, null, HEX.navy, HEX.navyTint, "FINDINGS, OR START FROM A BASELINE", null, [
    "\"In scope, but not imported into Group Policy analytics\"",
    "Targeted in AD, readiness not complete: settings Intune can't take over",
    "Intune security baselines: same team as the GP baselines, minus DC settings",
  ], 12);
  if (process.env.FIT) console.log(`  gpo: code ${c.toFixed(2)}, panel ${p.toFixed(2)}`);
  sources(s, "Sources: Book 05, Ch 08 \"Phase 1: inventory and classify,\" \"Adopt, don't build\"; Ch 07; validation kit README and Checks/INT.ps1 (VK-INT-07); implementation guide, Gate 5.");
  notes(s,
`Now the core of this part: moving Group Policy. The computer half of every GPO moves with devices to Intune, and with servers to Azure Policy. Book 05's rule is adopt, don't build: Microsoft already publishes the analysis and conversion, and the program adds only what those tools can't supply: the decision record per setting, the order of work and the evidence.

Phase 1, inventory and classify, runs in five steps. One: find GPO-on-GPO conflicts, the same setting written by more than one GPO at different OU levels, the conflicts OU precedence hid. Policy Analyzer in the Security Compliance Toolkit works offline from GPO backups: it treats a set of GPOs as one unit, highlights redundant settings and conflicting values, compares them with Microsoft's baselines, and diffs a later snapshot against the first. GPO2PolicyRules is its command-line companion.

Two: export every GPO as XML, cataloguing links, security filtering and WMI filters; Get-GPOReport with All and report type Xml is the shape Group Policy analytics imports, and Chapter 07 gives the read-only export script. Three: import it under Devices, Group Policy analytics. For each GPO it shows how many settings have an MDM equivalent and, per setting, the CSP and OMA-URI. It's Windows only. Four: classify each setting as required, obsolete, high-risk or redundant, record what kind of equivalent exists, and capture the effective-policy baseline per device tier with gpresult on a sample.

Five: read the analysis as data. Microsoft Graph's groupPolicyMigrationReports, in beta, gives each GPO's migration readiness, none, partial or complete, and its supported-setting counts. VK-INT-07 reads it with a GET on /beta/deviceManagement/groupPolicyMigrationReports, using DeviceManagementConfiguration.Read.All, and runs only with -IncludeBeta. It never creates, updates or deletes a report, which would need ReadWrite. A GPO targeted in AD whose readiness isn't complete is a Finding, with its unsupported extensions counted; notApplicable is a Warn. With gpo-scope.csv, listing every in-scope GPO by ID or name, a GPO that was never imported is a Finding rather than silently missing. It doesn't read the per-setting mappings; use Group Policy analytics in the admin center for those. The API is listed for the global service, which GCC uses, and US Government L4 and L5.

Where a legacy GPO isn't worth carrying forward, start instead from an Intune security baseline, built by the same Microsoft team as the Group Policy baselines, without the settings specific to domain controllers.`,
  `Book 05, Chapter 08 — "The seven phases at working level," "Phase 1: inventory and classify," "Adopt, don't build: Microsoft's tools for this migration"; Chapter 07 — the read-only export; ${IG}, Gate 5; Intune track implementation guide, Gate 3.`);
}

// 10 Migrate step
{
  const s = content(M2, "The Migrate step, the pilot, and rollback");
  tag(s, "How");
  const a = panel(s, "Migrate", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "PHASE 3 · GROUP POLICY ANALYTICS' MIGRATE STEP", null, [
    "Select the imported GPOs and only the settings whose decision record says required; review the values",
    "Leave Assignments empty: the policy is saved unassigned",
    "Two GPOs with different values for one setting: it refuses to continue until one is kept",
    "Best effort: some settings map to an alternate; failures are listed in Notifications",
    "Not for AppLocker or firewall rules: build those in Endpoint security",
    "Peer review: every setting traces to a decision record; none is in two policies",
  ], 12);
  const b = panel(s, "Pilot", 6.85, 1.45, 5.9, a - 1.45, HEX.teal, HEX.tealTint, "PHASE 4 · PILOT, ABOUT 5% OF THE FLEET", null, [
    "GPOs stay linked: the pilot measures conflicts, it doesn't remove them",
    "Compare each device's gpresult with Intune's per-setting status",
    "Conflict or Error in Intune, or a gpresult value that differs: a finding",
    "Compliance grace period 7 days in the pilot, not 1",
    "Pilot doesn't clean up: unassigning under Pilot Intune leaves the policy; roll back by assigning the old value",
  ], 12);
  const c = code(s, "Unlink", 0.6, Math.max(a, b) + 0.2, 12.15, [
    "Backup-GPO -Name $gpoName -Path '\\\\fileserver\\GPOBackups' -Comment 'Pre-unlink, GPO sunset wave 1'",
    "Set-GPLink -Name $gpoName -Target $target -LinkEnabled No      # rollback: -LinkEnabled Yes",
  ], { label: "PER POPULATION: BACK UP, THEN DISABLE THE LINK, NOT THE GPO (BOOK 05 CH 07); KEEP 90 DAYS", pt: 11 });
  if (process.env.FIT) console.log(`  migrate: code ${c.toFixed(2)}`);
  sources(s, "Sources: Book 05, Ch 08 \"Phase 3,\" \"Phase 4,\" \"Testing at each gate,\" \"Rollback\"; Ch 07 \"Freezing and unlinking GPOs\"; implementation guide, Gate 5 Rollback.");
  notes(s,
`Phase 3 builds the policies, and assigns none of them. Where Group Policy analytics found a direct equivalent, build the settings catalog policy with its Migrate step rather than by hand. Select the imported GPOs and only the settings whose decision record says required, review the values, and leave Assignments empty so the policy is saved unassigned.

Know where Migrate stops. If two selected GPOs set the same setting to different values, the step refuses to continue until one is kept, and Microsoft advises against migrating every setting without review. It's best effort: some settings map to an alternate setting with a similar effect, some fail and are listed in Notifications, and AppLocker and firewall rule settings can't be migrated this way at all; they're built in the Endpoint security workload. Then peer review each policy: every setting traces to a required setting in a decision record, and no setting appears in two policies. Attack surface reduction rules start in audit mode.

Phase 4 is the pilot, about 5 percent of the fleet, representative across tiers, regions and departments, with a 7-day compliance grace period instead of 1. The GPOs stay linked, because the pilot measures conflicts. Compare each device's gpresult with Intune's per-setting status: Conflict or Error in Intune, or a gpresult value that differs from Intune's, is a finding.

Rollback is defined before each phase. Pilot doesn't clean up: with Pilot Intune selected, Intune doesn't remove a policy when it's unassigned, so rolling back means assigning a policy that sets the old value. Moving a workload back to Configuration Manager can leave state behind. And because links are disabled, not GPOs deleted, the GPO path comes back with one command. Per population: back up the GPO, prove the replacement, then Set-GPLink with LinkEnabled No. Disabled GPOs are kept 90 days before they're archived and deleted, and Group Policy preference items that weren't set to remove themselves stay on the device, so each needs an Intune setting or a Remediation.`,
  `Book 05, Chapter 08 — "Phase 3: baseline authoring," "Phase 4: pilot," "Phase 6," "Phase 7," "Testing at each gate," "Rollback"; Chapter 07 — "Freezing and unlinking GPOs"; ${IG}, Gate 5 "Rollback."`);
}

// 11 Server GPOs
{
  const s = content(M2, "Moving server GPOs: audit beside Group Policy first");
  tag(s, "How");
  const tb = table(s, "Path", 1.45, [2.3, 5.2], ["Step", "What Microsoft publishes"], [
    ["1  Audit beside GPO", "Group Policy keeps enforcing while Azure Policy audits the same settings; then move enforcement gradually"],
    ["2  Start built in", "The customizable security baselines, and built-in definitions for common Group Policy areas"],
    ["3  Package the residue", "The GuestConfiguration module: a custom package from a DSC configuration, tested, published, signed"],
    ["4  Converted GPO = draft", "ConvertFrom-GPO (BaselineManagement) turns a Backup-GPO folder into DSC: community-supported, not Microsoft"],
  ], { fontSize: 11.5, limit: 6.5 });
  const p = panel(s, "Cautions", 8.35, 1.45, 4.4, null, HEX.red, HEX.redTint, "TWO CAUTIONS WHILE BOTH RUN", null, [
    "Azure Policy settings don't appear in RSoP or gpresult: compliance reports are the record",
    "Per-user settings (mapped drives, screensaver, MSI installs) stay with Group Policy",
    "No Group Policy analytics for servers",
  ], 12);
  code(s, "Builtin", 0.6, Math.max(tb, p) + 0.2, 12.15, [
    "Windows machines should meet requirements of the Azure compute security baseline",
    "Linux machines should meet requirements for the Azure compute security baseline",
    "Windows machines should meet requirements for 'Windows Firewall Properties'",
    "Authoring: PowerShell 7 + PSDesiredStateConfiguration 2.0.7 · a package that applies: Arc agent 1.10.0 or later",
  ], { label: "BUILT-IN DEFINITIONS (DEPLOY THE PREREQUISITE INITIATIVE FIRST) · CUSTOM PACKAGE REQUIREMENTS", pt: 11 });
  sources(s, "Sources: Book 05, Ch 09 \"Azure Policy and machine configuration,\" \"Moving server GPOs: adopt Microsoft's path\" (Microsoft Learn as footnoted there); Arc track guide, Step 4.");
  notes(s,
`Servers have no Group Policy analytics: Microsoft publishes no tool that imports a GPO into machine configuration. What it publishes is a path, and the program adopts it rather than writing its own converter.

Step one, audit beside Group Policy first. Microsoft's guidance is to let Group Policy keep enforcing while Azure Policy audits the same settings, then move enforcement over gradually, avoiding conflicting configurations. Two cautions come with it. Settings applied through Azure Policy don't appear in RSoP or gpresult, so the compliance reports become the record. And per-user settings, such as mapped drives, screensaver timeouts and MSI installs, stay with Group Policy, because Azure Policy isn't tied to user sign-in.

Step two, start from what's built in. The Windows and Linux audit baselines are built-in definitions, and both can be customized; deploy the machine configuration prerequisite initiative to the scope first. Built-in definitions for common Group Policy areas, such as the Windows Firewall Properties one, cover many settings without conversion. Assign them to the Arc resource groups as policy-as-code, version the customized baseline JSON, and treat noncompliance as a finding, not a failed deployment.

Step three, package the residue. For a setting no built-in definition covers, Microsoft's GuestConfiguration module builds a custom package from a DSC configuration, tests it, publishes and signs it, and creates the policy. Authoring needs PowerShell 7 and PSDesiredStateConfiguration 2.0.7, and a package that applies settings, not just audits them, needs Arc agent 1.10.0 or later.

Step four, treat a converted GPO as a draft. ConvertFrom-GPO in the BaselineManagement module turns a Backup-GPO folder into a DSC configuration, but the module is community-developed and supported by its maintainers, not by Microsoft, and its quickstart is written for Windows PowerShell 4.0 and 5.0. Design guidance: recompile its output under step three's authoring environment and test it in audit mode before anything enforces it.

One more: if a server disconnects, its guest assignments are kept locally for 14 days, then deleted.`,
  `Book 05, Chapter 09 — "Azure Policy and machine configuration," "Moving server GPOs: adopt Microsoft's path"; Arc track implementation guide, Step 4 "The baselines"; ${IG}, Gate 5 step 7.`);
}

// 12 RHEL on AWS with Ansible
{
  const s = content(M2, "RHEL on AWS under Ansible: one owner per setting");
  tag(s, "Who");
  const tb = table(s, "Owners", 1.45, [2.0, 5.2], ["Rule (design guidance)", "What it means"], [
    ["1  Owner is an attribute", "CMDB config_owner: Intune, Arc machine configuration, Configuration Manager, Ansible or the platform"],
    ["2  Write only what you own", "Changing playbooks target only config_owner Ansible: inventory group plus an assertion"],
    ["3  Onboarding isn't owning", "After the Arc agent connects, Ansible doesn't set what machine configuration sets"],
    ["4  Exception is a record", "Dated, with a reason; the owner's baseline catches up"],
    ["5  One patch owner", "patch_owner, mirrored to PatchOwner; Update Manager only assesses Ansible-patched servers"],
  ], { fontSize: 11, limit: 6.5 });
  const p = panel(s, "Connect", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "ARC CAN CONNECT THIS FLEET", null, [
    "RHEL 7–10 supported by the Connected Machine agent",
    "EC2: the agent on each instance. The multicloud connector isn't in Azure Government",
    "Tags at connect: ConfigOwner from config_owner, PatchOwner from patch_owner",
    "Only PatchOwner UpdateManager servers get a patch schedule",
  ], 12);
  const c = code(s, "Assert", 0.6, Math.max(tb, p) + 0.2, 6.6, [
    "hosts: os_linux:&config_owner_ansible",
    "- name: Refuse a host whose configuration another tool owns",
    "  ansible.builtin.assert:",
    "    that: config_owner | default('') == 'ansible'",
  ], { label: "03_LINUX_BASELINE_CHECK.YML (EXAMPLES/ANSIBLE)", pt: 11 });
  const t2 = table(s, "Arc07", Math.max(tb, p) + 0.2, [1.25, 4.05], ["VK-ARC-07", "Finding (input: cmdb.csv config_owner)"], [
    ["Finding", "\"Configuration owned by another tool, but machine configuration also enforces settings\""],
    ["Warn", "Enforcing assignment, no recorded owner"],
  ], { x: 7.45, fontSize: 11, limit: 6.5 });
  if (process.env.FIT) console.log(`  ansible: code ${c.toFixed(2)}, table ${t2.toFixed(2)}`);
  sources(s, "Sources: Ansible guide, \"One owning tool per setting\" (rules 1–5), \"Cloud VMs\"; Arc track guide, Step 2 tags, Step 7; Book 05, Ch 09; examples/ansible; validation kit ARC.ps1.");
  notes(s,
`A common estate already runs Ansible: Red Hat Enterprise Linux on AWS, configured and patched by playbooks. Arc can connect it. RHEL 7 to 10 is on the Connected Machine agent's supported list. EC2 instances connect with the agent on each instance, or through the multicloud connector, which discovers instances and installs the agent, but the connector isn't available in Azure Government. Microsoft lists Ansible's azure_arc role among the at-scale onboarding methods.

The danger is two tools on one setting. Ansible can write to a server that machine configuration already governs, and nothing in either tool notices; under auto-correct, the two flip a value back and forth while both report success. The Ansible guide's five rules, design guidance. One: the owner is an attribute, the CMDB's config_owner. Two: Ansible reads anything and writes only what it owns; a changing playbook runs only against hosts whose config_owner is Ansible, enforced by the inventory group built from that attribute and by an assertion in the playbook, as the example Linux baseline check does. Three: onboarding isn't owning. Four: an exception is a dated record with a reason, and the owner's baseline is updated within its life. Five: patching has one owner too, patch_owner, mirrored to the PatchOwner tag. Where Ansible already patches the fleet, Update Manager keeps periodic assessment only and schedules nothing on those servers.

The Arc track guide's Step 2 tag table carries both: ConfigOwner from config_owner and PatchOwner from patch_owner, optional tags written at onboarding, and only PatchOwner UpdateManager servers get a scheduled patching configuration.

VK-ARC-07 catches the collision: a server whose config_owner in cmdb.csv, or else its ConfigOwner tag, isn't machine configuration, but which carries an ApplyAndMonitor, ApplyAndAutoCorrect or DeployAndAutoCorrect assignment; Audit only reports. No recorded owner with an enforcing assignment is a warning. The kit compares owner values in lower case, without separators and without a leading arc or azure, so ArcMachineConfiguration, arc_machine_configuration and machine configuration all count as machine configuration.`,
  `Ansible configuration automation guide — "One owning tool per setting," "Arc onboarding at scale," "Linux and Unix baselines," "Cloud VMs," "Dangers"; Arc track implementation guide — Step 2.1 tag table, Step 5, Step 7; Book 05, Chapter 09 — "Which servers Arc reaches," "Azure Update Manager"; examples/ansible/playbooks/03_linux_baseline_check.yml; validation kit, Checks/ARC.ps1 (VK-ARC-07).`);
}

// 13 What the overview simplified
{
  const s = content(M2, "What the overview simplified");
  tag(s, "Why");
  txt(s, "Lead", "Three places where the overview's clean picture meets a messier estate (design guidance).",
    { x: 0.6, y: 1.45, w: 12.15, h: 0.4, fontSize: 15, color: HEX.ink });
  const W = 3.9;
  const a = panel(s, "Groups", 0.6, 2.0, W, null, HEX.navy, HEX.navyTint, "NOT EVERY GROUP FOLLOWS THE ORG", "Many stay assigned", [
    "Only a group whose membership follows attributes exactly becomes dynamic",
    "Others stay synced, go cloud-only, or retire",
    "Privileged groups stay assigned",
    "What a rule can't decide moves to access packages",
  ], 12.5);
  const b = panel(s, "Can", 0.6 + W + 0.225, 2.0, W, a - 2.0, HEX.teal, HEX.tealTint, "ANALYTICS ANSWERS CAN, NOT SHOULD", "Can move ≠ should move", [
    "Group Policy analytics finds the landing zone",
    "It never decides whether a setting is still needed",
    "Retire obsolete, redundant and high-risk settings before you translate",
  ], 12.5);
  panel(s, "Side", 0.6 + 2 * (W + 0.225), 2.0, W, a - 2.0, HEX.red, HEX.redTint, "SIDE BY SIDE IS WHERE IT BREAKS", "Two tools, one setting", [
    "GPO and Intune in the pilot; GPO and Azure Policy while auditing; Ansible and machine configuration",
    "Each reports success while the other wins",
    "One owner per setting, checked",
  ], 12.5);
  callout(s, "Simpl", a + 0.25, 0.8, "FaLightbulb", HEX.amber, "So: ",
    "count the groups that won't go dynamic, and test every overlap, not just each tool.");
  sources(s, "Sources: Book 02, Ch 09 \"The per-group decision\"; Book 03, Ch 10; Book 05, Ch 07 and 08 Phase 1, Ch 09; Ansible guide, \"One owning tool per setting.\" Framing: design guidance.");
  notes(s,
`One honest slide on what the overview simplified. This framing is design guidance; the facts behind each point are in the chapters named.

First, many groups don't follow the organization. The overview says OU-derived groups become dynamic rules, and they do, but Book 02's per-group decision has five outcomes: keep a group used only for on-premises ACLs in AD, synchronize one used both on-premises and in the cloud, convert one used only in the cloud, convert to dynamic only where membership follows attributes exactly, and retire one with no members or assignments. Privileged groups stay assigned. And Book 03 puts the entitlements a rule can't decide alone into access packages. Expect a large share of groups to stay assigned or move to packages.

Second, Group Policy analytics says what can move, not what should. Book 05 is explicit: use it to find the landing zone, never to decide whether a setting is still needed. Chapter 07's principles are regenerate, don't copy, and retire before you translate: obsolete, redundant and high-risk settings aren't carried forward.

Third, side-by-side running is where breakage hides. In the device pilot, GPOs stay linked while Intune applies, and conflicts show as Conflict or Error or a differing gpresult value. On servers, Group Policy enforces while Azure Policy audits, and Azure Policy settings don't show in gpresult at all. With Ansible, auto-correct and a playbook can flip one value back and forth while both report success. Each tool tests clean on its own; the overlap is what fails. So test the overlap, and make one owner per setting a checked attribute.`,
  `Book 02, Chapter 09 — "The per-group decision"; Book 03, Chapter 10 — "Access packages and access reviews," "Where dynamic membership stops"; Book 05, Chapter 07 — "Methodology principles"; Chapter 08 — "Phase 1," "Phase 4"; Chapter 09 — "Moving server GPOs"; Ansible guide — "One owning tool per setting."`);
}
endModule(M2);

// ================================================================== Gate 6
section(M3);

// 14 certificateUserIds
{
  const s = content(M3, "PIV binding: certificateUserIds values and limits");
  tag(s, "What");
  const tb = table(s, "Bind", 1.45, [2.6, 3.4, 0.9], ["Certificate field", "Value in certificateUserIds", "Affinity"], [
    ["PrincipalName", "X509:<PN>bob@woodgrove.com", "Low"],
    ["RFC822Name", "X509:<RFC822>user@woodgrove.com", "Low"],
    ["Subject", "X509:<S>DC=com,DC=contoso,…", "Low"],
    ["IssuerAndSubject", "X509:<I>…<S>…", "Low"],
    ["SKI", "X509:<SKI>…", "High"],
    ["SHA1PublicKey", "X509:<SHA1-PUKEY>…", "High"],
    ["IssuerAndSerialNumber", "X509:<I>…<SR>…", "High"],
  ], { fontSize: 11.5, limit: 6.5 });
  const p = panel(s, "Limits", 7.75, 1.45, 5.0, null, HEX.navy, HEX.navyTint, "LIMITS AND WRITERS (COMPANION GUIDE)", null, [
    "Up to 10 values of up to 1,024 characters; each unique in the tenant; X509 prefixes are case-sensitive",
    "Admin center: up to four values of 120 characters",
    "Cloud-only users: Privileged Authentication Administrator, or Graph",
    "Synced users: only Entra Connect, from altSecurityIdentities; Hybrid Identity Administrator. Cloud Sync: not documented",
  ], 12);
  code(s, "Patch", 0.6, Math.max(tb, p) + 0.2, 12.15, [
    "PATCH /users/{id}   { \"authorizationInfo\": { \"certificateUserIds\": [ \"X509:<SKI>…\" ] } }",
    "Get-EntraUserCertificateUserIdsFromCertificate    # computes the values from a certificate",
  ], { label: "CLOUD-ONLY WRITE PATH (GRAPH) · MICROSOFT ENTRA POWERSHELL", pt: 11 });
  sources(s, "Sources: Book 03, Ch 09 \"Binding the PIV certificate to the Entra user\"; companion guide, \"PIV and CAC certificates as attributes\"; implementation guide, Gate 6 step 1.");
  notes(s,
`Gate 6 is the PIV and CAC binding. Certificate-based authentication is attribute-driven too: Entra ID finds the user by matching a field of the presented certificate to a field of the account, so who writes that field matters as much as any HR field. Plan task A6.1 measures coverage first.

By default the SAN Principal Name maps to userPrincipalName. The stronger option is certificateUserIds, which holds explicit identifiers, each with an X509 prefix naming the field. The table is Book 03 Chapter 09's. Principal name, RFC822 name, subject and issuer-and-subject are low affinity: they're built on names and email addresses. Subject key identifier, SHA1 public key, and issuer and serial number are high affinity: identifiers that can't be reused. The consequence for lifecycle: a high-affinity value identifies one certificate, so a card reissue, and even a renewal on the same key, changes it.

The limits, as the companion guide states them: up to 10 values of up to 1,024 characters, each unique in the tenant, with case-sensitive X509 prefixes; the admin center takes up to four values of 120 characters.

Who can write it depends on where the user is mastered. For cloud-only users, at least a Privileged Authentication Administrator, in the admin center or through Graph, a PATCH on the user with authorizationInfo.certificateUserIds. The Microsoft Entra PowerShell cmdlet on the slide computes the correct values from a certificate. For synced users, only Entra Connect can update it, by syncing a value from AD such as altSecurityIdentities through sync rules the administrator adds, and it needs at least the Hybrid Identity Administrator role. Microsoft's page doesn't document Cloud Sync for this attribute. And note Microsoft's warning: AD administrators can change the value for any synced account, so the write path to altSecurityIdentities is governed like an access slot.`,
  `${IG}, Gate 6 steps 1–2; companion guide — "PIV and CAC certificates as attributes" ("Username binding," "certificateUserIds"); Book 03, Chapter 09 — "Binding the PIV certificate to the Entra user."`);
}

// 15 Affinity and writer
{
  const s = content(M3, "Affinity, the binding's writer, and the open pilot");
  tag(s, "Who");
  const tb = table(s, "Gate6", 1.45, [2.5, 9.65], ["Step", "What it takes"], [
    ["Measure coverage (A6.1)", "Per pilot card holder: certificateUserIds, or altSecurityIdentities for synced users. List gaps by account, never by certificate value"],
    ["Name the writer", "The card management system writes the binding, not HR: a reissued card changes it. HR supplies the person"],
    ["Decide affinity (D-A6)", "Tenant default is low; CBA is only as strong as the weakest binding allowed. Program position: high in production"],
    ["Pilot high first (A6.2)", "A custom rule by issuer or policy OID before the tenant changes; raise the card to multifactor; require phishing-resistant strength"],
    ["Leaver", "Removes the binding as well as revoking the card"],
    ["Writer after AD (D-A7)", "Design guidance, unverified: the card system writes certificateUserIds through Graph at issuance. Open pilot, issue #130"],
  ], { fontSize: 11.5, limit: 6.5 });
  const a = panel(s, "Evidence", 0.6, tb + 0.2, 7.4, null, HEX.teal, HEX.tealTint, "VALIDATE: VK-PIV-01 (pilot-card-holders.csv: UserPrincipalName or Id)", null, [
    "Findings by account, never by value: not found or not readable; no value; only low-affinity values",
    "Can't tell if a value is a current card: reconcile with the card system; sign-in logs show no lockouts",
    "Global Reader reading authorizationInfo: unconfirmed until a test-tenant run",
  ], 11.5);
  panel(s, "Back", 8.25, tb + 0.2, 4.5, a - tb - 0.2, HEX.amber, HEX.amberTint, "ROLLBACK", null, [
    "Required affinity back, or remove the per-issuer rule",
    "Restore a value from the card system, never by editing the directory",
  ], 11.5);
  sources(s, "Sources: Implementation guide, Gate 6 (steps, Validate, Rollback); companion guide, PIV binding; Book 03, Ch 09; Book 07, Ch 06; validation kit README, Checks/PIV.ps1.");
  notes(s,
`The rest of Gate 6, in the guide's order.

Measure coverage: for every pilot card holder, read certificateUserIds in Entra ID and altSecurityIdentities in AD. During hybrid, the binding is written to altSecurityIdentities and synced.

Name the binding's writer: the card management system, not HR, because a reissued card changes the value. HR supplies the person: the record, the key and the joiner event.

Decide the required affinity, D-A6, which the CISO owns. The tenant's required affinity binding defaults to low, and with several bindings, sign-in is only as secure as the lowest-affinity one allowed. The program's position is high affinity in production. The options in the plan: high in production with a custom rule per issuer during the pilot; low until coverage is complete, with a dated end; or mixed by issuer.

Pilot high affinity before changing the tenant, A6.2. Switching the tenant to high affinity before every account's value is right locks people out. Use a custom rule on issuer or policy OID for the pilot cohort, raise the card's certificates from the single-factor default to multifactor with a binding rule, and require the phishing-resistant strength for CBA users.

The leaver removes the binding as well as revoking the card.

And decide the writer after AD, D-A7, owned by the ICAM governance body. Design guidance, unverified: after AD, the card management system writes certificateUserIds through Microsoft Graph at issuance. That's an open pilot, workbook issue 130, because Microsoft documents neither the permission a workload needs nor how the write behaves for cloud-mastered users. It has to be decided before the program moves issuance off AD CS.

VK-PIV-01 validates it. It reads certificateUserIds for every holder in pilot-card-holders.csv, by user principal name or ID, and reports holders not found or not readable, holders with no value, and holders with only low-affinity values, by account and binding type, never by certificate value. Affinity comes from each value's X509 prefix, and RequiredAffinity defaults to High. For a synced holder with no value, the row points at altSecurityIdentities in AD. A value matching no supported pattern is a Warn, since the prefixes are case-sensitive. Two limits: it can't tell whether a value belongs to a current card, so reconcile its rows with the card management system; and whether Global Reader can read authorizationInfo is unconfirmed, so run it app-only or confirm in a test tenant. Add the pilot's sign-in logs showing CBA succeeding under the high-affinity rule. Rollback is the affinity setting or the per-issuer rule; a binding value is restored from the card management system.`,
  `${IG}, Gate 6 steps 1–6, "Validate (Gate 6)," "Rollback"; project plan A6.1, A6.2, D-A6, D-A7; companion guide, "PIV and CAC certificates as attributes"; Book 03, Chapter 09; Book 07, Chapter 06 — "Username bindings and affinity"; Book 04, Chapter 03 — "Authentication strengths."`);
}

// 16 Decisions
{
  const s = content(M3, "Decisions, owners, and on to Part 3");
  tag(s, "Who");
  const tb = table(s, "Decisions", 1.45, [1.0, 3.3, 2.2, 5.65], ["ID", "Decision", "Owner", "Options (project plan)"], [
    ["D-A4", "Restricted management, unit by unit, before each unit exists", "Identity engineering", "No (default); yes for a small sensitive set, accepting they leave PIM, entitlement management, Lifecycle Workflows and reviews"],
    ["D-A5", "The persona set the Conditional Access library targets", "CISO", "Worker type and account type personas; plus division overlays; fewer personas with more exclusions (not recommended)"],
    ["D-A6", "Required affinity binding for PIV and CAC", "CISO", "High in production, custom rule per issuer in the pilot; low until coverage is complete, dated; mixed by issuer"],
    ["D-A7", "Who writes the binding after AD", "ICAM governance body", "Card system through Graph (design guidance, open pilot); Connect while AD remains; manual entry (not at scale)"],
  ], { fontSize: 11.5, limit: 6.5 });
  callout(s, "Next", tb + 0.3, 0.95, "FaRoute", HEX.teal, "Part 3, Gates 7–9: ",
    "prove one mover across the tracks, cut over by attribute query and retire the OU tree, then keep the attributes true.");
  sources(s, "Sources: Project plan (data/project-plans/attribute-driven-migration.yaml), D-A4 to D-A7 and margins; implementation guide, Gates 4–6. Decisions and options: design guidance.");
  notes(s,
`The four decisions this part needs, each with one owner, from the project plan. All of them are the program's recommended model, design guidance.

D-A4, restricted management unit by unit, before each unit exists. Identity engineering decides. The default is no; yes only for a small set of sensitive accounts, accepting they leave PIM, entitlement management, Lifecycle Workflows and access reviews. If it's late, a unit gets created without the decision, and restriction can't be changed afterward.

D-A5, the persona set the Conditional Access library targets. The CISO decides: the program's personas from the worker type and account type codes, personas plus division overlays, or fewer personas with more exclusions, which isn't recommended. Late, and the Conditional Access design runs in report-only without the groups it will enforce on.

D-A6, the required affinity binding. The CISO decides. Late, and PIV sign-in reaches the pilot at the tenant default, low affinity.

D-A7, who writes the binding after AD. The ICAM governance body decides: the card management system through Graph at issuance, the open pilot; Entra Connect syncing from altSecurityIdentities while any AD remains; or manual entry by a Privileged Authentication Administrator, which doesn't scale. It can wait until the program moves issuance off AD CS, around week 39, and deciding earlier leaves time for the pilot to report.

Watch the margins. The tightest in this part is two working days: the pilot's shadow comparison before the program assigns the pilot's policies. The device targeting conventions have four days before the Endpoint plan builds its policy library.

Part 3 takes Gates 7 to 9: proving one mover across the tracks with no ticket, cutting over by attribute query and retiring the OU tree, and keeping the attributes true. Thank you.`,
  `Project plan (data/project-plans/attribute-driven-migration.yaml), D-A4, D-A5, D-A6, D-A7, and the margins note; ${IG}, Gates 4–6, "Checklist."`);
}
endModule(M3);

// ================================================================== Backup
backup();
sourceSlide("Sources behind Gate 4 — groups and units", [
  "Implementation guide (docs/project-plans/developer-workbooks/attribute-driven-migration/implementation-guide.md): \"The path on one page,\" Gate 4 steps, Validate, Rollback, Evidence; \"Where the kits stop.\" Project plan: A4.1–A4.4, D-A4, AG4.",
  "Book 01, Ch 04 \"The two query patterns.\" Book 03, Ch 06 program attribute map; Ch 10 \"Rule patterns,\" \"Limits and efficiency,\" \"Administrative units,\" \"Where dynamic membership stops.\"",
  "Book 06, Ch 17 \"Choosing the attributes,\" \"Writing, naming and testing rules,\" \"Scoped delegation with administrative units.\" Book 02, Ch 05 (three tiers, registry, illustrative code, restriction); Ch 09 (nesting, memberOf, per-group decision).",
  "Companion guide (attribute-driven-migration.md): \"Limits\" (rule limits, latency, administrative units), dynamic group dangers.",
  "examples/validation-kit: README (run, inputs, known limits); Private/Core.ps1 default options; Checks/DG.ps1 (VK-DG-01 to VK-DG-07); fixture input shapes under tests/fixtures.",
]);
sourceSlide("Sources behind Gate 5 — targeting and Group Policy", [
  "Implementation guide, Gate 5 steps, Validate, Rollback. Project plan: A5.1–A5.4, D-A5, AG5. Book 04, Ch 03 (users and roles, policies in pairs, report-only, exclusions, personas); Ch 07.",
  "Book 05, Ch 07 \"Freezing and unlinking GPOs,\" \"Methodology principles\"; Ch 08 phases 1–7, \"Adopt, don't build,\" testing, rollback, device attribute schema, assignment strategy, templates (Microsoft Learn as footnoted, Oct. 2026).",
  "Book 05, Ch 09 \"Which servers Arc reaches,\" \"Azure Policy and machine configuration,\" \"Moving server GPOs: adopt Microsoft's path,\" \"Azure Update Manager.\" Book 02, Ch 09 \"The per-group decision.\"",
  "Ansible configuration automation guide: \"One owning tool per setting\" (rules 1–5), \"Arc onboarding at scale,\" \"Linux and Unix baselines,\" \"Cloud VMs,\" dangers. Arc track guide: Step 2.1 tag table, Step 5, Step 7. Intune track guide: Gates 2–3.",
  "examples/ms-automation README and FmwGraph.psm1 (ca-export); examples/ansible 03_linux_baseline_check.yml; validation kit README, Checks/CA.ps1 (VK-CA-01), Checks/INT.ps1 (VK-INT-01, 04, 07) and Checks/ARC.ps1 (VK-ARC-07, owner spellings normalized).",
]);
sourceSlide("Sources behind Gate 6 — PIV and CAC binding", [
  "Implementation guide, Gate 6 steps 1–6, Validate, Rollback, Evidence; \"Where the kits stop.\" Project plan: A6.1, A6.2, D-A6, D-A7, AG6, and the margins note. Validation kit README and Checks/PIV.ps1 (VK-PIV-01).",
  "Companion guide, \"PIV and CAC certificates as attributes\" (username binding, affinity, certificateUserIds limits and writers, authentication strength, where the binding comes from).",
  "Book 03, Ch 09 \"Binding the PIV certificate to the Entra user,\" \"The canonical leaver sequence.\" Book 07, Ch 06 \"Username bindings and affinity.\" Book 04, Ch 03 \"Authentication strengths.\"",
  "Unverified: certificateUserIds written through Graph by the card management system after AD (design guidance), workbook issue #130, an open pilot. Cloud Sync for certificateUserIds: not documented by Microsoft.",
]);

finish(OUT);
