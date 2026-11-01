// Building Ticket-to-Machine — the story deck: one drift case, followed end to end.
// Teaches the whole developer workbook (docs/project-plans/developer-workbooks/ticket-to-machine/) through one case:
// Erin Example (E1004), whose department drifts between HR, Entra ID and SailPoint in the kit's own fixtures
// (examples/servicenow-sailpoint/tests/fixtures). Seven scenes follow her record through the loop and the example
// guide's gates (docs/books/guides/ttm-servicenow-sailpoint.md): each has a story beat with the code that handles it
// and the federal requirement behind it, a "Try it" slide with the exact Lab 1 command and its real output (re-run on
// November 1, 2026), and a one-question check whose answer opens the next slide's narration and sits in the notes.
// Facts come only from the workbook's eight chapters, the guide, Book 13 Ch 10 / App B, the learning path
// (docs/training/ticket-to-machine/) and the kit. No new external facts.
// Shared helpers: ../attribute-driven-migration-technical-part-1/slides.js, plus the deeper dive's code-panel helper.
// The build also writes narration.json (one {slide, title, say} per narrated slide) for narrate.py.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/ttm-story-one-drift-case/build.js \
//                      presentations/ttm-story-one-drift-case/TTM_Story_One_Drift_Case.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Building Ticket-to-Machine — One Drift Case, End to End",
  footer: "Federal Modernization Workbook  ·  Building Ticket-to-Machine  ·  One drift case, end to end",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || path.join(__dirname, "TTM_Story_One_Drift_Case.pptx");
const WB = "Building Ticket-to-Machine";
const GUIDE = "Ticket-to-Machine on ServiceNow and SailPoint (example guide)";
const BANNED = /\bUIAO\b|\bSSA\b|Social Security|Mainframe PIN|\bDISA\b|\bSTIGs?\b/i;

// ------------------------------------------------------------------ code panel (as in the ADM deeper dive)
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

// A one-line plain statement (navy, bold), with a fit check.
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  if (process.env.FIT) console.log(`  line ${name}: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};

// ------------------------------------------------------------------ narration and notes
// Each narrated slide: say (spoken by narrate.py through narration.json), more (presenter detail, notes only),
// ref (the "Workbook:" line). The notes carry the timing cue, the narration, the detail and the reference.
const narration = [];
let slideNo = 0;
const speak = (s, title, say, more, ref) => {
  slideNo += 1;
  const spoken = say.trim().replace(/\s+/g, " ");
  const n = spoken.split(" ").length;
  if (n > 240) throw new Error(`narration over 240 words (${n}) on "${title}"`);
  [spoken, more].forEach((t) => { if (BANNED.test(t)) throw new Error(`neutrality: "${title}"`); });
  narration.push({ slide: slideNo, title, say: spoken });
  notes(s, `${spoken}\n\nDetail: ${more.trim()}`, ref);
};
const slide = (sec, part, title) => { const s = content(sec, title); tag(s, part); return s; };
const src = (s, t) => { if (BANNED.test(t)) throw new Error("neutrality: sources"); sources(s, t); };

// A scene's story slide: the beat (left), the code that handles it (right), why it matters (bottom).
const scene = (s, beat, codeLines, codeLabel, whyLabel, whyText, o = {}) => {
  const lw = o.lw || 5.75;
  const pb = panel(s, "Beat", 0.6, 1.45, lw, null, HEX.amber, HEX.amberTint, "THE STORY BEAT", null, beat, o.beatPt || 13);
  const cb = code(s, "Code", 0.6 + lw + 0.25, 1.45, 12.15 - lw - 0.25, codeLines, { label: codeLabel, pt: o.codePt || 10.5 });
  const y = Math.max(pb, cb) + 0.22;
  callout(s, "Why", y, o.whyH || 1.05, o.icon || "FaFileShield", HEX.navy, whyLabel, whyText);
};

// A check slide: one question, four options; the answer opens the next slide and is in these notes.
const check = (sec, n, title, question, options, say, more, ref) => {
  const s = slide(sec, "How", title);
  txt(s, "Question", question, { x: 0.6, y: 1.5, w: 12.15, h: 1.15, fontSize: 21, bold: true, color: HEX.navy, fontFace: "Cambria", valign: "middle" });
  const w = (12.15 - 0.3) / 2, h = 1.2;
  options.forEach((t, k) => {
    const x = 0.6 + (k % 2) * (w + 0.3), y = 2.95 + Math.floor(k / 2) * (h + 0.25);
    box(s, `Option ${k + 1}`, x, y, w, h, "FFFFFF", HEX.teal);
    txt(s, `Option ${k + 1} text`, [{ text: `${"ABCD"[k]}   `, options: { bold: true, color: HEX.teal, fontSize: 20 } }, { text: t, options: { color: HEX.ink } }],
      { x: x + 0.25, y: y + 0.08, w: w - 0.45, h: h - 0.16, fontSize: 15.5, valign: "middle" });
  });
  line(s, "Answer note", `Check ${n} of 7: the answer opens the next slide, and it's in this slide's notes.`, 5.95, 0.4, 13);
  speak(s, title, say, more, ref);
  return s;
};

// ================================================================== 1 Title
const S0 = "Opening";
{
  const s = titleSlide(S0, "One Drift Case, End to End", "Building Ticket-to-Machine — the whole workbook through one person's record");
  txt(s, "Session map", [
    { text: "Erin's department: HR says HR, Entra ID says Finance, SailPoint says HR", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Detect · typed task · least privilege · one writer · actuate · re-read · evidence", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Every value shown is the kit's own fictional fixtures; every command was re-run", options: { color: HEX.ink, breakLine: true } },
    { text: "Illustrative code, tested against fixtures  ·  design guidance labeled as such", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 9.8, h: 1.6, fontSize: 15, paraSpaceAfter: 2 });
  speak(s, "One Drift Case, End to End",
    `Welcome to the story deck for Building Ticket-to-Machine, a developer workbook in the Federal Modernization Workbook. Instead of eight chapters one at a time, we'll follow one person's record all the way through Book 13's loop on ServiceNow and SailPoint. Her name is Erin, and she's fictional: every value you'll see comes from the kit's own test fixtures, and every command was re-run before it went on a slide. Seven scenes: the drift run finds her, her drift becomes a typed task, least-privilege clients touch it, we find why it keeps coming back, the fix is actuated, a re-read closes it, and her closure becomes evidence an I S S O can verify. Each scene ends with a command to try and a one-question check. One more thing before we start: the code is illustrative. Its tests pass against fixtures and mocked responses, but it hasn't been run against a live ServiceNow instance or SailPoint tenant. Where the vendors' documentation doesn't settle a point, the workbook says so, and so will we.`,
    `The deck teaches the whole developer workbook through one case. Erin Example, employee E1004, is in the kit's fixtures: tests/fixtures/hr_extract.csv and hr_extract_day2.csv, graph_users.json, isc_identities.json, entra_audit.json, events/identity-attributes-changed.json, and reread/awaiting_records.json (IDF0001004). The kit's fixtures are separate fictional files written for different chapters; the deck strings them together as one story and says, on each slide, which fixture a value comes from. Where a lab's fixture isn't Erin's (the writer exports, the closure signal, the evidence package), the slide says so. The code is illustrative: its tests pass against fixtures and mocked responses, but it has not been run against a live ServiceNow instance or SailPoint tenant (workbook index, status callout). The scenes follow the loop's five steps and the example guide's seven gates: G3 sources and starting drift, G4 front door, G1 boundary, G2 writers, G5 actuation, G6 re-read, G7 tempo and evidence.`,
    `${WB}, index ("The pieces and how they connect," "Chapters"); ${GUIDE}, "The path on one page"; Book 13, Appendix B, "The coordination loop."`);
}

