// Ticket-to-Machine learning path, Module 2: The Boundary and Least Privilege — the module's narrated deck.
// Teaches docs/training/ticket-to-machine/02-boundary-and-least-privilege.md, Learn-style: objectives, the concepts,
// two "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a copy of
// examples/servicenow-sailpoint), Lab 2, what the boundary looks like on the Marketplace, the federal requirement and
// evidence, a two-question check, and the summary. Every fact comes from the module page, the pages it sends the learner
// to (as its verification log says), or the kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ttm-module-2/build.js \
//                      presentations/training-ttm-module-2/Training_TTM_Module_2.pptx
const TITLE = "Module 2: The Boundary and Least Privilege";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine learning path, Module 2: The Boundary and Least Privilege",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Ticket-to-Machine learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "TICKET-TO-MACHINE LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_TTM_Module_2.pptx";
const M = "Training, Ticket-to-Machine, Module 2";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SA = "Where agencies are";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: The boundary and least privilege", "Ticket-to-Machine learning path · ServiceNow and SailPoint Identity Security Cloud · Guide Gate 1",
    ["The authorization boundary  ·  ServiceNow roles  ·  ISC scopes and Graph permissions", "The call list  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of the Ticket-to-Machine learning path: the boundary and least privilege. Before any call is made, you need to know which actions run from a vendor's cloud, and which non-person identities make them. Then each identity has to hold exactly what its calls need, and no more. This module follows the guide's Gate 1, and the developer workbook's Chapters 02 and 03. You'll confirm the boundary on paper, learn the ServiceNow roles, SailPoint scopes and Graph permissions each kit task needs, and then make privilege something a test can check, by catching three kinds of over-wide grant on a laptop.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why \"to make it work\" is the wrong grant");
  tag(s, "Why");
  const b = table(s, "Dangers", 1.45, [4.2, 4.6, 3.35], ["The shortcut", "What happens", "The guard"], [
    ["itil or admin granted \"to make it work\"", "Broad access to every ITSM table", "--granted lists the extra role, exits 1"],
    ["A manage scope on a read client", "A stolen token can change accounts", "--granted flags idn:accounts:manage"],
    ["One integration user for everything", "The account that reads evidence can also close findings", "Roles split by task"],
    ["A client gains a call nobody listed", "Someone grants a role in production to make the error go away", "The test fails on any undeclared call"],
  ], { fontSize: 12.5, limit: 4.8 });
  callout(s, "Point", b + 0.3, 0.95, "FaLock", HEX.red, "This module: ",
    "confirm the boundary on paper, then make privilege something a test can check.");
  sources(s, "Sources: Module 2, Unit 1 \"Introduction\"; workbook Chapter 02, \"Dangers\"; Chapter 03, \"Dangers.\"");
  notes(s,
`Why does this matter? Because the easy fix is the wrong one. An administrator who grants the itil role to make it work has given the integration every ITSM table. An API client with a manage scope can change accounts if its token is stolen. One integration user for everything means the account that reads evidence can also close findings. And when a client gains a call nobody listed, someone grants a role in production to make the error go away. Each of those has a guard in the kit, and you'll use every one of them in the lab. The idea of the module is simple: confirm the boundary on paper first, then make privilege something a test can check, instead of something someone remembers.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 02 — "Dangers"; Chapter 03 — "Dangers."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Explain what Gate 1 records about each product's authorization and each vendor-cloud action",
    "Describe the ServiceNow roles the kit uses, and why they're split by task",
    "Describe the ISC scopes and Graph permissions each task needs, and why the workflow scope gets its own client",
    "Verify a grant against the call list, and catch a grant that's too wide",
  ], [
    "Module 1",
    "For the Graph rows: Microsoft Automation, Module 1, permissions",
    "Lab 1: the kit's fixtures; no tenant",
    "Lab 2: a ServiceNow developer instance and a SailPoint sandbox",
  ], 60);
  sources(s, "Sources: Module 2, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 6 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about an hour with the lab. You'll explain what Gate 1 records about each product's authorization and each action that runs from a vendor's cloud. You'll describe the ServiceNow roles the kit uses and why they're split by task. You'll describe the SailPoint scopes and Graph permissions each task needs, and why the workflow scope gets a client of its own. And you'll verify a grant against the kit's call list, and catch a grant that's too wide. You need Module 1 first. For the Graph rows, the Microsoft Automation path's first module covers permissions. Lab 1 runs on fixtures; Lab 2 needs a developer instance and a sandbox tenant.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Gate 1
{
  const s = content(SC, "Gate 1 records and decides; it builds nothing");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [0.6, 4.2, 7.35], ["", "Step", "What you record"], [
    ["1", "Confirm FedRAMP status", "Each product's Marketplace listing, impact level, path and the date read"],
    ["2", "Confirm what's inside", "Ask SailPoint in writing whether Workflows, Native Change Detection and the HTTP Request step are in the authorized environment"],
    ["3", "Confirm the product", "The product purchased is the one authorized, whatever it's marketed as"],
    ["4", "Record vendor-cloud actions", "Each action that runs from a vendor's cloud, as a data flow"],
    ["5", "Check the government Store", "SailPoint's ServiceNow apps and the Entra spoke are installable there"],
    ["6", "Register the identities", "Permissions, owners, credential type: certificate or federated, never a long-lived secret"],
  ], { fontSize: 12, limit: 6.55 });
  sources(s, "Sources: Module 2, Unit 2; the guide's \"Step 1: Confirm the authorization boundary.\"");
  notes(s,
`Gate 1 records and decides; it builds nothing. It has six steps. One: confirm each product's FedRAMP status on the Marketplace on the day you decide, and record the listing, its impact level, its path and the date. Two: confirm what's inside the authorization. SailPoint doesn't publish a list of features missing from its authorized environment, so ask in writing whether Workflows, Native Change Detection and the workflow HTTP Request step, which Gates 3 to 6 rely on, are there. Three: confirm the product you bought is the one authorized. Four: record which actions run from a vendor's cloud. Five: confirm the apps are in ServiceNow's government Store. And six: register the integration identities, with a certificate or federated credential, never a long-lived secret.`,
  `${M} — Unit 2 "The authorization boundary"; the guide — "Step 1: Confirm the authorization boundary," Steps.`);
}

