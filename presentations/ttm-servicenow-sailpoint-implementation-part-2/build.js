// Implementation guide — Ticket-to-Machine on ServiceNow and SailPoint, IMPLEMENTATION SERIES, PART 2:
// actuation, the re-read, the tempo and the evidence (guide Gates G5–G7).
//   Orientation:            G5–G7 on one page.
//   G5 — Actuation:         connectors and the spoke by authority; change records and the declared exception; evidence.
//   G6 — Re-read:           the business rule and Awaiting verification; the re-read client offline; evidence.
//   G7 — Tempo and evidence: the tempo and the five measures; the identity fixes; evidence records and the chain;
//                           requirements; the evidence record field by field.
//   Close:                  the dangers across the gates; what Proved takes, and where to go next.
// Sources: docs/books/guides/ttm-servicenow-sailpoint.md, the developer workbook
// docs/project-plans/developer-workbooks/ticket-to-machine/ (Chapters 05–07, Lab 1 of each), and
// examples/servicenow-sailpoint (README, clients, servicenow, fixtures, tests). No new external facts. An example, not an endorsement.
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js);
// the code panel and the one-line statement are the ADM deeper dive's (../attribute-driven-migration-deeper-dive-part-1/build.js).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/ttm-servicenow-sailpoint-implementation-part-2/build.js \
//                      presentations/ttm-servicenow-sailpoint-implementation-part-2/TTM_ServiceNow_SailPoint_Implementation_Part_2.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Ticket-to-Machine on ServiceNow and SailPoint — Implementation, Part 2",
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine on ServiceNow and SailPoint — Implementation, Part 2: G5–G7",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "TTM_ServiceNow_SailPoint_Implementation_Part_2.pptx";
const IG = "Ticket-to-Machine on ServiceNow and SailPoint guide";
const WB = "Developer workbook, Building Ticket-to-Machine";

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

// Two side-by-side panels under a table: Validate and rollback on the left, availability and interim on the right.
const pair = (s, name, y, left, right) => {
  const w = 5.95;
  const a = panel(s, `${name} validate`, 0.6, y, w, null, HEX.amber, HEX.amberTint, left[0], null, left[1], 12);
  const b = panel(s, `${name} avail`, 0.6 + w + 0.25, y, w, null, HEX.teal, HEX.tealTint, right[0], null, right[1], 12);
  if (process.env.FIT) console.log(`  ${name} panels bottom ${Math.max(a, b).toFixed(2)}`);
  return Math.max(a, b);
};

