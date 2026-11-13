// Provider Notices learning path, Module 5: AWS Health and the support plan — the module's narrated deck.
// Teaches docs/training/provider-notices/05-aws-health-and-the-support-plan.md, Learn-style: objectives, the concepts the
// page sends the learner to (the guide's Step 4; workbook Chapter 04, "What AWS gives you," "What it leaves to you,"
// "The code," "Dangers"), three "Try it" slides with the real Lab 1 commands and output (run November 12, 2026 in a
// scratch copy of examples/provider-notices, the same output the page shows), Lab 2, the federal requirement and evidence,
// a two-question check, and the summary. Every fact comes from those pages, their footnotes or the kit; the deck adds none.
// Helpers: ../training-pn-module-1/pn.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-5/build.js \
//                      presentations/training-pn-module-5/Training_PN_Module_5.pptx
const P = require("../training-pn-module-1/pn.js")("Module 5: AWS Health and the support plan");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_5.pptx";
const M = "Training, Provider Notices, Module 5";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: AWS Health and the support plan", "Provider Notices learning path · Gate G4 AWS Health, with workbook Chapter 04",
    ["The support plan  ·  Three read actions  ·  Categories to kinds  ·  actionability or the kit's rule", "Partitions and endpoints  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence  ·  Check"]);
  notes(s,
`Welcome to Module 5 of the Provider Notices learning path: AWS Health and the support plan. This is Gate 4 of the provider notices implementation guide, with Chapter 4 of the developer workbook. AWS Health publishes issues, scheduled changes and account notifications for each account, with the resources they affect. The A P I is the scheduled, recorded read of them, but it comes with a condition the other providers don't have: it needs a qualifying AWS Support plan. In this module you'll read a fictional account's events, see which ones AWS marked action required and which the kit's rule marked, build the GovCloud request without sending it, and watch the kit refuse eleven events in one details call. It takes about fifty minutes, with a lab on fixtures and a lab in a test account. The code is illustrative: tested against fixtures, not run against a live account.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "AWS writes to email; the API needs a support plan");
  tag(s, "Why");
  const l = panel(s, "Mail", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "TODAY", "Email to whoever opened the account", [
    "Account email goes to the root user's address",
    "Plus up to three alternate contacts: billing, operations and security",
    "The dashboard keeps events for up to 90 days",
  ], 13.5);
  const r = panel(s, "Plan", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "THE CONDITION", "No plan, no read", [
    "Without a qualifying AWS Support plan the API answers SubscriptionRequiredException",
    "Nothing is read; the dashboard and its email are the only path",
  ], 13.5);
  callout(s, "Pages", Math.max(l, r) + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "AWS's own pages disagree: ",
    "the concepts page names Business Support+, Enterprise Support or Unified Operations; the API reference and GovCloud pages name Business and Enterprise plans. Check the account's plan against the current pages.");
  sources(s, "Sources: Module 5, \"Introduction\"; Chapter 04 (What AWS gives you): AWS Health concepts; AWS Health API Reference; Book 15, Ch 14: AWS contacts.");
  notes(s,
`Why does AWS need its own module? Today, AWS sends account email to the root user's address, plus up to three alternate contacts, one each for billing, operations and security. The AWS Health dashboard keeps events for up to ninety days. So the notices reach whoever opened the account, or a page nobody opens on a schedule. The A P I fixes that, with a condition. It needs a qualifying AWS Support plan, and without one it answers with a subscription required exception, and nothing is read. Then the dashboard and its email are the only path. And AWS's own pages don't agree on which plans qualify. The AWS Health concepts page names Business Support plus, Enterprise Support or Unified Operations; the A P I reference and the GovCloud page name the older Business and Enterprise plans. So the guide cites all three, and tells you to check the account's plan against the current pages, and to confirm it with AWS Support.`,
  `${M} — Unit "Introduction"; Unit 2: workbook Chapter 04 — "What AWS gives you"; the guide — Step 4, "Prerequisites."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Write the reader's policy with exactly three read actions, and say why not AWSHealthFullAccess or a wildcard",
    "Explain the support-plan requirement and the error without it",
    "Map AWS Health event categories to kinds, with actionability kept apart from the kit's rule",
    "Name each partition's Health endpoint region, and why GovCloud relies on the API, not EventBridge",
  ], [
    "Module 1: the record and its action basis",
    "The guide's five providers compared: its AWS column",
    "Lab 1: PowerShell 7.1+ with Pester 5; no account",
  ], 50);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll write the reader's policy with exactly three read actions, and say why not the AWS Health full access policy, or a wildcard. You'll explain the support-plan requirement, the error you get without one, and why to check the plan against AWS's current pages. You'll map AWS Health event categories to the record's kinds, keeping AWS's own actionability field apart from the kit's rule. And you'll name each partition's Health endpoint region, and say why GovCloud relies on the A P I rather than EventBridge. Before you start, finish Module 1, on the record and its action basis, and read the AWS column of the guide's five providers compared. Lab 1 needs PowerShell 7.1 or later with Pester 5. No account.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Gate G4
{
  const s = content(SC, "Gate G4: three read actions, then collect");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [2.6, 9.55], ["Step", "What the guide asks for"], [
    ["Prerequisite", "A qualifying AWS Support plan on the account; without one, SubscriptionRequiredException"],
    ["1. Read policy", "A customer managed policy: health:DescribeEvents, health:DescribeEventDetails, health:DescribeAffectedEntities"],
    ["2. Cross-check", "aws health describe-events from the Health endpoint: us-east-1, or us-gov-west-1 in GovCloud (US)"],
    ["3. Collect", "Open and upcoming events, then details and affected entities ten events at a time"],
    ["Validate", "The instance retirement is a retirement, due at its start, with the instance as its resource"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "Full", b + 0.25, 0.95, "FaLock", HEX.red, "Why not AWSHealthFullAccess: ",
    "AWS publishes no read-only managed policy for Health, and the full-access policy includes writes. AWS's examples grant health:Describe*; a wildcard grows as AWS adds actions.");
  sources(s, "Sources: Module 5, Unit 1; the guide, Step 4: AWS Health API Reference; AWS Health identity-based policy examples; AWS managed policies for AWS Health.");
  notes(s,
`Unit 1 is the guide's Step 4. The prerequisite is the support plan. Then three steps. One: create the read policy. It's a customer managed policy with exactly three actions: describe events, describe event details and describe affected entities. AWS publishes no read-only managed policy for Health, and the AWS Health full access policy includes writes, so the reader never holds it. AWS's own examples grant describe with a wildcard, but a wildcard grows as AWS adds actions, so the kit names the three it calls. Two: cross-check from the Health endpoint. Commercial accounts use u s east one; GovCloud, u s gov west one. Three: collect. The kit reads open and upcoming events, then their details and affected entities, ten events at a time. The gate validates when the instance retirement comes out as a retirement, due at its start, with the instance as its resource. The gate owner is the AWS account owner.`,
  `${M} — Unit 1: the guide — Step 4, "Validate (G4 AWS Health)"; workbook Chapter 04 — "What it leaves to you."`);
}

// ================================================================== 5 Categories to kinds
{
  const s = content(SC, "Event categories to kinds, and who said act");
  tag(s, "What");
  const b = table(s, "Map", 1.45, [4.2, 1.9, 6.05], ["eventTypeCategory", "Kind", "Action required"], [
    ["issue, investigation", "incident", "If actionability is ACTION_REQUIRED (provider)"],
    ["scheduledChange, code naming a retirement or lifecycle event", "retirement", "ACTION_REQUIRED (provider), or else the kit's rule; due at its start"],
    ["scheduledChange, otherwise", "maintenance", "If ACTION_REQUIRED (provider), due at its start"],
    ["accountNotification, persona SECURITY", "security", "If ACTION_REQUIRED (provider)"],
    ["accountNotification, otherwise", "advisory", "If ACTION_REQUIRED (provider)"],
  ], { fontSize: 12.5, limit: 4.9 });
  line(s, "Rule", "No AWS category says \"retirement\" or \"security\". The kit's rule is labeled rule:, AWS's flag provider:, and times become UTC ISO 8601.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 5, Unit 2; Chapter 04 (What it leaves to you; The code): AWS Health API Reference, Event.");
  notes(s,
`Unit 2 is the event reader. AWS Health's event type categories are issue, scheduled change, account notification and investigation. None of them says retirement or security, so the kit maps them. An issue or an investigation is an incident. A scheduled change whose event type code names a retirement, a lifecycle event, a deprecation or an end of support is a retirement. That's the kit's rule. Any other scheduled change is maintenance. An account notification with the security persona is security, and any other account notification is an advisory. Then action. AWS's own actionability field, when it says action required, makes the record action required, with an action basis that starts with provider, and a scheduled change's start time is its due date. A retirement without AWS's flag is still action required, by the kit's rule, due at its start, and labeled rule. And AWS gives times as epoch seconds; the record holds them in U T C, I S O 8601.`,
  `${M} — Unit 2: workbook Chapter 04 — "What it leaves to you," "The code."`);
}

// ================================================================== 6 Batching and partitions
{
  const s = content(SC, "Ten events at a time, in the partition's own region");
  tag(s, "What");
  const w = 5.95, g = 0.25;
  const p1 = panel(s, "Batch", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "DETAILS AND ENTITIES ARE SEPARATE CALLS", null, [
    "DescribeEventDetails takes one to ten event ARNs",
    "The kit batches by ten, and refuses eleven before calling",
  ], 12.5);
  const p2 = panel(s, "Part", 0.6 + w + g, 1.45, w, null, HEX.teal, HEX.tealTint, "THE PARTITION NAMES THE REGION", null, [
    "aws: us-east-1; aws-us-gov: us-gov-west-1, a single regional endpoint",
    "The caller's ARN must be in the settings' partition",
  ], 12.5);
  const top2 = Math.max(p1, p2) + 0.2;
  panel(s, "Gov", 0.6, top2, 12.15, null, HEX.amber, HEX.amberTint, "GOVCLOUD (US) AND THE INTERIM PATH", null, [
    "In GovCloud, EventBridge doesn't send public events from the Service Health view: the kit reads the API",
    "Interim: an EventBridge rule on aws.health events (the kit doesn't build it); with no plan, the dashboard and its email",
  ], 12.5);
  sources(s, "Sources: Module 5, Unit 2; Chapter 04 (What AWS gives you): DescribeEventDetails; Accessing the AWS Health API; AWS Health in GovCloud (US); EventBridge events for AWS Health.");
  notes(s,
`Two more things the reader handles. First, batching. An event list without its description or resources can't be routed, and descriptions and affected entities are separate calls. Describe event details takes one to ten event A R Ns. So the kit asks ten at a time, and refuses eleven before it calls anything, rather than have the A P I refuse it mid-run. Second, partitions. The settings name the partition, and the region comes from it: u s east one for commercial accounts, and u s gov west one, a single regional endpoint, in AWS GovCloud. A GovCloud account read from u s east one fails, or worse, reads nothing, so the kit checks once that the caller's A R N is in the settings' partition. In GovCloud there's one more reason to use the A P I: EventBridge there doesn't send public events from the Service Health view. Elsewhere, the interim path is an EventBridge rule on AWS Health events, which the kit doesn't build. And with no support plan, it's the dashboard and its email.`,
  `${M} — Unit 1: the guide — Step 4, "Government-cloud availability," "Interim path"; Unit 2: workbook Chapter 04 — "What AWS gives you," "The code," "Dangers."`);
}
endModule(SC);

// ================================================================== 7 Try it: permissions and partitions
{
  const s = content(SL, "Try it: three actions, two partitions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/provider-notices (PowerShell 7)",
    "$ Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1",
    "$ Get-PnRequiredPermission -Provider aws | Format-Table Call, Permissions, Verified",
    "Call                           Permissions                     Verified",
    "----                           -----------                     --------",
    "aws-describe-events            health:DescribeEvents               True",
    "aws-describe-event-details     health:DescribeEventDetails         True",
    "aws-describe-affected-entities health:DescribeAffectedEntities     True",
    "",
    "$ foreach ($p in 'aws', 'aws-us-gov') { $c = Get-PnCloud -Provider aws -Cloud $p;",
    "    '{0,-11} {1,-14} {2}' -f $p, $c.Region, $c.ArnPrefix }",
    "aws         us-east-1      arn:aws:",
    "aws-us-gov  us-gov-west-1  arn:aws-us-gov:",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED)", pt: 11 });
  line(s, "Whole", "Three read actions, one per call: that's the whole policy. Each partition has its own region and ARN prefix.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 1 and 2; examples/provider-notices: config/calls.json, ProviderNotices module.");
  notes(s,
`Try it. Lab 1 runs in the provider notices folder of the examples, in PowerShell 7. The account is AWS's documentation account, one one one one two two two two three three three three, in the commercial partition. Nothing signs in or sends a request. Step one lists what AWS needs. Three calls: describe events, describe event details and describe affected entities, each with its one read action, and each verified against AWS's documentation. Three read actions, one per call. That's the whole policy, and it's what you'd show an assessor who asks what the reader may do. Step two shows each partition's Health endpoint region. The commercial partition reads from u s east one, with A R Ns that start A R N colon A W S. The GovCloud partition reads from u s gov west one, with A R Ns that start A R N colon A W S dash U S dash gov.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 8 Try it: collect and read
{
  const s = content(SL, "Try it: five events, and who said act");
  tag(s, "How");
  const c = code(s, "Read", 0.6, 1.45, 12.15, [
    "# Step 3: collect AWS from the day-one fixtures (-Provider aws -AsOf 2026-11-09T12:00:00Z)",
    "aws      aws                5      4        3  incident 1, maintenance 1, retirement 2, security 1",
    "# Step 4: read the records (kind, status, actionRequired, actionRequiredBy, title; trimmed)",
    "retirement  open   true   2026-12-01T00:00:00Z EC2: Instance retirement scheduled",
    "security    open   true                        IAM: Security notification",
    "maintenance open   false                       RDS: Maintenance scheduled",
    "incident    closed false                       S3: Operational issue",
    "retirement  open   true   2027-01-15T00:00:00Z LAMBDA: Planned lifecycle event",
    "# Step 5: see who said each one needs action",
    "EC2: Instance retirement scheduled provider: actionability ACTION_REQUIRED",
    "IAM: Security notification         provider: actionability ACTION_REQUIRED",
    "RDS: Maintenance scheduled         none",
    "S3: Operational issue              none",
    "LAMBDA: Planned lifecycle event    rule: AWS scheduled change whose event type code names a retirement; ...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Lambda", "AWS flagged the EC2 retirement and the IAM notice. The Lambda lifecycle event is due by the kit's rule, and says so.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 3 to 5; Chapter 04 (The code); examples/provider-notices/tests/fixtures/day1 (fictional).");
  notes(s,
`Step three collects AWS from the day-one fixtures: five events, four open, three needing action. One incident, one maintenance window, two retirements and one security notice. Step four reads the records. The E C 2 instance retirement is due December first, 2026, and the Lambda planned lifecycle event January fifteenth, 2027, each with its resource. The R D S maintenance is scheduled on a database. The I A M security notification needs action, with no date. And the S 3 operational issue is closed. Step five asks who said each one needs action. AWS did, twice, through its actionability field: the E C 2 retirement and the I A M notification. The R D S maintenance and the S 3 issue need none. And the Lambda event is action required by the kit's rule: a scheduled change whose event type code names a retirement, due at its start time. The record says rule, so nobody mistakes it for AWS's own flag.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 to 5.`);
}

// ================================================================== 9 Try it: GovCloud and eleven ARNs
{
  const s = content(SL, "Try it: the GovCloud request, and eleven refused");
  tag(s, "How");
  const c = code(s, "Gov", 0.6, 1.45, 12.15, [
    "# Step 6: build the GovCloud request without sending it",
    "$ $s = Read-PnSettings -Path tests/fixtures/settings.lab.json",
    "$ $s.providers.aws.partition = 'aws-us-gov'",
    "$ (Get-PnLiveCommand -CallId aws-describe-events -Settings $s).Arguments -join ' '",
    "health describe-events --region us-gov-west-1 --filter {\"eventStatusCodes\":[\"open\",\"upcoming\"]} --output json",
    "# Step 7: ask for details of eleven events in one call",
    "$ Get-PnLiveCommand -CallId aws-describe-event-details -Settings $s -Arguments @{ arns = @(1..11 | ...) }",
    "Exception: aws-describe-event-details takes 1 to 10 event ARNs; got 11.",
    "# Step 8: run this chapter's tests",
    "PassedCount FailedCount",
    "         11           0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Before", "The refusal comes before anything runs. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 6 to 8; examples/provider-notices/tests (Collectors.Tests.ps1, Live.Tests.ps1).");
  notes(s,
`Step six builds the GovCloud request without sending it. You read the lab settings, change the partition to A W S U S gov, and ask the kit for the live command. It's describe events in u s gov west one, filtered to open and upcoming events, as JSON. The region came from the partition; you never typed it. Step seven asks for the details of eleven events in one call. The kit refuses before anything runs: describe event details takes one to ten event A R Ns, and it got eleven. In a live run the kit never asks for more than ten, so this is the guard that keeps a coding mistake from reaching AWS mid-run. Step eight runs this chapter's tests, for the AWS Health block and the AWS rows of the live tests: eleven pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 to 8.`);
}

// ================================================================== 10 Lab 2
{
  const s = content(SL, "Lab 2: a test account with a support plan");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "An AWS test account, never production, with a qualifying AWS Support plan; an IAM administrator; a reader role and CLI profile"],
    ["1. Policy", "Write and create the read policy with exactly the three actions, and attach it to the reader's role"],
    ["2. Who am I", "aws sts get-caller-identity: the ARN must start with arn:aws:, the partition the settings name"],
    ["3. Cross-check", "Count describe-events from us-east-1, then collect: the counts should agree"],
    ["4. Back it out", "Detach and delete the policy, and delete the run, which names the account's resources"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "NotRun", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "without a support plan, step 3's SubscriptionRequiredException is the expected result. The workbook's Chapter 04, Lab 2 has the exact commands.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2\"; Chapter 04 (Lab 2: a test account): AWS CLI IAM examples; sts get-caller-identity.");
  notes(s,
`Lab 2 reads a real test account. You need an AWS test account, never production, with a qualifying AWS Support plan, an I A M administrator, and an I A M role and C L I profile for the reader. Step one writes the read policy with exactly the three actions, creates it, and attaches it to the reader's role. Step two checks who you're signed in as: the A R N must start with A R N colon A W S, the partition the settings name. Step three cross-checks. Count AWS's own open and upcoming events from u s east one, then collect, and the counts should agree. If the account has no qualifying support plan, the subscription required exception is the expected result, and that's a gap to record with the ISSO. Step four backs it out: detach and delete the policy, and delete the run, which names the account's resources. The authors haven't run Lab 2. The workbook's Chapter 4 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, a test account"; workbook Chapter 04 — "Lab 2: a test account."`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.0, 5.55], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["SA-9 c", "KSI-SCR-MIT, KSI-SCR-MON", "Get-PnRequiredPermission -Provider aws; the policy document with three read actions"],
    ["SA-9 c; SI-5 a", "KSI-SCR-MIT, KSI-SCR-MON", "raw/aws.json, notices.json, manifest.json; the reads on the partition's own endpoint"],
    ["SI-5 d, through the task Module 7 routes", "KSI-SCR-MON", "Events AWS marks ACTION_REQUIRED, with AWS's due date; the kit's rule labeled as the kit's"],
  ], { fontSize: 12, limit: 4.5 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 5, \"Introduction\"; Chapter 04 (Federal requirements and evidence): NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Gate 4 supports NIST special publication eight hundred fifty-three S A nine, part c, monitoring external service providers on an ongoing basis, and S I five, part a, receiving security alerts and advisories. For events AWS marks action required, it also supports S I five, part d: implementing directives in the established time frames, through the task Module 7 routes. The evidence is the permission list and the policy document with its three read actions; the raw AWS response, the notices and the manifest, read on the partition's own endpoint; and the events AWS marked action required, with AWS's due date, and the kit's rule labeled as the kit's. The gate's output is evidence for these controls. Your organization still sets their parameters, and the assessor decides whether each is satisfied. K S I's are FedRAMP twenty X indicators for cloud service providers; the agency lines its evidence up with them, and doesn't report them itself.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 04 — "Federal requirements and evidence."`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on AWS Health", [
    { q: "What does the AWS Health API answer for an account without a qualifying AWS Support plan?", options: ["a. An empty list", "b. SubscriptionRequiredException", "c. Only closed events"] },
    { q: "The Lambda lifecycle event is action required. Who said so?", options: ["a. AWS, through actionability", "b. The kit's rule: a scheduled change whose event type code names a retirement is a retirement, due at its start", "c. The ISSO"] },
  ], "1 b: and nothing is read; check the plan against AWS's current pages. 2 b: its actionBasis begins with rule:.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: what does the AWS Health A P I answer for an account without a qualifying AWS Support plan? The answer is b, a subscription required exception. Not an empty list: nothing is read at all, and the error says why. Check the account's plan against AWS's current pages, because they name the plans differently. Second: the Lambda lifecycle event is action required. Who said so? The answer is b, the kit's rule. A scheduled change whose event type code names a retirement is a retirement, due at its start. AWS didn't set the actionability field on that event, so the record's action basis begins with rule, and states it. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary, and next: Module 6, Google incidents");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read the reader's three actions and each partition's endpoint",
    "Collected five events from a fictional account",
    "Told AWS's actionability from the kit's rule",
    "Built the GovCloud request, and saw eleven ARNs refused",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6: Google incidents and the maintenance gap", [
    "Gate G5, with workbook Chapter 05",
    "One kind, and the gaps written down",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "raw/aws.json, notices.json, notices.csv and manifest.json, dated; the policy document; and a record of the account's support plan. No plan is a gap to record.");
  sources(s, "Sources: Module 5, \"Summary\"; Module 6; Chapter 04 (Checklist).");
  notes(s,
`To sum up. You read the reader's three actions, saw each partition's endpoint, collected five events, told AWS's actionability from the kit's rule, built the GovCloud request, and watched the kit refuse eleven A R Ns in one call. The evidence an ISSO keeps for Gate 4 is the raw AWS response, the notices as JSON and as a spreadsheet file, and the manifest, all dated; the policy document; and a record of the account's support plan, checked against AWS's current pages. An account without one is a gap to record with the ISSO. Before you ship, work through the chapter's checklist. Next is Module 6: Google incidents and the maintenance gap. Google Cloud's notices come in only one kind, and that module is about writing down honestly what doesn't arrive.`,
  `${M} — Unit "Summary"; Module 6; workbook Chapter 04 — "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/provider-notices/05-aws-health-and-the-support-plan.md (Provider Notices learning path, Module 5): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "What the module sends the learner to: Provider Notices: An Implementation Guide, Step 4; workbook Chapter 04, \"What AWS gives you,\" \"What it leaves to you,\" \"The code,\" \"Lab 2,\" \"Federal requirements and evidence,\" \"Dangers,\" \"Checklist,\" and their footnotes: AWS Health API Reference; AWS Health User Guide; AWS GovCloud (US) User Guide; EventBridge events reference; AWS CLI references; NIST SP 800-53 Rev. 5; FedRAMP KSIs. Book 15, Chapter 14 for the account contacts.",
  "Kit: examples/provider-notices (Invoke-PnCollect.ps1; powershell/ProviderNotices; config/calls.json; tests/fixtures/settings.lab.json, day1; tests/Collectors.Tests.ps1, Live.Tests.ps1). AWS's documentation account 111122223333; fictional events. Illustrative: tested against fixtures, not run against a live account.",
  "Lab output: run November 12, 2026 with PowerShell 7.6 and Pester 5.9 in a scratch copy of examples/provider-notices; the same output the module page shows. Long commands are wrapped and output trimmed where the slides say so. Lab 2 not run by the authors.",
]);

finish(OUT);
