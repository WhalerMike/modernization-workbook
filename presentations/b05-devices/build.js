// Book 05 — Devices & Endpoints: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b05-devices/build.js presentations/b05-devices/B05_Devices.pptx
// Every fact comes from a footnoted chapter of docs/books/b05-devices/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 05", title: "Devices & Endpoints" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B05_Devices.pptx";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why Group Policy", "Why Can't Group Policy Come to the Cloud?", "Book 05 — Devices & Endpoints");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:27]  This briefing comes from Book 05 of the Modernization Workbook, Devices and Endpoints: the move from Group Policy to Intune for devices, and to Azure Arc for servers.

I'll take it through four questions: why Group Policy can't simply be carried to the cloud, what replaces it, who owns the endpoint, and how to migrate a fleet without losing the governance Group Policy quietly provided.

The short version: this is not a settings migration. It's a governance rebuild.

Workbook: Book 05, index.`);
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why Group Policy", "Group Policy governed by position. Intune has no position.");
  tag(s, "Why");
  const jobs = [["Targeting", "Where a computer sits decides what it gets"], ["Precedence", "Link order and inheritance decide who wins"],
    ["Delegation", "OU permissions decide who may change it"], ["Timing", "Refresh at startup, sign-in and on a cycle"], ["Evidence", "Resultant set of policy says what applied"]];
  txt(s, "Jobs head", "WHAT THE OU TREE DID QUIETLY", { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  jobs.forEach((j, i) => {
    const y = 1.92 + i * 0.66;
    box(s, `Job ${i}`, 0.6, y, 6.2, 0.56, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Job ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h: 0.56, fontSize: 14.5, valign: "middle" });
  });
  box(s, "Intune box", 7.1, 1.55, 5.65, 3.65, HEX.tealTint);
  icon(s, "FaLaptop", 7.35, 1.75, 0.72, HEX.teal);
  txt(s, "Intune head", [
    { text: "AN ENTRA-JOINED, INTUNE-MANAGED DEVICE", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Policy is assigned, not inherited", options: { bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, "Intune list", bullets([
    "Assigned flatly to groups — nothing reads the OU tree",
    "Overlapping settings are reported as conflicts, not resolved by order",
    "Devices check in about every eight hours",
    "Some GPO jobs, such as mapped drives, have no built-in equivalent",
  ], 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
  callout(s, "Not a migration", 5.45, 1.05, "FaTriangleExclamation", HEX.red, "Not a settings migration: ",
    "teams that copy GPOs into Intune discover the governance loss after the targeting model has already changed. Every job the tree did implicitly must be rebuilt explicitly.");
  sources(s, "Sources: Microsoft Learn — Group Policy processing, Intune policy conflicts, device check-in, Group Policy analytics. Book 05, Chapter 01.");
  s.addNotes(
`[0:27–1:38]  Why can't Group Policy come to the cloud? Because Group Policy governed by position, and an Intune-managed device has no position.

Where a computer sat in the OU tree quietly did five jobs. It decided targeting: what settings the computer got. Precedence: link order and inheritance decided which setting won. Delegation: OU permissions decided who could change it. Timing: policy refreshed at startup, at sign-in and on a cycle. And evidence: the resultant set of policy told you what actually applied.

An Entra-joined, Intune-managed device has none of that. Policy is assigned flatly to groups, and nothing reads the OU tree. When two policies set the same thing, Intune reports a conflict; it doesn't resolve it by order. Devices check in about every eight hours. And some Group Policy jobs, mapped drives for example, have no built-in equivalent at all. Microsoft itself advises against copying GPOs one for one.

So this is not a settings migration. Teams that copy GPOs into Intune discover the governance loss after the targeting model has already changed. Every job the tree did implicitly has to be rebuilt explicitly.

