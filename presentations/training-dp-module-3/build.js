// Data Platform and SQL Server Identity learning path, Module 3: Arc and the Engine's Identity — the module's narrated deck.
// Teaches docs/training/data-platform/03-arc-and-the-engines-identity.md, Learn-style: objectives, the concepts (what Arc
// gives the engine; the two layers and the cloud; the deployment sequence and the gate; the kit's category check and what
// it adds to Microsoft Learn), "Try it" slides with the module page's own Lab 1 commands and expected output (workbook
// Chapter 03's Lab 1 on the kit's fixtures), Lab 2, the federal requirement and evidence, a two-question check, and the
// summary. Every fact comes from the module page, Runbook R04 and the Book 06 chapters it links, workbook Chapter 03, or
// the kit (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-3/build.js \
//                      presentations/training-dp-module-3/Training_DP_Module_3.pptx
const TITLE = "Module 3: Arc and the Engine's Identity";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 3: Arc and the Engine's Identity",
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
const OUT = process.argv[2] || "Training_DP_Module_3.pptx";
const M = "Training, Data Platform, Module 3";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: Arc and the Engine's Identity", "Data Platform and SQL Server Identity learning path · Runbook R04, with workbook Chapter 03",
    ["What Arc gives the engine  ·  The sequence and the gate  ·  The category", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 3 of the Data Platform and SQL Server Identity learning path: Arc and the engine's identity. It teaches Runbook R oh four, with Chapter 3 of the developer workbook, Building SQL Server Identity. Module 2 left every current, non-clustered instance at "Category 1 or 2". In this module you settle that category from evidence.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why no Arc means no Entra login");
  tag(s, "Why");
  const l = panel(s, "Today", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "AN ON-PREMISES HOST", "No cloud identity of its own", [
    "No Arc, no machine identity",
    "No machine identity, no Entra login",
  ], 14);
  const r = panel(s, "Arc", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "CONNECTED TO AZURE ARC", "A system-assigned managed identity", [
    "The machine's identity lets the instance take part in Entra authentication",
  ], 14);
  callout(s, "Do", Math.max(l, r) + 0.3, 1.5, "FaCloud", HEX.navy, "In this module: ",
    "you settle each instance's category from evidence: the agent's status, the SQL extension's state and the instance's own Entra setting, read from the cloud a GCC (Moderate) tenant uses.");
  sources(s, "Sources: Module 3, \"Introduction\"; Runbook R04; workbook Chapter 03.");
  notes(s,
`Why does this matter? An on-premises SQL Server host has no cloud identity of its own. Connecting it to Azure Arc gives the machine a system-assigned managed identity, and that identity is what lets the instance take part in Entra authentication. No Arc, no machine identity. No machine identity, no Entra login. In this module you settle each instance's category from evidence: the agent's status, the SQL extension's state, and the instance's own Entra setting, read from the cloud a G C C Moderate tenant uses.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Explain what the Arc agent's managed identity gives the engine, and what the instance uses as its Entra identity on SQL Server 2022 and 2025",
    "Explain why engine Entra authentication (Layer 1) doesn't wait for OS-level Entra sign-in (Layer 2)",
    "Put the deployment steps in order, and name the checks that gate login migration",
    "Settle each audited instance's category with the kit, and say why it refuses a snapshot from an unrecorded cloud",
  ], [
    "Module 2",
    "For Resource Graph and its paging, Microsoft Automation, Module 4",
  ], 55);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain what the Arc agent's managed identity gives the engine, and what the instance uses as its Entra identity on SQL Server 2022 and on 2025. You'll explain why engine Entra authentication, Layer 1, doesn't wait for O S level Entra sign-in, Layer 2. You'll put the deployment steps in order, and name the checks that gate login migration. And you'll settle each audited instance's category with the kit, and say why it refuses a snapshot from an unrecorded cloud. Before you start, finish Module 2. For Resource Graph and its paging, see Module 4 of the Microsoft Automation learning path.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 What Arc gives the engine
{
  const s = content(SC, "What Arc gives the engine");
  tag(s, "What");
  const b = table(s, "Id", 1.45, [2.6, 9.55], ["", "What Microsoft Learn says"], [
    ["The agent", "Installing the Connected Machine agent makes the server an Azure Resource Manager resource, with a system-assigned managed identity whose credential the agent manages"],
    ["SQL Server 2025", "The Arc server's managed identity, as the instance's primary managed identity; only system-assigned identities are supported"],
    ["SQL Server 2022", "An app registration with a certificate kept in Azure Key Vault, which the agent downloads with the machine's identity"],
    ["Both versions", "Entra authentication needs SQL Server 2022 or later, is disabled by default, and isn't supported on a failover cluster instance"],
  ], { fontSize: 12.5, limit: 5.3 });
  line(s, "Svc", "Neither replaces the Windows account the SQL Server service runs as.", b + 0.3, 0.45, 14);
  sources(s, "Sources: Module 3, Unit 2; Data Platform: SQL Server Identity, Chapter 09; Chapter 03, \"Start with Microsoft's documentation\"; Microsoft Learn.");
  notes(s,
`Unit 2 is what Arc gives the engine. Installing the Connected Machine agent makes the server an Azure Resource Manager resource, with a system-assigned managed identity whose credential the agent manages. What the instance uses as its Entra identity depends on the version. On SQL Server 2025, it's the Arc server's managed identity, used as the instance's primary managed identity. Microsoft Learn says only system-assigned identities are supported. On SQL Server 2022, it's an app registration with a certificate kept in Azure Key Vault, which the agent downloads with the machine's identity. On either version, Entra authentication needs SQL Server 2022 or later, is disabled by default, and isn't supported on a failover cluster instance. And neither replaces the Windows account the SQL Server service runs as.`,
  `${M} — Unit 2 "What Arc gives the engine"; workbook Chapter 03, "What Microsoft gives you."`);
}

// ================================================================== 5 Two layers and the cloud
{
  const s = content(SC, "Two layers, and the cloud a GCC tenant uses");
  tag(s, "What");
  const l = panel(s, "L1", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "LAYER 1", "Engine Entra authentication", [
    "Proceeds on a domain-joined host",
    "Never waits for Layer 2",
  ], 14);
  const r = panel(s, "L2", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "LAYER 2", "OS-level Entra sign-in", [
    "A separate transformation, sequenced on its own",
  ], 14);
  callout(s, "Cloud", Math.max(l, r) + 0.3, 1.5, "FaCloud", HEX.navy, "The cloud: ",
    "a GCC (Moderate) tenant uses Microsoft Entra ID in the commercial cloud, so its Arc resources are in a commercial Azure subscription in the same tenant, AzureCloud (WD-028).");
  sources(s, "Sources: Module 3, Unit 2; Data Platform: SQL Server Identity, Chapter 09, \"The two-layer distinction\"; Runbook R04, \"The right Azure cloud.\"");
  notes(s,
`Two distinctions matter here. The first is the two layers. Layer 1, engine Entra authentication, proceeds on a domain-joined host. Layer 2, O S level Entra sign-in, is a separate transformation. So a domain-joined Windows Server host running SQL Server 2022 with Arc doesn't have to leave the domain before its engine takes Entra logins. The second is the cloud. Microsoft Learn says Office 365 G C C is paired with Microsoft Entra I D in Azure, the commercial cloud. So a G C C Moderate tenant's Arc resources are in a commercial Azure subscription in the same tenant, the cloud called Azure Cloud. The program recorded that as a decision.`,
  `${M} — Unit 2 "What Arc gives the engine"; workbook Chapter 03, "The cloud."`);
}

// ================================================================== 6 The sequence and the gate
{
  const s = content(SC, "The deployment sequence, and the gate");
  tag(s, "How");
  const b = table(s, "Seq", 1.45, [1.0, 3.6, 7.55], ["Step", "What", "What to know"], [
    ["1", "Connectivity", "Egress from the host comes first"],
    ["2", "The agent", "The Connected Machine agent connects the server to Azure"],
    ["3", "The SQL extension", "Arc installs the Azure extension for SQL Server automatically on a host with SQL Server"],
    ["4", "Entra authentication", "Turned on for each instance; disabled by default"],
    ["Gate", "Verification", "A token from the agent's local endpoint, a test Entra login, and Category 1 on the next audit"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Pre", b + 0.3, 1.2, "FaTriangleExclamation", HEX.amber, "Pre-2022 instances and failover cluster instances: ",
    "upgrade, re-platform or carry a dated exception. A failed verification is an enrollment problem, solved before migration.");
  sources(s, "Sources: Module 3, Unit 3; Data Platform: SQL Server Identity, Chapters 10 and 12, Decision 4; Runbook R04, \"Verification checklist.\"");
  notes(s,
`Unit 3 is the sequence and the gate. Arc deployment runs in order. Connectivity first. Then the agent. Then the Azure extension for SQL Server, which Arc installs automatically on a host with SQL Server. Then Entra authentication, turned on for the instance, since it's disabled by default. Verification is the gate between enrollment and migration. The first check asks the agent's local identity endpoint for a token. The second is a test Entra login that connects to the instance. And the third is the next audit run, which should put the instance in Category 1. A failed verification is an enrollment problem, solved before migration starts. Pre-2022 instances and failover cluster instances upgrade, re-platform, or carry a dated exception.`,
  `${M} — Unit 3 "The sequence and the gate"; Data Platform: SQL Server Identity, Chapter 10, "Verification of managed identity availability."`);
}

// ================================================================== 7 The kit's category
{
  const s = content(SC, "How the kit settles the category");
  tag(s, "How");
  const b = table(s, "Cat", 1.45, [5.6, 1.4, 5.15], ["Condition", "Category", "Next"], [
    ["A failover cluster instance", "3", "Re-platform, or record an exception"],
    ["No version, or before SQL Server 2022", "3", "Upgrade to SQL Server 2022 or later first"],
    ["Agent not Connected, extension not Succeeded, or Entra not configured", "2", "Deploy Arc (Runbook R04), naming each missing piece"],
    ["All three present, on 2022 or later", "1", "Plan the logins (Chapter 04)"],
  ], { fontSize: 12.5, limit: 4.4 });
  const l = panel(s, "Ref", 0.6, b + 0.25, 6.0, null, HEX.red, HEX.redTint, "IT REFUSES", null, [
    "Any snapshot whose environment isn't AzureCloud: a snapshot from the wrong cloud judges the wrong estate",
  ], 13);
  const r = panel(s, "Conf", 6.85, b + 0.25, 5.9, null, HEX.amber, HEX.amberTint, "CONFIRMED BY A PERSON", null, [
    "Resource Graph doesn't give it the Entra setting: confirm it in the portal and record it",
  ], 13);
  sources(s, "Sources: Module 3, Unit 3; Chapter 03, \"The snapshot,\" \"The category,\" \"What it leaves to you.\"");
  notes(s,
`The kit reads three things for each instance, the agent, the extension and the Entra setting, and names whatever is missing. A failover cluster instance, or a version before SQL Server 2022, is Category 3 before Arc is even looked at. An agent that isn't connected, an extension that didn't succeed, or Entra not configured makes it Category 2, with each missing piece named. All three, on 2022 or later, is Category 1: plan the logins. It refuses any snapshot whose cloud isn't Azure Cloud, because a snapshot from the wrong cloud judges the wrong estate. And Resource Graph doesn't give it the Entra setting, so that's confirmed in the portal and recorded.`,
  `${M} — Unit 3 "The sequence and the gate"; workbook Chapter 03, "The category," "What it leaves to you."`);
}
// ================================================================== 7b What Learn leaves to you
{
  const s = content(SC, "What Microsoft Learn leaves to you, and the kit adds");
  tag(s, "What");
  const b = table(s, "Left", 1.45, [3.9, 3.9, 4.35], ["Learn's material, as published", "Why it matters", "What the kit adds"], [
    ["The agent, the extension and the Entra setting are three resources and one setting", "An instance with two of three looks ready in the portal", "Reads all three, and names whatever is missing"],
    ["Category rules are in the data platform book, not in Learn", "A pre-2022 instance or a cluster can be scheduled for Arc work it can't use", "Category 3 for a cluster or a version before 2022, before Arc is looked at"],
    ["Resource Graph returns nothing, not an error, for what the caller can't read", "\"No machine\" and \"no access\" look the same", "Reports not installed and keeps Category 2; Lab 2 checks the sign-in first"],
    ["The cloud is a sign-in choice", "A snapshot from the wrong cloud judges the wrong estate", "Refuses any snapshot whose environment isn't AzureCloud"],
    ["The managed identity method is SQL Server 2025's", "A 2022 instance recorded as managedIdentity points at the wrong setup", "A note in Next for a Category 1 instance before 2025"],
  ], { fontSize: 12.5, limit: 6.5 });
  sources(s, "Sources: Module 3, Unit 3; Chapter 03, \"What it leaves to you\"; Microsoft Learn.");
  notes(s,
`Chapter 3 lists what Microsoft Learn's material leaves to you, and what the kit adds. Each row is pinned by a test. The agent, the extension and the Entra setting are three resources and one setting, so an instance with two of the three looks ready in the portal; the kit reads all three, and names whatever is missing. The category rules are in the data platform book, not in Learn, so a pre-2022 instance or a cluster could be scheduled for Arc work it can't use; the kit puts it in Category 3 before Arc is looked at. Resource Graph returns nothing, not an error, for what the caller can't read, so the kit reports the agent as not installed and keeps the instance in Category 2, and Lab 2 checks the sign-in first. The cloud is a sign-in choice, so the kit refuses a snapshot from any cloud but Azure Cloud. And the managed identity method is SQL Server 2025's: a 2022 instance recorded that way gets a note.`,
  `${M} — Unit 3 "The sequence and the gate"; workbook Chapter 03, "What it leaves to you."`);
}
endModule(SC);