// ================================================================== 2 Cast and stakes
{
  const s = slide(S0, "Why", "The cast and the stakes");
  const tb = table(s, "Cast", 1.45, [3.05, 4.15, 4.95], ["Who or what", "In the fixtures", "Why it matters"], [
    ["Erin Example, E1004", "HR extract, day one: department HR, manager E1000", "The person; HR is the source of authority"],
    ["Entra ID (Microsoft 365 GCC)", "department Finance; manager E1001", "Two attribute drifts from HR"],
    ["helpdesk.admin@contoso.example", "Directory audit, 2026-10-20 14:05Z: Department HR → Finance", "A write outside the pipeline: an unauthorized write"],
    ["SailPoint ISC", "department HR; manager E1001 (Alice)", "Not yet re-aggregated; a third copy"],
    ["ServiceNow", "u_identity_finding: the typed task and its evidence", "The front door and the record"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "Stakes", tb + 0.22, 1.05, "FaTriangleExclamation", HEX.red, "The stakes: ",
    "close Erin's finding because a ticket says “done,” or fix it by hand while two systems still write department, and the drift comes back with nobody able to prove what happened.");
  src(s, "Sources: kit fixtures hr_extract.csv, graph_users.json, isc_identities.json, entra_audit.json. Workbook Ch 06, Lab 1; guide, “The loop at a glance,” gaps 1 and 4.");
  speak(s, "The cast and the stakes",
    `Meet the cast. Erin's HR record says she works in HR and reports to employee E1000. Entra ID, in a Microsoft 365 GCC tenant, says Finance, and a different manager. The directory audit shows why: on October twentieth a help desk administrator typed Finance in by hand. SailPoint still says HR. And ServiceNow is the front door, where her drift becomes a typed task with its evidence. The stakes are the two failures the example guide warns about: closing her finding because a ticket says done, and fixing her record by hand while two systems still write department. Either way the drift comes back, and nobody can prove what happened. Keep three numbers in your head: E1004 is Erin, E1000 is the manager HR names, and E1001, Alice, is the manager Entra ID and SailPoint name instead. The estate is a FedRAMP Moderate civilian one: ServiceNow's Government Community Cloud, FedRAMP High; SailPoint's Identity Security Cloud, FedRAMP Moderate; and Entra ID on the worldwide Graph endpoint, which is what GCC uses.`,
    `From the fixtures: hr_extract.csv, E1004, Active, department HR, managerEmployeeId E1000, Erin Example. graph_users.json: Erin's Entra user 00000000-0000-0000-0000-000000001004, department Finance, manager E1001. entra_audit.json, audit-0001: Update user, 2026-10-20T14:05:00Z, initiated by helpdesk.admin@contoso.example, Department ["HR"] to ["Finance"]. isc_identities.json: erin.example, 2c9180000000000000000000000e1004, department HR, manager alice.example (E1001). The guide's four gaps between the products and the loop: 1 a ticket status isn't a re-read (SailPoint's Service Desk integration uses the mapped ServiceNow status to decide completion); 4 two doors into the directory (SailPoint can provision Entra ID and AD, and Book 03 makes Entra inbound provisioning the one writer of HR-mastered attributes). The estate is a FedRAMP Moderate civilian one: ServiceNow's Government Community Cloud (FedRAMP High), SailPoint ISC (FedRAMP Moderate), Microsoft 365 GCC on the worldwide endpoints (workbook index).`,
    `${WB}, index; Chapter 06, "Lab 1," step 2; ${GUIDE}, "The loop at a glance" (the four gaps).`);
}

// ================================================================== 3 The map
{
  const s = slide(S0, "What", "Erin's path through the loop and the gates");
  const tb = table(s, "Path", 1.45, [0.6, 3.4, 2.2, 1.55, 1.15, 3.25], ["#", "Scene", "Loop step", "Gate", "Chapter", "Code"], [
    ["1", "The drift run finds Erin", "1 Test, 2 Detect", "G3", "06", "identity_drift.py"],
    ["2", "Her drift becomes a typed task", "3 Raise a typed task", "G4", "01, 04", "finding_contract.py, workflow_payload.py"],
    ["3", "Who may touch her record", "3 and 5", "G1", "02, 03", "config/calls.json, kit_calls.py"],
    ["4", "Why her department keeps drifting", "Pass 2, gap 4", "G2", "08", "writer_check.py"],
    ["5", "The fix, on the native surface", "4 Actuate", "G5", "—", "Not in Pass 1"],
    ["6", "The re-read closes it, or reopens it", "5 Close with evidence", "G6", "05, 06", "reread_verification.py, drift_compare.py"],
    ["7", "Her closure becomes evidence", "5, clause 5", "G7", "07", "evidence_export.py"],
  ], { fontSize: 12.5, limit: 5.6 });
  line(s, "Shape", "Each scene: the story beat, the code and the federal requirement; a Try it; a one-question check.", tb + 0.25, 0.4, 14);
  src(s, "Sources: workbook index, “Chapters”; Ch 01, “The loop, and where the kit sits”; guide, “The path on one page,” “The loop at a glance.”");
  speak(s, "Erin's path through the loop and the gates",
    `Here's the route. Book 13's loop has five steps: test, detect drift, raise a typed task, actuate, and close with evidence. The example guide builds it in seven gates, and the workbook's chapters build the code. Scene one is the drift run, Gate 3 and Chapter 6. Scene two turns her drift into a typed task, Gate 4, Chapters 1 and 4. Scene three is least privilege, Gate 1, Chapters 2 and 3. Scene four finds why her department keeps drifting, Gate 2, Chapter 8. Scene five is actuation, Gate 5, which the kit's first pass deliberately doesn't build. Scene six is the re-read, Gate 6, Chapter 5. And scene seven is the evidence, Gate 7, Chapter 7. Every scene has the same shape. First, the story beat: what happens to Erin's record, with the code that handles it and the federal requirement behind it. Then a slide called Try it, with the exact Lab 1 command from the workbook and the output it really printed. Then a one-question check. Pause the video if you want to answer it; the answer opens the next slide.`,
    `The loop (Book 13, Appendix B): test, detect drift, raise a typed task, actuate on the native surface, close with evidence. The kit builds the identity half of three steps and leaves actuation to a later pass (Chapter 01's table: 1 Test identity_drift.py; 2 Detect drift ISC event triggers and the drift client; 3 Raise a typed task the ISC workflows' HTTP Request step and the Scripted REST resource; 4 Actuate not in Pass 1; 5 Close with evidence the business rule and reread_verification.py). The guide's seven gates: G1 Boundary, G2 Writers and approvers, G3 Sources and starting drift, G4 Front door, G5 Actuation, G6 Re-read, G7 Tempo and evidence. The deck takes them in story order rather than gate order, the way the learning path starts at Gate 4 because every other gate writes or reads the record that gate defines.`,
    `${WB}, index ("Chapters"); Chapter 01, "The loop, and where the kit sits"; ${GUIDE}, "The path on one page"; learning path, "Modules."`);
}
endModule(S0);

// ================================================================== Scene 1
const S1 = "Scene 1 — The drift run";
{
  const s = slide(S1, "What", "Scene 1: the drift run finds Erin");
  scene(s, [
    "Day one: the reconciliation joins the HR extract, Graph and SailPoint on employeeId",
    "Erin gets four findings: Entra department, Entra manager, ISC manager, and an unauthorized write on Department",
    "The write is visible only because the run read the Entra directory audit",
    "The same drift gets the same 16-character ID on every run",
  ], [
    "# identity_drift.py: one finding, one stable ID",
    "id_parts = [str(p) if p not in (None, \"\") else None",
    "            for p in (drift_class, system, employee_id,",
    "                      object_id, attribute)]",
    "finding[\"finding_id\"] = kc.sha256_hex(id_parts)[:16]",
  ], "clients/python/identity_drift.py (excerpt)", "Gate 3 — AC-2 and CA-7: ",
  "every active HR record has its accounts and every enabled account has a person (AC-2); drift is measured on a schedule (CA-7). The ISSO keeps each run's JSON and CSV.");
  src(s, "Sources: Workbook Ch 06, “What exists,” “Federal requirements and evidence”; guide, Gate 3 (AC-2, CA-7); kit identity_drift.py.");
  speak(s, "Scene 1: the drift run finds Erin",
    `Scene one. On day one, the drift client joins the HR extract, Microsoft Graph and SailPoint on the employee ID, and measures Book 3's drift classes. Erin collects four findings: her Entra department and Entra manager disagree with HR, her SailPoint manager disagrees too, and there's an unauthorized write on her department. That last one appears only because this run read the directory audit; without it, the class isn't computed at all. Each finding's ID is a hash of its class, system, employee, object and attribute, so the same drift has the same ID every night. Why it matters: Gate 3 measures the starting drift. That's account management and continuous monitoring, and the I S S O keeps every run's output. Notice what the run doesn't claim. Credential drift and schema drift need other systems, the card system, Intune and the provisioning middleware, so every run lists them as not computed instead of implying they're clean. And expect a burst of High findings in a real estate's first month; Book 3 calls that the measurement working.`,
    `identity_drift.py inputs: an HR extract (CSV, employeeId and status required); Graph users with employeeId, accountEnabled, department and the manager's employeeId; ISC identities from Search and uncorrelated accounts; optionally the Entra directory audit. Classes: missing identity, stale access, orphan account and attribute drift (department and manager), High or Medium as Book 03, Chapter 11 sets them; an unauthorized write only when the audit is read. Credential and schema drift are always reported as not computed. Finding IDs: a hash of class, system, employee ID, object ID and attribute; the PowerShell client produces the same IDs. Erin's four day-one findings (out/day1.csv): 1f0e34ebf049f163 attribute_drift Medium P3 entra department expected HR observed Finance; 72cff206ce2db7b6 attribute_drift entra manager expected E1000 observed E1001; 40961ae8da0e8cf3 attribute_drift isc manager expected E1000 observed E1001; 7aabec019d85a331 unauthorized_write High P2 entra Department ["HR"] to ["Finance"], initiated by helpdesk.admin@contoso.example. Gate 3's requirements (guide): AC-2 finds accounts with no worker and workers with no account; CA-7 starts a repeatable comparison; evidence is the baseline drift report, its date and the checker version. Chapter 06's table: every active HR record has its accounts, every terminated one has none enabled, and every enabled account has a person (AC-2 at Moderate); drift measured on a schedule (CA-7, SI-4).`,
    `${WB}, Chapter 06, "What exists," "Federal requirements and evidence"; ${GUIDE}, Step 3 (Gate 3).`);
}
{
  const s = slide(S1, "How", "Try it: day one finds Erin's four findings");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv \\",
    "    --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json \\",
    "    --isc-identities-json tests/fixtures/isc_identities.json \\",
    "    --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json \\",
    "    --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day1.json --out-csv out/day1.csv",
    "\"attribute_drift\": 4, \"missing_identity\": 2, \"orphan_account\": 3, \"stale_access\": 2, \"unauthorized_write\": 1",
    "$ grep E1004 out/day1.csv          # Erin's rows, first columns only",
    "1f0e34ebf049f163,attribute_drift,Medium,P3,entra,E1004,…,department,HR,Finance,…",
    "72cff206ce2db7b6,attribute_drift,Medium,P3,entra,E1004,…,manager,E1000,E1001,…",
    "40961ae8da0e8cf3,attribute_drift,Medium,P3,isc,E1004,…,manager,E1000,E1001,…",
    "7aabec019d85a331,unauthorized_write,High,P2,entra,E1004,…,Department,[\"HR\"],[\"Finance\"],…",
  ], { label: "WORKBOOK CH 06, LAB 1, STEP 2 (AND CH 01, STEP 4), IN examples/servicenow-sailpoint", pt: 10.5 });
  callout(s, "Read", cb + 0.22, 0.95, "FaListCheck", HEX.teal, "Read it: ",
    "credential and schema drift are listed under not_computed. Erin's unauthorized write is P2, a one-hour window; her attribute drifts are P3, a day.");
  src(s, "Sources: kit fixtures (fictional), re-run November 1, 2026. Workbook Ch 06, “Lab 1,” step 2; Ch 01, “Lab 1,” step 4. The grep is shown for the story.");
  speak(s, "Try it: day one finds Erin's four findings",
    `Try it. From the kit's folder, run the drift client over the fixtures, with the audit. The summary counts four attribute drifts, two missing identities, three orphan accounts, two stale accesses and one unauthorized write, and it lists credential and schema drift as not computed rather than implying they're clean. Then look for Erin's employee ID in the CSV. There she is, four times: department and manager in Entra ID, manager in SailPoint, each Medium at P3; and the unauthorized write, High at P2. If you run this yourself, you need Python 3.10 or later with pytest and requests, and you work in the kit's examples folder. Nothing touches a tenant or the network. When you're done, delete the out folder; the labs write everything there.`,
    `The command is Chapter 06's Lab 1, step 2 (also Chapter 01's Lab 1, step 4). Re-run on November 1, 2026: the JSON summary printed counts attribute_drift 4, missing_identity 2, orphan_account 3, stale_access 2, unauthorized_write 1, and not_computed credential_drift ("needs the card management system and Intune certificate reports") and schema_drift ("needs the provisioning middleware's validation output"). The grep line is added for the story (the chapter says "Open out/day1.csv"); the four rows are the real rows with the long columns (object ID, name, detection time, evidence) elided. Severity to priority: High P2, Medium P3 (the drift client); the Scripted REST script's tempo gives P2 one hour and P3 24 hours (Chapter 01). Delete out when you're done.`,
    `${WB}, Chapter 06, "Lab 1: fixtures, no tenant," step 2; Chapter 01, "Lab 1," step 4.`);
}
check(S1, 1, "Check 1: which of Erin's findings needs a person?",
  "Tomorrow HR corrects Erin's department to Finance, matching Entra ID. Which day-one finding still won't go away on its own?",
  ["The Entra ID department drift (1f0e…)", "The Entra ID manager drift (72cf…)", "The ISC manager drift (4096…)", "The unauthorized write on Department (7aab…)"],
  `Check one. Tomorrow, HR corrects Erin's department to Finance, so HR and Entra ID agree. Which of her four day-one findings still won't go away on its own? Is it the Entra department drift, the Entra manager drift, the SailPoint manager drift, or the unauthorized write? Think about what HR agreeing afterwards does, and doesn't, prove. The answer opens the next scene.`,
  `Answer: D, the unauthorized write. In Chapter 06's Lab 1, step 4, after HR's day-two correction the Entra department finding is resolved, but the unauthorized write persists: HR agreeing afterwards doesn't make the write authorized, and a person decides that finding. Book 13 routes provenance drift (an unauthorized write) and identity drift to a human decision first (Chapter 01: HUMAN_DECISION_CLASSES are missing_identity and unauthorized_write). Option A resolves on day two; B and C are untouched by a department correction.`,
  `${WB}, Chapter 06, "Lab 1," step 4; Chapter 01, "What this chapter adds" (is_checkable).`);
