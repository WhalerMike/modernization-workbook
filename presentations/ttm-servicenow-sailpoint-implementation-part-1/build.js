// Implementation guide — Ticket-to-Machine on ServiceNow and SailPoint, IMPLEMENTATION SERIES, PART 1:
// boundary, writers and approvers, sources and starting drift, the front door (guide Gates G1–G4).
//   Orientation:                  the seven gates on one page; the loop on two products and the four gaps.
//   G1 — Boundary:                FedRAMP status and what runs from a vendor cloud; every call declared; evidence.
//   G2 — Writers and approvers:   one writer per attribute, one approver system per class; the lanes; writer_check.
//   G3 — Sources and drift:       aggregate, correlate, detect native change; the drift reconciliation run over run.
//   G4 — Front door:              the finding table, the workflows, the apps; the contract and the workflow payload.
//   Close:                        the handoff to Part 2 (Gates G5–G7).
// Sources: docs/books/guides/ttm-servicenow-sailpoint.md, the developer workbook
// docs/project-plans/developer-workbooks/ticket-to-machine/ (Chapters 01–04, 06 and 08, Lab 1 of each), and
// examples/servicenow-sailpoint (README, clients, config, fixtures, tests). No new external facts. An example, not an endorsement.
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js);
// the code panel and the one-line statement are the ADM deeper dive's (../attribute-driven-migration-deeper-dive-part-1/build.js).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/ttm-servicenow-sailpoint-implementation-part-1/build.js \
//                      presentations/ttm-servicenow-sailpoint-implementation-part-1/TTM_ServiceNow_SailPoint_Implementation_Part_1.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Ticket-to-Machine on ServiceNow and SailPoint — Implementation, Part 1",
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine on ServiceNow and SailPoint — Implementation, Part 1: G1–G4",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "TTM_ServiceNow_SailPoint_Implementation_Part_1.pptx";
const IG = "Ticket-to-Machine on ServiceNow and SailPoint guide";
const WB = "Developer workbook, Building Ticket-to-Machine";

