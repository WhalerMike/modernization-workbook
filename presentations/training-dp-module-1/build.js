// Data Platform and SQL Server Identity learning path, Module 1: The Estate and the Consolidation Gate — the module's narrated deck.
// Teaches docs/training/data-platform/01-the-estate-and-the-consolidation-gate.md, Learn-style: objectives, the concepts
// (finding the estate; the three lenses; the classifier and its constraints), "Try it" slides with the module page's own
// Lab 1 commands and expected output (workbook Chapter 01's Lab 1 on the kit's fixtures), Lab 2, the federal requirement
// and evidence, a two-question check, and the summary. Every fact comes from the module page, Runbook R02 and the
// Book 06 chapters it links, workbook Chapter 01, or the kit (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-1/build.js \
//                      presentations/training-dp-module-1/Training_DP_Module_1.pptx
const TITLE = "Module 1: The Estate and the Consolidation Gate";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 1: The Estate and the Consolidation Gate",
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
// Code lines are written raw, so Windows paths keep their backslashes.
const L = (s) => s.replace(/^\n/, "").replace(/\n$/, "").split("\n");
const OUT = process.argv[2] || "Training_DP_Module_1.pptx";
const M = "Training, Data Platform, Module 1";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: The Estate and the Consolidation Gate", "Data Platform and SQL Server Identity learning path · Runbook R02, with workbook Chapter 01",
    ["Finding the estate  ·  The three lenses  ·  The classifier and the gate", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 1 of the Data Platform and SQL Server Identity learning path: the estate and the consolidation gate. It teaches Runbook R oh two, with Chapter 1 of the developer workbook, Building SQL Server Identity. Before any login moves, you count every SQL Server instance, and decide which ones the identity work is spent on. This is the first of ten modules.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the count comes before any login moves");
  tag(s, "Why");
  const l = panel(s, "Today", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "TWENTY YEARS IN AN AD FOREST", "Larger than anyone's list of it", [
    "Instances nobody listed, and some that shouldn't survive at all",
    "Migrating the logins of an instance you retire three months later is wasted work",
  ], 13.5);
  const r = panel(s, "Rule", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE GATE", "Count first, then decide", [
    "One row per instance, before any login is touched",
    "Classified retain, consolidate, retire or review",
    "Only retained instances and consolidation targets go on to the migration",
  ], 13.5);
  callout(s, "Do", Math.max(l, r) + 0.3, 1.2, "FaDatabase", HEX.navy, "In this module: ",
    "you see how the gate is decided, and run the kit's classifier over a fictional eight-instance estate.");
  sources(s, "Sources: Module 1, \"Introduction\"; Runbook R02; workbook Chapter 01.");
  notes(s,
`Why does this matter? After twenty years across an Active Directory forest, the SQL Server estate is larger than anyone's list of it, and part of it shouldn't survive the transformation at all. Migrating the logins of an instance you retire three months later is wasted work. So the identity work starts with a count: one row per instance, classified retain, consolidate, retire or review, before any login is touched. Only retained instances and consolidation targets go on to the migration. In this module you see how that gate is decided, and run the kit's classifier over a fictional estate.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Name the three forms of sprawl, and say why the inventory comes before the authentication audit",
    "Apply the three lenses (utilization, version, dependencies) and say which classes enter the migration",
    "Explain how a recorded constraint changes a first-pass answer, and why an unread instance lands in review",
    "Classify a fictional estate with the kit, and show a changed file no longer matches its manifest",
  ], [
    "The path's \"Get the code\" steps",
    "The data platform book's Chapter 01, What Windows Authentication Actually Is",
  ], 50);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll name the three forms of sprawl in a twenty-year estate, and say why the inventory comes before the authentication audit. You'll apply the three rationalization lenses, utilization, version and dependencies, and say which classes enter the migration. You'll explain how a recorded constraint changes a first-pass answer, and why an instance nothing could read lands in review. And you'll classify a fictional estate with the kit, and show that a changed file no longer matches its manifest. Before you start, follow the path's get-the-code steps, and read the first chapter of Data Platform: SQL Server Identity, What Windows Authentication Actually Is.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Finding the estate
{
  const s = content(SC, "Finding the estate: three kinds of sprawl");
  tag(s, "What");
  const b = table(s, "Sprawl", 1.45, [2.9, 9.25], ["Sprawl", "How it grows"], [
    ["Too many instances", "A development instance becomes production; a vendor test instance is never decommissioned; an installer drops SQL Server Express on an application server"],
    ["Too many databases", "Databases accrete on the instances that already exist"],
    ["Forest entanglement", "Too many forest-spanning dependencies; the transformation doesn't begin until all three are assessed"],
  ], { fontSize: 12.5, limit: 4.3 });
  const p = panel(s, "Find", 0.6, b + 0.25, 12.15, null, HEX.navy, HEX.navyTint, "NO SINGLE INSTRUMENT FINDS EVERY INSTANCE", null, [
    "Discovery fuses the network and directory sweep, the MSSQLSvc SPN trail and Microsoft's assessment tooling into one inventory that counts each instance once",
    "The kit doesn't rebuild discovery: the Start Kit's SQL Server count finds the instances, and the kit classifies what it found",
  ], 13);
  sources(s, "Sources: Module 1, Unit 2; Data Platform: SQL Server Identity, Chapters 03 and 04; Runbook R02, Step 1; Chapter 01, \"Where the inventory comes from.\"");
  notes(s,
`Unit 2 is finding the estate. An estate grows by accretion. A development instance becomes production. A vendor test instance is never decommissioned. An installer drops SQL Server Express on an application server. The data platform book's chapter, The Shape of Twenty Years, names three overlapping problems: too many instances, too many databases, and too many forest-spanning dependencies. The transformation doesn't begin until they're assessed. No single instrument finds every instance, so discovery combines the network and directory sweep, the trail of service principal names, or S P Ns, that SQL Server registers, and Microsoft's assessment tooling, and fuses them into one inventory that counts each instance once. The kit doesn't rebuild discovery. The Start Kit's SQL Server count finds the instances, and the kit classifies what it found.`,
  `${M} — Unit 2 "Finding the estate"; workbook Chapter 01, "Where the inventory comes from."`);
}

// ================================================================== 4b What the inventory captures
{
  const s = content(SC, "What the inventory must capture");
  tag(s, "What");
  const b = table(s, "Cap", 1.45, [3.6, 8.55], ["For every instance it finds", "What it establishes"], [
    ["Version, edition and build", "The support and licensing posture"],
    ["Host operating system version", "The Arc and upgrade envelope"],
    ["Domain-join state and owning domain", "The forest-entanglement picture"],
    ["Service account and its source domain", "The credential dependencies"],
    ["Per database: size, last access, recovery model, owning application", "The utilization and zombie picture the lenses turn into a decision"],
  ], { fontSize: 13, limit: 5.0 });
  callout(s, "Rerun", b + 0.3, 1.2, "FaArrowsRotate", HEX.navy, "Not a point-in-time spreadsheet: ",
    "it's re-run, because instances appear and disappear across a multi-month assessment, and the plan must track a moving estate.");
  sources(s, "Sources: Module 1, Unit 2; Data Platform: SQL Server Identity, Chapter 04, \"What the inventory must capture.\"");
  notes(s,
`What does the inventory have to hold? The data platform book's chapter, The Estate Inventory, lists a consistent set of facts for every instance it can find. The version, edition and build number establish the support and licensing posture. The host operating system version establishes the Arc and upgrade envelope. The domain-join state and the owning domain establish the forest-entanglement picture. The service account and its source domain establish the credential dependencies. And for every database, the size, the last-access timestamp, the recovery model and the owning application establish the utilization and zombie picture that the lenses turn into a decision. The inventory isn't a point-in-time spreadsheet. It's designed to be re-run, because instances appear and disappear across a multi-month assessment, and the consolidation plan must track a moving estate.`,
  `${M} — Unit 2 "Finding the estate"; Data Platform: SQL Server Identity, Chapter 04, "What the inventory must capture."`);
}