endModule(S1);

// ================================================================== Scene 2
const S2 = "Scene 2 — The typed task";
{
  const s = slide(S2, "What", "Scene 2: Erin's drift becomes a typed task");
  scene(s, [
    "Each finding becomes one payload: class, severity, system, one subject, origin, and the intended state a re-read must find",
    "Her department drift: P3, due in 24 hours; the unauthorized write: P2, due in one hour",
    "The write is accepted with a warning: its intended state is empty until a person sets it",
    "From SailPoint, the mover workflow raises her department change with Finance as the intended state",
  ], [
    "# finding_contract.py mirrors the Scripted REST script",
    "WINDOW_SECONDS = {\"P1\": 0, \"P2\": 3600,",
    "                  \"P3\": 86400, \"P4\": 259200}",
    "def dedupe_key(payload):",
    "    key = \"|\".join([source, subject, drift_class])",
    "    return key + (\"|\" + attribute if attribute else \"\")",
  ], "clients/python/finding_contract.py (excerpt, simplified)", "Gate 4 — CM-3, RA-7, CA-7: ",
  "every drift is a documented, owned record, answered inside a declared window. The tempo is Book 13's design, not a federal clock.");
  src(s, "Sources: Workbook Ch 01, “What exists,” “What this chapter adds”; Ch 04, fix 2; guide, Gate 4 (CM-3, RA-7, CA-7); Book 13 tempo.");
  speak(s, "Scene 2: Erin's drift becomes a typed task",
    `The answer to check one: the unauthorized write. HR agreeing later doesn't make a hand-typed change authorized, so a person decides it. Scene two. Each of Erin's findings becomes one typed task in ServiceNow: a class, a severity, the system where it'll be re-read, one subject, its origin, and the intended state a re-read must find. Her department drift is P3, due in a day. The unauthorized write is P2, due in an hour, and it's accepted with a warning, because its intended state is empty until that person decides. From SailPoint's side, the mover workflow raises her department change with Finance as the intended state. Why it matters: Gate 4 makes every drift an owned record answered inside a window. The tempo is Book 13's design, not a federal clock. The important design choice is that the rules live in one place, the scripted REST resource inside ServiceNow, and the Python mirror is held to it by a test that reads the JavaScript. So a malformed payload fails on a laptop, not as a four hundred from a live instance, and the mirror can't quietly go stale.`,
    `The contract (Chapter 01): kind, source, drift_class (Book 03's seven classes), severity (P1 to P4), system (where the re-read happens), one subject identifier, origin, and an intended_state. The Scripted REST resource validates and answers 400 with the reason, maps severity to priority and a due date on Book 13's tempo (P1 immediate, P2 one hour, P3 24 hours, P4 72 hours; program design, not a federal requirement), defaults severity by class, de-duplicates, and derives an intended state from an ISC event. finding_contract.py mirrors its constants and a test reads the JavaScript. The code excerpt is simplified from finding_contract.py's WINDOW_SECONDS and dedupe_key (the real function reads source, subject_of(payload), drift_class and attribute from the payload). Chapter 04's mover workflow (Identity Attributes Changed) posts identity_id and changes; the script keeps the new value as the intended state. Gate 4's requirements (guide): CM-3 every proposed change is a documented, owned record; RA-7 findings are responded to inside declared windows; CA-7 monitoring results become tracked work; AC-5 for requests. CM-3(1) is High-baseline only; at Moderate the program adopts the shape as design. An external clock, such as a CISA directive's, overrides the tempo when shorter (Chapter 01).`,
    `${WB}, Chapter 01, "The loop, and where the kit sits," "What exists," "What this chapter adds"; Chapter 04, "What this chapter adds"; ${GUIDE}, Step 4 (Gate 4).`);
}
{
  const s = slide(S2, "How", "Try it: what ServiceNow will do with Erin's payloads");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ python clients/python/finding_contract.py --from-drift out/day1.json --now 2026-11-01T12:00:00Z",
    "1f0e34ebf049f163: ok attribute_drift P3 priority 3 due 2026-11-02T12:00:00Z system entra_user",
    "72cff206ce2db7b6: ok attribute_drift P3 priority 3 due 2026-11-02T12:00:00Z system entra_user",
    "7aabec019d85a331: ok unauthorized_write P2 priority 2 due 2026-11-01T13:00:00Z system entra_user",
    "7aabec019d85a331: warning: intended_state names nothing a re-read can check (expected: …)",
    "12 accepted, 0 rejected, 0 would de-duplicate                    # Erin's lines shown; 15 lines in all",
    "$ python clients/python/workflow_payload.py --trigger idn:identity-attributes-changed \\",
    "    --event tests/fixtures/events/identity-attributes-changed.json",
    "intended_state {\"attributes\": {\"department\": \"Finance\"}}",
    "contract: accepted: P3, priority 3, key sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department",
  ], { label: "WORKBOOK CH 01, LAB 1, STEP 4, AND CH 04, LAB 1, STEP 3", pt: 10.5 });
  callout(s, "Read", cb + 0.22, 0.95, "FaListCheck", HEX.teal, "Read it: ",
    "the fixed clock is noon, November 1: P3 falls due the next noon, P2 at 13:00. The SailPoint key ends in the attribute, department.");
  src(s, "Sources: kit fixtures (fictional), re-run November 1, 2026. Workbook Ch 01, “Lab 1,” step 4; Ch 04, “Lab 1,” step 3. Output trimmed to Erin's lines.");
  speak(s, "Try it: what ServiceNow will do with Erin's payloads",
    `Try it. Feed day one's run to the contract check at a fixed clock, noon on November first. Erin's department and manager drifts are accepted at P3, due the next noon. Her unauthorized write is accepted at P2, due at one o'clock, with the warning that its intended state names nothing yet. All twelve payloads are accepted. Then resolve SailPoint's mover workflow against the fictional event for Erin's identity. The intended state is department Finance, P3, and the de-duplication key ends in the attribute. This is the first thing to check whenever a client changes: run its payloads through the validator in its own tests. Nothing a client builds should be rejected, and every warning should be one you understand. Here, the only warnings are for the classes a person decides first: missing identities and the unauthorized write.`,
    `Chapter 01, Lab 1, step 4: python clients/python/finding_contract.py --from-drift out/day1.json --now 2026-11-01T12:00:00Z prints 15 lines (twelve ok lines, three warnings for the two missing identities and the unauthorized write) and 12 accepted, 0 rejected, 0 would de-duplicate. The slide shows Erin's Entra lines; her ISC manager line is 40961ae8da0e8cf3: ok attribute_drift P3 priority 3 due 2026-11-02T12:00:00Z system isc_account. The full warning text: (expected: Book 13 routes this class to a person, who sets it). Chapter 04, Lab 1, step 3: Workflow: Drift to ServiceNow - identity attributes changed (mover); kind finding, drift_class attribute_drift, system isc_identity; intended_state {"attributes": {"department": "Finance"}}; contract: accepted: P3, priority 3, key sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department; input fields not sent: none. Both re-run on November 1, 2026 with the same output.`,
    `${WB}, Chapter 01, "Lab 1," step 4; Chapter 04, "Lab 1," step 3.`);
}
check(S2, 2, "Check 2: why does Erin need two keys?",
  "Erin's department and manager both drift in Entra ID. Before Chapter 04's fix, the key was source, subject and class. What went wrong?",
  ["Both findings were rejected with a 400", "The second was folded into the first, and its intended state was never re-read", "Both got P2 instead of P3", "The manager drift was raised twice"],
  `Check two. Erin's department and manager both drift in Entra ID. Before Chapter 4's fix, ServiceNow de-duplicated on source, subject and class only. What went wrong with her two findings? Were they rejected, folded together, given the wrong severity, or raised twice?`,
  `Answer: B. Chapter 04, fix 2: the script de-duplicated on source, subject and class. Two attributes drifting on one user, department and manager, became one record, and the second finding's intended state was lost, so the re-read checked only the first. The key now adds the attribute when the payload names one. Chapter 01's Lab 1, step 4: Erin's two attribute drifts in Entra ID have their own keys; before Chapter 04's fix they shared one, and the second would have been folded into the first.`,
  `${WB}, Chapter 04, "What this chapter adds," fix 2; Chapter 01, "Lab 1," step 4.`);
