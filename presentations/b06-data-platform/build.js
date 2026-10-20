// Book 06 — Data Platform: SQL Server Identity. The 15-minute Why / What / Who / How deck.
// Build:  node presentations/b06-data-platform/build.js presentations/b06-data-platform/B06_Data_Platform.pptx
// Every fact comes from a footnoted chapter or runbook of docs/books/b06-data-platform/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 06", title: "Data Platform: SQL Server Identity" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B06_Data_Platform.pptx";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why the database", "Why Is the Database Where Legacy Authentication Hides?", "Book 06 — Data Platform: SQL Server Identity");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:26]  This briefing comes from Book 06 of the Modernization Workbook: the SQL Server estate's move from Windows Authentication to cloud identity.

Every identity program eventually reaches the database, and the database is where it finds the most Windows authentication still in use. I'll take it through why that is, what replaces it, who owns the work, and how to do it, from the estate inventory to a closure condition you can keep proving.

Workbook: Book 06, index.`);
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why the database", "SQL Server trusts whatever Windows tells it");
  tag(s, "Why");
  const ways = [
    ["Kerberos", "When the SPN is right", HEX.slate, HEX.grey],
    ["NTLM", "Silently, when the SPN is missing", HEX.red, HEX.redTint],
    ["SQL login", "A password the engine checks itself", HEX.amber, HEX.amberTint],
    ["Microsoft Entra", "The only path Conditional Access sees", HEX.teal, HEX.tealTint],
  ];
  txt(s, "Ways head", "FOUR WAYS A CONNECTION REACHES THE ENGINE", { x: 0.6, y: 1.55, w: 7, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  ways.forEach((w, i) => {
    const x = 0.6 + i * 3.06;
    box(s, `Way ${i}`, x, 1.95, 2.9, 1.65, w[3]);
    txt(s, `Way ${i} text`, [{ text: w[0], options: { bold: true, fontSize: 19, fontFace: "Cambria", color: w[2], breakLine: true } }, { text: w[1], options: { fontSize: 14.5 } }],
      { x: x + 0.2, y: 2.1, w: 2.5, h: 1.4 });
  });
  txt(s, "Facts", bullets([
    "Windows Authentication can't be turned off in SQL Server — the engine delegates to the Windows security subsystem",
    "Which protocol a connection used isn't logged; it shows only in sys.dm_exec_connections.auth_scheme",
    "Local connections use NTLM even when the SPN is right; an SPN on the wrong account makes the login fail",
  ], 14.5), { x: 0.6, y: 3.8, w: 12.15, h: 1.5, paraSpaceAfter: 5 });
  callout(s, "Good engineering", 5.45, 1.05, "FaLightbulb", HEX.navy, "Good engineering, for a world that's gone: ",
    "Windows Authentication was the right design for a domain-joined estate. The case for replacing it rests on that world no longer existing, not on calling it a mistake.");
  sources(s, "Sources: Microsoft Learn — SQL Server authentication modes, SPNs for Kerberos, sys.dm_exec_connections. Book 06, Chapter 01.");
  s.addNotes(
`[0:26–1:34]  Why is the database where legacy authentication hides? Because SQL Server trusts whatever Windows tells it.

A connection reaches the engine in one of four ways. Kerberos, when the service principal name is right. NTLM, silently, when the SPN is missing. A SQL login, where the engine checks a password itself. Or Microsoft Entra authentication, which is the only one Conditional Access ever sees.

Three facts make the inheritance hard to see. Windows Authentication can't be turned off in SQL Server, because the engine delegates it to the Windows security subsystem. Which protocol a connection used isn't written to any log; it shows only in a dynamic management view, sys.dm_exec_connections. And local connections use NTLM even when the SPN is right, while an SPN registered on the wrong account makes the login fail outright.

The book is careful about one thing: Windows Authentication was good engineering for a domain-joined estate. The case for replacing it rests on that world no longer existing, not on calling it a mistake.

