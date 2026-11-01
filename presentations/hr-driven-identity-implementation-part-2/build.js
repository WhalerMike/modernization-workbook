// Implementation guide — HR-Driven Identity, IMPLEMENTATION SERIES, PART 2:
// access, credentials, separation and drift (implementation guide Gates G4–G7).
//   Orientation:              G4–G7 on one page.
//   G4 — Access and movers:   automatic assignment; approvals, the mover's residual and privilege; the lint, scan and residual.
//   G5 — Credentials:         trusted CAs with CRLs; issuance and revocation from HR events; the CRL measurement and CBA check.
//   G6 — Separation:          the canonical leaver order; separation timing from the logs.
//   G7 — Drift and evidence:  lifecycle drift classes and the six metrics; the package, the chain and the period.
//   Close:                    the evidence file per population, and where to go next.
// Sources: docs/books/guides/hr-driven-identity-implementation.md, the developer workbook
// docs/project-plans/developer-workbooks/hr-driven-identity/ (Chapters 04–07, Lab 1 of each), examples/hr-lifecycle
// and examples/drift-pipeline (hr_evidence.py). No new external facts.
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js);
// the code panel and the one-line statement are the ADM deeper dive's (../attribute-driven-migration-deeper-dive-part-1/build.js).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/hr-driven-identity-implementation-part-2/build.js \
//                      presentations/hr-driven-identity-implementation-part-2/HR_Driven_Identity_Implementation_Part_2.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "HR-Driven Identity — Implementation, Part 2",
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity — Implementation, Part 2: G4–G7",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "HR_Driven_Identity_Implementation_Part_2.pptx";
const IG = "HR-driven identity implementation guide";
const WB = "Developer workbook, Building HR-Driven Identity";

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
const SG4 = "G4 — Access and movers";
const SG5 = "G5 — Credentials";
const SG6 = "G6 — Separation";
const SG7 = "G7 — Drift and evidence";
const SC = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Part 2: Access, credentials, separation and drift", "HR-Driven Identity — implementation, Gates G4–G7");
  txt(s, "Session map", [
    { text: "G4 Access and the mover's residual   ·   G5 Credentials bound to HR events", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "G6 Separation timing   ·   G7 Drift, metrics and evidence", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 1: G1 Writers  ·  G2 Sources  ·  G3 Joiners", options: { color: HEX.ink, breakLine: true } },
    { text: "Steps, Lab 1 commands, federal evidence, government-cloud availability and rollback", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 2 of the implementation series for HR-Driven Identity. Part 1 fixed one writer for every account state, brought employees and contractors in from their sources, and made joiners ready on day one.

Part 2 takes the last four gates. G4 assigns access from HR attributes, routes approvals to the supervisor of record, and reviews what a move leaves behind. G5 binds PIV and CAC credentials to HR events. G6 times separations and deprovisioning, and proves the block landed in time. G7 keeps the record true with drift checks and metrics, and files the evidence.

The form is the same as Part 1. For each gate: what done means, the steps, the commands from the developer workbook's first lab, the federal requirement and the evidence an ISSO keeps, what's available in GCC and GCC High as the guide states it, the interim path, and the rollback.

The program's recommendations are marked design guidance, and conclusions the sources support but don't state are marked inference. The workbook's code is illustrative and fixture-tested, not proven against a live tenant.`,
  `${IG}, "In this guide," "The path on one page," Steps 4–7.`);
}

// ================================================================== 2 G4–G7 on one page
{
  const s = content(S0, "G4–G7 on one page: done when, proved by, rollback");
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [1.9, 3.85, 2.45, 1.25, 2.7], ["Gate", "Done when", "Validate with", "Plan tasks", "Rollback"], [
    ["G4 Access and movers", "Department access by automatic assignment; requests approved by the supervisor of record; residual access reviewed after a move", "VK-DG-05, VK-HR-03; no kit check for policies yet", "I4.4, I4.5", "Remove the automatic policy; keep the dynamic group until the package runs clean"],
    ["G5 Credentials", "CBA trusts the issuing CAs with CRLs; issuance and revocation follow HR and contractor events", "VK-PIV-01; no kit check for CBA settings yet", "I1.6", "Affinity back; time-boxed CRL exemption; bindings from the card system"],
    ["G6 Separation", "The leaver blocks first, revokes in parallel, reconciles and disposes last; intervals measured", "VK-HR-05, VK-HR-06", "I4.1, I4.2, I4.6", "Re-derive from the corrected record; restore within 30 days"],
    ["G7 Drift and evidence", "Lifecycle drift classes found and closed at the source; metrics on the ConMon cadence", "VK-HR-01, 03, 04, 07; VK-DG-05", "IG5", "None: the standing loop"],
  ], { fontSize: 11.5, limit: 5.6 });
  callout(s, "Done", tb + 0.25, 1.0, "FaListCheck", HEX.navy, "The track is done when: ",
    "every entitlement resolves to a rule, an attribute and a record; every separation blocks in time, revokes the credential and leaves evidence.");
  sources(s, "Sources: Implementation guide, \"The path on one page,\" \"Rollback\" by gate, \"The track at a glance\" (done when, design guidance from Book 03).");
  notes(s,
`Here are the four gates of Part 2 on one page: done when, the validation step, the plan tasks and the rollback.

G4, access and movers, is done when department access comes by automatic assignment, requests are approved by the supervisor of record, and residual access is reviewed after a move. VK-DG-05 and VK-HR-03 prove part of it; no kit check reads the assignment policies yet. Rollback: remove the automatic policy, and keep the dynamic group that carried the access until the package has run clean.

G5, credentials, is done when certificate-based authentication trusts the issuing CAs, each with a CRL, and issuance and revocation follow HR and contractor events. VK-PIV-01 covers the binding. Rollback: required affinity back to its previous value, a time-boxed CRL exemption, and binding values restored from the card system.

G6, separation, is done when the leaver blocks first, revokes in parallel, reconciles and disposes last, with the intervals measured. Rollback: re-derive from the corrected record, and a deleted cloud user can be restored within thirty days.

G7, drift and evidence, is done when the lifecycle drift classes are found and closed at the source and the metrics are reported on the continuous monitoring cadence. There's no rollback: it's the standing loop.

Together they finish the track's done-when, design guidance from Book 03: every entitlement resolves to a rule, an attribute and a record, a move leaves nothing unreviewed, and every separation blocks access within the approved interval, revokes the credential and leaves evidence an assessor can read.`,
  `${IG}, "The path on one page"; "Rollback"; "The track at a glance" — "Done when."`);
}
endModule(S0);

// ================================================================== 3 G4: automatic assignment
{
  const s = content(SG4, "G4: department packages by automatic assignment");
  tag(s, "What");
  const tb = table(s, "Auto", 1.45, [2.9, 9.25], ["Step", "What Learn says, and what the guide does with it"], [
    ["1 Assign by rule", "A policy assigns the package to everyone matching a rule on user attributes, extension attributes included, and removes it when they stop matching; at most 15,000 users per policy. Write it on the coded slots, with the guards"],
    ["2 One policy per package", "More than one only if no user ever matches two or moves between them, or users can lose access. Each policy creates a hidden dynamic group: don't modify or reuse it"],
    ["3 No memberOf", "From November 3, 2026, a policy whose rule uses memberOf is quarantined: it stays, but adds and removes nothing. Learn publishes a read-only script to find them: run it now"],
    ["4 A grace period for movers", "A policy can keep access for a set time after a user leaves scope. Book 04: a handover grace for standard access, zero for Tier 1 and privileged access"],
  ], { fontSize: 12, limit: 6.6 });
  line(s, "Split", "Dynamic groups carry rule-decided access (ADM Gate 4). Packages carry what a rule can't decide alone, with approvals and reviews.",
    tb + 0.2, 0.6, 13.5);
  sources(s, "Sources: Implementation guide, Step 4, steps 1–4; Learn, automatic assignment policy (as footnoted by the guide); Book 03, Ch 10; Book 04, Ch 09.");
  notes(s,
`G4 assigns access from attributes. Dynamic groups carry rule-decided access, which the ADM implementation guide's Gate 4 builds. Access packages carry what a rule can't decide alone, with approvals that route to the supervisor of record, and reviews of what remains. The prerequisites are G3, the code lists owned by HR, and the dynamic group library designed.

Step 1: department packages by automatic assignment. An automatic assignment policy assigns the package to everyone matching a rule on user attributes, and removes it when they stop matching. The rule uses the dynamic membership properties, extension attributes included, and covers at most fifteen thousand users per policy. Write it on the coded slots, with Book 03's guards.

Step 2: one automatic policy per package. Learn supports more than one only if no user ever matches two or moves from one to another; otherwise users can lose access. Entitlement management creates a hidden dynamic group per policy. Don't modify it or reuse it.

Step 3: no memberOf in any rule. From November 3, 2026, an automatic assignment policy whose rule uses memberOf is quarantined: it stays, but adds and removes nothing until the operator is removed. Learn publishes a read-only script to find them. Run it now.

Step 4: a grace period for movers. A policy can keep access for a set time after a user leaves scope. Book 04 keeps a handover grace for standard access, and zero for Tier 1 and privileged access.`,
  `${IG}, Step 4 — "Prerequisites," steps 1–4; Book 03, Chapter 10 — "Access packages and access reviews," "Rule patterns"; Book 04, Chapter 09 — "Lifecycle Workflows at the access level."`);
}

// ================================================================== 4 G4: approvals, residual, privilege
{
  const s = content(SG4, "G4: approvals, the mover's residual, and privilege");
  tag(s, "Who");
  const w = 5.95;
  const p1 = panel(s, "Req", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "STEP 5: REQUESTS ROUTE TO THE MANAGER", null, [
    "Manager as approver, with a fallback approver for users with no manager",
  ], 12.5);
  const p2 = panel(s, "Priv", 0.6, p1 + 0.2, w, null, HEX.red, HEX.redTint, "STEP 7: PRIVILEGED ACCESS STAYS OUT OF RULES", null, [
    "HR attributes decide who may request eligibility through a package",
    "The role is activated through PIM",
  ], 12.5);
  const p3 = panel(s, "Mover", 0.6 + w + 0.25, 1.45, w, null, HEX.teal, HEX.tealTint, "STEP 6: THE MOVER WORKFLOW REVIEWS THE RESIDUAL", null, [
    "An attribute-change workflow on the organization code",
    "Removes the old department's packages and requests the new one",
    "Starts a review of everything held outside packages",
    "Measure the transfer-to-review interval (PS-5)",
  ], 12.5);
  const p4 = panel(s, "Reorg", 0.6, Math.max(p2, p3) + 0.2, 12.15, null, HEX.amber, HEX.amberTint, "STEP 8: A REORGANIZATION IS A MASS MOVER", null, [
    "Rehearse it, let the execution limit quarantine it, and release it only after checking against HR",
  ], 12.5);
  if (process.env.FIT) console.log(`  G4 step panels bottom ${p4.toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 4, steps 5–8; Book 03, Ch 08 (mover; guardrails), Ch 10 (where dynamic membership stops).");
  notes(s,
`Four more G4 steps decide who approves, what happens to a mover, and where privilege goes.

Step 5: request policies route to the manager. Manager as approver, with a fallback approver for users with no manager. That's what makes the supervisor of record, the person HR names, the one who approves.

Step 6: the mover workflow reviews the residual. An attribute-change workflow on the organization code removes the old department's packages, requests the new one, and starts a review of everything the person holds outside packages. Measure the transfer-to-review interval: it's PS-5's metric, personnel transfer.

Step 7: privileged access stays out of rules. HR attributes decide who may request eligibility through a package; the role itself is activated through PIM. No standing privileged role comes from a rule.

Step 8: plan a reorganization as a mass mover. Rehearse it, let the execution limit quarantine it, and release it after checking against HR. A reorganization is exactly the anomaly the execution limit from G3 exists to catch.

The gate owner is the CISO, and this gate and the ADM guide's cross-track mover proof, its Gate 7, can share one test move.`,
  `${IG}, Step 4, steps 5–8, "Validate (G4 Access and movers)"; Book 03, Chapter 08 — "Mover," "Guardrails at agency scale"; Chapter 10 — "Where dynamic membership stops."`);
}

// ================================================================== 5 G4: in code
{
  const s = content(SG4, "G4 in code: lint the policies, list a mover's residual");
  tag(s, "How");
  const c1 = code(s, "Lint", 0.6, 1.45, 7.9, [
    "# examples/hr-lifecycle, Lab 1: five broken policies over a fictional population",
    "python python/access_assignment.py lint tests/fixtures/ch04/bad-access \\",
    "    --population tests/fixtures/ch04/population.json",
    "#   Lint: 5 Finding, 2 Warn: AA-01 memberOf, AA-02 two users in two policies,",
    "#   AA-05 doesn't remove, AA-07 no fallback approver, AA-09 tier T1 by rule",
    "python python/access_assignment.py memberof-scan \\",
    "    --policies tests/fixtures/ch04/assignment-policies.json",
    "#   Assignment policies read: 4; using memberOf: 1",
    "python python/access_assignment.py residual --mover .../mover.json ... \\",
    "    --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc",
    "#   Mover jordan.diaz@contoso.example: 8 items held, 3 to the residual review",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 04, LAB 1)", pt: 10.5 });
  code(s, "Sheet", 0.6, c1 + 0.2, 7.9, [
    "item,kind,via,class",
    "Grants reporting workspace,access package,REQUEST Grants reporting,requested: review",
    "APP-Legacy-Timekeeping-Approvers,group,direct or nested,outside packages: review",
    "SHARE-ProgramOps-Finance,group,direct or nested,outside packages: review",
  ], { label: "residual-review.csv, TO THE MANAGER OF RECORD (via SHORTENED)", pt: 10 });
  panel(s, "Read", 8.75, 1.45, 4.0, null, HEX.navy, HEX.navyTint, "HOW TO READ IT", null, [
    "Each held package re-evaluated against the new attributes: kept by rule, or removed by rule after the grace",
    "A requested package, or a group outside packages: review",
    "RV-02: the review still open 13 days after the move, past the program's 10",
    "Reads transitiveMemberOf: User.Read.All, not Directory.Read.All",
  ], 12);
  sources(s, "Sources: Developer workbook, Ch 04 (the lint; the mover's residual review; Lab 1, steps 3–5); examples/hr-lifecycle.");
  notes(s,
`The workbook's Chapter 04 keeps the policies as reviewed files, lints them over a population, scans the tenant's export for memberOf, and lists a mover's residual.

The lint over five broken policies finds five Findings and two Warns. AA-01, a rule that uses memberOf, quarantined from November 3. AA-02, two automatic policies on one package that two employees match at once, so they can lose access. AA-05, an automatic policy that doesn't both create and remove. AA-07, a request policy without the manager as approver and a fallback. AA-09, tier T1 access assigned by rule. The Warns are a rule on a department name instead of a code, and a grace period of thirty days, over the program's fourteen.

The memberOf scan reads the tenant's policies, four here, and finds one using memberOf. Run Learn's own script too; this is the same test in the pipeline.

Then the residual. A fictional employee moved from ORG-100 to ORG-210 on October 19. For each package the mover holds, the code re-evaluates the automatic policy's rule against the new attributes: the old baseline is removed by rule after the grace, on October 26; the new one is kept by rule. Three items go to the review sheet for the manager of record: a requested package and two groups held outside packages. The Finding, RV-02, is the review still open thirteen days after the move, past the program's ten.

The code reads transitive memberships on purpose: the least-privileged permission for that call is User.Read.All, where direct memberships of another user need Directory.Read.All.`,
  `${WB}, Chapter 04 — "The lint," "The mover's residual review," "Lab 1: fixtures, no tenant," steps 3–5.`);
}

// ================================================================== 6 G4: requirement, evidence, rollback
{
  const s = content(SG4, "G4: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 6.55], ["Requirement", "What the ISSO keeps"], [
    ["AC-2 (access on organization-defined attributes), AC-6 (least privilege), AC-5 (separation of duties), Moderate", "Assignment policy exports with their rules; the separation-of-duties settings"],
    ["PS-5 (personnel transfer)", "Transfer-to-review intervals; the residual-review decisions"],
    ["AC-2 account review", "Access review results, exported before the 30-day history window closes"],
    ["SCuBA MS.AAD.7.5v1: highly privileged roles only through a privileged access management system (BOD 25-01)", "PIM eligibility through packages; no standing role from a rule"],
  ], { fontSize: 11.5, limit: 6.6 });
  pair(s, "G4", tb + 0.2,
    ["VALIDATE (G4) AND ROLLBACK", [
      "VK-DG-05, against a snapshot before a test move: exactly the expected changes; VK-HR-03: counts per code against HR",
      "No kit check reads policies yet: the policy export, a memberOf scan with zero rows, the mover's run history",
      "Rollback: remove the automatic policy; keep the dynamic group until the package runs clean for a full cycle",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "Entitlement management, access reviews, PIM, dynamic groups: Azure Government; commercial in GCC",
      "Not in GCC High: administrative units with dynamic membership rules (global Azure cloud only)",
      "Interim (GCC High): assigned units set by a scheduled job from the group's rule, compared in G7",
    ]]);
  sources(s, "Sources: Implementation guide, Step 4 (requirements and evidence; availability; interim path; Validate; Rollback); Book 04, Ch 09.");
  notes(s,
`G4's federal requirements and evidence.

AC-2, authorizing access on organization-defined attributes, AC-6, least privilege, and AC-5, separation of duties, all Moderate: the ISSO keeps the assignment policy exports with their rules, and the separation-of-duties settings. PS-5, personnel transfer: the transfer-to-review intervals and the residual-review decisions. AC-2 account review: the access review results, exported before the thirty-day history window closes. And CISA's SCuBA baseline MS.AAD.7.5v1, required under BOD 25-01: highly privileged roles provisioned only through a privileged access management system. The evidence is PIM eligibility through packages, and no standing role from a rule.

Validate. VK-DG-05, run against a snapshot taken before a test move, shows exactly the expected membership changes, and VK-HR-03 reconciles counts per organization code with the HR export. No kit check reads automatic assignment policies yet, so the evidence is the policy export, the memberOf scan's output with zero rows, and the mover workflow's run history for the test user.

Availability: entitlement management, access reviews, PIM and dynamic groups are available in Azure Government, and the commercial service in GCC. One gap: administrative units with dynamic membership rules exist only in the global Azure cloud, not in Azure Government, so GCC High doesn't have them. The interim path there is assigned units whose membership a scheduled job sets from the same rule the dynamic group uses, compared with the group in G7. That's design guidance.

Rollback: remove the automatic policy; Learn's checkboxes control whether assignments are removed. Keep the dynamic group that carried the access until the package has run clean for a full cycle.`,
  `${IG}, Step 4 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Validate (G4 Access and movers)," "Rollback"; Book 04, Chapter 09.`);
}
endModule(SG4);

// ================================================================== 7 G5: CAs and CRLs
{
  const s = content(SG5, "G5: trust the issuing CAs, each with a CRL");
  tag(s, "Why");
  const tb = table(s, "CRL", 1.45, [3.2, 2.6, 2.6], ["CRL limit", "GCC (commercial)", "GCC High (Azure Gov.)"], [
    ["Interactive sign-in", "20 MB", "45 MB"],
    ["Service side", "65 MB", "150 MB"],
    ["Download time", "10 seconds", "10 seconds"],
  ], { fontSize: 12.5, limit: 6.6 });
  const p = panel(s, "Rules", 9.25, 1.45, 3.5, null, HEX.red, HEX.redTint, "WHAT FAILS", null, [
    "No configured CRL: no revocation check",
    "A configured CRL Entra can't download: CBA fails for that CA's certificates",
    "Host CRLs on highly available endpoints; Learn recommends HTTP",
  ], 12.5);
  const p2 = panel(s, "Strength", 0.6, tb + 0.25, 8.4, null, HEX.navy, HEX.navyTint, "STEP 2: REQUIRE PHISHING-RESISTANT STRENGTH", null, [
    "Raise PIV certificates to multifactor by issuer or policy OID",
    "Require the phishing-resistant authentication strength in Conditional Access",
  ], 12.5);
  line(s, "Badge", "A PIV card without the binding to the account is a badge. The binding names one certificate, so a reissue changes it.",
    Math.max(p, p2) + 0.25, 0.6, 13.5);
  sources(s, "Sources: Implementation guide, Step 5, steps 1–2; Learn, CBA CRL page (as footnoted by the guide); Book 03, Ch 09; Book 04, Ch 03.");
  notes(s,
`G5 binds credentials to HR events. Book 03's point is short: a PIV card without the binding to the account is a badge. The binding identifies one certificate, so a reissue changes it, and the card management system has to rewrite it. Binding coverage and affinity are the ADM guide's Gate 6; this gate ties the credential's lifecycle to the person's. The prerequisites are the issuing CAs' CRL sizes checked, plan task I1.6, and ADM Gate 6's affinity decision.

Step 1: trust the issuing CAs, each with a CRL. Without a configured CRL, Entra doesn't check revocation. A CRL must download within ten seconds, and stay under twenty megabytes for interactive sign-in in the commercial service, which GCC uses, or forty-five megabytes in Azure Government, which GCC High uses. The service-side limits are sixty-five and a hundred and fifty megabytes. And if Entra can't download a configured CRL, certificate-based authentication fails for that CA's certificates, so host CRLs on highly available endpoints. Learn recommends HTTP.

Step 2: require phishing-resistant strength. Raise PIV certificates to multifactor by issuer or policy OID, and require the phishing-resistant authentication strength in Conditional Access.

The role that configures certificate-based authentication and its CRLs is Authentication Policy Administrator, through PIM.`,
  `${IG}, Step 5 — "Prerequisites," steps 1–2; "Prerequisites" (roles); Book 03, Chapter 09 — "Binding the PIV certificate to the Entra user"; Book 04, Chapter 03 — "Authentication strengths."`);
}

// ================================================================== 8 G5: credential events
{
  const s = content(SG5, "G5: issuance and revocation follow HR events");
  tag(s, "Who");
  const tb = table(s, "Events", 1.45, [2.6, 6.0, 3.55], ["Event", "What happens", "Who writes it"], [
    ["Issuance (step 3)", "No card request without a joiner record and a sponsor; the binding written at issuance", "The card management system"],
    ["The bridge ends (step 4)", "The binding lands, so G3's Temporary Access Pass is no longer needed; proofing level recorded as data", "Identity engineering"],
    ["Card events back (step 5)", "Termination, revocation, suspension and expiry, keyed on the person key", "The card system's feed"],
    ["A reissuing mover (step 6)", "A legal name change rewrites the binding; a move that ends eligibility is a leaver for the credential", "The card management system"],
  ], { fontSize: 12, limit: 6.6 });
  callout(s, "Who", tb + 0.25, 1.0, "FaIdCard", HEX.teal, "One event, two meanings: ",
    "for a contractor, a card termination or expiry ends the engagement; for an employee it's credential drift, never a leaver.");
  sources(s, "Sources: Implementation guide, Step 5, steps 3–6; Book 03, Ch 09 (contractor PIV path; assurance as data; mover); Appendix A (contractor leavers).");
  notes(s,
`The rest of G5 makes the card's life follow the person's.

Step 3: issuance is the output of an HR or contractor event. No card request without a joiner record and a sponsor, and the card system writes the binding at issuance and removes it at revocation.

Step 4: end the bridge. When the binding lands, the Temporary Access Pass from G3 is no longer needed. Record the proofing level as data, per person.

Step 5: feed the card system's events back: termination, revocation, suspension and expiry, keyed on the enterprise person key. The same event means two different things. For a contractor, a termination or expiry ends the engagement, which is one of G2's earliest-end conditions. For an employee, it's credential drift, never a leaver: an employee's separation comes from HR, not from the card.

Step 6: handle the mover that reissues. A legal name change rewrites the binding. A move that ends eligibility is a leaver for the credential.

The guide is open about what isn't proved. The card system's event interface and the contractor PIV path are pending proof, and after AD retires, who writes certificateUserIds for cloud-mastered users is an open pilot.`,
  `${IG}, Step 5, steps 3–6, "Interim path"; "What couldn't be verified"; Book 03, Chapter 09 — "The contractor PIV path," "Assurance as data," "Mover: usually nothing, sometimes a reissue"; Appendix A — "Contractor leavers."`);
}

// ================================================================== 9 G5: in code
{
  const s = content(SG5, "G5 in code: measure the CRLs, check the settings");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 8.1, [
    "# examples/hr-lifecycle, Lab 1: a fictional tenant's exports and CRL measurements",
    "python python/cba_check.py measure --urls tests/fixtures/ch05/crl-urls.txt \\",
    "    --out out/ch05/crl-measurements.csv     # a failed download is recorded, not raised",
    "python python/cba_check.py check --cloud gcc --exports tests/fixtures/ch05/exports \\",
    "    --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json \\",
    "    --as-of 2026-11-01 --out out/ch05/check",
    "#   Cloud gcc: interactive CRL limit 20,000,000 bytes, download within 10 s",
    "#   CBA: 5 Finding, 7 Warn, 0 Info",
    "python python/cba_check.py check --cloud gcchigh ...  --out out/ch05/check-gcchigh",
    "#   Cloud gcchigh: interactive CRL limit 45,000,000 bytes   CBA: 5 Finding, 6 Warn",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 05, LAB 1)", pt: 10.5 });
  const tb = table(s, "Find", c1 + 0.2, [1.0, 7.1], ["Rule", "Finding in the fixture"], [
    ["CB-04", "The renewed CA 2's CRL took 11.4 s to download: a Finding in every cloud"],
    ["CB-12", "An issuing CA the card program uses isn't in the trust store"],
    ["CB-10", "No enforced policy requires a phishing-resistant strength (MS.AAD.3.1v1)"],
  ], { fontSize: 11, limit: 6.6 });
  panel(s, "Note", 8.95, 1.45, 3.8, null, HEX.navy, HEX.navyTint, "HOW TO READ IT", null, [
    "18.5 million bytes is over 80% of GCC's limit (CB-05, Warn) but not GCC High's",
    "CB-09: the mode rule maps the wrong PIV policy OID",
    "CB-01: an intermediate with no CRL is a Finding; a root, a Warn to confirm",
    "Reads the PKI-based trust store, not the older configuration",
  ], 12);
  if (process.env.FIT) console.log(`  find bottom ${tb.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 05 (the measurement; the check, CB-01 to CB-13; Lab 1, steps 2–4); examples/hr-lifecycle.");
  notes(s,
`The workbook's Chapter 05 has two commands. Measure downloads each CRL once and records its bytes, seconds and any error; a failed download is recorded, not raised, because the unreachable CRL is the finding. Run it from the internet-facing path Entra uses, not from inside the PKI's own network; that's design guidance.

Check reads the tenant's exports and the measurements for one named cloud. For GCC, the interactive limit is twenty million bytes and ten seconds. The fictional tenant gives five Findings and seven Warns. CA 2 was renewed, so the thumbprint the card program expects is gone from the trust store, CB-12, and the renewed CA's CRL is eighteen and a half million bytes, slow at eleven point four seconds, and on HTTPS. The slow download is a Finding in every cloud. The mode rule maps the wrong PIV policy OID, CB-09. And the phishing-resistant policy is still report-only, so no enforced policy for all users requires that strength, CB-10, which is SCuBA's MS.AAD.3.1v1.

Run the same check for GCC High and one Warn drops away: eighteen and a half million bytes is over eighty percent of the commercial limit, but not of Azure Government's forty-five million.

Two design points. A root CA with no CRL is a Warn, not a Finding, because a root that issues only CA certificates may publish none; the Warn asks you to confirm the root's revocation path. And the code reads the PKI-based trust store, not the older configuration, whose delegated read needs Global Administrator.`,
  `${WB}, Chapter 05 — "The measurement," "The check," "Lab 1: fixtures, no tenant," steps 2–4.`);
}

// ================================================================== 10 G5: requirement, evidence, rollback
{
  const s = content(SG5, "G5: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 6.55], ["Requirement", "What the ISSO keeps"], [
    ["IA-2(12) (acceptance of PIV credentials), IA-5(2) (public key-based authentication), Moderate", "The CBA configuration export: trusted CAs, CRL settings, binding rules, required affinity"],
    ["SCuBA MS.AAD.3.1v1 and MS.AAD.3.6v1: phishing-resistant MFA for all users and for privileged roles (BOD 25-01)", "The ScubaGear report; the authentication strength policy"],
    ["FIPS 201-3: issuance only after a proper authority authorizes it; termination and reissuance", "The card system's issuance and revocation records, joined to the HR or contractor event"],
    ["NIST SP 800-63-4 (proofing and authentication assurance)", "Proofing level and authenticator assurance as attributes, per person"],
  ], { fontSize: 11.5, limit: 6.6 });
  pair(s, "G5", tb + 0.2,
    ["VALIDATE (G5) AND ROLLBACK", [
      "VK-PIV-01: card holders with no binding or only low-affinity values, by account",
      "No kit check reads CBA settings: the export, each CRL's size and time, and a revoked test certificate refused",
      "Rollback: affinity back; a CRL exemption only while it's fixed, with an end date; bindings from the card system",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "CBA and Conditional Access: Azure Government; commercial in GCC; the CRL limits differ by cloud",
      "Interim: who writes certificateUserIds after AD is an open pilot; keep the binding in altSecurityIdentities, synced, until it closes",
    ]]);
  sources(s, "Sources: Implementation guide, Step 5 (requirements and evidence; availability; interim path; Validate; Rollback); Book 03, Ch 09.");
  notes(s,
`G5's federal requirements and evidence.

IA-2 enhancement 12, acceptance of PIV credentials, and IA-5 enhancement 2, public key-based authentication, both Moderate: the ISSO keeps the certificate-based authentication configuration export, with the trusted CAs, the CRL settings, the binding rules and the required affinity. SCuBA MS.AAD.3.1v1 and 3.6v1, required under BOD 25-01, ask for phishing-resistant MFA for all users and for highly privileged roles: the ScubaGear report and the authentication strength policy. FIPS 201-3 allows issuance only after a proper authority authorizes it, and sets termination and reissuance rules: the card system's issuance and revocation records, joined to the HR or contractor event. And NIST SP 800-63-4, proofing and authentication assurance: the proofing level and authenticator assurance as attributes, per person.

Validate. VK-PIV-01 reports pilot card holders with no binding or only low-affinity values, by account, never by value. No kit check reads the configuration or the CRL, so the evidence is the configuration export, each CA's CRL size and download time against the cloud's limits, and a revoked test certificate refused at sign-in after the next CRL publication. The gate owner is the CISO, with the PIV and credentialing office.

Availability: certificate-based authentication and Conditional Access are available in Azure Government, and the commercial service in GCC; the CRL limits differ by cloud. The interim path: after AD retires, who writes certificateUserIds for cloud-mastered users is an open pilot, so keep the binding in altSecurityIdentities, synced, for every population still synced.

Rollback: required affinity back to its previous value; a CA exempted from CRL validation only while its CRL is fixed, with an end date; binding values restored from the card system, never edited in the directory.`,
  `${IG}, Step 5 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Validate (G5 Credentials)," "Rollback."`);
}
endModule(SG5);

