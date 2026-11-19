// Building Defender XDR — the story deck: one Office macro, followed end to end.
// Teaches the whole developer workbook (docs/project-plans/developer-workbooks/defender-xdr/) through one case from the
// kit's own fictional fixtures (examples/defender-xdr/tests/fixtures): a macro document, invoice.docm, opened on the ring 0
// workstation WKS-R0-01, tries to start encoded PowerShell. The Office child-process ASR rule blocks it there (Ch 04);
// incident 1001, "Encoded PowerShell launched by an Office application on one endpoint", is high and owned (Ch 05); and the
// custom detection contoso-office-encoded-powershell finds its replay (Ch 06). Nine scenes, one per chapter: who may respond
// (Ch 01), whether the device is seen (Ch 02), what prevention does (Ch 03), the rule ring by ring (Ch 04), the incident
// (Ch 05), the detection as code (Ch 06), signals and automation (Ch 07), the month's evidence (Ch 08), and the runbook that
// publishes the rule test first (Ch 09). Each scene has a story slide, a "Try it" slide with the chapter's Lab 1 command and
// its real output, read at build time from data/kit-captures/xdr/NN-k.txt (Ch 09 has no Lab 1: its slide shows the page's
// own fixture-mode output), and, for scenes 1 to 8, a one-question check whose answer opens the next slide's narration.
// Facts come only from the workbook's chapters, their footnotes and the captures. No new external facts. Tying the fixture
// items into one case is the deck's own framing (design guidance), said on the slides.
// Shared helpers: ../attribute-driven-migration-technical-part-1/slides.js, plus the deeper dive's code-panel helper,
// as in ../pn-story-one-retirement-notice/build.js.
// The build also writes narration.json (one {slide, title, say} per narrated slide) for narrate.py.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/xdr-story-one-office-macro/build.js \
//                      presentations/xdr-story-one-office-macro/XDR_Story_One_Office_Macro.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Building Defender XDR — One Office Macro, End to End",
  footer: "Federal Modernization Workbook  ·  Building Defender XDR  ·  One Office macro, end to end",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || path.join(__dirname, "XDR_Story_One_Office_Macro.pptx");
const WB = "Building Defender XDR";
const GUIDE = "Defender XDR Engineering & Operations: An Implementation Guide";
const BANNED = /\bUIAO\b|\bSSA\b|Social Security|Mainframe PIN|\bDISA\b|\bSTIGs?\b|\bsatisf(y|ies)\b|\bmeets\b|GCC[ -]?High|\bGCCH\b|\bDoD\b|Azure Government/i;

// ------------------------------------------------------------------ captures
// cap("01-5", [0, 1, 5]) returns those lines (0-based) of data/kit-captures/xdr/01-5.txt, each cut to max characters
// with "…" (the slide's label says lines are cut). A prompt line longer than max is continued PowerShell-style.
const CAP = path.join(__dirname, "..", "..", "data", "kit-captures", "xdr");
const MAX = 146; // characters that fit a full-width panel at 10.5 pt
const cap = (id, idx, max = MAX) => {
  const all = fs.readFileSync(path.join(CAP, `${id}.txt`), "utf8").replace(/\r/g, "").split("\n");
  const out = [];
  for (const k of idx) {
    const line = all[k];
    if (line === undefined) throw new Error(`capture ${id} has no line ${k}`);
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
    } else out.push(line.slice(0, max - 1).trimEnd() + "…");
  }
  return out;
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

// ------------------------------------------------------------------ code panel (as in the ADM deeper dive)
const CODE_FILL = "F1F5F9";
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 10.5;
  const lh = pt / 72 * 1.2;
  const top = y + 0.1 + (o.label ? 0.27 : 0);
  const h = (top - y) + lines.length * lh + 0.14;
  box(s, name, x, y, w, h, CODE_FILL, HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
  const widest = Math.max(...lines.map((l) => l.length));
  const need = widest * 0.55 * pt / 72 + 0.4;
  if (need > w + 0.01) throw new Error(`${name}: code too wide: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
  const runs = lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1,
    color: /^\s*#/.test(l) ? HEX.teal : HEX.ink, bold: /^PS> |^>>  /.test(l) } }));
  txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
  const bottom = y + h;
  if (bottom > (o.limit || 6.6) + 0.01) throw new Error(`${name}: code overflows: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars`);
  return bottom;
};

// A one-line plain statement (navy, bold), with a fit check.
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};

// ------------------------------------------------------------------ narration and notes
const narration = [];
let slideNo = 0;
const speak = (s, title, say, more, ref) => {
  slideNo += 1;
  const spoken = say.trim().replace(/\s+/g, " ");
  const n = spoken.split(" ").length;
  if (n > 170) throw new Error(`narration over 170 words (${n}) on "${title}"`);
  [spoken, more].forEach((t) => { if (BANNED.test(t)) throw new Error(`neutrality: "${title}"`); });
  if (/\bBooks? \d\d\b/.test(spoken)) throw new Error(`narration names a book by number on "${title}"`);
  narration.push({ slide: slideNo, title, say: spoken });
  notes(s, `${spoken}\n\nDetail: ${more.trim()}`, ref);
};
const slide = (sec, part, title) => { const s = content(sec, title); tag(s, part); return s; };
const src = (s, t) => { if (BANNED.test(t)) throw new Error("neutrality: sources"); sources(s, t); };

// A scene's story slide: the beat (left), what the chapter's kit does about it (right), the requirement (bottom).
const scene = (s, beat, kit, kitLabel, whyLabel, whyText, o = {}) => {
  const lw = o.lw || 6.0;
  const pb = panel(s, "Beat", 0.6, 1.45, lw, null, HEX.amber, HEX.amberTint, "THE STORY BEAT", null, beat, o.pt || 13);
  const pk = panel(s, "Kit", 0.6 + lw + 0.25, 1.45, 12.15 - lw - 0.25, null, HEX.navy, HEX.navyTint, kitLabel, null, kit, o.pt || 13);
  const y = Math.max(pb, pk) + 0.22;
  callout(s, "Why", y, o.whyH || 1.0, o.icon || "FaFileShield", HEX.navy, whyLabel, whyText);
};

// A "Try it" slide: one code panel of real capture lines, and a "Read it" callout.
const tryIt = (sec, title, label, lines, read, sourcesLine, say, more, ref, o = {}) => {
  const s = slide(sec, "How", title);
  const cb = code(s, "Run", 0.6, 1.45, 12.15, lines, { label, pt: o.pt || 10.5 });
  callout(s, "Read", cb + 0.2, o.readH || 0.9, o.icon || "FaListCheck", HEX.teal, "Read it: ", read);
  src(s, sourcesLine);
  speak(s, title, say, more, ref);
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
  line(s, "Answer note", `Check ${n} of 8: the answer opens the next slide, and it's in this slide's notes.`, 5.95, 0.4, 13);
  speak(s, title, say, more, ref);
  return s;
};

// ================================================================== 1 Title
const S0 = "Opening";
{
  const s = titleSlide(S0, "One Office Macro, End to End", "Building Defender XDR — the whole workbook through one macro on one endpoint");
  txt(s, "Session map", [
    { text: "invoice.docm on WKS-R0-01 tries to start encoded PowerShell; incident 1001; rule contoso-office-encoded-powershell", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Who may respond · is the device seen · prevention · the ASR rule · the incident · the detection · signals · evidence · deploy", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Every value shown is from the kit's fictional fixtures; every output is a real Lab 1 capture", options: { color: HEX.ink, breakLine: true } },
    { text: "Workbook review status: approved  ·  Illustrative code, tested against fixtures", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 11.2, h: 1.6, fontSize: 14.5, paraSpaceAfter: 2 });
  speak(s, "One Office Macro, End to End",
    `Welcome to the story deck for Building Defender XDR, a developer workbook in the Federal Modernization Workbook. Instead of nine chapters one at a time, we'll follow one case all the way through. A macro document, an invoice, is opened on a ring 0 workstation, and tries to start encoded PowerShell. An attack surface reduction rule blocks it, an incident opens, and a custom detection finds it. It's fictional: every value comes from the kit's test fixtures, and every output on a slide is what the kit really printed. The workbook has been reviewed and approved, and the code is illustrative, tested against fixtures, not a live tenant.`,
    `The deck teaches the whole developer workbook through one case built from the kit's fixtures (examples/defender-xdr/tests/fixtures, settings.lab.json, the fictional contoso.example tenant): the ASR event AsrOfficeChildProcessBlocked on WKS-R0-01 for C:\\Users\\Public\\Downloads\\invoice.docm (Chapter 04); incident 1001, "Encoded PowerShell launched by an Office application on one endpoint," high, assigned (Chapter 05); and the custom detection contoso-office-encoded-powershell, whose known-bad replay is on wks-r0-01 (Chapter 06). Tying those fixture items into one story is the deck's framing (design guidance). Chapter 09's runbook hasn't been run against a live tenant.`,
    `${WB}, index; ${GUIDE}, "In this guide."`);
}