endModule(S2);

// ================================================================== Scene 3
const S3 = "Scene 3 — Least privilege";
{
  const s = slide(S3, "Who", "Scene 3: who may touch Erin's record");
  scene(s, [
    "The drift client read her with two ISC read scopes, and Graph's User.Read.All plus AuditLog.Read.All: the audit is how the help desk write was seen",
    "A finding writer posted her tasks; only the verifier may close them; an evidence reader may only read",
    "Every call is a row in config/calls.json, and a test fails on any call it doesn't declare",
  ], [
    "# kit_calls.py: what a task needs vs what was granted",
    "def compare(needed, granted):",
    "    needed, granted = set(needed), {g.strip() for g in granted",
    "                                     if g.strip()}",
    "    return {\"missing\": sorted(needed - granted),",
    "            \"extra\": sorted(granted - needed),",
    "            \"ok\": needed == granted}",
  ], "clients/python/kit_calls.py (excerpt)", "Gate 1 — AC-6, AC-2, AC-5, IA-5: ",
  "each identity holds exactly what its calls need, with a certificate; the account that closes is separate from those that raise and read.", { beatPt: 12.5, icon: "FaUserShield" });
  src(s, "Sources: Workbook Ch 02, Ch 03 (calls.json rows, roles, federal requirements); guide, Gate 1 (IA-5, AC-6, SA-9). Kit kit_calls.py.");
  speak(s, "Scene 3: who may touch Erin's record",
    `The answer to check two: the manager drift would have been folded into the department one, and its intended state never re-read. Scene three: who may touch Erin's record. The drift client read her through SailPoint with two read scopes, and through Graph with the user read permission plus the audit permission. That audit read is the only reason the help desk write was seen. In ServiceNow, a finding writer posted her tasks, only the verifier may close them, and an evidence reader may only read. Every call is a row in one file, and a test fails on any call it doesn't declare. Why it matters: Gate 1 records the integration identities, each least-privileged, with certificates rather than secrets, and the closer separated from the raisers. Two details from Chapter 3 are worth carrying. A SailPoint client-credentials token has no user context, and SailPoint warns that most admin APIs often return forbidden with one, so Lab 2 records what actually works in your sandbox. And the scope that creates workflows lives on its own client, used once, then removed.`,
    `Chapter 03's rows: POST /v3/search sp:search:read and GET /v3/accounts idn:accounts:read for drift; GET /v1.0/users User.Read.All and GET /v1.0/auditLogs/directoryAudits AuditLog.Read.All (optional) on Graph. Chapter 02's ServiceNow roles (custom roles, design guidance): x_example_idkit.finding_writer posts findings through the REST_Endpoint ACL; x_example_idkit.verifier reads, patches and attaches, and the business rule accepts a close only from that account; x_example_idkit.evidence_reader reads only. test_kit_calls.py runs the clients against a fake HTTP session and fails on any undeclared call; it also asserts that no task asks ISC or Graph for a write scope. Federal requirements (Chapters 02 and 03): AC-6 and AC-2 at Moderate; AC-5 separation of duties; IA-5 for the Graph certificate. Gate 1 (guide): SA-9 external system services; FedRAMP authorization of each offering (ServiceNow Government Community Cloud, FedRAMP High, JAB; SailPoint ISC, FedRAMP Moderate, agency path); CA-3 information exchange; IA-5 and AC-6; integration identities with two named owners. The guide's four integration identities include the ServiceNow integration user the workflow posts as, the verifier account, and the ISC API client the kit reads with.`,
    `${WB}, Chapter 02, "What this chapter adds," "Federal requirements and evidence"; Chapter 03, "What this chapter adds," "Federal requirements and evidence"; ${GUIDE}, "Prerequisites" (integration identities), Step 1 (Gate 1).`);
}
{
  const s = slide(S3, "How", "Try it: catching a grant that's too wide");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ python clients/python/kit_calls.py --task drift --system isc \\",
    "    --granted \"sp:search:read,idn:accounts:read,idn:accounts:manage\"",
    "  needs: idn:accounts:read, sp:search:read",
    "missing: none",
    "extra:   idn:accounts:manage",
    "Least privilege does not hold: fix the grant.                                   # exit 1",
    "$ python clients/python/kit_calls.py --task reread --system servicenow \\",
    "    --granted \"x_example_idkit.verifier,itil\"",
    "  needs: x_example_idkit.verifier",
    "missing: none",
    "extra:   itil",
    "Least privilege does not hold: fix the grant.                                   # exit 1",
  ], { label: "WORKBOOK CH 03, LAB 1, STEP 3, AND CH 02, LAB 1, STEP 3 (CALL LISTINGS OMITTED)", pt: 10.5 });
  callout(s, "Read", cb + 0.22, 0.95, "FaUserShield", HEX.teal, "Read it: ",
    "a manage scope on the reader means a stolen token could change Erin's accounts; itil on the verifier is broad access to every ITSM table.");
  src(s, "Sources: kit config/calls.json, re-run November 1, 2026. Workbook Ch 03, “Lab 1,” step 3; Ch 02, “Lab 1,” step 3; “Dangers” in both.");
  speak(s, "Try it: catching a grant that's too wide",
    `Try it. Suppose the SailPoint reader that read Erin was also given the accounts manage scope. Compare it with what the drift task needs: nothing missing, the manage scope extra, least privilege doesn't hold, exit with a failure. A stolen token could have changed her accounts. Now the ServiceNow verifier, given the broad I T I L role as well: same result, one extra role, failure. The tool calls no network; the operator types or exports the grant, and the output goes beside the access approval. The same comparison works for Graph. An app registration holding only the user read permission fails a drift run that reads the audit, and passes one that doesn't when you ask for required calls only. In Erin's case, the audit read is required, because it's the only way her help desk write was ever seen.`,
    `Chapter 03, Lab 1, step 3: python clients/python/kit_calls.py --task drift --system isc --granted "sp:search:read,idn:accounts:read,idn:accounts:manage" prints the task's listing (POST /oauth/token; POST /v3/search sp:search:read; GET /v3/accounts idn:accounts:read; needs: idn:accounts:read, sp:search:read), then missing: none, extra: idn:accounts:manage, Least privilege does not hold: fix the grant., exit 1. Chapter 02, Lab 1, step 3: python clients/python/kit_calls.py --task reread --system servicenow --granted "x_example_idkit.verifier,itil" prints the listing, then missing: none, extra: itil, Least privilege does not hold: fix the grant., exit 1. Both re-run on November 1, 2026 with the same output. Dangers: a manage scope on a read client (a stolen token can change accounts); itil or admin granted "to make it work" (broad access to every ITSM table).`,
    `${WB}, Chapter 03, "Lab 1," step 3; Chapter 02, "Lab 1," step 3; "Dangers" in both chapters.`);
}
check(S3, 3, "Check 3: why not reuse the verifier's account?",
  "Chapter 07's evidence export would work if it ran as the verifier. Why does kit_calls.py refuse that grant?",
  ["The verifier can't read the finding table", "The export would also be able to close findings it is about to hash", "The verifier has no OAuth client", "The Table API forbids two tasks per user"],
  `Check three. Chapter 7's evidence export reads Erin's closed record. It would work perfectly well if it ran as the verifier. So why does the comparison refuse that grant?`,
  `Answer: B. Chapter 02, Lab 1, step 4: kit_calls.py --task evidence --system servicenow --granted "x_example_idkit.verifier" gives missing: x_example_idkit.evidence_reader, extra: x_example_idkit.verifier, exit 1. The export would work with the verifier's role; it would also be able to close findings. The evidence reader, new in this workbook, reads but can't change a record it is about to hash. Separation of duties: AC-5 at Moderate.`,
  `${WB}, Chapter 02, "What this chapter adds" (the roles), "Lab 1," step 4; Chapter 07, "Dangers."`);
