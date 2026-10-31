// Narrated chapter tours for the developer workbooks (docs/project-plans/developer-workbooks/<workbook>/).
// Each tour's folder, presentations/dw-<workbook>-<NN>-<slug>/, holds only build.js, which calls
//
//   require("../_build/devwb.js")({ workbook: "pa", chapter: 2, base: "DW_PA_02_Emergency_Access", title, subtitle, slides })
//
// and this file lays the slides out with the shared kit (lib.js), so all 27 tours look alike.
//
// A slide is { part, title, body: [elements], sources, say, detail, cite: [footnote names], ref }:
//   part      Why | What | Who | How: the tag, and the deck section
//   body      stacked top to bottom between the title and the Sources line; fonts shrink to fit, and
//             a slide that still doesn't fit fails the build. Elements:
//               { lead: "one plain statement" }
//               { bullets: [..], label?, color? }          (with a label it is a tinted panel)
//               { table: { head: [..], rows: [[..]], w: [relative widths] }, pt? }
//               { code: [lines], label?, pt? }             (Consolas; "#" lines in teal)
//               { cards: [{ title, text, color? }] }       (two to four across)
//               { steps: [{ title, text }] }               (numbered)
//               { callout: text, label, color?, icon? }
//               { cols: [[elements], [elements]], split? } (two columns; split is the left share)
//   sources   the short Sources line on the slide (at most 185 characters)
//   say       the narration: what the slide is for, in a speaking voice (narrate.py speaks only this)
//   detail    the full detail for a presenter; never spoken
//   cite      footnote names from the chapter; their full text goes into the notes, so every note cites the
//             chapter's own sources, and an unknown name fails the build
//   ref       the chapter sections the slide comes from ("Workbook:" line)
//
// Notes are "<say>\n\nDetail: <detail>\n\nSources: <footnotes>\n\nWorkbook: <ref>"; narrate.py's clean() keeps
// only the text before "Detail:". The title slide carries the Date Code (DATECODE, "YYYY-MM-DD HH:MM ET", from
// PowerShell) and the chapter's review status. A backup section, not narrated, lists every footnote in full.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const WORKBOOKS = {
  adm: { dir: "attribute-driven-migration", name: "Building the Attribute-Driven Migration" },
  pa: { dir: "privileged-access", name: "Building Privileged Access" },
  npi: { dir: "non-person-identity", name: "Building Non-Person Identity" },
};
const ICONS = new Set(fs.readdirSync(path.join(__dirname, "icons")).map((f) => f.replace(/\.png$/, "")));
const BANNED = /\bUIAO\b|\bSSA\b|Social Security|Mainframe PIN|\bDISA\b|\bSTIGs?\b/i;

// The chapter page: title, review status and footnotes ([^name]: text, one line each).
function readChapter(wb, n) {
  const dir = path.join(ROOT, "docs", "project-plans", "developer-workbooks", WORKBOOKS[wb].dir);
  const file = fs.readdirSync(dir).find((f) => f.startsWith(String(n).padStart(2, "0") + "-") && f.endsWith(".md"));
  if (!file) throw new Error(`no chapter ${n} in ${dir}`);
  const md = fs.readFileSync(path.join(dir, file), "utf8");
  const fm = md.match(/^---\n([\s\S]*?)\n---/)[1];
  const title = fm.match(/^title:\s*"(.*)"\s*$/m)[1];
  const review = (fm.match(/^review-status:\s*(\S+)/m) || [])[1] || "unknown";
  const notes = {};
  for (const m of md.matchAll(/^\[\^([^\]]+)\]:\s*(.+)$/gm)) notes[m[1]] = m[2].trim();
  // Markdown to plain text for slides and notes: links keep their text, angle-bracket URLs stay as URLs.
  for (const k of Object.keys(notes)) notes[k] = plain(notes[k]);
  return { file, rel: path.relative(ROOT, path.join(dir, file)).split(path.sep).join("/"), title, review, notes };
}
const plain = (t) => String(t).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/<(https?:[^>]+)>/g, "$1")
  .replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");

