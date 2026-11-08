// Book 03 — HR-Driven Identity, Chapter 15 External Partner Identity: the TECHNICAL deep dive.
// Audience: identity engineers, Conditional Access owners, ISSOs and the identity governance office.
// Mostly Book 04 Appendix C (the Microsoft Entra partner access profile) and Book 03 Appendix D (the record),
// on the class and assurance rules of Book 03 Chapter 15. The executive briefing is ../b03-external-partner-executive/.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B03_External_Partner_Technical.pptx
// Every Microsoft fact comes from the Microsoft Learn pages the profile footnotes (accessed November 6, 2026).
// Profile values, alerts and the control mapping are the book's design guidance, labeled as such. The pages are
// drafts, and the validation tests haven't been run against a tenant (the profile says so).
// The spoken narration lives in narration.json; each slide's notes carry the same text and a "Workbook:" line.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 03", title: "HR-Driven Identity",
  footer: "Federal Modernization Workbook  ·  Book 03 HR-Driven Identity  ·  External Partner Identity, technical deep dive" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B03_External_Partner_Technical.pptx";

const SAY = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
let n = 0;
const notes = (s, title, ref) => {
  n += 1;
  const e = SAY.find((x) => x.slide === n);
  if (!e) throw new Error(`narration.json has no slide ${n}`);
  if (e.title !== title) throw new Error(`slide ${n}: narration title ${JSON.stringify(e.title)} != ${JSON.stringify(title)}`);
  if (title.length > 58) console.warn(`! slide ${n}: title over 58 characters`);
  s.addNotes(`${e.say}\n\nWorkbook: ${ref}`);
};
const slide = (sec, part, title) => { const s = D.content(sec, title); tag(s, part); return s; };
const code = (t) => ({ text: t, options: { fontFace: "Consolas", color: HEX.navy } });
// Module divider: a Title-master slide with the module's contents and running time, as in the sibling deep dives.
const divider = (sec, t, sub, items, mins) => {
  const s = D.titleSlide(sec, t, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((x, k) => ({ text: x, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

// ------------------------------------------------------------------ 1 Title
{
  const s = D.titleSlide("Orientation", "External Partner Identity: the technical deep dive", "HR-Driven Identity, Chapter 15, and the Microsoft Entra partner access profile");
  txt(s, "Session map", [
    { text: "Module 1  Assurance and the default route", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Module 2  The sync exception and the roles", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Module 3  Proving it: record, tests, monitoring, evidence", options: { color: HEX.amber, bold: true, breakLine: true } },
    { text: "For identity engineers, Conditional Access owners, ISSOs and the governance office", options: { color: HEX.slate } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s, "External Partner Identity: the technical deep dive", "Book 03, Chapter 15; Book 04, Appendix C; Book 03, Appendix D.");
}

// ------------------------------------------------------------------ 2 Why
{
  const t = "Access because someone asked, never because it exists";
  const s = slide("Orientation", "Why", t);
  box(s, "Split", 0.6, 1.5, 12.15, 1.2, HEX.navyTint);
  txt(s, "Split text", [
    { text: "Partner: ", options: { bold: true, color: HEX.teal } }, { text: "affiliation and the source credential.   ", options: {} },
    { text: "Agency: ", options: { bold: true, color: HEX.navy } }, { text: "federation trust, eligibility, authorization, monitoring, review, suspension and termination." },
  ], { x: 0.85, y: 1.55, w: 11.7, h: 1.1, fontSize: 16.5, valign: "middle" });
  const proofs = [
    ["FaKey", "Trust is scoped", "To this partner's tenant or identity provider, and nothing else", HEX.navy],
    ["FaClipboardCheck", "Every account traces", "To an approved request with a sponsor, an approver and an expiry", HEX.teal],
    ["FaUserShield", "Every partner is a guest", "Unless an exception record names the member", HEX.amber],
    ["FaDoorClosed", "Access really ends", "At the last assignment, and at partner exit", HEX.red],
  ];
  txt(s, "Proofs head", "What engineering has to prove, for every partner", { x: 0.6, y: 2.9, w: 12.15, h: 0.45, fontSize: 17, bold: true, color: HEX.ink });
  proofs.forEach((p, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Proof ${i + 1}`, x, 3.45, 2.95, 2.75, "FFFFFF", p[3]);
    icon(s, p[0], x + 1.12, 3.6, 0.7, p[3]);
    txt(s, `Proof ${i + 1} text`, [{ text: p[1], options: { bold: true, color: p[3], fontSize: 16.5, fontFace: "Cambria", breakLine: true } }, { text: p[2], options: { fontSize: 14 } }],
      { x: x + 0.2, y: 4.4, w: 2.55, h: 1.7, align: "center", paraSpaceAfter: 4 });
  });
  sources(s, "Sources: Book 03, Chapter 15 (the authority split); Book 04, Appendix C (introduction). Design guidance.");
  notes(s, t, "Book 04, Appendix C — introduction; Book 03, Chapter 15.");
}

// ------------------------------------------------------------------ Module 1 divider
{
  const t = "Module 1: Assurance and the default route";
  const s = divider("Module 1 — Assurance and the default route", t, "Book 03, Chapter 15 and Book 04, Appendix C", ["Three assurance scales", "The default route: an access package per use case", "Cross-tenant access settings", "One partner list in five Conditional Access policies"], 5);
  notes(s, t, "Book 03, Chapter 15; Book 04, Appendix C.");
}

// ------------------------------------------------------------------ 3 What: assurance
{
  const t = "Three assurance scales, applied to partners";
  const s = slide("Module 1 — Assurance and the default route", "What", t);
  const rows = [
    head(["Scale", "For a partner person", "The agency records"]),
    ["IAL: identity proofing", "The partner proofs, under its own practice", "The practice, and whether it meets the IAL"],
    ["AAL: authentication", "The partner's identity service authenticates", "Authenticators accepted; how they're verified"],
    ["FAL: federation", "The agency sets it per application", "The FAL required; the assertion checks"],
  ];
  s.addTable(rows, tableOpts([2.8, 4.6, 4.75], { y: 1.5, fontSize: 14.5, rowH: 0.5 }));
  const fal = [
    ["FAL1", "Signed assertion validated against the expected key; audience-restricted; replay-protected", HEX.teal, HEX.tealTint],
    ["FAL2", "Adds injection protection, RP-initiated, single-RP assertion, a trust agreement in advance, no plaintext PII in identifiers", HEX.navy, HEX.navyTint],
    ["FAL3", "Adds holder-of-key or a bound authenticator; identifiers and keys set up manually", HEX.red, HEX.redTint],
  ];
  fal.forEach((f, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `FAL ${i + 1}`, x, 3.7, 3.95, 1.75, f[3]);
    txt(s, `FAL ${i + 1} text`, [{ text: f[0], options: { bold: true, color: f[2], fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: f[1], options: { fontSize: 13.5 } }],
      { x: x + 0.2, y: 3.8, w: 3.55, h: 1.6, paraSpaceAfter: 4 });
  });
  txt(s, "Steps", [
    { text: "Selection: ", options: { bold: true, color: HEX.navy } },
    { text: "define the service (§3.1); impact per user group, partners as their own group (§3.2); combine (§3.2.4); initial levels (§3.3.3); tailor and record a Digital Identity Acceptance Statement (§3.4). One row per protected transaction." },
  ], { x: 0.6, y: 5.6, w: 12.15, h: 0.95, fontSize: 14 });
  sources(s, "Sources: NIST SP 800-63-4; SP 800-63C-4 (check its October 6, 2026 planning note). Book 03, Chapter 15 (Assurance by transaction risk).");
  notes(s, t, "Book 03, Chapter 15 — Assurance by transaction risk.");
}

// ------------------------------------------------------------------ 4 What: default route
{
  const t = "The default route: an access package per use case";
  const s = slide("Module 1 — Assurance and the default route", "What", t);
  const steps = [
    ["One connected organization per partner", "Entra ID (same or other cloud) or SAML/WS-Fed; a named internal sponsor"],
    ["Configured, never proposed", [code("allowedTargetScope"), { text: " = " }, code("specificConnectedOrganizationUsers")]],
    ["One hidden access package per use case", "In a catalog enabled for external users; the sponsor sends the link"],
    ["Approval, then expiry", "Sponsor, then resource owner for R1 and R2 apps; at most 365 days"],
    ["Quarterly sponsor review", "Denied guests removed"],
    ["End with the last assignment", [code("blockSignInAndDelete"), { text: ", deleted after 30 days" }]],
    ["No side doors", "Guests can invite: No"],
  ];
  steps.forEach((st, i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
    const x = 0.6 + col * 6.12, y = 1.5 + row * 0.92;
    box(s, `Step ${i + 1}`, x, y, 6.0, 0.82, col ? HEX.tealTint : HEX.navyTint);
    const body = Array.isArray(st[1]) ? st[1] : [{ text: st[1] }];
    txt(s, `Step ${i + 1} text`, [{ text: `${i + 1}. ${st[0]}`, options: { bold: true, color: col ? HEX.teal : HEX.navy, breakLine: true } }, ...body.map((b) => ({ text: b.text, options: Object.assign({ fontSize: 13.5 }, b.options) }))],
      { x: x + 0.15, y: y + 0.03, w: 5.7, h: 0.76, fontSize: 15, valign: "middle" });
  });
  box(s, "Caution", 6.72, 4.26, 6.03, 1.92, "FFFFFF", HEX.amber);
  txt(s, "Caution text", [{ text: "Test before you exclude: ", options: { bold: true, color: HEX.amber } },
    { text: "Conditional Access that affects guests can block My Access. Test T1 shows whether a partner can still request; if not, record an exclusion of that one app, and don't loosen CA009." }],
    { x: 6.92, y: 4.36, w: 5.65, h: 1.72, fontSize: 14, valign: "middle" });
  sources(s, "Sources: Microsoft Learn: Manage connected organizations; Govern access for external users; entitlementManagementSettings. Book 04, Appendix C and Chapter 09.");
  notes(s, t, "Book 04, Appendix C — The default route: a connected organization and an access package.");
}

// ------------------------------------------------------------------ 5 What: cross-tenant access
{
  const t = "Cross-tenant access settings, one partner at a time";
  const s = slide("Module 1 — Assurance and the default route", "What", t);
  const rows = [
    head(["Setting", "Profile value"]),
    ["Inbound B2B collaboration", "Partner tenant only, scoped to the access package's apps"],
    ["B2B direct connect", "Blocked"],
    ["Trust MFA", "Only where the agreement says the partner enforces MFA; CA still requires the strength"],
    ["Trust compliant / hybrid-joined device", "Off, unless the agreement names the partner's compliance standard"],
    ["Automatic redemption (inbound)", "Off on the default route; on only with the sync exception"],
    ["Microsoft cloud settings", "On only for a partner in another Microsoft cloud"],
  ];
  s.addTable(rows, tableOpts([4.2, 7.95], { y: 1.5, fontSize: 14, rowH: 0.5 }));
  callout(s, "Stop", 5.15, 1.3, "FaTriangleExclamation", HEX.red, "Stop conditions: ",
    "the record holds the partner's immutable tenant ID (T0); a partner domain that resolves to another tenant stops the work. A SAML/WS-Fed partner gets only the MFA grant, so the agreement must say whether its method is phishing-resistant.");
  sources(s, "Sources: Microsoft Learn: Cross-tenant access overview. Book 04, Appendix C; Book 02, Chapter 10; Book 07, Chapter 09. Profile values are design guidance.");
  notes(s, t, "Book 04, Appendix C — Tenant relationship and cross-tenant access settings.");
}

// ------------------------------------------------------------------ 6 What: Conditional Access
{
  const t = "Conditional Access: one partner list, five policies";
  const s = slide("Module 1 — Assurance and the default route", "What", t);
  box(s, "Include", 0.6, 1.5, 4.0, 1.85, HEX.tealTint);
  txt(s, "Include text", [{ text: "Include partner users", options: { bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: "CA009  MFA on all resources", options: { breakLine: true } }, { text: "CA010  terms of use" }],
    { x: 0.8, y: 1.6, w: 3.6, h: 1.65, fontSize: 15, paraSpaceAfter: 4 });
  box(s, "Except", 4.75, 1.5, 4.0, 1.85, HEX.navyTint);
  txt(s, "Except text", [{ text: "Guest limits, except partners", options: { bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: "CA011, CA012, CA038", options: { breakLine: true } }, { text: "Match guest-type externals only" }],
    { x: 4.95, y: 1.6, w: 3.6, h: 1.65, fontSize: 15, paraSpaceAfter: 4 });
  box(s, "Owner", 8.9, 1.5, 3.85, 1.85, HEX.amberTint);
  txt(s, "Owner text", [{ text: "One list, one owner", options: { bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: "Identical in all five; the IGO owns it; a partner joins at go-live, leaves at exit" }],
    { x: 9.1, y: 1.6, w: 3.45, h: 1.65, fontSize: 14.5, paraSpaceAfter: 4 });
  txt(s, "Member head", "Why the user type matters: an external Member", { x: 0.6, y: 3.5, w: 12.15, h: 0.45, fontSize: 17, bold: true, color: HEX.red });
  txt(s, "Member list", bullets([
    "gets member-level directory permissions; a guest can't enumerate users or groups",
    "from an unlisted tenant escapes CA011, CA012 and CA038",
    "falls outside the Externals persona, and outside groups and reviews scoped to guests",
    "gets different Microsoft 365 experiences over time, Microsoft says",
  ], 14.5), { x: 0.6, y: 3.95, w: 12.15, h: 1.45, paraSpaceAfter: 3 });
  callout(s, "Check", 5.5, 1.0, "FaListCheck", HEX.navy, "Read-only check: ",
    "Graph compares the partner list across the five policies, and against the partner entries in cross-tenant access settings. A mismatch is drift.");
  sources(s, "Sources: Microsoft Learn: Conditional Access for External ID. Book 04, Appendix C (Conditional Access linkage) and Appendix A (the policy templates).");
  notes(s, t, "Book 04, Appendix C — Conditional Access linkage.");
}

// ------------------------------------------------------------------ Module 2 divider
{
  const t = "Module 2: The sync exception and the roles";
  const s = divider("Module 2 — The sync exception and the roles", t, "Book 04, Appendix C and Book 03, Chapter 15", ["Cross-tenant sync: the conditions and the terms", "When a sync relationship ends", "Who does the work"], 3);
  notes(s, t, "Book 04, Appendix C — The exception profile; Book 03, Chapter 15.");
}

// ------------------------------------------------------------------ 7 What: sync exception
{
  const t = "Cross-tenant sync: an exception with conditions";
  const s = slide("Module 2 — The sync exception and the roles", "What", t);
  box(s, "Conditions", 0.6, 1.5, 4.6, 4.85, HEX.amberTint);
  txt(s, "Conditions text", [
    { text: "Allow only when all hold", options: { bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", breakLine: true } },
    ...bullets([
      "Partner's people are internal members of an Entra tenant",
      "Too many, or too much churn, for per-person requests; reason written down",
      "Agreement covers privacy, consent and minimization",
      "Privacy office and records officer have seen the attributes",
      "Business owner decides; sponsor named",
    ], 14.5),
  ], { x: 0.8, y: 1.6, w: 4.2, h: 4.65, paraSpaceAfter: 6 });
  const rows = [
    head(["Term the agency states", "Profile requirement"]),
    ["User type mapping", "Guest, applied Always (default: Member)"],
    ["Matching", "alternativeSecurityIds only; can't be changed"],
    ["Deletion threshold", "Below the expected population (default 500)"],
    ["Quarantine notice", "Partner mailbox that forwards to the sponsor"],
    ["Scope", "Assigned users and groups; direct members only"],
    ["Address list", "showInAddressList False unless needed"],
    ["Cycle", "Every 40 minutes; suspension doesn't wait"],
  ];
  s.addTable(rows, tableOpts([2.85, 4.5], { x: 5.4, y: 1.5, fontSize: 13.5, rowH: 0.5 }));
  txt(s, "Access note", [{ text: "Sync creates the account; it doesn't grant access. ", options: { bold: true, color: HEX.navy } }, { text: "Access still comes through an access package, with expiry and quarterly review." }],
    { x: 5.4, y: 5.75, w: 7.35, h: 0.65, fontSize: 14 });
  sources(s, "Sources: Microsoft Learn: cross-tenant synchronization overview; Configure cross-tenant synchronization. Book 04, Appendix C (The exception profile).");
  notes(s, t, "Book 04, Appendix C — The exception profile: cross-tenant synchronization.");
}

// ------------------------------------------------------------------ 8 What: ending sync
{
  const t = "When a sync relationship ends";
  const s = slide("Module 2 — The sync exception and the roles", "What", t);
  const cols = [
    ["FaArrowsRotate", "Deprovisioning follows the source", HEX.navy, HEX.navyTint, [
      "Delete or unassign at the source: soft-deleted at the agency, restorable 30 days",
      "A block set at the agency lasts only until the source user changes",
      "So an agency suspension also removes the access package assignment"]],
    ["FaPlugCircleXmark", "A severed relationship leaves accounts", HEX.red, HEX.redTint, [
      "Deleting the sync policy leaves the users it created",
      "Turning off inbound sync doesn't touch users already synced",
      "Clean exit: partner unassigns all, agency keeps sync on, then turns it off and deletes the rest (T10)"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 6.12;
    box(s, `Col ${i + 1}`, x, 1.5, 6.0, 3.3, c[3]);
    icon(s, c[0], x + 0.22, 1.65, 0.62, c[2]);
    txt(s, `Col ${i + 1} head`, c[1], { x: x + 1.0, y: 1.65, w: 4.8, h: 0.62, fontSize: 17, bold: true, fontFace: "Cambria", color: c[2], valign: "middle" });
    txt(s, `Col ${i + 1} text`, bullets(c[4], 14.5), { x: x + 0.25, y: 2.4, w: 5.5, h: 2.3, paraSpaceAfter: 6 });
  });
  callout(s, "Licensing", 5.0, 1.45, "FaCloud", HEX.amber, "Licensing and clouds: ",
    "Entra ID P1 per synced user in the source; group and cross-cloud sync need ID Governance or the Entra Suite there. One sync instance per tenant pair. Cross-cloud carries users only, and manager isn't synced across clouds, so no approval may depend on a synced manager.");
  sources(s, "Sources: Microsoft Learn: cross-tenant synchronization overview; Update crossTenantIdentitySyncPolicyPartner. Book 04, Appendix C.");
  notes(s, t, "Book 04, Appendix C — The exception profile (deprovisioning; a severed relationship; cloud pair and licensing).");
}

// ------------------------------------------------------------------ 9 Who
{
  const t = "Who does the work";
  const s = slide("Module 2 — The sync exception and the roles", "Who", t);
  const rows = [
    head(["Activity", "Partner", "Agency: does the work (R)", "Consulted"]),
    ["Affiliation", "Accurate record of who works there", "Sponsor", "—"],
    ["Proofing and credential", "Proofs; issues, revokes, reports compromise", "Identity engineering", "ISSO"],
    ["Attributes", "Accurate, minimal attributes and change events", "Identity engineering", "Sponsor; privacy office"],
    ["Authentication and authorization", "Trustworthy assertions; agreed attributes only", "Identity engineering; sponsor", "Application owner"],
    ["Lifecycle", "Timely mover, leaver, disable notices", "Sponsor; identity engineering", "—"],
    ["Incident response", "Notifies and coordinates", "Security operations (contains first)", "ISSO"],
    ["Evidence and go-live", "Attestations; signs the agreement", "Sponsor", "ISSO; AO (required at go-live)"],
  ];
  s.addTable(rows, tableOpts([2.75, 3.7, 3.2, 2.5], { y: 1.5, fontSize: 13.5, rowH: 0.52 }));
  txt(s, "Decider", [{ text: "Decides every row: ", options: { bold: true, color: HEX.navy } }, { text: "the agency business owner. The IGO owns the partner tenant list and is alerted to any cross-tenant change." }],
    { x: 0.6, y: 5.9, w: 12.15, h: 0.65, fontSize: 15 });
  sources(s, "Sources: Book 03, Chapter 15 (Responsibility for partner identity); Book 04, Chapter 06 and Appendix C (Monitoring). Design guidance.");
  notes(s, t, "Book 03, Chapter 15 — Who does what: partner and agency.");
}

// ------------------------------------------------------------------ Module 3 divider
{
  const t = "Module 3: Proving it";
  const s = divider("Module 3 — Proving it", t, "Book 03, Appendix D and Book 04, Appendix C", ["The partner identity record", "Ten validation tests, T0 to T10", "Monitoring and drift", "Requirements, KSIs and evidence; the government-cloud check"], 5);
  notes(s, t, "Book 03, Appendix D; Book 04, Appendix C.");
}

// ------------------------------------------------------------------ 10 How: the record
{
  const t = "The partner identity record";
  const s = slide("Module 3 — Proving it", "How", t);
  const secs = ["A. Authority and purpose", "B. Owners", "C. Risk, agreement and assurance", "D. Route and user type", "E. Lifecycle and operations", "F. Readiness checks"];
  secs.forEach((x0, i) => {
    const y = 1.5 + i * 0.6;
    box(s, `Section ${i + 1}`, 0.6, y, 4.3, 0.5, HEX.navyTint);
    txt(s, `Section ${i + 1} text`, x0, { x: 0.75, y, w: 4.05, h: 0.5, fontSize: 15, bold: true, color: HEX.navy, valign: "middle" });
  });
  const rules = [
    ["Reference, don't copy", "Agreement, privacy determination and records schedule go in as identifiers and dates."],
    ["One decider", "Each readiness check names the business owner; the AO is consulted on the last."],
    ["A blank is a finding", "Write none or not applicable, with a reason."],
  ];
  rules.forEach((r, i) => {
    const y = 1.5 + i * 1.15;
    box(s, `Rule ${i + 1}`, 5.15, y, 7.6, 1.02, "FFFFFF", HEX.teal);
    txt(s, `Rule ${i + 1} text`, [{ text: r[0], options: { bold: true, color: HEX.teal, fontSize: 16, breakLine: true } }, { text: r[1], options: { fontSize: 14 } }],
      { x: 5.35, y: y + 0.05, w: 7.25, h: 0.92, valign: "middle" });
  });
  callout(s, "Entra values", 5.15, 1.3, "FaClipboardCheck", HEX.navy, "The Entra profile fills in: ",
    "tenant relationship (T0), cross-tenant settings with the agreement clause behind each, configuration IDs, sync groups and mappings, access governance, T0–T10 results and monitoring. One record per partner and use case, in the repository beside the configuration.");
  sources(s, "Sources: Book 03, Appendix D (Partner Identity Record); Book 04, Appendix C (The profile record) and Chapter 10.");
  notes(s, t, "Book 03, Appendix D — Partner Identity Record; Book 04, Appendix C — The profile record.");
}

// ------------------------------------------------------------------ 11 How: tests
{
  const t = "Ten validation tests, T0 to T10";
  const s = slide("Module 3 — Proving it", "How", t);
  const tests = [
    ["T0", "Relationship: tenant ID, trust and redemption match the record", false],
    ["T1", "Create: guest via access package request; My Access loads under CA009", true],
    ["T2", "User type: every partner account is a Guest", false],
    ["T3", "Disable: emergency suspension, sessions revoked", true],
    ["T4", "Remove: assignment removed; blocked, then deleted", true],
    ["T5", "Collision: duplicates and unredeemed invitations", false],
    ["T6", "Negative access: no assignment, unlisted tenant", false],
    ["T7", "MFA: CA009 applied and satisfied", false],
    ["T8", "Device: compliant vs non-compliant, if trusted", false],
    ["T9", "Rollback: re-enable, or restore within 30 days", true],
    ["T10", "Partner exit: remove all; sync off; delete the rest", true],
  ];
  tests.forEach((tt, i) => {
    const col = i < 6 ? 0 : 1, row = i < 6 ? i : i - 6;
    const x = 0.6 + col * 6.12, y = 1.5 + row * 0.57;
    txt(s, `Test ${tt[0]}`, [{ text: `${tt[0]}  `, options: { bold: true, color: HEX.navy } }, { text: tt[1] }, ...(tt[2] ? [{ text: "  WRITES", options: { bold: true, color: HEX.red, fontSize: 12 } }] : [])],
      { x, y, w: 6.0, h: 0.52, fontSize: 14.5, valign: "middle" });
  });
  callout(s, "Tenant", 5.0, 1.45, "FaTriangleExclamation", HEX.amber, "Test tenant first: ",
    "copy-paste Microsoft Graph PowerShell, checked against the Graph PowerShell reference on November 6, 2026 but not yet run against a tenant. Each WRITES test says how to undo it.");
  sources(s, "Sources: Microsoft Learn: View, add, and remove assignments for an access package. Book 04, Appendix C (Validation tests).");
  notes(s, t, "Book 04, Appendix C — Validation tests.");
}

// ------------------------------------------------------------------ 12 How: monitoring
{
  const t = "Monitoring and drift";
  const s = slide("Module 3 — Proving it", "How", t);
  const rows = [
    head(["Signal", "Where it is", "What to watch"]),
    ["Provisioning logs (sync)", "The partner's tenant", "Failures, quarantine, deletion holds; delivered under the agreement"],
    ["Target-side sync changes", "Agency audit log, Microsoft.Azure.SyncFabric", "Creates, updates, deletes against the expected count"],
    ["Entitlement management", "Audit category EntitlementManagement", "Requests, approvals, expiries, removals"],
    ["Sign-ins", "Agency sign-in log", "CA009 failures; denied attempts after removal"],
    ["Cross-tenant settings", "Audit category CrossTenantAccessSettings", "Any change, alerted to the IGO"],
    ["Drift", "Repository and the five-policy check", "List mismatch; non-Guest without a record; trust values"],
  ];
  s.addTable(rows, tableOpts([2.8, 4.1, 5.25], { y: 1.5, fontSize: 13, rowH: 0.5 }));
  callout(s, "Alerts", 5.2, 1.25, "FaChartLine", HEX.red, "Alerts (design guidance): ",
    "High for a Member partner with no record, a sync cycle deleting more than expected, or a partner list mismatch; Medium for a cross-tenant change outside a pull request. Native log retention is 30 days, so stream to the workspace.");
  sources(s, "Sources: Microsoft Learn: Configure cross-tenant synchronization; signIn resource type; Cross-tenant access overview. Book 04, Appendix C (Monitoring) and Chapter 09.");
  notes(s, t, "Book 04, Appendix C — Monitoring.");
}

// ------------------------------------------------------------------ 13 How: requirements
{
  const t = "Requirements, KSIs and the evidence";
  const s = slide("Module 3 — Proving it", "How", t);
  const rows = [
    head(["Step", "SP 800-53 Rev. 5", "KSI", "Evidence the ISSO keeps"]),
    ["Partner entry, scope, trust (T0)", "AC-3, AC-20, IA-8", "IAM-ELP, IAM-APM", "T0 output; settings file; agreement clause per trust value"],
    ["Access package, approval, expiry", "AC-2, AC-2(2), AC-6(7)", "IAM-AAM, IAM-APM", "Policy export; approvals; review history"],
    ["Create and user type (T1, T2)", "AC-2(2), AC-6", "IAM-AAM, IAM-ELP", "T1, T2 output; Member exception records"],
    ["Suspend, remove, exit (T3, T4, T10)", "AC-2(3); PS-4/PS-5 via the agreement", "IAM-AAM, IAM-ELP", "Commands, timestamps, post-state, exit confirmation"],
    ["Collision, denial, MFA, device (T5–T8)", "AC-3, IA-8, IA-2(1)", "IAM-ELP, IAM-APM", "Outputs with error codes; CA009 sign-ins"],
    ["Monitoring; drift", "AU-6, AC-2(4); CA-7, CM-6", "MLA-RVL, MLA-LET; MLA-EVC", "Alert rules; sync summary; drift reports"],
  ];
  s.addTable(rows, tableOpts([3.35, 2.85, 2.35, 3.6], { y: 1.5, fontSize: 12.5, rowH: 0.52 }));
  txt(s, "KSI note", [{ text: "KSIs describe what cloud service providers report. ", options: { bold: true, color: HEX.navy } },
    { text: "The agency lines its evidence up with them and doesn't report them itself; the services used must sit inside a FedRAMP-certified offering its own authorization relies on." }],
    { x: 0.6, y: 5.55, w: 12.15, h: 0.95, fontSize: 14 });
  sources(s, "Sources: NIST SP 800-53 Rev. 5; FedRAMP KSIs; Using a FedRAMP Certified Cloud Service. Book 04, Appendix C; Book 03, Chapter 15. Mapping is design guidance.");
  notes(s, t, "Book 04, Appendix C — Requirements, KSIs and evidence; Book 03, Chapter 15 — Requirements and KSI map.");
}

// ------------------------------------------------------------------ 14 How: gov cloud
{
  const t = "Government clouds, and what isn't verified";
  const s = slide("Module 3 — Proving it", "How", t);
  const rows = [
    head(["Feature", "Agency tenant in GCC", "Partner in GCC High or DoD"]),
    ["Entitlement management", "Available (ID Governance in GCC, GCC High, DoD)", "Connected org: Entra ID in another cloud"],
    ["B2B collaboration", "Available", "Both enable each other's cloud; no direct connect"],
    ["Cross-tenant sync", "Users and groups, same cloud", "Cross-cloud: users only; no manager"],
  ];
  s.addTable(rows, tableOpts([2.9, 4.6, 4.65], { y: 1.5, fontSize: 13.5, rowH: 0.5 }));
  box(s, "Unverified", 0.6, 3.75, 12.15, 2.7, HEX.redTint);
  txt(s, "Unverified text", [
    { text: "Not verified: confirm before relying on it", options: { bold: true, color: HEX.red, fontSize: 17, fontFace: "Cambria", breakLine: true } },
    ...bullets([
      "Whether cross-cloud sync is generally available (one Microsoft 365 page: public preview, August 2025)",
      "FedRAMP boundary rules for each feature used for partners; confirm with the ISSO",
      "Records schedules for partner agreements, memoranda and access reviews",
      "The SP 800-63C-4 planning note of October 6, 2026; Teams doesn't support external members across clouds",
    ], 14.5),
  ], { x: 0.85, y: 3.85, w: 11.7, h: 2.5, paraSpaceAfter: 5 });
  sources(s, "Sources: Microsoft Learn: Microsoft Entra feature availability; cross-tenant synchronization overview. Book 04, Appendix C; Book 03, Chapter 15. Read November 6, 2026.");
  notes(s, t, "Book 04, Appendix C — Government-cloud availability check; Book 03, Chapter 15 — What this chapter has not verified.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Microsoft Learn: cross-tenant synchronization overview; Configure cross-tenant synchronization; Update crossTenantIdentitySyncPolicyPartner; Manage connected organizations; Govern access for external users.",
    "Microsoft Learn: entitlementManagementSettings; accessPackageAssignmentPolicy; View, add, and remove assignments for an access package; Cross-tenant access overview; Conditional Access for External ID.",
    "Microsoft Learn: properties of B2B guest users; signIn resource type; Cross-cloud collaboration with Microsoft 365; Microsoft Entra feature availability. All accessed November 6, 2026.",
    "NIST SP 800-63-4 and SP 800-63C-4 (July 31, 2025).  ·  NIST SP 800-53 Rev. 5.  ·  FedRAMP KSIs (Consolidated Rules for 2026).  ·  Using a FedRAMP Certified Cloud Service.",
    "Workbook: Book 03, Chapter 15 and Appendix D; Book 04, Appendix C (all draft, November 6, 2026); Book 04, Appendix A (the policy templates).",
  ];
  txt(s, "Source list", bullets(src, 13.5), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

if (n !== SAY.length) throw new Error(`built ${n} narrated slides, narration.json has ${SAY.length}`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
