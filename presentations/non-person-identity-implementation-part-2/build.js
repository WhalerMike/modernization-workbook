// Implementation guide — Non-Person Identity, IMPLEMENTATION SERIES, PART 2:
// privilege, conversion and lifecycle (implementation guide Gates G4–G6, SQL Server, AI agents, evidence, rollback).
//   Orientation:              G4–G6 on one page.
//   G4 — Least privilege:     the five surfaces; the permission sweep and workload Conditional Access in code.
//   G5 — Conversion:          the parallel run; the token exchange test and the Kerberos plan in code.
//   G6 — Lifecycle:           owner change, orphans, reviews; disable first, then delete; drift and the evidence chain.
//   SQL Server and AI agents: the guide's two sections, with Chapter 09's check in code.
//   Evidence and rollback:    the track's evidence and the rollback by step.
//   Close:                    the dangers to keep in view, and where to go next.
// Sources: docs/books/guides/non-person-identity-implementation.md, the developer workbook
// docs/project-plans/developer-workbooks/non-person-identity/ (Chapters 05–10, Lab 1 of each), examples/non-person-identity
// and examples/drift-pipeline (npi_evidence.py). Output shown on the slides is the kit's own, verbatim from
// data/kit-captures/npi/NN-k.txt; a panel label says where a command is wrapped or its output trimmed. No new external facts.
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js);
// the code panel, the one-line statement and the paired panels are the HR-Driven Identity Part 2 deck's
// (../hr-driven-identity-implementation-part-2/build.js).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/non-person-identity-implementation-part-2/build.js \
//                      presentations/non-person-identity-implementation-part-2/Non_Person_Identity_Implementation_Part_2.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Non-Person Identity — Implementation, Part 2",
  footer: "Federal Modernization Workbook  ·  Non-Person Identity — Implementation, Part 2: G4–G6",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Non_Person_Identity_Implementation_Part_2.pptx";