module.exports = function build(spec) {
  const wb = WORKBOOKS[spec.workbook];
  if (!wb) throw new Error(`unknown workbook ${spec.workbook}`);
  const ch = readChapter(spec.workbook, spec.chapter);
  const NN = String(spec.chapter).padStart(2, "0");
  const D = require("./lib.js")({ book: wb.name, title: spec.title,
    footer: `Federal Modernization Workbook  ·  ${wb.name}  ·  Chapter ${NN}` });
  const { pres, HEX, PART, txt, box, icon, tag, tableOpts, head } = D;
  pres.title = `${wb.name}, Chapter ${NN} — ${spec.title}`;
  const DATECODE = process.env.DATECODE;
  if (!/^\d{4}-\d\d-\d\d \d\d:\d\d ET$/.test(DATECODE || "")) throw new Error("set DATECODE to 'YYYY-MM-DD HH:MM ET' (Eastern, from PowerShell)");

  const TOP = 1.45, LIMIT = 6.5, X = 0.6, W = 12.15, GAP = 0.2;
  const errors = [];
  const fail = (m) => errors.push(m);
  const neutral = (what, t) => { if (BANNED.test(t)) fail(`neutrality: ${what}: ${String(t).slice(0, 90)}`); };
  const lh = (pt) => pt / 72 * 1.2;
  const nlines = (t, w, pt, k = 0.5) => String(t).split("\n").reduce((a, p) => a + Math.max(1, Math.ceil((p.length * k * pt / 72) / Math.max(0.3, w))), 0);

  // ---------------------------------------------------------------- elements: measure(w, s) and draw(slide, x, y, w, s)
  // s is the shrink step (0, 1, 2 …); each element drops half a point per step down to its floor.
  const size = (base, floor, s) => Math.max(floor, base - 0.5 * s);
  const runsOf = (t, o = {}) => { // "**bold** rest" -> runs
    const out = [];
    String(t).split(/(\*\*[^*]+\*\*)/).filter(Boolean).forEach((p) => {
      const b = p.startsWith("**");
      out.push({ text: b ? p.slice(2, -2) : p, options: Object.assign({}, o, b ? { bold: true, color: o.boldColor || HEX.navy } : {}) });
    });
    return out;
  };
  const strip = (t) => String(t).replace(/\*\*/g, "");

  const E = {
    lead: {
      h: (e, w, s) => nlines(strip(e.lead), w, size(16, 13, s)) * lh(size(16, 13, s)) + 0.06,
      draw: (sl, e, x, y, w, h, s) => txt(sl, "Lead", runsOf(e.lead, { color: HEX.navy, bold: true }), { x, y, w, h, fontSize: size(16, 13, s), color: HEX.navy, bold: true }),
    },
    bullets: {
      pt: (e, s) => size(e.pt || 15, 11.5, s),
      h: (e, w, s) => {
        const pt = E.bullets.pt(e, s), inner = e.label ? w - 0.55 : w - 0.3;
        return (e.label ? 0.5 : 0) + e.bullets.reduce((a, t) => a + nlines(strip(t), inner, pt) * lh(pt) + 0.07, 0) + (e.label ? 0.18 : 0.02);
      },
      draw: (sl, e, x, y, w, h, s) => {
        const pt = E.bullets.pt(e, s);
        const items = [];
        e.bullets.forEach((t, k) => runsOf(t, { color: HEX.ink }).forEach((r, j, all) => {
          if (j === 0) r.options.bullet = true;
          if (j === all.length - 1 && k < e.bullets.length - 1) r.options.breakLine = true;
          items.push(r);
        }));
        if (e.label) {
          const c = HEX[e.color || "navy"], tint = HEX[(e.color || "navy") + "Tint"] || "FFFFFF";
          box(sl, `Panel ${e.label}`, x, y, w, h, tint, c);
          txt(sl, `Panel ${e.label} label`, e.label.toUpperCase(), { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.3, fontSize: 11, bold: true, color: c === HEX.navy ? HEX.slate : c, charSpacing: 0.5 });
          txt(sl, `Panel ${e.label} list`, items, { x: x + 0.2, y: y + 0.45, w: w - 0.35, h: h - 0.5, fontSize: pt, paraSpaceAfter: 4 });
        } else txt(sl, "List", items, { x, y, w, h, fontSize: pt, paraSpaceAfter: 4 });
      },
    },
    table: {
      pt: (e, s) => size(e.pt || 13, 10.5, s),
      cols: (e, w) => { const t = e.table.w || e.table.head.map(() => 1); const sum = t.reduce((a, b) => a + b, 0); return t.map((v) => v / sum * w); },
      rows: (e, w, s) => {
        const pt = E.table.pt(e, s), cw = E.table.cols(e, w);
        const rh = (r, k0) => Math.max(0.32, Math.max(...r.map((c, k) => nlines(strip(c), cw[k] - 0.2, k0 ? pt * 1.04 : pt, 0.5))) * lh(pt) + 0.12);
        return [rh(e.table.head, true), ...e.table.rows.map((r) => rh(r))];
      },
      h: (e, w, s) => E.table.rows(e, w, s).reduce((a, b) => a + b, 0),
      draw: (sl, e, x, y, w, h, s) => {
        const pt = E.table.pt(e, s), cw = E.table.cols(e, w), rowH = E.table.rows(e, w, s);
        e.table.rows.forEach((r) => { if (r.length !== e.table.head.length) fail(`table row has ${r.length} cells, head has ${e.table.head.length}: ${r[0]}`); });
        const body = e.table.rows.map((r) => r.map((c, k) => ({ text: runsOf(c, k === 0 ? { bold: true, color: HEX.navy } : { color: HEX.ink }) })));
        sl.addTable([head(e.table.head), ...body], tableOpts(cw, { x, y, w, h, fontSize: pt, rowH, objectName: "Table" }));
      },
    },
    code: {
      pt: (e, s, w) => {
        let pt = size(e.pt || 12, 10, s);
        const widest = Math.max(...e.code.map((l) => l.length));
        while (pt > 10 && widest * 0.55 * pt / 72 + 0.4 > w) pt -= 0.5;
        return pt;
      },
      h: (e, w, s) => (e.label ? 0.37 : 0.1) + e.code.length * lh(E.code.pt(e, s, w)) + 0.16,
      draw: (sl, e, x, y, w, h, s) => {
        const pt = E.code.pt(e, s, w);
        const widest = Math.max(...e.code.map((l) => l.length));
        if (widest * 0.55 * pt / 72 + 0.4 > w + 0.01) fail(`code line too wide (${widest} chars at ${pt} pt in ${w.toFixed(2)} in): ${e.code.find((l) => l.length === widest)}`);
        box(sl, "Code panel", x, y, w, h, "F1F5F9", HEX.line);
        let top = y + 0.1;
        if (e.label) { txt(sl, "Code label", e.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate }); top += 0.27; }
        const runs = e.code.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < e.code.length - 1, color: /^\s*(#|\/\/)/.test(l) ? HEX.teal : HEX.ink } }));
        txt(sl, "Code", runs, { x: x + 0.18, y: top, w: w - 0.3, h: y + h - top - 0.05, fontFace: "Consolas", fontSize: pt, valign: "top" });
      },
    },
    cards: {
      pt: (e, s) => size(e.pt || 14, 11, s),
      cw: (e, w) => (w - 0.25 * (e.cards.length - 1)) / e.cards.length,
      h: (e, w, s) => {
        const pt = E.cards.pt(e, s), cw = E.cards.cw(e, w) - 0.4;
        return 0.22 + Math.max(...e.cards.map((c) => nlines(c.title, cw, 16, 0.52) * lh(16) + 0.08 + nlines(strip(c.text), cw, pt) * lh(pt))) + 0.2;
      },
      draw: (sl, e, x, y, w, h, s) => {
        const pt = E.cards.pt(e, s), cw = E.cards.cw(e, w);
        e.cards.forEach((c, k) => {
          const col = HEX[c.color || ["navy", "teal", "amber", "red"][k % 4]];
          const cx = x + k * (cw + 0.25);
          box(sl, `Card ${k + 1}`, cx, y, cw, h, "FFFFFF", col);
          sl.addShape(pres.shapes.RECTANGLE, { objectName: `Card ${k + 1} bar`, x: cx, y, w: 0.09, h, fill: { color: col }, line: { color: col } });
          txt(sl, `Card ${k + 1} text`, [{ text: c.title, options: { bold: true, color: col, fontFace: "Cambria", fontSize: 16, breakLine: true } },
            ...runsOf(c.text, { color: HEX.ink, fontSize: pt })], { x: cx + 0.25, y: y + 0.15, w: cw - 0.4, h: h - 0.25, paraSpaceAfter: 3 });
        });
      },
    },
    steps: {
      pt: (e, s) => size(e.pt || 14, 11, s),
      h: (e, w, s) => { const pt = E.steps.pt(e, s); return e.steps.reduce((a, t) => a + nlines(`${t.title}: ${strip(t.text)}`, w - 0.75, pt) * lh(pt) + 0.12, 0); },
      draw: (sl, e, x, y, w, h, s) => {
        const pt = E.steps.pt(e, s);
        let yy = y;
        e.steps.forEach((t, k) => {
          const hh = nlines(`${t.title}: ${strip(t.text)}`, w - 0.75, pt) * lh(pt) + 0.12;
          const d = Math.min(0.42, Math.max(0.3, lh(pt) + 0.06));
          sl.addShape(pres.shapes.OVAL, { objectName: `Step ${k + 1} dot`, x, y: yy + 0.02, w: d, h: d, fill: { color: HEX.amber }, line: { color: HEX.amber } });
          txt(sl, `Step ${k + 1} number`, String(k + 1), { x, y: yy + 0.02, w: d, h: d, fontSize: Math.min(14, pt), bold: true, color: "FFFFFF", align: "center", valign: "middle" });
          txt(sl, `Step ${k + 1}`, [{ text: `${t.title}: `, options: { bold: true, color: HEX.navy } }, ...runsOf(t.text, { color: HEX.ink })],
            { x: x + 0.6, y: yy, w: w - 0.6, h: hh, fontSize: pt });
          yy += hh;
        });
      },
    },
    callout: {
      pt: (e, s) => size(e.pt || 15.5, 12.5, s),
      h: (e, w, s) => { const pt = E.callout.pt(e, s); return Math.max(0.8, nlines(`${e.label || ""}${strip(e.callout)}`, w - 1.45, pt) * lh(pt) + 0.24); },
      draw: (sl, e, x, y, w, h, s) => {
        const pt = E.callout.pt(e, s), c = HEX[e.color || "teal"];
        const ic = e.icon || "FaLightbulb";
        if (!ICONS.has(ic)) fail(`no icon ${ic}`);
        box(sl, "Callout", x, y, w, h, "FFFFFF", c);
        const d = Math.min(0.7, h - 0.16);
        icon(sl, ic, x + 0.22, y + (h - d) / 2, d, c);
        txt(sl, "Callout text", [...(e.label ? [{ text: e.label, options: { bold: true, color: c } }] : []), ...runsOf(e.callout, { color: HEX.ink })],
          { x: x + 1.15, y: y + 0.06, w: w - 1.35, h: h - 0.12, fontSize: pt, valign: "middle" });
      },
    },
    cols: {
      ws: (e, w) => { const sp = e.split || 0.5; return [(w - 0.3) * sp, (w - 0.3) * (1 - sp)]; },
      h: (e, w, s) => Math.max(...e.cols.map((col, k) => stackH(col, E.cols.ws(e, w)[k], s))),
      draw: (sl, e, x, y, w, h, s) => {
        const [a, b] = E.cols.ws(e, w);
        drawStack(sl, e.cols[0], x, y, a, s, h);
        drawStack(sl, e.cols[1], x + a + 0.3, y, b, s, h);
      },
    },
  };
  const kind = (e) => { const k = Object.keys(E).find((n) => n in e); if (!k) throw new Error(`unknown element: ${JSON.stringify(e).slice(0, 80)}`); return k; };
  const stackH = (els, w, s) => els.reduce((a, e) => a + E[kind(e)].h(e, w, s), 0) + GAP * (els.length - 1);
  // Draws a stack; in a column the last element stretches to the column height so the two columns end together.
  function drawStack(sl, els, x, y, w, s, total) {
    let yy = y;
    els.forEach((e, k) => {
      let h = E[kind(e)].h(e, w, s);
      if (total && k === els.length - 1 && ["bullets", "cards"].includes(kind(e)) && e.label !== undefined) h = Math.max(h, y + total - yy);
      E[kind(e)].draw(sl, e, x, yy, w, h, s);
      yy += h + GAP;
    });
    return yy - GAP;
  }

  // ---------------------------------------------------------------- slides
  const titles = new Set();
  const checkTitle = (t) => {
    if (t.length > 58) fail(`title over 58 characters (${t.length}): ${t}`);
    if (titles.has(t)) fail(`duplicate title: ${t}`);
    titles.add(t);
  };
  let words = 0;
  const cited = new Set();
  const notesFor = (sl, n) => {
    const missing = (n.cite || []).filter((c) => !(c in ch.notes));
    if (missing.length) fail(`unknown footnotes on "${n.title}": ${missing.join(", ")}`);
    (n.cite || []).forEach((c) => cited.add(c));
    const src = (n.cite || []).filter((c) => c in ch.notes).map((c) => ch.notes[c]);
    const say = n.say.trim().replace(/\s+/g, " ");
    words += say.split(" ").length;
    const wc = say.split(" ").length;
    if (n.title && wc > 150) fail(`narration over 150 words (${wc}) on "${n.title}"`);
    const parts = [say, `Detail: ${n.detail.trim()}`];
    parts.push(`Sources: ${src.length ? src.join(" · ") : `${wb.name}, Chapter ${NN}, ${ch.rel}`}`);
    parts.push(`Workbook: ${wb.name}, Chapter ${NN} — ${n.ref || "the chapter as a whole"}.`);
    [say, n.detail].forEach((t) => neutral(`notes of "${n.title}"`, t));
    sl.addNotes(parts.join("\n\n"));
  };

  // Title slide
  const t0 = spec.slides[0];
  {
    const tt = `Chapter ${NN}: ${spec.title}`;
    checkTitle(tt);
    const sl = D.titleSlide("Introduction", tt, `${wb.name} — a narrated tour of the chapter`);
    txt(sl, "Tour map", [
      { text: spec.map || "", options: { color: HEX.navy, bold: true, breakLine: true } },
      { text: `Chapter review status: ${ch.review}  ·  Illustrative code, tested against fixtures`, options: { color: HEX.ink, breakLine: true } },
      { text: `Date Code ${DATECODE}`, options: { color: HEX.teal, bold: true } },
    ], { x: 0.8, y: 4.85, w: 7.0, h: 1.4, fontSize: 14, paraSpaceAfter: 4 });
    neutral("title", tt + (spec.map || ""));
    notesFor(sl, Object.assign({ title: tt, ref: "the opening callout, “In this chapter”" }, t0));
  }

  // Content slides, Why then What then Who then How (each part at least once).
  const ORDER = ["Why", "What", "Who", "How"];
  let at = 0;
  for (const n of spec.slides.slice(1)) {
    checkTitle(n.title);
    if (!PART[n.part]) fail(`slide "${n.title}": part must be Why, What, Who or How`);
    if (ORDER.indexOf(n.part) < at) fail(`slide "${n.title}": ${n.part} after ${ORDER[at]}; parts run Why, What, Who, How`);
    at = Math.max(at, ORDER.indexOf(n.part));
    const sl = D.content(n.section || n.part, n.title);
    tag(sl, n.part);
    // Start up to two points larger than each element's base size and step down until the slide fits.
    let s = -4;
    while (stackH(n.body, W, s) > LIMIT - TOP && s < 12) s++;
    const need = stackH(n.body, W, s);
    if (need > LIMIT - TOP + 0.01) fail(`slide "${n.title}" doesn't fit: needs ${need.toFixed(2)} in of ${(LIMIT - TOP).toFixed(2)}`);
    if (process.env.FIT) console.log(`  ${n.title}: ${need.toFixed(2)} in, shrink ${s}`);
    drawStack(sl, n.body, X, TOP, W, s);
    if (!n.sources) fail(`slide "${n.title}" has no Sources line`);
    else if (n.sources.length > 185) fail(`Sources line over 185 characters on "${n.title}" (${n.sources.length})`);
    else D.sources(sl, n.sources);
    neutral(`slide "${n.title}"`, JSON.stringify(n.body) + n.sources);
    notesFor(sl, n);
  }

  // Backup: every footnote in full, split over as many slides as it takes.
  {
    const b = D.content("Backup", "Backup");
    txt(b, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
    const all = Object.entries(ch.notes);
    const pt = 10.5, cap = LIMIT + 0.05 - TOP;
    let page = [], used = 0, k = 1;
    const flush = () => {
      const sl = D.content("Backup", `Sources in full (${k++})`);
      const runs = [];
      page.forEach(([name, t], j) => {
        runs.push({ text: `${name}  `, options: { bold: true, color: HEX.navy } });
        runs.push({ text: t, options: { color: HEX.ink, breakLine: j < page.length - 1 } });
      });
      txt(sl, "Source list", runs, { x: 0.6, y: TOP, w: 12.1, h: cap, fontSize: pt, paraSpaceAfter: 3 });
      sl.addNotes(`The chapter's footnotes in full, from ${ch.rel}.`);
      page = []; used = 0;
    };
    for (const [name, t] of all) {
      const h = nlines(`${name}  ${t}`, 11.9, pt, 0.5) * lh(pt) + 0.045;
      if (used + h > cap && page.length) flush();
      page.push([name, t]); used += h;
    }
    if (page.length) flush();
  }

  const parts = new Set(spec.slides.slice(1).map((n) => n.part));
  ORDER.filter((p) => !parts.has(p)).forEach((p) => fail(`no ${p} slide`));
  const uncited = Object.keys(ch.notes).filter((c) => !cited.has(c));
  console.log(`${spec.base}: ${spec.slides.length} narrated slides, ${words} spoken words (about ${(words / 150).toFixed(1)} min); ` +
    `${cited.size} of ${Object.keys(ch.notes).length} footnotes cited${uncited.length ? ` (not cited: ${uncited.join(", ")})` : ""}`);
  if (errors.length) { errors.forEach((e) => console.error("  ✗ " + e)); process.exit(1); }
  const out = process.argv[2] || path.join(spec.dir, `${spec.base}.pptx`);
  return D.save(out).catch((e) => { console.error(e); process.exit(1); });
};
module.exports.WORKBOOKS = WORKBOOKS;
module.exports.readChapter = readChapter;
