// ------------------------------------------------------------------ 3 Why now (Zero Trust -> SASE -> ICAM -> HR data)
{
  const s = content("Why now: Zero Trust makes employee data the access decision", "Thesis");
  const chain = [
    ["The strategy", "Zero Trust", "OMB M-22-09 · NIST SP 800-207 · CISA ZTMM", HEX.slate, HEX.grey],
    ["The delivery", "SASE", "Each request enforced at the cloud edge (TIC 3.0)", HEX.navy, HEX.navyTint],
    ["The decision", "ICAM in Entra ID", "Token from PIV or phishing-resistant MFA; dynamic groups read attributes", HEX.teal, HEX.tealTint],
    ["Accuracy decides access", "Employee data", "Organization, position, status, supervisor", HEX.amber, HEX.amberTint],
  ];
  const W = 2.7, G = 0.45;
  chain.forEach((c, i) => {
    const x = 0.6 + i * (W + G);
    box(s, `Chain ${i + 1}`, x, 1.55, W, 2.05, c[4], c[3]);
    txt(s, `Chain ${i + 1} text`, [
      { text: c[0].toUpperCase(), options: { bold: true, color: c[3], fontSize: 11, breakLine: true } },
      { text: c[1], options: { bold: true, color: c[3], fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: c[2], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: 1.68, w: W - 0.4, h: 1.8, paraSpaceAfter: 4 });
  });
  const lab = (t, x) => txt(s, `Arrow label ${t}`, t, { x: x - 0.15, y: 2.2, w: G + 0.3, h: 0.3, fontSize: 10, color: HEX.slate, align: "center" });
  arrow(s, 0.6 + W, 2.6, G, 0); lab("delivered by", 0.6 + W);
  arrow(s, 0.6 + 2 * W + G, 2.6, G, 0); lab("driven by", 0.6 + 2 * W + G);
  s.addShape(pres.shapes.LINE, { x: 0.6 + 3 * W + 2 * G, y: 2.6, w: G, h: 0, line: { color: HEX.amber, width: 1.75, beginArrowType: "triangle" } });
  lab("feeds", 0.6 + 3 * W + 2 * G);
  s.addTable([head(["", "Perimeter era", "Zero Trust, delivered through SASE"]),
    [{ text: "What decides access", options: { bold: true, color: HEX.navy } }, { text: "Network location, then static groups" }, { text: "A token evaluated against attributes and dynamic groups, every session" }],
    [{ text: "A wrong department", options: { bold: true, color: HEX.navy } }, { text: "A wrong phone-book entry" }, { text: "The wrong groups — and the wrong access" }],
    [{ text: "A stale status", options: { bold: true, color: HEX.navy } }, { text: "An account someone may find later" }, { text: "A valid token for a separated person" }]],
    tableOpts([2.6, 4.2, 5.35], { y: 3.9, h: 1.65, fontSize: 14 }));
  box(s, "Takeaway", 0.6, 5.85, 12.15, 0.85, "FFFFFF", HEX.amber);
  txt(s, "Takeaway text", [
    { text: "When access is decided by attributes, ", options: { bold: true, color: HEX.amber } },
    { text: "the accuracy of employee data is the accuracy of access." },
  ], { x: 0.95, y: 5.9, w: 11.5, h: 0.75, fontSize: 18, valign: "middle" });
  s.addNotes(
`[0:00–0:00]  Why this matters now more than ever.

Zero Trust is federal strategy — OMB M-22-09, with NIST SP 800-207 as the architecture and CISA's maturity model as the yardstick. SASE is how it's delivered: security enforced at a cloud edge close to the user, which TIC 3.0 opens up for agencies, instead of at our network perimeter. And SASE's decisions are driven by ICAM: the user presents a token from a PIV card or phishing-resistant MFA, and Entra ID decides access through Conditional Access and dynamic groups that read the user's attributes.

In the perimeter era, a wrong department meant a wrong phone-book entry. Now it means the wrong groups, and so the wrong access — and a stale status is a valid token for someone who has left. When access is decided by attributes, the accuracy of employee data is the accuracy of access.`);
}

