"""Reviewer round: title slide, layered-identifier slide, logical vs Microsoft slide,
EDA contribution banner."""
p = "slides4.js"
s = open(p, encoding="utf-8").read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


# ---- 1 Title
r('s.addText("Make HR Authoritative for Identity", { placeholder: "title" });',
  's.addText("HR-Driven Identity Modernization", { placeholder: "title" });')
i0 = s.index('  s.addText("Federal HR 2.0 and the Entra ID migration are the opportunity')
i1 = s.index("\n", i0)
s = s[:i0] + '''  s.addText("An Enterprise Data Architecture Case Study", { placeholder: "body" });
  txt(s, "Thesis line", "Using Federal HR 2.0 and the Entra ID migration to start HR-driven Entra ID, Active Directory and ICAM on OPM standard attributes",
    { x: 0.8, y: 4.45, w: 6.4, h: 0.9, fontSize: 16, color: HEX.ink });''' + s[i1:]

# ---- new layered-identifier slide, before the crosswalk
IDS = '''// ------------------------------------------------------------------ 6b Layered identifiers
{
  const s = content("Model the person, not the account: layered identifiers", "The data");
  const rows = [
    ["Enterprise person key", "The person, across every affiliation", "The agency\\u2019s identifier decision", "Never, once assigned"],
    ["Source person key", "The person in one HR source", "Core HCM (or the contractor source)", "The source system changes"],
    ["Affiliation key", "One employment, contract or appointment", "The HR system", "A new affiliation begins"],
    ["Directory object ID", "One account in one directory", "Entra ID or AD", "The account is recreated"],
    ["Credential identifiers", "One authenticator (PIV, certificate)", "Card management or CA", "The credential is reissued"],
  ];
  s.addTable([head(["Key", "Identifies", "Assigned by", "Changes when"]),
    ...rows.map((r, k) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: k === 0 ? HEX.amber : HEX.navy } : {} })))],
    tableOpts([2.35, 2.75, 2.6, 1.95], { y: 1.5, h: 3.9, fontSize: 13.5 }));
  box(s, "EDA card", 10.0, 1.5, 2.75, 3.9, HEX.tealTint);
  icon(s, "FaSitemap", 10.2, 1.68, 0.5, HEX.teal);
  txt(s, "EDA heading", "Why it matters", { x: 10.8, y: 1.68, w: 1.9, h: 0.5, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "EDA list", ["Entity modeling: the person is the tracked entity", "Survives rehire, conversion and reorganization", "The Core HCM cutover changes only the source key", "No SSN as a join key"].map((t, k, a) => ({ text: t, options: { bullet: true, breakLine: k < a.length - 1 } })),
    { x: 10.2, y: 2.35, w: 2.4, h: 2.95, fontSize: 13.5, paraSpaceAfter: 6 });
  box(s, "Decision", 0.6, 5.65, 12.15, 0.95, "FFFFFF", HEX.amber);
  txt(s, "Decision text", [
    { text: "The decision this requires: ", options: { bold: true, color: HEX.amber } },
    { text: "which key is the enterprise person key \\u2014 and how every source, directory and credential key maps to it." },
  ], { x: 0.95, y: 5.7, w: 11.5, h: 0.85, fontSize: 17, valign: "middle" });
  s.addNotes(
`[0:00–0:00]  Identifiers are where data architecture earns its keep.

A common design says the employee ID is the person, for life. It breaks the moment the source changes, a contractor converts, or someone is rehired. So I model identifiers in layers: an enterprise person key the agency controls; a source key per HR system; an affiliation key per employment or contract; a directory ID per account; and credential identifiers per PIV or certificate.

The person is the tracked entity, not the account. That's what survives rehire, conversion and reorganization — and when SSA moves to Core HCM, only the source key changes; nothing downstream has to. The decision this requires is which key is the enterprise person key, and how everything else maps to it.`);
}

'''
anchor = "// ------------------------------------------------------------------ 7 Crosswalk"
r(anchor, IDS + anchor)

