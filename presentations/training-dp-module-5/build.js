// Data Platform and SQL Server Identity learning path, Module 5: Groups, roles and the perimeter — the module's narrated deck.
// Teaches docs/training/data-platform/05-groups-roles-and-the-perimeter.md, Learn-style: objectives, the concepts (one group,
// one role, flat by design; the four AD group patterns; the attribute, PIM and the perimeter), "Try it" slides with the
// module page's Lab 1 commands and expected output, Lab 2, the federal requirement and evidence, a two-question check, and
// the summary. Every fact comes from the module page, workbook Chapter 05 and Runbook R07 that the page sends the learner
// to, or the kit (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-5/build.js \
//                      presentations/training-dp-module-5/Training_DP_Module_5.pptx
const TITLE = "Module 5: Groups, roles and the perimeter";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 5: Groups, roles and the perimeter",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Data Platform and SQL Server Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "DATA PLATFORM AND SQL SERVER IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_DP_Module_5.pptx";
const M = "Training, Data Platform, Module 5";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: Groups, roles and the perimeter", "Data Platform and SQL Server Identity learning path · Runbook R07, with workbook Chapter 05",
    ["One group, one role, flat by design  ·  The attribute, PIM and the perimeter", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 5 of the Data Platform and SQL Server Identity learning path: groups, roles and the perimeter. You sort every Active Directory group that reaches Sequel Server into its Entra replacement, and keep privileged roles off rule-based groups. The module follows runbook R seven, and Chapter 5 of the developer workbook, Building SQL Server Identity. Take it after Module 4.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the groups change keepers, not purpose");
  tag(s, "Why");
  const l = panel(s, "Same", 0.6, 1.45, 5.4, null, HEX.navy, HEX.navyTint, "WHAT SURVIVES", "Group-based access", [
    "Groups still decide who reaches SQL Server",
    "What changes is who keeps each group current, and what stands in front of it",
  ], 13.5);
  const r = panel(s, "Chg", 6.25, 1.45, 6.5, null, HEX.teal, HEX.tealTint, "WHAT CHANGES", "Each kind of group gets its keeper", [
    "Kept by hand from the org chart: becomes a rule",
    "Named administrators: an assigned group under PIM",
    "A distribution list: never becomes a login",
  ], 13.5);
  callout(s, "Task", Math.max(l, r) + 0.3, 1.0, "FaSitemap", HEX.navy, "In this module: ",
    "take every Active Directory group that reaches SQL Server, and say which Entra group replaces it.");
  sources(s, "Sources: Module 5, \"Introduction\"; workbook Chapter 05, \"Goal and audience.\"");
  notes(s,
`Why does this matter? Group-based access survives the move to Entra I D. What changes is who keeps each group current, and what stands in front of it. A group kept by hand from the org chart becomes a rule. A group of named administrators becomes an assigned group under pim. And a distribution list never becomes a login. In this module you take every Active Directory group that reaches Sequel Server, and say which Entra group replaces it.`,
  `${M} — Unit "Introduction"; workbook Chapter 05, "Goal and audience."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Name the four AD group patterns in Data Platform: SQL Server Identity, and the Entra replacement for each",
    "Explain why a dynamic rule reads an HR-maintained code and excludes disabled accounts and guests",
    "Run the kit's group map over fixtures and read its flags for nesting and for a privileged role on a dynamic group",
    "Say which check enforces one group, one role, and why the map doesn't",
  ], [
    "Module 4: its login plan is where the one-group-one-role warning comes from",
    "PowerShell 7 and the kit, unzipped into C:\\FMWLabs",
    "No tenant for Lab 1",
  ], 45);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"Get the code.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll name the four Active Directory group patterns in the data platform book, Data Platform: SQL Server Identity, and the Entra replacement for each. You'll explain why a dynamic rule reads an H R maintained code, and excludes disabled accounts and guests. You'll run the kit's group map over fixtures, and read its flags for nesting and for a privileged role on a dynamic group. And you'll say which check enforces one group, one role, and why the map doesn't. Before you start, finish Module 4: its login plan is where the one-group-one-role warning comes from. Lab 1 needs no tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 One group, one role
{
  const s = content(SC, "One group, one role, flat by design");
  tag(s, "What");
  const l = panel(s, "One", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "ONE GROUP, ONE ROLE", "The group's name says what it grants", [
    "An Entra group reaches SQL Server as a group login, then a database user added to a role",
    "Each group grants exactly one role, on one database, in one environment",
  ], 13.5);
  const r = panel(s, "Flat", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "FLAT BY DESIGN", "Members listed directly", [
    "Dynamic groups can't contain groups",
    "Nesting builds on behavior that is unsupported, ending or undocumented",
    "So members are listed directly, by rule or by assignment",
  ], 13.5);
  callout(s, "Who", Math.max(l, r) + 0.3, 1.2, "FaListCheck", HEX.amber, "Where it's checked: ",
    "the login plan in Module 4 warns when a principal would hold more than one database role. The group map carries grants per instance, not roles per database.");
  sources(s, "Sources: Module 5, Unit 2; Data Platform: SQL Server Identity, Chapter 16; workbook Chapter 05, \"The group map.\"");
  notes(s,
`Unit 2 starts with how a group reaches the engine. An Entra group reaches Sequel Server as a group login, then a database user added to a role. The data platform book's Chapter 16, Groups, Roles and How Membership Reaches the Engine, makes one rule central. Each Entra group grants exactly one role, on one database, in one environment, so the group's name says what it grants. The model stays flat, because dynamic groups can't contain groups, and nesting builds on behavior that is unsupported, ending or undocumented. Members are listed directly, by rule or by assignment. One group, one role is checked where the roles are known: the login plan from Module 4 warns. The group map carries grants per instance, not roles per database, so it doesn't repeat the check.`,
  `${M} — Unit 2 "One group, one role, flat by design"; workbook Chapter 05, "The group map."`);
}

// ================================================================== 5 Four patterns
{
  const s = content(SC, "The four AD group patterns and their Entra targets");
  tag(s, "How");
  const b = table(s, "Pat", 1.45, [1.2, 3.3, 7.65], ["Pattern", "The AD group", "Its Entra target in the kit's map"], [
    ["1", "Organization-derived, kept from the org chart", "Dynamic group, with a rule on the HR organization code in user.extensionAttribute10, plus accountEnabled and userType clauses; never department or jobTitle"],
    ["2", "Explicit role group", "Assigned group, managed by a delegated administrator; eligible through PIM when it holds sysadmin or securityadmin"],
    ["3", "Distribution list", "Mail-only group; update the SQL Server Agent operator address; no login"],
    ["4", "Mail-enabled security group", "Split: a mail-only group and an assigned security group, the pairing recorded in both descriptions"],
  ], { fontSize: 12.5, limit: 5.6 });
  line(s, "Ask", "No organization code recorded? The target says to ask HR for the code before writing the rule, never a guess.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, Unit 2; workbook Chapter 05, \"The group map\"; Runbook R07, \"Mapping to the four-pattern taxonomy.\"");
  notes(s,
`Each legacy group then lands in one of four patterns. Pattern one: organization-derived groups, kept from the org chart, become dynamic. The kit writes the rule on the H R organization code in extension attribute ten, with clauses that require an enabled account and a member, not a guest. Never on department or job title. Pattern two: explicit role groups become assigned, managed by a delegated administrator, and eligible through pim when the group holds sys-admin or security admin. Pattern three: distribution lists become mail-only. Update the Sequel Server Agent operator's address, and give it no login. Pattern four: mail-enabled security groups split in two, a mail-only group and an assigned security group, with the pairing recorded in both descriptions. And when a group's codes aren't recorded, the target says to ask H R for the code before writing the rule.`,
  `${M} — Unit 2; workbook Chapter 05, "The group map"; Runbook R07, "Mapping to the four-pattern taxonomy."`);
}

