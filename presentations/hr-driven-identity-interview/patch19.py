"""Add slide 11b: one HR-driven ICAM standard shared across agencies (+ PD duties)."""
p = "slides4.js"
s = open(p, encoding="utf-8").read()
MARK = "// ------------------------------------------------------------------ 12 Roadmap + ask"
assert s.count(MARK) == 1 and "11b Cross-agency" not in s

SLIDE = r'''// ------------------------------------------------------------------ 11b Cross-agency standard
{
  const s = content("One standard for HR-driven ICAM, shared across agencies", "Delivery");
  const cols = [
    { x: 0.6, head: "Why a shared standard", tint: HEX.navyTint, c: HEX.navy, rows: [
      ["FaBuildingColumns", "Same platform, same standards", "Every agency moves to Core HCM on OPM’s data standards — one crosswalk and canonical model can be reused, not rebuilt by each"],
      ["FaRightLeft", "Attributes that travel", "Details, transfers and shared services read the same coded attributes; cross-agency access can trust the data"],
      ["FaChartLine", "Comparable evidence", "Common metrics for ICAM and Zero Trust maturity reporting across agencies"],
    ] },
    { x: 6.75, head: "How I’d carry it across agencies", tint: HEX.tealTint, c: HEX.teal, rows: [
      ["FaPeopleArrows", "Work the issues together", "With other agencies and the private sector; track legislative and policy developments and trends"],
      ["FaScaleBalanced", "Options and their impact", "Define the issues, develop options, predict the impact of alternatives, and present the findings"],
      ["FaUsersGear", "Committees and working groups", "Chair agency data committees; serve as the data expert on interagency ICAM working groups; recommend data technology and architecture"],
    ] },
  ];
  cols.forEach((col, k) => {
    box(s, `Cross col ${k + 1}`, col.x, 1.4, 6.0, 4.3, col.tint);
    txt(s, `Cross head ${k + 1}`, col.head, { x: col.x + 0.25, y: 1.5, w: 5.5, h: 0.45, fontSize: 18, bold: true, color: col.c });
    col.rows.forEach((r, i) => {
      const y = 2.05 + i * 1.2;
      icon(s, r[0], col.x + 0.25, y + 0.05, 0.62, col.c);
      txt(s, `Cross ${k + 1}.${i + 1}`, [
        { text: r[1], options: { bold: true, color: col.c, fontSize: 15.5, breakLine: true } },
        { text: r[2], options: { fontSize: 13 } },
      ], { x: col.x + 1.05, y, w: 4.75, h: 1.12, paraSpaceAfter: 2 });
    });
  });
  box(s, "Cross banner", 0.6, 5.9, 12.15, 0.8, HEX.amberTint);
  txt(s, "Cross banner text", [
    { text: "The goal: ", options: { bold: true, color: HEX.amber } },
    { text: "present this model to our fellow agencies, and adopt one HR-driven ICAM standard together as each agency onboards to HR 2.0." },
  ], { x: 0.9, y: 5.95, w: 11.6, h: 0.7, fontSize: 17, valign: "middle" });
  s.addNotes(
`[0:00–0:00]  One standard, shared across agencies.

Every agency is moving to the same Core HCM, on the same OPM data standards. If SSA defines HR-driven ICAM as a standard — the crosswalk, the canonical model, the identifiers and the evidence — other agencies can reuse it instead of each building their own. And attributes that mean the same thing everywhere make cross-agency work easier: details, transfers, shared services, and access decisions that can trust each other's data.

That's also how I'd carry it, and it's the work this position describes: working the issues with other agencies and the private sector, tracking legislative and policy developments, developing options and predicting their impact, and serving as the data expert on agency and interagency committees and working groups.

The goal is to present this model to our fellow agencies, so we adopt it together as each one onboards to HR 2.0.`);
}

'''
s = s.replace(MARK, SLIDE + MARK)
open(p, "w", encoding="utf-8").write(s)

q = "patch9.py"
t = open(q, encoding="utf-8").read()
a = '    ("The roadmap and the ask.",'
assert t.count(a) == 1
if "One standard, shared across agencies." not in t:
    t = t.replace(a, '    ("One standard, shared across agencies.", "Chapter 02 — Federal HR 2.0; Chapter 05 — The standard-attribute layer"),\n' + a)
    open(q, "w", encoding="utf-8").write(t)

e = "editions.py"
u = open(e, encoding="utf-8").read()
a = '        ("align with SSA\'s HR 2.0 team", "align with the agency\'s HR 2.0 team"),\n'
assert u.count(a) == 1
if "If SSA defines HR-driven ICAM" not in u:
    u = u.replace(a, a +
        '        ("If SSA defines HR-driven ICAM as a standard", "If one agency defines HR-driven ICAM as a standard"),\n'
        '        ("it\'s the work this position describes:", "it\'s the work an enterprise data architect does:"),\n')
    open(e, "w", encoding="utf-8").write(u)
print("ok")