const S0 = "Orientation";
const SG5 = "G5 — Actuation";
const SG6 = "G6 — Re-read";
const SG7 = "G7 — Tempo and evidence";
const SC = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Part 2: Actuation, re-read, tempo and evidence", "Ticket-to-Machine on ServiceNow and SailPoint — implementation, Gates G5–G7");
  txt(s, "Session map", [
    { text: "G5 Actuate on the native surface   ·   G6 Close only on a re-read", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "G7 Operate the tempo: the five measures, the identity fixes, the evidence", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 1: G1 Boundary  ·  G2 Writers and approvers  ·  G3 Sources and drift  ·  G4 Front door", options: { color: HEX.ink, breakLine: true } },
    { text: "An example on two named products, not a recommendation or an endorsement", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 2 of the implementation series for Ticket-to-Machine on ServiceNow and SailPoint. Part 1 confirmed the boundary, decided one writer per attribute and one approver system per authority class, connected the sources and measured the starting drift, and opened the front door so findings and requests arrive as typed, owned, clocked tasks.

Part 2 takes the last three gates, the ones that finish the loop. G5 actuates on the native surface: the ticket authorizes a machine, and the fix runs through a connector under a service identity. G6 closes only on a re-read, which is gap 1: a ticket status isn't proof. And G7 operates the tempo: the windows, the five measures for leadership, the identity fixes routed through the loop, and the evidence package.

The form is the same as Part 1: steps, the developer workbook's lab commands where they exist, the federal requirement and evidence, availability, the interim path and the rollback. Then the dangers across all seven gates, and what it would take to move the guide from Draft to Proved.

It's still an example, not an endorsement. The kit's tests prove logic against mocked responses, and Pass 1 of the kit doesn't actuate anything, so G5 is configuration of the products themselves.`,
  `${IG}, "In this guide," "The path on one page," Steps 5–7.`);
}

// ================================================================== 2 G5–G7 on one page
{
  const s = content(S0, "G5–G7 on one page: done when, proved by, rollback");
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [1.95, 3.8, 0.85, 2.65, 2.9], ["Gate", "Done when", "Gap", "Validate with", "Rollback"], [
    ["G5 Actuation", "Each lane actuates through a connector or a declared exception, under a service identity, with a change record where its class needs one", "3", "No automated check yet; a manual lab, one task per lane", "The paired action through the same lane; leavers recover by a new request"],
    ["G6 Re-read", "No finding or Service Desk ticket closes without a re-read of the target", "1", "Kit re-read and business-rule tests", "Disable the business rule; closures lose evidence until it's back"],
    ["G7 Tempo and evidence", "Windows measured, the identity fixes routed through the loop, the evidence package produced on a schedule", "—", "evidence_export.py, drift_compare.py; the five measures by hand", "Stop the schedules; the records stay"],
  ], { fontSize: 11.5, limit: 5.6 });
  callout(s, "Rule", tb + 0.25, 0.95, "FaCodeBranch", HEX.navy, "The rule for Part 2: ",
    "a person's role stops at approval, except in the declared-exception lane, and a success response is not closure.");
  sources(s, "Sources: Guide, \"The path on one page,\" \"Rollback\" by gate, G5–G7 Validate; Book 13, Appendix B (the five-clause request chain).");
  notes(s,
`Here are the three gates of Part 2 on one page: done when, the gap each closes, the validation and the rollback.

G5, actuation, is done when each lane actuates through a connector or a declared exception, under a service identity, with a change record where its class needs one. It closes gap 3, the missing change-request tickets. There's no automated check yet, because the kit's Pass 1 doesn't actuate; validation is a manual lab, one task per lane. Rollback is the paired action through the same lane, and a leaver's deprovisioning is rollback-never by design: recovery is a new request.

G6, the re-read, is done when no finding or Service Desk ticket closes without a re-read of the target. It closes gap 1. The kit's re-read and business-rule tests prove the logic. Rollback is disabling the business rule, and closures lose their evidence until it's back.

G7, the tempo and the evidence, is done when the windows are measured, the identity fixes route through the loop, and the evidence package is produced on a schedule. The workbook's evidence export and drift comparison automate part of it; the five measures have no automated check yet. Rollback: stop the schedules; the records stay.

Two rules run through all three gates. In G5, a person's role stops at approval, except in the declared-exception lane. And in G6, as Book 13's Appendix B puts it, a success response is not closure.`,
  `${IG}, "The path on one page"; "Rollback"; Steps 5–7, "Validate"; Book 13, Appendix B — "The five-clause request chain."`);
}
endModule(S0);

// ================================================================== 3 G5: by lane
{
  const s = content(SG5, "G5: the ticket authorizes a machine, by authority");
  tag(s, "How");
  const tb = table(s, "Act", 1.45, [2.6, 9.55], ["Step", "On these products"], [
    ["1 Connectors for A2, A3", "SailPoint's connectors: account create, update, enable, disable, delete; group, role, license and access-package changes. Disabling through the Entra connector also signs the user out of existing sessions"],
    ["2 The spoke for A0, A1", "ServiceNow's Entra spoke, where its actions cover the task. Documented gaps: no MFA-reset action; the reset action only for cloud-only users. Validate it against the installed spoke"],
    ["5 No standing privilege", "A person who must act activates an eligible role through PIM with the ticket number as justification. PIM doesn't check the number, so a SIEM rule does"],
    ["6 Verify the person", "An authentication-method reset isn't the connector's \"MFA attribute management\": it stays with the help desk's verification, which follows NIST SP 800-63B-4"],
  ], { fontSize: 11.5, limit: 6.6 });
  line(s, "Pass1", "The kit's Pass 1 writes nothing to Entra ID, AD or ISC, so this gate is configuration of the products themselves.", tb + 0.2, 0.4, 14);
  sources(s, "Sources: Guide, G5 steps 1, 2, 5, 6 (SailPoint Entra supported features, as footnoted); Book 15, Ch 03 (spoke coverage; PIM; verification).");
  notes(s,
`G5 is the loop's fourth step: the ticket authorizes a machine. The fix runs through a connector under a service identity, and a person's role stops at approval, except in the declared-exception lane. The prerequisites are G4, and G2's lanes in the record. The kit's Pass 1 doesn't actuate anything, so this gate is configuration of the products themselves.

Step 1 provisions through SailPoint's connectors for A2 and A3: account create, update, enable, disable and delete, and group, role, license and access-package changes. When the Entra connector disables an account, it also signs the user out of existing sessions.

Step 2 uses the ServiceNow Entra spoke for A0 and A1, where its actions cover the task. Book 15 documents its coverage and its gaps: there's no MFA-reset action, and the reset action works only for cloud-only users. Validate it against the installed spoke.

Step 5 keeps people off standing privilege. Where a person must act, they activate an eligible role through PIM with the ticket number as the justification. PIM doesn't check the number against the ticket, so a SIEM rule does.

Step 6 verifies the person before a sensitive action. An authentication-method reset isn't the connector's MFA attribute management; it stays with the help desk's verification procedure, which follows NIST SP 800-63B-4.`,
  `${IG}, Step 5 — "Prerequisites," steps 1, 2, 5 and 6; Book 15, Chapter 03 — "Prefer the connector and check what it actually covers," "What Entra ID enforces and what the program has to build," "Verify the person before a sensitive action."`);
}

// ================================================================== 4 G5: change records and declared exception
{
  const s = content(SG5, "G5: change records, and the declared-exception lane");
  tag(s, "Who");
  const w = 5.95;
  const p1 = panel(s, "Chg", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "STEP 3: CHANGE RECORDS WHERE THE CLASS NEEDS THEM (GAP 3)", null, [
    "ISC's Service Desk integration raises only Service Request and Incident tickets",
    "A ServiceNow flow raises a standard, normal or emergency change from the request item, by change class",
    "The kit plans this flow for Pass 2",
    "Interim: the approver raises the change record by hand and links it; closure still waits for G6",
  ], 12);
  const p2 = panel(s, "Exc", 0.6 + w + 0.25, 1.45, w, null, HEX.red, HEX.redTint, "STEP 4: THE DECLARED-EXCEPTION LANE", null, [
    "For disconnected applications: the Service Desk ticket",
    "A named approver before the session",
    "A time-boxed PIM activation and a recorded session",
    "An end date, and a POA&M item for an actuator or retirement",
  ], 12);
  callout(s, "End", Math.max(p1, p2) + 0.25, 0.95, "FaPlugCircleXmark", HEX.amber, "The exception that never ends: ",
    "a disconnected application stays manual for good. The end date, the POA&M item and G7's review at the end date stop it.");
  sources(s, "Sources: Guide, G5 steps 3–4 and interim path; \"Dangers\"; integration kit, planned for Pass 2; Book 13, Ch 10 (no machine can reach the surface).");
  notes(s,
`Two G5 steps handle what the connectors can't.

Step 3 raises change records where the class needs them, which is gap 3. ISC's Service Desk integration supports only Service Request and Incident tickets, not change requests. So a ServiceNow flow raises a standard, normal or emergency change from the request item, by change class. The kit plans that flow for its Pass 2. Until it exists, the interim path is that the approver raises the change record by hand and links it to the request; the closure still waits for G6.

Step 4 runs the declared-exception lane for disconnected applications, the ones with only an administrative console and no connector. The Service Desk ticket; a named approver before the session; a time-boxed PIM activation and a recorded session; an end date; and a POA&M item for an actuator or for retiring the application. That's Book 13's lane for when no machine can reach the surface.

The danger the guide names here is the declared exception that never ends: a disconnected application stays manual for good. The end date, the POA&M item, and G7's review of each declared exception at its end date are what stop it.`,
  `${IG}, Step 5, steps 3–4, "Interim path"; "Dangers"; integration kit page, "Planned for Pass 2"; Book 13, Chapter 10 — "When no machine can reach the surface."`);
}

// ================================================================== 5 G5: requirement, evidence, rollback
{
  const s = content(SG5, "G5: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.2, 6.95], ["Requirement", "Evidence the ISSO keeps"], [
    ["CM-5, Access Restrictions for Change", "Connector and spoke identities with their permissions"],
    ["AC-3, Access Enforcement; AC-6, Least Privilege", "SailPoint provisioning events; PIM activation records"],
    ["CM-3", "Change records linked from the request"],
    ["AU-14, Session Audit (in no baseline; tailored in)", "Session recordings attached to the ticket, counsel consulted"],
    ["NIST SP 800-63B-4; CA-5, Plan of Action and Milestones", "The verification rung on the ticket; the POA&M item for each exception"],
  ], { fontSize: 11.5, limit: 6.6 });
  pair(s, "G5", tb + 0.2,
    ["VALIDATE (G5) AND ROLLBACK", [
      "No automated check yet. Manual lab, one task per lane: an L3 request via the connector; an A1 task via the spoke; a declared exception with its recording; an emergency change recorded after",
      "VK-NPI-05 re-run: no permission beyond the lane's need",
      "Rollback: the paired action; a leaver recovers by a new request",
    ]],
    ["AVAILABILITY", [
      "PIM: available in Azure Government",
      "The Entra spoke points at graph.microsoft.com and doesn't mention the government clouds: it fits GCC; for GCC High, confirm with ServiceNow",
      "SailPoint's GCC High connector endpoints are documented",
    ]]);
  sources(s, "Sources: Guide, G5 (requirements and evidence; availability; interim path; Validate); Book 13, Ch 10; Book 15, Ch 03.");
  notes(s,
`G5's federal requirements, and the evidence the ISSO keeps.

CM-5, access restrictions for change: changes run under scoped service identities, not personal admin accounts, so the connector and spoke identities with their permissions. AC-3 and AC-6: approved access is enforced by the connector and people activate just in time, so SailPoint's provisioning events and PIM activation records. CM-3: the classes that need a change record get one, linked from the request. AU-14, session audit, which is in no baseline and is tailored in: declared-exception sessions are recorded, with counsel consulted, and the recordings are attached to the ticket. NIST SP 800-63B-4: resets and recovery follow the verification procedure, so the verification rung on the ticket. And CA-5: each declared exception has an end, a POA&M item.

Validate. There's no automated check yet; Pass 1 doesn't actuate, so the kit has no test for this gate. The manual lab runs one task per lane end to end: an L3 access request provisions through the connector, an A1 task runs through the spoke, a disconnected-application ticket runs as a declared exception with its recording, and an emergency change is recorded after the fact. Each leaves its record. And VK-NPI-05 is re-run: no integration identity holds a Graph permission beyond what its lane needs.

Availability: PIM is available in Azure for US Government. The Entra spoke's connection points at graph.microsoft.com by default and its page doesn't mention the US Government clouds: it fits GCC, and for GCC High, confirm with ServiceNow before use. SailPoint's connector endpoints for GCC High are documented. Where the spoke isn't licensed, A0 and A1 tasks stay help desk tasks against an approved ticket, with the PIM activation recorded.

Rollback: each connector action is reversed by its paired action, re-enable, re-add or reassign, through the same lane. A leaver's deprovisioning is rollback-never by design, with recovery through a new request.`,
  `${IG}, Step 5 — "Federal requirements and evidence," "Availability," "Interim path," "Validate (G5 Actuation)"; Book 13, Chapter 10 — "Which change classes qualify."`);
}
endModule(SG5);