// ================================================================== 2 The route
{
  const s = slide(S0, "What", "The macro's path through the nine chapters");
  const tb = table(s, "Path", 1.45, [0.6, 4.9, 1.2, 5.45], ["#", "Scene", "Gate", "Try it (Lab 1)"], [
    ["1", "Who may respond to it", "G1", "Ch 01: the access check"],
    ["2", "Is the device even seen?", "G2", "Ch 02: coverage against the inventory"],
    ["3", "Prevention around it", "G3", "Ch 03: device state against the ring's stage"],
    ["4", "The rule that blocked it, ring by ring", "G4", "Ch 04: readiness and ring 1's next value"],
    ["5", "The incident it raised", "G5–G6", "Ch 05: the incident check"],
    ["6", "The detection that finds it, as code", "G7", "Ch 06: validate, test, plan"],
    ["7", "Who it touched, and what may act alone", "G8–G9", "Ch 07: signals and automation"],
    ["8", "The month's evidence", "G10", "Ch 08: the monthly run and the chain"],
    ["9", "The rule goes live, test first", "All", "Ch 09: the page's fixture-mode output"],
  ], { fontSize: 12.5, limit: 5.8 });
  line(s, "Shape", "Each scene: the story beat, what the kit does, the requirement it supports; a Try it; a one-question check.", tb + 0.2, 0.4, 14);
  src(s, "Sources: workbook index, “Chapters”; Chapters 01–09; guide, “The path on one page.”");
  speak(s, "The macro's path through the nine chapters",
    `Here's the route. Scene one asks who may respond to it at all. Scene two, whether the device that opened it is even seen. Scene three, what prevention does around it. Scene four follows the attack surface reduction rule that blocked it, ring by ring. Scene five is the incident it raised. Scene six, the custom detection that finds it, kept as code. Scene seven, who else it touched, and what Defender may do on its own. Scene eight, the month's evidence. And scene nine takes the detection live, test first. Each scene has a story slide, a try-it slide with real output, and, for the first eight, a one-question check.`,
    `The guide's ten gates: G1 service architecture and access, G2 endpoint onboarding, G3 endpoint prevention, G4 Attack Surface Reduction, G5 exposure management, G6 XDR incidents, G7 advanced hunting and detections as code, G8 identity and cloud-app signals, G9 automation, G10 operations and evidence. The workbook's chapters: 01 (G1), 02 (G2), 03 (G3), 04 (G4), 05 (G5, G6), 06 (G7), 07 (G8, G9), 08 (G10), 09 the runbook. The target estate: a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, Windows clients and Windows Server 2019 and later.`,
    `${WB}, index ("Chapters"); ${GUIDE}, "The path on one page."`);
}
endModule(S0);

// ================================================================== Scene 1 (Chapter 01)
const S1 = "Scene 1 — Who may respond";
{
  const s = slide(S1, "What", "Scene 1: before the macro, who may respond to it");
  scene(s, [
    "Whoever triages the incident reads it through Microsoft Graph on graph.microsoft.com, which GCC uses",
    "Responders isolate devices and run live response; that power is a role in Defender's unified RBAC",
    "The program's design: read, responder, detection engineer, and Tier 0, which alone holds Advanced live response",
    "Every role goes to a group PIM governs; emergency access groups hold none",
  ], [
    "Declares every call with its least-privileged permission and Learn page",
    "Refuses a live run whose Graph session is in another environment or tenant",
    "Compares the role export with config/roles.json: ROLE, RESTRICTED, PIM, EMERGENCY",
    "Writes results.csv, permissions.csv and a manifest",
  ], "WHAT THE KIT DOES (CHAPTER 01)", "Gate 1 — AC-6, AC-2, AU-9: ",
  "least privilege for the security tooling, through PIM, on the tenant's own read path. The ISSO keeps the role check and the permissions list.");
  src(s, "Sources: Learn, List incidents; National cloud deployments; unified RBAC custom roles. Ch 01, “The code,” “Federal requirements.”");
  speak(s, "Scene 1: before the macro, who may respond to it",
    `Scene one starts before the macro runs. Whoever triages this incident will read it through Microsoft Graph, on the endpoint GCC uses. And whoever contains it, by isolating the device or running live response, holds that power through a role in Defender's unified role-based access control. The program's design has four roles, and only the Tier 0 role holds advanced live response. Every role goes to a group that Privileged Identity Management governs. So the kit declares every call with its permission, refuses a session in the wrong tenant, and checks the role export against the design. That supports least privilege and account management.`,
    `Chapter 01: Learn's List incidents names SecurityIncident.Read.All; a delegated user also needs Security Reader, Global Reader, Security Operator or Security Administrator. GCC uses the worldwide Graph endpoint. The program's roles (config/roles.json, design guidance): XDR Read, XDR Responder, XDR Detection Engineer, XDR Tier 0 Analyst; Advanced live response only in Tier 0. Checks: CLOUD, READ, ROLE, RESTRICTED, PIM, EMERGENCY. Federal requirements (the guide's G1 row): AC-6, AC-2, AU-9 (4); KSI-IAM-ELP, KSI-MLA-ALA. The role export is a file the operator makes; Learn names no API for unified RBAC roles on the pages read.`,
    `${WB}, Chapter 01, "Start with Microsoft Learn's commands," "The code," "Federal requirements and evidence."`);
}
tryIt(S1, "Try it: the access check finds three faults",
  "WORKBOOK CH 01, LAB 1, STEP 1, IN examples/defender-xdr (PASSING ROLE ROWS AND WRAPPED LINES LEFT OUT)",
  [...cap("01-1", [0, 1, 2, 4, 7, 9, 10, 12, 16, 18])],
  "the detection engineer holds Advanced live response, which only Tier 0 may; and the responder role reaches a standing group.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 01, “Lab 1: fixtures, no tenant,” step 1.",
  `Try it. From the kit's folder, run the access check on the fixtures. The read passes: incidents come back with no permission error. Then three failures. The detection engineer role holds advanced live response, which only Tier 0 may hold, so its role row fails and the restricted row fails. And the responder role, the one that would contain our macro's device, is also assigned to a standing group that Privileged Identity Management doesn't govern. The legacy role is a warning: someone records a decision or removes it.`,
  `Step 1: ./Invoke-XdrAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/access -AsOf 2026-11-16T12:00:00Z. READ Pass, 5 incidents. ROLE Fail XDR Detection Engineer, extra: Advanced live response (Manage). RESTRICTED Fail. PIM Fail XDR Responder, SG-SOC-Standing. ROLE Warn Legacy SOC role. EMERGENCY Pass. Access: 14 checks, 3 failed.`,
  `${WB}, Chapter 01, "Lab 1: fixtures, no tenant," step 1.`);
