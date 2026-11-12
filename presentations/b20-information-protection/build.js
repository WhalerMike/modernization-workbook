// Book 20 — Information Protection & Microsoft Purview: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b20-information-protection/build.js presentations/b20-information-protection/B20_Information_Protection.pptx
// Every fact comes from a footnoted chapter of docs/books/b20-information-protection/, named in the notes.
// Book 20 is a draft awaiting the editor's review (not part of Release 2.0); the title slide says so.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 20", title: "Information Protection & Microsoft Purview" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B20_Information_Protection.pptx";

// The spoken narration lives in narration.json (one {slide, title, say} entry per narrated slide), which
// narrate.py voices. The speaker notes carry the same words, so notes and audio can't drift apart, and each
// slide's title is checked against its entry. A timing cue at about 142 words a minute starts each note;
// the "Workbook:" line that ends it isn't spoken.
const SAY = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
const WPM = 142;
let clock = 0, spoken = 0, slideNo = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const BOOK = "Book 20, Information Protection and Microsoft Purview";
const narrate = (s, title, ref) => {
  slideNo += 1;
  const e = SAY.find((x) => x.slide === slideNo);
  if (!e) throw new Error(`narration.json has no entry for slide ${slideNo}`);
  if (e.title !== title) throw new Error(`narration.json slide ${slideNo} title ${JSON.stringify(e.title)} doesn't match ${JSON.stringify(title)}`);
  const words = e.say.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${e.say.trim()}\n\nWorkbook: ${BOOK}, ${ref}`);
};
// A content slide with its part tag; returns the slide and its title for narrate().
const slide = (section, part, title) => { const s = D.content(section, title); tag(s, part); return s; };

// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h, size) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: size || 14, valign: "middle" });
  });
};
// A tinted box on the right with an icon, a small label, a heading and a bullet list.
const sideBox = (s, prefix, iconName, color, tint, label, heading, list, size) => {
  box(s, `${prefix} box`, 7.1, 1.55, 5.65, 3.65, tint);
  icon(s, iconName, 7.35, 1.75, 0.72, color);
  txt(s, `${prefix} head`, [
    { text: label, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: heading, options: { bold: true, color, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
};
// A tinted box to the right of a table, with an icon, a heading and a bullet list.
const tableBox = (s, prefix, iconName, color, tint, heading, list, h, size) => {
  box(s, `${prefix} box`, 7.75, 1.5, 5.0, h || 3.55, tint);
  icon(s, iconName, 8.0, 1.68, 0.6, color);
  txt(s, `${prefix} head`, heading, { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 13.5), { x: 8.0, y: 2.42, w: 4.6, h: (h || 3.55) - 1.0, paraSpaceAfter: 6 });
};
// A row of step boxes across the slide (numbered).
const steps = (s, prefix, list, tints) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 14, breakLine: true } },
      { text: f[1], options: { fontSize: 12 } },
    ], { x: x + 0.12, y: 1.55, w: w - 0.24, h: 1.25, valign: "middle" });
  });
};
// Two tinted panels side by side under the step row.
const panels = (s, list) => list.forEach((p, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Panel ${i + 1}`, x, 3.05, 6.0, 2.0, p[3]);
  icon(s, p[0], x + 0.2, 3.13, 0.56, p[2]);
  txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.13, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 3.75, w: 5.6, h: 1.27, paraSpaceAfter: 2 });
});
// Two tall tinted columns, each with an icon, a small label, a heading and a bullet list.
const columns = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Column ${i + 1}`, x, 1.5, 6.0, 3.6, c[3]);
  icon(s, c[0], x + 0.25, 1.68, 0.68, c[2]);
  txt(s, `Column head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 18, fontFace: "Cambria" } },
  ], { x: x + 1.12, y: 1.66, w: 4.75, h: 0.75, valign: "middle" });
  txt(s, `Column text ${i + 1}`, bullets(c[5], size || 14), { x: x + 0.3, y: 2.6, w: 5.45, h: 2.4, paraSpaceAfter: 6 });
});
// Three tinted cards across the slide, each with an icon, a small label, a heading and a bullet list.
const cards3 = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `Card ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
  icon(s, c[0], x + 0.22, 1.66, 0.62, c[2]);
  txt(s, `Card head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 17, fontFace: "Cambria" } },
  ], { x: x + 1.0, y: 1.62, w: 2.85, h: 0.72, valign: "middle" });
  txt(s, `Card text ${i + 1}`, bullets(c[5], size || 13.5), { x: x + 0.25, y: 2.55, w: 3.5, h: 2.45, paraSpaceAfter: 6 });
});
// A table with a bold navy first column.
const table = (s, header, list, colW, extra) => s.addTable(
  [head(header), ...list.map((r) => r.map((c, k) => (k === 0 ? { text: c, options: { bold: true, color: HEX.navy } } : { text: c })))],
  tableOpts(colW, extra));