// ================================================================== 6 G6: business rule
{
  const s = content(SG6, "G6: Awaiting verification, and the business rule");
  tag(s, "Why");
  const w = 5.95;
  const p1 = panel(s, "Rule", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "STEPS 1–2: THE RULE (GAP 1)", null, [
    "Add the Awaiting verification state",
    "A business rule turns any close into it, unless the update carries new evidence and comes from the verifier account",
    "A named exception approver may still cancel with a note: the declared-exception lane",
    "The same rule on the incident and request item tables, so SailPoint's status mapping no longer decides completion",
  ], 12);
  const p2 = panel(s, "Client", 0.6 + w + 0.25, 1.45, w, null, HEX.teal, HEX.tealTint, "STEPS 3–4: THE RE-READ CLIENT", null, [
    "Reads waiting records; re-reads the ISC account, the ISC identity by Search, or the Graph user",
    "Match: closes with the query, time, response hash and checker. Mismatch: reopens with the differences",
    "An ISC read reflects the last aggregation, so a stale read waits a grace period",
    "Tune the grace period to the aggregation schedule, and record it",
  ], 12);
  callout(s, "Close", Math.max(p1, p2) + 0.25, 0.95, "FaClipboardCheck", HEX.red, "A success response is not closure: ",
    "SailPoint's Service Desk integration treats the mapped ServiceNow status as complete. This gate stops that.");
  sources(s, "Sources: Guide, G6 steps 1–4 (SailPoint SDIM best practices and status mapping, as footnoted); integration kit, Build 2; Book 13, Appendix B.");
  notes(s,
`G6 is the loop's fifth step, and gap 1. A finding, or a ticket SailPoint's Service Desk integration opened, closes only when a re-read of the target shows the intended state. Book 13's Appendix B says it in five words: a success response is not closure. The prerequisites are G4 and G5, and the verifier account from G1.

Step 1 adds the Awaiting verification state and the business rule that turns any close into it, unless the update carries new evidence and comes from the verifier account. A named exception approver can still cancel with a note, which is the declared-exception lane.

Step 2 applies the same rule to Service Desk tickets on the incident and request item tables. That's the answer to gap 1: SailPoint's Service Desk best practice uses the mapped ServiceNow status to decide when its provisioning task is treated as complete. With the rule in place, the status mapping no longer decides completion.

Step 3 schedules the re-read client. It reads waiting records, re-reads the account through ISC, the identity through ISC Search, or the user through Microsoft Graph, and closes with the query, the time, a hash of the response and the checker, or reopens with the differences. An ISC read reflects the last aggregation, so the client waits a grace period before calling a stale read a mismatch.

Step 4 tunes the grace period to the aggregation schedule, and records the setting.`,
  `${IG}, Step 6 — "Prerequisites," steps 1–4; integration kit page, "Build 2: the re-read rule"; Book 13, Appendix B — "The five-clause request chain."`);
}