// ================================================================== 6 Attribute, PIM, perimeter
{
  const s = content(SC, "The attribute, PIM and the perimeter");
  tag(s, "What");
  const a = panel(s, "Attr", 0.6, 1.45, 3.95, null, HEX.navy, HEX.navyTint, "THE ATTRIBUTE", "Is the access control", [
    "Whoever can write the attribute a rule reads controls access",
    "Rules read HR-owned codes, never display strings",
    "Every rule excludes disabled accounts and guests",
  ], 12.5);
  const p = panel(s, "Pim", 4.7, 1.45, 3.95, null, HEX.red, HEX.redTint, "PRIVILEGE", "Never on a rule", [
    "Groups that hold sysadmin are never dynamic",
    "PIM for Groups doesn't work on dynamic or on-premises-synchronized groups",
    "So privileged groups are cloud-only and assigned",
  ], 12.5);
  const c = panel(s, "Ca", 8.8, 1.45, 3.95, null, HEX.teal, HEX.tealTint, "THE PERIMETER", "Conditional Access", [
    "Sits in front of every user token",
    "Applies to users, not to managed identities",
    "Applications: Chapter 07's application chain",
  ], 12.5);
  callout(s, "Dang", Math.max(a, p, c) + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "The danger: ",
    "a privileged role on a dynamic group lets whoever can write the attribute make someone sysadmin.");
  sources(s, "Sources: Module 5, Unit 3; Data Platform: SQL Server Identity, Chapters 16 and 17; Runbook R07; workbook Chapter 05, \"Dangers\"; Microsoft Learn.");
  notes(s,
`Unit 3 is the attribute, pim and the perimeter. Under dynamic membership, whoever can write the attribute a rule reads controls access. So the book's Chapter 17 has rules read H R owned codes, such as the organization code in extension attribute ten, never display strings such as department. And every access rule excludes disabled accounts and guests. Groups that hold sys-admin are never dynamic. Microsoft Learn says pim for Groups doesn't work on dynamic groups, or on groups synchronized from on premises. So privileged groups are cloud-only and assigned. Otherwise, whoever can write the attribute could make someone sys-admin. Conditional Access then sits in front of every user token. But it applies to users, not to managed identities, so applications are covered by the application chain in Chapter 7, not by Conditional Access.`,
  `${M} — Unit 3 "The attribute, PIM and the perimeter"; workbook Chapter 05, "What it leaves to you," "Dangers."`);
}
endModule(SC);