const WHY = "Why protection travels with the data";
const WHAT = "What the program builds";
const WHO = "Who runs it";
const HOW = "How to roll it out and evidence it";

// ------------------------------------------------------------------ Title
{
  const T = "Protection That Travels With the Data";
  const s = D.titleSlide(WHY, T, "Book 20 — Information Protection & Microsoft Purview");
  // The book is a draft: say so before anything else on the slide.
  box(s, "Draft notice", 0.8, 0.55, 7.4, 0.75, "FFFFFF", HEX.red);
  txt(s, "Draft notice text", [
    { text: "DRAFT BOOK, AWAITING THE EDITOR'S REVIEW.  ", options: { bold: true, color: HEX.red } },
    { text: "Not part of Release 2.0, the baseline edition. Recheck it after the review." },
  ], { x: 1.0, y: 0.6, w: 7.05, h: 0.65, fontSize: 14, valign: "middle", color: HEX.ink });
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing for CIOs, CISOs, data owners, privacy officials and ISSOs", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8.6, h: 0.8, fontSize: 16 });
  narrate(s, T, "index (Status — draft book); Chapter 01 — Data Inventory and Classification (opening).");
}

// ------------------------------------------------------------------ Why 1
{
  const T = "Upstream controls can't see the payload";
  const s = slide(WHY, "Why", T);
  rows(s, "Prop", "WHY PERIMETER THINKING FAILS FOR DATA", [
    ["Data moves", "Export, attachment, OneDrive, chat, AI summary: no copy inherits the original's access controls"],
    ["Containers, not content", "Read access to a site is read access to everything in it"],
    ["Unnamed data", "A DLP rule, an auto-labeling policy and an encryption setting each need a class"],
  ], 1.95, 1.05, 0.92, 14);
  sideBox(s, "Label", "FaFileShield", HEX.red, HEX.redTint, "WHAT A SENSITIVITY LABEL IS", "Protection that travels", [
    "Stored in clear text in the item's metadata",
    "Persistent: stays with the content wherever it's stored",
    "Encryption applied by a label goes with the content",
    "CISA's Data pillar: inventory, categorization, availability, access, encryption",
  ], 14);
  callout(s, "Class", 5.35, 1.15, "FaTriangleExclamation", HEX.red, "A label is only as good as its class: ",
    "product defaults with no federal class behind them give users a choice they can't make correctly, and DLP a condition that means nothing to an assessor.");
  sources(s, "Sources: CISA ZTMM v2.0 §5.5; Microsoft Learn, Learn about sensitivity labels; NIST SP 800-53 Rev. 5 (AC-16, MP-3, CM-12, RA-2), release 5.2.0. Book 20, Chapter 01.");
  narrate(s, T, "Chapter 01 — Data Inventory and Classification (opening; Why protection has to travel with the data).");
}

