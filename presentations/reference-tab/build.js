// The Reference Tab: a 12-slide narrated briefing on why each page of the Reference tab matters
// (docs/reference/): the Command Reference, the Federal Framework Crosswalk, the RMF Map, the M-19-17
// and FICAM Crosswalk, the Microsoft Practice Crosswalk and the Source Register.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Reference_Tab.pptx
// Every number comes from the pages as they stood on November 8, 2026: the Command Reference's generated
// body (python scripts/command_reference.py), the RMF Map's tally, the M-19-17 and FICAM Crosswalk's
// marks, the Microsoft Practice Crosswalk's rows and data/source-register.json. Recheck them before a
// rebuild. The spoken narration lives in narration.json; each slide's notes carry the same text and a
// "Workbook:" line naming the page.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Reference", title: "The Reference Tab",
  footer: "Federal Modernization Workbook  ·  Reference  ·  The Reference Tab" });
const { HEX, txt, box, icon, tag, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "Reference_Tab.pptx";

const SAY = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
let n = 0;
const notes = (s, title, ref) => {
  n += 1;
  const e = SAY.find((x) => x.slide === n);
  if (!e) throw new Error(`narration.json has no slide ${n}`);
  if (e.title !== title) throw new Error(`slide ${n}: narration title ${JSON.stringify(e.title)} != ${JSON.stringify(title)}`);
  if (title.length > 58) console.warn(`! slide ${n}: title over 58 characters`);
  s.addNotes(`${e.say}\n\nWorkbook: ${ref}`);
};
const slide = (sec, part, title) => { const s = D.content(sec, title); tag(s, part); return s; };
const status = (s, text) => txt(s, "Page status", text, { x: 9.4, y: 0.12, w: 3.35, h: 0.32, fontSize: 12, bold: true, color: HEX.slate, align: "right", valign: "middle" });
const stat = (s, name, x, y, w, num, label, color, tint) => {
  box(s, name, x, y, w, 1.75, tint);
  txt(s, `${name} number`, num, { x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.85, fontSize: 40, bold: true, fontFace: "Cambria", color, align: "center", valign: "middle" });
  txt(s, `${name} label`, label, { x: x + 0.15, y: y + 1.0, w: w - 0.3, h: 0.65, fontSize: 15, color: HEX.ink, align: "center", valign: "top" });
};
const card = (s, name, x, y, w, h, iconName, color, tint, headText, body, size) => {
  box(s, name, x, y, w, h, tint);
  icon(s, iconName, x + 0.22, y + 0.22, 0.62, color);
  txt(s, `${name} head`, headText, { x: x + 1.0, y: y + 0.22, w: w - 1.2, h: 0.62, fontSize: 19, bold: true, fontFace: "Cambria", color, valign: "middle" });
  txt(s, `${name} text`, body, { x: x + 0.25, y: y + 1.0, w: w - 0.5, h: h - 1.15, fontSize: size || 15 });
};

// ------------------------------------------------------------------ 1 Title
{
  const s = D.titleSlide("Why a Reference tab", "The Reference Tab", "Six core pages you look things up in: why each one matters, and how they fit together");
  D.agenda(s, 0.8, 4.85, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "whalermike.github.io/modernization-workbook/docs/reference/", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 8, h: 0.8, fontSize: 16 });
  notes(s, "The Reference Tab", "Reference, index (docs/reference/index.md).");
}

// ------------------------------------------------------------------ 2 Why
{
  const t = "Why a Reference tab";
  const s = slide("Why a Reference tab", "Why", t);
  txt(s, "Lead", "The books teach in order. The reference pages answer the questions that cut across all twenty-one books.",
    { x: 0.6, y: 1.5, w: 12.15, h: 0.6, fontSize: 18, color: HEX.ink, align: "center" });
  const cols = [
    ["FaListCheck", "Run it", HEX.amber, HEX.amberTint, "Which command does the job, and which chapter teaches it?"],
    ["FaClipboardCheck", "Prove it", HEX.navy, HEX.navyTint, "Which federal requirement does this support, and what evidence shows it?"],
    ["FaShieldHalved", "Trust it", HEX.teal, HEX.tealTint, "Is the source still current, and has anyone checked it lately?"],
  ];
  cols.forEach((c, i) => card(s, `Job ${i + 1}`, 0.6 + i * 4.1, 2.3, 3.95, 2.75, c[0], c[2], c[3], c[1], c[4], 17));
  callout(s, "Rule", 5.3, 1.05, "FaLightbulb", HEX.navy, "One job per page: ",
    "every page on the tab answers one of these three kinds of question, for an engineer, an ISSO or an authorizing official.");
  sources(s, "Sources: Reference tab landing page; Books 00–20 (the series index).");
  notes(s, t, "Reference, index.");
}

