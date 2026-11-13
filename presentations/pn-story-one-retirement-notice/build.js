// Building Provider Notices — the story deck: one retirement notice, followed end to end.
// Teaches the whole developer workbook (docs/project-plans/developer-workbooks/provider-notices/) through one case:
// azure:RT5J-6KL, "Retirement: Basic SKU public IP addresses", a fictional Azure Service Health retirement in the kit's
// own fixtures (examples/provider-notices/tests/fixtures/day1 and day2). Eight scenes, one per chapter: the notice is
// collected and made a record (Ch 01); the same question is asked of Microsoft 365, OCI, AWS and Google Cloud, with
// those providers' own fixture notices (Ch 02–05); the notice is routed to an owner as a Ticket-to-Machine task
// (Ch 06), carried in the weekly digest and the evidence chain (Ch 07), and the runbook deploys the whole loop (Ch 08).
// Each scene has a story slide, a "Try it" slide with the chapter's Lab 1 command and its real output, read at build
// time from data/kit-captures/pn/NN-k.txt (Ch 08 has no Lab 1: its slide shows the page's own fixture dry run), and a
// one-question check whose answer opens the next slide's narration and sits in the check slide's notes.
// Facts come only from the workbook's chapters, their footnotes and the captures. No new external facts.
// Every chapter is status: draft; the title slide and the opening narration say so.
// Shared helpers: ../attribute-driven-migration-technical-part-1/slides.js, plus the deeper dive's code-panel helper.
// The build also writes narration.json (one {slide, title, say} per narrated slide) for narrate.py.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/pn-story-one-retirement-notice/build.js \
//                      presentations/pn-story-one-retirement-notice/PN_Story_One_Retirement_Notice.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Building Provider Notices — One Retirement Notice, End to End",
  footer: "Federal Modernization Workbook  ·  Building Provider Notices  ·  One retirement notice, end to end",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || path.join(__dirname, "PN_Story_One_Retirement_Notice.pptx");
const WB = "Building Provider Notices";
const GUIDE = "Provider Notices: An Implementation Guide";
const BANNED = /\bUIAO\b|\bSSA\b|Social Security|Mainframe PIN|\bDISA\b|\bSTIGs?\b|\bsatisf(y|ies)\b|\bmeets\b/i;

// ------------------------------------------------------------------ captures
// cap("01-5", [0, 1, 5]) returns those lines (0-based) of data/kit-captures/pn/01-5.txt, each cut to max characters
// with "…" (the slide's label says lines are cut). A prompt line longer than max is continued PowerShell-style.
const CAP = path.join(__dirname, "..", "..", "data", "kit-captures", "pn");
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
  const s = titleSlide(S0, "One Retirement Notice, End to End", "Building Provider Notices — the whole workbook through one provider notice");
  box(s, "Draft notice", 0.8, 0.55, 8.6, 0.6, "FFFFFF", HEX.red);
  txt(s, "Draft notice text", [
    { text: "DRAFT WORKBOOK, AWAITING THE OWNER'S REVIEW.  ", options: { bold: true, color: HEX.red } },
    { text: "Every chapter is status: draft.", options: { color: HEX.ink } },
  ], { x: 0.95, y: 0.58, w: 8.3, h: 0.54, fontSize: 13, valign: "middle" });
  txt(s, "Session map", [
    { text: "azure:RT5J-6KL — Retirement: Basic SKU public IP addresses, action required by 2027-09-30", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Collect · one record · four more providers · route to an owner · digest · evidence · deploy", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Every value shown is from the kit's fictional fixtures; every output is a real Lab 1 capture", options: { color: HEX.ink, breakLine: true } },
    { text: "Illustrative code, tested against fixtures  ·  design guidance labeled as such", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.6, h: 1.6, fontSize: 15, paraSpaceAfter: 2 });
  speak(s, "One Retirement Notice, End to End",
    `Welcome to the story deck for Building Provider Notices, a developer workbook in the Federal Modernization Workbook. Instead of eight chapters one at a time, we'll follow one notice all the way through: an Azure Service Health retirement of basic public IP addresses, action required by September 30, 2027. It's fictional: every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. Two notes before we begin. The workbook is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures, not against a live tenant.`,
    `The deck teaches the whole developer workbook through one case: azure:RT5J-6KL, "Retirement: Basic SKU public IP addresses," a HealthAdvisory with EventSubType Retirement in the fixture subscriptions (tests/fixtures/day1 and day2, settings.lab.json, AzureCloud). It appears in Chapter 01's Lab 1 (steps 3 to 5), Chapter 06's Lab 1 (steps 4 and 5, the payload create-azure-RT5J-6KL.json), Chapter 07's digest (Lab 1, step 3) and Chapter 08's fixture dry run (the Azure row). Chapters 02 to 05 cover other providers; the deck asks the same question of each with that provider's own fixture notices, and says so on each slide. Status: every chapter of the workbook is status: draft, awaiting the owner's review; Chapter 08's runbook hasn't been run against a live tenant.`,
    `${WB}, index (status, "The pieces and how they connect"); Chapter 01, "Lab 1"; ${GUIDE}, "In this guide."`);
}

// ================================================================== 2 The route
{
  const s = slide(S0, "What", "The notice's path through the eight chapters");
  const tb = table(s, "Path", 1.45, [0.6, 4.6, 2.3, 1.3, 3.35], ["#", "Scene", "Provider", "Gate", "Try it (Lab 1)"], [
    ["1", "The notice becomes one record", "Azure", "G1", "Ch 01: collect, read the record"],
    ["2", "The same question, asked of Microsoft 365", "Microsoft 365 GCC", "G2", "Ch 02: Graph host, action basis"],
    ["3", "Oracle Cloud says so itself", "OCI", "G3", "Ch 03: realms, records"],
    ["4", "AWS flags some, the kit flags the rest", "AWS", "G4", "Ch 04: action basis"],
    ["5", "Google Cloud can't say it at all", "Google Cloud", "G5", "Ch 05: incidents only"],
    ["6", "The notice gets an owner", "All five", "G6", "Ch 06: route, read the payload"],
    ["7", "The notice in the digest and the evidence", "All five", "G7", "Ch 07: digest, chain, tamper"],
    ["8", "The loop goes live, test first", "All five", "G1–G7", "Ch 08: the page's fixture dry run"],
  ], { fontSize: 12.5, limit: 5.7 });
  line(s, "Shape", "Each scene: the story beat, what the kit does, the requirement it supports; a Try it; a one-question check.", tb + 0.22, 0.4, 14);
  src(s, "Sources: workbook index, “Chapters”; Chapters 01–08; guide, “The path on one page.”");
  speak(s, "The notice's path through the eight chapters",
    `Here's the route. Scene one: Azure Service Health reports the retirement, and the kit makes it one record. Scenes two to five ask the same question of Microsoft 365 in GCC, Oracle Cloud, AWS and Google Cloud: how does each provider say something needs action, and by when? Those scenes use each provider's own fixture notices, because our retirement is Azure's. Scene six gives the notice an owner, as a Ticket-to-Machine task. Scene seven carries it into the weekly digest and the evidence chain. And scene eight deploys the whole loop, test first, then production. Each scene has a story slide, a try-it slide with real output, and a one-question check.`,
    `The guide's seven gates: G1 Azure Service Health, G2 Microsoft 365, G3 Oracle Cloud Infrastructure, G4 AWS Health, G5 Google Cloud, G6 routing, G7 digest and evidence. Chapters 01 to 05 are independent: read the providers the agency uses. Chapter 06 routes what they collect, Chapter 07 reports and records it, and Chapter 08 runs all of it, first in a test environment and then in production. The target estate is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, with workloads in Oracle Cloud Infrastructure and possibly AWS or Google Cloud.`,
    `${WB}, index ("Chapters"); ${GUIDE}, "The path on one page."`);
}
endModule(S0);

