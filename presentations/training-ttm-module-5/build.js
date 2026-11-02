// Ticket-to-Machine learning path, Module 5: Drift to a Typed Task — the module's narrated deck.
// Teaches docs/training/ticket-to-machine/05-drift-to-a-typed-task.md, Learn-style: objectives, the concepts, two
// "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a copy of
// examples/servicenow-sailpoint), Lab 2, the federal requirement and evidence, a two-question check, and the summary.
// Every fact comes from the module page, the sections it sends you to read (the guide's Gate 4, the workbook's
// Chapter 04), its verification log, or the kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ttm-module-5/build.js \
//                      presentations/training-ttm-module-5/Training_TTM_Module_5.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 5: Drift to a Typed Task",
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine learning path, Module 5: Drift to a Typed Task",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
const OUT = process.argv[2] || "Training_TTM_Module_5.pptx";
const M = "Training, Ticket-to-Machine, Module 5";

// shared.js names the deck and the title slide for the Microsoft Automation path; this deck is on the
// Ticket-to-Machine path, so it sets its own document title and uses its own title slide (same layout).
P.D.pres.title = "Ticket-to-Machine learning path — Module 5: Drift to a Typed Task";
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "TICKET-TO-MACHINE LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
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
  const s = title(SI, "Module 5: Drift to a typed task", "Ticket-to-Machine learning path · The exact finding an ISC event produces, seen on a laptop",
    ["Three workflows  ·  The Scripted REST resource  ·  Seeing the payload  ·  Two fixes", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement  ·  Evidence"]);
  notes(s,
`Welcome to Module 5 of the Ticket-to-Machine learning path: drift to a typed task. This module covers the guide's Gates 3 and 4, and the developer workbook's Chapter 04. In Module 4 you measured drift. Now you follow one change from SailPoint Identity Security Cloud, ISC for short, into ServiceNow as a typed finding. You'll learn what the three ISC workflows send, what the ServiceNow script does with each payload, and how a small tool lets you see the exact payload on a laptop, before any workflow runs in a tenant. Running that tool found two gaps, and you'll see both fixes. The code is illustrative, tested against fictional fixtures.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a finding needs something to check");
  tag(s, "Why");
  const b = table(s, "Story", 1.45, [5.0, 7.15], ["What happens", "What follows"], [
    ["Someone adds a proxy address to an Active Directory account, outside the governed process", "SailPoint's Native Change Detection sees it"],
    ["A workflow posts it to ServiceNow", "A finding opens"],
    ["But the workflow doesn't send that kind of change", "The finding's intended state is empty"],
    ["Module 6's re-read compares the account with the intended state", "It has nothing to disagree with"],
  ], { fontSize: 13.5, limit: 4.9 });
  callout(s, "Point", b + 0.3, 0.95, "FaLightbulb", HEX.red, "This module: ",
    "see the exact payload each workflow produces, on a laptop, before any workflow runs in a tenant.");
  sources(s, "Sources: Module 5, Unit 1 \"Introduction.\"");
  notes(s,
`Why does this matter? Picture it. Someone adds a proxy address to an Active Directory account, outside the governed process. SailPoint's Native Change Detection sees it, a workflow posts it to ServiceNow, and a finding opens. So far, so good. But suppose the workflow doesn't send that kind of change. Then the finding's intended state is empty. In Module 6, the re-read compares the account with the intended state, and with nothing in it, there's nothing to disagree with. The finding looks fixed when it isn't. That's why, in this module, you see the exact payload each workflow produces, on a laptop, before any workflow runs in a tenant.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Describe the three ISC workflows and what each event becomes in ServiceNow",
    "Resolve a workflow's body against a saved trigger input, and read the payload, the intended state and the de-duplication key",
    "Explain the two gaps the tool found, and how each was fixed",
    "Verify that a closure signal never closes a finding",
  ], [
    "Module 4, and Module 1's finding contract (Unit 3)",
    "Lab 1: the kit, Python 3.10 or later, Node.js 18 or later; no tenant",
    "Lab 2: a SailPoint sandbox and a ServiceNow developer instance",
  ], 45);
  sources(s, "Sources: Module 5, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 5 \"Exercise: Lab 2\"; the learning path's \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll describe the three ISC workflows and what each event becomes in ServiceNow. You'll resolve a workflow's body against a saved trigger input, and read the payload, the intended state and the de-duplication key. You'll explain the two gaps the tool found, and how each was fixed. And you'll verify that a closure signal never closes a finding. Before you start, finish Module 4, and review the identity finding contract from Module 1, Unit 3. Lab 1 needs only the kit, Python and Node, with no tenant. Lab 2 needs a SailPoint sandbox tenant and a ServiceNow developer instance.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Three workflows
{
  const s = content(SC, "Three workflows, one front door");
  tag(s, "What");
  const b = table(s, "Workflows", 1.45, [3.55, 3.2, 5.4], ["ISC trigger", "What it becomes", "What ServiceNow does with it"], [
    ["Native Change Account Updated", "An unauthorized write, on the account", "Opens a finding whose intended state reverts the change"],
    ["Identity Attributes Changed", "Attribute drift, on the identity", "Opens a finding whose intended state keeps the new value"],
    ["Provisioning Action Completed", "A closure signal, never a closure", "Moves matching findings to Awaiting verification"],
  ], { fontSize: 13, limit: 3.9 });
  panel(s, "Shape", 0.6, b + 0.25, 12.15, null, HEX.navy, HEX.navyTint, "IN sailpoint/workflows/drift-to-servicenow.json", null, [
    "Each workflow is a name, an owner, a trigger and a definition whose one action is an HTTP Request step",
    "Each step posts to the same Scripted REST resource: one front door",
    "Each is created disabled, because SailPoint workflows can't be created enabled; enable each after a test run",
  ], 13.5);
  sources(s, "Sources: Module 5, Unit 2; workbook Chapter 04, \"What exists\"; guide, Gate 4, step 2.");
  notes(s,
`The kit has one ISC workflow per trigger. A native change, where an account was updated directly on the source, becomes an unauthorized write on the account, and ServiceNow opens a finding whose intended state reverts the change. An identity attribute change becomes attribute drift on the identity, and its intended state keeps the new value. A completed provisioning action is a closure signal, and only a signal. It moves matching findings to Awaiting verification; it never closes one. All three live in one workflow file. Each is a name, an owner, a trigger, and a definition whose one action is an HTTP Request step, and every step posts to the same Scripted REST resource, the one front door. Each is created disabled, because SailPoint workflows can't be created enabled. You enable each one after a test run.`,
  `${M} — Unit 2 "Three workflows, one front door."`);
}

// ================================================================== 5 Scripted REST resource
{
  const s = content(SC, "What the Scripted REST resource does with a payload");
  tag(s, "What");
  const l = panel(s, "Script", 0.6, 1.45, 6.3, null, HEX.navy, HEX.navyTint, "servicenow/scripted-rest-identity-finding.js", "On every post", [
    "Validates the payload",
    "Sets the priority and the due date",
    "De-duplicates against open findings",
    "Derives the intended state when the payload has none: a native change reverted, an attribute change kept",
    "On a successful provisioning signal, moves matching findings to Awaiting verification",
  ], 13);
  const r = panel(s, "Tests", 7.15, 1.45, 5.6, null, HEX.teal, HEX.tealTint, "VALIDATE (G4 FRONT DOOR)", "What the kit checks", [
    "test_contract.py: the workflow file's shape, no secrets in it, every field its bodies send read by the script",
    "Node tests: priority and due date from severity, de-duplication, validation failures return 400",
    "Live, in Lab 2: one native change raises one finding; a repeat de-duplicates",
  ], 13);
  callout(s, "Gap", Math.max(l, r) + 0.3, 0.85, "FaFilter", HEX.red, "What none of it showed: ",
    "the payload itself. SailPoint resolves the body's .$ keys at run time, in a tenant.");
  sources(s, "Sources: Module 5, Unit 2; workbook Chapter 04, \"What exists\"; guide, Gate 4, step 1, and \"Validate (G4 Front door).\"");
  notes(s,
`On the ServiceNow side, a Scripted REST script receives every post. It validates the payload, sets the priority and the due date, and de-duplicates against open findings. When the payload carries no intended state, it derives one: a native change is reverted, an attribute change is kept. And on a successful provisioning signal, it moves matching findings to Awaiting verification. The guide's Gate 4 validation lists what the kit already checks. The contract test checks the workflow file's shape, that it holds no secrets, and that every field its bodies send is read by the script. The Node tests check priority and due date, de-duplication, and that a bad payload gets a 400. But none of it showed the payload itself, because SailPoint resolves the body's dollar keys at run time, in a tenant.`,
  `${M} — Unit 2 "Three workflows, one front door"; Chapter 04 — "What exists"; guide — "Validate (G4 Front door)."`);
}

// ================================================================== 6 workflow_payload.py
{
  const s = content(SC, "Seeing the payload before a tenant does");
  tag(s, "How");
  const b = table(s, "Tool", 1.45, [3.0, 9.15], ["workflow_payload.py", "What it does"], [
    ["Picks", "The workflow for the trigger you name"],
    ["Resolves", "The body's .$ keys against a saved trigger input: simple paths only, $.a.b; anything else is refused, because it isn't a JSONPath engine"],
    ["Derives", "The intended state, exactly as the ServiceNow script does"],
    ["Checks", "The payload against Module 1's contract, with finding_contract.validate"],
    ["Lists", "The input's top-level fields the body doesn't send"],
  ], { fontSize: 13, limit: 4.6 });
  callout(s, "Illustrative", b + 0.25, 1.15, "FaTriangleExclamation", HEX.amber, "Illustrative: ",
    "it shows what the body says to send, not what SailPoint's step sends. Whether the step resolves .$ keys, and the input's root, are on the kit's verify list.");
  sources(s, "Sources: Module 5, Unit 3; workbook Chapter 04, \"What this chapter adds\" and its \"Illustrative code\" note.");
  notes(s,
`So Chapter 04 adds a tool: workflow payload dot p y. It picks the workflow for the trigger you name, and resolves the body's dollar keys against a saved trigger input. It handles simple paths only, like dollar dot a dot b. Anything more complex is refused, because the tool isn't a JSONPath engine. Then it derives the intended state exactly as the ServiceNow script does, checks the payload against Module 1's contract, and lists the input's top-level fields the body doesn't send. That last line is where gaps show up. Three fictional trigger inputs come with it: a native change to Alice's account, a department change on Erin's identity, and a successful provisioning action for Alice. One caution: the tool shows what the body says to send, not what SailPoint's step actually sends. Lab 2 settles that for your tenant.`,
  `${M} — Unit 3 "Seeing the payload, and two fixes"; Chapter 04 — "What this chapter adds."`);
}

// ================================================================== 7 Fix 1
{
  const s = content(SC, "Fix 1: multivalued changes are now reverted");
  tag(s, "What");
  const b = table(s, "Kinds", 1.45, [4.3, 3.6, 4.25], ["Native Change Account Updated sends", "Before the fix", "After the fix"], [
    ["singleValueAttributeChanges", "Sent", "Sent"],
    ["entitlementChanges", "Sent", "Sent"],
    ["multiValueAttributeChanges (name, addedValues, removedValues)", "Not sent", "Sent as multi_value_changes"],
  ], { fontSize: 13, limit: 3.6 });
  const l = panel(s, "Before", 0.6, b + 0.25, 6.0, null, HEX.red, HEX.redTint, "BEFORE", null, [
    "A native change only to a multivalued attribute, such as a proxy address added out of band, produced an intended state with nothing in it",
    "A re-read would have found nothing to disagree with",
  ], 13);
  panel(s, "After", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "AFTER", null, [
    "The script reverts it: added values must be absent, removed values present",
    "Fixed in the workflow, the script, the Python mirror and a test",
  ], 13);
  sources(s, "Sources: Module 5, Unit 3; workbook Chapter 04, \"What this chapter adds,\" fix 1; SailPoint, Native Change Account Updated trigger (read Nov. 1, 2026).");
  notes(s,
`Here's the first gap. SailPoint's Native Change Account Updated input has three kinds of change: single-value attribute changes, entitlement changes, and multivalued attribute changes, each with a name, the values added and the values removed. The workflow sent the first two, but not the third. So a native change only to a multivalued attribute, say a proxy address added out of band, produced an intended state with nothing in it, and a re-read would have found nothing to disagree with. That's exactly the story from the start of this module. Now the workflow sends the multivalued changes, and the script reverts them: values that were added must be absent, and values that were removed must be present. Each fix went into the workflow or script, the Python mirror, and a test.`,
  `${M} — Unit 3 "Seeing the payload, and two fixes"; Chapter 04 — "What this chapter adds," fix 1.`);
}

// ================================================================== 8 Fix 2
{
  const s = content(SC, "Fix 2: the attribute joins the de-duplication key");
  tag(s, "What");
  const b = table(s, "Key", 1.45, [2.2, 4.7, 5.25], ["", "Before the fix", "After the fix"], [
    ["Key", "source | subject | class", "source | subject | class | attribute, when the payload names one"],
    ["Two attributes drift on one user", "Department and manager become one record", "Two findings, one per attribute"],
    ["The re-read", "Checks only the first; the second intended state is lost", "Checks each intended state"],
  ], { fontSize: 13, limit: 3.9 });
  line(s, "Example", "From Lab 1: key sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department", b + 0.3, 0.45, 14);
  callout(s, "Docs", b + 1.0, 0.85, "FaBook", HEX.navy, "Documented: ",
    "the kit's README and the implementation example say so, and a node test pins two findings for two attributes.");
  sources(s, "Sources: Module 5, Unit 3; workbook Chapter 04, \"What this chapter adds,\" fix 2, and \"The tests\"; Lab 1, step 3.");
  notes(s,
`The second gap was in the de-duplication key. The script de-duplicated on source, subject and drift class. So if two attributes drifted on one user, say department and manager, they became one record. The second finding's intended state was lost, and the re-read checked only the first. Now the key adds the attribute whenever the payload names one. You'll see it in the lab: Erin's finding has a key that ends in department. Two attributes drifting on one subject are now two findings, each with its own intended state, and a node test pins that. The kit's README and the implementation example both say so.`,
  `${M} — Unit 3 "Seeing the payload, and two fixes"; Chapter 04 — "What this chapter adds," fix 2.`);
}

// ================================================================== 9 Not verified
{
  const s = content(SC, "What couldn't be verified, and Lab 2 settles");
  tag(s, "Who");
  const b = table(s, "Unverified", 1.45, [4.6, 7.55], ["Not verified", "Why, and where it's tracked"], [
    ["The native-change trigger ID", "The kit uses idn:native-change-account-updated; SailPoint's trigger table doesn't list it, and the page names only the event type (verify list, item 1)"],
    ["The HTTP Request step's JSON attribute names", "SailPoint documents the step's fields in the editor, not its JSON (verify list, item 2)"],
    ["Whether the step resolves .$ keys in its body, and the input's root", "$ or $.trigger: the tool assumes the body says what's sent (verify list, items 2 and 3)"],
    ["Each item's shape in entitlementChanges[].added", "The script and fixture read value; the trigger page lists fields only to added and removed"],
    ["provisioningResult values beyond SUCCESS", "Verify list, item 5"],
  ], { fontSize: 12.5, limit: 6.55 });
  sources(s, "Sources: Module 5, Unit 3; workbook Chapter 04, \"What couldn't be verified\" and its \"Illustrative code\" note; SailPoint, Triggers table (read Nov. 1, 2026).");
  notes(s,
`Chapter 04 is honest about what it couldn't verify, and you should be too. The kit's trigger ID for a native change isn't in SailPoint's published trigger table; the page names only the event type. SailPoint documents the HTTP Request step's fields in the editor, not as JSON, so the attribute names in the kit's file are unconfirmed. Whether the step resolves the dollar keys inside its JSON body, and whether the input sits at the root or under trigger, are on the kit's verify list too. The shape of each added entitlement isn't documented to that level, and neither are provisioning results other than success. That's why the tool shows what the body says to send, not what SailPoint sends. Lab 2 settles each of these for your tenant, and the checklist asks you to confirm them in a sandbox.`,
  `${M} — Unit 3 "Seeing the payload, and two fixes"; Chapter 04 — "What couldn't be verified."`);
}

// ================================================================== 10 Dangers
{
  const s = content(SC, "Dangers between an event and a finding");
  tag(s, "Who");
  const b = table(s, "Dangers", 1.45, [3.55, 4.1, 4.5], ["Danger", "What happens", "The guard"], [
    ["An event field the workflow doesn't send", "Part of the change is never reverted, and the re-read passes", "workflow_payload.py lists unsent fields; the multivalued fix and its tests"],
    ["Two drifts on one subject folded into one record", "The second intended state is lost", "The attribute in the key; a node test"],
    ["A workflow edited in the editor, not the file", "The repository stops describing what runs", "Export and diff after any editor change"],
    ["Credentials in the workflow file", "They reach the repository", "REPLACE-IN-THE-UI placeholders; test_contract.py fails on a secret"],
    ["A closure signal treated as closure", "A finding closes without a re-read", "The script only moves it to Awaiting verification; Module 6's business rule"],
  ], { fontSize: 12, limit: 6.55 });
  sources(s, "Sources: Module 5, Unit 3; workbook Chapter 04, \"Dangers\"; Book 13, Chapter 10, \"Native tools change state, they don't close findings.\"");
  notes(s,
`Chapter 04 lists the dangers between an event and a finding, and the guard for each. If the workflow doesn't send an event field, part of the change is never reverted and the re-read passes; the tool lists unsent fields. If two drifts fold into one record, the second is lost; the attribute in the key prevents it. If someone edits a workflow in the editor and not in the file, the repository stops describing what runs, so export and diff after any editor change. Credentials must never be in the workflow file; it uses placeholders, and the contract test fails on a secret. And a closure signal must never be treated as closure. Book 13's point is that native tools change state; they don't close findings. The script only moves a finding to Awaiting verification, and Module 6's business rule blocks any other close.`,
  `${M} — Unit 3 "Seeing the payload, and two fixes"; Chapter 04 — "Dangers."`);
}
endModule(SC);

// ================================================================== 10 Try it 1
{
  const s = content(SL, "Try it: what the native-change workflow posts");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/servicenow-sailpoint (fixtures, no tenant)",
    "$ python -m pytest tests/python/test_workflow_payload.py tests/python/test_contract.py -q",
    "11 passed in 0.85s",
    "$ python clients/python/workflow_payload.py --trigger idn:native-change-account-updated \\",
    "    --event tests/fixtures/events/native-change-account-updated.json",
    "Workflow: Drift to ServiceNow - native change (provenance)",
    "kind finding, drift_class unauthorized_write, system isc_account",
    "intended_state {\"attributes\": {\"title\": \"Analyst\"},",
    "  \"entitlements_absent\": [{\"attribute\": \"proxyAddresses\", \"value\": \"smtp:ap-approver@contoso.example\"},",
    "    {\"attribute\": \"memberOf\", \"value\": \"CN=Payables Approvers,OU=Groups,DC=contoso,DC=example\"}],",
    "  \"entitlements_present\": []}",
    "contract: accepted: P2, priority 2, key sailpoint-isc|2c91800000000000000000000a1001ad|unauthorized_write",
    "input fields not sent: eventType",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (LONG LINES WRAPPED)", pt: 11 });
  line(s, "Read", "Title back to Analyst; the group and the proxy address must be gone. eventType is always ACCOUNT_UPDATED, so dropping it loses nothing.", c + 0.25, 0.7, 14);
  sources(s, "Sources: Module 5, Unit 4 \"Exercise: Lab 1,\" steps 1 and 2; workbook Chapter 04, Lab 1, step 2; tests/fixtures/events.");
  notes(s,
`Try it. Lab 1 runs on a laptop, in the kit's servicenow-sailpoint folder, with no tenant. Step one runs the chapter's tests: eleven pass. Step two resolves the native-change workflow against Alice's fictional event, where her title was changed to Director, a group was added, and a proxy address was added. Read the output line by line. It's a finding, an unauthorized write on the ISC account. The intended state puts the title back to Analyst, and says the proxy address and the Payables Approvers group must be absent. The contract accepts it at priority 2, with a key of source, account and class. And the only input field not sent is the event type, which is always account updated for this trigger, so dropping it loses nothing. Before the fix, the proxy address was missing here.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 11 Try it 2
{
  const s = content(SL, "Try it: the mover's finding and the closure signal");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 3 to 5",
    "$ python clients/python/workflow_payload.py --trigger idn:identity-attributes-changed \\",
    "    --event tests/fixtures/events/identity-attributes-changed.json",
    "kind finding, drift_class attribute_drift, system isc_identity",
    "intended_state {\"attributes\": {\"department\": \"Finance\"}}",
    "contract: accepted: P3, priority 3, key sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department",
    "input fields not sent: none",
    "$ python clients/python/workflow_payload.py --trigger idn:post-provisioning \\",
    "    --event tests/fixtures/events/provisioning-completed.json",
    "kind closure_signal, drift_class -, system -",
    "contract: accepted",
    "input fields not sent: action, requester, sources, warnings",
    "$ node --test --test-name-pattern=\"attribute is in the key|multivalued\" tests/servicenow/servicenow_scripts.test.js",
    "ℹ tests 2",
    "ℹ pass 2",
    "ℹ fail 0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED)", pt: 11 });
  line(s, "Check", "Check your work: for each workflow and event, say what payload ServiceNow receives and what the re-read will check.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 5, Unit 4 \"Exercise: Lab 1,\" steps 3 to 5; workbook Chapter 04, Lab 1, steps 3 to 5.");
  notes(s,
`Step three is the mover. Erin's department moved from HR to Finance. The finding is attribute drift on her identity, and its intended state is the new value, department Finance, to be kept, not reverted. It's priority 3, and the key now ends in the attribute, department. No input field is dropped. Step four is the closure signal for Alice's provisioning action. Its kind is closure signal, the contract accepts it, and it doesn't send the action, the requester, the sources or the warnings. A signal moves matching findings to Awaiting verification; it never closes one. Step five runs the two new script tests, two attributes as two findings and multivalued changes reverted, and both pass. On the slide, the workflow name lines and the test names are trimmed. Check your work: for each event, say what ServiceNow receives and what the re-read will check.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 3 to 5.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: one workflow in a SailPoint sandbox");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A SailPoint sandbox tenant, the developer instance from Modules 1 and 2, and the workflow client from Module 2's Lab 2; never production"],
    ["Turn on", "Native Change Detection on one test source, monitoring account updates and at least one attribute"],
    ["Build", "One HTTP Request step by hand; export it and compare its attribute names with the kit's file"],
    ["Capture", "Point it at a capture endpoint or your instance; change the attribute; the payload must match workflow_payload.py"],
    ["Repeat", "The same change again: it should de-duplicate and add one to the record's occurrences"],
    ["Back it out", "Disable and delete the workflow, NCD off, restore the attribute, delete the findings, remove the client"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the ServiceNow endpoint has to be reachable from SailPoint's cloud, which is an inference on the verify list.");
  sources(s, "Sources: Module 5, Unit 5 \"Exercise: Lab 2\"; workbook Chapter 04, \"Lab 2: a SailPoint sandbox and a ServiceNow developer instance.\"");
  notes(s,
`Lab 2 takes this into your own test instances: a SailPoint sandbox tenant, the ServiceNow developer instance from Modules 1 and 2, and the workflow client from Module 2's Lab 2. Never production. Turn on Native Change Detection on one test source. Build one HTTP Request step by hand, export it, and compare its attribute names with the kit's file. Point it at a capture endpoint or your developer instance, change a monitored attribute on a test account, and confirm the payload matches the tool's output. If it doesn't, the dollar keys or the input's root differ. Repeat the change, and it should de-duplicate. Then back it all out. The ServiceNow endpoint has to be reachable from SailPoint's cloud, which the workbook marks as an inference. The authors haven't run Lab 2.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 3.3, 3.25], ["What the output proves", "Requirement", "Who keeps it"], [
    ["A write outside the governed process is raised as an owned, clocked finding whose intended state is the revert", "NIST SP 800-53 CM-3, SI-4", "The finding, with its origin and raw event"],
    ["Each drifting attribute is its own piece of work, with its own intended state", "CM-3", "The finding records, one per attribute"],
    ["A workflow change is tested before it runs", "CM-3, SA-11", "The pull request and its test run"],
  ], { fontSize: 12.5, limit: 4.3 });
  callout(s, "Inference", b + 0.3, 1.15, "FaScaleBalanced", HEX.navy, "Inference: ",
    "treating a native change as an unauthorized write is the program's. The workflow can't know if a claim is in use, so a person or a rule raises it to P1.");
  sources(s, "Sources: Module 5, Unit 1 \"The federal requirement\"; Unit 7 \"Summary\"; workbook Chapter 04, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Chapter 04's table maps an out-of-process write, raised as an owned, clocked finding, to NIST special publication eight hundred fifty-three C M three, configuration change control, and S I four, system monitoring. It maps a tested workflow change to C M three and S A eleven, developer testing. The evidence an ISSO keeps from this module: the ServiceNow finding with its origin and raw event; the finding records, one per drifting attribute; and the pull request and test run for any workflow change. One label carries over. Treating a native change as an unauthorized write is the program's inference. And provenance drift on a claim in active use is P1, but the workflow can't know whether a claim is in use, so a person or a rule raises it. Before shipping, work through Chapter 04's checklist.`,
  `${M} — Unit 1 "The federal requirement"; Unit 7 "Summary"; Chapter 04 — "Federal requirements and evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on drift to a task", [
    { q: "Before the fix, what did a native change to only a multivalued attribute, such as a proxy address, produce?", options: ["a. A 400 from the Scripted REST resource", "b. A finding whose intended state named nothing, so a re-read would find nothing to disagree with", "c. Two findings for the same account"] },
    { q: "Why does the de-duplication key now end in the attribute?", options: ["a. Two attributes drifting on one user were folded into one record, and the second intended state was lost", "b. ServiceNow requires the attribute name in every key", "c. It makes the key unique across tenants"] },
  ], "1 b: the workflow didn't send multiValueAttributeChanges. 2 a: see fix 2.");
  sources(s, "Sources: Module 5, Unit 6 \"Knowledge check,\" questions 1 and 2, and \"Check your answers\"; workbook Chapter 04, \"What this chapter adds.\"");
  notes(s,
`Check yourself with two questions. First: before the fix, what did a native change to only a multivalued attribute, such as a proxy address, produce? The answer is b: a finding whose intended state named nothing, so a re-read would find nothing to disagree with. The workflow didn't send the multivalued changes. Second: why does the de-duplication key now end in the attribute? The answer is a. Two attributes drifting on one user were folded into one record, and the second finding's intended state was lost. The module page has two more questions, on the mover's intended state and on what the tool does with a complex path.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 2.`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 6, the re-read rule");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw the exact payload each ISC workflow sends",
    "Read the intended state each finding carries: a native change reverted, an attribute change kept",
    "Saw the two fixes that keep a finding from reaching the re-read with nothing to check",
    "Confirmed a closure signal never closes a finding",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6: Actuation and the re-read rule", [
    "Gate 5: actuation by lane",
    "Gate 6: close only on a re-read",
    "Six waiting findings, decided on two days",
  ], 13.5);
  callout(s, "Check", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 04 checklist.");
  sources(s, "Sources: Module 5, Unit 7 \"Summary\"; Module 6, Unit 1.");
  notes(s,
`To sum up. You saw the exact payload each ISC workflow sends, and the intended state each finding carries: a native change reverted, an attribute change kept. You saw the two fixes that keep a finding from reaching the re-read with nothing to check: multivalued changes now sent and reverted, and the attribute in the de-duplication key. And you confirmed that a closure signal moves a finding to Awaiting verification but never closes it. Before shipping, work through the Chapter 04 checklist. Next is Module 6, actuation and the re-read rule: how Gate 5 actuates by lane, and how Gate 6 closes a finding only when a re-read of the target shows the intended state. You'll watch the re-read client decide six waiting findings on two days.`,
  `${M} — Unit 7 "Summary"; Module 6 — Unit 1 "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/ticket-to-machine/05-drift-to-a-typed-task.md (Ticket-to-Machine learning path, Module 5), Units 1 to 7, and the path's verification log (docs/training/ticket-to-machine/_verification).",
  "The sections the module sends you to read: the example guide's Gate 4 (steps 1 and 2, \"Validate (G4 Front door)\"); the developer workbook's Chapter 04 (\"What exists,\" \"What this chapter adds,\" \"Dangers,\" \"Federal requirements and evidence,\" Lab 2); Book 13, Chapter 10.",
  "SailPoint Developer pages Chapter 04 cites: Native Change Account Updated, Identity Attributes Changed and Provisioning Completed event triggers; the Triggers table; the ISC v2025 WorkflowBody and createWorkflow (read November 1, 2026). ServiceNow, Scripted REST APIs (Zurich).",
  "Federal requirements: NIST SP 800-53 CM-3, SI-4 and SA-11 at Moderate (SP 800-53B Moderate baseline, release 5.2.0), as Chapter 04 maps them.",
  "Lab output: examples/servicenow-sailpoint (workflow_payload.py, tests/fixtures/events, test_workflow_payload.py, servicenow_scripts.test.js), run November 2, 2026 in a copy of the kit with Python 3.14.3 and Node.js 24.14.1; long lines wrapped and the Try it output trimmed. Lab 2 not run by the authors. Inferences are labeled.",
]);

finish(OUT);