Workbook: Book 05, Chapter 01 — Why Group Policy Can't Come to the Cloud.`);
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why Group Policy", "Hybrid join is a waypoint, not a destination");
  tag(s, "Why");
  const rows = [
    ["New, refurbished or reset devices", "Microsoft Entra join, by default", HEX.teal],
    ["Existing domain-joined devices", "Hybrid join — a cloud identity with minimal user impact", HEX.amber],
    ["Long-term end state", "Not hybrid join: move to Entra join", HEX.red],
  ];
  s.addTable([head(["Device situation", "Microsoft's recommendation"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true } }, { text: r[1], options: { bold: true, color: r[2] } }])],
    tableOpts([3.6, 4.0], { y: 1.55, fontSize: 15, rowH: [0.45, 0.75, 0.75, 0.75] }));
  box(s, "Switch box", 8.45, 1.55, 4.3, 3.5, HEX.amberTint);
  icon(s, "FaArrowsRotate", 8.7, 1.75, 0.7, HEX.amber);
  txt(s, "Switch head", "Why it's a trap", { x: 9.55, y: 1.75, w: 3.1, h: 0.7, bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Switch list", bullets([
    "Turning on hybrid join for a fleet is close to one tenant-wide switch",
    "It keeps every on-premises dependency",
    "No supported conversion to Entra join without resetting Windows",
  ], 14), { x: 8.7, y: 2.6, w: 3.9, h: 2.4, paraSpaceAfter: 7 });
  callout(s, "Governed", 5.3, 1.25, "FaRoute", HEX.teal, "The governed path: ",
    "use hybrid join where it helps, and plan each device's move to Entra join at its next refresh, upgrade or rebuild — so the waypoint doesn't become the destination by default.");
  sources(s, "Sources: Microsoft Learn — choosing a device join type; Windows Autopilot hybrid join guidance. Book 05, Chapter 02.");
  s.addNotes(
`[1:38–2:41]  The obvious shortcut is hybrid join, and the book calls it a trap, carefully.

Microsoft's guidance has two halves. New, refurbished or reset Windows devices should be Microsoft Entra joined by default. Existing domain-joined devices can be hybrid joined, which gives them a cloud identity with minimal impact on users. But Microsoft is explicit that hybrid join shouldn't be the long-term end state.

Here's the trap. Turning on hybrid join for a fleet is, mechanically, close to a single tenant-wide switch, so a control that assessments score as a multi-quarter program can look finished in a week. But the fleet keeps every on-premises dependency it had. And there's no Microsoft-supported way to convert a hybrid-joined device to Entra join without resetting Windows.

So the governed path uses hybrid join where it helps, and plans each device's move to Entra join at a natural event: the next hardware refresh, operating-system upgrade or rebuild. That way the waypoint doesn't quietly become the destination.

Workbook: Book 05, Chapter 02 — The Hybrid Join Trap.`);
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What replaces it", "Devices and servers take different roads");
  tag(s, "What");
  const cols = [
    ["FaLaptop", "Endpoints", HEX.teal, HEX.tealTint, ["Entra ID device object: identity", "Intune: configuration and compliance", "Autopilot: zero-touch provisioning", "Defender for Endpoint: threat and vulnerability"]],
    ["FaServer", "Servers", HEX.navy, HEX.navyTint, ["Azure Arc: the server as an Azure resource", "Azure Policy machine configuration: the settings", "Update Manager and Defender for Servers", "Intune doesn't manage Windows Server"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.2;
    box(s, `Road ${i}`, x, 1.55, 4.05, 3.6, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Road ${i} head`, c[1], { x: x + 1.0, y: 1.72, w: 2.9, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Road ${i} text`, bullets(c[4], 14.5), { x: x + 0.25, y: 2.5, w: 3.6, h: 2.6, paraSpaceAfter: 7 });
  });
  box(s, "Onboard box", 9.0, 1.55, 3.75, 3.6, "FFFFFF", HEX.amber);
  icon(s, "FaDoorOpen", 9.25, 1.72, 0.62, HEX.amber);
  txt(s, "Onboard head", "Intune-first", { x: 10.05, y: 1.72, w: 2.6, h: 0.62, bold: true, color: HEX.amber, fontSize: 19, fontFace: "Cambria", valign: "middle" });
  txt(s, "Onboard text", "New devices are governed from day zero: the organizational assignment is set at procurement, enrollment is zero-touch, and a failure goes to quarantine — never to production in a degraded state.",
    { x: 9.25, y: 2.5, w: 3.3, h: 2.6, fontSize: 14 });
  callout(s, "Correlate", 5.4, 1.1, "FaSitemap", HEX.slate, "One record, many systems: ",
    "each system is authoritative for one thing, so the program correlates them on stable keys and reconciles the inventory continuously.");
  sources(s, "Sources: Microsoft Learn — Intune supported platforms, Azure Arc, machine configuration, Autopilot. Book 05, Chapters 03–04.");
  s.addNotes(
`[2:41–3:47]  What replaces it? Devices and servers take different roads.

For endpoints, the Entra ID device object carries the identity, Intune carries configuration and compliance, Autopilot provides zero-touch provisioning, and Defender for Endpoint covers threat and vulnerability.

Servers are different, and the old design documents got this wrong. Intune doesn't manage Windows Server. A server comes under governance through Azure Arc, which makes it an Azure resource. Azure Policy machine configuration sets its configuration, and Update Manager and Defender for Servers handle patching and protection.

For new devices, the book's doctrine is Intune-first: governed from day zero. The organizational assignment is set when the device is ordered, enrollment is zero-touch, and an onboarding failure goes to quarantine, never into production in a degraded state.

Because each system is authoritative for one thing, the program correlates them on stable keys and reconciles the inventory continuously, so the fleet has one answer to "what do we have, and is it governed?"

Workbook: Book 05, Chapter 03 — Where Device and Server Data Lives; Chapter 04 — Intune-First Onboarding.`);
}