endModule(S3);

// ================================================================== Scene 4
const S4 = "Scene 4 — One writer";
{
  const s = slide(S4, "What", "Scene 4: why Erin's department keeps drifting");
  scene(s, [
    "Fixing Erin's department by hand won't stick if two systems write it",
    "Book 03 makes Entra inbound provisioning the one writer; SailPoint can provision Entra ID too",
    "If both update department, each overwrites the other, and the next sync recreates the drift",
    "The check compares the two exported configurations, offline; the kit's exports are fictional, not Erin's tenant",
  ], [
    "# writer_check.py, per attribute both systems write",
    "if pair == (\"update\", \"update\"):",
    "    severity = \"Finding\"   # drift never settles",
    "elif \"update\" in pair:",
    "    severity = \"Warn\"      # two sources for its first value",
    "else:",
    "    severity = \"Info\"      # both set it only at creation",
  ], "clients/python/writer_check.py (excerpt, simplified)", "Gate 2 — AC-2, CM-6, CM-3: ",
  "one writer per attribute keeps account changes traceable to the source; each Finding gets a data architect's decision. Design guidance: pick one writer, not both.");
  src(s, "Sources: Workbook Ch 08, “Why this is a build,” “What this chapter adds,” requirements; guide, Gate 2 (gap 4; AC-2). Kit writer_check.py.");
  speak(s, "Scene 4: why Erin's department keeps drifting",
    `The answer to check three: running as the verifier, the export could also close the findings it's about to hash, which breaks separation of duties. Scene four asks why Erin's department drifts at all. Book 3 makes Entra inbound provisioning the one writer into the directory, but SailPoint can provision Entra ID too. If both update department, each overwrites the other, and fixing her record by hand just schedules the next drift. The writer check compares the two provisioning configurations, offline. The kit's exports are fictional files, not Erin's tenant, but they show exactly the overlap that would keep her drift coming back. Why it matters: Gate 2 decides one writer per attribute, so every account change traces to its source. This is the one item from the kit's planned second pass that can be built today, because both configurations export as JSON through documented reads. The other planned items, one approver per authority class, change records on demand, the SailPoint half of the evidence and email intake, all need a live instance or product internals.`,
    `Chapter 08: the fourth gap in the example guide. SailPoint reads the HR system and can provision the directory, while Book 03 makes Entra inbound provisioning the one writer. The guide's design guidance: pick one writer per attribute; either Entra inbound provisioning stays the door and SailPoint governs entitlements, or SailPoint becomes the provisioning service and takes on Book 03's middleware duties. Not both. If both write department, the reconciliation in Chapter 06 reports drift that the next sync recreates. writer_check.py reads the inbound job's synchronization schema (targetAttributeName and flowType: Always updates on every change, ObjectAddOnly only at creation) and the ISC source's provisioning policies (UPDATE for attribute sync, CREATE at account creation). The code excerpt is simplified from the kit's check function (which also records the reason text). The writer exports in tests/fixtures/writers/ are fictional and separate from Erin's fixtures; the story uses them to show the overlap. Gate 2 (guide): AC-5, CM-3, AC-2 (one writer per attribute keeps account changes traceable to the source), Book 13's L4 acceptance; the automated check is writer_check.py. Chapter 08: CM-6 and CM-3 (each Entra ID user attribute has one authoritative writer, or the overlap is named and assigned); CA-7 and SI-4; CM-4.`,
    `${WB}, Chapter 08, "Why this is a build, and why now," "What this chapter adds," "Federal requirements and evidence"; ${GUIDE}, Step 2 (Gate 2).`);
}
{
  const s = slide(S4, "How", "Try it: two writers on department");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ python clients/python/writer_check.py --entra-schema tests/fixtures/writers/entra_inbound_schema.json \\",
    "    --isc-policies tests/fixtures/writers/isc_entra_source_policies.json",
    "Entra inbound writes 8 attributes; SailPoint writes 7; 1 Finding, 1 Warn, 2 Info",
    "  Finding department         Entra update SailPoint update both update it: each overwrites the other, …",
    "  Warn    displayName        Entra update SailPoint create one updates it and the other sets it at creation: …",
    "  Info    mailNickname       Entra create SailPoint create both set it only at creation",
    "  Info    userPrincipalName  Entra create SailPoint create both set it only at creation",
    "$ python clients/python/writer_check.py … --alias title=jobTitle",
    "Entra inbound writes 8 attributes; SailPoint writes 7; 2 Finding, 1 Warn, 2 Info",
  ], { label: "WORKBOOK CH 08, LAB 1, STEPS 2–3 (LONG REASONS TRIMMED)", pt: 10.5 });
  callout(s, "Read", cb + 0.22, 0.95, "FaScaleBalanced", HEX.teal, "Read it: ",
    "exit 1 on any Finding. Without the alias, the second writer on jobTitle was invisible: the alias list is part of what a reviewer checks.");
  src(s, "Sources: kit fixtures (fictional writer exports), re-run November 1, 2026. Workbook Ch 08, “Lab 1,” steps 2–3.");
  speak(s, "Try it: two writers on department",
    `Try it. Run the writer check on the two fictional exports. Entra inbound provisioning writes eight attributes, SailPoint writes seven, and department is a Finding: both update it, so each overwrites the other and the drift never settles. That's Erin's problem in one line. Display name is a warning, and two attributes are only informational. Now map SailPoint's title field to Entra's job title and run it again: a second Finding appears. Without the alias, that second writer was invisible. And notice the guard on the directory name. If you tell the check the wrong name for the Entra directory, it refuses and exits with an error, rather than reporting no overlap, because a wrong name would make every attribute look unwritten.`,
    `Chapter 08, Lab 1, step 2: python clients/python/writer_check.py --entra-schema tests/fixtures/writers/entra_inbound_schema.json --isc-policies tests/fixtures/writers/isc_entra_source_policies.json prints Entra inbound writes 8 attributes; SailPoint writes 7; 1 Finding, 1 Warn, 2 Info; Finding department (both update it: each overwrites the other, so drift never settles); Warn displayName (one updates it and the other sets it at creation: two sources for its first value); Info mailNickname and userPrincipalName (both set it only at creation). Exit 1. Step 3, with --alias title=jobTitle: 2 Finding, 1 Warn, 2 Info, with Finding jobTitle added. Re-run on November 1, 2026 with the same output. Lab 2 exports the real configurations; each Finding goes to the data architect, and Book 03's default keeps Entra inbound provisioning as the writer.`,
    `${WB}, Chapter 08, "Lab 1: fixtures, no tenant," steps 2–3; "Lab 2," step 4.`);
}
check(S4, 4, "Check 4: Finding, Warn or Info?",
  "Entra inbound provisioning updates displayName on every change; SailPoint sets it only when it creates the account. What does the check report?",
  ["Finding: each overwrites the other", "Warn: two sources for its first value", "Info: both set it only at creation", "Nothing: one is only a create"],
  `Check four. Entra inbound provisioning updates display name on every change, and SailPoint sets it only when it creates the account. What does the writer check report: a Finding, a warning, info, or nothing at all?`,
  `Answer: B, Warn. writer_check.py: Finding when both update it; Warn when one updates it and the other sets it at creation (two sources for its first value); Info when both set it only at creation. Lab 1, step 2 shows exactly this for displayName: Entra update, SailPoint create, Warn. Checklist: every Warn is understood, and the create-time value has one source.`,
  `${WB}, Chapter 08, "What this chapter adds," "Lab 1," step 2, "Checklist."`);
endModule(S4);