// ================================================================== Scene 1 (Chapter 01)
const S1 = "Scene 1 — One record";
{
  const s = slide(S1, "What", "Scene 1: Azure says retirement; the kit makes a record");
  scene(s, [
    "Service Health in Resource Graph lists the event as a HealthAdvisory with EventSubType Retirement",
    "Nothing in Microsoft's event says action is required",
    "Its rows from each subscription in scope are merged by tracking ID into one notice",
    "The kit's record gives it a kind, a due date, the resources it names, and who said it needs action",
  ], [
    "Retirement: action required by the kit's stated rule, due at the advisory's end",
    "actionBasis says rule: or provider:, so nobody mistakes a kit rule for Microsoft's",
    "Fingerprint: SHA-256 of the record without firstSeen; a re-read changes nothing",
    "Reader on each subscription; Service Health Security Reader for security advisories",
  ], "WHAT THE KIT DOES (CHAPTER 01)", "Gate 1 — SA-9, SI-5, CA-7: ",
  "every event in scope read with the least-privileged role, held as one valid record. The ISSO keeps the run folder.");
  src(s, "Sources: Learn, Resource Graph samples for Service Health; Subscription vs tenant events; security advisories. Ch 01, “The code,” “Federal requirements.”");
  speak(s, "Scene 1: Azure says retirement; the kit makes a record",
    `Scene one. Microsoft Learn's Resource Graph samples for Service Health show a retirement as a health advisory with the subtype retirement. That's all Microsoft says. Nothing in the event says action is required. So the kit does three things. It merges the event's rows from every subscription into one notice. It applies a stated rule: a retirement is action required, due at the advisory's end. And it writes who said so, the kit's rule, not Microsoft. Then it fingerprints the record, so reading it again next week changes nothing. Why it matters: monitoring the provider, and receiving its advisories, with evidence the security officer can keep.`,
    `Chapter 01: Learn publishes Resource Graph sample queries for Service Health, including upcoming retirements (health advisories with EventSubType Retirement); an advisory's mitigation time is its end. Reader on a subscription sees its events; security advisories' sensitive fields need Service Health Security Reader. The kit's events query is built from the all-active sample with EventSubType and the time conversion. Rows from several subscriptions are merged by tracking ID. ConvertTo-PnAzureNotice maps HealthAdvisory with EventSubType Retirement to retirement, action required by the kit's rule, due at the advisory's end time. actionBasis says rule: or provider:. fingerprint: SHA-256 of the record without firstSeen and fingerprint. Federal requirements (Chapter 01): every event read, calls and roles recorded, SA-9 c, SI-5 a; each notice one valid record, SI-5, CA-7; a re-read changes no fingerprint, CA-7. KSI-SCR-MIT, KSI-SCR-MON, KSI-MLA-EVC; the mapping is the program's (design guidance).`,
    `${WB}, Chapter 01, "Start with Microsoft's documentation," "The code," "Federal requirements and evidence."`);
}
tryIt(S1, "Try it: collect Azure and read the retirement",
  "WORKBOOK CH 01, LAB 1, STEPS 3–5, IN examples/provider-notices (BLANK LINES AND THE LONG RESOURCE LINE LEFT OUT)",
  [...cap("01-3", [0, 3, 4, 6]), ...cap("01-4", [0, 1, 2, 6]), ...cap("01-5", [0, 1, 2, 3, 4, 5, 7, 8])],
  "five notices from six rows. RT5J-6KL is action required by 2027-09-30, and its actionBasis names the kit's rule.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 01, “Lab 1: fixtures, no tenant,” steps 3–5.",
  `Try it. From the kit's folder, collect Azure from the day-one fixtures. Five notices, all valid against the schema, two needing action. Five from six rows, because one incident's rows from two subscriptions became one notice. Read the records, and there's our retirement: open, action required, due September 30, 2027. Then read it in full. The window runs a year, the due date is the window's end, and the action basis says rule, Azure retirement, due at the advisory end time. The source link is the event on the commercial Resource Manager host, and the fingerprint is the record's hash.`,
  `Step 3: ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider azure -AsOf 2026-11-09T12:00:00Z -OutputPath out/azure: azure AzureCloud 5 notices, 5 open, 2 action; advisory 1, incident 1, maintenance 1, retirement 1, security 1; 5 notices, each valid against schema/notice.schema.json. Five notices from six rows: the incident's rows from two subscriptions are one notice. Step 4: Import-Csv out/azure/notices.csv | Format-Table kind, status, actionRequired, actionRequiredBy, title: retirement open true 2027-09-30T00:00:00Z Retirement: Basic SKU public IP addresses (the slide shows only that row of five). Step 5: noticeId azure:RT5J-6KL; windowStart 2026-09-30T00:00:00Z; windowEnd and actionRequiredBy 2027-09-30T00:00:00Z; actionBasis rule: Azure retirement (HealthAdvisory, EventSubType Retirement); due at the advisory end time; resources: one public IP address in a fictional subscription (left out of the slide); sourceUrl on management.azure.com; fingerprint 02f77668….`,
  `${WB}, Chapter 01, "Lab 1: fixtures, no tenant," steps 3–5.`);
check(S1, 1, "Check 1: who said RT5J-6KL needs action?",
  "The record says RT5J-6KL is action required by September 30, 2027. Who decided that?",
  ["Microsoft, in an action-required field on the event", "The kit's stated rule for Azure retirements", "The ISSO, when reviewing the run", "ServiceNow, when the task was created"],
  `Check one. The record says our retirement is action required by September 30, 2027. Who decided that? Microsoft, in a field on the event? The kit's stated rule? The security officer, reviewing the run? Or ServiceNow, when the task was created? The answer opens the next scene.`,
  `Answer: B. Chapter 01: Learn's Service Health events have no field that says action is required, and a retirement reads like any other advisory. The kit's stated rule makes a retirement action required, due at the advisory's end; the record says the rule in actionBasis ("rule: Azure retirement (HealthAdvisory, EventSubType Retirement); due at the advisory end time"), so nobody mistakes it for Microsoft's. Danger: a kit rule mistaken for Microsoft's, and someone argues with Microsoft about a date Microsoft never set.`,
  `${WB}, Chapter 01, "What it leaves to you," "Lab 1," step 5, "Dangers."`);
endModule(S1);

