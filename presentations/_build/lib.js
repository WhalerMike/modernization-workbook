// Shared house style for every Workbook book deck (Why / What / Who / How).
// Same theme, backgrounds, layouts and helpers as the HR-Driven Identity
// interview deck, so all book decks look alike. A book's build script does:
//
//   const D = require("../_build/lib.js")({ book: "B02", title: "Identity & Directory" });
//   ... D.titleSlide(...), D.content(...), D.tag(...), D.box(...) ...
//   await D.save("presentations/b02-identity/B02_Identity.pptx");
//
// Needs pptxgenjs (global npm install is fine) and the pptx skill's apply_theme.js,
// found through $SKILL (the skill directory) or $APPLY_THEME (the file itself).
const path = require("path");
const pptxgen = require("pptxgenjs");

const THEME = {
  name: "Modernization Workbook",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2A44", lt1: "FFFFFF", dk2: "334155", lt2: "F1F5F9",
    accent1: "1F2A44", accent2: "0F766E", accent3: "B45309", accent4: "B91C1C",
    accent5: "64748B", accent6: "E6F2F1", hlink: "0F766E", folHlink: "334155",
  },
};
const HEX = { navy: "1F2A44", teal: "0F766E", amber: "B45309", red: "B91C1C", slate: "64748B",
  ink: "334155", tealTint: "DCEFEC", navyTint: "E4EAF4", amberTint: "FBEEDC", redTint: "FBE4E4",
  line: "CBD5E1", grey: "E9EEF4" };
// Why / What / Who / How always carry the same colors.
const PART = { Why: HEX.red, What: HEX.navy, Who: HEX.teal, How: HEX.amber };
const ASSET = (f) => path.join(__dirname, f);

module.exports = function makeDeck({ book, title, footer, author = "Mike Stratton" }) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.author = author;
  pres.title = `${book} — ${title}`;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  pres.defineSlideMaster({
    title: "Title",
    background: { path: ASSET("bg_title.png") },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.6, w: 6.8, h: 2.1, fontFace: "Cambria",
        fontSize: 44, bold: true, color: C.text1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.85, w: 6.6, h: 0.9, fontSize: 22,
        color: C.accent2, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Content",
    background: { path: ASSET("bg_content.png") },
    margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.5, w: 12.1, h: 0.85, fontFace: "Cambria",
        fontSize: 30, bold: true, color: C.text1, valign: "middle", align: "center", margin: 0 }, text: "" } },
      { text: { text: footer || `Modernization Workbook  ·  ${book} ${title}`, options: { x: 0.6, y: 7.0, w: 9, h: 0.3,
        fontSize: 10, color: C.accent5, margin: 0 } } },
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent5, align: "right" },
  });

  let section = null;
  const sectionFor = (t) => { if (t !== section) { pres.addSection({ title: t }); section = t; } return t; };
  const titleSlide = (sec, t, sub) => {
    const s = pres.addSlide({ masterName: "Title", sectionTitle: sectionFor(sec) });
    s.addText(t, { placeholder: "title" });
    s.addText(sub, { placeholder: "body" });
    return s;
  };
  const content = (sec, t) => {
    const s = pres.addSlide({ masterName: "Content", sectionTitle: sectionFor(sec) });
    s.addText(t, { placeholder: "title" });
    return s;
  };
  const txt = (s, name, text, o) => s.addText(text, Object.assign({ objectName: name, isTextBox: true, margin: 0,
    color: C.text2, fontSize: 14, valign: "top" }, o));
  const box = (s, name, x, y, w, h, fill, line) => s.addShape(pres.shapes.ROUNDED_RECTANGLE,
    { objectName: name, x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line || fill, width: 1 },
      shadow: { type: "outer", color: "64748B", opacity: 0.22, blur: 6, offset: 2, angle: 90 } });
  const icon = (s, name, x, y, d, color) => {
    s.addShape(pres.shapes.OVAL, { objectName: `Icon ${name}`, x, y, w: d, h: d, fill: { color }, line: { color } });
    s.addImage({ path: ASSET(`icons/${name}.png`), x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, altText: "" });
  };
  const tag = (s, part) => { // the Why / What / Who / How marker, top-left of each slide
    const c = PART[part];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: `Tag ${part}`, x: 0.6, y: 0.12, w: 0.95, h: 0.32, rectRadius: 0.06, fill: { color: c }, line: { color: c } });
    txt(s, `Tag ${part} text`, part.toUpperCase(), { x: 0.6, y: 0.12, w: 0.95, h: 0.32, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", charSpacing: 1 });
  };
  const agenda = (s, x, y, w) => txt(s, "Agenda line", [
    { text: "Why", options: { bold: true, color: HEX.red } }, { text: "   ·   " },
    { text: "What", options: { bold: true, color: HEX.navy } }, { text: "   ·   " },
    { text: "Who", options: { bold: true, color: HEX.teal } }, { text: "   ·   " },
    { text: "How", options: { bold: true, color: HEX.amber } },
  ], { x, y, w, h: 0.5, fontSize: 20, color: HEX.slate });
  const bullets = (items, size) => items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < items.length - 1, fontSize: size } }));
  const tableOpts = (colW, extra) => Object.assign({ x: 0.6, colW, fontFace: "Calibri", fontSize: 13, color: HEX.ink,
    border: { type: "solid", color: HEX.line, pt: 0.75 }, fill: { color: "FFFFFF" }, valign: "middle", margin: [0.05, 0.1, 0.05, 0.1] }, extra);
  const head = (cells) => cells.map((t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.navy } } }));
  const callout = (s, name, y, h, iconName, color, label, text) => { // full-width bottom callout
    box(s, name, 0.6, y, 12.15, h, "FFFFFF", color);
    icon(s, iconName, 0.85, y + (h - 0.8) / 2, 0.8, color);
    txt(s, `${name} text`, [{ text: label, options: { bold: true, color } }, { text }],
      { x: 1.9, y: y + 0.05, w: 10.65, h: h - 0.1, fontSize: 16.5, valign: "middle" });
  };
  const sources = (s, text) => txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.4, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });

  const save = async (out) => {
    await pres.writeFile({ fileName: out });
    const at = process.env.APPLY_THEME || (process.env.SKILL && path.join(process.env.SKILL, "scripts", "apply_theme.js"));
    if (!at) throw new Error("set SKILL (pptx skill dir) or APPLY_THEME so the theme colors can be written");
    await require(at).applyTheme(out, THEME);
    console.log("wrote", out);
  };
  return { pres, C, HEX, PART, THEME, titleSlide, content, txt, box, icon, tag, agenda, bullets, tableOpts, head, callout, sources, save };
};
