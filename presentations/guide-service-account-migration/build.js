// Companion guide — Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities.
// A narrated Why / What / Who / How deck of about 15 minutes (13 narrated slides, then a backup section).
//   Why:   the user account used as a service, and Kerberoasting.
//   What:  the twelve kinds of service identity compared; what can move to Microsoft Entra ID and what can't; the special cases.
//   Who:   the decision path and its dispositions; the program's rules; the requirements, KSIs and evidence the ISSO keeps.
//   How:   Migration A (user account to gMSA), B (to a dMSA), C (to an Entra workload identity); dangers and rollback;
//          where the Non-Person Identity kit and the labs take over.
// Sources: docs/books/guides/service-account-migration.md and the Microsoft Learn pages it footnotes (read November 9, 2026;
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
    { text: "Who: the decision path, the program's rules, the evidence", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "How: a user account to a gMSA, to a dMSA, to a Microsoft Entra workload identity; dangers, rollback, the kit", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: Service Accounts, from user accounts to group managed service accounts to Microsoft Entra workload identities. The guide's idea fits in one line. A service account's password is the one nobody changes, because changing it breaks something. Every step in the guide replaces a password someone has to keep with a credential that Windows, or Microsoft Entra I D, keeps instead. Every fact and command in this deck comes from Microsoft Learn, read on November ninth, 2026, and the guide footnotes each one. Rules that are the program's own, not Microsoft's, are called design guidance. We'll go in four parts: why this matters, what the kinds of service identity are, who decides and what they keep, and how each migration runs.`,
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
  const s = content(SWHO, "The decision path: the first yes is the target");
  tag(s, "Who");
  const tb = table(s, "Path", 1.4, [0.45, 5.6, 3.7, 2.4], ["#", "Question", "Target", "Disposition"], [
    ["1", "Disabled, unused, or no owner after inventory?", "Retire, through decommission", "Retire"],
    ["2", "Runs on an Azure resource, or moving to one?", "A managed identity, user-assigned preferred", "Replatform"],
    ["3", "Runs in CI/CD or on a platform with its own OIDC issuer?", "A federated credential", "Replatform"],
    ["4", "Stays on premises but calls Graph or Azure APIs?", "Arc identity; else an app registration with a certificate", "Replatform"],
    ["5", "Needs Kerberos; a 2025 DC, every host on 2025, no unconstrained delegation?", "A dMSA, migrated from the old account", "Replatform"],
    ["6", "Needs Kerberos, otherwise?", "A gMSA; an MSA becomes a gMSA first", "Replatform"],
    ["7", "Already a gMSA or dMSA, staying?", "Keep, with an SPN owner and an end date", "Keep"],
    ["8", "Must stay a traditional account?", "Keep on Kerberos, with the authorizing official's acceptance", "KeepKerberos"],
    ["9", "Kerberos to a resource with no Entra equivalent?", "The Kerberos island, until that resource changes", "Keep, KeepKerberos"],
  ], { fontSize: 11, limit: 5.75 });
  line(s, "Learn", "Learn's order on premises: a gMSA unless the service doesn't support one, then an sMSA, then a user account. An MSA or gMSA can't be migrated to a dMSA.",
    tb + 0.12, 0.6, 13.5);
  sources(s, "Sources: Guide, \"The decision path\"; Microsoft Learn, \"Secure group managed service accounts\"; \"Delegated Managed Service Accounts overview.\"");
  notes(s,
`Now, who decides. The guide's decision path is nine questions, asked in order, and the first yes is the target. Each target lines up with a disposition the application owner records in the Non-Person Identity track. One: is the account disabled, unused or without an owner? Retire it. Two: does the workload run on an Azure resource, or is it moving to one? A managed identity, user-assigned preferred. Three: does it run in C I C D or on a platform with its own O I D C issuer? A federated credential. Four: does it stay on premises but call Graph or Azure A P I's? The Arc-enabled server's identity, or an app registration with a certificate. Five: does it need Kerberos, with a Windows Server 2025 domain controller, every host on 2025, and no unconstrained delegation? A D M S A. Six: otherwise, a G M S A. Seven and eight keep what must stay, with an owner and an end date. Nine is the Kerberos island. This lines up with Microsoft Learn: use a G M S A unless the service doesn't support one, then a standalone account, then a user account.`,
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
      "Disable the old account after a clean 30-day parallel run; never delete during the migration",
    ], 12));
  panel(s, "Secrets", 0.6, row1 + 0.2, w, 1.5, HEX.red, HEX.redTint, "NO CLIENT SECRETS", null, [
    "A managed identity, then a federated credential, then a certificate; Learn says don't use password credentials",
  ], 12);
  panel(s, "Priv", 0.6 + w + g, row1 + 0.2, w, 1.5, HEX.red, HEX.redTint, "NO PRIVILEGED GROUPS", null, [
    "Learn: service accounts shouldn't be in privileged groups, and each service gets its own account",
  ], 12);
  const row2 = panel(s, "Reviewed", 0.6 + 2 * (w + g), row1 + 0.2, w, 1.5, HEX.navy, HEX.navyTint, "CHANGES ARE REVIEWED", null, [
    "In production, each write is a plan approved by its SHA-256; by hand only in a test domain or under a change record",
  ], 12);
  callout(s, "Strict", row2 + 0.25, 0.95, "FaScaleBalanced", HEX.navy, "Where Learn's pages differ: ",
    "one ends a move to a gMSA by deleting the old account; another says never delete the original. The program follows the stricter.");
  sources(s, "Sources: Guide, \"The program's rules for every migration\" (design guidance); Microsoft Learn, \"Securing on-premises service accounts\"; \"Setting up delegated MSAs.\"");
  notes(s,
`These are the program's rules, design guidance, and they apply to a hand migration too. Every identity has two named technical owners and a sponsor who is a federal employee mastered in H R; a contractor can build or run a workload but can't be its only sponsor. No account moves without its reviewed disposition. The old account runs in parallel for thirty days, then it's disabled, and it's deleted only later, through the decommission process. No client secrets: a cloud identity is a managed identity, a federated credential or a certificate, in that order, and Microsoft Learn says not to use password credentials. No privileged groups: Learn says service accounts shouldn't be members of them, and each service should have its own account. And changes are reviewed: in production, each write is a plan approved by its hash. One place where Learn's own pages differ. Learn's Entra page on group managed service accounts ends its move by deleting the old account, while its page on setting up delegated accounts says never to delete the original. The program follows the stricter reading.`,
  `${G} — "The program's rules for every migration"; Microsoft Learn — "Securing on-premises service accounts," "Secure group managed service accounts," "Setting up delegated Managed Service Accounts," "Security best practices for application properties."`);
}