// ================================================================== 11 G6: the leaver order
{
  const s = content(SG6, "G6: block first, revoke in parallel, dispose last");
  tag(s, "How");
  const tb = table(s, "Order", 1.45, [0.9, 4.65, 6.6], ["Order", "In the leaver workflow", "The rule"], [
    ["1", "Disable the account and revoke refresh tokens", "First. The pipeline sends active false no later than the workflow's first run, so a re-send can't undo it"],
    ["2", "One custom task, Launch and wait: the Intune retire or wipe and the card revocation, reporting both", "The wait is 30 minutes to 3 hours; past it the task fails: route that to a high-priority exception, not a retry loop"],
    ["3", "The removals", "Then reconcile: read the block back. A disabled account with live sessions, or a failed card revocation, is an incident"],
    ["4", "Delete, in a separate post-separation workflow", "Last: retire or wipe devices before deleting the user; for synced users the delete happens in AD"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 5.95;
  const p1 = panel(s, "Time", 0.6, tb + 0.2, w, null, HEX.navy, HEX.navyTint, "TIMING AND THE EXCEPTIONS", null, [
    "The leave date late in the day; the interval includes the tenant schedule",
    "Emergency: block out of band at once, then the same sequence on demand, behind PIM approval",
    "Entered more than three days late: misses the trigger; report and run on demand",
  ], 12);
  const p2 = panel(s, "Other", 0.6 + w + 0.25, tb + 0.2, w, null, HEX.teal, HEX.tealTint, "THE PATHS THE WORKFLOW CAN'T TAKE", null, [
    "Privileged leavers: the disable task doesn't support users with role assignments",
    "Sponsored service accounts and agents go to the non-person track",
    "Acceptance rows: separation, leave without pay, cancelled separation, conversion",
  ], 12);
  if (process.env.FIT) console.log(`  G6 panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Step 6, steps 1–9; Book 03, Ch 08, 09 (the canonical leaver sequence); Appendix A, C; Book 19, Ch 05.");
  notes(s,
`G6 configures the leaver in Book 03's canonical order and proves the timing: block first, then revoke credentials, devices and access in parallel, reconcile, and dispose of the object last. The prerequisites are G1, G3 and G5, and the Intune and card-system custom task extensions, which Book 19's Chapter 05 builds.

Step 1 orders the leaver workflow as that sequence. Disable and revoke refresh tokens first. Then one custom task, Launch and wait, that starts the Intune retire or wipe and the card revocation and reports both. A custom task extension's wait can be set from thirty minutes to three hours; past it the task fails, so route that failure to a high-priority exception, not a retry loop. Then the removals. Delete goes in a separate post-separation workflow.

Step 2 times the leave date late in the day and sizes the tenant schedule so the block lands within the approved interval; the interval includes the schedule. Step 3 coordinates the two writers: the pipeline sends active false no later than the leaver workflow's first run, so a later re-send can't undo the disable. Step 4 builds the emergency path: an out-of-band block at once, then the on-demand workflow running the same sequence, never a shorter one, as a change behind PIM approval. Step 5 catches late separations: one entered more than three days after its effective date misses the scheduled trigger, so report it and run it on demand.

Step 6 verifies the block by reading it back. Privileged leavers need their own verified path, because the disable task doesn't support users with role assignments. Step 7 disposes last. Step 8 hands sponsored service accounts and agents to the non-person track. And step 9 runs the acceptance rows: separation, leave without pay, cancelled separation and conversion.`,
  `${IG}, Step 6 — "Prerequisites," steps 1–9; Book 03, Chapter 08 — "Triggers and schedule," "Emergency termination," "Deletion," "One leaver reaches four tracks"; Chapter 09 — "The canonical leaver sequence," "Running it from Lifecycle Workflows"; Appendix A — "Partial leavers"; Appendix C — "Acceptance."`);
}

// ================================================================== 12 G6: in code
{
  const s = content(SG6, "G6 in code: separation timing from the logs");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 7.6, [
    "# examples/hr-lifecycle, Lab 1: fictional leavers, audit records, cards, devices",
    "python python/separation_timing.py measure \\",
    "    --separations .../hr-separations.csv --audits .../separation-audits.json \\",
    "    --results .../leaver-results.json --cards .../card-revocations.csv \\",
    "    --devices .../device-actions.csv --role-holders .../role-holders.csv \\",
    "    --config config/separation.json --as-of 2026-11-01T12:00:00Z --cloud gcc",
    "#   Leavers: 7 separated, 1 cancelled, 1 not blocked",
    "#   Separation-to-block hours: p50 0.25, p90 5.52, max 84.68 (threshold 4)",
    "#   Separation-to-revocation hours: p50 11.0, p90 110.0, max 395.0 (threshold 24)",
    "#   Separation: 10 Finding, 2 Warn, 0 Info                     (exit 2)",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 06, LAB 1; INPUTS IN tests/fixtures/ch06)", pt: 10.5 });
  const tb = table(s, "Who", c1 + 0.2, [1.6, 6.0], ["Rule", "In the fixture"], [
    ["ST-01, ST-04", "Blocked after 5.52 hours; an uncollected card revoked 23 hours after notice"],
    ["ST-02, ST-03", "Entered 6.8 days late, no on-demand run, and the only disable failed: never blocked"],
    ["ST-05, ST-08", "One re-enabled by the pipeline two days after the disable; another deleted before the device retire"],
  ], { fontSize: 11, limit: 6.6 });
  panel(s, "Def", 8.45, 1.45, 4.3, null, HEX.navy, HEX.navyTint, "WHAT IT MEASURES", null, [
    "Blocked: the later of the first Disable account and the first refresh-token revocation record",
    "Revoked: the latest of the block, the card revocation and the last device action",
    "Thresholds are samples: the agency sets PS-4's period, with the schedule",
    "Lab 2 confirms which task writes the revocation record",
  ], 12);
  if (process.env.FIT) console.log(`  who bottom ${tb.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 06 (the intervals; the rules, ST-01 to ST-09; Lab 1, steps 2–4); examples/hr-lifecycle.");
  notes(s,
`The workbook's Chapter 06 measures the separation from the logs. For each separation whose effective time has passed, it reads the user's successful audit records from twenty-four hours before. Blocked is the later of the first Disable account record and the first Update StsRefreshTokenValidFrom Timestamp record, the session revocation. Revoked is the latest of the block, the card system's revocation and the last completed device action. Learn lists that revocation activity but doesn't say which task writes it, so Lab 2 confirms it in a test tenant before the code is trusted.

The lab measures nine fictional separations. Seven are measured, one is cancelled and isn't flagged, and one was never blocked. Separation-to-block: a median of a quarter of an hour, a ninetieth percentile of five and a half hours, and a worst case of almost eighty-five, against a sample threshold of four. Separation-to-revocation: a median of eleven hours and a ninetieth percentile of a hundred and ten, against twenty-four. Ten Findings and two Warns.

Read three stories. One leaver blocked after five and a half hours, over the threshold, and that person's uncollected card was revoked twenty-three hours after notice, past FIPS 201's eighteen. One separation was entered almost seven days late, past the catch-up window, with no on-demand run, and the only disable in the log failed, so that person was never blocked. And the pipeline re-enabled one leaver two days after the disable, while another was deleted before the device retire completed.

The thresholds are samples. The agency sets PS-4's period, and the tenant schedule's interval is part of it, so set the threshold and the schedule together.`,
  `${WB}, Chapter 06 — "The intervals," "The rules," "Lab 1: fixtures, no tenant," steps 2–4.`);
}

// ================================================================== 13 G6: requirement, evidence, rollback
{
  const s = content(SG6, "G6: requirement, evidence, availability, rollback");
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 6.55], ["Requirement", "What the ISSO keeps"], [
    ["PS-4 (access disabled in the defined period, authenticators revoked); AC-2(3), disable accounts; Moderate", "Both intervals per leaver; the workflow run, Intune action records, the card revocation record and its CRL"],
    ["PS-7 for contractors", "End-date-to-block intervals"],
    ["FIPS 201-3: a card that can't be collected is terminated within 18 hours of notification", "The notice timestamp and the revocation timestamp"],
    ["AC-2(13), disable accounts for high-risk individuals, Moderate", "The emergency path's runs, logged as changes, with the out-of-band actions"],
  ], { fontSize: 11.5, limit: 6.6 });
  pair(s, "G6", tb + 0.2,
    ["VALIDATE (G6) AND ROLLBACK", [
      "VK-HR-05: leave date past, no processing record; VK-HR-06: limits on the leaver workflows",
      "A full pay-period cycle: zero missed leavers, block within the threshold, every exception closed",
      "Rollback: a cancelled separation re-enables from the corrected record; a deleted cloud user restores for 30 days",
    ]],
    ["AVAILABILITY AND INTERIM PATH", [
      "Lifecycle Workflows and PIM: Azure Government; commercial in GCC",
      "Custom task extensions have no row; a GCC tenant's Logic App most likely sits in a commercial subscription (inference)",
      "Interim: built-in tasks plus a leaver checklist with a named owner per row",
    ]]);
  sources(s, "Sources: Implementation guide, Step 6 (requirements and evidence; availability; interim path; Validate; Rollback); Book 03, Ch 09, 12.");
  notes(s,
`G6's federal requirements and evidence.

PS-4, personnel termination, asks for access disabled within the organization-defined period and authenticators revoked, and AC-2 enhancement 3 disables accounts; both Moderate. The ISSO keeps the separation-to-block and separation-to-revocation intervals per leaver, the workflow run, the Intune action records, the card system's revocation record, and the CRL that published it. PS-7, for contractors: the end-date-to-block intervals. FIPS 201-3: a card that can't be collected is terminated within eighteen hours of notification, so the notice timestamp and the revocation timestamp. And AC-2 enhancement 13, disabling accounts for high-risk individuals: the emergency path's runs, logged as changes, with the out-of-band actions.

Validate. VK-HR-05 reports users whose leave date is past with no processing record: the late separations step 5 must have run on demand. VK-HR-06 confirms execution limits on the leaver workflows. Then the leaver runs for a full pay-period cycle on the covered population: zero missed leavers, separation-to-block within the approved threshold, and every exception closed through an alternate path. The gate owner is security, which owns the leaver path end to end.

Availability: Lifecycle Workflows and PIM are available in Azure Government, and the commercial service in GCC. Custom task extensions have no row of their own. A GCC tenant is a commercial Entra tenant, and an Azure Government subscription trusts only an Azure Government directory, so the guide's inference is that the Logic App sits in a commercial Azure subscription linked to the tenant. The interim path, until the extensions exist, is the built-in tasks and a leaver checklist with a named owner per row.

Rollback: a cancelled separation re-enables from the corrected record, with evidence, and manually granted access comes back only by request and review. A deleted cloud user can be restored for thirty days.`,
  `${IG}, Step 6 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Validate (G6 Separation)," "Rollback"; Book 03, Chapter 12 — "Phase 4."`);
}
endModule(SG6);

// ================================================================== 14 G7: drift and metrics
{
  const s = content(SG7, "G7: lifecycle drift, six metrics, the sole source");
  tag(s, "Why");
  const tb = table(s, "Metrics", 1.45, [3.55, 1.25, 1.3, 1.6], ["Metric (Lab 1 run)", "Value", "Bound", "Status"], [
    ["Separation-to-block, p90 (hours)", "5.52", "max 4", "out of bounds"],
    ["Separation-to-revocation, p90 (hours)", "110.0", "max 24", "out of bounds"],
    ["Transfer-to-review (hours)", "—", "max 240", "not measured"],
    ["Joiner readiness rate", "0.25", "min 0.95", "out of bounds"],
    ["Correlation coverage", "0.5833", "min 0.99", "out of bounds"],
    ["Derivation purity", "0.7637", "min 0.8", "out of bounds"],
  ], { fontSize: 11.5, limit: 6.6 });
  panel(s, "Steps", 8.5, 1.45, 4.25, null, HEX.navy, HEX.navyTint, "THE STEPS", null, [
    "Run the classes: missing identity, stale access, orphan, unauthorized write, credential and contractor credential drift",
    "Fix at the source, back through the pipeline, never as a directory edit",
    "Report the six metrics on the ConMon cadence",
    "Prove the sole source (seven days of logs), then close the ticket path",
    "Keep the evidence outside the directory",
  ], 12);
  line(s, "Bounds", "A metric with no input is \"not measured,\" never zero. The thresholds are proposed starting values: choosing them is the agency's CA-7 decision.",
    tb + 0.25, 0.62, 13);
  sources(s, "Sources: Implementation guide, Step 7, steps 1–5; Developer workbook, Ch 07 (the metrics; Lab 1, step 2); Book 03, Ch 11; Appendix C.");
  notes(s,
`G7 keeps the record true and files the evidence. Attribute drift belongs to the ADM guide's Gate 9; this gate adds the lifecycle classes, the metrics and the evidence file. The prerequisites are G1 to G6 on the pilot, and logs leaving Entra ID.

Five steps. Run the lifecycle drift classes from Book 03's Chapter 11: missing identity, stale access, orphan account, unauthorized write, which runs G1's saved queries, credential drift and contractor credential drift. Send the findings to the same queue as ADM Gate 9. Fix at the source: each finding goes to the owner of the fact and comes back through the pipeline, never as a directory edit. Report the six metrics on the continuous monitoring cadence, with thresholds the agency sets. Prove HR is the sole source, with seven days of provisioning logs against the directory audit log per population, and then close the ticket path. And keep the evidence outside the directory, for the records schedule's period, because the account is disposed of and the evidence has to outlive it.

The table is the workbook's Chapter 07 lab run, which reads the outputs of the earlier chapters' labs. Separation-to-block at the ninetieth percentile is five and a half hours against a maximum of four. Separation-to-revocation is a hundred and ten against twenty-four. Transfer-to-review isn't measured, because the mover's review is still open. Joiner readiness is a quarter against ninety-five percent, correlation coverage fifty-eight percent against ninety-nine, and derivation purity seventy-six percent against eighty.

A metric with no input is reported as not measured, never as zero. The thresholds are proposed starting values; Book 03 is plain that choosing them is the agency's CA-7 decision.`,
  `${IG}, Step 7 — "Prerequisites," steps 1–5; ${WB}, Chapter 07 — "The metrics," "Lab 1," step 2; Book 03, Chapter 11 — "Drift between HR and the directory," "The measured lifecycle"; Appendix C — "Proving HR is the sole source."`);
}

// ================================================================== 15 G7: package, chain, period, evidence
{
  const s = content(SG7, "G7 in code: package, chain, period; the evidence");
  tag(s, "How");
  const c1 = code(s, "Run", 0.6, 1.45, 12.15, [
    "# examples/hr-lifecycle, Lab 1: the run, then examples/drift-pipeline/python/hr_evidence.py",
    "python python/lifecycle_drift.py run ... --mode fixture --out out/ch07/runs/2026-11-01T0600Z    #   Lifecycle drift: 14 Finding, 6 Warn",
    "python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-02T0600Z --previous-manifest .../EVIDENCE-MANIFEST.json ...",
    "python ../drift-pipeline/python/hr_evidence.py period --evidence out/ch07/evidence --since 2026-10-01 --until 2026-11-02 --out out/ch07/periods",
    "#   {\"chain_breaks\": 0, \"complete\": false, \"coverage_gaps\": 0, \"open_at_end\": 20, \"packages\": 2, ...}     (exit 2)",
  ], { label: "COMMANDS AND OUTPUT (CHAPTER 07, LAB 1, STEPS 2, 5 AND 6)", pt: 10 });
  const tb = table(s, "Req", c1 + 0.2, [5.3, 6.85], ["Requirement", "What the ISSO keeps"], [
    ["CA-7 (continuous monitoring: system-level metrics), Moderate", "The six metrics per reporting period, with thresholds"],
    ["AU-6 and AU-11 (review and retention of audit records), SI-12", "The log export configuration; findings closed at the source; retention set to the records schedule"],
    ["BOD 25-01 continuous reporting", "ScubaGear results for the identity policies in G4 and G5"],
  ], { fontSize: 11.5, limit: 6.6 });
  line(s, "Val", "Validate: VK-HR-01, 03, 04, 07 and VK-DG-05 on the drift cadence; no kit check reads credential drift or the metrics. Owner: the CISO. No rollback.",
    tb + 0.2, 0.62, 13);
  sources(s, "Sources: Developer workbook, Ch 07 (the run; the package, the chain and the period; Lab 1); Implementation guide, Step 7 (requirements; Validate).");
  notes(s,
`The workbook's Chapter 07 turns G7 into one run and a chain of evidence packages.

The run reads the HR export, the contractor decisions, the workforce users, the exceptions with owners and the card system's status, plus the earlier chapters' output folders, each checked against its own manifest before it's read. It writes the run folder once, and it requires a mode, fixture or tenant, so a lab run can't pass for a tenant run. The lab's run gives fourteen Findings and six Warns: a worker with no account, terminated workers still enabled, a contractor past the earliest end, two orphan accounts with no owned exception, Chapter 01's five unauthorized writes, and three active cards with no current worker or engagement behind them.

hr_evidence.py in the drift pipeline packages each run with a manifest and SHA-256 sums, chained to the previous package's manifest. The first package opens all twenty counted findings; the second, with the same inputs, opens none and closes none. Then period verifies every package in the period: here no chain breaks and no coverage gaps, but twenty findings open at the end, so it isn't complete and exits 2. It maps what's open to AC-2, AU-6, PS-4, PS-5 and CA-7, as design guidance, and reports the sole-source proof as not decided by this code.

The federal requirements: CA-7, continuous monitoring with system-level metrics: the six metrics per period with thresholds. AU-6 and AU-11, review and retention of audit records, and SI-12: the log export configuration, findings closed at the source, and retention set to the records schedule. BOD 25-01's continuous reporting: ScubaGear results for the identity policies in G4 and G5.

Validate on the drift cadence with VK-HR-01, 03, 04 and 07 and VK-DG-05, with the HCM correlation tool for record-by-record drift. Reports and SIEM connectivity are available in Azure Government. Before the SIEM takes identity logs, route them to a storage account from day one. The owner is the CISO, and there's no rollback: it's the standing loop.`,
  `${WB}, Chapter 07 — "The run," "The drift classes," "The package, the chain and the period," "Lab 1," steps 2–6; ${IG}, Step 7 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Validate (G7 Drift and evidence)," "Rollback."`);
}
endModule(SG7);

// ================================================================== 16 Close
{
  const s = content(SC, "One evidence file per population, and what's next");
  tag(s, "How");
  const tb = table(s, "File", 1.45, [1.9, 10.25], ["Gate", "In the evidence file"], [
    ["G1, G2", "The register, scope filter and audit queries; source decisions, authority table, reconciliation reports, privacy determinations"],
    ["G3, G6", "Workflow definitions, versions and exported run history; the TAP policy"],
    ["G4", "Assignment policy exports, review results and transfer-to-review intervals"],
    ["G5", "The CBA configuration, CRL measurements and card-system records joined to events"],
    ["G6", "Separation-to-block and separation-to-revocation intervals, exceptions and their closure"],
    ["G7", "Drift findings closed at the source, the six metrics and the sole-source proof"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "Next", tb + 0.2, 1.2, "FaRoute", HEX.teal, "Go next: ",
    "the developer workbook Building HR-Driven Identity, Chapters 04 to 07, each with its labs; Book 03 for the design; the ADM implementation guide for the attributes; the learning path to learn it in order.");
  sources(s, "Sources: Implementation guide, \"Evidence,\" \"Back to the books\"; Developer workbook, \"The pieces\"; Learning path, HR-Driven Identity.");
  notes(s,
`Each gate's table names what the ISSO keeps. Together they make one evidence file per population.

G1: the register with its lifecycle rows, the scope filter and the audit queries. G2: the source decisions, the authority-per-fact table, the reconciliation reports and the privacy determinations. G3 and G6: the workflow definitions, their versions and the exported run history, and the Temporary Access Pass policy. G4: the assignment policy exports, the review results and the transfer-to-review intervals. G5: the certificate-based authentication configuration, the CRL measurements, and the card-system records joined to events. G6: the separation-to-block and separation-to-revocation intervals, the exceptions and their closure. G7: the drift findings with closure at the source, the six metrics and the sole-source proof.

Book 03's control support table says what each control still needs from the agency, and the companion guide's federal requirements map the evidence across the four tracks. File every kit run with its date, tenant and check version.

Where to go next. To build the code for G4 to G7, the developer workbook Building HR-Driven Identity, Chapters 04 to 07, each with a fixture lab and a test-tenant step. For the design, Book 03. For the attributes these gates read, the ADM implementation guide. To learn it in order, use the learning path, HR-Driven Identity in Microsoft Entra ID: seven modules, one per gate, each with a fixture lab and a knowledge check.

The pipeline made the account exist. These seven gates make the HR record decide what happens to it, and leave the evidence that it did.`,
  `${IG}, "Evidence," "Back to the books"; ${WB}, "The pieces and how they connect," "Reading paths"; Learning path, HR-Driven Identity in Microsoft Entra ID.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation and G4", [
  "HR-Driven Identity: An Implementation Guide: \"The track at a glance,\" \"The path on one page,\" Step 4 (steps 1–8, requirements and evidence, availability, interim path, Validate, Rollback), \"Rollback,\" \"Dangers.\"",
  "Microsoft Learn pages the guide footnotes: automatic assignment policy for an access package; access reviews of an access package; administrative units with dynamic membership rules (prerequisites); Entra feature availability (all read November 1, 2026). CISA BOD 25-01, MS.AAD.7.5v1.",
  "Book 03, Ch 08 (mover; guardrails at agency scale); Ch 10 (access packages and access reviews; rule patterns; where dynamic membership stops). Book 04, Ch 09 (Lifecycle Workflows at the access level; separation of duties; how the program evidences reviews).",
  "Developer workbook, Chapter 04 (the policy files; the lint, AA-01 to AA-09; the mover's residual review; Lab 1, steps 3–5). examples/hr-lifecycle: python/access_assignment.py, config/access, tests/fixtures/ch04.",
]);
sourceSlide("Sources: G5 and G6", [
  "HR-Driven Identity: An Implementation Guide: Step 5 and Step 6 (steps, requirements and evidence, availability, interim paths, Validate, Rollback); \"What couldn't be verified\" (custom task extension location; certificateUserIds writer; card system interface).",
  "Microsoft Learn pages the guide footnotes: CBA certificate revocation list; ID Governance service limits; Lifecycle Workflows custom task extension; planning identity for Azure Government; Entra feature availability. CISA BOD 25-01, MS.AAD.3.1v1 and 3.6v1. NIST SP 800-53B Moderate baseline.",
  "Book 03, Ch 08 (triggers and schedule; emergency termination; deletion; one leaver reaches four tracks); Ch 09 (binding; the contractor PIV path; assurance as data; the canonical leaver sequence; what the evidence must show); Ch 12 (Phase 4); Appendix A, C. Book 04, Ch 03. Book 19, Ch 05.",
  "Developer workbook, Chapter 05 (measure; check, CB-01 to CB-13; Lab 1, steps 2–4) and Chapter 06 (intervals; rules, ST-01 to ST-09; Lab 1, steps 2–4). examples/hr-lifecycle: python/cba_check.py, python/separation_timing.py, tests/fixtures/ch05 and ch06.",
]);
sourceSlide("Sources: G7 and the close", [
  "HR-Driven Identity: An Implementation Guide: Step 7 (steps 1–5, requirements and evidence, availability, interim path, Validate, Rollback); \"Evidence\"; \"Back to the books.\"",
  "Book 03, Ch 11 (drift between HR and the directory; the measured lifecycle; the evidence each event leaves; control support); Appendix C (proving HR is the sole source). Book 02, Appendix A (BOD 25-01). Identity maintenance explainer (the fixes that still happen).",
  "Developer workbook, Chapter 07 (what the evidence has to show; the run; LD-01 to LD-08; the metrics; the package, the chain and the period; Lab 1, steps 1–6). examples/hr-lifecycle: python/lifecycle_drift.py, config/drift.json, tests/fixtures/ch07; examples/drift-pipeline/python/hr_evidence.py.",
  "Design guidance in this part: the grace periods and the 14-day warning; the GCC High assigned-unit interim; the separation and metric thresholds (samples); the control mapping in the period summary; running the CRL measurement from the internet-facing path.",
  "Learning path: HR-Driven Identity in Microsoft Entra ID (seven modules, one per gate; each runs the chapter's Lab 1 and ends with a knowledge check).",
]);

finish(OUT);