// ================================================================== 5 Identities and data flows
{
  const s = content(SC, "Four integration identities, and the vendor-cloud flows");
  tag(s, "What");
  const l = panel(s, "Ids", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "THE FOUR INTEGRATION IDENTITIES", "Each with two owners and a sponsor", [
    "SailPoint's Entra connector app registration in the agency's tenant",
    "The ServiceNow Entra spoke's app registration",
    "The ServiceNow integration user the workflow posts as, and the verifier account the re-read client closes records as",
    "The ISC API client the kit's clients read with",
  ], 13);
  const r = panel(s, "Flows", 7.45, 1.45, 5.3, null, HEX.amber, HEX.amberTint, "RUNS FROM A VENDOR'S CLOUD", null, [
    "SailPoint's cloud connectors call Microsoft Graph from SailPoint's cloud",
    "Only the Active Directory path runs through the on-premises virtual appliance",
    "Workflows call out to the ServiceNow endpoint (inference)",
  ], 13);
  callout(s, "Book15", Math.max(l, r) + 0.3, 0.95, "FaRoute", HEX.navy, "Why record them: ",
    "Book 15 prefers execution through a connector inside the boundary, so each vendor-cloud action is a recorded data flow.");
  sources(s, "Sources: Module 2, Unit 2; the guide's \"Prerequisites\" (integration identities, design guidance) and Gate 1, step 4.");
  notes(s,
`Four non-person identities carry the integration. SailPoint's Entra connector app registration in the agency's tenant. The ServiceNow Entra spoke's app registration. The ServiceNow integration user that SailPoint's workflow posts as, together with the verifier account the re-read client closes records as. And the SailPoint API client the kit's clients read with. As design guidance, each has two named owners and a federal sponsor in the system inventory. Now the flows. SailPoint's cloud connectors call Microsoft Graph from SailPoint's cloud; only the Active Directory path runs through its on-premises virtual appliance. And, by inference, its workflows call out from SailPoint's cloud to ServiceNow. The Federal Modernization Workbook's design prefers execution through a connector inside the boundary, so each vendor-cloud action becomes a recorded data flow.`,
  `${M} — Unit 2 "The authorization boundary"; the guide — "Prerequisites," integration identities; "Step 1," step 4.`);
}