// ================================================================== 8 Try it: read the Arc results
{
  const s = content(SL, "Try it: make the run's folder, read the Arc results");
  tag(s, "How");
  const c = code(s, "Arc", 0.6, 1.45, 12.15, L(String.raw`
$ Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
$ $Run = "C:\FMWLabs\results\data-platform-03\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
$ New-Item -ItemType Directory -Path $Run -Force | Out-Null
$ $Run
C:\FMWLabs\results\data-platform-03\lab1\<run>
# Step 1: read the fictional Arc results
$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$ $arc = Read-SqlJson tests/fixtures/arc/arc.json
$ $arc.environment
AzureCloud
$ $arc.machines | Format-Table
name        status       agentVersion
----        ------       ------------
sqlprd01    Connected    1.58
sqlprd06    Connected    1.58
sqlfci04-n1 Disconnected 1.49
`), { label: `TRY IT  ·  ${CAP}`, pt: 11 });
  line(s, "Three", "Their cloud, AzureCloud, and the three machines Resource Graph returned.", c + 0.2, 0.45, 14);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" setup and step 1; Chapter 03, Lab 1, step 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no subscription and no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start, so running the lab again never overwrites a run. Step one reads the fictional Arc results: their cloud, Azure Cloud, and the three machines Resource Graph returned. Sequel P R D oh one and sequel P R D oh six are connected. The cluster node, sequel F C I oh four dash N one, is disconnected, on an older agent.`,
  `${M} — Unit 4 "Exercise: Lab 1," setup and step 1; workbook Chapter 03, Lab 1, step 1.`);
}