// ------------------------------------------------------------------ code panel
// A light panel with monospaced text (Consolas). Lines starting with "#" are comments, in teal.
// Returns the panel's bottom edge and warns when a line is too wide or the panel runs into the Sources line.
const CODE_FILL = "F1F5F9";
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 11;
  const lh = pt / 72 * 1.2;
  const top = y + 0.1 + (o.label ? 0.27 : 0);
  const h = (top - y) + lines.length * lh + 0.14;
  box(s, name, x, y, w, h, CODE_FILL, HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
  const widest = Math.max(...lines.map((l) => l.length));
  const need = widest * 0.55 * pt / 72 + 0.4;
  if (need > w + 0.01) console.warn(`  ! ${name} code may overflow its width: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
  const runs = lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1,
    color: /^\s*#/.test(l) ? HEX.teal : HEX.ink } }));
  txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
  const bottom = y + h;
  if (bottom > (o.limit || 6.6) + 0.01) console.warn(`  ! ${name} code may overflow: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars (${need.toFixed(2)} of ${w.toFixed(2)} in)`);
  return bottom;
};

// A one-line plain statement under a table or panel (navy, bold), with a fit check.
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  if (process.env.FIT) console.log(`  line ${name}: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};

// Two side-by-side panels under a table: Validate and rollback on the left, availability and interim on the right.
const pair = (s, name, y, left, right) => {
  const w = 5.95;
  const a = panel(s, `${name} validate`, 0.6, y, w, null, HEX.amber, HEX.amberTint, left[0], null, left[1], 12);
  const b = panel(s, `${name} avail`, 0.6 + w + 0.25, y, w, null, HEX.teal, HEX.tealTint, right[0], null, right[1], 12);
  if (process.env.FIT) console.log(`  ${name} panels bottom ${Math.max(a, b).toFixed(2)}`);
  return Math.max(a, b);
};

const S0 = "Orientation";
const SG1 = "G1 — Boundary";
const SG2 = "G2 — Writers and approvers";
const SG3 = "G3 — Sources and starting drift";
const SG4 = "G4 — Front door";
const SC = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Part 1: Boundary, writers, sources and the front door", "Ticket-to-Machine on ServiceNow and SailPoint — implementation, Gates G1–G4");
  txt(s, "Session map", [
    { text: "G1 Confirm the boundary   ·   G2 Decide the writers and approvers", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "G3 Connect the sources and measure the drift   ·   G4 Open the front door", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 2: G5 Actuate  ·  G6 Close only on a re-read  ·  G7 Operate the tempo", options: { color: HEX.ink, breakLine: true } },
    { text: "An example on two named products, not a recommendation or an endorsement", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 1 of the implementation series for Ticket-to-Machine on ServiceNow and SailPoint. Book 13's loop is vendor-neutral on purpose. The guide picks two products to show what building it looks like: ServiceNow as the front door and the record, and SailPoint Identity Security Cloud, ISC, as identity governance. Other products can fill the same slots, and naming these two isn't an endorsement by the program or any agency.

The guide's argument is in its first line: two products can carry the loop, but neither closes it on its own. The ticket has to authorize a machine, and only a re-read can close the ticket.

This series stays at the level of the guide's seven gates. For each one: what done means, the steps, the commands from the developer workbook's first lab where it has them, the federal requirement and the evidence an ISSO keeps, the FedRAMP status of each product and the Entra features in GCC and GCC High as the guide states them, and the rollback.

Part 1 covers G1 to G4: confirm the authorization boundary, decide the writers and approvers, connect the sources and measure the starting drift, and open the front door. Part 2 covers G5 to G7: actuate on the native surface, close only on a re-read, and operate the tempo.

Product facts are the vendors' own statements as the guide footnotes them. The kit's tests run against mocked responses and prove logic, not the live integration.`,
  `${IG}, "An example, not a recommendation," "In this guide," "The path on one page."`);
}

// ================================================================== 2 Gates on one page
{
  const s = content(S0, "The seven gates on one page: done when, gap, proof");
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [2.1, 5.85, 0.95, 3.25], ["Gate", "Done when", "Gap", "Validate with"], [
    ["G1 Boundary", "Each product's FedRAMP status, the actions that run from a vendor cloud, and the integration identities are recorded and accepted", "—", "VK-NPI-02, VK-NPI-05; manual record"],
    ["G2 Writers and approvers", "One writer per attribute and one approver system per authority class decided; each change class has a lane", "2, 4", "writer_check.py; manual"],
    ["G3 Sources and drift", "HR, Entra ID and AD aggregated and correlated on employeeId; the starting drift measured", "—", "Kit drift tests; VK-HR-01, VK-HR-04"],
    ["G4 Front door", "Drift events, requests and disconnected-application work arrive in ServiceNow as typed, owned, clocked tasks", "—", "Kit contract and script tests"],
    ["G5 Actuation", "Each lane actuates through a connector or a declared exception, under a service identity", "3", "No automated check yet"],
    ["G6 Re-read", "No finding or Service Desk ticket closes without a re-read of the target", "1", "Kit re-read and rule tests"],
    ["G7 Tempo and evidence", "Windows measured, identity fixes routed through the loop, evidence produced on a schedule", "—", "evidence_export.py; manual"],
  ], { fontSize: 11, limit: 6.0 });
  line(s, "Parts", "Part 1: G1–G4. Part 2: G5–G7. The gap column is the guide's four gaps between the products and the loop, next slide.",
    tb + 0.15, 0.4, 13.5);
  sources(s, "Sources: Guide, \"The path on one page\"; Validate steps of G2 and G7 (writer_check.py, evidence_export.py); developer workbook, Ch 07, 08.");
  notes(s,
`Here are the seven gates on one page, with the gap each one closes and how it's validated.

G1, the boundary, is done when each product's FedRAMP status, the actions that run from a vendor's cloud, and the integration identities are recorded and accepted. VK-NPI-02 and VK-NPI-05 check the identities; the rest is a manual record.

G2, writers and approvers, is done when one writer per attribute and one approver system per authority class are decided, and each change class has a lane. It closes gaps 2 and 4. The developer workbook's writer check reads the provisioning exports; the rest is manual.

G3, sources and starting drift, is done when HR, Entra ID and Active Directory are aggregated in SailPoint and correlated on employeeId, and the starting drift is measured. The kit's drift tests and VK-HR-01 and VK-HR-04 prove part of it.

G4, the front door, is done when drift events, requests and disconnected-application work arrive in ServiceNow as typed, owned, clocked tasks, proved by the kit's contract and ServiceNow script tests.

Part 2 then takes G5, actuation through a connector or a declared exception, which closes gap 3 and has no automated check yet; G6, the re-read, which closes gap 1; and G7, the tempo and the evidence.`,
  `${IG}, "The path on one page"; G2 and G7 "Validate"; ${WB}, Chapters 07 and 08.`);
}

// ================================================================== 3 Loop and gaps
{
  const s = content(S0, "The loop on two products, and the four gaps");
  tag(s, "Why");
  const tb = table(s, "Loop", 1.45, [2.0, 5.7, 0.9], ["Loop step", "Done by, in this example", "Gate"], [
    ["1 Test", "SailPoint aggregation and lifecycle-state evaluation; the kit's read-only drift reconciliation", "G3"],
    ["2 Detect drift", "SailPoint's Identity Attributes Changed and Native Change Account Updated events; certification findings", "G3, G4"],
    ["3 Raise a typed task", "A SailPoint workflow posting to a ServiceNow endpoint (a build); the Service Catalog app; Service Desk tickets", "G4"],
    ["4 Actuate", "SailPoint's Entra and AD connectors; ServiceNow's Entra ID spoke for low-authority tasks", "G5"],
    ["5 Close with evidence", "A re-read of the target, not the ticket status (a build)", "G6"],
  ], { fontSize: 11, limit: 6.6 });
  const p = panel(s, "Gaps", 9.35, 1.45, 3.4, null, HEX.red, HEX.redTint, "THE FOUR GAPS", null, [
    "1 A ticket status isn't a re-read (G6)",
    "2 The catalog app moves access approval into ServiceNow (G2)",
    "3 No change-request tickets from ISC (G5)",
    "4 Two doors into the directory (G2)",
  ], 12);
  callout(s, "Close", Math.max(tb, p) + 0.25, 0.95, "FaArrowsRotate", HEX.navy, "Neither product closes the loop: ",
    "the ticket has to authorize a machine, and only a re-read can close the ticket.");
  sources(s, "Sources: Guide, \"The loop at a glance\" (the loop on ServiceNow and SailPoint; the four gaps); Book 13, Appendix B (the loop).");
  notes(s,
`Book 13's loop has five steps: test, detect drift, raise a typed task, actuate on the native surface, and close with evidence. Here's who does each step in this example.

Test is SailPoint's aggregation and lifecycle-state evaluation, and the kit's read-only drift reconciliation: G3. Detect drift is SailPoint's Identity Attributes Changed and Native Change Account Updated events, and certification findings: G3 and G4. Raise a typed task is a SailPoint workflow posting to a ServiceNow endpoint, which is a build, plus the Service Catalog app for requests and Service Desk tickets for disconnected applications: G4. Actuate is SailPoint's Entra and Active Directory connectors, and ServiceNow's Entra ID spoke for low-authority tasks: G5. And close with evidence is a re-read of the target, not the ticket status, also a build: G6.

Used as shipped, the two products fall short of the loop in four places. One: a ticket status isn't a re-read. SailPoint's Service Desk integration uses the mapped ServiceNow status to decide when its provisioning task is treated as complete. G6 fixes it. Two: with the Service Catalog app, requests follow the approval process defined in ServiceNow, while Book 15 decides owner-governed access in the identity governance platform. G2 fixes it with one approver system per authority class. Three: ISC's Service Desk integration supports only Service Request and Incident tickets, no change requests. G5 has a ServiceNow flow raise the change record. Four: SailPoint can provision Entra ID and AD, while Book 03 makes Entra inbound provisioning the one writer of HR-mastered attributes. G2 fixes it with one writer per attribute.`,
  `${IG}, "The loop at a glance" — the loop table, "Four gaps between the products and the loop"; Book 13, Appendix B — "The coordination loop."`);
}
endModule(S0);

// ================================================================== 4 G1: FedRAMP and what runs where
{
  const s = content(SG1, "G1: FedRAMP status, and what runs from a vendor cloud");
  tag(s, "Why");
  const tb = table(s, "FR", 1.45, [2.15, 2.75, 3.15], ["Slot", "Offering", "FedRAMP status (read Nov 1, 2026)"], [
    ["Front door and record", "ServiceNow, Government Community Cloud", "Certified, High (Class D), JAB path, since August 12, 2019"],
    ["Front door, commercial cloud", "—", "No listing of its own"],
    ["Identity governance", "SailPoint Identity Security Cloud", "Certified, Moderate (Class C), agency path, since June 5, 2024"],
    ["Self-hosted governance", "SailPoint IdentityIQ", "No listing of its own; a component in another provider's High offering"],
  ], { fontSize: 11, limit: 6.6 });
  const p = panel(s, "Steps", 8.85, 1.45, 3.9, null, HEX.navy, HEX.navyTint, "STEPS 2–5", null, [
    "Ask SailPoint in writing whether Workflows, Native Change Detection and the HTTP Request step are in the authorized environment, and the API domain",
    "ISC is now marketed as \"Human Fabric\"; the Marketplace lists ISC",
    "Cloud connectors call Graph from SailPoint's cloud; only AD runs through the on-premises appliance: a recorded data flow",
    "Confirm the apps are in ServiceNow's government Store",
  ], 11.5);
  line(s, "Lic", "Licensed separately: ISC; each SailPoint ServiceNow app; the Entra spoke (Integration Hub); Entra ID P1 where inbound provisioning writes.",
    Math.max(tb, p) + 0.2, 0.6, 13);
  sources(s, "Sources: Guide, G1 steps 1–5 and availability (FedRAMP Marketplace data, read November 1, 2026); \"Prerequisites\" (subscriptions).");
  notes(s,
`G1 confirms the authorization boundary. Its prerequisites are the subscriptions, or a draft of them, and the authorizing official and ISSO named for the system that consumes these services.

Step 1 confirms each product's FedRAMP status on the Marketplace on the day the decision is made, and records the listing, its impact level, its certification path and its date. The table was read on November 1, 2026. ServiceNow's Government Community Cloud is FedRAMP Certified at High, Class D, on the JAB path, since August 12, 2019. ServiceNow's commercial cloud has no listing of its own. SailPoint Identity Security Cloud is Certified at Moderate, Class C, on the agency path, since June 5, 2024. And SailPoint IdentityIQ, the self-hosted product, has no listing of its own; it appears as a component inside another provider's High offering.

Step 2 confirms what's inside the authorization. SailPoint says the authorized ISC is hosted in AWS GovCloud and lists its modules, but doesn't publish what isn't available there. So ask SailPoint in writing whether Workflows, Native Change Detection and the workflow HTTP Request step, which Gates 3 to 6 rely on, are in the authorized environment, and what API domain a FedRAMP tenant uses. Step 3: SailPoint now markets ISC as Human Fabric, while the Marketplace still lists ISC, so confirm the product purchased is the one authorized.

Step 4 records which actions run from a vendor's cloud. SailPoint's cloud connectors call Microsoft Graph from SailPoint's cloud; only the AD path runs through the on-premises virtual appliance. Each vendor-cloud action is a recorded data flow. Step 5 confirms that SailPoint's ServiceNow apps and the Entra spoke are installable in ServiceNow's isolated government Store.

Each piece is licensed separately: the ISC subscription, each SailPoint ServiceNow app, the Entra spoke through an Integration Hub subscription, and Entra ID P1 where inbound provisioning is the writer.`,
  `${IG}, Step 1 — "Prerequisites," steps 1–5, "Availability"; "Prerequisites" — subscriptions; Book 10, Chapter 01 — "The certification."`);
}

// ================================================================== 5 G1: in code
{
  const s = content(SG1, "G1 in code: every call declared, least privilege checked");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 8.0, [
    "# examples/servicenow-sailpoint, Lab 1 of Chapters 02 and 03: no tenant",
    "python -m pytest tests/python/test_kit_calls.py -q      # 9 passed: every call declared",
    "python clients/python/kit_calls.py --task reread --system servicenow \\",
    "    --granted \"x_example_idkit.verifier,itil\"",
    "#   missing: none   extra: itil   Least privilege does not hold   (exit 1)",
    "python clients/python/kit_calls.py --task evidence --system servicenow \\",
    "    --granted \"x_example_idkit.verifier\"",
    "#   missing: x_example_idkit.evidence_reader   extra: ...verifier   (exit 1)",
    "python clients/python/kit_calls.py --task drift --system isc \\",
    "    --granted \"sp:search:read,idn:accounts:read,idn:accounts:manage\"",
    "#   extra: idn:accounts:manage   (exit 1)",
    "python clients/python/kit_calls.py --task drift --system graph --required-only \\",
    "    --granted \"User.Read.All\"            #   Least privilege holds.   (exit 0)",
  ], { label: "COMMANDS AND OUTPUT (config/calls.json, kit_calls.py)", pt: 10.5 });
  panel(s, "Ids", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "THE FOUR INTEGRATION IDENTITIES", null, [
    "SailPoint's Entra connector app registration",
    "The ServiceNow Entra spoke's app registration",
    "The ServiceNow integration user the workflow posts as, and the verifier account",
    "The ISC API client the kit reads with",
    "Each: two owners, a federal sponsor, a certificate or federated credential (design guidance)",
  ], 11.5);
  line(s, "Split", "Roles split by task (custom, design guidance): the finding writer only creates; the verifier closes; the evidence reader only reads.",
    c1 + 0.2, 0.6, 13);
  sources(s, "Sources: Developer workbook, Ch 02 and 03 (the call list; Lab 1); Guide, \"Prerequisites\" (integration identities), G1 step 6.");
  notes(s,
`Step 6 of G1 registers the integration identities in the system inventory, with their permissions, owners and credential type: a certificate or federated credential, never a long-lived secret. There are four, each with two named owners and a federal sponsor, and each governed on the non-person identity track, as design guidance. SailPoint's Entra connector app registration; the ServiceNow Entra spoke's app registration; the ServiceNow integration user the SailPoint workflow posts as, and the verifier account the re-read client closes records as; and the ISC API client the kit's clients read with.

The workbook's Chapters 02 and 03 make the permissions checkable. config/calls.json lists every call the kit makes, with the tasks that make it, the least privilege and the vendor page. A test runs the clients against a fake session and fails on any call that isn't in the file, so a new call can't arrive without its row, its privilege and its source.

kit_calls.py compares what an identity was actually granted with what a task needs. A verifier that also holds itil: extra role, exit 1. The evidence export reusing the verifier: it would work, but it could also close findings, so missing evidence_reader, extra verifier, exit 1. A drift client with an ISC manage scope: extra, exit 1. And the Graph app registration with User.Read.All alone passes for a drift run that doesn't read the audit.

The roles are custom roles in the scoped application, design guidance. The finding writer can only create findings; the verifier can close them, which is why the business rule accepts a close only from that account; and the evidence reader reads but can't change a record it's about to hash. Workflow creation needs a manage scope, so it belongs to a separate client, used once and then removed.`,
  `${IG}, "Prerequisites" — integration identities; Step 1, step 6; ${WB}, Chapter 02 — "What this chapter adds," "Lab 1"; Chapter 03 — "What this chapter adds," "Lab 1."`);
}

// ================================================================== 6 G1: requirement, evidence, rollback
{
  const s = content(SG1, "G1: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [4.6, 7.55], ["Requirement", "Evidence the ISSO keeps"], [
    ["NIST SP 800-53 SA-9, External System Services (Moderate)", "Marketplace listings with the date read; the vendor's written answers on feature scope"],
    ["FedRAMP authorization of cloud services used", "The authorization package or letter for each offering the agency relies on"],
    ["SP 800-53 CA-3, Information Exchange (Moderate)", "The data-flow record: source, destination, identity, data"],
    ["IA-5, Authenticator Management; AC-6, Least Privilege (Moderate)", "The identity register; VK-NPI-02 and VK-NPI-05 output"],
  ], { fontSize: 12, limit: 6.6 });
  pair(s, "G1", tb + 0.2,
    ["VALIDATE (G1) AND ROLLBACK", [
      "Manual: Marketplace record and vendor answers filed; every vendor-cloud action in the data-flow record; the boundary accepted",
      "VK-NPI-05: integration principals with high-privilege Graph roles, each justified; VK-NPI-02: no credential past the maximum",
      "Rollback: nothing to roll back; this gate records and decides",
    ]],
    ["WHY ISC, AND THE INTERIM PATH", [
      "ISC: a public listing, reaches Entra ID and AD, documented ServiceNow apps; IdentityIQ fits a High or in-boundary need",
      "On ServiceNow's commercial cloud, the authorizing official decides; ticket payloads carry identifiers only",
      "A feature unconfirmed in the FedRAMP environment: build in the sandbox, hold production",
    ]]);
  sources(s, "Sources: Guide, G1 (requirements and evidence; \"Why ISC for the example\"; interim path; Validate); Book 13, Appendix A.");
  notes(s,
`G1's federal requirements, and the evidence the ISSO keeps.

SA-9, external system services, at Moderate, confirms each external service's authorization and the agency's oversight of it: the Marketplace listings with the date read, and the vendor's written answers on feature scope. FedRAMP authorization of the cloud services used: only listed offerings are used, or the gap is recorded as a risk for the authorizing official, with the authorization package or letter for each offering relied on. CA-3, information exchange, records each flow between the products and the tenant: source, destination, identity and data. And IA-5 and AC-6: integration identities use certificates and least privilege, evidenced by the identity register and the output of VK-NPI-02 and VK-NPI-05.

Validate is mostly manual: the Marketplace record and the vendor answers are filed, every vendor-cloud action is in the data-flow record, and the authorizing official has accepted the boundary or recorded the gaps. VK-NPI-05 lists the integration service principals with high-privilege Graph roles; the connector's and the spoke's write permissions will appear, and each needs a justification in the identity register. VK-NPI-02 shows no integration credential longer than the policy maximum and none expiring without an owner. There's nothing to roll back; this gate records and decides.

Why ISC for the example: it has a public listing a reader can check, it reaches both Entra ID and AD, and SailPoint documents its ServiceNow integrations. IdentityIQ fits an agency that must run governance inside its own boundary, needs a High system, or needs change-request tickets from the governance tool.

The interim path: on ServiceNow's commercial cloud, the authorizing official decides whether identity tasks may run there, and ticket payloads stay to identifiers. Where a feature's presence in the ISC FedRAMP environment is unconfirmed, build Gates 3 to 6 in the sandbox and hold production until SailPoint confirms it.`,
  `${IG}, Step 1 — "Federal requirements and evidence," "Why ISC for the example," "Interim path," "Validate (G1 Boundary)"; Book 13, Appendix A.`);
}
endModule(SG1);

// ================================================================== 7 G2: writers and approvers
{
  const s = content(SG2, "G2: one writer per attribute, one approver per class");
  tag(s, "Who");
  const w = 5.95;
  const p1 = panel(s, "Writer", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "STEP 1: ONE WRITER PER ATTRIBUTE (GAP 4)", null, [
    "Pattern A: Entra inbound provisioning stays the door; SailPoint aggregates HR read-only and governs entitlements",
    "Pattern B: SailPoint becomes the provisioning service and takes on Book 03's middleware duties",
    "Not both. SailPoint's Oracle HCM connector writes back only user name and work email",
  ], 12);
  const p2 = panel(s, "Appr", 0.6 + w + 0.25, 1.45, w, null, HEX.teal, HEX.tealTint, "STEP 2: ONE APPROVER SYSTEM PER CLASS (GAP 2)", null, [
    "ServiceNow approves A0 and A1 through its Ask for Approval flow",
    "SailPoint approves A2 and A3: owner, manager or governance group",
    "The Service Catalog app only collects A2 and A3 requests",
    "Every approval times out to reject or cancel, never approve",
  ], 12);
  callout(s, "Record", Math.max(p1, p2) + 0.25, 0.95, "FaCodeBranch", HEX.amber, "Step 4: ",
    "write the decisions to the authoritative record as a reviewed change, steward and sponsor approving. Every later gate builds what this one decides.");
  sources(s, "Sources: Guide, G2 steps 1, 2 and 4 (design guidance); Book 03, Ch 05; Book 15, Ch 03 (authority classes); Book 13, Ch 09.");
  notes(s,
`G2 closes gaps 2 and 4 on paper, before anything is connected. Every later gate builds what it decides. The prerequisites are G1, and the program attribute map and Book 15's authority classes adopted.

Step 1 chooses one writer per attribute, which is gap 4. Book 03's design makes Entra inbound provisioning the one writer of HR-mastered attributes into the directory. SailPoint's Oracle HCM Cloud connector reads Core HCM directly, without an on-premises appliance, and writes back only the user name and work email. So pick one of two patterns and write it down, as design guidance. Either Entra inbound provisioning stays the door, and SailPoint aggregates HR read-only and governs entitlements: groups, roles, access packages and application access. Or SailPoint becomes the provisioning service and takes on Book 03's middleware duties. Not both. Record each attribute's writer in the attribute map.

Step 2 chooses one approver system per authority class, which is gap 2. For example, as design guidance: ServiceNow approves A0 and A1 through its Ask for Approval flow; SailPoint approves A2 and A3 through access-request approvals by owner, manager or governance group; and the Service Catalog app only collects A2 and A3 requests. Set every approval's timeout outcome to reject or cancel, never approve.

Step 4 writes the decisions to the authoritative record as a reviewed change, with the steward and the sponsor approving.`,
  `${IG}, Step 2 — "Prerequisites," steps 1, 2 and 4; Book 03, Chapter 05 — "The middleware: five duties per event"; Book 15, Chapter 03 — "Triage by required authority"; Book 13, Chapter 09 — "Who approves rule changes."`);
}

// ================================================================== 8 G2: lanes
{
  const s = content(SG2, "G2: a lane for every change class");
  tag(s, "What");
  const tb = table(s, "Lanes", 1.45, [2.5, 5.6, 4.05], ["Lane (Book 13)", "On these products", "Change record in ServiceNow"], [
    ["Machine, autonomous (L4)", "SailPoint lifecycle states and birthright access, for classes the authorizing official enumerated", "Standard change: pre-authorized, no peer or CAB step"],
    ["Machine, gated (L3)", "A SailPoint access request with approval; a ServiceNow catalog item executed by the spoke", "Normal change where the class needs one: peer or technical approval, then CAB"],
    ["Human decision", "SailPoint certification decisions; ServiceNow approval or CAB", "The decision record, then the gated lane"],
    ["Protocol-enforced", "Neither product: certificates stay with the CLM platform", "None per event"],
    ["Declared exception", "A Service Desk ticket for a disconnected app, a recorded session and an end date", "The ticket and the exception register entry"],
    ["Emergency change", "ServiceNow emergency change; a SailPoint workflow or manual lifecycle-state change", "Emergency change: straight to CAB authorization"],
  ], { fontSize: 11.5, limit: 6.0 });
  line(s, "Inf", "The mapping is the program's inference. The authorizing official accepts, in writing, any class run autonomously.",
    tb + 0.2, 0.4, 13.5);
  sources(s, "Sources: Guide, G2 step 3 and the lanes table (inference; ServiceNow change types as footnoted); Book 13, Appendix B (change classes and lanes).");
  notes(s,
`Step 3 of G2 assigns each change class a lane on these products, from Book 13's Appendix B. The mapping is the program's inference, and the authorizing official accepts any class run autonomously.

Machine, autonomous, L4: SailPoint lifecycle states and birthright access, only for classes the authorizing official enumerated. In ServiceNow that's a standard change: pre-authorized, with no peer or CAB step.

Machine, gated, L3: a SailPoint access request with approval, or a ServiceNow catalog item executed by the spoke. A normal change where the class needs one, which ServiceNow describes as two levels of approval: peer or technical approval, then CAB.

Human decision: SailPoint certification decisions, or a ServiceNow approval or CAB. The decision record comes first, then the gated lane.

Protocol-enforced: neither product. Certificates stay with the certificate lifecycle management platform, and there's no change record per event.

Declared exception: a Service Desk ticket for a disconnected application, a recorded session and an end date, with the ticket and an entry in the exception register.

And emergency change: a ServiceNow emergency change, with a SailPoint workflow or a manual lifecycle-state change doing the work. ServiceNow's emergency changes go straight to CAB authorization.`,
  `${IG}, Step 2, step 3 and "Book 13's lanes on ServiceNow and SailPoint (inference)"; Book 13, Appendix B — "Change classes and their lanes," "Certificates and the CLM platform."`);
}

// ================================================================== 9 G2: in code
{
  const s = content(SG2, "G2 in code: find the attribute with two writers");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 12.15, [
    "# examples/servicenow-sailpoint, Chapter 08, Lab 1: two fictional exports, offline",
    "python clients/python/writer_check.py --entra-schema tests/fixtures/writers/entra_inbound_schema.json \\",
    "    --isc-policies tests/fixtures/writers/isc_entra_source_policies.json",
    "#   Entra inbound writes 8 attributes; SailPoint writes 7; 1 Finding, 1 Warn, 2 Info",
    "#   Finding department   Entra update  SailPoint update   both update it: each overwrites the other",
    "#   Warn    displayName  Entra update  SailPoint create   two sources for its first value",
    "python clients/python/writer_check.py ... --alias title=jobTitle      #   2 Finding, 1 Warn, 2 Info",
    "python clients/python/writer_check.py ... --entra-directory \"Microsoft Entra ID\"",
    "#   error: No synchronization rule targets 'Microsoft Entra ID'; ... ['Azure Active Directory']   (exit 2)",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 08, LAB 1, STEPS 2–4)", pt: 10.5 });
  const w = 5.95;
  const p1 = panel(s, "Reads", 0.6, c1 + 0.2, w, null, HEX.navy, HEX.navyTint, "WHAT IT COMPARES", null, [
    "The inbound job's schema: each mapping's target attribute and flow type (Always, or ObjectAddOnly)",
    "The ISC source's provisioning policies: UPDATE fields and CREATE fields",
    "Reads with idn:provisioning-policy:read and CustomSecAttributeProvisioning.Read.All",
  ], 12);
  const p2 = panel(s, "Alias", 0.6 + w + 0.25, c1 + 0.2, w, null, HEX.red, HEX.redTint, "WHAT A REVIEWER CHECKS", null, [
    "Both update: Finding. One updates, one creates: Warn. Both create only: Info",
    "Without the alias, the second writer of jobTitle was invisible: the alias list is a reviewed input",
    "A wrong directory name fails, never passes as \"no overlap\"",
  ], 12);
  if (process.env.FIT) console.log(`  G2 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 08 (why this is a build; what this chapter adds; Lab 1, steps 2–5); Guide, G2 Validate.");
  notes(s,
`G2's one automated check is the developer workbook's Chapter 08, the one Pass 2 item that runs offline today. It reads two exports.

The first is the Entra inbound provisioning job's schema: the synchronization rules that target the Entra directory, the enabled mappings to User, and each mapping's target attribute and flow type. Always, the default, updates the attribute on every change; ObjectAddOnly sets it only when the object is created. The second is the ISC source's provisioning policies: UPDATE is the profile used for attribute sync, CREATE the one used when the account is made.

Then, per attribute both write: a Finding when both update it, because each overwrites the other and the drift never settles; a Warn when one updates it and the other sets it at creation, two sources for its first value; and Info when both set it only at creation. On the fictional exports, department is the Finding and displayName the Warn.

SailPoint's field names are the connector's, not necessarily Entra's, so the check takes an alias for each pair that differs, and it doesn't guess. Map SailPoint's title to Entra's jobTitle and a second Finding appears. Without the alias, that second writer was invisible, which is why the alias list is part of what a reviewer checks. And a wrong directory name fails with an error rather than passing as no overlap.

The guide's Validate step is plain about the limits: the check reads exports. It doesn't check approver systems or lanes; those are manual.`,
  `${WB}, Chapter 08 — "Why this is a build," "What this chapter adds," "Lab 1," steps 2–5; ${IG}, "Validate (G2 Writers and approvers)."`);
}

// ================================================================== 10 G2: requirement, evidence, rollback
{
  const s = content(SG2, "G2: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [4.6, 7.55], ["Requirement", "Evidence the ISSO keeps"], [
    ["SP 800-53 AC-5, Separation of Duties (Moderate)", "The approver-per-class table, merged with its review; the requester never approves"],
    ["SP 800-53 CM-3, Configuration Change Control (Moderate)", "The lane table: each change class with a lane and a change-record type"],
    ["SP 800-53 AC-2, Account Management", "The attribute map with each attribute's writer"],
    ["Book 13's L4 acceptance", "The authorizing official's signed acceptance of any autonomous class"],
  ], { fontSize: 12, limit: 6.6 });
  pair(s, "G2", tb + 0.2,
    ["VALIDATE (G2) AND ROLLBACK", [
      "Automated, read-only: writer_check.py flags any attribute with two writers; it doesn't check approvers or lanes",
      "Manual: one writer per HR-mastered attribute; one approver system per class; a lane and record type per class; merged",
      "Rollback: re-decide by a reviewed change; the record keeps the history",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "Nothing new is used. API-driven inbound provisioning, PIM, entitlement management, access reviews and Lifecycle Workflows: Azure Government; GCC is commercial",
      "Interim: HR pipeline not live yet? Decide the writers now, and run G3 to G6 against the HR extract the kit reads",
    ]]);
  sources(s, "Sources: Guide, G2 (requirements and evidence; availability; interim path; Validate); Microsoft Learn feature availability, as footnoted.");
  notes(s,
`G2's federal requirements, and the evidence the ISSO keeps.

AC-5, separation of duties, at Moderate: one approver system per class, and the requester never approves. The evidence is the approver-per-class table, merged with its review. CM-3, configuration change control: each change class has a lane and a change-record type, so the lane table. AC-2, account management: one writer per attribute keeps account changes traceable to the source, so the attribute map with each attribute's writer. And Book 13's L4 acceptance: any autonomous class is accepted in writing by the authorizing official, so the signed class acceptance.

Validate. Automated and read-only, writer_check.py compares the Entra inbound provisioning mappings with SailPoint's provisioning policies and flags any attribute with two writers. It reads exports; it doesn't check approver systems or lanes. The manual part: every HR-mastered attribute has exactly one writer in the attribute map, every authority class has exactly one approver system, every change class has a lane and a change-record type, and the decisions are merged in the record.

Availability: nothing new is used. Book 03's API-driven inbound provisioning, if it's the writer, is available in Azure for US Government, as are PIM, entitlement management, access reviews and Lifecycle Workflows. In GCC, Entra ID is the commercial service.

The interim path: where the HR pipeline isn't live yet, SailPoint can't be measured against a source of authority. Decide the writers now, and run Gates 3 to 6 against the HR extract the kit reads, until Book 03's pipeline lands. Rollback: re-decide by a reviewed change; the record keeps the history.`,
  `${IG}, Step 2 — "Federal requirements and evidence," "Availability," "Interim path," "Validate (G2 Writers and approvers)."`);
}
endModule(SG2);

// ================================================================== 11 G3: sources
{
  const s = content(SG3, "G3: aggregate, correlate on employeeId, detect change");
  tag(s, "How");
  const tb = table(s, "Steps", 1.45, [2.75, 9.4], ["Step", "What it does"], [
    ["1 Aggregate HR", "Into SailPoint as the authoritative source, read-only under G2's first pattern"],
    ["2 Connect Entra ID and AD", "The Entra SaaS connector (accounts, groups, licenses, roles, administrative units, access packages, PIM); AD through the virtual appliance. GCC High: graph.microsoft.us and login.microsoftonline.us"],
    ["3 Correlate on employeeId", "The key Book 03 joins on. Uncorrelated accounts are orphan candidates, not errors to suppress"],
    ["4 Native Change Detection", "On the Entra and AD sources: compares stored and new data on aggregation, one event per changed account; not on Non-Employee Lifecycle Management sources"],
    ["5 Run the reconciliation", "The kit joins the HR extract, Graph and ISC on employeeId, read-only, and reports Book 03's drift classes"],
    ["6 File the baseline", "The first run; later gates are measured against it"],
  ], { fontSize: 11.5, limit: 6.0 });
  line(s, "Burst", "Expect a burst of High findings in the first month. Book 03 calls that the measurement working.", tb + 0.2, 0.4, 14);
  sources(s, "Sources: Guide, G3 steps 1–6 (SailPoint connector and Native Change Detection pages, as footnoted); Book 03, Ch 11; integration kit, Build 3.");
  notes(s,
`G3 is the loop's first two steps for identity: SailPoint reads the sources, and the kit measures how far the directory is from HR before anything is fixed. The prerequisites are G2, and the integration identities from G1 in place with read permissions only.

Step 1 aggregates HR into SailPoint as the authoritative source, read-only under G2's first pattern. Step 2 connects Entra ID and Active Directory as SailPoint sources: the Entra SaaS connector, which covers accounts, groups, licenses, roles, administrative units, access packages and PIM, and the AD connector through the virtual appliance. In GCC High, set the Entra source's Graph and token endpoints to graph.microsoft.us and login.microsoftonline.us.

Step 3 correlates on employeeId, the key Book 03 joins on. Treat uncorrelated accounts as orphan candidates, not errors to suppress.

Step 4 turns on Native Change Detection on the Entra and AD sources, for the attributes and entitlements the record governs. It compares stored and newly read data on aggregation and fires one event per changed account. It isn't available on Non-Employee Lifecycle Management sources.

Step 5 runs the kit's drift reconciliation read-only. It joins the HR extract, Microsoft Graph and ISC on employeeId and reports Book 03's drift classes as JSON and CSV. Expect a burst of High findings in the first month; Book 03 calls that the measurement working. And step 6 files the first run as the baseline, which later gates are measured against.`,
  `${IG}, Step 3 — "Prerequisites," steps 1–6; integration kit page, "Build 3: drift reconciliation"; Book 03, Chapter 11 — "Drift between HR and the directory."`);
}

// ================================================================== 12 G3: in code
{
  const s = content(SG3, "G3 in code: the starting drift, day one and day two");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 12.15, [
    "# examples/servicenow-sailpoint, Chapter 06, Lab 1: saved exports, no tenant (inputs under tests/fixtures/)",
    "python clients/python/identity_drift.py --hr-csv .../hr_extract.csv --config .../config.fixtures.json --graph-users-json .../graph_users.json \\",
    "    --isc-identities-json ... --isc-accounts-json ... --entra-audit-json .../entra_audit.json --out-json out/day1.json --out-csv out/day1.csv",
    "#   attribute_drift 4, missing_identity 2, orphan_account 3, stale_access 2, unauthorized_write 1; not_computed: credential, schema drift",
    "python clients/python/identity_drift.py --hr-csv .../hr_extract_day2.csv ... --out-json out/day2.json     #   the same counts",
    "python clients/python/drift_compare.py --previous out/day1.json --current out/day2.json",
    "#   1 new, 11 persisting, 1 resolved",
    "#     new       6456e1f12a60e6be attribute_drift isc   E1004 department: expected 'Finance', observed 'HR'",
    "#     resolved  1f0e34ebf049f163 attribute_drift entra E1004 department: expected 'HR', observed 'Finance'",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 06, LAB 1, STEPS 2–4)", pt: 10 });
  const w = 5.95;
  const p1 = panel(s, "Story", 0.6, c1 + 0.2, w, null, HEX.navy, HEX.navyTint, "WHAT MOVED", null, [
    "HR corrected a department to the value someone had typed into Entra ID by hand",
    "Entra ID now matches HR: resolved. ISC isn't re-aggregated yet: new",
    "The unauthorized write persists: HR agreeing afterwards doesn't authorize it",
  ], 12);
  const p2 = panel(s, "Refuse", 0.6 + w + 0.25, c1 + 0.2, w, null, HEX.red, HEX.redTint, "THE GUARDS", null, [
    "Finding IDs hash class, system, employee, object and attribute: the same drift, the same ID",
    "Runs that computed different classes are refused (exit 2), or a skipped class looks resolved",
    "A resolved finding still closes only on G6's re-read",
  ], 12);
  if (process.env.FIT) console.log(`  G3 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 06 (what exists; what this chapter adds; Lab 1, steps 2–5); examples/servicenow-sailpoint.");
  notes(s,
`The workbook's Chapter 06 runs the kit's drift reconciliation and adds a run-over-run comparison.

identity_drift.py reads an HR extract, Graph users, ISC identities with their accounts nested, uncorrelated accounts, and optionally the Entra directory audit. Each can be a saved export, which is how the lab runs. On day one the fictional estate shows four attribute drifts, two missing identities, three orphan accounts, two stale accesses and one unauthorized write. Credential and schema drift are always reported as not computed, because they need the card system, Intune and the middleware's output. An unauthorized write is computed only when the audit is read.

Day two: HR has corrected a department to the value someone had already typed into Entra ID by hand. The counts are the same; the totals hide what moved. drift_compare.py compares the two runs by finding ID: one new, eleven persisting, one resolved. Entra ID now matches HR, so that finding is resolved. ISC still holds the old value until the next aggregation, so a new one opens. And the unauthorized write persists: HR agreeing afterwards doesn't make the write authorized, and a person decides that finding.

Three guards. Each finding's ID is a hash of its class, system, employee ID, object ID and attribute, so the same drift gets the same ID on every run, from the Python and PowerShell clients alike. The comparison refuses runs that computed different classes, because every finding of a class the second run skipped would look resolved. And a resolved finding is only a lead: its record still closes on G6's re-read.`,
  `${WB}, Chapter 06 — "What exists," "What this chapter adds," "Lab 1: fixtures, no tenant," steps 2–5.`);
}

// ================================================================== 13 G3: requirement, evidence, rollback
{
  const s = content(SG3, "G3: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [4.6, 7.55], ["Requirement", "Evidence the ISSO keeps"], [
    ["SP 800-53 AC-2, Account Management", "The baseline drift report: accounts with no worker, workers with no account"],
    ["SP 800-53 CA-7, Continuous Monitoring", "The drift report, its date and the checker version"],
    ["SP 800-53 CM-8, read for identities (inference)", "Correlation rate and the uncorrelated-account list"],
  ], { fontSize: 12, limit: 6.6 });
  pair(s, "G3", tb + 0.2,
    ["VALIDATE (G3) AND ROLLBACK", [
      "Kit (logic, mocked): test_identity_drift.py and Get-IdentityDrift.Tests.ps1: the classes, the same IDs from both clients",
      "Live: findings on a synthetic HR extract match a hand count (kit lab item 4)",
      "VK-HR-01 and VK-HR-04 clean, or each row owned: the join depends on the key",
      "Rollback: disconnect the source or turn off Native Change Detection; the gate only reads",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "SailPoint's Entra connector documents Azure Government endpoint overrides; GCC uses the worldwide endpoints",
      "Native Change Detection in the ISC FedRAMP environment: not confirmed (G1, step 2)",
      "Interim: without SailPoint, run the reconciliation on the HR extract and Graph alone; AD-only groups wait for the appliance",
    ]]);
  sources(s, "Sources: Guide, G3 (requirements and evidence; availability; interim path; Validate); integration kit, \"How it's tested.\"");
  notes(s,
`G3's federal requirements, and the evidence the ISSO keeps.

AC-2, account management: the gate finds accounts with no worker, and workers with no account, so the evidence is the baseline drift report. CA-7, continuous monitoring: it starts a repeatable comparison of the record and the estate, so the drift report, its date and the checker version. And CM-8, system component inventory, read for identities, which is the program's inference: one correlated inventory of accounts per person, evidenced by the correlation rate and the uncorrelated-account list.

Validate. The integration kit's tests prove the logic against mocked data: test_identity_drift.py and the PowerShell Get-IdentityDrift tests prove the drift classes against the fixtures, the same finding IDs from both clients, and that unauthorized writes are reported as not computed without an audit extract. Live, the reconciliation's findings on a synthetic HR extract should match a hand count; that's item 4 of the kit's lab. And from the validation kit, VK-HR-01, enabled members with no employeeId, and VK-HR-04, duplicate employeeId values, should be clean or have an owner for each row, because the join depends on the key.

Availability: SailPoint's Entra connector documents Azure Government endpoint overrides, and GCC tenants use the worldwide endpoints. Native Change Detection's presence in the ISC FedRAMP environment wasn't confirmed; that's G1's step 2 question.

The interim path: without SailPoint, or before it's connected, run the kit's reconciliation against the HR extract and Graph alone, because the ISC inputs are optional files. AD-only groups wait for the appliance. Rollback: disconnect the source or turn off Native Change Detection; the gate only reads.`,
  `${IG}, Step 3 — "Federal requirements and evidence," "Availability," "Interim path," "Validate (G3 Sources and starting drift)"; integration kit page, "How it's tested and what must still be proven."`);
}
endModule(SG3);

// ================================================================== 14 G4: front door
{
  const s = content(SG4, "G4: one front door for findings and requests");
  tag(s, "How");
  const tb = table(s, "Steps", 1.45, [2.9, 9.25], ["Step", "What it does"], [
    ["1 Finding table and endpoint", "A scoped app: a table extending Task and a Scripted REST resource that validates, maps severity to priority and a due date, de-duplicates and stores the intended state"],
    ["2 One workflow per trigger", "Posting to that endpoint with an HTTP Request step. Workflows can't be created enabled: enable each after a test run"],
    ["3 The Service Catalog app", "For people's requests, with G2's approval routing: raised after separation-of-duties checks, approved in ServiceNow, provisioned by ISC"],
    ["4 The Service Desk integration", "For disconnected applications only: Service Request or Incident tickets, each a declared exception (G5)"],
    ["5 Route by authority", "Book 15's triage order, so each finding or request lands with the owner of its class"],
    ["6 One queue", "Other detection tools feed the same queue, not a second one"],
  ], { fontSize: 11.5, limit: 6.0 });
  line(s, "Tempo", "The due date follows Book 13's tempo, the program's windows: P1 immediate, P2 one hour, P3 24 hours, P4 72 hours.", tb + 0.2, 0.4, 14);
  sources(s, "Sources: Guide, G4 steps 1–6 (SailPoint apps and workflow pages, as footnoted); integration kit, Build 1; Book 13, Ch 10; Book 15, Ch 03.");
  notes(s,
`G4 is the loop's third step: every drift event, request and residual manual step arrives in ServiceNow as a typed task with an owner, a clock and a severity, through one front door. The prerequisites are G3, and the instance's state model and assignment groups agreed.

Step 1 creates the identity finding table and its endpoint in a scoped application: a table extending Task, and a Scripted REST API resource that validates the payload, maps severity to a priority and a due date on Book 13's tempo, de-duplicates, and stores the intended state a re-read must find. The tempo is the program's: P1 immediate, P2 one hour, P3 twenty-four hours, P4 seventy-two.

Step 2 creates one SailPoint workflow per trigger, posting to that endpoint with an HTTP Request step. Workflows can't be created enabled, so enable each after a test run.

Step 3 installs the Service Catalog app for people's requests, with the approval routing G2 decided. SailPoint says requests are raised after separation-of-duties checks, approved in ServiceNow, provisioned by ISC, and the status written back.

Step 4 installs the Service Desk integration for disconnected applications only. It turns ISC provisioning actions into Service Request or Incident tickets, and each one is a declared exception, handled in G5.

Step 5 routes by authority, Book 15's triage order, so a finding or request lands with the owner of its class. And step 6 feeds other detection tools into the same queue, not a second one.`,
  `${IG}, Step 4 — "Prerequisites," steps 1–6; integration kit page, "Build 1: drift to a typed task"; Book 13, Chapter 10 — "How the service desk fits"; Appendix B — "Severity and tempo," "One front door for detection tools"; Book 15, Chapter 03.`);
}

// ================================================================== 15 G4: in code
{
  const s = content(SG4, "G4 in code: the contract, and what a workflow posts");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 12.15, [
    "# examples/servicenow-sailpoint, Lab 1 of Chapters 01 and 04: fictional payloads and trigger inputs",
    "python clients/python/finding_contract.py --validate tests/fixtures/payloads/samples.json --now 2026-11-01T12:00:00Z",
    "#   sample-1-good: ok stale_access P2 priority 2 due 2026-11-01T13:00:00Z system entra_user",
    "#   sample-2-typo: 400 drift_class must be one of missing_identity, stale_access, orphan_account, ...",
    "#   3 accepted, 2 rejected, 0 would de-duplicate                                        (exit 1)",
    "python clients/python/workflow_payload.py --trigger idn:native-change-account-updated \\",
    "    --event tests/fixtures/events/native-change-account-updated.json",
    "#   kind finding, drift_class unauthorized_write, system isc_account",
    "#   contract: accepted: P2, priority 2, key sailpoint-isc|2c91800000000000000000000a1001ad|unauthorized_write",
    "node --test tests/servicenow/servicenow_scripts.test.js            #   tests 15, pass 15",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 01, STEPS 2–3; CHAPTER 04, STEP 2)", pt: 10 });
  const w = 5.95;
  const p1 = panel(s, "Mirror", 0.6, c1 + 0.2, w, null, HEX.navy, HEX.navyTint, "THE CONTRACT, CHECKED BEFORE POSTING", null, [
    "finding_contract.py mirrors the ServiceNow script's rules; a test fails if they drift apart",
    "An intended state that names nothing checkable gets a warning, so a re-read can't close on nothing",
  ], 12);
  const p2 = panel(s, "Fix", 0.6 + w + 0.25, c1 + 0.2, w, null, HEX.red, HEX.redTint, "TWO FIXES (CHAPTER 04)", null, [
    "Multivalued changes now sent and reverted: added values absent, removed values present",
    "The de-duplication key adds the attribute: two attributes on one user are two findings",
  ], 12);
  if (process.env.FIT) console.log(`  G4 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 01 (what this chapter adds; Lab 1) and Ch 04 (what this chapter adds; Lab 1); examples/servicenow-sailpoint.");
  notes(s,
`The workbook's Chapters 01 and 04 make the front door checkable before anything is posted.

The contract is enforced in one place, the Scripted REST resource, which runs inside ServiceNow. Until Chapter 01, a Python client learned a payload was wrong only from a 400 on a live instance. finding_contract.py applies the script's rules offline, and a test reads the JavaScript and fails if the two drift apart. On five sample payloads: the first gets no severity, so the class default gives it P2 and a one-hour window; a misspelled drift class and a bad severity would be rejected with the script's own 400 text; and an intended state that names nothing a re-read can check gets a warning. For the two classes Book 13 routes to a person first, missing identity and unauthorized write, the warning says the empty intent is expected until that person sets it.

Chapter 04 shows what each SailPoint workflow would post. Its body's keys are resolved by SailPoint at run time, so the only way to see the result used to be running the workflow in a tenant. workflow_payload.py resolves the body against a saved trigger input: a native change to an AD account becomes an unauthorized-write finding on the ISC account, P2, with its de-duplication key.

It found two fixes. A native change only to a multivalued attribute, a proxy address added out of band, produced an intended state with nothing in it; the workflow now sends multivalued changes and the script reverts them. And two attributes drifting on one user became one record, so the key now adds the attribute. Whether SailPoint's HTTP Request step resolves those keys the same way is on the kit's verify list; Lab 2 settles it.`,
  `${WB}, Chapter 01 — "What this chapter adds," "Lab 1," steps 2–3; Chapter 04 — "What this chapter adds," "Lab 1," step 2.`);
}

// ================================================================== 16 G4: requirement, evidence, rollback
{
  const s = content(SG4, "G4: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [4.6, 7.55], ["Requirement", "Evidence the ISSO keeps"], [
    ["SP 800-53 CM-3, Configuration Change Control", "Finding and request records with origin, owner and clock"],
    ["SP 800-53 RA-7, Risk Response", "Due dates by severity; the overdue list"],
    ["SP 800-53 CA-7, Continuous Monitoring", "The finding queue with origin records"],
    ["SP 800-53 AC-5, Separation of Duties", "Approval history on each request"],
  ], { fontSize: 12, limit: 6.6 });
  pair(s, "G4", tb + 0.2,
    ["VALIDATE (G4) AND ROLLBACK", [
      "Kit (logic, mocked): test_contract.py; servicenow_scripts.test.js: priority and due date, tempo, de-duplication, 400s",
      "Live: a native change raises one finding, and a repeat de-duplicates (kit lab item 1); a catalog request shows the SoD check",
      "Rollback: disable the workflows and catalog items; findings already raised stay",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "SailPoint's ServiceNow apps in the government Store: not confirmed. Scripted REST and the table are platform features",
      "Interim: no catalog app? A flow creates the ISC access request. No workflows? Push findings with --push-to-servicenow",
      "CM-3(1) is High only; at Moderate the shape is design",
    ]]);
  sources(s, "Sources: Guide, G4 (requirements and evidence; CM-3(1) note; availability; interim path; Validate); Book 13, Appendix A.");
  notes(s,
`G4's federal requirements, and the evidence the ISSO keeps.

CM-3, configuration change control: every proposed change is a documented, owned record, so the finding and request records with their origin, owner and clock. RA-7, risk response: findings are responded to inside declared windows, so due dates by severity and the overdue list. CA-7, continuous monitoring: monitoring results become tracked work, so the finding queue with its origin records. And AC-5, separation of duties: requests pass a separation-of-duties check and an approver who isn't the requester, so the approval history on each request. CM-3 enhancement 1, automated documentation, notification and prohibition of changes, is what this gate builds, but it's in the High baseline only; at Moderate the program adopts the shape as design.

Validate. The kit's tests prove the logic: test_contract.py checks the workflow file's shape, that no secrets are in it, and that every payload field is read by the ServiceNow script; the script's own tests cover a finding created with priority and due date from severity, the tempo windows, de-duplication of an open finding, and validation failures returning 400. Live, a native change on a test account raises one finding with the right priority and due date, and a repeat de-duplicates. Manually, one test request through the catalog app shows the separation-of-duties check and the approver G2 named.

Availability: SailPoint's ServiceNow apps and their presence in the government Store weren't confirmed. The Scripted REST API and custom table are platform features of the instance the agency already runs.

The interim path: without the Service Catalog app, keep the existing catalog items and have a ServiceNow flow create the SailPoint access request through ISC's API, approving A0 and A1 in ServiceNow only. Without the SailPoint workflows, post the reconciliation's findings with the drift client's push option on a schedule. Rollback: disable the workflows and the catalog items; findings already raised stay as records.`,
  `${IG}, Step 4 — "Federal requirements and evidence," "Availability," "Interim path," "Validate (G4 Front door)"; Book 13, Appendix A — "Configuration management (CM)."`);
}
endModule(SG4);

// ================================================================== 17 Handoff
{
  const s = content(SC, "Handing G1–G4 to Part 2");
  tag(s, "How");
  const tb = table(s, "Pack", 1.45, [2.15, 5.3, 4.7], ["Gate", "What it leaves in the record", "What Part 2 reads from it"], [
    ["G1 Boundary", "Marketplace record, vendor answers, data-flow record, the identity register", "G5: the identities that actuate; VK-NPI-05 re-run"],
    ["G2 Writers and approvers", "Attribute map with writers; approver-per-class table; lane table", "G5: each lane and its change record"],
    ["G3 Sources and drift", "Correlated sources; the baseline drift report", "G7: the scheduled reconciliation, measured against the baseline"],
    ["G4 Front door", "The finding table, its intended state and tempo; the workflows and apps", "G6: the re-read checks the intended state"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Next", tb + 0.25, 1.2, "FaRoute", HEX.teal, "Next: ",
    "Part 2 takes G5 to G7. To build the code, the developer workbook Building Ticket-to-Machine; to learn it in order, the learning path for Ticket-to-Machine on ServiceNow and SailPoint.");
  sources(s, "Sources: Guide, Gates 1–4 evidence; Gates 5–7 prerequisites and steps; \"How to read this guide\" (workbook; training path).");
  notes(s,
`To close Part 1, here's what each gate leaves in the record, and what Part 2 reads from it.

G1 leaves the Marketplace record with its date, the vendor's written answers, the data-flow record and the identity register. G5 depends on it: the connector and spoke identities are the ones that actuate, and VK-NPI-05 is re-run so no integration identity holds a Graph permission beyond what its lane needs.

G2 leaves the attribute map with each attribute's writer, the approver-per-class table and the lane table. G5 builds each lane on the products, with the change record its class needs.

G3 leaves the correlated sources and the baseline drift report. G7 schedules the reconciliation and keeps its outputs with the date and the checker version, measured against that baseline.

G4 leaves the finding table, with the intended state each finding stores and its due date on the tempo, and the workflows and apps that feed it. G6 is where the intended state earns its place: the re-read client compares what it reads with what the finding says it should find.

Part 2 takes G5 to G7: actuating on the native surface by lane, closing only on a re-read, and operating the tempo with the identity fixes and the evidence.

To build the code, use the developer workbook, Building Ticket-to-Machine; Part 1's gates draw on its Chapters 01 to 04, 06 and 08. To learn it in order, with exercises and knowledge checks, use the learning path for Ticket-to-Machine on ServiceNow and SailPoint.`,
  `${IG}, Steps 1–4, "Federal requirements and evidence"; Steps 5–7, "Prerequisites"; "How to read this guide"; ${WB}, "Chapters."`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation and G1", [
  "Ticket-to-Machine on ServiceNow and SailPoint: An Example Implementation Guide: \"An example, not a recommendation,\" \"In this guide,\" \"How to read this guide,\" \"Where agencies start,\" \"The loop at a glance\" (the four gaps), \"Prerequisites,\" \"The path on one page,\" Step 1 (steps 1–6, requirements and evidence, availability, why ISC, interim path, Validate).",
  "Vendor and federal pages the guide footnotes: FedRAMP Marketplace data (read November 1, 2026); SailPoint FedRAMP ISC page; SailPoint Human Fabric page; SailPoint Active Directory integration; ServiceNow federal Store instances; SailPoint Service Desk integration, best practices and apps overview; ServiceNow Entra ID spoke.",
  "Book 13, Appendix A (provenance and integrity of the record) and Appendix B (the coordination loop). Book 10, Ch 01 (the certification). Non-person identity guide, Steps 1 and 3.",
  "Developer workbook, Building Ticket-to-Machine: Chapter 02 (config/calls.json; kit_calls.py; the roles split by task; Lab 1) and Chapter 03 (ISC and Graph rows; scopes; Lab 1). examples/servicenow-sailpoint: config/calls.json, clients/python/kit_calls.py, tests/python/test_kit_calls.py.",
]);
sourceSlide("Sources: G2 and G3", [
  "Guide: Step 2 (steps 1–4, the lanes table, requirements and evidence, availability, interim path, Validate) and Step 3 (steps 1–6, requirements and evidence, availability, interim path, Validate).",
  "Vendor pages the guide footnotes: SailPoint Oracle HCM Cloud supported features; SailPoint access request approvals; ServiceNow change types; SailPoint Entra SaaS supported features and Azure Government endpoint configuration; SailPoint Native Change Detection; Microsoft Graph national cloud deployments; Entra feature availability.",
  "Book 03, Ch 05 (the middleware's duties), Ch 06 (program attribute map), Ch 11 (drift classes). Book 15, Ch 03 (authority classes). Book 13, Ch 09 (who approves rule changes); Appendix B (change classes and lanes). Integration kit page, Build 3; how it's tested.",
  "Developer workbook, Chapter 08 (writer_check.py; Lab 1) and Chapter 06 (identity_drift.py; drift_compare.py; Lab 1). examples/servicenow-sailpoint: clients/python/writer_check.py, identity_drift.py, drift_compare.py, tests/fixtures (writers, hr_extract, hr_extract_day2).",
]);
sourceSlide("Sources: G4 and the handoff", [
  "Guide: Step 4 (steps 1–6, requirements and evidence, the CM-3(1) note, availability, interim path, Validate); Steps 5–7 prerequisites; \"How to read this guide.\"",
  "Vendor pages the guide footnotes: SailPoint Workflows and the WorkflowBody schema; SailPoint apps overview (Service Catalog); SailPoint Service Desk integration (ticket types).",
  "Book 13, Ch 10 (how the service desk fits); Appendix A (configuration management); Appendix B (severity and tempo; one front door). Book 15, Ch 03 (triage by required authority). Integration kit page, Build 1.",
  "Developer workbook, Chapter 01 (finding_contract.py; Lab 1) and Chapter 04 (workflow_payload.py; the two fixes; Lab 1). examples/servicenow-sailpoint: servicenow/scripted-rest-identity-finding.js, sailpoint/workflows/drift-to-servicenow.json, tests/fixtures/payloads and events, tests/servicenow.",
  "Labels: product facts are the vendors' own statements as the guide footnotes them; the lanes mapping and CM-8 reading are the program's inference; approver and identity choices are design guidance. Naming the products isn't an endorsement.",
]);

finish(OUT);