// ================================================================== 6 calls.json and kit_calls.py
{
  const s = content(SC, "The call list: privilege a test can check");
  tag(s, "How");
  const l = panel(s, "Calls", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "config/calls.json", "One row per HTTP call", [
    "The system, method and path",
    "The tasks that make it",
    "The least privilege it needs",
    "The vendor page that says so",
  ], 13.5);
  const r = panel(s, "Tool", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "clients/python/kit_calls.py", "Reads the file; calls no network", [
    "--task NAME: the calls and permissions a task needs, per system",
    "--system S --granted \"a,b\": compares a real grant; exits 1 on anything missing or extra",
    "--required-only: leaves out optional calls",
  ], 13.5);
  callout(s, "Test", Math.max(l, r) + 0.3, 1.05, "FaListCheck", HEX.navy, "test_kit_calls.py: ",
    "runs the clients against a fake HTTP session and fails on any call the file doesn't declare. It also asserts no task asks ISC or Graph for a write scope.");
  sources(s, "Sources: Module 2, Unit 3; workbook Chapter 02, \"What this chapter adds\"; Chapter 03, \"What this chapter adds,\" \"The tests.\"");
  notes(s,
`Here's how the kit makes privilege checkable. A file called calls dot JSON lists every HTTP call a Python client makes: the system, the method and path, the tasks that make it, the least privilege it needs, and the vendor page that says so. A test runs the clients against a fake HTTP session and fails on any call the file doesn't declare. So a new call fails the test until someone adds its row, its privilege and its source, and a reviewer sees that row in the pull request. The test also asserts that no task asks SailPoint or Graph for a write scope, except workflow creation. Then the kit calls tool reads the file. Give it a task and it lists what that task needs. Give it a grant and it compares, and exits one on anything missing or extra.`,
  `${M} — Unit 3 "ServiceNow roles, split by task"; workbook Chapter 02 — "What this chapter adds"; Chapter 03 — "What this chapter adds," "The tests."`);
}

// ================================================================== 7 ServiceNow roles
{
  const s = content(SC, "ServiceNow roles, split by task");
  tag(s, "What");
  const b = table(s, "Roles", 1.45, [3.0, 3.1, 6.05], ["Custom role", "Task", "What it can do"], [
    ["x_example_idkit.finding_writer", "drift-push", "Create findings through the REST_Endpoint ACL, and nothing else"],
    ["x_example_idkit.verifier", "reread", "Read and write findings, attach evidence: close them. The business rule accepts a close only from this account"],
    ["x_example_idkit.evidence_reader", "evidence", "Read only: it can't change a record it's about to hash"],
  ], { fontSize: 12.5, limit: 4.0 });
  line(s, "Each", "Each role has its own integration user and its own OAuth client-credentials client (POST /oauth_token.do).", b + 0.2, 0.45, 13.5);
  panel(s, "Client", 0.6, b + 0.8, 12.15, null, HEX.navy, HEX.navyTint, "THE SERVICENOW CLIENT (kit_common.py)", null, [
    "Token order: one from a vault, else client credentials, else basic authentication, for a developer instance only",
    "Pages the Table API 100 at a time; retries 429 and 503 after Retry-After, up to five times; refuses a secret in its config file",
  ], 12.5);
  sources(s, "Sources: Module 2, Unit 3; workbook Chapter 02, \"What exists,\" \"What this chapter adds\" (custom roles, design guidance).");
  notes(s,
`On ServiceNow, the roles are custom roles in the scoped application, split by task. That's design guidance: ServiceNow says the calling user needs roles that allow access to the table, and no single role allows adding attachments by default. The finding writer can create findings, and nothing else. The verifier can read and write findings and attach evidence, so it can close them, which is why the business rule accepts a close only from that account. And the evidence reader reads, but can't change a record it's about to hash. Each gets its own integration user and client-credentials client. The client itself takes a token from a vault first, then client credentials, and basic authentication only on a developer instance. It pages, retries, and refuses a secret in its config file.`,
  `${M} — Unit 3 "ServiceNow roles, split by task"; workbook Chapter 02 — "What exists," "What this chapter adds," "Dangers."`);
}