// ================================================================== 7 G6: in code
{
  const s = content(SG6, "G6 in code: six waiting findings, re-read offline");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 8.2, [
    "# examples/servicenow-sailpoint, Chapter 05, Lab 1: saved records and reads, dry run",
    "python clients/python/reread_verification.py \\",
    "    --records-json tests/fixtures/reread/awaiting_records.json \\",
    "    --observations-json tests/fixtures/reread/observations.json --now 2026-11-01T12:00:00Z",
    "#   [dry-run] IDF0001001: verified; would PATCH state=3",
    "#   [dry-run] IDF0001002: mismatch; would PATCH state=1 (accountEnabled: intended False, ...)",
    "#   IDF0001003: pending, the ISC copy predates the change; re-run after the next aggregation",
    "#   IDF0001005: skipped, the intended state names nothing a re-read can check",
    "#   1 mismatch, 1 pending, 1 skipped, 3 verified",
    "# the same records with --now 2026-11-02T12:00:00Z:",
    "#   IDF0001003: mismatch   ...   2 mismatch, 1 skipped, 3 verified",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 05, LAB 1, STEPS 2–3)", pt: 10.5 });
  panel(s, "Read", 9.05, 1.45, 3.7, null, HEX.navy, HEX.navyTint, "WHAT CHAPTER 05 ADDS", null, [
    "The guard: an intended state that names nothing checkable is skipped, never verified",
    "The offline mode: the same decisions over saved data; --apply refused; a missing read is an error",
    "The grace period: 24 hours by default (design guidance)",
  ], 12);
  line(s, "Rule", "The business rule's own tests: a person's close is redirected; evidence alone, or the verifier alone, isn't enough.",
    c1 + 0.2, 0.6, 13.5);
  sources(s, "Sources: Developer workbook, Ch 05 (what exists; what this chapter adds; Lab 1, steps 2–4); examples/servicenow-sailpoint.");
  notes(s,
`The workbook's Chapter 05 adds two things to the re-read client the kit already had.

First, a guard. The client skipped a record whose intended state was empty, but not one whose intended state was a non-empty object naming nothing, which is what the script stores for a native change the workflow didn't describe. Comparing a read against it finds no difference, so the client would have closed that record, with evidence, on nothing. Now it checks the intended state first, and a record that names nothing checkable is skipped with the reason, never verified.

Second, an offline mode. It takes saved waiting records and saved reads, and a fixed clock for the grace period, and makes the same decisions with only the reader swapped. It's a dry run only: apply is refused, and a subject with no saved read is an error, because a missing read isn't a match.

Six fictional waiting records, at noon on November 1: three verify; a terminated user still enabled in Entra ID is a mismatch, so the record would reopen; an ISC account last modified the night before the finding started waiting is pending, because the read predates the change; and the empty-intent native change is skipped. Run the same records a day later and the stale read is now a mismatch: after the grace period, twenty-four hours by default as design guidance, a stale read reopens the record.

The business rule's own tests run alongside: a person's close is redirected to Awaiting verification; the verifier with fresh evidence may close; evidence alone, or the verifier alone, isn't enough; and on incident, only tickets the integration opened are governed.`,
  `${WB}, Chapter 05 — "What exists," "What this chapter adds," "Lab 1: fixtures, no tenant," steps 2–4.`);
}

// ================================================================== 8 G6: requirement, evidence, rollback
{
  const s = content(SG6, "G6: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.2, 6.95], ["Requirement", "Evidence the ISSO keeps"], [
    ["CM-3 (records of changes retained)", "The evidence attachment and hash on each closed record"],
    ["CM-4(2), Verification of Controls (Moderate)", "The re-read result and time"],
    ["CA-7", "Closed and reopened counts per period"],
    ["AU-12, Audit Record Generation", "The verifier account's audit trail"],
  ], { fontSize: 12, limit: 6.6 });
  pair(s, "G6", tb + 0.2,
    ["VALIDATE (G6) AND ROLLBACK", [
      "Kit (logic, mocked): the re-read tests, Python and PowerShell; the business rule's tests",
      "Live: a person's close becomes Awaiting verification; the client closes it only on the intended state; a mismatch reopens (kit lab items 2 and 3)",
      "Rollback: disable the business rule; closures lose evidence until it's back",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "ISC's Accounts and Search APIs and Graph's users endpoint; GCC worldwide, GCC High graph.microsoft.us",
      "The ISC API domain for a FedRAMP tenant: not confirmed (G1)",
      "Interim: the verifier runs the client by hand once a day, dry run first; the rule still blocks a person's close",
    ]]);
  sources(s, "Sources: Guide, G6 (requirements and evidence; availability; interim path; Validate); Microsoft Graph national cloud deployments, as footnoted.");
  notes(s,
`G6's federal requirements, and the evidence the ISSO keeps.

CM-3, with records of changes retained: each closure carries its proof, so the evidence attachment and hash on each closed record. CM-4 enhancement 2, verification of controls, at Moderate: the change is verified after it's made, so the re-read result and time. CA-7: closure feeds monitoring, so the closed and reopened counts per period. And AU-12, audit record generation: the verifier's actions are attributable, so the verifier account's audit trail.

Validate. The kit's tests prove the logic against mocked data: the Python and PowerShell re-read tests cover a dry run that writes nothing, a match that closes with evidence and an attachment, a mismatch that reopens with a note, and a stale ISC read that waits for the grace period; the business rule's tests cover a person's close redirected to Awaiting verification, evidence alone or the verifier alone not being enough, and, on incident, only Service Desk tickets being governed. Live, a person's close becomes Awaiting verification, the client closes it only after the account shows the intended state, and a mismatch reopens it; those are items 2 and 3 of the kit's lab.

Availability: the re-read uses ISC's Accounts and Search APIs and Graph's users endpoint. GCC uses the worldwide Graph endpoint and GCC High graph.microsoft.us. The ISC API domain for a FedRAMP tenant wasn't confirmed; that's G1's question.

The interim path: before the client runs on a schedule, the verifier runs it by hand once a day, dry run first, then apply, and the business rule still blocks a person's close. Rollback: disable the business rule; records return to the platform's normal state model, and closures lose their evidence until it's re-enabled.`,
  `${IG}, Step 6 — "Federal requirements and evidence," "Availability," "Interim path," "Validate (G6 Re-read)."`);
}
endModule(SG6);

