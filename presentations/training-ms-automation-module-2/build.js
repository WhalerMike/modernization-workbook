// Microsoft Automation learning path, Module 2: Microsoft Entra ID through Microsoft Graph — the module's narrated deck.
// Teaches docs/training/ms-automation-entra.md, Learn-style: objectives, the concepts, a "Try it" slide with the real
// Lab 1 command and output (run November 1, 2026 in examples/ms-automation), government-cloud differences, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page or the kit;
// the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ms-automation-module-2/build.js \
//                      presentations/training-ms-automation-module-2/Training_MS_Automation_Module_2.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 2: Microsoft Entra ID through Microsoft Graph",
  footer: "Federal Modernization Workbook  ·  Microsoft Automation learning path, Module 2: Microsoft Entra ID through Microsoft Graph",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_MS_Automation_Module_2.pptx";
const M = "Training, Microsoft Automation, Module 2";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SA = "Where agencies are";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: Microsoft Entra ID through Graph", "Microsoft Automation learning path · Reading and evidencing Entra ID, for federal tenants",
    ["Users and groups  ·  Conditional Access  ·  PIM  ·  Applications  ·  Logs and methods", "The five checks  ·  Try it: Lab 1  ·  Where agencies are  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of the Microsoft Automation learning path: Microsoft Entra ID through Microsoft Graph. Book 02 builds the Entra ID target, and Book 04 puts access behind Conditional Access, PIM and application governance. Both ask for evidence a script can collect. In this module you'll map each of those evidence questions to the Graph API that answers it, its least-privileged permission, and the shape of its data. Then you'll run five read-only checks, in Python and PowerShell, against a fictional tenant. They're illustrative: unit-tested against fixtures, not proven against live tenants. Module 1's foundations, the right cloud, sign-in without a secret, and paging, apply throughout.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why script the evidence your ISSO asks for");
  tag(s, "Why");
  const b = table(s, "Asks", 1.45, [5.6, 6.55], ["The monthly question", "Today, too often"], [
    ["Who hasn't signed in?", "Someone clicks through the admin center"],
    ["What do the Conditional Access policies say?", "Screenshots pasted into a document"],
    ["Who holds a privileged role permanently?", "A list nobody can reproduce next month"],
    ["Which applications still have passwords?", "Found when one expires and breaks"],
    ["Who can't yet use phishing-resistant MFA?", "Estimated, not counted"],
  ], { fontSize: 13, limit: 4.9 });
  callout(s, "Point", b + 0.3, 0.95, "FaClipboardCheck", HEX.red, "This module: ",
    "each question becomes a Graph call with a least-privileged permission, and five become read-only checks you can rerun.");
  sources(s, "Sources: Module 2, Unit 1 \"Introduction.\" The \"today\" column is the module's scenario, not a measured finding.");
  notes(s,
`Why script it? Your ISSO asks the same questions every month. Who hasn't signed in? What do the Conditional Access policies say? Who holds a privileged role permanently? Which applications still have passwords? And who can't yet use phishing-resistant multifactor authentication? Too often, someone answers by clicking through the admin center and pasting screenshots, and the answer can't be reproduced next month. In this module each question becomes a Graph call with a least-privileged permission, and five of them become read-only checks you can rerun on a schedule, with output an assessor can diff from one month to the next.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Name the Graph API and least-privileged permission for each Book 02 and Book 04 evidence question",
    "Read sign-in activity, membership, Conditional Access, PIM, credentials and registration, and their traps",
    "Explain why a script checks Entra logs but doesn't keep them",
    "Say which Entra ID features differ in GCC High and DoD",
    "Run the five checks on fixtures, and read each finding against its ScubaGear policy",
  ], [
    "Module 1: clouds, sign-in, paging and throttling",
    "Lab 1: the kit, Python and PowerShell; no tenant",
    "Lab 2: a test tenant with Entra ID P1 or P2",
  ], 95);
  sources(s, "Sources: Module 2, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 9 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about ninety-five minutes with the lab. You'll name the Graph API and least-privileged permission for each of the books' evidence questions. You'll read sign-in activity, group membership, Conditional Access, PIM schedules, application credentials and registration details, and know the trap in each. You'll explain why a script checks Entra's logs but doesn't keep them. You'll say what differs in GCC High and DoD. And you'll run the five checks and read each finding against its ScubaGear policy. You need Module 1 first. Lab 1 needs no tenant; Lab 2 needs a test tenant with Entra ID P1 or P2.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 APIs
{
  const s = content(SC, "Evidence questions mapped to Graph APIs");
  tag(s, "What");
  const b = table(s, "APIs", 1.45, [4.0, 4.6, 3.55], ["Question", "Graph API (v1.0)", "Least-privileged application permission"], [
    ["Who signed in, and when?", "GET /users with $select=...,signInActivity", "User.Read.All, plus AuditLog.Read.All"],
    ["Who is in a group, nested included?", "GET /groups/{id}/transitiveMembers", "GroupMember.ReadBasic.All"],
    ["What do the CA policies say?", "GET /identity/conditionalAccess/policies", "Policy.Read.All"],
    ["Who holds a role now, and until when?", "GET /roleManagement/directory/roleAssignmentSchedules", "RoleAssignmentSchedule.Read.Directory"],
    ["Which apps have secrets or certificates?", "GET /applications with credentials selected", "Application.Read.All"],
    ["Who registered which methods?", "GET /reports/authenticationMethods/userRegistrationDetails", "AuditLog.Read.All"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Clouds", "Every API here is GA in v1.0, and each page lists it in the global service (which GCC uses), L4 (GCC High) and L5 (DoD).", b + 0.25, 0.65, 13.5);
  sources(s, "Sources: Module 2, Unit 2 \"The APIs at a glance\": each API's Microsoft Graph v1.0 reference page and national cloud table (accessed Oct. 25, 2026).");
  notes(s,
`Here are six of the module's sixteen evidence questions, with the Graph call and the least-privileged application permission for each. Who signed in, and when: list users with sign-in activity selected, which needs User dot Read dot All plus AuditLog dot Read dot All. Who's in a group, nested groups included: transitive members, with GroupMember dot ReadBasic dot All. What the Conditional Access policies say: Policy dot Read dot All. Who holds a role now: the role assignment schedules. Which applications have secrets or certificates: Application dot Read dot All. And who registered which authentication methods: the registration details report. Every one of these is generally available in Graph version one point oh, and each page lists it in the global service, which GCC uses, and in the GCC High and DoD clouds.`,
  `${M} — Unit 2 "The APIs at a glance."`);
}

// ================================================================== 5 Users and groups
{
  const s = content(SC, "Sign-in activity and membership: the traps");
  tag(s, "What");
  const l = panel(s, "Users", 0.6, 1.45, 6.3, null, HEX.navy, HEX.navyTint, "USERS AND SIGN-IN ACTIVITY", "Finding dormant accounts", [
    "Use both lastSignInDateTime and lastNonInteractiveSignInDateTime: some users reach resources only through clients",
    "Needs Entra ID P1 or P2 and AuditLog.Read.All",
    "Caps the page at 500 users, against 999",
    "Returned only when named in $select",
  ], 13);
  const r = panel(s, "Groups", 7.15, 1.45, 5.6, null, HEX.teal, HEX.tealTint, "GROUPS AND MEMBERSHIP", "Effective membership", [
    "transitiveMembers includes nested groups; members is direct only",
    "Transitive costs 5 resource units, against 3",
    "GroupMember.ReadBasic.All is enough to read membership",
    "Members you can't read come back with only id and @odata.type",
  ], 13);
  callout(s, "Delta", Math.max(l, r) + 0.3, 0.85, "FaArrowsRotate", HEX.navy, "Change tracking: ",
    "/users/delta follows Module 1's pattern; put every query parameter in the first delta request.");
  sources(s, "Sources: Module 2, Unit 3: Learn, List users; user resource; signInActivity; user delta; List group transitive members (Oct. 25, 2026).");
  notes(s,
`Sign-in activity is how a script finds dormant accounts, and it has traps. Use both dates, the interactive and the non-interactive sign-in, because Microsoft notes some users reach resources only through clients. It needs Entra ID P1 or P2 and the AuditLog dot Read dot All permission. Selecting it caps the page at five hundred users. And it's returned only when you name it in select. For groups, transitive members is effective membership, nested groups included; members is direct only. The transitive call costs five resource units against three. The basic membership read permission is enough, and members of a type you can't read come back with only an ID and a type. For change tracking, the users delta call follows Module 1's pattern.`,
  `${M} — Unit 3 "Users, groups and Conditional Access": "Users and sign-in activity," "Groups and membership."`);
}