Workbook: Book 06, Chapter 01 — What Windows Authentication Actually Is.`);
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why the database", "Three drivers, and what is really due in 2027");
  tag(s, "Why");
  const dr = [
    ["FaPlugCircleXmark", "NTLM elimination", HEX.red, "Microsoft deprecated all NTLM in June 2024 and plans to disable it by default; the program sets its own backstop: 2027-04-01."],
    ["FaShieldHalved", "Zero Trust in the path", HEX.navy, "M-22-09 puts phishing-resistant MFA and the Entra identity plane in front of human access."],
    ["FaKey", "Service-account credentials", HEX.teal, "The directory modernization ends the domain-joined world the service accounts depend on."],
  ];
  dr.forEach((r, i) => {
    const y = 1.6 + i * 1.08;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[2]);
    txt(s, `Driver ${i}`, [{ text: r[1], options: { bold: true, color: r[2], fontSize: 16.5, breakLine: true } }, { text: r[3], options: { fontSize: 14 } }], { x: 1.4, y, w: 5.6, h: 1.02 });
  });
  const rows = [["July 14, 2026", "SQL Server 2016 out of support"], ["January 12, 2027", "Windows Server 2016 out of support"], ["July 12, 2027", "Last SQL Server 2014 ESU year ends"], ["October 12, 2027", "SQL Server 2017 out of support"]];
  s.addTable([head(["Date", "External event"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.amber } }, { text: r[1] }])],
    tableOpts([2.2, 3.35], { x: 7.2, y: 1.6, fontSize: 14, rowH: [0.42, 0.62, 0.62, 0.62, 0.62] }));
  callout(s, "No deadline", 5.3, 1.25, "FaScaleBalanced", HEX.slate, "No external NTLM deadline: ",
    "Microsoft hasn't dated the disable-by-default step. The 2027 dates that are real are support dates — and SQL Server 2014 and 2017 can't use Entra authentication, so they close only by upgrade or retirement.");
  sources(s, "Sources: Microsoft Learn — deprecated features (NTLM), SQL Server and Windows Server lifecycle; OMB M-22-09. Book 06, Chapters 02 and 21.");
  s.addNotes(
`[1:34–2:59]  Three drivers make the inheritance end.

First, NTLM elimination. Microsoft deprecated all versions of NTLM in June 2024 and plans to disable it by default in a future Windows release. The program sets its own backstop, April 1, 2027, for the domain-wide block.

Second, Zero Trust in the authentication path. OMB M-22-09 puts phishing-resistant MFA and the Entra identity plane in front of human access, and Windows Authentication bypasses both.

Third, service-account credentials. The directory modernization in Book 02 ends the domain-joined world those service accounts depend on.

The book is precise about 2027. There's no external NTLM deadline; Microsoft hasn't dated the disable-by-default step. The dates that are real are support dates: SQL Server 2016 went out of support in July 2026, Windows Server 2016 follows in January 2027, the last SQL Server 2014 extended-security year ends in July 2027, and SQL Server 2017 goes out of support in October 2027. SQL Server 2014 and 2017 can't use Entra authentication at all, so they reach the closed state only by upgrade or retirement.

Workbook: Book 06, Chapter 02 — Why the Inheritance Must End; Chapter 21 — What Done Looks Like.`);
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What changes", "Rationalize the estate before migrating it");
  tag(s, "What");
  const v = [["Retain", "Supported or upgradable to 2022+, load-bearing, no reason to collapse it", HEX.teal, HEX.tealTint], ["Consolidate", "Workload moves into a target platform; the old instance retires", HEX.navy, HEX.navyTint], ["Retire", "No live workload: decommission instead of migrating", HEX.red, HEX.redTint]];
  v.forEach((r, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `V ${i}`, x, 1.55, 3.95, 2.0, r[3]);
    txt(s, `V ${i} text`, [{ text: r[0], options: { bold: true, fontSize: 21, fontFace: "Cambria", color: r[2], breakLine: true } }, { text: r[1], options: { fontSize: 14.5 } }], { x: x + 0.25, y: 1.7, w: 3.45, h: 1.75 });
  });
  txt(s, "Inventory", bullets([
    "Inventory the whole forest — setspn needs -F to search beyond one domain",
    "Read usage, versions and dependencies; index counters reset on restart, so they can't prove disuse alone",
    "Use SQL Server Management Studio's migration component — the Data Migration Assistant was retired July 16, 2025",
  ], 14.5), { x: 0.6, y: 3.75, w: 12.15, h: 1.5, paraSpaceAfter: 5 });
  callout(s, "Gate", 5.45, 1.05, "FaFilter", HEX.amber, "The gate: ",
    "every instance gets one verdict before authentication work starts — migrating what should have been retired is the most expensive mistake in the program.");
  sources(s, "Sources: Microsoft Learn — setspn, index usage DMVs, SQL Server migration tooling. Book 06, Chapters 03–06 and Runbook R02.");
  s.addNotes(
`[2:59–4:02]  What changes starts with the estate itself. Before touching authentication, every instance gets one of three verdicts.

