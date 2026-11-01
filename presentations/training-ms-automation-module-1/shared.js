// Shared builders for the three Microsoft Automation training decks (Modules 1, 2 and 3).
// Each module's build.js calls require("../training-ms-automation-module-1/shared.js")(cfg).
//
// The layout helpers are the technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js):
// title and length checks, unique titles, Sources lines, timing cues in the notes, tables, panels and callouts.
// The code panel is the one the deeper dive adds (../attribute-driven-migration-deeper-dive-part-1/build.js), copied here
// so all three training decks share one copy. Every fact on a slide comes from the module page in docs/training/ or the
// code and fixtures in examples/ms-automation; the decks add no external facts. Notes are the spoken narration, then a
// "Workbook:" reference that narrate.py doesn't speak.
module.exports = (cfg) => {
  const P = require("../attribute-driven-migration-technical-part-1/slides.js")({ title: cfg.title, footer: cfg.footer });
  const { D, HEX, txt, box } = P;
  // slides.js names every deck "Companion guide — <title>"; these decks are training modules.
  D.pres.title = `Microsoft Automation learning path — ${cfg.title}`;
  D.pres.subject = "Federal Modernization Workbook training";

  // ---------------------------------------------------------------- code panel (from the deeper dive)
  // A light panel with monospaced text (Consolas). Lines starting with "#" or "$ " are styled: comments in teal,
  // commands in navy bold. Returns the panel's bottom edge and warns when a line is too wide or the panel runs into
  // the Sources line.
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
      color: /^\s*#/.test(l) ? HEX.teal : (/^\$ /.test(l) ? HEX.navy : HEX.ink), bold: /^\$ /.test(l) } }));
    txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
    const bottom = y + h;
    if (bottom > (o.limit || 6.6) + 0.01) console.warn(`  ! ${name} code may overflow: bottom ${bottom.toFixed(2)} in`);
    if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars (${need.toFixed(2)} of ${w.toFixed(2)} in)`);
    return bottom;
  };

  // A one-line plain statement (navy, bold), with a fit check (from the deeper dive).
  const line = (s, name, text, y, h, pt = 14) => {
    const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
    if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
    if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
    if (process.env.FIT) console.log(`  line ${name}: bottom ${(y + h).toFixed(2)} in`);
    txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
    return y + h;
  };

  // ---------------------------------------------------------------- Learn-style slides
  // The title slide: module name, the path, and the units in order.
  const title = (sec, t, sub, units) => {
    const s = P.titleSlide(sec, t, sub);
    txt(s, "Units", [
      { text: "MICROSOFT AUTOMATION LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
      ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
    ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
    return s;
  };

  // Learning objectives: a numbered panel, with the module's prerequisites beside it.
  const objectives = (sec, t, items, prereq, mins) => {
    const s = P.content(sec, t);
    D.tag(s, "What");
    P.panel(s, "Objectives", 0.6, 1.45, 7.75, null, HEX.navy, HEX.navyTint, `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, "You'll be able to", items, 14.5);
    P.panel(s, "Prereq", 8.6, 1.45, 4.15, null, HEX.teal, HEX.tealTint, "BEFORE YOU START", "Prerequisites", prereq, 13.5);
    return s;
  };

  // A two-question knowledge check: the questions as panels, the answers in a callout at the bottom.
  const check = (sec, t, qs, answers) => {
    const s = P.content(sec, t);
    D.tag(s, "How");
    let y = 1.45;
    qs.forEach((q, k) => {
      y = P.panel(s, `Q${k + 1}`, 0.6, y, 12.15, null, HEX.amber, HEX.amberTint, `QUESTION ${k + 1}`, q.q, q.options, 13.5) + 0.2;
    });
    P.callout(s, "Answers", y, 6.5 - y, "FaClipboardCheck", HEX.teal, "Answers: ", answers);
    return s;
  };

  return Object.assign({}, P, { code, line, title, objectives, check });
};
