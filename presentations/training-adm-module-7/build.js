// Attribute-Driven Migration learning path, Module 7: Extend Lifecycle Workflows — the module's narrated deck.
// Teaches docs/training/attribute-driven-migration/07-lifecycle-workflows-extensions.md, Learn-style: objectives, the
// concepts, "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/lifecycle-extensions), Lab 2, the federal requirement and evidence, a two-question check, and the summary.
// Every fact comes from the module page, the learning path's verification log, Book 19 Chapter 05, or the kit
// (examples/lifecycle-extensions); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-7/build.js \
//                      presentations/training-adm-module-7/Training_ADM_Module_7.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 7: Extend Lifecycle Workflows",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 7: Extend Lifecycle Workflows",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 7: Extend Lifecycle Workflows";
const OUT = process.argv[2] || "Training_ADM_Module_7.pptx";
const M = "Training, Attribute-Driven Migration, Module 7";

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
const LAB = "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 7: Extend Lifecycle Workflows", "Attribute-Driven Migration learning path · Guide Gates 7 and 8, with Book 19 Chapter 05",
    ["Where the extensions sit  ·  What Learn's definition leaves to you  ·  The registry", "Lint, run, build, check  ·  The leaver order  ·  Try it: Lab 1  ·  Lab 2"]);
  notes(s,
`Welcome to Module 7 of the Attribute-Driven Migration learning path: extend Lifecycle Workflows. This module serves Gates 7 and 8 of the implementation guide, and takes Book 19, Chapter 05, on custom task extensions. It comes after Modules 4 to 6 because the path follows the gates: Chapter 05 serves Gates 7 and 8, after the Gate 5 work. You'll see what Learn's Logic App definition costs a GCC High leaver, and run the definition that fixes it, through transient failures and repeat deliveries. You'll build the deployment pieces from a reviewed registry, and check that the leaver blocks before the custom task runs. Nothing signs in. The code is illustrative: tested against fixtures and fakes, not against a production tenant.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the rest of a leaver needs an extension");
  tag(s, "Why");
  const b = table(s, "Gates", 1.45, [3.0, 9.15], ["Where", "What it needs"], [
    ["Gate 7", "One personnel action changes access only through the attributes; the mover workflow's run history is evidence"],
    ["Gate 8", "Leaver automation first in every wave, and Lifecycle Workflows sized for the agency"],
    ["The built-in tasks", "Cover the account"],
    ["A custom task extension", "Carries the rest: the PIV credential, the devices, the servers, through a Logic App"],
  ], { fontSize: 13, limit: 4.4 });
  callout(s, "Point", b + 0.35, 0.95, "FaUserShield", HEX.red, "The gap: ",
    "Learn's definition calls back to the worldwide Graph on beta, and always says it completed.");
  sources(s, "Sources: Module 7, Unit 1; the implementation guide's Gates 7 and 8; Microsoft Learn, \"Configure a Logic App for Lifecycle Workflow use.\"");
  notes(s,
`Why does this matter? In this workbook's implementation guide, Gate 7 proves that one personnel action changes access only through the attributes, with the mover workflow's run history as evidence. Gate 8 puts leaver automation first in every wave, and sizes Lifecycle Workflows for the agency. The built-in tasks cover the account. The rest of a leaver, such as the PIV credential, the devices and the servers, goes through a custom task extension that calls a Logic App. And here's the gap. The definition on Microsoft Learn's page, Configure a Logic App for Lifecycle Workflow use, calls back to the worldwide Graph, on beta, and it always says it completed. In a GCC High tenant that callback goes to the wrong cloud. And a revocation that failed reads as done. In this module you see what that costs, and you run the definition that fixes it.`,
  `${M} — Unit 1 "Introduction"; Book 19, Chapter 05 — "Where the extensions sit."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 7", [
    "Describe where custom task extensions sit in a leaver, and the three rules the kit builds in code",
    "Explain what Learn's Logic App definition leaves to you",
    "Run a definition for a cloud, through failures and repeat deliveries, and read what Lifecycle Workflows records",
    "Build the deployment pieces from the registry, and explain why an Azure Government build is refused",
    "Check a workflow read-back for the leaver order",
  ], [
    "Module 1: provisioning creates and updates accounts; Lifecycle Workflows act on accounts that exist",
    "Lab 1: Python 3.10+ and a POSIX shell; no tenant",
  ], 50);
  sources(s, "Sources: Module 7, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll describe where custom task extensions sit in a leaver, and the three rules of this workbook's guidance that the kit builds in code. You'll explain what Learn's Logic App definition leaves to you. You'll run a definition for a cloud, through transient failures and repeat deliveries, and read what Lifecycle Workflows records. You'll build the deployment pieces from the registry, and explain why an Azure Government build is refused. And you'll check a workflow read-back for the leaver order. Before you start, finish Module 1: provisioning creates and updates accounts, and Lifecycle Workflows act on accounts that already exist. Lab 1 needs Python 3.10 or later and a POSIX shell, and no tenant.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Where they sit
{
  const s = content(SC, "Where the extensions sit, and the three rules");
  tag(s, "What");
  const l = panel(s, "Rules", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THIS WORKBOOK'S RULES, IN CODE", null, [
    "One parameterized Logic App per integration, not one per component",
    "Block first: Disable user account and Revoke all refresh tokens for user before the custom task",
    "Custom tasks are idempotent, and retry with a bound",
  ], 13);
  const r = panel(s, "Learn", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "LEARN'S CONTRACT", null, [
    "Launch and wait: no response within the wait, and the task fails",
    "The wait: 30 minutes to 3 hours, as an ISO 8601 duration",
    "The response: a POST to resume, completed or failed, in v1.0",
  ], 13);
  callout(s, "Host", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "The clouds: ",
    "GCC keeps graph.microsoft.com; GCC High uses graph.microsoft.us and DoD dod-graph.microsoft.us. A token for one doesn't work in another.");
  sources(s, "Sources: Module 7, Unit 2; Microsoft Learn: \"Lifecycle Workflows custom task extension,\" \"taskProcessingResult: resume,\" \"Microsoft Graph national cloud deployments.\"");
  notes(s,
`This workbook's guidance splits the work: inbound provisioning creates and updates accounts, and Lifecycle Workflows act on accounts that already exist. It also sets three rules, and the kit builds them in code. One parameterized Logic App per integration, not one per component. Block first: Disable user account and Revoke all refresh tokens for user run before the custom task. And custom tasks are idempotent, and retry with a bound. Microsoft Learn sets the contract. Its page on the Lifecycle Workflows custom task extension says that in launch and wait, the extension starts the Logic App and waits; if no response arrives within the wait, the task is considered failed. Learn's Graph reference sets the wait at thirty minutes to three hours. The response is a POST to resume, with a status of completed or failed, and Learn lists it in v1.0. And Learn's page on Microsoft Graph national cloud deployments gives the clouds: GCC keeps the worldwide Graph, GCC High and DoD have their own hosts, and a token for one cloud doesn't work in another.`,
  `${M} — Unit 2 "Where the extensions sit, and what Learn's definition leaves to you"; Book 19, Chapter 05 — "Where the extensions sit."`);
}

