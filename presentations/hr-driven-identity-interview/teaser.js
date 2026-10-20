// ------------------------------------------------------------------ 13 Teaser
pres.addSection({ title: "Beyond" });
{
  const s = content("More modernizations I\u2019ve designed for the agency", "Beyond");
  const items = [
    ["FaCloudArrowUp", "AD \u2192 Entra ID migration", "Directory move with drift detection and evidence"],
    ["FaGlobe", "Next-generation DNS and IPAM", "One DDI control plane across on-premises and clouds"],
    ["FaBuilding", "Field office WAN and data centers", "Office network transformation and consolidation"],
    ["FaRoute", "TIC 3.0 branch edge", "SD-WAN versus direct internet access"],
    ["FaServer", "Client-server to hybrid cloud", "Application path from on-premises to cloud"],
    ["FaDatabase", "SQL Server identity", "Database logins moved to governed identity"],
    ["FaLaptop", "GPO sunset to Intune and Arc", "Policy and device management in the cloud"],
    ["FaShieldHalved", "Continuous compliance", "SCuBA baselines, BOD 25-01, FedRAMP 20x"],
  ];
  items.forEach((it, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.07, y = 1.45 + row * 2.25;
    const c = row ? HEX.teal : HEX.navy;
    box(s, `Teaser ${i + 1}`, x, y, 2.92, 2.1, row ? HEX.tealTint : HEX.navyTint);
    icon(s, it[0], x + 0.2, y + 0.18, 0.5, c);
    txt(s, `Teaser ${i + 1} text`, [
      { text: it[1], options: { bold: true, color: c, fontSize: 16, breakLine: true } },
      { text: it[2], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: y + 0.78, w: 2.6, h: 1.25, paraSpaceAfter: 3 });
  });
  box(s, "Teaser footer", 0.6, 6.0, 12.15, 0.7, "FFFFFF", HEX.amber);
  txt(s, "Teaser footer text", [
    { text: "Also: ", options: { bold: true, color: HEX.amber } },
    { text: "Zero Trust whole-agency unification \u00b7 AI identity governance \u00b7 help desk Entra operations" },
  ], { x: 0.9, y: 6.02, w: 11.6, h: 0.66, fontSize: 16, valign: "middle" });
  s.addNotes(
`[Leave up during questions — about 20 seconds]

HR-driven identity is one piece of a larger set of modernizations I've designed for the agency over the last several years: the AD to Entra ID migration, next-generation DNS and IP address management, field office WAN and data-center consolidation, the TIC 3.0 branch edge, the client-server to hybrid cloud path, SQL Server identity, the move from Group Policy to Intune and Azure Arc, and continuous compliance against SCuBA, BOD 25-01 and FedRAMP 20x.

They share the same data discipline you just saw: a named authority for every fact, a governed model, and evidence produced by operation. I'm happy to go into any of them.

Workbook: HR-Driven Identity, the same site's Whitepapers, Next-Generation DDI, Client-Server to Hybrid Cloud and Operational Guides sections.`);
}
