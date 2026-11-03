// Attribute-Driven Migration learning path, Module 5: Build machine configuration packages — the module's narrated deck.
// Teaches docs/training/attribute-driven-migration/05-machine-configuration.md, Learn-style: objectives, the concepts,
// "Try it" slides with the Lab 1 commands and the results Chapter 07's Lab 1 text gives (not re-run: step 1 downloads
// three modules from the PowerShell Gallery, which the authors didn't do for this deck, as the verification log says), two
// checks that don't need those modules (re-run November 3, 2026 in a scratch copy of examples/machine-configuration), Lab 2,
// the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the
// learning path's verification log, Book 19 Chapter 07, or the kit (examples/machine-configuration); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-5/build.js \
//                      presentations/training-adm-module-5/Training_ADM_Module_5.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 5: Build machine configuration packages",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 5: Machine configuration",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 5: Build machine configuration packages";
const OUT = process.argv[2] || "Training_ADM_Module_5.pptx";
const M = "Training, Attribute-Driven Migration, Module 5";

// The title slide, as shared.js draws it, with this path's name over the units.
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "ATTRIBUTE-DRIVEN MIGRATION LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const NOTRUN = "TRY IT  ·  LAB 1, AS CHAPTER 07'S LAB 1 TEXT GIVES IT (NOT RE-RUN)";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: Build machine configuration packages", "Attribute-Driven Migration learning path · Guide Gate 5, with Book 19 Chapter 07",
    ["Package, definition, assignment  ·  What Learn's cmdlets leave to you  ·  The release registry", "Clean the MOF  ·  The checks  ·  Provenance  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 5 of the Attribute-Driven Migration learning path: build machine configuration packages. This module serves Gate 5 of the implementation guide, and takes Chapter 07 of Book 19. For the server settings machine configuration owns, the code is a DSC configuration, and Azure Policy delivers it. You'll follow Learn's steps, see where their outputs fall short, and learn the build that checks between them: it cleans the MOF so it's the same every time, checks the package and the definition, and refuses what the release registry doesn't allow. The lab runs offline on Windows, with nothing signed in. The code is illustrative: tested against fixtures, not against a production subscription.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a package needs a checked build");
  tag(s, "Why");
  const b = table(s, "Gaps", 1.45, [3.2, 8.95], ["Where", "What it means"], [
    ["Gate 5", "An Arc server is an Azure resource; its tags are its attributes; each setting has one owning tool"],
    ["Machine configuration", "For the settings it owns, a DSC configuration that Azure Policy delivers"],
    ["Learn's cmdlets", "Build a package and a definition, but don't make the same bytes twice"],
    ["What machines download", "Learn's output carries your user name and computer name"],
  ], { fontSize: 13.5, limit: 4.4 });
  callout(s, "Point", b + 0.35, 0.95, "FaUserShield", HEX.red, "The stakes: ",
    "a package is the server baseline in a file, so what was built, from what, and what shipped is the evidence.");
  sources(s, "Sources: Module 5, Unit 1 \"Introduction\"; the federal requirement.");
  notes(s,
`Why does a package need a checked build? Gate 5 sets the conventions the server track builds on. Once connected, an Arc server is an Azure resource whose tags are its attributes, and each setting has one owning tool. For the settings machine configuration owns, the code is a DSC configuration, and Azure Policy delivers it. Learn's cmdlets build a package and a definition. But they don't make the same bytes twice, and they write your user name and computer name into what the machines download. A package is the server baseline in a file. So what was built, from what, and what shipped is the evidence. In this module you follow Learn's steps, then run the build that checks between them.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Describe a package, a policy definition and a guest assignment, and the three assignment types",
    "Explain what Learn's cmdlets leave to you, and why each gap matters",
    "Explain the release registry, and what MC-POL-06 and MC-POL-08 refuse",
    "Run the checked build, and compare two builds' hashes",
    "Explain why IncludeArcMachines has to be set for Arc-enabled servers",
  ], [
    "Module 4, for one owning tool per setting",
    "Windows with PowerShell 7.1 or later and Pester 5",
    "Step 1 saves three pinned modules from the PowerShell Gallery",
  ], 45);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; Unit 4; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll describe a package, a policy definition and a guest assignment, and the three assignment types. You'll explain what Learn's cmdlets leave to you, and why each gap matters in a federal pipeline. You'll explain the release registry, and what MC-POL oh six and oh eight refuse. You'll run the checked build, and compare two builds' hashes. And you'll explain why the include Arc machines parameter has to be set for Arc-enabled servers. Before you start, do Module 4, for one owning tool per setting. You need Windows, with PowerShell 7.1 or later and Pester 5. The lab's first step saves three pinned modules from the PowerShell Gallery into a folder, rather than installing them.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; Unit 4; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Model
{
  const s = content(SC, "A package, a definition and a guest assignment");
  tag(s, "What");
  const l = panel(s, "Model", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "LEARN'S MODEL HAS THREE PARTS", null, [
    "A package: a .zip with the compiled MOF and the DSC resource modules it uses",
    "A policy definition: points at the package by URI and hash",
    "A guest assignment: created on each machine in scope when the definition is assigned",
  ], 13);
  const b = table(s, "Types", 1.45, [2.5, 2.8], ["Assignment type", "What the agent does"], [
    ["Audit", "Reports; changes nothing"],
    ["ApplyAndMonitor", "Applies once, then reports drift"],
    ["ApplyAndAutoCorrect", "Applies, and corrects drift"],
  ], { fontSize: 12.5, x: 7.45, limit: 4.0 });
  callout(s, "Case", Math.max(l, b) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Case sensitive: ",
    "the assignment type's spelling matters. A machine can hold up to 50 guest assignments.");
  sources(s, "Sources: Module 5, Unit 2; MS Learn: \"What is Azure Machine Configuration?,\" \"Understand machine configuration assignment resources,\" \"Remediation options for machine configuration.\"");
  notes(s,
`Microsoft Learn's overview, What is Azure Machine Configuration, describes a model with three parts. A package is a zip file with the compiled MOF and the DSC resource modules it uses. It says what the machine should look like. A policy definition, in the Guest Configuration category, points at the package by URI and by hash. When the definition is assigned, the service creates a guest assignment on each machine in scope, and the agent on the machine downloads the package, evaluates it and reports compliance. A machine can hold up to fifty guest assignments. Learn's page on remediation options gives each assignment one of three types. Audit reports and changes nothing. Apply and monitor applies once, then reports drift without correcting it. Apply and auto correct applies, and corrects drift at the next evaluation. And the spelling is case sensitive. Remember that for step six of the lab.`,
  `${M} — Unit 2 "Where machine configuration sits"; Book 19, Chapter 07 — "Where machine configuration sits."`);
}

// ================================================================== 5 What Learn leaves
{
  const s = content(SC, "What Learn's cmdlets leave to you");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [5.6, 6.55], ["Learn's cmdlets, on their own", "What examples/machine-configuration adds"], [
    ["The MOF records user name, host name, date and full path", "ConvertTo-McCleanMof removes them; MC-PKG-04 refuses them"],
    ["Property order changes each compile", "The cleaner sorts properties: same source, same MOF bytes"],
    ["A different .zip each run, even from the same MOF", "Build once, check, publish those bytes; provenance.json"],
    ["Nothing checks for secrets", "MC-PKG-05 scans for credentials, SAS signatures and keys"],
    ["-PolicyId and -PolicyVersion: whatever they're given", "config/releases.json; MC-POL-05 to MC-POL-07"],
    ["IncludeArcMachines defaults to \"false\"", "MC-POL-09 reminds on every build meant for Arc"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "Verdict", b + 0.25, 0.85, "FaListCheck", HEX.navy, "The verdict: ",
    "Learn's procedure is the procedure. The build calls its cmdlets in its order, and adds checks between the steps.");
  sources(s, "Sources: Module 5, Unit 2; Microsoft Learn: \"How to develop a custom machine configuration package,\" \"How to create custom machine configuration policy definitions.\"");
  notes(s,
`Microsoft Learn's guide, How to develop a custom machine configuration package, documents the whole procedure, one page a step: set up, author, package, test, publish, sign, define, and publish the definition. Running those cmdlets offline shows what they don't do; the gaps are what the kit's tests observed. The compiled MOF records the user name, host name, date and full script path, and that MOF goes to a blob the machines read. Compiling writes each resource's properties in a different order each run, so the hash changes with no real change. Packaging writes a different zip each run, even from the same MOF. Nothing checks for secrets, although that Learn guide says not to include them. The policy cmdlet takes whatever policy I D and version it's given; Learn's page on creating policy definitions says to reuse the I D for updates, and a new GUID creates a second definition. And the generated definition leaves Arc-enabled servers out by default. The build calls Learn's cmdlets in Learn's order, and replaces none of them. What it adds sits between the steps.`,
  `${M} — Unit 2; Book 19, Chapter 07 — "What Learn gives you," "What it leaves to you."`);
}

// ================================================================== 6 Registry
{
  const s = content(SC, "The release registry: what is in production");
  tag(s, "What");
  const b = table(s, "Reg", 1.45, [2.6, 9.55], ["Field (config/releases.json)", "What it holds, and what it guards"], [
    ["policyId", "Fixed: Learn says reuse it, so an update replaces the definition (MC-POL-05)"],
    ["mode", "Checked case-sensitively against the three assignment types"],
    ["published", "Rises in the pull request that publishes; a second build of 1.0.0 fails MC-POL-06"],
    ["identity: system", "Machines read the package with their system-assigned identity, which works for Arc"],
    ["include_arc", "Arc-enabled servers are a stated choice"],
    ["owner_tag", "ConfigOwner: ArcMachineConfiguration; an enforcing definition with no filter fails MC-POL-08"],
  ], { fontSize: 12.5, limit: 5.4 });
  line(s, "Owner", "Two tools on one setting flip it back and forth, each reporting success: MC-POL-08 at build, VK-ARC-07 after.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 5, Unit 3; Microsoft Learn: \"How to create custom machine configuration policy definitions,\" \"How to provide secure access to custom machine configuration packages.\"");
  notes(s,
`The release registry is the kit's design: the reviewed record of what is in production, one entry per configuration. The policy I D never changes. Learn's page on creating policy definitions says to reuse it, so updates replace the definition instead of creating a second one. The mode is checked case-sensitively against the three assignment types. The published version moves up in the same pull request that publishes a new version, so a second build of one point oh point oh fails MC-POL oh six. The identity is system, so each machine reads the package with its own system-assigned identity, which Learn's page on secure access to packages says works for Arc-enabled servers. Including Arc machines is a stated choice. And the owner tag is the one this workbook's Arc track guidance uses. An enforcing definition without that filter fails MC-POL oh eight, because two tools on one setting flip it back and forth, each reporting success.`,
  `${M} — Unit 3 "The registry, the cleaner and the checks"; Book 19, Chapter 07 — "The release registry."`);
}

// ================================================================== 7 Clean and check
{
  const s = content(SC, "Clean the MOF, then check the package and definition");
  tag(s, "What");
  const l = panel(s, "Clean", 0.6, 1.45, 4.0, null, HEX.navy, HEX.navyTint, "CONVERTTO-MCCLEANMOF", null, [
    "Drops the header, Author, GenerationDate and GenerationHost",
    "Keeps SourceInfo as ::line::column::resource",
    "Sorts properties; LF line endings",
  ], 12.5);
  const m = panel(s, "Pkg", 4.8, 1.45, 4.0, null, HEX.teal, HEX.tealTint, "TEST-MCPACKAGE: 7 RULES", null, [
    "MOF and metaconfig at the root; the type the mode needs",
    "Within 100 MB; no build-host data; no secrets",
    "Modules at their compiled versions; a version in the name",
  ], 12.5);
  const r = panel(s, "Pol", 9.0, 1.45, 3.75, null, HEX.amber, HEX.amberTint, "TEST-MCPOLICY: 9 RULES", null, [
    "MC-POL-01 to MC-POL-09",
    "MC-POL-02: every contentHash is this package's SHA-256",
  ], 12.5);
  callout(s, "Three", Math.max(l, m, r) + 0.3, 0.95, "FaFileShield", HEX.navy, "Compiled three times: ",
    "three different MOFs, and one cleaned MOF. A hand-edited definition or a rebuilt package fails MC-POL-02, not on a server.");
  sources(s, "Sources: Module 5, Unit 3; Microsoft Learn, \"How to create custom machine configuration package artifacts\"; Azure/azure-policy guest configuration samples; kit design.");
  notes(s,
`Three steps sit between Learn's, and they're the kit's design. The cleaner rewrites the compiled MOF into one canonical form. It drops the header comment, the author, the generation date and the generation host. It keeps source info in the short form Microsoft's own sample MOF uses, sorts each instance's properties, and writes Unix line endings. Compiled three times, the configuration gives three different MOFs, and one cleaned MOF. Then the package check opens the zip and applies seven rules: the files at the root, the right type for the mode, the hundred-megabyte limit that Learn's page on creating package artifacts sets, no build-host data, nothing that looks like a secret, every module at the version it was compiled against, and a version in the name. Then the definition check applies nine. The one that catches the most is MC-POL oh two: every copy of the content hash must be this package's hash.`,
  `${M} — Unit 3; Book 19, Chapter 07 — "Clean the MOF," "Check the package," "Check the definition."`);
}