// ================================================================== 8 ISC and Graph rows
{
  const s = content(SC, "ISC scopes and Graph permissions each task needs");
  tag(s, "What");
  const b = table(s, "Rows", 1.45, [4.6, 2.3, 5.25], ["Call", "Tasks", "Least privilege"], [
    ["POST /v3/search (ISC)", "drift, reread", "sp:search:read"],
    ["GET /v3/accounts, GET /v3/accounts/{id}", "drift; reread", "idn:accounts:read (manage would also work, so it's flagged as extra)"],
    ["POST /v2025/workflows", "workflows", "sp:workflow:manage: no client in the kit makes this call"],
    ["GET /v1.0/users, /users/{id} (Graph)", "drift; reread", "User.Read.All (application)"],
    ["GET /v1.0/auditLogs/directoryAudits", "drift, optional", "AuditLog.Read.All, only if the run reads the audit"],
  ], { fontSize: 12.5, limit: 5.1 });
  callout(s, "Wf", b + 0.3, 1.05, "FaKey", HEX.amber, "A separate client, used once: ",
    "the workflow scope goes on its own client, used by hand or by a reviewed pipeline, then removed (design guidance).");
  sources(s, "Sources: Module 2, Unit 4; workbook Chapter 03, \"What this chapter adds\"; implementation example, \"Permissions.\"");
  notes(s,
`Now SailPoint and Graph. The drift and re-read clients need read scopes only: search read, and accounts read. The Accounts endpoints would accept the manage scope too, so the call list names the read scope and the comparison flags manage as extra. Creating SailPoint's workflows needs the workflow manage scope, and no client in the kit makes that call. So, as design guidance, that scope belongs to a separate client, used once, by hand or by a reviewed pipeline, and then removed. On Graph, the app registration needs User dot Read dot All, as an application permission, and AuditLog dot Read dot All only if the run reads the audit. Nothing in Pass 1 needs write access to Entra ID, Active Directory or SailPoint.`,
  `${M} — Unit 4 "ISC scopes and Graph permissions"; workbook Chapter 03 — "What this chapter adds"; implementation example — "Permissions."`);
}