check(S1, 1, "Check 1: a Graph session in the wrong tenant",
  "An analyst's Graph session is still signed in to another tenant. What does the kit do on a live run?",
  ["Reads that tenant, and the checks pass on what it finds", "Refuses the run: the session isn't in the settings' environment and tenant", "Signs out and signs in again", "Falls back to fixture mode"],
  `Check one. An analyst's Graph session is still signed in to another tenant when the live run starts. Does the kit read that tenant and pass, refuse the run, sign in again on its own, or fall back to the fixtures? The answer opens the next scene.`,
  `Answer: B. Chapter 01: Assert-XdrGraphContext refuses a live run when no Graph session exists, or when it is signed in to another environment or tenant than the settings file names. Danger: a Graph session in the wrong tenant makes every check read another estate, or nothing, and pass.`,
  `${WB}, Chapter 01, "What it leaves to you," "Dangers."`);
endModule(S1);

// ================================================================== Scene 2 (Chapter 02)
const S2 = "Scene 2 — Is it seen";
{
  const s = slide(S2, "What", "Scene 2: is the device that opened it even seen?");
  scene(s, [
    "WKS-R0-01 is a ring 0 workstation in the CM-8 inventory",
    "Defender can only block or raise what its sensor sees: onboarded, sensor Active",
    "Coverage is counted against the inventory, not against Defender's own list",
    "Elsewhere in the estate, five devices are tickets, and one Defender sees isn't in the inventory",
  ], [
    "Runs the guide's DeviceInfo query and its per-device form through runHuntingQuery",
    "Gives every inventory device one of seven statuses; four are tickets",
    "Ships Get-XdrDeviceState.ps1, the read-only device collector the next scenes use",
    "Writes coverage.csv, tickets.csv, by-ring.csv and the protected-coverage share",
  ], "WHAT THE KIT DOES (CHAPTER 02)", "Gate 2 — CM-8, SI-4: ",
  "every in-scope device onboarded with an active sensor, excepted, or a ticket. The ISSO keeps the weekly file 12 months.", { icon: "FaLaptop" });
  src(s, "Sources: Learn, DeviceInfo; device inventory field reference; troubleshoot onboarding. Ch 02, “The code,” “Federal requirements.”");
  speak(s, "Scene 2: is the device that opened it even seen?",
    `The answer to check one: the kit refuses the run. A session in the wrong tenant would read someone else's estate, or nothing, and pass. Scene two asks whether the workstation that opened the invoice is even seen. Defender can only block, or raise an incident, for a device whose sensor is onboarded and active. And coverage is counted against the inventory, not against Defender's own list, because a device that never onboarded would be invisible there. Our workstation is in ring 0, and it's protected. Elsewhere in the estate, five devices are tickets.`,
    `Chapter 02: the guide's query counts DeviceInfo's latest row per Windows device by OnboardingStatus and SensorHealthState. The kit runs it and a per-device form, joins with the CM-8 inventory and the exception register, and classifies each device: Protected, NotActive, NotOnboarded, Excepted, ExceptionExpired, NotInInventory, OutOfScope. Get-XdrDeviceState.ps1 reads one device's Defender state, read-only. Federal requirements (the guide's G2 row): CM-8, SI-4; KSI-PIY-GIV, KSI-MLA-OSM. The exact state strings advanced hunting returns are not yet specified; only listed values count as protected.`,
    `${WB}, Chapter 02, "Start with Microsoft Learn's commands," "The code."`);
}
tryIt(S2, "Try it: coverage, and where WKS-R0-01 stands",
  "WORKBOOK CH 02, LAB 1, STEP 1 (BLANK LINES LEFT OUT)",
  [...cap("02-1", [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 18])],
  "ring 0, where WKS-R0-01 sits, is 2 of 2 protected. Nine of fourteen overall; five tickets, one device not in the inventory.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 02, “Lab 1: fixtures, no tenant,” step 1.",
  `Try it. Run the coverage check. Ring 0, where our workstation sits, is two of two protected. Across the estate, nine of fourteen in-scope devices are protected, sixty-four point three percent. The tickets: a sensor with impaired communications, an inactive sensor, a device that was never onboarded, a server whose exception expired, and a device Defender reports that the inventory doesn't list. Our macro was on a device the sensor sees, so the next scenes can tell its story.`,
  `Step 1: ./Invoke-XdrCoverage.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/coverage -AsOf 2026-11-16T12:00:00Z. ring0 2 of 2 protected, 100 percent. Tickets: WKS-R1-03 ImpairedCommunication, WKS-R2-03 Inactive, WKS-R3-02 Can be onboarded, SRV-LEGACY01 exception expired, WKS-OLD-07 not in the inventory. Coverage: 9 of 14 in-scope devices protected (64.3 percent), 1 excepted, 5 tickets, 1 not in the inventory.`,
  `${WB}, Chapter 02, "Lab 1: fixtures, no tenant," step 1.`);
check(S2, 2, "Check 2: a device Defender sees that the inventory doesn't",
  "Defender reports WKS-OLD-07, onboarded and active, but the CM-8 inventory doesn't list it. What is it?",
  ["Protected, so nothing to do", "Out of scope", "NotInInventory: a ticket, and a CM-8 finding", "Excepted until someone notices"],
  `Check two. Defender reports a device, onboarded and active, that the system component inventory doesn't list. Is it protected and fine, out of scope, a ticket and an inventory finding, or excepted until someone notices?`,
  `Answer: C. Chapter 02: a device Defender reports that the inventory doesn't list is NotInInventory, a ticket, and a CM-8 finding (the guide's G2 evidence: coverage by ring against the CM-8 inventory). Chapter 05 finds the same device again as an exposed device with no owner: two findings, one cause.`,
  `${WB}, Chapter 02, "The coverage check," "Federal requirements and evidence."`);
endModule(S2);

// ================================================================== Scene 3 (Chapter 03)
const S3 = "Scene 3 — Prevention";
{
  const s = slide(S3, "What", "Scene 3: what prevention does around the macro");
  scene(s, [
    "A macro that starts PowerShell often reaches out next: network protection is the layer that blocks the call",
    "Ring 0 is in block for network protection and controlled folder access",
    "Ring 2 is still in audit, so WKS-R2-01 should read 2 (audit): it reads 0 (off)",
    "The same macro on WKS-R2-01 would meet one less layer",
  ], [
    "Compares each device's state with its ring's stage from the prevention plan",
    "Real-time and tamper protection, active mode, network protection, controlled folder access, firewall",
    "On servers, the settings Learn names, and datagram processing on high-UDP roles",
    "Runs the guide's audit and block event query",
  ], "WHAT THE KIT DOES (CHAPTER 03)", "Gate 3 — SI-3, SC-7, CM-6, SI-7: ",
  "prevention enforced on the device at the stage the change record set; drift named by device. The platform owner keeps it.", { icon: "FaShieldHalved" });
  src(s, "Sources: Learn, Configure network protection; Evaluate network protection; Configure CFA; tamper protection. Ch 03, “The code.”");
  speak(s, "Scene 3: what prevention does around the macro",
    `The answer to check two: it's a ticket, and an inventory finding. Scene three looks at the prevention around our macro. A macro that starts PowerShell often reaches out to the network next, and network protection is the layer that blocks that call. Ring 0, where our workstation is, enforces network protection and controlled folder access in block. Ring 2 is still auditing. But one ring 2 workstation reads zero: network protection off. The same macro there would meet one less layer. The kit checks every device's state against its ring's stage, which supports malicious code protection and configuration settings.`,
    `Chapter 03: Learn's network protection modes are 0 off, 1 block, 2 audit; it needs Defender Antivirus in active mode; on Windows Server 2019 and later, AllowNetworkProtectionOnWinServer; on high-UDP roles, AllowDatagramProcessingOnWinServer false. The kit compares each device state file with its ring's stage in the prevention plan (fixtures: rings 0 and 1 block; rings 2, 3 and servers audit). The story's link between the macro and network protection is the deck's framing; the drift itself is the fixture's. Federal requirements (the guide's G3 row): SI-3, SC-7, CM-6, SI-7; KSI-SVC-ACM, KSI-CNA-EIS, KSI-MLA-EVC.`,
    `${WB}, Chapter 03, "Start with Microsoft Learn's commands," "The code."`);
}
tryIt(S3, "Try it: three drifts, and the week's events",
  "WORKBOOK CH 03, LAB 1, STEP 2 (BLANK LINES LEFT OUT)",
  [...cap("03-2", [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14])],
  "WKS-R2-01's network protection is off where its ring audits; WKS-R1-02 has tamper protection off; one tampering attempt this week.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 03, “Lab 1: fixtures, no tenant,” step 2.",
  `Try it. Run the prevention check. Three drifts. Tamper protection off on a ring 1 workstation. Network protection off on the ring 2 workstation, where its ring should be auditing. And datagram processing on at the file server. Below, the week's events: network protection audited and blocked, controlled folder access audited and blocked, and one tampering attempt. A device with tamper protection off and a tampering attempt in the same week is an incident, not a ticket.`,
  `Step 2: ./Invoke-XdrPrevention.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/prevention -AsOf 2026-11-16T12:00:00Z. Drift: WKS-R1-02 TamperProtection True expected, False actual; WKS-R2-01 NetworkProtection 2 (audit) expected, 0 (off) actual; SRV-FILE01 DatagramProcessing (file role) 0 expected, 1 actual. Events, 7 days: ExploitGuardNetworkProtectionAudited 12 on 4 devices; Blocked 3 on 2; ControlledFolderAccessViolationAudited 7 on 3; Blocked 1 on 1; TamperingAttempt 1 on 1. 11 devices, 91 checks.`,
  `${WB}, Chapter 03, "Lab 1: fixtures, no tenant," step 2.`);