// ================================================================== 7 Requirements and KSIs
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

// ================================================================== 8 Migration A, A1 to A4
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
    "# A4  After the host restarts, on each host, elevated (expected: True on every host)",
    "Install-ADServiceAccount -Identity <gmsa-name>",
    "Test-ADServiceAccount -Identity <gmsa-name>",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN (PLACEHOLDERS IN ANGLE BRACKETS; LONG LINES CONTINUED WITH `)", pt: 10.5 });
  const w = 5.95;
  const p1 = panel(s, "Before", 0.6, c + 0.15, w, null, HEX.navy, HEX.navyTint, "BEFORE YOU CREATE IT", null, [
    "The name is unique in the forest; the password interval (30 days) is set only now",
    "Retrievers are a group of hosts: that group is the gMSA's blast radius",
  ], 11.5);
  const p2 = panel(s, "Key", 0.6 + w + 0.25, c + 0.15, w, null, HEX.red, HEX.redTint, "THE KDS ROOT KEY", null, [
    "Never the 10-hour backdated key in production; more than one key makes gMSAs fail after a rotation",
    "False from Test-ADServiceAccount: fix the host before the switch",
  ], 11.5);
  if (process.env.FIT) console.log(`  A panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, Migration A, A1 to A4; Microsoft Learn, Manage gMSAs; Create a KDS root key; Create gMSAs for Windows containers; gMSA overview; SQL Server gMSA checklist.");
  notes(s,
`Migration A moves a user account to a G M S A, in Microsoft Learn's order: K D S root key, create, install, switch, validate, retire. A1: read the account with Get-A D User, its S P Ns, delegation and groups, and on each host read the service's logon account with S C query config. A2: the forest needs one K D S root key. If there's none, a Domain Admin or Enterprise Admin creates it once, and Learn's K D S page says domain controllers wait up to ten hours before they allow a G M S A, so the key replicates first. Learn offers a key backdated ten hours for a test domain with one domain controller; never use it in production. And Learn's containers page says more than one key makes G M S As fail after a password rotation. A3: create a group of the hosts, then the G M S A with A E S two-fifty-six, which Learn's overview says to always configure. Its name must be unique in the forest, and its password interval can be set only now. A4: after a restart, install it on each host and test it. Test-A D Service Account must return true on every host before you switch.`,
  `${G} — Migration A, steps A1–A4; Microsoft Learn — "Manage group Managed Service Accounts," "Create a Key Distribution Service (KDS) root key," "Create gMSAs for Windows containers," "Group Managed Service Accounts overview," "Troubleshoot SQL Server setup, startup, and authentication failures with gMSAs."`);
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
    "# A7  After a clean 30-day parallel run (A6): disable, don't delete",
    "Disable-ADAccount -Identity <old-account>",
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
  sources(s, "Sources: Guide, Migration A, A5 to A7, Rollback (A); Microsoft Learn, Set-ADServiceAccount; Set-ADUser; sc.exe config; Secure gMSAs; IIS PowerShell snap-in; assessment tasks.");
  notes(s,
`A5 happens in one change window, because an S P N left on the old account while the service runs as the G M S A breaks Kerberos to the service. Each S P N must have exactly one owner. Remove it from the old account, add it to the G M S A, and list it with set S P N. Then change the workload's identity. A G M S A logs on with a blank password, which Windows fills in, as Learn's Entra page says. For a Windows service, S C config sets the account, and the managed-account query must report true. A scheduled task gets a new principal with the password logon type, as Learn's assessment pages do it, and an I I S application pool gets identity type three with the blank password. The guide notes that Learn has no single page showing that last one end to end, so verify it. A6 is the thirty-day parallel run: test end to end, keep the old account enabled, and watch its logons stop. A7 disables the old account; deletion comes later, through the decommission process. To roll back, switch the workload back with the old password from the vault, and move the S P Ns back.`,
  `${G} — Migration A, steps A5–A7, "Rollback (A)," "What couldn't be verified"; Microsoft Learn — "Set-ADServiceAccount," "Set-ADUser," "sc.exe config," "Secure group managed service accounts," "PowerShell snap-in: making simple configuration changes," "Modify and remove assessment tasks."`);
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
  ], 11.5);
  const p2 = panel(s, "Wait", 0.6 + w + 0.25, c + 0.15, w, null, HEX.amber, HEX.amberTint, "WAIT, THEN COMPLETE; NEVER DELETE", null, [
    "Learn: at least two 7-day ticket lifetimes, four recommended; the program's 30 days covers four",
    "Never delete the original: Learn warns it causes issues if you need to revert",
  ], 11.5);
  if (process.env.FIT) console.log(`  B panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, Migration B, B1 to B3, Rollback (B); Microsoft Learn, \"Delegated Managed Service Accounts overview\"; \"Setting up delegated Managed Service Accounts.\"");
  notes(s,
`Migration B moves the same kind of account to a delegated managed service account, on Windows Server 2025. A D M S A supersedes the old account: once the migration completes, the old password can't be used, its S P Ns, delegation and authentication policy move to the D M S A, and the old account is disabled. Check Microsoft Learn's limits first. At least one Windows Server 2025 domain controller, and every machine that uses the account updated to support D M S As; one that isn't fails once the old account is disabled. You can't migrate an M S A or a G M S A to a D M S A, and unconstrained delegation stops working. B1 creates the D M S A. Learn's set-up page then sets a state attribute with a parameter the cmdlet doesn't have; for a migration, skip it, because starting the migration sets the state. B2 starts the migration, and on each host sets Learn's registry value and restarts the one service. B3: Learn says to wait at least two ticket lifetimes, fourteen days, and recommends four. The program's thirty days covers four. Then complete it, and never delete the original account.`,
  `${G} — Migration B, steps B1–B3, "Rollback (B)"; Microsoft Learn — "Delegated Managed Service Accounts overview," "Setting up delegated Managed Service Accounts."`);
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
`Migration C starts when the workload moves to Azure, or gains a call to Graph or an Azure A P I, and only for what it reaches with OAuth. Microsoft Learn's security best practices for application properties set the order: a managed identity whenever possible; where the app doesn't run on Azure, a platform that manages its own credentials, which is federation; otherwise a certificate from a trusted certificate authority, kept in a vault; and never a password credential. C1: a workload moving to Azure gets a user-assigned managed identity, created with the Azure C L I and given the narrowest role at the narrowest scope. It outlives its resources, so it needs an owner. C2: on an Arc-enabled server, use the server's own identity. Learn says only local administrators and one local group can request its tokens, so add the G M S A to that group. C3: on a host with no Arc agent, an app registration with a certificate, with two named owners. C4: for C I C D or another cloud, a federated credential, whose issuer, subject and audience must match exactly. C5: after thirty days carrying traffic, retire what the cloud path replaced.`,
  `${G} — Migration C, steps C1–C5; Microsoft Learn — "Security best practices for application properties," "What are managed identities for Azure resources?," "Managed identity and access control" (Arc), "Managed identity for SQL Server enabled by Azure Arc," "az ad app," "Configure an app to trust an external identity provider."`);
}