# ---- slide 9: logical architecture and Microsoft realization
a = s.index('  const s = content("One source, two directories: HR owns identity throughout", "Identity and ICAM");')
b = s.index("  s.addTable([head([\"\", \"Directory migration (AD → Entra ID)\", \"HR-driven identity\"]),")
s = s[:a] + '''  const s = content("Logical architecture and Microsoft realization", "Identity and ICAM");
  const rowsLM = [
    ["Logical architecture \\u2014 stable", HEX.navy, HEX.navyTint, [
      "Authoritative source", "Boundary transformation", "Governed identity model", "Provisioning service", "Targets and ICAM"]],
    ["Microsoft realization \\u2014 replaceable", HEX.teal, HEX.tealTint, [
      "Oracle Core HCM", "Azure Functions or Logic Apps", "Canonical model and provenance store", "Graph /bulkUpload; Entra provisioning", "Entra ID, AD, Intune, card management"]],
  ];
  rowsLM.forEach((row, ri) => {
    const y = 1.85 + ri * 1.55;
    txt(s, `Row label ${ri + 1}`, row[0], { x: 0.6, y: y - 0.42, w: 8, h: 0.35, fontSize: 14, bold: true, color: row[1] });
    row[3].forEach((t, i) => {
      const x = 0.6 + i * 2.475;
      box(s, `LM ${ri + 1}.${i + 1}`, x, y, 2.25, 1.0, row[2], row[1]);
      txt(s, `LM ${ri + 1}.${i + 1} text`, t, { x: x + 0.1, y, w: 2.05, h: 1.0, fontSize: 13.5, bold: ri === 0, color: HEX.navy, align: "center", valign: "middle" });
      if (i < 4) arrow(s, x + 2.25, y + 0.5, 0.225, 0, row[1]);
    });
  });
''' + s[b:]
r("tableOpts([2.3, 4.9, 4.95], { y: 5.05, h: 1.6, fontSize: 14 }));",
  "tableOpts([2.3, 4.9, 4.95], { y: 4.95, h: 1.6, fontSize: 14 }));")
a = s.index("How this covers AD and Entra ID at the same time.")
b = s.index("\n\nWorkbook: HR-Driven Identity, Chapter 04 — Two landing zones")
s = s[:a] + """Logical architecture and Microsoft realization.

The top row is the architecture, and it's stable: an authoritative source, a boundary transformation, the governed identity model, a provisioning service, and the targets and ICAM. The bottom row is how Microsoft realizes it today: Oracle Core HCM, Azure Functions, the canonical model and provenance store, Graph and the Entra provisioning service, then Entra ID, AD, Intune and card management. Products in the bottom row can change; the top row doesn't.

The table is why the two migrations belong together. Done separately, the Entra ID migration moves ticket-created accounts as they are. Done together, each population arrives in Entra ID already HR-sourced.""" + s[b:]

# ---- 13: EDA contribution banner replaces the fit row
a = s.index("  const fit = [")
b = s.index("  s.addNotes(", a)
s = s[:a] + '''  box(s, "EDA contribution", 0.6, 5.85, 12.15, 0.85, "FFFFFF", HEX.navy);
  txt(s, "EDA contribution text", [
    { text: "EDA contribution: ", options: { bold: true, color: HEX.navy } },
    { text: "establish authority, identifiers, standards, lineage and evidence \\u2014 so workforce events produce measurable identity outcomes." },
  ], { x: 0.95, y: 5.9, w: 11.5, h: 0.75, fontSize: 17, valign: "middle" });
''' + s[b:]
r("That covers what you asked for: the line of business and SSA's timeline, programmatic data in OPM's standards, and logical and physical modeling in the model and crosswalk.",
  "My contribution as an enterprise data architect: establish authority, identifiers, standards, lineage and evidence, so workforce events produce measurable identity outcomes.")
open(p, "w", encoding="utf-8").write(s)

q = open("patch9.py", encoding="utf-8").read()
q = q.replace('    ("How this covers AD and Entra ID", "Chapter 04 — Two landing zones; Over the Entra ID migration"),',
              '    ("Logical architecture and Microsoft realization", "Chapter 04 — Logical architecture and Microsoft realization; Two landing zones; Over the Entra ID migration"),\n'
              '    ("Identifiers are where data architecture", "Chapter 03 — One person, layered identifiers"),')
q = q.replace('("Logical and physical modeling", "Chapter 03 — One person, layered identifiers; Chapter 05 — The schema")',
              '("Logical and physical modeling", "Chapter 05 — The standard-attribute layer; The schema")')
open("patch9.py", "w", encoding="utf-8").write(q)
print("ok")