check(S3, 3, "Check 3: network protection reads 2 on ring 1",
  "Ring 1's plan says network protection is in block. A ring 1 device reads EnableNetworkProtection 2. What is it?",
  ["Correct: 2 means on", "Drift: 2 is audit, and the ring should block", "Not applicable on workstations", "A server setting"],
  `Check three. Ring 1's plan says network protection is in block. A ring 1 device reads two. Is that correct, because two means on? Is it drift? Not applicable on workstations? Or a server setting?`,
  `Answer: B. Chapter 03: Learn's modes are 0 off, 1 block, 2 audit. A value is only right or wrong against the stage its ring is at: 2 (audit) is correct on ring 2 and drift on ring 1. The kit prints expected and actual as number and name.`,
  `${WB}, Chapter 03, "What it leaves to you," "The checks on each device."`);
endModule(S3);

// ================================================================== Scene 4 (Chapter 04)
const S4 = "Scene 4 — The rule";
{
  const s = slide(S4, "What", "Scene 4: the rule that blocked it, ring by ring");
  scene(s, [
    "Block all Office applications from creating child processes: an ES-005 rule that supports warn",
    "Ring 0 is in block: AsrOfficeChildProcessBlocked, twice on WKS-R0-01, for invoice.docm",
    "Ring 1 is in warn, 6 of 14 days; ring 2 is in audit with one hit nobody decided",
    "The same macro on ring 2 would only be logged",
  ], [
    "Carries the fourteen ES-005 rules with Learn's GUIDs and action types",
    "Readiness per ring and rule from days in stage and open audit hits",
    "Writes Learn's OMA-URI value for each ring, now and next",
    "Checks what each device enforces, which catches the known server issue",
  ], "WHAT THE KIT DOES (CHAPTER 04)", "Gate 4 — CM-7, CM-6, SI-3: ",
  "every rule through audit, warn and block, with its date and its exclusions; the matrix is what the assessor reads.", { icon: "FaShieldHalved" });
  src(s, "Sources: Learn, ASR rules reference; Configure ASR rules and exclusions; ASR rules overview. Ch 04, “The code.” Devices, ES-005.");
  speak(s, "Scene 4: the rule that blocked it, ring by ring",
    `The answer to check three: drift. Two is audit, and ring 1 should block. Scene four is the rule that stopped our macro: block all Office applications from creating child processes. In ring 0 it's in block, and the fixture's events show it blocked twice on our workstation, for the invoice. In ring 1 it's in warn, six of fourteen days. In ring 2 it's still auditing, with one hit nobody has decided about. There, the same macro would only be logged. The kit tracks each rule's stage per ring, says which can move, and writes the exact value for Intune. That supports least functionality.`,
    `Chapter 04: Learn's ASR rules reference gives d4f940ab-401b-4efc-aadc-ad5f3c50688a, Block all Office applications from creating child processes, with action types AsrOfficeChildProcessAudited and AsrOfficeChildProcessBlocked; it supports warn. The fixture events include AsrOfficeChildProcessBlocked on WKS-R0-01 for C:\\Users\\Public\\Downloads\\invoice.docm (2 events) and AsrOfficeChildProcessAudited on WKS-R2-01 (the line-of-business helper, excluded) and WKS-R2-03 (the macro runner, not decided). Plan: ring 0 block; ring 1 warn since November 10 for this rule (6 of 14 days); ring 2 audit since October 10. Readiness rules: design guidance from ES-005 (audit 30 days, warn 14). Federal requirements (the guide's G4 row): CM-7, CM-6, SI-3; KSI-SVC-ACM, KSI-MLA-EVC.`,
    `${WB}, Chapter 04, "Start with Microsoft Learn's commands," "The code."`);
}
tryIt(S4, "Try it: which rings can move, and ring 1's next value",
  "WORKBOOK CH 04, LAB 1, STEPS 2 AND 4 (OTHER ATTENTION ROWS AND THE SERVER CHECK LEFT OUT)",
  [...cap("04-2", [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13]), ...cap("04-4", [0, 1, 4, 5, 8])],
  "the Office child-process rule is held on ring 1 (warn days) and ring 2 (an undecided hit); ring 1's next value keeps it at 6.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 04, “Lab 1: fixtures, no tenant,” steps 2 and 4.",
  `Try it. Run the A S R check. Ring 0 is done: fourteen rules in block. Ring 1 has twelve ready for block; our rule is held, six of fourteen warn days. Ring 2 is ready to leave audit, except our rule, with one audit hit that has no exclusion or decision. Then print the value that moves ring 1. Every rule goes to one, block, but our rule stays at six, warn, because its days aren't up. That's the exact string the change board pastes into the ring 1 policy.`,
  `Step 2: ./Invoke-XdrAsr.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/asr -AsOf 2026-11-16T12:00:00Z. Per ring: ring0 14 in block; ring1 12 ready, 1 held, 1 in block; ring2 12 ready, 1 held, 1 attention; ring3 13 held, 1 attention; servers 12 ready, 1 held. Attention: ring1 Office child process, warn, 6 days, Hold, 6 of 14 warn days; ring2 Office child process, audit, 37 days, 1 open hit, Hold. Step 4: Get-Content out/asr/oma-uri/ring1-next.txt: 56a863a9-...=1, d4f940ab-401b-4efc-aadc-ad5f3c50688a=6, d3e037e1-...=1, 9e6c4e1f-...=1 (other lines left out).`,
  `${WB}, Chapter 04, "Lab 1: fixtures, no tenant," steps 2 and 4.`, { pt: 10 });
check(S4, 4, "Check 4: the LSASS rule planned in warn",
  "Ring 3's plan puts Block credential stealing from the Windows local security authority subsystem in warn. What does the kit say?",
  ["Ready for block after 14 days", "Fail: the rule doesn't support warn; plan audit or block", "Warn is fine on workstations", "Not applicable on ring 3"],
  `Check four. Ring 3's plan puts the LSASS credential-stealing rule in warn. Is it ready for block after fourteen days, a plan error, fine on workstations, or not applicable?`,
  `Answer: B. Chapter 04: Learn says two rules don't support warn, the LSASS rule and the Office code-injection rule; they go from audit straight to block. A plan that puts one in warn is a plan error (Fail): on older Windows a warn rule acts as block, and plan and reality differ.`,
  `${WB}, Chapter 04, "What it leaves to you," "Lab 1," step 2, "Dangers."`);
endModule(S4);