// ================================================================== 9 Try it: settle the categories
{
  const s = content(SL, "Try it: settle the categories");
  tag(s, "How");
  const c = code(s, "Cat", 0.6, 1.45, 12.15, L(String.raw`
# Step 2: settle the categories
$ ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run\arc"
Instance Version Agent                  Extension Entra           Category Next
-------- ------- -----                  --------- -----           -------- ----
SQLPRD01 2022    Connected              deployed  appRegistration        1 Ready: plan the logins (Chapter 04)
SQLPRD02 2022    not installed          missing   not configured         2 Deploy Arc (Runbook R04): agent not installed; ...
SQLFCI04 2019    cluster: see its nodes missing   not configured         3 Re-platform as a standalone instance or ...
SQLPRD06 2025    Connected              deployed  managedIdentity        1 Ready: plan the logins (Chapter 04)
Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-03/lab1/<run>/arc
Evidence for ARC (...): CM-8, CM-6, IA-5; KSI-PIY-GIV, KSI-SVC-ACM, KSI-IAM-SNU
`), { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10.5 });
  const l = panel(s, "Two", 0.6, c + 0.3, 6.0, null, HEX.navy, HEX.navyTint, "THE TWO VERSIONS", null, [
    "SQLPRD01, on 2022, uses an app registration",
    "SQLPRD06, on 2025, the managed identity",
  ], 13.5);
  const r = panel(s, "Fci", 6.85, c + 0.3, 5.9, null, HEX.amber, HEX.amberTint, "SQLFCI04", null, [
    "Category 3 whatever Arc shows",
    "A cluster has no machine of its own name, so the check doesn't guess one",
  ], 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" step 2; Chapter 03, Lab 1, step 2.");
  notes(s,
`Step two settles the categories. Sequel P R D oh one and sequel P R D oh six are Category 1: ready, so plan the logins. Notice the Entra column. Sequel P R D oh one uses an app registration, as SQL Server 2022 does. Sequel P R D oh six, on 2025, uses the managed identity. Sequel P R D oh two is Category 2, and the next column names every missing piece: the agent isn't installed, the SQL extension isn't deployed, and Entra authentication isn't configured. Sequel F C I oh four is Category 3 whatever Arc shows. Its agent column reads "cluster: see its nodes", because a failover cluster instance has no machine of its own name, so the check doesn't guess one. Read its node machines in the snapshot for the re-platform plan.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 2; workbook Chapter 03, Lab 1, step 2.`);
}