// ------------------------------------------------------------------ Why 2
{
  const T = "Decide the classes before any label";
  const s = slide(WHY, "Why", T);
  table(s, ["Federal decision", "What decides it"], [
    ["CUI categories held; Basic or Specified", "32 CFR Part 2002 and the CUI Registry"],
    ["Category markings on CUI Basic", "Agency policy: optional for Basic, mandatory for Specified"],
    ["Which records are Privacy Act records", "The Privacy Act and the agency's system of records notices"],
    ["How long each class is kept", "Records schedules under the Federal Records Act"],
    ["Impact level of the holding system", "FIPS 199 and SP 800-60; CUI Basic: confidentiality at least moderate"],
    ["Which cloud a class may live in", "The authorization boundary and the tenant's cloud"],
  ], [2.6, 4.3], { y: 1.5, fontSize: 12, rowH: [0.38, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52] });
  tableBox(s, "Reg", "FaTableList", HEX.red, HEX.redTint, "The class register", [
    "One row per class; every label, DLP rule and policy cites it",
    "A handling outcome a control can enforce",
    "A data owner: an official, not an administrator",
    "An authority, a detection method, a review date",
  ], 3.62);
  callout(s, "Outcome", 5.3, 1.2, "FaClipboardCheck", HEX.red, "“Sensitive” isn't an outcome: ",
    "“encrypted so only the named authorized-holder group can open it, never sent outside the tenant” is. Write each outcome as the sentence an assessor would test, and mark CUI with the Registry's markings, not house terms.");
  sources(s, "Sources: 32 CFR Part 2002 (§§2002.4, 2002.14(g), 2002.20(b)); FIPS 199; NIST SP 800-60 Vol. 1 Rev. 1; Microsoft Learn, Learn about sensitivity labels. Book 20, Chapter 01.");
  narrate(s, T, "Chapter 01 — Data Inventory and Classification (The authoritative data classes; Who owns a class; The federal overlay decisions).");
}

// ------------------------------------------------------------------ What 1
{
  const T = "Three boundaries, four planes, a small taxonomy";
  const s = slide(WHAT, "What", T);
  table(s, ["Label (group / label)", "Class", "Encryption"], [
    ["Public", "Public", "None"],
    ["Internal", "Uncontrolled, not for release", "None"],
    ["CUI / CUI Basic", "CUI Basic", "Tenant users, set by administrators"],
    ["CUI / CUI//<category>", "Only where agency policy requires it", "Tenant users"],
    ["CUI / CUI//SP-<category>", "One per specified authority held", "Named authorized-holder group"],
    ["Sites / three site labels", "Container classes", "None: container settings"],
  ], [2.45, 2.35, 2.1], { y: 1.5, fontSize: 12, rowH: [0.38, 0.5, 0.5, 0.5, 0.55, 0.55, 0.5] });
  tableBox(s, "Arch", "FaSitemap", HEX.navy, HEX.navyTint, "The reference architecture", [
    "Boundaries: the tenant, the managed endpoint, outside",
    "Planes: identity, policy, protection, monitoring",
    "Each plane has its own owner",
    "Five main labels or fewer; five sublabels or fewer",
  ], 3.48);
  callout(s, "Encrypt", 5.2, 1.3, "FaLock", HEX.navy, "A label that doesn't encrypt protects nothing outside the tenant: ",
    "it's a classification signal, enough for most classes and wrong for CUI Specified. Encryption grants rights to mail-enabled groups, never to individuals.");
  sources(s, "Sources: Microsoft Learn (Learn about sensitivity labels; label groups; labels for groups and sites); 32 CFR Part 2002 §2002.20(b). Book 20, Chapter 02.");
  narrate(s, T, "Chapter 02 — Sensitivity Label Architecture (The reference architecture; The taxonomy: from classes to labels; Encryption settings).");
}