// ================================================================== 9 G7: tempo and measures
{
  const s = content(SG7, "G7: the tempo, the five measures, the schedules");
  tag(s, "What");
  const tb = table(s, "Tempo", 1.45, [1.4, 3.1], ["Severity", "Window"], [
    ["P1", "Halts"],
    ["P2", "One hour"],
    ["P3", "24 hours"],
    ["P4", "72 hours"],
  ], { fontSize: 12.5, limit: 6.6 });
  const p0 = panel(s, "Measures", 5.35, 1.45, 7.4, null, HEX.navy, HEX.navyTint, "STEP 2: THE FIVE MEASURES, TO THE GOVERNANCE BOARD", null, [
    "Detection coverage",
    "Window adherence",
    "Escalation rate",
    "Machine-closure share",
    "Declared-exception count",
  ], 12.5);
  const p1 = panel(s, "Steps", 0.6, Math.max(tb, p0) + 0.2, 12.15, null, HEX.teal, HEX.tealTint, "STEPS 1, 4 AND 5", null, [
    "Schedule the drift reconciliation and the re-read client; keep their outputs with the date and the checker version",
    "Export the evidence: a nightly bundle of SailPoint events and ServiceNow records in Book 13's shape, planned for Pass 2",
    "Review each declared exception at its end date, and each L4 class quarterly",
  ], 12);
  line(s, "Win", "The windows are the program's, not federal ones.", p1 + 0.15, 0.36, 13.5);
  sources(s, "Sources: Guide, G7 steps 1, 2, 4, 5; Book 13, Ch 10 (what the tempo shows leadership); Appendix B (severity and tempo; the evidence record).");
  notes(s,
`Once the loop runs, it runs on Book 13's tempo: P1 halts, P2 one hour, P3 twenty-four hours, P4 seventy-two hours. These are the program's windows, not federal ones.

Step 1 schedules the drift reconciliation and the re-read client, and keeps their outputs with the date and the checker version.

Step 2 reports the five measures to the governance board, from Book 13's Chapter 10: detection coverage, window adherence, escalation rate, machine-closure share, and the declared-exception count. They tell leadership whether the loop is closing on machines, inside its windows, or leaning on exceptions.

Step 3 routes the identity fixes through the loop; that's the next slide.

Step 4 exports the evidence: a nightly bundle of SailPoint events and ServiceNow records in Book 13's evidence shape, planned for the kit's Pass 2. The developer workbook already builds the ServiceNow half, which comes two slides from now.

Step 5 reviews each declared exception at its end date, and each L4 class quarterly, so an autonomous class keeps its acceptance current and an exception doesn't become permanent.`,
  `${IG}, Step 7 — steps 1–5; Book 13, Chapter 10 — "What the tempo shows leadership"; Appendix B — "Severity and tempo," "The evidence record."`);
}

// ================================================================== 10 G7: identity fixes
{
  const s = content(SG7, "G7: the identity fixes, routed through the loop");
  tag(s, "Who");
  const tb = table(s, "Fix", 1.45, [3.0, 4.15, 5.0], ["Fix", "Detect", "Fix and carry back"], [
    ["A wrong fact in HR", "Identity Attributes Changed; a catalog item", "HR corrects it in Core HCM; SailPoint re-aggregates"],
    ["A late or retroactive action", "A lifecycle-state change on aggregation", "The leaver state disables; the connector revokes sessions"],
    ["An urgent leaver HR hasn't entered", "A manager or security calls", "A workflow or manual lifecycle-state change runs the leaver"],
    ["A record the pipeline couldn't apply", "A failed action, or a Service Desk \"Failed\"", "Re-run through SailPoint, never by hand"],
    ["A write outside the pipeline", "Native Change Detection", "SailPoint restores the value; the writer's access is reviewed"],
    ["An account that matches nobody", "Uncorrelated accounts on aggregation", "Correlate it to a person, or disable it"],
    ["The same person twice", "SailPoint correlation", "A correlation-rule change, by the data architect"],
    ["A fact HR doesn't own (contractors)", "A separate contractor source", "Correct it in the contractor source"],
    ["A rule that derives wrong access", "A certification campaign", "Change the rule, through a ServiceNow normal change"],
    ["Residual access after a move", "Attribute change, then a certification", "Revoke through the connector, else a Service Desk ticket"],
    ["A credential that outlives the person", "Outside both products", "The card system and the CLM platform (Book 07)"],
  ], { fontSize: 10.5, limit: 6.25, minRow: 0.3 });
  line(s, "Label", "Inference or design guidance unless the guide cites a source.", tb + 0.08, 0.3, 12);
  sources(s, "Sources: Guide, G7 \"The identity fixes, on these products\" (from the identity maintenance explainer's fix catalog; SailPoint pages as footnoted).");
  notes(s,
`Step 3 of G7 routes the identity fixes through the loop. This table is the guide's, from the identity maintenance explainer's fix catalog. Everything in it is inference or design guidance unless a note in the guide cites a source.

A wrong fact in HR: detected by SailPoint's Identity Attributes Changed event or a "my information is wrong" catalog item, routed to HR as a ServiceNow case. HR corrects it in Core HCM and SailPoint re-aggregates; SailPoint can't write HR-mastered attributes back. A late or retroactive personnel action: a lifecycle-state change on aggregation; the leaver state disables accounts and the Entra connector revokes sessions on disable. An urgent leaver HR hasn't entered: a manager or security calls, a ServiceNow emergency change, and a SailPoint workflow or manual lifecycle-state change runs the same leaver sequence.

A record the pipeline couldn't apply goes to the identity data steward and is re-run through SailPoint, never by hand. A write outside the pipeline is Native Change Detection's job: a provenance finding, SailPoint restores the value, and the writer's access is reviewed. An account that matches nobody: its owner correlates it to a person or disables it. The same person twice is a correlation-rule change by the data architect. A fact HR doesn't own, for contractors, is corrected in the separate contractor source by the sponsor.

A rule that derives the wrong access is found by a certification campaign and changed through a ServiceNow normal change by the governance body. Residual access after a move: an attribute-change trigger then a certification, and access granted by the previous lifecycle state is revoked automatically; revocation goes through the connector, else a Service Desk ticket. And a credential that outlives the person is outside both products: the card system and the certificate lifecycle platform, Book 07.`,
  `${IG}, Step 7 — "The identity fixes, on these products"; identity maintenance explainer — the fix catalog.`);
}