// ================================================================== 8 Provenance
{
  const s = content(SC, "The provenance manifest: what was built and shipped");
  tag(s, "What");
  const l = panel(s, "Manifest", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "PROVENANCE.JSON HOLDS", null, [
    "The configuration, version, policy ID and mode",
    "The mof, package and policy files, each with its SHA-256",
    "The pinned modules: GuestConfiguration 4.12.0, PSDesiredStateConfiguration 2.0.7, PSDscResources 2.12.0.0",
    "The findings counts",
  ], 13);
  const r = panel(s, "Hashes", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "TWO KINDS OF HASH", null, [
    "The MOF hash is the reviewable one: the same for anyone who builds the same commit",
    "The package and definition hashes identify the bytes that shipped",
  ], 13);
  callout(s, "ISSO", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.navy, "For the ISSO: ",
    "download the published blob, hash it, and match it here. Chapter 09 carries this file into the evidence package.");
  sources(s, "Sources: Module 5, Unit 3; Book 19, Ch 07 \"The provenance manifest.\"");
  notes(s,
`The build records what it did in a provenance manifest: what was built, from what, and what shipped. It holds the configuration, its version, the fixed policy I D and the mode. It holds the MOF, the package and the policy definition, each with its hash. It records the pinned module versions the build used, and the counts of findings, warnings and information items. There are two kinds of hash in it. The MOF hash is the reviewable one: it's the same for anyone who builds the same commit. The package and definition hashes identify the bytes that shipped. So an ISSO can download the published blob, hash it, and match it against this file. Chapter 09, in Module 8, carries the manifest into the evidence package.`,
  `${M} — Unit 3; Book 19, Chapter 07 — "The provenance manifest."`);
}
endModule(SC);