// ================================================================== 5 Leaves
{
  const s = content(SC, "What Learn's Logic App definition leaves to you");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [4.7, 7.45], ["Learn's definition, run as published", "What examples/lifecycle-extensions adds"], [
    ["Resumes with a managed identity, no secret", "Kept as the model, with the trigger schema unchanged"],
    ["Hard-codes graph.microsoft.com, on /beta", "A graphHost parameter: only the three Graph roots; the callback uses v1.0"],
    ["Uses callbackUriPath as it arrives", "Check_request refuses a path that isn't this task's resume path"],
    ["Always reports Completed", "The status comes from the integration call: completed or failed"],
    ["No callback when added work fails", "Resume runs after success, failure or time-out, so a failure is reported at once"],
    ["No idempotency", "Idempotency-Key set to the task processing result ID"],
    ["The subject's name, UPN and email in run history", "Trigger outputs and HTTP inputs and outputs secured"],
  ], { fontSize: 11.5, limit: 5.4 });
  callout(s, "Verdict", b + 0.25, 0.85, "FaListCheck", HEX.navy, "The verdict: ",
    "the right shape and trigger, kept; not safe to run as the leaver's credential revocation as published.");
  sources(s, "Sources: Module 7, Unit 2; Microsoft Learn, \"Configure a Logic App for Lifecycle Workflow use\" (pinned from MicrosoftDocs/entra-docs at 07cb73d).");
  notes(s,
`Microsoft Learn's page, Configure a Logic App for Lifecycle Workflow use, gives the definition to paste into code view. It's Microsoft's only sample for this integration, so the repository pins the page, from the entra docs repository. Running the definition against fakes shows what it leaves to you. It resumes the task with the Logic App's managed identity and no secret, and the kit keeps that. But it hard-codes the worldwide Graph host, and calls back on beta. It uses the callback path as it arrives, so any path appended to the Graph host gets a POST with the identity's token. It always reports completed, so a failed revocation reads as done. If work you add before the callback fails, no callback is sent, and the task waits out the whole timeout. It has no idempotency. And it carries the subject's name and email into run history. The verdict: the right shape and the right trigger, but not safe to run as the leaver's revocation as published.`,
  `${M} — Unit 2; Book 19, Chapter 05 — "What Learn gives you," "The pinned copy," "What it leaves to you."`);
}