// ================================================================== 11 G7: in code
{
  const s = content(SG7, "G7 in code: evidence records and the hash chain");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 8.3, [
    "# examples/servicenow-sailpoint, Chapter 07, Lab 1: five fictional closed findings",
    "python clients/python/evidence_export.py --records-json .../evidence/closed_records.json \\",
    "    --out-dir out/evidence --period 2026-10 --generated-at 2026-11-01T12:00:00Z",
    "#   5 evidence records: 4 closed on a re-read, 1 declared exception",
    "#   Window adherence: 2 of 3 closed inside the window",
    "#     IDF0000902: closed after its response window",
    "#     IDF0000903: evidence doesn't hash to u_evidence_hash: edited after closure, or cut short",
    "#     IDF0000905: closed without re-read evidence                              (exit 1)",
    "python clients/python/evidence_export.py --verify-dir out/evidence",
    "#   Package holds: every file matches the manifest and the chain is unbroken.",
    "# remove one line from records.jsonl, verify again:",
    "#   line 2 (IDF0000903): prev_sha256 doesn't match the line before   Package does not hold",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 07, LAB 1, STEPS 2, 3 AND 5)", pt: 10.5 });
  panel(s, "Rec", 9.15, 1.45, 3.6, null, HEX.navy, HEX.navyTint, "WHAT A RECORD HOLDS", null, [
    "Book 13's seven fields; approval, executing identity and what ran are null, with the reason: Pass 1 doesn't actuate",
    "Four named checks per record",
    "Each line carries the SHA-256 of the line before",
    "Tamper-evident, not signed",
  ], 11.5);
  line(s, "Done", "The \"done\" closure fails the export: Book 13 calls that prose, not evidence.", c1 + 0.2, 0.36, 13.5);
  sources(s, "Sources: Developer workbook, Ch 07 (what this chapter adds; Lab 1, steps 2–5); Guide, G7 Validate; examples/servicenow-sailpoint.");
  notes(s,
`G7's automated check is the workbook's Chapter 07, evidence_export.py, which reads closed findings back out of ServiceNow under its own read-only role.

It writes one record per finding in Book 13's shape, with the seven fields. Approval, executing identity and what ran are written as null, each with the reason: Pass 1 doesn't actuate, and the change or catalog record that would hold them is a later pass. The record says so rather than leaving the fields out or filling them.

Four checks run on every record, each reported by name: the evidence still hashes to its stored hash, so an edit after closure or a value cut short by the field limit fails; a closed record carries evidence at all; the evidence says the intended state matched; and the record finished inside its response window.

Five fictional October records: four closed on a re-read and one declared exception. Window adherence is two of three closed inside the window. Three records have problems: one closed late, one whose evidence was edited after it closed, and one closed with a note that says "done", the closure by assertion Book 13 calls prose, not evidence. The run exits 1 instead of producing a clean-looking package.

The package is records, a summary and a manifest, and each line carries the SHA-256 of the line before, so a removed or reordered record breaks the chain. The verifier is the check an ISSO runs on a package they receive: it holds; remove one line and it doesn't. November's chain starts from October's head. The package is tamper-evident, not signed: signing, and where it's stored, are the program's to decide.`,
  `${WB}, Chapter 07 — "What this chapter adds," "Lab 1: fixtures, no tenant," steps 2–5; ${IG}, "Validate (G7 Tempo and evidence)."`);
}

// ================================================================== 12 G7: requirement, evidence, rollback
{
  const s = content(SG7, "G7: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.2, 6.95], ["Requirement", "Evidence the ISSO keeps"], [
    ["CA-7, Continuous Monitoring", "Scheduled run outputs; the five measures"],
    ["RA-7, Risk Response", "Window adherence and the overdue list"],
    ["CA-5, Plan of Action and Milestones", "The exception register and POA&M items"],
    ["AU-6, Audit Record Review", "The monthly evidence package and its review"],
  ], { fontSize: 12, limit: 6.6 });
  pair(s, "G7", tb + 0.2,
    ["VALIDATE (G7) AND ROLLBACK", [
      "Automated, read-only: evidence_export.py (records, window, hash-chained manifest); drift_compare.py (new, persisting, resolved)",
      "The five measures: no automated check yet",
      "Manual: a month of scheduled runs kept; the measures reported once; the first monthly package accepted by the ISSO",
      "Rollback: stop the schedules; the records stay",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "Nothing beyond G1 to G6",
      "Interim: assemble the monthly package by hand: a ServiceNow report of closed findings with evidence, and a SailPoint event search for the period",
      "Entra ID's audit logs are kept 30 days on P1 or P2: forward them to the SIEM",
    ]]);
  sources(s, "Sources: Guide, G7 (requirements and evidence; availability; interim path; Validate); \"Evidence\" (retention); Book 15, Ch 03.");
  notes(s,
`G7's federal requirements, and the evidence the ISSO keeps.

CA-7, continuous monitoring: the loop runs on a declared cadence, so the scheduled run outputs and the five measures. RA-7, risk response: windows are kept or escalated, so window adherence and the overdue list. CA-5: declared exceptions are tracked to closure, so the exception register and the POA&M items. And AU-6, audit record review: events and closures are reviewed, so the monthly evidence package and its review.

Validate. Automated and read-only: evidence_export.py writes one Book 13 evidence record per closed finding, checks the response window, and writes and verifies a hash-chained manifest; drift_compare.py classifies findings across two runs as new, persisting or resolved. The five measures have no automated check yet. The manual part: the scheduled runs have run for a month with their outputs kept, the five measures are reported once, and the first monthly evidence package is assembled end to end and accepted by the ISSO.

Availability: nothing beyond G1 to G6. The interim path, until the evidence export exists, is to assemble the monthly package by hand from a ServiceNow report of closed findings with their evidence attachments and a SailPoint event search for the same period.

One more evidence rule from the guide: run the checks on the continuous monitoring cadence and file the output with the date, the tenant and the checker version. Entra ID's own audit logs are kept for thirty days on P1 or P2, so forward them to the SIEM. Rollback: stop the schedules; the records stay.`,
  `${IG}, Step 7 — "Federal requirements and evidence," "Availability," "Interim path," "Validate (G7 Tempo and evidence)"; "Evidence"; Book 15, Chapter 03.`);
}