// ================================================================== 6 Conditional Access
{
  const s = content(SC, "Conditional Access: read it with one permission");
  tag(s, "What");
  const b = table(s, "States", 1.45, [4.2, 7.95], ["Policy state", "Meaning"], [
    ["enabled", "Enforced"],
    ["enabledForReportingButNotEnforced", "Report-only. Book 04's CA022, phishing-resistant MFA for everyone, starts this way"],
    ["disabled", "Not evaluated"],
  ], { fontSize: 13, limit: 3.4 });
  const l = panel(s, "Read", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "THE COLLECTOR READS", null, [
    "Policy.Read.All, and nothing else",
    "ca-export writes one sorted JSON file per policy, so a change is a readable diff",
  ], 13);
  panel(s, "Write", 6.85, b + 0.25, 5.9, null, HEX.amber, HEX.amberTint, "A PIPELINE WRITES (DESIGN GUIDANCE)", null, [
    "Creating a policy needs Policy.Read.All and Policy.ReadWrite.ConditionalAccess",
    "Book 04, Chapter 10 keeps the policies as code",
  ], 13);
  sources(s, "Sources: Module 2, Unit 3 \"Conditional Access\": Learn, List policies; conditionalAccessPolicy resource; Create conditionalAccessPolicy (Oct. 25, 2026).");
  notes(s,
`Conditional Access is the easiest read in the module: it needs only Policy dot Read dot All. Each policy's state is enabled, disabled, or enabled for reporting but not enforced, which is report-only. Book 04's rollout depends on knowing which policies are report-only; its phishing-resistant policy for everyone starts that way. The collector reads. The ca-export check writes one sorted JSON file per policy, so any change shows up as a readable diff between two exports. Writing is different: creating a policy needs the Conditional Access read-write permission too. Book 04 keeps the policies as code, so as design guidance, a pipeline holds the write permission and the evidence collector holds only the read.`,
  `${M} — Unit 3 "Users, groups and Conditional Access": "Conditional Access."`);
}

