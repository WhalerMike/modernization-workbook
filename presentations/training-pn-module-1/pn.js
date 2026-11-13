// Shared setup for the nine Provider Notices training decks (Modules 1 to 9).
// Each module's build.js calls require("../training-pn-module-1/pn.js")(title).
//
// The layout helpers are the Microsoft Automation training decks' (../training-ms-automation-module-1/shared.js): title
// and length checks, unique titles, Sources lines, timing cues in the notes, tables, panels, callouts, the code panel and
// the Learn-style objectives and knowledge-check slides. This file only renames the path: the document title, the
// footer and the title slide's units label. Every fact on a slide comes from the module page in
// docs/training/provider-notices/, the guide, workbook chapter and Book 15 sections the page sends the learner to,
// or the code and fixtures in examples/provider-notices; the decks add no external facts.
module.exports = (title) => {
  const P = require("../training-ms-automation-module-1/shared.js")({
    title,
    footer: `Federal Modernization Workbook  ·  Provider Notices learning path, ${title}`,
  });
  P.D.pres.title = `Provider Notices learning path — ${title}`;
  // The title slide: module name, the path, and the units in order.
  P.title = (sec, t, sub, units) => {
    const s = P.titleSlide(sec, t, sub);
    P.txt(s, "Units", [
      { text: "PROVIDER NOTICES LEARNING PATH", options: { bold: true, color: P.HEX.slate, fontSize: 12, breakLine: true } },
      ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? P.HEX.teal : P.HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
    ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
    return s;
  };
  return P;
};
