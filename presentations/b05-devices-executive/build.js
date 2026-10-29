// Book 05 — Devices & Endpoints: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CIO, the CISO, the endpoint program lead and the program's sponsors. Decision-centered:
// every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B05_Devices_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b05-devices/, named in the notes. Decision owners come from
// the book's responsibility matrix (Chapter 06); the doctrine, pillars, paths, phases and durations, rings and exception
// rules are the book's program design and planning estimates, labeled as such. Where the book gives no date for a
// decision, the "When" names the event that triggers it, as design guidance.
// Diagrams are the committed PNGs in docs/images/diagrams/b05-devices/png/; alt text is read from the chapters'
// fig-alt so it stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 05", title: "Devices & Endpoints",
  footer: "Federal Modernization Workbook  ·  Book 05 Devices & Endpoints  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B05_Devices_Executive.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's notes are edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const perSlide = [];
const narrate = (s, body, ref) => {
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  perSlide.push(words);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// ---------------------------------------------------------------- checks
// Slide titles stay at or under 58 characters, and each narrated title must match narration.json.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// A conservative text-fit estimate (Calibri at about 0.55 em per character), used to size the panels and to
// print a "!" warning at build time when text may overflow its box.
const lineH = (pt) => (pt / 72) * 1.2;
const linesFor = (chars, w, pt) => Math.max(1, Math.ceil((chars * 0.55 * pt / 72) / Math.max(0.3, w)));
const needFor = (paras, w, pa) => paras.reduce((h, p) => h + linesFor(p.chars, w - (p.bullet ? 0.3 : 0.05), p.size) * lineH(p.size) + (pa || 0) / 72, 0);
const parasOf = (t, size) => {
  if (typeof t === "string") return [{ chars: t.length, size, bullet: false }];
  const out = []; let cur = { chars: 0, size: 0, bullet: false };
  t.forEach((r) => {
    const o = r.options || {}; const sz = o.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / Math.max(cur.size, sz)); cur.bullet = cur.bullet || !!o.bullet;
    if (o.breakLine || o.bullet) { out.push(cur); cur = { chars: 0, size: 0, bullet: false }; }
  });
  if (cur.chars) out.push(cur);
  return out.map((p) => Object.assign(p, { size: p.size || size }));
};
const T = (s, name, t, o) => {
  const need = needFor(parasOf(t, o.fontSize || 14), o.w, o.paraSpaceAfter);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name}: text may overflow (needs ${need.toFixed(2)} in, has ${o.h.toFixed(2)})`);
  return txt(s, name, t, o);
};
const sources = (s, text) => {
  if (text.length > 170) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// ---------------------------------------------------------------- diagrams
// The committed PNG, scaled to fit (maxW x maxH), centered in its area; alt text from the chapter's fig-alt.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b05-devices");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b05-devices", "png");
const CHAPTERS = fs.readdirSync(BOOK).filter((f) => /^\d\d-.*\.md$/.test(f)).map((f) => fs.readFileSync(path.join(BOOK, f), "utf8")).join("\n");
const altFor = (name) => {
  const m = CHAPTERS.match(new RegExp(`svg/${name}\\.svg\\)\\{[^}]*fig-alt="([^"]+)"`));
  if (!m) throw new Error(`no fig-alt found in the chapters for ${name}`);
  return m[1];
};
const figure = (s, name, x, maxW, maxH, top) => {
  const file = path.join(PNG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  const H = maxH || 3.6, y0 = top || 1.5;
  let w = maxW, h = maxW / ar;
  if (h > H) { h = H; w = H * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y: y0 + (H - h) / 2, w, h, altText: altFor(name) });
  return { w, h };
};

// ---------------------------------------------------------------- layout helpers
// The decision bar: every decision slide states the decision, its owner and when it's needed.
const decision = (s, what, owner, when) => {
  const y = 5.3, h = 1.2;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.82, y + 0.25, 0.7, HEX.amber);
  const col = (name, x, w, label, text, color) => T(s, name, [
    { text: label, options: { bold: true, color, fontSize: 11, charSpacing: 1, breakLine: true } },
    { text, options: { fontSize: 14, color: HEX.ink } },
  ], { x, y: y + 0.08, w, h: h - 0.16, valign: "middle" });
  col("Decision", 1.75, 6.55, "DECISION", what, HEX.amber);
  col("Owner", 8.5, 2.1, "OWNER", owner, HEX.teal);
  col("When", 10.7, 1.95, "WHEN", when, HEX.navy);
};
// The bottom callout for a context slide (no decision on it), the same size and place as the decision bar.
const takeaway = (s, iconName, color, label, text) => D.callout(s, "Takeaway", 5.3, 1.2, iconName, color, label, text);
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h, w) => {
  const W = w || 6.2;
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: W, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, W, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: W - 0.3, h, fontSize: 13.5, valign: "middle" });
  });
};
// A tinted box with an icon, a heading and a bullet list, sized to its content (default x 7.75 to 12.75).
const sideBox = (s, prefix, iconName, color, tint, heading, list, o = {}) => {
  const x = o.x || 7.75, w = o.w || 5.0, size = o.size || 13.5, y = o.y || 1.5;
  const listNeed = needFor(parasOf(bullets(list, size), size), w - 0.45, 6);
  const h = Math.max(o.minH || 0, Math.round((0.92 + listNeed + 0.2) * 100) / 100);
  if (y + h > 5.12) console.warn(`  ! slide ${pres.slides.length} ${prefix} box runs past the decision bar (bottom ${(y + h).toFixed(2)} in)`);
  box(s, `${prefix} box`, x, y, w, h, tint);
  icon(s, iconName, x + 0.25, y + 0.16, 0.6, color);
  T(s, `${prefix} head`, heading, { x: x + 1.0, y: y + 0.16, w: w - 1.15, h: 0.6, bold: true, color, fontSize: 16.5, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size), { x: x + 0.25, y: y + 0.92, w: w - 0.45, h: listNeed + 0.1, paraSpaceAfter: 6 });
  return h;
};
// A row of equal cards, each with an icon, a bold lead and a sentence.
const cards = (s, prefix, list, y, h) => {
  const gap = 0.2, w = (12.15 - gap * (list.length - 1)) / list.length;
  list.forEach((c, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i}`, x, y, w, h, c[2]);
    icon(s, c[0], x + 0.2, y + 0.2, 0.55, c[1]);
    T(s, `${prefix} ${i} text`, [{ text: c[3], options: { bold: true, color: c[1], breakLine: true } }, { text: c[4] }],
      { x: x + 0.95, y: y + 0.1, w: w - 1.1, h: h - 0.2, fontSize: 13.5, valign: "middle" });
  });
};
// A table on the left (x 0.6) with a navy header row; warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize, y) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  const top = y || 1.5, bottom = top + rowH.reduce((a, b) => a + b, 0);
  if (bottom > 5.12) console.warn(`  ! slide ${pres.slides.length} table runs past the decision bar (bottom ${bottom.toFixed(2)} in)`);
  return s.addTable([head(header), ...body], tableOpts(colW, { y: top, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why Group Policy can't come to the cloud", S_WHAT = "What a governed device requires",
  S_WHO = "Who owns the endpoint", S_HOW = "How to sunset, migrate and evidence it";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "Devices & Endpoints: the executive briefing", "Book 05 — Devices & Endpoints  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CIO, CISO, endpoint program lead and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 05 of the Federal Modernization Workbook, Devices and Endpoints. It runs about thirty minutes, for the people who decide how the fleet moves: the CIO, the CISO, the endpoint program lead and the program's sponsors.

The argument fits in three sentences. For twenty years Group Policy governed devices by their position in the directory, and that position quietly did the targeting, precedence, delegation, timing and evidence; none of it exists in the cloud, so each job has to be rebuilt on purpose. Hybrid join looks like progress but is a waypoint, not an end state. And servers take a different road, through Azure Arc, because Intune doesn't manage Windows Server.

I'll take four questions: why Group Policy can't come to the cloud; what a governed device requires; who owns the endpoint; and how to sunset Group Policy, bring servers under Arc, and run and evidence the fleet.

Two labels run through the deck, as they do through the book. The doctrine, the pillars, the phases and their durations, the rings and the exception rules are program design: a starting posture and planning estimates, not federal requirements. And product statements and dates are as the book checked them, on October 20, 2026.

Every decision slide names the decision, its owner and when it's needed, and the last slide gathers them into one table.`,
  "Book 05, index; Chapter 01 — Why Group Policy Can't Come to the Cloud (The Why in five sentences); Chapter 02 — The Hybrid Join Trap (What this chapter establishes); Chapter 09 — Servers Under Azure Arc (opening).");
}