// ================================================================== 7 PIM
{
  const s = content(SC, "PIM: eligible, active, and permanent active");
  tag(s, "What");
  const b = table(s, "PIM", 1.45, [3.6, 8.55], ["Read", "What it tells you"], [
    ["roleEligibilitySchedules", "Who may activate a role"],
    ["roleAssignmentSchedules", "Who holds it now: assignmentType Assigned or Activated; memberType Direct, Group or Inherited"],
    ["scheduleInfo.expiration", "type notSpecified, noExpiration, afterDateTime or afterDuration"],
  ], { fontSize: 13, limit: 3.6 });
  callout(s, "Perm", b + 0.25, 1.0, "FaUserShield", HEX.red, "Permanent active: ",
    "an Assigned schedule with no expiration. ScubaGear MS.AAD.7.4v1 forbids it for highly privileged roles.");
  line(s, "Ids", "Built-in role template IDs are stable: Global Administrator 62e90394-69f5-4237-9190-012177145e10.", b + 1.5, 0.45, 13.5);
  line(s, "Writes", "Writes need RoleAssignmentSchedule.ReadWrite.Directory; the collector never asks for it.", b + 2.0, 0.45, 13.5);
  sources(s, "Sources: Module 2, Unit 4: Learn, PIM APIs; List role eligibility and assignment schedules; schedule resource; expirationPattern; built-in roles. ScubaGear aad.md.");
  notes(s,
`Privileged Identity Management's current APIs are under role management slash directory, and two schedules matter. Eligibility schedules say who may activate a role. Assignment schedules say who holds it now. The assignment type is Assigned for a direct assignment, or Activated for an activation, and the member type says whether it's direct, through a group, or inherited. An assignment's end is in its expiration, whose type can be no expiration. Put those together: an Assigned schedule with no expiration is permanent active, which ScubaGear's policy seven point four forbids for highly privileged roles. Role template IDs are stable; Global Administrator's is on the slide. Changes need a read-write permission, which the collector never asks for.`,
  `${M} — Unit 4 "Privileged Identity Management and applications": "Privileged Identity Management."`);
}

