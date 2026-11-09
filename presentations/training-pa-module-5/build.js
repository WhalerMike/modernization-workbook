// Privileged Access learning path, Module 5: PIM for Groups and the PRV groups — the module's narrated deck.
// Teaches docs/training/privileged-access/05-pim-for-groups.md, Learn-style: objectives, the concepts, "Try it" slides
// with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/privileged-access), Lab 2,
// the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page,
// the learning path's verification log, or the kit (examples/privileged-access); the deck adds none. The narration names
// the original source the workbook footnotes for each fact (workbook Chapter 05's footnotes).
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-5/build.js \
//                      presentations/training-pa-module-5/Training_PA_Module_5.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 5: PIM for Groups and the PRV groups",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 5: PIM for Groups and the PRV groups",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 5: PIM for Groups and the PRV groups";
const OUT = process.argv[2] || "Training_PA_Module_5.pptx";
const M = "Training, Privileged Access, Module 5";

const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "PRIVILEGED ACCESS LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: PIM for Groups and the PRV groups", "Privileged Access learning path · Plan Phase 2 (A2.1) and Phase 3 (A3.3), with workbook Chapter 05",
    ["What the PRV groups hold  ·  Learn's three facts  ·  The file and the findings", "The plan and the guards  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 5 of the Privileged Access learning path: PIM for Groups, and the P R V groups. This module serves the project plan's task A2.1 in Phase 2, and A3.3 in Phase 3, with Chapter 05 of the developer workbook. The program never assigns a privileged role to a person. It assigns the role to a role-assignable group named P R V, then the tier, then the role, so the tier shows in every review, alert and audit record. Module 1 reads those groups. This module writes them. You keep each group's own state in one reviewed file: who is a member or owner, until when, on which ticket, and how membership is activated. The code reads the tenant first, reports what's wrong, plans the exact requests, and applies them only when you ask, and only past its guards. It's illustrative: tested against fixtures and a fake.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a PRV group's own state has to be governed");
  tag(s, "Why");
  const l = panel(s, "State", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "A PRV GROUP'S STATE", "Kept in one reviewed file", [
    "Who is a member or an owner",
    "Until when, and on which ticket",
    "How membership is activated",
  ], 14);
  const b = table(s, "Guards", 1.45, [1.9, 4.0], ["Guard", "What it refuses"], [
    ["PA-PG-G4", "Eligible owners with no active owner"],
    ["PA-PG-G6", "More removals than -MaxRemovals (default 5)"],
    ["PA-PG-G1", "A Tier 0 or Tier 1 policy losing approval or its approvers"],
  ], { fontSize: 13, limit: 4.6, x: 6.85 });
  callout(s, "Back", Math.max(l, b) + 0.3, 0.95, "FaTriangleExclamation", HEX.red, "One way only: ",
    "a group can't be taken back out of PIM once onboarded, so Lab 2 uses groups made for the lab.");
  sources(s, "Sources: Module 5, \"Introduction\" and its lockout callout; Microsoft Learn, \"Privileged Identity Management (PIM) for Groups.\"");
  notes(s,
`Why does this matter? Because the P R V groups decide who holds each role, and their state drifts like anything else. So the guards refuse a plan before anything is sent, and three of them keep people from losing access by mistake. Guard G four refuses eligible owners with no active owner. Microsoft Learn's page on PIM for Groups says the last active owner can't be removed, so an activated owner's deactivation fails. Guard G six refuses more removals than the Max Removals limit, five by default, because that's the sign of a wrong or truncated file. And guard G one refuses a Tier 0 or Tier 1 policy losing approval or its approvers. Microsoft Learn also says a group can't be taken back out of PIM once it's onboarded. So Lab 2 uses groups made for the lab.`,
  `${M} — Unit "Introduction"; the callout "The lockout check for this module."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Explain the two Microsoft features that meet in a PRV group, and the two ways they're used together",
    "Name what Learn says about role-assignable groups and PIM for Groups that shapes the code",
    "Read the findings, PA-PG-01 to PA-PG-09, and a plan's diff",
    "Name the guards G1 to G7, and say why the pipeline's app doesn't create the groups",
  ], [
    "Module 4: eligible assignments, and the PRV group that holds each role's eligibility",
    "Book 04, Ch 04: role-assignable groups",
    "Lab 2: a worldwide or GCC test tenant with Entra ID P2 or Governance, never production",
  ], 55);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain the two Microsoft features that meet in a P R V group, and the two ways the program uses them together. You'll name what Microsoft Learn says about role-assignable groups and PIM for Groups that shapes the code. You'll read the findings, P G oh one to oh nine, and a plan's diff. And you'll name the guards, G one to G seven, and say why the pipeline's app doesn't create the groups. Before you start, finish Module 4, for eligible assignments and the P R V group that holds each role's eligibility, and read about role-assignable groups in the chapter on privileged tiers in Access and Privilege. Lab 2 needs a worldwide or G C C test tenant with Microsoft Entra I D P2 or Governance licenses and fictional people, never production.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Two features
{
  const s = content(SC, "Two features meet in a PRV group");
  tag(s, "What");
  const l = panel(s, "RAG", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "ROLE-ASSIGNABLE GROUPS", "Only these can hold an Entra role", [
    "isAssignableToRole is set to true at creation, and can't be changed",
    "At most 500 in a tenant",
    "Membership assigned, never dynamic; a group can't be a member",
  ], 13);
  const r = panel(s, "PIM", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "PIM FOR GROUPS", "Just-in-time membership or ownership", [
    "One policy for membership, one for ownership",
  ], 13);
  const b = table(s, "Ways", Math.max(l, r) + 0.25, [3.4, 8.75], ["The two ways together", "How"], [
    ["For an Entra role", "The group holds an eligible assignment, and its members are active"],
    ["For other privilege", "The members are eligible for the group"],
  ], { fontSize: 13, limit: 6.2 });
  sources(s, "Sources: Module 5, Unit 1; Microsoft Learn, \"Use Microsoft Entra groups to manage role assignments,\" \"PIM for Groups\"; Book 04, Ch 04.");
  notes(s,
`Unit 1: what the P R V groups have to hold. Two Microsoft features meet in a P R V group. The first is role-assignable groups. Microsoft Learn's page on using groups to manage role assignments says only a group created with is Assignable To Role set to true can hold an Entra role. It's set at creation and can't be changed. A tenant can have at most five hundred. Membership must be assigned, never dynamic, and a group can't be a member. The second is PIM for Groups: just-in-time membership or ownership, with one policy for membership and one for ownership. The program's design uses them together in two ways. For an Entra role, the group holds an eligible assignment, and its members are active. For other privilege, such as an Azure role, the members are eligible for the group. The access packages for P R V membership, the plan's A3.3, aren't built here.`,
  `${M} — Unit 1 "What the PRV groups have to hold": workbook Chapter 05; Book 04, Chapter 04 — "Two ways to model eligibility through a group."`);
}

