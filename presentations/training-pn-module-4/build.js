// Provider Notices learning path, Module 4: Oracle Cloud Infrastructure announcements — the module's narrated deck.
// Teaches docs/training/provider-notices/04-oci-announcements.md, Learn-style: objectives, the concepts the page sends
// the learner to (the guide's Step 3 and its OCI column in "The five providers compared"; workbook Chapter 03, "What
// Oracle gives you," "What it leaves to you," "The code," "Dangers"), three "Try it" slides with the real Lab 1 commands
// and output (run November 12, 2026 in a scratch copy of examples/provider-notices, the same output the page shows),
// Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from those
// pages, their footnotes or the kit; the deck adds none. Helpers: ../training-pn-module-1/pn.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-4/build.js \
//                      presentations/training-pn-module-4/Training_PN_Module_4.pptx
const P = require("../training-pn-module-1/pn.js")("Module 4: Oracle Cloud Infrastructure announcements");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_4.pptx";
const M = "Training, Provider Notices, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Oracle Cloud Infrastructure announcements", "Provider Notices learning path · Gate G3 Oracle Cloud Infrastructure, with workbook Chapter 03",
    ["One policy statement  ·  Announcement types as kinds  ·  Chains: the latest only", "Realms the kit reads and refuses  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence  ·  Check"]);
  notes(s,
`Welcome to Module 4 of the Provider Notices learning path: Oracle Cloud Infrastructure announcements. This is Gate 3 of the provider notices implementation guide, with the third chapter of the developer workbook. Oracle Cloud Infrastructure publishes maintenance, changes, action-required notices and production events for a tenancy as announcements. Updates to one announcement form a chain, and a rescheduled window arrives as a new announcement in the same chain. In this module you read the fixture tenancy's announcements, see Oracle's own action-required date, and watch the second week's rescheduled maintenance replace the first in its chain, so it stays one notice with the new window. It takes about forty-five minutes, with a lab on fixtures and a lab for a test tenancy. The code is illustrative: tested against fixtures, not run against a live tenancy.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "OCI emails the address the tenancy was opened with");
  tag(s, "Why");
  const l = panel(s, "Mail", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "WHERE ORACLE SENDS THEM", "One administrator's mailbox", [
    "Oracle emails service status announcements to the tenancy administrator",
    "Anyone else receives them only through managed email preferences or announcement subscriptions",
  ], 13);
  const r = panel(s, "Hr", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "WHY IT MATTERS", "The HR platform runs on Oracle Cloud", [
    "An agency whose HR platform runs on OCI gets that platform's maintenance notices at whatever address the tenancy was opened with",
    "Read here, maintenance reaches the HR system's owners before it lands",
  ], 13);
  callout(s, "Chain", Math.max(l, r) + 0.3, 0.95, "FaArrowsRotate", HEX.navy, "Chains: ",
    "updates to one announcement form a chain, and a rescheduled window arrives as a new announcement in the same chain.");
  sources(s, "Sources: Module 4, \"Introduction\"; the guide, Step 3; Book 15, Ch 14 (Why provider notices go unread): OCI Console Announcements.");
  notes(s,
`Why does Oracle Cloud Infrastructure need its own gate? Oracle emails service status announcements to the tenancy administrator. Anyone else receives them only through managed email preferences or announcement subscriptions. So an agency whose HR platform runs on Oracle Cloud gets that platform's maintenance and change notices at whatever address the tenancy was opened with. That might be the mailbox of someone who has moved on. Reading the tenancy's announcements here means platform maintenance reaches the HR system's owners before it lands. And there's a wrinkle the kit has to handle. Updates to one announcement form a chain. When Oracle reschedules a maintenance window, the new time arrives as a new announcement in the same chain, and a reader that keeps every announcement would hold the old date next to the new one.`,
  `${M} — Unit "Introduction"; the guide — Step 3; Compliance Automation and Day-Two Operations, Chapter 14 — "Why provider notices go unread."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Write the one policy statement the reader needs, and say what inspect instead of read loses",
    "Map Oracle's announcement types to the record's kinds, with Oracle's ACTION_REQUIRED date",
    "Explain why the kit keeps only the latest announcement in each chain",
    "Name the realms the kit reads and the one it refuses, and why",
  ], [
    "Module 1: the record and its action basis",
    "The guide's five providers compared: its OCI column",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenancy",
  ], 45);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll write the one policy statement the reader needs, and say what granting inspect instead of read loses. You'll map Oracle's announcement types to the record's kinds, with Oracle's own action-required date. You'll explain why the kit keeps only the latest announcement in each chain. And you'll name the realms the kit reads, and the one it refuses, and why. You need Module 1, for the record and its action basis, and the Oracle Cloud column of the guide's table comparing the five providers. Lab 1 needs PowerShell 7.1 or later with Pester 5. No tenancy.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Policy and calls
{
  const s = content(SC, "One policy statement; list, then get for the details");
  tag(s, "What");
  const c = code(s, "Pol", 0.6, 1.45, 12.15, [
    "# An IAM administrator adds this statement to a policy in the tenancy (root compartment)",
    "Allow group <group> to read announcements in tenancy",
    "# The kit's calls: Oracle's list, latest in each chain, then get per announcement",
    "oci announce announcements list --compartment-id <tenancy-ocid> --all --should-show-only-latest-in-chain true",
    "oci announce announcements get --announcement-id <id>",
  ], { label: "THE GUIDE'S STEP 3", pt: 11 });
  const l = panel(s, "Insp", 0.6, c + 0.25, 6.0, null, HEX.red, HEX.redTint, "INSPECT INSTEAD OF READ", null, [
    "Lists summaries only, without the details call's affected resources",
    "So nothing routes as naming the agency's resources",
  ], 12.5);
  panel(s, "Cli", 6.85, c + 0.25, 5.9, null, HEX.navy, HEX.navyTint, "THE CLI", null, [
    "Configured for the reader with oci setup config, in the tenancy's home region",
    "Oracle's list command is the cross-check",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 1; the guide, Step 3; OCI Announcements policy reference; OCI CLI announcements list and get; Installing the OCI CLI.");
  notes(s,
`Unit 1 is the guide's Step 3. The reader needs one policy statement, added by an I A M administrator to a policy in the tenancy's root compartment: allow the reader's group to read announcements in tenancy. Oracle's policy reference makes announcements a resource type, and its own common policy reads the same way. The verb matters. Inspect lists summaries only, without the affected resources that the details call returns. With inspect, nothing can be routed as naming the agency's resources. The kit's calls are Oracle's own: the list command, for the whole tenancy, showing only the latest announcement in each chain; then the get command, once per announcement, for its details and affected resources. The command line is configured for the reader with O C I setup config, in the tenancy's home region, and Oracle's list command is the cross-check.`,
  `${M} — Unit 1: the guide — Step 3, "Prerequisites," "Steps"; workbook Chapter 03 — "What Oracle gives you."`);
}

// ================================================================== 5 Types as kinds
{
  const s = content(SC, "Announcement types become kinds; Oracle says act");
  tag(s, "What");
  const b = table(s, "Kinds", 1.45, [4.6, 2.3, 5.25], ["announcementType", "Kind", "Action required"], [
    ["Contains MAINTENANCE", "maintenance", "If a time is ACTION_REQUIRED_BY (provider)"],
    ["Contains CHANGE, or ACTION_REQUIRED", "change", "ACTION_REQUIRED always (provider)"],
    ["PRODUCTION_EVENT_NOTIFICATION", "incident", "No"],
    ["ACTION_RECOMMENDED, INFORMATION", "advisory", "If a time is ACTION_REQUIRED_BY (provider)"],
  ], { fontSize: 12.5, limit: 4.2 });
  panel(s, "Times", 0.6, b + 0.25, 12.15, null, HEX.navy, HEX.navyTint, "TWO GENERIC TIME FIELDS, EACH WITH A TYPE", null, [
    "START_TIME and NEW_START_TIME start the window; the end-time types end it",
    "ACTION_REQUIRED_BY is Oracle's own action date: no kit rule is needed for OCI",
    "lifecycleState INACTIVE closes a notice; the source link is on announcements.<region>.<realm domain>",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 2; workbook Chapter 03 (What it leaves to you; The code); OCI CLI announcements list (Announcement model).");
  notes(s,
`Unit 2 reads the workbook chapter. Oracle has several announcement types that mean the same kind of news, so the kit maps them. A type that contains maintenance is maintenance. A type that contains change, or action required itself, is a change, and action required is always Oracle's own flag. A production event notification is an incident. Action recommended and information are advisories. Oracle puts the window and the deadline in two generic time fields, each with a type that says what it means. A start time, or a new start time, starts the window; the end-time types end it; and action required by is Oracle's own action date. So for Oracle Cloud, no kit rule is needed: the provider says when action is required, and the record's basis says provider. An inactive lifecycle state closes the notice, and the source link is the announcement on Oracle's own regional host.`,
  `${M} — Unit 2: workbook Chapter 03 — "What it leaves to you," "The code."`);
}

// ================================================================== 6 Chains and realms
{
  const s = content(SC, "The latest in each chain, in the tenancy's realm");
  tag(s, "How");
  const l = panel(s, "Chain", 0.6, 1.45, 6.0, null, HEX.teal, HEX.tealTint, "CHAINS", "One notice per chain", [
    "--should-show-only-latest-in-chain, and the kit keeps only the latest by timeUpdated in each chainId",
    "The record's ID is the chain's, so a rescheduled window updates the task",
    "CLI output keys: camelCase and kebab-case both accepted (casing not yet specified)",
  ], 12.5);
  const r = panel(s, "Realm", 6.85, 1.45, 5.9, null, HEX.navy, HEX.navyTint, "REALMS", "Read where the tenancy lives", [
    "oc1, commercial: oraclecloud.com",
    "oc2, US Government Cloud: us-langley-1 and us-luke-1",
    "oc3: refused; its Announcements endpoint is not yet specified",
    "A region outside the realm is refused",
  ], 12.5);
  callout(s, "Gov", Math.max(l, r) + 0.3, 0.95, "FaLandmark", HEX.amber, "Side note: ",
    "Oracle lists its US Government Cloud with FedRAMP High and DISA Impact Level 4 authorizations, with Announcements endpoints in us-langley-1 and us-luke-1.");
  sources(s, "Sources: Module 4, Unit 2; workbook Chapter 03 (What it leaves to you); the guide, Step 3; Oracle US Government Cloud; Book 15, Ch 14 (Government clouds).");
  notes(s,
`Two more things the kit adds. First, chains. The list call asks for only the latest announcement in each chain, and the kit keeps only the latest by its update time in each chain I D as well. The record's I D is the chain's, so when Oracle reschedules a window, the notice keeps its I D and gets the new window, and the router updates its task instead of opening a second one. The command line's output key casing isn't shown in Oracle's reference, so the kit accepts both styles; which one the C L I prints is not yet specified. Second, realms. A government tenancy read in the commercial realm returns nothing. The kit knows the commercial realm and Oracle's U S Government Cloud, whose Announcements endpoints are in U S Langley and U S Luke. As a side note, Oracle lists that cloud with FedRAMP High and DISA Impact Level 4 authorizations. The third realm is refused, because its Announcements endpoint is not yet specified, and a region outside the realm is refused too.`,
  `${M} — Unit 2: workbook Chapter 03 — "What it leaves to you"; Unit 1: the guide — Step 3, "Government-cloud availability."`);
}
endModule(SC);

// ================================================================== 7 Try it: permissions and realms
{
  const s = content(SL, "Try it: the reader's policy, and the realms it knows");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/provider-notices (PowerShell 7)",
    "$ Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1",
    "$ Get-PnRequiredPermission -Provider oci | Format-Table Call, Permissions, Verified",
    "Call                   Permissions                                                         Verified",
    "oci-announcements-list Allow group <group> to inspect announcements in tenancy (list only)     True",
    "oci-announcement-get   Allow group <group> to read announcements in tenancy                    True",
    "$ foreach ($r in 'oc1', 'oc2', 'oc3') { try { $c = Get-PnCloud -Provider oci -Cloud $r; ... } catch { ... } }",
    "oc1 : oraclecloud.com",
    "oc2 : oraclegovcloud.com us-langley-1, us-luke-1",
    "oc3 : OCI realm oc3: the Announcements endpoint there is not yet specified",
    "      (Oracle's page wasn't readable on November 9, 2026).",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED AND TRIMMED)", pt: 10.5 });
  line(s, "Read", "inspect is enough to list; read is what the details call, with its affected resources, needs.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 1 and 2; examples/provider-notices: config/calls.json, ProviderNotices module.");
  notes(s,
`Try it. Lab 1 runs in the provider notices folder of the examples, in PowerShell 7, against a fictional tenancy in the commercial realm, in the U S Ashburn region. Nothing signs in to anything. Step one lists what Oracle Cloud needs. Two calls. The list call needs only inspect announcements. The get call, the details with their affected resources, needs read announcements. So the policy grants read, because inspect alone would give summaries without the resources. Both are marked verified. Step two asks for each realm the kit knows. The commercial realm, on oracle cloud dot com. The government realm, on oracle gov cloud dot com, in its two regions. And the third realm is refused, with the reason: its Announcements endpoint is not yet specified, because Oracle's page wasn't readable on November ninth, 2026.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 8 Try it: collect and read
{
  const s = content(SL, "Try it: four announcements, Oracle's own date");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Step 3: collect OCI from the day-one fixtures",
    "$ ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 \\",
    "    -Provider oci -AsOf 2026-11-09T12:00:00Z -OutputPath out/oci-day1",
    "Provider Cloud        Notices   Open   Action  By kind",
    "oci      oc1                4      3        1  advisory 1, change 1, incident 1, maintenance 1",
    "# Step 4: read the records",
    "noticeId             kind        status actionRequired actionRequiredBy     windowStart          resources",
    "oci:chain-example-01 maintenance open   false                               2026-11-22T04:00:00Z ocid1.dbsystem.oc1.ia...",
    "oci:chain-example-02 change      open   true           2026-12-15T00:00:00Z                      ocid1.loadbalancer.oc...",
    "oci:chain-example-03 advisory    open   false",
    "oci:chain-example-04 incident    closed false",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED; RESOURCES CUT BY THE TABLE)", pt: 10.5 });
  line(s, "Read", "The maintenance names a database system; the change is due December 15, 2026, by Oracle's own type.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 3 and 4; workbook Chapter 03, Lab 1; examples/provider-notices/tests/fixtures/day1 (fictional).");
  notes(s,
`Step three collects Oracle Cloud from the day-one fixtures, as of November ninth, 2026: four notices, three open, one needing action. One each of advisory, change, incident and maintenance. Step four reads the records. Chain example one is maintenance, starting November twenty-second at four in the morning, U T C, on a database system. Because the details call named that resource, Module 7's routing can ask for a contingency plan review for the system that depends on it. Chain example two is a change, action required by December fifteenth, 2026, by Oracle's own action required type, on a load balancer. That date is Oracle's, not the kit's. Chain example three is an advisory, and the incident, chain example four, is closed.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 and 4.`);
}

// ================================================================== 9 Try it: rescheduled window
{
  const s = content(SL, "Try it: a rescheduled window stays one notice");
  tag(s, "How");
  const c = code(s, "Week", 0.6, 1.45, 12.15, [
    "# Step 5: collect the second week (-FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z)",
    "oci      oc1                4      3        1  advisory 1, change 1, incident 1, maintenance 1",
    "noticeId             kind        status windowStart          windowEnd",
    "oci:chain-example-01 maintenance open   2026-11-29T04:00:00Z 2026-11-29T08:00:00Z",
    "# Step 6: build the live list command without running it",
    "$ (Get-PnLiveCommand -CallId oci-announcements-list -Settings $s).Arguments -join ' '",
    "announce announcements list --compartment-id ocid1.tenancy.oc1..aaaaaaaaexampletenancy --all",
    "  --should-show-only-latest-in-chain true --region us-ashburn-1 --output json",
    "# Step 7: run this chapter's tests",
    "PassedCount FailedCount",
    "          9           0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED AND TRIMMED)", pt: 10.5 });
  line(s, "One", "Still four notices: the chain's latest replaced the first, so Module 7 updates its task instead of opening a second.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 5 to 7; workbook Chapter 03 (What it leaves to you); examples/provider-notices/tests/fixtures/day2.");
  notes(s,
`Step five collects the second week, as of November sixteenth. Still four notices. But chain example one, the maintenance, now runs on November twenty-ninth, from four to eight in the morning, U T C. Oracle rescheduled it, and the chain's latest announcement replaced the first. It's one notice with the new window, so Module 7 updates its task instead of opening a second one, and nobody prepares for the old date. Step six builds the live list command without running it. It's Oracle's own list command for the fictional tenancy, with all pages, only the latest in each chain, the region from the settings, and J SON output. A reviewer can see exactly what would run. Step seven runs this chapter's tests: nine pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 to 7.`);
}

// ================================================================== 10 Lab 2
{
  const s = content(SL, "Lab 2: a test tenancy, one policy, then delete it");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "An OCI test tenancy, never production; an IAM administrator; a test IAM group for the reader"],
    ["Grant", "Add the read announcements in tenancy statement to a policy in the root compartment"],
    ["Read", "Configure the CLI as the reader; cross-check Oracle's list command against the collection"],
    ["Record", "The key casing the CLI printed, which Oracle's reference doesn't show"],
    ["Back it out", "Delete the policy, as the IAM administrator, and the run, which names the tenancy's resources"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.25, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 03, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2\"; workbook Chapter 03, Lab 2; OCI CLI iam policy create and delete.");
  notes(s,
`Lab 2 runs the same read in an Oracle Cloud Infrastructure test tenancy, never production. You need an I A M administrator, and a test I A M group for the reader. The administrator adds the read announcements in tenancy statement to a policy in the root compartment. Then configure the command line as the reader, and cross-check Oracle's own list command against the kit's collection. Record one open item while you're there: the key casing the command line printed, which Oracle's reference doesn't show. The kit accepts both, but the verification log should say which one is real. To back it out, the I A M administrator deletes the policy, and you delete the run, because it names the tenancy's resources. The authors haven't run Lab 2. The workbook's Chapter 3 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, a test tenancy"; workbook Chapter 03 — "Lab 2: a test tenancy."`);
}
endModule(SL);

// ================================================================== 11 Dangers
{
  const s = content(SS, "Dangers: inspect, chains, realms and the HR platform");
  tag(s, "Who");
  const b = table(s, "Dang", 1.45, [4.3, 7.85], ["Danger", "The guard"], [
    ["inspect granted instead of read", "read announcements in config/calls.json; an empty resources on every maintenance notice is the sign"],
    ["Every announcement in a chain read as its own notice", "Latest in each chain, keyed by chainId"],
    ["A government tenancy read in the commercial realm", "The settings name the realm; a region outside it is refused; OC3 is refused"],
    ["HR platform maintenance seen only by the help desk", "Route OCI maintenance that names the HR system's resources to its owners (design guidance)"],
    ["The announcement email treated as the record", "The task links the announcement the kit read; the email is the interim path only"],
  ], { fontSize: 12.5, limit: 5.3 });
  sources(s, "Sources: Module 4, Unit 2; workbook Chapter 03 (Dangers); the guide, Step 3 (Interim path).");
  notes(s,
`The workbook chapter lists five dangers. If inspect is granted instead of read, the reader gets summaries without affected resources, and nothing routes as naming the agency's resources; an empty resources field on every maintenance notice is the sign. If every announcement in a chain is read as its own notice, the old window lingers next to the new one; the kit keeps the latest in each chain. A government tenancy read in the commercial realm returns nothing; the settings name the realm, and a region outside it is refused. If the HR platform's maintenance is seen only by the help desk, the HR system's owners learn of it after it lands; the design guidance is to route Oracle maintenance that names the HR system's resources to its owners. And the announcement email can be spoofed and isn't in the evidence. It's the interim path only, filed with the change record, with the recipients named in the settings' notice contacts.`,
  `${M} — Unit 2: workbook Chapter 03 — "Dangers"; the guide — Step 3, "Interim path."`);
}

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.3, 3.1, 5.75], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["SA-9 c", "KSI-SCR-MIT, KSI-SCR-MON", "Get-PnRequiredPermission -Provider oci; the policy statement"],
    ["SA-9 c; SI-5 a", "KSI-SCR-MIT, KSI-SCR-MON", "raw/oci.json, notices.json, manifest.json: every chain's latest announcement, with details, in the tenancy's realm"],
    ["CP-2 e: contingency plan", "KSI-RPL-ARP", "Maintenance that names the agency's resources, so Module 7 asks for a contingency plan review"],
    ["SI-5; CA-7", "KSI-SCR-MON, KSI-MLA-EVC", "A rescheduled window replaces the original and stays one notice"],
  ], { fontSize: 12, limit: 5.0 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Introduction\"; workbook Chapter 03 (Federal requirements and evidence); the guide, Step 3; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Gate 3 supports NIST special publication eight hundred fifty-three S A nine, part c, and S I five, part a. And when maintenance names the agency's resources, it supports C P two, part e: updating the contingency plan for changes to the system or its environment of operation. The evidence is the permission list and the policy statement; the raw Oracle response, with the list and each announcement's details, the notices and the manifest, every chain's latest announcement read in the tenancy's realm; maintenance that names the agency's resources, so Module 7's routing asks for a contingency plan review; and a rescheduled window that replaces the original and stays one notice. The gate's output is evidence for these controls; your organization still sets their parameters, and the assessor decides. K S I's are FedRAMP twenty X indicators for cloud service providers, and which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — Step 3; workbook Chapter 03 — "Federal requirements and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on OCI", [
    { q: "What does granting inspect instead of read lose?", options: ["a. Nothing", "b. The details call's affected resources, so no notice can be routed as naming the agency's resources", "c. The list of announcements"] },
    { q: "Oracle reschedules a maintenance window. How many notices does the kit hold for it?", options: ["a. Two: the original and the new one", "b. One: the latest announcement in the chain, with the new window", "c. One per affected resource"] },
  ], "1 b: inspect lists summaries only. 2 b: one notice per chain, so the task is updated, not doubled.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: what does granting inspect instead of read lose? The answer is b. The details call's affected resources. Inspect lists summaries only, so no notice can be routed as naming the agency's resources, and no contingency review is asked for. Second: Oracle reschedules a maintenance window. How many notices does the kit hold for it? The answer is b, one: the latest announcement in the chain, with the new window. The record's I D is the chain's, so the task is updated, not doubled. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary, and next: Module 5, AWS Health");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read the reader's one policy statement",
    "Saw the realms the kit reads and refuses",
    "Collected four announcements with Oracle's own action date",
    "Watched a rescheduled window stay one notice",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5: AWS Health and the support plan", [
    "Gate G4, with workbook Chapter 04",
    "Three Describe actions, and a plan the API needs",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "raw/oci.json (the list and each announcement's details), notices.json, notices.csv and manifest.json, dated; and in Lab 2 the policy.");
  sources(s, "Sources: Module 4, \"Summary\"; Module 5; workbook Chapter 03 (Checklist).");
  notes(s,
`To sum up. You read the reader's one policy statement, saw the realms the kit reads and the one it refuses, collected four announcements with Oracle's own action date, and watched a rescheduled maintenance window stay one notice. The evidence an ISSO keeps for Gate 3 is the raw Oracle response, with the list and each announcement's details, the notices as JSON and as a spreadsheet file, and the manifest, all dated; and in Lab 2, the policy. For a system that runs on Oracle Cloud, such as an HR platform, route maintenance that names its resources to its owners, which Module 7 builds. Before you ship, work through the chapter's checklist. Next is Module 5: AWS Health and the support plan. That's Gate 4, with the workbook's fourth chapter: three read actions, and a support plan the A P I needs.`,
  `${M} — Unit "Summary"; Module 5.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/provider-notices/04-oci-announcements.md (Provider Notices learning path, Module 4): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "What the module sends the learner to: Provider Notices: An Implementation Guide, Step 3 (with Government-cloud availability, Interim path and Validate (G3)) and \"The five providers compared\"; workbook Chapter 03, \"What Oracle gives you,\" \"What it leaves to you,\" \"The code,\" \"Dangers,\" \"Federal requirements and evidence,\" Lab 2; Book 15, Chapter 14.",
  "Oracle documentation they cite: OCI CLI command reference, oci announce announcements list and get; the Python SDK's Announcement model; Details for Announcements (policy reference) and Common Policies; Oracle US Government Cloud; Installing the CLI; oci iam policy create and delete; Console Announcements. NIST SP 800-53 Rev. 5 (OSCAL 5.2.0); FedRAMP KSIs.",
  "Kit: examples/provider-notices (Invoke-PnCollect.ps1; powershell/ProviderNotices; tests/fixtures/day1 and day2; tests/Collectors.Tests.ps1, Live.Tests.ps1). Lab output: run November 12, 2026 with PowerShell 7.6 and Pester 5.9 in a scratch copy, the same output the page shows; wrapped and trimmed where the slides say so. Lab 2 not run by the authors. Illustrative: tested against fixtures, not run against a live tenancy.",
]);

finish(OUT);