// ================================================================== Scene 5 (Chapter 05)
const S5 = "Scene 5 — The incident";
{
  const s = slide(S5, "What", "Scene 5: the incident it raised, and its clock");
  scene(s, [
    "Incident 1001, “Encoded PowerShell launched by an Office application on one endpoint”: high, two alerts",
    "High means a one-hour triage window and the gated rung: a playbook prepares, a named approver releases",
    "It has an owner: triaged. Incident 1002, also high, has waited 3.5 hours with none",
    "The exposure check records Security Exposure Management as not available in GCC",
  ], [
    "Reads the last 30 days and every active incident, with $expand=alerts",
    "Applies the guide's severity table: Triaged, Untriaged, OverdueTriage, Closed, ClosedWithoutClassification",
    "Reports past-window, not a time to triage Graph can't see",
    "Writes the Exposure Management disposition: Skipped-Not-Applicable, with the interim path",
  ], "WHAT THE KIT DOES (CHAPTER 05)", "Gates 5 and 6 — IR-4, IR-5, IR-6, AU-6, RA-5: ",
  "every incident owned inside its window and closed with a classification; exposure owned, and honestly recorded.", { icon: "FaUserClock" });
  src(s, "Sources: Learn, List incidents; What is Microsoft Security Exposure Management?. Ch 05, “The code.”");
  speak(s, "Scene 5: the incident it raised, and its clock",
    `The answer to check four: a plan error. That rule doesn't support warn. Scene five is the incident. Defender correlates the alerts into incident 1001: encoded PowerShell launched by an Office application on one endpoint. High severity, so the guide's table gives it a one-hour triage window, and the gated rung: a playbook prepares containment, and a named approver releases it. It has an owner, so it's triaged. But another high incident has waited three and a half hours with no one. Meanwhile the exposure check records Security Exposure Management as not available in GCC: a disposition with an interim path, not a failure.`,
    `Chapter 05: Learn's List incidents returns severity, status, assignedTo, classification, determination and createdDateTime; $expand=alerts brings the alerts. The kit reads incidents created in the last 30 days and every active incident, merged by ID, and applies config/severity.json (the guide's G6 table, program design): high 1 hour, L3 gated; medium 24, L2 advise; low and informational 72, L1 observe. Graph doesn't record first assignment, so the kit reports past-window, not a duration. Security Exposure Management is Public Cloud only; for gcc, exposure-management.json says not available, Skipped-Not-Applicable (the ZTA results kit's result), with the guide's interim path. Federal requirements (G5, G6 rows): RA-5, SI-2, CM-8; IR-4, IR-5, IR-6, AU-6.`,
    `${WB}, Chapter 05, "Start with Microsoft Learn's commands," "The code."`);
}
tryIt(S5, "Try it: incident 1001, and the ones that broke the table",
  "WORKBOOK CH 05, LAB 1, STEPS 3 AND 4",
  [...cap("05-3", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11]), ...cap("05-4", [0, 1, 2, 3, 4, 5])],
  "1001 is triaged; 1002 is past its one-hour window; 1005 was closed with its classification still unknown.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 05, “Lab 1: fixtures, no tenant,” steps 3–4.",
  `Try it. Run the incident check. Our incident, 1001, is high, three hours old, with an owner: triaged. Incident 1002, also high, three and a half hours, no owner, against a one-hour window: overdue. Incident 1003 is medium and still inside its twenty-four hours. And 1005 was resolved with its classification still unknown. The findings list is what the security operations lead gets, each with its containment rung. The high one is gated: a named approver releases containment.`,
  `Step 3: ./Invoke-XdrIncidents.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/incidents -AsOf 2026-11-16T12:00:00Z. 1001 high active 3.00 hours, window 1, Triaged; 1002 high 3.50, OverdueTriage; 1003 medium 10.00, Untriaged; 1004 low resolved, truePositive, Closed; 1005 medium resolved, unknown, ClosedWithoutClassification; 1006 informational resolved, informationalExpectedActivity, Closed; 1007 medium inProgress, Triaged. Step 4: findings: 1002 OverdueTriage, L3 gated; 1003 Untriaged, L2 advise; 1005 ClosedWithoutClassification, L2 advise.`,
  `${WB}, Chapter 05, "Lab 1: fixtures, no tenant," steps 3–4.`, { pt: 10 });
check(S5, 5, "Check 5: Exposure Management in a GCC tenant",
  "A Zero Trust Assessment test needs Security Exposure Management. In a GCC tenant, how is it recorded?",
  ["Fail: the control is missing", "Pass: Defender Vulnerability Management covers it", "Skipped-Not-Applicable: unavailable in the tenant's cloud, with the interim path", "Not recorded at all"],
  `Check five. A Zero Trust Assessment test needs Security Exposure Management, in a GCC tenant. Is it a fail, a pass because Vulnerability Management covers it, skipped as not applicable with the interim path, or not recorded at all?`,
  `Answer: C. Chapter 05: Learn says Security Exposure Management is available in Public Cloud only, not in US Government clouds. The kit's disposition is not available, normalized result Skipped-Not-Applicable (one of the seven results the Zero Trust Assessment results kit and the Zero Trust book use), with the guide's interim path: prioritize by ExposureLevel, IsInternetFacing and AssetValue and by Vulnerability Management's recommendations, and use the Tier 0 inventory as the critical-asset list. A disposition, not a failed control.`,
  `${WB}, Chapter 05, "Exposure," "Dangers."`);
endModule(S5);

// ================================================================== Scene 6 (Chapter 06)
const S6 = "Scene 6 — The detection";
{
  const s = slide(S6, "What", "Scene 6: the detection that finds it, kept as code");
  scene(s, [
    "contoso-office-encoded-powershell: Learn's example rule, PowerShell with -enc started by Word, Excel or Outlook",
    "Its file and its test file live in the repository; the replay on wks-r0-01 is its known-bad event",
    "It's deployed disabled; the file now says enabled, after a passing test",
    "A neighbor rule that would isolate devices on its own is held",
  ], [
    "Validates each rule: no automated actions; the query starts from a declared table",
    "Runs the query over a known-bad window and a known-good window",
    "Plans against the deployed rules: create, update only what changed, hold, report orphans",
    "Writes plan.json and its SHA-256 for the approver",
  ], "WHAT THE KIT DOES (CHAPTER 06)", "Gate 7 — SI-4, AU-6, CM-3: ",
  "a rule shown to fire and to stay quiet, deployed only from a reviewed file in a plan with a hash.", { icon: "FaCodeBranch" });
  src(s, "Sources: Learn, Create, List and Update detectionRule; runHuntingQuery. Ch 06, “The code.”");
  speak(s, "Scene 6: the detection that finds it, kept as code",
    `The answer to check five: skipped, not applicable, with the interim path. A disposition, not a failed control. Scene six is the custom detection that finds our macro's behavior: encoded PowerShell started by Word, Excel or Outlook. It's Learn's own example rule, kept as a file in a repository, with a test file beside it. Its known-bad window holds a replay on our workstation; its known-good window is a quiet day. It's deployed disabled, and the file now says enabled, after a passing test. So the plan updates its status, and nothing else. A neighbor rule that would isolate devices on its own is held: containment stays with a person.`,
    `Chapter 06: Learn's Graph v1.0 pages: POST /security/rules/detectionRules to create, GET to list, PATCH to update with only the properties that change; CustomDetection.ReadWrite.All to write, CustomDetection.Read.All to read; the create quota is 10 a minute per application. The rule body is Learn's example shape, with the program's id and status and no automated actions. The test file: tables DeviceProcessEvents; knownBad 2026-11-03 (a ring 0 replay under a change record), minRows 1; knownGood 2026-11-10, maxRows 0. The detectionRules pages have no national-cloud table: GCC availability not yet specified; the interim path is deployVia portal. Federal requirements (the guide's G7 row): SI-4, AU-6 (1) and (3), CM-3; KSI-MLA-OSM, KSI-MLA-LET, KSI-CMT-LMC.`,
    `${WB}, Chapter 06, "Start with Microsoft Learn's commands," "The code."`);
}
tryIt(S6, "Try it: the rule's test, and the plan for it",
  "WORKBOOK CH 06, LAB 1, STEPS 2 AND 3 (OTHER RULES' TEST ROWS LEFT OUT)",
  [...cap("06-2", [0, 6, 7, 12, 13, 16, 17, 18, 19, 20, 21]), ...cap("06-3", [0, 1])],
  "known-bad 1 row, known-good 0: it passes, so its update (status only) is planned; the plan carries a hash.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 06, “Lab 1: fixtures, no tenant,” steps 2–3.",
  `Try it. Validate, test and plan the repository. Our rule finds one row in its known-bad window and none on its quiet day: it passes. The plan creates the dump-tool rule, and updates our rule's status, and only its status. The admin-share rule is held, because it would isolate devices on its own. And a legacy rule that was made in the portal, and lives in no file, is reported as an orphan. Then read the plan's hash. That's what an approver signs.`,
  `Step 2: ./Invoke-XdrDetections.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/detections -AsOf 2026-11-16T12:00:00Z. contoso-office-encoded-powershell knownBad 1 row (>= 1) Pass; knownGood 0 (<= 0) Pass. Plan: contoso-lsass-dump-tool create; contoso-office-encoded-powershell update status; contoso-admin-share-copy held, validation failed: NO-AUTOMATION; contoso-legacy-rdp-rule orphan. Step 3: Get-Content out/detections/plan.sha256: 2bfe49bb…2601 plan.json.`,
  `${WB}, Chapter 06, "Lab 1: fixtures, no tenant," steps 2–3.`, { pt: 10 });