// ================================================================== 5 Three facts
{
  const s = content(SC, "Three facts from Learn that shape the code");
  tag(s, "What");
  const b = table(s, "Facts", 1.45, [6.4, 5.75], ["What Microsoft Learn says", "So the code"], [
    ["Eligible membership doesn't appear in the group's members list", "Reads the eligibility schedules, not just members"],
    ["PIM onboards a group on its first schedule or policy change, and it can't be taken back out", "Reads the policy IDs fresh; Lab 2 uses groups made for the lab"],
    ["Group administrators or owners can override what PIM set", "Reads the tenant before every plan"],
  ], { fontSize: 13, limit: 4.4 });
  callout(s, "Act", b + 0.3, 0.9, "FaListCheck", HEX.navy, "Activations aren't standing state: ",
    "the read leaves them out, and reports only the schedules and policies the file governs.");
  sources(s, "Sources: Module 5, Unit 1, and Knowledge check answer 1; Microsoft Learn, \"PIM for Groups,\" \"Bring groups into Privileged Identity Management.\"");
  notes(s,
`Three facts from Microsoft Learn's PIM for Groups pages shape the code. First, eligible membership doesn't appear in the group's members list, so reading members alone would miss every eligible holder. Second, PIM onboards a group on its first schedule or policy change, and the group can't be taken back out; the policy I D's change when that happens. Third, group administrators or owners can override what PIM set. So the code reads the tenant before every plan, rather than trusting what it applied last time. And one choice of the kit's own: activations aren't standing state, so the read leaves them out.`,
  `${M} — Unit 1: workbook Chapter 05, "What the PRV groups have to hold"; Unit 2 — "The read and the findings."`);
}