// ================================================================== 6 One Logic App
{
  const s = content(SC, "One Logic App per integration, in four steps");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [2.6, 9.55], ["Step", "What it does"], [
    ["Check_request", "The path must be this workflow's and task processing result's resume path; else RejectedPayload, no call"],
    ["Operation", "Looks up the workflow ID in operations; an unregistered workflow gets no work done"],
    ["Call_integration", "Posts to the integration with an Idempotency-Key; retries 408, 429 and 5xx up to four times"],
    ["Resume", "Posts to {graphHost}/v1.0{callbackUriPath}; completed only if the call succeeded"],
  ], { fontSize: 12.5, limit: 4.1 });
  panel(s, "Reg", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "THE REGISTRY, CONFIG/INTEGRATIONS.JSON", "One entry per integration: data, not code", [
    "The tenant's cloud, the Logic App's Azure cloud, subscription, group and name, the downstream URI and audience",
    "The builder refuses values outside Learn's ranges: retries 0 or 1, a 30-minute to 3-hour wait",
  ], 13);
  sources(s, "Sources: Module 7, Unit 3; Microsoft Learn: \"Handle workflow errors and exceptions in Azure Logic Apps,\" \"customExtensionClientConfiguration resource type.\"");
  notes(s,
`The kit's definition is the one every integration deploys. What changes between integrations is data: four parameters, the Graph host, the downstream system, its audience, and the operations. A run goes in four steps. Check request checks that the callback path is a resume path for this workflow and this task processing result, and that the subject has an I D. If not, the run stops and sends nothing, because it can't trust the path. Operation looks up the workflow; an unregistered one gets no work done. Call integration posts to the downstream system with an idempotency key, the task processing result I D. The key is the kit's design, a contract with the downstream system, not a Microsoft feature. It retries transient errors up to four times, with a retry policy from Learn's page on handling errors in Azure Logic Apps. And Resume posts to the Graph host on v1.0, after success, failure or time-out, and reports completed only if the call succeeded. The registry holds one entry per integration, and the builder refuses values outside the ranges in Learn's Graph reference.`,
  `${M} — Unit 3 "The registry, the tool, authorization and the leaver order"; Book 19, Chapter 05 — "One Logic App per integration," "The registry."`);
}