// ================================================================== 9 ISC client limits
{
  const s = content(SC, "What a client-credentials token can't do in ISC");
  tag(s, "What");
  const l = panel(s, "Token", 0.6, 1.45, 6.3, null, HEX.red, HEX.redTint, "CLIENT-CREDENTIALS LIMITS", "No user context", [
    "SailPoint warns most admin APIs often return 403 with such a token, without listing which",
    "If Search or Accounts returns 403: a personal access token for a dedicated user at the lowest user level that works",
    "Never an administrator's: the kit would run as ORG_ADMIN",
  ], 13);
  const r = panel(s, "Paging", 7.15, 1.45, 5.6, null, HEX.navy, HEX.navyTint, "THE ISC AND GRAPH CLIENT", null, [
    "Search pages with searchAfter, sorted on id, past 10,000 results",
    "Accounts pages 250 at a time, the API's maximum",
    "Graph: a certificate first, a secret only as a fallback",
    "GRAPH_CLOUD: Global for worldwide and GCC",
  ], 13);
  callout(s, "Verify", Math.max(l, r) + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "On the verify list: ",
    "whether a client-credentials token gets data from Search and Accounts. Lab 2 records which user level worked.");
  sources(s, "Sources: Module 2, Unit 4; workbook Chapter 03, \"What exists,\" Lab 2, \"What couldn't be verified,\" \"Dangers.\"");
  notes(s,
`One thing a client-credentials token can't do in SailPoint: act as a user. It has no user context, and SailPoint warns that calling most admin APIs with one often returns four oh three. It doesn't say which. So if Search or Accounts returns four oh three in your sandbox, use a personal access token for a dedicated user at the lowest user level that works, and record which one. Never an administrator's, or the kit runs as org admin. Whether a client-credentials token gets data is on the verify list. The client pages Search past ten thousand results with search after, sorted on I D, and reads accounts two hundred fifty at a time. For Graph, it signs in with a certificate first, and the cloud setting is Global for worldwide and GCC.`,
  `${M} — Unit 4 "ISC scopes and Graph permissions"; workbook Chapter 03 — "What exists," "Lab 2," "What couldn't be verified," "Dangers."`);
}
endModule(SC);

// ================================================================== 10 Try it: ServiceNow
{
  const s = content(SL, "Try it: catch two over-wide ServiceNow grants");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, Part A, in examples/servicenow-sailpoint (fixtures, no tenant)",
    "$ python clients/python/kit_calls.py --task reread --system servicenow --granted \"x_example_idkit.verifier,itil\"",
    "Task reread: reread_verification.py: list waiting findings, re-read each subject, close or reopen with evidence",
    "servicenow",
    "  POST   /oauth_token.do                              an inbound OAuth client (client credentials) with its own ...",
    "  GET    /api/now/table/u_identity_finding            x_example_idkit.verifier (read on u_identity_finding)",
    "  PATCH  /api/now/table/u_identity_finding/{sys_id}   x_example_idkit.verifier (write on u_identity_finding)",
    "  POST   /api/now/attachment/file                     x_example_idkit.verifier (create on sys_attachment)",
    "  needs: x_example_idkit.verifier",
    "missing: none",
    "extra:   itil",
    "Least privilege does not hold: fix the grant.",
    "$ python clients/python/kit_calls.py --task evidence --system servicenow --granted \"x_example_idkit.verifier\"",
    "  ...",
    "missing: x_example_idkit.evidence_reader",
    "extra:   x_example_idkit.verifier",
    "Least privilege does not hold: fix the grant.",
  ], { label: "TRY IT  ·  LAB 1 STEPS 3 AND 4, RUN NOVEMBER 2, 2026 (TRIMMED: BLANK LINES, PADDING, THE SECOND LISTING)", pt: 10.5 });
  line(s, "Both", "Both exit 1. Steps 1 and 5: test_kit_calls.py, 9 passed; the original ServiceNow client tests, 7 passed, 12 deselected.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 2, Unit 5 \"Exercise: Lab 1,\" Part A, steps 1 to 5; workbook Chapter 02, Lab 1.");
  notes(s,
`Try it. Part A of Lab 1 runs in the kit's folder against fixtures. Step one proves every call is declared: nine tests pass. Step two lists what the re-read client needs on ServiceNow: a client-credentials token, then read and write on the finding table and create on attachments, all from one role, the verifier. Step three is the classic mistake: an administrator gave the verifier itil as well. The tool lists the calls, then reports nothing missing, itil extra, and least privilege does not hold. It exits one. Step four catches the evidence export reusing the verifier's role: the evidence reader is missing and the verifier is extra. With the verifier's role, the export could also close findings. Step five reruns the original ServiceNow client tests: seven pass.`,
  `${M} — Unit 5 "Exercise: Lab 1 (fixtures, no tenant)," Part A, steps 1 to 5; workbook Chapter 02 — "Lab 1."`);
}