// ------------------------------------------------------------------ What 2
{
  const T = "Defaults users rarely notice, containers that hold";
  const s = slide(WHAT, "What", T);
  columns(s, [
    ["FaListCheck", "LABEL POLICIES", HEX.navy, HEX.navyTint, "Justified defaults", [
      "Documents, email and meetings default to Internal",
      "New groups and sites default to Internal site",
      "Never default to an encrypting label",
      "Mandatory labeling: change a label, never remove it",
    ]],
    ["FaUsersGear", "CONTAINER LABELS", HEX.teal, HEX.tealTint, "Three site labels", [
      "Internal site, CUI site, CUI Specified site",
      "Privacy, guests, sharing, unmanaged devices, links",
      "Items inside don't inherit the container's label",
      "Unmanaged-device setting needs its Conditional Access policy",
    ]],
  ], 14);
  callout(s, "GCC", 5.3, 1.2, "FaCloud", HEX.navy, "In GCC: ",
    "manual, mandatory and container labels are listed as available. The SharePoint library default label is in development, and authentication contexts on labeled sites are on the engineering backlog, as in GCC High and DoD.");
  sources(s, "Sources: Microsoft Learn (Learn about sensitivity labels; labels in Office apps; labels for groups and sites; government planning pages). Book 20, Chapters 03 and 04.");
  narrate(s, T, "Chapter 03 — Label Publication and Defaults (Defaults the agency can justify; Mandatory labeling and the downgrade justification; Prerequisites); Chapter 04 — Teams, Groups and SharePoint Containers (What a container label does, and what it doesn't; Container classes and their settings; Prerequisites).");
}

// ------------------------------------------------------------------ What 3
{
  const T = "Encrypt, and keep a tested way back in";
  const s = slide(WHAT, "What", T);
  cards3(s, [
    ["FaKey", "RIGHTS MANAGEMENT", HEX.navy, HEX.navyTint, "Recovery, just in time", [
      "Usually already on: decide who may encrypt",
      "Super user feature off, no standing members",
      "Enabled through a PIM-approved role; user added individually",
      "Quarterly decryption-continuity test",
    ]],
    ["FaRightLeft", "MESSAGE ENCRYPTION", HEX.teal, HEX.tealTint, "Labels and rules", [
      "Labels carry classification; rules carry scenarios",
      "Included in E3 and E5, G3 and G5",
      "Expiry and revocation: Advanced Message Encryption",
      "Encrypted test to a mailbox outside the tenant",
    ]],
    ["FaDatabase", "SHAREPOINT AND ONEDRIVE", HEX.amber, HEX.amberTint, "Integration first", [
      "Label integration on before encrypting labels go wide",
      "Until then: no search, eDiscovery or DLP on encrypted files",
      "No expiry or Double Key Encryption in collaboration",
      "Move IRM libraries to labels, one by one",
    ]],
  ], 13.5);
  callout(s, "Cache", 5.3, 1.2, "FaUserClock", HEX.navy, "Why not a PIM-managed super user group? ",
    "the service caches group membership for up to three hours, so access arrives late and lingers. In GCC, Rights Management, message encryption and encrypted co-authoring are listed as available.");
  sources(s, "Sources: Microsoft Learn (Activate Azure Rights Management; super users; Message Encryption; labels in SharePoint and OneDrive; GCC planning page). Book 20, Chapters 05–07.");
  narrate(s, T, "Chapter 05 — Rights Management and Recovery (What the service does; Decide: activation, onboarding and recovery; Why the super user is added individually; Validate: the decryption-continuity test); Chapter 06 — Exchange Message Encryption (Two mechanisms, one service; Prerequisites); Chapter 07 — SharePoint and OneDrive (What label integration changes; Decide).");
}