// ================================================================== 7 Tool and auth
{
  const s = content(SC, "Lint, run, build, check, and authorization");
  tag(s, "What");
  const l = panel(s, "Tool", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "TOOLS/LCWEXT.PY", null, [
    "lint: twelve rules, LX-01 to LX-12, on any definition, Learn's included",
    "run: against fakes for a cloud, with failures and repeat deliveries",
    "build: the Logic App's ARM resource and the extension body, only if lint is clean",
    "check-extension and check-workflow: read-backs against the registry",
  ], 12.5);
  const r = panel(s, "Auth", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "AUTHORIZATION", null, [
    "Learn's proof-of-possession policy, with SAS turned off",
    "Learn documents it only for Azure commercial, so an Azure Government build is refused",
    "The callback identity holds no tenant-wide Lifecycle Workflows permission",
  ], 12.5);
  callout(s, "Order", Math.max(l, r) + 0.3, 0.85, "FaFileShield", HEX.navy, "The leaver order: ",
    "check-workflow requires Disable user account, then Revoke all refresh tokens for user, before the custom task.");
  sources(s, "Sources: Module 7, Unit 3; Microsoft Learn: \"Configure a Logic App for Lifecycle Workflow use,\" \"Best practices for securing the custom extension extensibility.\"");
  notes(s,
`The kit's tool has five commands. Lint applies twelve rules to any definition, Learn's included. One of them, L X eleven, adds up the worst-case retry waits and fails the definition if they reach the extension's timeout. Run runs a definition against fakes for a cloud, with downstream failures and repeat deliveries. Build writes the Logic App's ARM resource and the extension's body, and refuses if lint finds anything. And two checks compare what you read back from Graph with the registry. For authorization, the builder writes the proof-of-possession policy from Learn's page, Configure a Logic App for Lifecycle Workflow use, with shared access signatures turned off, as Learn's best practices for securing the custom extension ask. Learn documents that policy only for Azure commercial, so for a Logic App in Azure Government the builder refuses rather than guess. The callback identity needs no tenant-wide Lifecycle Workflows permission, which Learn advises against. And the workflow check requires the leaver to block first, which is this workbook's guidance, in Microsoft's order: disable, then revoke, then the custom task.`,
  `${M} — Unit 3; Book 19, Chapter 05 — "Lint, run, build, check," "Authorization, built and checked," "The leaver order."`);
}
endModule(SC);