// ================================================================== 13 The evidence record
{
  const s = content(SG7, "The evidence record on ServiceNow and SailPoint");
  tag(s, "What");
  const tb = table(s, "Rec", 1.45, [2.6, 9.55], ["Book 13 field", "Where it comes from in this example"], [
    ["Origin", "The SailPoint trigger and workflow, the reconciliation finding ID, or the catalog request"],
    ["Owner and clock", "The ServiceNow assignment, severity, priority and due date"],
    ["Approval", "ServiceNow approval or CAB for A0 and A1; the SailPoint approval for A2 and A3; the L4 class acceptance"],
    ["Executing identity", "The SailPoint connector's or the spoke's service principal; the PIM activation for a person"],
    ["What ran", "The SailPoint provisioning event, the workflow version, or the session recording"],
    ["Result", "The re-read evidence on the finding"],
    ["Closure", "The closed record with its evidence hash and attachment"],
  ], { fontSize: 12, limit: 6.0 });
  line(s, "Map", "Every lane writes the same record. The mapping is the program's; the authorizing official and assessors decide whether a control is satisfied.",
    tb + 0.2, 0.62, 13);
  sources(s, "Sources: Guide, \"Evidence\" (the evidence record on ServiceNow and SailPoint); Book 13, Appendix A and Appendix B (the evidence record).");
  notes(s,
`Every lane writes the same record, Book 13's evidence record, and this is where each field comes from on these two products. The mapping is the program's, from Book 13's Appendix A and the federal framework crosswalk; the authorizing official and assessors decide whether a control is satisfied.

Origin: the SailPoint trigger and workflow, the reconciliation finding ID, or the catalog request. Owner and clock: the ServiceNow assignment, the severity, the priority and the due date, which G4 sets.

Approval: the ServiceNow approval or CAB record for A0 and A1, the SailPoint approval for A2 and A3, and the L4 class acceptance, which is G2's split. Executing identity: the SailPoint connector's or the spoke's service principal, or the PIM activation when a person acts, which is G5. What ran: the SailPoint provisioning event, the workflow version, or the session recording for a declared exception.

Result: the re-read evidence on the finding, from G6. And closure: the closed record with its evidence hash and attachment.

The workbook's export already writes the origin, owner and clock, result and closure from ServiceNow. Approval, executing identity and what ran are null with a reason until a later pass actuates and links those records.`,
  `${IG}, "Evidence" — "The evidence record on ServiceNow and SailPoint"; Book 13, Appendix B — "The evidence record"; ${WB}, Chapter 07.`);
}
endModule(SG7);

// ================================================================== 14 Dangers
{
  const s = content(SC, "Dangers across the seven gates");
  tag(s, "Why");
  const tb = table(s, "Danger", 1.45, [3.6, 4.6, 3.95], ["Danger", "What goes wrong", "Mitigation"], [
    ["Closure by ticket status", "A mapped \"Closed\" completes SailPoint's task with nothing checked", "G6's rule on every table SailPoint writes to"],
    ["Two approver systems for one class", "The catalog app and SailPoint both approve, or neither does", "G2's approver-per-class table"],
    ["Two writers for one attribute", "Inbound provisioning and SailPoint overwrite each other", "G2's attribute map; the writer check"],
    ["A vendor-cloud action nobody recorded", "Calls leave SailPoint's cloud, outside the reviewed boundary", "G1's data-flow record"],
    ["A feature outside the authorization", "A feature used in production isn't in the FedRAMP environment", "Written confirmation before production (G1)"],
    ["\"MFA attribute management\" as a reset", "Authentication data changed without verifying the person", "Resets stay with the help desk (G5)"],
    ["The integration identity as a back door", "Broad Graph write rights on an app registration", "Certificates, two owners, VK-NPI-05 (G1, G5)"],
    ["The exception that never ends", "A disconnected application stays manual for good", "End date, POA&M item, review (G7)"],
  ], { fontSize: 11, limit: 6.6 });
  if (process.env.FIT) console.log(`  dangers bottom ${tb.toFixed(2)}`);
  sources(s, "Sources: Guide, \"Dangers and how to avoid them\" (vendor pages as footnoted); G2 Validate (writer_check.py).");
  notes(s,
`Before closing, the guide's dangers across all seven gates, each with the gate that guards it.

Closure by ticket status: a mapped Closed status completes SailPoint's provisioning task with nothing checked. G6's rule, on every table SailPoint writes to. Two approver systems for one class: the catalog app and SailPoint both approve, or neither does. G2's approver-per-class table. Two writers for one attribute: Entra inbound provisioning and SailPoint overwrite each other. G2's attribute map, and the writer check the workbook builds.

A vendor-cloud action nobody recorded: connector calls leave SailPoint's cloud, outside the boundary the authorizing official reviewed. G1's data-flow record. A feature outside the authorization: a workflow or detection feature used in production isn't in the FedRAMP environment. Written confirmation from SailPoint before production, in G1.

MFA attribute management taken for a reset procedure: a connector changes authentication data without verifying the person. Resets stay with the help desk's verification, in G5. The integration identity as a back door: the connector's or spoke's app registration holds broad Graph write rights. Certificates, two owners, and VK-NPI-05 review, in G1 and G5. And the declared exception that never ends: a disconnected application stays manual for good. The end date, the POA&M item and the review at the end date, in G7.`,
  `${IG}, "Dangers and how to avoid them"; "Validate (G2 Writers and approvers)."`);
}