// ------------------------------------------------------------------ What 4
{
  const T = "DLP from an owner's outcome, auto-labeling for the rest";
  const s = slide(WHAT, "What", T);
  columns(s, [
    ["FaShieldHalved", "DATA LOSS PREVENTION", HEX.red, HEX.redTint, "One outcome, one owner", [
      "Each rule written from the policy owner's outcome",
      "Labels first; content patterns are the safety net",
      "Overrides logged and read weekly",
      "Exceptions group-based, registered, expiring within a year",
    ]],
    ["FaFilter", "AUTO-LABELING", HEX.amber, HEX.amberTint, "Climb the classifier ladder", [
      "Built-in types, custom types, exact data match, trainable",
      "High confidence with low counts; proximity about 300 characters",
      "Client-side recommends; service-side applies at rest and in mail",
      "Disabling a policy doesn't remove the labels it applied",
    ]],
  ], 14);
  callout(s, "GCC", 5.3, 1.2, "FaCloud", HEX.amber, "In GCC: ",
    "DLP for files, email, Teams and Windows endpoints, auto-labeling for Exchange, SharePoint and OneDrive, and exact data match are listed as available. The simulation dashboard isn't listed separately: confirm it in a GCC test tenant.");
  sources(s, "Sources: Microsoft Learn (DLP simulation; endpoint DLP; sensitive information types; exact data match; auto-labeling; GCC planning page). Book 20, Chapters 08 and 09.");
  narrate(s, T, "Chapter 08 — DLP and Endpoint Controls (Design from data outcomes; Policy tips, overrides and justification; Exceptions without holes; Endpoint DLP on Windows; Prerequisites); Chapter 09 — Auto-Labeling and Sensitive Information Types (The classifier ladder; Confidence, count and proximity; Client-side and service-side auto-labeling; Prerequisites).");
}

// ------------------------------------------------------------------ What 5
{
  const T = "Audit is the floor; insider risk needs a charter";
  const s = slide(WHAT, "What", T);
  table(s, ["", "Audit (Standard)", "Audit (Premium)"], [
    ["Default retention", "180 days", "One year: Entra ID, Exchange, OneDrive, SharePoint (licensed users)"],
    ["Longest retention", "180 days", "Ten years, with the add-on"],
    ["Retention policies", "No", "Up to 50 per organization"],
    ["Whose license counts", "—", "The user who acted"],
  ], [1.9, 1.6, 3.4], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.78, 0.6, 0.6, 0.6] });
  tableBox(s, "Charter", "FaScaleBalanced", HEX.teal, HEX.tealTint, "Insider risk: the charter first", [
    "Purpose: CISO and insider threat lead",
    "Notice and privacy: senior agency official for privacy",
    "Represented employees: labor relations",
    "Viewing and escalation: general counsel",
    "Pseudonyms on; no one administers and investigates",
  ], 3.62, 13);
  callout(s, "Prove", 5.3, 1.2, "FaChartLine", HEX.navy, "Prove the pipeline: ",
    "a synthetic label event each month, searchable in the tenant and in the log platform. Both audit tiers, with one- and ten-year retention, are listed as available in GCC; turning auditing off blinds every other Purview signal.");
  sources(s, "Sources: Microsoft Learn (Purview Audit; Purview audit retention; Insider Risk Management; Communication Compliance); NIST SP 800-53 Rev. 5 (PM-12). Book 20, Chapter 10.");
  narrate(s, T, "Chapter 10 — Audit, Insider Risk and Communication Compliance (Audit is the floor; Routing audit data out of the tenant; The charter comes first; Role separation; Pseudonymization; Prerequisites).");
}

// ------------------------------------------------------------------ What 6
{
  const T = "AI inherits every permission error";
  const s = slide(WHAT, "What", T);
  rows(s, "Order", "HOW MICROSOFT 365 COPILOT PROTECTS DATA, IN ORDER", [
    ["Permissions", "Uses only content the user can already reach"],
    ["Encryption", "Needs both VIEW and EXTRACT to summarize an encrypted item"],
    ["Labels", "Shows the source's label; new content inherits the highest"],
    ["Excluded", "Content under Double Key Encryption is out of reach"],
  ], 1.95, 0.8, 0.7, 14);
  sideBox(s, "AIdec", "FaLightbulb", HEX.navy, HEX.navyTint, "THE AI DATA DECISIONS", "Before Copilot reaches users", [
    "Which AI apps are approved, for which data",
    "Which labels Copilot may process",
    "Which oversharing gets fixed first",
    "Which prompts are captured, and who may read them",
  ], 14);
  callout(s, "GCC", 5.35, 1.15, "FaCloud", HEX.navy, "In GCC: ",
    "Microsoft 365 Copilot and Purview's controls for it are listed as available; DSPM for AI sees Microsoft Copilot and supported AI sites. In GCC High, Copilot in Teams and SharePoint isn't currently available.");
  sources(s, "Sources: Microsoft Learn (Data protection and auditing for Microsoft Copilot; DSPM for AI; DLP for Copilot; Microsoft Copilot service description). Book 20, Chapter 11.");
  narrate(s, T, "Chapter 11 — AI Data Security (Why AI changes the problem, not the controls; The AI data decisions; DLP for Microsoft 365 Copilot; Prerequisites).");
}