// ================================================================== 8 Try it: Learn's definition
{
  const s = content(SL, "Try it: lint and run Learn's definition");
  tag(s, "How");
  const c = code(s, "Learn", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/lifecycle-extensions",
    "$ python tools/lcwext.py learn-sample",
    "$ python tools/lcwext.py lint out/learn-sample.workflow.json --timeout PT1H",
    "LX-03  Finding HTTP     hard-codes graph.microsoft.com; take the Graph host from a parameter ...",
    "LX-04  Finding HTTP     calls back on /beta; resume is in v1.0",
    "LX-06  Finding HTTP     uses callbackUriPath without checking it first",
    "LX-07  Finding HTTP     no callback when the work fails; Lifecycle Workflows waits out the whole timeout",
    "LX-08  Finding HTTP     always reports 'Completed', whatever happened",
    "...  two LX-10 warnings (run history) and one LX-11 warning (implicit retry policy)",
    "8 result(s); findings                                    (exit code 2)",
    "$ python tools/lcwext.py run out/learn-sample.workflow.json tests/fixtures/trigger-leaver.json --cloud GCCHigh",
    "  POST https://graph.microsoft.com/beta/identityGovernance/lifecycleWorkflows/workflows/.../resume ...",
    "Lifecycle Workflows task: failed (no callback within PT1H)",
  ], { label: LAB, pt: 10 });
  line(s, "Global", "Run again with --cloud Global: Lifecycle Workflows task: completed. It works only in the worldwide cloud.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 1 and 2; examples/lifecycle-extensions: tools/lcwext.py, tests/fixtures.");
  notes(s,
`Try it. Lab 1 runs in the lifecycle extensions folder of the examples, and nothing signs in. Step one extracts Learn's definition from the pinned page, and lints it with a one-hour timeout. Eight results, and exit code two. Five are findings: it hard-codes the worldwide Graph host, calls back on beta, uses the callback path without checking it, sends no callback when the work fails, and always reports completed. Two warnings are for run history, and one for the implicit retry policy. Step two runs Learn's definition for a GCC High tenant. The one POST goes to the worldwide Graph, on beta, and the last line is what Lifecycle Workflows records: failed, no callback within an hour. So a GCC High leaver's task fails at the end of the wait. Run it again for a worldwide tenant, and the task is completed.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 9 Try it: program's definition
{
  const s = content(SL, "Try it: the program's definition, through failures");
  tag(s, "How");
  const c = code(s, "Prog", 0.6, 1.45, 12.15, [
    "# Step 3: lint it, then with a 15-minute timeout",
    "$ python tools/lcwext.py lint logicapp/integration.workflow.json --timeout PT1H",
    "0 result(s); no findings",
    "$ python tools/lcwext.py lint logicapp/integration.workflow.json --timeout PT15M",
    "LX-11  Finding retryPolicy  worst-case retry waits (960s) reach the callback timeout PT15M   (exit code 2)",
    "# Step 4: run it for GCC High (last two lines of each run)",
    "$ python tools/lcwext.py run logicapp/integration.workflow.json tests/fixtures/trigger-leaver.json \\",
    "    --cloud GCCHigh --fail 503,503",
    "downstream: 3 call(s), 1 effect(s)            Lifecycle Workflows task: completed",
    "$ ... --cloud GCCHigh --fail 503,503,503,503,503",
    "downstream: 5 call(s), 0 effect(s)            Lifecycle Workflows task: failed",
    "$ ... --cloud GCCHigh --deliveries 2",
    "downstream: 2 call(s), 1 effect(s)            Lifecycle Workflows task: completed",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED AND JOINED: LAST TWO LINES PER RUN)", pt: 10 });
  line(s, "Host", "Every callback goes to https://graph.microsoft.us/v1.0/... With five failures, the task fails at once.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 3 and 4; examples/lifecycle-extensions/logicapp/integration.workflow.json.");
  notes(s,
`Step three lints the program's definition. With a one-hour timeout: no findings. With a fifteen-minute timeout, L X eleven finds that the worst-case retry waits, nine hundred and sixty seconds, reach the callback timeout, and the exit code is two. So the retries have to fit inside the wait. Step four runs the program's definition for GCC High, three ways. Through two transient failures: three downstream calls, one effect, and the task is completed. Through five failures: five calls, no effect, and the task is failed, at once, not at the end of the wait. And with two deliveries of the same request: two calls, but one effect, and the task is completed. The idempotency key means the work is done once. Every callback goes to the GCC High Graph host, on v1.0. The slide joins each run's last two lines.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 3 and 4.`);
}