Retain: it's supported or can be upgraded in place to SQL Server 2022 or later, it carries load-bearing work, and nothing argues for collapsing it. Consolidate: its workload moves into a target platform and the old instance retires. Retire: there's no live workload, so it's decommissioned instead of migrated.

The inventory has to cover the whole forest. The setspn tool needs its -F switch to search beyond a single domain. Usage, versions and dependencies are read together, and the book warns that index-usage counters reset when SQL Server restarts, so they can't prove disuse on their own. And the assessment uses the migration component in SQL Server Management Studio, because Microsoft retired the Data Migration Assistant in July 2025.

This is the gate for the whole program. Migrating an instance that should have been retired is the most expensive mistake it can make.

Workbook: Book 06, Chapters 03 to 06; Runbook R02.`);
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What changes", "Azure Arc gives each instance an Entra identity");
  tag(s, "What");
  const cols = [
    ["FaServer", "The bridge", HEX.navy, HEX.navyTint, ["SQL Server 2025: the Arc managed identity", "SQL Server 2022: an app registration and certificate", "The Azure extension for SQL Server installs when the host connects", "Entra connections are always encrypted"]],
    ["FaTriangleExclamation", "The limits", HEX.red, HEX.redTint, ["Failover cluster instances can't use Entra authentication", "Not available through Arc in US Gov Virginia — use a commercial subscription in the GCC tenant", "FIDO2 isn't supported for SQL Server on Arc", "Granting the identity's Graph permissions needs a Privileged Role Administrator"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 6.12;
    box(s, `Col ${i}`, x, 1.55, 6.0, 3.6, c[3]);
    icon(s, c[0], x + 0.25, 1.72, 0.62, c[2]);
    txt(s, `Col ${i} head`, c[1], { x: x + 1.05, y: 1.72, w: 4.7, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Col ${i} text`, bullets(c[4], 14.5), { x: x + 0.25, y: 2.5, w: 5.5, h: 2.6, paraSpaceAfter: 7 });
  });
  callout(s, "Choice", 5.4, 1.1, "FaRoute", HEX.slate, "Arc is the program's chosen path, not the only one: ",
    "Microsoft documents a manual setup for SQL Server 2022+ on Windows; Arc wins because it also carries inventory, policy, updates and Defender for the host (Book 05).");
  sources(s, "Sources: Microsoft Learn — Microsoft Entra authentication for SQL Server, SQL Server enabled by Azure Arc, Arc in Azure Government. Book 06, Chapters 09–10 and Runbook R04.");
  s.addNotes(
`[4:02–5:14]  What replaces the domain join? Azure Arc gives each instance an Entra identity.

On SQL Server 2025, that's the Arc managed identity. On SQL Server 2022, it's an app registration with a certificate. The Azure extension for SQL Server installs automatically when the host connects to Arc, and Entra connections are always encrypted.

The limits matter, and the old documents missed several. Failover cluster instances can't use Entra authentication on any version. Entra authentication through Arc isn't available in the US Government Virginia region, so a GCC tenant uses a commercial subscription in the same tenant; the old runbook's Azure Government setup would never have produced Entra logins. FIDO2 isn't supported for SQL Server on Arc. And granting the instance identity its Graph permissions needs a Privileged Role Administrator, so that step can't sit with the DBAs.

Arc is the program's chosen path, not the only one: Microsoft documents a manual setup for SQL Server 2022 and later on Windows. Arc wins because it also carries inventory, policy, updates and Defender for the host, which is Book 05.

Workbook: Book 06, Chapters 09 and 10; Runbook R04.`);
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What changes", "Logins move to Entra principals, in parallel");
  tag(s, "What");
  const rows = [["People", "Entra users, ideally through groups", "Phishing-resistant MFA, Conditional Access"], ["Groups", "Entra group logins (type X)", "Membership from HR attributes (Book 03)"], ["Applications", "Service principals and managed identities", "Not covered by Conditional Access"]];
  s.addTable([head(["Principal", "Becomes", "Note"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([2.3, 4.6, 5.25], { y: 1.55, fontSize: 15, rowH: [0.45, 0.65, 0.65, 0.65] }));
  txt(s, "Parallel", [
    { text: "The parallel run: ", options: { bold: true, color: HEX.teal } },
    { text: "create the Entra user beside the Windows user and copy roles and permissions; keep both until the audit shows no Windows sessions, then disable — never convert in one step. (ALTER USER … WITH LOGIN converts only on Azure SQL Managed Instance.)" },
  ], { x: 0.6, y: 4.05, w: 12.15, h: 1.0, fontSize: 15 });
  callout(s, "Admin", 5.3, 1.25, "FaUserShield", HEX.amber, "Watch the admin: ",
    "the instance's Entra admin becomes sysadmin, and changing it leaves the old login as sysadmin until a DBA drops it.");
  sources(s, "Sources: Microsoft Learn — Entra logins and users for SQL Server, sys.server_principals types, ALTER USER. Book 06, Chapters 11–12 and Runbook R05.");
  s.addNotes(
`[5:14–6:15]  The logins themselves move to Entra principals, in parallel.

People become Entra users, ideally granted through groups, and they get phishing-resistant MFA and Conditional Access. Groups become Entra group logins, which SQL Server records as type X, with membership driven by HR attributes from Book 03. Applications become service principals and managed identities, and the book is clear that Conditional Access doesn't cover managed identities.

The migration is a parallel run. Create the Entra user beside the Windows user and copy its roles and permissions. Keep both until the audit shows no remaining Windows sessions, then disable the old one. Never convert in one step; and the old runbook's shortcut, ALTER USER with LOGIN, only converts on Azure SQL Managed Instance, not on SQL Server.

One trap: the instance's Entra administrator becomes sysadmin, and changing that administrator leaves the old login as sysadmin until a DBA drops it.

Workbook: Book 06, Chapters 11 and 12; Runbook R05.`);
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who decides, who does the work for the data platform");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["CIO and data leadership", "Retain, consolidate, retire"], ["CISO, ISSO and AO", "NTLM and SQL-login exceptions, closure"], ["Application and data owners", "Cutover windows per application"]]],
    ["FaUsersGear", "Do", HEX.teal, HEX.tealTint, [["Data platform team", "Logins, roles, audit, parallel run"], ["Identity team", "Entra logins, groups, Graph consent"], ["Server team", "Arc onboarding and the host"]]],
    ["FaPeopleArrows", "Support", HEX.amber, HEX.amberTint, [["Developers", "Connection strings and drivers"], ["Help desk", "Sign-in issues during cutover"], ["Security operations", "Defender for SQL alerts"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, fontSize: 14.5, paraSpaceAfter: 6 });
  });
  callout(s, "Hidden", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "Hidden admins: ",
    "Azure Contributor on an Arc server is an indirect admin of SQL Server on it, and Owner or Contributor on the SQL resource can switch SQL authentication back on — scope Azure RBAC as carefully as sysadmin.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 roles; Microsoft Learn — SQL Server roles, Arc RBAC. Book 06, Chapter 13.");
  s.addNotes(
`[6:15–7:20]  Who owns it? The book's new Chapter 13 separates deciding from doing.

Deciding: the CIO and data leadership decide retain, consolidate or retire. The CISO, the ISSO and the authorizing official decide NTLM and SQL-login exceptions and sign off closure. Application and data owners decide the cutover window for each application.

Doing: the data platform team runs logins, roles, the audit and the parallel run. The identity team creates Entra logins and groups and grants the Graph consent the DBAs can't. The server team onboards hosts to Arc.

Supporting: developers change connection strings and drivers, the help desk handles sign-in issues during cutover, and security operations watches Defender for SQL alerts.

And there are hidden administrators. Azure Contributor on an Arc server is an indirect administrator of SQL Server on that host, and Owner or Contributor on the SQL resource can switch SQL authentication back on. Azure role assignments need the same care as sysadmin.

Workbook: Book 06, Chapter 13 — Who Owns the Data Platform.`);
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to do it", "Eliminate NTLM in three phases");
  tag(s, "How");
  const ph = [["A", "Discover", "The authentication audit plus Windows NTLM logging and auditing events", HEX.slate, HEX.grey], ["B", "Restrict", "Fix SPNs, convert to Kerberos or Entra, migrate the remaining patterns", HEX.amber, HEX.amberTint], ["C", "Eliminate", "The domain-wide Restrict NTLM block, on the program's 2027-04-01 backstop", HEX.red, HEX.redTint]];
  ph.forEach((p, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Ph ${i}`, x, 1.55, 3.95, 2.1, p[4]);
    txt(s, `Ph ${i} text`, [{ text: `Phase ${p[0]}`, options: { bold: true, fontSize: 13, color: HEX.slate, breakLine: true } }, { text: p[1], options: { bold: true, fontSize: 20, fontFace: "Cambria", color: p[3], breakLine: true } }, { text: p[2], options: { fontSize: 14 } }],
      { x: x + 0.25, y: 1.65, w: 3.45, h: 1.95 });
  });
  txt(s, "Facts", bullets([
    "LAN Manager level 5 refuses LM and NTLMv1 but still accepts NTLMv2 — the block is the Restrict NTLM policies",
    "Restrict NTLM exceptions are server-name lists on clients and domain controllers, not the program's exception registry",
    "Microsoft's October 2026 change blocks NTLMv1-derived single sign-on for Wi-Fi/VPN — it doesn't touch SQL Server traffic",
  ], 14.5), { x: 0.6, y: 3.85, w: 12.15, h: 1.45, paraSpaceAfter: 5 });
  callout(s, "Moved", 5.45, 1.05, "FaRightLeft", HEX.teal, "The fastest exit: ",
    "an instance whose logins have moved to Entra ID isn't affected by the block at all — migration and NTLM elimination are the same work.");
  sources(s, "Sources: Microsoft Learn — Restrict NTLM policies and auditing, LAN Manager authentication level, KB5066470. Book 06, Chapters 14–15 and Runbook R06.");
  s.addNotes(
`[7:20–8:32]  How. NTLM is eliminated in three phases.

Phase A discovers: the authentication audit, together with Windows NTLM logging and auditing events. Phase B restricts: fix SPNs, convert connections to Kerberos or Entra, and migrate the remaining patterns. Phase C eliminates: the domain-wide Restrict NTLM block, on the program's April 2027 backstop.

The details matter. LAN Manager authentication level five refuses LM and NTLM version one but still accepts version two, so it isn't an NTLM block; the block is the Restrict NTLM policies. Their exceptions are lists of server names on clients and domain controllers, not the program's exception registry. And Microsoft's October 2026 change blocks NTLM-version-one-derived single sign-on credentials for Wi-Fi and VPN; it doesn't touch SQL Server traffic.

The fastest exit is migration itself. An instance whose logins have moved to Entra ID isn't affected by the block, so login migration and NTLM elimination are the same work.

Workbook: Book 06, Chapters 14 and 15; Runbook R06.`);
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to do it", "Access by attribute, applications by driver");
  tag(s, "How");
  const cols = [
    ["FaUsersGear", "Access control", HEX.navy, HEX.navyTint, ["Dynamic groups from HR attributes grant database access", "Administrative units delegate group management", "PIM for privileged database roles (Book 04)", "Review groups, not just logins"]],
    ["FaCubes", "The application chain", HEX.teal, HEX.tealTint, ["Four classes of SQL-consuming application, each with its own path", "Connection strings name a specific Entra mode in production", "SqlClient, ODBC, OLE DB and JDBC all support Entra modes", "Managed identities on Arc get tokens from the local agent service"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 6.12;
    box(s, `Col ${i}`, x, 1.55, 6.0, 3.6, c[3]);
    icon(s, c[0], x + 0.25, 1.72, 0.62, c[2]);
    txt(s, `Col ${i} head`, c[1], { x: x + 1.05, y: 1.72, w: 4.7, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Col ${i} text`, bullets(c[4], 14.5), { x: x + 0.25, y: 2.5, w: 5.5, h: 2.6, paraSpaceAfter: 7 });
  });
  callout(s, "Last mile", 5.4, 1.1, "FaRoute", HEX.amber, "The last mile is the connection string: ",
    "every application that still says Integrated Security keeps the Windows path alive, so the application inventory is part of closure, not a follow-up.");
  sources(s, "Sources: Microsoft Learn — dynamic membership, administrative units, Microsoft.Data.SqlClient and driver authentication modes. Book 06, Chapters 16–19 and Runbooks R07–R08.");
  s.addNotes(
`[8:32–9:38]  With the logins moved, access is granted by attribute and applications move by driver.

Access control: dynamic Entra groups, driven by HR attributes, grant database access, so no DBA provisions it by hand. Administrative units delegate group management, privileged database roles go through PIM from Book 04, and reviews cover the groups, not just the logins.

The application chain: the book sorts SQL-consuming applications into four classes, each with its own migration path. Connection strings name a specific Entra authentication mode in production rather than the catch-all default. Microsoft.Data.SqlClient, ODBC, OLE DB and JDBC all support Entra modes, and the book has a driver table with the minimum versions. Managed identities on Arc hosts get their tokens from the local agent service.

The last mile is the connection string. Every application that still says Integrated Security keeps the Windows path alive, so the application inventory is part of closure, not a follow-up.

Workbook: Book 06, Chapters 16 to 19; Runbooks R07 and R08.`);
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to do it", "Closure is a posture you keep proving");
  tag(s, "How");
  txt(s, "Closure head", "THE CLOSED STATE, PROVEN CONTINUOUSLY", { x: 0.6, y: 1.55, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  txt(s, "Closure list", bullets([
    "Every in-scope instance on Entra-only authentication",
    "No SQL logins outside approved exceptions",
    "No NTLM sessions in the continuous audit (remote sessions — local ones always show NTLM)",
    "Drift — a switch back to mixed mode — detected and treated as a violation",
    "Evidence from SQL Server Audit and auth_scheme, regenerated, not assembled",
  ], 14.5), { x: 0.6, y: 1.95, w: 6.4, h: 3.3, paraSpaceAfter: 6 });
  box(s, "PKI box", 7.25, 1.55, 5.5, 3.6, HEX.amberTint);
  icon(s, "FaKey", 7.5, 1.75, 0.7, HEX.amber);
  txt(s, "PKI head", "The certificate layer", { x: 8.35, y: 1.75, w: 4.2, h: 0.7, bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "PKI list", bullets([
    "SQL Server's TLS certificates still come from AD CS in most estates",
    "Microsoft Cloud PKI issues only to Intune-managed devices — and Intune doesn't manage Windows Server",
    "So the server-certificate issuer is its own decision",
  ], 14), { x: 7.5, y: 2.55, w: 5.05, h: 2.5, paraSpaceAfter: 6 });
  callout(s, "Logs", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "What Entra logs can't prove: ",
    "every SQL resource shares one token audience, so per-instance access and the absence of NTLM have to be proven from the instance itself.");
  sources(s, "Sources: Microsoft Learn — SQL Server Audit, authentication mode, Cloud PKI, Intune supported platforms. Book 06, Chapters 20–22 and Runbooks R09–R10.");
  s.addNotes(
`[9:38–10:50]  The book's last idea is that a transformation doesn't complete; it achieves a posture, and a posture is something you keep proving.

The closed state has five conditions that hold together: every in-scope instance on Entra-only authentication; no SQL logins outside approved exceptions; no NTLM sessions in the continuous audit, counting remote sessions, because local ones always show NTLM; any drift, such as an administrator switching back to mixed mode, detected and treated as a violation; and evidence regenerated from SQL Server Audit and the auth_scheme field, not assembled into a binder.

One correction matters for assessors. Entra sign-in logs can't prove per-instance access or the absence of NTLM, because every SQL resource shares one token audience. The proof has to come from the instance itself.

And there's a certificate layer underneath. SQL Server's TLS certificates still come from Active Directory Certificate Services in most estates. Microsoft Cloud PKI issues only to Intune-managed devices, and Intune doesn't manage Windows Server, so the server-certificate issuer is its own decision.

Workbook: Book 06, Chapters 20 to 22; Runbooks R09 and R10.`);
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to do it", "What we need");
  tag(s, "How");
  const asks = [
    ["FaFilter", "Run the inventory and the gate", "A verdict for every instance before any authentication work", HEX.navy, HEX.navyTint],
    ["FaServer", "Fund the Arc bridge", "Commercial subscription in the GCC tenant; SQL Server 2022+ targets", HEX.teal, HEX.tealTint],
    ["FaUserClock", "Plan the support dates", "Upgrade or retire 2014, 2016 and 2017 instances on their real dates", HEX.amber, HEX.amberTint],
    ["FaKey", "Decide the certificate issuer", "The AD CS dependency for server TLS needs its own answer", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaBook", HEX.navy, "Read next: ",
    "Book 06 for the narrative and ten runbooks, every claim footnoted; Book 05 for Arc on servers and Book 04 for the access policy it plugs into.");
  s.addNotes(
`[10:50–11:53]  So, four asks.

Run the inventory and the gate: a retain, consolidate or retire verdict for every instance before any authentication work starts.

Fund the Arc bridge: a commercial subscription in the GCC tenant, with SQL Server 2022 or later as the target.

Plan the support dates: upgrade or retire the 2014, 2016 and 2017 instances on their real dates, because they can't use Entra authentication.

And decide the certificate issuer: the Active Directory Certificate Services dependency for server TLS needs its own answer.

The database is where legacy authentication hides longest. Bringing it into Entra ID is what lets Conditional Access, phishing-resistant authentication and continuous evidence finally reach the data.

Book 06 has the narrative and ten runbooks, with every external claim footnoted. Book 05 covers Arc on servers, and Book 04 the access policy it plugs into. Thank you.

Workbook: Book 06, index.`);
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Microsoft Learn: SQL Server authentication modes; register an SPN for Kerberos connections; sys.dm_exec_connections; sys.server_principals.",
    "Microsoft Learn: deprecated Windows features (NTLM); Restrict NTLM policies and auditing; LAN Manager authentication level; KB5066470.",
    "Microsoft Learn: SQL Server and Windows Server lifecycle and Extended Security Updates; SQL Server migration tooling; Data Migration Assistant retirement.",
    "Microsoft Learn: Microsoft Entra authentication for SQL Server; SQL Server enabled by Azure Arc; Arc in Azure Government; Entra logins and users.",
    "Microsoft Learn: Microsoft.Data.SqlClient, ODBC, OLE DB and JDBC authentication modes; SQL Server Audit; Cloud PKI; Intune supported platforms.",
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022.  ·  NIST SP 800-37 Rev. 2.",
    "Full footnotes with links and access dates: Book 06, every chapter and runbook (whalermike.github.io/modernization-workbook/docs/books/b06-data-platform/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