// ------------------------------------------------------------------ 3 What: glance
{
  const t = "Six core pages at a glance";
  const s = slide("The six pages", "What", t);
  const job = (j, c) => ({ text: j, options: { bold: true, color: c } });
  const rows = [
    head(["Page", "Job", "The question it answers"]),
    ["Command Reference", job("Run it", HEX.amber), "What does each kit command do, and which page teaches it?"],
    ["Federal Framework Crosswalk", job("Prove it", HEX.navy), "Which federal frameworks does each book cover, and how deeply?"],
    ["RMF Map", job("Prove it", HEX.navy), "Where is each Risk Management Framework task, and what does it leave behind?"],
    ["M-19-17 and FICAM Crosswalk", job("Prove it", HEX.navy), "How does the workbook support federal identity policy, area by area?"],
    ["Microsoft Practice Crosswalk", job("Prove it", HEX.navy), "Where does Microsoft define each practice, and what check confirms it?"],
    ["Source Register", job("Trust it", HEX.teal), "Is every source the slides and videos cite still where it was?"],
  ];
  s.addTable(rows, tableOpts([3.6, 1.4, 7.15], { y: 1.5, fontSize: 15, rowH: 0.58 }));
  txt(s, "Site only", "Also on the tab, site only: the Learn Coverage Map and the Zero Trust Closure Coverage tracker.",
    { x: 0.6, y: 5.65, w: 12.15, h: 0.4, fontSize: 14, bold: true, color: HEX.navy });
  sources(s, "Sources: Reference tab landing page, November 12, 2026 (the six pages as of November 8).");
  notes(s, t, "Reference, index.");
}

// ------------------------------------------------------------------ 4 Command Reference
{
  const t = "Run it: the Command Reference";
  const s = slide("The six pages", "What", t);
  status(s, "Generated on every build");
  txt(s, "Lead", "Every command in the example kits, in one place", { x: 0.6, y: 1.45, w: 12.15, h: 0.5, fontSize: 19, color: HEX.ink, align: "center" });
  stat(s, "Commands", 0.6, 2.1, 3.9, "718", "commands across 17 kits", HEX.amber, HEX.amberTint);
  stat(s, "Functions", 4.725, 2.1, 3.9, "615", "PowerShell module functions", HEX.navy, HEX.navyTint);
  stat(s, "Scripts", 8.85, 2.1, 3.9, "55 + 48", "PowerShell scripts and Python tools", HEX.teal, HEX.tealTint);
  callout(s, "Why", 4.2, 1.6, "FaArrowsRotate", HEX.amber, "Why it matters: ",
    "the page is built from each command's own help on every site build, so the page and the help can't disagree, and a public command without a synopsis or an example fails the check. Each row links to the chapters and modules that teach the command.");
  sources(s, "Sources: Command Reference (generated by scripts/command_reference.py from the kits' help), counts as of November 8, 2026.");
  notes(s, t, "Reference, Command Reference.");
}