check(S6, 6, "Check 6: a rule with automated isolation",
  "A rule file sets detectionAction.automatedActions to isolate devices. What does the plan do with it?",
  ["Creates it; isolation is faster", "Holds it: containment stays on the response ladder, with a person", "Creates it disabled", "Deletes the deployed copy"],
  `Check six. A rule file sets automated actions to isolate devices. Does the plan create it because it's faster, hold it, create it disabled, or delete the deployed copy?`,
  `Answer: B. Chapter 06: validation's NO-AUTOMATION check fails a rule with automated actions, and the plan holds it: containment stays on the response ladder (Gate 9), and a person decides. Danger: a server or an emergency account contained by a query.`,
  `${WB}, Chapter 06, "What it leaves to you," "Dangers."`);
endModule(S6);

// ================================================================== Scene 7 (Chapter 07)
const S7 = "Scene 7 — Signals and automation";
{
  const s = slide(S7, "What", "Scene 7: who else it touched, and what may act alone");
  scene(s, [
    "The endpoint sees the macro; identity and cloud-app sensors may see the same user",
    "A user with alerts from more than one source in a week is a priority; an emergency account goes first",
    "Ring 0's device group is at Full: Defender may remediate the workstation automatically",
    "A server group never is, and every emergency access account must be excluded",
  ], [
    "Runs the guide's cross-source query as a priority list",
    "Checks the device groups export against the response ladder",
    "Checks attack disruption exclusions: approver, review date, every emergency account",
    "Checks each device's sensor against the Contain User minimum",
  ], "WHAT THE KIT DOES (CHAPTER 07)", "Gates 8 and 9 — SI-4, AU-6, IR-4: ",
  "detection joined across sources, and automation kept inside the boundary the authorizing official set.", { icon: "FaPeopleArrows" });
  src(s, "Sources: Learn, AlertEvidence; attack disruption exclusions; configure attack disruption. Ch 07, “The code.”");
  speak(s, "Scene 7: who else it touched, and what may act alone",
    `The answer to check six: the plan holds it. Containment stays with a person. Scene seven asks two things. Who else did this touch? The guide's cross-source query finds users with alerts from more than one sensor in a week, and an emergency access account goes to the top for the incident response lead. And what may Defender do on its own? Ring 0's device group is at full remediation, so Defender may clean up our workstation automatically. A server group never is. And every emergency access account must be excluded from attack disruption, so an incident can't lock out the people who fix it.`,
    `Chapter 07: the guide's query joins AlertEvidence to AlertInfo and keeps users with alerts from more than one ServiceSource in 7 days. Learn's five device group levels; Microsoft recommends Full; user exclusions are for service and emergency admin accounts; Contain User needs sensor 10.8470 or later. The ladder (config/ladder.json, design guidance): workstation Full, pilot Semi for all folders, server any Semi level. Fixtures: Ring0-Workstations at Full (Pass). Federal requirements (G8, G9 rows): SI-4, AU-6 (3), AC-2 (12); IR-4 (1), SI-4 (7); KSI-MLA-OSM, KSI-MLA-RVL, KSI-INR-RIR. Attack disruption's GCC availability is not yet specified.`,
    `${WB}, Chapter 07, "Start with Microsoft Learn's commands," "The code."`);
}
tryIt(S7, "Try it: the ladder check, and what it finds",
  "WORKBOOK CH 07, LAB 1, STEP 2 (BLANK LINES LEFT OUT)",
  [...cap("07-2", [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 16, 17, 18])],
  "ring 0's group is at Full, as the ladder says; ring 3's isn't; breakglass02 isn't excluded; one sensor is too old for Contain User.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 07, “Lab 1: fixtures, no tenant,” step 2.",
  `Try it. Run the automation check. Ring 0's workstations are at full, as the ladder says, so our workstation's cleanup can run on its own. Ring 3's workstation group is at a semi level with no exception: off the ladder. The scanner subnet's exclusion passed its review date. The second emergency access account isn't excluded, so attack disruption could contain it. And one device runs a sensor too old for Contain User.`,
  `Step 2: ./Invoke-XdrAutomation.ps1 -SettingsPath tests/fixtures/settings.lab.json -OutputPath out/automation -AsOf 2026-11-16T12:00:00Z. Groups: Servers Semi core folders Pass; Ring0-Workstations Full Pass; Ring1-Pilot Semi all folders Pass; Ring2-Workstations Full Pass; Ring3-Workstations Semi core folders Fail. Exclusions failing: IpRange 192.0.2.0/24 review date passed; Identity breakglass02 not in the identity exclusions. Sensor: WKS-R3-01 10.8460.22621.1001, minimum 10.8470. Step 1 (not shown): the signals check puts breakglass01 first.`,
  `${WB}, Chapter 07, "Lab 1: fixtures, no tenant," steps 1–2.`, { pt: 10 });
check(S7, 7, "Check 7: a server group at Full",
  "The Servers device group is set to Full - remediate threats automatically. What does the ladder check say?",
  ["Pass: Full is Microsoft's recommendation", "Fail: the ladder allows servers only a Semi level", "Pass if the server is in ring 0", "Not checked: servers are out of scope"],
  `Check seven. The servers device group is set to full remediation. Does it pass because that's Microsoft's recommendation, fail because the ladder allows servers only a semi level, pass in ring 0, or go unchecked?`,
  `Answer: B. Chapter 07 and the guide's G9: workstation groups to Full, Microsoft's recommended setting; server groups stay at a Semi level, because isolating a server is never autonomous in the program's ladder (risk-based recommended). config/ladder.json allows servers only the three Semi levels.`,
  `${WB}, Chapter 07, "What it leaves to you," "Dangers."`);
endModule(S7);