// ================================================================== Scene 5
const S5 = "Scene 5 — Actuation";
{
  const s = slide(S5, "What", "Scene 5: the fix, on the native surface");
  const pb = panel(s, "Beat", 0.6, 1.45, 6.0, null, HEX.amber, HEX.amberTint, "THE STORY BEAT (AS THE GUIDE DESCRIBES IT)", null, [
    "Her wrong fact: HR corrects it in Core HCM and SailPoint re-aggregates; SailPoint can't write HR-mastered attributes back",
    "Her unauthorized write: SailPoint restores the value, and the writer's access is reviewed",
    "The ticket authorizes a machine: the fix runs through a connector under a service identity",
    "A person's role stops at approval, except in the declared-exception lane",
  ], 13);
  const pr = panel(s, "Kit", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "WHAT THE KIT DOES HERE", null, [
    "Nothing: Pass 1 doesn't actuate, and no code writes to Entra ID, Active Directory or ISC",
    "Gate 5 is configuration of the products themselves; no automated check yet",
    "A successful provisioning action is only a closure signal: it moves matching findings to Awaiting verification",
  ], 13);
  callout(s, "Why", Math.max(pb, pr) + 0.22, 1.05, "FaFileShield", HEX.navy, "Gate 5 — CM-5, AC-3, AC-6, CM-3: ",
    "changes run under scoped service identities, not personal admin accounts; approved access is enforced by the connector; classes that need a change record get one.");
  src(s, "Sources: guide, Step 5 (Gate 5) and “The identity fixes”; Workbook Ch 01, “The loop, and where the kit sits”; Ch 04, the closure signal.");
  speak(s, "Scene 5: the fix, on the native surface",
    `The answer to check four: a warning, because there are two sources for the first value. Scene five is the fix itself, and here the kit stops on purpose. The guide says how it should run. Erin's wrong fact is corrected where HR owns it, in Core HCM, and SailPoint re-aggregates; SailPoint can't write HR-mastered attributes back. Her unauthorized write is restored by SailPoint, and the writer's access is reviewed. The ticket authorizes a machine: a connector, under a service identity, and a person only approves. But the kit's first pass doesn't actuate at all: no code writes to Entra ID, Active Directory or SailPoint. What it does have is the closure signal, which we'll try next. Why it matters: Gate 5 keeps changes off personal admin accounts. The guide also keeps people off standing privilege. Where a person must act, they activate an eligible role just in time, with the ticket number as the justification. And when no machine can reach the surface, the declared-exception lane takes over: a named approver, a recorded session and an end date.`,
    `Guide, Step 5: the ticket authorizes a machine. The fix runs through a connector under a service identity; a person's role stops at approval, except in the declared-exception lane. Provision through SailPoint's connectors for A2 and A3; the ServiceNow Entra spoke for A0 and A1; change records where the class needs them (gap 3, planned for Pass 2); the declared-exception lane for disconnected applications; people off standing privilege (PIM activation with the ticket number as justification). The kit's Pass 1 doesn't actuate anything, so this gate is configuration of the products themselves; Validate (G5): no automated check yet. The identity fixes table (guide, Step 7, inference or design guidance unless cited): a wrong fact in HR is detected by Identity Attributes Changed, routed as a ServiceNow case to HR, and fixed when HR corrects it in Core HCM and SailPoint re-aggregates; SailPoint can't write HR-mastered attributes back (only user name and work email are writable). A write outside the pipeline is detected by Native Change Detection, raised as a ServiceNow finding (provenance class), and SailPoint restores the value; the writer's access is reviewed. Gate 5 requirements: CM-5 access restrictions for change; AC-3 and AC-6; CM-3; AU-14 for declared-exception sessions; NIST SP 800-63B-4 for resets; CA-5 for each declared exception. Chapter 04: Provisioning Action Completed raises a closure signal, never a closure.`,
    `${GUIDE}, Step 5 (Gate 5), Step 7 ("The identity fixes, on these products"); ${WB}, Chapter 01, "The loop, and where the kit sits"; Chapter 04, "What exists."`);
}
{
  const s = slide(S5, "How", "Try it: a provisioning success only signals");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ python clients/python/workflow_payload.py --trigger idn:post-provisioning \\",
    "    --event tests/fixtures/events/provisioning-completed.json",
    "Workflow: Drift to ServiceNow - provisioning completed (closure signal)",
    "kind closure_signal, drift_class -, system -",
    "contract: accepted",
    "input fields not sent: action, requester, sources, warnings",
  ], { label: "WORKBOOK CH 04, LAB 1, STEP 4 (THE KIT'S FIXTURE IS ALICE'S PROVISIONING ACTION, NOT ERIN'S)", pt: 11.5 });
  const tb = table(s, "Signal", cb + 0.25, [3.0, 9.15], ["Kind", "What ServiceNow does with it"], [
    ["finding", "Validates it, sets priority and due date, de-duplicates, stores the intended state"],
    ["closure_signal", "Moves matching findings to Awaiting verification on a successful provisioning signal; never closes one"],
  ], { fontSize: 13, limit: 5.6 });
  line(s, "Point", "Gap 1, in the code: a success response is not closure.", tb + 0.2, 0.4, 14);
  src(s, "Sources: kit fixtures (fictional), re-run November 1, 2026. Workbook Ch 04, “What exists,” “Lab 1,” step 4; Ch 01, Lab 1 step 2 (sample 5).");
  speak(s, "Try it: a provisioning success only signals",
    `Try it. The kit's provisioning fixture is Alice's, not Erin's, but the shape is the same for anyone. Resolve SailPoint's provisioning-completed workflow against it. ServiceNow gets a closure signal, accepted, with four input fields not sent. And here's what a closure signal does: it moves matching findings to awaiting verification. It never closes one. That's the example guide's first gap, written into code: a success response is not closure. The workflow is also why provisioning status can't be trusted on its own. SailPoint's own best-practice page says its Service Desk integration treats the mapped ServiceNow status as completion. The kit turns that around: a status or a success only starts the wait for evidence.`,
    `Chapter 04, Lab 1, step 4: python clients/python/workflow_payload.py --trigger idn:post-provisioning --event tests/fixtures/events/provisioning-completed.json prints Workflow: Drift to ServiceNow - provisioning completed (closure signal); kind closure_signal, drift_class -, system -; contract: accepted; input fields not sent: action, requester, sources, warnings. Re-run on November 1, 2026 with the same output. The fixture is a successful provisioning action for Alice (Chapter 04's three fictional inputs). The Scripted REST script moves matching findings to Awaiting verification on a successful provisioning signal (Chapter 04, What exists); Chapter 01's Lab 1 sample 5: ok closure_signal (moves matches to Awaiting verification; never closes). provisioningResult values beyond SUCCESS aren't verified (Chapter 04, verify list item 5).`,
    `${WB}, Chapter 04, "What exists," "Lab 1," step 4; Chapter 01, "Lab 1," step 2.`);
}
check(S5, 5, "Check 5: SailPoint says SUCCESS. Now what?",
  "SailPoint reports provisioningResult SUCCESS for the fix to Erin's record, and the closure signal reaches ServiceNow. What happens to her finding?",
  ["It closes, with the signal as evidence", "It moves to Awaiting verification, and waits for a re-read", "Nothing: signals are dropped", "It reopens for a second approval"],
  `Check five. SailPoint reports success for the fix to Erin's record, and the closure signal reaches ServiceNow. What happens to her finding? Does it close, wait for a re-read, get ignored, or reopen?`,
  `Answer: B. The closure signal moves matching findings to Awaiting verification; it never closes one (Chapter 04). The business rule (Chapter 05) turns any close into Awaiting verification unless the same update carries a new evidence hash and comes from the verifier account. The guide's Gate 6: no finding or Service Desk ticket closes without a re-read of the target.`,
  `${WB}, Chapter 04, "Dangers" (a closure signal treated as closure); Chapter 05, "What exists"; ${GUIDE}, Step 6.`);
endModule(S5);

