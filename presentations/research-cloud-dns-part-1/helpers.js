// Shared slide helpers for the two-part Cloud DNS evaluation decks
// (research-cloud-dns-part-1 and research-cloud-dns-part-2). They are the helpers of the
// Trinzic explainer (../research-trinzic-multicloud/build.js), itself modeled on the Infoblox research deck,
// on top of the shared kit in ../_build/lib.js, plus:
//   - say(): one narration text per slide, used for the speaker notes (with a timing cue, a Sources line
//     and a Workbook reference) and written to narration.json for narrate.py, so titles never drift;
//   - code(): the ADM deeper dive's light code panel (Consolas);
//   - finish(): the title checks (58 characters, unique), the word count, narration.json and save().
const fs = require("fs");
const path = require("path");
const KIT = path.join(__dirname, "..", "_build", "lib.js");

module.exports = function makeHelpers({ book, title, footer, dir }) {
  const D = require(KIT)({ book, title, footer });
  const { pres, HEX, txt, box, bullets, tableOpts, head } = D;

  const WPM = 142;
  let clock = 0;
  const per = [];
  const titles = [];
  const spoken = [];
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;

  const checkTitle = (t) => {
    if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
    titles.push(t);
  };
  const content = (sec, t) => { checkTitle(t); const s = D.content(sec, t); s._title = t; return s; };
  const titleSlide = (sec, t, sub) => { checkTitle(t); const s = D.titleSlide(sec, t, sub); s._title = t; return s; };

  // Speaker notes = the narration, a timing cue at 142 wpm, the Sources line and the Workbook reference.
  // The same text goes to narration.json, so the voice and the notes always match.
  const say = (s, body, src, wb) => {
    const text = body.trim().replace(/\s*\n\s*\n\s*/g, " ").replace(/\s+/g, " ");
    const n = text.split(/\s+/).length;
    const start = clock; clock += (n / WPM) * 60; per.push({ slide: pres.slides.length, n });
    s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nSources: ${src}\n\nWorkbook: ${wb}`);
    spoken.push({ slide: pres.slides.length, title: s._title, say: text });
  };

  const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
  const LIMIT = 6.6;
  const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

  const sources = (s, text, y = 6.62) => {
    if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
    return txt(s, "Sources", text, { x: 0.6, y, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
  };

  const T = (s, name, t, o) => {
    const size = o.fontSize || 14;
    const runs = typeof t === "string" ? [{ text: t, options: {} }] : t;
    const paras = []; let cur = { chars: 0, size };
    runs.forEach((r) => {
      const ro = r.options || {}; const sz = ro.fontSize || size;
      cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / size);
      if (ro.breakLine || ro.bullet) { paras.push(cur); cur = { chars: 0, size }; }
    });
    if (cur.chars) paras.push(cur);
    const need = paras.reduce((h, p) => h + lines("x".repeat(Math.round(p.chars)), o.w - 0.1, p.size) * p.size / 72 * 1.2 + (o.paraSpaceAfter || 0) / 72, 0);
    if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
    return txt(s, name, t, o);
  };

  const table = (s, name, y, colW, headers, rows, o = {}) => {
    const pt = o.fontSize || 12.5;
    const lh = pt / 72 * 1.2;
    const cellText = (c) => (typeof c === "string" ? c : c.text);
    const rh = (r, bold) => Math.max(o.minRow || 0.32, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
    const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
    const body = rows.map((r) => r.map((c, k) => {
      const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
      if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
      return base;
    }));
    const x = o.x != null ? o.x : 0.6;
    s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
    const bottom = y + rowH.reduce((a, b) => a + b, 0);
    warn(`slide ${pres.slides.length} ${name} table`, bottom);
    if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
    return bottom;
  };

  const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13) => {
    box(s, name, x, y, w, h, tint || "FFFFFF", color);
    const runs = [];
    if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
    if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15, fontFace: "Cambria", breakLine: true } });
    const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.34 : 0) + (runs.length ? 0.08 : 0);
    if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: top - y - 0.14 });
    txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
    const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.05, 0);
    if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
    warn(`slide ${pres.slides.length} ${name} panel`, y + h);
  };

  const subhead = (s, name, text, x, y, w, color = HEX.slate) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color });

  // Diagram pieces: a labeled box (node) and an arrow (line with a triangle head) between two points.
  const node = (s, name, x, y, w, h, color, tint, headText, body, pt = 11.5) => {
    box(s, name, x, y, w, h, tint, color);
    const runs = [{ text: headText, options: { bold: true, color, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!body } }];
    if (body) runs.push({ text: body, options: { fontSize: pt, color: HEX.ink } });
    T(s, `${name} text`, runs, { x: x + 0.1, y: y + 0.07, w: w - 0.2, h: h - 0.14, fontSize: pt, paraSpaceAfter: 1, valign: "middle" });
  };
  const arrow = (s, name, x1, y1, x2, y2, color = HEX.slate, both = false) => {
    s.addShape(pres.shapes.LINE, { objectName: name, x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color, width: 2, endArrowType: "triangle" }, both ? { beginArrowType: "triangle" } : {}) });
  };
  const label = (s, name, text, x, y, w, color = HEX.slate, align = "center") =>
    txt(s, name, text, { x, y, w, h: 0.28, fontSize: 10.5, italic: true, color, align, valign: "middle" });

  // A one-line statement in navy (bold), with a fit check.
  const line = (s, name, text, y, h, pt = 13, color = HEX.navy) => {
    const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
    if (need > h) console.warn(`  ! slide ${pres.slides.length} ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
    warn(`slide ${pres.slides.length} ${name} line`, y + h);
    txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color, bold: true });
    return y + h;
  };

  // The ADM deeper dive's code panel: a light panel with Consolas text; "//" lines are comments, in teal.
  const CODE_FILL = "F1F5F9";
  const code = (s, name, x, y, w, codeLines, o = {}) => {
    const pt = o.pt || 10.5;
    const lh = pt / 72 * 1.2;
    const top = y + 0.1 + (o.label ? 0.27 : 0);
    const h = (top - y) + codeLines.length * lh + 0.14;
    box(s, name, x, y, w, h, CODE_FILL, HEX.line);
    if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
    const widest = Math.max(...codeLines.map((l) => l.length));
    const need = widest * 0.55 * pt / 72 + 0.4;
    if (need > w + 0.01) console.warn(`  ! ${name} code may overflow its width: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
    const runs = codeLines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < codeLines.length - 1,
      color: /^\s*\/\//.test(l) ? HEX.teal : HEX.ink } }));
    txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
    const bottom = y + h;
    warn(`slide ${pres.slides.length} ${name} code`, bottom);
    if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars`);
    return bottom;
  };

  const backup = (note) => {
    const s = content("Backup", "Backup");
    txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
    sources(s, note);
  };
  const srcSlide = (t, src, note) => {
    const s = content("Backup", t);
    T(s, "Source list", bullets(src, 10.5), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 2, fontSize: 10.5 });
    sources(s, note);
    return s;
  };

  const finish = (out) => {
    const narrated = per.reduce((a, p) => a + p.n, 0);
    console.log(`slides: ${pres.slides.length}; narrated: ${per.length} slides, ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
    console.log("per slide:", per.map((p) => `${p.slide}:${p.n}`).join(" "));
    const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
    if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
    fs.writeFileSync(path.join(dir, "narration.json"), JSON.stringify(spoken, null, 2) + "\n", "utf8");
    const target = /[\\/]/.test(out) ? path.resolve(out) : path.join(dir, out);
    D.save(target).catch((e) => { console.error(e); process.exit(1); });
  };

  return Object.assign({}, D, { content, titleSlide, say, sources, T, table, panel, subhead, node, arrow, label, line, code, backup, srcSlide, finish, lines });
};