// ------------------------------------------------------------------ 5 Federal Framework Crosswalk
{
  const t = "Prove it: the Federal Framework Crosswalk";
  const s = slide("The six pages", "What", t);
  status(s, "Status: in review");
  txt(s, "Lead", [
    { text: "Every book scored against the frameworks a federal program answers to", options: { bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", breakLine: true } },
    { text: "Beyond security controls: investment and funding, enterprise architecture, digital services, privacy and records. Each book gets a score from 0 (not addressed) to 3 (evidence-backed) for each framework, judged by reading the chapters.", options: { fontSize: 15.5 } },
  ], { x: 0.6, y: 1.55, w: 5.6, h: 3.4, paraSpaceAfter: 10 });
  const rows = [
    head(["Framework", "Status found at the source"]),
    ["OMB M-22-18", "Rescinded by M-26-05"],
    ["Federal Data Strategy", "Being retired"],
    ["FEAF v2", "Historical; A-130 still requires an EA"],
    ["EO 14028", "In force as amended"],
    ["FITARA", "In force; new memo M-26-10"],
  ];
  s.addTable(rows, tableOpts([2.6, 3.8], { x: 6.35, y: 1.55, fontSize: 15, rowH: 0.55 }));
  callout(s, "Why", 5.15, 1.25, "FaBuildingColumns", HEX.navy, "Why it matters: ",
    "it checks each framework's status at its primary source, so the books cite what is in force now.");
  sources(s, "Sources: Federal Framework Crosswalk (last reviewed November 6, 2026); OMB M-26-05; OMB M-26-10; Executive Order 14028; OMB Circular A-130.");
  notes(s, t, "Reference, Federal Framework Crosswalk.");
}

// ------------------------------------------------------------------ 6 RMF Map
{
  const t = "Prove it: the RMF Map";
  const s = slide("The six pages", "What", t);
  status(s, "Status: in review");
  txt(s, "Lead", "All 47 Risk Management Framework tasks, mapped to the chapters and the evidence", { x: 0.6, y: 1.45, w: 12.15, h: 0.5, fontSize: 19, color: HEX.ink, align: "center" });
  stat(s, "Covered", 0.6, 2.1, 2.9, "24", "Covered", HEX.teal, HEX.tealTint);
  stat(s, "Partial", 3.68, 2.1, 2.9, "14", "Partial", HEX.amber, HEX.amberTint);
  stat(s, "By design", 6.77, 2.1, 2.9, "9", "Partial by design", HEX.navy, HEX.navyTint);
  stat(s, "Not covered", 9.85, 2.1, 2.9, "0", "Not covered", HEX.red, HEX.redTint);
  callout(s, "Why", 4.2, 1.6, "FaUserCheck", HEX.navy, "Why it matters: ",
    "an ISSO, an assessor or an authorizing official asks where the RMF is and what each step leaves behind. This page answers that in one place, task by task from NIST SP 800-37 Rev. 2, naming the artifact an assessor would read.");
  sources(s, "Sources: RMF Map (last reviewed November 8, 2026); NIST SP 800-37 Rev. 2.");
  notes(s, t, "Reference, RMF Map.");
}

// ------------------------------------------------------------------ 7 M-19-17 and FICAM
{
  const t = "Prove it: the M-19-17 and FICAM Crosswalk";
  const s = slide("The six pages", "What", t);
  status(s, "Status: in review");
  txt(s, "Lead", [
    { text: "Federal identity policy, checked area by area", options: { bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", breakLine: true } },
    { text: "OMB M-19-17 is the federal identity, credential and access management policy; the FICAM Architecture divides the same ground into services. The page maps both to the books, guides and kits: nine identity areas first, then M-19-17 section by section and each FICAM service.", options: { fontSize: 15.5 } },
  ], { x: 0.6, y: 1.55, w: 6.2, h: 3.4, paraSpaceAfter: 10 });
  const rows = [
    head(["Mark", "Rows"]),
    ["Strong", "15"],
    ["Partial", "20"],
    ["Gap", "5"],
    ["Out of scope, with the reason", "2"],
  ];
  s.addTable(rows, tableOpts([4.2, 1.4], { x: 7.15, y: 1.55, fontSize: 15.5, rowH: 0.55 }));
  txt(s, "Table note", "The 42 rows that check M-19-17 section by section and the FICAM services one by one.", { x: 7.15, y: 4.45, w: 5.6, h: 0.55, fontSize: 12, italic: true, color: HEX.slate });
  callout(s, "Why", 5.15, 1.25, "FaIdCard", HEX.navy, "Why it matters: ",
    "identity is where most of the program's work lands, and this page shows the gaps as plainly as the strengths.");
  sources(s, "Sources: M-19-17 and FICAM Crosswalk (last reviewed November 2, 2026); OMB M-19-17; FICAM Architecture.");
  notes(s, t, "Reference, M-19-17 and FICAM Crosswalk.");
}

// ------------------------------------------------------------------ 8 Microsoft Practice Crosswalk
{
  const t = "Prove it: the Microsoft Practice Crosswalk";
  const s = slide("The six pages", "What", t);
  status(s, "Status: draft");
  txt(s, "Lead", "33 Microsoft practices, each tied to its source and an automated check", { x: 0.6, y: 1.45, w: 12.15, h: 0.5, fontSize: 19, color: HEX.ink, align: "center" });
  const cols = [
    ["The practice", "Entra ID, Intune, national clouds, Azure Arc, SQL Server, with the chapter that recommends it", HEX.navy, HEX.navyTint],
    ["The source", "The Microsoft Learn page that defines the setting", HEX.teal, HEX.tealTint],
    ["The check", "A CISA ScubaGear policy ID or an Azure Policy built-in, or a plain \"no check exists\"", HEX.amber, HEX.amberTint],
    ["Last reviewed", "The date someone last confirmed the row against the source", HEX.slate, HEX.grey],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Column ${i + 1}`, x, 2.05, 2.95, 2.05, c[3]);
    txt(s, `Column ${i + 1} text`, [{ text: c[0], options: { bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: c[1], options: { fontSize: 14 } }],
      { x: x + 0.2, y: 2.2, w: 2.55, h: 1.8, paraSpaceAfter: 6 });
  });
  callout(s, "Why", 4.3, 1.85, "FaFilter", HEX.navy, "Why it matters: ",
    "it finds what the chapters can't see alone: one policy with two version numbers between ScubaGear and the BOD 25-01 list, Intune with no ScubaGear coverage, and no built-in policy for Entra authentication on Arc-enabled SQL Server.");
  sources(s, "Sources: Microsoft Practice Crosswalk (last reviewed October 25, 2026); CISA ScubaGear; Microsoft Learn pages listed on the crosswalk.");
  notes(s, t, "Reference, Microsoft Practice Crosswalk.");
}

// ------------------------------------------------------------------ 9 Source Register
{
  const t = "Trust it: the Source Register";
  const s = slide("The six pages", "What", t);
  status(s, "Status: approved; changes re-reviewed");
  box(s, "Count box", 0.6, 1.6, 3.9, 3.3, HEX.tealTint);
  txt(s, "Count", "540", { x: 0.75, y: 1.85, w: 3.6, h: 1.3, fontSize: 60, bold: true, fontFace: "Cambria", color: HEX.teal, align: "center", valign: "middle" });
  txt(s, "Count label", "sources the slides and videos cite, as of November 8, 2026", { x: 0.85, y: 3.2, w: 3.4, h: 1.4, fontSize: 16, color: HEX.ink, align: "center" });
  txt(s, "Problem", [
    { text: "A released deck can't change. Its links still have to work.", options: { bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", breakLine: true } },
    { text: "Slides and video descriptions link to a source's row here, and the row links to the original. When a publisher moves a page, only the row changes.", options: { fontSize: 15 } },
  ], { x: 4.8, y: 1.6, w: 7.95, h: 1.45, paraSpaceAfter: 6 });
  const rules = [
    ["FaKey", HEX.teal, "Every source gets a permanent address. Rows can be retired, never deleted or renamed."],
    ["FaCodeBranch", HEX.navy, "Every change goes through a reviewed pull request and the revision history."],
    ["FaArrowsRotate", HEX.amber, "A weekly scan reads every source and proposes fixes. It never edits."],
  ];
  rules.forEach((r, i) => {
    const y = 3.2 + i * 0.6;
    icon(s, r[0], 4.8, y, 0.5, r[1]);
    txt(s, `Rule ${i + 1}`, r[2], { x: 5.45, y, w: 7.3, h: 0.5, fontSize: 15, valign: "middle" });
  });
  callout(s, "Why", 5.15, 1.25, "FaShieldHalved", HEX.teal, "Why it matters: ",
    "every other page, and every deck and video, rests on sources; the register keeps their addresses permanent and checked.");
  sources(s, "Sources: Source Register (data/source-register.json, 540 rows as of November 8, 2026).");
  notes(s, t, "Reference, Source Register.");
}

// ------------------------------------------------------------------ 10 How they fit
{
  const t = "How the six pages fit together";
  const s = slide("How it fits", "What", t);
  const layers = [
    ["Federal Framework Crosswalk", "The wide view: every book against every framework", HEX.navy, HEX.navyTint],
    ["RMF Map", "Its RMF row, task by task. Where they differ, the map wins.", HEX.navy, HEX.navyTint],
    ["M-19-17 and FICAM Crosswalk", "The same depth for identity policy", HEX.navy, HEX.navyTint],
    ["Microsoft Practice Crosswalk", "The practices behind the evidence, each with a check", HEX.navy, HEX.navyTint],
    ["Command Reference", "The kit commands that produce that evidence", HEX.amber, HEX.amberTint],
  ];
  layers.forEach((l, i) => {
    const y = 1.55 + i * 0.72;
    box(s, `Layer ${i + 1}`, 0.6 + i * 0.35, y, 12.15 - i * 0.7, 0.62, l[3]);
    txt(s, `Layer ${i + 1} text`, [{ text: l[0] + "   ", options: { bold: true, color: l[2] } }, { text: l[1] }],
      { x: 0.85 + i * 0.35, y, w: 11.65 - i * 0.7, h: 0.62, fontSize: 16, valign: "middle" });
  });
  box(s, "Foundation", 0.6, 5.25, 12.15, 1.1, "FFFFFF", HEX.teal);
  icon(s, "FaBook", 0.85, 5.4, 0.8, HEX.teal);
  txt(s, "Foundation text", [{ text: "Source Register underneath all of them: ", options: { bold: true, color: HEX.teal } }, { text: "every source the slides and videos cite has a permanent, checked address." }],
    { x: 1.9, y: 5.3, w: 10.65, h: 1.0, fontSize: 17, valign: "middle" });
  sources(s, "Sources: Federal Framework Crosswalk, \"How to read the scores\" (the RMF row is derived from the RMF Map); RMF Map; Source Register.");
  notes(s, t, "Reference, Federal Framework Crosswalk (How to read the scores) and the pages it links.");
}

// ------------------------------------------------------------------ 11 Who: by role
{
  const t = "Where to start, by role";
  const s = slide("Who reaches for which", "Who", t);
  const rows = [
    head(["If you are", "Open first"]),
    ["An engineer running the kits", "Command Reference"],
    ["An ISSO or control assessor", "RMF Map"],
    ["An authorizing official", "RMF Map, then the M-19-17 and FICAM Crosswalk"],
    ["A CIO or program lead", "Federal Framework Crosswalk"],
    ["An identity or cloud architect", "Microsoft Practice Crosswalk"],
    ["Anyone citing a source", "Source Register"],
  ];
  s.addTable(rows, tableOpts([5.4, 6.75], { y: 1.6, fontSize: 17, rowH: 0.64 }));
  sources(s, "Sources: RMF Map (its readers); M-19-17 and FICAM Crosswalk; Federal Framework Crosswalk; Microsoft Practice Crosswalk; Command Reference; Source Register.");
  notes(s, t, "Reference, index and each page's opening paragraph.");
}

// ------------------------------------------------------------------ 12 How: honest
{
  const t = "How the pages stay honest";
  const s = slide("How they stay honest", "How", t);
  txt(s, "Lead", "Each page says how sure it is, and when someone last checked", { x: 0.6, y: 1.45, w: 12.15, h: 0.5, fontSize: 19, color: HEX.ink, align: "center" });
  const cols = [
    ["FaListCheck", "Read, not counted", HEX.navy, HEX.navyTint, "Scores and marks come from reading the chapters. Keyword hits are opened in context and false matches dropped."],
    ["FaUserClock", "Status and review date", HEX.teal, HEX.tealTint, "Draft, in review or approved, with a last-reviewed date. A page left unreviewed past 90 days is flagged every week."],
    ["FaTriangleExclamation", "Gaps on the page", HEX.amber, HEX.amberTint, "Partial, gap and out-of-scope rows stay visible, with the reason. Missing checks say so instead of inventing one."],
  ];
  cols.forEach((c, i) => card(s, `Honest ${i + 1}`, 0.6 + i * 4.1, 2.1, 3.95, 2.85, c[0], c[2], c[3], c[1], c[4], 15.5));
  callout(s, "Download", 5.2, 1.2, "FaBook", HEX.navy, "Take it with you: ",
    "each of the six core pages also downloads as a Word document, and the Reference Set has all six in one file, from the Reference tab and the Downloads page.");
  sources(s, "Sources: Microsoft Practice Crosswalk, \"Keeping it fresh\"; Federal Framework Crosswalk, \"How to read the scores\"; Reference tab landing page; Downloads page.");
  notes(s, t, "Reference, index; Microsoft Practice Crosswalk (Status and review).");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "The six Reference pages, as they stood on November 8, 2026: Command Reference; Federal Framework Crosswalk (in review); RMF Map (in review); M-19-17 and FICAM Crosswalk (in review); Microsoft Practice Crosswalk (draft); Source Register.",
    "Counts: the Command Reference's generated body (scripts/command_reference.py); the RMF Map's tally; the M-19-17 and FICAM Crosswalk's marks; the Microsoft Practice Crosswalk's rows; data/source-register.json.",
    "Frameworks named on the slides: OMB M-26-05; OMB M-26-10; Executive Order 14028; OMB Circular A-130; NIST SP 800-37 Rev. 2; OMB M-19-17; FICAM Architecture; CISA ScubaGear.",
    "Each of the six also downloads as a Word document; the Reference Set has all six (Reference tab and Downloads page). The Learn Coverage Map and the Zero Trust Closure Coverage tracker, added since, are site only (Reference tab, November 12, 2026).",
    "Full citations with links and access dates are on each page: whalermike.github.io/modernization-workbook/docs/reference/",
  ];
  txt(s, "Source list", D.bullets(src, 14), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

if (n !== SAY.length) throw new Error(`built ${n} narrated slides, narration.json has ${SAY.length}`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