// ================================================================== 4c The rights each depth needs
{
  const s = content(SC, "The rights each depth of discovery needs");
  tag(s, "Who");
  const b = table(s, "Dep", 1.45, [2.2, 4.6, 5.35], ["Depth", "What it gives", "What it needs beyond reading AD"], [
    ["A: Directory", "Candidate hosts and instances from SPNs and directory objects", "Nothing; the Browser probe on UDP 1434 needs only a network path"],
    ["B: Host", "The instances installed, and each service's account", "Local administrator by default, or a least-privilege alternative such as a JEA endpoint"],
    ["C: Instance", "Version, mode, every login, databases, last use, linked servers, jobs", "A Windows login with the Start Kit's read permissions; never sysadmin"],
    ["D: Azure Arc", "A continuous inventory in Azure (optional)", "The agent's install and onboarding roles; Azure Reader to view it"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Id", b + 0.3, 1.2, "FaUserShield", HEX.teal, "One dedicated discovery identity per forest: ",
    "a gMSA for scheduled runs; host and instance rights for the assessment window only, each grant and removal recorded.");
  sources(s, "Sources: Module 1, Unit 2; Runbook R02, Step 1, \"The rights each depth of discovery needs.\"");
  notes(s,
`Runbook R oh two's first step sets out the rights each depth of discovery needs. Read access to Active Directory finds candidates; it doesn't complete the inventory. The directory depth gives candidate hosts and instances from S P Ns and directory objects, and needs nothing more: the SQL Server Browser probe needs only a network path. The host depth gives the instances installed and each service's account, and needs local administrator by default, or a least-privilege alternative. The instance depth gives the version, the mode, every login and the databases, and needs a Windows login with the Start Kit's read permissions. Never sysadmin. Azure Arc is an optional fourth depth. Run every depth under one dedicated discovery identity per forest, a group managed service account for scheduled runs, and add the host and instance rights for the assessment window only, recording each grant and its removal.`,
  `${M} — Unit 2 "Finding the estate"; Runbook R02, Step 1, "The rights each depth of discovery needs."`);
}

// ================================================================== 5 The three lenses
{
  const s = content(SC, "The three lenses turn the inventory into a judgment");
  tag(s, "What");
  const b = table(s, "Lens", 1.45, [2.6, 9.55], ["Lens", "What it finds"], [
    ["Utilization", "Zombies: a database with no connections in 400 or more days, no restores consumed and a retired owning application"],
    ["Version", "What can take Entra logins at all: FROM EXTERNAL PROVIDER needs SQL Server 2022 or later"],
    ["Dependencies", "Linked servers, replication and SSIS packages: what most often overturns a naive plan"],
  ], { fontSize: 13, limit: 4.4 });
  callout(s, "Out", b + 0.3, 1.2, "FaFilter", HEX.navy, "The result: ",
    "one class per instance. Retain, consolidate into a target, or retire; the kit adds review for an instance with no version.");
  line(s, "Dmv", "Usage counters reset when the engine starts: read the start time, and take the long-horizon evidence from login auditing, backup history and the application portfolio.", b + 1.75, 0.75, 13.5);
  sources(s, "Sources: Module 1, Unit 3; Data Platform: SQL Server Identity, Chapters 05 and 06; Runbook R02, Steps 2 and 3.");
  notes(s,
`Unit 3 is the gate. Three lenses turn the inventory into a judgment. Utilization finds zombies: a database with no connections in four hundred or more days, no restores consumed, and a retired owning application. Version decides what can take Entra logins at all, since the FROM EXTERNAL PROVIDER syntax needs SQL Server 2022 or later. And dependencies, such as linked servers, replication and S S I S packages, are what most often overturn a naive plan. The result is one class per instance: retain, consolidate into a target, or retire. One caution from R oh two. The index-usage counters reset when the engine starts, so a database on an instance that restarted last week can look unused. Read the start time, and take the long-horizon evidence from login auditing, backup history and the application portfolio, before you call anything a zombie.`,
  `${M} — Unit 3 "The gate"; workbook Chapter 01, "The classifier."`);
}

// ================================================================== 6 The classifier and constraints
{
  const s = content(SC, "The classifier's first pass, and the constraints");
  tag(s, "How");
  const b = table(s, "Cls", 1.45, [1.0, 8.15, 3.0], ["Order", "Rule", "Class"], [
    ["1 and 2", "Every database idle for the zombie threshold or longer; or every owning application decommissioned", "retire"],
    ["3", "No version", "review"],
    ["4 and 5", "Version before SQL Server 2022; SQL Server 2022 or later", "consolidate (shared); retain"],
    ["6", "A vendor-lock constraint on a non-retired instance", "retain in place, upgrade or exception needed"],
    ["7", "A collation, compliance-isolation or indivisible constraint on a consolidate", "consolidate (dedicated target)"],
    ["8", "A failover cluster instance still in consolidate", "retain, re-platform first"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Arch", "A first pass only: the architects confirm or override every row, and record why.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 3; Chapter 01, \"The classifier\"; Data Platform: SQL Server Identity, Chapter 06, \"What can't be consolidated.\"");
  notes(s,
`The kit's classifier follows R oh two's first pass, then applies the recorded constraints. An instance whose every database is idle past the zombie threshold, or whose every owning application is decommissioned, is retired. An instance with no version goes to review, never to retain. A version before SQL Server 2022 consolidates into a shared target, and 2022 or later is retained. Then the constraints. Collation conflicts, version-locked vendor applications, compliance isolation, indivisible dependencies and failover cluster instances turn an apparent consolidation into a dedicated target, or a retain in place. It's a first pass: the architects confirm or override every row, and record why.`,
  `${M} — Unit 3 "The gate"; workbook Chapter 01, "The classifier."`);
}
endModule(SC);

// ================================================================== 7 Try it: classify
{
  const s = content(SL, "Try it: make the run's folder, classify the estate");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, L(String.raw`
$ Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
$ $Run = "C:\FMWLabs\results\data-platform-01\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
$ New-Item -ItemType Directory -Path $Run -Force | Out-Null
$ $Run
C:\FMWLabs\results\data-platform-01\lab1\<run>
# Step 1: classify the fictional estate
$ ./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath "$Run\estate"
Instance Version Classification Target    EntersMigration Reason
-------- ------- -------------- ------    --------------- ------
SQLPRD01 2022    retain                   yes             SQL Server 2022, in use
SQLPRD02 2022    retain                   yes             SQL Server 2022, in use
SQLLEG03 2016    consolidate    shared    at the target   SQL Server 2016 can't take Entra logins
SQLFCI04 2019    retain                   yes             Constraint: The vendor certifies SQL Server 2019 only, ...
SQLOLD05 2014    retire                   no              Every database idle 400 days or more
SQLPRD06 2025    retain                   yes             SQL Server 2025, in use; consolidation target
SQLLEG07 2017    consolidate    dedicated at the target   Constraint (collation): GrantsTracking uses Latin1_General_CI_AS; ...
SQLDEV08 unknown review                   no              No version: discovery found the instance but nothing read it

Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-01/lab1/<run>/estate
Evidence for ESTATE (Classify every instance retain, consolidate, retire or review): CM-8; KSI-PIY-GIV
Denominator: 8 instances (consolidate 2, retain 4, retire 1, review 1)
`), { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "Fci", "SQLFCI04 is retained only because of its vendor constraint; it's also a failover cluster instance.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" setup and step 1; Chapter 01, Lab 1, step 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no instance and no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start in U T C, so running the lab again never overwrites a run. Step one classifies eight instances for contoso dot example. Look at the reasons. Sequel P R D oh one and oh two run SQL Server 2022 and are retained, and sequel P R D oh six, on 2025, is retained as the consolidation target. Sequel L E G oh three, on 2016, can't take Entra logins, so it consolidates into the shared target. Sequel O L D oh five is retired: every database idle four hundred days or more. Sequel L E G oh seven's collation conflict sends it to a dedicated target. Sequel D E V oh eight has no version, so it's in review. And the denominator line counts each class: two consolidate, four retain, one retire and one review. Sequel F C I oh four is retained only because of its vendor constraint. It's also a failover cluster instance, which Chapter 3 puts in Category 3.`,
  `${M} — Unit 4 "Exercise: Lab 1," setup and step 1; workbook Chapter 01, Lab 1, step 1.`);
}

// ================================================================== 8 Try it: manifest
{
  const s = content(SL, "Try it: open the manifest, check the folder");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, L(String.raw`
# Step 2: open the manifest
$ Get-Content "$Run\estate\manifest.json"
{
  "step": "ESTATE",
  "title": "Classify every instance retain, consolidate, retire or review",
  "mode": "read-only",
  "asOf": "2026-11-20",
  "controls": [ "CM-8" ],  "ksis": [ "KSI-PIY-GIV" ],
  "files": [ { "file": "estate.csv",  "sha256": "b5f09922d75718dce89151ce72bc8376df2e6db029d072c4ce4370243c4b38ad" },
             { "file": "estate.json", "sha256": "b9e75284a7ed6c29b9f10fe128aa1cd249753cf2b9b7920d27b671d38b3fe940" } ]
}
# Step 3: check the folder against its manifest
$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$ Test-SqlManifest -OutputPath "$Run\estate"
File        Recorded     Now          Match
estate.csv  b5f09922d757 b5f09922d757  True
estate.json b9e75284a7ed b9e75284a7ed  True
`), { label: `TRY IT  ·  ${CAP} (REFLOWED; TABLE RULES CUT)`, pt: 10.5 });
  line(s, "Hash", "The manifest names the step, its control and KSI, and the SHA-256 of each file it wrote.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 2 and 3; Chapter 01, \"The manifest\" and Lab 1, steps 2 and 3.");
  notes(s,
`Step two opens the manifest. It names the step, estate, and says the run was read-only. It names the step's control, C M eight, and its K S I, and the S H A two fifty-six hash of each file the run wrote: the C S V and the jay-son. Step three imports the kit's module and checks the folder against its manifest. Both files match the hashes recorded when the run wrote them. This is why the manifest matters to an assessor: the I S S O keeps the run folder, and reruns the check on the stored copy, so the inventory kept is the one the run wrote.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 2 and 3; workbook Chapter 01, "The manifest."`);
}

// ================================================================== 9 Try it: the two that don't enter
{
  const s = content(SL, "Try it: the two instances that don't enter");
  tag(s, "How");
  const c = code(s, "Two", 0.6, 1.45, 12.15, L(String.raw`
# Step 4: look at the two instances that don't enter the migration
$ (Read-SqlJson tests/fixtures/estate/estate.json).instances | Where-Object name -in 'SQLOLD05', 'SQLDEV08' |
      Select-Object name, productVersion, discoveredBy, @{ n = 'idleDays'; e = { $_.databases.lastAccessDays } }
name     productVersion discoveredBy      idleDays
----     -------------- ------------      --------
SQLOLD05 12.0.6449.1                           912
SQLDEV08                MSSQLSvc SPN only
`), { label: `TRY IT  ·  ${CAP} (ONE COMMAND WRAPPED)`, pt: 11 });
  const l = panel(s, "Old", 0.6, c + 0.3, 6.0, null, HEX.red, HEX.redTint, "SQLOLD05: RETIRE", null, [
    "Its only database was last used 912 days ago",
    "Past the 400-day zombie threshold",
  ], 13.5);
  const r = panel(s, "Dev", 6.85, c + 0.3, 5.9, null, HEX.amber, HEX.amberTint, "SQLDEV08: REVIEW", null, [
    "Known only by its SPN; nothing read its version",
    "Stays in review until someone reads it or confirms the host is gone",
  ], 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" step 4; Chapter 01, Lab 1, step 4.");
  notes(s,
`Step four looks at the two instances that don't enter the migration. Sequel O L D oh five's only database was last used nine hundred and twelve days ago, well past the four-hundred-day threshold, so it's retired. Sequel D E V oh eight is known only by its S P N: discovery found it, but nothing read its version. It stays in review until someone reads it, or confirms the host is gone. Review is never retain.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 4; workbook Chapter 01, Lab 1, step 4.`);
}

// ================================================================== 10 Try it: tamper, tests, runs
{
  const s = content(SL, "Try it: change a file, run the tests, list runs");
  tag(s, "How");
  const c = code(s, "Tamp", 0.6, 1.45, 12.15, L(String.raw`
# Step 5: change one file and check again
$ Copy-Item -Recurse "$Run\estate" "$Run\estate-tampered"
$ Add-Content -Path "$Run\estate-tampered\estate.csv" -Value '"SQLNEW09","2022","unknown","retain","","yes","added by hand"'
$ Test-SqlManifest -OutputPath "$Run\estate-tampered"
File        Recorded     Now          Match
estate.csv  b5f09922d757 a9fe6ab8be3b False
estate.json b9e75284a7ed b9e75284a7ed  True
# Step 6: run this chapter's tests
$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount
PassedCount FailedCount
          8           0
# Step 7: list your runs
$ Get-ChildItem C:\FMWLabs\results\data-platform-01\lab1 -Name
<run>
`), { label: `TRY IT  ·  ${CAP} (TABLE RULES CUT)`, pt: 10.5 });
  line(s, "Keep", "Nothing to clean up: the kit's folder is as you unzipped it, and the run's results stay in $Run.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 5 to 7; Chapter 01, Lab 1, steps 5 and 6.");
  notes(s,
`Step five copies the run's folder, adds a row by hand to the copy's C S V, and checks it again. The C S V no longer matches its recorded hash; the jay-son still does. That's how the manifest catches a file changed after the run. Step six runs this chapter's tests: eight pass, none fail. Step seven lists your runs, one line per run, oldest first. There's nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in its own folder.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 5 to 7; workbook Chapter 01, Lab 1, steps 5 and 6.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: classify a test domain's instances");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test domain with at least one test SQL Server instance, never production; a repository checkout; PowerShell 7 with the ActiveDirectory module; a network path to the instance's port and UDP 1434; a login with the Start Kit's read permissions, never sysadmin"],
    ["1 and 2", "Discover the domain's instances with the Start Kit, and read what it found, with its own first pass"],
    ["3 and 4", "Turn its output into the kit's inventory and classify it; add the owners' constraints and application status, and classify again: the second run is the one to keep"],
    ["5", "Back it out: delete the lab's files; have the administrator remove the read permissions"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "Nr", b + 0.3, 0.75, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "Nothing on the instance or in the directory changes.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2\"; Chapter 01, \"Lab 2: a test instance.\"");
  notes(s,
`Lab 2 runs on your own test domain. It hasn't been run by the authors. You need a test domain with at least one test SQL Server instance, never production; a repository checkout, so the Start Kit is beside the kit; PowerShell 7 with the Active Directory module on a domain-joined machine; a network path to the instance's port and U D P fourteen thirty-four; and a Windows login holding the Start Kit's read permissions. Never sysadmin. Run the Start Kit's discovery, turn its output into the kit's inventory, and classify it. Compare each row with the Start Kit's own first pass, add the owners' constraints and application status, and classify again. The second run is the one to keep. Nothing on the instance or in the directory changes. To back it out, delete the lab's files, and have the administrator remove the read permissions if they were granted for the lab.`,
  `${M} — Unit 5 "Exercise: Lab 2"; workbook Chapter 01, "Lab 2: a test instance."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 2.9, 2.0, 3.65], ["What the step does", "Requirement it supports", "KSI", "Evidence the ISSO keeps"], [
    ["Classifies every instance and counts the denominator once", "CM-8 System Component Inventory", "KSI-PIY-GIV", "estate.csv, estate.json and manifest.json, with each file's SHA-256"],
    ["Shows a changed file no longer matches its run", "Provides evidence for CM-8: the inventory kept is the one the run wrote", "KSI-PIY-GIV", "Test-SqlManifest's output beside the run folder"],
  ], { fontSize: 12.5, limit: 4.0 });
  callout(s, "R02", b + 0.3, 1.2, "FaFileShield", HEX.navy, "Runbook R02 also maps: ",
    "the rights each depth of discovery needs to AC-6, CM-8, CM-8(1) and IA-5; its reconciliation with Azure Arc to CM-8, CM-8(1) and KSI-PIY-GIV.");
  line(s, "Ass", "The run's files provide evidence; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 1.75, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Introduction\" (the federal requirement); Chapter 01, \"Federal requirements and evidence\"; NIST SP 800-53; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Chapter 1's table maps the classification and the manifest check to C M eight, System Component Inventory, in NIST SP 800-53, with the K S I for the inventory. Classifying every instance and counting the denominator once supports C M eight, with the C S V, the jay-son and the manifest as evidence. Showing that a changed file no longer matches its run provides evidence that the inventory kept is the one the run wrote. Runbook R oh two also maps the rights each depth of discovery needs, and its reconciliation with Azure Arc. K S Is are FedRAMP twenty X indicators for cloud service providers: the agency lines its own evidence up with them. The run's files provide evidence for a control; the agency still sets its parameters, and the assessor decides.`,
  `${M} — Unit 1 "Introduction" (the federal requirement); workbook Chapter 01, "Federal requirements and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on the gate", [
    { q: "SQLDEV08 was found only by its MSSQLSvc SPN, and nothing read its version. How does the kit classify it?", options: ["a. retain, because discovery found it", "b. retire, because nothing reads it", "c. review, until someone reads it or confirms the host is gone"] },
    { q: "SQLFCI04 runs SQL Server 2019, yet the kit retains it. Why?", options: ["a. A recorded vendor constraint keeps it in place; an upgrade or exception is still needed", "b. SQL Server 2019 can take Entra logins", "c. Failover cluster instances are always retained"] },
  ], "1 c: no version means review, never retain. 2 a: rule 6 of the classifier, the vendor-lock constraint.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 2, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: sequel D E V oh eight was found only by its S P N, and nothing read its version. How does the kit classify it? The answer is c: review, until someone reads it or confirms the host is gone. No version means review, never retain. Second: sequel F C I oh four runs SQL Server 2019, yet the kit retains it. Why? The answer is a: a recorded vendor constraint keeps it in place, and an upgrade or exception is still needed. That's rule six of the classifier. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 2; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: count the estate, then pass the gate");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw why the estate is counted and rationalized before any login moves",
    "Sorted every instance into retain, consolidate, retire or review",
    "Classified a fictional estate, and saw its manifest catch a changed file",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: The Authentication Audit", [
    "Or workbook Chapter 01's checklist, before shipping",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "Evidence the ISSO keeps: ",
    "the run folder, estate.csv, estate.json and manifest.json with each file's SHA-256, and Test-SqlManifest's output, rerun on the stored copy.");
  sources(s, "Sources: Module 1, \"Summary\"; workbook Chapter 01, \"Checklist.\"");
  notes(s,
`To sum up. You learned why the estate is counted and rationalized before any login moves, and how the gate sorts every instance into retain, consolidate, retire or review. You classified a fictional estate, and saw its manifest catch a file changed after the run. The evidence an I S S O keeps from this module is the run folder, the C S V, the jay-son and the manifest with each file's hash, and the manifest check's output beside it, rerun on the stored copy. Before shipping, work through Chapter 1's checklist. Next is Module 2, the authentication audit.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 01, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/data-platform/01-the-estate-and-the-consolidation-gate.md (Data Platform and SQL Server Identity learning path, Module 1): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Data Platform: SQL Server Identity, Chapters 03 (The Shape of Twenty Years), 04 (The Estate Inventory), 05 (Rationalization) and 06 (Retain, Consolidate, Retire); Runbook R02, Estate Discovery and the Consolidation Gate, Steps 1 to 3 and its control mappings. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 01 of Building SQL Server Identity, The Estate and the Consolidation Gate: \"Where the inventory comes from,\" \"The classifier,\" \"The manifest,\" Lab 1, Lab 2 (not run by the authors), \"Federal requirements and evidence,\" \"Checklist.\" Kit: examples/sql-server-identity (Invoke-SqlEstate.ps1, powershell/SqlIdentity, tests/fixtures/estate).",
  "Lab output: the module page's Lab 1 expected output, on the kit's fictional fixtures; trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