// ------------------------------------------------------------------ Tracks: this book is the Intune and Arc tracks
{
  const s = content(S_WHY, "Book 05 is the Intune and Arc tracks: devices, servers");
  tag(s, "Why");
  const tracks = [
    ["FaLaptop", "Intune track: end-user devices", HEX.teal, HEX.tealTint, [
      ["Source: ", "device provisioning (Autopilot group tag, enrollment), never HR"],
      ["Read by: ", "dynamic device groups, assignment filters, compliance, Conditional Access"],
      ["Done when: ", "policy targets those attributes; computer-side GPO links disabled one population at a time, rollback tested"]]],
    ["FaServer", "Arc track: servers", HEX.navy, HEX.navyTint, [
      ["Source: ", "Arc onboarding tags and resource group, then Azure Policy"],
      ["Read by: ", "machine configuration, Update Manager, Defender for Servers, Azure RBAC"],
      ["Done when: ", "every in-scope server Arc-enabled and tagged, its baseline evaluated by Azure Policy"]]],
  ];
  tracks.forEach((c, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Track ${i + 1}`, x, 1.5, 6.0, 3.45, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.6, c[2]);
    T(s, `Track ${i + 1} head`, c[1], { x: x + 0.98, y: 1.63, w: 4.9, h: 0.6, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    T(s, `Track ${i + 1} text`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], bullet: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.33, w: 5.6, h: 2.57, fontSize: 13.5, paraSpaceAfter: 6 });
  });
  D.callout(s, "Split", 5.08, 1.0, "FaRightLeft", HEX.amber, "Group Policy splits: ",
    "user settings go with people (Book 03's HR track, Conditional Access); computer settings go with devices and servers. A device rule can't read its owner.");
  T(s, "Requirements", [{ text: "Federal requirements:  ", options: { bold: true, color: HEX.navy } },
    { text: "NIST SP 800-53 CM-2, CM-6, CM-7, CM-8, SI-2 (Book 05, Ch 10); SA-22 and OMB M-22-09 §III.A–B, device signal and inventory (Book 01, Appendix A)" }],
    { x: 0.6, y: 6.16, w: 12.15, h: 0.42, fontSize: 11.5, valign: "middle" });
  sources(s, "Sources: Book 05, Ch 03, 04, 07, 08, 09, 10; attribute-driven migration guide (dynamic rules, Intune assignment). Full citations in the backup.");
  narrate(s,
`First, where this book sits. The series moves four populations of identity to the cloud, each on its own track with its own source of truth, and Book 05 carries two of them: the Intune track for end-user devices, and the Arc track for servers.

The Intune track's attributes come from device provisioning: the Autopilot registration and its group tag, Intune enrollment, and writes by the device provisioning service to the Entra device object's extension attributes. They don't come from HR, and a dynamic device rule can read only device attributes, never the attributes of the device's owner. Dynamic device groups, assignment filters, compliance and Conditional Access device filters read them. As program design guidance, the track is done when every managed device carries attributes written by provisioning, its policy is targeted by them, and computer-side GPO links are disabled population by population, with rollback tested.

The Arc track's attributes are the tags and resource group applied when a server is onboarded with the Connected Machine agent, then Azure Policy. Machine configuration, Update Manager scoping, Defender for Servers and Azure RBAC read them. It's done when every in-scope server is Arc-enabled with its tag taxonomy applied and its baseline assigned and evaluated by Azure Policy.

Group Policy splits the same way. User-configuration settings move with people, to user-targeted Intune policy and Conditional Access, which is Book 03's HR track and Book 04. Computer-configuration settings move with devices, to Intune device policy, and with servers, to Azure Policy and machine configuration.

The evidence supports SP 800-53 CM-2, CM-6, CM-7, CM-8 and SI-2, which Chapter 10 maps, and Book 01's Appendix A ties device inventory and the device signal to M-22-09.`,
  "Book 05, Chapter 03 (one source per device fact; not the primary user's department); Chapter 04 (group tags); Chapter 07 (unlink one population at a time); Chapter 08 (attribute targeting, assignment filters); Chapter 09 (tags, Azure Policy, Update Manager, Defender for Servers); Chapter 10 (CM-2, CM-6, CM-7, CM-8, SI-2). The attribute-driven migration guide (device rules can't read the owner's attributes; user settings to user groups). Book 01, Appendix A (M-22-09 §III.A–B; SA-22). Success criteria are program design guidance.");
}

// ------------------------------------------------------------------ Coverage: which platforms Intune and Arc reach, and the tiers
{
  const s = content(S_WHY, "What Intune and Arc cover, and the strategy for the rest");
  tag(s, "Why");
  const R = [
    ["Windows 11, Windows 365, Azure Virtual Desktop", "Intune (Virtual Desktop with limits)"],
    ["macOS, iOS and iPadOS", "Intune, through Apple Business Manager"],
    ["Android Enterprise", "Intune: work profile, fully managed, dedicated"],
    ["Linux desktop (Ubuntu, Red Hat)", "Intune, limited: compliance checks"],
    ["ChromeOS", "Intune inventory only; Google Admin manages"],
    ["Windows Server 2016–2025; Linux servers", "Arc, with the Connected Machine agent"],
    ["VMware vSphere VMs", "Arc-enabled vSphere through vCenter"],
    ["AWS EC2 and GCP VMs", "Arc agent or multicloud connector (GCP in preview)"],
    ["Azure VMs", "Native Azure: Policy, RBAC, tags; not Arc"],
    ["AIX, Solaris, mainframe, network gear, printers, IoT", "Neither: tiers 2 to 4"],
  ];
  s.addTable([head(["Platform", "Covered by"]), ...R.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: r[1].startsWith("Neither"), color: r[1].startsWith("Neither") ? HEX.red : HEX.ink } }])],
    tableOpts([3.2, 4.2], { y: 1.45, fontSize: 11.5, rowH: [0.34, 0.48, 0.29, 0.29, 0.29, 0.29, 0.48, 0.29, 0.29, 0.29, 0.48] }));
  box(s, "Tiers box", 8.2, 1.45, 4.55, 4.55, HEX.amberTint);
  T(s, "Tiers head", [
    { text: "FOR WHAT'S LEFT: FOUR TIERS (DESIGN GUIDANCE)", options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } },
    { text: "One source of truth for every device", options: { bold: true, color: HEX.amber, fontSize: 16, fontFace: "Cambria" } },
  ], { x: 8.4, y: 1.55, w: 4.2, h: 0.8, valign: "middle" });
  const tiers = [
    "Managed by Intune or Arc: the default",
    "The platform's own tool, with an evidence feed; the CMDB holds the attributes (ChromeOS, network gear, mainframe, ESXi hosts)",
    "Discovered and monitored only: Defender discovery, network access control, CDM feeds",
    "Segmented and isolated, or retired, with a risk acceptance and a date",
  ];
  T(s, "Tiers list", tiers.map((t, k) => ({ text: `${k + 1}  ${t}`, options: { breakLine: k < tiers.length - 1 } })),
    { x: 8.4, y: 2.45, w: 4.2, h: 3.45, fontSize: 13, paraSpaceAfter: 8 });
  T(s, "Requirements", [{ text: "Federal requirements:  ", options: { bold: true, color: HEX.navy } },
    { text: "NIST SP 800-53 CM-8: the inventory includes every component and counts none twice; a device in no tier is a finding (Book 05, Ch 03 and 10)" }],
    { x: 0.6, y: 6.16, w: 12.15, h: 0.42, fontSize: 11.5, valign: "middle" });
  sources(s, "Sources: Book 05, Ch 03 (Intune coverage; the four tiers) and Ch 09 (Which servers Arc reaches), per Microsoft Learn on Oct 29, 2026. Tiers: design guidance.");
  narrate(s,
`Why this matters: an inventory that covers only Windows isn't an inventory, and the federal inventory control asks for every component.

Intune isn't only for Microsoft platforms. It manages Windows 11, Windows 365 Cloud PCs and Azure Virtual Desktop, the last with limits; macOS, iOS and iPadOS through Apple Business Manager; Android Enterprise in its work-profile, fully managed and dedicated modes; and Ubuntu and Red Hat desktops, where management is compliance. ChromeOS shows up in Intune as inventory with remote actions, but enrollment and policy stay in the Google Admin console.

Azure Arc reaches servers wherever they run: Windows Server 2016 to 2025 and the supported Linux distributions, physical or on any hypervisor; VMware vSphere VMs through Arc-enabled vSphere and vCenter; and AWS EC2 and Google Cloud VMs, with the agent or the multicloud connector, which covers AWS, has GCP in preview and isn't available in Azure Government. Azure VMs don't take Arc at all; Microsoft says they already have the same capabilities. AIX, Solaris, mainframe operating systems, network devices, printers and IoT are on neither list.

So every class of device goes in one of four tiers, as program design guidance. One: managed by Intune or Arc, the default. Two: managed by the platform's own tool, with an evidence feed and the CMDB as the attribute source. Three: discovered and monitored only, through Defender device discovery, network access control and CISA's CDM feeds. Four: segmented and isolated, or retired, with a risk acceptance and a date. That's how the inventory meets CM-8: every component, none counted twice. A device in no tier is a finding.`,
  "Book 05, Chapter 03 (Which end-user devices Intune covers; What Intune and Arc don't reach, the four tiers, CM-8); Chapter 09 (Which servers Arc reaches); Chapter 10 (CM-8). Platform facts as Microsoft Learn documented them on October 29, 2026. The tiers are program design guidance.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "Group Policy governed by position; the cloud has none");
  tag(s, "Why");
  figure(s, "ch01-precedence-vs-assignment", 0.6, 4.7);
  sideBox(s, "Jobs", "FaSitemap", HEX.navy, HEX.navyTint, "Five jobs the OU tree did silently", [
    "Targeting: which settings a device gets",
    "Precedence: which setting wins",
    "Delegation: who may change it",
    "Timing: a refresh every 90 minutes",
    "Evidence: gpresult explains the result",
  ], { x: 5.55, w: 7.2 });
  takeaway(s, "FaTriangleExclamation", HEX.red, "A governance rebuild, not a settings migration.  ",
    "Every job the tree did implicitly has to be stated on purpose, starting with an attribute model that targeting can derive from.");
  sources(s, "Sources: Microsoft Learn — cloud-native endpoint planning; Group Policy processing; Intune policy conflicts and check-in timing. Book 05, Chapter 01; Book 02, Chapter 02.");
  narrate(s,
`For more than two decades, a Windows device joined to Active Directory got its configuration from Group Policy, and nobody had to design the governance model, because it came with the directory. A computer object sat in an organizational unit (OU), Group Policy Objects were linked to that OU and its parents, and the device applied them in a fixed order at startup and every 90 minutes after. Ask why a machine has a setting, and the answer was its position in the tree.

Microsoft's planning guidance says it plainly: traditional Group Policy enforcement isn't possible with cloud-native endpoints. An Entra-joined device has no computer object in an OU, no domain controller and no SYSVOL share.

The figure shows the difference. Group Policy resolved overlapping settings by position: the closest container won, and enforced links overrode. Intune has no hierarchy. Policies are assigned flatly to groups, two configuration policies that disagree produce a reported conflict where the setting may not apply at all, and devices check in about every eight hours rather than every ninety minutes.

So Group Policy was never only a settings engine; it was a governance model derived from one structure. Intune can deliver most of the settings. What it can't deliver by default is the governance around them, and that has to be rebuilt deliberately, starting with an attribute model that groups and filters derive from.`,
  "Book 05, Chapter 01 — Why Group Policy Can't Come to the Cloud (Governance that came free with the domain; What Group Policy did implicitly; There is no tree to sit in; The governance gaps this opens).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Running both isn't a safe middle ground");
  tag(s, "Why");
  rows(s, "Race", "WHO WINS WHEN GROUP POLICY AND INTUNE BOTH SET A SETTING", [
    ["GPO vs. MDM", "Group Policy wins by default"],
    ["MDMWinsOverGP", "Reverses it, only in the Policy CSP"],
    ["Other CSPs", "A race, with no guaranteed winner"],
    ["Two Intune policies", "Conflict reported; may not apply"],
  ], 1.9, 0.78, 0.66);
  sideBox(s, "Measure", "FaFilter", HEX.amber, HEX.amberTint, "Measure the gap; don't copy", [
    "Group Policy analytics measures, not closes",
    "No published \"percent mappable\" figure",
    "Microsoft: lift and shift isn't preferred",
    "Regenerate from today's requirements",
  ]);
  decision(s, "Record every setting that Group Policy and Intune both touch before Intune enforces it, with a retirement date for the GPO copy",
    "Endpoint engineering lead", "Before Intune enforces on a population");
  sources(s, "Sources: Microsoft Learn — Group Policy analytics; MDMWinsOverGP (Policy CSP); co-management workloads; cloud-native Windows tutorial. Book 05, Chapters 01 and 06.");
  narrate(s,
`The tempting middle ground is to run both: keep the GPOs and add Intune. A hybrid-joined device can take policy from either, or both, and Microsoft notes that adds overhead and complexity. It also adds precedence rules nobody sees.

Since Windows 10 version 1709, when Group Policy and MDM configure the same policy, Group Policy wins. A setting called MDMWinsOverGP reverses that, but only for policies in the Policy CSP. For settings defined elsewhere, Defender for example, Microsoft warns of a race condition with no guarantee which one wins. Windows Hello for Business shouldn't be configured through both at all. And between two Intune policies, "last writer wins" is simply wrong: the conflict is reported and the setting may not apply.

Microsoft's on-ramp, Group Policy analytics, imports GPO exports and shows how many settings have an MDM equivalent. It measures the gap; it doesn't close it. Figures like "30 to 60 percent mappable" circulate, but Microsoft publishes no such number; the answer depends on the agency's own GPOs. And Microsoft's own guidance argues against translating at all: identify the mandatory settings, compare them with MDM, and treat the gaps as blockers. The book calls that regenerate, not copy.

So the practical rule: every overlapping setting is written down before Intune policy reaches production, and the GPO copy has a retirement date. Retiring a Group Policy setting is the endpoint engineering lead's decision, with the CISO consulted.`,
  "Book 05, Chapter 01 (Group Policy analytics measures the gap; Running both is not a safe middle ground; What this chapter establishes, 4); Chapter 06 — Who Owns the Endpoint (responsibility matrix: Group Policy setting retirement).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Hybrid join is a waypoint, not a destination");
  tag(s, "Why");
  figure(s, "ch02-join-paths", 0.6, 4.8);
  sideBox(s, "Switch", "FaRightLeft", HEX.red, HEX.redTint, "A switch that looks like a program", [
    "A sync-scope change and one SCP per forest",
    "Then every device registers itself",
    "No ownership, position or approval check",
    "Moving to Entra join later needs a reset",
    "Still needs a domain controller in sight",
  ], { x: 5.65, w: 7.1 });
  decision(s, "Give every hybrid-joined device a target of Entra join and a trigger event, such as its refresh date, and set the domain-unjoin waves",
    "Sponsor and CIO (unjoin timing)", "Before the first hybrid-join wave");
  sources(s, "Sources: Microsoft Learn — hybrid join configuration and planning; device join types; Autopilot hybrid guidance. Book 05, Chapter 02; Chapter 06 (domain-unjoin timing).");
  narrate(s,
`A common Zero Trust control reads, in full, "all sign-in activity comes from managed devices." It's satisfied by a Conditional Access policy that grants access only from a compliant or hybrid-joined device. Assessments score it as a multi-quarter program. But converting a domain-joined Windows fleet to hybrid join is, mechanically, close to a single switch: extend the sync scope to the computer objects, publish one service connection point per forest, and every device registers itself on its own schedule. There's no per-device approval, no ownership check, and no check of where the device sits. The book's position is that this effortlessness is the hazard.

Microsoft's guidance has two halves. New, refurbished or reset Windows devices should be Entra joined by default; hybrid join for new devices is typically not recommended. Existing domain-joined devices can take hybrid join with minimal user impact, but Microsoft says it shouldn't be long term or the end goal.

Two facts make it sticky. There's no supported way to convert a hybrid-joined device to Entra join without resetting Windows, so the move belongs at a refresh, an upgrade or a rebuild. And hybrid-joined devices still need periodic line of sight to a domain controller; without it, password changes and TPM resets break.

So the waypoint needs an exit. Every hybrid-joined device carries a target of Entra join and a trigger event. The sponsor and CIO decide the domain-unjoin waves, because unjoining ends the fallback every other team relies on.`,
  "Book 05, Chapter 02 — The Hybrid Join Trap (A program that turns out to be a switch; How the fleet converts itself; What Microsoft recommends now; The governed path, 8); Chapter 06 — Who Owns the Endpoint (The roles: sponsor and CIO; responsibility matrix: domain-unjoin wave timing).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = content(S_WHY, "What an ungoverned flip loses, and never covers");
  tag(s, "Why");
  const ledger = [
    ["Ownership and position", "New device objects map to no owner"],
    ["One object per machine", "Duplicate and phantom records"],
    ["Scoped, gradual rollout", "Enforcing early locks users out"],
    ["Provenance", "Thousands of changes, none attributable"],
    ["Lifecycle", "Retired machines linger as \"managed\""],
  ];
  leftTable(s, ["Classic AD provided", "An ungoverned flip loses"], ledger.map((r) => [bold(r[0]), { text: r[1] }]),
    [2.75, 4.15], [0.42, 0.46, 0.46, 0.46, 0.46, 0.46], 12.5);
  sideBox(s, "Never", "FaPlugCircleXmark", HEX.amber, HEX.amberTint, "Hybrid join never covers", [
    "macOS, iOS, Android and Linux",
    "Personal and contractor devices",
    "Servers, kiosks and virtual desktops",
    "Domain controllers and Server Core",
  ]);
  decision(s, "Gate fleet-wide device-state changes on human approval, wave by wave, with the managed-device policy run in report-only until coverage is measured",
    "Endpoint lead per wave; CISO for enforcement", "Each wave");
  sources(s, "Sources: Microsoft Learn — hybrid join FAQ and planning; pending devices; stale devices; Conditional Access device policy template. Book 05, Chapters 02 and 06.");
  narrate(s,
`Classic Active Directory was a creaky governance system, but it was one. Done as an ungoverned switch, hybrid join keeps the runtime benefit, single sign-on and Conditional Access eligibility, and quietly spends the governance underneath. It also splits one machine's truth across three systems: Active Directory holds the computer object, Entra ID the device object, and Intune the compliance state, and nothing reconciles them by default.

The ledger on the left is what goes. New device objects appear with no owner or position. Duplicate and phantom records accumulate. Enforcing "compliant or hybrid joined" before registration finishes locks users out, which is why Microsoft's own template starts in report-only. Thousands of state changes happen with no attributable record. And retired machines linger, inflating the managed count; deleting a device object also deletes its BitLocker recovery keys.

And even a flawless rollout doesn't cover the control's real population. Hybrid join applies to domain-joined Windows only. macOS, iOS, Android and Linux need their own enrollment; personal and contractor devices are never hybrid joinable; servers, kiosks and virtual desktops each need a posture decision; and domain controllers and Server Core can't register at all.

The book's governed path reaches the same end state with each wave planned, dry-run, approved by a person and evidenced. Two owners hold it: the endpoint engineering lead makes each wave's go or no-go, and the CISO decides how Conditional Access uses compliance state, which runs in report-only until coverage is measured.`,
  "Book 05, Chapter 02 — The Hybrid Join Trap (The loss ledger; What hybrid join never covers; The governed path); Chapter 06 (responsibility matrix: pilot and wave go/no-go; Conditional Access use of compliance state).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Each fact about a device has one source");
  tag(s, "What");
  const facts = [
    ["Ownership and purpose", "Procurement or asset record"],
    ["Organizational assignment", "Procurement, checked against the registry"],
    ["Device identity and join type", "Microsoft Entra ID device object"],
    ["Management of endpoints", "Intune enrollment"],
    ["Management of servers", "Azure Arc onboarding"],
    ["Compliance state", "Intune compliance evaluation"],
    ["Threat and exposure", "Defender for Endpoint"],
  ];
  leftTable(s, ["Fact", "Authoritative origin"], facts.map((r) => [bold(r[0]), { text: r[1] }]),
    [3.6, 4.9], [0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42], 12.5);
  figure(s, "ch03-authority-map", 9.5, 3.25);
  takeaway(s, "FaDatabase", HEX.navy, "Drift is fixed at the origin, never at the copy.  ",
    "A tag, group or category that can't be traced back to its source is drift, however reasonable the edit looked.");
  sources(s, "Sources: Microsoft Learn — Intune supported platforms; Graph managed device and Autopilot identity; Defender machine resource; Arc agent. Book 05, Chapter 03.");
  narrate(s,
`In an Active Directory estate, a computer had one record that mattered. After modernization the same laptop is described by a procurement record, an Autopilot registration, an Entra ID device object, an Intune record and a Defender entry, and a server adds an Azure Arc resource. Each is maintained by a different service on a different schedule, and most can be edited by someone. That's manageable only if the program decides, fact by fact, where the truth lives.

The table is that decision. Procurement and the asset record own the business facts: ownership, purpose and the organizational assignment, which is checked against the organizational registry. Microsoft's services own the technical state: Entra ID the device's identity and join type, Intune enrollment and compliance, Defender threat and exposure. And for servers, Azure Arc is the management authority in its own right, not a copy of Intune, because Intune doesn't support Windows Server.

Two rules carry the model, both program design. No device carries an empty governance attribute once it's enrolled; if nothing can supply one, it carries an explicit "unpositioned" marker. And every derived value, a tag, a group membership, a device category, must be explainable from its origin. If it can't be traced back, it's drift, and it's corrected at the origin, not at the copy.

The second rule breaks most often, when someone edits a category or a tag in the portal to fix a report. Catching that is the drift loop's job.`,
  "Book 05, Chapter 03 — Where Device and Server Data Lives (opening; The rule; Which system owns which fact; How the records correlate; What this chapter establishes).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Intune-first: no ungoverned device, ever");
  tag(s, "What");
  figure(s, "ch04-five-phases", 0.6, 3.7);
  sideBox(s, "Pillars", "FaLaptop", HEX.teal, HEX.tealTint, "The five pillars, program doctrine", [
    "No ungoverned device, ever; quarantine is the safety valve",
    "Procurement is the first governance step",
    "Zero-touch only; manual enrollment is an exception",
    "One management plane: Intune for endpoints, Arc for servers",
    "Quarantine on failure; never silently degrade",
  ], { x: 4.55, w: 8.2 });
  decision(s, "No new device joins on-premises AD, Configuration Manager co-management or hybrid join; each is governed from first power-on, with its assignment set at the purchase order",
    "Sponsor and CIO (scope)", "From the next purchase order");
  sources(s, "Sources: Microsoft Learn — device identity and join guidance; Intune supported platforms; Autopilot registration. Book 05, Chapter 04; Chapter 06 (scope).");
  narrate(s,
`For net-new devices the book's doctrine is Intune-first. A laptop just unboxed, a phone just issued or a server just racked is governed from the moment it first powers on: by Intune for endpoints, and by Azure Arc for servers. There's no intermediate state where it joins Active Directory and waits for a future migration, is provisioned by Configuration Manager and co-managed later, runs without an organizational assignment, or enters production without a compliance check. Migration brings an existing device under governance; Intune-first refuses the existence of an ungoverned one. It's also where Microsoft points new hardware.

The doctrine exists because, without it, new purchases followed an implicit pattern: the organizational assignment was missed at procurement, platforms were handled inconsistently, and co-management crept in because it was convenient. Each one was a future migration ticket and a present compliance gap.

The five pillars on the right are program doctrine, not Microsoft requirements. The one that changes most is the second: procurement is the first governance step. The organizational assignment is set when the purchase order is issued, and procurement systems feed the governance pipeline the way HR systems feed user provisioning. The figure shows the five phases, from procure and pre-stage through position and provision to validate, with a failure at any gate sending the device to quarantine. The program's target is 14 calendar days from purchase order to production-governed.

The sponsor and CIO, who set scope, make the call: from the next purchase order, no new device takes the old path.`,
  "Book 05, Chapter 04 — Intune-First Onboarding (Scope; What Intune-first means; Why the doctrine exists; The five pillars; Where the organizational assignment comes from; The five-phase process); Chapter 06 (The roles: sponsor and CIO).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "Compliance is the access signal; make it fail closed");
  tag(s, "What");
  rows(s, "Comp", "WHAT DECIDES WHETHER A DEVICE IS TRUSTED", [
    ["No policy assigned", "Marked not compliant, never passed"],
    ["Validity window", "14 days without a report: noncompliant"],
    ["Grace period", "0 to 365 days: a risk decision"],
    ["Defender risk", "A detection on Tier 0 costs access"],
  ], 1.9, 0.78, 0.66);
  sideBox(s, "Base", "FaShieldHalved", HEX.navy, HEX.navyTint, "A new device's baseline", [
    "BitLocker, Secure Boot, TPM, firewall",
    "Antivirus current; a minimum OS version",
    "Microsoft security baselines, reviewed",
    "In GCC: classic Autopilot, Entra join",
    "Review Not evaluated and Error weekly",
  ]);
  decision(s, "Mark devices with no compliance policy as not compliant, and set the grace period and validity window before compliance feeds Conditional Access",
    "CISO (compliance rules and grace period)", "Before Conditional Access uses compliance");
  sources(s, "Sources: Microsoft Learn — compliance settings and monitoring; noncompliance actions; Conditional Access grant; Autopilot in GCC. Book 05, Chapters 04, 06, 10.");
  narrate(s,
`Device compliance is where device governance meets access. Intune's compliance policies decide whether a device is compliant; Conditional Access, which Book 04 owns, decides what a noncompliant device can reach. This book's half of the hand-off is making the signal accurate, and the grant works only for devices registered in Entra ID and enrolled in Intune.

Three settings decide whether the signal fails open or closed. The tenant default marks a device with no compliance policy as compliant; the program sets it to not compliant, as Microsoft recommends whenever compliance feeds Conditional Access, so a device that falls outside every group can't pass by default. The validity period, 30 days by default, becomes 14, so a device left in a drawer loses access before its posture is a whole patch cycle stale. And the grace period on each policy's noncompliance action, zero to 365 days, sets how long a failing device keeps access. That's a risk decision, not a technical one.

A new device's baseline is BitLocker, Secure Boot, TPM, firewall, current antivirus and a minimum OS version, starting from Microsoft's security baselines. On Tier 0 workstations the program also requires a Defender machine risk score, so a detection becomes a loss of access. In a GCC tenant, which uses the commercial Intune service, the default for standard hardware is classic Autopilot with Entra join, because its registration carries the procurement attribute.

The CISO decides the compliance rules and the grace period, before compliance feeds Conditional Access.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet (Compliance and the Conditional Access hand-off; Tenant-wide compliance settings; Reading compliance status; Defender risk as a compliance signal); Chapter 04 (Which one, in a GCC tenant; The compliance and configuration baseline); Chapter 06 (Notes: compliance and its grace period).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "The device that can't enroll is a governed exception");
  tag(s, "What");
  const paths = [
    ["A. Personal devices", "Work profile or registration: lower assurance beats none"],
    ["B. Linux off Intune", "Azure Arc and machine configuration instead"],
    ["C. Pre-2025 servers", "Arc-managed without Entra sign-in, for now"],
    ["D. Can't enroll", "Lab, OT and validated-image PCs"],
  ];
  leftTable(s, ["Exception path", "What it permits"], paths.map((r) => [bold(r[0]), { text: r[1] }]),
    [2.4, 4.5], [0.42, 0.62, 0.5, 0.5, 0.5], 12.5);
  sideBox(s, "PathD", "FaPlugCircleXmark", HEX.red, HEX.redTint, "Path D, in order", [
    "Isolate it on its own network segment",
    "Manage Defender settings where it connects",
    "A named exclusion, 90-day review",
    "Other sign-in controls stay on",
  ]);
  decision(s, "Allow a device that can't enroll only as a named exclusion with an owner, a 90-day review and the authorizing official's risk acceptance",
    "Authorizing official", "Before its users reach protected resources");
  sources(s, "Sources: Microsoft Learn — Conditional Access grant and device filters; Defender security settings management; Arc sign-in. Book 05, Chapters 04, 06.");
  narrate(s,
`Doctrine needs carve-outs, and the book allows four, each with written justification, a compensating control and an audit entry.

Path A is personal devices, enrolled into a work profile or registered. Refusing to govern them pushes people to unmanaged browsers; governed at a lower assurance level beats ungoverned. Path B is Linux that Intune can't manage, such as developer workstations needing root or air-gapped hosts, governed through Azure Arc and machine configuration instead. Path C is Windows Server 2019 and 2022, which can't use Entra ID sign-in through Arc; that needs Server 2025, so Arc-managed without it is the interim. And path D is the hard one: lab instruments, operational technology and PCs locked to a vendor's validated image, which can't take device management at all.

Path D runs into Conditional Access directly. A device that isn't enrolled can't pass a policy that requires a compliant device, so its users are blocked from everything behind those policies. The program handles it in order. Isolate it on a segmented network first. Where it has connectivity, manage its Defender settings, which secures it but doesn't make it compliant. If its users must reach a protected cloud resource, record a named exclusion with an owner, a justification and a review no more than 90 days out, paired with a policy that limits those accounts to the approved devices. And keep every other control on.

Because that exclusion leaves a control unmet, it's a risk acceptance, and the authorizing official makes it.`,
  "Book 05, Chapter 04 — Intune-First Onboarding (The four exception paths; Path D under the compliant-device policies); Chapter 06 — Who Owns the Endpoint (The roles: the authorizing official; responsibility matrix: standing exceptions).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Three paths to one governed end state");
  tag(s, "What");
  const choose = [
    ["Small estate or pilot; no control plane yet", "Manual"],
    ["Hundreds of devices, or an AO must sign", "Governed"],
    ["Already modernized by hand; now needs proof", "Retrofit"],
    ["Must stay domain-joined this wave", "Any, sequenced"],
  ];
  leftTable(s, ["If the estate…", "Use"], choose.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal)]),
    [5.2, 1.7], [0.42, 0.5, 0.5, 0.5, 0.5], 12.5);
  T(s, "Ladder", [bold("Every path:  "), { text: "observe before you change anything, dry-run first, report-only before enforcement, and a human approves each high-impact write. Autonomous change is refused." }],
    { x: 0.6, y: 4.1, w: 6.9, h: 0.95, fontSize: 13.5, valign: "middle" });
  figure(s, "ch05-actuation-ladder", 7.75, 1.6);
  sideBox(s, "MAA", "FaUserCheck", HEX.navy, HEX.navyTint, "A native second approver", [
    "Intune Multi Admin Approval",
    "The requester can't approve",
    "Covers wipe, retire, delete",
  ], { x: 9.55, w: 3.2 });
  decision(s, "Choose the path: governed for any estate over a few hundred devices or wherever an authorizing official must sign the change",
    "Sponsor and CIO (path choice)", "Before onboarding starts");
  sources(s, "Sources: Microsoft Learn — report-only mode; emergency access; Intune Multi Admin Approval. Book 05, Chapters 05, 06. Paths and ladder: program design.");
  narrate(s,
`The existing fleet can reach the same governed end state three ways, and the book uses each on purpose.

The manual path uses the native tools by hand, with the operator holding the change record. The governed path runs the same steps, but binds each technical change to organizational intent: attributes before any targeting, a dry run before any write, report-only before enforcement, and a recorded approval for every high-impact change. The retrofit path adopts an estate already modernized by hand, reading what the manual path left behind and switching on observation and approval, with no re-imaging or re-enrollment. Its risk is that it blesses whatever is there, so owners have to confirm the current state is the intended one.

All three share one rule: observe before you change anything. Budget at least two weeks of assessment before a production change; starting onboarding without the inventory and the NTLM audit is the program's most common cause of failed modernization.

The figure is the program's actuation ladder: record, observe, advise, gated change, and autonomous change, which is refused. The federal default ceiling is a human approving and the program executing. Microsoft provides a native second approver for part of the surface: Intune Multi Admin Approval, where the requester can't approve their own change, even as a Global Administrator, covering policies, scripts and the wipe, retire and delete actions.

The sponsor and CIO choose the path. The book's guidance is governed for anything over a few hundred devices, or wherever an authorizing official must sign.`,
  "Book 05, Chapter 05 — The Governed, Manual and Retrofit Paths (One end state; Rules that hold on every path; The governed path; The actuation ladder; The retrofit path; How to choose); Chapter 06 (responsibility matrix: path choice; The second approver).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Who owns the endpoint: deciding isn't doing");
  tag(s, "Who");
  figure(s, "ch06-endpoint-owners", 0.6, 6.9);
  sideBox(s, "Console", "FaTriangleExclamation", HEX.amber, HEX.amberTint, "Risk decisions made in a console", [
    "A 30-day compliance grace period",
    "A GPO left in place beside Intune",
    "Exempting a kiosk class from BitLocker",
    "One decider per row, written down",
  ]);
  decision(s, "Route every standing exception, or any past the agency's limit, to the authorizing official on a schedule; the CISO decides temporary ones with an end date",
    "AO for standing; CISO for temporary", "On a schedule, not once");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (roles); Microsoft Learn — Arc security, Defender for Servers, Intune roles. Book 05, Chapter 06; Book 02, Chapter 06.");
  narrate(s,
`Who owns the endpoint? In an Active Directory estate it was rarely written down. Whoever could edit a GPO and link it to an OU decided what every computer under it would do at the next refresh: a security setting, a drive mapping and a software install all travelled the same way, approved by the same few people.

The replacement isn't one console. Workstations are governed in Intune, servers in Azure through Arc, and device identity and access in Entra ID. The decisions one GPO editor used to make now belong to several teams. The figure shows who decides, who designs and does the work, and who operates and supports it.

The split matters more for devices than almost anything else, because Group Policy trained a generation of administrators to treat the ability to change something as the right to decide it. Setting a 30-day grace period is a risk decision. So is leaving a GPO in place beside Intune, or exempting a kiosk class from BitLocker. Each is made in a console, by someone who may not know a decision is being made.

Exceptions split by time. A temporary one with an end date is a control decision the CISO can make. One with no end date, or past the agency's limit, is a risk acceptance, and only the authorizing official can make it, reviewed on a schedule.`,
  "Book 05, Chapter 06 — Who Owns the Endpoint (opening; Decision rights and work are different things; The roles; The responsibility matrix and its comments: the exception rows).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Who decides what for devices and servers");
  tag(s, "Who");
  const owners = [
    ["Path, scope and domain-unjoin timing", "Sponsor and CIO"],
    ["Baselines, compliance rules, grace period", "CISO"],
    ["How Conditional Access uses compliance", "CISO"],
    ["Update rings and deferral periods", "CISO"],
    ["Pausing a ring after a bad update", "The team running it"],
    ["Group Policy setting retirement", "Endpoint engineering"],
    ["App deployment; NTLM limits per app", "Application owner"],
    ["Pilot and wave go/no-go", "Endpoint engineering"],
    ["Standing exceptions", "Authorizing official"],
    ["Help desk checks before a wipe", "CISO"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r, i) => [{ text: r[0] }, bold(r[1], i === 8 ? HEX.amber : HEX.teal)]),
    [4.4, 2.5], [0.34, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32], 12, 1.45);
  sideBox(s, "Roles", "FaUsersGear", HEX.navy, HEX.navyTint, "Three role systems, one model", [
    "Entra roles: the tenant and directory",
    "Intune roles, limited by scope tags",
    "Azure roles for Arc servers",
    "Arc Contributor is a server admin",
    "Intune Administrator: not daily",
  ]);
  decision(s, "Put a second approver in front of high-impact Intune changes with Multi Admin Approval; the security office owns the approver groups",
    "CISO (security office)", "Before fleet-wide policy changes");
  sources(s, "Sources: Microsoft Learn — Intune RBAC and scope tags; Entra roles; Arc built-in roles; Multi Admin Approval; update rings. Book 05, Chapter 06.");
  narrate(s,
`Here's the book's responsibility matrix in one view, with one decider per row.

The sponsor and CIO decide the path, the scope and the timing of domain-unjoin waves. The CISO decides the security baselines, the compliance rules and grace period, how Conditional Access uses compliance, the update rings and deferrals, and the help desk's identity checks before a wipe or a key release. Endpoint engineering decides when a Group Policy setting is retired and each wave's go or no-go. Application owners decide their own deployments and how far NTLM is restricted for their apps, because only they can judge whether the app still works. And the authorizing official decides standing exceptions.

One row looks odd but isn't: pausing an update ring after a bad update is an emergency stop, so the team running the ring decides and tells the security office.

Decision rights don't change what a console lets someone do; roles do, and there are three role systems: Entra roles for the tenant, Intune roles limited by scope tags for workstations, and Azure roles for Arc servers. Two warnings matter. Microsoft advises against using Intune Administrator for routine work, because it grants global read and write. And extensions on an Arc server run with full privilege, so Contributor on the resource is effectively an administrator of the server.

The decision: Multi Admin Approval in front of high-impact changes, with the security office owning the approver groups.`,
  "Book 05, Chapter 06 — Who Owns the Endpoint (The responsibility matrix and its comments; Three role systems, one access model; The second approver).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Sunset Group Policy setting by setting");
  tag(s, "How");
  figure(s, "ch07-setting-dispositions", 0.6, 5.1);
  sideBox(s, "Rules", "FaListCheck", HEX.teal, HEX.tealTint, "The rules that keep it honest", [
    "Retire before you translate",
    "One authority per setting",
    "Evidence before unlink: Intune reports success",
    "Disable links first; keep GPOs 90 days",
    "Exceptions expire: an owner and a review date",
  ], { x: 5.95, w: 6.8 });
  decision(s, "Freeze every inventoried GPO, send new requirements to Intune, and disable no link until its replacement reports success on that population",
    "Endpoint engineering lead", "From the inventory onward");
  sources(s, "Sources: Microsoft Learn — cloud-native Windows guidance; settings catalog; co-management workloads; Backup-GPO and Set-GPLink. Book 05, Chapters 07 and 06.");
  narrate(s,
`Now the how. The Group Policy sunset is the existing-fleet program, run as a program, one setting and one population at a time. Microsoft's own guidance says lifting and shifting every setting is likely impractical: identify the mandatory settings, compare them with what MDM offers, and treat the gaps as blockers.

Every setting in the inventory gets one tag: required, obsolete, high-risk or redundant. Only required settings go on, and the figure shows how each one lands. Four questions, in order: is it still needed? Is there a native Intune equivalent? Does a cloud-native pattern remove the need, the way OneDrive replaces folder redirection or Universal Print replaces mapped printers? Can a script enforce it and prove it? A setting that fails all four becomes a dated exception, with an owner, a reason and a review date, and its GPO stays linked for that population only.

The rules on the right keep it honest. Retire before you translate: a smaller surface is the point. One authority per setting at any moment. Evidence before unlink: the Intune policy reports success on the population before its GPO link is disabled. Disable the link, not the GPO, and keep the GPO for 90 days as a rollback net. One trap: unlinking doesn't undo Group Policy preferences, such as drive maps, unless they were set to remove themselves, so each one needs something that clears it.

Success is measured in GPOs retired with evidence, not settings moved. The endpoint engineering lead freezes every inventoried GPO from the start.`,
  "Book 05, Chapter 07 — The GPO Sunset Program (opening; Step 2: Classify each setting; Freezing and unlinking GPOs; The end state; Methodology principles); Chapter 06 (responsibility matrix: Group Policy setting retirement).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Seven phases, about 34 weeks, each with a gate");
  tag(s, "How");
  const phases = [
    ["1  Inventory and classify", "3–5 weeks", "A decision for every setting"],
    ["2  Coexistence planning", "2–3 weeks", "One authority per workload"],
    ["3  Baseline authoring", "3–4 weeks", "Built, unassigned, reviewed"],
    ["4  Pilot, about 5%", "4–6 weeks", "No unexplained conflicts"],
    ["5  Cutover, four waves", "8–12 weeks", "Each wave watched 72 hours"],
    ["6  Verification", "About 2 weeks", "No migrated device on a GPO"],
    ["7  Formal retirement", "2 weeks + 90 days", "Only dated exceptions left"],
  ];
  leftTable(s, ["Phase", "Planning estimate", "Exit gate"], phases.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [2.9, 2.0, 3.35], [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4], 12.5);
  figure(s, "ch08-migration-phases", 9.4, 3.35);
  decision(s, "Approve the wave plan and its exit gates, and make each wave's go or no-go on measured results, not the calendar",
    "Endpoint engineering; sponsor sets sequence", "Before each phase and wave");
  sources(s, "Sources: Microsoft Learn — Windows 10 end of support; co-management workloads. Book 05, Chapters 06 and 08. Durations are planning estimates.");
  narrate(s,
`At working level, the sunset runs in seven phases, each closed by an exit gate, with a rollback defined before the phase starts. The durations are the book's planning estimates for a large fleet with Configuration Manager; a fleet without it skips most of phase two.

Inventory and classify, three to five weeks, ends with a decision for every setting and a captured baseline per device tier. Coexistence planning, two to three weeks, settles one authority per workload. Baseline authoring, three to four, builds every policy unassigned and peer-reviewed. The pilot, four to six weeks on about 5 percent of the fleet, leaves the GPOs linked and measures conflicts. Cutover runs in four waves over eight to twelve weeks, each watched for 72 hours before the next. Then about two weeks of verification, and formal retirement: GPOs disabled, kept 90 days, then archived and deleted.

On those estimates the program reaches phase seven in roughly 34 weeks, with the last deletions about three months later. For a large fleet, that's months, not weeks.

One sequencing rule is easy to get wrong under schedule pressure: on co-managed devices, Endpoint Protection moves before device configuration, because switching device configuration also moves Endpoint Protection, and the two can't be separated afterwards. And Windows 10 reached end of support on October 14, 2025, so the templates set Windows 11 as the floor and any Windows 10 device left is an exception with an upgrade date.

Endpoint engineering makes each go or no-go on measured results; the sponsor sets the sequence.`,
  "Book 05, Chapter 08 — GPO to Intune Policy Migration (opening scope facts; The seven phases at working level; Phase 5: workload cutover in waves; Testing at each gate; Rollback); Chapter 06 (responsibility matrix: pilot and wave go/no-go).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Servers come under governance through Azure Arc");
  tag(s, "How");
  figure(s, "ch09-arc-management-plane", 0.6, 5.6);
  sideBox(s, "Arc", "FaServer", HEX.navy, HEX.navyTint, "What Arc does, and doesn't", [
    "Adds a resource, RBAC, tags and policy",
    "Doesn't unjoin the domain or change sign-in",
    "Day one: configuration, patching, Defender",
    "Onboard with a certificate, removed after",
    "Entra sign-in: Server 2025, no Conditional Access",
  ], { x: 6.45, w: 6.3 });
  decision(s, "Plan each server's domain unjoin as its own decision, after its authentication dependencies are known; onboarding to Arc never implies it",
    "Sponsor and CIO set waves; server team records each", "After the NTLM and SPN work");
  sources(s, "Sources: Microsoft Learn — Arc servers, agent and roles; machine configuration; Update Manager; Defender for Servers; Arc sign-in. Book 05, Chapters 06, 09.");
  narrate(s,
`Servers take a different road, because Intune doesn't manage Windows Server. A server outside Azure runs the Connected Machine agent and appears in Azure as a resource, managed the way native Azure machines are: Azure Policy, role-based access, tags, extensions, update management and Defender then apply to it.

That's the management plane, not the identity plane. Onboarding doesn't change how the server authenticates users or whether it's domain joined; the target is servers running without a domain join, but the unjoin is planned separately for each workload, after its Kerberos and NTLM dependencies are known.

A connected server is addressable, not yet governed. The day-one baseline attaches three things on the same change: machine configuration to audit the security baseline, Update Manager for patching, and Defender for Servers, where the program uses Plan 2. Onboard with a dedicated service principal that authenticates with a certificate and holds only the onboarding role, and remove the credential when the wave closes. And because extensions run with full privilege, anyone who is Contributor on the resource is effectively the server's administrator.

Two facts correct common assumptions. Licensing changes the bill most: with Software Assurance, patching, configuration and change tracking come at no extra cost, but only after each server's licensing is attested. And Entra ID sign-in works only on Windows Server 2025 with Desktop Experience, Entra-joins the server, and doesn't bring Conditional Access with it.

The sponsor and CIO set the unjoin waves; server infrastructure records each server's decision.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc (opening; What Arc changes and what it doesn't; Arc servers run non-domain-joined in the target; Plan cost by service; Roles; Onboarding; The day-one baseline; Microsoft Entra ID sign-in); Chapter 06 (The roles: server infrastructure; domain-unjoin timing).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "The support dates that bind the fleet now");
  tag(s, "How");
  const dates = [
    ["Windows Server 2012 / R2", "Extended updates ended Oct 13, 2026", "Migrate, upgrade or isolate"],
    ["Windows Server 2016", "End of support Jan 12, 2027", "Enroll in Arc ESUs first"],
    ["Windows 11, version 23H2", "Updates end Nov 10, 2026", "Target 25H2 now"],
    ["SQL Server 2014", "ESUs until July 2027", "Plan the move"],
    ["SQL Server 2016", "ESUs until July 17, 2029", "Track coverage"],
    ["Windows 10", "Out of support since Oct 14, 2025", "An exception with a date"],
  ];
  leftTable(s, ["Product", "Status (as of Oct 20, 2026)", "The program's response"], dates.map((r, i) => [bold(r[0], i === 0 ? HEX.red : HEX.navy), { text: r[1] }, { text: r[2] }]),
    [3.1, 4.6, 3.3], [0.42, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46], 12.5);
  decision(s, "Migrate, upgrade or isolate every Windows Server 2012 host now, and record a risk acceptance for any that must remain",
    "Server infrastructure; the AO accepts what remains", "Now: updates ended Oct 13, 2026");
  sources(s, "Sources: Microsoft Learn — ESUs enabled by Azure Arc; SQL Server ESUs; Windows 11 release information; Windows 10 end of support. Book 05, Chapters 08–10.");
  narrate(s,
`Some decisions have a date on them, and the book checked them as of October 20, 2026.

Windows Server 2012 and 2012 R2 left their Extended Security Update period on October 13, 2026; that month's update was the last, and the Arc ESU licenses deactivated the next day. Any such host still running now receives no further security updates through any channel. The book treats it as a red finding: migrate it, upgrade it, or isolate it and record the risk acceptance.

Windows Server 2016 reaches end of support on January 12, 2027. Extended updates through Arc are available for up to three years, through 2030, and billing begins January 13, so any 2016 host that won't be upgraded in time should be connected and enrolled before then. Through Arc, extended updates are billed monthly, need no product keys, and show coverage per server.

On the client side, Windows 11 version 23H2 stops receiving updates on November 10, 2026, so the feature update policy targets 25H2 now and the compliance floor rises each year. Windows 10 has been out of support since October 14, 2025; Intune still lets it enroll, but Microsoft no longer guarantees it works, so each remaining device is an exception with an upgrade date. And SQL Server 2014 and 2016 have extended updates until July 2027 and July 2029.

The decision on the 2012 hosts can't wait. Server infrastructure acts now, and the authorizing official accepts the risk of any host that has to stay.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc (Extended Security Updates; What this chapter establishes, 4); Chapter 10 — Operating and Evidencing the Fleet (Version currency); Chapter 08 (opening scope facts: Windows 10); Chapter 06 (standing exceptions).");
}