// ------------------------------------------------------------------ What 1b: Intune-first
{
  const s = D.content("What replaces it", "Intune-first: no ungoverned device, ever");
  tag(s, "What");
  const pillars = [
    ["1", "No ungoverned device", "Enrolled in governance before production use; quarantine is the safety valve"],
    ["2", "Procurement first", "The organizational assignment is set when the order is placed"],
    ["3", "Zero-touch only", "Manual enrollment is a justified, time-boxed, audited exception"],
    ["4", "One management plane", "Intune for endpoints; Arc and machine configuration for servers; no greenfield GPO or hybrid join"],
    ["5", "Quarantine on failure", "Never silently degrade; a failure opens a ticket"],
  ];
  pillars.forEach((p, i) => {
    const y = 1.5 + i * 0.72;
    box(s, `Pillar ${i}`, 0.6, y, 7.6, 0.62, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Pillar ${i} text`, [
      { text: `${p[0]}  ${p[1]}   `, options: { bold: true, color: i % 2 ? HEX.teal : HEX.navy } },
      { text: p[2], options: { fontSize: 13.5 } },
    ], { x: 0.8, y, w: 7.3, h: 0.62, fontSize: 15, valign: "middle" });
  });
  box(s, "Autopilot box", 8.45, 1.5, 4.3, 3.5, "FFFFFF", HEX.amber);
  icon(s, "FaLaptop", 8.7, 1.68, 0.62, HEX.amber);
  txt(s, "Autopilot head", "Autopilot choice", { x: 9.5, y: 1.68, w: 3.1, h: 0.62, bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Autopilot text", "Classic Autopilot, with devices registered by the OEM or reseller, is the default in a GCC tenant: it can carry a group tag at registration. Autopilot device preparation has no registration step, so it can't.",
    { x: 8.7, y: 2.45, w: 3.85, h: 2.5, fontSize: 14 });
  callout(s, "Doctrine", 5.3, 1.25, "FaClipboardCheck", HEX.slate, "Program doctrine, not Microsoft requirements: ",
    "the five pillars are the book's design for net-new devices; the existing fleet takes one of the three paths that follow.");
  sources(s, "Sources: Microsoft Learn — Windows Autopilot, Autopilot device preparation, Intune supported platforms. Book 05, Chapter 04.");
  s.addNotes(
`[3:47–5:04]  For new devices, the book's doctrine is Intune-first, and it has five pillars.

One: no ungoverned device, ever. Every device is enrolled in governance before it goes into production use, and quarantine is the safety valve, not the steady state. Two: procurement is the first governance step. The organizational assignment is set when the order is placed, not when the box arrives, the same way HR feeds user provisioning. Three: zero-touch only. Manual enrollment is an exception that needs written justification, a time limit and an audit entry. Four: one management plane per asset. Intune for endpoints, Azure Arc with machine configuration for servers, and no greenfield Group Policy or hybrid join. And five: quarantine on failure. An onboarding failure opens a ticket; it never produces a device running in a degraded state.

One practical choice: in a GCC tenant, the book defaults to classic Autopilot, with devices registered by the manufacturer or reseller, because that registration can carry a group tag. The newer Autopilot device preparation has no registration step, so it can't.

These pillars are program doctrine for net-new devices. The existing fleet takes one of three paths.

Workbook: Book 05, Chapter 04 — Intune-First Onboarding.`);
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What replaces it", "Three paths to the same governed state");
  tag(s, "What");
  const p = [
    ["Governed", "Program-orchestrated: every step recorded, approved and evidenced", HEX.teal, HEX.tealTint, "Default for any population in scope"],
    ["Manual", "Operator-run with native tools, without the orchestration platform", HEX.amber, HEX.amberTint, "When the platform isn't available yet"],
    ["Retrofit", "Bring an estate already modernized by hand under governance", HEX.navy, HEX.navyTint, "When the work was done before the program"],
  ];
  p.forEach((r, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Path ${i}`, x, 1.55, 3.95, 3.3, r[3]);
    txt(s, `Path ${i} text`, [
      { text: r[0], options: { bold: true, color: r[2], fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: r[1], options: { fontSize: 14.5, breakLine: true } },
      { text: " ", options: { fontSize: 8, breakLine: true } },
      { text: r[4], options: { fontSize: 13.5, italic: true, color: HEX.slate } },
    ], { x: x + 0.25, y: 1.75, w: 3.45, h: 3.0, paraSpaceAfter: 6 });
  });
  callout(s, "Same end", 5.1, 1.45, "FaClipboardCheck", HEX.slate, "Same end state, different evidence: ",
    "every path ends with the device or server enrolled, baselined and reconciled; what differs is how much of the proof is produced automatically, and what has to be collected by hand.");
  sources(s, "Program design, with Microsoft Learn facts for each step. Book 05, Chapter 05.");
  s.addNotes(
`[5:04–6:04]  There are three paths to the same governed state, and the book uses them deliberately.

The governed path is program-orchestrated: every step is recorded, approved and evidenced. It's the default for any population in scope.

The manual path is operator-run with the native tools, without the orchestration platform. It's for when the platform isn't available yet, and it trades automation for more hand-collected evidence.

The retrofit path brings an estate that was already modernized by hand, before the program existed, under governance after the fact.

All three end in the same place: the device or server enrolled, baselined and reconciled. What differs is how much of the proof is produced automatically and how much has to be collected by hand. The chapter also corrects a few things the old path guides got wrong, for example that LAN Manager authentication level five still accepts NTLM version two; blocking NTLM takes the separate Restrict NTLM policies.

Workbook: Book 05, Chapter 05 — The Governed, Manual and Retrofit Paths.`);
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who decides, who does the work for the endpoint");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["CISO and ISSO", "Baselines, exceptions, evidence"], ["Endpoint engineering lead", "Policy design and the rollout"], ["Change board", "Rings, waves, pauses"]]],
    ["FaUsersGear", "Do", HEX.teal, HEX.tealTint, [["Endpoint engineering", "Intune policies, Autopilot, apps"], ["Server team", "Arc onboarding, machine configuration"], ["Security operations", "Defender, alerts, response"]]],
    ["FaPeopleArrows", "Consulted and affected", HEX.amber, HEX.amberTint, [["Application owners", "Test results and app packaging"], ["Help desk", "Enrollment, wipe, recovery"], ["End users", "Pilot waves and feedback"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [
      { text: r[0], options: { bold: true, color: c[2], breakLine: true } },
      { text: r[1], options: { breakLine: k < c[4].length - 1 } },
    ]), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, fontSize: 14.5, paraSpaceAfter: 6 });
  });
  callout(s, "Least", 5.3, 1.2, "FaUserShield", HEX.navy, "Least privilege for the people too: ",
    "day-to-day work runs on scoped Intune roles, not Intune Administrator; Microsoft advises against using the broad role for routine administration.");
  sources(s, "Sources: Microsoft Learn — Intune role-based access control; the program's responsibility matrix. Book 05, Chapter 06.");
  s.addNotes(
`[6:04–7:06]  Who owns the endpoint? The book separates who decides from who does the work.

Deciding: the CISO and ISSO own the baselines, the exceptions and the evidence. The endpoint engineering lead owns policy design and the rollout. And the change board owns the update rings, the migration waves and any pause.

Doing: endpoint engineering builds the Intune policies, Autopilot profiles and app deployments. The server team onboards servers to Azure Arc and owns machine configuration. Security operations runs Defender, the alerts and the response.

Consulted and affected: application owners supply test results and app packaging. The help desk handles enrollment, wipe and recovery. And end users join pilot waves and tell us what broke.

One rule applies to the people as much as the devices: least privilege. Day-to-day work runs on scoped Intune roles, not Intune Administrator; Microsoft advises against using the broad role for routine administration.

Workbook: Book 05, Chapter 06 — Who Owns the Endpoint.`);
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to do it", "Sunset Group Policy as a program, setting by setting");
  tag(s, "How");
  const st = ["Inventory and parse", "Classify each setting", "Crosswalk", "Decide", "Sequence by population", "Freeze and unlink", "Retire"];
  st.forEach((t, i) => {
    const x = 0.6 + i * 1.75;
    box(s, `Step ${i}`, x, 1.65, 1.6, 1.5, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Step ${i} text`, [
      { text: `${i + 1}`, options: { bold: true, fontSize: 24, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy, breakLine: true } },
      { text: t, options: { fontSize: 13, bold: true } },
    ], { x: x + 0.1, y: 1.72, w: 1.4, h: 1.38, align: "center" });
  });
  txt(s, "Facts", bullets([
    "Each setting goes one of three ways: migrate to Intune, replace with a cloud-native pattern, or retire",
    "During coexistence Group Policy wins by default; MDMWinsOverGP reverses that only for Policy CSP settings",
    "Group Policy preferences can leave settings behind after unlinking — every preference item needs planned cleanup",
    "Unlink one population at a time; don't block inheritance",
  ], 14.5), { x: 0.6, y: 3.35, w: 12.15, h: 1.9, paraSpaceAfter: 5 });
  callout(s, "Analytics", 5.45, 1.05, "FaFilter", HEX.amber, "Measure, don't assume: ",
    "Microsoft publishes no typical percentage of settings that migrate — run Group Policy analytics against the estate's own GPO exports.");
  sources(s, "Sources: Microsoft Learn — Group Policy analytics, MDMWinsOverGP, Group Policy preferences. Book 05, Chapter 07 and Appendix A.");
  s.addNotes(
`[7:06–8:17]  How. The book runs the Group Policy sunset as a program, setting by setting, in seven steps: inventory and parse, classify each setting, crosswalk it, decide, sequence by population, freeze and unlink, and finally retire.

Every setting goes one of three ways: migrate it to Intune, replace it with a cloud-native pattern, or retire it.

The coexistence rules matter, and the old guides had them wrong. While a device is under both, Group Policy wins by default. The MDMWinsOverGP setting reverses that, but only for settings in the Policy configuration service provider; Defender settings and Windows Hello for Business have to be removed from Group Policy, not overridden. Group Policy preferences can leave their settings behind after a GPO is unlinked, so every preference item needs a planned cleanup. And the book unlinks one population at a time rather than blocking inheritance, because that's scoped and reversible.

One more thing: measure, don't assume. Microsoft publishes no typical percentage of settings that migrate, so the program runs Group Policy analytics against the estate's own exports.

Workbook: Book 05, Chapter 07 — The GPO Sunset Program; Appendix A — GPO to Intune Crosswalk.`);
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to do it", "Migrate the fleet in seven phases, about 34 weeks");
  tag(s, "How");
  const rows = [
    ["1 Inventory and classify", "3–5 wk", "A decision record for every setting"],
    ["2 Coexistence planning", "2–3 wk", "Pilot devices co-managed and syncing"],
    ["3 Baseline authoring", "3–4 wk", "Every setting owned by exactly one policy"],
    ["4 Pilot (about 5%)", "4–6 wk", "No unexplained conflicts; tests pass"],
    ["5 Workload cutover", "8–12 wk", "Four waves, each watched 72 hours"],
    ["6 Verification", "~2 wk", "No migrated device processes a GPO"],
    ["7 Retirement", "~2 wk + 90 days", "GPOs archived and deleted"],
  ];
  s.addTable([head(["Phase", "Duration", "Exit gate"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([3.4, 1.7, 3.6], { y: 1.5, fontSize: 13.5, rowH: [0.4, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44] }));
  box(s, "Floor box", 9.45, 1.5, 3.3, 3.48, HEX.amberTint);
  icon(s, "FaLaptop", 9.7, 1.7, 0.62, HEX.amber);
  txt(s, "Floor text", [
    { text: "The floor", options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", breakLine: true } },
    { text: "Windows 11 24H2. Windows 10 is out of support, and 23H2 Enterprise stops getting updates on November 10, 2026.", options: { fontSize: 14 } },
  ], { x: 9.7, y: 2.45, w: 2.85, h: 2.4 });
  callout(s, "Estimates", 5.25, 1.25, "FaClipboardCheck", HEX.slate, "Planning estimates, not promises: ",
    "durations are for a large fleet with an existing Configuration Manager estate; every gate is the next phase's precondition, and every phase has a rollback while it's open.");
  sources(s, "Sources: Microsoft Learn — co-management workloads, Windows lifecycle. Book 05, Chapter 08.");
  s.addNotes(
`[8:17–9:27]  The existing fleet then migrates in seven phases, about thirty-four weeks on the book's planning estimates.

Phase one inventories and classifies, ending with a decision record for every setting. Phase two plans coexistence, with pilot devices co-managed and syncing. Phase three authors the baselines, unassigned, until every setting is owned by exactly one policy. Phase four pilots on about five percent of devices. Phase five cuts over workload by workload in four waves, each watched for seventy-two hours. Phase six verifies that no migrated device still processes a GPO. And phase seven retires the GPOs, keeping them ninety days before they're archived and deleted.

The book also sets a floor: Windows 11 version 24H2. Windows 10 is out of support, and Windows 11 23H2 Enterprise stops getting updates on November 10, 2026.

These are planning estimates for a large fleet with an existing Configuration Manager estate, not promises. Every gate is the next phase's precondition, and every phase has a rollback while it's open.

Workbook: Book 05, Chapter 08 — GPO to Intune Policy Migration.`);
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to do it", "Servers under Azure Arc, and the dates that matter");
  tag(s, "How");
  const items = [
    ["FaServer", "Onboard with least privilege", "Connected Machine agent; certificate-based onboarding identity used only at connect time", HEX.navy],
    ["FaListCheck", "Configure through Azure Policy", "Machine configuration baselines, assigned by scope", HEX.teal],
    ["FaShieldHalved", "Patch and protect", "Update Manager and Defender for Servers", HEX.amber],
  ];
  items.forEach((r, i) => {
    const y = 1.6 + i * 1.12;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[3]);
    txt(s, `Srv ${i}`, [
      { text: r[1], options: { bold: true, color: r[3], fontSize: 16.5, breakLine: true } },
      { text: r[2], options: { fontSize: 14 } },
    ], { x: 1.4, y, w: 5.6, h: 1.02 });
  });
  const dates = [["October 13, 2026", "Windows Server 2012 / 2012 R2 extended security updates ended", HEX.red, HEX.redTint],
    ["January 12, 2027", "Windows Server 2016 reaches end of support", HEX.amber, HEX.amberTint]];
  dates.forEach((d, i) => {
    const y = 1.6 + i * 1.7;
    box(s, `Date ${i}`, 7.35, y, 5.4, 1.5, d[3]);
    txt(s, `Date ${i} text`, [
      { text: d[0], options: { bold: true, color: d[2], fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: d[1], options: { fontSize: 14.5 } },
    ], { x: 7.6, y: y + 0.15, w: 5.0, h: 1.25 });
  });
  callout(s, "Rollback", 5.3, 1.25, "FaArrowsRotate", HEX.slate, "Rollback in the right order: ",
    "remove extensions before disconnecting the agent — disconnect deletes the Azure resource, which the onboarding role isn't allowed to do.");
  sources(s, "Sources: Microsoft Learn — Azure Arc onboarding, machine configuration, Windows Server lifecycle and ESUs. Book 05, Chapter 09.");
  s.addNotes(
`[9:27–10:21]  Servers come under governance through Azure Arc.

Onboarding uses the Connected Machine agent with least privilege: a certificate-based onboarding identity that's needed only at connect time. Configuration comes through Azure Policy machine configuration baselines, assigned by scope. And patching and protection come from Update Manager and Defender for Servers.

Two dates make this urgent. Extended security updates for Windows Server 2012 and 2012 R2 ended on October 13, 2026, a week ago, so any remaining 2012 host is a red finding. And Windows Server 2016 reaches end of support on January 12, 2027.

The book is careful about rollback too: remove extensions before disconnecting the agent, because disconnecting deletes the Azure resource, which the onboarding role isn't allowed to do.

Workbook: Book 05, Chapter 09 — Servers Under Azure Arc.`);
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to do it", "Run it, prove it, and what we need");
  tag(s, "How");
  txt(s, "Run head", "RUN-STATE THE BOOK DEFINES", { x: 0.6, y: 1.55, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  txt(s, "Run list", bullets([
    "Compliance feeds Conditional Access (Book 04)",
    "Updates through rings and Autopatch; evidence from Intune and Autopatch reports in GCC",
    "Inventory reconciled across Entra ID, Intune, Autopilot, Arc and the CMDB",
    "Retire and wipe devices before the account is deleted",
    "Evidence mapped to CM-2, CM-6, CM-7, CM-8 and SI-2",
  ], 15), { x: 0.6, y: 1.95, w: 6.3, h: 3.2, paraSpaceAfter: 8 });
  box(s, "Ask box", 7.25, 1.55, 5.5, 3.6, HEX.tealTint);
  icon(s, "FaUserCheck", 7.5, 1.75, 0.7, HEX.teal);
  txt(s, "Ask head", "What we need", { x: 8.35, y: 1.75, w: 4.2, h: 0.7, bold: true, color: HEX.teal, fontSize: 19, fontFace: "Cambria", valign: "middle" });
  txt(s, "Ask text", bullets([
    "Approve Intune-first for every new device",
    "Fund the GPO inventory and Group Policy analytics run",
    "Set the Windows 11 24H2 floor and a server end-of-support plan",
    "Name the owners: endpoint, server, security",
  ], 14.5), { x: 7.5, y: 2.55, w: 5.05, h: 2.5, paraSpaceAfter: 7 });
  callout(s, "Next", 5.4, 1.1, "FaBook", HEX.navy, "Read next: ",
    "Book 05 for the full migration, every claim footnoted; Book 04 for what a compliant device may reach; Book 02 for the identity it rests on.");
  s.addNotes(
`[10:21–11:36]  Finally, run it and prove it. In run-state, compliance feeds Conditional Access, which is Book 04. Updates flow through rings and Windows Autopatch, and in a GCC tenant the update evidence comes from Intune and Autopatch reports, because Windows Update for Business reports don't meet GCC compliance. The inventory is reconciled across Entra ID, Intune, Autopilot, Arc and the CMDB. Devices are retired and wiped before the account is deleted. And the evidence maps to the configuration-management and flaw-remediation controls: CM-2, CM-6, CM-7, CM-8 and SI-2.

What we need from leadership is four things. Approve Intune-first for every new device. Fund the Group Policy inventory and the Group Policy analytics run. Set the Windows 11 24H2 floor and a plan for servers reaching end of support. And name the owners for endpoints, servers and security.

Book 05 has the full migration, with every external claim footnoted. Book 04 covers what a compliant device may reach, and Book 02 the identity it rests on. Thank you.

Workbook: Book 05, Chapter 10 — Operating and Evidencing the Fleet.`);
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Microsoft Learn: Group Policy processing and precedence; Intune policy conflicts and device check-in; Group Policy analytics.",
    "Microsoft Learn: Plan your Microsoft Entra device deployment (join types); Windows Autopilot and hybrid join guidance.",
    "Microsoft Learn: Intune supported operating systems; MDMWinsOverGP (Policy CSP); Group Policy preferences behavior.",
    "Microsoft Learn: Azure Arc–enabled servers onboarding; Azure Policy machine configuration; Update Manager; Defender for Servers.",
    "Microsoft Learn: Windows Server 2012/2012 R2 and 2016 lifecycle and extended security updates; Windows 11 lifecycle.",
    "Microsoft Learn: Configuration Manager co-management workloads; Windows Autopatch; Windows Update for Business reports (GCC).",
    "Microsoft Learn: Intune role-based access control.  ·  NIST SP 800-53 Rev. 5 (CM-2, CM-6, CM-7, CM-8, SI-2).",
    "Full footnotes with links and access dates: Book 05, every chapter (whalermike.github.io/modernization-workbook/docs/books/b05-devices/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
