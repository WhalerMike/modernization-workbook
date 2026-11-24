// Companion guide — Non-Person Identity: Zero Trust, SASE and Other Clouds.
// A narrated Why / What / Who / How deck (15 narrated slides, then a backup section).
//   Why:   a gMSA fixes the password, not the protocol: the answer in brief.
//   What:  the Zero Trust scorecard (CISA ZTMM Identity pillar, four functions by three kinds of service identity) and what
//          it means for the program's scores; what SASE (Global Secure Access) does and doesn't do for a service account.
//   Who:   the workloads one by one (SQL Server, IIS, scheduled tasks and services, RHEL and Linux, AWS GovCloud (US), OCI);
//          RHEL and Linux sign-in.
//   How:   the certificate map; NTLM; whether to extend Microsoft Entra ID across clouds, for people and for workloads;
//          dangers; the checklist.
// Sources: docs/books/guides/non-person-identity-zero-trust-sase.md and the pages it footnotes (CISA, Microsoft Learn, Red Hat,
// OMB, AWS and Oracle, read November 24, 2026), and the program decisions it names (WD-027, WD-165, WD-171). No new facts.
// The page's labels carry over: where each kind lands on the scorecard, the Arc sign-in across clouds and the people/workloads
// split are design guidance; the federated credential from AWS GovCloud (US) is "once tested".
// The speaker notes are the narration (spoken by narrate.py), written to be heard: acronyms the voice misreads are spelled out,
// and every source is named by its original (CISA, Microsoft Learn, OMB, AWS, Oracle, Red Hat), never by a workbook book number.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/guide-npi-zero-trust-sase/build.js \
//                      presentations/guide-npi-zero-trust-sase/Guide_NPI_Zero_Trust_SASE.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Non-Person Identity: Zero Trust, SASE and Other Clouds",
  footer: "Federal Modernization Workbook  ·  Companion guide: Non-Person Identity, Zero Trust, SASE and Other Clouds",
});
const { HEX, txt, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Guide_NPI_Zero_Trust_SASE.pptx";
const G = "Companion guide, Non-Person Identity: Zero Trust, SASE and Other Clouds";

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
  const s = titleSlide(SWHY, "Non-Person Identity: Zero Trust, SASE and Other Clouds", "Each service identity, scored for Zero Trust and SASE");
  txt(s, "Session map", [
    { text: "Why: a gMSA fixes the password, not the protocol   ·   What: the Zero Trust scorecard; what SASE does", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Who: the workloads one by one, from SQL Server to AWS GovCloud (US) and OCI; Linux sign-in", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "How: the certificate map; NTLM; extending Entra ID across clouds; dangers; the checklist", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: Non-Person Identity, Zero Trust, SASE and Other Clouds. The guide's idea fits in one line. A G M S A fixes the password, not the protocol: the service still speaks Kerberos to Active Directory, where Conditional Access, Global Secure Access and the Zero Trust Maturity Model can't see it. The Non-Person Identity track has three guides. The implementation guide runs the track as gates. The service accounts guide moves one account at a time. This one is the why: what each choice does to the program's Zero Trust maturity and its SASE design, workload by workload and cloud by cloud, and which certificates each move adds or removes. Every fact in this deck comes from the guide, which footnotes each one: CISA, Microsoft Learn, Red Hat, OMB, AWS and Oracle, read on November twenty-fourth, 2026. Where the guide gives the program's own reading rather than a source's, it says design guidance, and so does this deck. We'll go in four parts: why a G M S A isn't the end, what the Zero Trust scorecard and SASE say, which workloads it touches, and how certificates, N T L M and other clouds change the answer.`,
  `${G} — "Which guide?," "In this guide."`);
}

// ================================================================== 2 Why
{
  const s = content(SWHY, "A gMSA fixes the password, not the protocol");
  tag(s, "Why");
  const tb = table(s, "Brief", 1.4, [3.35, 8.8], ["The answer in brief", "Why"], [
    ["A gMSA or dMSA is a better password, not a Zero Trust identity", "It removes the human-known password (the Kerberoasting risk), but the workload still authenticates with Kerberos against AD. Conditional Access, Entra's risk signals and the sign-in logs never see it"],
    ["An Entra workload identity moves the identity into the central store", "No secret anyone holds (a managed identity or a federated credential) or a short-lived certificate; every token logged in Entra ID. Limit: Conditional Access for workload identities covers single-tenant service principals only, not managed identities"],
    ["SASE protects the people in front of a service, not the service", "Private Access and application proxy put Entra sign-in and phishing-resistant MFA in front, then use Kerberos constrained delegation to the SPN. The service account and SPN stay; the Global Secure Access client runs on end-user devices"],
    ["Certificates change shape, not count", "Kerberos and SPNs need none; SQL Server with Entra logins needs a CA-issued TLS certificate; an app registration its own; a managed identity none"],
    ["Extend Entra ID for people; don't force one workload identity", "People: one identity provider, federated into AWS IAM Identity Center, OCI identity domains and Linux sign-in. Workloads: each platform's native identity, governed from one record (design guidance)"],
  ], { fontSize: 12, limit: 6.55 });
  if (process.env.FIT) console.log(`  brief bottom ${tb.toFixed(2)}`);
  sources(s, "Sources: Guide, \"The answer in brief\"; Microsoft Learn, \"Conditional Access for workload identities,\" Kerberos SSO with application proxy, \"Global Secure Access clients.\"");
  notes(s,
`Here's the answer in brief, in five points. First, a G M S A or a D M S A is a better password, not a Zero Trust identity. It removes the password a person knows, which is the Kerberoasting risk, but the workload still authenticates with Kerberos against Active Directory. Nothing in Entra I D evaluates that sign-in, so Conditional Access, Entra's risk signals and the sign-in logs never see it. Second, a Microsoft Entra workload identity moves the identity into the program's central store, with no secret anyone holds, a managed identity or a federated credential, or with a short-lived certificate, and every token it gets is logged in Entra I D. The limit, from Microsoft Learn: Conditional Access for workload identities covers single-tenant service principals only, not managed identities. Third, SASE protects the people in front of a service, not the service itself. Private Access and application proxy put Entra sign-in and phishing-resistant multifactor authentication in front of a Kerberos application, then reach it with Kerberos constrained delegation to its S P N. The application's own service account and S P N stay where they are, and service-to-service traffic doesn't go through the Global Secure Access client, which runs on end-user devices. Fourth, certificates change shape, not count. Fifth, extend Entra I D for people across every cloud, but don't force one workload identity across them. That last one is the program's recommendation, design guidance.`,
  `${G} — "The answer in brief"; Microsoft Learn — "Microsoft Entra Conditional Access for workload identities," "Kerberos Constrained Delegation for single sign-on (SSO) to your apps with application proxy," "Learn about the Global Secure Access clients."`);
}
endModule(SWHY);

// ================================================================== 3 Scorecard, part 1
{
  const s = content(SWHAT, "The Zero Trust scorecard: authentication and stores");
  tag(s, "What");
  const tb = table(s, "Score1", 1.4, [2.85, 2.6, 2.9, 3.8], ["CISA ZTMM function (Identity pillar)", "User account used as a service", "gMSA or dMSA", "Entra workload identity"], [
    ["Authentication. Traditional: \"passwords or multi-factor authentication\"; Optimal \"continuously validates identity\"",
      "Traditional: a static password, often never expiring, crackable offline if it holds an SPN",
      "Better than Traditional on the credential (generated, rotated, unknown to people), but static Kerberos access with no continuous evaluation",
      "Token-based, short-lived and logged; a managed identity has no credential to steal. Workloads \"can't perform multifactor authentication\", so the equivalent is no stored secret"],
    ["Identity stores. Traditional: \"self-managed, on-premises\"; Optimal \"securely integrates their identity stores across all partners and environments\"",
      "On-premises AD only", "On-premises AD only",
      "Entra ID, the program's integrated store; federation reaches other clouds"],
  ], { fontSize: 11.5, limit: 5.6 });
  callout(s, "Reading", tb + 0.25, 0.95, "FaScaleBalanced", HEX.navy, "CISA counts \"non-person entities\" as identities. ",
    "The stages are CISA's; where each kind lands is the program's reading (design guidance).");
  sources(s, "Sources: Guide, \"The Zero Trust scorecard\"; CISA, Zero Trust Maturity Model v2.0, section 5.1 and Table 2; Microsoft Learn, \"Conditional Access for workload identities.\"");
  notes(s,
`CISA's Zero Trust Maturity Model defines an identity as attributes that describe, quote, an agency user or entity, including non-person entities. So service accounts are inside the Identity pillar, not beside it. The guide scores three kinds of service identity against the pillar's functions: authentication, identity stores, risk assessments and access management. The stages are CISA's; where each kind lands is the program's reading, design guidance. Authentication. CISA's Traditional stage is passwords or multi-factor authentication; Optimal continuously validates identity. A user account used as a service is Traditional: a static password, often never expiring, and crackable offline if it holds an S P N. A G M S A or a D M S A is better than Traditional on the credential, because it's generated, rotated and unknown to people, but its Kerberos access is static, with no continuous evaluation. An Entra workload identity is token-based, short-lived and logged, and a managed identity has no credential to steal. Microsoft Learn says workloads can't perform multifactor authentication, so the workload equivalent of phishing-resistant multifactor authentication is having no stored secret. Identity stores. Traditional is self-managed, on-premises stores; Optimal securely integrates them across all partners and environments. The user account and the G M S A both live only in on-premises Active Directory. The workload identity lives in Entra I D, the program's integrated store, and federation reaches other clouds.`,
  `${G} — "The Zero Trust scorecard" (table, Authentication and Identity stores); CISA — Zero Trust Maturity Model, Version 2.0, section 5.1 and Table 2; Microsoft Learn — "Microsoft Entra Conditional Access for workload identities."`);
}

// ================================================================== 4 Scorecard, part 2, and the scores
{
  const s = content(SWHAT, "The scorecard: risk, access, and the program's scores");
  tag(s, "What");
  const tb = table(s, "Score2", 1.4, [2.85, 2.6, 2.9, 3.8], ["CISA ZTMM function (Identity pillar)", "User account used as a service", "gMSA or dMSA", "Entra workload identity"], [
    ["Risk assessments. Optimal determines risk \"in real time\"",
      "Defender for Identity on domain controller traffic", "Defender for Identity; no Entra risk signal",
      "Entra ID Protection risk and Conditional Access for workload identities (single-tenant service principals)"],
    ["Access management. Traditional: \"permanent access with periodic review\"; Optimal \"just-in-time and just-enough access\"",
      "Standing group memberships and delegation", "Standing, scoped by the retriever group and the account's rights",
      "Role assignments and app roles, reviewable in Entra and Azure; still standing, but visible and scoped per resource"],
  ], { fontSize: 11.5, limit: 4.3 });
  const w = 5.95;
  const p1 = panel(s, "Scores", 0.6, tb + 0.2, w, null, HEX.red, HEX.redTint, "WHAT IT MEANS FOR THE PROGRAM'S SCORES", null, [
    "Every account kept on Kerberos (Keep or KeepKerberos) holds the Identity stores function at Traditional for that workload",
    "Until its end date (WD-165), whatever the rest of the estate reaches",
  ], 12);
  const p2 = panel(s, "Finding", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.navy, HEX.navyTint, "ALREADY A FINDING", null, [
    "The Zero Trust assessment guide and \"Close Before You Assess\" count legacy authentication that service accounts still use",
    "The island list from the developer workbook's Chapter 06 is that finding's evidence",
  ], 12);
  if (process.env.FIT) console.log(`  score panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, \"The Zero Trust scorecard,\" \"What this means for the program's scores\" (WD-165); CISA, Zero Trust Maturity Model v2.0, Table 2.");
  notes(s,
`Risk assessments. CISA's Optimal stage determines risk in real time. For a user account or a G M S A, the only signal is Defender for Identity, on domain controller traffic; a G M S A gets no Entra risk signal. A workload identity gets Entra I D Protection's risk, and Conditional Access for workload identities, for single-tenant service principals. Access management. Traditional is permanent access with periodic review; Optimal is just-in-time and just-enough access. A user account has standing group memberships and delegation. A G M S A is standing too, scoped by its retriever group and the account's rights. A workload identity's role assignments and app roles are still standing, but they're visible, scoped per resource, and reviewable in Entra and Azure. So what does this mean for the program's scores? Every account kept on Kerberos, with the disposition Keep or Keep Kerberos, holds the Identity pillar's identity stores function at Traditional for that workload until its end date, whatever the rest of the estate reaches. That's the program's decision W D one sixty-five. The Zero Trust assessment guide, and the chapter Close Before You Assess, already count legacy authentication that service accounts still use as a finding. The island list, from the Non-Person Identity developer workbook's chapter on G M S As, D M S As and the Kerberos island, is that finding's evidence.`,
  `${G} — "The Zero Trust scorecard" (table, Risk assessments and Access management), "What this means for the program's scores"; decision register — WD-165; Zero Trust Assessment: An Implementation Guide; Zero Trust & Assessment — "Close Before You Assess"; Developer workbook, Building Non-Person Identity — Chapter 06, "gMSAs, dMSAs and the Kerberos Island."`);
}

// ================================================================== 5 SASE
{
  const s = content(SWHAT, "What SASE does and doesn't do for a service account");
  tag(s, "What");
  const tb = table(s, "SASE", 1.4, [2.6, 4.75, 4.8], ["Global Secure Access part", "What it does", "What it means for a service account and its SPN"], [
    ["Private Access and application proxy, with Kerberos SSO",
      "The user signs in to Entra ID, under Conditional Access; the connector then \"impersonat[es] the user to get a Kerberos token to the application\". Connector and application server domain joined; the SPN in the connector's delegation list",
      "The application keeps running as its service account, which holds the SPN (Learn's example: a user or computer account). Moving the SPN to a gMSA at A5 means updating the connector's delegation in the same change"],
    ["Private Access for domain controllers",
      "Conditional Access and phishing-resistant MFA in front of Kerberos to on-premises apps, for \"the users who are synchronized from Active Directory\"; the sensor starts in audit mode",
      "Scoped to users. Once enforced, Kerberos to a protected SPN from a device without the client is blocked, so service-to-service Kerberos needs an SPN exclusion"],
    ["The Global Secure Access client",
      "Controls \"network traffic at the end-user computing device\"",
      "A server-side workload's own traffic isn't in the SASE path. Its protection is its identity and its network segmentation"],
  ], { fontSize: 11.5, limit: 5.7 });
  line(s, "Front", "SASE and this track meet at the SPN. A Kerberos app published through Private Access is Zero Trust at the front door and Traditional behind it until its service account moves.",
    tb + 0.15, 0.65, 14);
  sources(s, "Sources: Guide, \"What SASE does and doesn't do\"; Microsoft Learn, Kerberos SSO with application proxy and Private Access; Private Access for domain controllers; GSA clients.");
  notes(s,
`The program's SASE is Microsoft's security service edge, Global Secure Access. Three of its parts touch service accounts. First, Private Access and application proxy, with Kerberos single sign-on. The user signs in to Entra I D, under Conditional Access. Then, in Microsoft Learn's words, the connector impersonates the user to get a Kerberos token to the application. That needs the connector and the application server domain joined, and the application's S P N in the connector's delegation list. The application keeps running as its service account, which holds the S P N; Learn's example is a web service account that's a user or a computer account. So moving that S P N to a G M S A, at step A5 of the service accounts guide, means updating the connector's delegation entry in the same change. Second, Private Access for domain controllers. It puts Conditional Access and phishing-resistant multifactor authentication in front of Kerberos to on-premises applications, for the users who are synchronized from Active Directory, and its sensor starts in audit mode. It's scoped to users. Once it's enforced, Kerberos to a protected S P N from a device without the Global Secure Access client is blocked, so service-to-service Kerberos needs an S P N exclusion. Third, the Global Secure Access client controls network traffic at the end-user computing device. A server-side workload's own traffic isn't in the SASE path; its protection is its identity and its network segmentation. So SASE and this track meet at the S P N. A Kerberos application published through Private Access is Zero Trust at the front door, and Traditional behind it, until its service account moves.`,
  `${G} — "What SASE does and doesn't do for a service account"; Global Secure Access implementation guide — Step 10; Service Accounts guide — A5's delegation check; Microsoft Learn — "Kerberos Constrained Delegation for single sign-on (SSO) to your apps with application proxy," "Use Kerberos for single sign-on (SSO) with Microsoft Entra Private Access," "Configure Microsoft Entra Private Access for Active Directory Domain Controllers," "Learn about the Global Secure Access clients."`);
}
endModule(SWHAT);

// ================================================================== 6 Workloads, part 1
const WCOLS = [1.85, 2.2, 3.15, 2.75, 2.2];
const WHEAD = ["Workload", "Today", "Target", "Zero Trust gain", "SASE path"];
{
  const s = content(SWHO, "The workloads: SQL Server, its callers, and IIS");
  tag(s, "Who");
  table(s, "Work1", 1.4, WCOLS, WHEAD, [
    ["SQL Server engine", "A user account or gMSA, MSSQLSvc SPN",
      "The gMSA stays the Windows logon account; the instance gets an Entra identity: the Arc managed identity on SQL Server 2025, an app registration with a certificate on 2022",
      "Users and applications sign in with Entra logins; Learn lists \"non-interactive mechanisms including managed identities\"",
      "Users reach it through Private Access; the engine's Kerberos stays on the island until its logins are Entra-only"],
    ["Applications that call SQL Server", "A user account or gMSA with a Windows login",
      "A managed identity, or a service principal with a certificate, with an Entra login in SQL Server",
      "The connection moves from Kerberos to an Entra token", "Not in the SASE path (server to server)"],
    ["IIS sites and application pools", "A user account or gMSA, HTTP SPN",
      "gMSA now; a managed identity when the site moves to Azure",
      "Users sign in with Entra through application proxy or Private Access; the pool's own calls to Microsoft APIs use an Entra identity",
      "Application proxy or Private Access with Kerberos SSO to the HTTP SPN"],
  ], { fontSize: 11.5, limit: 6.55 });
  sources(s, "Sources: Guide, \"The workloads, one by one\"; Microsoft Learn, \"Microsoft Entra authentication for SQL Server overview.\"");
  notes(s,
`Now the workloads, one by one, each with its target from the service accounts guide's decision path. The SQL Server engine runs as a user account or a G M S A, with an M S S Q L S V C S P N. Its G M S A stays the Windows logon account, and the instance gets an Entra identity: the Arc managed identity on SQL Server 2025, or an app registration with a certificate on 2022. Users and applications then sign in with Entra logins; Microsoft Learn lists non-interactive mechanisms including managed identities for SQL Server's Entra authentication. Users reach it through Private Access, but the engine's Kerberos stays on the island until its logins are Entra-only. Applications that call SQL Server run as a user account or a G M S A with a Windows login. Their target is a managed identity, or a service principal with a certificate, with an Entra login in SQL Server, so the connection moves from Kerberos to an Entra token. That's server to server, so it's not in the SASE path. I I S sites and application pools run as a user account or a G M S A with an H T T P S P N. Their target is a G M S A now, and a managed identity when the site moves to Azure. Users sign in with Entra through application proxy or Private Access, with Kerberos single sign-on to the H T T P S P N, and the pool's own calls to Microsoft A P Is use an Entra identity.`,
  `${G} — "The workloads, one by one" (SQL Server engine, applications that call SQL Server, IIS); Data Platform: SQL Server Identity — "What Arc Provides to SQL Server," "The Four-Class Pattern Applied to SQL-Consuming Applications"; Identity — "Building the Entra ID Target"; Microsoft Learn — "Microsoft Entra authentication for SQL Server overview."`);
}

// ================================================================== 7 Workloads, part 2
{
  const s = content(SWHO, "The workloads: tasks, Linux, AWS GovCloud (US) and OCI");
  tag(s, "Who");
  table(s, "Work2", 1.4, WCOLS, WHEAD, [
    ["Scheduled tasks and Windows services", "A user account, often with a password that never expires",
      "gMSA now; an Azure Automation runbook with a managed identity once moved",
      "The password goes; the identity moves to Entra only when the job does", "Not in the SASE path"],
    ["RHEL and other Linux services", "An AD-joined host (SSSD and realmd) with a keytab, or Red Hat's \"Managed Service Account\" (adcli create-msa)",
      "The platform's workload identity: an IAM role on EC2, an instance principal on OCI, the Arc managed identity for calls to Azure",
      "A keytab on disk is a long-lived Kerberos key, unlike a gMSA; the platform identity has no stored secret",
      "Operators sign in with Entra ID; the workload isn't in the SASE path"],
    ["AWS GovCloud (US) workloads", "IAM roles, or IAM users with access keys",
      "An IAM role; to call Microsoft APIs, a federated credential once tested (WD-171)",
      "Temporary credentials; keys are exceptions", "People reach AWS through IAM Identity Center federated with Entra"],
    ["OCI workloads", "Instance, resource or workload principals, or users with API keys",
      "A principal; keys are exceptions (WD-171)", "No stored secret", "People reach OCI through its identity domain federated with Entra"],
  ], { fontSize: 11, limit: 6.55 });
  sources(s, "Sources: Guide, \"The workloads, one by one\" (WD-171); Red Hat, Integrating RHEL systems directly with Windows Active Directory; NPI implementation guide, Steps 1g and 1h.");
  notes(s,
`Scheduled tasks and Windows services often run as a user account with a password that never expires. Their target is a G M S A now, and an Azure Automation runbook with a managed identity once the job moves. The password goes; the identity moves to Entra only when the job does. They're not in the SASE path. Red Hat Enterprise Linux and other Linux services run on an Active Directory-joined host, with S S S D and realm D and a keytab, or with Red Hat's own Managed Service Account, made with A D C L I create M S A. Their target is the platform's workload identity: an I A M role on E C 2, an instance principal on O C I, or the Arc managed identity for calls to Azure. A keytab on disk is a long-lived Kerberos key, unlike a Windows G M S A; the platform identity has no stored secret. Workloads in AWS GovCloud U S run as I A M roles, or as I A M users with access keys. Their target is an I A M role, and to call Microsoft A P Is, a federated credential, once it's tested; that's the program's decision W D one seventy-one. They get temporary credentials, with keys as exceptions, and people reach AWS through I A M Identity Center federated with Entra. O C I workloads use instance, resource or workload principals, or users with A P I keys. The target is a principal, with keys as exceptions, so there's no stored secret, and people reach O C I through its identity domain federated with Entra.`,
  `${G} — "The workloads, one by one" (scheduled tasks and Windows services, RHEL and other Linux, AWS GovCloud (US), OCI); decision register — WD-171; Non-Person Identity implementation guide — Steps 1g and 1h; Red Hat — "Integrating RHEL systems directly with Windows Active Directory."`);
}

// ================================================================== 8 Linux sign-in
{
  const s = content(SWHO, "RHEL and Linux: a keytab, and Entra sign-in for people");
  tag(s, "Who");
  const w = 5.95;
  const p1 = panel(s, "Keytab", 0.6, 1.45, w, null, HEX.red, HEX.redTint, "RED HAT'S \"MANAGED SERVICE ACCOUNT\"", null, [
    "Red Hat recommends joining a RHEL host to AD with SSSD and realm",
    "Its MSA is an AD account \"that corresponds to a specific computer\", created with adcli create-msa",
    "Its Kerberos key is written to a keytab on the host",
    "Unlike a Windows gMSA, the key sits in a file: a long-lived secret to protect and rotate",
  ], 13);
  const p2 = panel(s, "SSH", 0.6 + w + 0.25, 1.45, w, null, HEX.teal, HEX.tealTint, "ENTRA ID SIGN-IN FOR SSH, FOR PEOPLE", null, [
    "On Azure Linux VMs and on Azure Arc-enabled Linux servers",
    "Microsoft Learn lists RHEL 7.4 to 7.9, 8.3 and later, 9.0 and later, and 10.1 as supported",
  ], 13);
  callout(s, "Arc", Math.max(p1, p2) + 0.3, 1.2, "FaCloud", HEX.navy, "Design guidance: ",
    "an RHEL instance in AWS GovCloud (US) or OCI that's onboarded to Arc can use the same Entra sign-in, so operators keep one identity across clouds.");
  sources(s, "Sources: Guide, \"RHEL and Linux sign-in\"; Red Hat, Integrating RHEL systems directly with Windows AD, ch. 1 and 5; Microsoft Learn, Entra ID and OpenSSH sign-in for Linux.");
  notes(s,
`Linux deserves a closer look. Red Hat recommends joining a R H E L host to Active Directory with S S S D and realm. Its Managed Service Account is an Active Directory account that corresponds to a specific computer, created with A D C L I create M S A, and its Kerberos key is written to a keytab on the host. That's a different thing from a Windows G M S A. The key sits in a file, so it's a long-lived secret to protect and rotate. For people, Microsoft Learn says Entra I D can be the sign-in for S S H on Azure Linux virtual machines and on Azure Arc-enabled Linux servers, and it lists R H E L seven point four to seven point nine, eight point three and later, nine point oh and later, and ten point one as supported. An R H E L instance in AWS GovCloud U S or O C I that's onboarded to Arc can use the same Entra sign-in, so operators keep one identity across clouds. That's design guidance, and the Arc track guide covers onboarding other clouds' servers to Arc.`,
  `${G} — "RHEL and Linux sign-in"; Azure Arc Track: Implementation Guide; Red Hat — "Integrating RHEL systems directly with Windows Active Directory," RHEL 9, chapters 1 and 5; Microsoft Learn — "Sign in to a Linux virtual machine in Azure by using Microsoft Entra ID and OpenSSH."`);
}
endModule(SWHO);

// ================================================================== 9 Certificate map, part 1
const CCOLS = [2.75, 2.2, 1.85, 3.15, 2.2];
const CHEAD = ["From (today)", "To (Entra target)", "Certificates before", "Certificates after", "Who issues and renews"];
{
  const s = content(SHOW, "The certificate map: SQL Server and IIS");
  tag(s, "How");
  const tb = table(s, "Cert1", 1.4, CCOLS, CHEAD, [
    ["SQL Server engine as a user account or gMSA, MSSQLSvc SPN, Windows logins", "Same engine account, Entra logins added",
      "Optional TLS certificate; Kerberos needs none",
      "A CA-issued TLS certificate on every instance that takes Entra logins, with the service account able to read its key",
      "CyberArk Certificate Manager, from the program's AD CS"],
    ["SQL Server 2022 instance", "Its Entra identity", "None", "An app-registration certificate in Key Vault", "Key Vault and the Arc extension, when service-managed"],
    ["SQL Server 2025 instance", "The Arc managed identity", "None", "None", "Azure"],
    ["IIS pool as a user account or gMSA, HTTP SPN", "Published through application proxy or Private Access with Kerberos SSO",
      "The site's TLS certificate", "The same site certificate; the connector reaches the SPN with Kerberos, no new certificate",
      "CyberArk Certificate Manager for the site; Microsoft for the application proxy endpoint"],
  ], { fontSize: 11.5, limit: 5.7 });
  line(s, "NoCert", "An SPN needs no certificate. Certificates change shape, not count.", tb + 0.2, 0.4, 14);
  sources(s, "Sources: Guide, \"The certificate map\"; \"Where SQL Server Touches AD CS\"; \"Device and User Certificates\"; Certificates, Tokens and Keys Across the Hybrid Estate.");
  notes(s,
`Moving a service account or its S P N to Entra changes which certificates exist. Each row starts from what the workload holds today, and an S P N needs no certificate, as the service accounts guide explains. Start with SQL Server. An engine running as a user account or a G M S A, with Windows logins, has an optional T L S certificate; Kerberos needs none. Add Entra logins, and every instance that takes them needs a T L S certificate issued by a certificate authority, with the service account able to read its key. CyberArk Certificate Manager issues and renews it, from the program's Active Directory Certificate Services. A SQL Server 2022 instance's Entra identity adds an app-registration certificate in Key Vault, which Key Vault and the Arc extension handle when it's service-managed. A SQL Server 2025 instance uses the Arc managed identity: no certificate before, none after, and Azure handles it. An I I S pool published through application proxy or Private Access with Kerberos single sign-on keeps the same site certificate. The connector reaches the S P N with Kerberos, so there's no new certificate. CyberArk Certificate Manager handles the site's certificate, and Microsoft handles the application proxy endpoint.`,
  `${G} — "The certificate map" (SQL Server and IIS rows); Service Accounts guide — "Passwords, certificates or neither," "SPNs and service accounts"; Data Platform: SQL Server Identity — "Where SQL Server Touches AD CS"; PKI — "Device and User Certificates: Intune and Entra CBA"; explainer — "Certificates, Tokens and Keys Across the Hybrid Estate."`);
}

// ================================================================== 10 Certificate map, part 2
{
  const s = content(SHOW, "The certificate map: Graph callers, AWS and RHEL");
  tag(s, "How");
  const tb = table(s, "Cert2", 1.4, CCOLS, CHEAD, [
    ["An application calling Graph as a user account", "An app registration", "None", "An app-registration certificate, at most 180 days", "The owner, or Key Vault's renewal"],
    ["An application calling Graph as a user account, on Azure or Arc", "A managed identity", "None", "None", "Azure"],
    ["A workload outside AWS using an IAM user's key", "IAM Roles Anywhere", "None (a secret key)", "An X.509 certificate from the program's PKI", "The certificate platform; GovCloud needs CRLs imported"],
    ["A RHEL host's AD keytab", "The platform's workload identity", "None (a keytab)", "None for an IAM role or an OCI principal", "AWS or OCI"],
  ], { fontSize: 12, limit: 5.3 });
  const w = 5.95;
  const p1 = panel(s, "None", 0.6, tb + 0.25, w, null, HEX.teal, HEX.tealTint, "NO CERTIFICATE AFTER", null, [
    "A managed identity, an IAM role or an OCI principal",
  ], 12.5);
  const p2 = panel(s, "Some", 0.6 + w + 0.25, tb + 0.25, w, null, HEX.amber, HEX.amberTint, "A CERTIFICATE AFTER", null, [
    "An app registration (at most 180 days), and IAM Roles Anywhere",
  ], 12.5);
  if (process.env.FIT) console.log(`  cert panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Guide, \"The certificate map\"; \"Applications, Secrets and Configuration Drift\" (secrets governance).");
  notes(s,
`Now the rest of the map. An application that calls Microsoft Graph as a user account, moved to an app registration, gains an app-registration certificate, at most a hundred and eighty days, renewed by its owner or by Key Vault. The same application on Azure or on an Arc-enabled server moves to a managed identity instead: none before, none after, and Azure handles it. A workload outside AWS that uses an I A M user's secret key can move to I A M Roles Anywhere, which needs an X dot five-oh-nine certificate from the program's public key infrastructure. The certificate platform issues it, and GovCloud needs certificate revocation lists imported. And a R H E L host's Active Directory keytab, moved to the platform's workload identity, needs no certificate at all for an I A M role or an O C I principal; AWS or O C I handles it. So certificates change shape, not count. A managed identity, an I A M role and an O C I principal need none; an app registration and Roles Anywhere each need a certificate.`,
  `${G} — "The certificate map" (Graph, AWS and RHEL rows); Governance — "Applications, Secrets and Configuration Drift," secrets governance.`);
}

// ================================================================== 11 NTLM
{
  const s = content(SHOW, "NTLM: the program's date, and Microsoft's position");
  tag(s, "How");
  const w = 3.9, g = 0.225;
  const p1 = panel(s, "Date", 0.6, 1.45, w, null, HEX.red, HEX.redTint, "APRIL 1, 2027 (WD-027)", null, [
    "The program's NTLM backstop: its own date, not an external deadline",
    "After it, an account kept in AD (Keep or KeepKerberos) uses Kerberos only, never NTLM",
    "Its end date still follows WD-165",
  ], 13);
  const p2 = panel(s, "Learn", 0.6 + w + g, 1.45, w, null, HEX.navy, HEX.navyTint, "MICROSOFT'S POSITION", null, [
    "NTLM \"is still supported\"",
    "Kerberos \"is the preferred authentication method\"",
  ], 13);
  const p3 = panel(s, "Fallback", 0.6 + 2 * (w + g), 1.45, w, null, HEX.amber, HEX.amberTint, "THE QUIET FALLBACK", null, [
    "An SPN that's missing or on the wrong account is the usual way a service falls back to NTLM",
    "Without anyone choosing it",
  ], 13);
  callout(s, "Check", Math.max(p1, p2, p3) + 0.3, 0.95, "FaListCheck", HEX.navy, "Checklist: ",
    "no service account uses NTLM after April 1, 2027 (WD-027).");
  sources(s, "Sources: Guide, \"NTLM\" (WD-027, WD-165); Microsoft Learn, \"NTLM overview in Windows Server\"; Service Accounts guide, \"SPNs and service accounts.\"");
  notes(s,
`N T L M. The program's backstop for N T L M is April first, 2027. It's the program's own date, not an external deadline; that's decision W D twenty-seven. It applies to service accounts too. After that date, an account kept in Active Directory, as Keep or Keep Kerberos, authenticates with Kerberos only, never N T L M, and its end date still follows decision W D one sixty-five. Microsoft's own position, on Microsoft Learn, is that N T L M is still supported, and that Kerberos is the preferred authentication method. And watch for the quiet failure. An S P N that's missing, or on the wrong account, is the usual way a service falls back to N T L M without anyone choosing it.`,
  `${G} — "NTLM," "Checklist"; decision register — WD-027, WD-165; Data Platform: SQL Server Identity; Service Accounts guide — "SPNs and service accounts"; Microsoft Learn — "NTLM overview in Windows Server."`);
}

// ================================================================== 12 Extend Entra ID: people
{
  const s = content(SHOW, "Extend Entra ID across clouds? For people, yes");
  tag(s, "How");
  const y0 = line(s, "Why", "OMB M-22-09: agencies \"must employ centralized identity management systems for agency users\". CISA's Optimal identity store \"securely integrates\" stores \"across all partners and environments\".",
    1.4, 0.75, 14);
  table(s, "People", y0 + 0.15, [2.6, 9.55], ["Where", "Entra ID as the one store for the program's people"], [
    ["AWS GovCloud (US)", "IAM Identity Center connects \"your existing identity provider\", and runs in GovCloud with FIPS endpoints and aws-us-gov ARNs. Human access in \"Privileged Roles and Tiers\" already uses its permission sets"],
    ["OCI", "Oracle documents single sign-on and identity lifecycle management between OCI IAM and Microsoft Entra ID, for tenancies with identity domains. The program's OC2 tenancy has to confirm it has identity domains"],
    ["Linux hosts", "Entra sign-in for SSH on Azure and Arc-enabled Linux, RHEL included"],
  ], { fontSize: 12.5, limit: 6.55 });
  sources(s, "Sources: Guide, \"Should agencies extend Microsoft Entra ID across clouds?\"; OMB M-22-09, III.A; CISA ZTMM v2.0; AWS, IAM Identity Center in GovCloud (US); Oracle, SSO with Entra ID.");
  notes(s,
`Should agencies extend Microsoft Entra I D across clouds? For people, yes. O M B memorandum M twenty-two oh-nine says agencies must employ centralized identity management systems for agency users that can be integrated into applications and common platforms. And CISA's Optimal identity store securely integrates stores across all partners and environments. Entra I D can be that one store for the program's people in every cloud it uses. In AWS GovCloud U S, I A M Identity Center connects your existing identity provider, and it runs in GovCloud with FIPS endpoints and A W S U S Gov A R Ns. The program's chapter on privileged roles and tiers already uses its permission sets for human access. In O C I, Oracle documents single sign-on and identity lifecycle management between O C I I A M and Microsoft Entra I D, for tenancies with identity domains. The program's O C two tenancy still has to confirm it has identity domains. And on Linux hosts, Entra sign-in for S S H on Azure and Arc-enabled Linux, R H E L included.`,
  `${G} — "Should agencies extend Microsoft Entra ID across clouds?" (For people); Access & Privilege — "Privileged Roles and Tiers"; Non-Person Identity implementation guide — Step 1h; OMB — M-22-09, section III.A; CISA — Zero Trust Maturity Model, Version 2.0; AWS — "AWS IAM Identity Center in AWS GovCloud (US)"; Oracle — "SSO Between OCI and Microsoft Entra ID," "Identity Lifecycle Management Between OCI IAM and Entra ID."`);
}

// ================================================================== 13 Extend Entra ID: workloads
{
  const s = content(SHOW, "For workloads: no single store; one record instead");
  tag(s, "How");
  const w = 5.95;
  const p1 = panel(s, "Native", 0.6, 1.45, w, null, HEX.teal, HEX.tealTint, "EACH PLATFORM'S OWN IDENTITY", null, [
    "M-22-09's sentence is about agency users",
    "A workload is safest with its own platform's identity: no stored secret, never leaves that platform",
    "An IAM role in AWS, a principal in OCI, a managed identity in Azure",
    "An Entra identity forced onto an AWS workload means a secret or certificate where AWS issues temporary credentials for free",
  ], 12.5);
  const p2 = panel(s, "Record", 0.6 + w + 0.25, 1.45, w, null, HEX.navy, HEX.navyTint, "WHAT THE PROGRAM EXTENDS: GOVERNANCE", null, [
    "One inventory, joined to a system record with two owners and a sponsor",
    "One exception rule for long-lived keys",
    "Federation only where a workload must call across, such as an AWS workload calling Microsoft Graph with a federated credential once tested (WD-171)",
  ], 12.5);
  callout(s, "Split", Math.max(p1, p2) + 0.3, 0.95, "FaScaleBalanced", HEX.navy, "Design guidance: ",
    "this split, people on one identity provider and workloads on native identities, is the program's recommendation.");
  sources(s, "Sources: Guide, \"Should agencies extend Microsoft Entra ID across clouds?\" (For workloads; design guidance; WD-171); NPI implementation guide, Step 1.");
  notes(s,
`For workloads, the answer is no single store; one record instead. M twenty-two oh-nine's sentence is about agency users. A workload is safest with its own platform's identity, which has no stored secret and never leaves that platform: an I A M role in AWS, a principal in O C I, a managed identity in Azure. Forcing an Entra identity onto an AWS workload would mean a secret or a certificate where AWS would issue temporary credentials for free. What the program extends across clouds for workloads is the governance, not the credential. One inventory, joined to a system record with two owners and a sponsor. One exception rule for long-lived keys. And federation between platforms where a workload must call across, such as an AWS workload calling Microsoft Graph with a federated credential, once it's tested; that's decision W D one seventy-one. This split is the program's recommendation, design guidance.`,
  `${G} — "Should agencies extend Microsoft Entra ID across clouds?" (For workloads); Non-Person Identity implementation guide — Step 1; Governance — "Applications, Secrets and Configuration Drift," secrets governance; decision register — WD-171.`);
}

// ================================================================== 14 Dangers
{
  const s = content(SHOW, "Dangers, and how to avoid them");
  tag(s, "How");
  table(s, "Dangers", 1.4, [3.6, 3.8, 4.75], ["Danger", "What goes wrong", "How to avoid it"], [
    ["Counting a gMSA as \"done\" for Zero Trust", "The Identity pillar stays at Traditional for the workload, unseen", "Score kept accounts against the scorecard; the island list carries them to an end date"],
    ["Publishing a Kerberos app through Private Access and forgetting its service account", "The front door is Zero Trust, the back end isn't; an SPN move breaks SSO", "Record the app's service account and SPN with the published app; move the connector's delegation in A5's change"],
    ["Enforcing the domain controller sensor on an SPN a service uses", "Service-to-service Kerberos is blocked", "Start in audit, add SPN exclusions to the exception register, then enforce"],
    ["Treating a RHEL keytab like a gMSA", "A long-lived key on disk goes unrotated", "Inventory keytabs as secrets; move the workload to its platform identity"],
    ["One Entra identity for every cloud's workloads", "Secrets or certificates where the platform would issue temporary credentials", "Native workload identities, one governance record, federation only to cross platforms"],
  ], { fontSize: 12.5, limit: 6.55 });
  sources(s, "Sources: Guide, \"Dangers and how to avoid them\"; Global Secure Access implementation guide, Step 10.");
  notes(s,
`The guide lists five dangers. Counting a G M S A as done for Zero Trust leaves the Identity pillar at Traditional for that workload, unseen: score kept accounts against the scorecard, and let the island list carry them to an end date. Publishing a Kerberos application through Private Access and forgetting its service account leaves the back end outside Zero Trust, and an S P N move breaks single sign-on: record the application's service account and S P N with the published app, and move the connector's delegation in step A5's change. Enforcing the domain controller sensor on an S P N a service uses blocks service-to-service Kerberos: start in audit, add S P N exclusions to the exception register, then enforce. Treating a R H E L keytab like a G M S A leaves a long-lived key on disk unrotated: inventory keytabs as secrets, and move the workload to its platform identity. And one Entra identity for every cloud's workloads puts secrets or certificates where the platform would issue temporary credentials: use native workload identities, one governance record, and federation only to cross platforms.`,
  `${G} — "Dangers and how to avoid them"; Global Secure Access implementation guide — Step 10, privileged protocols.`);
}

// ================================================================== 15 Checklist
{
  const s = content(SHOW, "Checklist, and back to the track");
  tag(s, "How");
  const p1 = panel(s, "List", 0.6, 1.45, FULL, null, HEX.navy, HEX.navyTint, "THE GUIDE'S CHECKLIST", null, [
    "Every account kept on Kerberos is scored against the Identity pillar, with its end date and owner",
    "Every Kerberos app published through Private Access or application proxy names its service account and SPN, and the connector's delegation entry moved with any SPN",
    "SPN exclusions for service-to-service Kerberos are in the exception register before the domain controller sensor is enforced",
    "Every SQL Server instance that takes Entra logins has a CA-issued TLS certificate the service account can read",
    "No service account uses NTLM after April 1, 2027 (WD-027)",
    "Program people sign in to AWS, OCI and Linux hosts with Entra ID; workloads use their platform's identity, each joined to a record",
  ], 13);
  callout(s, "Track", p1 + 0.3, 0.95, "FaRoute", HEX.teal, "Back to the track: ",
    "Non-Person Identity: An Implementation Guide, and Service Accounts, for the moves themselves.");
  sources(s, "Sources: Guide, \"Checklist,\" \"Back to the track\" (WD-027).");
  notes(s,
`To close, the guide's checklist. Every account kept on Kerberos is scored against the Identity pillar, with its end date and owner. Every Kerberos application published through Private Access or application proxy names its service account and S P N, and the connector's delegation entry moves with any S P N. S P N exclusions for service-to-service Kerberos are in the exception register before the domain controller sensor is enforced. Every SQL Server instance that takes Entra logins has a T L S certificate from a certificate authority, which the service account can read. No service account uses N T L M after April first, 2027. And the program's people sign in to AWS, O C I and Linux hosts with Entra I D, while workloads use their platform's identity, each joined to a record. For the moves themselves, go back to the track: the Non-Person Identity implementation guide, and the service accounts guide. Thank you.`,
  `${G} — "Checklist," "Back to the track"; Non-Person Identity: An Implementation Guide; Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities.`);
}
endModule(SHOW);

// ================================================================== Backup
backup();
sourceSlide("Sources: the guide, CISA and Microsoft Learn", [
  "Non-Person Identity: Zero Trust, SASE and Other Clouds (companion guide): \"The answer in brief,\" \"The Zero Trust scorecard,\" \"What SASE does and doesn't do,\" \"The workloads, one by one,\" \"RHEL and Linux sign-in,\" \"The certificate map,\" \"NTLM,\" \"Should agencies extend Microsoft Entra ID across clouds?,\" \"Dangers,\" \"Checklist.\" Program decisions WD-027, WD-165 and WD-171 (decision register).",
  "CISA, Zero Trust Maturity Model, Version 2.0, April 2023, section 5.1, \"Identity,\" and Table 2 (read November 24, 2026; CISA's landing page for the model is now marked archived).",
  "Microsoft Learn, read November 24, 2026: Microsoft Entra Conditional Access for workload identities; Kerberos Constrained Delegation for SSO to your apps with application proxy; Use Kerberos for SSO with Microsoft Entra Private Access; Configure Microsoft Entra Private Access for Active Directory Domain Controllers; Learn about the Global Secure Access clients.",
  "Microsoft Learn, read November 24, 2026: Microsoft Entra authentication for SQL Server overview; Sign in to a Linux virtual machine in Azure by using Microsoft Entra ID and OpenSSH; NTLM overview in Windows Server.",
]);
sourceSlide("Sources: Red Hat, OMB, AWS and Oracle", [
  "Red Hat, Integrating RHEL systems directly with Windows Active Directory, RHEL 9, chapter 1 (SSSD and realmd) and chapter 5, \"Accessing AD with a Managed Service Account\" (read November 24, 2026).",
  "Office of Management and Budget, M-22-09, \"Moving the U.S. Government Toward Zero Trust Cybersecurity Principles,\" January 26, 2022, section III.A (read November 24, 2026).",
  "AWS, AWS GovCloud (US) User Guide, \"AWS IAM Identity Center in AWS GovCloud (US)\" (read November 24, 2026).",
  "Oracle, OCI documentation, \"SSO Between OCI and Microsoft Entra ID\" and \"Identity Lifecycle Management Between OCI IAM and Entra ID\" (tenancies with identity domains; read November 24, 2026).",
  "The track: Non-Person Identity: An Implementation Guide (Steps 1, 1g, 1h); Service Accounts (the decision path, A5, SPNs, credentials); Global Secure Access implementation guide (Step 10); Zero Trust Assessment guide; Azure Arc Track guide.",
]);

finish(OUT);