// ================================================================== Scene 8 (Chapter 08)
const S8 = "Scene 8 — The month's evidence";
{
  const s = slide(S8, "What", "Scene 8: the month's evidence, and the metrics");
  scene(s, [
    "The month's run records every check, with its controls, KSIs and its own result",
    "Our detection counts in detection validity: 1 of 1 enabled with a passing test",
    "Ring 0's two devices are the only ones with every rule in block: enforcement depth 2 of 11",
    "A recorded file changed later is caught, by name",
  ], [
    "Runs every check into its own folder, then the metrics, in one command",
    "Records each folder: integrity result, check result, hashes, the previous record's hash",
    "Computes the guide's metrics; reports mean time to triage as not computed",
    "Checks a stage's go/no-go from the records",
  ], "WHAT THE KIT DOES (CHAPTER 08)", "Gate 10 — CA-7, AU-9, AU-11, IR-3: ",
  "the month's metrics from the month's runs, kept in a chain the ISSO can check alone.", { icon: "FaFingerprint" });
  src(s, "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog; FedRAMP, Key Security Indicators. Ch 08, “The code.”");
  speak(s, "Scene 8: the month's evidence, and the metrics",
    `The answer to check seven: it fails. The ladder allows servers only a semi level. Scene eight is the month. One command runs every check, records each run with its controls, indicators and its own result, and computes the guide's metrics. Our detection counts in detection validity: one of one enabled rule with a passing test. Ring 0's two workstations, including ours, are the only devices with every rule in block, so enforcement depth is two of eleven. And if anyone edits a recorded file afterwards, the check names it.`,
    `Chapter 08: Invoke-XdrMonthlyRun.ps1 runs access, coverage, prevention, ASR, exposure, incidents, detections, signals and automation, then the metrics, and records each folder (Write-XdrEvidence: integrity result, the run's check result, steps with controls and KSIs, the claim, file hashes, the previous record's hash). Metrics (fixtures): protected coverage 64.3 percent (9 of 14); enforcement depth 2 of 11; detection validity 1 of 1; synthetic-event success 4 of 5; mean time to triage and to contain not computed (Graph carries no assignment or containment time). Federal requirements (the guide's G10 row): CA-7, AU-11, IR-3; evidence CA-7, AU-9; KSI-MLA-EVC, KSI-INR-AAR, KSI-MLA-OSM.`,
    `${WB}, Chapter 08, "The code," "The metrics."`);
}
tryIt(S8, "Try it: the month, the metrics, a tampered file",
  "WORKBOOK CH 08, LAB 1, STEPS 1, 2 AND 6 (METRIC ROWS CUT TO THE PANEL'S WIDTH)",
  [...cap("08-1", [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), ...cap("08-2", [7, 9, 13]), ...cap("08-6", [0, 1, 2, 3])],
  "ten records; enforcement depth 2 of 11 and detection validity 1 of 1; one edited line, and both checks name tickets.csv.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 08, “Lab 1: fixtures, no tenant,” steps 1, 2 and 6.",
  `Try it. Run the month. Ten records, and only signals and the metrics pass their own checks; every other run found something, as the earlier scenes showed. Read three metrics: protected coverage sixty-four point three percent, enforcement depth two of eleven, and detection validity one of one. Then append one line to a recorded tickets file, and check again. Both checks fail, and name the file. That's what makes this evidence and not a folder.`,
  `Step 1: ./Invoke-XdrMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -RunRoot out/month -EvidencePath out/evidence -AsOf 2026-11-16T12:00:00Z -ChangeRecord CHG-LAB-0001: records 0001 to 0010; signals and metrics Pass. Step 2: metrics.md (three rows shown, cut). Step 6: Add-Content -Path out/evidence/runs/0002-coverage/tickets.csv -Value '"edited after it was recorded"'; ./Invoke-XdrEvidence.ps1 -EvidencePath out/evidence -Check: SUMS Fail, runs/0002-coverage/tickets.csv changed; CHAIN Fail, doesn't match 0002-coverage.json.`,
  `${WB}, Chapter 08, "Lab 1: fixtures, no tenant," steps 1, 2 and 6.`, { pt: 10 });
check(S8, 8, "Check 8: a run that found something",
  "The coverage run is recorded with intact files, but its own check found five tickets. Does it pass the go/no-go?",
  ["Yes: the files are intact", "No: a step passes only with intact files and a passing check", "Yes, with a warning", "Only in production"],
  `Check eight, the last one. The coverage run is recorded with intact files, but its own check found five tickets. Does it pass the go or no-go because the files are intact, fail, pass with a warning, or pass only in production?`,
  `Answer: B. Chapter 08: each record carries the integrity result and the run's own check result; -Check -Stage passes a step only when a record covers it with intact files and a passing check ("recorded, but the run's own check failed: close its findings and run it again"). Evidence of a finding is still evidence, but it isn't a go.`,
  `${WB}, Chapter 08, "The evidence record," "Dangers."`);
endModule(S8);

// ================================================================== Scene 9 (Chapter 09)
const S9 = "Scene 9 — Test, then production";
{
  const s = slide(S9, "What", "Scene 9: the detection goes live, test first");
  scene(s, [
    "The same commands in test and production; only the settings file changes",
    "Pre-flight: the session's cloud, tenant and scopes, a first read, the output root",
    "Publish the plan as a dry run; the approver signs its hash; then apply with that hash",
    "Smoke test: replay the macro's behavior on ring 0; the custom detection raises its alert",
  ], [
    "Test-XdrPreflight.ps1: PF-01 to PF-07; production needs the test stage's go/no-go",
    "Publish-XdrDetections.ps1: dry run, or -Apply with the approved SHA-256",
    "Invoke-XdrRollback.ps1: disable what the stage published; each ring's ASR value as it was",
    "Invoke-XdrScheduledRun.ps1: the monthly run, recorded with the change record",
  ], "WHAT THE KIT DOES (CHAPTER 09)", "The runbook — CM-3, CA-7, IR-4: ",
  "one gated write, an approved hash, a rollback planned before go, and the evidence that says go. Not run against a live tenant.", { icon: "FaRoute" });
  src(s, "Sources: Ch 09, “What changes, and what doesn't,” “Stage 1,” “The go/no-go” (fixture mode, November 17, 2026).");
  speak(s, "Scene 9: the detection goes live, test first",
    `The answer to check eight: no. A step passes only when its files are intact and its own check passed. Scene nine takes our detection live, test first. The same commands run in test and production; only the settings file changes. The pre-flight checks the session's cloud, tenant and scopes, a first read, and the output root. Publishing runs as a dry run first. The approver signs the plan's hash, and only then is it applied with that hash. The smoke test replays the macro's behavior on a ring 0 device, and the custom detection raises its alert. The rollback is planned before go. None of this has been run against a live tenant.`,
    `Chapter 09: the runbook runs deploy/ scripts: Test-XdrPreflight.ps1 (PF-01 settings and inputs; PF-02 Graph module; PF-03 session cloud and tenant; PF-04 granted scopes; PF-05 first read; PF-06 output root; PF-07 in production, the test stage's go/no-go), Invoke-XdrScheduledRun.ps1, Publish-XdrDetections.ps1 (dry run without -Apply; with -Apply only when -ApprovedSha256 is the plan's SHA-256; refuses another tenant's plan or a portal-path plan; pauses after every 10 creates live), Invoke-XdrRollback.ps1 (disables each rule the stage created or enabled; keeps each ring's ASR value from before the change). Step 4's smoke test: a synthetic event on a ring 0 device under the change record; an alert with detection source Custom detection. Outputs from fixture mode, November 17, 2026.`,
    `${WB}, Chapter 09, "What changes, and what doesn't," "Stage 1," "The go/no-go."`);
}
{
  const s = slide(S9, "How", "Try it: publish the rule, dry run, then the hash");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "PS> ./deploy/Publish-XdrDetections.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json `",
    ">>     -PlanPath out/test/2026-11/detections/plan.json -OutputPath out/test/publish-dry-run `",
    ">>     -EnvironmentFixture deploy/tests/fixtures/environment-test.json -AsOf 2026-11-16T12:00:00Z",
    "Rule                              Action Method Status",
    "contoso-lsass-dump-tool           create POST   planned (dry run)",
    "contoso-office-encoded-powershell update PATCH  planned (dry run)",
    "PS> Get-Content out/test/2026-11/detections/plan.sha256",
    "03c9e3fc5de4b2694f88ebd9166cfc41c0a667f27c3a05ee44320f3e26ca03c8  plan.json",
    "# Go/no-go after the first run: STEP-PRE, STEP-PUBLISH, STEP-RUN Pass; five steps Fail until their findings close",
  ], { label: "WORKBOOK CH 09, STEP 3 AND THE GO/NO-GO, IN FIXTURE MODE (NOVEMBER 17, 2026; AS THE PAGE PRINTS IT)", pt: 10.5 });
  callout(s, "Read", cb + 0.2, 0.95, "FaListCheck", HEX.teal, "Read it: ",
    "our rule's update is a PATCH of status only; nothing is sent until -Apply with this hash; the go/no-go stays no-go until the findings close.");
  src(s, "Sources: kit deploy fixtures (fictional). Workbook Ch 09, “Step 3,” “The go/no-go” (fixture mode, as the page prints it).");
  speak(s, "Try it: publish the rule, dry run, then the hash",
    `Try it, in fixture mode, as the runbook prints it. Publish without apply. The plan would create the dump-tool rule, and patch our rule, its status only. Nothing is sent. Then read the plan's hash, which the approver records in the change record. Only with apply and that exact hash does anything go to the tenant, and a plan that changed after approval is refused. And the go or no-go after the first run: pre-flight, publish and the scheduled run pass, but five steps fail until their findings close. No-go, as it should be.`,
    `Chapter 09, Step 3: ./deploy/Publish-XdrDetections.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -PlanPath out/test/2026-11/detections/plan.json -OutputPath out/test/publish-dry-run -EnvironmentFixture deploy/tests/fixtures/environment-test.json -AsOf 2026-11-16T12:00:00Z; contoso-lsass-dump-tool create POST planned (dry run); contoso-office-encoded-powershell update PATCH planned (dry run). plan.sha256: 03c9e3fc…a03c8 (the test environment's plan; Chapter 06's lab plan has its own hash). Then -Apply -ApprovedSha256 <plan-sha256>. The go/no-go: ./Invoke-XdrEvidence.ps1 -EvidencePath <test-evidence> -Check -Stage test: SUMS Pass 96 files; CHAIN Pass 13 records; STEP-PRE, STEP-PUBLISH, STEP-RUN Pass; STEP-ACCESS, STEP-COVERAGE, STEP-PREVENTION, STEP-ASR, STEP-DETECTIONS Fail. The command lines on the slide are continued with backticks; the page's own commands are the source.`,
    `${WB}, Chapter 09, "Step 3," "The go/no-go."`);
}
endModule(S9);