// ================================================================== 15 Close
{
  const s = content(SC, "From Draft to Proved, and where to go next");
  tag(s, "How");
  const w = 5.95;
  const p1 = panel(s, "Proved", 0.6, 1.45, w, null, HEX.amber, HEX.amberTint, "STATUS: DRAFT. TO MOVE IT TO PROVED", null, [
    "Build Gates 3 to 6 in a ServiceNow developer instance and a SailPoint sandbox",
    "Run the kit's lab items",
    "Record the evidence on the guide",
    "Still open: ISC feature parity in the FedRAMP environment, its API domain, the apps in the government Store, the spoke in GCC High",
  ], 12);
  const p2 = panel(s, "Next", 0.6 + w + 0.25, 1.45, w, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "Build it: the developer workbook Building Ticket-to-Machine, eight chapters, each with its labs",
    "Learn it in order: the learning path for Ticket-to-Machine on ServiceNow and SailPoint",
    "The kit's Pass 1: the integration kit page and its README",
    "The why: Book 13, Chapter 10 and Appendix B; Book 15, Chapter 03",
  ], 12);
  callout(s, "Line", Math.max(p1, p2) + 0.25, 0.95, "FaArrowsRotate", HEX.navy, "The loop, closed: ",
    "the ticket authorizes a machine, the machine acts under a service identity, and only a re-read closes the ticket.");
  sources(s, "Sources: Guide, \"Status and review,\" \"What couldn't be verified,\" \"How to read this guide,\" \"Back to the books.\"");
  notes(s,
`To close the series: where the guide stands, and where to go next.

The guide is a Draft. It was rewritten on November 1, 2026 from a short example into a gated implementation guide, and the rewrite hasn't been reviewed. To move it to Proved: build Gates 3 to 6 in a ServiceNow developer instance and a SailPoint sandbox, run the kit's lab items, and record the evidence on the guide. Some things couldn't be verified from public documentation: whether Workflows, Native Change Detection and the HTTP Request step are in ISC's FedRAMP environment; the ISC API domain for a FedRAMP tenant; whether SailPoint's ServiceNow apps and the Entra spoke are in ServiceNow's government Store; and the spoke in GCC High.

Where to go next. To build the code, the developer workbook Building Ticket-to-Machine: eight chapters, each starting from the kit, adding code with tests, and running a lab against fixtures with no tenant. To learn it in order, with exercises and knowledge checks, the learning path for Ticket-to-Machine on ServiceNow and SailPoint. For the kit's Pass 1, the integration kit page and the kit's README. And for the why: Book 13's Chapter 10 and Appendix B for the tempo, the lanes and the evidence record, and Book 15's Chapter 03 for triage and the authority split.

The loop, closed: the ticket authorizes a machine, the machine acts under a service identity, and only a re-read closes the ticket. The guide names products to illustrate the vendor-neutral design; it isn't an endorsement by the program or any agency.`,
  `${IG}, "Status and review," "What couldn't be verified," "How to read this guide," "Back to the books"; ${WB}, index.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation and G5", [
  "Ticket-to-Machine on ServiceNow and SailPoint: An Example Implementation Guide: \"The path on one page,\" Step 5 (steps 1–6, requirements and evidence, availability, interim path, Validate), \"Rollback.\"",
  "Vendor and Microsoft pages the guide footnotes: SailPoint Entra SaaS supported features; SailPoint Service Desk integration (ticket types); ServiceNow Entra ID spoke; SailPoint Azure Government endpoint configuration; Microsoft Entra feature availability (PIM).",
  "Book 13, Ch 10 (when no machine can reach the surface; which change classes qualify) and Appendix B (the five-clause request chain). Book 15, Ch 03 (connector coverage; what Entra ID enforces; verify the person; the evidence each ticket leaves). Integration kit page, planned for Pass 2.",
]);
sourceSlide("Sources: G6 and G7", [
  "Guide: Step 6 and Step 7 (steps, the identity fixes table, requirements and evidence, availability, interim paths, Validate); \"Evidence\" (the evidence record; retention).",
  "Vendor pages the guide footnotes: SailPoint SDIM best practices and status mapping; SailPoint Search; SailPoint Identity Attributes Changed and Native Change Account Updated triggers; Lifecycle States; Certifications; Oracle HCM Cloud supported features; Microsoft Graph national cloud deployments.",
  "Book 13, Ch 10 (what the tempo shows leadership), Appendix A, Appendix B (severity and tempo; the evidence record). Identity maintenance explainer (fix catalog). Integration kit page, Build 2.",
  "Developer workbook, Chapter 05 (the guard; the offline mode; Lab 1) and Chapter 07 (evidence_export.py; the four checks; the chain; Lab 1). examples/servicenow-sailpoint: clients/python/reread_verification.py, evidence_export.py, servicenow/business-rule-await-verification.js, tests/fixtures/reread and evidence.",
]);
sourceSlide("Sources: dangers and the close", [
  "Guide: \"Dangers and how to avoid them,\" \"What couldn't be verified,\" \"Status and review,\" \"How to read this guide,\" \"Back to the books.\"",
  "Developer workbook, Building Ticket-to-Machine: index (the pieces; chapters; reading paths). Learning path: Ticket-to-Machine on ServiceNow and SailPoint. Integration kit page, Integrating ServiceNow and SailPoint (Pass 1).",
  "Labels: product facts are the vendors' own statements as the guide footnotes them; the identity fixes and the lanes are the program's inference or design guidance; the evidence-record mapping is the program's. Naming the products isn't an endorsement.",
]);

finish(OUT);