const IG = "Non-person identity implementation guide";
const WB = "Developer workbook, Building Non-Person Identity";

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
const SG4 = "G4 — Least privilege";
const SG5 = "G5 — Conversion";
const SG6 = "G6 — Lifecycle";
const SX = "SQL Server and AI agents";
const SE = "Evidence and rollback";
const SC = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Part 2: Privilege, conversion and lifecycle", "Non-Person Identity — implementation, Gates G4–G6");
  txt(s, "Session map", [
    { text: "G4 Least privilege   ·   G5 Conversion with a parallel run   ·   G6 Lifecycle", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "SQL Server and AI agents   ·   Evidence and rollback", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 1: G1 Inventory  ·  G2 Decision  ·  G3 Credential rules", options: { color: HEX.ink, breakLine: true } },
    { text: "Steps, Lab 1 commands, federal evidence, government-cloud availability and rollback", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 2 of the implementation series for non-person identity: every identity that isn't a person, from an Active Directory service account whose password never expires to an AI agent with a sponsor. Part 1 inventoried every one of them and joined each to a record with an owner and a sponsor, decided each one's target, and set the credential rules.

Part 2 takes the last three gates. G4 cuts privilege: Graph permissions, directory roles, Azure roles, attributes, and Conditional Access for workload identities. G5 converts each identity to its target with a thirty-day parallel run, then disables the legacy account. G6 runs the lifecycle: owner change, orphans, owner reviews, and decommissioning, disable first and delete later. Then the guide's two special cases, SQL Server and AI agents, and the evidence and the rollback for the whole track.

The form is the same as Part 1. For each gate: what done means, the steps, the commands from the developer workbook's first lab with the kit's real output, the federal requirement and the evidence, what's available in the government clouds as the sources state it, the interim path, and the rollback. Every gate's Validate step names the read-only validation kit check that proves it.

The program's recommendations are marked design guidance, and preview features carry their stage. The workbook's code is illustrative and fixture-tested, not proven against a live tenant or domain.`,
  `${IG}, "In this guide," "The path on one page," Steps 4–6, "SQL Server service and application principals," "AI agents."`);
}

// ================================================================== 2 G4–G6 on one page
{
  const s = content(S0, "G4–G6 on one page: done when, validate with, rollback");
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [1.95, 4.75, 2.1, 3.35], ["Gate", "Done when", "Validate with", "Rollback"], [
    ["G4 Least privilege", "High-privilege grants are justified or removed; Tier 1 single-tenant service principals have a workload identity policy", "VK-NPI-04, 05, 07", "Workload policy back to report-only; a removed grant restored through approval"],
    ["G5 Conversion", "Converted identities authenticate without stored secrets; legacy accounts are disabled after a clean parallel run", "VK-NPI-03, 06", "Re-enable the legacy account and revert the application's configuration"],
    ["G6 Lifecycle", "Owner change, orphan, review and decommission paths run and leave records", "VK-NPI-01, 02, 08, 09", "Reactivate or re-enable; restore within 30 days, then re-create its Conditional Access assignments"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Done", tb + 0.3, 1.0, "FaListCheck", HEX.navy, "The track is done when (design guidance): ",
    "every identity has an owner, a sponsor, a reason and a target; each is retired, re-platformed or a certificate or federated workload identity; none holds a password that never expires or is orphaned.");
  sources(s, "Sources: Implementation guide, \"The path on one page,\" \"The track at a glance\" (done when, design guidance), \"Rollback\"; Validate (G4), (G5), (G6).");
  notes(s,
`Here are the three gates of Part 2 on one page: done when, the validation step, and the rollback.

G4, least privilege, is done when high-privilege grants are justified or removed, and every Tier 1 single-tenant service principal has a workload identity policy. Kit checks VK-NPI-04, 05 and 07 prove it. Rollback: the workload identity policy goes back to report-only, and a removed grant is restored through approval, from the Step 1 export.

G5, conversion, is done when converted identities authenticate without stored secrets and legacy accounts are disabled after a clean parallel run. VK-NPI-03 and 06 prove it. Rollback: re-enable the legacy account and revert the application's configuration, which stays possible until G6 deletes the account.

G6, lifecycle, is done when the owner change, orphan, review and decommission paths run and leave records. VK-NPI-01, 02, 08 and 09 prove it; 09 is optional and preview. Rollback: reactivate the app registration or re-enable the service principal, and restore a deleted object within thirty days, then re-create its Conditional Access assignments, because a restore doesn't bring them back.

Together they finish the track's done-when, which the guide takes from the companion guide's end state as design guidance: every service account and service principal has an owner and a sponsor, a reason and a target; each is retired, re-platformed to a managed identity or gMSA, or made a certificate or federated-credential workload identity; none holds a password that never expires; and none is orphaned.`,
  `${IG}, "The path on one page"; "The track at a glance" — "Done when"; "Rollback"; "Validate (G4 Least privilege)," "Validate (G5 Conversion)," "Validate (G6 Lifecycle)."`);
}
endModule(S0);

// ================================================================== 3 G4: five surfaces
{
  const s = content(SG4, "G4: cut privilege across five surfaces");
  tag(s, "Why");
  const tb = table(s, "Steps", 1.45, [2.3, 9.85], ["Step", "What the guide does"], [
    ["4a Graph permissions", "List application permissions and delegated grants; prefer delegated where a user is present. Judge by type, not name: Mail.Send as an application permission is critical. Removing a permission from the registration doesn't revoke the grant: revoke it on the enterprise application too"],
    ["4b Directory roles", "No standing privileged role unless the record justifies it; prefer a time-bound assignment through the ticket. Privileged service principals are control-plane (Tier 0) assets; review them with PIM access reviews"],
    ["4c Azure RBAC", "Scope each managed identity's role to the resource it uses, such as Key Vault Reader on one vault, never Owner or Contributor at a subscription"],
    ["4d Attributes", "Custom security attributes on service principals let Conditional Access select applications by fact: string attributes only, evaluated at token issuance"],
    ["4e Workload CA", "For each Tier 1 single-tenant service principal: a location block and a high-risk block, report-only first"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 5.95;
  const a = panel(s, "Limits", 0.6, tb + 0.2, w, null, HEX.red, HEX.redTint, "THE LIMITS OF WORKLOAD CONDITIONAL ACCESS", null, [
    "Block is the only grant control",
    "Single-tenant service principals only: no SaaS, multitenant apps or managed identities",
    "Assign directly: a group assignment isn't enforced",
  ], 12);
  const b = panel(s, "Consent", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.navy, HEX.navyTint, "NEW GRANTS GO THROUGH TIERED APPROVAL", null, [
    "Privileged Role Administrator, through PIM, against an approved ticket",
    "Learn's caution: consenting to Graph application permissions typically requires Global Administrator; test the path in the pilot",
  ], 12);
  if (process.env.FIT) console.log(`  G4 step panels bottom ${Math.max(a, b).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 4, 4a–4e (as footnoted: Learn, least privileged roles by task; privileged roles (preview)); Book 04, Ch 05, 06, 07; Book 17, Ch 06.");
  notes(s,
`G4 cuts privilege. NIST's least privilege applies to processes acting on behalf of users, not only to users, and a workload can use its access faster and more widely than any person. The guide works through five surfaces.

4a, Graph permissions. For each service principal, list its application permissions, the app role assignments, and its delegated grants. Prefer delegated permissions where a user is present: a delegated grant gives the intersection of the user's rights and the scope, while an application permission gives everything the scope allows, across the tenant. Judge each grant by type, not by name: Mail.ReadWrite and Mail.Send are critical as application permissions. Remove grants that aren't used, and remember that removing a permission from the app registration doesn't revoke an existing grant, and tokens already issued stay valid for their lifetime. New grants go through the tiered approval: Privileged Role Administrator through PIM, against a ticket. Learn adds a caution that consenting to Graph application permissions typically requires Global Administrator, so test the path in the pilot first.

4b, directory roles. Microsoft says service principals with highly privileged roles are control-plane, Tier 0, assets. No standing privileged role for a non-person identity unless the record justifies it; prefer a time-bound assignment approved through the ticket. Review them with PIM access reviews, which need Workload ID Premium for service principals.

4c, Azure RBAC: scope each role to the resource it uses. 4d, custom security attributes, which let a Conditional Access policy select applications by attribute; only string attributes work. 4e, Conditional Access for workload identities, with its limits: block is the only grant, single-tenant service principals only, assigned directly, and Workload ID Premium to create or change a policy.`,
  `${IG}, Step 4 — 4a "Graph: application versus delegated permissions," 4b "Directory roles," 4c "Azure RBAC," 4d "Custom security attributes and Conditional Access app filters," 4e "Conditional Access for workload identities, and its limits."`);
}

// ================================================================== 4 G4: in code
{
  const s = content(SG4, "G4 in code: sweep the grants, ring the policies");
  tag(s, "How");
  const c1 = code(s, "Sweep", 0.6, 1.45, 12.15, [
    "PS> ./Invoke-NpiLeastPrivilege.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch07/estate-ch07.json `",
    ">>     -InputPath tests/fixtures/ch07/inputs -OutputPath out/least-privilege",
    "Sweep: 11 service principals, 20 grants (12 Application, 5 AzureRole, 3 Delegated); 2 skipped; 3 handed to the Privileged Access plan",
    "Findings: 7 Finding, 3 Warn, 3 Info",
    "Plan: 11 actions, 3 of them writes (1 NarrowGrant, 2 RemoveAppRole); nothing sent",
    "PS> Get-Content out/least-privilege/pa-handoff.json -Raw | ConvertFrom-Json | Format-Table Name, Reasons -Wrap",
    "Name           Reasons",
    "----           -------",
    "Build Pipeline RoleManagement.ReadWrite.Directory (can grant itself more)",
    "Deploy Bot     directory role: Cloud Application Administrator; Application.ReadWrite.All (can grant itself more)",
    "id-deploy      Contributor at subscription scope (a privileged administrator role)",
  ], { label: "CHAPTER 07, LAB 1, STEPS 3–4, IN examples/non-person-identity (COMMAND WRAPPED; OUTPUT TRIMMED)", pt: 10 });
  const c2 = code(s, "Ring", 0.6, c1 + 0.15, 12.15, [
    "PS> ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json `",
    ">>     -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca",
    "Checks: 0 Finding, 0 Warn, 2 Info",
    "Plan: 3 Create, 1 NoChange, 1 NotInRepository, 1 Update",
    "PS> ./Invoke-NpiWorkloadCa.ps1 -Mode SignIns -Cloud gcc ... -From 2026-10-12 -To 2026-10-30T12:00:00 -OutputPath out/wca-signins",
    "Ring1: ready for enforcement",
    "Ring2: not ready",
    "  Deploy Bot       WouldBlock   sign-ins 2; outside the egress ranges: 203.0.113.7",
  ], { label: "CHAPTER 08, LAB 1, STEPS 5–6 (COMMANDS WRAPPED AND SHORTENED; OUTPUT TRIMMED)", pt: 10 });
  line(s, "Rule", "Remove the grant, never the app. Every workload policy is created report-only; a ring is enforced only after D-NP5 and a reviewed sign-in summary.",
    c2 + 0.12, 0.55, 13);
  sources(s, "Sources: Developer workbook, Ch 07 (the sweep, NPI-LP-01 to -09; Lab 1, steps 3–4) and Ch 08 (the plan; enforcement; Lab 1, steps 5–6); data/kit-captures/npi/07-4, 07-5, 08-5, 08-6.");
  notes(s,
`The workbook's Chapter 07 sweeps every grant, and Chapter 08 rings the workload policies. This is the kit's real output on its fictional estate.

The sweep reads, for every service principal in Chapter 01's register, its app role assignments on every resource, its delegated grants, its directory roles, and for a managed identity its Azure role assignments. Eleven service principals, twenty grants. The two skipped are the agent identity and its blueprint, which are Chapter 09's. The check gives seven Findings: among them Mail Automation's Directory.ReadWrite.All and Mail.ReadWrite with no exception, HR Connector's exception that ended September 30, and vm-batch01's Azure roles at subscription and management group scope.

Three service principals can grant themselves more or hold a privileged administrator role, so they're handed whole to the Privileged Access plan's sweep: Build Pipeline, Deploy Bot and the managed identity id-deploy. This chapter doesn't repeat that sweep.

The plan has eleven actions and three writes: two app role removals, sent through Microsoft Graph's service principal, the resource, never the app; and one delegated grant narrowed to User.Read. Nothing is sent until a reviewer approves the plan's SHA-256, and the write path is a person's delegated session with Privileged Role Administrator.

Chapter 08 holds CA015, the location restriction, and CA037, the high-risk block, as reviewed files, rendered once per ring and always created report-only. Here the plan creates three policies and updates the named location. The sign-in summary reads eighteen days of service principal sign-ins: Ring 1 is ready; Ring 2 isn't, because Deploy Bot signed in from outside the egress ranges. Enforcement needs the CISO's decision D-NP5, the reviewed summary's hash, and the -AllowEnforce switch in that change.`,
  `${WB}, Chapter 07 — "The sweep," "The check," "The plan," "Lab 1: fixtures, no tenant," steps 3–6; Chapter 08 — "The plan, the dry run and the writes," "Enforcement, ring by ring," "The sign-in reader," "Lab 1," steps 5–8.`);
}

// ================================================================== 5 G4: requirement, evidence, rollback
{
  const s = content(SG4, "G4: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 6.55], ["Requirement", "What the ISSO keeps"], [
    ["AC-6 Least Privilege; AC-6(5) Privileged Accounts; AC-6(7) Review", "VK-NPI-05 and VK-NPI-07 runs with their justifications; PIM access review results"],
    ["CISA SCuBA MS.AAD.5.1v1 to 5.3v1 (BOD 25-01 required): app registration limited to administrators, user consent restricted, admin consent workflow", "The ScubaGear report"],
  ], { fontSize: 11.5, limit: 6.6 });
  pair(s, "G4", tb + 0.2,
    ["VALIDATE (G4) AND ROLLBACK", [
      "VK-NPI-05: each critical or high Graph application permission or privileged directory role justified, with an approver and a review date, or removed",
      "VK-NPI-04: no Tier 1 service principal outside a directly assigned policy; report-only results reviewed before On",
      "VK-NPI-07: no managed identity with Owner, Contributor or User Access Administrator above resource group without a reason",
      "Rollback: policy back to report-only; a removed grant restored through approval from the Step 1 export",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "Workload ID Premium: in Azure Government clouds through the account manager; its free trial isn't",
      "The sweep's reads and the removal: global, US Government L4 and L5 (workbook Ch 07)",
      "isPrivileged, Microsoft's privileged label: beta API, preview",
      "Interim: without Premium, existing workload policies work but can't be edited; govern managed identities by role assignments and access reviews",
    ]]);
  sources(s, "Sources: Implementation guide, Licenses, Step 4, Validate (G4), \"Evidence,\" \"Rollback\" (as footnoted: Learn, Workload ID FAQ); Developer workbook, Ch 07 (which cloud).");
  notes(s,
`G4's federal requirements and evidence. The guide maps evidence for the whole track; this deck puts each row at the gate that produces it.

AC-6, least privilege, with enhancement 5, privileged accounts, and enhancement 7, review: the ISSO keeps the VK-NPI-05 and VK-NPI-07 runs with their justifications, and the PIM access review results. CISA's SCuBA baseline MS.AAD.5.1 to 5.3, required under BOD 25-01: app registration limited to administrators, user consent restricted, and the admin consent workflow configured, so the workflow is the intake for new grants. The evidence is the ScubaGear report.

Validate. VK-NPI-05 lists every service principal holding a critical or high Graph application permission or a privileged directory role. Each row is justified in its record, with an approver and a review date, or removed. Read the permission type, not the suffix. VK-NPI-04 lists single-tenant service principals not assigned directly to a workload identity policy: pass when no Tier 1 service principal is on the list, and the report-only results have been reviewed before switching to On. VK-NPI-07: no managed identity holds Owner, Contributor or User Access Administrator above resource-group scope without a recorded reason.

Availability. Workload ID Premium is available in the Azure Government clouds through the account manager, and its free trial isn't. The workbook's Chapter 07 lists the sweep's Graph reads and the app role removal for the global service and US Government L4 and L5. Microsoft's isPrivileged label is in the beta API and in preview.

The interim path: without Workload ID Premium, existing workload policies keep working but can't be edited. Managed identities are never covered, so govern them through role assignments and access reviews. Rollback: the policy back to report-only, and a removed grant restored through approval from the Step 1 export.`,
  `${IG}, "Licenses"; Step 4 — 4b, 4e; "Validate (G4 Least privilege)"; "Evidence"; "Rollback"; ${WB}, Chapter 07 — "Which cloud, for this sweep and these writes."`);
}
endModule(SG4);

// ================================================================== 6 G5: parallel run
{
  const s = content(SG5, "G5: build the target, run in parallel, then disable");
  tag(s, "What");
  const tb = table(s, "Run", 1.45, [2.6, 9.55], ["Step", "What happens"], [
    ["1 Build the target", "A managed identity with its role assignments; a federated credential, tested by an actual token exchange; a certificate from the vault; or a gMSA on the hosts allowed to retrieve it"],
    ["2 Owners and rotation", "Two human owners and a rotation schedule"],
    ["3 Run both for 30 days", "The application uses the new identity; the legacy account stays enabled. Watch the new identity's sign-ins in Entra and the legacy account's logons on domain controllers"],
    ["4 Disable, don't delete", "An AD account is disabled and moved to a holding OU. A secret is removed only after the new credential has carried production traffic"],
    ["5 Record the result", "The target achieved, the date and the disabled object's ID"],
  ], { fontSize: 12, limit: 6.6 });
  line(s, "Phase", "This is Book 02's Phase 4: Phase 3 complete, the inventory classified, six to eight weeks. The order is managed identity, then federated credential, then certificate.",
    tb + 0.25, 0.6, 13.5);
  sources(s, "Sources: Implementation guide, Step 5, steps 1–5; Book 02, Ch 10 (Phase 4); Developer workbook, Ch 05 (what the code depends on: the order).");
  notes(s,
`G5 converts each identity to the target G2 chose. It's Book 02's Phase 4: it needs Phase 3 to be complete and the inventory classified, and it takes six to eight weeks. Book 02 converts the high-risk accounts first, and its order is managed identities for Azure-hosted workloads, federated credentials for pipelines and other OIDC-capable hosts, and certificates only where neither applies.

Step 1 builds the target: a managed identity with its role assignments; a federated credential on the app registration, tested by an actual token exchange; a certificate credential from the vault; or a gMSA installed on the hosts allowed to retrieve it.

Step 2 gives it two human owners and a rotation schedule.

Step 3 runs old and new in parallel for thirty days. The application uses the new identity, and the legacy account stays enabled. Watch both: the new identity's sign-ins in the Entra service principal sign-in logs, and the legacy account's logons on the domain controllers.

Step 4 disables the legacy account. Don't delete it. For an AD account, disable it and move it to a holding OU. For an app registration losing a secret, remove the secret only after the new credential has carried production traffic.

Step 5 records the result in the identity's record: the target achieved, the date, and the disabled object's ID. That's how G6 later knows what to delete, and when.

Two dangers belong here. A federated credential with a broad subject lets every workload on that issuer in, and a wrong subject fails only at runtime. So use exact subjects per branch or environment, approve each credential as a change, and test the exchange.`,
  `${IG}, Step 5, steps 1–5; "Dangers" — "Federation trusts too much"; Book 02, Chapter 10 — "Phase 4: service account modernization"; ${WB}, Chapter 05 — "What the code depends on."`);
}

// ================================================================== 7 G5: in code
{
  const s = content(SG5, "G5 in code: test the exchange, plan the Kerberos moves");
  tag(s, "How");
  const c1 = code(s, "Wif", 0.6, 1.45, 12.15, [
    "PS> ./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json `",
    ">>     -CutoverLogPath tests/fixtures/ch05/cutover-log.csv -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation",
    "Conversions: 8 in 2 wave(s); token exchange tests: 4 passed, 2 failed",
    "Findings: 7 Finding, 1 Warn",
    "Plan: 20 actions, 4 of them writes (2 CreateCredential, 1 CreateIdentity, 1 DisableLegacy); nothing sent",
    "PS> Get-Content out/federation/conversion-records.json -Raw | ConvertFrom-Json | ForEach-Object { ... } | Format-Table",
    "Id      Target              Gate     Run                  Day",
    "--      ------              ----     ---                  ---",
    "conv-01 managedIdentity     Ready    ReadyToDisableLegacy  40",
    "conv-02 federatedCredential Blocked  AwaitingCutover",
    "conv-07 managedIdentity     Ready    ParallelRunning       15",
    "conv-08 federatedCredential Ready    LegacyStillInUse      59",
  ], { label: "CHAPTER 05, LAB 1, STEPS 3 AND 6 (COMMANDS WRAPPED AND SHORTENED; OUTPUT TRIMMED)", pt: 10 });
  const c2 = code(s, "Krb", 0.6, c1 + 0.15, 12.15, [
    "PS> ./Invoke-NpiKerberosIsland.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json `",
    ">>     -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -InputPath tests/fixtures/ch06/inputs -OutputPath out/kerberos",
    "Kerberos accounts: 9 in scope; KDS root key Ready",
    "Plan: 9 actions, 4 of them writes (1 CompleteDmsaMigration, 2 CreateGmsa, 1 SetRetrievers); nothing sent",
    "Island list: 5 accounts, 3 ready for P4.6; hand-off ready: False",
    "Reconciliation (D11 KerberosIsland): 1 HandedOff, 1 MovesToWorkloadIdentity, 3 OnIslandList, 1 Unreconciled",
  ], { label: "CHAPTER 06, LAB 1, STEP 3 (COMMAND WRAPPED; OUTPUT TRIMMED)", pt: 10 });
  line(s, "Rule", "A wrong subject is created without error and fails only at the exchange, so the test runs before cutover. Every gMSA and dMSA ends moved, retired or on the island with a date.",
    c2 + 0.12, 0.55, 13);
  sources(s, "Sources: Developer workbook, Ch 05 (NPI-WIF-01 to -09; the plan; Lab 1, steps 3–6) and Ch 06 (NPI-KRB-01 to -09; Lab 1, steps 3–6); data/kit-captures/npi/05-3, 05-6, 06-4.");
  notes(s,
`The workbook's Chapter 05 holds a wave's conversions as one reviewed file, and Chapter 06 plans the Kerberos accounts. This is the kit's real output on its fixtures.

Learn says it twice: a federated credential with the wrong subject is created successfully without error, and the error appears only when the token exchange fails. So Chapter 05 derives the issuer, subject and audience each workload's issuer will present, and exchanges a test assertion against a fake token endpoint before any cutover. Here two of six tests fail. payroll-prod copies a sample's issuer, trailing slash and all, and names the environment Production where the workflow's is lower-case production. github-intranet-tag copies a template's audience with a leading space. Another Finding gives an Azure Functions app a certificate when a managed identity is available, out of the plan's order.

The conversion records track each parallel run. conv-01 has run forty days with the new identity signing in and no logon by the old account, and its owner approved: it's the one disable in the plan, and the account is disabled, never deleted. conv-07 is on day fifteen of thirty. conv-08's old secret still signed in eight weeks after cutover, so its run isn't clean.

Chapter 06 turns each Kerberos account's reviewed disposition into a plan: an MSA and an IIS application pool account each get a new gMSA, a dMSA migration started forty days ago can complete, and one gMSA's password retrievers are set to the reviewed list. Every account that stays on Kerberos goes on the island list with an SPN owner and an end date. Here only three of five are ready for the program's SPN retirement, and one planned gMSA isn't reconciled with the end state. The writes run only from a plan whose SHA-256 a reviewer approved.`,
  `${WB}, Chapter 05 — "The checks," "The plan," "Lab 1: fixtures, no tenant," steps 3–6; Chapter 06 — "The check and the plan," "The island list and the reconciliation," "Lab 1," steps 3–6.`);
}

// ================================================================== 8 G5: requirement, evidence, rollback
{
  const s = content(SG5, "G5: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 6.55], ["Requirement", "What the ISSO keeps"], [
    ["IA-5 Authenticator Management; IA-5(2)", "VK-NPI-02 and VK-NPI-03 runs; the application management policy export; the rotation calendar"],
    ["IA-9 Service Identification and Authentication (in no baseline, so tailored in)", "Graph permission grants per workload identity; the service principal sign-in log"],
    ["Book 02's Phase 4 validation criteria", "No stored secrets where possible; no disruption during the parallel run; workload policies enforced"],
  ], { fontSize: 11.5, limit: 6.6 });
  pair(s, "G5", tb + 0.2,
    ["VALIDATE (G5) AND ROLLBACK", [
      "VK-NPI-06: no high-risk account still enabled with a password that never expires, outside a dated exception",
      "VK-NPI-03: the converted apps no longer hold secrets",
      "Rollback: re-enable the legacy account and revert the app's configuration; possible until G6 deletes the account",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "Creating a federated credential and listing sign-ins: global, US Government L4 and L5 (workbook Ch 05)",
      "dMSA: Windows Server 2025 on every host and a domain controller (workbook Ch 06)",
      "Interim (design guidance): an account that can't move yet stays on the Kerberos island, with an SPN owner and an end date",
    ]]);
  sources(s, "Sources: Implementation guide, Step 5, Validate (G5), \"Evidence,\" \"Rollback\"; Book 02, Ch 10; Developer workbook, Ch 05 (which cloud) and Ch 06 (rules; dangers).");
  notes(s,
`G5's federal requirements and evidence.

IA-5, authenticator management, with enhancement 2: managed identities and federation first, certificates in a vault and rotated, no new secrets. The ISSO keeps the VK-NPI-02 and VK-NPI-03 runs, the application management policy export from Part 1's G3, and the rotation calendar. IA-9, service identification and authentication, is in no baseline, so it's tailored in: services and workloads authenticate as themselves to Entra ID. The evidence is the Graph permission grants per workload identity and the service principal sign-in log, which is also where the parallel run's new sign-ins show. And Book 02's validation criteria for Phase 4: new identities authenticate without stored secrets where possible, there was no service disruption during the parallel run, and workload identity policies are enforced.

Validate. Every high-risk account is converted or retired: VK-NPI-06 shows none still enabled with a password that never expires, outside a dated exception. VK-NPI-03 shows the converted apps no longer hold secrets.

Availability, as the workbook states it. Creating a federated credential on an application, and listing sign-ins, are both available in US Government L4 and L5. The Resource Manager pages for user-assigned identities don't state Azure Government availability; this estate's Azure is commercial. A dMSA needs Windows Server 2025 on every host and at least one domain controller, and no unconstrained delegation.

The interim path, design guidance from Chapter 06: an account that can't move yet stays on the Kerberos island, with an SPN owner and an end date no later than the program's legacy-authentication date. The island list is what the program's SPN retirement works from.

Rollback: re-enable the legacy account and revert the application's configuration. It stays possible until G6 deletes the account, which is why G5 disables and never deletes.`,
  `${IG}, Step 5 — "Validate (G5 Conversion)"; "Evidence"; "Rollback"; Book 02, Chapter 10 — "Phase 4"; ${WB}, Chapter 05 — "Which cloud, for these reads and writes"; Chapter 06 — "The context the code depends on," "Dangers."`);
}
endModule(SG5);

// ================================================================== 9 G6: owner change, orphans, reviews
{
  const s = content(SG6, "G6: owner change, orphans and owner reviews");
  tag(s, "Who");
  const w = 3.88;
  const a = panel(s, "Owner", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "OWNER CHANGE", null, [
    "Starts at least ten business days ahead",
    "The business approver nominates a successor; the governance office approves",
    "A step in the departing person's HR mover and leaver workflows",
  ], 12);
  const b = panel(s, "Orphan", 0.6 + w + 0.255, 1.45, w, null, HEX.red, HEX.redTint, "ORPHANS: BOOK 04'S POLICY", null, [
    "Reclassified as Tier 1; the governance office takes interim ownership",
    "30 days to assign an owner or start decommissioning",
    "Day 31: access suspended, preferably by deactivating the app",
    "An AI agent: disabled once confirmed",
  ], 12);
  const c = panel(s, "Review", 0.6 + 2 * (w + 0.255), 1.45, w, null, HEX.teal, HEX.tealTint, "OWNER REVIEWS", null, [
    "App owners review permissions quarterly",
    "At least two owners per app where possible",
    "Owners valid, permissions needed, unused credentials removed, record matches",
  ], 12);
  const top = Math.max(a, b, c);
  const d = panel(s, "Idle", 0.6, top + 0.2, 12.15, null, HEX.amber, HEX.amberTint, "INACTIVITY IS A SECOND ORPHAN SIGNAL", null, [
    "Microsoft's service principal sign-in activity report gives each one's last use. The report is preview and its API is beta",
    "Workload ID Premium adds app health recommendations for unused and inactive workload identities",
  ], 12);
  if (process.env.FIT) console.log(`  G6 panels bottom ${d.toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 6, \"Owner change,\" \"Orphans,\" \"Access reviews of owners\" (as footnoted: Learn, usage and insights); Book 04, Ch 05, 06; Book 17, Ch 05.");
  notes(s,
`G6 runs the lifecycle. A non-person identity's events come from its owning system and from credential expiry, not from HR. The one exception is the sponsor's own mover and leaver events.

Owner change. An owner who leaves or changes roles starts a transfer at least ten business days ahead. The business approver nominates a successor, and the identity governance office approves. Add the step to the departing person's HR-driven mover and leaver workflows, so the trigger is HR's and nobody has to remember it. Lifecycle Workflows supports custom task extensions for that, under Entra ID Governance.

Orphans. An application is orphaned when it has no named owner in the registry or the Owners list. Book 04's policy: it's reclassified as Tier 1; the identity governance office takes interim ownership and a ticket opens; there are thirty days to assign an owner or start decommissioning; and at day thirty-one, access is suspended, preferably by deactivating the app. For AD service accounts, an account with no owner after Step 1 is a retirement candidate. For an AI agent, a person disables it once the finding is confirmed, without waiting thirty days, because an agent can act.

Inactivity is a second orphan signal. Microsoft's service principal sign-in activity report gives the last time each service principal was used. The report is preview and its Graph API is beta. Workload ID Premium adds app health recommendations for unused and inactive workload identities.

Owner reviews. App owners review their delegated and application permissions on a recurring cadence, quarterly by the program's standard. Microsoft recommends reviewing owners every few months and keeping at least two owners per app where possible. Each attestation covers four things: the owners are still valid, the permissions are still needed, unused credentials are removed, and the record matches. Privileged service principals also get G4's PIM access reviews.`,
  `${IG}, Step 6 — "Owner change," "Orphans," "Access reviews of owners"; Book 04, Chapter 05 — "Ownership"; Chapter 06 — "Ownership changes and orphaned apps"; Book 17, Chapter 05 — "When the sponsor moves or leaves," "The orphaned agent."`);
}

// ================================================================== 10 G6: decommission
{
  const s = content(SG6, "G6: disable first, then delete");
  tag(s, "How");
  const tb = table(s, "Decom", 1.45, [2.55, 4.85, 4.75], ["Identity", "Disable", "Then delete"], [
    ["AD account or gMSA", "Disable; remove SPNs only after the observation period; log the decision", "After the observation window; check for SPN dependencies first"],
    ["App registration", "Deactivate: new tokens stop at once, existing ones stay valid until they expire. Remove other owners first", "Soft-deleted, restorable for 30 days; multitenant app objects must be removed by hand"],
    ["Service principal (this tenant)", "Enabled for users to sign-in? set to No: blocks tokens in this tenant only", "A restore brings it back without its policies, such as Conditional Access"],
    ["User-assigned managed identity", "Remove its role assignments", "Delete the Azure resource; customers can't recover it"],
    ["Agent identity or blueprint", "Disable: a sponsor can, but can't re-enable", "A blueprint's deletion cascades to its agents; restorable for 30 days"],
  ], { fontSize: 11.5, limit: 6.6 });
  line(s, "Audit", "File the audit entry with the decision: a deactivation shows as Update application, with the isDisabled property's old and new values.",
    tb + 0.25, 0.6, 13.5);
  sources(s, "Sources: Implementation guide, Step 6, \"Decommissioning\" (as footnoted: Learn, deactivate an app registration; restore; recover from deletions); Book 04, Ch 05; Book 17, Ch 05.");
  notes(s,
`Decommissioning follows the books' rule: deactivate first, so that nothing breaks silently, then revoke grants, remove credentials and delete. The mechanics differ by type.

An AD account or gMSA: disable it, remove its SPNs only after the observation period, and log the decision. Delete after the observation window, and check for SPN dependencies first; Book 06's runbook R08 covers the application chain.

An app registration: deactivate it. New tokens stop at once, existing tokens stay valid until they expire, and the configuration is kept. Remove the other owners first, so only an administrator can reactivate it. A deleted app registration is soft-deleted and restorable for thirty days, and multitenant application objects aren't hard-deleted automatically after thirty days, so they must be removed by hand.

A service principal in this tenant: set Enabled for users to sign-in to No, which blocks tokens in this tenant only. Then delete; a restore brings the configuration back, except its policies, such as Conditional Access.

A user-assigned managed identity: remove its role assignments, then delete the Azure resource. Soft-deleted managed identity service principals can't be recovered by customers.

An agent identity or blueprint: disable it. A sponsor can disable an agent, but can't re-enable it. A blueprint's deletion cascades to its agent identities asynchronously, and they're restorable for thirty days.

In the Entra audit log, a deactivation or reactivation appears as Update application, with the isDisabled property's old and new values. File that entry with the decision record.

The dangers here are the guide's: disabled isn't revoked, because tokens already issued stay valid, so for an incident also rotate or remove the credentials; and deleting too soon loses what a restore can't bring back.`,
  `${IG}, Step 6 — "Decommissioning: disable first, then delete"; "Dangers" — "Disabled isn't revoked," "Deleting too soon"; Book 04, Chapter 05 — "Governing app registrations"; Book 17, Chapter 05 — "Retirement."`);
}

// ================================================================== 11 G6: in code
{
  const s = content(SG6, "G6 in code: drift, the review cycle, the evidence chain");
  tag(s, "How");
  const c1 = code(s, "Drift", 0.6, 1.45, 12.15, [
    "PS> ./Invoke-NpiDriftRun.ps1 @lab -FixturePath tests/fixtures/ch10/estate-day2.json -AsOf 2026-10-30T06:00:00Z `",
    ">>     -BaselinePath $base -ApprovedBaselineSha256 $sha",
    "Run 2026-10-30T0600Z-fixture (Fixture, gcc): inventory OK, ownership OK, drift OK",
    "Drift findings: 18 Finding, 11 Warn, 5 Info; baseline candidate SHA-256 fbe346457c070d6bb7de0fbb43f35d54315b42d46e6ba26b245d33efa6dc840c",
    "PS> Get-Content out/runs/2026-10-30T0600Z-fixture/drift/findings.json -Raw | ConvertFrom-Json |",
    ">>     Group-Object Rule, Severity | Sort-Object Name | Format-Table Name, Count",
    "NPI-DRF-03, Finding     7",
    "NPI-DRF-04, Warn        2",
    "NPI-DRF-06, Finding     3",
    "NPI-DRF-07, Finding     3",
    "NPI-REV-01, Finding     2",
    "# then in examples/drift-pipeline, after packaging both days",
    "$ python python/npi_evidence.py period --evidence out/evidence --since 2026-10-28T06:00:00Z --until 2026-10-30T06:00:00Z \\",
    "    --vintage tests/fixtures/npi-vintage/vintage-2026 --out out/periods",
    "{\"chain_breaks\": 0, \"closed\": 1, \"complete\": false, \"coverage_gaps\": 0, \"opened\": 19, \"packages\": 2, \"period\": \"period-2026-10-28_2026-10-30\"}",
    "(exit code 2)",
  ], { label: "CHAPTER 10, LAB 1, STEPS 4, 5 AND 9 (@lab AND $base FROM STEPS 3–4; COMMANDS WRAPPED; OUTPUT TRIMMED)", pt: 10 });
  const tb = table(s, "Read", c1 + 0.15, [1.9, 10.25], ["Rule", "In the lab run"], [
    ["NPI-DRF-03, 04", "Seven ownerless orphan candidates (the orphan rule decides; this code disables nothing); two apps unused for over 90 days"],
    ["NPI-DRF-06, 07", "Three AD accounts whose password never expires; three credentials added outside the pipeline"],
    ["NPI-REV-01", "App registrations whose last owners' review is more than 92 days old, Mail Automation's among them"],
  ], { fontSize: 11, limit: 6.6 });
  if (process.env.FIT) console.log(`  read bottom ${tb.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 10 (the run; NPI-DRF-01 to -09; NPI-REV-01 to -04; the package and the period; Lab 1, steps 3–9); data/kit-captures/npi/10-4, 10-5, 10-9.");
  notes(s,
`The workbook's Chapter 10 makes G6's checks a scheduled run. Each run re-runs Chapters 01 and 02, reads the Entra audit log for the window, and compares each identity's fingerprint with a baseline someone approved by its SHA-256. This is the second fixture day, against day one's approved baseline.

The drift findings follow Learn's own definitions and the plan's. NPI-DRF-03: seven ownerless orphan candidates from Chapter 02's run; the orphan rule decides, and this code disables nothing. NPI-DRF-04: two apps with no sign-in for over ninety days, Legacy Reports and Old SAML Connector; Learn calls an application unused after ninety days. NPI-DRF-06: three enabled AD accounts whose password never expires. NPI-DRF-07: three credentials added outside the pipeline, among them a secret a person added to HR Connector. A credential counts as the pipeline's only when the initiator is a reviewed pipeline identity and the key is in Chapter 04's credential log. The two pipeline rotations aren't flagged.

The review cycle reads the records Chapters 07 and 09 write. NPI-REV-01: Mail Automation's last owners' review, May 1, is older than the program's ninety-two days. NPI-REV-02 and 03 cover agent sponsor attestation and access expiry.

Then the drift pipeline packages each run with a SHA-256 per file and the tenant ID, chained to the previous package's manifest, so a replaced package or a missing day shows as a break. The period command is what the ISSO receives: no chain breaks, no coverage gaps, nineteen findings opened and one closed. It isn't complete, and exits 2: none is orphaned and no password that never expires are not met, and Chapters 03 and 06 haven't sent their findings. The control mapping in the period is the program's reading; the assessor decides.`,
  `${WB}, Chapter 10 — "The run," "The approved baseline," "The register drift findings," "The review cycle," "The package and the chain," "What the ISSO receives," "Lab 1: fixtures, no tenant," steps 3–9.`);
}

// ================================================================== 12 G6: requirement, evidence, rollback
{
  const s = content(SG6, "G6: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 6.55], ["Requirement", "What the ISSO keeps"], [
    ["AC-2 Account Management; AC-2(3) Disable Accounts", "The Step 1 record; owner-change and decommission tickets; VK-NPI-01 and VK-NPI-08 runs"],
    ["IA-4 Identifier Management", "The record, keyed by object ID and system ID, never reused"],
    ["AU-2, AU-6, AU-12", "Logs routed out of Entra ID to the SIEM; audit entries for credential adds and isDisabled changes"],
  ], { fontSize: 11.5, limit: 6.6 });
  pair(s, "G6", tb + 0.2,
    ["VALIDATE (G6) AND ROLLBACK", [
      "VK-NPI-01 and VK-NPI-02 weekly: a new zero- or single-owner app opens a ticket that week; no unplanned expiry",
      "VK-NPI-08: no agent without a confirmed sponsor past ten business days",
      "VK-NPI-09 (optional, preview; -IncludePreview): every service principal idle 90 days is in a ticket",
      "One test owner change and one test decommission, end to end",
      "Rollback: reactivate or re-enable; restore within 30 days, then re-create CA assignments",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "Sign-in activity report: preview, beta, global service only; GCC uses the commercial service, so it's available",
      "Not listed for US Government L4 or L5: the run records the unused check as not read (workbook Ch 10)",
      "Owner-change tasks: Lifecycle Workflows custom task extensions, under Entra ID Governance",
      "Interim: where agent features aren't available, the same lifecycle on the service principals agents run as",
    ]]);
  sources(s, "Sources: Implementation guide, Step 6, Validate (G6), \"Evidence,\" \"Rollback\" (as footnoted: Learn, servicePrincipalSignInActivities); Developer workbook, Ch 10 (which cloud).");
  notes(s,
`G6's federal requirements and evidence.

AC-2, account management, with enhancement 3, disable accounts: non-person identities are a defined account type with an owner and a sponsor, and orphaned and retired identities are disabled. The ISSO keeps the Step 1 record, the owner-change and decommission tickets, and the VK-NPI-01 and VK-NPI-08 runs. IA-4, identifier management: each identity has its own identifier, joined to its record and never reused, so the record is keyed by object ID and system ID. AU-2, AU-6 and AU-12: service principal sign-ins, credential changes and deactivations are logged and reviewed. The evidence is the logs routed out of Entra ID to the SIEM, and the audit entries for credential adds and isDisabled changes.

Validate. VK-NPI-01 runs weekly, and a new zero-owner or single-owner app opens a ticket the same week. VK-NPI-02 runs weekly, and no production credential expires unplanned. VK-NPI-08: no agent identity without a confirmed sponsor beyond the ten-business-day grace period. VK-NPI-09 is optional and preview: it's off by default and runs with -IncludePreview, and every service principal with no sign-in in ninety days, the program's design guidance, is in an orphan or decommission ticket. And one test owner change and one test decommission have run end to end and left their records.

Availability. The sign-in activity API is listed for the global service and not for US Government L4 or L5. A GCC tenant uses the commercial service, so it's available there. The workbook adds that a GCC High or DoD run doesn't send the call, and records the unused check as not read. Owner-change tasks run as Lifecycle Workflows custom task extensions under Entra ID Governance. Where the agent features aren't available, run this lifecycle on the service principals the agents run as.

Rollback: reactivate the app registration or re-enable the service principal; restore a deleted object within thirty days, then re-create its Conditional Access assignments.`,
  `${IG}, Step 6 — "Orphans," "Validate (G6 Lifecycle)"; "Evidence"; "Rollback"; "AI agents"; ${WB}, Chapter 10 — "Which cloud, for this read."`);
}
endModule(SG6);

// ================================================================== 13 SQL Server
{
  const s = content(SX, "SQL Server: the engine, the instance, the applications");
  tag(s, "What");
  const tb = table(s, "Sql", 1.45, [2.9, 9.25], ["Principal", "The rule"], [
    ["The engine's service account", "A gMSA or domain account works only while AD is authoritative. Arc doesn't replace the Windows account the service runs as; it changes the identity Entra ID and Azure see"],
    ["The instance's Entra identity", "SQL Server 2025: the Arc server's system-assigned managed identity, with no credential. SQL Server 2022: an app registration whose Key Vault certificate needs a named renewal owner and isn't rotated automatically"],
    ["Application principals", "ETL, reporting and API back ends move from SQL logins to FROM EXTERNAL PROVIDER logins: a managed identity first, a Key Vault certificate where a credential is unavoidable, a secret only as a documented exception"],
    ["The same parallel run", "Create, validate, disable, observe for 30 days with audit evidence, then drop"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 5.95;
  const a = panel(s, "Cert", 0.6, tb + 0.2, w, null, HEX.red, HEX.redTint, "A RENEWED CERTIFICATE NOBODY UPLOADED", null, [
    "The vault renews; the app registration keeps the old certificate and fails at expiry",
    "Automate the upload; VK-NPI-02 at 60 days",
  ], 12);
  const b = panel(s, "Arc", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.amber, HEX.amberTint, "ONE MANAGED IDENTITY, MANY PROCESSES", null, [
    "On an Arc server every permitted process presents the same principal",
    "One login per server is the unit of attribution; keep the local group small",
  ], 12);
  if (process.env.FIT) console.log(`  SQL panels bottom ${Math.max(a, b).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, \"SQL Server service and application principals,\" \"Dangers\" (as footnoted: Learn, rotate certificates for Arc-enabled SQL Server); Book 06, Ch 02, 09, 11.");
  notes(s,
`SQL Server follows the same logic, and Book 06 carries it. There are three kinds of principal.

The engine's service account. A gMSA or a domain service account works only while AD is authoritative. Azure Arc doesn't replace the Windows account the service runs as; it changes the identity that Entra ID and Azure see.

The instance's Entra identity. On SQL Server 2025 it's the Arc server's system-assigned managed identity, with no credential to manage. On SQL Server 2022 it's an app registration whose Key Vault certificate needs a named renewal owner, and isn't rotated automatically. Book 06's runbook R04 deploys it.

Application principals. ETL, reporting and API back ends replace SQL Authentication logins with FROM EXTERNAL PROVIDER logins for Entra applications: a managed identity first, a certificate in Key Vault where a credential is unavoidable, and a client secret only as a documented exception.

And the same parallel run as G5: create, validate, disable, observe for thirty days with audit evidence, then drop. Book 06's Chapter 19 covers the connection strings.

Join every SQL application principal to its record in Step 1, and run VK-NPI-02 and VK-NPI-05 over them like any other service principal. The workbook's Chapter 01 hands SQL Server's AD accounts to the Data Platform plan, so they appear in the register as handed off.

Two dangers belong to SQL Server. A renewed certificate nobody uploaded: the vault renews, the app registration keeps the old certificate, and the instance fails at expiry. Learn's rotation procedure for Arc-enabled SQL Server is to upload the new certificate to the app registration and delete the old one after twenty-four hours. Automate the upload, and run VK-NPI-02 at sixty days. And one managed identity, many processes: on an Arc server every permitted process presents the same principal, so treat one login per server as the unit of attribution, and keep the local group small.`,
  `${IG}, "SQL Server service and application principals"; "Dangers" — "A renewed certificate nobody uploaded," "One managed identity, many processes"; Book 06, Chapters 02, 09, 11, 19; Runbooks R04, R08.`);
}

// ================================================================== 14 AI agents
{
  const s = content(SX, "AI agents: sponsors, blueprints and gated creation");
  tag(s, "Who");
  const w = 5.95;
  const a = panel(s, "Rules", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "BOOK 17'S ADDITIONS", null, [
    "A sponsor at creation; the blueprint is the credential boundary",
    "Users can create agent blueprints: No; a production handshake first",
    "No secret on a production blueprint; each API key an exception",
    "Access through packages with end dates: expiry is the review",
  ], 11.5);
  const tb = table(s, "Avail", 1.45, [2.75, 1.75, 1.45], ["Capability", "Stage", "GCC"], [
    ["Agent ID: blueprints, identities, sponsors", "GA, April 2026", "A partial subset"],
    ["Sponsor lifecycle workflows", "GA, May 2026", "Available"],
    ["Agent CA; agent risk", "Preview", "Delegated access"],
  ], { fontSize: 10.5, x: 0.6 + w + 0.25, limit: 6.6 });
  const top = Math.max(a, tb);
  const c1 = code(s, "Agent", 0.6, top + 0.15, 12.15, [
    "PS> ./Invoke-NpiAgentId.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership `",
    ">>     -FixturePath tests/fixtures/ch09/agent-estate.json -InputPath tests/fixtures/ch09/inputs -OutputPath out/agent-id",
    "D-NP6 (Proposed): AgentId mode in cloud 'gcc'; agent Conditional Access Preview (policy builder label); agent risk Preview",
    "AI identities: 8 checked (4 AgentIdentity, 3 AgentIdentityBlueprint, 1 ServicePrincipal); Chapter 02 sponsor fields filled: 2 of 2",
    "Findings: 22 Finding (4 P1, 2 P2), 6 Warn, 4 Info. Orphan candidates for Chapter 02: 2",
  ], { label: "CHAPTER 09, LAB 1, STEP 4 (COMMAND WRAPPED; OUTPUT TRIMMED)", pt: 10 });
  line(s, "High", "GCC High and DoD: no published availability, so treat the agent features as unavailable and govern the service principals agents run as.",
    c1 + 0.1, 0.55, 13);
  sources(s, "Sources: Implementation guide, \"AI agents\"; Book 17, Ch 04, 05, 06; Developer workbook, Ch 09 (D-NP6 as data; NPI-AI-01 to -23; Lab 1, steps 4–7); data/kit-captures/npi/09-5.");
  notes(s,
`AI agents are non-person identities and follow this guide, with additions from Book 17.

Sponsors and blueprints. A sponsor is required when an agent identity or blueprint is created. The blueprint holds the credentials and is the credential boundary: one disable, grant revocation or Conditional Access policy on it reaches every agent created from it. The program's rule is an HR-mastered federal sponsor, a small dynamic sponsoring group, a technical owner who isn't the sponsor, and an inventory record that names the same sponsor.

Creation is gated. Set Users can create agent blueprints to No, the agent analog of MS.AAD.5.1v1, and run a production handshake before any agent goes live. Credentials follow Step 3's order, with no secret on a production blueprint. An agent that calls a tool with an API key bypasses Entra ID entirely, so record each key as an exception with an owner, a vault and a rotation date. And recertification is by expiry: access through access packages with end dates, so a sponsor who does nothing removes access.

Availability, as Book 17 states it. The Agent ID platform has been generally available since April 2026, with a documented partial subset in GCC. Sponsor lifecycle workflows have been generally available since May 2026. Agent targeting in Conditional Access and the agent risk condition are preview, available in GCC for agents with delegated access. The agent's user account is preview in Frontier program tenants only, and Agent 365's FedRAMP High authorization was pending as of October 1, 2026. For GCC High and DoD, Microsoft has published no availability.

The workbook's Chapter 09 holds that as decision D-NP6, proposed, in data. In GCC it reads the blueprints and agents: here twenty-two Findings, four of them priority one drift, such as a shadow agent no record names. Run in GCC High, it falls back to the same rules on the service principals.`,
  `${IG}, "AI agents"; Book 17, Chapter 04 — "The object model," "Release stage, licensing and government clouds"; Chapter 05 — "Creation," "Recertification: expiry is the review"; Chapter 06 — "No stored secrets"; ${WB}, Chapter 09 — "Decision D-NP6 as data," "The checks," "Lab 1," steps 4–7.`);
}
endModule(SX);

// ================================================================== 15 Evidence and rollback
{
  const s = content(SE, "Evidence and rollback across the track");
  tag(s, "What");
  const tb = table(s, "Ev", 1.45, [5.6, 6.55], ["Requirement", "Evidence to file"], [
    ["AC-2, AC-6, IA-4, IA-5, IA-9, AU-2, AU-6, AU-12 and their enhancements", "The record; the tickets; the VK-NPI runs with justifications; PIM review results; the policy export; sign-in and audit logs"],
    ["CISA SCuBA MS.AAD.5.5v1 to 5.7v1 (SHOULD, ScubaGear 2.0.0): no app passwords, lifetimes capped", "The ScubaGear report; VK-NPI-02"],
    ["CISA SCuBA MS.AAD.9.1v1, risky AI agents blocked: marked required in ScubaGear, not on CISA's Required Configurations page (October 26, 2026)", "Recorded per tenant now; enforced when the agent risk condition is generally available in the agency's cloud"],
  ], { fontSize: 11, limit: 6.6 });
  const tb2 = table(s, "Back", tb + 0.2, [2.4, 9.75], ["Step", "Rollback"], [
    ["1–3 (Part 1)", "Inventory: read-only. Decision: re-decide; the record keeps the history. Credential rules: an exception with an end date"],
    ["4 Least privilege", "Workload identity policy back to report-only; a removed grant restored through approval from the Step 1 export"],
    ["5 Conversion", "Re-enable the legacy account and revert the application's configuration"],
    ["6 Decommission", "Reactivate or re-enable; restore a deleted object within 30 days, then re-create its Conditional Access assignments"],
  ], { fontSize: 11, limit: 6.6 });
  if (process.env.FIT) console.log(`  rollback bottom ${tb2.toFixed(2)}`);
  sources(s, "Sources: Implementation guide, \"Evidence\" (the mapping is the program's, from the books cited), \"Rollback\"; Book 02, Ch 10; Book 17, Ch 06, Appendix A.");
  notes(s,
`The guide's evidence table maps the whole track. The mapping is the program's, from the books cited, and where a book maps a control, that book governs.

The controls the three gates of Part 2 and the three of Part 1 produce evidence for are AC-2 and its disable enhancement, AC-6 with privileged accounts and review, IA-4, IA-5, IA-9, which is tailored in, and AU-2, AU-6 and AU-12. Together the evidence is the record, the owner-change and decommission tickets, the VK-NPI runs with their justifications, the PIM access review results, the application management policy export and the rotation calendar, and the sign-in and audit logs routed out of Entra ID.

Three SCuBA rows sit across the track. MS.AAD.5.1 to 5.3, required under BOD 25-01, appeared with G4. MS.AAD.5.5 to 5.7 are SHOULD policies in ScubaGear 2.0.0: no app passwords, and password and certificate lifetimes capped, which is G3's application management policy. And MS.AAD.9.1v1, risky AI agents blocked, is marked as a BOD 25-01 requirement in ScubaGear, but wasn't on CISA's Required Configurations page on October 26, 2026. The program records it per tenant now and enforces it when the agent risk condition is generally available in the agency's cloud.

Run the checks on the continuous monitoring cadence, and file their output with the date, the tenant and the check version. Book 02's scheduled drift comparison is where a regression shows up as an issue.

Rollback, by step. The inventory is read-only, so there's nothing to roll back. A decision is re-decided, and the record keeps the history. A credential rule gets a per-application exception with an end date. A least-privilege change goes back to report-only, or a grant comes back through approval. A conversion re-enables the legacy account. And a decommission reactivates, re-enables or restores within thirty days.`,
  `${IG}, "Evidence"; "Rollback"; Book 02, Chapter 10 — "Git-based drift detection"; Book 17, Appendix A; Chapter 06 — "Enforcing the order."`);
}
endModule(SE);

// ================================================================== 16 Close
{
  const s = content(SC, "The dangers to keep in view, and where to go next");
  tag(s, "Why");
  const tb = table(s, "Danger", 1.45, [3.2, 8.95], ["Danger", "What goes wrong, and the guard"], [
    ["The owner is a credential holder", "Every name in Owners can add a credential and act as the app: owners are only the two people who configure it"],
    ["\"Disabled\" isn't revoked", "Issued tokens stay valid after deactivation or grant removal: for an incident, also rotate or remove credentials"],
    ["Privileged service principals as ordinary apps", "A highly privileged role makes it a control-plane asset: VK-NPI-05; time-bound assignments; Tier 0 systems only"],
    ["Workload CA assumed to cover everything", "Group-assigned, multitenant and managed identity principals are silently out of scope: assign directly; VK-NPI-04"],
    ["The agent built by whoever was there", "By default the creator becomes sponsor and owner: blueprint creation set to No; the handshake sets both"],
  ], { fontSize: 11.5, limit: 5.3 });
  callout(s, "Next", tb + 0.2, 1.2, "FaRoute", HEX.teal, "Go next: ",
    "Part 1 for G1–G3; the developer workbook Building Non-Person Identity, Chapters 05 to 10, with their labs; the Labs page for every lab; Books 02, 04, 06 and 17 for the design.");
  sources(s, "Sources: Implementation guide, \"Dangers,\" \"Checklist,\" \"Back to the books,\" \"Labs for this guide\"; Developer workbook, \"Chapters\"; the Labs page, Building Non-Person Identity.");
  notes(s,
`Five of the guide's dangers stay in view through all three gates.

The owner is a credential holder: every name in Owners can add a credential and act as the app. Owners hold only the two people who configure it; business approvers go in the registry, and sensitive properties are locked. Disabled isn't revoked: tokens already issued stay valid after deactivation or grant removal, so for an incident, deactivate and also rotate or remove the credentials, and plan for the token lifetime. Privileged service principals treated as ordinary apps: a service principal with a highly privileged role is a control-plane asset, so VK-NPI-05, time-bound assignments, and administration from Tier 0 systems only. Workload Conditional Access assumed to cover everything: group-assigned, multitenant and managed identity principals are silently out of scope, so assign directly, run VK-NPI-04, and govern the rest through permissions and reviews. And the agent built by whoever was there: by default the creator becomes sponsor and blueprint owner, so blueprint creation is set to No, and the production handshake sets the sponsor and the owner explicitly.

The guide's checklist for these gates: high-privilege grants justified or removed and Tier 1 single-tenant service principals assigned directly to workload policies; the parallel run complete, legacy accounts disabled, not deleted; owner change in the HR mover and leaver workflows, the orphan check weekly, disable before delete; and the ScubaGear MS.AAD.5 results filed with the evidence.

Where to go next. Part 1 covers G1 to G3: inventory, decision and credential rules. To build the code for these gates, the developer workbook Building Non-Person Identity, Chapters 05 to 10, each with a fixture lab and a test-tenant or test-domain step. The Labs page lists every chapter's labs, with what each needs and a direct link. For the design, Book 02, Book 04, Book 06 and Book 17.

A person leaves and HR tells you. A service account's owner leaves and nothing tells you. These gates build the record that does.`,
  `${IG}, "Dangers and how to avoid them," "Checklist," "Back to the books," "Labs for this guide"; ${WB}, "Chapters," "Reading paths"; Labs page — "Building Non-Person Identity."`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation and G4", [
  "Non-Person Identity: An Implementation Guide: \"The track at a glance,\" \"Prerequisites\" (roles, licenses), \"The path on one page,\" Step 4 (4a–4e, Validate (G4)), \"Evidence,\" \"Rollback,\" \"Dangers.\"",
  "Microsoft Learn pages the guide footnotes (read October 29, 2026): Workload ID FAQ; PIM access reviews of roles; least privileged roles by task; privileged roles and permissions (preview). CISA BOD 25-01, MS.AAD.5.1v1 to 5.3v1.",
  "Book 04, Ch 03 (target resources), Ch 05 (permissions; admin consent; Conditional Access for workload identities), Ch 06 (who approves admin consent), Ch 07 (the policy library). Book 17, Ch 06 (privileged roles for AI; Azure resources).",
  "Developer workbook, Chapter 07 (the sweep; NPI-LP-01 to -09; the plan; the write path; Lab 1, steps 3–6) and Chapter 08 (the files; NPI-WCA-01 to -09; enforcement; the sign-in reader; Lab 1, steps 5–8). examples/non-person-identity; captures 07-4, 07-5, 08-5, 08-6.",
]);
sourceSlide("Sources: G5 and G6", [
  "Non-Person Identity: An Implementation Guide: Step 5 (steps 1–5, Validate (G5)) and Step 6 (owner change, orphans, access reviews of owners, decommissioning, Validate (G6)); \"Evidence\"; \"Rollback.\"",
  "Microsoft Learn pages the guide footnotes: deactivate an app registration; restore a recently deleted application; recover from deletions; restore a soft-deleted enterprise application; usage and insights report and servicePrincipalSignInActivities (beta).",
  "Book 02, Ch 09 (governing service principals; workload identity federation), Ch 10 (Phase 4; Git-based drift detection). Book 04, Ch 05, 06. Book 06, R08. Book 17, Ch 05 (when the sponsor moves or leaves; the orphaned agent; retirement).",
  "Developer workbook, Chapter 05 (NPI-WIF-01 to -09; the plan; Lab 1, steps 3–8), Chapter 06 (NPI-KRB-01 to -09; the island list; Lab 1, steps 3–8), Chapter 10 (NPI-DRF, NPI-REV; the package and the period; Lab 1). examples/drift-pipeline/python/npi_evidence.py.",
]);
sourceSlide("Sources: SQL Server, AI agents and the close", [
  "Non-Person Identity: An Implementation Guide: \"SQL Server service and application principals,\" \"AI agents,\" \"Dangers and how to avoid them,\" \"Evidence,\" \"Checklist,\" \"Back to the books.\" Learn, rotate certificates for SQL Server enabled by Azure Arc (as footnoted).",
  "Book 06, Ch 02, 09, 11, 19; Runbook R04. Book 17, Ch 04 (the object model; release stage, licensing and government clouds), Ch 05 (creation; recertification), Ch 06 (no stored secrets; enforcing the order), Appendix A.",
  "Developer workbook, Chapter 09 (D-NP6 as data; NPI-AI-01 to -23; Lab 1, steps 4–7); capture 09-5. The Labs page (docs/training/labs.md), Building Non-Person Identity: every chapter's Lab 1 and Lab 2.",
  "Design guidance in this part: the done-when; owner reviews quarterly and the 90-day idle threshold; the Kerberos island interim; the plan approval by SHA-256 and the 7-day plan age; the 14-day ring window; the control mapping in the period summary.",
]);

finish(OUT);