// ================================================================== Close
const SC = "Close";
{
  const s = slide(SC, "How", "Your turn: Lab 2, and where to go next");
  const pl = panel(s, "Lab2", 0.6, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "LAB 2: YOUR OWN TEST TENANT", null, [
    "Chapters 01 to 08: a test tenant, never production, licensed for Defender for Endpoint Plan 2",
    "A ring 0 test device for the device checks and the replays",
    "Read scopes only, until Chapter 09's approved publish",
    "Every Lab 2 has a back-out step; none was run by the authors",
  ], 13);
  const pr = panel(s, "Next", 6.75, 1.45, 6.0, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "The workbook, Building Defender XDR: eight chapters and the runbook",
    "A narrated tour of each chapter",
    "The learning path, Defender XDR Engineering and Operations: five modules",
    "Defender XDR Engineering & Operations: An Implementation Guide: the ten gates",
  ], 13);
  callout(s, "Case", Math.max(pl, pr) + 0.22, 1.0, "FaRoute", HEX.navy, "invoice.docm, end to end: ",
    "who may respond, a device that's seen, prevention by ring, the rule ring by ring, an owned incident, a tested detection, the ladder, the evidence, test first.");
  src(s, "Sources: workbook index (the pieces); Chapters 01–08, Lab 2; Chapter 09; training path index; guide, “In this guide.”");
  speak(s, "Your turn: Lab 2, and where to go next",
    `That's our macro, end to end. Who may respond, through least privilege. A device the sensor sees, counted against the inventory. Prevention checked by ring. The rule that blocked it, followed ring by ring. An incident owned inside its window. A detection kept as code, shown to fire and to stay quiet. Automation inside the ladder. The month's evidence in a chain. And the detection taken live, test first. Now it's your turn. Each chapter has a second lab in your own test tenant, never production, with a back-out step. Then go deeper: the chapters and their narrated tours, the learning path, and the implementation guide. Thanks for watching.`,
    `Lab 2 environments: a test tenant, never production, licensed for Defender for Endpoint Plan 2 (advanced hunting needs it), with a ring 0 test device enrolled in Intune; read scopes only until Chapter 09's approved publish. Where to go next: the workbook index (docs/project-plans/developer-workbooks/defender-xdr/), the nine chapters, the narrated chapter tours, the learning path Defender XDR Engineering and Operations (docs/training/defender-xdr/, five modules, each with a chapter's Lab 1, a Lab 2 and a knowledge check), and Defender XDR Engineering & Operations: An Implementation Guide (docs/books/guides/defender-xdr-implementation.md). The security operations view is the book Security Operations; the setting values are the book Devices, Chapter 08.`,
    `${WB}, index ("The pieces and how they connect"); Chapters 01–08, "Lab 2"; Chapter 09; learning path, index; ${GUIDE}.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: the workbook and the kit", [
  "Building Defender XDR (docs/project-plans/developer-workbooks/defender-xdr/): index; Chapter 01 Access and the Graph Read Path; 02 Onboarding Coverage and Sensor Health; 03 Prevention Through Audit; 04 Attack Surface Reduction: Audit, Warn, Block; 05 Exposure and Incidents; 06 Detections as Code; 07 Identity Signals and Automation Boundaries; 08 The Monthly Evidence Run; 09 Deploying to Test and Production. Each chapter's facts are footnoted there, read on Microsoft Learn on November 11 and 17, 2026.",
  "examples/defender-xdr: the entry scripts Invoke-XdrAccess, Coverage, Prevention, Asr, Exposure, Incidents, Detections, Signals, Automation, Metrics, MonthlyRun and Evidence, and Get-XdrDeviceState; powershell/DefenderXdr; config/; deploy/.",
  "Fixtures (all fictional): tests/fixtures (settings.lab.json, graph/, devices/, inputs/, rules/); deploy/tests/fixtures. The case ties fixture items into one story (design guidance): the ASR event on WKS-R0-01 for invoice.docm, incident 1001 and the rule contoso-office-encoded-powershell.",
  "Every Try it output for Scenes 1 to 8 is read at build time from data/kit-captures/xdr/ (scripts/kit_captures.py), trimmed where the slide says so; Scene 9 shows Chapter 09's own fixture-mode output, as the page prints it.",
]);
sourceSlide("Sources: Microsoft Learn and the requirements", [
  "Microsoft Learn: List incidents; security: runHuntingQuery; Create, List and Update detectionRule; Use the Microsoft Graph security API (custom detections quotas); National cloud deployments; unified RBAC custom roles and activation; DeviceInfo; device inventory field reference; troubleshoot onboarding.",
  "Microsoft Learn: Configure and Evaluate network protection; Configure controlled folder access; tamper protection; Get-NetFirewallProfile; Configure ASR rules and exclusions; ASR rules overview and reference; Monitor ASR rule activity; What is Microsoft Security Exposure Management?; Defender for Endpoint for US Government customers; AlertEvidence; AlertInfo; attack disruption configuration and exclusions.",
  "NIST SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0; FedRAMP, Key Security Indicators. The kit's config/requirements.json holds the guide's pairs; KSI alignment is the program's mapping (design guidance); the kit's records support the controls, and the assessor decides them.",
  "The device policy library's ES-005 (the book Devices, Chapter 08); the response ladder and the metric set (the book Security Operations, Chapters 11 and 12). Design guidance in this deck: the roles, the rings and stage lengths, the severity table, the ladder, the readiness rules and the story's ordering of fixtures into one case.",
]);

const count = narration.length;
fs.writeFileSync(path.join(__dirname, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
const spokenWords = narration.reduce((a, e) => a + e.say.split(" ").length, 0);
console.log(`narration.json: ${count} narrated slides, ${spokenWords} spoken words (about ${(spokenWords / 150).toFixed(1)} min at 150 wpm)`);
finish(OUT);