// ================================================================== 9 Try it: Learn by hand
{
  const s = content(SL, "Try it: follow Learn's steps by hand, then check them");
  tag(s, "How");
  const c = code(s, "Learn", 0.6, 1.45, 12.15, [
    "# Step 1, in examples/machine-configuration: save the pinned modules to ./mcmods",
    "PS> Save-Module GuestConfiguration -RequiredVersion 4.12.0 -Path ./mcmods     # and two more",
    "# Step 2: compile, then package twice from the same MOF",
    "PS> New-GuestConfigurationPackage -Name TlsServerProtocols -Configuration ./lab/compiled/localhost.mof \\",
    "      -Type Audit -Path ./lab/p1 -Force                                     # and again into ./lab/p2",
    "PS> Get-FileHash ./lab/p1/TlsServerProtocols.zip, ./lab/p2/TlsServerProtocols.zip",
    "Two packages from one MOF, with two different hashes",
    "PS> Select-String -Path ./lab/compiled/localhost.mof -Pattern '@GeneratedBy|@GenerationHost|SourceInfo'",
    "Your user name and computer name in the header; your folder path in every SourceInfo",
    "# Step 3: what the checks say about Learn's output",
    "PS> Test-McPackage -Path ./lab/p1/TlsServerProtocols.zip -Name TlsServerProtocols -ExpectedType Audit",
    "Three rows: two MC-PKG-04 findings (build-host data, absolute path), the MC-PKG-07 warning",
  ], { label: NOTRUN, pt: 10 });
  line(s, "Not", "Not re-run for this deck: step 1 downloads from the PowerShell Gallery. The results are the chapter's text.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 1 to 3; Book 19, Ch 07, Lab 1; the path's verification log, claim 5.");
  notes(s,
`Try it. Lab 1 runs in the machine configuration folder, in PowerShell 7 on Windows. Nothing signs in, uploads, or installs the agent. Step one saves three pinned modules from the PowerShell Gallery into a folder, rather than installing them. Because of that download, the results on these slides weren't re-run for this deck: they're the ones Chapter 07's Lab 1 text gives, as the path's verification log records. Step two follows Learn's steps by hand. Compile the configuration, and package it twice from the same MOF. You get two packages with two different hashes. Look inside the MOF, and your user name and computer name are in the header, and your folder path is in every source info. Step three runs the package check on Learn's output: two MC-PKG oh four findings, for build-host data and an absolute path, and the oh seven warning, no version in the name.`,
  `${M} — Unit 4 "Exercise: Lab 1 (offline, no subscription)," steps 1 to 3; verification log, claim 5.`);
}