// ================================================================== 11 Try it: ISC and Graph
{
  const s = content(SL, "Try it: a manage scope, one client, and the audit");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, Part B, steps 8 to 10 (each prints the task's listing first; trimmed here)",
    "$ python clients/python/kit_calls.py --task drift --system isc --granted \"sp:search:read,idn:accounts:read,idn:accounts:manage\"",
    "missing: none",
    "extra:   idn:accounts:manage",
    "Least privilege does not hold: fix the grant.",
    "$ python clients/python/kit_calls.py --task workflows --system isc --granted \"sp:search:read,idn:accounts:read\"",
    "  POST   /v2025/workflows                                           sp:workflow:manage",
    "missing: sp:workflow:manage",
    "extra:   idn:accounts:read, sp:search:read",
    "$ python clients/python/kit_calls.py --task drift --system graph --granted \"User.Read.All\"",
    "  GET    /v1.0/auditLogs/directoryAudits                            AuditLog.Read.All (optional)",
    "missing: AuditLog.Read.All",
    "$ python clients/python/kit_calls.py --task drift --system graph --required-only --granted \"User.Read.All\"",
    "missing: none",
    "extra:   none",
    "Least privilege holds.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Two", "The first three exit 1; the last exits 0. The drift client and the workflow task need two clients. Step 6's ISC client tests: 4 passed.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 2, Unit 5 \"Exercise: Lab 1,\" Part B, steps 6 to 10; workbook Chapter 03, Lab 1.");
  notes(s,
`Part B turns to SailPoint and Graph. Step six runs the SailPoint client tests: four pass. Step seven lists what the drift client needs from SailPoint: search read and accounts read. Step eight catches a manage scope on that read client: nothing missing, accounts manage extra, and it exits one. Step nine checks the drift client's scopes against the workflow task. The workflow scope is missing, and both read scopes are extra. That's the point of the step: the two jobs need two clients. Step ten checks the Graph app registration twice. For a drift run that reads the audit, AuditLog dot Read dot All is missing. With the required-only option, for a run that doesn't read the audit, least privilege holds, and the command exits zero.`,
  `${M} — Unit 5 "Exercise: Lab 1 (fixtures, no tenant)," Part B, steps 6 to 10; workbook Chapter 03 — "Lab 1."`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: build the roles and clients in test instances");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Where", "What you do"], [
    ["ServiceNow", "In your developer instance: the three custom roles, one integration user and one client-credentials integration per role; compare each user's roles with the call list; confirm the evidence reader can't patch a record"],
    ["SailPoint", "In an ISC sandbox tenant: a reader API client and a separate workflow client; compare each with the call list; try the reader"],
    ["Back it out", "Chapter 02, Lab 2, step 5: delete the OAuth integrations, users and roles; revoke any saved token. Chapter 03, Lab 2, step 5: delete both API clients, or the tokens and the dedicated user, and anything under out"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "how an agency gets a SailPoint sandbox is between it and SailPoint. Follow Chapters 02 and 03, Lab 2.");
  sources(s, "Sources: Module 2, Unit 6 \"Exercise: Lab 2\"; Learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 builds the real thing in test instances. In your ServiceNow developer instance, from Module 1, you create the three custom roles, one integration user and one client-credentials integration per role. Then you compare each user's roles with the call list, and confirm the evidence reader can't patch a record. In a SailPoint sandbox tenant, you create a reader API client and a separate workflow client, compare each with the call list, and try the reader. How an agency gets a sandbox is between it and SailPoint. Back it out before you leave: delete the OAuth integrations, users and roles, and revoke any saved token; then delete both API clients and anything under the output folder. The authors haven't run Lab 2.`,
  `${M} — Unit 6 "Exercise: Lab 2 (your test instance)"; Learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Marketplace
{
  const s = content(SA, "Where agencies are: the boundary on the Marketplace");
  tag(s, "Who");
  const b = table(s, "FR", 1.45, [3.3, 3.6, 5.25], ["Slot", "Offering", "FedRAMP status, read November 1, 2026"], [
    ["Front door, record", "ServiceNow, Government Community Cloud", "Certified, High (Class D), JAB path, since August 12, 2019"],
    ["Front door, commercial cloud", "—", "No listing of its own"],
    ["Identity governance", "SailPoint Identity Security Cloud", "Certified, Moderate (Class C), agency path, since June 5, 2024"],
    ["Self-hosted governance", "SailPoint IdentityIQ", "No listing of its own; a component inside another provider's High offering"],
  ], { fontSize: 12.5, limit: 4.6 });
  panel(s, "Interim", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "INTERIM PATH", null, [
    "On ServiceNow's commercial cloud, the authorizing official decides whether identity tasks may run there; keep payloads to identifiers (design guidance)",
    "Where a feature's presence in ISC's FedRAMP environment is unconfirmed, build Gates 3 to 6 in the sandbox and hold production",
  ], 12.5);
  sources(s, "Sources: Module 2, Unit 2; the guide's Gate 1 availability table (FedRAMP Marketplace, read Nov. 1, 2026), interim path; \"Where agencies start.\"");
  notes(s,
`What does the boundary look like on the Marketplace? Read on November 1, 2026: ServiceNow's Government Community Cloud is FedRAMP certified at High, on the JAB path. ServiceNow's commercial cloud has no listing of its own, and some agencies run on it. SailPoint Identity Security Cloud is certified at Moderate, on the agency path. And IdentityIQ, the self-hosted product, has no listing of its own. The interim path: on ServiceNow's commercial cloud, the authorizing official decides whether identity tasks may run there before a move, and, as design guidance, payloads stay to identifiers. Where a feature's presence in SailPoint's authorized environment is unconfirmed, build Gates 3 to 6 in the sandbox and hold production until SailPoint confirms it.`,
  `${M} — Unit 2 "The authorization boundary"; the guide — "Step 1," Availability and Interim path; "Where agencies start."`);
}
endModule(SA);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.1, 8.05], ["Requirement", "What the gate and the call list show"], [
    ["SP 800-53 SA-9; FedRAMP", "Each external service's authorization; only listed offerings, or the gap recorded as a risk"],
    ["CA-3 Information Exchange", "Each flow between the products and the tenant is recorded"],
    ["IA-5; AC-6 Least Privilege", "Integration identities use certificates; each holds exactly what its calls need"],
    ["AC-2, AC-5, CM-3", "Accounts are managed; the closing account is separate; a change to what may be called is reviewed"],
  ], { fontSize: 12.5, limit: 4.4 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "Gate 1: the Marketplace listings with the date read, the vendor's written answers, the data-flow record, the identity register",
    "Chapters 02 and 03: config/calls.json and its test, and the kit_calls.py --granted output kept with each access approval",
  ], 12.5);
  sources(s, "Sources: Module 2, Unit 1 \"The federal requirement\"; Unit 8 \"Summary\"; guide Gate 1 requirements; workbook Chapters 02 and 03, \"Federal requirements.\"");
  notes(s,
`The federal requirement. The guide maps Gate 1 to NIST special publication eight hundred fifty-three. S A nine, external system services, and FedRAMP authorization: each service's authorization is confirmed, or the gap is recorded as a risk for the authorizing official. C A three, information exchange: each flow is recorded. I A five and A C six: the integration identities use certificates and least privilege. The chapters map the call list to A C six, A C two for account management, A C five because the account that closes findings is separate, and C M three because a change to what the integration may call is reviewed. The evidence an ISSO keeps: Gate 1's record, plus the call list, its test, and the comparison output with each access approval.`,
  `${M} — Unit 1 "The federal requirement"; Unit 8 "Summary"; the guide — Gate 1 requirements and evidence; workbook Chapters 02 and 03 — "Federal requirements and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on least privilege", [
    { q: "Why does the evidence export get its own evidence_reader role instead of reusing the verifier's?", options: ["a. The verifier role can't read u_identity_finding", "b. With the verifier's role, the export could also close findings; the reader can't change what it hashes", "c. ServiceNow allows only one integration user per role"] },
    { q: "Gate 1 asks you to record which actions run from a vendor's cloud. Why?", options: ["a. Book 15 prefers execution through a connector inside the boundary, so each is a recorded data flow", "b. Vendor-cloud actions can't be used at FedRAMP Moderate", "c. The FedRAMP Marketplace requires the agency to list them"] },
  ], "1 b: roles are split by task. 2 a: each vendor-cloud action becomes a recorded data flow.");
  sources(s, "Sources: Module 2, Unit 7 \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: why does the evidence export get its own evidence reader role, instead of reusing the verifier's? The answer is b. With the verifier's role, the export could also close findings. The reader can't change a record it's about to hash. Roles are split by task. Second: Gate 1 asks you to record which actions run from a vendor's cloud. Why? The answer is a. The workbook's design prefers execution through a connector inside the boundary, so each vendor-cloud action becomes a recorded data flow. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 7 "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 3, one writer");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Confirmed what Gate 1 records, and why it builds nothing",
    "Learned the roles, scopes and permissions each kit task needs",
    "Saw why the workflow scope gets a client of its own",
    "Caught three kinds of over-wide grant on a laptop",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3: One writer per attribute", [
    "Gate 2: the writers and the approvers",
    "Find an attribute with two writers",
  ], 13.5);
  callout(s, "Ship", Math.max(l, r) + 0.3, 0.9, "FaListCheck", HEX.teal, "Before you ship: ",
    "work through the Chapter 02 and Chapter 03 checklists.");
  sources(s, "Sources: Module 2, Unit 8 \"Summary\"; Module 3, Unit 1; workbook Chapters 02 and 03, \"Checklist.\"");
  notes(s,
`To sum up. You confirmed what Gate 1 records: each product's FedRAMP status, what's inside the authorization, which actions run from a vendor's cloud, and the integration identities. And you saw that it builds nothing. You learned the ServiceNow roles, SailPoint scopes and Graph permissions each kit task needs, and why the workflow scope gets a client of its own. And on a laptop you caught three kinds of over-wide grant: an extra role, a reused role, and a manage scope on a read client. Before you ship, work through the Chapter 02 and Chapter 03 checklists. Next is Module 3, one writer per attribute: Gate 2's decisions about who writes each attribute and who approves each class, and a check that finds an attribute with two writers.`,
  `${M} — Unit 8 "Summary"; workbook Chapters 02 and 03 — "Checklist"; Module 3, Unit 1.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/ticket-to-machine/02-boundary-and-least-privilege.md (Ticket-to-Machine learning path, Module 2), Units 1 to 8, and the path's index. Its verification log (docs/training/ticket-to-machine/_verification) says every fact is on a page the module links; the deck uses only those pages.",
  "Pages the module sends you to: the example guide, \"Step 1: Confirm the authorization boundary\" (steps, Gate 1 requirements and evidence, availability from the FedRAMP Marketplace read November 1, 2026, interim path), \"Prerequisites\" (the four integration identities), \"Validate (G1 Boundary)\" and \"Where agencies start.\"",
  "Developer workbook Chapter 02 (what exists, what this chapter adds, dangers, Lab 1, Lab 2, federal requirements) and Chapter 03 (the same, with what couldn't be verified); the implementation example's \"Permissions.\" NIST SP 800-53 Rev. 5 controls as they map them: SA-9, CA-3, IA-5, AC-6, AC-2, AC-5, CM-3.",
  "Lab output: a copy of examples/servicenow-sailpoint (config/calls.json, kit_calls.py, kit_common.py, tests/python), run November 2, 2026 with Python 3.14.3, exactly as the module's Lab 1 gives the commands; the Try it output is trimmed where the slides say so. Lab 2 not run by the authors. Design guidance and inferences are labeled.",
]);

finish(OUT);
