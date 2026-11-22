// Companion guide — Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities.
// A narrated Why / What / Who / How deck (18 narrated slides, then a backup section).
//   Why:   the user account used as a service, and Kerberoasting.
//   What:  the twelve kinds of service identity compared; what can move to Microsoft Entra ID and what can't; the special cases.
//   Who:   the decision path and its dispositions; the program's rules; the managed service account standard (machines run
//          the steps, people decide; who does what; its settings and one-time setup); the requirements, KSIs and evidence.
//   How:   the standard's steps S1 to S11 with their controls and KSIs; Migration A (user account to gMSA, disabled and moved
//          to the holding OU), B (to a dMSA, Domain Admins only), C (to an Entra workload identity; C5's uninstall is a
//          person's); mail from a gMSA workload; dangers and rollback; where the Non-Person Identity kit and the labs take over.
// Sources: docs/books/guides/service-account-migration.md and the pages it footnotes (Microsoft Learn read November 9, 2026, the
// mail section and gMSA decisions November 11, 2026, and the managed service account standard, decisions WD-159 to WD-170,
// with its NIST, FedRAMP, CISA, SailPoint and Defender for Identity sources, November 20, 2026;
// listed with their dates in docs/books/guides/_verification/service-account-migration.md). The commands on the slides are
// the guide's, which are Learn's; long ones are continued PowerShell-style with a backtick. No new facts.
// The speaker notes are the narration (spoken by narrate.py), written to be heard: acronyms the voice misreads are spelled out,
// and every source is named by its original (Microsoft Learn), never by a workbook book number.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/guide-service-account-migration/build.js \
//                      presentations/guide-service-account-migration/Guide_Service_Account_Migration.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities",
  footer: "Federal Modernization Workbook  ·  Companion guide: Service Accounts, from user accounts to gMSAs to Microsoft Entra",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Guide_Service_Account_Migration.pptx";
const G = "Companion guide, Service Accounts";