// ================================================================== 8 Applications
{
  const s = content(SC, "Application credentials against three ScubaGear rules");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [2.6, 9.55], ["ScubaGear", "Rule the dates can test"], [
    ["MS.AAD.5.5v1", "No application passwords (secrets)"],
    ["MS.AAD.5.6v1", "Passwords valid for at most 180 days"],
    ["MS.AAD.5.7v1", "Certificates valid for at most 365 days"],
  ], { fontSize: 13.5, limit: 3.4 });
  const l = panel(s, "Dates", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "WHERE THE DATES ARE", null, [
    "passwordCredentials (secrets) and keyCredentials (certificates)",
    "Each carries startDateTime and endDateTime, in UTC",
    "App management policies enforce the limits going forward; the check finds what came before",
  ], 13);
  panel(s, "Consent", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "CONSENT REVIEW", null, [
    "appRoleAssignedTo: who has been given an app's roles",
    "oauth2PermissionGrants: delegated grants; Directory.Read.All",
  ], 13);
  sources(s, "Sources: Module 2, Unit 4: Learn, passwordCredential; keyCredential; List applications; appRoleAssignedTo; oAuth2PermissionGrants (Oct. 25, 2026). ScubaGear aad.md.");
  notes(s,
`An application's secrets and certificates each carry a start and an end date, in U T C, and those dates are enough to test ScubaGear's three application rules: no application passwords, passwords valid for at most a hundred eighty days, and certificates valid for at most three hundred sixty-five days. Microsoft's app management policies enforce the same limits going forward; the check finds what existed before they were turned on. Two related reads support consent review: who has been given an application's roles, and which delegated permissions have been consented, which needs Directory dot Read dot All.`,
  `${M} — Unit 4 "Privileged Identity Management and applications": "Applications and their credentials."`);
}