// ================================================================== 10 Try it: sample and build
{
  const s = content(SL, "Try it: Microsoft's sample, then the checked build");
  tag(s, "How");
  const c = code(s, "Build", 0.6, 1.45, 12.15, [
    "# Step 4: Microsoft's pinned sample, with the current module",
    "PS> Get-Command Test-GuestConfigurationPackage -ErrorAction SilentlyContinue   # nothing: renamed",
    "PS> Test-McMofText -Text (Get-Content ../third_party/.../AdministratorsGroupMembers.mof -Raw)",
    "(nothing: Microsoft's published MOF carries no build-host data)      # re-run November 3, 2026",
    "# Step 5: the checked build",
    "PS> pwsh ./powershell/Invoke-McBuild.ps1 -Name TlsServerProtocols -Version 1.0.0 \\",
    "      -ContentUri https://stcontosomc.blob.core.windows.net/machine-configuration \\",
    "      -ModulePath ./mcmods -OutputPath ./out",
    "Exit 0, with one information row, MC-POL-09: IncludeArcMachines defaults to false",
    "# Build again into ./out2, and compare the two provenance.json files",
    "The mof hashes match (they start ecffd795), and the package hashes don't",
  ], { label: NOTRUN, pt: 10.5 });
  line(s, "Read", "The cleaned MOF is the same every build; the package isn't. So publish the bytes the build checked.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 4 and 5; Azure/azure-policy samples at ca85d61 (August 4, 2021); PowerShell Gallery, \"GuestConfiguration 4.12.0.\"");
  notes(s,
`Step four runs Microsoft's pinned sample with the current module. Microsoft's sample, from the Azure Policy samples repository, is pinned at an August 2021 commit, five years older than GuestConfiguration 4.12.0 on the PowerShell Gallery. Its MOF still packages, but the cmdlet its script calls, test guest configuration package, returns nothing: it's been renamed. Then check Microsoft's published MOF with the kit's MOF check. It returns nothing, because Microsoft's published MOF carries no build-host data, the form the cleaner produces. That check needs none of the gallery modules, and it printed nothing again on November third. Step five runs the checked build. It exits zero, with one information row, MC-POL oh nine: include Arc machines defaults to false. Build again into a second folder, and compare the two manifests. The MOF hashes match, starting e c f f d seven nine five, and the package hashes don't. So you publish the exact bytes the build checked.`,
  `${M} — Unit 4 "Exercise: Lab 1 (offline, no subscription)," steps 4 and 5.`);
}