// ================================================================== Scene 6
const S6 = "Scene 6 — The re-read";
{
  const s = slide(S6, "What", "Scene 6: the re-read closes Erin's finding");
  scene(s, [
    "Day two: Entra ID now matches HR, so that finding is resolved: a lead, not a closure",
    "SailPoint still says HR until it re-aggregates, so a new finding opens there",
    "Waiting record IDF0001004, Erin's ISC identity: intended department Finance; the read says Finance, so it verifies",
    "A stale read waits for the grace period, then reopens the record; an empty intent is skipped",
  ], [
    "# reread_verification.py, before and after the read",
    "if not fc.is_checkable(intended):",
    "    # skipped: never verify against nothing",
    "observation = reader(record, cfg, http, isc, graph)",
    "if is_stale(record, observation, now, grace):",
    "    # pending: the ISC copy predates the change",
    "diffs = compare(intended, observation)",
  ], "clients/python/reread_verification.py (excerpt, simplified)", "Gate 6 — clause 4, CM-3, CM-4(2), CA-7: ",
  "a finding closes only when a re-read shows the intended state, with the query, time, response hash and checker. No person can close it by setting its state.", { beatPt: 12.5 });
  src(s, "Sources: Workbook Ch 05, “What exists,” “What this chapter adds”; Ch 06, Lab 1 step 4; guide, Gate 6; Book 13 clause 4. Fixture awaiting_records.json.");
  speak(s, "Scene 6: the re-read closes Erin's finding",
    `The answer to check five: her finding moves to awaiting verification, and waits for a re-read. Scene six. On day two, Entra ID matches HR, so the reconciliation calls that finding resolved, which is only a lead. SailPoint still says HR until its next aggregation, so a new finding opens there. When it's re-read, waiting record I D F one thousand four, Erin's SailPoint identity with intended department Finance, reads Finance, and verifies. The client guards both ways. An intended state that names nothing is skipped, never verified. And a read older than the wait is pending through a grace period, then reopens the record. Why it matters: Gate 6, Book 13's fourth clause. The record closes only on a re-read, with its evidence, and no person can close it by setting its state.`,
    `Chapter 06, Lab 1, step 4: drift_compare.py --previous out/day1.json --current out/day2.json: 1 new, 11 persisting, 1 resolved; new 6456e1f12a60e6be attribute_drift isc E1004 department expected 'Finance' observed 'HR'; resolved 1f0e34ebf049f163 attribute_drift entra E1004 department. Resolved findings are leads for the re-read; their records close only on reread_verification.py. Chapter 05's fixtures: IDF0001004, state 18 (Awaiting verification), attribute_drift, u_system isc_identity, subject 2c9180000000000000000000000e1004 (Erin's ISC identity), u_intended_state {"attributes":{"department":"Finance"}}, waiting since 2026-11-01 09:00; the saved observation for that identity reads department Finance. The story places that read after SailPoint's next aggregation; the fixtures are separate files and don't state the aggregation time. The client: is_checkable guard before reading; is_stale: an ISC read older than the time the finding started waiting is pending for a grace period, 24 hours by default (design guidance); compare; close with evidence (query, time, a SHA-256 of the response, the intended state, the checker) and a JSON attachment, or reopen with the differences; writes only with --apply. The business rule: any close goes to Awaiting verification unless the same update carries a new evidence hash and comes from the verifier; a named exception approver may cancel with a note. Gate 6 (guide): CM-3, CM-4(2) verification of controls, CA-7, AU-12. Code excerpt simplified from verify_records.`,
    `${WB}, Chapter 05, "What exists," "What this chapter adds," "Federal requirements and evidence"; Chapter 06, "Lab 1," step 4; ${GUIDE}, Step 6 (Gate 6).`);
}
{
  const s = slide(S6, "How", "Try it: day two, and the re-read");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ python clients/python/drift_compare.py --previous out/day1.json --current out/day2.json",
    "1 new, 11 persisting, 1 resolved",
    "  new       6456e1f12a60e6be attribute_drift isc E1004 department: expected 'Finance', observed 'HR'",
    "  resolved  1f0e34ebf049f163 attribute_drift entra E1004 department: expected 'HR', observed 'Finance'",
    "$ python clients/python/reread_verification.py --records-json tests/fixtures/reread/awaiting_records.json \\",
    "    --observations-json tests/fixtures/reread/observations.json --now 2026-11-01T12:00:00Z",
    "IDF0001003: pending, the ISC copy predates the change; re-run after the next aggregation",
    "[dry-run] IDF0001004: verified; would PATCH state=3",
    "IDF0001005: skipped, the intended state names nothing a re-read can check",
    "1 mismatch, 1 pending, 1 skipped, 3 verified                       # with --now 2026-11-02T12:00:00Z:",
    "[dry-run] IDF0001003: mismatch; would PATCH state=1 (disabled: intended True, observed False)",
  ], { label: "WORKBOOK CH 06, LAB 1, STEP 4, AND CH 05, LAB 1, STEPS 2–3 (EXCERPTS)", pt: 10.5 });
  callout(s, "Read", cb + 0.22, 0.95, "FaArrowsRotate", HEX.teal, "Read it: ",
    "Erin's IDF0001004 verifies. IDF0001003, a terminated user's AD account (Carol's), waits at noon and reopens a day later: the grace period is over.");
  src(s, "Sources: kit fixtures (fictional), re-run November 1, 2026. Workbook Ch 06, “Lab 1,” step 4; Ch 05, “Lab 1,” steps 2–3. Output trimmed.");
  speak(s, "Try it: day two, and the re-read",
    `Try it. Compare day one with day two: one new, eleven persisting, one resolved, and both changes are Erin's. Her Entra finding resolved; a SailPoint finding opened. Then run the re-read client offline over six waiting records at noon on November first. Erin's record verifies, and would be patched to closed. One record is pending: a terminated user's account, read before the finding started waiting. One is skipped for an empty intended state. Run the same records a day later, and that pending one becomes a mismatch, and would reopen. Everything here is a dry run. The offline mode refuses the apply flag, and a subject with no saved read is an error, because a missing read is never a match. On a developer instance, Chapter 5's Lab 2 runs the same client for real, as the verifier.`,
    `Chapter 06, Lab 1, step 4 output as shown, plus the reminder line: Resolved findings are leads for the re-read; their records close only on reread_verification.py. Chapter 05, Lab 1, step 2 (noon, November 1) prints six lines: IDF0001001 verified; IDF0001002 mismatch (accountEnabled: intended False, observed True); IDF0001003 pending; IDF0001004 verified; IDF0001005 skipped; IDF0001006 verified; 1 mismatch, 1 pending, 1 skipped, 3 verified. Step 3 (--now 2026-11-02T12:00:00Z --out-json out/reread.json): IDF0001003 is now mismatch; would PATCH state=1 (disabled: intended True, observed False), and the last line is 2 mismatch, 1 skipped, 3 verified. IDF0001003's account (carol.example's Corp AD account in the fixtures) was last modified at 22:00 on October 31; the finding started waiting at 06:00 on November 1. All re-run on November 1, 2026 with the same output.`,
    `${WB}, Chapter 06, "Lab 1," step 4; Chapter 05, "Lab 1: fixtures, no tenant," steps 2–3.`);
}
check(S6, 6, "Check 6: resolved means closed?",
  "drift_compare.py reports Erin's Entra ID department finding as resolved on day two. Can its ServiceNow record close now?",
  ["Yes: resolved means fixed", "Yes, if a person sets it to Closed Complete", "No: resolved is a lead; only a matching re-read closes it", "No: resolved findings are deleted"],
  `Check six. On day two, the comparison reports Erin's Entra department finding as resolved. Can its ServiceNow record close now, because it's resolved, or because a person sets it closed? Or does something else have to happen first?`,
  `Answer: C. Chapter 06: a resolved finding is printed with a reminder that its record still closes only on Chapter 05's re-read; drift that left the measurement, not the estate, would otherwise be called fixed. Option B fails too: the business rule redirects a person's close to Awaiting verification (Chapter 05).`,
  `${WB}, Chapter 06, "What this chapter adds," "Dangers"; Chapter 05, "What exists."`);
endModule(S6);

// ================================================================== Scene 7
const S7 = "Scene 7 — Evidence";
{
  const s = slide(S7, "What", "Scene 7: Erin's closure becomes evidence");
  scene(s, [
    "The re-read wrote IDF0001004's result with its evidence hash: 360523941c62a1a5…",
    "On an instance, her closed record becomes one line of records.jsonl in Book 13's shape",
    "Approval, executing identity and what ran are null, each with its reason: Pass 1 doesn't actuate",
    "Each line carries the hash of the line before; the manifest holds a hash per file and the chain head",
  ], [
    "# evidence_export.py: the chain",
    "for record in records:",
    "    linked = dict(record)",
    "    linked[\"prev_sha256\"] = head",
    "    linked[\"record_sha256\"] = sha256_hex(linked minus",
    "                                          record_sha256)",
    "    head = linked[\"record_sha256\"]",
  ], "clients/python/evidence_export.py (excerpt, simplified)", "Gate 7 — AU-9, CA-7, CM-3: ",
  "one record per finding, none changed after closure and none removed; windows measured. Tamper-evident, not signed: signing is the program's decision.", { beatPt: 12.5 });
  src(s, "Sources: Workbook Ch 07, “What exists,” “What this chapter adds,” requirements; Ch 05, Lab 1 step 3 (out/reread.json); guide, Gate 7, “Evidence.”");
  speak(s, "Scene 7: Erin's closure becomes evidence",
    `The answer to check six: no. Resolved is a lead; only a matching re-read closes the record. Scene seven. When the re-read verified Erin's record, it wrote the result with an evidence hash. On a real instance, that closed record is read back out and written as one line of an evidence package, in Book 13's shape: origin, owner and clock, the re-read result, and the closure. Approval, the executing identity and what ran are written as null, each with its reason, because the first pass doesn't actuate. The record says what it doesn't hold. Each line carries the hash of the line before it, and a manifest holds a hash of every file. Why it matters: Gate 7. The I S S O gets records nobody could edit or remove without it showing.`,
    `Chapter 05, Lab 1, step 3 writes out/reread.json; re-run on November 1, 2026 (twice, same value), IDF0001004's entry is outcome verified, differences [], evidence_sha256 360523941c62a1a50b45e4dce7986d70fd0d0950fba09e07234b476b08764dfe, applied false. The offline mode is a dry run; Erin's record isn't closed on an instance, so it isn't in the evidence fixtures. Chapter 07's export reads closed and cancelled findings (Table API, under x_example_idkit.evidence_reader) and writes one record per finding, schema book13-evidence-record/identity-finding/v1, with Book 13's seven fields; approval, executing identity and what ran are null with the reason (not recorded in Pass 1: the change or catalog record that authorizes and runs the fix is a later pass). Four checks per record: evidence intact, evidence present, matched, inside the window. The package: records.jsonl (each line with the SHA-256 of the line before), summary.json, manifest.json (a SHA-256 per file and the chain head); --previous-manifest continues last period's chain. Requirements (Chapter 07): CM-3 and CA-7; AU-9 (protection of audit information) at Moderate; AU-10 and CM-5(1) aren't in the Moderate baseline, and signing is a further step. The guide's evidence table maps the record: origin from the trigger, workflow or reconciliation finding ID; owner and clock from the ServiceNow assignment, severity, priority and due date; result from the re-read evidence; closure from the closed record with its evidence hash and attachment. Code excerpt simplified from the kit's chain function.`,
    `${WB}, Chapter 07, "What exists," "What this chapter adds," "Federal requirements and evidence"; Chapter 05, "Lab 1," step 3; ${GUIDE}, Step 7 (Gate 7), "Evidence."`);
}
{
  const s = slide(S7, "How", "Try it: the package, verified and tampered");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ python clients/python/evidence_export.py --records-json tests/fixtures/evidence/closed_records.json \\",
    "    --out-dir out/evidence --period 2026-10 --generated-at 2026-11-01T12:00:00Z",
    "5 evidence records: 4 closed on a re-read, 1 declared exception",
    "Window adherence: 2 of 3 closed inside the window",
    "Chain head 144f5e8494281f83598d2fae5eacac12b9b271c90372c0e503aafc2bd4cf0623; written to out/evidence",
    "$ python clients/python/evidence_export.py --verify-dir out/evidence",
    "Package holds: every file matches the manifest and the chain is unbroken.",
    "$ python -c \"p='out/evidence/records.jsonl'; l=open(p).readlines(); del l[1]; open(p,'w').writelines(l)\"",
    "$ python clients/python/evidence_export.py --verify-dir out/evidence",
    "  records.jsonl: SHA-256 doesn't match the manifest",
    "  line 2 (IDF0000903): prev_sha256 doesn't match the line before",
    "Package does not hold: 2 problem(s).",
  ], { label: "WORKBOOK CH 07, LAB 1, STEPS 2, 3 AND 5 (THE PACKAGE USES FIVE OTHER FICTIONAL RECORDS, NOT ERIN'S)", pt: 10.5 });
  callout(s, "Read", cb + 0.22, 0.9, "FaFileShield", HEX.teal, "Read it: ",
    "the export also names three problem records (late, edited, no evidence) and exits 1 rather than produce a clean-looking package.");
  src(s, "Sources: kit fixtures (fictional), re-run November 1, 2026. Workbook Ch 07, “Lab 1,” steps 2, 3 and 5. Problem lines omitted from step 2.");
  speak(s, "Try it: the package, verified and tampered",
    `Try it. The lab's package uses five other fictional records, but Erin's would be one more line in the same file. Export October: four closed on a re-read, one declared exception, two of three inside their windows, and a chain head. It also names three problem records and exits with a failure, rather than producing a clean-looking package. Now verify it as the I S S O would: the package holds. Then delete one record and verify again. The file's hash no longer matches the manifest, and the next line's link is broken. The package doesn't hold. Next month's export continues the chain from this month's manifest, so a gap between periods shows too. One limit to remember: the package is tamper-evident, not signed. Someone who can rewrite every file and the manifest can rewrite the chain, so keep each manifest where the exporter can't write.`,
    `Chapter 07, Lab 1, step 2 prints, between the window line and the chain head: IDF0000902: closed after its response window; IDF0000903: evidence doesn't hash to u_evidence_hash: edited after closure, or cut short; IDF0000905: closed without re-read evidence. The command exits 1. IDF0000905 was closed with a note that says "done," the closure by assertion Book 13 calls prose, not evidence. Step 3: Package holds: every file matches the manifest and the chain is unbroken. Step 5 (remove one record, verify again): records.jsonl: SHA-256 doesn't match the manifest; line 2 (IDF0000903): prev_sha256 doesn't match the line before; Package does not hold: 2 problem(s). Step 4 (not shown) continues November's chain from October's head, afa59e0f3038613ba36eb4a748da38bb3e76e8427d04038162d08fbdcc167bd1. All re-run on November 1, 2026 with the same output. Delete out when you're done.`,
    `${WB}, Chapter 07, "Lab 1: fixtures, no tenant," steps 2–5.`);
}
check(S7, 7, "Check 7: one record deleted from the period",
  "Someone deletes one closed record from October's records.jsonl. What does --verify-dir report?",
  ["Nothing: the remaining records are all valid", "Only that the file's SHA-256 doesn't match the manifest", "The file's hash mismatch, and a broken chain at the next line", "That the chain head moved to November"],
  `Check seven, the last one. Someone deletes one closed record from October's records file. What does the verifier report: nothing, only a file hash mismatch, the file hash and a broken chain, or a moved chain head?`,
  `Answer: C. Chapter 07, Lab 1, step 5: records.jsonl: SHA-256 doesn't match the manifest; line 2 (IDF0000903): prev_sha256 doesn't match the line before; Package does not hold: 2 problem(s). A record deleted from the period makes the package look complete; the chain breaks and --verify-dir reports it (Dangers). A package rewritten end to end is the case the chain alone doesn't catch: keep each period's manifest where the exporter can't write, and sign it if the program requires (design guidance).`,
  `${WB}, Chapter 07, "Lab 1," step 5; "Dangers."`);