// ------------------------------------------------------------------ code panel (as in the Non-Person Identity implementation decks)
// A light panel with monospaced text (Consolas). Lines starting with "#" are comments, in teal.
const CODE_FILL = "F1F5F9";
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 11;
  const lh = pt / 72 * 1.2;
  const top = y + 0.1 + (o.label ? 0.27 : 0);
  const h = (top - y) + lines.length * lh + 0.14;
  box(s, name, x, y, w, h, CODE_FILL, HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
  const widest = Math.max(...lines.map((l) => l.length));
  const need = widest * 0.55 * pt / 72 + 0.4;
  if (need > w + 0.01) console.warn(`  ! ${name} code may overflow its width: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
  const runs = lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1,
    color: /^\s*#/.test(l) ? HEX.teal : HEX.ink } }));
  txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
  const bottom = y + h;
  if (bottom > (o.limit || 6.6) + 0.01) console.warn(`  ! ${name} code may overflow: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars (${need.toFixed(2)} of ${w.toFixed(2)} in)`);
  return bottom;
};

// A one-line plain statement under a table or panel (navy, bold), with a fit check.
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  if (process.env.FIT) console.log(`  line ${name}: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};

const SWHY = "Why", SWHAT = "What", SWHO = "Who", SHOW = "How";
const FULL = 12.15;

// ================================================================== 1 Title
{
  const s = titleSlide(SWHY, "Service accounts: from user accounts to gMSAs and Entra ID", "A comparison and migration guide, with Microsoft Learn's own commands");
  txt(s, "Session map", [
    { text: "Why: the password nobody changes   ·   What: twelve kinds of service identity compared", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Who: the decision path, the program's rules, the managed service account standard, the evidence", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "How: the standard's steps; a user account to a gMSA, a dMSA, an Entra workload identity; mail; dangers, the kit", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: Service Accounts, from user accounts to group managed service accounts to Microsoft Entra workload identities. The guide's idea fits in one line. A service account's password is the one nobody changes, because changing it breaks something. Every step in the guide replaces a password someone has to keep with a credential that Windows, or Microsoft Entra I D, keeps instead. Every fact and command in this deck comes from the guide, which footnotes each one: Microsoft Learn, read on November ninth and eleventh, 2026, and for the managed service account standard, NIST, FedRAMP, CISA, SailPoint and Microsoft Learn, read on November twentieth. Rules that are the program's own, not Microsoft's, are called design guidance. We'll go in four parts: why this matters, what the kinds of service identity are, who decides and the standard every managed service account follows, and how each step and migration runs.`,
  `${G} — "In this guide," "How to read this guide."`);
}

// ================================================================== 2 Why
{
  const s = content(SWHY, "Why this matters: the password nobody changes");
  tag(s, "Why");
  const w = 5.95;
  const p1 = panel(s, "User", 0.6, 1.45, w, null, HEX.red, HEX.redTint, "A USER ACCOUNT USED AS A SERVICE", null, [
    "An administrator sets and rotates its password by hand, under the domain's password policy",
    "Rotation: manual, and none unless someone does it",
    "High exposure to Kerberoasting when it holds a service principal name (SPN)",
    "Learn's dMSA overview names Kerberoasting as the common issue with traditional service accounts",
  ], 13);
  const p2 = panel(s, "Find", 0.6 + w + 0.25, 1.45, w, null, HEX.navy, HEX.navyTint, "HOW LEARN SAYS TO FIND THEM", null, [
    "An SPN on a user account",
    "Delegation",
    "A password that never expires",
    "Then record every host, service, application pool and task that uses it, every SPN and every group",
  ], 13);
  callout(s, "Goal", Math.max(p1, p2) + 0.3, 1.2, "FaKey", HEX.red, "The guide's aim: ",
    "replace each password someone has to keep with a credential Windows or Microsoft Entra ID keeps, one reviewed step at a time.");
  sources(s, "Sources: Guide, comparison table and Migration A, step A1; Microsoft Learn, \"Delegated Managed Service Accounts overview\"; \"Secure user-based service accounts in Active Directory.\"");
  notes(s,
`Here's the problem. The most common service account in an older estate is an ordinary user account that a service runs as. An administrator sets its password by hand, under the domain's password policy, and it's rotated only if someone remembers to. When that account holds a service principal name, an S P N, it's highly exposed to Kerberoasting. Microsoft Learn's overview of delegated managed service accounts names Kerberoasting as the common issue with traditional service accounts. Learn's Entra guidance on securing user-based service accounts gives three ways to find them: an S P N on a user account, delegation, and a password that never expires. Once you've found one, record every host, service, application pool and scheduled task that uses it, every S P N, and every group it belongs to. That record is what the migration has to carry. So what could it become?`,
  `${G} — "The kinds of service identity compared"; Migration A, step A1; Microsoft Learn — "Delegated Managed Service Accounts overview," "Secure user-based service accounts in Active Directory."`);
}
endModule(SWHY);

// ================================================================== 3 Comparison
{
  const s = content(SWHAT, "Twelve kinds of service identity, compared");
  tag(s, "What");
  table(s, "Kinds", 1.4, [2.55, 3.5, 2.75, 1.85, 1.5], ["Kind", "Who holds the credential", "Where it runs", "Rotation", "Kerberoasting"], [
    ["User account as a service", "An administrator, by hand", "Any domain-joined server", "Manual", "High with an SPN"],
    ["Standalone MSA (sMSA)", "Windows: a 240-byte random password", "One server", "30 days by default", "Lower"],
    ["Group MSA (gMSA)", "Domain controllers, from the KDS root key; allowed hosts retrieve it", "Hosts allowed to retrieve it", "30 days by default, set at creation", "Lower; can be stolen"],
    ["Delegated MSA (dMSA)", "Windows: a secret tied to the machine, held by the domain controller", "Mapped machines on Windows Server 2025", "Periodically", "Designed against it"],
    ["Virtual account", "Windows", "One server, as the computer", "No password", "n/a"],
    ["Computer account", "Windows", "The one computer", "Windows", "n/a; can't audit"],
    ["App registration, certificate", "You: a trusted CA's certificate, in a vault", "Anywhere that reaches Entra ID", "At renewal", "None: no Kerberos"],
    ["System-assigned managed identity", "Azure", "One Azure resource", "Automatic", "None"],
    ["User-assigned managed identity", "Azure", "Resources it's assigned to; outlives them", "Automatic", "None"],
    ["Arc server's managed identity", "The Connected Machine agent: a 90-day certificate", "The Arc-enabled server", "Automatic", "None"],
    ["Federated credential", "The external issuer signs a token Entra ID trusts", "Wherever the issuer runs", "No secret", "None"],
    ["Agent identity (Agent ID)", "Its blueprint; none of its own", "Where the agent runs", "The blueprint's", "None"],
  ], { fontSize: 10.5, limit: 6.55, minRow: 0.3 });
  sources(s, "Sources: Guide, \"The kinds of service identity compared\" (Microsoft Learn: Service accounts; Manage gMSAs; dMSA overview; managed identities; Arc identity; Agent ID).");
  notes(s,
`The guide compares twelve kinds of service identity in one table; here's the short form. On premises, Microsoft Learn names the user account used as a service, the standalone managed service account, the group managed service account, and, new in Windows Server 2025, the delegated managed service account. A standalone or group account has a two-hundred-forty-byte random password that Windows changes every thirty days by default; for a G M S A, the domain controllers compute it from the K D S root key, and the hosts allowed to retrieve it hold it. A D M S A ties its secret to the machine, and Learn says it helps prevent Kerberoasting. Virtual and computer accounts act as the computer on the network, so you can't tell which service used them. In Microsoft Entra I D: an app registration with a certificate you keep in a vault; system- and user-assigned managed identities, whose credentials Azure keeps; an Azure Arc-enabled server's own managed identity; a federated credential, signed by an outside issuer; and agent identities, which take their credentials from a blueprint. None of the cloud kinds speaks Kerberos.`,
  `${G} — "The kinds of service identity compared" (table); Microsoft Learn — "Service accounts," "Manage group Managed Service Accounts," "Delegated Managed Service Accounts overview," "What are managed identities for Azure resources?," "Managed identity and access control" (Arc), "Agent identities."`);
}

// ================================================================== 4 What can move
{
  const s = content(SWHAT, "What can move to Microsoft Entra ID, and what can't");
  tag(s, "What");
  const w = 3.9, g = 0.225;
  const p1 = panel(s, "Kerb", 0.6, 1.45, w, null, HEX.red, HEX.redTint, "NOTHING IN ENTRA ID SPEAKS KERBEROS", null, [
    "A workload that uses Kerberos or NTLM to an on-premises resource keeps an AD identity until that resource changes",
    "A file share, a SQL Server login mapped to a Windows account, a Kerberos-only app",
  ], 12);
  const p2 = panel(s, "Better", 0.6 + w + g, 1.45, w, null, HEX.navy, HEX.navyTint, "A gMSA IS A BETTER PASSWORD", null, [
    "Long, random and rotated, but it still exists",
    "Every host allowed to retrieve it holds it, and it works only while AD does",
    "A dMSA binds the secret to the machine",
  ], 12);
  const p3 = panel(s, "Azure", 0.6 + 2 * (w + g), 1.45, w, null, HEX.teal, HEX.tealTint, "MANAGED IDENTITIES NEED AZURE OR ARC", null, [
    "Assigned only to an Azure resource, or used through an Arc-enabled server's agent",
    "A hybrid workload keeps its gMSA for Kerberos and gets a cloud identity for its cloud calls",
  ], 12);
  table(s, "Special", Math.max(p1, p2, p3) + 0.2, [3.0, 9.15], ["Special case", "What Microsoft Learn says"], [
    ["Failover clusters", "Don't support gMSAs; services on the Cluster service can use a gMSA or sMSA"],
    ["Entra Domain Services", "The KDS root key is pre-created; create gMSAs in a custom OU"],
    ["Cloud Sync and Connect Sync", "Cloud Sync's agent runs as a gMSA; Connect Sync recommends one with a remote SQL Server, chosen only at installation"],
    ["SQL Server and AD FS", "gMSAs for SQL Server from 2014 (2016 for clusters and availability groups); AD FS farms support a gMSA"],
  ], { fontSize: 11, limit: 6.55 });
  sources(s, "Sources: Guide, \"Three things the table makes plain,\" Migration C (\"What can't move\"), \"Special cases\"; Microsoft Learn pages footnoted there.");
  notes(s,
`Three things follow from that table. First, nothing in Microsoft Entra I D speaks Kerberos for a service. A workload that authenticates with Kerberos or N T L M to an on-premises resource, a file share, a SQL Server login mapped to a Windows account, or a Kerberos-only application, keeps an Active Directory identity until that resource changes. Second, a G M S A is a better password, not a different protocol. It's long, random and rotated, but it still exists, every host allowed to retrieve it holds it, and it works only while Active Directory does. Third, managed identities are the end state only on Azure or on an Arc-enabled server. So a hybrid workload keeps its G M S A for Kerberos and gets a cloud identity for its cloud calls. Learn also documents special cases. Failover clusters don't support G M S As, though services on the Cluster service can use one. In Entra Domain Services, the K D S root key is pre-created. Cloud Sync's agent runs as a G M S A, and Connect Sync's account can be chosen only at installation.`,
  `${G} — "Three things the table makes plain"; Migration C — "What can't move"; "Special cases Learn documents."`);
}
endModule(SWHAT);

// ================================================================== 5 Decision path
{
  const s = content(SWHO, "The decision path: 1 to 8 in order, the first yes wins");
  tag(s, "Who");
  const tb = table(s, "Path", 1.4, [0.45, 5.6, 3.95, 2.15], ["#", "Question", "Target", "Disposition"], [
    ["1", "Disabled, unused, or no owner after inventory?", "Retire, through decommission", "Retire"],
    ["2", "Runs on an Azure resource, or moving to one?", "A managed identity, user-assigned preferred", "Replatform"],
    ["3", "Runs in CI/CD or on a platform with its own OIDC issuer?", "A federated credential", "Replatform"],
    ["4", "Stays on premises but calls Graph or Azure APIs?", "Arc identity, else a certificate; if it also needs Kerberos, on to 5 to 8 too", "Replatform, plus one from 5 to 8"],
    ["5", "Already a gMSA or dMSA, staying on premises?", "Keep, with an SPN owner and an end date", "Keep"],
    ["6", "Must stay traditional: no managed account, or unconstrained delegation?", "Keep on Kerberos, with the authorizing official's acceptance", "KeepKerberos"],
    ["7", "Traditional, needs Kerberos; a 2025 DC and every host on 2025?", "A dMSA, migrated from the old account (B)", "Replatform"],
    ["8", "Needs Kerberos, any other case, an sMSA included?", "A gMSA (A); an sMSA is replaced by one", "Replatform"],
    ["9", "For a target from 5 to 8: Kerberos to a resource with no Entra equivalent?", "Also on the Kerberos island list, with its end date", "The same, on the island list"],
  ], { fontSize: 11, limit: 5.75 });
  line(s, "Learn", "Learn: a gMSA unless the service doesn't support one, then an sMSA, then a user account. No MSA or gMSA to a dMSA, and unconstrained delegation stops working after one.",
    tb + 0.12, 0.6, 13.5);
  sources(s, "Sources: Guide, \"The decision path\"; Microsoft Learn, \"Secure group managed service accounts\"; \"Delegated Managed Service Accounts overview.\"");
  notes(s,
`Now, who decides. Answer the guide's questions one to eight in order, and the first yes is the target. Each target lines up with a disposition the application owner records in the Non-Person Identity track. One: is the account disabled, unused or without an owner? Retire it. Two: does the workload run on an Azure resource, or is it moving to one? A managed identity, user-assigned preferred. Three: does it run in C I C D or on a platform with its own O I D C issuer? A federated credential. Four: does it stay on premises but call Graph or Azure A P I's? The Arc-enabled server's identity, or an app registration with a certificate. If it also needs Kerberos, it keeps going at question five, and takes two dispositions, one for each. Five: is it already a G M S A or D M S A, staying on premises? Keep it, with an S P N owner and an end date. Six: must it stay a traditional account, because the service supports no managed account or relies on unconstrained delegation? Keep it on Kerberos, with the authorizing official's acceptance. That comes before the D M S A question, because unconstrained delegation stops working once a D M S A migration completes. Seven: a traditional account that needs Kerberos, with a Windows Server 2025 domain controller and every host on 2025? A D M S A, through Migration B. Eight: any other case that needs Kerberos, a standalone account included? A G M S A, through Migration A. Then question nine, for every target from five to eight: does it need Kerberos to a resource with no Entra equivalent? Then it also goes on the Kerberos island list. This lines up with Microsoft Learn: use a G M S A unless the service doesn't support one, then a standalone account, then a user account; and you can't migrate a standalone account or a G M S A to a D M S A.`,
  `${G} — "The decision path"; Microsoft Learn — "Secure group managed service accounts," "Delegated Managed Service Accounts overview."`);
}

// ================================================================== 6 Rules
{
  const s = content(SWHO, "The program's rules for every migration");
  tag(s, "Who");
  const w = 3.9, g = 0.225;
  const row1 = Math.max(
    panel(s, "Owners", 0.6, 1.45, w, 1.5, HEX.teal, HEX.tealTint, "TWO OWNERS AND A SPONSOR", null, [
      "Two named technical owners, and a sponsor who is a federal employee mastered in HR",
    ], 12),
    panel(s, "Decided", 0.6 + w + g, 1.45, w, 1.5, HEX.navy, HEX.navyTint, "A REVIEWED DISPOSITION FIRST", null, [
      "No account moves without the application owner's recorded disposition",
    ], 12),
    panel(s, "Parallel", 0.6 + 2 * (w + g), 1.45, w, 1.5, HEX.amber, HEX.amberTint, "30 DAYS, THEN DISABLE", null, [
      "Disable the old account no sooner than 30 days after the switch; never delete during the migration",
    ], 12));
  panel(s, "Secrets", 0.6, row1 + 0.2, w, 1.5, HEX.red, HEX.redTint, "NO CLIENT SECRETS", null, [
    "A managed identity, then a federated credential, then a certificate; Learn says don't use password credentials",
  ], 12);
  panel(s, "Priv", 0.6 + w + g, row1 + 0.2, w, 1.5, HEX.red, HEX.redTint, "NO PRIVILEGED GROUPS", null, [
    "Learn: service accounts shouldn't be in privileged groups, and each service gets its own account",
  ], 12);
  const row2 = panel(s, "Reviewed", 0.6 + 2 * (w + g), row1 + 0.2, w, 1.5, HEX.navy, HEX.navyTint, "CHANGES ARE REVIEWED", null, [
    "Each production write is a plan approved by its SHA-256; by hand only in a test domain, or for an approved request under its change record",
  ], 12);
  callout(s, "Strict", row2 + 0.25, 0.95, "FaScaleBalanced", HEX.navy, "Where Learn's pages differ: ",
    "one ends a move to a gMSA by deleting the old account; another says never delete the original. The program deletes later only an account a gMSA replaced.");
  sources(s, "Sources: Guide, \"The program's rules for every migration\" (design guidance); Microsoft Learn, \"Securing on-premises service accounts\"; \"Setting up delegated MSAs.\"");
  notes(s,
`These are the program's rules, design guidance, and they apply to a hand migration too. Every identity has two named technical owners and a sponsor who is a federal employee mastered in H R; a contractor can build or run a workload but can't be its only sponsor. No account moves without its reviewed disposition. The old account runs in parallel, and it's disabled no sooner than thirty days after the switch. An account a G M S A replaced is deleted only later, ninety days after the disable with no sign-in, through the decommission process. An account a D M S A superseded is never deleted: it stays disabled for as long as its D M S A exists. No client secrets: a cloud identity is a managed identity, a federated credential or a certificate, in that order, and Microsoft Learn says not to use password credentials. No privileged groups: Learn says service accounts shouldn't be members of them, and each service should have its own account. And changes are reviewed: in production, each write is a plan approved by its hash, and a hand run happens only in a test domain, or for a request SailPoint approved, under its ServiceNow change record. SailPoint approves; ServiceNow records the change and never approves it. One place where Learn's own pages differ. Learn's Entra page on group managed service accounts ends its move by deleting the old account, while its page on setting up delegated accounts says never to delete the original. The program never deletes during the migration, deletes later only an account a G M S A replaced, and keeps the delegated page's rule for an account a D M S A superseded.`,
  `${G} — "The program's rules for every migration"; Microsoft Learn — "Securing on-premises service accounts," "Secure group managed service accounts," "Setting up delegated Managed Service Accounts," "Security best practices for application properties."`);
}

// ================================================================== 7 The standard: machines run the steps
{
  const s = content(SWHO, "The standard: machines run the steps; people decide");
  tag(s, "Who");
  const w = 3.9, g = 0.225;
  const row1 = Math.max(
    panel(s, "Machines", 0.6, 1.45, w, null, HEX.teal, HEX.tealTint, "WHAT MACHINES RUN", null, [
      "The request's checks, the plan and the Active Directory writes",
      "The re-read that closes the ticket",
      "The monitoring, the certification campaigns and the evidence",
    ], 12),
    panel(s, "People", 0.6 + w + g, 1.45, w, null, HEX.navy, HEX.navyTint, "WHAT PEOPLE DO", null, [
      "Decide, and approve in SailPoint",
      "Accept risk",
      "Run the few steps that need Domain Admins or that delete something (WD-170)",
    ], 12),
    panel(s, "Why", 0.6 + 2 * (w + g), 1.45, w, null, HEX.amber, HEX.amberTint, "WHY IT LINES UP", null, [
      "NIST SP 800-53: AC-2(1), AC-2(3), AC-2(4), all Moderate",
      "FedRAMP: KSI-IAM-AAM, KSI-SVC-ASM",
      "CISA ZTMM: automation and orchestration, cross-cutting",
      "A record a person can't leave: plan SHA-256, call, re-read, hashed evidence",
    ], 12));
  const p4 = panel(s, "Limits", 0.6, row1 + 0.12, FULL, null, HEX.red, HEX.redTint, "THE LIMITS THE STANDARD KEEPS", null, [
    "Approvals still come from the people AC-2 names; separation of duties (AC-5) keeps the approver, the pipeline's owner and the person who deletes apart",
    "The authorizing official accepts the pipeline as an autonomous class; the pipeline's own identity is a governed non-person identity with the narrowest rights",
  ], 12);
  callout(s, "Supported", p4 + 0.12, 0.6, "FaScaleBalanced", HEX.navy, "Supported, not met: ",
    "automation supports a requirement; the assessor decides.");
  sources(s, "Sources: Guide, \"The managed service account standard\" (WD-159 to WD-170, design guidance); NIST SP 800-53 Rev. 5; FedRAMP KSIs; CISA Zero Trust Maturity Model v2.0.");
  notes(s,
`The guide now carries a standard that every managed service account follows, from request to retirement, with the same evidence each time. It's the program's process, design guidance, and its rule fits in one line: machines run the steps; people decide. Every step a script can run, it runs: the request's checks, the plan, the Active Directory writes, the re-read that closes the ticket, the monitoring, the certifications and the evidence. People decide, approve in SailPoint, accept risk, and run the few steps that need Domain Admins or that delete something. Why? NIST special publication eight hundred fifty-three has enhancements written for it, automated account management, disabling accounts and automated audit, all in the Moderate baseline. FedRAMP's indicators name automating account management and secret management. CISA's Zero Trust Maturity Model makes automation and orchestration a cross-cutting capability. And a script leaves a record a person can't: the approved plan's hash, the exact call, the re-read and a hashed evidence file. The standard keeps automation's limits: approvals still come from people, separation of duties keeps the approver, the pipeline's owner and the person who deletes apart, and the pipeline's own identity gets the narrowest rights. Automation supports a requirement; the assessor decides.`,
  `${G} — "The managed service account standard," "Machines run the steps; people decide"; decision register — WD-159 to WD-170; NIST SP 800-53 Rev. 5 (AC-2(1), AC-2(3), AC-2(4), AC-5); FedRAMP Key Security Indicators (KSI-IAM-AAM, KSI-SVC-ASM); CISA Zero Trust Maturity Model v2.0.`);
}

// ================================================================== 8 Who does what in the standard
{
  const s = content(SWHO, "Who does what in the managed service account standard");
  tag(s, "Who");
  const tb = table(s, "Roles", 1.4, [3.0, 6.2, 2.95], ["System", "Its job in the standard", "Never"], [
    ["The agency's system access management tool", "The request front end: an owner asks for, changes or retires a managed service account; it hands the request to SailPoint", "Approves or writes anything itself"],
    ["SailPoint", "Approves every request, whatever its risk tier (WD-162); aggregates gMSAs from AD and service principals from Entra ID; correlates owners; runs certifications", "Writes a gMSA in Active Directory (WD-163)"],
    ["ServiceNow", "The change record for each write; typed findings (drift, a revoke, an orphan); the decommission ticket; closes a task only on a re-read", "Approves the account"],
    ["The pipeline, as gmsa-msapipe", "Runs the approved Chapter 06 plan: creates the gMSA, sets its retriever group, disables and moves a superseded account", "Runs a dMSA step, an uninstall or a delete"],
    ["AD PowerShell, Group Policy, Defender for Identity, Entra", "The Microsoft tools that create, restrict, watch and, for a workload that moves, replace the account", "—"],
    ["A person", "Approves in SailPoint; runs the dMSA steps (Domain Admins), Uninstall-ADServiceAccount on the hosts and every delete; accepts risk", "Clicks through a portal to do what the pipeline does"],
  ], { fontSize: 11, limit: 5.45 });
  panel(s, "Pipe", 0.6, tb + 0.2, FULL, null, HEX.navy, HEX.navyTint, "THE PIPELINE'S OWN IDENTITY, gmsa-msapipe: A gMSA IN THE SERVICE-ACCOUNT OU", null, [
    "Only the rights the plan's calls need: membership of DL-gMSA-Creators, write of msDS-GroupMSAMembership on the accounts it creates, and disable and move into the holding OU",
    "Two named owners and a sponsor, like every other non-person identity, and its own certification",
  ], 11.5);
  sources(s, "Sources: Guide, \"Who does what\" (design guidance; WD-162, WD-163); Ticket-to-Machine guide; Non-Person Identity developer workbook, Chapter 06.");
  notes(s,
`Who does what. An owner asks for, changes or retires an account in the agency's system access management tool, which hands the request to SailPoint and never approves or writes anything itself. SailPoint approves every request, whatever its risk tier, aggregates the accounts from Active Directory and Entra I D, correlates their owners, and runs the certifications. It never writes a G M S A. ServiceNow holds the change record, the typed findings and the decommission ticket, and closes a task only on a re-read. The pipeline runs the approved plan: it creates the G M S A, sets its retriever group, and disables and moves a superseded account. It never runs a D M S A step, an uninstall or a delete. Those are a person's: a Domain Admin runs the D M S A steps, and a person uninstalls and deletes. No person clicks through a portal to do what the pipeline does. The pipeline's own identity, G M S A dash M S A pipe, is itself a G M S A, with only the rights its calls need: membership of the creator group, D L G M S A Creators, write of the retriever attribute on the accounts it creates, and disable and move into the holding organizational unit. It has two owners, a sponsor and its own certification.`,
  `${G} — "Who does what" (table and the pipeline's identity); decision register — WD-162, WD-163; Ticket-to-Machine guide; Developer workbook, Building Non-Person Identity — Chapter 06.`);
}

// ================================================================== 9 Settings and setup
{
  const s = content(SWHO, "The standard's settings, and the one-time setup");
  tag(s, "Who");
  const tb = table(s, "Settings", 1.4, [2.35, 6.4, 3.4], ["Setting", "The standard", "Source"], [
    ["Name", "gmsa-<app> or dmsa-<app>; a role suffix only where one system needs two; 15 characters or fewer before the $; unique in the forest", "Forest-unique: Learn; the rest WD-159"],
    ["Where it lives", "<service-account-ou>, a dedicated OU, created with New-ADServiceAccount -Path", "WD-161; the cmdlet takes any OU"],
    ["Who may create it", "DL-gMSA-Creators, delegated the create right on that OU; gmsa-msapipe its only member", "Learn names the right; WD-154, WD-159"],
    ["Who may retrieve it", "Always one domain local group, DL-gMSA-<app>-Hosts, of the workload's hosts", "Learn: a group of hosts; WD-160"],
    ["Encryption, interval", "AES256 only; 30 days, stated at creation", "Learn"],
    ["No SPN", "Outbound-only unless a recorded reason", "WD-154"],
    ["Owners, groups", "Two technical owners and a federal-employee sponsor; no privileged group", "WD-164; Learn; NPI-KRB-08"],
    ["Attestation", "SailPoint certification by both owners: quarterly R1, twice a year R2, annually R3", "WD-166"],
    ["End date, if kept", "Accepted by the authorizing official, recorded by D08, never later than G5 or the island's end of life", "WD-165"],
    ["Disabled before delete", "90 days, with no sign-in seen", "WD-167; Defender for Identity uses 90 too"],
  ], { fontSize: 10, minRow: 0.28 });
  code(s, "Setup", 0.6, tb + 0.12, FULL, [
    "# Once: one KDS root key (A2); <service-account-ou> and <holding-ou>; then, as a Domain Admin, the creator group and its right",
    "New-ADGroup -Name \"DL-gMSA-Creators\" -SamAccountName \"DL-gMSA-Creators\" -GroupScope DomainLocal -Path \"<groups-ou>\"",
    "dsacls \"<service-account-ou>\" /G \"<DOMAIN>\\DL-gMSA-Creators:CC;msDS-GroupManagedServiceAccount\"",
    "dsacls \"<service-account-ou>\" | Select-String \"DL-gMSA-Creators\"   # expected: Allow, CREATE CHILD for the gMSA class",
  ], { pt: 10 });
  sources(s, "Sources: Guide, \"The standard's settings,\" \"Set it up once\" (WD-154, WD-159 to WD-167); Microsoft Learn, Manage gMSAs; New-ADServiceAccount; dsacls; Defender for Identity.");
  notes(s,
`The settings. A G M S A is named G M S A dash and the system's short name, fifteen characters or fewer and unique in the forest. It lives in a dedicated service-account organizational unit. Learn's Entra page says G M S As belong in the Managed Service Accounts container, but the cmdlet takes any O U, and the program's own O U keeps the create right, Group Policy and SailPoint's scope on service accounts alone. Only the creator group may create one, and the pipeline is its only member. One domain local group of the workload's hosts retrieves its password. A E S two-fifty-six only; thirty days, stated at creation; outbound-only with no S P N. Two owners and a federal-employee sponsor, no privileged group, and a SailPoint certification on the risk tier's cadence. A disabled account waits ninety days, with no sign-in seen, before it's deleted; Defender for Identity's stale-account assessment uses ninety days too. Setup happens once: the K D S root key, the two O Us, then a Domain Admin creates the creator group and delegates the create right with D S A C L S. Learn gives no delegation command, so run it in the test domain first and confirm it. Then the pipeline's own G M S A, SailPoint's Active Directory source scoped to the O U, and Defender for Identity.`,
  `${G} — "The standard's settings," "Set it up once"; decision register — WD-154, WD-159 to WD-167; Microsoft Learn — "Manage group Managed Service Accounts," "Secure group managed service accounts," "New-ADServiceAccount," "dsacls," "Investigate and protect service accounts," "Security posture assessments for accounts"; SailPoint — "Active Directory Connector: Introduction."`);
}

// ================================================================== 10 Requirements and KSIs
{
  const s = content(SWHO, "Requirements, KSIs and the evidence the ISSO keeps");
  tag(s, "Who");
  const tb = table(s, "Evidence", 1.4, [2.15, 3.55, 2.65, 3.8], ["Step", "Requirement it supports", "KSI it aligns to", "Evidence the ISSO keeps"], [
    ["Inventory (A1)", "AC-2 Account Management; CM-8 System Component Inventory", "KSI-IAM-SNU; KSI-PIY-GIV", "The register with two owners and a sponsor"],
    ["KDS root key (A2)", "IA-5 Authenticator Management", "KSI-IAM-SNU", "Event 4004 and the key's start time"],
    ["Create (A3, B1)", "AC-6 Least Privilege; IA-5; CM-3 Configuration Change Control", "KSI-IAM-ELP; KSI-IAM-SNU; KSI-CMT-LMC", "The approved plan; Get-ADServiceAccount output"],
    ["Install, switch (A4, A5)", "AC-6; AC-6(5) Privileged Accounts; IA-5", "KSI-IAM-ELP; KSI-IAM-SNU; KSI-IAM-JIT", "Test-ADServiceAccount per host; setspn -L; qmanagedaccount"],
    ["Parallel run (A6, B3)", "AC-2(3) Disable Accounts; IA-5", "KSI-IAM-AAM; KSI-IAM-SNU", "The host change date; the disable or complete in the manifest"],
    ["Cloud identity (C1 to C4)", "IA-9 Service Identification and Authentication (tailored in); IA-5; AC-6", "None for IA-9; KSI-IAM-SNU; KSI-IAM-ELP", "Plans and manifests; grants and role assignments; sign-in logs"],
    ["Island", "CM-8; AC-2", "KSI-PIY-GIV; KSI-IAM-SNU", "The island list, each account with an end date"],
  ], { fontSize: 10.5, limit: 5.85 });
  line(s, "KSI", "NIST SP 800-53 Rev. 5 Moderate, with IA-9 tailored in. KSIs are FedRAMP 20x indicators for providers; which evidence supports which is the program's mapping.",
    tb + 0.12, 0.6, 13.5);
  sources(s, "Sources: Guide, \"Federal requirements and evidence\" (the Non-Person Identity guide's Evidence table; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs). Mapping: design guidance.");
  notes(s,
`Every step carries its federal requirement, the indicator it aligns to, and the evidence the I S S O keeps. The inventory supports A C two, account management, and C M eight, the component inventory. The K D S root key supports I A five, authenticator management, with event forty-oh-four and the key's start time as evidence. Creating the account supports A C six, least privilege, I A five, and C M three, configuration change control: the evidence is the approved plan and the read-back. Installing and switching supports least privilege and privileged accounts: Test-A D Service Account on each host, the S P N listing, and the service's managed-account check. The parallel run supports disabling accounts. The cloud identities support I A nine, service identification and authentication, which sits in no baseline and is tailored in. The controls are from the NIST special publication eight hundred fifty-three, revision five, Moderate baseline. K S I's are fed-ramp twenty X indicators for cloud service providers; which evidence supports which indicator is the program's mapping, design guidance.`,
  `${G} — "Federal requirements and evidence" (table and note); Non-Person Identity implementation guide — "Evidence."`);
}
endModule(SWHO);

// ================================================================== 11 The standard's steps
{
  const s = content(SHOW, "The standard step by step, from request to retirement");
  tag(s, "How");
  table(s, "Steps", 1.4, [1.55, 5.0, 1.75, 1.8, 2.05], ["Step", "What happens", "Runs it", "Supports", "KSIs (KSI-)"], [
    ["S1 Request", "The owner asks; once SailPoint approves, Chapter 12 checks every field before anything is created", "Owner; Ch. 12", "AC-2; IA-4; CM-8", "IAM-SNU; IAM-ELP, IAM-JIT; PIY-GIV"],
    ["S2 Decide", "The decision path gives the target; Chapter 03 records it", "App owner", "AC-2; IA-5", "IAM-SNU; IAM-SNU, IAM-APM"],
    ["S3 Approve", "SailPoint approves; ServiceNow opens the change record, and never approves", "SailPoint approvers", "AC-2; CM-3; AC-5", "IAM-SNU; CMT-LMC; IAM-JIT"],
    ["S4 Create", "The approved plan: in its OU, AES256, 30 days, outbound-only with no SPN, one retriever group", "The pipeline", "AC-6; IA-5; CM-3; AC-2(1)", "IAM-ELP, IAM-JIT; IAM-SNU, IAM-APM; CMT-LMC"],
    ["S5 Install", "Install- and Test-ADServiceAccount per host; Log on as a service limited; no privileged group", "Hosts; Group Policy", "AC-6; AC-6(5); CM-6", "IAM-ELP; IAM-JIT, IAM-SNU; CMT-LMC"],
    ["S6 Close", "SailPoint aggregates and correlates owners; the task closes only on Chapter 12's re-read", "SailPoint; Ch. 12", "CM-8; AC-2", "PIY-GIV; IAM-SNU"],
    ["S7 Watch", "Defender for Identity; VK-NPI-06; Chapter 06's checks; an unrequested gMSA is drift", "Scheduled runs", "CA-7; SI-4; AU-6; AC-2(4)", "MLA-EVC; IAM-SUS, MLA-RVL; MLA-RVL; MLA-LET"],
    ["S8 Attest", "Both owners certify on the tier's cadence; a revoke opens a ServiceNow task", "SailPoint; owners", "AC-2; AC-6(7)", "IAM-SNU; IAM-AAM, IAM-JIT"],
    ["S9 Orphans", "An HR event starts a transfer; an orphan is disabled, then has 30 days to be claimed", "HR workflow; SailPoint", "AC-2; AC-2(3)", "IAM-SNU; IAM-AAM"],
    ["S10 Retire", "Pipeline disables and moves to the holding OU; 90 days, no sign-in; a person deletes. A dMSA's original: never deleted", "Pipeline, then a person", "AC-2; AC-2(3); CM-8", "IAM-SNU; IAM-AAM, IAM-JIT, IAM-SUS; PIY-GIV"],
    ["S11 To Entra", "When the workload moves: Migration C", "Chapter 05", "IA-9 (tailored); IA-5; AC-6", "None for IA-9; IAM-SNU, IAM-APM; IAM-ELP"],
  ], { fontSize: 10, minRow: 0.27, limit: 6.55 });
  sources(s, "Sources: Guide, \"The steps\" (design guidance; WD-169); NIST SP 800-53 Rev. 5; FedRAMP KSIs; Developer workbook, Building Non-Person Identity, Chapters 03, 05, 06, 12.");
  notes(s,
`Now the standard step by step, each with who runs it, the control it supports and its indicators. S1: the owner asks. Once SailPoint approves, the developer workbook's Chapter 12 checks every field of the approved request against the standard, before anything is created. S2: the decision path gives the target. S3: SailPoint approves, and ServiceNow opens the change record; ServiceNow records the change and never approves it. S4: the pipeline runs the approved plan and creates the G M S A to the standard; that supports automated account management. S5: each host installs and tests it, and Group Policy limits log on as a service. S6: SailPoint aggregates it, and the ticket closes only on a re-read. S7: scheduled runs watch it with Defender for Identity; a G M S A nobody asked for is drift. S8: the two owners certify it. S9: an owner's departure starts a transfer; an orphan is disabled, then has thirty days to be claimed. S10: after the parallel run the pipeline disables the old account and moves it to the holding O U; after ninety days with no sign-in, a person uninstalls and deletes it. An account a D M S A superseded is the exception: it stays disabled, and it's never deleted. S11: when the workload moves, Migration C. Two things aren't verified yet: ServiceNow's Active Directory spoke, so ServiceNow records and the plan writes, and SailPoint's export field names.`,
  `${G} — "The steps," "What isn't verified yet"; decision register — WD-169; Developer workbook, Building Non-Person Identity — Chapters 03, 05, 06 and 12.`);
}

// ================================================================== 12 Migration A, A1 to A4
{
  const s = content(SHOW, "Migration A: a user account to a gMSA, steps A1 to A4");
  tag(s, "How");
  const c = code(s, "A1to4", 0.6, 1.4, FULL, [
    "# A1  Read the account, then each host's service (expected: SERVICE_START_NAME is <DOMAIN>\\<old-account>)",
    "Get-ADUser -Identity <old-account> -Properties ServicePrincipalName, PasswordNeverExpires, PasswordLastSet, MemberOf, `",
    "    msDS-AllowedToDelegateTo, TrustedForDelegation, TrustedToAuthForDelegation",
    "sc.exe qc <service>",
    "# A2  One KDS root key for the forest; if none, a Domain or Enterprise Admin creates it once, then waits 10 hours",
    "Get-KdsRootKey",
    "Add-KdsRootKey -EffectiveImmediately",
    "# A3  The hosts' group, then the gMSA with AES256 (expected: msDS-GroupManagedServiceAccount, the group, AES256, 30)",
    "New-ADGroup -Name \"<hosts-group>\" -SamAccountName \"<hosts-group>\" -GroupScope DomainLocal",
    "Add-ADGroupMember -Identity \"<hosts-group>\" -Members \"<host>$\"",
    "New-ADServiceAccount -Name <gmsa-name> -DNSHostName <gmsa-name>.<domain-fqdn> `",
    "    -PrincipalsAllowedToRetrieveManagedPassword <hosts-group> -KerberosEncryptionType AES256",
    "#     No SPN: add -RestrictToOutboundAuthenticationOnly, the program's default (WD-154; record it in kerberos-replatform.csv)",
    "# A4  After the host restarts, on each host, elevated (expected: True on every host)",
    "Install-ADServiceAccount -Identity <gmsa-name>",
    "Test-ADServiceAccount -Identity <gmsa-name>",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN (PLACEHOLDERS IN ANGLE BRACKETS; LONG LINES CONTINUED WITH `)", pt: 10 });
  const w = 5.95;
  const p1 = panel(s, "Before", 0.6, c + 0.15, w, null, HEX.navy, HEX.navyTint, "BEFORE YOU CREATE IT", null, [
    "gmsa-<app>: forest-unique, 15 characters at most, in its OU; 30 days set only now",
    "Created by DL-gMSA-Creators, only gmsa-msapipe (WD-163)",
    "Retrievers: DL-gMSA-<app>-Hosts, the blast radius",
  ], 11.5);
  const p2 = panel(s, "Key", 0.6 + w + 0.25, c + 0.15, w, null, HEX.red, HEX.redTint, "THE KDS ROOT KEY", null, [
    "Never the 10-hour backdated key in production; more than one key makes gMSAs fail after a rotation",
    "False from Test-ADServiceAccount: fix the host before the switch",
  ], 11.5);
  if (process.env.FIT) console.log(`  A panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, Migration A, A1 to A4 (WD-154, WD-163); Microsoft Learn, Manage gMSAs; Create a KDS root key; gMSAs for Windows containers; gMSA overview; SQL Server gMSAs.");
  notes(s,
`Migration A moves a user account to a G M S A, in Microsoft Learn's order: K D S root key, create, install, switch, validate, retire. A1: read the account with Get-A D User, its S P Ns, delegation and groups, and on each host read the service's logon account with S C query config. A2: the forest needs one K D S root key. If there's none, a Domain Admin or Enterprise Admin creates it once, and Learn's K D S page says domain controllers wait up to ten hours before they allow a G M S A, so the key replicates first. Learn offers a key backdated ten hours for a test domain with one domain controller; never use it in production. And Learn's containers page says more than one key makes G M S As fail after a password rotation. A3: create a group of the hosts, then the G M S A with A E S two-fifty-six, which Learn's overview says to always configure. Its name must be unique in the forest, and its password interval can be set only now; the standard sets the name, the O U and the one retriever group. For a workload that holds no S P N, the program's default is Learn's outbound-only variant; record that choice. And the program creates G M S As under a delegated create right, which Learn allows, not as a Domain Admin: the creator group holds it, and the pipeline is its only member. A4: after a restart, install it on each host and test it. Test-A D Service Account must return true on every host before you switch.`,
  `${G} — Migration A, steps A1–A4; "The standard's settings"; decision register — WD-154, WD-159, WD-160, WD-163; Microsoft Learn — "Manage group Managed Service Accounts," "Create a Key Distribution Service (KDS) root key," "Create gMSAs for Windows containers," "Group Managed Service Accounts overview," "Troubleshoot SQL Server setup, startup, and authentication failures with gMSAs."`);
}

// ================================================================== 9 Migration A, A5 to A7
{
  const s = content(SHOW, "Migration A: switch, move the SPNs, run 30 days, disable");
  tag(s, "How");
  const c = code(s, "A5to7", 0.6, 1.4, FULL, [
    "# A5  In one change window: move each SPN to the gMSA (expected: setspn -L lists <spn> on the gMSA)",
    "Set-ADUser -Identity <old-account> -ServicePrincipalNames @{Remove='<spn>'}",
    "Set-ADServiceAccount -Identity <gmsa-name> -ServicePrincipalNames @{Add='<spn>'}",
    "setspn -L <DOMAIN>\\<gmsa-name>$",
    "# A5  Then the workload: a blank password, which Windows fills in (expected: qmanagedaccount reports TRUE)",
    "sc.exe config <service> obj= \"<DOMAIN>\\<gmsa-name>$\" password= \"\"",
    "sc.exe qmanagedaccount <service>",
    "Restart-Service -Name <service>",
    "# A7  After a clean 30-day parallel run (A6): disable and move to the holding OU, don't delete (the pipeline, WD-168)",
    "Disable-ADAccount -Identity <old-account>",
    "Move-ADObject -Identity <old-account-dn> -TargetPath \"<holding-ou>\"",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const w = 3.9, g = 0.225;
  const p1 = panel(s, "Other", 0.6, c + 0.15, w, null, HEX.navy, HEX.navyTint, "TASKS AND APPLICATION POOLS", null, [
    "A scheduled task: New-ScheduledTaskPrincipal with -LogonType Password, then Set-ScheduledTask",
    "An IIS application pool: identityType 3, the gMSA and a blank password",
  ], 11.5);
  const p2 = panel(s, "Run", 0.6 + w + g, c + 0.15, w, null, HEX.amber, HEX.amberTint, "A6: THE 30-DAY PARALLEL RUN", null, [
    "Test end to end; keep the old account enabled",
    "Its logons on the domain controllers should stop; the gMSA's carry the work",
    "Grant the gMSA only the rights the service needs",
  ], 11.5);
  const p3 = panel(s, "Back", 0.6 + 2 * (w + g), c + 0.15, w, null, HEX.red, HEX.redTint, "ROLLBACK (A)", null, [
    "Switch the workload back with the old password from the vault",
    "Move the SPNs back with the same two commands reversed; leave the gMSA",
    "After A7: Enable-ADAccount first",
  ], 11.5);
  if (process.env.FIT) console.log(`  A2 panels bottom ${Math.max(p1, p2, p3).toFixed(2)}`);
  sources(s, "Sources: Guide, Migration A, A5 to A7, Rollback (A) (WD-167, WD-168); Microsoft Learn, Set-ADServiceAccount; Set-ADUser; sc.exe config; Move-ADObject; IIS snap-in.");
  notes(s,
`A5 happens in one change window, because an S P N left on the old account while the service runs as the G M S A breaks Kerberos to the service. Each S P N must have exactly one owner. Remove it from the old account, add it to the G M S A, and list it with set S P N. Then change the workload's identity. A G M S A logs on with a blank password, which Windows fills in, as Learn's Entra page says. For a Windows service, S C config sets the account, and the managed-account query must report true. A scheduled task gets a new principal with the password logon type, as Learn's assessment pages do it, and an I I S application pool gets identity type three with the blank password. The guide notes that Learn has no single page showing that last one end to end, so verify it. A6 is the thirty-day parallel run: test end to end, keep the old account enabled, and watch its logons stop. A7 disables the old account and moves it to the holding organizational unit; Chapter 6 plans both as one step, and the pipeline runs it. Deletion comes only after ninety days disabled with no sign-in seen, through the decommission process. To roll back, switch the workload back with the old password from the vault, and move the S P Ns back.`,
  `${G} — Migration A, steps A5–A7, "Rollback (A)," "What couldn't be verified"; decision register — WD-167, WD-168; Microsoft Learn — "Move-ADObject," "Set-ADServiceAccount," "Set-ADUser," "sc.exe config," "Secure group managed service accounts," "PowerShell snap-in: making simple configuration changes," "Modify and remove assessment tasks."`);
}

// ================================================================== 10 Migration B
{
  const s = content(SHOW, "Migration B: a user account to a Windows Server 2025 dMSA");
  tag(s, "How");
  const c = code(s, "B", 0.6, 1.4, FULL, [
    "# B1  Create the dMSA with AES256 (for a migration, skip Learn's msDS-DelegatedMSAState step)",
    "New-ADServiceAccount -Name <dmsa-name> -DNSHostName <dmsa-name>.<domain-fqdn> -CreateDelegatedServiceAccount -KerberosEncryptionType AES256",
    "# B2  Start, then on each host the registry value and a restart of that service only (expected: msDS-DelegatedMSAState 1)",
    "Start-ADServiceAccountMigration -Identity <dmsa-name> -SupersededAccount \"<old-account-dn>\"",
    "New-ItemProperty -Path \"HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\Kerberos\\Parameters\" `",
    "    -Name \"DelegatedMSAEnabled\" -Value \"1\" -PropertyType \"DWORD\" -Force",
    "Restart-Service -Name <service>",
    "# B3  After the 30-day parallel run (expected: old account Enabled False, no SPNs; the dMSA holds them, state 2)",
    "Complete-ADServiceAccountMigration -Identity <dmsa-name> -SupersededAccount \"<old-account-dn>\"",
    "# Rollback (B): Undo-ADServiceAccountMigration, or Reset-ADServiceAccountMigration, with the same two parameters",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const w = 5.95;
  const p1 = panel(s, "Limits", 0.6, c + 0.15, w, null, HEX.red, HEX.redTint, "LEARN'S LIMITS, CHECKED FIRST", null, [
    "A Windows Server 2025 domain controller, and every machine that uses the account updated for dMSA",
    "No MSA or gMSA to a dMSA; unconstrained delegation stops working",
    "Domain Admins only (stricter than Learn; BadSuccessor), and the August 2025 update on every 2025 DC",
  ], 11.5);
  const p2 = panel(s, "Wait", 0.6 + w + 0.25, c + 0.15, w, null, HEX.amber, HEX.amberTint, "WAIT, THEN COMPLETE; NEVER DELETE", null, [
    "Learn: at least two ticket lifetimes (14 days), four (28 days) recommended; the program's 30 days is its own choice",
    "Never delete the original: Learn warns it causes issues if you need to revert",
  ], 11.5);
  if (process.env.FIT) console.log(`  B panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, Migration B, B1 to B3, Rollback (B); Microsoft Learn, \"Delegated Managed Service Accounts overview\"; \"Setting up delegated Managed Service Accounts.\"");
  notes(s,
`Migration B moves the same kind of account to a delegated managed service account, on Windows Server 2025. A D M S A supersedes the old account: once the migration completes, the old password can't be used, its S P Ns, delegation and authentication policy move to the D M S A, and the old account is disabled. Check Microsoft Learn's limits first. At least one Windows Server 2025 domain controller, and every machine that uses the account updated to support D M S As; one that isn't fails once the old account is disabled. You can't migrate an M S A or a G M S A to a D M S A, and unconstrained delegation stops working. Learn's minimum to create one is Domain Admins, Enterprise Admins or equivalent rights. After the attack called BadSuccessor, where anyone who could create a D M S A could take over another account, the program is stricter: Domain Admins only, and the August 2025 update on every Windows Server 2025 domain controller. B1 creates the D M S A. Learn's set-up page then sets a state attribute with a parameter the cmdlet doesn't have; for a migration, skip it, because starting the migration sets the state. B2 starts the migration, and on each host sets Learn's registry value and restarts the one service. B3: Learn says to wait at least two ticket lifetimes, equivalent to fourteen days, and recommends four, twenty-eight days. Delay if domain controllers are partitioned or replication is broken, and watch sites where replication takes longer than the ten-hour ticket renewal. The program waits thirty days: that's its own choice, longer than Learn's twenty-eight. Then complete it, and never delete the original account.`,
  `${G} — Migration B, "Who may create a dMSA," steps B1–B3, "Rollback (B)"; decision register — WD-154; Microsoft Learn — "Delegated Managed Service Accounts overview," "Setting up delegated Managed Service Accounts."`);
}

// ================================================================== 11 Migration C
{
  const s = content(SHOW, "Migration C: to a Microsoft Entra workload identity");
  tag(s, "How");
  const tb = table(s, "C", 1.4, [2.6, 3.3, 6.25], ["When", "Target", "Learn's command (the guide's step)"], [
    ["The workload moves to Azure", "A user-assigned managed identity", "az identity create; az role assignment create, the narrowest role at the narrowest scope (C1)"],
    ["It stays on an Arc-enabled server", "The server's system-assigned identity", "Add-LocalGroupMember 'Hybrid agent extension applications' for the gMSA; New-MgServicePrincipalAppRoleAssignment for Graph (C2)"],
    ["It stays on a host with no Arc agent", "An app registration with a certificate", "az ad app create; az ad sp create; az ad app credential reset --cert --append; the key in a vault (C3)"],
    ["CI/CD and other clouds", "A federated credential", "az ad app federated-credential create: issuer, subject and audience exact and case-sensitive (C4)"],
  ], { fontSize: 11.5, limit: 5.3 });
  callout(s, "Order", tb + 0.25, 1.1, "FaCloud", HEX.teal, "Learn's order for a credential: ",
    "a managed identity; then a platform that manages its own (federation); then a certificate from a trusted CA in a vault; never a secret.");
  sources(s, "Sources: Guide, Migration C, C1 to C5; Microsoft Learn, app registration best practices; managed identities; Arc identity; az ad app; workload identity federation.");
  notes(s,
`Migration C starts when the workload moves to Azure, or gains a call to Graph or an Azure A P I, and only for what it reaches with OAuth. Microsoft Learn's security best practices for application properties set the order: a managed identity whenever possible; where the app doesn't run on Azure, a platform that manages its own credentials, which is federation; otherwise a certificate from a trusted certificate authority, kept in a vault; and never a password credential. C1: a workload moving to Azure gets a user-assigned managed identity, created with the Azure C L I and given the narrowest role at the narrowest scope. It outlives its resources, so it needs an owner. C2: on an Arc-enabled server, use the server's own identity. Learn says only local administrators and one local group can request its tokens, so add the G M S A to that group. C3: on a host with no Arc agent, an app registration with a certificate, with two named owners. C4: for C I C D or another cloud, a federated credential, whose issuer, subject and audience must match exactly. C5: after thirty days carrying traffic, retire what the cloud path replaced. Disable it, or, for a G M S A the workload no longer needs, record its retirement, and a person uninstalls it from its hosts before the decommission process deletes it. The code never uninstalls or deletes.`,
  `${G} — Migration C, steps C1–C5; Microsoft Learn — "Security best practices for application properties," "What are managed identities for Azure resources?," "Managed identity and access control" (Arc), "Managed identity for SQL Server enabled by Azure Arc," "az ad app," "Configure an app to trust an external identity provider."`);
}

// ================================================================== 12 Mail from a gMSA workload
{
  const s = content(SHOW, "Sending mail once the workload runs as a gMSA");
  tag(s, "How");
  const tb = table(s, "Mail", 1.4, [2.85, 4.75, 3.35, 1.2], ["Where the mail goes", "Path", "What authenticates", "Step"], [
    ["Exchange Server on premises", "A receive connector with Integrated Windows authentication (Kerberos); Send As on a shared mailbox", "The gMSA itself", "M1"],
    ["On premises, a client that can't authenticate", "IP-restricted anonymous internal relay on a dedicated connector", "Nothing: the hosts' IP addresses", "M2"],
    ["Exchange Online", "Graph sendMail, app-only, scoped to one mailbox with RBAC for Applications", "The C3 app or the C2 Arc identity", "M3"],
    ["Learn's other options", "High Volume Email; Azure Communication Services Email; hybrid relay", "An HVE account, an ACS resource, or M1/M2", "M4"],
  ], { fontSize: 11, limit: 4.3 });
  const w = 5.95;
  const p1 = panel(s, "Scope", 0.6, tb + 0.2, w, null, HEX.red, HEX.redTint, "NEVER MAIL.SEND IN ENTRA ID", null, [
    "Learn: the Entra and Exchange grants are a union, so an Entra grant removes the scope",
    "Test-ServicePrincipalAuthorization: the shared mailbox yes, any other no",
  ], 11.5);
  const p2 = panel(s, "Gov", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.navy, HEX.navyTint, "GCC FIRST (LEARN, NOV 11, 2026)", null, [
    "GCC: Graph sendMail on graph.microsoft.com; RBAC for Applications not yet specified: test it in the tenant",
    "High Volume Email: not listed for GCC; Learn names Worldwide only, other clouds under evaluation",
  ], 11.5);
  if (process.env.FIT) console.log(`  mail panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, \"Sending mail from a gMSA workload,\" M1 to M4; Microsoft Learn, user: sendMail; RBAC for Applications in Exchange Online; receive connectors; HVE.");
  notes(s,
`One more move the guide covers, because mail breaks when an account becomes a G M S A. A G M S A has no mailbox and no password an S M T P client could type. And Microsoft Learn says basic-authentication S M T P submission to Exchange Online is scheduled for deprecation, so a stored mailbox password isn't the answer either. Choose by where the mail server is. On-premises Exchange: a dedicated receive connector that offers integrated Windows authentication, Kerberos, and Send As on a shared mailbox, never a person's. That's M1. A client that can't authenticate gets an anonymous relay limited to the workload's hosts' addresses, the weakest path. That's M2. Exchange Online: the workload sends through Microsoft Graph send mail as a workload identity, the app with a certificate from C3, or the Arc identity from C2, scoped to one shared mailbox with R B A C for Applications. Don't consent Mail dot Send in Entra I D: Learn says the two grants are a union, so an Entra grant removes the scope. Test the scope both ways. In GCC, send mail runs on the worldwide Graph host, but Learn doesn't yet specify R B A C for Applications for government clouds, so test it in the tenant before relying on it. High Volume Email is listed for Worldwide only.`,
  `${G} — "Sending mail from a gMSA workload," M1–M4, the government-cloud availability table; Microsoft Learn — "user: sendMail," "Role Based Access Control for Applications in Exchange Online," "Receive connectors in Exchange Server," "Allow anonymous relay on Exchange servers," "How to set up a multifunction device or application to send email using Microsoft 365 or Office 365," "Manage High Volume Email for Microsoft 365."`);
}

// ================================================================== 13 Dangers and rollback
{
  const s = content(SHOW, "Dangers, and how to avoid them");
  tag(s, "How");
  table(s, "Dangers", 1.4, [3.95, 4.1, 4.1], ["Danger", "What happens", "The guard"], [
    ["A gMSA created before the KDS root key replicates", "Password retrieval fails on hosts that ask another DC", "Wait 10 hours; never the backdated key in production"],
    ["A second KDS root key", "gMSAs fail after their next password rotation", "One key per forest"],
    ["An SPN left on the old account", "Kerberos to the service fails, or falls back to NTLM", "Move SPNs in the switch window; setspn -L"],
    ["A host that can't retrieve the password", "The service fails to start after the switch", "Test-ADServiceAccount True on every host first"],
    ["A gMSA in a privileged group", "Every host that retrieves its password holds that privilege", "Grant only the service's rights"],
    ["A dMSA completed early, or on a host not on 2025", "The service fails on hosts the dMSA hasn't learned", "30 days; every host on Windows Server 2025"],
    ["The old account deleted during the migration", "No way back", "Disable only; delete through decommission"],
    ["A client secret on the new app registration", "A password in a configuration file again", "Managed identity, then federation, then a certificate"],
    ["A non-domain-joined container host", "A stored domain password reappears", "Domain-joined hosts only (WD-154); else a reviewed exception"],
    ["A gMSA left behind at the end of AD", "The workload loses its credential with the last DC", "The reconciliation and the island list"],
  ], { fontSize: 10.5, limit: 6.55 });
  sources(s, "Sources: Guide, \"Dangers and how to avoid them\"; Microsoft Learn, Create a KDS root key; Create gMSAs for Windows containers; Manage gMSAs; Setting up delegated MSAs.");
  notes(s,
`The guide lists the dangers and the guard for each. Create a G M S A before the K D S root key replicates, and password retrieval fails on hosts that ask another domain controller: wait the ten hours. Create a second root key, and G M S As fail after their next password rotation: one key per forest. Leave an S P N on the old account, and Kerberos to the service fails or falls back to N T L M: move the S P Ns in the switch window. Switch a host that can't retrieve the password, and the service won't start: test every host first. Put a G M S A in a privileged group, and every host that retrieves its password holds that privilege. Complete a D M S A migration too early, or with a host not on Windows Server 2025, and the service fails on the hosts it hasn't learned. Delete the old account during the migration, and there's no way back. Put a client secret on the new app registration, and you have a password in a configuration file again. Run a G M S A container on a host that isn't domain-joined, and Learn's pattern for it keeps a stored domain password again; the program allows domain-joined hosts only, and anything else needs a reviewed exception. And a G M S A left behind when Active Directory retires loses its credential with the last domain controller.`,
  `${G} — "Dangers and how to avoid them"; "Questions for the program owner" (WD-154); Microsoft Learn pages footnoted in Migrations A and B, and "Create gMSAs for Windows containers."`);
}

// ================================================================== 14 Kit and labs
{
  const s = content(SHOW, "Where the kit and the labs take over");
  tag(s, "How");
  const tb = table(s, "Kit", 1.4, [3.3, 8.85], ["The guide's step", "In the Non-Person Identity developer workbook"], [
    ["Each account's disposition", "Chapter 03: the application owner's decision, the migration path matrix as code"],
    ["The standard", "Chapter 12 checks each request, reconciles SailPoint with AD, lists certifications due, reads Defender for Identity and the 90-day delete list"],
    ["Migration A", "Chapter 06 plans CreateGmsa, waits for the host change and 30 days, then DisableSuperseded and MoveSuperseded; the pipeline runs them"],
    ["Migration B", "Chapter 06's CreateDmsa, StartDmsaMigration and CompleteDmsaMigration, every Learn limit checked (NPI-KRB-04), run by a Domain Admin"],
    ["Migration C", "Chapter 05 for the identity and its credential, with a token exchange test; Chapter 07 for its permissions"],
    ["What stays", "Chapter 06's island list and reconciliation: an end date and, with SPNs, an SPN owner"],
  ], { fontSize: 12, limit: 4.6 });
  const w = 5.95;
  const p1 = panel(s, "Never", 0.6, tb + 0.2, w, null, HEX.navy, HEX.navyTint, "WHAT THE CODE NEVER DOES", null, [
    "Runs a plan nobody approved: each plan is sent only by its SHA-256",
    "Creates a KDS root key, runs undo or reset, uninstalls or deletes an account",
  ], 12);
  const p2 = panel(s, "Labs", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "TRY IT", null, [
    "Learning path, Modules 12 and 13: the migration and the standard, on fixtures, no tenant",
    "Chapter 06, Lab 2: a dMSA migration in a test domain; then the guide's checklist",
  ], 12);
  if (process.env.FIT) console.log(`  kit panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, \"How to read this guide,\" the standard, Migrations A to C, \"Checklist\"; Developer workbook, Building Non-Person Identity, Chapters 03, 05 to 07, 12.");
  notes(s,
`In production, the same moves run as reviewed code, in the Non-Person Identity developer workbook. Chapter 12 runs the standard's checks, from the request to the ninety-day delete list. Chapter 3 records each account's disposition. Chapter 6 does Migration A as a plan: create the G M S A, wait for the host change and the thirty days, then disable the superseded account and move it to the holding organizational unit, and the pipeline runs it. It does Migration B as three planned actions, create, start and complete, with every limit Microsoft Learn sets checked first, and a Domain Admin runs them. Chapter 5 does Migration C, the identity and its credential, and tests a real token exchange, and Chapter 7 cuts its permissions. Chapter 6 also keeps the island list and the reconciliation for what stays on Kerberos. What the code never does matters as much. It never runs a plan nobody approved, because each plan is sent only by its hash. And it never creates a K D S root key, never runs undo or reset, and never uninstalls or deletes an account. To try it, take Modules 12 and 13 of the Non-Person Identity learning path: the migration, and the standard, on the kit's fixtures, with no tenant. Then Chapter 6's second lab, in a test domain, and the guide's checklist. Thank you.`,
  `${G} — "How to read this guide"; "The managed service account standard"; Migrations A to C; "Checklist"; Developer workbook, Building Non-Person Identity — Chapters 03, 05, 06, 07 and 12; Non-Person Identity learning path, Modules 12 and 13.`);
}
endModule(SHOW);

// ================================================================== Backup
backup();
sourceSlide("Sources: the guide and the comparison", [
  "Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities (companion guide): \"How to read this guide,\" \"The kinds of service identity compared,\" \"The decision path,\" \"The program's rules for every migration,\" Migrations A to C, \"Special cases,\" \"Federal requirements and evidence,\" \"Dangers,\" \"Checklist.\" Its verification log lists every page with its ms.date.",
  "Microsoft Learn, read November 9, 2026: Govern on-premises service accounts; Service accounts (AD DS); Securing on-premises service accounts; Secure user-based service accounts in Active Directory; Secure standalone managed service accounts; Secure group managed service accounts.",
  "Microsoft Learn: What are managed identities for Azure resources?; Managed identity and access control (Azure Arc-enabled servers); Access Azure resources by using managed identity on Arc-enabled servers; Workload identity federation; Agent identities in Microsoft Entra Agent ID; Agent ID key concepts.",
  "Microsoft Learn, special cases: Create a gMSA in Microsoft Entra Domain Services; Create gMSAs for Windows containers; Prerequisites for Microsoft Entra Cloud Sync; Group Managed Service Accounts (Cloud Sync); Microsoft Entra Connect: Accounts and permissions; Configure Windows service accounts and permissions (SQL Server); AD FS requirements.",
]);
sourceSlide("Sources: the migrations", [
  "Migration A, Microsoft Learn: Manage group Managed Service Accounts; Group Managed Service Accounts overview; Create a Key Distribution Service (KDS) root key; Set-ADServiceAccount; Set-ADUser; sc.exe config and ChangeServiceConfigA; Modify and remove assessment tasks; PowerShell snap-in: changing application pool settings (IIS); Troubleshoot SQL Server setup, startup and authentication failures with gMSAs; Troubleshoot SQL Server Kerberos and authentication failures with gMSAs.",
  "Migration B, Microsoft Learn: Delegated Managed Service Accounts overview; Setting up delegated Managed Service Accounts.",
  "Migration C, Microsoft Learn: Security best practices for application properties in Microsoft Entra ID; Add and manage application credentials; Use certificates with Microsoft.Identity.Web; az ad app and az ad sp (Azure CLI reference); Create an Azure Functions app in Azure Container Apps (az identity create); Managed identity for SQL Server enabled by Azure Arc; Configure an app to trust an external identity provider.",
  "Federal requirements: NIST SP 800-53 Rev. 5 (Moderate baseline; IA-9 tailored in); FedRAMP 20x Key Security Indicators, as the Non-Person Identity implementation guide's Evidence table maps them (design guidance).",
  "The scripted versions: Building Non-Person Identity, Chapters 03, 05, 06, 07 and 12, and examples/non-person-identity. Training: the Non-Person Identity learning path, Modules 12 and 13.",
]);
sourceSlide("Sources: the managed service account standard", [
  "The guide's \"The managed service account standard\": \"Machines run the steps; people decide,\" \"Who does what,\" \"The standard's settings,\" \"Set it up once,\" \"The steps.\" Program decisions WD-154 and WD-159 to WD-170 in the decision register (design guidance).",
  "Federal sources, read November 20, 2026: NIST SP 800-53 Rev. 5, release 5.2.0 (AC-2(1), AC-2(3), AC-2(4), AC-5) and the SP 800-53B Moderate baseline; FedRAMP Key Security Indicators (KSI-IAM-AAM, KSI-SVC-ASM); CISA Zero Trust Maturity Model, Version 2.0.",
  "Microsoft Learn, read November 20, 2026: Move-ADObject; New-ADServiceAccount; dsacls; Investigate and protect service accounts (Defender for Identity); Security posture assessments for accounts; Log on as a service; Directory Service Accounts for Microsoft Defender for Identity.",
  "SailPoint, read November 20, 2026: Active Directory Connector: Introduction; Machine Identity Security; Configuring Accounts.",
]);

finish(OUT);
