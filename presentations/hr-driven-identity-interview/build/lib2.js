const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2];
const THEME = {
  name: "HR-Driven Identity",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2A44", lt1: "FFFFFF", dk2: "334155", lt2: "F1F5F9",
    accent1: "1F2A44", accent2: "0F766E", accent3: "B45309", accent4: "B91C1C",
    accent5: "64748B", accent6: "E6F2F1", hlink: "0F766E", folHlink: "334155",
  },
};
const HEX = { navy: "1F2A44", teal: "0F766E", amber: "B45309", red: "B91C1C", slate: "64748B",
  ink: "334155", tealTint: "DCEFEC", navyTint: "E4EAF4", amberTint: "FBEEDC", redTint: "FBE4E4", line: "CBD5E1", grey: "E9EEF4" };
const path = require("path");
const ASSET = (f) => path.join(__dirname, f);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Mike Stratton";
pres.title = "HR-Driven Identity";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "Title",
  background: { path: ASSET("bg_title.png") },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.9, w: 6.6, h: 1.8, fontFace: "Cambria",
      fontSize: 44, bold: true, color: C.text1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.85, w: 6.4, h: 1.3, fontSize: 22,
      color: C.accent2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "Content",
  background: { path: ASSET("bg_content.png") },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.95, fontFace: "Cambria",
      fontSize: 30, bold: true, color: C.text1, valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "HR-Driven Identity  ·  Mike Stratton", options: { x: 0.6, y: 7.0, w: 8, h: 0.3,
      fontSize: 10, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent5, align: "right" },
});

let n = 0;
const content = (title, section) => {
  const s = pres.addSlide({ masterName: "Content", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  n++;
  return s;
};
const box = (s, name, x, y, w, h, fill, line) => s.addShape(pres.shapes.ROUNDED_RECTANGLE,
  { objectName: name, x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line || fill, width: 1 },
    shadow: { type: "outer", color: "64748B", opacity: 0.22, blur: 6, offset: 2, angle: 90 } });
const icon = (s, name, x, y, d, color) => {
  s.addShape(pres.shapes.OVAL, { objectName: `Icon ${name}`, x, y, w: d, h: d, fill: { color }, line: { color } });
  s.addImage({ path: ASSET(`icons/${name}.png`), x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, altText: "" });
};
const txt = (s, name, text, o) => s.addText(text, Object.assign({ objectName: name, isTextBox: true, margin: 0,
  color: C.text2, fontSize: 14, valign: "top" }, o));
const arrow = (s, x, y, w, h, color) => s.addShape(pres.shapes.LINE,
  { x, y, w, h, line: { color: color || HEX.slate, width: 1.75, endArrowType: "triangle" } });
const link = (s, x, y, w, h) => s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color: HEX.slate, width: 1.5 } });
const tableOpts = (colW, extra) => Object.assign({ x: 0.6, colW, fontFace: "Calibri", fontSize: 13, color: HEX.ink,
  border: { type: "solid", color: HEX.line, pt: 0.75 }, fill: { color: "FFFFFF" }, valign: "middle", margin: [0.05, 0.1, 0.05, 0.1] }, extra);
const head = (cells) => cells.map((t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.navy } } }));

