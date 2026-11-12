// Shared builders for the four Zero Trust Assessment training decks (Modules 1 to 4).
// Each module's build.js calls require("../training-zta-module-1/shared.js")(cfg).
//
// It wraps the Microsoft Automation training helpers (../training-ms-automation-module-1/shared.js: Learn-style title,
// objectives and knowledge-check slides, the code panel, tables, panels and callouts) and sets this path's name on the
// title slide and in the document title. The module pages are drafts awaiting review (research-status: draft,
// review-status: pending), so every title slide carries a draft notice, as the Book 20 deck does.
// Every fact on a slide comes from the module page in docs/training/zero-trust-assessment/, the implementation guide it
// links (docs/books/guides/zero-trust-assessment-implementation.md) and its footnotes, or the kit (examples/zta-results).
module.exports = (cfg) => {
  const P = require("../training-ms-automation-module-1/shared.js")({ title: cfg.title, footer: cfg.footer });
  const { D, HEX, txt, box } = P;
  D.pres.title = `Zero Trust Assessment learning path — ${cfg.title}`;

  // The title slide: the draft notice, the module name, the path, and the units in order.
  const title = (sec, t, sub, units) => {
    const s = P.titleSlide(sec, t, sub);
    box(s, "Draft notice", 0.8, 0.55, 7.4, 0.75, "FFFFFF", HEX.red);
    txt(s, "Draft notice text", [
      { text: "DRAFT MODULE, AWAITING THE EDITOR'S REVIEW.  ", options: { bold: true, color: HEX.red } },
      { text: "Recheck it after the review." },
    ], { x: 1.0, y: 0.6, w: 7.05, h: 0.65, fontSize: 14, valign: "middle", color: HEX.ink });
    txt(s, "Units", [
      { text: "THE ZERO TRUST ASSESSMENT AS EVIDENCE  ·  LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
      ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
    ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
    return s;
  };

  return Object.assign({}, P, { title });
};