// ================================================================== 7 Try it: map
{
  const s = content(SL, "Try it: map the fictional estate's five groups");
  tag(s, "How");
  const c = code(s, "Map", 0.6, 1.45, 12.15, [
    "$ Set-Location C:\\FMWLabs\\sql-server-identity-code\\sql-server-identity",
    "$ $Run = \"C:\\FMWLabs\\results\\data-platform-05\\lab1\\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')\"   # then New-Item ... $Run",
    "# Step 1: map the fictional estate's groups",
    "$ ./Invoke-SqlGroupMap.ps1 -GroupsPath tests/fixtures/groups/groups.json -OutputPath \"$Run\\groups\"",
    "Group                    Pattern Target ... Flags",
    "CONTOSO\\PayrollUsers           1 Dynamic group, rule (user.extensionAttribute10 -in [\"FIN-PAY\"]) -and (user.accountEnabled -eq true)",
    "                                   -and (user.userType -eq \"Member\"); never department or jobTitle",
    "CONTOSO\\SQL-Admins             2 Assigned group, eligible through PIM (privileged server role)",
    "CONTOSO\\SQL-Agent-Alerts       3 Mail-only group; update the SQL Server Agent operator address; no login",
    "CONTOSO\\ClaimsTeam             4 Split: a mail-only group plus an assigned security group; record the pairing in both descriptions",
    "CONTOSO\\HR-Analysts            1 Dynamic group, rule (user.extensionAttribute10 -in [\"HR-ANL\"]) -and (user.accountEnabled -eq true)",
    "                                   -and (user.userType -eq \"Member\"); never department or jobTitle  nested: flatten (CONTOSO\\HR-Leads)",
    "Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-05/lab1/<run>/groups",
    "Evidence for GROUPS (Map each AD group pattern to its Entra group): AC-2, AC-6; KSI-IAM-ELP",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED: "..." MARKS CUT SPACING; THE TABLE'S DASHED LINE CUT)`, pt: 10 });
  line(s, "Each", "One group of each pattern, and a second dynamic group with a nested group. Every rule carries the code and the exclusions.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" setup and step 1; workbook Chapter 05, Lab 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7, from the kit's folder, on the kit's fictional estate. First, make this run's results folder, named for the time you start, so every run keeps its own results. Step one maps the estate's groups. There's one group of each pattern, and a second dynamic group with a nested group. Contoso payroll users and Contoso H R analysts become dynamic groups, each rule on its own organization code, with the clauses that exclude disabled accounts and guests. Contoso sequel admins becomes an assigned group, eligible through pim. The agent alerts list becomes mail-only, with no login. And the claims team splits in two. Notice the flag on H R analysts: nested, flatten, because it contains H R leads. The rules are long, so PowerShell drops the flags column from the table on screen; step two prints it.`,
  `${M} — Unit "Exercise: Lab 1 (fixtures, no tenant)," setup and step 1; workbook Chapter 05, Lab 1.`);
}

// ================================================================== 8 Try it: grants
{
  const s = content(SL, "Try it: read what each group grants");
  tag(s, "How");
  const c = code(s, "Grant", 0.6, 1.45, 12.15, [
    "# Step 2: read what each group grants",
    "$ Import-Csv \"$Run\\groups\\groups.csv\" | Format-Table Group, Members, Grants, Flags -Wrap",
    "Group                    Members Grants              Flags",
    "-----                    ------- ------              -----",
    "CONTOSO\\PayrollUsers     214     SQLPRD01",
    "CONTOSO\\SQL-Admins       6       SQLPRD01 (sysadmin)",
    "CONTOSO\\SQL-Agent-Alerts 9",
    "CONTOSO\\ClaimsTeam       31      SQLPRD02",
    "CONTOSO\\HR-Analysts      18      SQLFCI04            nested: flatten (CONTOSO\\HR-Leads)",
  ], { label: `TRY IT  ·  ${CAP} (IN FULL)`, pt: 11 });
  callout(s, "Role", c + 0.3, 1.25, "FaListCheck", HEX.amber, "One group, one role: ",
    "CONTOSO\\PayrollUsers reaches two databases on SQLPRD01. The map doesn't check roles; Module 4's login plan does, and its warning for SQL-Payroll-Users names the three roles. Split such a group before the mapping is approved.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" step 2; workbook Chapter 05, Lab 1, \"The group map.\"");
  notes(s,
`Step two reads what each group grants. Contoso sequel admins holds sys-admin on sequel P R D oh one. The distribution list grants nothing. And the nested flag shows on H R analysts. Now look at Contoso payroll users. It reaches two databases on sequel P R D oh one. The data platform book's rule is one group, one role, one database. The map doesn't check roles. Module 4's login plan does: its warning for the payroll users group names the three roles. Split a group like that before the mapping is approved.`,
  `${M} — Unit "Exercise: Lab 1," step 2; workbook Chapter 05, Lab 1.`);
}

// ================================================================== 9 Try it: privileged dynamic group
{
  const s = content(SL, "Try it: pretend the sysadmin group were org-chart");
  tag(s, "How");
  const c = code(s, "Priv", 0.6, 1.45, 12.15, [
    "# Step 3: pretend the sysadmin group were kept by the org chart",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ $admins = (Read-SqlJson tests/fixtures/groups/groups.json).groups | Where-Object name -eq 'CONTOSO\\SQL-Admins'",
    "$ $admins.membershipBasis = 'org-chart'",
    "$ Get-SqlGroupPattern -Groups $admins | Format-List Group, Pattern, Target, Flags",
    "Group   : CONTOSO\\SQL-Admins",
    "Pattern : 1",
    "Target  : Dynamic group on an HR-maintained code: no code recorded yet, so ask HR for it before writing the rule",
    "Flags   : privileged role on a dynamic group: use an assigned group under PIM instead",
  ], { label: `TRY IT  ·  ${CAP} (IN FULL)`, pt: 11 });
  line(s, "Flag", "The flag is what matters: a privileged role never sits on a rule.", c + 0.3, 0.45, 15);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" step 3; workbook Chapter 05, Lab 1, \"Dangers\"; Data Platform: SQL Server Identity, Chapter 17.");
  notes(s,
`Step three pretends the sys-admin group were kept by the org chart. It loads the kit's module, reads Contoso sequel admins from the fixture, and marks its membership as org-chart. The map now sorts it as pattern one, a dynamic group. The group has no organization codes, so the target says to ask H R for the code rather than write a rule. But the flag is what matters: a privileged role on a dynamic group. Use an assigned group under pim instead. A privileged role never sits on a rule.`,
  `${M} — Unit "Exercise: Lab 1," step 3; workbook Chapter 05, Lab 1, "Dangers."`);
}

// ================================================================== 10 Try it: manifest and tests
{
  const s = content(SL, "Try it: the manifest, the tests and your runs");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, [
    "# Step 4: open the manifest",
    "$ Get-Content \"$Run\\groups\\manifest.json\"",
    "  \"step\": \"GROUPS\",",
    "  \"title\": \"Map each AD group pattern to its Entra group\",",
    "  \"mode\": \"read-only\",  \"asOf\": \"2026-11-20\",",
    "  \"controls\": [ \"AC-2\", \"AC-6\" ],  \"ksis\": [ \"KSI-IAM-ELP\" ],",
    "  \"files\": [ { \"file\": \"groups.csv\", \"sha256\": \"39363fb3f917b69eee3b9130ea3d4116ccc7b9326866f3b1bdc189cc505a377f\" },",
    "             { \"file\": \"groups.json\", \"sha256\": \"fe56744856c5a4e5a3a70b63d2ded19a21feba928b374db4727613e0aac76340\" } ]",
    "# Step 5: run this chapter's tests",
    "$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru | Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "          4           0",
    "# Step 6: list your runs",
    "$ Get-ChildItem C:\\FMWLabs\\results\\data-platform-05\\lab1 -Name",
    "<run>",
  ], { label: `TRY IT  ·  ${CAP} (REFLOWED; BRACES AND TABLE RULES CUT)`, pt: 10.5 });
  line(s, "Clean", "Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in $Run.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 4 to 6; workbook Chapter 05, Lab 1.");
  notes(s,
`Step four opens the manifest. The step is groups, its mode is read-only, and it supports A C two and A C six, with one K S I. It records the hash of each file it wrote. Step five runs this chapter's tests: four pass, none fail. And step six lists your runs. There's nothing to clean up. The kit's folder is as you unzipped it, and this run's results stay in its own folder. Check your work: you can say which Entra group replaces each of the estate's five groups, and why the map refuses to make the sys-admin group dynamic.`,
  `${M} — Unit "Exercise: Lab 1," steps 4 to 6, "Check your work"; workbook Chapter 05, Lab 1.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: compare the map with a test tenant's groups");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test tenant whose groups are synchronized from a test domain, never production; PowerShell 7 with Microsoft.Graph.Groups; an account that can consent to delegated Group.Read.All; a groups file in the shape of the kit's fixture"],
    ["1", "Map your test domain's groups with the kit"],
    ["2 and 3", "Sign in to Microsoft Graph, read-only, on the worldwide endpoint a Microsoft 365 GCC tenant uses; list the groups with the properties that decide the pattern"],
    ["4 and 5", "Put the kit's answer beside what the tenant has; look for cloud groups that already exist"],
    ["6", "Back it out: Disconnect-MgGraph, and delete out/lab2-groups"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "Not", b + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "Nothing in the lab writes to the tenant. Group.Read.All is read-only, though Learn lists it among the higher-privileged permissions.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2 (your test instance)\"; workbook Chapter 05, \"Lab 2: a test tenant.\"");
  notes(s,
`Lab 2 compares the map with a real tenant. It's not run by the authors. Use a test tenant whose groups are synchronized from a test domain, never production. You need PowerShell 7 with the Microsoft Graph PowerShell S D K's groups module, an account that can consent to the delegated group read all permission, and a groups file for your test domain's groups, in the shape of the kit's fixture. Map your test groups with the kit. Sign in to Microsoft Graph, read-only. A Microsoft 365 G C C tenant uses the worldwide Graph endpoint. List the tenant's groups with the properties that decide the pattern, put the kit's answer beside what the tenant has, and look for cloud groups that already exist. Nothing in the lab writes to the tenant. To back it out, sign out of Graph and delete the lab's output folder.`,
  `${M} — Unit "Exercise: Lab 2 (your test instance)"; workbook Chapter 05, "Lab 2: a test tenant."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [2.9, 3.3, 2.0, 3.95], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["GROUPS: which group grants what, how its membership is kept, which privileged groups are eligible rather than standing", "AC-2 Account Management; AC-6 Least Privilege", "KSI-IAM-ELP", "groups.csv and groups.json with manifest.json; the Lab 2 comparison; the record of which groups went under PIM"],
  ], { fontSize: 12.5, limit: 4.6 });
  line(s, "Ass", "The map provides evidence for these controls; the agency sets the parameters, and the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.3, 0.75, 13.5);
  sources(s, "Sources: Module 5, \"Introduction\" (the federal requirement), \"Summary\"; workbook Chapter 05, \"Federal requirements and evidence\"; NIST SP 800-53; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Chapter 5's table maps the group map to NIST SP 800-53 A C two, Account Management, and A C six, Least Privilege, with one K S I. The map provides evidence for both: which group grants what, how its membership is kept, and which privileged groups are eligible rather than standing. The I S S O keeps the groups file and its manifest, which records the step, its controls and K S Is, and the hash of each file; the Lab 2 comparison; and the record of which groups went under pim. Runbook R seven lists the evidence each state of the provisioning phase needs. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The agency still sets the parameters, policy and procedures, and the assessor decides whether each control is in place.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 05 — "Federal requirements and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on groups", [
    { q: "CONTOSO\\HR-Analysts contains CONTOSO\\HR-Leads. Why does the map flag it nested: flatten?", options: ["a. A dynamic rule can't select groups, so the inner group's members would drop out", "b. Nested groups can't be synchronized to Entra ID", "c. Conditional Access can't evaluate nested groups"] },
    { q: "CONTOSO\\PayrollUsers reaches two databases on SQLPRD01. Which check catches the one-group-one-role problem?", options: ["a. The group map, with a flag on the group", "b. Chapter 04's login plan, whose warning names the roles; the map carries grants per instance, not roles per database", "c. Conditional Access, at sign-in"] },
  ], "1 a: the model is flat, because dynamic groups can't contain groups. 2 b: the roles are known in the login plan, so it warns there.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 3 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: Contoso H R analysts contains Contoso H R leads. Why does the map flag it nested, flatten? The answer is a. A dynamic rule can't select groups, so the inner group's members would drop out. Second: Contoso payroll users reaches two databases on sequel P R D oh one. Which check catches the one-group-one-role problem? The answer is b: Chapter 4's login plan, whose warning names the roles. The map carries grants per instance, not roles per database. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 3 and 4; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: rules for the org chart, PIM for privilege");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Sorted five groups into dynamic, assigned, mail-only and split targets",
    "Read what each group grants, and the nested flag",
    "Saw the map refuse to put a privileged role on a rule",
    "Opened the manifest and ran the chapter's tests",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6: NTLM and the SPNs", [
    "Or workbook Chapter 05, for Lab 2 and its checklist",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "Who reaches SQL Server now: ",
    "group logins, PIM and Conditional Access decide, in place of hand-kept AD groups. Before shipping, work through the Chapter 05 checklist.");
  sources(s, "Sources: Module 5, \"Summary\"; workbook Chapter 05, \"Checklist.\"");
  notes(s,
`To sum up. You sorted the fictional estate's groups into dynamic, assigned, mail-only and split targets, and saw the map refuse to put a privileged role on a rule. Group logins, pim and Conditional Access now decide who reaches Sequel Server, in place of hand-kept Active Directory groups. Before shipping, work through Chapter 5's checklist. Next, Module 6: N T L M and the S P Ns.`,
  `${M} — Unit "Summary"; workbook Chapter 05, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/data-platform/05-groups-roles-and-the-perimeter.md (Data Platform and SQL Server Identity learning path, Module 5): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Data Platform: SQL Server Identity, Chapter 16 (Groups, Roles and How Membership Reaches the Engine) and Chapter 17 (Dynamic Membership, Delegation and Privileged Access); Runbook R07, Groups, Administrative Units & the Conditional Access Perimeter. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 05 of Building SQL Server Identity, Groups, Roles and the Perimeter: \"What Microsoft gives you\" (Microsoft Learn's dynamic membership, Graph group, PIM for Groups and Conditional Access pages), \"What it leaves to you,\" \"The group map,\" Lab 1, Lab 2 (not run by the authors), \"Federal requirements and evidence,\" \"Dangers.\" Kit: examples/sql-server-identity (Invoke-SqlGroupMap.ps1, Get-SqlGroupPattern, tests/fixtures/groups).",
  "Lab output: the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into C:\\FMWLabs; wrapped and reflowed where the slides say so.",
]);

finish(OUT);