// ================================================================== 9 Logs and methods
{
  const s = content(SC, "Logs, retention, and authentication methods");
  tag(s, "What");
  const l = panel(s, "Logs", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "LOGS AND RETENTION", "Check logs; don't keep them here", [
    "Audits and sign-ins need AuditLog.Read.All",
    "appliedConditionalAccessPolicies needs permission to read CA data",
    "Entra keeps them 7 days on Free, 30 days with P1 or P2",
    "So MS.AAD.4.1v1 sends the logs to the SOC",
  ], 13);
  const r = panel(s, "Methods", 6.85, 1.45, 5.9, null, HEX.navy, HEX.navyTint, "AUTHENTICATION METHODS", "Progress toward phishing-resistant MFA", [
    "userRegistrationDetails: isMfaRegistered, isAdmin, userType, methodsRegistered",
    "methodsRegistered is documented only by example",
    "Confirm the method names against a real report (inference)",
  ], 13);
  callout(s, "Gov", Math.max(l, r) + 0.3, 0.85, "FaKey", HEX.navy, "One user's methods: ",
    "UserAuthenticationMethod.Read.All. Not in the China cloud; available in GCC High and DoD.");
  sources(s, "Sources: Module 2, Unit 5: Learn, List directoryAudits; List signIns; Entra data retention; userRegistrationDetails; List methods (Oct. 25, 2026).");
  notes(s,
`Logs first. Directory audits and sign-ins both need AuditLog dot Read dot All, and the Conditional Access policies applied to a sign-in show up only for callers allowed to read Conditional Access data. Entra keeps audit and sign-in logs for seven days on the free tier and thirty days with P1 or P2. That's why ScubaGear requires sending the logs to the security operations center. A Graph script checks logs; it doesn't keep them. Authentication methods: the registration details report gives one row per user, with MFA registration, admin status, user type and the methods registered. One caution: Microsoft documents the method names only by example, so a count of phishing-resistant users has to choose which names to count, and should be confirmed against a real report.`,
  `${M} — Unit 5 "Logs and authentication methods."`);
}