// ================================================================== 11 Try it: break the registry
{
  const s = content(SL, "Try it: break the registry three ways, then test");
  tag(s, "How");
  const c = code(s, "Break", 0.6, 1.45, 12.15, [
    "# Step 6: a copy of the registry in ./lab/releases.json; each build reads it with -Registry",
    "\"published\": \"0.0.0\" raised to \"1.0.0\"                 ->  exit 2, MC-POL-06",
    "\"mode\": \"Audit\" changed to \"applyAndAutoCorrect\"        ->  exit 1: the mode is case sensitive",
    "\"ApplyAndAutoCorrect\", with owner_tag removed             ->  exit 2, MC-POL-08: an enforcing",
    "                                                              definition with no owner filter",
    "# Step 7: the tests",
    "PS> $env:MC_MODULE_PATH = (Resolve-Path ./mcmods).Path",
    "PS> Invoke-Pester ./tests",
    "65 tests passing (49, with 16 skipped, if MC_MODULE_PATH isn't set)",
  ], { label: NOTRUN, pt: 11 });
  line(s, "Rerun", "Re-run November 3, 2026, with no modules saved: Tests Passed: 49, Failed: 0, Skipped: 16.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 6 and 7; examples/machine-configuration: config/releases.json, tests.");
  notes(s,
`Step six breaks the registry on purpose, three ways. Each time, you write a copy of the registry into the lab folder, and the build reads the copy. First, raise the published version to one point oh point oh, the version you're building. The build exits two, MC-POL oh six: the version didn't rise. Second, give the mode the wrong case, apply and auto correct with a lower-case a. The build exits one, because the assignment type is case sensitive. Third, fix the case, and remove the owner tag. The build exits two, MC-POL oh eight: an enforcing definition with no owner filter. Step seven runs the tests: sixty-five pass with the modules, and forty-nine, with sixteen skipped, without them. That second count needs no download, and on November third it gave forty-nine passed and sixteen skipped.`,
  `${M} — Unit 4 "Exercise: Lab 1 (offline, no subscription)," steps 6 and 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: publish and assign in a test subscription");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test subscription and a server you can rebuild, never production"],
    ["Test", "Test the package on the disposable server: local testing installs the agent and needs elevation"],
    ["Publish", "The exact bytes Lab 1 built, to a storage account with anonymous access off"],
    ["Grant and define", "Machines read with their own identity; publish the definition under the registry's policy ID"],
    ["Assign and read", "Assign with IncludeArcMachines set to true; read compliance against provenance.json's hash"],
    ["Back it out", "Step 8 deletes the assignment, definition, blob and role assignment, then rebuilds the server"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "remediation changes the machine it runs on. Follow Book 19, Chapter 07, Lab 2.");
  sources(s, "Sources: Module 5, Unit 5 \"Exercise: Lab 2\"; Microsoft Learn, \"How to test machine configuration package artifacts.\"");
  notes(s,
`Lab 2 needs a test subscription and a server you can rebuild, never production. Microsoft Learn's page, How to test machine configuration package artifacts, says local testing installs the agent and needs elevation, and remediation changes the machine it runs on. Test the package on the disposable server. Publish the exact bytes Lab 1 built to a storage account with anonymous access off. Grant the machines read access with their own identity, so no SAS token goes in the definition. Publish the definition under the registry's policy I D. Assign it with include Arc machines set to true. And read each machine's compliance against the hash in the provenance manifest. To back it out, step eight deletes the assignment, the definition, the blob and the role assignment, then rebuilds the disposable server. The authors haven't run Lab 2. Follow Chapter 07's Lab 2.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test subscription)"; Book 19, Chapter 07 — "Lab 2."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.95, 3.6], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["SR-3; SA-10: the build uses pinned module versions", "KSI-SCR-MIT", "The repository: RequiredModules.psd1"],
    ["SA-11; CM-3(2): the package check refuses build-host data", "KSI-CMT-VTD", "The check output"],
    ["SA-10; SI-7; CM-2: same commit, same cleaned MOF hash", "KSI-SVC-VRI; KSI-CMT-LMC", "provenance.json, in the evidence store"],
    ["CM-6; SI-7: contentHash in the definition; Arc a stated choice", "KSI-SVC-ACM; KSI-SVC-VRI", "The published definition"],
    ["CM-3; CM-6: bad version, mode case, no owner filter refused", "KSI-CMT-VTD", "The pull request's check run"],
    ["SI-7: the blob is the built package, byte for byte (Lab 2)", "KSI-SVC-VRI", "The change record"],
    ["AC-6; IA-5: machines' own identity, no SAS (Lab 2)", "KSI-IAM-ELP; KSI-IAM-SNU", "The Azure role assignment record"],
  ], { fontSize: 11.5, limit: 5.9 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 5, Units 1 and 7; NIST SP 800-53 (the SP 800-53B Moderate baseline); FedRAMP, \"Key Security Indicators,\" FedRAMP Consolidated Rules for 2026.");
  notes(s,
`The federal requirement. A package is the server baseline in a file, so what was built, from what, and what shipped is the evidence for NIST special publication eight hundred fifty-three controls such as S R three, S A ten, S I seven and C M two. The pinned module versions support supply chain and developer configuration management. The package check, refusing build-host data, supports developer testing. The same commit giving the same cleaned MOF hash, with the hashes identifying what shipped, supports software integrity and the baseline, and the provenance manifest is the evidence. The definition carries the package's content hash, and Arc servers are a stated choice. A version that didn't rise, a mode in the wrong case and an enforcing definition with no owner filter are refused, in the pull request's check run. And Lab 2 adds the change record for the published blob, and the role assignment record. The Key Security Indicators come from FedRAMP's Consolidated Rules for 2026: they're FedRAMP 20x indicators for providers, and the agency lines its evidence up with them. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 07's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on packages", [
    { q: "You run New-GuestConfigurationPackage twice on the same MOF. What do you get?", options: ["a. Two identical packages", "b. Two packages with different hashes, so a rebuilt package won't match the reviewed definition", "c. An error on the second run"] },
    { q: "You assign a definition to an Arc-enabled server and leave IncludeArcMachines at its default. What happens?", options: ["a. The server is evaluated as usual", "b. Nothing happens, and nothing says so; the build's MC-POL-09 row reminds you", "c. The assignment fails"] },
  ], "1 b: build once, check, publish those bytes (step 2). 2 b: the default is \"false\" (step 5).");
  sources(s, "Sources: Module 5, Unit 6 \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: you run the package cmdlet twice on the same MOF. What do you get? The answer is b: two packages with different hashes, so a rebuilt package won't match the reviewed definition. That's why the build packages once, checks, and publishes those exact bytes. Second: you assign a definition to an Arc-enabled server, and leave include Arc machines at its default. What happens? The answer is b: nothing happens, and nothing says so. The default is false, so every Arc-enabled server is out of scope, and the build's MC-POL oh nine row is the reminder. The module page has two more questions, on MC-PKG oh four and on the mode's case, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 6, Ansible beside Arc");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Followed Learn's procedure, and saw where its outputs fall short",
    "Met the build that makes the same MOF every time",
    "Saw it check the package and definition",
    "And refuse what the registry doesn't allow",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6: Onboard servers with Ansible beside Arc", [
    "A wave from a CMDB export",
    "A config owner and a patch owner",
    "A plan read before anything runs",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 07 checklist in Book 19.");
  sources(s, "Sources: Module 5, Unit 7 \"Summary\"; Module 6, \"Unit 1: Introduction.\"");
  notes(s,
`To sum up. You followed Learn's procedure, saw where its outputs fall short, and met the build that makes the same MOF every time, checks the package and the definition, and refuses what the registry doesn't allow. The evidence an ISSO keeps: both provenance files and the findings file in the evidence store, the registry and its pull requests, and in Lab 2, the published blob's hash, the role assignment, the definition's activity log entry, and each machine's compliance against the recorded hash. Before shipping, work through the Chapter 07 checklist. Next is Module 6: onboard servers with Ansible beside Arc. You'll read a CMDB export into groups and tags, plan a wave, and see what each server would get before anything is contacted.`,
  `${M} — Unit 7 "Summary"; Module 6 — "Unit 1: Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/attribute-driven-migration/05-machine-configuration.md (Attribute-Driven Migration learning path, Module 5): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 07 \"Where machine configuration sits,\" \"What it leaves to you,\" \"The release registry,\" \"Clean the MOF,\" \"Check the package,\" \"Check the definition,\" \"The provenance manifest,\" Lab 1, Lab 2, Checklist; the implementation guide's Gate 5.",
  "Kit: examples/machine-configuration (configurations/TlsServerProtocols.ps1; powershell/McPipeline.psm1; powershell/Invoke-McBuild.ps1; config/releases.json; tests), examples/third_party/guest-configuration-samples. Illustrative: tested against fixtures, not against a production subscription.",
  "Lab results: as Chapter 07's Lab 1 text gives them, not re-run (step 1 downloads from the PowerShell Gallery; verification log, claim 5). Re-run November 3, 2026, PowerShell 7.6.9, no modules saved: Test-McMofText on Microsoft's MOF (nothing) and Invoke-Pester (49 passed, 16 skipped). Lab 2 not run by the authors.",
]);

finish(OUT);