// ================================================================== 6 Findings
{
  const s = content(SC, "The file and the findings: PA-PG-01 to PA-PG-09");
  tag(s, "What");
  const b = table(s, "PG", 1.45, [1.5, 10.65], ["Rule", "What it catches"], [
    ["PA-PG-01", "A name that isn't PRV-<tier>-<role>[-<scope>], or whose tier differs from the group's"],
    ["PA-PG-02", "A group that holds an Entra role but isn't role-assignable"],
    ["PA-PG-03", "A dynamic group, or one synchronized from on-premises: PIM for Groups can't manage them"],
    ["PA-PG-04", "Too many role-assignable groups: 450 or more is a Warn, 500 a Finding"],
    ["PA-PG-05", "A group as a member or owner, or a service principal made eligible"],
    ["PA-PG-06", "An entry with no end, or already ended; one with no ticket"],
    ["PA-PG-07", "Eligible owners with no active owner; any owner on a Tier 0 group"],
    ["PA-PG-08", "A policy rule that differs from the reviewed setting, or a group approving itself"],
    ["PA-PG-09", "A schedule the file doesn't grant; a PRV group the file doesn't list"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "File", "The desired state is prv-groups.json, with the tier policy in config/prv-group-policy.json (design guidance). Every member and owner policy selects c1, so -Apply needs -ActivationGateChecked, as in Module 4.", b + 0.2, 0.75, 13);
  sources(s, "Sources: Module 5, Unit 2; Microsoft Learn, \"Use Microsoft Entra groups to manage role assignments,\" \"PIM for Groups\"; PimGroups.psm1.");
  notes(s,
`Unit 2: the file, the findings and the guards. The desired state is one file, P R V groups dot json, with the tier policy beside it; the values are this workbook's design guidance. Every member and owner policy selects Module 3's authentication context, c1, as Book 04, Access and Privilege, requires. So, as in Module 4, the Apply switch also needs the Activation Gate Checked switch, a person's statement that the gate's policy is On. The read compares the tenant with it and raises rules P G oh one to oh nine. Oh one is a name that doesn't follow the P R V pattern, the program's naming. Oh two is a group that holds an Entra role but isn't role-assignable, and oh three a dynamic or synchronized group; Microsoft Learn says PIM for Groups can't manage those. Oh four counts role-assignable groups against Microsoft Learn's limit of five hundred. Oh five is a group nested as a holder, or a service principal made eligible. Oh six is an entry with no end or no ticket. Oh seven is the owner trap. Oh eight is a policy rule that differs from the reviewed setting. And oh nine is anything the file doesn't grant or list: anything outside the file is unreviewed.`,
  `${M} — Unit 2: workbook Chapter 05, "The desired state," "The read and the findings"; examples/privileged-access/powershell/PimGroups/PimGroups.psm1.`);
}

// ================================================================== 7 Plan and guards
{
  const s = content(SC, "The plan's order, the guards, and who creates the groups");
  tag(s, "What");
  const b = table(s, "G", 1.45, [1.7, 10.45], ["Guard", "Refuses"], [
    ["PA-PG-G1", "A Tier 0 or Tier 1 policy losing approval, or its approvers"],
    ["PA-PG-G2", "An expiration rule that allows permanent grants, or a grant with no end"],
    ["PA-PG-G3", "A group set as its own approver"],
    ["PA-PG-G4", "Eligible owners with no active owner"],
    ["PA-PG-G5", "A group as a holder, or an eligible service principal"],
    ["PA-PG-G6", "More removals than -MaxRemovals (default 5)"],
    ["PA-PG-G7", "A self-service action in the plan"],
  ], { fontSize: 12.5, limit: 4.9 });
  const l = panel(s, "Order", 0.6, b + 0.2, 6.0, null, HEX.navy, HEX.navyTint, "THE PLAN'S FIXED ORDER", null, [
    "Groups, then policy rules, then grants, then removals",
  ], 13);
  panel(s, "Create", 6.85, b + 0.2, 5.9, null, HEX.teal, HEX.tealTint, "WHO CREATES THE GROUPS", "A person, by hand (design guidance)", [
    "It needs RoleManagement.ReadWrite.Directory, kept off the pipeline's app",
  ], 13);
  sources(s, "Sources: Module 5, Unit 2; Microsoft Learn, \"Create group\" (permissions); examples/privileged-access/powershell/PimGroups/PimGroups.psm1.");
  notes(s,
`The plan has a fixed order: groups, then policy rules, then grants, then removals. And seven guards refuse a plan before anything is sent. G one, a Tier 0 or Tier 1 policy losing approval or its approvers. G two, a rule that allows permanent grants, or a grant with no end. G three, a group set as its own approver. G four, the owner trap. G five, a group as a holder, or an eligible service principal. G six, too many removals. And G seven, a self-service action in the plan. One more choice: the pipeline's app doesn't create the P R V groups. Microsoft Learn's reference for creating a group says a role-assignable group needs Role Management dot ReadWrite dot Directory. The program keeps that permission off the pipeline, and a Privileged Role Administrator creates the groups by hand. That's this workbook's design guidance.`,
  `${M} — Unit 2: workbook Chapter 05, "The plan, the dry run and -Apply," "Least privilege per call."`);
}
endModule(SC);

// ================================================================== 8 Try it: samples
{
  const s = content(SL, "Try it: Microsoft's samples, and Learn's Example 1");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/PimForGroups.Tests.ps1 -FullNameFilter '*as published*' -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "----------- -----------",
    "         10           0",
    "# Step 2: send Learn's Example 1 yourself",
    "PS> Import-Module ./powershell/PimGroups/PimGroups.psm1",
    "PS> . ./tests/PimForGroupsSampleHarness.ps1",
    "PS> $learn = Get-PgLearnRequest -Page eligibility",
    "PS> $learn[0].Title; $learn[0].Body.accessId",
    "Example 1: An admin creates an eligible group ownership request for a principal",
    "member",
    "PS> (Invoke-PgLearnRequest -Request $learn[0] -Fixture tests/fixtures/ch05/tenant.json -Policy).Status",
    "400 Bad Request from the fake: the schedule ended at 2023-02-07T19:56:00.0000000Z, before the fake's clock",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 10.5 });
  line(s, "Read", "The example is labeled ownership but asks for membership, and its dates are stale.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 1 and 2; Microsoft Learn, \"Create eligibilityScheduleRequest\" (privilegedAccessGroup).");
  notes(s,
`Try it. Lab 1 runs in one PowerShell 7 session, in the privileged-access folder. Step one runs Microsoft's samples against the fake, as published: ten pass. Step two sends Microsoft Learn's Example 1 yourself, from the reference page for creating an eligibility schedule request. You load the module and the sample harness, and read the first example. Its title says an admin creates an eligible group ownership request. But its body's access I D says member. So the example is labeled ownership and asks for membership. Then send it to the fake: four hundred, Bad Request, because the schedule ended in February twenty twenty-three, before the fake's clock. Its dates are stale. Samples are a starting point, not a desired state.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 9 Try it: permissions and plan
{
  const s = content(SL, "Try it: four read permissions, and a dry run");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3",
    "PS> (Get-PaPgRequiredPermission -Task pim-groups-read).GraphPermissions -join ', '",
    "Group.ReadBasic.All, PrivilegedAssignmentSchedule.Read.AzureADGroup, PrivilegedEligibilitySchedule.Read.AzureADGroup,",
    "  RoleManagementPolicy.Read.AzureADGroup",
    "# Step 4: plan against the fictional tenant, as a dry run",
    "PS> ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `",
    "      -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups",
    "PIM for Groups: 11 Finding, 3 Warn, 0 Info",
    "Plan: 10 change(s) (3 assignment, 2 eligibility, 5 policy rule)",
    "Guards: all passed",
    "Activation gate: the plan selects an authentication context; -Apply also needs -ActivationGateChecked",
    "Dry run: nothing sent. Review diff.txt and plan.json, then rerun with -Apply",
    "Written to out/pim-groups (manifest.json lists every request and file hash)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 9, 2026 (THE PERMISSIONS LINE WRAPPED)", pt: 10.5 });
  table(s, "Read", c + 0.25, [3.0, 9.15], ["Read it", "What the run printed"], [
    ["Four permissions", "Nothing ends in ReadWrite"],
    ["14 results", "11 Finding, 3 Warn"],
    ["10 changes", "3 assignment, 2 eligibility, 5 policy rule; the guards all passed; -Apply also needs -ActivationGateChecked"],
  ], { fontSize: 13, limit: 6.1 });
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 3 and 4; examples/privileged-access: Invoke-PaPimGroups.ps1, tests/fixtures/ch05 (fictional).");
  notes(s,
`Step three lists the permissions the read needs. Four: Group dot Read Basic dot All, and the three PIM for Groups reads, for assignment schedules, eligibility schedules and role management policies. Nothing ends in ReadWrite. Step four plans against the fictional tenant, as a dry run. You give it the cloud, the fixture, the desired state file, the date and an output folder. The read raises eleven findings and three warnings. The plan has ten changes: three assignments, two eligibilities and five policy rules. The guards all passed, so the plan could be applied, but the run warns that it selects an authentication context, so the apply will also need the Activation Gate Checked switch. And it's a dry run, so nothing was sent: review the diff and the plan, then run again with Apply.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 and 4.`);
}