// ================================================================== 12 Dangers and rollback
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
    ["A gMSA left behind at the end of AD", "The workload loses its credential with the last DC", "The reconciliation and the island list"],
  ], { fontSize: 11, limit: 6.55 });
  sources(s, "Sources: Guide, \"Dangers and how to avoid them\"; Microsoft Learn, Create a KDS root key; Create gMSAs for Windows containers; Manage gMSAs; Setting up delegated MSAs.");
  notes(s,
`The guide lists the dangers and the guard for each. Create a G M S A before the K D S root key replicates, and password retrieval fails on hosts that ask another domain controller: wait the ten hours. Create a second root key, and G M S As fail after their next password rotation: one key per forest. Leave an S P N on the old account, and Kerberos to the service fails or falls back to N T L M: move the S P Ns in the switch window. Switch a host that can't retrieve the password, and the service won't start: test every host first. Put a G M S A in a privileged group, and every host that retrieves its password holds that privilege. Complete a D M S A migration too early, or with a host not on Windows Server 2025, and the service fails on the hosts it hasn't learned. Delete the old account during the migration, and there's no way back. Put a client secret on the new app registration, and you have a password in a configuration file again. And a G M S A left behind when Active Directory retires loses its credential with the last domain controller.`,
  `${G} — "Dangers and how to avoid them"; Microsoft Learn pages footnoted in Migrations A and B.`);
}