// ------------------------------------------------------------------ What 7
{
  const T = "Government cloud: GCC first, then the side notes";
  const s = slide(WHAT, "What", T);
  table(s, ["Feature", "GCC", "GCC High and DoD"], [
    ["Manual, mandatory and container labels", "Available", "Available"],
    ["SharePoint library default label", "In development", "In development"],
    ["Authentication context on labeled sites", "Engineering backlog", "Engineering backlog"],
    ["Expiry and revocation (Advanced Message Encryption)", "Available", "GCC High available; not listed for DoD"],
    ["DLP, endpoint DLP, auto-labeling, exact data match", "Available", "Available"],
    ["Audit (Premium), one- and ten-year retention", "Available", "Available"],
  ], [3.0, 1.75, 2.15], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.5, 0.5, 0.5, 0.58, 0.58, 0.5] });
  tableBox(s, "Dep", "FaClipboardCheck", HEX.navy, HEX.navyTint, "A dependency, not a failure", [
    "A missing license or cloud feature goes in a decision record",
    "With a compensating control and its residual risk",
    "Status is subject to change: reread at each reassessment",
    "Not yet specified: test in that cloud's test tenant",
  ], 3.54, 13);
  callout(s, "Read", 5.3, 1.2, "FaLandmark", HEX.navy, "Read on Microsoft Learn on November 11, 2026: ",
    "where two Learn pages disagree, as they do on Insider Risk Management in GCC High, the decision record carries the conflict and the tenant treats the feature as unavailable.");
  sources(s, "Sources: Microsoft Learn (Plan for Microsoft Purview: GCC, GCC High and DoD deployments; Microsoft Purview service description), Nov. 11, 2026. Book 20, Chapters 01–12.");
  narrate(s, T, "index (Status — draft book); Chapter 01 (Government-cloud availability for the inventory; Decision record template); Chapters 03, 04, 06, 08, 09 and 10 (Prerequisites, availability tables); Chapter 05 (Prerequisites: GCC High and DoD DNS records); Chapter 11 (Prerequisites: the two Learn pages that disagree); Chapter 12 (Reassessment and the assessor's package).");
}

