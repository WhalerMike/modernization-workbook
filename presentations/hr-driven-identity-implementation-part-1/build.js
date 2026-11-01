// Implementation guide — HR-Driven Identity, IMPLEMENTATION SERIES, PART 1:
// writers, sources and joiners (implementation guide Gates G1–G3).
//   Orientation:        the seven gates on one page; what the gates assume and where the parts run.
//   G1 — Writers:       the lifecycle rows of the writer register; scope, other writers, audit queries; the scan.
//   G2 — Sources:       employees from HR, contractors from their own source; the earliest end; the reconciliation.
//   G3 — Joiners:       few workflows scoped by code; the Temporary Access Pass bridge; lint, plan and readiness.
//   Close:              the handoff to Part 2 (Gates G4–G7).
// Sources: docs/books/guides/hr-driven-identity-implementation.md, the developer workbook
// docs/project-plans/developer-workbooks/hr-driven-identity/ (Chapters 01–03, Lab 1 of each), and
// examples/hr-lifecycle (README, config, fixtures). No new external facts.
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js);
// the code panel and the one-line statement are the ADM deeper dive's (../attribute-driven-migration-deeper-dive-part-1/build.js).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/hr-driven-identity-implementation-part-1/build.js \
//                      presentations/hr-driven-identity-implementation-part-1/HR_Driven_Identity_Implementation_Part_1.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "HR-Driven Identity — Implementation, Part 1",
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity — Implementation, Part 1: G1–G3",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "HR_Driven_Identity_Implementation_Part_1.pptx";
const IG = "HR-driven identity implementation guide";
const WB = "Developer workbook, Building HR-Driven Identity";

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
const SG1 = "G1 — Writers";
const SG2 = "G2 — Sources";
const SG3 = "G3 — Joiners";
const SC = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Part 1: Writers, sources and joiners", "HR-Driven Identity — implementation, Gates G1–G3");
  txt(s, "Session map", [
    { text: "G1 One writer for every state   ·   G2 Employees and contractors from their sources", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "G3 Joiners ready on day one", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 2: G4 Access and movers  ·  G5 Credentials  ·  G6 Separation  ·  G7 Drift and evidence", options: { color: HEX.ink, breakLine: true } },
    { text: "Steps, Lab 1 commands, federal evidence, government-cloud availability and rollback", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 1 of the implementation series for HR-Driven Identity. The HR pipeline makes the account exist. The implementation guide makes the HR record decide everything that happens to the account after that, and proves it did. It does that as seven gates an operator can run.

This series stays at the level of those gates. For each one: what "done" means, the steps, the commands from the developer workbook's first lab where the workbook has them, the federal requirement the gate meets and the evidence an ISSO keeps, what's available in GCC and GCC High as the guide states it, and how to roll the gate back.

Part 1 covers Gates G1 to G3: one writer for every account state and attribute, employees and contractors from their sources, and joiners ready on day one. Part 2 covers G4 to G7: access and movers, credentials, separation, and drift and evidence.

Two labels apply throughout. The program's own recommendations are marked design guidance, and conclusions the sources support but don't state are marked inference. The workbook's code is illustrative and fixture-tested, not proven against a live tenant.`,
  `${IG}, "In this guide," "How to read this guide," "The path on one page."`);
}

// ================================================================== 2 Gates on one page
{
  const s = content(S0, "The seven gates on one page: done when, proved by");
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [2.05, 5.0, 3.6, 1.5], ["Gate", "Done when", "Validate with", "Plan tasks"], [
    ["G1 Writers", "Every account-state transition and HR attribute has one recorded writer; other write paths removed", "VK-HR-04, VK-HR-07; no kit check for writers yet", "I1.2, I1.4"],
    ["G2 Sources", "Employees from HR; contractors from a named source with an enforced earliest end", "VK-HR-01, VK-HR-07; no kit check for end dates yet", "D-I3, I5.2"],
    ["G3 Joiners", "Pre-hire and day-one workflows run with limits; day-one readiness measured", "VK-HR-05, VK-HR-06", "I2.3, I4.3"],
    ["G4 Access and movers", "Department access by automatic assignment; supervisor-of-record approval; residual access reviewed after a move", "VK-DG-05, VK-HR-03", "I4.4, I4.5"],
    ["G5 Credentials", "CBA trusts the issuing CAs with CRLs; issuance and revocation follow HR and contractor events", "VK-PIV-01", "I1.6"],
    ["G6 Separation", "Block first, revoke in parallel, reconcile, dispose last; intervals measured", "VK-HR-05, VK-HR-06", "I4.1, I4.2, I4.6"],
    ["G7 Drift and evidence", "Lifecycle drift found and closed at the source; metrics on the ConMon cadence", "VK-HR-01, 03, 04, 07; VK-DG-05", "IG5"],
  ], { fontSize: 11, limit: 5.9 });
  line(s, "Parts", "Part 1: G1–G3. Part 2: G4–G7. Each threshold is Book 03's proposed starting criterion, which the agency approves or replaces.",
    tb + 0.15, 0.55, 13.5);
  sources(s, "Sources: Implementation guide, \"The path on one page\" (gates, validation, plan tasks); Identity Lifecycle & Provisioning plan; Book 03, Ch 12.");
  notes(s,
`Here are all seven gates on one page, as the guide lays them out, with the validation step and the plan tasks each carries out.

G1, writers, is done when every account-state transition and HR attribute has one recorded writer and the other write paths are gone. VK-HR-04 and VK-HR-07 measure the values; no kit check reads who can write yet.

G2, sources, is done when employees come from HR and contractors come from a named source with an enforced earliest end. VK-HR-01 and VK-HR-07 prove part of it.

G3, joiners, is done when pre-hire and day-one workflows run with limits and day-one readiness is measured, proved with VK-HR-05 and VK-HR-06.

Part 2 then takes G4, department access by automatic assignment with residual access reviewed after a move; G5, certificate-based authentication with a CRL for every issuing CA, and card events tied to HR events; G6, separations that block first and dispose last, with the intervals measured; and G7, lifecycle drift closed at the source and the metrics reported on the continuous monitoring cadence.

The Identity Lifecycle and Provisioning plan schedules this work, and Book 03's phase model is the source of every threshold. They're proposed starting criteria the agency approves or replaces.`,
  `${IG}, "The path on one page"; Identity Lifecycle & Provisioning plan; Book 03, Chapter 12 — phase model.`);
}

// ================================================================== 3 Prerequisites and where the parts run
{
  const s = content(S0, "Before G1: what the gates assume, and where they run");
  tag(s, "What");
  const tb = table(s, "Prereqs", 1.45, [2.2, 5.6], ["Prerequisite", "What it means"], [
    ["The pipeline, live", "The plan's Gate 3: the HR feed live, shadow differences explained, zero unmatched creations"],
    ["The attribute foundation", "ADM implementation guide Gates 1 and 2: the slot register signed, the attributes proven on the pilot"],
    ["Book 03's Phase 1 decisions", "Person key, authority map, worker-type taxonomy and code lists, privacy basis (D-I1, D-I2, I0.4)"],
    ["Licenses", "Entra ID P1 for API-driven inbound provisioning; Entra ID Governance (or the Entra Suite) for workflows, entitlement management, reviews and automatic assignment"],
    ["Roles, through PIM", "Lifecycle Workflows Administrator, behind approval; Identity Governance Administrator; Authentication Policy Administrator"],
    ["Logs leaving Entra ID", "Audit, sign-in and provisioning logs to the SIEM or a storage account before the first gate"],
  ], { fontSize: 11.5, limit: 6.6 });
  panel(s, "Run", 8.65, 1.45, 4.1, null, HEX.teal, HEX.tealTint, "WHERE THE PARTS RUN", null, [
    "The HR platform runs on Oracle Cloud Infrastructure",
    "The lifecycle's automation runs in Azure: a custom task extension calls a Logic App on the consumption plan",
    "Apps on AWS or Oracle Cloud get lifecycle changes only through the access Entra ID grants, by provisioning or federation",
    "GCC uses the commercial Entra service; GCC High rows cite Learn's Azure Government table",
  ], 12);
  sources(s, "Sources: Implementation guide, \"Prerequisites,\" \"Where agencies start\" (government-cloud availability; where the parts run).");
  notes(s,
`Before G1, the guide assumes six things are in place, and it doesn't re-decide any of them.

The pipeline is live for the foundation scope: the Identity Lifecycle plan's Gate 3, with the HR feed live, shadow differences explained and zero unmatched creations. The attribute foundation is in place: the ADM implementation guide's Gates 1 and 2, the slot register signed and the attributes proven on the pilot. Book 03's Phase 1 decisions are made: the enterprise person key, the authority map, the worker-type taxonomy and code lists, and the privacy basis.

Licenses: API-driven inbound provisioning needs Entra ID P1. Lifecycle Workflows, entitlement management and access reviews need Entra ID Governance or the Entra Suite for the member users they govern, and automatic assignment policies need Governance or the Suite too.

Roles go through PIM: Lifecycle Workflows Administrator, behind approval, because an on-demand run ignores a workflow's scope; Identity Governance Administrator for automatic assignment policies; and Authentication Policy Administrator for certificate-based authentication. A custom task extension also needs Logic App Contributor, Contributor or Owner on the Logic App; Logic App Operator isn't enough.

And logs leave Entra ID before the first gate, because Entra's own retention is short and not retroactive.

Where the parts run: the HR platform on Oracle Cloud Infrastructure, the lifecycle's automation in Azure. Applications on AWS or Oracle Cloud get lifecycle changes only through the access Entra ID grants them.`,
  `${IG}, "Prerequisites"; "Where agencies start" — "How government-cloud availability is checked," "Where the parts run."`);
}
endModule(S0);

// ================================================================== 4 G1: lifecycle rows
{
  const s = content(SG1, "G1: the lifecycle rows of the writer register");
  tag(s, "Who");
  const tb = table(s, "Rows", 1.45, [3.35, 5.85, 2.95], ["Transition or value", "Writer", "Backstop"], [
    ["Account created", "Inbound provisioning, from the HR or contractor record", "None: nothing else creates workforce accounts"],
    ["Enabled at hire", "The pipeline's active true on the hire date, or the day-one workflow's enable task: pick one", "The other, recorded as backstop"],
    ["Disabled at separation", "The pipeline's active false, no later than the leaver workflow's first run", "The leaver workflow's disable task"],
    ["Re-enabled on a cancelled separation", "The pipeline, re-deriving from the corrected record", "None"],
    ["Deleted at disposition", "The post-separation workflow's delete task; never /bulkUpload", "None"],
    ["employeeHireDate, employeeLeaveDateTime", "Inbound provisioning only", "None"],
    ["manager", "Inbound provisioning; HR, not IT, writes a new supervisor", "None"],
    ["certificateUserIds or altSecurityIdentities", "The card management system integration (G5)", "None"],
  ], { fontSize: 11.5, limit: 6.0 });
  line(s, "Why", "A rule that reads an attribute hands the access decision to whoever can write it. Account state is the same: two writers can set it.",
    tb + 0.15, 0.55, 13.5);
  sources(s, "Sources: Implementation guide, Step 1, step 1 (lifecycle rows, design guidance from Book 03, Ch 08); Book 03, Ch 04, 06; Appendix A.");
  notes(s,
`G1 starts from one rule in Book 03: a rule that reads an attribute hands the access decision to whoever can write it. Account state is the same. The pipeline's active value and Lifecycle Workflows' enable, disable and delete tasks can both write it, for cloud and synced users alike.

So step 1 adds the lifecycle rows to the signed register, with a writer and a backstop for each transition. This table is the guide's, design guidance from Book 03's Chapter 08.

Inbound provisioning creates the account; nothing else creates workforce accounts. At hire, pick one: the pipeline's active true on the hire date, or the day-one workflow's enable task, and record the other as backstop. At separation, the pipeline sends active false no later than the leaver workflow's first run, with the workflow's disable task as backstop. A cancelled separation re-enables only from the pipeline, re-deriving from the corrected record. Deletion is the post-separation workflow's delete task, never a bulk upload.

The two date carriers, employeeHireDate and employeeLeaveDateTime, are inbound provisioning's alone. So is manager: HR, not IT, writes a new supervisor. And the certificate binding, certificateUserIds or altSecurityIdentities, belongs to the card management system integration, which G5 builds.

The gate's prerequisites are the signed slot register, from ADM Gate 1, and the authority map, plan task I1.2.`,
  `${IG}, Step 1 — "Prerequisites," step 1 and the lifecycle rows table; Book 03, Chapter 04 — "Operating rules"; Chapter 06 — "Writers"; Appendix A — "Rescinded offers and cancellations," "Manager links."`);
}

// ================================================================== 5 G1: scope, other writers, queries
{
  const s = content(SG1, "G1: version the scope, remove the other writers");
  tag(s, "How");
  const w = 3.9, g = 0.225;
  const p1 = panel(s, "Scope", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "STEP 2: THE SCOPE FILTER", null, [
    "Which records provision at all: leave, secondment and pre-hire lookahead",
    "The directory-side filter matches the middleware's",
    "Written down and versioned",
    "Leave isn't a leaver",
  ], 12.5);
  const p2 = panel(s, "Paths", 0.6 + w + g, 1.45, w, null, HEX.red, HEX.redTint, "STEP 3: OTHER WRITE PATHS", null, [
    "Help desk, self-service and Exchange-admin writes to the slots and date carriers",
    "In AD, the ACLs on the target OUs",
    "Whoever writes altSecurityIdentities in AD decides which certificate signs in as which synced user",
  ], 12.5);
  const p3 = panel(s, "Query", 0.6 + 2 * (w + g), 1.45, w, null, HEX.teal, HEX.tealTint, "STEP 4: THE AUDIT QUERIES", null, [
    "One per protected value: writes by anything but the named writer",
    "Reads the Entra audit log and AD change auditing",
    "Save it now: G7 runs it as the unauthorized-write drift class",
  ], 12.5);
  panel(s, "Interim", 0.6, Math.max(p1, p2, p3) + 0.2, 12.15, null, HEX.amber, HEX.amberTint, "INTERIM PATH: UNTIL AD RETIRES, SYNC IS A WRITER TOO", null, [
    "For synced users the extension slots are AD-mastered and read-only in Entra ID",
    "Record the provisioning agent's gMSA as the AD-side writer, and review the OU ACLs every quarter until the population is cloud-mastered (design guidance)",
  ], 12.5);
  sources(s, "Sources: Implementation guide, Step 1, steps 2–4 and interim path; Appendix A (Scope; leave isn't a leaver); Book 03, Ch 06, 09, 11.");
  notes(s,
`The rest of G1 is three steps and an interim path.

Step 2 writes the scope filter down and versions it: which records provision at all, including leave, secondment and pre-hire lookahead. The directory-side filter has to match the middleware's. And leave isn't a leaver: a worker on leave stays in scope.

Step 3 removes the other write paths. That's the help desk, self-service and Exchange-admin writes to the slots and the date carriers, and in Active Directory the ACLs on the target OUs. One path is easy to miss. Book 03 notes that whoever can write altSecurityIdentities in AD decides which certificate signs in as which synced user, so that path goes on the list too.

Step 4 writes the audit query for each protected value. The unauthorized-write drift class reads the Entra audit log and AD change auditing for writes by anything but the named writer. Save the query now; G7 runs it.

The interim path matters for most agencies. Until AD retires, sync is a writer too: for synced users, the extension slots are AD-mastered and read-only in Entra ID. So record the provisioning agent's gMSA as the AD-side writer, and review the OU ACLs every quarter until the population is cloud-mastered. That last part is design guidance.`,
  `${IG}, Step 1, steps 2–4 and "Interim path"; Appendix A — "Scope," "Leave is not a leaver"; Book 03, Chapter 06 — "Writers," "Design rules"; Chapter 09 — "Binding the PIV certificate to the Entra user"; Chapter 11 — "Drift between HR and the directory."`);
}

// ================================================================== 6 G1: in code
{
  const s = content(SG1, "G1 in code: check the register, scan the audit log");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 7.75, [
    "# examples/hr-lifecycle, Lab 1: fictional audit records, no tenant",
    "python python/writer_register.py check --register config/writer-register.json",
    "#   Register: 0 Finding, 0 Warn, 0 Info            (exit 0)",
    "python python/writer_register.py scan --register config/writer-register.json \\",
    "    --audit tests/fixtures/ch01/directory-audits.json \\",
    "    --since 2026-10-01 --until 2026-10-31 --cloud gcc --out out/ch01",
    "#   Protected writes: 11 (writer 5, backstop 1, second writer 4, forbidden 1)",
    "#   Writers: 5 Finding, 1 Warn, 0 Info              (exit 2)",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 01, LAB 1)", pt: 10.5 });
  code(s, "Find", 0.6, c1 + 0.2, 7.75, [
    "WS-01 Finding  casey.ng     disabled-at-separation, by pat.helpdesk",
    "WS-01 Finding  quinn.ross   orgCode, by OrgCode fix-up script",
    "WS-04 Finding  blake.ito    deleted-at-disposition, by inbound-provisioning",
    "WS-02 Warn     jordan.diaz  enabled-at-hire, by the backstop",
  ], { label: "FOUR OF THE SIX FINDINGS (findings.json, SHORTENED)", pt: 10.5 });
  panel(s, "Rules", 8.6, 1.45, 4.15, null, HEX.navy, HEX.navyTint, "WHAT THE CHECKS FLAG", null, [
    "WR-01 to WR-09: one writer per row, every required transition, no delete by inbound provisioning, signed, scope versioned",
    "WS-01: a protected write by neither writer nor backstop; WS-02 by the backstop; WS-04 by a forbidden writer",
    "Reads AuditLog.Read.All (and Directory.Read.All for provisioning logs)",
    "Doesn't read AD; the audit property names aren't on Learn, so Lab 2 confirms them",
  ], 12);
  sources(s, "Sources: Developer workbook, Ch 01 (the checks; Lab 1, steps 2–4; what the scan doesn't see); examples/hr-lifecycle.");
  notes(s,
`The developer workbook's Chapter 01 turns the register into code: config/writer-register.json, a checker, and a scan of the directory audit log. Lab 1 runs it against fictional audit records, with no tenant.

The check reads the register's shape. WR-01 to WR-09 flag a row with no single writer, a writer or backstop that isn't defined, a required transition with no row, deletion written by inbound provisioning, a register that isn't recorded as signed, and a scope filter with no version. The program's register checks clean.

The scan reads successful records in a window, here October, and compares each protected write with the register. It finds eleven protected writes: five by the writer, one by the backstop, four by a second writer and one by a writer the row forbids. That's five Findings and one Warn, and the exit code is 2.

Read four of them. WS-01: a help desk account disabled a leaver, and an org-code fix-up script wrote a coded slot. WS-04: inbound provisioning deleted an account, which the register forbids. WS-02, a Warn: the backstop enabled a hire, so confirm the writer acted or was late.

Two limits. The scan reads the Entra audit log, not AD; for synced users AD change auditing is the evidence. And the audit property names it matches aren't documented on Learn, so Lab 2 confirms them in a test tenant before the scan is trusted.`,
  `${WB}, Chapter 01 — "The checks," "What the scan doesn't see," "Lab 1: fixtures, no tenant," steps 2–4; examples/hr-lifecycle/python/writer_register.py.`);
}

// ================================================================== 7 G1: requirement, evidence, rollback
{
  const s = content(SG1, "G1: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 6.55], ["Requirement", "What the ISSO keeps"], [
    ["NIST SP 800-53 AC-2 (account types, conditions, account managers) and IA-4 (identifier management), Moderate", "The signed register with the lifecycle rows; the scope filter, versioned"],
    ["AU-6 (audit record review), for writes outside the named writer", "The saved audit queries and the AD auditing settings"],
    ["The privacy basis for the feed (Privacy Act; the agency's SORNs and PIA)", "The privacy office's determination for each flow"],
  ], { fontSize: 12, limit: 6.6 });
  const w = 5.95;
  const p1 = panel(s, "Validate", 0.6, tb + 0.2, w, null, HEX.amber, HEX.amberTint, "VALIDATE (G1)", null, [
    "VK-HR-04: zero duplicate employeeId values; VK-HR-07: fill rate of the key, worker type, manager and coded slots",
    "No kit check reads who can write: the delegation export, the OU ACL review and a clean run of the saved queries over the pilot's last 30 days",
    "Owner: the ICAM governance body, with the data architect",
  ], 12);
  const p2 = panel(s, "Avail", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "AVAILABILITY AND ROLLBACK", null, [
    "User and group management, dynamic groups and directory sync: commercial service in GCC; available in Azure Government for GCC High",
    "Rollback: a writer change is a register change, signed like the original",
    "A removed write permission comes back only by recorded change, with an end date",
  ], 12);
  if (process.env.FIT) console.log(`  G1 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 1 (federal requirements and evidence; government-cloud availability; Validate; Rollback); Book 03, Ch 11; Appendix B.");
  notes(s,
`G1's federal requirements, and what the ISSO keeps for each. The control mapping is Book 03's.

AC-2, account management, covers account types, conditions of membership and account managers, and IA-4 covers identifier management; both are in the Moderate baseline. The ISSO keeps the signed register with its lifecycle rows, and the versioned scope filter. AU-6, audit record review, covers writes outside the named writer: the evidence is the saved audit queries and the AD auditing settings. And the feed needs its privacy basis, the Privacy Act and the agency's system of records notices and privacy impact assessment: the privacy office's determination for each flow.

Validate. VK-HR-04 reports zero duplicate employee I D values, and VK-HR-07 reports the fill rate of the key, worker type, manager and coded slots against the threshold. Both measure values, not writers. No kit check reads who can write, so the evidence is the delegation export, the OU ACL review and a clean run of the saved audit queries over the pilot's last thirty days. The gate owner is the ICAM governance body, with the data architect.

Availability: user and group management, dynamic groups and directory sync are the commercial service in GCC, and available in Azure Government for GCC High.

Rollback: a writer change is a register change, signed like the original. A removed write permission comes back only by recorded change, with an end date.`,
  `${IG}, Step 1 — "Federal requirements and evidence," "Government-cloud availability," "Validate (G1 Writers)," "Rollback"; Book 03, Chapter 11 — "Control support"; Appendix B — "The privacy basis."`);
}
endModule(SG1);

// ================================================================== 8 G2: sources
{
  const s = content(SG2, "G2: employees from HR, contractors from their own source");
  tag(s, "Why");
  const w = 5.95;
  const p1 = panel(s, "Emp", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "EMPLOYEES: RUN AGAINST THE LIVE FEED", null, [
    "The pipeline guide builds the apps and the sequences",
    "This gate checks only that the feed reads hires and separations by published date, so pre-hire and pre-separation workflows have time to run",
  ], 12.5);
  const p2 = panel(s, "Ctr", 0.6 + w + 0.25, 1.45, w, null, HEX.teal, HEX.tealTint, "CONTRACTORS: MEASURE BEFORE CHANGING ANYTHING", null, [
    "Not in Federal HR 2.0's scope; source decision D-I3: an agency-owned contractor system of record now, Oracle's contingent worker a later source swap",
    "Reconcile the register, the card system and the contractor accounts in both directories, read only, on the person key",
    "Settle six questions with the register's owner: owner, content, freshness, privacy basis, join key, coverage",
  ], 12.5);
  const tb = table(s, "Map", Math.max(p1, p2) + 0.2, [3.4, 8.75], ["Into the canonical record", "From the contractor source"], [
    ["Worker type code", "CTR, on every account (IA-4(4): identify each individual by status)"],
    ["manager", "The sponsor, a federal employee mastered in HR; organization from the sponsor; a contract reference"],
    ["Provisioning", "Its own API-driven provisioning app, through the same middleware as the HR feed"],
  ], { fontSize: 12, limit: 6.6 });
  if (process.env.FIT) console.log(`  map bottom ${tb.toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 2, steps 1–3 and 5; contractor evaluation (recommendation, mapping); Book 03, Ch 06.");
  notes(s,
`G2 brings in the two populations from their sources. Employees come from HR through the pipeline. Contractors aren't in Federal HR 2.0's scope, so they need a source of their own, mapped into the same canonical record.

For employees, the pipeline guide builds the apps and the sequences. This gate checks only one thing: that the feed reads hires and separations by published date, so the pre-hire and pre-separation workflows have time to run.

For contractors, the gate starts from the source decision, plan decision D-I3, informed by the contractor evaluation's recommendation: an agency-owned contractor system of record now, with Oracle's contingent worker as a later source swap. Then measure before changing anything. Reconcile the contractor register, the card management system and the contractor accounts in both directories, read only, on the enterprise person key, and report orphans and expired engagements. And settle Book 03's six questions with the register's owner: owner, content, freshness, privacy basis, join key and coverage.

Step 5 maps contractors into the canonical record: worker type code CTR, the sponsor as manager, the organization from the sponsor, and a contract reference. The contractor source gets its own API-driven provisioning app through the same middleware.

The guide flags one thing as pending proof: the contractor PIV path is the program's design and hasn't yet been validated in practice.`,
  `${IG}, Step 2 — "Prerequisites," steps 1–3 and 5, "Pending proof"; contractor evaluation, "Part 6: Recommendation," "Mapping into the canonical schema"; Book 03, Chapter 06 — "Contractors and vendors," "Before a register becomes an authority."`);
}

// ================================================================== 9 G2: earliest end
{
  const s = content(SG2, "G2: ship the contractor leaver first: the earliest end");
  tag(s, "How");
  const p = panel(s, "End", 0.6, 1.45, 5.0, null, HEX.red, HEX.redTint, "THE EARLIEST END (STEP 4)", null, [
    "Contract end, capped by the completion date",
    "Suitability withdrawn",
    "Card terminated",
    "Sponsor gone past the grace period",
    "Sponsor recertification missed",
    "The middleware takes the first and sends the leave date and active false itself; then the joiner, with the sponsorship request as its output",
  ], 12.5);
  const tb = table(s, "Dec", 1.45, [1.15, 1.35, 1.45, 3.0], ["Person", "Action", "Earliest end", "Reason"], [
    ["900001", "active", "2027-01-11", "contract end"],
    ["900002", "inactive", "2026-10-15", "completion date"],
    ["900003", "inactive", "2026-10-20", "suitability withdrawn"],
    ["900004", "inactive", "2026-10-30", "sponsor gone past the grace period"],
    ["900005", "inactive", "2026-10-25", "sponsor recertification due"],
    ["900007", "quarantine", "—", "no contract end (CS-01)"],
    ["900008", "quarantine", "2027-03-31", "sponsor not in the HR export (CS-02)"],
  ], { fontSize: 11, limit: 6.6, x: 5.8 });
  line(s, "Review", "Step 6: a bi-annual sponsor review on the contractor package, the sponsor as reviewer with a fallback, and no response removes access (design guidance).",
    Math.max(p, tb) + 0.15, 0.6, 13);
  sources(s, "Sources: Implementation guide, Step 2, steps 4 and 6; Appendix A (contractor leavers); Developer workbook, Ch 02 (earliest end; Lab 1, step 3).");
  notes(s,
`The guide's order for contractors is deliberate: ship the leaver first. A spreadsheet's end date that nobody updates keeps access alive, so the middleware computes the earliest end and enforces it.

Five conditions, from Book 03's Appendix A: the contract end, capped by the completion date; suitability withdrawn; the card terminated; the sponsor gone past the grace period; and a missed sponsor recertification. The middleware takes whichever comes first and sends the leave date and active false itself. Only then the joiner, whose output is the sponsorship request.

The table is from the workbook's Chapter 02 lab, run as of November 1 against a fictional register. 900001 stays active until its contract ends in January. 900002 to 900005 go inactive, each for a different reason. 900005's card expired October 28, but its sponsor recertification was due October 25, which comes first. Two records are quarantined: 900007 has no contract end, and 900008's sponsor isn't in the HR export. The sponsor's thirty-day grace period and the hundred-and-eighty-day recertification are design guidance the agency sets.

Step 6 recertifies sponsors with an access review on the contractor access package, with Manager, the sponsor, as reviewer and a named fallback. Learn offers monthly, quarterly, bi-annual and annual reviews. Bi-annual matches Book 03's example cycle, and setting no-response to remove access means a missed recertification ends access, as the earliest-end rule says. That setting is design guidance.`,
  `${IG}, Step 2, steps 4 and 6; Appendix A — "Contractor leavers"; ${WB}, Chapter 02 — "The earliest end," "The sponsor review," "Lab 1," step 3.`);
}

// ================================================================== 10 G2: in code
{
  const s = content(SG2, "G2 in code: extract, build the requests, reconcile");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 7.95, [
    "# examples/hr-lifecycle, Lab 1; inputs under tests/fixtures/ch02/ shown as .../",
    "python python/contractor_source.py extract --register .../contractor-register.csv \\",
    "    --cards .../cards.csv --sponsors .../hr-sponsors.csv \\",
    "    --rules config/contractor-rules.json --as-of 2026-11-01 --out out/ch02/extract",
    "#   Contractors: 9 records: 3 active, 4 inactive, 2 quarantined",
    "python ../hcm-entra/python/hcm_to_scim.py --as-of 2026-11-01 --out out/ch02/scim \\",
    "    --extract out/ch02/extract/contractors-extract.csv",
    "#   {\"counts\": {\"ready\": 7}, \"batches\": 1, \"disables\": 4, ...}   dry run: nothing sent",
    "python python/contractor_source.py reconcile ... --accounts .../contractor-users.json \\",
    "    --as-of 2026-11-01 --cloud gcc --out out/ch02/reconcile",
    "#   Reconciliation: 7 Finding, 1 Warn, 0 Info",
    "python python/contractor_source.py review --rules config/contractor-rules.json \\",
    "    --out out/ch02/review       # reviewSettings for the package; nothing sent",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 02, LAB 1)", pt: 10.5 });
  panel(s, "Rules", 8.8, 1.45, 3.95, null, HEX.navy, HEX.navyTint, "WHAT THE RECONCILIATION FLAGS", null, [
    "CR-01: enabled past the earliest end (four here: the four disables)",
    "CR-02: an enabled contractor account with no record (orphan)",
    "CR-03: an active card the source doesn't hold",
    "CR-05: a leave date that isn't the earliest end",
    "CR-04 (Warn): a record with no account",
  ], 12);
  line(s, "Evidence", "Once the four disables are sent, the next reconciliation shows no CR-01: that re-run is the gate's evidence.", c1 + 0.2, 0.36, 13.5);
  sources(s, "Sources: Developer workbook, Ch 02 (the code; Lab 1, steps 2–6); examples/hr-lifecycle and examples/hcm-entra READMEs.");
  notes(s,
`Chapter 02 of the workbook builds the contractor source's code, and doesn't rebuild what exists: the HCM middleware in examples/hcm-entra already builds and sends the SCIM requests, and already treats worker type C as a contractor with code CTR.

Extract computes every end condition that applies to each register row and takes the first. Nine fictional records: three active, four inactive because they're past their earliest end, and two quarantined. Every record carries its end as the termination date, so the leaver workflow fires on that day.

The middleware then builds the requests from the extract: seven records in one batch, four of them disables, sent with active false. Nothing is sent, because the middleware's dry run is its default.

Reconcile is read only, joined on the person key in employee I D, and its one Graph call needs User.Read.All and User-LifeCycleInfo.Read.All. It finds seven Findings and one Warn. Four are CR-01, accounts enabled past their earliest end, which are exactly the four disables. The others: an orphan contractor account with no record, an active card for a person the source doesn't hold, and a leave date that isn't the earliest end, so the leaver would fire on the wrong day.

Review writes the sponsor review settings for the package's assignment policy, bi-annual, remove on no response, and sends nothing.

Once the requests are sent, the next reconciliation shows no CR-01. That re-run is the guide's evidence for the gate.`,
  `${WB}, Chapter 02 — "The code," "The earliest end," "The sponsor review," "Lab 1: fixtures, no tenant," steps 2–6.`);
}

// ================================================================== 11 G2: requirement, evidence, rollback
{
  const s = content(SG2, "G2: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.45, 6.7], ["Requirement", "What the ISSO keeps"], [
    ["AC-2 and PS-7 (external personnel security), Moderate", "The source decision record; the read-only reconciliation report; end-date-to-block intervals"],
    ["IA-4(4): identify each individual by status, such as contractor", "The worker type code on every account, from the source record"],
    ["OMB M-22-09: enterprise identity draws on HR, contract management and personnel security; M-19-17", "The authority-per-fact table, signed by the governance body"],
    ["The Privacy Act basis for each contractor record flow", "The privacy office's determination for the register and the card system"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 5.95;
  const p1 = panel(s, "Validate", 0.6, tb + 0.2, w, null, HEX.amber, HEX.amberTint, "VALIDATE (G2) AND ROLLBACK", null, [
    "VK-HR-01: enabled users with no employeeId; VK-HR-07: worker type fill rate",
    "No kit check reads end dates: the reconciliation, re-run after the leaver ships, shows zero contractors past their earliest end",
    "Rollback: pause the contractor app; a paused job keeps its state",
  ], 12);
  const p2 = panel(s, "Avail", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "AVAILABILITY AND INTERIM PATH", null, [
    "Azure Government: API-driven inbound provisioning available; HR-driven provisioning \"Partial\"; access reviews available. GCC: commercial",
    "Interim: the contract end date as employeeLeaveDateTime, so the leaver still fires; retire the COR spreadsheets as a source of truth",
  ], 12);
  if (process.env.FIT) console.log(`  G2 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 2 (requirements and evidence; availability; interim path; Validate; Rollback); Book 03, Ch 11, 12.");
  notes(s,
`G2's federal requirements and evidence.

AC-2 and PS-7, external personnel security, both Moderate: the ISSO keeps the contractor source decision record, the read-only reconciliation report, and the end-date-to-block intervals for contractors. IA-4 enhancement 4, identifying each individual by status, such as contractor: the worker type code on every account, from the source record. OMB M-22-09 says enterprise identity draws on HR, contract management and personnel security systems, and M-19-17 covers the agency's ICAM governance: the evidence is the authority-per-fact table, signed by the governance body. And each contractor record flow needs its Privacy Act basis.

Validate. VK-HR-01 lists enabled member users with no employee I D, excluding owned exceptions, so contractors without a key show up there. VK-HR-07 reports the worker type fill rate. No kit check reads contractor end dates, so the evidence is the reconciliation, re-run after the contractor leaver ships, with zero enabled contractor accounts past their earliest end.

Availability: in Azure Government, API-driven inbound provisioning and provisioning-agent registration are listed as available. HR-driven provisioning as a row is marked partial, pointing to the HR apps table, where the API-driven app is available. Access reviews are available too. GCC is the commercial service.

The interim path: until the contractor source feeds the middleware, each contractor account carries the contract end as its leave date, so the leaver workflow still fires. Rollback: pause the contractor provisioning app, which keeps its state.`,
  `${IG}, Step 2 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Validate (G2 Sources)," "Rollback"; Book 03, Chapter 12 — "Phase 1."`);
}
endModule(SG2);

// ================================================================== 12 G3: workflows
{
  const s = content(SG3, "G3: few workflows, scoped by code, with limits");
  tag(s, "What");
  const tb = table(s, "Limits", 1.45, [4.1, 3.0], ["Learn's numbers", "Use"], [
    ["Workflows per tenant: 50 (licensing page) or 100 (service limits page)", "Budget to 50"],
    ["Tasks per workflow", "At most 25"],
    ["Custom task extensions per tenant", "At most 100"],
    ["Administrative scopes per workflow", "At most 5"],
    ["Tenant schedule: every 3 hours by default, 1 to 24", "One setting for every workflow"],
  ], { fontSize: 12, limit: 6.6 });
  const p = panel(s, "Set", 7.95, 1.45, 4.8, null, HEX.navy, HEX.navyTint, "THE WORKFLOW SET (STEPS 1, 2, 5)", null, [
    "Pre-hire, day-one, mover, leaver, post-leaver, rehire and conversion",
    "Scoped by the coded attributes, never one per organization",
    "The hire date's time early in the day; set the schedule once, with the leaver in mind",
    "Execution limits a little above normal weekly volume, so an anomaly quarantines and a normal week doesn't",
  ], 12.5);
  line(s, "Kit", "The workbook's six workflow files scope on employeeType and the worker type code, and the day-one file doesn't enable: the pipeline does.",
    Math.max(tb, p) + 0.2, 0.6, 13.5);
  sources(s, "Sources: Implementation guide, Step 3, steps 1, 2 and 5; Developer workbook, Ch 03 (the workflow files); Book 03, Ch 08.");
  notes(s,
`G3 makes joiners ready on day one. The account already exists, disabled, before day one, because the pipeline sent it early. This gate makes everything else ready by the start of the first day, and measures it. Its prerequisites are G2 for the population, Entra ID Governance licenses, and the tenant's Temporary Access Pass policy enabled.

Step 1: build few workflows, scoped by code. A pre-hire, a day-one, a mover, a leaver, a post-leaver, and the rehire and conversion workflows, scoped by the coded attributes, never one per organization. Learn gives two different tenant ceilings: the licensing page says 50 workflows, the service limits page says 100, with 25 tasks per workflow, 100 custom task extensions and five administrative scopes per workflow. Budget to 50 until Microsoft reconciles them; that's design guidance.

Step 2: set the trigger times and the tenant schedule. The hire date's time portion goes early in the day. The tenant schedule runs every three hours by default and can be set from one to twenty-four. Every workflow shares it, so set it once, with the leaver in mind.

Step 5: set an execution limit on every scheduled workflow, a little above normal weekly volume, so an anomaly quarantines and a normal week doesn't.

The workbook's Chapter 03 holds six workflow files, all scoped on employeeType and the worker type code. Its day-one workflow doesn't enable the account, because in this program the pipeline's active value is the writer at hire, as G1's register records.`,
  `${IG}, Step 3 — "Prerequisites," steps 1, 2 and 5; ${WB}, Chapter 03 — "The workflow files"; Book 03, Chapter 08 — "Guardrails at agency scale," "Triggers and schedule."`);
}

// ================================================================== 13 G3: TAP bridge and day-one access
{
  const s = content(SG3, "G3: the Temporary Access Pass bridge and day-one access");
  tag(s, "How");
  const w = 5.95;
  const p1 = panel(s, "TAP", 0.6, 1.45, w, null, HEX.teal, HEX.tealTint, "STEP 3: BRIDGE TO THE CARD", null, [
    "The pre-hire workflow's built-in task generates a pass and emails it to the manager",
    "The hire date is the pass's start time; the manager and the manager's mail must be populated",
    "Only for a user with no other authentication methods, sign-ins or Entra role assignments",
    "Learn recommends a 24-hour maximum for a new hire; the tenant policy allows 10 minutes to 30 days and can force one-time use",
    "A rehire who kept their methods doesn't qualify: the rehire workflow needs its own path (inference)",
  ], 12);
  const p2 = panel(s, "Access", 0.6 + w + 0.25, 1.45, w, null, HEX.navy, HEX.navyTint, "STEPS 4 AND 6: ACCESS BY PACKAGE, MEASURED", null, [
    "The day-one workflow requests the onboarding package",
    "Department access comes from automatic assignment (G4)",
    "Never add a new hire directly to an application group",
    "Measure day-one readiness: the share of new hires whose account, licenses and baseline access exist at the start of day one",
  ], 12);
  callout(s, "Bridge", Math.max(p1, p2) + 0.25, 0.95, "FaKey", HEX.red, "The bridge ends: ",
    "when the card is bound in G5. An account still on a pass past the agreed window is a finding.");
  sources(s, "Sources: Implementation guide, Step 3, steps 3, 4 and 6; Gate 3 requirements (M-22-09); Book 04, Ch 09; Book 03, Ch 11.");
  notes(s,
`Two more parts of G3: the bridge to the card, and the access a new hire has on day one.

Step 3 bridges to the PIV card with a Temporary Access Pass. The pre-hire workflow's built-in task generates a pass and emails it to the manager. It uses the hire date as the pass's start time, it needs the manager and the manager's mail populated, and it works only for a user with no other authentication methods, sign-ins or Entra role assignments. Learn recommends a twenty-four-hour maximum lifetime for a pass sent to a new hire; the tenant policy allows ten minutes to thirty days and can force one-time use. One consequence the guide marks as inference: a rehire whose old account kept its methods doesn't qualify, so the rehire workflow needs its own path.

Step 4 gives baseline access by package, not by group add. The day-one workflow requests the onboarding package, and department access comes from automatic assignment, which is G4. Never add a new hire directly to an application group.

Step 6 measures day-one readiness: the share of new hires whose account, licenses and baseline access exist at the start of day one.

And the bridge has an end. OMB M-22-09 asks for phishing-resistant MFA for agency staff, contractors and partners. The pass ends when the card is bound in G5, and an account still on a pass past the agreed window is a finding.`,
  `${IG}, Step 3, steps 3, 4 and 6; "Federal requirements and evidence" (M-22-09 row); Book 04, Chapter 09 — "Lifecycle Workflows at the access level"; Book 03, Chapter 11 — "The measured lifecycle."`);
}

// ================================================================== 14 G3: in code
{
  const s = content(SG3, "G3 in code: lint, plan, and measure day one");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 8.05, [
    "# examples/hr-lifecycle, Lab 1: the program's workflow files, then three broken copies",
    "python python/joiner_workflows.py lint config/workflows --budget 50",
    "#   Workflows: 6 files, budget 50   Lint: 0 Finding, 0 Warn, 0 Info",
    "python python/joiner_workflows.py lint tests/fixtures/ch03/bad-workflows --budget 2",
    "#   Lint: 7 Finding, 4 Warn: JW-03 offset 200 days, JW-07 over budget, JW-08 no limit,",
    "#   JW-09 group add, JW-11 delete beside disable, JW-05 pass of 4,320 minutes, ...",
    "python python/joiner_workflows.py plan config/workflows \\",
    "    --current tests/fixtures/ch03/workflows.json --out out/ch03/plan",
    "#   new-version JML-Joiner-DayOne-Employees   create JML-Leaver-LastDay-Employees",
    "#   Plan written to out/ch03/plan/plan.json; nothing was sent",
    "python python/joiner_workflows.py readiness ... --as-of 2026-11-02T08:00:00Z --cloud gcc",
    "#   Day one 2026-11-02: 1 of 4 hires ready (25%)",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 03, LAB 1)", pt: 10.5 });
  panel(s, "Plan", 8.9, 1.45, 3.85, null, HEX.navy, HEX.navyTint, "WHAT THE PLAN DOES", null, [
    "Refuses to go on if any file has a Finding",
    "No match in the tenant: a create body; changed: a createNewVersion body",
    "Reads with LifecycleWorkflows-Workflow.Read.All only, and sends nothing",
    "Execution limits aren't in the API: set them in the admin center and record them in the file",
  ], 12);
  line(s, "Ready", "Readiness: account enabled, licensed, onboarding package delivered and a completed pre-hire run. Run it on a start-of-day export.",
    c1 + 0.2, 0.6, 13.5);
  sources(s, "Sources: Developer workbook, Ch 03 (the lint; the plan; day-one readiness; Lab 1, steps 2–5); examples/hr-lifecycle.");
  notes(s,
`Chapter 03 of the workbook keeps the workflows as reviewed files and gives them a lint, a plan and a readiness measure.

The lint runs over the program's six files with a budget of fifty and comes back clean. Over three broken copies, with a budget of two to show the ceiling rule, it finds seven Findings and four Warns: an offset of two hundred days, outside Learn's range of minus to plus one hundred and eighty; more workflows than the budget; a scheduled workflow with no execution limit recorded; a joiner that adds the user to groups directly; delete and disable in the same leaver workflow; and a pass lifetime of four thousand three hundred and twenty minutes, over the twenty-four hours Learn recommends for a new hire.

The plan lints first and refuses to go on if any file has a Finding. It matches each file to the tenant's export by display name. A file with no match becomes a create body; a changed one becomes a body for createNewVersion, because workflows are versioned rather than updated in place. Here the day-one workflow gets a new version and the employee leaver gets a create. It reads with one permission and sends nothing. Execution limits aren't in the API, so they're set in the admin center and recorded in each file.

Readiness counts the day's hires and calls a hire ready when the account is enabled and licensed, the onboarding package is delivered and the pre-hire run completed. One of four fictional hires is ready, twenty-five percent. Run it on an export taken at the start of the day, because it measures state, not timestamps.`,
  `${WB}, Chapter 03 — "The lint," "The plan," "Day-one readiness," "Lab 1: fixtures, no tenant," steps 2–5.`);
}

// ================================================================== 15 G3: requirement, evidence, rollback
{
  const s = content(SG3, "G3: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.45, 6.7], ["Requirement", "What the ISSO keeps"], [
    ["AC-2(1), automated system account management, Moderate", "Workflow definitions and versions; run history exported past Entra's 30-day view"],
    ["IA-5, authenticator management: the initial authenticator is time-limited and goes to an accountable person", "The TAP policy export (lifetime, one-time use) and the task's arguments"],
    ["OMB M-22-09: phishing-resistant MFA for staff, contractors and partners", "The bridge ends when the card is bound; a pass past the window is a finding"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 5.95;
  const p1 = panel(s, "Validate", 0.6, tb + 0.2, w, null, HEX.amber, HEX.amberTint, "VALIDATE (G3) AND ROLLBACK", null, [
    "VK-HR-05: hire date past with no processing record; VK-HR-06: execution limits set, workflow count against the ceiling (the kit's is 100; hold it to 50)",
    "Pre-hire and day-one run history for the last hire cohort; readiness against the threshold",
    "Rollback: disable the workflow's schedule; it keeps its versions",
  ], 12);
  const p2 = panel(s, "Avail", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "AVAILABILITY AND INTERIM PATH", null, [
    "Lifecycle Workflows and entitlement management: available in Azure Government; commercial in GCC",
    "No Azure Government row for the Temporary Access Pass: GCC High not confirmed",
    "Interim: the pipeline enables on the hire date; the help desk issues the pass by procedure; access from dynamic groups",
  ], 12);
  if (process.env.FIT) console.log(`  G3 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 3 (requirements and evidence; availability; interim path; Validate; Rollback); \"What couldn't be verified.\"");
  notes(s,
`G3's federal requirements and evidence.

AC-2 enhancement 1, automated system account management, Moderate: the ISSO keeps the workflow definitions and their versions, and the run history exported past Entra's thirty-day view. IA-5, authenticator management: the initial authenticator is time-limited and goes to an accountable person, so the evidence is the Temporary Access Pass policy export, its lifetime and one-time use, and the task's arguments. And M-22-09's phishing-resistant MFA: the bridge ends when the card is bound, and an account still on a pass past the agreed window is a finding.

Validate. VK-HR-05 reports users whose hire date is past with no processing record: late HR data or a missed catch-up window. VK-HR-06 reports whether execution limits are set and the workflow count against the ceiling. The kit's ceiling is a hundred; hold it to fifty. Add the pre-hire and day-one run history for the pilot's last hire cohort, and the readiness rate against the approved threshold. The gate owner is identity engineering, with HR for the timeliness of hire entries.

Availability: Lifecycle Workflows and entitlement management are available in Azure Government, and the commercial service in GCC. Learn's Azure Government table has no row for the Temporary Access Pass, so its availability in GCC High wasn't confirmed.

Interim path: before Governance is licensed, the pipeline creates the account disabled and enables it on the hire date as the single writer, the help desk issues the pass under a written procedure, and onboarding access comes from dynamic groups. Rollback: disable the workflow's schedule; it keeps its versions.`,
  `${IG}, Step 3 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Validate (G3 Joiners)," "Rollback"; "What couldn't be verified."`);
}
endModule(SG3);

// ================================================================== 16 Handoff
{
  const s = content(SC, "Handing G1–G3 to Part 2");
  tag(s, "How");
  const tb = table(s, "Pack", 1.45, [1.6, 5.75, 4.8], ["Gate", "In the evidence file", "What Part 2 reads from it"], [
    ["G1 Writers", "The register with its lifecycle rows; the versioned scope filter; the saved audit queries", "G6 coordinates the two writers of account state; G7 runs the saved queries"],
    ["G2 Sources", "The source decisions, the authority-per-fact table, the reconciliation reports, the privacy determinations", "G5 reads the card events for contractors; G6 measures their end-date-to-block intervals"],
    ["G3 Joiners", "Workflow definitions, versions and exported run history; the TAP policy", "G4's mover workflow; G5 ends the bridge; G6's leaver"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Next", tb + 0.25, 1.2, "FaRoute", HEX.teal, "Next: ",
    "Part 2 takes G4 to G7. To build Part 1's code, the developer workbook Building HR-Driven Identity, Chapters 01 to 03, each with its labs; to learn it in order, the learning path: seven modules, one per gate.");
  sources(s, "Sources: Implementation guide, \"Evidence\"; Gates 1–3 and 4–7 steps; Developer workbook, \"The pieces\"; Learning path, HR-Driven Identity.");
  notes(s,
`To close Part 1, here's what each gate leaves in the evidence file for the population, and what Part 2 reads from it.

G1 leaves the register with its lifecycle rows, the versioned scope filter and the saved audit queries. G6 depends on it: the pipeline sends active false no later than the leaver workflow's first run, so a later re-send can't undo the disable. And G7 runs the saved queries as the unauthorized-write drift class.

G2 leaves the source decisions, the authority-per-fact table, the reconciliation reports and the privacy determinations. In G5, the card system's termination or expiry ends a contractor's engagement, and G6 measures contractors' end-date-to-block intervals for PS-7.

G3 leaves the workflow definitions, their versions and the exported run history, and the Temporary Access Pass policy. G4's mover workflow reviews the residual access, G5 ends the bridge when the card is bound, and G6 orders the leaver workflow as the canonical sequence.

Part 2 takes G4 to G7: access from attributes and the mover's residual review, credentials bound to HR events, separation timing, and drift and evidence.

To build Part 1's code, use the developer workbook, Building HR-Driven Identity: Chapters 01 to 03, each with a fixture lab and a test-tenant step. To learn it in order, use the learning path, HR-Driven Identity in Microsoft Entra ID: seven modules, one per gate, each with a fixture lab and a knowledge check.`,
  `${IG}, "Evidence"; Steps 4–7, prerequisites and steps; ${WB}, "The pieces and how they connect," "Chapters"; Learning path, HR-Driven Identity in Microsoft Entra ID.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation and G1", [
  "HR-Driven Identity: An Implementation Guide: \"In this guide,\" \"How to read this guide,\" \"Where agencies start\" (government-cloud availability; where the parts run), \"The track at a glance,\" \"Prerequisites,\" \"The path on one page,\" Step 1 (steps, requirements and evidence, availability, interim path, Validate, Rollback).",
  "Book 03, Ch 04 (operating rules; system of record versus identity provider); Ch 06 (writers; design rules); Ch 08 (guardrails at agency scale); Ch 09 (binding the PIV certificate); Ch 11 (drift between HR and the directory; control support); Ch 12 (phase model); Appendix A (scope; leave; cancellations; manager links); Appendix B (privacy basis).",
  "Developer workbook, Building HR-Driven Identity: index (the pieces; chapters); Chapter 01 (the register; the checks; what the scan doesn't see; Lab 1).",
  "examples/hr-lifecycle: config/writer-register.json, python/writer_register.py, python/graph_export.py (task writers-scan), tests/fixtures/ch01.",
  "Design guidance in this part: the lifecycle rows' writer and backstop choices; the quarterly OU ACL review; the workflow budget of 50; the sponsor review's cycle and no-response setting.",
]);
sourceSlide("Sources: G2", [
  "HR-Driven Identity: An Implementation Guide: Step 2 (steps 1–6, pending proof, requirements and evidence, availability, interim path, Validate, Rollback).",
  "Contractors as Oracle Contingent Workers (evaluation): Part 6 recommendation; the phased path; mapping into the canonical schema; decisions and owners; status and review.",
  "Book 03, Ch 06 (contractors and vendors; one fact, one authority; before a register becomes an authority; sequence); Ch 11 (control support); Ch 12 (Phase 1); Appendix A (contractor leavers).",
  "Developer workbook, Chapter 02 (the earliest end; CS and CR rules; the sponsor review; Lab 1, steps 2–6). examples/hr-lifecycle: python/contractor_source.py, config/contractor-rules.json, tests/fixtures/ch02; examples/hcm-entra/python/hcm_to_scim.py.",
  "OMB M-22-09 (section A, identity) and M-19-17, as the guide cites them; NIST SP 800-53B Moderate baseline (AC-2, IA-4(4), PS-7), as the guide cites it.",
]);
sourceSlide("Sources: G3 and the handoff", [
  "HR-Driven Identity: An Implementation Guide: Step 3 (steps 1–6, requirements and evidence, availability, interim path, Validate, Rollback); \"Evidence\"; \"What couldn't be verified\" (Temporary Access Pass in GCC High; the workflow ceiling).",
  "Microsoft Learn pages the guide footnotes: Entra feature availability; ID Governance licensing fundamentals and service limits; Lifecycle Workflow built-in tasks (Generate Temporary Access Pass); Temporary Access Pass policy; synchronizing attributes for Lifecycle Workflows; Lifecycle Workflows APIs (all read November 1, 2026).",
  "Book 03, Ch 08 (guardrails; triggers and schedule); Ch 11 (the measured lifecycle; the evidence each event leaves); Appendix C (acceptance). Book 04, Ch 09 (Lifecycle Workflows at the access level).",
  "Developer workbook, Chapter 03 (the workflow files; the lint, JW-01 to JW-15; the plan; day-one readiness; Lab 1, steps 2–5). examples/hr-lifecycle: python/joiner_workflows.py, config/workflows, tests/fixtures/ch03.",
  "Learning path: HR-Driven Identity in Microsoft Entra ID (seven modules, one per gate; each runs the chapter's Lab 1 and ends with a knowledge check).",
]);

finish(OUT);