// ================================================================== 10 Try it: build and check
{
  const s = content(SL, "Try it: build the pieces, and check the read-backs");
  tag(s, "How");
  const c = code(s, "Build", 0.6, 1.45, 12.15, [
    "# Step 5: build from the registry; then once with the Logic App in Azure Government",
    "$ python tools/lcwext.py build config/integrations.json --name cms-revocation --tenant-id 6e3a1f2b-...",
    "wrote out/arm-cms-revocation.json",
    "wrote out/extension-cms-revocation.json",
    "error: cms-revocation: Learn documents the PoP policy only for Azure commercial; no values for",
    "  AzureUSGovernment (research gap), so nothing is built                 (exit code 1)",
    "# Step 6: check-extension and check-workflow print 0 result(s); no findings. Then the custom task first:",
    "$ python tools/lcwext.py check-workflow ... workflow-seq0.json",
    "WX-03  Finding tasks  'Disable user account' doesn't run before the custom task (Book 03: block first)",
    "WX-03  Finding tasks  'Revoke all refresh tokens for user' doesn't run before the custom task (...)",
    "2 result(s); findings                                                  (exit code 2)",
    "# Step 7: the tests",
    "$ python -m unittest discover -s tests -v",
    "Ran 55 tests ... OK",
  ], { label: LAB, pt: 10 });
  line(s, "Clean", "Step 8 cleans up: rm -rf out workflow-seq0.json", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 5 to 8; data/kit-captures/adm/05-9 (the Azure Government refusal).");
  notes(s,
`Step five builds the deployment pieces from the registry, for the card management revocation integration. It writes two files: the Logic App's ARM resource, and the extension's body. Then set the Logic App's cloud to Azure Government, build again, and put it back. The second build exits one: Learn documents the proof-of-possession policy only for Azure commercial, so nothing is built. Step six checks the read-backs. The extension and the leaver workflow both come back with no findings. Then move the custom task to the front of a copy of the workflow, and check the copy. Two W X oh three findings: Disable user account, and Revoke all refresh tokens, don't run before the custom task. Block first. Exit code two. Step seven runs the tests: fifty-five, OK. Step eight cleans up.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 5 to 8.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: run a test leaver in your test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant with Entra ID Governance licenses and a test Azure subscription, never production"],
    ["Roles", "Lifecycle Workflows Administrator; Logic App Contributor, Contributor or Owner on the resource group"],
    ["Create and check", "Create the extension and its Logic App in the admin center; check them against the registry"],
    ["Replace and run", "Paste the program's definition; build an on-demand leaver that blocks first; run it for one fictional user"],
    ["Drill", "Point the integration at a receiver that answers 503: the task should fail within minutes"],
    ["Back it out", "Remove the custom task and workflow, then the extension, Logic App, resource group, roles and users"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Book 19, Chapter 05, Lab 2, step by step.");
  sources(s, "Sources: Module 7, Unit 5 \"Exercise: Lab 2 (your test tenant)\"; Book 19, Ch 05 \"Lab 2: test tenant.\"");
  notes(s,
`Lab 2 runs a real leaver, in a test tenant with Microsoft Entra ID Governance licenses and a test Azure subscription, never production. You need the Lifecycle Workflows Administrator role, and Logic App Contributor, Contributor or Owner on the resource group. Create the extension and its Logic App in the admin center, record what the admin center made, and check it against the registry. Replace the definition with the program's. Build an on-demand test leaver workflow that blocks first, and run it for one fictional user. Then drill the failure path: point the integration at a receiver that answers five-oh-three, and confirm the task ends failed within minutes, not at the end of the hour. To back it out, remove the custom task and the workflow, then the extension, the Logic App, the resource group, the role assignments and the test users. The authors haven't run Lab 2.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test tenant)"; Book 19, Chapter 05 — "Lab 2: test tenant."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 7");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.6, 2.7, 4.85], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["AC-2; PS-4: an honest callback, one effect per delivery", "KSI-IAM-AAM", "The task processing result in Lifecycle Workflows"],
    ["CM-3(2): the definition passes; long retries refused", "KSI-CMT-VTD", "The pull request's check run"],
    ["CM-2; CM-6; AC-3: built from the registry, SAS off, PoP on", "KSI-CMT-RMV; KSI-IAM-SNU", "The repository and the deployment record"],
    ["CM-6; PS-4; AC-2: read-backs match; the leaver blocks first", "KSI-MLA-EVC; KSI-IAM-AAM", "The check output, filed with the change"],
    ["AC-6: no tenant-wide Lifecycle Workflows permission", "KSI-IAM-ELP; KSI-IAM-SNU", "The extension's authorizedApps, and the check output"],
    ["AU-12; AC-2: an on-demand run completes (Lab 2)", "KSI-MLA-LET", "The Logic App run history and the task processing result"],
  ], { fontSize: 11.5, limit: 5.8 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, Unit 1; NIST SP 800-53 (the SP 800-53B Moderate baseline); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. A custom task extension carries the part of a leaver the built-in tasks don't, so its evidence is account and credential removal. A callback that reports what really happened, at once, with one effect per delivery, supports NIST special publication eight hundred fifty-three controls A C two, account management, and P S four, personnel termination; the evidence is the task processing result. The definition passing lint, with long retries refused, leaves the pull request's check run. Building from the reviewed registry, with shared access signatures off and proof-of-possession on, leaves the repository and the deployment record. The read-back checks, and the leaver blocking first, are filed with the change. The extension's authorized apps show the callback identity has no tenant-wide permission. And in Lab 2, an on-demand run leaves the Logic App's run history. The KSI column is FedRAMP's Key Security Indicators, the FedRAMP 20x indicators for providers. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 05's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on extensions", [
    { q: "Learn's definition runs for a GCC High leaver. What does Lifecycle Workflows record?", options: ["a. Completed", "b. Failed, at the end of the wait, because the callback went to the worldwide Graph on beta", "c. Failed at once"] },
    { q: "Why does the builder refuse a Logic App in Azure Government?", options: ["a. Logic Apps don't run there", "b. Learn documents the proof-of-possession policy only for Azure commercial, so it refuses rather than guess", "c. The registry doesn't allow it"] },
  ], "1 b: step 2 of the lab, failed (no callback within PT1H). 2 b: step 5 of the lab; nothing is built.");
  sources(s, "Sources: Module 7, Unit 6 \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: Learn's definition runs for a GCC High leaver. What does Lifecycle Workflows record? The answer is b: failed, at the end of the wait, because the callback went to the worldwide Graph on beta. You saw it in step two: failed, no callback within an hour. Second: why does the builder refuse a Logic App in Azure Government? The answer is b: Learn documents the proof-of-possession policy only for Azure commercial, so the builder refuses rather than guess, and nothing is built. You saw that in step five. The module page has two more questions, on five downstream failures and on W X oh three, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary, and next: Module 8, drift and evidence");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Ran an extension's definition for the right cloud, through failures and repeat deliveries",
    "Built its deployment pieces from a reviewed registry",
    "Checked that the leaver blocks before the custom task runs",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 8: Run the drift pipeline", [
    "The validation kit on a schedule",
    "Each run compared with the last",
    "A package sha256sum verifies",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 05 checklist in Book 19.");
  sources(s, "Sources: Module 7, Unit 7 \"Summary\"; Module 8, subtitle and description.");
  notes(s,
`To sum up. You ran a custom task extension's definition for the right cloud, through failures and repeat deliveries, built its deployment pieces from a reviewed registry, and checked that the leaver blocks before the custom task runs. The evidence an ISSO keeps: the registry and the built ARM and extension files in the repository, the check output filed with the change, and, from Lab 2, the task processing results, the Logic App run history, the drill record and the activity logs. Gate 7's own evidence, the mover workflow's run history joined on the key, is in the guide. Before shipping, work through the Chapter 05 checklist. Next is Module 8: run the drift pipeline and hand over the evidence. You'll run the validation kit on a schedule with no stored secret, compare each run with the last, and hand the ISSO a package sha256sum verifies.`,
  `${M} — Unit 7 "Summary"; Module 8 — subtitle and description.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 7 deck", [
  "Module page: docs/training/attribute-driven-migration/07-lifecycle-workflows-extensions.md (Attribute-Driven Migration learning path, Module 7): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 05 \"Where the extensions sit,\" \"What it leaves to you,\" \"One Logic App per integration,\" \"The registry,\" \"Lint, run, build, check,\" \"Authorization, built and checked,\" \"The leaver order,\" Lab 2, Checklist; the implementation guide's Gates 7 and 8.",
  "Kit: examples/lifecycle-extensions (tools/lcwext.py; tools/wdl.py; logicapp/integration.workflow.json; config/integrations.json; tests; tests/fixtures), with the pinned Learn page in examples/third_party. Fictional identities. Illustrative: tested against fakes, not against a production tenant.",
  "Lab output: run November 3, 2026 with Python 3.14.3 in a scratch copy of examples/lifecycle-extensions and examples/third_party; it matches the module page and data/kit-captures/adm (05-1 to 05-13). Verification: docs/training/attribute-driven-migration/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
