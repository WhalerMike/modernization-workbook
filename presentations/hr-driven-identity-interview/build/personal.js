// ------------------------------------------------------------------ 3b Personal
{
  const s = content("I’ve lived the impact of manually provisioned ICAM", "Thesis");
  const stories = [
    ["FaAddressBook", "The phone book (DITM)", "Active Directory fed the agency phone book, but nothing fed Active Directory from HR. Titles, offices, phone numbers and managers stayed wrong until someone filed a ticket."],
    ["FaUserTie", "Every change of management", "My organization, my manager, and my access to tools such as SAM were updated by hand — by ticket, after the fact, every time."],
  ];
  stories.forEach((st, i) => {
    const y = 1.55 + i * 2.45;
    box(s, `Story ${i + 1}`, 0.6, y, 6.3, 2.25, HEX.redTint);
    icon(s, st[0], 0.85, y + 0.25, 0.7, HEX.red);
    txt(s, `Story ${i + 1} text`, [
      { text: st[1], options: { bold: true, color: HEX.red, fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: st[2], options: { fontSize: 15 } },
    ], { x: 1.8, y: y + 0.22, w: 4.9, h: 1.9, paraSpaceAfter: 6 });
  });
  box(s, "HR-driven panel", 7.2, 1.55, 5.55, 4.7, HEX.tealTint);
  icon(s, "FaRightLeft", 7.45, 1.75, 0.6, HEX.teal);
  txt(s, "HR-driven heading", "With HR-driven IT", { x: 8.2, y: 1.75, w: 4.3, h: 0.6, bold: true, color: HEX.teal, fontSize: 20, fontFace: "Cambria", valign: "middle" });
  const steps = [
    "The personnel action records the reassignment",
    "Organization and manager update in Entra ID and AD",
    "The phone book, approvals and SAM access follow — from the authoritative source, not a ticket",
  ];
  steps.forEach((t, i) => {
    const y = 2.65 + i * 1.15;
    s.addShape(pres.shapes.OVAL, { objectName: `Step ${i + 1} badge`, x: 7.5, y, w: 0.5, h: 0.5, fill: { color: HEX.teal }, line: { color: HEX.teal } });
    txt(s, `Step ${i + 1} number`, String(i + 1), { x: 7.5, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, `Step ${i + 1} text`, t, { x: 8.2, y: y - 0.05, w: 4.35, h: 0.95, fontSize: 15.5, color: HEX.navy, valign: "top" });
    if (i < steps.length - 1) s.addShape(pres.shapes.LINE, { x: 7.75, y: y + 0.5, w: 0, h: 0.65, line: { color: HEX.teal, width: 1.5, endArrowType: "triangle" } });
  });
  s.addNotes(
`[3:09–4:11]  Why this matters to me personally: I've lived the impact of manually provisioned ICAM at the agency.

At DITM I watched the agency phone book come out of Active Directory — and nothing fed Active Directory from HR. Titles, offices, phone numbers and managers stayed wrong until someone noticed and filed a ticket.

And every time I've changed management, my organization, my manager, and my access to tools like SAM had to be updated by hand, after the fact, by ticket.

HR already knew all of it. With HR-driven IT, the personnel action that records the reassignment updates my organization and manager in Entra ID and Active Directory, and the phone book, the approval chain and SAM access follow from the authoritative source — instead of each of us, and the help desk, keeping them current by hand.

Workbook: HR-Driven Identity, Chapter 01 — What HR-driven provisioning means; Chapter 08 — Access packages and access reviews.`);
}