// ================================================================== 13 Kit and labs
{
  const s = content(SHOW, "Where the kit and the labs take over");
  tag(s, "How");
  const tb = table(s, "Kit", 1.4, [3.3, 8.85], ["The guide's step", "In the Non-Person Identity developer workbook"], [
    ["Each account's disposition", "Chapter 03: the application owner's decision, the migration path matrix as code"],
    ["Migration A", "Chapter 06 plans CreateGmsa, waits for the host change and 30 days, then plans DisableSuperseded"],
    ["Migration B", "Chapter 06's CreateDmsa, StartDmsaMigration and CompleteDmsaMigration, with every Learn limit checked (NPI-KRB-04)"],
    ["Migration C", "Chapter 05 for the identity and its credential, with a token exchange test; Chapter 07 for its permissions"],
    ["What stays", "Chapter 06's island list and reconciliation: an end date and, with SPNs, an SPN owner"],
  ], { fontSize: 12, limit: 4.6 });
  const w = 5.95;
  const p1 = panel(s, "Never", 0.6, tb + 0.2, w, null, HEX.navy, HEX.navyTint, "WHAT THE CODE NEVER DOES", null, [
    "Runs a plan nobody approved: each plan is sent only by its SHA-256",
    "Creates a KDS root key, runs undo or reset, or deletes an account",
  ], 12);
  const p2 = panel(s, "Labs", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "TRY IT", null, [
    "Learning path, Module 12: Learn's steps on stand-ins and the kit's plans on fixtures, no tenant",
    "Chapter 06, Lab 2: a dMSA migration in a test domain; then the guide's checklist",
  ], 12);
  if (process.env.FIT) console.log(`  kit panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, \"How to read this guide,\" Migrations A to C, \"Checklist\"; Developer workbook, Building Non-Person Identity, Chapters 03, 05, 06 and 07.");
  notes(s,
`In production, the same moves run as reviewed code, in the Non-Person Identity developer workbook. Chapter 3 records each account's disposition. Chapter 6 does Migration A as a plan: create the G M S A, wait for the host change and the thirty days, then disable the superseded account. It does Migration B as three planned actions, create, start and complete, with every limit Microsoft Learn sets checked first. Chapter 5 does Migration C, the identity and its credential, and tests a real token exchange, and Chapter 7 cuts its permissions. Chapter 6 also keeps the island list and the reconciliation for what stays on Kerberos. What the code never does matters as much. It never runs a plan nobody approved, because each plan is sent only by its hash. And it never creates a K D S root key, never runs undo or reset, and never deletes an account. To try it, take Module 12 of the Non-Person Identity learning path, which runs Learn's steps on stand-ins and the kit's plans on fixtures, with no tenant. Then Chapter 6's second lab, in a test domain, and the guide's checklist. Thank you.`,
  `${G} — "How to read this guide"; Migrations A to C; "Checklist"; Developer workbook, Building Non-Person Identity — Chapters 03, 05, 06 and 07; Non-Person Identity learning path, Module 12.`);
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
  "The scripted versions: Building Non-Person Identity, Chapters 03, 05, 06 and 07, and examples/non-person-identity. Training: the Non-Person Identity learning path, Module 12.",
]);

finish(OUT);