// ------------------------------------------------------------------ Who
{
  const T = "Six roles run information protection";
  const s = slide(WHO, "Who", T);
  const roles = [
    ["Policy owner", "Decides what the data is and how it's handled; approves exceptions", HEX.red, HEX.redTint],
    ["Platform owner", "Purview engineering lead; accountable for the configuration and baseline", HEX.navy, HEX.navyTint],
    ["Operator", "Makes each change through change control", HEX.navy, HEX.navyTint],
    ["Security monitor", "Triages DLP, insider risk and AI alerts daily", HEX.teal, HEX.tealTint],
    ["Help desk", "Answers users; never removes a label or decrypts a file", HEX.teal, HEX.tealTint],
    ["Assessor", "ISSO and independent assessor; accountable for the package", HEX.amber, HEX.amberTint],
  ];
  roles.forEach((r, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.1, y = 1.5 + row * 1.5;
    box(s, `Role ${i + 1}`, x, y, 3.95, 1.38, r[3]);
    txt(s, `Role ${i + 1} text`, [{ text: r[0], options: { bold: true, color: r[2], fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: r[1], options: { fontSize: 13 } }],
      { x: x + 0.22, y: y + 0.08, w: 3.55, h: 1.22, valign: "middle" });
  });
  txt(s, "Gates head", "THE SEPARATIONS THAT KEEP IT HONEST", { x: 0.6, y: 4.56, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Owners decide", "administrators configure what the owner decides, and never decide it themselves", HEX.navy],
    ["Recovery answers to the owner", "super user recovery reads content the policy owner governs", HEX.red],
    ["Watch the watchers", "in insider risk, no one both administers and investigates", HEX.teal],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.92, 3.95, 1.5, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 5.0, w: 3.55, h: 1.34, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-3, CM-4, PM-12), release 5.2.0; Microsoft Learn, Insider Risk Management permissions. Book 20, Chapters 01, 10 and 12.");
  narrate(s, T, "Chapter 01 (Who owns a class); Chapter 10 (Role separation); Chapter 12 — Operations and Evidence (RACI; Incident response for data events).");
}

// ------------------------------------------------------------------ How 1
{
  const T = "Roll out in rings, with a way back";
  const s = slide(HOW, "How", T);
  steps(s, "Ring", [["Inventory", "A dated snapshot"], ["Decide", "Signed decision record"], ["Build", "As code, test tenant"], ["Pilot", "Audit or simulation"], ["Enforce", "Ring by ring"], ["Validate", "Labeled sample, tests"]],
    [HEX.grey, HEX.redTint, HEX.navyTint, HEX.amberTint, HEX.amberTint, HEX.tealTint]);
  panels(s, [
    ["FaFilter", "DLP simulation is the pilot", HEX.amber, HEX.amberTint, ["Runs up to 15 days; its data is kept 30 days", "SharePoint and OneDrive: existing content too", "Exchange, Teams and devices: new items only"]],
    ["FaArrowsRotate", "Rollback, never deletion", HEX.red, HEX.redTint, ["Unpublish a label from its policy; never delete it", "A DLP policy goes back to simulation", "Disabling auto-labeling doesn't remove labels"]],
  ]);
  callout(s, "Snap", 5.25, 1.25, "FaTableList", HEX.amber, "Start where the risk is: ",
    "content explorer exports one type at a time, needs E5- or G5-level licensing, and its counts can take up to seven days to update, 14 for SharePoint files. Without the license, record the gap and use the tools the tenant has.");
  sources(s, "Sources: Microsoft Learn (Content Explorer; Purview service description; DLP simulation; auto-labeling); NIST SP 800-53 Rev. 5 (CM-3, CM-4). Book 20, Chapters 01, 08, 09 and 12.");
  narrate(s, T, "Chapter 01 (Inventory: find where the data already is); Chapter 02 (How: build the taxonomy in a test tenant); Chapter 08 (Simulation is the pilot); Chapter 09 (Rollback); Chapter 12 (Change control for information protection; Implementation checklist).");
}

// ------------------------------------------------------------------ How 2
{
  const T = "Evidence an assessor can inspect";
  const s = slide(HOW, "How", T);
  table(s, ["Closure-map row", "Finding family", "Minimum evidence"], [
    ["CM-12", "No labels, defaults or containers", "Policy export and a labeled sample: file, email and container"],
    ["CM-13", "Rights Management and mail encryption", "Decryption-continuity and message-encryption tests; transport-rule export"],
    ["CM-14 (part)", "Audit and visibility gaps", "Synthetic events found by audit search and in the log platform"],
  ], [1.4, 2.2, 3.3], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.95, 0.95, 0.95] });
  tableBox(s, "Metrics", "FaChartLine", HEX.amber, HEX.amberTint, "Measure protection, not settings", [
    "Labeled share of sensitive content",
    "Container label coverage of CUI sites",
    "DLP true-positive and override rates",
    "Recovery, audit-search and encrypted-mail test passes",
  ], 3.62);
  callout(s, "Drift", 5.3, 1.2, "FaCodeBranch", HEX.amber, "Drift is any difference no change ticket explains: ",
    "a monthly dated export of labels, policies, auto-labeling, DLP, audit status and the Rights Management configuration is the baseline. The package supports the controls it maps to; the assessor or authorizing official decides.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-3, CM-12, AC-16), release 5.2.0; CISA ZTMM v2.0; OMB M-22-09; FedRAMP KSIs. Book 20, Chapter 12 and App. A.");
  narrate(s, T, "Chapter 12 — Operations and Evidence (The configuration baseline; Drift detection; Reassessment and the assessor's package; Evidence catalog; Metrics); Appendix A — Requirements Mapping (Compliance-enabling, not a compliance claim; The closure-map rows Book 20 carries).");
}

