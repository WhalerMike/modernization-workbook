// Building Ticket-to-Machine, Chapter 04 — Drift to a Typed Task: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-ttm-04-drift-typed-task/build.js
require("../_build/devwb.js")({
  workbook: "ttm", chapter: 4, dir: __dirname,
  base: "DW_TTM_04_Drift_Typed_Task",
  title: "Drift to a Typed Task",
  map: "Why see the payload · three workflows · resolving a body offline · two fixes · who · two labs · dangers",
  slides: [
    {
      say: `Welcome back to Building Ticket-to-Machine. This is Chapter 4: drift to a typed task, the kit's Build 1. A workflow that posts a finding is easy to build and hard to see. You can't run a SailPoint workflow on a laptop, but you can resolve its request body against a saved event and see the exact payload ServiceNow would get. Doing that found two gaps, and this chapter fixes both. Then two labs, the dangers and the checklist.`,
      detail: `In this chapter: the kit's Build 1, the loop's steps 2 and 3: an ISC event becomes a typed finding in ServiceNow. You can't run an ISC workflow on a laptop, but you can resolve its HTTP Request body against a saved trigger input, the way its .$ keys say, and see the exact payload ServiceNow would get. workflow_payload.py does that, derives the intended state, checks it against Chapter 01's contract, and lists the input fields the workflow doesn't send. Running it found two gaps, both fixed here. Lab 1 runs on a laptop; Lab 2 creates one workflow in a SailPoint sandbox tenant. Goal: by the end of this chapter you can say, for each of the three ISC workflows, what payload a given event produces, what intended state the finding will carry, and which event fields are dropped, and you can test a change to a workflow file before importing it.`,
      cite: [],
      ref: "“In this chapter”; “Goal and audience”",
    },
    {
      part: "Why", title: "Why run the body before it runs for real",
      body: [
        { lead: "A workflow that posts a finding is easy to build and hard to see." },
        { cols: [[{ bullets: [
          "The body's .$ keys (\"account_id.$\": \"$.account.id\") are resolved by SailPoint at run time",
          "So the only way to see the payload was to run the workflow in a tenant",
          "An event field the workflow doesn't send is part of the change never reverted, and the re-read passes",
        ], label: "The problem", color: "red", pt: 14.5 }], [{ bullets: [
          "Resolve the body against a saved trigger input, offline",
          "Derive the intended state exactly as the ServiceNow script does",
          "Check it against Chapter 01's contract, and list the input fields not sent",
        ], label: "The answer", color: "teal", pt: 14.5 }]] },
        { callout: "for each workflow, say what payload an event produces, what intended state it carries and which fields are dropped, and test a change before you import it.", label: "The goal: ", icon: "FaListCheck", color: "amber" },
      ],
      sources: "Sources: Chapter 04, epigraph, “What exists,” “What this chapter adds,” “Dangers.”",
      say: `Why bother? Because the body of a SailPoint workflow is full of keys that SailPoint resolves only at run time, so until now the only way to see the actual payload was to run the workflow in a tenant. And what you can't see, you can't test. If the workflow drops part of an event, that part of the change is never reverted, and the re-read later finds nothing to disagree with. So this chapter resolves the body offline, derives the intended state the way ServiceNow will, and lists anything left behind.`,
      detail: `The epigraph: a workflow that posts a finding is easy to build and hard to see. Run its body against a real-shaped event before it runs against a real one. What none of the existing files showed was the payload itself. The body's .$ keys ("account_id.$": "$.account.id") are resolved by SailPoint at run time, so the only way to see the result was to run the workflow in a tenant. Dangers: an event field the workflow doesn't send; part of the change is never reverted, and the re-read passes; guard: workflow_payload.py lists unmapped fields; the multivalued fix and its tests.`,
      cite: [],
      ref: "“What exists”; “Dangers”",
    },
    {
      part: "What", title: "What exists: three workflows and one script",
      body: [
        { table: { head: ["Workflow (one per trigger)", "Raises", "On"], w: [4.3, 4.8, 3.05], rows: [
          ["Native Change Account Updated", "An unauthorized write", "The account"],
          ["Identity Attributes Changed", "Attribute drift", "The identity"],
          ["Provisioning Action Completed", "A closure signal, never a closure", "Matching findings"],
        ] }, pt: 13.5 },
        { cols: [[{ bullets: [
          "sailpoint/workflows/drift-to-servicenow.json: each is a name, an owner, a trigger and a definition whose one action is an HTTP Request step",
          "Each is created disabled: SailPoint workflows can't be created enabled",
        ], label: "The workflow file", color: "navy", pt: 13.5 }], [{ bullets: [
          "scripted-rest-identity-finding.js validates, sets priority and due date, de-duplicates, derives the intended state (a native change reverted, an attribute change kept), and moves matches to Awaiting verification on a successful provisioning signal",
          "test_contract.py: the file's shape, no secrets, every field read by the script",
        ], label: "The script and its test", color: "teal", pt: 13.5 }]] },
      ],
      sources: "Sources: ISC v2025 WorkflowBody (“Workflows cannot be created in an enabled state”). Chapter 04, “What exists.”",
      say: `Here's what Build 1 already has. Three SailPoint workflows, one per trigger. A native change to an account raises an unauthorized write. A change to an identity's attributes raises attribute drift. And a completed provisioning action raises a closure signal, which never closes anything by itself. Each workflow has one HTTP request step and is created disabled, because SailPoint won't create one enabled. On the ServiceNow side, the scripted REST resource derives the intended state: a native change is reverted, an attribute change is kept.`,
      detail: `The implementation example's Build 1 describes the design; the files are: sailpoint/workflows/drift-to-servicenow.json: three workflows, one per trigger: Native Change Account Updated (an unauthorized write, on the account), Identity Attributes Changed (attribute drift, on the identity) and Provisioning Action Completed (a closure signal, never a closure). Each is a name, an owner, a trigger and a definition whose one action is an HTTP Request step. Each is created disabled, because SailPoint workflows can't be created enabled. servicenow/scripted-rest-identity-finding.js: validates the payload, sets priority and due date, de-duplicates, derives the intended state when the payload has none (a native change reverted, an attribute change kept), and moves matching findings to Awaiting verification on a successful provisioning signal. tests/python/test_contract.py: the workflow file's shape, no secrets in it, and every field its bodies send read by the script.`,
      cite: ["ttm04-wfbody"],
      ref: "“What exists”",
    },
    {
      part: "What", title: "workflow_payload.py: the body, resolved offline",
      body: [
        { steps: [
          { title: "Pick the workflow", text: "for the trigger you name" },
          { title: "Resolve its body", text: "against a saved trigger input: simple paths only ($.a.b); anything else is refused, because this isn't a JSONPath engine" },
          { title: "Derive the intended state", text: "exactly as the ServiceNow script does" },
          { title: "Check the payload", text: "with Chapter 01's finding_contract.validate" },
          { title: "List what's dropped", text: "the input's top-level fields the body doesn't read" },
        ], pt: 14 },
        { lead: "Three fictional trigger inputs in tests/fixtures/events/, in the shapes SailPoint publishes for each trigger's example input." },
      ],
      sources: "Sources: SailPoint, Native Change Account Updated; Identity Attributes Changed; Provisioning Completed (example inputs). Chapter 04, “What this chapter adds.”",
      say: `The new tool does five things. It picks the workflow for the trigger you name. It resolves the body against a saved event, but only simple paths; anything fancier is refused, because it isn't a JSON path engine and won't pretend to be. It derives the intended state the same way ServiceNow will. It checks the result against Chapter 1's contract. And it lists every top-level field of the event that the body never reads. Three fictional events, shaped like SailPoint's published examples, feed it.`,
      detail: `clients/python/workflow_payload.py picks the workflow for a trigger, resolves its body against a saved trigger input (simple paths only, $.a.b; anything else is refused, because this isn't a JSONPath engine), derives the intended state exactly as the script does, checks the payload with finding_contract.validate, and lists the input's top-level fields the body doesn't read. Three fictional trigger inputs in tests/fixtures/events/, in the shapes SailPoint publishes for each trigger's example input: a native change to Alice's Active Directory account (title changed, a group added, a proxy address added), a department change on Erin's identity, and a successful provisioning action for Alice.`,
      cite: ["ttm04-ncd", "ttm04-iac", "ttm04-prov"],
      ref: "“What this chapter adds”",
    },
    {
      part: "What", title: "Fix 1: multivalued changes, reverted",
      body: [
        { table: { head: ["Native Change Account Updated sends", "Before the fix", "After"], w: [4.6, 3.6, 3.95], rows: [
          ["singleValueAttributeChanges", "Sent; reverted to the old value", "Unchanged"],
          ["entitlementChanges", "Sent; added absent, removed present", "Unchanged"],
          ["multiValueAttributeChanges (name, addedValues, removedValues)", "Not sent", "Sent as multi_value_changes: added values must be absent, removed values present"],
        ] }, pt: 13.5 },
        { callout: "a native change only to a multivalued attribute, a proxy address added out of band, say, produced an intended state with nothing in it, and a re-read would have found nothing to disagree with.", label: "Why it mattered: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: SailPoint, Native Change Account Updated (example input). Chapter 04, “What this chapter adds,” fix 1.",
      say: `The first fix. SailPoint's native change event has three kinds of change: single-value attributes, entitlements, and multivalued attributes, each with values added and removed. The workflow sent only the first two. So a native change that touched only a multivalued attribute, a proxy address added out of band, say, produced an intended state with nothing in it, and a re-read would have found nothing to disagree with. Now the workflow sends the multivalued changes, and the script reverts them: added values must be absent, removed ones present.`,
      detail: `Multivalued attributes. SailPoint's Native Change Account Updated input has three kinds of change: singleValueAttributeChanges, entitlementChanges and multiValueAttributeChanges (each with name, addedValues and removedValues). The workflow sent the first two. A native change only to a multivalued attribute, a proxy address added out of band, say, produced an intended state with nothing in it, and a re-read would have found nothing to disagree with. The workflow now sends multi_value_changes, and the script reverts it: added values must be absent, removed values present. Each fix is in the workflow or script, the Python mirror and a test.`,
      cite: ["ttm04-ncd"],
      ref: "“What this chapter adds” — fix 1",
    },
    {
      part: "What", title: "Fix 2: the attribute joins the de-duplication key",
      body: [
        { code: [
          "# Before: source | subject | class",
          "sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift",
          "# After: the attribute is added when the payload names one",
          "sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department",
        ], label: "The key the Scripted REST script de-duplicates on (Erin's identity, from Lab 1 step 3)", pt: 12.5 },
        { cols: [[{ bullets: [
          "Two attributes drifting on one user, department and manager, became one record",
          "The second finding's intended state was lost, so the re-read checked only the first",
        ], label: "Before", color: "red", pt: 14 }], [{ bullets: [
          "Each drifting attribute is its own piece of work with its own intended state",
          "The README and the implementation example say so; a node test pins it",
        ], label: "After", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 04, “What this chapter adds,” fix 2; “Lab 1,” step 3.",
      say: `The second fix is in the de-duplication key. ServiceNow folded findings together on source, subject and class. So when two attributes drifted on one user, department and manager, they became one record. The second finding's intended state was lost, and the re-read checked only the first. Now the key adds the attribute whenever the payload names one. The slide shows the key for a department change on Erin's identity, before and after. Each drifting attribute is now its own piece of work.`,
      detail: `The de-duplication key. The script de-duplicated on source, subject and class. Two attributes drifting on one user, department and manager, became one record, and the second finding's intended state was lost, so the re-read checked only the first. The key now adds the attribute when the payload names one. The README and the implementation example say so. Lab 1, step 3's output shows the key for Erin's identity: sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department. Federal requirements: each drifting attribute is its own piece of work with its own intended state (CM-3; Book 13's evidence record, one result per finding).`,
      cite: [],
      ref: "“What this chapter adds” — fix 2; “Lab 1,” step 3",
    },
    {
      part: "What", title: "The tests: seven new, two node tests, one rule",
      body: [
        { bullets: [
          "test_workflow_payload.py, **7 tests**: each workflow against its event; the native change reverting all three kinds of change; the vacuous intended state the old workflow produced; the attribute change keeping the new value with the attribute in the key; the closure signal; refused paths; an unknown trigger",
          "Two new node:test tests run the script itself: two attributes on one subject are two findings, and multivalued changes become entitlements absent and present",
          "test_contract.py now also requires the script to read multi_value_changes",
        ], label: "What pins the fixes", color: "navy", pt: 14.5 },
      ],
      sources: "Sources: Chapter 04, “The tests.”",
      say: `Both fixes are pinned. Seven Python tests run each workflow against its event, check that a native change reverts all three kinds of change, reproduce the empty intended state the old workflow produced, confirm the attribute change keeps the new value with the attribute in the key, and cover the closure signal, refused paths and an unknown trigger. Two new Node tests run the ServiceNow script itself, and the contract test now requires the script to read the multivalued changes.`,
      detail: `tests/python/test_workflow_payload.py, 7 tests: each workflow against its event, the native change reverting all three kinds of change, the vacuous intended state the old workflow produced, the attribute change keeping the new value with the attribute in the key, the closure signal, refused paths and an unknown trigger. Two new node:test tests run the script itself: two attributes on one subject are two findings, and multivalued changes become entitlements absent and present. test_contract.py now also requires the script to read multi_value_changes.`,
      cite: [],
      ref: "“The tests”",
    },
    {
      part: "What", title: "The verified facts: the three triggers",
      body: [
        { table: { head: ["Item", "Value"], w: [3.0, 9.15], rows: [
          ["Native Change Account Updated", "Fire-and-forget; fires when an aggregation finds an account updated directly on the source, with Native Change Detection on, account updates monitored and a monitored attribute changed; input: account, identity, source, accountChangeTypes, the three change lists, eventType (ACCOUNT_UPDATED)"],
          ["Its trigger ID", "Not in the published trigger table; the page names the event type only"],
          ["Identity Attributes Changed", "idn:identity-attributes-changed, fire-and-forget; input identity.id, identity.name, changes[].attribute, oldValue, newValue"],
          ["Provisioning Action Completed", "idn:post-provisioning, fire-and-forget; input includes trackingNumber, recipient, accountRequests (source, accountId, accountOperation, provisioningResult, provisioningTarget, ticketId, attributeRequests), errors"],
          ["Workflow body; creating one", "name, owner, description, definition, enabled (default false; can't be created enabled), trigger; sp:workflow:manage"],
          ["Scripted REST resource", "REST_Endpoint ACL; web_service_admin to create"],
        ] }, pt: 12 },
      ],
      sources: "Sources: SailPoint, the three trigger pages; Triggers; ISC v2025 WorkflowBody, createWorkflow; ServiceNow, Scripted REST APIs. Chapter 04, “The verified facts.”",
      say: `The trigger facts, read on November first. The native change trigger is fire-and-forget, and fires only when an aggregation finds an account changed directly on the source, with native change detection on, account updates monitored, and a monitored attribute changed. Its trigger ID isn't in SailPoint's published table. The attribute-change and provisioning triggers are listed, both fire-and-forget, with the inputs on the slide. A workflow can't be created enabled, creating one needs the workflow manage scope, and the ServiceNow side needs an endpoint ACL.`,
      detail: `Native Change Account Updated: fire-and-forget; fires when an aggregation finds an account updated directly on the source, with Native Change Detection on, account updates monitored and a monitored attribute changed; input has account, identity, source, accountChangeTypes, singleValueAttributeChanges, multiValueAttributeChanges, entitlementChanges, eventType (ACCOUNT_UPDATED). Its trigger ID: not in the published trigger table; the page names the event type only. Identity Attributes Changed: idn:identity-attributes-changed, fire-and-forget; input identity.id, identity.name, changes[].attribute, oldValue, newValue. Provisioning Action Completed: idn:post-provisioning, fire-and-forget; input includes trackingNumber, recipient, accountRequests (source, accountId, accountOperation, provisioningResult, provisioningTarget, ticketId, attributeRequests), errors. Workflow body: name, owner, description, definition, enabled (default false; can't be created enabled), trigger. Creating a workflow: sp:workflow:manage. Scripted REST resource: REST_Endpoint ACL; web_service_admin to create.`,
      cite: ["ttm04-ncd", "ttm04-triggers", "ttm04-iac", "ttm04-prov", "ttm04-wfbody", "ttm04-workflows", "ttm04-srapi"],
      ref: "“The verified facts”",
    },
    {
      part: "What", title: "What couldn't be verified about the workflows",
      body: [
        { bullets: [
          "**The Native Change Account Updated trigger ID.** The kit uses idn:native-change-account-updated; SailPoint's trigger table doesn't list it (verify list, item 1)",
          "**The HTTP Request step's JSON attribute names, and whether it resolves .$ keys in its body.** SailPoint documents the step's fields in the editor, not its JSON (items 2 and 3)",
          "**The shape of each item in entitlementChanges[].added.** The script and the fixture read value; the trigger page lists fields only to added and removed (research gaps, row 31)",
          "**provisioningResult values beyond SUCCESS** (item 5)",
        ], label: "Open points", color: "red", pt: 14 },
        { callout: "whether the input sits at $ or $.trigger is also open. Lab 2 settles these for your tenant.", label: "Also: ", icon: "FaLightbulb", color: "amber" },
      ],
      sources: "Sources: SailPoint, Native Change Account Updated; Triggers. Chapter 04, “What couldn't be verified”; the “Illustrative code” callout.",
      say: `Several things are open, and they matter because they're exactly what the offline tool assumes. The native change trigger's ID isn't in SailPoint's table. The HTTP request step's JSON names aren't published, and nor is whether it resolves those run-time keys inside its body. The shape of each added entitlement isn't documented below the list level, and provisioning results beyond success aren't listed. Nor is whether the event sits at the root or under a trigger key. Lab 2 settles these for your tenant.`,
      detail: `What couldn't be verified. The Native Change Account Updated trigger ID: the kit uses idn:native-change-account-updated; SailPoint's trigger table doesn't list it. Verify list, item 1. The HTTP Request step's JSON attribute names, and whether it resolves .$ keys in its body: SailPoint documents the step's fields in the editor, not its JSON. Verify list, items 2 and 3. The shape of each item in entitlementChanges[].added: the script and the fixture read value; the trigger page lists the fields to the level of added and removed (research gaps, row 31). provisioningResult values beyond SUCCESS: verify list, item 5. From the "Illustrative code" callout: the commands resolve the workflow file against fictional inputs; they show what the body says to send, not what SailPoint's HTTP Request step sends: whether the step resolves .$ keys inside its JSON body, and whether the input sits at $ or $.trigger, are on the kit README's verify list. Lab 2 settles both for your tenant.`,
      cite: ["ttm04-ncd", "ttm04-triggers"],
      ref: "“What couldn't be verified”; “Illustrative code”",
    },
    {
      part: "What", title: "What Build 1 proves, and for whom",
      body: [
        { table: { head: ["What the output proves", "Requirement it supports", "Who keeps it"], w: [4.6, 4.3, 3.25], rows: [
          ["A write outside the governed process is detected and raised as an owned, clocked finding whose intended state is the revert", "NIST SP 800-53 CM-3 and SI-4 at Moderate; SP 800-37's call to monitor for unauthorized changes, as Book 13, Chapter 10 cites", "The ServiceNow finding, with u_origin and u_raw_event"],
          ["Each drifting attribute is its own piece of work with its own intended state", "CM-3; Book 13's evidence record, one result per finding", "The finding records; the tests"],
          ["A workflow change is tested before it runs", "CM-3; SA-11 (developer testing) at Moderate", "The pull request and its test run"],
        ] }, pt: 12.5 },
        { lead: "A native change as Book 03's unauthorized write is the program's inference; a person or a rule raises an in-use claim to P1." },
      ],
      sources: "Sources: NIST SP 800-53B Moderate baseline (release 5.2.0). Chapter 04, “Federal requirements and evidence”; Book 13, Chapter 10 and Appendix B.",
      say: `What Build 1 proves. A write made outside the governed process is detected and raised as an owned, clocked finding whose intended state is the revert, which supports change control and system monitoring at Moderate. Each drifting attribute is its own piece of work. And a workflow change is tested before it runs, which is developer testing, SA-11. Two labels: treating a native change as an unauthorized write is the program's inference, and since the workflow can't know whether a claim is in use, a person or a rule raises it to P1.`,
      detail: `A write made outside the governed process is detected and raised as an owned, clocked finding whose intended state is the revert: NIST SP 800-53 CM-3 and SI-4 (system monitoring) at Moderate; SP 800-37's call to monitor for unauthorized changes, as Book 13, Chapter 10 cites; kept in the ServiceNow finding, with u_origin and u_raw_event. Each drifting attribute is its own piece of work with its own intended state: CM-3; Book 13's evidence record, one result per finding; kept in the finding records, test_workflow_payload.py and the node tests. A workflow change is tested before it runs: CM-3 (change control), SA-11 (developer testing) at Moderate; kept in the pull request and its test run. Treating a native change as Book 03's unauthorized write is the program's (inference), as the example guide says. Provenance drift on a claim in active use is P1 in Book 13, Appendix B; the workflow can't know whether a claim is in use, so a person or a rule raises it to P1.`,
      cite: ["ttm04-moderate"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "Who", title: "Who builds the workflows and the resource",
      body: [
        { cards: [
          { title: "Identity engineers", text: "Who build ISC workflows. Read JSON. They run workflow_payload.py on every change to the file before importing it", color: "navy" },
          { title: "ServiceNow developers", text: "Who own the Scripted REST resource. A little JavaScript. They deploy the attribute-in-the-key fix and the multivalued revert", color: "teal" },
          { title: "The workflow client", text: "From Chapter 03, holding sp:workflow:manage, used to create the workflows and then removed", color: "amber" },
        ], pt: 14 },
        { callout: "the ServiceNow endpoint must be reachable from SailPoint's cloud, because ISC workflows call out from it (inference; verify list, item 18).", label: "Reachability: ", icon: "FaCloud", color: "navy" },
      ],
      sources: "Sources: ISC v2025 createWorkflow. Chapter 04, “Goal and audience”; “Lab 2” (reachability, inference).",
      say: `Who does this work? Identity engineers who build the SailPoint workflows; they read JSON and should run the payload tool on every change before importing. ServiceNow developers who own the scripted REST resource, and deploy both fixes. And the workflow client from Chapter 3, with the workflow manage scope, used once and removed. One practical point, labeled an inference: the ServiceNow endpoint has to be reachable from SailPoint's cloud, because workflows call out from there.`,
      detail: `Audience: identity engineers who build ISC workflows and the developers who own the Scripted REST resource. You should read JSON and a little JavaScript. You don't need a tenant until Lab 2. Lab 2 uses the workflow client from Chapter 03, with sp:workflow:manage. The ServiceNow endpoint has to be reachable from SailPoint's cloud, because ISC workflows call out from it (inference; verify list, item 18). Checklist: workflows are created disabled, tested, then enabled; the workflow client is removed afterwards.`,
      cite: ["ttm04-workflows"],
      ref: "“Goal and audience”; “Lab 2”",
    },
    {
      part: "How", title: "Lab 1: the native change, resolved",
      body: [
        { terminal: "04-1" },
        { terminal: "04-2" },
        { lead: "Title back to Analyst; the group and the proxy address must be gone. eventType is always ACCOUNT_UPDATED here." },
      ],
      sources: "Sources: examples/servicenow-sailpoint (fictional events). Chapter 04, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1. First, eleven tests pass. Then resolve the native-change workflow against Alice's fictional event. It's an unauthorized write on her account, accepted at P2. The intended state reverts all three changes: the title goes back to Analyst, and both the new group and the new proxy address must be gone. The only field not sent is the event type, which is always account-updated for this trigger, so nothing is lost. Before the fix, the proxy address was missing here, and the multivalued changes were in that last line.`,
      detail: `Work in examples/servicenow-sailpoint, with Python 3.10 or later and Node.js 18 or later. Step 1: python -m pytest tests/python/test_workflow_payload.py tests/python/test_contract.py -q gives 11 passed. Step 2: python clients/python/workflow_payload.py --trigger idn:native-change-account-updated --event tests/fixtures/events/native-change-account-updated.json prints Workflow: Drift to ServiceNow - native change (provenance); kind finding, drift_class unauthorized_write, system isc_account; intended_state {"attributes": {"title": "Analyst"}, "entitlements_absent": [{"attribute": "proxyAddresses", "value": "smtp:ap-approver@contoso.example"}, {"attribute": "memberOf", "value": "CN=Payables Approvers,OU=Groups,DC=contoso,DC=example"}], "entitlements_present": []}; contract: accepted: P2, priority 2, key sailpoint-isc|2c91800000000000000000000a1001ad|unauthorized_write; input fields not sent: eventType. The title goes back to Analyst, the group and the proxy address must be gone. eventType is always ACCOUNT_UPDATED for this trigger, so dropping it loses nothing. Before the fix, the proxy address wasn't in the intended state and multiValueAttributeChanges was in the last line. Re-run on November 1, 2026 for this tour: same output.`,
      cite: ["ttm04-ncd"],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the mover, the signal, the script tests",
      body: [
        { terminal: "04-3" },
        { cols: [[{ terminal: "04-4" }], [{ terminal: "04-5", lines: "1-3,6-7"}]] },
        { lead: "Erin's department change: kept as Finance, P3, the attribute in the key. A closure signal never closes a finding." },
      ],
      sources: "Sources: examples/servicenow-sailpoint (fictional events). Chapter 04, “Lab 1: fixtures, no tenant,” steps 3–5.",
      say: `Next, the mover. Erin's identity changed department from HR to Finance. The finding keeps the new value as the intended state, at P3, and the key now ends in the attribute, department. Nothing in the event is dropped. Then the closure signal from a successful provisioning action: it's accepted, and four fields aren't sent. A signal only moves matching findings to awaiting verification; it never closes one. Finally, the two new Node tests of the ServiceNow script both pass.`,
      detail: `Step 3, see the mover's finding: python clients/python/workflow_payload.py --trigger idn:identity-attributes-changed --event tests/fixtures/events/identity-attributes-changed.json gives intended_state {"attributes": {"department": "Finance"}}, contract: accepted: P3, priority 3, key sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department, and input fields not sent: none. The key ends in the attribute. Step 4, see the closure signal: python clients/python/workflow_payload.py --trigger idn:post-provisioning --event tests/fixtures/events/provisioning-completed.json gives kind closure_signal, contract: accepted, and input fields not sent: action, requester, sources, warnings. A signal moves matching findings to Awaiting verification; it never closes one. Step 5, run the two new script tests: node --test --test-name-pattern="attribute is in the key|multivalued" tests/servicenow/servicenow_scripts.test.js gives tests 2, pass 2, fail 0.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–5",
    },
    {
      part: "How", title: "Lab 2: one workflow, one sandbox, one capture",
      body: [
        { steps: [
          { title: "Turn on Native Change Detection", text: "on one test source, monitoring account updates and at least one attribute" },
          { title: "Build one HTTP Request step by hand", text: "in the editor, export it, and compare its attribute names with the kit's file; correct the file if they differ (verify list, item 2)" },
          { title: "Point it at a capture endpoint first", text: "or the developer instance with a test ACL; enable, change the attribute on the source, save the trigger input from the execution history, and run it through workflow_payload.py: the payloads must match" },
          { title: "Repeat the change", text: "the second event de-duplicates (200, deduplicated: true) and adds one to the record's occurrences" },
          { title: "Back it out", text: "Disable and delete the workflow, turn detection off if you turned it on, restore the attribute, delete the findings, remove the workflow client" },
        ], pt: 13 },
        { callout: "a SailPoint sandbox tenant and the Chapter 01–02 developer instance, never production. Not run by the authors.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: SailPoint, Native Change Account Updated; ISC v2025 createWorkflow. Chapter 04, “Lab 2: a SailPoint sandbox and a ServiceNow developer instance.”",
      say: `Lab 2 needs a SailPoint sandbox and your developer instance, never production, and the authors haven't run it. Turn on native change detection on one test source. Build one HTTP request step by hand in the editor, export it, and compare its names with the kit's file. Point it at a capture endpoint first, change a monitored attribute on the source, and run the saved trigger input through the tool: the two payloads must match. Repeat the change and it de-duplicates. Then put everything back.`,
      detail: `Not run by the authors. Use a SailPoint sandbox tenant and the developer instance from Chapters 01 and 02, never production. 1 Turn on Native Change Detection on one test source, monitoring account updates and at least one attribute. The trigger fires only when that is on, account updates are monitored and a monitored attribute changed. 2 Build one HTTP Request step by hand in the workflow editor, export the workflow, and compare its attribute names with the kit's file; correct the file if they differ (verify list, item 2). Use the workflow client from Chapter 03, with sp:workflow:manage. 3 Point the step at a capture endpoint first, or at the developer instance's Scripted REST resource with a test ACL, enable the workflow, and change the monitored attribute on a test account directly on the source. Save the trigger input from the workflow's execution history and run it through workflow_payload.py; the payload ServiceNow received must match the tool's output. If it doesn't, the .$ keys or the input's root differ (verify list, item 3). 4 Repeat the change: the second event should de-duplicate (200, deduplicated: true) and add one to the record's occurrences. 5 Back it out: disable and delete the workflow, turn Native Change Detection off on the test source if you turned it on for the lab, put the test account's attribute back, delete the findings from the developer instance, and remove the workflow client.`,
      cite: ["ttm04-ncd", "ttm04-workflows"],
      ref: "“Lab 2: a SailPoint sandbox and a ServiceNow developer instance”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.5, 4.3, 4.35], rows: [
          ["An event field the workflow doesn't send", "Part of the change is never reverted, and the re-read passes", "workflow_payload.py lists unmapped fields; the multivalued fix and its tests"],
          ["Two drifts on one subject folded into one", "The second intended state is lost and never re-read", "The attribute in the de-duplication key; a node test"],
          ["A workflow imported enabled, or edited only in the editor", "It runs untested, or the repository stops describing what runs", "Can't be created enabled; export and diff after any editor change"],
          ["Credentials in the workflow file", "They reach the repository", "REPLACE-IN-THE-UI placeholders; test_contract.py fails on a secret"],
          ["A closure signal treated as closure", "A provisioning success closes the finding without a re-read", "The script only moves findings to Awaiting verification; Chapter 05's rule blocks other closes"],
          ["An unreachable or open endpoint", "Findings are lost, or anyone can post them", "Reachability tested in Lab 2; authentication and a REST_Endpoint ACL"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 04, “Dangers.”",
      say: `The dangers. An event field the workflow doesn't send leaves part of a change unreverted, and the re-read passes anyway; the tool lists dropped fields. Two drifts folded into one record lose an intended state; the key fixes that. A workflow edited only in the editor stops matching the repository, so export and diff. Credentials in the file are caught by a test. A closure signal treated as closure would skip the re-read, so it only moves findings to waiting. And an open endpoint is locked with authentication and an ACL.`,
      detail: `An event field the workflow doesn't send: part of the change is never reverted, and the re-read passes; guard: workflow_payload.py lists unmapped fields; the multivalued fix and its tests. Two drifts on one subject folded into one record: the second intended state is lost and never re-read; guard: the attribute in the de-duplication key; a node test. A workflow imported enabled, or edited in the editor and not in the file: it runs untested, or the repository stops describing what runs; guard: workflows can't be created enabled; export and diff after any editor change. Credentials in the workflow file: they reach the repository; guard: REPLACE-IN-THE-UI placeholders; test_contract.py fails on a secret. A closure signal treated as closure: a provisioning success closes the finding without a re-read; guard: the script only moves findings to Awaiting verification; the business rule (Chapter 05) blocks any other close. An unreachable or unauthenticated endpoint: findings are lost, or anyone can post them; guard: reachability tested in Lab 2; authentication and a REST_Endpoint ACL required.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the Build 1 checklist",
      body: [
        { bullets: [
          "Each workflow resolves against a saved input from your tenant, and workflow_payload.py lists no field you meant to send",
          "The native-change workflow sends single-value, multivalued and entitlement changes",
          "The deployed Scripted REST script includes the attribute in the de-duplication key",
          "The trigger ID, the HTTP step's attribute names and the input's root were confirmed in a sandbox, and the file matches",
          "Workflows are created disabled, tested, then enabled; the workflow client is removed afterwards",
          "test_workflow_payload.py, test_contract.py and the node tests pass",
        ], label: "Checklist", color: "navy", pt: 14.5 },
        { callout: "Chapter 05 closes a finding only when a re-read shows the intended state, the kit's Build 2.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 04, “Checklist,” “Continue the book.”",
      say: `Done looks like this. Every workflow resolves against a saved input from your own tenant, with nothing you meant to send left behind. The native-change workflow sends all three kinds of change. The deployed script keys on the attribute. The trigger ID, the step's attribute names and the input's root are confirmed in a sandbox. Workflows go in disabled, get tested, then enabled, and the workflow client is removed. And the tests pass. Next, Chapter 5: the re-read rule, and why a success response isn't closure. Thanks for watching.`,
      detail: `Checklist: each workflow in the file resolves against a saved input from your tenant, and workflow_payload.py lists no field you meant to send. The native-change workflow sends single-value, multivalued and entitlement changes. The deployed Scripted REST script includes the attribute in the de-duplication key. The trigger ID, the HTTP step's attribute names and the input's root were confirmed in a sandbox and the file matches. Workflows are created disabled, tested, then enabled; the workflow client is removed afterwards. test_workflow_payload.py, test_contract.py and the node tests pass. Next: Chapter 05 — The Re-read Rule.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
