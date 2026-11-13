// Shared builders for the four Zero Trust Assessment training decks (Modules 1 to 4).
// Each module's build.js calls require("../training-zta-module-1/shared.js")(cfg).
//
// It wraps the Microsoft Automation training helpers (../training-ms-automation-module-1/shared.js: Learn-style title,
// objectives and knowledge-check slides, the code panel, tables, panels and callouts) and sets this path's name on the
// title slide and in the document title. The title slides carry no draft notice: the editor chose on November 13, 2026
// to leave it off these four decks, though the module pages are still drafts awaiting review.
// Every fact on a slide comes from the module page in docs/training/zero-trust-assessment/, the implementation guide it
// links (docs/books/guides/zero-trust-assessment-implementation.md) and its footnotes, or the kit (examples/zta-results).
module.exports = (cfg) => {
  const P = require("../training-ms-automation-module-1/shared.js")({ title: cfg.title, footer: cfg.footer });
  const { D, HEX, txt } = P;
  D.pres.title = `Zero Trust Assessment learning path — ${cfg.title}`;

  // The title slide: the module name, the path, and the units in order.
  const title = (sec, t, sub, units) => {
    const s = P.titleSlide(sec, t, sub);
    txt(s, "Units", [
      { text: "THE ZERO TRUST ASSESSMENT AS EVIDENCE  ·  LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
      ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
    ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
    return s;
  };

  return Object.assign({}, P, { title });
};