// ================================================================== Scene 2 (Chapter 02)
const S2 = "Scene 2 — Microsoft 365";
{
  const s = slide(S2, "What", "Scene 2: Microsoft 365 says it in its own field");
  scene(s, [
    "Same question, Microsoft 365: how does the provider say action is needed, and by when?",
    "A Message center post can carry actionRequiredByDateTime: Microsoft's own action date",
    "The fixture's SMTP AUTH Basic authentication retirement, MC900001, has one",
    "So its actionBasis says provider:, where RT5J-6KL's says rule:",
  ], [
    "Graph service communications API: ServiceMessage.Read.All, ServiceHealth.Read.All",
    "GCC reads the worldwide host, graph.microsoft.com; GCC High and DoD have their own",
    "A post tagged Retirement is a retirement; a preventOrFixIssue post without a date is action required by the kit's rule",
    "The live invoker refuses a Graph session in another environment or tenant",
  ], "WHAT THE KIT DOES (CHAPTER 02)", "Gate 2 — SA-9, SI-5: ",
  "Microsoft 365 notices read on the tenant's own Graph host; a wrong cloud would pass on an empty list.", { icon: "FaCloud" });
  src(s, "Sources: Learn, service communications API; List messages and issues; National cloud deployments. Ch 02, “What it leaves to you,” “The code.”");
  speak(s, "Scene 2: Microsoft 365 says it in its own field",
    `The answer to check one: the kit's stated rule. Microsoft's Service Health event has no field for it. Scene two asks the same question of Microsoft 365. Here Microsoft does say it. Microsoft Learn's service communications API gives a Message center post an action-required-by date, Microsoft's own. The fixtures hold a Microsoft 365 retirement too: Basic authentication for SMTP AUTH client submission. It has that date, so its action basis says provider, not rule. The workbook's tenant is GCC, which reads the worldwide Graph host. GCC High and DoD have their own hosts, and the kit refuses a session in the wrong one.`,
    `Chapter 02: Learn's service communications API overview names ServiceMessage.Read.All for Message center posts and ServiceHealth.Read.All for service health; both granted only by an administrator. The API is available on the national clouds. Post categories (preventOrFixIssue, planForChange, stayInformed) and tags: no category says retirement; a post tagged Retirement is a retirement; planForChange and preventOrFixIssue are changes; stayInformed is an advisory. actionRequiredByDateTime is the only field that says Microsoft wants action: the record's action date and actionBasis provider: actionRequiredByDateTime; a preventOrFixIssue post without a date is action required by the kit's rule, labeled rule:. National cloud hosts: a GCC High tenant read on graph.microsoft.com returns nothing, and the gate passes on an empty list; the settings name the cloud (gcc, gcchigh or dod). MC900001 is a fixture post, not the Azure case.`,
    `${WB}, Chapter 02, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S2, "Try it: the Graph host, and who said action is due",
  "WORKBOOK CH 02, LAB 1, STEPS 2, 4 AND 5 (MICROSOFT 365 FIXTURE POSTS, NOT THE AZURE CASE; OTHER ROWS LEFT OUT)",
  [...cap("02-2", [0, 1, 2, 3]), ...cap("02-4", [0, 1, 2, 4, 6]), ...cap("02-5", [0, 1, 2, 4, 6])],
  "MC900001's date is Microsoft's (provider:); MC900003, with no date, is action required by the kit's rule (rule:).",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 02, “Lab 1: fixtures, no tenant,” steps 2, 4 and 5.",
  `Try it. First, the hosts the kit knows: GCC on the worldwide Graph endpoint, GCC High and DoD on their own. Then collect Microsoft 365 from the fixtures and read the records. The SMTP AUTH retirement is action required by January 31, 2027. Then read each notice's action basis. The retirement's says provider, action required by date time: Microsoft's own field. The SharePoint Framework post says rule: a prevent-or-fix post with no date is action required by the kit's rule. Same record shape as our Azure retirement, with the source of each decision written down.`,
  `Step 2: foreach gcc, gcchigh, dod: gcc https://graph.microsoft.com Global; gcchigh https://graph.microsoft.us USGov; dod https://dod-graph.microsoft.us USGovDoD. Step 3 (not shown): six notices from the day-one fixtures. Step 4: m365:MC900001 retirement open true 2027-01-31T08:00:00Z Retirement of Basic authentication for SMTP AUTH client submission; m365:MC900003 change open true (no date) Update SharePoint Framework solutions that use a deprecated library (other rows left out). Step 5: MC900001 provider: actionRequiredByDateTime; MC900003 rule: Message center category preventOrFixIssue.`,
  `${WB}, Chapter 02, "Lab 1: fixtures, no tenant," steps 2, 4 and 5.`);
check(S2, 2, "Check 2: a GCC High tenant on the wrong host",
  "A GCC High tenant's settings say gcc by mistake. What would the collection do if the kit had no host guard?",
  ["Fail with an authorization error", "Read the GCC High posts anyway", "Return nothing, and the gate would pass on an empty list", "Read another tenant's posts"],
  `Check two. A GCC High tenant's settings say G C C by mistake. Without the kit's guard, what would the collection do? Fail loudly, read the posts anyway, return nothing and pass on an empty list, or read someone else's posts?`,
  `Answer: C. Chapter 02, "What it leaves to you": national cloud hosts. A GCC High tenant read on graph.microsoft.com returns nothing, and the gate passes on an empty list. The guard: the settings name the cloud (gcc, gcchigh or dod), and the live invoker refuses a Graph session in another environment or tenant. Lab 1, step 7 shows the reader refusing a next link that isn't on the gcc Graph host.`,
  `${WB}, Chapter 02, "What it leaves to you," "Lab 1," step 7, "Dangers."`);
endModule(S2);

// ================================================================== Scene 3 (Chapter 03)
const S3 = "Scene 3 — Oracle Cloud";
{
  const s = slide(S3, "What", "Scene 3: Oracle Cloud says it in the announcement type");
  scene(s, [
    "Same question, Oracle Cloud Infrastructure, where an agency's HR platform may run",
    "Oracle's announcement type can itself be ACTION_REQUIRED: Oracle's own flag",
    "The fixture's load balancer certificate bundle change is action required by 2026-12-15",
    "No kit rule is needed for OCI: actionBasis says provider:",
  ], [
    "oci announce announcements list, latest in each chain; get for affected resources",
    "One policy statement: read announcements in tenancy",
    "A rescheduled window replaces the original and stays one notice",
    "Realms: oc1 commercial, oc2 US Government (us-langley-1, us-luke-1); oc3 refused, its endpoint not yet specified",
  ], "WHAT THE KIT DOES (CHAPTER 03)", "Gate 3 — SA-9, SI-5, CP-2: ",
  "OCI notices read with Oracle's one policy statement; maintenance naming agency resources asks for a plan review.", { icon: "FaServer" });
  src(s, "Sources: Oracle, OCI CLI announce list and get; Details for Announcements; Oracle US Government Cloud. Ch 03, “What it leaves to you,” “The code.”");
  speak(s, "Scene 3: Oracle Cloud says it in the announcement type",
    `The answer to check two: it would return nothing, and the gate would pass on an empty list. That's why the cloud is always named. Scene three, Oracle Cloud Infrastructure, where an agency's HR platform may well run. Oracle's documentation gives the announcement a type, and that type can itself be action required. That's Oracle's own flag, so no kit rule is needed. The fixtures' example is a change: replace the certificate bundle on load balancers, due December 15, 2026. The kit reads the latest announcement in each chain, so a rescheduled window replaces the first. And it knows Oracle's realms: commercial, and the US Government realm with its own regions.`,
    `Chapter 03: Oracle's CLI reference documents oci announce announcements list, with --compartment-id, --all and --should-show-only-latest-in-chain, and get for one announcement's details, including affected resources. Oracle documents one policy statement for reading them (read announcements in tenancy; inspect is list only). Mapping: announcementType containing CHANGE, or ACTION_REQUIRED: change, ACTION_REQUIRED always (provider); maintenance and advisories: action required if a time is ACTION_REQUIRED_BY (provider). ACTION_REQUIRED as a type is the provider's own flag; no kit rule needed for OCI. A rescheduled window arrives as a new announcement in the chain; the kit keeps only the latest by timeUpdated. Realms: oc1 oraclecloud.com; oc2 oraclegovcloud.com, us-langley-1 and us-luke-1; oc3 refused (the Announcements endpoint there is not yet specified; Oracle's page wasn't readable on November 9, 2026). Maintenance that names the agency's resources is marked so Chapter 06 asks for a contingency plan review: CP-2 e, KSI-RPL-ARP. The OCI notices are fixture notices, not the Azure case.`,
    `${WB}, Chapter 03, "Start with Oracle's documentation," "The code," "Federal requirements and evidence."`);
}
tryIt(S3, "Try it: Oracle's realms and its own flag",
  "WORKBOOK CH 03, LAB 1, STEPS 2 AND 4 (OCI FIXTURE ANNOUNCEMENTS, NOT THE AZURE CASE; LONG LINES CUT WITH …)",
  [...cap("03-2", [0, 1, 2, 3], 130), ...cap("03-4", [0, 1, 2, 3, 4, 5, 6])],
  "chain-example-02 is a change, action required by 2026-12-15, by Oracle's own flag. OC3 is refused, with its reason.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 03, “Lab 1: fixtures, no tenant,” steps 2 and 4.",
  `Try it. First, the realms the kit knows. The commercial realm, and the US Government realm with its two regions. The third realm is refused, with the reason: Oracle's page for its endpoint wasn't readable when the chapter was written, so the kit won't guess. Then read the day-one OCI records. A database maintenance window that names a database system, the certificate bundle change that's action required by December 15, an advisory and a closed incident. Same record, same fields, from a fourth provider's shape.`,
  `Step 2: oc1 : oraclecloud.com; oc2 : oraclegovcloud.com us-langley-1, us-luke-1; oc3 : OCI realm oc3: the Announcements endpoint there is not yet specified (Oracle's page wasn't readable on November 9, 2026). Step 3 (not shown): four notices from the day-one fixtures. Step 4: oci:chain-example-01 maintenance open false, window start 2026-11-22T04:00:00Z, ocid1.dbsystem.oc1.iad.exampledb01; oci:chain-example-02 change open true 2026-12-15T00:00:00Z, ocid1.loadbalancer.oc1.iad.examplelb01; oci:chain-example-03 advisory open false; oci:chain-example-04 incident closed false. Step 5 (not shown): the second week's rescheduled window, 2026-11-29, replaces the first and stays one notice.`,
  `${WB}, Chapter 03, "Lab 1: fixtures, no tenant," steps 2–5.`);
check(S3, 3, "Check 3: a rescheduled maintenance window",
  "Oracle reschedules the database maintenance and publishes a new announcement in the same chain. What does the kit hold?",
  ["Two notices, the old and the new window", "One notice, with the latest window", "One notice, with the original window", "Nothing until the maintenance ends"],
  `Check three. Oracle reschedules that database maintenance, and publishes a new announcement in the same chain. What does the kit hold afterwards: two notices, one with the latest window, one with the original window, or nothing until it's over?`,
  `Answer: B. Chapter 03: a rescheduled window arrives as a new announcement; reading every one doubles the work and keeps the old date. The kit lists with --should-show-only-latest-in-chain and keeps only the latest by timeUpdated in each chain. Lab 1, step 5: in the second week oci:chain-example-01's window is 2026-11-29T04:00:00Z to 08:00:00Z, and it is still one notice. Federal requirements: a rescheduled window replaces the original and stays one notice (SI-5; CA-7).`,
  `${WB}, Chapter 03, "What it leaves to you," "Lab 1," step 5.`);
endModule(S3);

// ================================================================== Scene 4 (Chapter 04)
const S4 = "Scene 4 — AWS";
{
  const s = slide(S4, "What", "Scene 4: AWS flags some retirements, the kit the rest");
  scene(s, [
    "Same question, AWS Health: AWS tells each account which instances it will retire, and when",
    "AWS's actionability field, ACTION_REQUIRED, is the provider's word",
    "A scheduled change naming a retirement or lifecycle event, with no such flag, is action required by the kit's rule, due at its start",
    "The fixtures show both: an EC2 instance retirement and a Lambda lifecycle event",
  ], [
    "Three read actions in a customer managed policy (no AWS read-only managed policy for Health)",
    "Needs a qualifying AWS Support plan; otherwise SubscriptionRequiredException",
    "Event details and affected entities, ten events at a time",
    "Partition guard: aws or aws-us-gov; GovCloud (US) has one endpoint, us-gov-west-1",
  ], "WHAT THE KIT DOES (CHAPTER 04)", "Gate 4 — SA-9, SI-5: ",
  "AWS notices read with exactly three read actions, in the right partition; a missing support plan is a recorded gap.", { icon: "FaServer", pt: 12.5 });
  src(s, "Sources: AWS Health API Reference, Event, DescribeEventDetails; Concepts; GovCloud (US) User Guide, AWS Health. Ch 04, “What it leaves to you.”");
  speak(s, "Scene 4: AWS flags some retirements, the kit the rest",
    `The answer to check three: one notice, with the latest window. Scene four, AWS. AWS's documentation says AWS Health tells each account which of its instances will be retired, and when. AWS has its own actionability field, and when it says action required, that's the provider's word. But a scheduled change that names a retirement or lifecycle event without that flag could look optional, so the kit makes it action required by its own rule, due at its start. Two things to know: the Health API needs a qualifying support plan, and the GovCloud partition has a single endpoint. The kit names the partition, and checks the caller is in it.`,
    `Chapter 04: The AWS Health API reference defines the Event, with newer fields such as actionability and personas. DescribeEventDetails takes one to ten event ARNs. The API needs a qualifying AWS Support plan, and without one answers SubscriptionRequiredException; AWS's pages don't agree on which plans qualify (the concepts page names Business Support+, Enterprise Support or Unified Operations; the API reference's welcome page and the GovCloud (US) page name the older Business and Enterprise plans): confirm the account's plan with AWS Support. AWS publishes no read-only managed policy for Health; the kit's policy holds exactly the three read actions. Mapping: scheduledChange whose event type code names a retirement, lifecycle event, deprecation or end of support is a retirement (the kit's rule); actionability ACTION_REQUIRED makes it action required with actionBasis provider:; without it, action required by the kit's rule, due at its start, labeled rule:. GovCloud (US): a single regional endpoint in us-gov-west-1; the caller's ARN must be in the settings' partition. These are AWS fixture events, not the Azure case.`,
    `${WB}, Chapter 04, "Start with AWS's documentation," "The code."`);
}
tryIt(S4, "Try it: AWS's flag, and the kit's rule",
  "WORKBOOK CH 04, LAB 1, STEPS 2 AND 5 (AWS FIXTURE EVENTS, NOT THE AZURE CASE)",
  [...cap("04-2", [0, 1, 2]), ...cap("04-5", [0, 1, 2, 3, 4, 5, 6, 7])],
  "the EC2 retirement is action required by AWS's own actionability; the Lambda lifecycle event by the kit's stated rule.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 04, “Lab 1: fixtures, no tenant,” steps 2 and 5.",
  `Try it. First, the partitions: commercial AWS in its Health region, and GovCloud in its single West region, each with its own ARN prefix. Then, after collecting the fixtures, read each notice's action basis. The EC2 instance retirement and the security notification say provider, actionability action required: AWS said so. The Lambda planned lifecycle event says rule: a scheduled change whose event type names a retirement, due at its start. Maintenance and the closed incident need no action. It's the same split our Azure retirement showed: who said it is always written down.`,
  `Step 2: aws us-east-1 arn:aws:; aws-us-gov us-gov-west-1 arn:aws-us-gov:. Steps 3 and 4 (not shown): five notices; the EC2 retirement due 2026-12-01 names an instance, the Lambda event due 2027-01-15 names a function. Step 5: EC2: Instance retirement scheduled, provider: actionability ACTION_REQUIRED; IAM: Security notification, provider: actionability ACTION_REQUIRED; RDS: Maintenance scheduled, none; S3: Operational issue, none; LAMBDA: Planned lifecycle event, rule: AWS scheduled change whose event type code names a retirement; due at its start time.`,
  `${WB}, Chapter 04, "Lab 1: fixtures, no tenant," steps 2–5.`);
check(S4, 4, "Check 4: an account without a support plan",
  "An AWS account has no qualifying AWS Support plan. What does the Health API answer, and what does the agency do?",
  ["An empty list; nothing to record", "SubscriptionRequiredException; record the gap with the ISSO", "The public status feed instead", "Events from another account in the organization"],
  `Check four. An AWS account has no qualifying support plan. What does the Health API answer, and what should the agency do? An empty list, the support plan error and a recorded gap, a public status feed, or another account's events?`,
  `Answer: B. Chapter 04: the API needs a qualifying AWS Support plan, and without one it answers SubscriptionRequiredException; a tool's failure surfaces with the tool's own message. Chapter 08's go/no-go criterion 7 records the known gaps with the ISSO, including any AWS account without a support plan, and the pre-flight PF-04 fails for AWS on SubscriptionRequiredException.`,
  `${WB}, Chapter 04, "Start with AWS's documentation," "The code"; Chapter 08, "Pre-flight checks," "Promotion go/no-go criteria."`);
endModule(S4);

// ================================================================== Scene 5 (Chapter 05)
const S5 = "Scene 5 — Google Cloud";
{
  const s = slide(S5, "What", "Scene 5: Google Cloud can't say retirement at all");
  scene(s, [
    "Same question, Google Cloud's Personalized Service Health",
    "Its Event resource has one category, INCIDENT; planned maintenance isn't in it",
    "So a notice like RT5J-6KL can never arrive from Google through this API",
    "The kit doesn't paper over it: the gap goes in the guide, the chapter and the ISSO's record",
  ], [
    "projects.locations.events.list, with roles/servicehealth.viewer on the project",
    "Every Google notice is an incident; products and locations from its impacts",
    "Personalized Service Health isn't in the Assured Workloads FedRAMP or IL packages: a recorded gap (design guidance)",
    "The organization-level call isn't verified, so it's refused unless allowed",
  ], "WHAT THE KIT DOES (CHAPTER 05)", "Gate 5 — SA-9, SI-5: ",
  "Google incidents read with the viewer role; what the API can't carry is written down, not assumed away.", { icon: "FaTriangleExclamation", pt: 12.5 });
  src(s, "Sources: Google Cloud, PSH REST events.list and Event resource; PSH roles; Assured Workloads supported products. Ch 05, “What it leaves to you.”");
  speak(s, "Scene 5: Google Cloud can't say retirement at all",
    `The answer to check four: AWS answers with a subscription required error, and the agency records the gap with the security officer. Scene five, Google Cloud. Google's documentation for Personalized Service Health says its event has one category: incident. Planned maintenance isn't in it. So a notice like our retirement can never arrive from Google through this interface. The kit doesn't pretend otherwise. Every Google notice is an incident, and the gap is written into the guide, the chapter and the security officer's record. One more gap: Google lists no Personalized Service Health in its Assured Workloads FedRAMP and impact-level packages.`,
    `Chapter 05: Google's REST reference documents projects.locations.events.list (permission servicehealth.events.list) and the organization equivalent. The Event resource has a category whose only value is INCIDENT, a state, a detailed category, relevance, impacts (product and location) and updates; planned maintenance isn't in it. The API is enabled once per project; roles/servicehealth.viewer. One category, INCIDENT: maintenance and retirements never arrive here; every Google notice is an incident; the gap is in the guide, this chapter and the ISSO's record, not papered over. Not in the Assured Workloads FedRAMP or IL packages: a workload in one of them has nothing to read; recorded as a gap with the ISSO (design guidance). The organization-level call: the gcloud group organization-events is on the beta reference and its GA flags weren't read, so the kit refuses it unless -AllowUnverified is passed. These are Google fixture events, not the Azure case.`,
    `${WB}, Chapter 05, "Start with Google's documentation," "The code," "Verified facts."`);
}
tryIt(S5, "Try it: two weeks of Google, all incidents",
  "WORKBOOK CH 05, LAB 1, STEPS 2, 3 AND 5 (GOOGLE FIXTURE EVENTS; BLANK LINES LEFT OUT)",
  [...cap("05-2", [0, 1, 3, 4, 6]), ...cap("05-3", [0, 1, 2, 3, 4]), ...cap("05-5", [0, 1, 2, 3])],
  "two weeks of fixtures, four records, every one an incident. Nothing from Google will ever be routed as a retirement.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 05, “Lab 1: fixtures, no tenant,” steps 2, 3 and 5.",
  `Try it. Collect Google from the day-one fixtures: two notices, one open, none needing action, both incidents. Read them: a Cloud SQL connection problem and a Cloud Storage latency problem, each with its product and region. Then group both weeks by kind. Four records, and every one is an incident. That's not a fault in the kit; it's what the interface carries. So when the digest shows Google with no retirements, that's a gap the security officer has already recorded, not good news.`,
  `Step 2: ./Invoke-PnCollect.ps1 ... -Provider google: google global 2 notices, 1 open, 0 action; incident 2; each valid against the schema. Step 3: incident open Cloud SQL connection errors in us-east4, Google Cloud SQL, us-east4; incident closed Cloud Storage latency in us-central1, Cloud Storage, us-central1. Step 4 (not shown): the second week, both closed. Step 5: Import-Csv of both weeks grouped by kind: incident 4. Chapter 08's go/no-go criterion 7 records Google's planned maintenance as a known gap with the ISSO.`,
  `${WB}, Chapter 05, "Lab 1: fixtures, no tenant," steps 2–5.`);
check(S5, 5, "Check 5: no Google retirements in the digest",
  "The weekly digest shows Google Cloud with zero retirements and zero maintenance. What does that tell the ISSO?",
  ["Google has nothing planned for the project", "The Google reader lacks a role", "Nothing: the API carries only incidents, a gap already on record", "The collection failed"],
  `Check five. The weekly digest shows Google Cloud with no retirements and no maintenance. What does that tell the security officer: Google has nothing planned, the reader lacks a role, nothing at all because the interface carries only incidents, or the collection failed?`,
  `Answer: C. Chapter 05: Google's Event resource has one category, INCIDENT, and planned maintenance isn't in it; maintenance and retirements never arrive through this API. The gap is recorded with the ISSO; Chapter 08's go/no-go criterion 7 lists Google's planned maintenance among the known gaps. Chapter 07's digest for the second week shows Google Cloud with 0 open notices.`,
  `${WB}, Chapter 05, "What it leaves to you"; Chapter 08, "Promotion go/no-go criteria"; Chapter 07, "Lab 1," step 3.`);
endModule(S5);

// ================================================================== Scene 6 (Chapter 06)
const S6 = "Scene 6 — An owner";
{
  const s = slide(S6, "Who", "Scene 6: RT5J-6KL gets an owner and a typed task");
  scene(s, [
    "Back to our retirement. The router matches it against the agency's routing file, rules in order, first match wins",
    "It becomes a create payload: P3, Cloud Platform Engineering (example), with a contingency review",
    "Two dates kept apart: the agency's response window (24 hours) and Microsoft's action date (2027-09-30)",
    "The Ticket-to-Machine lane is Human decision, with five clauses, C1 to C5",
  ], [
    "Severities and windows from the finding contract: P1 immediate, P2 one hour, P3 24 hours, P4 72 hours (program design)",
    "State keyed by <provider>:<sourceId> with each fingerprint: unchanged notices write nothing",
    "A provider's close, or a notice no longer listed, asks for the re-read (C4)",
    "A dry run: nothing is sent until -Send and routing.send",
  ], "WHAT THE KIT DOES (CHAPTER 06)", "Gate 6 — SI-5, CM-3, CM-4, CP-2: ",
  "every notice that needs action has an owner and a window; a retirement naming agency resources asks for a plan review.", { icon: "FaUserCheck", pt: 12.5 });
  src(s, "Sources: Ch 06, “Start with the pattern,” “The code”; Ticket-to-Machine reference (the five clauses, severities); NIST OSCAL 5.2.0; FedRAMP KSIs.");
  speak(s, "Scene 6: RT5J-6KL gets an owner and a typed task",
    `The answer to check five: nothing. Google's interface carries only incidents, and that gap is already on record. Scene six brings us back to our retirement. The router matches it against the agency's routing file, rules in order, first match wins. It becomes a typed task: priority three, assigned to the cloud platform engineering group, with a contingency review, because a retirement that names the agency's resources is a plan change. Two dates stay apart: the agency's response window, a day, and Microsoft's action date, next September. The task follows the Ticket-to-Machine pattern from the book Governance, Drift and Evidence: a human-decision lane and five clauses, from origin to the evidence kept.`,
    `Chapter 06: Ticket-to-Machine turns a finding into a typed task with an owner, a lane and a request chain of five clauses: where it came from (C1), who approves (C2), what to do (C3), the re-read check that proves it was done (C4) and the evidence kept (C5). The finding contract sets P1 immediate, P2 one hour, P3 24 hours, P4 72 hours: program design, not a federal requirement; a test reads finding_contract.py and fails if they drift. The kit adds response_due from the severity and action_due from the provider, kept apart; state keyed by <provider>:<sourceId> with each notice's fingerprint; close and absent payloads ask for the re-read; a routing file of ordered rules, first match wins; contingencyReview on a rule marks the payload, and the evidence step adds CP-2. Federal requirements: every notice that needs action has a task with an owner, a severity and a response window (SI-5 c, d; KSI-SCR-MON); change, retirement or maintenance reviewed before it lands (CM-3 b, f; CM-4; KSI-CMT-LMC, KSI-CMT-RVP); retirements and maintenance that name the agency's resources ask for a contingency plan review (CP-2 e; KSI-RPL-ARP). The lab's teams are fictional; the agency's routing is written at work from the template and stays inside its boundary.`,
    `${WB}, Chapter 06, "Start with the pattern," "The code," "Federal requirements and evidence."`);
}
tryIt(S6, "Try it: read RT5J-6KL's payload; a re-run writes nothing",
  "WORKBOOK CH 06, LAB 1, STEPS 5 AND 6 (THE FIRST FORMAT-LIST COMMAND, PRIORITY AND STEP 6'S COMMANDS LEFT OUT)",
  [...cap("06-5", [0, ...range(2, 4), ...range(6, 20)]), ...cap("06-6", [2, 4])],
  "response_due is a day after the run; action_due is Microsoft's 2027-09-30. A second routing of the same collection writes no payload.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 06, “Lab 1: fixtures, no tenant,” steps 5 and 6.",
  `Try it. After routing the day-one collection, read our retirement's payload. Create, de-duplication key azure and the tracking ID, P3 with a twenty-four-hour window, response due the next day, action due September 30, 2027. Cloud Platform Engineering, contingency review true, and the controls and indicators the step supports. Then the five clauses: the human decision lane, the notice as origin, the system owner as approver, plan the change under change control, a re-read check, and the evidence kept. Finally, route the same collection again on a copy of the state. Twenty-two unchanged, zero payloads.`,
  `Step 4 (not shown): 22 new, 12 task, 9 digest only, 1 ignored; 12 create, including create P3 Cloud Platform Engineering (example) azure:RT5J-6KL. Step 5: action create; dedupe_key azure|RT5J-6KL; severity P3; priority 3; response_window_seconds 86400; response_due 2026-11-10T12:00:00Z; action_required True; action_due 2027-09-30T00:00:00Z; assignment_group Cloud Platform Engineering (example); contingency_review True; controls CM-3, CM-4, CP-2, SI-5; ksis KSI-CMT-LMC, KSI-CMT-RVP, KSI-RPL-ARP, KSI-SCR-MON. ticket_to_machine: lane Human decision; c1_origin Provider notice azure:RT5J-6KL, read by the provider notices kit; c2_approver_role System owner; c3_action Plan the change the notice calls for and run it under change control; c4_reread_check The next collection shows the notice closed or no longer listed, or the named resources no longer affected; c5_evidence_kept notices.json and this payload from the run, the change or decision record, and the evidence chain. Step 6: Notices: 0 new, 0 changed, 22 unchanged, 0 no longer listed; Payloads: 0 create, 0 update, 0 close.`,
  `${WB}, Chapter 06, "Lab 1: fixtures, no tenant," steps 4–6.`, { readH: 0.85, pt: 10 });
check(S6, 6, "Check 6: Microsoft closes the retirement notice",
  "Next spring, Microsoft stops listing RT5J-6KL. What does the router do with its task?",
  ["Resolves the task automatically", "Deletes the task and the payload", "Sends an update asking for the re-read (C4)", "Nothing, until the action date"],
  `Check six. Next spring, Microsoft stops listing our retirement notice. What does the router do with its task: resolve it, delete it, send an update asking for the re-read, or wait for the action date?`,
  `Answer: C. Chapter 06: an open notice from a provider read in this run that is no longer listed is marked absent, and its task gets an update asking for the re-read; a provider closing its notice gets a close payload that also asks for the re-read. Danger: a task resolved because the provider resolved its notice, and a retirement shows done while the resource still runs the retired SKU. The task is resolved on the agency's own check (design guidance). Lab 1, step 8: the Azure incident no longer listed is an absent update.`,
  `${WB}, Chapter 06, "Runs and state," "Lab 1," step 8, "Dangers."`);
endModule(S6);

// ================================================================== Scene 7 (Chapter 07)
const S7 = "Scene 7 — Digest and evidence";
{
  const s = slide(S7, "What", "Scene 7: the digest for owners, the chain for the ISSO");
  scene(s, [
    "Every week the digest puts RT5J-6KL in front of its owner: Action required, soonest due first",
    "It's the same run the ISSO gets as evidence, so neither can drift from what was read",
    "Each run is recorded: steps, controls and KSIs, every file's SHA-256, and the hash of the record before it",
    "A file changed after it was recorded breaks the check",
  ], [
    "digest.md in five sections; digest.csv with each notice's route and owner",
    "Invoke-PnEvidence.ps1 records each run folder against its manifest",
    "-Check verifies SHA256SUMS and walks the chain",
    "-Check -Stage lists every step the stage needs, pass or fail: the evidence half of the go/no-go",
  ], "WHAT THE KIT DOES (CHAPTER 07)", "Gate 7 — RA-3, CA-7, AU-9: ",
  "the digest and every run, recorded so the ISSO can check them by hash. The records support controls; the assessor decides.", { icon: "FaFingerprint", pt: 12.5 });
  src(s, "Sources: Ch 07, “Start with the guide's evidence table,” “The code,” “Federal requirements”; NIST OSCAL 5.2.0; FedRAMP KSIs.");
  speak(s, "Scene 7: the digest for owners, the chain for the ISSO",
    `The answer to check six: an update asking for the re-read. A provider closing its notice isn't the agency's work being done. Scene seven. The digest is for the people who act, and the evidence is for the people who check. Both come from the same runs, so neither can drift from what was actually read. Every week, our retirement sits in the digest's action-required section, soonest due first, with the group it was routed to. And every run is recorded as evidence: its steps, the controls and indicators they support, every file's hash, and the hash of the record before it. Change a recorded file, and the check fails.`,
    `Chapter 07: the digest's five sections: open notices by provider; action required, soonest due first, with the assignment group the routing named; maintenance and changes starting in the next 30 days; new in the last 7 days; closed or no longer listed in the last 7 days. Invoke-PnEvidence.ps1 (Write-PnEvidence) re-hashes every file a run's manifest lists, copies the folder to runs/<NNNN>-<task>, and writes a record with the time, environment, mode, change record, command, result (Pass only if every file matches), the steps with their controls and KSIs, the claim language, every file's SHA-256 and the previous record's SHA-256; appends records.csv and rewrites SHA256SUMS. -Check verifies SHA256SUMS and walks the chain; -Check -Stage test adds PRE, RUN, ROUTE and DIGEST; production adds ALERTS. The guide maps the evidence to SA-9, SI-5, CM-3, CM-4, CP-2, RA-3, CA-7, AU-9 and SR-8 and the KSIs FedRAMP lists for them; the kit's records support those controls, and the assessor decides them. The chain protects files from undetected change; it doesn't decide a control.`,
    `${WB}, Chapter 07, "Start with the guide's evidence table," "The code," "Federal requirements and evidence."`);
}
tryIt(S7, "Try it: RT5J-6KL in the digest, then a tampered file",
  "WORKBOOK CH 07, LAB 1, STEPS 3, 5 AND 8 (DIGEST CUT TO ITS ACTION-REQUIRED HEADER AND THE CASE'S ROW; LONG LINES CUT WITH …)",
  [...cap("07-3", [0, 1, 15, 17, 24]), ...cap("07-5", [0, 1, 2]), ...cap("07-8", [0, 1, 2, 3, 4])],
  "the case's row shows the due date and the owner. Three records chain clean, until one recorded file is edited.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 07, “Lab 1: fixtures, no tenant,” steps 3, 5 and 8.",
  `Try it. After a week of runs, write the digest for the second week and read it. Under action required, our row: due 2027-09-30, Azure, retirement, routed to Cloud Platform Engineering, with its notice ID. Then, with the collection, the routing and the digest each recorded, check the evidence: twenty-five files match their sums, three records, chain unbroken. Now append one line to the recorded digest and check again. The sums fail on that file, the chain fails on its record, and the check exits with a failure.`,
  `Step 1 (not shown) collects and routes both weeks. Step 2: Digest: 16 open, 8 need action, 5 starting in the next 30 days, 2 new, 4 closed or no longer listed. Step 3: the digest's Action required table includes | 2027-09-30 | Azure | retirement | Retirement: Basic SKU public IP addresses | Cloud Platform Engineering (example) | azure:RT5J-6KL |, the sixth of eight rows (the slide cuts the line). Step 4 (not shown) records three runs: Record 1 collect (COL-AZURE … NORMALIZE, EVIDENCE), Record 2 route (ROUTE, CONTINGENCY, EVIDENCE), Record 3 digest (DIGEST, EVIDENCE). Step 5: SUMS Pass 25 files match SHA256SUMS; CHAIN Pass 3 records, chain unbroken. Step 6 (not shown): -Check -Stage test fails STEP-PRE and STEP-RUN, which only the runbook's pre-flight and scheduled run produce. Step 8: Add-Content to runs/0003-digest/digest.md; SUMS Fail runs/0003-digest/digest.md changed; CHAIN Fail runs/0003-digest/digest.md doesn't match 0003-digest.json; exit code 1.`,
  `${WB}, Chapter 07, "Lab 1: fixtures, no tenant," steps 1–8.`);
check(S7, 7, "Check 7: the stage check in Lab 1",
  "In Lab 1, -Check -Stage test passes SUMS, CHAIN, ROUTE and DIGEST. Why does it still exit 1?",
  ["A file was edited", "STEP-PRE and STEP-RUN have no passing record: only the runbook makes them", "The KSIs don't match", "The digest is older than seven days"],
  `Check seven. In the lab, the stage check for test passes the sums, the chain, routing and the digest. Why does it still fail? An edited file, no pre-flight or scheduled-run record yet, mismatched indicators, or an old digest?`,
  `Answer: B. Chapter 07, Lab 1, step 6: -Check -Stage test prints SUMS Pass, CHAIN Pass, STEP-PRE Fail no passing record, STEP-RUN Fail no passing record, STEP-ROUTE Pass, STEP-DIGEST Pass, and exits 1. The test stage needs PRE, RUN, ROUTE and DIGEST; the pre-flight and the scheduled run are the runbook's (Chapter 08).`,
  `${WB}, Chapter 07, "The evidence record," "Lab 1," step 6.`);
endModule(S7);

// ================================================================== Scene 8 (Chapter 08)
const S8 = "Scene 8 — Test, then production";
{
  const s = slide(S8, "How", "Scene 8: the loop goes live, test first");
  scene(s, [
    "The runbook runs the same commands twice: test, then production; only the settings file changes",
    "Reads first, one provider at a time, each cross-checked against the provider's own command",
    "Routing as a dry run; a smoke test; then the one cloud write, the Service Health alert policy, with its approved hash",
    "The weekly run on a schedule, the stage's evidence, and a rehearsed rollback",
  ], [
    "Pre-flight PF-01 to PF-07, read-only; production's PF-07 needs the test stage's evidence to pass",
    "A settings file with no secrets; the ServiceNow token is an environment variable",
    "Production routes as a dry run for a week before sending",
    "Nobody has run it against a live tenant: live results are labeled Expected",
  ], "WHAT THE RUNBOOK DOES (CHAPTER 08)", "Every gate — CM-3, CP-2, CA-7, AU-9: ",
  "one approved change record per stage, an approval at each write, evidence checked by hash, a rollback already run.", { icon: "FaRoute", pt: 12.5 });
  src(s, "Sources: Ch 08, “What the runbook depends on,” “Pre-flight checks,” Stages 1 and 2; Learn, Service Health alerts with Azure Policy; app-only Graph.");
  speak(s, "Scene 8: the loop goes live, test first",
    `The answer to check seven: there's no pre-flight or scheduled-run record yet, and only the runbook makes them. Scene eight, the runbook. It's one ordered set of commands run twice, against test and then production, and only the settings file changes. Reads come first, one provider at a time, each cross-checked against the provider's own command. Routing runs as a dry run, then a smoke test, then the one write to a cloud, the Service Health alert policy Microsoft Learn describes, applied only with its approved hash. Then the weekly schedule, the stage's evidence, and a rollback someone has already run. One honest label: nobody has run this runbook against a live tenant yet.`,
    `Chapter 08: one ordered set of copy-paste commands, run twice; only the settings file changes. Order (design guidance): reads first, one provider at a time; routing as a dry run before anything is sent; the one write to a cloud (the alert policy) only after the reads work; the schedule last. The kit's writes: the Azure Policy assignment and its remediation, the rollback, registering the scheduled task, and sending payloads to the agency's own ServiceNow endpoint, each only with -Apply and the approved SHA-256, or -Send and routing.send. Settings: no secrets (Read-PnSettings stops on a secret-like value); no placeholders in an enabled provider; named contacts (PF-05, for SR-8). Pre-flight PF-01 to PF-07; PF-07 (production only) fails if the test stage's evidence would fail. Stage 2 routes as a dry run for the first week; sending is turned on after the change manager approves. The estate: Microsoft 365 GCC with commercial Azure, graph.microsoft.com and management.azure.com. Status: nobody has run this runbook against a live tenant, account, tenancy or project; live results are labeled Expected; the deploy scripts have run only in fixture mode.`,
    `${WB}, Chapter 08, "What the runbook depends on," "The settings file," "Pre-flight checks," "Stage 1," "Stage 2."`);
}
tryIt(S8, "Try it: the runbook's dry run on the fixtures",
  "WORKBOOK CH 08, “DRY RUN ON THE KIT'S FIXTURES”: TWO OF ITS COMMANDS, AND OUTPUT AS THE PAGE PRINTS IT (DRY RUN, NOVEMBER 9, 2026)",
  [
    "PS> ./deploy/Invoke-PnScheduledRun.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -FixturePath tests/fixtures/day1 `",
    ">>     -AsOf 2026-11-09T12:00:00Z",
    "RUN-COLLECT  Pass  15 notices from azure, m365, oci",
    "RUN-ROUTE    Pass  8 create, 0 update, 0 close; dry run",
    "RUN-DIGEST   Pass  13 open, 5 need action",
    "PS> ./Invoke-PnEvidence.ps1 -EvidencePath out/deploy-test/evidence -Check -Stage test",
    "SUMS           Pass  31 files match SHA256SUMS",
    "CHAIN          Pass  5 records, chain unbroken",
    "STEP-PRE       Pass  a passing record covers it",
    "STEP-RUN       Pass  a passing record covers it",
    "STEP-ROUTE     Pass  a passing record covers it",
    "STEP-DIGEST    Pass  a passing record covers it",
    "# Step 1.3, Azure on the test fixture: azure AzureCloud 5 5 2 advisory 1, incident 1, maintenance 1, retirement 1, security 1",
    "# Production alert plan: AL-01, AL-02 WouldApply; Plan SHA-256: 6a1ec6adbd50bc2cec2bcc803ee45629bc0a0d7de416fcafd3216db443a4a3b7",
  ],
  "with the pre-flight and the scheduled run recorded, every step of the test stage passes: the go/no-go's evidence half.",
  "Sources: Workbook Ch 08, “Dry run on the kit's fixtures” and Step 1.3 (output as the page prints it, fixture mode, Nov 9, 2026).",
  `Try it. The runbook's own dry run on the fixtures: the test pre-flight passes fourteen checks and is recorded, then the scheduled run collects three providers, routes eight creates as a dry run, and writes the digest. Now the stage check that failed in the last scene passes on every row, because the pre-flight and the run are recorded. The Azure step on the test fixture shows one retirement, ours. And the production alert plan prints the same hash as the chapter one lab, which a reviewer approves before anything is applied.`,
  `Chapter 08, "Dry run on the kit's fixtures": the commands run the test pre-flight (Test-PnPreflight.ps1 -Stage test), record it (Invoke-PnEvidence.ps1 -ChangeRecord CHG-EXAMPLE-0101), the scheduled run, the stage check, the test rollback plan, the production pre-flight with the test evidence, the production alert plan and the production rollback plan. Dry run, November 9, 2026: the test pre-flight passed 14 checks (PF-01, PF-02 to PF-05 for Azure, Microsoft 365 and OCI, PF-06). The scheduled run printed RUN-COLLECT Pass 15 notices from azure, m365, oci; RUN-ROUTE Pass 8 create, 0 update, 0 close; dry run; RUN-DIGEST Pass 13 open, 5 need action. The stage check printed SUMS Pass 31 files match SHA256SUMS; CHAIN Pass 5 records, chain unbroken; STEP-PRE, STEP-RUN, STEP-ROUTE and STEP-DIGEST Pass. The test rollback planned RB-01 (unregister the scheduled task). The production pre-flight passed 23 checks, ending PF-07 Pass the test stage's evidence passes. The alert plan's two steps were WouldApply, with Plan SHA-256 6a1ec6ad…a3b7, and the production rollback planned RB-01 and RB-02 as WouldApply and RB-03 as Manual. Step 1.3's dry run: azure AzureCloud 5 5 2 advisory 1, incident 1, maintenance 1, retirement 1, security 1, recorded Pass (COL-AZURE, NORMALIZE, EVIDENCE). The scheduled-run command on the slide is the page's, continued with a backtick; the page's own commands are the source.`,
  `${WB}, Chapter 08, "Dry run on the kit's fixtures"; "Step 1.3."`, { readH: 0.85 });
check(S8, 8, "Check 8: production before test passes",
  "An operator runs the production pre-flight before the test stage's evidence passes. What happens?",
  ["It passes; test and production are independent", "PF-07 fails: production needs the test stage's evidence to pass", "It warns, and the operator decides", "The alert policy is applied anyway"],
  `Check eight, the last one. An operator runs the production pre-flight before the test stage's evidence passes. Does it pass anyway, fail on the check that reads the test evidence, warn and let the operator decide, or apply the alert policy regardless?`,
  `Answer: B. Chapter 08: PF-07 (production only) reads the test stage's evidence and fails when Invoke-PnEvidence.ps1 -Check -Stage test would fail. Danger: production deployed before test passed, and problems are found by the people who rely on the notices; the guard is PF-07. Promotion also needs the go/no-go recorded by the ISSO and the change advisory board.`,
  `${WB}, Chapter 08, "Pre-flight checks," "Promotion go/no-go criteria," "Dangers."`);
endModule(S8);

// ================================================================== Close
const SC = "Close";
{
  const s = slide(SC, "How", "Your turn: Lab 2, and where to go next");
  const pl = panel(s, "Lab2", 0.6, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "LAB 2: YOUR OWN TEST ENVIRONMENT", null, [
    "Azure: a test subscription in a test tenant",
    "Microsoft 365: a test tenant, worldwide or GCC",
    "OCI, AWS and Google Cloud: a test tenancy, account or project",
    "Routing: a ServiceNow developer instance, never production",
    "Every Lab 2 runs in a test environment, never production",
  ], 13);
  const pr = panel(s, "Next", 6.75, 1.45, 6.0, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "The workbook, Building Provider Notices: eight chapters, seven with Lab 1 and Lab 2, and the runbook",
    "A narrated tour of each chapter",
    "The learning path, Provider Notices: nine modules with knowledge checks",
    "Provider Notices: An Implementation Guide: the seven gates",
  ], 13);
  callout(s, "Case", Math.max(pl, pr) + 0.22, 1.0, "FaRoute", HEX.navy, "RT5J-6KL, end to end: ",
    "read with the least privilege, one record with its basis, routed to an owner, in the digest, recorded as evidence, deployed test first.");
  src(s, "Sources: workbook index (the pieces); Chapters 01–07, Lab 2; Chapter 08; training path index; guide, “In this guide.”");
  speak(s, "Your turn: Lab 2, and where to go next",
    `The answer to check eight: the pre-flight's last check fails, because production needs the test stage's evidence to pass first. That's our retirement, end to end: read with the least privilege, made one record that says who decided it needs action, routed to an owner with two dates kept apart, carried in the weekly digest, recorded as evidence the security officer can check, and deployed test first. Now it's your turn. Each provider chapter has a second lab in your own test subscription, tenant, tenancy, account or project, and routing has one in a ServiceNow developer instance, never production. Then go deeper: the workbook's chapters and their narrated tours, the learning path, and the implementation guide. Thanks for watching.`,
    `Lab 2 environments: Chapter 01, an Azure test subscription in a test tenant, never production; Chapter 02, a test tenant; Chapter 03, a test tenancy; Chapter 04, a test account; Chapter 05, a test project; Chapter 06, a ServiceNow Personal Developer Instance or a sub-production instance, never production; Chapter 07, the run folders from any earlier chapter's Lab 2, never production. Where to go next: the workbook index (docs/project-plans/developer-workbooks/provider-notices/), the eight chapters, the narrated chapter tours, the learning path Provider Notices (docs/training/provider-notices/, nine modules: one per gate plus the why and an optional runbook module, each with a chapter's Lab 1 and a knowledge check), and Provider Notices: An Implementation Guide (docs/books/guides/provider-notices-implementation.md). The operations view is the book Compliance Automation & Day-2 Operations, Chapter 14.`,
    `${WB}, index ("The pieces and how they connect"); Chapters 01–07, "Lab 2"; Chapter 08; learning path, index; ${GUIDE}.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: the workbook and the kit", [
  "Building Provider Notices (docs/project-plans/developer-workbooks/provider-notices/): index; Chapter 01 The Notice Record and Azure Service Health; 02 Microsoft 365 Message Center and Service Health; 03 Oracle Cloud Infrastructure Announcements; 04 AWS Health; 05 Google Cloud Personalized Service Health; 06 Routing to Owners and Ticket-to-Machine Tasks; 07 The Weekly Digest and Evidence; 08 Deploying to Test and Production. Every chapter is status: draft, awaiting the owner's review. Each chapter's provider facts are footnoted there, read November 9, 2026.",
  "examples/provider-notices: Invoke-PnCollect.ps1, Invoke-PnRoute.ps1, Invoke-PnDigest.ps1, Invoke-PnEvidence.ps1; powershell/ProviderNotices; schema/notice.schema.json; config/routing.json, calls.json, requirements.json; deploy/ (New-PnAlertPolicy.ps1, Test-PnPreflight.ps1, Invoke-PnScheduledRun.ps1, Invoke-PnRollback.ps1, PnDeploy.psm1).",
  "Fixtures (all fictional): tests/fixtures/day1 and day2, settings.lab.json; deploy/tests/fixtures. The case, azure:RT5J-6KL, is an Azure fixture notice; the Microsoft 365, OCI, AWS and Google notices on Scenes 2 to 5 are those providers' own fixtures.",
  "Every Try it output is read at build time from data/kit-captures/pn/ (scripts/kit_captures.py), trimmed where the slide says so; Scene 8 shows Chapter 08's own fixture dry run, as the page prints it.",
]);
sourceSlide("Sources: the providers and the requirements", [
  "Microsoft Learn: Azure Resource Graph sample queries for Service Health; Subscription versus tenant level events; security advisories access; Deploy Service Health alerts at scale using Azure Policy; Use the Microsoft Graph API to access service communications; National cloud deployments; app-only authentication with the Microsoft Graph PowerShell SDK.",
  "Oracle: OCI CLI command reference, oci announce announcements list and get; Details for Announcements; Oracle US Government Cloud. AWS: AWS Health API Reference (Event, DescribeEventDetails); AWS Health User Guide (Concepts); AWS GovCloud (US) User Guide, AWS Health. Google Cloud: Personalized Service Health REST reference (events.list, Event); roles and permissions; Assured Workloads supported products.",
  "NIST SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0; FedRAMP, Key Security Indicators (FedRAMP Consolidated Rules for 2026). The kit's config/requirements.json maps each step; KSI alignment is the program's mapping (design guidance); the kit's records support the controls, and the assessor decides them.",
  "Ticket-to-Machine: the book Governance, Drift & Evidence, Chapter 10 and Appendix B (the five clauses, severities and windows: program design). Design guidance in this deck: the kit's action rules, the routing order, the staged enable and the story's ordering of fixtures into one case.",
]);

const count = narration.length;
fs.writeFileSync(path.join(__dirname, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
const spokenWords = narration.reduce((a, e) => a + e.say.split(" ").length, 0);
console.log(`narration.json: ${count} narrated slides, ${spokenWords} spoken words (about ${(spokenWords / 150).toFixed(1)} min at 150 wpm)`);
finish(OUT);