// ================================================================== 10 Try it: findings
{
  const s = content(SL, "Try it: read the findings");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 7.0, [
    "# Lab 1, step 5",
    "PS> Get-Content out/pim-groups/findings.json -Raw |",
    "      ConvertFrom-Json | Format-Table Rule, Severity, Object",
    "Rule     Severity Object",
    "----     -------- ------",
    "PA-PG-09 Warn     Helpdesk-Admins-Legacy",
    "PA-PG-09 Warn     PRV-T1-IntuneAdmin",
    "PA-PG-09 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-06 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-09 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-07 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-08 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-08 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-08 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-08 Finding  PRV-T0-PrivRoleAdmin",
    "PA-PG-02 Warn     PRV-T1-AzureOwner-SubWorkload",
    "PA-PG-05 Finding  PRV-T1-AzureOwner-SubWorkload",
    "PA-PG-09 Finding  PRV-T1-AzureOwner-SubWorkload",
    "PA-PG-08 Finding  PRV-T1-AzureOwner-SubWorkload",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 9, 2026 (WRAPPED)", pt: 10.5 });
  panel(s, "Read", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "PRV-T0-PrivRoleAdmin: a permanent active member the file doesn't grant",
    "An eligible owner with no active owner",
    "Member activation without approval, for 8 hours instead of 4, and with MFA instead of c1",
    "PRV-T1-AzureOwner-SubWorkload: a nested group as an eligible member",
    "Two groups the file doesn't list (Warn)",
  ], 12.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" step 5; examples/privileged-access/tests/fixtures/ch05 (fictional identities).");
  notes(s,
`Step five prints the findings. Two warnings are P G oh nine for groups the file doesn't list: a legacy help desk group and an Intune administrators group. Then P R V T0 Priv Role Admin. It has a permanent active member the file doesn't grant, which is oh six and oh nine. It has an eligible owner with no active owner, which is oh seven and oh nine: the owner trap. And its member policy activates without approval, for eight hours instead of four, and with M F A instead of the authentication context c1: four oh eight findings, for the duration, the enablement rules, the context and the approval. On the Azure owner group, P R V T1 Azure Owner Sub Workload: it isn't role-assignable, which is a warning for a group that holds no Entra role, and it has a nested group, the legacy help desk group, as an eligible member. That's oh five, oh nine, and an oh eight for a policy rule.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 5.`);
}

