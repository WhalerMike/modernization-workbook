// Book 12 — Security Operations & Telemetry: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CISO, the SOC lead, the CIO and authorizing officials. Decision-centered: every decision slide
// states the decision, its owner and when it's needed. No configuration detail (no KQL, tables or connector setup).
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B12_Security_Operations_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b12-security-operations/, named in the notes. Decision
// owners come from the book's responsibility matrix (Chapter 10), which the book labels the program's recommended
// model; the evidence contract, the planes, the response ladder, the metric set and the reporting rhythm are program
// design. The book's framing of the logging requirement is kept exactly: OMB M-26-14 (May 22, 2026) rescinded
// M-21-31, so M-26-14 is the current memo. Calendar dates counted from CISA's August 20, 2026 Logging Reference
// Architecture are the program's arithmetic (Book 00, Chapter 01) and carry an asterisk. Product availability is a
// dated observation (October 21, 2026). Diagrams are the committed PNGs in
// docs/images/diagrams/b12-security-operations/png/; alt text is read from the chapters' fig-alt.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 12", title: "Security Operations & Telemetry",
  footer: "Federal Modernization Workbook  ·  Book 12 Security Operations & Telemetry  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B12_Security_Operations_Executive.pptx";

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
// Slide titles stay at or under 58 characters and are unique; each narrated title must match narration.json.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.includes(t)) throw new Error(`duplicate slide title: ${t}`);
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
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// ---------------------------------------------------------------- diagrams
// The committed PNG, scaled to fit (maxW x maxH), centered in its area; alt text from the chapter's fig-alt.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b12-security-operations");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b12-security-operations", "png");
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
// A labeled list of tinted rows (default: down the left half of the slide).
const rows = (s, prefix, label, list, top, step, h, o = {}) => {
  const x = o.x || 0.6, w = o.w || 6.2, lead = o.lead || "   ";
  txt(s, `${prefix} head`, label, { x, y: o.headY || 1.5, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, x, y, w, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}${lead}`, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: x + 0.2, y, w: w - 0.3, h, fontSize: o.size || 13.5, valign: "middle" });
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
// A compact tinted panel (a one-line heading, then bullets) for the space under a wide diagram.
const panel = (s, prefix, color, tint, heading, list, o) => {
  const { x, y, w } = o; const size = o.size || 13;
  const listNeed = needFor(parasOf(bullets(list, size), size), w - 0.4, 4);
  const h = Math.max(o.minH || 0, Math.round((0.52 + listNeed + 0.12) * 100) / 100);
  if (y + h > 5.12) console.warn(`  ! slide ${pres.slides.length} ${prefix} panel runs past the decision bar (bottom ${(y + h).toFixed(2)} in)`);
  box(s, `${prefix} box`, x, y, w, h, tint);
  T(s, `${prefix} head`, heading, { x: x + 0.2, y: y + 0.1, w: w - 0.4, h: 0.36, bold: true, color, fontSize: 15, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size), { x: x + 0.2, y: y + 0.5, w: w - 0.4, h: listNeed + 0.06, paraSpaceAfter: 4 });
  return h;
};
// A table on the left (x 0.6) with a navy header row; warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize, y) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  const top = y || 1.5;
  const bottom = top + rowH.reduce((a, b) => a + b, 0);
  if (bottom > 5.12) console.warn(`  ! slide ${pres.slides.length} table runs past the decision bar (bottom ${bottom.toFixed(2)} in)`);
  return s.addTable([head(header), ...body], tableOpts(colW, { y: top, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why visibility comes first", S_WHAT = "What to collect, keep and act on",
  S_WHO = "Who runs security operations", S_HOW = "How to respond and evidence it";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "Security Operations: the executive briefing", "Book 12 — Security Operations & Telemetry  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CISO, the SOC lead, the CIO and authorizing officials", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 12 of the Federal Modernization Workbook, Security Operations and Telemetry. It runs about thirty minutes, for the people who decide what the agency can see and what it does about it: the CISO, the SOC lead, the CIO and the authorizing officials.

The book's question is why you can't defend what you can't see, and the argument runs in three sentences. Detection and response are only as good as the telemetry that reaches them, and the gaps that matter most raise no alarm: a plane that never emitted looks exactly like a plane where nothing happened. A log warehouse isn't a detection engine; storing everything satisfies nobody's requirement to analyze it. And a finding closes only when the thing is fixed, with proof.

I'll take four questions: why visibility comes first, and what federal policy now requires; what to collect, keep and act on, including the SIEM, data and retention decisions and their cost; who runs security operations, and who accepts the risk of what isn't seen; and how to respond and evidence it.

Two labels run through the deck, as they do through the book. The evidence contract, the six planes, the ownership model, the response ladder and the metrics are the program's design, not federal requirements. And product statements are dated observations, as of October 21, 2026.

Every decision slide names the decision, its owner and when it's needed, and the last slide gathers them into one table.`,
  "Book 12, index; Chapter 01 — You Can't Defend What You Can't See (The question this book answers; The case in one paragraph).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "A dashboard measures what arrived, not what didn't");
  tag(s, "Why");
  figure(s, "ch01-silent-gaps", 0.6, 6.9);
  sideBox(s, "Gaps", "FaPlugCircleXmark", HEX.red, HEX.redTint, "Four gaps that raise no alarm", [
    "A source that was never connected",
    "A connector that shows green, with no data",
    "Data kept where no rule can run on it",
    "Logging switched off on purpose",
  ]);
  takeaway(s, "FaListCheck", HEX.red, "Measure coverage against the inventory.  ",
    "A gap can only be found by comparing what arrived with what was expected to arrive, plane by plane and asset by asset.");
  sources(s, "Sources: OMB M-26-14; CISA BOD 23-01; CISA Microsoft Expanded Cloud Logs Playbook (May 2026); Microsoft Learn (Azure Monitor, Sentinel). Book 12, Chapter 01.");
  narrate(s,
`Most agencies would say they already act on this. They run a SIEM, pay for log storage, and can show an auditor a dashboard with millions of events a day. The trouble is that each of those measures what arrived. None of them measures what didn't.

The figure shows four ways a gap stays silent. Some sources are never connected: in Azure, the logs that record what happens inside a resource aren't collected until someone adds a setting for that resource. Some are connected but not flowing: Microsoft's own guidance says a connector's green status means a collection rule exists, not that data arrived. Some are collected but never analyzed, because data kept in a low-cost tier generates no alerts. And some are switched off on purpose; CISA warns that disabling logging is well-documented attacker behavior.

The 2023 intrusion into Exchange Online mailboxes shows what's at stake. It was first detected by a federal victim, using mailbox-access events that were then available only with a premium audit license. Microsoft later extended those logs to lower license tiers. The organizations that didn't have them weren't warned by their absence. They simply had nothing to look at.

So the takeaway: none of these gaps can be found by looking at what arrived. M-26-14 tells agencies to use asset data to confirm that log coverage spans all their IT, and BOD 23-01 calls asset visibility a basic precondition.`,
  "Book 12, Chapter 01 — You Can't Defend What You Can't See (For decision makers; Why gaps stay silent; BOD 23-01 and CDM: the asset denominator).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Storing logs isn't detecting with them");
  tag(s, "Why");
  figure(s, "ch01-warehouse-not-detection", 0.6, 6.9);
  sideBox(s, "Controls", "FaBook", HEX.navy, HEX.navyTint, "What the controls keep apart", [
    "AU-12: generate the audit records",
    "AU-6: review and analyze them, and report",
    "SI-4: monitor and analyze for attacks",
    "M-26-14 scores alerts, not volume",
  ]);
  decision(s, "Count a source as monitored only when an enabled rule reads it and its output reaches a queue someone owns (program design)",
    "CISO sets it; security engineering builds", "Now, in the Agency Logging Plan");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-3, AU-6, AU-12, SI-4); OMB M-26-14, Appendices B and C; Microsoft Learn — Sentinel data lake guidance. Book 12, Chapters 01, 05 and 10.");
  narrate(s,
`The distinction this book rests on is between two things that are easy to buy as one: a place where logs are kept, and a capability that looks at them.

NIST keeps them in separate controls. AU-12 requires the system to generate audit records. AU-6 is a different obligation: review and analyze those records for signs of unusual activity, report what's found, and adjust when risk changes. SI-4 adds monitoring for attacks. An agency can satisfy AU-12 completely and still fail AU-6 and SI-4, if nothing that would notice an attack ever reads the records.

M-26-14 makes the same distinction in federal policy. Logs must be actively searchable for six months, meaning detections can run on them without preparation, and retrievable for a year. Its last required activity is generating appropriate automated alerts for all of the others. And its maturity model scores collection by alerting: at the first level, actionable alerts cover less than half of the minimum baseline; at Level 3, at least 70 percent; at Level 4, at least 95.

Vendor architecture makes it concrete. Microsoft is plain that logs ingested only into Sentinel's data lake tier don't generate alerts.

So the program's rule, which is design: no source counts as monitored until an enabled rule reads it, and no rule counts until its output reaches a queue someone owns. The CISO, who owns detection requirements, sets it in the logging plan; security engineering builds it.`,
  "Book 12, Chapter 01 (A warehouse is not a detection engine); Chapter 05 — From Log Warehouse to Detection (What AU-6 requires; Warehouse versus detection engine: the program's design rule); Chapter 10 (responsibility matrix: detection coverage priorities).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "M-26-14 is the logging requirement now");
  tag(s, "Why");
  const rows12 = [
    ["May 22, 2026", "M-26-14 rescinds M-21-31, effective immediately"],
    ["Aug 20, 2026", "CISA publishes the Logging Reference Architecture"],
    ["Nov 18, 2026*", "Agency Logging Plan due (90 days)"],
    ["Dec 18, 2026*", "Level 1 on every element (120 days)"],
    ["Feb 16, 2027*", "Level 2 (180 days)"],
    ["Jul 6, 2027*", "Level 3 (320 days); weakest element sets it"],
  ];
  leftTable(s, ["Date", "What M-26-14 sets"], rows12.map((r) => [bold(r[0]), { text: r[1] }]),
    [1.75, 5.15], [0.4, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46], 12.5);
  sideBox(s, "Others", "FaLandmark", HEX.navy, HEX.navyTint, "The other drivers, read narrowly", [
    "BOD 25-01: configuration results to CISA",
    "BOD 23-01: the asset denominator",
    "CISA: incidents reported within one hour",
    "FedRAMP's indicators bind providers",
  ]);
  decision(s, "Own the Agency Logging Plan as the program's visibility plan, funded as such, not as a storage purchase",
    "CISO owns it; the CIO funds it", "Due Nov 18, 2026*");
  sources(s, "Sources: OMB M-26-14 (May 22, 2026); CISA Logging Reference Architecture (Aug 20, 2026); BOD 25-01; BOD 23-01; CISA notification guidelines. Book 12, Ch. 01, 10; Book 00, Ch. 01.");
  narrate(s,
`Now the federal requirement, as the book states it. OMB M-26-14, issued May 22, 2026, rescinded M-21-31 effective immediately. OMB's reason was that some of the old requirements, such as retaining vast quantities of logs without clear utility, proved neither feasible nor cost-effective. So the retention figures many teams still quote, a year active and eighteen months cold, were M-21-31's, and they're gone.

M-26-14 directs logging around two objectives: continuous event monitoring, and threat hunting, investigation, response and forensics. It covers every system the agency operates or a third party operates for it. Logs must be searchable for six months and retrievable for a year, and readily available to the agency's top-level SOC. After a compromise, agencies provide logs to CISA and the FBI on request. It names no product and no SIEM.

The clock runs from CISA's Logging Reference Architecture, published August 20. Counted from that date, the logging plan is due November 18, Level 1 on December 18, Level 2 in February and Level 3 in July 2027. Those dates are the program's arithmetic, not dates OMB published, which is why they carry an asterisk.

The other drivers are narrower than often said: BOD 25-01 is about configuration results reported to CISA; BOD 23-01 supplies the asset denominator; FedRAMP's 2026 indicators bind cloud providers, not agencies.

The book's ask: the CISO owns the Agency Logging Plan, and it's funded as the visibility plan, not a storage purchase.`,
  "Book 12, Chapter 01 (What the federal drivers actually require: M-26-14, BOD 25-01, BOD 23-01, FedRAMP's indicators; The case in one paragraph: Ask); Chapter 05 (Retention, briefly); Chapter 10 (responsibility matrix: Agency Logging Plan); Book 00, Chapter 01 (dates counted from the reference architecture).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = content(S_WHY, "One evidence contract, one join key");
  tag(s, "Why");
  figure(s, "ch02-evidence-contract", 0.6, 5.6);
  sideBox(s, "Contract", "FaFingerprint", HEX.teal, HEX.tealTint, "A contract, not a console", [
    "Every source emits the same fields, fixed in advance",
    "Joined on authoritative asset identity plus time",
    "Each stack's own ID is meaningless outside it",
    "The naming plane comes before the pipeline",
    "Normalization is funded as each source onboards",
  ], { x: 6.4, w: 6.35 });
  decision(s, "Stand up the naming plane before the evidence pipeline, reconcile every stack's inventory to it, and write the contract into the logging plan",
    "CISO; DNS/DDI team and identity eng. own the naming plane", "Before the pipeline is built");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-3, AU-12(1), CA-7, CM-8); OMB M-26-14; NIST SP 800-137; Microsoft Learn — ASIM. Book 12, Chapters 02 and 10.");
  narrate(s,
`A multi-cloud agency runs several management stacks, and each reports in its own schema against its own inventory. Five stacks, five inventories, five log formats. When an assessor asks whether a vulnerability is remediated across the whole estate, and to prove it, five partial views that don't reconcile can't answer.

The program's answer is an evidence contract: one record shape that every source emits, with its fields fixed in advance, correlated on one authoritative asset identity and on time, and delivered to the consumers the agency owes, CISA's continuous diagnostics program first among them. The contract is program design; the controls it closes are NIST's.

The join key is the point. Two records describe the same asset only if they carry the same identifier, and every stack has its own idea of what that is. So the key comes from the naming plane, the authoritative name or address from IPAM and DDI, not any stack's local ID. A service-management CMDB reconciles to it; it doesn't replace it. And M-26-14 requires timestamps synchronized to a traceable time source, which is the other half of the key.

Chapter 02's ask has three parts: stand up the naming plane before the evidence pipeline and reconcile every stack to it; write the contract into the Agency Logging Plan, which the CISO owns; and fund normalization as each source is onboarded, not as a later dashboard project. In the book's matrix, the naming plane belongs to the DNS and DDI team, with identity engineering.`,
  "Book 12, Chapter 02 — Telemetry Is the Precondition: The Evidence Contract (Five stacks, five inventories; The case in one paragraph; The join key; One queue for every finding); Chapter 10 (plane owners table: naming plane).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Six planes, each emitting on purpose");
  tag(s, "What");
  figure(s, "ch10-plane-owners", 0.6, 6.2);
  sideBox(s, "Defaults", "FaUserClock", HEX.amber, HEX.amberTint, "Defaults that quietly expire", [
    "Entra ID keeps its own logs about a month",
    "Azure's activity log: deleted after 90 days",
    "Resource logs: off until a setting exists",
    "Microsoft 365 audit: 180 days below E5",
  ], { x: 7.05, w: 5.7 });
  decision(s, "Set what each plane and system must emit in the logging plan; each platform owner decides how its platform emits it and keeps it on",
    "CISO decides what; platform owners decide how", "In the logging plan, then at every change");
  sources(s, "Sources: OMB M-26-14, Appendix B; Microsoft Learn — Entra ID monitoring, Azure Monitor activity and resource logs, Purview audit retention. Book 12, Chapters 01, 03, 04, 10.");
  narrate(s,
`Telemetry is emitted, not collected: the setting that makes a source talk lives in that source's platform. So the program treats the estate as six planes, each with its own native logging and its own ways of going quiet: identity, cloud platform, Microsoft 365, endpoints and servers, network and DNS, and data. The figure shows the owner of each.

Two properties matter more than the list. No plane covers the baseline alone: identity says who, the network says from where to where, the endpoint says what ran, and the data plane says what was touched. An investigation that needs all four fails if one is dark. And every plane applies to every system, including those a contractor runs for the agency.

The defaults are where visibility leaks. Entra ID keeps its own logs for about a month unless someone sends them somewhere. Azure keeps its activity log for 90 days and then deletes it, and it's the only place Azure records who created a resource. Resource logs aren't collected at all until a setting exists for each resource. And Microsoft 365 audit records keep a year only for users with an E5-level license; everyone else, including every guest, gets 180 days, a split no dashboard shows.

The matrix splits the emission decision on purpose. The CISO decides what each plane must emit, in the logging plan. Each platform owner decides how, and keeps it emitting. Security engineering decides where it lands.`,
  "Book 12, Chapter 01 (The six planes that must emit); Chapter 03 — Identity Telemetry from Entra ID (opening); Chapter 04 — Azure Platform and Microsoft 365 Audit Telemetry (Part 1; Part 2; Retention follows the user's license); Chapter 10 (The platform owners; responsibility matrix: emission rows).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Keep telemetry flowing through the migration");
  tag(s, "What");
  rows(s, "Move", "WHERE TELEMETRY GOES QUIET DURING CHANGE", [
    ["New", "Resources born silent unless policy makes them emit"],
    ["Old", "Policy fixes existing ones only with a remediation task"],
    ["Moved", "Stale settings outlive a deleted or renamed resource"],
    ["Hybrid", "Defender for Identity sees on-premises sign-ins"],
    ["Console", "Sentinel moves to the Defender portal, March 2027"],
  ], 1.88, 0.62, 0.54, { w: 6.6 });
  sideBox(s, "Check", "FaArrowsRotate", HEX.teal, HEX.tealTint, "Check flow, not settings", [
    "Freshness of every table the rules read",
    "A per-device view for forwarded appliances",
    "A saved setting isn't proof of arrival",
    "Unexplained loss of emission is an incident",
  ], { x: 7.45, w: 5.3 });
  decision(s, "Keep every plane emitting through each migration change, check freshness daily, and treat an unexplained loss of emission as an incident",
    "Platform owners; security eng. checks it", "Every change, from the first wave");
  sources(s, "Sources: Microsoft Learn — Azure Policy remediation; diagnostic settings; Sentinel connector health; Sentinel in the Defender portal. Book 12, Chapters 03, 04, 05, 10.");
  narrate(s,
`Modernization is a long run of changes, and change is when telemetry goes quiet. The book's mechanics add up to five places to watch; the list is this deck's gathering of them.

New resources are born silent unless policy makes emission a property of the platform. Azure Policy can deploy the setting automatically, but it fixes existing resources only when someone runs a remediation task; the common failure is a dashboard trending green while everything that predates the policy emits nothing. When a resource is deleted, renamed or moved, its diagnostic settings have to be removed too, or a re-created resource can inherit the old one; decommissioning runbooks include that step. During the move off Active Directory, Defender for Identity is how Sentinel and Defender see on-premises Kerberos and NTLM behavior at all. And the console itself is moving: after March 31, 2027, Sentinel is supported only in the Defender portal, so new work is planned there.

The check is on flow, not settings. A setting that saved without error isn't proof that logs arrive. The program checks the freshness of every table its rules read, keeps a per-device view for forwarded appliances, because a table can be fresh while one device behind it has gone quiet, and turns a stale required source into an incident.

The decision follows the matrix: platform owners keep emission on through every change; security engineering runs the checks; and an unexplained loss of emission is an incident, not a ticket.`,
  "Book 12, Chapter 04 (Part 3: enforce emission with Azure Policy; Where DeployIfNotExists stops; The self-reference loop and the rename trap); Chapter 05 (Where Sentinel runs; User and entity behavior analytics; Proving the connectors still deliver); Chapter 03 (Verify emission); Chapter 10 (Keeping the roles apart, item 2; responsibility matrix).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "The SIEM decision: one queue, clear division");
  tag(s, "What");
  figure(s, "ch05-warehouse-vs-engine", 0.6, 6.4);
  sideBox(s, "Split", "FaRightLeft", HEX.navy, HEX.navyTint, "Division of labor (design)", [
    "XDR detects what its own sensors see",
    "SIEM rules cover DNS, SASE, SQL, other clouds",
    "Detection logic is written once",
    "Raw tables streamed only where rules join them",
    "Check each feature in the agency's cloud",
  ], { x: 7.2, w: 5.55 });
  decision(s, "Set the division of labor between XDR and the SIEM, with one incident queue, and plan new detection work in the Defender portal",
    "Security engineering decides; CISO consulted", "Before new detection work");
  sources(s, "Sources: Microsoft Learn — Sentinel in the Defender portal; Sentinel and US Government feature availability; automatic attack disruption. Book 12, Chapters 05 and 10.");
  narrate(s,
`The SIEM decision is less about which product and more about behavior. A workspace alone is a warehouse: nothing runs on a schedule, and review happens when someone thinks to ask. Analytics rules, incidents and automation are what make it a detection engine, whose output an assessor can trace.

The program's version of the decision is a division of labor, which is design. Defender XDR detects what its own sensors see: endpoints, on-premises identity attacks, email and cloud apps; the SIEM doesn't re-implement those. SIEM rules cover what Defender can't see: DNS and DDI, SASE, SQL audit, non-Microsoft clouds and appliances, and correlations across them. Detection logic for Defender data is written once. And streaming every raw table is a cost decision, not a default: stream the ones the SIEM's rules join, and leave the rest in Defender.

Two platform facts shape it. Once Sentinel is in the Defender portal, Defender creates incidents from both, so there's one queue in one portal. And availability differs by cloud: some features this book relies on aren't available in Azure Government, and Microsoft's own pages differ on one connector for DoD, so each capability is confirmed against the agency's own cloud before it goes into a design.

In the matrix, where telemetry lands and how it's parsed and joined is security engineering's decision, with the CISO consulted. Set the division before new detection work starts.`,
  "Book 12, Chapter 05 — From Log Warehouse to Detection: SIEM and XDR (Warehouse versus detection engine; Where Sentinel runs, and which cloud's table to read; What Defender XDR contributes); Chapter 10 (responsibility matrix: where telemetry lands).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Retention: searchable, retrievable, then kept");
  tag(s, "What");
  const tiers = [
    ["Analytics tier", "Rules, alerts, hunting", "The only tier that alerts"],
    ["Basic plan", "Troubleshooting, response", "Queryable 30 days"],
    ["Lake, Auxiliary", "Long hunts, compliance", "No alerts; up to 12 years"],
    ["Immutable copy", "Tamper-protected evidence", "Not a detection source"],
  ];
  leftTable(s, ["Where data sits", "What it supports", "What to know"],
    tiers.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.85, 2.5, 2.6], [0.42, 0.5, 0.5, 0.5, 0.5], 12.5);
  T(s, "Tier note", "Tier summary from Microsoft Learn, as of October 2026. Moving a table between plans is limited to once a week, and moving it out of the analytics tier stops its alerts.",
    { x: 0.6, y: 4.1, w: 6.95, h: 0.75, fontSize: 12, italic: true, color: HEX.slate });
  sideBox(s, "Who", "FaUsersGear", HEX.teal, HEX.tealTint, "Two decisions, two owners", [
    "CISO: the security floor, at least M-26-14's",
    "Records officer: disposition above it",
    "Shortening needs the records officer",
    "Records schedule for these logs in revision",
  ]);
  decision(s, "Keep detection sources in the analytics tier for at least six months; no retention is shortened without the records officer's concurrence",
    "CISO sets the floor; records officer decides disposition", "Now, and before any tier change");
  sources(s, "Sources: OMB M-26-14, Appendix B; Microsoft Learn — table plans, Sentinel data tiers, data export, immutable storage; NARA GRS 3.2 and status page. Book 12, Chapters 10, 12.");
  narrate(s,
`Retention is two decisions that are easy to collapse into one cost setting.

M-26-14 defines the words. Searchable means detections and analytics can run on the data without preparation; retrievable means usable after an intermediate step, such as restoring it from long-term storage. The program reads that against the storage tiers, and the reading is its own interpretation. Detection sources stay in the analytics tier for at least six months, because only that tier raises alerts. The lake and auxiliary tiers can meet retrievable, and suit long hunts over high-volume sources the SOC doesn't alert on. A tamper-protected copy in immutable storage supports the audit-protection control and M-26-14's higher log-management levels, but nothing in it raises an alert. And moving a table between tiers changes what the SOC can detect, and can only happen once a week per table.

Then the owners. The CISO sets the security floor, at least M-26-14's. The records officer decides disposition above it, because M-26-14 says its minimums don't relieve agencies of records schedules. The schedule items for cybersecurity logs still cite the rescinded memo, and NARA lists their revision as in drafting as of October 2026, so how they apply is a records decision, not an engineering default.

So: detection sources stay in the analytics tier for at least six months, and no retention is shortened without the records officer's concurrence, because once data is gone it can't be recovered for an investigation, an audit or a legal hold.`,
  "Book 12, Chapter 12 — Evidence, Metrics and Continuous Monitoring (Retention tiers and tamper-protected copies, design rules 1 to 4 and the two cautions); Chapter 10 — Who Runs Security Operations (The records officer, the privacy office and counsel; Who decides what is collected and how long it is kept; responsibility matrix: retention rows).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Cost is where visibility gaps get decided");
  tag(s, "What");
  rows(s, "Cost", "COST AND RETENTION TRADE-OFFS THE BOOK NAMES", [
    ["Tiering", "Cheap storage that raises no alerts"],
    ["Streaming", "Raw XDR tables cost money; stream only joined ones"],
    ["Licensing", "Audit history follows each user's license"],
    ["Defaults", "Short native windows unless exported"],
    ["Noise", "Noisy preview logs cost money, add little"],
  ], 1.88, 0.62, 0.54, { w: 6.6 });
  sideBox(s, "Gap", "FaScaleBalanced", HEX.amber, HEX.amberTint, "When a saving becomes a gap", [
    "The CIO's funding line decides most gaps",
    "A detection source moved to the lake is a gap",
    "Record it, with its decider and an end date",
    "A gap carried, not closed, is the AO's call",
  ], { x: 7.45, w: 5.3 });
  decision(s, "Fund ingestion and retention as a visibility decision; a detection source moved out of the analytics tier is recorded as a gap for the AO",
    "CIO funds; the AO accepts a carried gap", "Each budget cycle and tier change");
  sources(s, "Sources: Microsoft Learn — Sentinel data lake ingestion guidance, Defender XDR streaming, Entra ID log options; Microsoft Purview audit retention. Book 12, Chapters 01, 03, 04, 05, 10.");
  narrate(s,
`The book makes a pointed observation: the funding line for ingestion and retention is where most visibility gaps are actually decided. So cost belongs in this room.

Tiering is a sound cost decision for high-volume, low-signal sources. It becomes a visibility failure when a source with detection value is routed to the cheap tier to save money and nobody records that it now has no detection coverage. Such a source may meet the retention floor while contributing nothing to M-26-14's alerting measure. Streaming every raw XDR table into the SIEM costs money too, so stream only the tables the SIEM's rules join. Audit history follows each user's license, so a mixed estate has a split retention horizon. Native windows are short unless exported, though exporting Azure's activity log carries no ingestion charge. And some identity logs cost money to ingest and invite the wrong response: Microsoft says one high-volume preview log isn't essential for investigations, and the program leaves it off.

The decision has two halves. The CIO, who owns funding and scope, funds ingestion and retention as a visibility decision, not a storage line. And when a detection source does move out of the analytics tier, that's recorded as a telemetry gap the agency carries rather than closes, which, in the book's matrix, is the authorizing official's decision, with an end date and a plan of action.`,
  "Book 12, Chapter 10 (The CIO and executive sponsor: the funding line; responsibility matrix: telemetry gap carried rather than closed); Chapter 01 (A warehouse is not a detection engine: tiering); Chapter 05 (Microsoft Defender XDR: streaming is a cost decision); Chapter 03 (Leave MicrosoftServicePrincipalSignInLogs off); Chapter 04 (Part 1; Retention follows the user's license).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "Every finding lands in one queue, on a clock");
  tag(s, "What");
  figure(s, "ch06-remediation-clock", 0.6, 5.4);
  sideBox(s, "BOD", "FaUserClock", HEX.red, HEX.redTint, "BOD 26-04, June 10, 2026", [
    "Replaced BOD 22-01 and BOD 19-02",
    "Four questions set each asset's clock",
    "From 3 days to fix-on-upgrade",
    "Clock starts at KEV listing or first detection",
    "A scanner measures; it never remediates",
  ], { x: 6.25, w: 6.5 });
  decision(s, "Remediate each finding within its BOD 26-04 timeline; a deadline the agency will miss is a risk acceptance for the AO",
    "System owner remediates; the AO decides a miss", "On each finding's clock");
  sources(s, "Sources: CISA BOD 26-04 (June 10, 2026) and implementation guidance; BOD 23-01; KEV catalog feed (Oct 21, 2026); NIST SP 800-53 RA-5, SI-2. Book 12, Chapters 02, 06, 10.");
  narrate(s,
`Detection is only one kind of finding. A missing patch, a known exploited vulnerability, a drifted configuration, a storage account open to the internet and a labeled file that left the agency are all statements about an asset's state against an intended state. In the program's design they're all records of the same contract, in the same queue as threat detections.

The clock changed this year. CISA's BOD 26-04, issued June 10, 2026, revoked BOD 22-01 and BOD 19-02 and replaced severity buckets with four questions about each vulnerable asset: is it publicly exposed, is the flaw in CISA's known-exploited catalog, can exploitation be automated, and does it give partial or total control. The answers set the maximum timeline, from three days, with forensic triage in some cases, to fixing it at the next system upgrade. The clock starts when CISA lists the flaw or when the agency first finds it on an asset, whichever is earlier. The directive also requires agencies to assign roles for executing it.

The book is firm on one point: a scanner authors no state. It measures the distance between what a machine runs and what it should run. A finding closes when the next scan no longer sees it and the platform's record says what fixed it.

In the matrix, the system owner decides how and when a finding is remediated within its timeline. A deadline the agency will miss is a risk acceptance, so it goes to the authorizing official.`,
  "Book 12, Chapter 02 (One queue for every finding); Chapter 06 — Vulnerability Management (The directive that governs KEV: BOD 26-04; The scanner is not remediation); Chapter 10 (BOD 26-04 role assignment; responsibility matrix: remediation rows).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "The SOC runs the queue; it doesn't decide alone");
  tag(s, "Who");
  figure(s, "ch10-who-runs-security-operations", 0.6, 6.2);
  sideBox(s, "CCP", "FaUserShield", HEX.teal, HEX.tealTint, "The SOC as common control provider", [
    "Its inherited controls are assessed too",
    "Most are hybrid: SOC plus system owner",
    "The system owner stays accountable",
    "Its controls need an AO of their own",
  ], { x: 7.05, w: 5.7 });
  decision(s, "Designate one top-level SOC, decide how it's staffed and sourced, and fund it; its common controls get their own authorizing official",
    "CIO and sponsor", "Before the logging plan is submitted");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Appendix D; tasks M-1 to M-6); OMB M-26-14; CISA Federal Incident Notification Guidelines. Book 12, Chapter 10.");
  narrate(s,
`Who runs security operations? Most agencies can name their SOC. Fewer can say who decided that a log source is collected, how long its records are kept, who owns the rule that reads it, or who accepted the risk when it went quiet for three weeks. In practice those decisions get made by whoever holds the console. Each looks operational. Each changes what the agency can see.

So the book's model, which is the program's recommended design, separates them. The SOC runs the queue. The CIO and sponsor own scope and funding, and decide which SOC is top-level. The CISO sets logging, detection and evidence requirements and decides major incidents. The authorizing official accepts residual risk, including the risk of not seeing. Security engineering owns the SIEM, the rule library and the evidence pipeline. Platform owners keep their planes emitting. Records, privacy and counsel decide disposition, log content and the legality of monitoring.

NIST's framework has no SOC role. The closest fit is a common control provider, and that has consequences: if every system's plan says monitoring is inherited from the SOC, the SOC owes those systems an assessed control and a plan when it falls short. Most of those controls are hybrid, because only the system owner knows what unusual looks like in a particular application.

The CIO's decision comes first: one top-level SOC, so M-26-14's availability requirement points at one place, and a decision on whether it's an agency, departmental or managed service.`,
  "Book 12, Chapter 10 — Who Runs Security Operations (opening; Where the roles come from; The SOC is a common control provider; The roles: CIO and executive sponsor, CISO, authorizing official, top-level SOC, security engineering).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Who decides what in security operations");
  tag(s, "Who");
  const owners = [
    ["Scope, funding, which SOC is top-level", "CIO and sponsor"],
    ["Logging plan; what each plane emits", "CISO"],
    ["Retention floor; acting playbooks", "CISO"],
    ["Major incident determination", "CISO"],
    ["Triage, closure; notify CISA in 1 hour", "Top-level SOC"],
    ["Each rule: build, test, tune, retire", "Security engineering"],
    ["Disposition; any shorter retention", "Records officer"],
    ["Gaps, open suppressions, missed fixes", "Authorizing official"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r, i) => [{ text: r[0] }, bold(r[1], i === 7 ? HEX.amber : HEX.teal)]),
    [4.1, 2.8], [0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38], 12);
  sideBox(s, "Rule", "FaClipboardCheck", HEX.navy, HEX.navyTint, "Every rule has one owner", [
    "One named engineer, and a backup",
    "Its source tables, response and test",
    "A review date, and any suppression's end",
    "The SOC is consulted on every tuning",
  ]);
  decision(s, "The SOC identifies incidents and notifies CISA within one hour; the CISO decides in parallel whether an incident is major",
    "Top-level SOC; the CISO for major", "From the moment of identification");
  sources(s, "Sources: CISA Federal Incident Notification Guidelines; NIST SP 800-37 Rev. 2; OMB M-26-14; NARA GRS 3.2. Book 12, Chapter 10 (responsibility matrix and its seven comments).");
  narrate(s,
`The responsibility matrix, in one view, with one decider per row.

The CIO and sponsor decide scope, funding and which SOC is top-level. The CISO decides the Agency Logging Plan and what each plane emits, the security retention floor, who may read log data, detection priorities, any playbook that acts on production, and whether an incident is major. The SOC decides triage, severity and closure. Security engineering decides each rule: how it's built, tested, tuned and retired. The records officer decides disposition and any shortening of retention. And the authorizing official decides the residual risks.

Every analytics rule and playbook has exactly one owner, a named engineer in security engineering, recorded next to the rule with its purpose, the tables it reads, its response, its test and a review date. The source tables matter: when a table goes silent, the program can trace which rules it blinds.

One row deserves its own decision, because the clock is federal. Civilian agencies must notify CISA of an incident within one hour of its identification by the agency's top-level incident response team, SOC or IT department. An hour leaves no time for a decision to travel up and back, so the matrix gives the notification to the SOC, decision and work. The CISO's major-incident determination, which can take longer, runs alongside it.`,
  "Book 12, Chapter 10 — Who Runs Security Operations (Where the roles come from: CISA's incident notification guidelines; The roles; Who owns each detection and playbook; The responsibility matrix and the notification row comment).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "Accepting the risk of what isn't seen");
  tag(s, "Who");
  rows(s, "Risk", "FOUR RISKS THAT GET ACCEPTED SILENTLY", [
    ["Source", "Not collected, or not reaching the top-level SOC"],
    ["Rule", "Suppressed or disabled with no end date"],
    ["Retention", "Kept for less than the requirement"],
    ["Deadline", "A remediation timeline that will be missed"],
  ], 1.88, 0.72, 0.62, { w: 6.6 });
  sideBox(s, "Apart", "FaLock", HEX.navy, HEX.navyTint, "Keeping the roles apart", [
    "No one quietly shortens the record",
    "Owners can't silence their own plane",
    "The SOC doesn't assess the SOC",
    "Contractors prepare; only the AO signs",
  ], { x: 7.45, w: 5.3 });
  decision(s, "A bounded exception with an end date is the CISO's to approve; one without an end date goes to the AO, with a plan of action entry",
    "CISO recommends; the AO decides", "When each gap is found");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (authorizing official; conflicts of interest); NIST SP 800-53 Rev. 5 (AU-9); OMB M-26-14. Book 12, Chapters 10 and 12.");
  narrate(s,
`Under the Risk Management Framework, the authorizing official is the only official who can accept security and privacy risk, and for this book that includes the risk of not seeing.

Security operations generates four kinds of residual risk that tend to be accepted silently by whoever is closest to them: a source that isn't collected or doesn't reach the top-level SOC; a rule suppressed with no end date, which leaves a monitored source unanalyzed indefinitely; retention below the requirement; and a remediation deadline that will be missed. Each one is written up by the role that found it, recommended by the CISO, and decided by the authorizing official for the affected system, with an end date and a plan of action entry. A finding that can't be closed in time isn't closed by exception; it's carried, by decision.

Because security operations holds the record of what everyone else did, its own separations matter more than most. No one can quietly shorten the record: retention rights are eligible, not standing, and used only with the records officer's concurrence. Platform owners can't silence their own plane without it being detected. The SOC doesn't assess the SOC. And the authorizing official stays outside: a managed SOC or contractor team can prepare every risk acceptance, but can't sign one.

The time split matches the other books: a bounded exception with an end date is the CISO's; one without goes to the authorizing official.`,
  "Book 12, Chapter 10 — Who Runs Security Operations (The authorizing official; Who accepts the risk of what isn't seen; Keeping the roles apart); Chapter 12 (Closing a finding).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Detections need rules; rules need owners");
  tag(s, "How");
  figure(s, "ch11-rule-lifecycle", 0.6, 3.65);
  sideBox(s, "Code", "FaCodeBranch", HEX.navy, HEX.navyTint, "A library as code", [
    "A change is a commit, never a portal edit",
    "Alert-only before a rule opens incidents",
    "Scheduled review: does it still fire?",
  ], { x: 4.45, w: 4.1, minH: 3.6 });
  sideBox(s, "Limits", "FaTriangleExclamation", HEX.amber, HEX.amberTint, "Honest limits", [
    "Detection takes minutes to hours",
    "The library sees one tenant",
    "Detections rot without upkeep",
  ], { x: 8.7, w: 4.05, minH: 3.6 });
  decision(s, "Run the rule library as code: every rule tested, run alert-only, promoted with its response wired, and reviewed on a schedule",
    "Security engineering; CISO sets priorities", "Before any rule opens incidents");
  sources(s, "Sources: Microsoft Learn — Sentinel scheduled and NRT rules, Repositories, rule templates; NIST SP 800-53 Rev. 5 (SI-4). Book 12, Chapters 05, 10 and 11.");
  narrate(s,
`Now the how. A rule that fires without a response shortens the time to know, not the time to contain. And a rule nobody owns rots.

The program keeps its rules as a library in version control, in the same shape Microsoft's own templates use, so the two can be compared. The library is the source of truth, not the portal: nobody edits a production rule by hand; a change is a commit, reviewed and deployed. Where Sentinel's repository feature isn't available, as in Azure Government, the program deploys the same content through its own pipeline.

Every rule follows the lifecycle in the figure: authored with its thresholds marked for tuning, tested against history, deployed alert-only while every false positive is logged, promoted to open incidents once its false-positive rate is measured and its response is wired, and then reviewed on a schedule: does it still fire, and does its source still emit?

The book carries honest limits into every assessment. Scheduled rules run no more often than every five minutes plus a five-minute delay, so detection is minutes to hours. The library sees one tenant. And detections rot quietly without standing engineering effort. Where a vendor analytic isn't available in the agency's cloud, the program rebuilds a deterministic equivalent inside its own boundary rather than shipping telemetry out.

Security engineering runs the library, with the CISO setting coverage priorities. No rule opens incidents before it has been through the cycle.`,
  "Book 12, Chapter 11 — Detection Engineering and Response Automation (The in-boundary principle; A rule library as code; Rule lifecycle and testing; Honest limits); Chapter 05 (Mean time to detect); Chapter 10 (Who owns each detection and playbook).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Response climbs a ladder, gated by a person");
  tag(s, "How");
  figure(s, "ch11-response-ladder", 0.6, 5.3);
  sideBox(s, "Gate", "FaUserCheck", HEX.teal, HEX.tealTint, "Where a person stays in the loop", [
    "Gated action is the default for large blast radius",
    "Server isolation stays gated, always",
    "So do privileged and emergency accounts",
    "Vendor auto-containment only if the AO accepts it",
  ], { x: 6.15, w: 6.6 });
  decision(s, "Approve each playbook that acts on production; decide whether vendor attack disruption is an accepted autonomous class, with exclusions",
    "CISO approves playbooks; the AO decides disruption", "Before anything acts on its own");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (SI-4(7), IR-4); NIST SP 800-61 Rev. 3; Microsoft Learn — automatic attack disruption, session revocation. Book 12, Chapters 10 and 11.");
  narrate(s,
`Detection without response shortens the investigation, not the exposure. But a response that acts without a gate turns a noisy rule into an outage.

So every playbook is confidence-gated, and placed on the program's actuation ladder, which is design. Every alert is observed: an incident opens and evidence is kept. Medium confidence advises: the playbook enriches the incident and an analyst decides. High confidence gets gated action: the playbook prepares the containment, revoking sessions, disabling a standard user, isolating a workstation, and a named approver releases it. Autonomous action is allowed only for enumerated low-blast-radius classes, such as closing incidents that match a known-benign list.

Three classes stay gated permanently, whatever the program's maturity: isolating a server, disabling a privileged or emergency-access account, and any tenant-wide change. A false-positive isolation of a production database server is an outage; a disabled emergency account during an incident is a lockout.

Defender XDR's automatic attack disruption tests the ladder, because it contains assets on its own by the vendor's design. The program doesn't leave it as a default nobody chose. The authorizing official either accepts it as an autonomous class, with exclusions for emergency accounts and protected servers, or the program records why it's limited.

And the matrix gives the CISO the approval of any playbook that acts on production, with the affected platform owner consulted, because it exercises authority on someone else's platform.`,
  "Book 12, Chapter 11 — Detection Engineering and Response Automation (The response ladder; Playbooks; Honest limits); Chapter 10 (Who owns each detection and playbook: playbooks that act; responsibility matrix: acting playbook row).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Evidence an assessor can verify, and re-run");
  tag(s, "How");
  figure(s, "ch12-conmon-pipeline", 0.6, 6.9);
  sideBox(s, "Record", "FaFileShield", HEX.navy, HEX.navyTint, "The four-part incident record", [
    "The alert: which rule fired, on what",
    "The ticket, linked by ID",
    "Response notes, with every action",
    "Closure: the verdict and the proof",
  ]);
  decision(s, "Close a finding only when the re-test shows it fixed and the record links the fix to the proof; a finding never closes on ticket status",
    "Platform owner fixes; system owner's plan closes", "Every finding");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-7, AU-6) and SP 800-53A; NIST SP 800-137; NIST SP 800-37 Rev. 2; CISA and FBI AA23-193A. Book 12, Chapters 05, 10 and 12.");
  narrate(s,
`Continuous monitoring isn't a claim that monitoring happens. It's a pipeline that keeps producing evidence bound to controls, and a finding that stays open until the thing is fixed and the fix is proven.

The figure is the program's pipeline: every plane emits records of the contract; they're normalized, correlated on asset and time, bound to the control they evidence, reported as metrics and posture reports, and then someone responds: the system owner remediates, and the authorizing official decides on residual risk.

The practical test of review in an assessment is whether the program can produce the chain from detection to response for a real event. The book adopts a practitioner standard: show an alert that fired in the last thirty days, the incident it generated and what was done about it. If none fired, either the environment was clean, which is unlikely, or the rules are broken, or there are none. So every incident carries four parts: the alert, the linked ticket, timestamped response notes, and a closure with its verdict and proof. Assessors read that evidence and can re-run it, but never edit it.

Closure has three parts. The platform owner fixes it through change control. The pipeline re-tests: the next scan or check shows the condition gone. And the record links the two, so the plan of action item closes on evidence, not on a ticket status. Ongoing authorization depends on that discipline, because results have to mean what they say.`,
  "Book 12, Chapter 12 — Evidence, Metrics and Continuous Monitoring (What continuous monitoring asks for; The continuous-monitoring pipeline; What an assessor verifies; Closing a finding); Chapter 05 (The assessor evidence standard); Chapter 10 (Control assessors).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Metrics that say whether monitoring works");
  tag(s, "How");
  const metrics = [
    ["Detection coverage", "Baseline items an enabled, tested rule reads"],
    ["Completeness", "Minutes a required source stayed stale"],
    ["KEV remediation", "Closed on time, and open past deadline"],
    ["Conformance", "Pass, fail and excepted, counted apart"],
    ["Maturity", "M-26-14 level per system, lowest element"],
  ];
  leftTable(s, ["Metric", "What it counts (program design)"], metrics.map((r) => [bold(r[0]), { text: r[1] }]),
    [2.1, 4.8], [0.4, 0.5, 0.5, 0.5, 0.5, 0.5], 12.5);
  sideBox(s, "Rhythm", "FaChartLine", HEX.teal, HEX.tealTint, "Who sees what, how often", [
    "SOC manager: daily",
    "Platform owners: daily for KEV items",
    "CISO: monthly, and on any overdue KEV",
    "AO: monthly, or on significant change",
  ]);
  decision(s, "Adopt the metric set and its reporting rhythm, reporting M-26-14 maturity by system at its lowest element",
    "CISO decides; the AO receives", "Monthly (program design)");
  sources(s, "Sources: OMB M-26-14, Appendices B and C; CISA BOD 26-04; NIST SP 800-53 Rev. 5 (CA-7, AU-5, SI-2(3)); NIST SP 800-137. Book 12, Chapters 10 and 12.");
  narrate(s,
`CA-7 leaves metrics to the organization, so the program starts from the one federal scheme that already scores logging: M-26-14's maturity model, five levels across five elements, where a system's overall maturity is its lowest element.

Five metrics, each a design choice. Detection coverage is measured against M-26-14's baseline of activities, not the rule count: two hundred rules that all watch sign-ins cover one item, and an item counts only when an enabled rule with a passing test reads a source that's still fresh. Telemetry completeness is a control, not a health statistic: a silent source is an audit logging failure, so the program counts the minutes it stayed stale. KEV remediation is measured on closures and overdue items, not the open queue, because a compliance rate built on the open queue improves every time new findings arrive. Configuration conformance counts passes, failures and exceptions separately, so an exception never looks like a pass. And maturity is reported by system.

The rhythm is design too, sitting between CA-7's organization-defined frequency and the external clocks. The SOC manager sees incident timing and stale sources daily. Platform owners see KEV items daily. The CISO sees the full set monthly, and on any overdue KEV item. The authorizing official gets a posture report per system monthly, or on a significant change.

In the matrix, organization-level metrics and reporting frequencies are the CISO's decision.`,
  "Book 12, Chapter 12 — Evidence, Metrics and Continuous Monitoring (The metric set; The reporting rhythm); Chapter 10 (responsibility matrix: organization-level security metrics and reporting frequencies; posture reports).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Count a source as monitored only when a rule reads it", "CISO", "Now"],
    ["Own and fund the Agency Logging Plan as visibility", "CISO; CIO funds", "Nov 18, 2026*"],
    ["Naming plane first; contract in the logging plan", "CISO; DNS/DDI team", "Before pipeline"],
    ["Set what each plane emits; owners keep it on", "CISO; platform owners", "Every change"],
    ["Set the XDR and SIEM division; one queue", "Security engineering", "Before new rules"],
    ["Six months in analytics; no cut without records", "CISO; records officer", "Before tier changes"],
    ["Fund retention as visibility; record moved sources", "CIO; the AO for gaps", "Each budget cycle"],
    ["Designate and fund one top-level SOC", "CIO and sponsor", "Before the plan"],
    ["Notify CISA within one hour; decide major", "Top-level SOC; CISO", "On identification"],
    ["Open-ended gaps, suppressions, missed fixes", "Authorizing official", "When found"],
    ["Approve acting playbooks; decide on disruption", "CISO; the AO", "Before automation"],
    ["Close on re-test; report metrics monthly", "System owner; CISO", "Every finding"],
  ];
  const rh = [0.36, ...asks.map(() => 0.34)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.4, 3.25, 2.5][j] - 0.2;
    if (linesFor(c.length, w, 12) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.4, 3.25, 2.5], { y: 1.45, w: 12.15, fontSize: 12, rowH: rh }));
  T(s, "Close line", [{ text: "A gap nobody chose is still a decision.  ", options: { bold: true, color: HEX.amber } },
    { text: "Make it on purpose, with an owner, and close findings only with proof." }],
    { x: 0.6, y: 5.98, w: 12.15, h: 0.5, fontSize: 15, valign: "middle", align: "center" });
  sources(s, "Sources: OMB M-26-14; CISA BOD 26-04 and incident notification guidelines; NIST SP 800-37 Rev. 2. Book 12, Chapters 01–12. *Program's arithmetic. Undated timings are design guidance.");
  narrate(s,
`So, the decisions, with their owners.

The CISO counts a source as monitored only when an enabled rule reads it, owns the Agency Logging Plan due November 18, writes the evidence contract into it, and sets what each plane must emit. The DNS and DDI team and identity engineering stand up the naming plane before the pipeline. Platform owners keep their planes emitting through every change.

Security engineering sets the division of labor between XDR and the SIEM, with one incident queue, and runs the rule library as code. The CISO keeps detection sources in the analytics tier for at least six months, and the records officer must concur before any retention is shortened.

The CIO funds ingestion and retention as visibility, and designates and funds one top-level SOC. The SOC notifies CISA within an hour of identifying an incident, while the CISO decides whether it's major. The CISO approves any playbook that acts on production.

The authorizing official decides every gap carried without an end date, every open-ended suppression, every missed remediation deadline, and whether vendor attack disruption is accepted.

And findings close only on a re-test that proves the fix, with the metrics reported monthly.

The theme under all of it: a gap nobody chose is still a decision. Make it on purpose, with an owner. Book 12 has the detail, with every claim footnoted. Thank you.`,
  "Book 12, Chapter 01 (The case in one paragraph); Chapter 02 (Ask); Chapter 10 — Who Runs Security Operations (The responsibility matrix; What changes, in one table); Chapter 12 (Closing a finding; The reporting rhythm).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal requirements and guidance");
  const src = [
    "OMB M-26-14, Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats (May 22, 2026; rescinded M-21-31), Appendices A, B and C.  ·  CISA Logging Reference Architecture (August 20, 2026).",
    "CISA BOD 26-04, Prioritizing Security Updates Based on Risk (June 10, 2026), and implementation guidance; BOD 25-01 (December 17, 2024) and implementation guidance (July 27, 2026); BOD 23-01 (October 3, 2022); ED 26-03 V1 (March 11, 2026); Federal Incident Notification Guidelines; KEV catalog feed (October 21, 2026); CDM program; TIC 3.0 Program Guidebook v1.2 (September 2026); Microsoft Expanded Cloud Logs Implementation Playbook (May 2026); AA23-193A.",
    "NIST SP 800-53 Rev. 5 (AU-3, AU-5, AU-6, AU-9, AU-12, CA-7, CM-8, IR-4, RA-5, SI-2, SI-4 and enhancements), release 5.2.0; SP 800-53A; SP 800-37 Rev. 2 (Appendix D; tasks M-1 to M-6, S-5); SP 800-137; SP 800-61 Rev. 3 (April 2025).",
    "FedRAMP Consolidated Rules for 2026: Key Security Indicators (monitoring, logging and auditing), Vulnerability Detection and Response, Ongoing Certification Reports.  ·  NARA General Records Schedule 3.2 and GRS status updates (October 2026).",
    "Full footnotes with links and access dates (October 21–23, 2026): Book 12, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b12-security-operations/).",
  ];
  T(s, "Source list", bullets(src, 12.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: platforms and products, as of October 2026");
  const src = [
    "Microsoft Learn, Microsoft Sentinel: data lake ingestion guidance; scheduled and near-real-time rules; data connector health; Sentinel in the Defender portal; feature support by cloud; Repositories; roles and permissions; UEBA; Defender XDR connector and streaming event types; threat intelligence.",
    "Microsoft Learn, Azure Monitor: activity log; resource logs; diagnostic settings; table plans and data retention; data export; immutable Blob storage.  ·  Azure Policy DeployIfNotExists and remediation tasks.  ·  Cloud feature availability for US Government customers.",
    "Microsoft Learn, Microsoft Entra ID: monitoring and log options, diagnostic settings, sign-in and audit log retention.  ·  Microsoft Purview: unified audit log, audit retention policies, Office 365 Management Activity API.  ·  Defender Vulnerability Management on Arc-enabled servers.  ·  Automatic attack disruption.",
    "Vendor examples named in the book as examples only (connectors for DDI and SASE appliances); every capability to be confirmed against the agency's own cloud and the FedRAMP Marketplace at procurement.",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
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