// ================================================================== 10 Five checks
{
  const s = content(SC, "The five checks, and a reader's permissions");
  tag(s, "How");
  const b = table(s, "Checks", 1.45, [2.4, 5.6, 4.15], ["Check", "What it reports", "ScubaGear"], [
    ["stale-users", "Enabled members idle 90 days; never-signed-in accounts older than 90 days", "Supports Book 02's lifecycle"],
    ["ca-export", "Every policy as sorted JSON; counts by state", "MS.AAD.1.1, 2.1, 2.3, 3.1, 3.6 settings"],
    ["pim-report", "Global Administrator count; permanent active privileged assignments", "MS.AAD.7.1v1, 7.4v1"],
    ["app-credentials", "Every secret and certificate, lifetime and days to expiry", "MS.AAD.5.5v1, 5.6v1, 5.7v1"],
    ["mfa-registration", "Members without MFA or a phishing-resistant method; admins without one", "Toward MS.AAD.3.1v1, 3.6v1"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Reader", b + 0.25, 1.0, "FaLock", HEX.teal, "A reader's set: ",
    "User.Read.All, AuditLog.Read.All, Policy.Read.All, three role-management reads, Application.Read.All. None can change the tenant.");
  sources(s, "Sources: Module 2, Unit 7 \"The five checks\"; examples/ms-automation README and graph-calls.json.");
  notes(s,
`Five of those reads are built as checks. Stale-users lists enabled members with no sign-in of either kind in ninety days, and never-signed-in accounts older than that. Ca-export writes every policy as sorted JSON with counts by state, evidence for ScubaGear's Conditional Access settings. Pim-report counts Global Administrators and lists every permanent active assignment to a role you name as privileged, for policies seven point one and seven point four. App-credentials lists every secret and certificate with its lifetime and days to expiry. And mfa-registration counts members without MFA or without a phishing-resistant method, and names administrators without one. The permissions for all five are a reader's set. None of them can change the tenant, and you grant only the ones for the checks you run.`,
  `${M} — Unit 7 "The five checks."`);
}
endModule(SC);

// ================================================================== 11 Try it
{
  const s = content(SL, "Try it: find permanent privileged assignments");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 7.6, [
    "# Lab 1, step 3, in examples/ms-automation",
    "$ python python/entra_tasks.py \\",
    "    --from-json tests/fixtures/pim.json pim-report \\",
    "    --role e8611ab8-c189-46e8-94e1-60213ab1f814",
    "{",
    "  \"globalAdministrators\": 3,",
    "  \"MS.AAD.7.1v1\": \"pass\",",
    "  \"permanentActive\": [",
    "    { \"principalId\": \"bg1\",",
    "      \"role\": \"Global Administrator\", ... },",
    "    { \"principalId\": \"x9\",",
    "      \"role\": \"Privileged Role Administrator\", ... }",
    "  ],",
    "  \"MS.AAD.7.4v1\": \"fail\"",
    "}",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 1, 2026 (TRIMMED)", pt: 11.5 });
  panel(s, "Read", 8.45, 1.45, 4.3, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "--role adds Privileged Role Administrator; Global Administrator is always included",
    "3 Global Administrators is within 2 to 8: 7.1 passes",
    "2 permanent active assignments: 7.4 fails",
    "PowerShell's Test-FmwPim returns the same JSON",
  ], 13);
  line(s, "More", "The lab runs all five checks; stale-users uses the later of the two sign-in dates.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 2, Unit 8 \"Exercise: Lab 1,\" steps 3 and 6; examples/ms-automation: entra_tasks.py, FmwGraph.psm1, tests/fixtures/pim.json.");
  notes(s,
`Try it. In the lab, you run each check against a fictional tenant with the from-json option, which evaluates a saved Graph response instead of calling Graph. Here's step three: the PIM report, with the Privileged Role Administrator role added. Global Administrator is always included. The fixture has three Global Administrators, which is within two to eight, so policy seven point one passes. But two principals hold privileged roles permanently, with no expiration, so policy seven point four fails. The PowerShell function returns exactly the same JSON, and the Pester tests compare every PowerShell check with the Python results, so the two can't drift apart. The lab runs all five checks this way.`,
  `${M} — Unit 8 "Exercise: Lab 1 (fixtures, no tenant)," steps 3 and 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: run the checks read-only in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production; Entra ID P1 or P2; a Privileged Role Administrator for consent"],
    ["Register", "One app in the tenant's own cloud, certificate credential, no secret"],
    ["Grant", "Only the read permissions for the checks you run, from graph-calls.json"],
    ["Run", "entra_tasks.py --cloud gcc --tenant <id> --client <app-id> --cert app.pem pim-report; or Invoke-FmwEntraTask"],
    ["Compare", "With the admin center: PIM, Conditional Access, App registrations, the registration report"],
    ["Back it out", "Remove the permissions; delete the app registration, its certificate and the saved output"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "a missing permission stops the run before any Graph call; an extra one prints a warning.");
  sources(s, "Sources: Module 2, Unit 9 \"Exercise: Lab 2\"; examples/ms-automation README, \"Run it\" and \"Known limits.\"");
  notes(s,
`Lab 2 runs the same checks read-only against your own test tenant, worldwide or GCC, never production, with Entra ID P1 or P2 for sign-in and PIM data. Register one app in the tenant's own cloud with a certificate, and grant only the read permissions for the checks you run; the module lists them per check, straight from graph-calls dot JSON. Run each task in Python, or connect in PowerShell and run the same task there. The client checks the token first: a missing permission stops the run before any Graph call, and an extra one prints a warning. Compare each result with the admin center. Then back it out: remove the permissions, delete the app registration and its certificate, and delete the saved output, which holds user names and policies. The authors haven't run Lab 2.`,
  `${M} — Unit 9 "Exercise: Lab 2 (your test tenant)."`);
}
endModule(SL);

// ================================================================== 13 Where agencies are
{
  const s = content(SA, "Where agencies are: Entra ID in GCC High and DoD");
  tag(s, "Who");
  const b = table(s, "Gov", 1.45, [2.2, 9.95], ["Status", "Microsoft's US Government feature table for Entra ID, January 2026"], [
    ["Available", "Conditional Access; PIM; access reviews; entitlement management; Lifecycle Workflows; ID Protection risky-account reports"],
    ["Partial", "HR-driven provisioning, which depends on the HR app"],
    ["Not available", "The My Staff portal; the Microsoft Entra threat intelligence risk detection"],
  ], { fontSize: 12.5, limit: 3.6 });
  const l = panel(s, "Trusted", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "AZURE GOVERNMENT", null, [
    "MFA's Trusted IPs isn't supported; use Conditional Access named locations",
    "So ca-export's named locations hold network-based exceptions",
    "GCC uses the commercial Entra ID service: the table doesn't apply",
  ], 12.5);
  panel(s, "Interim", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "INTERIM PATHS (DESIGN GUIDANCE)", null, [
    "Schedule mfa-registration while CA022 stays report-only",
    "Move each permanent assignment to eligible, then rerun pim-report",
    "Replace app secrets; route logs out of Entra first",
  ], 12.5);
  sources(s, "Sources: Module 2, Unit 6: Learn, Entra feature availability (Oct. 25, 2026); Compare Azure Government and global Azure, Identity (read Nov. 1, 2026).");
  notes(s,
`Where are agencies? Most on this path run a GCC tenant synchronized from Active Directory, with some Conditional Access policies still report-only, permanent role assignments left from before PIM, and applications that still hold secrets. The APIs are the same in GCC High and DoD; the endpoints differ, and so do some features. Microsoft's U S Government feature table lists Conditional Access, PIM, access reviews, entitlement management and Lifecycle Workflows as available, HR-driven provisioning as partial, and two features as not available. GCC uses the commercial Entra service, so the table doesn't apply to it. One Azure Government difference matters for the export: multifactor authentication's Trusted IPs isn't supported there, so network-based exceptions live in Conditional Access named locations. The interim paths are on the right.`,
  `${M} — Unit 6 "Where agencies are."`);
}
endModule(SA);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Entra ID");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.2, 8.95], ["Requirement", "What the checks evidence"], [
    ["BOD 25-01", "ScubaGear's mandatory Entra ID policies, with continuous reporting: CA settings, 7.1v1, 7.4v1, 3.1v1, 3.6v1"],
    ["NIST SP 800-53", "AC-2 account management; AC-6(5) privileged accounts; IA-2(1), IA-2(2) MFA; CA-7 monitoring"],
    ["OMB M-22-09", "Phishing-resistant MFA for agency staff: mfa-registration measures progress"],
  ], { fontSize: 12.5, limit: 3.8 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "Each check's dated output, with the app's permissions and consent record",
    "The ca-export folder in Git, so every policy change is a diff",
    "PIM and credential findings, with the change records that closed them; ScubaGear results beside them",
  ], 13);
  sources(s, "Sources: Module 2, Unit 1 \"The federal requirement\"; Unit 11 \"Summary\"; Book 02, Appendix A (BOD 25-01; OMB M-22-09; NIST mapping).");
  notes(s,
`The federal requirement. BOD 25-01 makes ScubaGear's mandatory Entra ID policies required for in-scope tenants, with continuous reporting to CISA. Four of the checks produce evidence for those: the Conditional Access settings, the Global Administrator count, permanent privileged assignments, and phishing-resistant registration. In NIST special publication eight hundred fifty-three terms, that's account management, A C two; least privilege for privileged accounts; multifactor authentication; and continuous monitoring. M-22-09's phishing-resistant requirement is what the registration check measures progress toward. Book 02's Appendix A has which policies are mandatory, and the mapping. The evidence an ISSO keeps: each check's dated output with the app's permissions, the Conditional Access export in Git, and the findings with the change records that closed them.`,
  `${M} — Unit 1 "The federal requirement"; Unit 11 "Summary"; Book 02, Appendix A — "CISA BOD 25-01 and the SCuBA baselines," "OMB M-22-09."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on Entra ID", [
    { q: "An Assigned role schedule has an expiration type of noExpiration. What is it?", options: ["a. An eligible assignment", "b. Permanent active, which MS.AAD.7.4v1 forbids for highly privileged roles", "c. An activation that ends after its duration"] },
    { q: "Why doesn't a Graph script replace sending logs to the SOC?", options: ["a. Entra keeps audit and sign-in logs for at most 30 days, with P1 or P2", "b. Graph can't read sign-in logs", "c. AuditLog.Read.All can't be granted to an app"] },
  ], "1 b: Assigned with no expiration is permanent active. 2 a: 7 days on Free, 30 with P1 or P2.");
  sources(s, "Sources: Module 2, Unit 10 \"Knowledge check,\" questions 2 and 3; Unit 4; Unit 5.");
  notes(s,
`Check yourself with two questions. First: an Assigned role schedule has an expiration type of no expiration. What is it? The answer is b: it's permanent active, which ScubaGear forbids for highly privileged roles. Second: why doesn't a Graph script replace sending the logs to the security operations center? The answer is a. Entra keeps audit and sign-in logs for seven days on the free tier and thirty days with P1 or P2, so the record has to be kept somewhere else. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — Unit 10 "Knowledge check," questions 2 and 3.`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 3, Intune");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Mapped Book 02's and Book 04's evidence questions to Graph APIs and least-privileged permissions",
    "Learned the traps in sign-in activity, membership, PIM, credentials and registration",
    "Saw why a script checks logs but doesn't keep them",
    "Saw what differs in GCC High and DoD",
    "Ran the five checks in Python and PowerShell",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3: Intune through Graph", [
    "Devices, compliance, configuration, Autopilot",
    "v1.0 versus beta",
    "Five checks mapped to NIST SP 800-53 Moderate",
  ], 13.5);
  callout(s, "Pkg", Math.max(l, r) + 0.3, 0.85, "FaFileShield", HEX.teal, "For a period: ",
    "Book 04, Chapter 10 assembles the evidence package.");
  sources(s, "Sources: Module 2, Unit 11 \"Summary\"; Module 3, Unit 1; Book 04, Chapter 10, \"The evidence package for a period.\"");
  notes(s,
`To sum up. You mapped the books' Entra ID evidence questions to Graph APIs and their least-privileged permissions. You learned the traps in sign-in activity, group membership, PIM schedules, application credentials and registration details. You saw why a script checks Entra's logs but doesn't keep them, and what differs in GCC High and DoD. And you ran the five checks in Python and PowerShell. Book 04's Chapter 10 assembles the evidence package for a period. Next is Module 3, Intune through Microsoft Graph: devices, compliance, configuration and Autopilot, which APIs are only in beta, and five checks mapped to NIST special publication eight hundred fifty-three Moderate.`,
  `${M} — Unit 11 "Summary"; Book 04, Chapter 10 — "The evidence package for a period."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/ms-automation-entra.md (Microsoft Automation learning path, Module 2), Units 1 to 11; its footnotes carry each Microsoft Learn page and the date it was read (October 25, 2026; the Trusted IPs difference November 1, 2026).",
  "Microsoft Learn pages the module cites: List users; user delta; user and signInActivity resources; List group transitive members; Conditional Access List policies, namedLocations, Create and resource; PIM APIs; role eligibility and assignment schedules; unifiedRoleAssignmentSchedule; expirationPattern; roleAssignmentScheduleRequests; built-in roles.",
  "Also: List applications; passwordCredential; keyCredential; appRoleAssignedTo; oAuth2PermissionGrants; directoryAudits; signIns; Entra data retention; userRegistrationDetails; authentication methods; authenticationMethodsPolicy; riskyUsers; Entra feature availability in US Government; Compare Azure Government and global Azure (Identity).",
  "CISA ScubaGear Microsoft Entra ID baseline (aad.md): MS.AAD.1.1v1, 2.1v1, 2.3v1, 3.1v1, 3.6v1, 4.1v1, 5.5v1 to 5.7v1, 7.1v1, 7.4v1. Federal requirements by link: Book 02, Appendix A (BOD 25-01; OMB M-22-09; NIST SP 800-53 mapping).",
  "Lab output: examples/ms-automation (entra_tasks.py, FmwGraph.psm1, tests/fixtures), run November 1, 2026 with Python 3.14.3 and PowerShell 7.6.9; the Try it output is trimmed. Lab 2 not run by the authors. Design guidance and inferences are labeled.",
]);

finish(OUT);