// ------------------------------------------------------------------ How 5
{
  const s = content(S_HOW, "Update rings set the patch clock");
  tag(s, "How");
  const rings = [
    ["Test", "Lab devices", "0", "2"],
    ["First", "Pilot, about 5%", "1", "3"],
    ["Fast", "About a quarter", "3", "5"],
    ["Broad", "Everyone else", "7", "7"],
  ];
  leftTable(s, ["Ring", "Population", "Defer, days", "Deadline, days"], rings.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }, { text: r[3] }]),
    [1.3, 2.4, 1.6, 1.6], [0.42, 0.46, 0.46, 0.46, 0.46], 12.5);
  T(s, "Clock", [bold("About 16 days  "), { text: "from release to every online device, and a bad update can be paused in Test or First before it reaches Broad." }],
    { x: 0.6, y: 4.0, w: 6.9, h: 0.95, fontSize: 14, valign: "middle" });
  sideBox(s, "Auto", "FaArrowsRotate", HEX.teal, HEX.tealTint, "Windows Autopatch, in GCC", [
    "Included with Microsoft 365 G3 or G5 GCC",
    "Not supported in GCC High or DoD",
    "It runs the rings; don't add custom ones",
    "Update evidence from Intune reports",
  ]);
  decision(s, "Approve the ring deferrals and deadlines as the agency's flaw-remediation period for SI-2, and use Windows Autopatch where licensed",
    "CISO (update cadence)", "Before the update workload moves");
  sources(s, "Sources: Microsoft Learn — update rings; Windows Autopatch prerequisites and FAQ; update reports; NIST SP 800-53 SI-2. Book 05, Chapters 06, 10.");
  narrate(s,
`Once Intune owns the fleet, the update rings set the patch clock. Each month's quality update is staged across four rings named the way Windows Autopatch names them: Test for endpoint engineering's lab devices, First for a pilot of about 5 percent, Fast for about a quarter of the fleet, and Broad for everyone else. Deferrals rise from zero to seven days, and deadlines from two to seven.

With those values a quality update reaches every online device within about 16 days of release, and an update that breaks the Test or First ring can be paused before it reaches Broad. That pause is an emergency stop, decided by the team running the ring.

Windows Autopatch automates ring management and reporting. For government tenants it's included for GCC customers with Microsoft 365 G3 or G5 GCC, and isn't supported in GCC High or DoD. When Autopatch manages a device it maintains the rings itself, and administrators shouldn't add their own. The program's position: use it where licensed, and keep the ring table as the specification Autopatch is configured to.

This matters to assessors. NIST's SI-2 asks for security updates within a defined period of release, and that period is the agency's own parameter. The ring deadlines are what sets it, so the assessor reads them. In GCC, update evidence comes from Intune and Autopatch reports, because the Log Analytics–based reporting service doesn't meet GCC requirements.

The CISO approves those values as the agency's remediation period.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet (The update policy surfaces; The program's rings; Windows Autopatch; Reporting and the evidence an assessor reads: SI-2); Chapter 06 (responsibility matrix: update rings; pausing a workstation ring; Notes: update rings).");
}

// ------------------------------------------------------------------ How 6
{
  const s = content(S_HOW, "Run the fleet on records, and retire it in order");
  tag(s, "How");
  figure(s, "ch10-run-state-loop", 0.6, 4.6);
  sideBox(s, "Run", "FaFileShield", HEX.amber, HEX.amberTint, "What the assessor reads", [
    "Policy library under version control: CM-2",
    "Per-setting status and exceptions: CM-6",
    "Weekly inventory reconciliation: CM-8",
    "Ring results and deadlines: SI-2",
    "Retire in order: keys exported first",
  ], { x: 5.45, w: 7.3 });
  decision(s, "Make the security office the decider for drift findings and compliance evidence, exported on a schedule from the services' own records",
    "CISO (drift findings and evidence)", "From the first migrated wave");
  sources(s, "Sources: NIST SP 800-53 (CM-2, CM-6, CM-7, CM-8, SI-2); FedRAMP 20x KSIs; Microsoft Learn — retire, wipe, delete; stale devices. Book 05, Chapters 06, 10.");
  narrate(s,
`In the run state, three records replace Group Policy's answer to "why is this setting here?": the policy library, the status Intune and Defender report per device, and the audit log of every change. Operating the fleet means keeping them in agreement. Evidencing it means handing an assessor the same records, not a document written for the audit.

The figure is the loop. Policy is assigned, devices report, a scheduled comparison finds compliance drift, configuration conflicts, update lag, inventory mismatches and alerts, and each finding closes at the source: change the policy through change control, or fix the device. A conflict is a defect in the library, not a state to live with.

The assessor reads records for each control: the policy library under version control for the baseline, per-setting status and the exception register for configuration settings, the weekly reconciliation of the Intune, Entra ID and Defender inventories for the component inventory, and the ring results for flaw remediation. The book uses FedRAMP 20x's indicators as a vocabulary for the same evidence, and is careful not to claim more.

Retirement is a sequence, because order decides what can be recovered. Export the BitLocker keys and the local administrator password; wipe or retire the device; deregister it from Autopilot; delete the Intune record; and delete the Entra ID object last, after a disable period, because deleting it permanently deletes the keys stored on it.

The CISO decides drift findings and compliance evidence, from the first migrated wave.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet (opening; Configuration status and conflicts; Device inventory reconciliation; Retirement and wipe; Reporting and the evidence an assessor reads; FedRAMP 20x Key Security Indicators); Chapter 06 (responsibility matrix: drift findings and compliance evidence).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Freeze GPOs; record overlaps; unlink only after success", "Endpoint engineering", "From the inventory"],
    ["Entra join target for every hybrid device; set unjoin waves", "Sponsor and CIO", "Before the first wave"],
    ["Gate each wave on measured results; report-only first", "Endpoint lead; CISO", "Each wave"],
    ["No new device in AD, co-management or hybrid join", "Sponsor and CIO", "Next purchase order"],
    ["Fail closed: unassigned devices noncompliant; set grace", "CISO", "Before CA uses it"],
    ["Non-enrollable devices: named, reviewed, risk accepted", "Authorizing official", "Before access"],
    ["Governed path for large estates or AO-signed change", "Sponsor and CIO", "Before onboarding"],
    ["Standing exceptions to the AO, on a schedule", "AO; CISO if temporary", "Scheduled"],
    ["Second approver on high-impact Intune changes", "CISO", "Before fleet changes"],
    ["Each server's domain unjoin as its own decision", "Sponsor and CIO", "After NTLM and SPN"],
    ["Server 2012 hosts: migrate, upgrade or isolate", "Server team; the AO", "Now"],
    ["Ring deadlines as the SI-2 period; Autopatch if licensed", "CISO", "Before update workload"],
    ["Drift and evidence from the services' own records", "CISO", "First migrated wave"],
  ];
  const rh = [0.36, ...asks.map(() => 0.3)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.6, 3.2, 2.35][j] - 0.2;
    if (linesFor(c.length, w, 12) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.6, 3.2, 2.35], { y: 1.45, w: 12.15, fontSize: 12, rowH: rh }));
  T(s, "Close line", [{ text: "Rebuild on purpose what the tree did implicitly.  ", options: { bold: true, color: HEX.amber } },
    { text: "Every device governed from its first day, every change owned and evidenced." }],
    { x: 0.6, y: 6.0, w: 12.15, h: 0.5, fontSize: 15, valign: "middle", align: "center" });
  sources(s, "Sources: Microsoft Learn, Oct 2026; NIST SP 800-53, 800-37. Book 05, Chapters 01–10. Undated timings are design guidance; durations, planning estimates.");
  narrate(s,
`So, the decisions, with their owners.

The sponsor and CIO set the shape of the program: every hybrid-joined device gets a target of Entra join and a trigger event, with the domain-unjoin waves set before the first; no new device takes the old path, from the next purchase order; the governed path for any estate of more than a few hundred devices, or wherever an authorizing official must sign; and each server's domain unjoin as its own decision, after the NTLM and SPN work.

Endpoint engineering freezes every inventoried GPO, records every overlap, unlinks only after the replacement reports success, and makes each wave's go or no-go on measured results.

The CISO makes compliance fail closed and sets the grace period, decides how Conditional Access uses it, puts a second approver in front of high-impact changes, approves the ring deadlines as the agency's remediation period, and owns the drift findings and evidence. Temporary exceptions are the CISO's too.

The authorizing official accepts the rest: devices that can't enroll, standing exceptions reviewed on a schedule, and any Windows Server 2012 host that can't be migrated, upgraded or isolated now.

Group Policy governed by position, and that governance has to be rebuilt on purpose: every device governed from its first day, and every change owned and evidenced. Book 05 has the detail, with every claim footnoted. Thank you.`,
  "Book 05, Chapter 01 (The Why in five sentences); Chapter 02 (What to do first); Chapter 06 — Who Owns the Endpoint (The responsibility matrix); Chapters 07–10 (What this chapter establishes).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal frameworks and controls");
  const src = [
    "NIST SP 800-53 Rev. 5, release 5.2.0 (AC-2, AC-19, CM-2, CM-6, CM-7, CM-8, IA-3, MA-2, SC-15, SI-2, and the endpoint controls mapped in Chapter 10), as FedRAMP's 2026 control catalog uses it.  ·  NIST SP 800-37 Rev. 2 (roles).",
    "FedRAMP, Consolidated Rules for 2026: Key Security Indicators (IAM, SVC, CNA, CMT, MLA, PIY themes); certification timeline.",
    "Book 02, Chapter 06 — Who Owns the Migration (RMF role definitions the endpoint model applies).  ·  Book 04 — Access & Privilege (Conditional Access use of device compliance).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: Microsoft platform, as of October 2026");
  const src = [
    "Microsoft Learn, Windows and Group Policy: cloud-native endpoint planning and tutorial; Group Policy processing, scope and modeling; MDMWinsOverGP and the Policy CSP; Windows Hello for Business configuration; Windows 11 release information; Windows 10 end of support.",
    "Microsoft Learn, device identity: device join types; hybrid join concept, configuration, controlled validation and planning; hybrid join FAQ; pending and stale devices; Windows Autopilot, device preparation, registration and government-cloud availability.",
    "Microsoft Learn, Intune: supported platforms; Group Policy analytics; settings catalog and ADMX import; conflicts and check-in; compliance settings, monitoring and noncompliance actions; security baselines; RBAC, scope tags and Multi Admin Approval; update rings, Windows Autopatch and update reports; retire, wipe and delete; Configuration Manager co-management workloads.",
    "Microsoft Learn, Azure: Azure Arc-enabled servers overview, agent, network, roles, onboarding and uninstall; Windows Server Management enabled by Arc; machine configuration; Azure Update Manager; Defender for Servers and security settings management; Extended Security Updates; Entra ID sign-in for Arc servers.",
    "Full footnotes with links and access dates (October 20, 2026): Book 05, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b05-devices/).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

// ------------------------------------------------------------------ Backup: federal requirements (the deck's endnotes)
{
  const s = D.content("Backup", "Federal requirements: full citations");
  const R = [
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "CM-2 Baseline Configuration; CM-6 Configuration Settings; CM-7 Least Functionality", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "Intune track; Arc track (machine configuration)"],
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "CM-8 System Component Inventory; SI-2 Flaw Remediation", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "Inventory reconciliation; update rings"],
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "SA-22 Unsupported System Components", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "Arc track: end-of-support servers"],
    ["OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles", "§III.A Identity: at least one device-level signal alongside identity. §III.B Devices: a complete inventory of every device; EDR", "Jan. 26, 2022", "Intune and Arc tracks"],
  ];
  s.addTable([head(["Primary source", "Section or control", "Date", "Used for"]),
    ...R.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }, { text: r[3] }])],
    tableOpts([3.3, 4.85, 1.95, 2.05], { y: 1.45, fontSize: 11.5, rowH: [0.36, 0.7, 0.7, 0.7, 0.7] }));
  txt(s, "Requirements note", "Mapping from Book 05, Chapter 10 (evidence an assessor reads; FedRAMP adds no parameter values to these CM and SI controls), sources checked October 20, 2026, and Book 01, Appendix A (M-22-09; SA-22). The program's mapping for its assessors, not a compliance claim.",
    { x: 0.6, y: 6.0, w: 12.15, h: 0.55, fontSize: 11, italic: true, color: HEX.slate });
}

// ---------------------------------------------------------------- narration.json must match the narrated slides
{
  const NARR = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
  const narrated = titles.slice(0, titles.indexOf("Backup"));
  if (NARR.length !== narrated.length) console.warn(`  ! narration.json has ${NARR.length} entries for ${narrated.length} narrated slides`);
  let said = 0;
  const per = NARR.map((e, i) => {
    if (e.slide !== i + 1) console.warn(`  ! narration.json entry ${i} is numbered ${e.slide}`);
    if (e.title !== narrated[i]) console.warn(`  ! narration.json slide ${i + 1} title ${JSON.stringify(e.title)} doesn't match ${JSON.stringify(narrated[i])}`);
    const n = e.say.split(/\s+/).filter(Boolean).length; said += n; return n;
  });
  console.log(`narration.json: ${said} words (${per.join(", ")}), about ${mmss((said * 60) / 160)} at 160 wpm`);
}

console.log(`notes: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