endModule(S7);

// ================================================================== Close
const SC = "Close";
{
  const s = slide(SC, "How", "Your turn: Lab 2, and where to go next");
  const pl = panel(s, "Lab2", 0.6, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "LAB 2: YOUR OWN TEST INSTANCE", null, [
    "A ServiceNow Personal Developer Instance, never production; free to Developer Program members",
    "A SailPoint ISC sandbox tenant: how an agency gets one is between it and SailPoint",
    "A test Entra tenant (worldwide or GCC) with synthetic data, for Chapters 03, 06 and 08",
    "No hosted sandbox: you bring your own. The authors haven't run Lab 2; every one ends with a back-out step",
  ], 13);
  const pr = panel(s, "Next", 6.75, 1.45, 6.0, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "The workbook, Building Ticket-to-Machine: eight chapters, each with Lab 1 and Lab 2",
    "Eight narrated chapter tours, one per chapter",
    "The learning path: seven modules, gate by gate, with knowledge checks",
    "The example guide and its narrated deck: the gate-level series",
  ], 13);
  callout(s, "Erin", Math.max(pl, pr) + 0.22, 1.05, "FaRoute", HEX.navy, "Erin's record, end to end: ",
    "measured, typed and clocked, touched only by least-privileged clients, traced to two writers, fixed at the source, closed on a re-read, and filed as evidence.");
  src(s, "Sources: workbook index (pieces, reading paths); Ch 01–08, Lab 2; learning path, “What you need for the labs”; guide, “Prerequisites” (environments).");
  speak(s, "Your turn: Lab 2, and where to go next",
    `The answer to check seven: the file's hash no longer matches the manifest, and the chain breaks at the next line. That's Erin's record, end to end: measured, typed and clocked, touched only by least-privileged clients, traced to two writers, fixed at the source, closed on a re-read, and filed as evidence. Now it's your turn. Every chapter has a Lab 2 in your own test instance: a ServiceNow Personal Developer Instance, a SailPoint sandbox, and for some chapters a test Entra tenant with synthetic data, never production. There's no hosted sandbox; you bring your own, and every lab ends with a back-out step. Then go deeper: the workbook's eight chapters, a narrated tour of each, the seven-module learning path, and the example guide with its gate-level deck. Thanks for following Erin.`,
    `Lab 2 environments: a ServiceNow Personal Developer Instance, free to Developer Program members, never production (Chapter 01); a SailPoint ISC sandbox tenant; how an agency gets one is between it and SailPoint (Chapter 03, research gaps row 21); a test Entra tenant in the worldwide or GCC cloud with synthetic data for Chapters 03, 06 and 08 (learning path: Modules 3, 4 and 6). The learning path: "The authors haven't run them, and the workbook has no hosted sandbox: you bring your own." Every Lab 2 ends with a back-out step. Where to go next: the workbook (docs/project-plans/developer-workbooks/ticket-to-machine/), with reading paths per role (developers new to the loop: Book 13 Appendix B, then Chapter 01; the ServiceNow side: Chapters 01, 02, 04, 05; the SailPoint side: 03, 04, 06, 08; ISSOs: Chapter 07 and each chapter's federal requirements); the narrated chapter tours (presentations/dw-ttm-01 to dw-ttm-08); the learning path (docs/training/ticket-to-machine/); the example guide (docs/books/guides/ttm-servicenow-sailpoint.md) and its narrated deck, Research_TTM_ServiceNow_SailPoint, about 10 minutes, the guide's gate-level series. Pass 2's other items (one approver per authority class, change records on demand, the SailPoint half of the evidence export, email intake) aren't built yet.`,
    `${WB}, index ("The pieces and how they connect," "Reading paths"); Chapters 01–08, "Lab 2"; learning path, "What you need for the labs"; ${GUIDE}, "Prerequisites," "Watch or download."`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: the workbook and the kit", [
  "Building Ticket-to-Machine (docs/project-plans/developer-workbooks/ticket-to-machine/): index; Chapter 01 The Loop and the Typed Task; 02 The ServiceNow Client and Least Privilege; 03 The SailPoint Client and Its Scopes; 04 Drift to a Typed Task; 05 The Re-read Rule; 06 Drift Reconciliation; 07 Evidence Records for Book 13 and the ISSO; 08 One Writer per Attribute. Each chapter's vendor facts are footnoted there, read November 1, 2026.",
  "examples/servicenow-sailpoint: clients/python (identity_drift.py, finding_contract.py, workflow_payload.py, kit_calls.py, reread_verification.py, drift_compare.py, evidence_export.py, writer_check.py), servicenow (the Scripted REST resource and the business rule), config/calls.json, sailpoint/workflows/drift-to-servicenow.json.",
  "Fixtures (all fictional): tests/fixtures/hr_extract.csv, hr_extract_day2.csv, graph_users.json, isc_identities.json, isc_uncorrelated_accounts.json, entra_audit.json, config.fixtures.json; events/; payloads/; reread/awaiting_records.json and observations.json; evidence/closed_records.json; writers/.",
  "Every Lab 1 command on the slides was re-run on November 1, 2026; the output shown is what it printed, trimmed where the slide says so.",
]);
sourceSlide("Sources: the guide, the book and the path", [
  "Ticket-to-Machine on ServiceNow and SailPoint: An Example Implementation Guide (docs/books/guides/ttm-servicenow-sailpoint.md): “The loop at a glance” and the four gaps; “Prerequisites”; Steps 1–7 (Gates G1–G7) with their federal requirements and evidence; “The identity fixes, on these products”; “Evidence.” Its lane mapping and identity fixes are inference or design guidance as it labels them.",
  "Book 13, Chapter 10 (Ticket-to-Machine) and Appendix B (the coordination loop, the five-clause request chain, severity and tempo, the evidence record).",
  "Learning path: Ticket-to-Machine on ServiceNow and SailPoint (docs/training/ticket-to-machine/): modules, “What you need for the labs.”",
  "Design guidance in this deck: Book 13's tempo (program design), the custom ServiceNow roles, the separate workflow client, the grace period, the hash chain and package, one writer per attribute. The story's ordering of the fixtures into one case is the deck's.",
]);

const titleCount = narration.length;
fs.writeFileSync(path.join(__dirname, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
const spokenWords = narration.reduce((a, e) => a + e.say.split(" ").length, 0);
console.log(`narration.json: ${titleCount} narrated slides, ${spokenWords} spoken words (about ${(spokenWords / 150).toFixed(1)} min at 150 wpm)`);
finish(OUT);