// ================================================================== 10 Try it: manifest and the refused cloud
{
  const s = content(SL, "Try it: the manifest, and a cloud not recorded");
  tag(s, "How");
  const c = code(s, "Ref", 0.6, 1.45, 12.15, L(String.raw`
# Step 3: open the manifest
$ Get-Content "$Run\arc\manifest.json"
{ "step": "ARC", "title": "Arc agent, SQL extension and Entra configuration: the Arc-eligibility category",
  "mode": "read-only", "asOf": "2026-11-20", "controls": [ "CM-8", "CM-6", "IA-5" ],
  "ksis": [ "KSI-PIY-GIV", "KSI-SVC-ACM", "KSI-IAM-SNU" ],
  "files": [ { "file": "arc.csv", "sha256": "366ecdc0a8d24fffd2440bc5c145116296f7048d2454e0ac3518bc94126be565" }, ... ] }
# Step 4: try a snapshot whose cloud isn't recorded
$ $arc = Read-SqlJson tests/fixtures/arc/arc.json
$ $arc.environment = 'not-recorded'
$ $arc | ConvertTo-Json -Depth 6 | Set-Content "$Run\arc-unknown-cloud.json"
$ ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath "$Run\arc-unknown-cloud.json" ${"`"}
      -OutputPath "$Run\arc-refused"
Exception: The Arc results came from 'not-recorded'. A GCC (Moderate) tenant's Arc resources are in AzureCloud (WD-028).
$ Test-Path "$Run\arc-refused"
False
`), { label: `TRY IT  ·  ${CAP} (REFLOWED AND WRAPPED; "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "No", "The check refuses the snapshot and writes nothing: the output folder doesn't exist.", c + 0.2, 0.45, 14);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 3 and 4; Chapter 03, Lab 1, steps 3 and 4.");
  notes(s,
`Step three opens the manifest: the arc step, read-only, with its three controls, C M eight, C M six and I A five, its three K S Is, and each file's hash. Step four tries a snapshot whose cloud isn't recorded. It copies the fixture, sets its environment to not recorded, and runs the check on it. The check throws: the Arc results came from a cloud that isn't recorded, and a G C C Moderate tenant's Arc resources are in Azure Cloud. Then Test-Path shows false. The check refused the snapshot and wrote nothing.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 3 and 4; workbook Chapter 03, Lab 1, steps 3 and 4.`);
}

// ================================================================== 11 Try it: unconfirmed Entra setting
{
  const s = content(SL, "Try it: leave SQLPRD01's Entra setting unconfirmed");
  tag(s, "How");
  const c = code(s, "Unc", 0.6, 1.45, 12.15, L(String.raw`
# Step 5: leave SQLPRD01's Entra setting unconfirmed
$ $arc = Read-SqlJson tests/fixtures/arc/arc.json
$ $arc.sqlInstances[0].entraAuthentication.configured = $null
$ $arc | ConvertTo-Json -Depth 6 | Set-Content "$Run\arc-unconfirmed.json"
$ Get-SqlArcCategory -Audit (Read-SqlJson tests/fixtures/audit-day1/audit.json) -Arc (Read-SqlJson "$Run\arc-unconfirmed.json") |
      Where-Object Instance -eq 'SQLPRD01' | Format-List
Instance  : SQLPRD01
Version   : 2022
Agent     : Connected
Extension : deployed
Entra     : not configured
Category  : 2
Next      : Deploy Arc (Runbook R04): Entra authentication not configured
# Step 6: run this chapter's tests                # Step 7: list your runs
$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 03*' -Output None -PassThru | ...
PassedCount 5, FailedCount 0                      $ Get-ChildItem C:\FMWLabs\results\data-platform-03\lab1 -Name
`), { label: `TRY IT  ·  ${CAP} (WRAPPED; "..." MARKS A CUT; STEPS 6 AND 7 REFLOWED SIDE BY SIDE)`, pt: 10.5 });
  line(s, "Two", "Two of three looks ready in the portal; the kit says Category 2 and names what's missing.", c + 0.2, 0.45, 14);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 5 to 7; Chapter 03, Lab 1, steps 5 and 6; Chapter 03, \"What it leaves to you.\"");
  notes(s,
`Step five leaves sequel P R D oh one's Entra setting unconfirmed. This is what every instance looks like in Lab 2, until you confirm it. The agent is connected and the extension is deployed, but with the Entra setting unconfirmed, the instance drops to Category 2, and the next column names the missing piece: Entra authentication not configured. An instance with two of the three looks ready in the portal; the kit doesn't treat it as ready. Step six runs this chapter's tests: five pass, none fail. Step seven lists your runs. There's nothing to clean up: the results stay in the run's own folder.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 5 to 7; workbook Chapter 03, Lab 1, steps 5 and 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: settle a test subscription's categories");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A commercial Azure (AzureCloud) test subscription in the test tenant, with at least one Arc-enabled test server running SQL Server, never production; PowerShell 7 with Az.Accounts and Az.ResourceGraph; Reader on the subscription and nothing more; Module 2's Lab 2 snapshot"],
    ["1 to 3", "Sign in to commercial Azure and confirm the cloud; export an Arc snapshot through Resource Graph; settle the categories as Resource Graph leaves them"],
    ["4 and 5", "Confirm one instance's Entra setting in the portal, record it in a separate copy, and settle the categories again"],
    ["6", "Back it out: sign out, and delete the snapshot, the confirmed copy and both check folders"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "Nr", b + 0.3, 0.75, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "Nothing in Azure changes.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2\"; Chapter 03, \"Lab 2: a test subscription.\"");
  notes(s,
`Lab 2 runs on your own test subscription. It hasn't been run by the authors. You need a commercial Azure test subscription in the test tenant, which is where a G C C Moderate tenant's Arc resources live, with at least one Arc-enabled test server running SQL Server, never production. You need PowerShell 7 with the Az Accounts and Az Resource Graph modules, a person who holds Reader on the subscription and nothing more, and Module 2's Lab 2 snapshot from the same instances. Sign in and confirm the cloud, export an Arc snapshot through Resource Graph, and settle the categories as Resource Graph leaves them. Then confirm one instance's Entra setting in the portal, record it in a separate copy, and settle the categories again. Nothing in Azure changes. To back it out, sign out and delete the lab's files.`,
  `${M} — Unit 5 "Exercise: Lab 2"; workbook Chapter 03, "Lab 2: a test subscription."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.8, 2.75, 1.95, 3.65], ["What the step does", "Requirement it supports", "KSI", "Evidence the ISSO keeps"], [
    ["Records each instance's agent, extension and host machine from Resource Graph", "CM-8 System Component Inventory", "KSI-PIY-GIV", "The snapshot as exported; arc.csv, arc.json and manifest.json"],
    ["Checks each instance's Entra configuration and refuses results from the wrong cloud", "CM-6 Configuration Settings", "KSI-SVC-ACM", "The confirmed snapshot with who confirmed it, and the second run's manifest.json"],
    ["Names which instances can take Entra logins without a stored password (Category 1)", "IA-5 Authenticator Management", "KSI-IAM-SNU", "arc.csv with its manifest.json"],
  ], { fontSize: 12.5, limit: 5.2 });
  line(s, "Ass", "The run's files provide evidence; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Introduction\" (the federal requirement); Chapter 03, \"Federal requirements and evidence\"; NIST SP 800-53; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Chapter 3's table maps the check to three controls in NIST SP 800-53. Recording each instance's agent, extension and host machine supports C M eight, System Component Inventory, with the snapshot as exported and the run's files as evidence. Checking each instance's Entra configuration, and refusing results from the wrong cloud, supports C M six, Configuration Settings; keep the confirmed snapshot, naming who confirmed it. And naming which instances can take Entra logins without a stored password supports I A five, Authenticator Management. Runbook R oh four lists the evidence for the deployment itself, ring by ring. K S Is are FedRAMP twenty X indicators for cloud service providers. The run's files provide evidence for each control; the agency still sets its parameters, and the assessor decides.`,
  `${M} — Unit 1 "Introduction" (the federal requirement); workbook Chapter 03, "Federal requirements and evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on Arc", [
    { q: "What does the check do with a snapshot whose environment isn't AzureCloud?", options: ["a. It refuses it and writes nothing", "b. It judges it and adds a warning", "c. It puts every instance in Category 2"] },
    { q: "On SQL Server 2022, what does the instance use as its Entra identity?", options: ["a. The Arc server's system-assigned managed identity, as its primary managed identity", "b. The gMSA the engine runs as", "c. An app registration with a certificate in Azure Key Vault, downloaded to the host by the Arc agent"] },
  ], "1 a: a snapshot from the wrong cloud judges the wrong estate. 2 c: the managed identity method is SQL Server 2025's.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: what does the check do with a snapshot whose environment isn't Azure Cloud? The answer is a: it refuses it, and writes nothing. Second: on SQL Server 2022, what does the instance use as its Entra identity? The answer is c: an app registration with a certificate in Azure Key Vault, downloaded to the host by the Arc agent. The managed identity method is SQL Server 2025's. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary: settle the category from evidence");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw what Arc gives the engine, and how its Entra identity differs on 2022 and 2025",
    "Put the deployment sequence in order, with the checks that gate login migration",
    "Settled four instances' categories, and saw the check refuse an unrecorded cloud",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4: Entra Logins and the Parallel Run", [
    "Or workbook Chapter 03's checklist, before shipping",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "Evidence the ISSO keeps: ",
    "the snapshot as exported; arc.csv, arc.json and manifest.json; the confirmed snapshot naming who confirmed it and when, with the second run's manifest.");
  sources(s, "Sources: Module 3, \"Summary\"; workbook Chapter 03, \"Checklist.\"");
  notes(s,
`To sum up. You learned what Arc gives the engine, how its Entra identity differs between SQL Server 2022 and 2025, and the sequence and checks that gate login migration. You settled four instances' categories from evidence, and saw the check refuse results from an unrecorded cloud. The evidence an I S S O keeps from this module is the Arc snapshot as Resource Graph returned it, the run's files with their manifest, and the confirmed snapshot, naming who confirmed the Entra setting and when, with the second run's manifest. Before shipping, work through Chapter 3's checklist. Next is Module 4, Entra logins and the parallel run.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 03, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/data-platform/03-arc-and-the-engines-identity.md (Data Platform and SQL Server Identity learning path, Module 3): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Data Platform: SQL Server Identity, Chapters 09 (What Arc Provides to SQL Server), 10 (Arc Deployment Sequencing for SQL Server Hosts) and 12 (Decision 4); Runbook R04, Arc Deployment and Managed Identity; and through Chapter 03, Microsoft Learn's Arc, SQL Server and Resource Graph pages. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 03 of Building SQL Server Identity, Arc and the Engine's Identity: \"Start with Microsoft's documentation,\" \"What it leaves to you,\" \"The snapshot,\" \"The category,\" Lab 1, Lab 2 (not run by the authors), \"Federal requirements and evidence,\" \"Checklist.\" Kit: examples/sql-server-identity (Invoke-SqlArcCheck.ps1, powershell/SqlIdentity, tests/fixtures/arc).",
  "Lab output: the module page's Lab 1 expected output, on the kit's fictional fixtures; trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