// ------------------------------------------------------------------ Close
{
  const T = "Decisions to make, and next steps";
  const s = slide(HOW, "How", T);
  const asks = [
    ["FaTableList", "Name the classes and their owners", "A small register from the CUI Registry, with a testable outcome per class", HEX.red, HEX.redTint],
    ["FaListCheck", "Publish a small taxonomy, safe defaults", "Non-encrypting defaults, mandatory labeling, three container labels", HEX.navy, HEX.navyTint],
    ["FaKey", "Keep a tested way back in", "Super user feature off; recovery through PIM; quarterly decryption test", HEX.teal, HEX.tealTint],
    ["FaClipboardCheck", "Decide AI and evidence before rollout", "Copilot label exclusions, oversharing fixes, a monthly baseline", HEX.amber, HEX.amberTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaRoute", HEX.navy, "Next step, before anyone sees a label: ",
    "draft the class register and the decision records, run a dated inventory with what the tenant already licenses, and confirm each feature for the agency's own cloud. The book is a draft: recheck it after the editor's review.");
  sources(s, "Sources: 32 CFR Part 2002; Microsoft Learn (Learn about sensitivity labels; Purview government planning pages), read Nov. 11, 2026. Book 20, Chapters 01–12.");
  narrate(s, T, "Chapters 01 (Key takeaways; Decision record template), 02 and 03 (Key takeaways), 05 (Decide: activation, onboarding and recovery), 11 (The AI data decisions) and 12 (Operating cadence; Key takeaways); index (Status — draft book).");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Microsoft Learn (read November 11, 2026): Learn about sensitivity labels; Manage sensitivity labels in Office apps; Migrate parent sensitivity labels to label groups; Use sensitivity labels to protect collaborative workspaces; default sharing links; Content Explorer and data explorer; Export-ContentExplorerData; Activate the Azure Rights Management service; super users; Message Encryption and mail flow rules; sensitivity labels in SharePoint and OneDrive.",
    "Microsoft Learn, continued: DLP planning, simulation mode, policy tips and endpoint DLP; sensitive information types, exact data match and auto-labeling; Purview Audit, audit retention and the Management Activity API; Insider Risk Management and Communication Compliance; Data protection and auditing for Microsoft Copilot; DSPM for AI; DLP for Microsoft 365 Copilot; Microsoft Purview service description; Microsoft Copilot service description; Plan for Microsoft Purview: GCC, GCC High and DoD deployments.",
    "Federal: 32 CFR Part 2002 (as in effect October 1, 2026); FIPS 199; NIST SP 800-60 Vol. 1 Rev. 1; NIST SP 800-53 Rev. 5, release 5.2.0; OMB M-22-09; OMB M-26-14; CISA BOD 25-01; CISA ZTMM v2.0 (April 2023); FedRAMP KSIs (Consolidated Rules for 2026).",
    "Status: a draft awaiting the editor's review, not part of Release 2.0, the baseline edition. Every external claim was checked against a primary source on November 11, 2026; government-cloud feature status is subject to change.",
    "Full footnotes with links and access dates: Book 20, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b20-information-protection/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}

if (slideNo !== SAY.length) throw new Error(`narration.json has ${SAY.length} entries but the deck narrates ${slideNo} slides`);
console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