// ================================================================== 11 Try it: diff
{
  const s = content(SL, "Try it: read the diff, rule by rule");
  tag(s, "How");
  const c = code(s, "Diff", 0.6, 1.45, 12.15, [
    "# Lab 1, step 6",
    "PS> Get-Content out/pim-groups/diff.txt",
    "# PIM for Groups plan, cloud gcc, 10 change(s), dry run: nothing sent",
    "~ PRV-T0-PrivRoleAdmin member Expiration_EndUser_Assignment: required=True max=PT8H -> required=True max=PT4H",
    "~ PRV-T0-PrivRoleAdmin member Enablement_EndUser_Assignment: enabled=Justification,MultiFactorAuthentication,Ticketing",
    "    -> enabled=Justification,Ticketing",
    "~ PRV-T0-PrivRoleAdmin member AuthenticationContext_EndUser_Assignment: context=off -> context=c1",
    "~ PRV-T0-PrivRoleAdmin member Approval_EndUser_Assignment: approval=False approvers=groupMembers:5a00...00a0",
    "    -> approval=True approvers=groupMembers:5a00...00a0",
    "~ PRV-T1-AzureOwner-SubWorkload owner Expiration_Admin_Eligibility: required=False max=P90D -> required=True max=P90D",
    "~ active member PRV-T1-ExchangeAdmin eve.exch@contoso.example end 2026-12-31 -> 2027-04-28 (CHG-1002)",
    "+ active member PRV-T1-ExchangeAdmin ben.ops@contoso.example until 2027-04-28 (CHG-1005)",
    "- active member PRV-T0-PrivRoleAdmin ben.ops@contoso.example",
    "- eligible owner PRV-T0-PrivRoleAdmin cara.cloud@contoso.example",
    "- eligible member PRV-T1-AzureOwner-SubWorkload Helpdesk-Admins-Legacy",
    "PS> (Get-Content out/pim-groups/plan.json -Raw | ConvertFrom-Json).Permissions -join ', '",
    "PrivilegedAssignmentSchedule.ReadWrite.AzureADGroup, PrivilegedEligibilitySchedule.ReadWrite.AzureADGroup,",
    "  RoleManagementPolicy.ReadWrite.AzureADGroup",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 9, 2026 (WRAPPED; \"...\" SHORTENS A GROUP ID)", pt: 10.5 });
  line(s, "Read", "The policy rules come first, then grants, then the three removals; the plan names the writes it needs.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" step 6; examples/privileged-access: Invoke-PaPimGroups.ps1, tests/fixtures/ch05 (fictional).");
  notes(s,
`Step six reads the diff, one line per change. A tilde is a change, a plus an addition, a minus a removal. The policy rules come first. The Tier 0 group's member activation goes from eight hours to four; M F A leaves its enablement rules, which keep justification and a ticket; the authentication context goes from off to c1; and it goes from no approval to approval, by the same approver group. The Azure owner group's eligible owners must now have an end. Then the grants. An Exchange admin member's end date moves out to April twenty twenty-seven, on change C H G ten oh two, and a new active member is added, on C H G ten oh five, each with its ticket. Then the three removals: the Tier 0 group's ungranted active member, its eligible owner, and the nested legacy group. Last, the plan names exactly the write permissions it would need: the three PIM for Groups ReadWrite permissions.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 6.`);
}

// ================================================================== 12 Try it: guard and apply
{
  const s = content(SL, "Try it: a guard refuses, then apply to the fake");
  tag(s, "How");
  const c = code(s, "Apply", 0.6, 1.45, 12.15, [
    "# Lab 1, step 7: see a guard refuse",
    "PS> ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `",
    "      -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-guard -MaxRemovals 2 -Apply",
    "Exception: Refusing to apply: PA-PG-G6: 3 removals is more than 2; review them and rerun with a higher -MaxRemovals",
    "# Step 8: apply to the fake",
    "PS> ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `",
    "      -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-apply -Apply",
    "Exception: The plan sets an authentication context: confirm its Conditional Access policy is On (Chapter 03), then pass -ActivationGateChecked",
    "PS> ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `",
    "      -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-apply -Apply -ActivationGateChecked",
    "PIM for Groups: 11 Finding, 3 Warn, 0 Info",
    "Plan: 10 change(s) (3 assignment, 2 eligibility, 5 policy rule)",
    "Guards: all passed",
    "Applied: 10 sent, 0 failed",
    "Written to out/pim-groups-apply (manifest.json lists every request and file hash)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 9, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Tests", "Step 9: Invoke-Pester -Path tests prints Tests Passed: 330, Failed: 0. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 7 to 9; examples/privileged-access/powershell/PimGroups/PimGroups.psm1.");
  notes(s,
`Step seven shows a guard refusing. Run the same plan with Apply, but with Max Removals set to two. Guard G six refuses: three removals is more than two; review them, and run again with a higher limit. Nothing is sent. Step eight applies to the fake with the default limit. The first command stops before any write: the plan sets an authentication context, so confirm its Conditional Access policy is On, from Module 3, then pass Activation Gate Checked. The second has the same findings and the same ten changes, the guards all pass, and ten requests are sent, none failed: the policy rules first, then the grants and removals. The fake records the requests and doesn't change its tenant. Step nine runs the tests, three hundred thirty pass, and you delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 to 9.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: lab groups in your own test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with Entra ID P2 or Governance and fictional people, never production"],
    ["Make the groups", "As a Privileged Role Administrator, make the lab groups by hand: a group can't be taken back out of PIM"],
    ["Plan and apply", "Register a reader app and a writer app; plan as the reader; apply the reviewed diff as the writer"],
    ["Check", "Rerun the plan and see Plan: 0 change(s)"],
    ["Permissions", "The reader: the four reads from step 3; the writer: those and the three writes from step 6"],
    ["Back it out", "Empty both lists in your file and apply it, so no schedule remains; delete the lab folder"],
  ], { fontSize: 12.5, limit: 5.5 });
  callout(s, "NotRun", b + 0.2, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Lab 2, which gives every step as a command or a portal path.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2, your test tenant.\"");
  notes(s,
`Lab 2 runs in a worldwide or G C C test tenant with Microsoft Entra I D P2 or Governance licenses and fictional people, never production. Use groups made for the lab, because a group can't be taken back out of PIM. As a Privileged Role Administrator, make the lab groups by hand. Register a reader app and a writer app. Plan as the reader, apply the reviewed diff as the writer, then run the plan again and see zero changes. The reader gets the four read permissions from step three; the writer gets those and the three writes from step six, and nothing else. To back out, empty both lists in your file and apply it, so no schedule remains, then delete the lab folder. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence for Module 5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.4, 4.15], ["Requirement", "KSI", "Evidence"], [
    ["AC-6(5); MS.AAD.7.5v1: every PRV group named for its tier, role-assignable, assigned, no nesting, no eligible service principal", "KSI-IAM-JIT", "PA-PG-01, 02, 03 and 05"],
    ["AC-6, AC-5; MS.AAD.7.4v1: an end and a ticket, no Tier 0 owners, approval for Tier 0 and 1, no self-approval", "KSI-IAM-JIT", "PA-PG-06, 07 and 08"],
    ["AC-2: access nobody reviewed is found", "KSI-IAM-JIT", "PA-PG-09"],
    ["CM-3: reviewed before it's made, an unsafe change stopped", "KSI-CMT-LMC, -RMV", "diff.txt, plan.json; the G6 refusal"],
    ["AC-6: least privilege for each identity", "KSI-IAM-ELP", "Four reads; the plan's list of writes"],
  ], { fontSize: 11, limit: 5.2 });
  panel(s, "Keep", 0.6, b + 0.2, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The reviewed prv-groups.json, with each holder's end date and ticket; each plan's diff.txt, plan.json and findings.json; each apply's results.json and manifest.json",
  ], 12);
  sources(s, "Sources: Module 5, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 (MS.AAD.7.4v1, 7.5v1); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The P R V groups' file, the check and the plan are the evidence for the plan's task A2.1. From NIST special publication eight hundred fifty-three they support A C six, enhancement five, privileged accounts restricted to defined roles; A C six and A C five, least privilege and separation of duties; and A C two, account management. And from CISA's B O D twenty-five oh-one and its ScubaGear baseline: M S A A D seven point four, no permanent active assignment, and seven point five, provisioning only through PIM. C M three covers the change: reviewed before it's made, and an unsafe change stopped. The evidence an ISSO keeps: the reviewed file, with each holder's end date and ticket; each plan's diff, plan and findings; and each apply's results and manifest.`,
  `${M} — Unit "Introduction" (the federal requirement and its table); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the PRV groups", [
    { q: "The file lists 3 removals and you pass -MaxRemovals 2 -Apply. What happens?", options: ["a. The first two removals are sent", "b. PA-PG-G6 refuses the plan, and nothing is sent", "c. All three are sent with a warning"] },
    { q: "Why does the pipeline's app not create the PRV groups?", options: ["a. Graph can't create role-assignable groups", "b. It needs RoleManagement.ReadWrite.Directory, which the program keeps off the pipeline", "c. Groups must be created in the portal"] },
  ], "1 b: seen in Lab 1, step 7. 2 b: a Privileged Role Administrator creates the groups by hand.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: the file lists three removals and you pass Max Removals two with Apply. What happens? The answer is b: guard G six refuses the plan, and nothing is sent. You saw it in Lab 1, step seven. Second: why does the pipeline's app not create the P R V groups? The answer is b: creating a role-assignable group needs Role Management dot ReadWrite dot Directory. The program keeps that permission off the pipeline, and a Privileged Role Administrator creates the groups by hand. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 6, PIM for Azure resources");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read a fictional tenant's PRV groups against a reviewed file of four",
    "Found a standing member nobody granted, an owner trap and a nested group",
    "Read the exact requests that would fix them",
    "Saw a guard refuse too many removals, and the apply refuse to select c1 until a person confirmed the gate",
    "Applied ten requests to the fake",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6: PIM for Azure resources", [
    "Owner, Contributor and User Access Administrator",
    "Through Resource Manager, not Graph",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "for other privilege, such as an Azure role, the members are eligible for the group.");
  sources(s, "Sources: Module 5, \"Summary\"; Module 6, \"Introduction.\"");
  notes(s,
`To sum up. You read a fictional tenant's P R V groups against a reviewed file of four, and found a standing member nobody granted, an owner trap, and a nested group. You read the exact requests that would fix them, saw a guard refuse a plan with too many removals, saw the apply refuse to select c1 until a person confirmed the gate, and applied ten requests to the fake. Next is Module 6: PIM for Azure resources. Owner, Contributor and User Access Administrator on a subscription are privileged too. PIM for Azure resources isn't in Microsoft Graph: it goes through Azure Resource Manager, with Azure roles instead of Graph permissions. In Module 6 you hold it as code, with the same discipline: read, diff, and send only with Apply.`,
  `${M} — Unit "Summary"; Module 6 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/privileged-access/05-pim-for-groups.md (Privileged Access learning path, Module 5): Introduction, its lockout callout and requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "Original sources, as workbook Chapter 05 footnotes them: Microsoft Learn, \"Privileged Identity Management (PIM) for Groups\"; \"Use Microsoft Entra groups to manage role assignments\"; \"Bring groups into Privileged Identity Management\"; \"Create group\"; \"Create eligibilityScheduleRequest\" (privilegedAccessGroup); NIST SP 800-53 Rev. 5; CISA BOD 25-01; FedRAMP, \"Key Security Indicators.\"",
  "Kit: examples/privileged-access (Invoke-PaPimGroups.ps1; powershell/PimGroups; config/prv-group-policy.json; config/calls-ch05.json; tests/PimForGroups.Tests.ps1 and its sample harness; tests/fixtures/ch05). Fictional identities. Illustrative: tested against fixtures and a fake, not run against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/05-1.txt to 05-10.txt. Output is wrapped or shortened where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
