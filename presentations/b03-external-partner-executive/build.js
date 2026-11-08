// Book 03 — HR-Driven Identity, Chapter 15 External Partner Identity: the EXECUTIVE briefing.
// Audience: CIO, CISO, business owners of programs shared with partners, privacy officer, authorizing official.
// Decision-centered; no configuration detail (the technical deep dive in ../b03-external-partner-technical/ has it).
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B03_External_Partner_Executive.pptx
// Every fact comes from a footnoted page: Book 03 Chapter 15 and Appendix D, and Book 04 Appendix C (the
// Microsoft Entra profile), named in the notes. The responsibility table, the standard, the route, Guest by
// default and the readiness checks are the book's design guidance, labeled as such. The chapter is a draft.
// The spoken narration lives in narration.json; each slide's notes carry the same text and a "Workbook:" line.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 03", title: "HR-Driven Identity",
  footer: "Federal Modernization Workbook  ·  Book 03 HR-Driven Identity  ·  External Partner Identity, executive briefing" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B03_External_Partner_Executive.pptx";

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
const card = (s, name, x, y, w, h, iconName, color, tint, headText, body, size) => {
  box(s, name, x, y, w, h, tint);
  icon(s, iconName, x + 0.22, y + 0.22, 0.62, color);
  txt(s, `${name} head`, headText, { x: x + 1.0, y: y + 0.22, w: w - 1.2, h: 0.62, fontSize: 18, bold: true, fontFace: "Cambria", color, valign: "middle" });
  txt(s, `${name} text`, body, { x: x + 0.25, y: y + 1.0, w: w - 0.5, h: h - 1.15, fontSize: size || 15, paraSpaceAfter: 5 });
};
const decision = (s, text) => callout(s, "Decision", 5.55, 0.95, "FaScaleBalanced", HEX.amber, "Decision: ", text);

// ------------------------------------------------------------------ 1 Title
{
  const s = D.titleSlide("Why a partner class", "External Partner Identity: the executive briefing", "HR-Driven Identity, Chapter 15, with the Entra profile in Access & Privilege");
  D.agenda(s, 0.8, 4.85, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "For the CIO, CISO, business owners, privacy officer and authorizing official", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 8, h: 0.8, fontSize: 16 });
  notes(s, "External Partner Identity: the executive briefing", "Book 03, Chapter 15 — External Partner Identity; Book 04, Appendix C.");
}

// ------------------------------------------------------------------ 2 Why: work for someone else
{
  const t = "Many who sign in work for someone else";
  const s = slide("Why a partner class", "Why", t);
  const people = [
    ["FaLandmark", "A state benefits examiner"], ["FaPeopleArrows", "A tribal health officer"],
    ["FaBuildingColumns", "An analyst at another agency"], ["FaScaleBalanced", "A compliance officer at a regulated bank"],
  ];
  people.forEach((p, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Person ${i + 1}`, x, 1.6, 2.95, 1.75, HEX.navyTint);
    icon(s, p[0], x + 1.1, 1.75, 0.7, HEX.navy);
    txt(s, `Person ${i + 1} text`, p[1], { x: x + 0.15, y: 2.5, w: 2.65, h: 0.75, fontSize: 15.5, bold: true, color: HEX.navy, align: "center" });
  });
  txt(s, "Point", bullets([
    "Each is employed, proofed and credentialed by someone else.",
    "When the examiner leaves the state, the state's HR system knows first, and possibly only.",
    "The agency can't key, correct or see that record except through what the partner sends.",
  ], 16), { x: 0.6, y: 3.6, w: 12.15, h: 1.6, paraSpaceAfter: 6 });
  callout(s, "Thesis", 5.35, 1.15, "FaTriangleExclamation", HEX.red, "The point: ",
    "a partner's account proves that another organization vouches for a person. It doesn't prove that the agency has decided to let that person in.");
  sources(s, "Sources: Book 03, Chapter 15 (Why a partner is not an employee or a contractor); Chapters 02 and 06.");
  notes(s, t, "Book 03, Chapter 15 — Why a partner is not an employee or a contractor.");
}

// ------------------------------------------------------------------ 3 Why: authority splits
{
  const t = "Authority splits in two";
  const s = slide("Why a partner class", "Why", t);
  card(s, "Partner", 0.6, 1.55, 6.0, 3.55, "FaBuilding", HEX.teal, HEX.tealTint, "The partner is authoritative for",
    bullets(["The person's affiliation: who works there, in what role", "The credential it issues: whether it's valid, and when it ends", "Usually, proofing the person too"], 15.5));
  card(s, "Agency", 6.75, 1.55, 6.0, 3.55, "FaBuildingColumns", HEX.navy, HEX.navyTint, "The agency is authoritative for",
    bullets(["Whether it trusts the partner's identity service at all", "Which partner persons are eligible, and what they may access", "The assurance each transaction needs", "Monitoring, review, suspension and termination"], 15.5));
  callout(s, "Rule", 5.3, 1.2, "FaKey", HEX.red, "One rule follows: ",
    "no partner account gets access just because it exists or synchronizes. Access is an agency decision with an approver, a sponsor, an expiry and evidence.");
  sources(s, "Sources: Book 03, Chapter 15; Book 04, Chapter 01; FICAM Architecture (enterprise ICAM covers \"authorized partners\").");
  notes(s, t, "Book 03, Chapter 15 — Why a partner is not an employee or a contractor.");
}

// ------------------------------------------------------------------ 4 What: class and borders
{
  const t = "One class, with clear borders";
  const s = slide("What the class is", "What", t);
  txt(s, "Definition", [
    { text: "External Partner Person: ", options: { bold: true, color: HEX.navy } },
    { text: "a person whose employment or affiliation record and primary credential are held by another organization: a state, a tribal government, another federal agency, a financial institution, an academic or nonprofit partner. The class covers people; the organization is the partner." },
  ], { x: 0.6, y: 1.5, w: 12.15, h: 1.05, fontSize: 16 });
  const rules = [
    ["Partner is not public", "A benefit applicant isn't a workforce guest, even if a partner delivers the benefit.", HEX.navy, HEX.navyTint],
    ["Partner is not contractor", "Agency contract and sponsor, agency business: a contractor, even with their own directory.", HEX.teal, HEX.tealTint],
    ["Privilege is an overlay", "Admin roles take the same privileged path. Break-glass accounts are always the agency's own.", HEX.amber, HEX.amberTint],
    ["People and agents apart", "An AI agent acting for a partner is a non-person identity with its own sponsor.", HEX.red, HEX.redTint],
  ];
  rules.forEach((r, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Border ${i + 1}`, x, 2.75, 2.95, 2.55, r[3]);
    txt(s, `Border ${i + 1} text`, [{ text: r[0], options: { bold: true, color: r[2], fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: r[1], options: { fontSize: 14.5 } }],
      { x: x + 0.2, y: 2.9, w: 2.55, h: 2.3, paraSpaceAfter: 6 });
  });
  txt(s, "Neighbors", "The other classes keep their homes: federal employee, contractor, public or beneficiary, privileged administrator, non-person, AI agent, break-glass.",
    { x: 0.6, y: 5.5, w: 12.15, h: 0.85, fontSize: 15, italic: true, color: HEX.slate });
  sources(s, "Sources: Book 03, Chapter 15 (The class and its boundary to the other classes); Book 04, Chapter 04; Book 17, Chapter 04.");
  notes(s, t, "Book 03, Chapter 15 — The class and its boundary to the other classes.");
}

// ------------------------------------------------------------------ 5 What: Guest by default
{
  const t = "Guest by default; Member only by exception";
  const s = slide("What the class is", "What", t);
  const rows = [
    head(["Term", "What it is", "For partner persons"]),
    ["Class", "Who is authoritative, and who owns access", "External Partner Person"],
    ["Worker type", "The HR attribute for the agency's own workers", "None: no agency HR record"],
    ["Persona", "The Conditional Access targeting unit", "Externals, matched one to one with the class"],
  ];
  s.addTable(rows, tableOpts([2.2, 5.0, 4.95], { y: 1.55, fontSize: 15.5, rowH: 0.55 }));
  box(s, "Why box", 0.6, 3.95, 12.15, 1.35, HEX.redTint);
  icon(s, "FaTriangleExclamation", 0.85, 4.25, 0.7, HEX.red);
  txt(s, "Why text", [{ text: "Where the views diverge: ", options: { bold: true, color: HEX.red } },
    { text: "member baselines, such as the compliant-device policies, exclude guests. A partner created as a member falls into the internal baselines and out of the partner ones." }],
    { x: 1.8, y: 4.05, w: 10.75, h: 1.15, fontSize: 16, valign: "middle" });
  decision(s, "partner persons are Guest by default (WD-134); a Member partner needs an exception record with a reason, an approver and a review date.");
  sources(s, "Sources: Book 03, Chapter 15 (Class, worker type and persona); Book 04, Chapter 03 and Appendix C (Conditional Access linkage). Design guidance.");
  notes(s, t, "Book 03, Chapter 15 — Class, worker type and persona; Book 04, Appendix C — Conditional Access linkage.");
}

// ------------------------------------------------------------------ 6 What: the standard
{
  const t = "A short standard in nine control areas";
  const s = slide("What the class is", "What", t);
  const areas = ["Partner qualification", "Trust establishment", "Population scope", "Assurance", "Authorization", "Lifecycle", "Data protection", "Operations", "Evidence"];
  areas.forEach((a, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 2.4, y = 1.55 + row * 0.95;
    box(s, `Area ${i + 1}`, x, y, 2.28, 0.8, HEX.navyTint);
    txt(s, `Area ${i + 1} text`, `${i + 1}. ${a}`, { x: x + 0.12, y, w: 2.05, h: 0.8, fontSize: 14.5, bold: true, color: HEX.navy, valign: "middle" });
  });
  const pts = [
    ["Authorization ≠ authentication", "A valid partner sign-in proves where the person signed in. Only an agency assignment opens the system."],
    ["Partner exit is a lifecycle event", "When an agreement ends, accounts are removed, not left disabled."],
    ["Statements are not controls", "A partner saying it requires MFA is input. A policy the agency enforces and tests is the control."],
  ];
  pts.forEach((p, i) => {
    const y = 1.55 + i * 0.95;
    txt(s, `Point ${i + 1}`, [{ text: p[0], options: { bold: true, color: HEX.teal, fontSize: 16, breakLine: true } }, { text: p[1], options: { fontSize: 14 } }],
      { x: 8.0, y, w: 4.75, h: 0.9 });
  });
  callout(s, "Record", 4.55, 1.0, "FaClipboardCheck", HEX.navy, "Each area becomes a section of the record: ",
    "one partner identity record per relationship, written before access is granted and kept as evidence after.");
  sources(s, "Sources: Book 03, Chapter 15 (The standard, in nine control areas) and Appendix D; CISA Zero Trust Maturity Model. Design guidance.");
  notes(s, t, "Book 03, Chapter 15 — The standard, in nine control areas; Appendix D — Partner Identity Record.");
}

// ------------------------------------------------------------------ 7 Who
{
  const t = "One decider per row: the business owner";
  const s = slide("Who decides", "Who", t);
  const roles = [
    ["FaUserTie", "Agency business owner", HEX.navy, "Decides every row, from affiliation to production. The record names a person; the title is provisional."],
    ["FaUserCheck", "Sponsor", HEX.teal, "Vouches for the partner's people, reviews their access, requests suspensions. Never approves their own requests."],
    ["FaUsersGear", "Identity governance officer", HEX.amber, "Owns the list of approved partner organizations and tenants."],
    ["FaShieldHalved", "Authorizing official", HEX.red, "Required consult on production enablement. An overridden objection becomes a risk acceptance: the AO's call."],
  ];
  roles.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.75;
    box(s, `Role ${i + 1}`, x, y, 6.0, 1.6, "FFFFFF", r[2]);
    icon(s, r[0], x + 0.2, y + 0.42, 0.75, r[2]);
    txt(s, `Role ${i + 1} text`, [{ text: r[1], options: { bold: true, color: r[2], fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: r[3], options: { fontSize: 14 } }],
      { x: x + 1.15, y: y + 0.1, w: 4.7, h: 1.4, valign: "middle" });
  });
  callout(s, "Incident", 5.15, 1.2, "FaTriangleExclamation", HEX.amber, "In a live incident: ",
    "security operations contains first, and the business owner is told after. The partner notifies and coordinates under the agreement.");
  sources(s, "Sources: Book 03, Chapter 15 (Who does what: partner and agency); Book 04, Chapter 06 (the responsibility matrix; exceptions). Design guidance.");
  notes(s, t, "Book 03, Chapter 15 — Who does what: partner and agency.");
}

// ------------------------------------------------------------------ 8 How: assurance
{
  const t = "Assurance is chosen per transaction";
  const s = slide("How a partner goes live", "How", t);
  const rows = [
    head(["Scale", "Who performs it for a partner", "What the agency records"]),
    ["Identity proofing (IAL)", "The partner, under its own practice", "Whether that practice meets the selected IAL"],
    ["Authentication (AAL)", "The partner's identity service", "The authenticators accepted, and how they're verified"],
    ["Federation (FAL)", "The agency, as relying party, per application", "The FAL each application requires, and the checks"],
  ];
  s.addTable(rows, tableOpts([2.9, 4.4, 4.85], { y: 1.5, fontSize: 14.5, rowH: 0.5 }));
  const cols = [
    ["One row per transaction", "A bank officer filing and a state examiner reading can land at different levels on one system.", HEX.navy, HEX.navyTint],
    ["M-22-09", "Phishing-resistant MFA for staff, contractors and partners; each agency defines the partner category.", HEX.teal, HEX.tealTint],
    ["FIPS 201-3", "Scope is federal employees and contractors. Never call a partner credential PIV-equivalent without a policy to cite.", HEX.red, HEX.redTint],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Rule ${i + 1}`, x, 3.75, 3.95, 2.65, c[3]);
    txt(s, `Rule ${i + 1} text`, [{ text: c[0], options: { bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: c[1], options: { fontSize: 14.5 } }],
      { x: x + 0.2, y: 3.9, w: 3.55, h: 2.4, paraSpaceAfter: 6 });
  });
  sources(s, "Sources: NIST SP 800-63-4; SP 800-63C-4; OMB M-22-09; FIPS 201-3. Book 03, Chapter 15 (Assurance by transaction risk).");
  notes(s, t, "Book 03, Chapter 15 — Assurance by transaction risk.");
}

// ------------------------------------------------------------------ 9 How: the route
{
  const t = "The route in: a request, an approval, an expiry";
  const s = slide("How a partner goes live", "How", t);
  const steps = [
    ["Qualified first", "Record, signed agreement, trust scoped to this partner only"],
    ["Approved request", "Sponsor, approver and an expiry; approval creates the account and access"],
    ["A guest", "Guest by default; Member is an exception record"],
    ["Ends with the last assignment", "Blocked, then removed"],
  ];
  steps.forEach((st, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Step ${i + 1}`, x, 1.55, 2.95, 2.05, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Step ${i + 1} text`, [{ text: `${i + 1}. ${st[0]}`, options: { bold: true, fontSize: 17, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy, breakLine: true } }, { text: st[1], options: { fontSize: 14.5 } }],
      { x: x + 0.2, y: 1.7, w: 2.55, h: 1.8, paraSpaceAfter: 5 });
  });
  txt(s, "Exception", [
    { text: "Automatic provisioning is an exception. ", options: { bold: true, color: HEX.amber } },
    { text: "It moves the eligibility decision to whoever controls the partner's groups, and copies personal data across organizations on a schedule. Use it only with a recorded reason, an agency-approved scope, and the same expiry and review." },
  ], { x: 0.6, y: 3.8, w: 12.15, h: 1.15, fontSize: 15.5 });
  callout(s, "Entra", 5.1, 1.35, "FaCloud", HEX.navy, "In Microsoft Entra: ",
    "the default is entitlement management with B2B collaboration guests. Microsoft Learn: cross-tenant synchronization is \"intended for use within an organization\"; use entitlement management across organizations.");
  sources(s, "Sources: Book 03, Chapter 15 (The route into the tenant); Book 04, Appendix C and Chapter 09; Microsoft Learn: cross-tenant synchronization overview.");
  notes(s, t, "Book 03, Chapter 15 — The route into the tenant; Book 04, Appendix C — The default route.");
}

// ------------------------------------------------------------------ 10 How: privacy
{
  const t = "Privacy, records and redress before go-live";
  const s = slide("How a partner goes live", "How", t);
  const cards = [
    ["FaFileShield", "System of records", HEX.navy, HEX.navyTint, "Partner directory, access decisions and sign-in logs are retrieved by name and identifier. SORN coverage is the privacy office's call, made before go-live."],
    ["FaFilter", "Minimization", HEX.teal, HEX.tealTint, "Name, work email, an immutable partner identifier, the partner organization and, where needed, a role. No HR codes or home data."],
    ["FaBook", "Records", HEX.amber, HEX.amberTint, "GRS 3.2 covers system access records. Schedules for agreements and reviews aren't verified: the records officer names them."],
    ["FaRightLeft", "Redress", HEX.red, HEX.redTint, "A wrong name is fixed at the partner's source. An agency decision, such as a suspension, is disputed through the agency's process."],
  ];
  cards.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    card(s, `Duty ${i + 1}`, 0.6 + col * 6.12, 1.5 + row * 2.3, 6.0, 2.15, c[0], c[2], c[3], c[1], c[4], 14.5);
  });
  txt(s, "508", "The request, approval, notice and redress workflows are information and communication technology the agency provides: Section 508 applies.",
    { x: 0.6, y: 6.15, w: 12.15, h: 0.42, fontSize: 13.5, italic: true, color: HEX.slate });
  sources(s, "Sources: Privacy Act of 1974; NARA GRS 3.2; Section 508. Book 03, Chapters 14 and 15 (Privacy, records and redress).");
  notes(s, t, "Book 03, Chapter 15 — Privacy, records and redress; Chapter 14.");
}

// ------------------------------------------------------------------ 11 How: readiness checks
{
  const t = "Eleven readiness checks before production";
  const s = slide("How a partner goes live", "How", t);
  const checks = [
    "Class and authoritative source confirmed", "Requirements applicability recorded", "Agreement, privacy, records, boundary reviewed",
    "Assurance selected per transaction", "Owners named; escalation contacts tested", "Population and unique count reconciled",
    "Attributes and claims minimized", "Create to rollback tested, with suspension", "Access tested, including denials",
    "Monitoring, review, drift, runbooks operating", "Production enablement (AO consulted)",
  ];
  checks.forEach((c, i) => {
    const col = i < 6 ? 0 : 1, row = i < 6 ? i : i - 6;
    const x = 0.6 + col * 6.12, y = 1.5 + row * 0.6;
    txt(s, `Check ${i + 1}`, [{ text: `${String(i + 1).padStart(2, " ")}  `, options: { bold: true, color: i === 10 ? HEX.red : HEX.navy } }, { text: c }],
      { x, y, w: 6.0, h: 0.52, fontSize: 15.5, valign: "middle" });
  });
  callout(s, "Repeat", 5.2, 1.15, "FaArrowsRotate", HEX.navy, "One decider, repeated: ",
    "the business owner decides each check, and they repeat at every review. A new application reruns checks 4, 7, 9 and 11; a partner exit reruns check 8 for every account.");
  sources(s, "Sources: Book 03, Chapter 15 (Readiness checks) and Appendix D, section F. Design guidance; not the program gates G0 to G5.");
  notes(s, t, "Book 03, Chapter 15 — Readiness checks.");
}

// ------------------------------------------------------------------ 12 How: decisions
{
  const t = "The decisions to make";
  const s = slide("How a partner goes live", "How", t);
  const rows = [
    head(["Decision", "Owner", "When"]),
    ["Is the partner population covered by an existing SORN?", "Privacy office", "Before the first partner goes live"],
    ["Which records schedule items apply", "Records officer", "Before the first partner goes live"],
    ["Qualify the partner; approve the agreement", "Business owner", "Before any trust is configured"],
    ["Requirements, incl. the agency's M-22-09 partner definition", "Business owner (ISSO consulted)", "Readiness check 2"],
    ["Assurance per protected transaction", "Business owner (ISSO, app owner)", "Readiness check 4"],
    ["Automatic sync exception", "Business owner (sponsor named)", "Before sync is enabled"],
    ["Production enablement", "Business owner (AO consult on record)", "Readiness check 11"],
  ];
  s.addTable(rows, tableOpts([5.6, 3.55, 3.0], { y: 1.5, fontSize: 14, rowH: 0.56 }));
  sources(s, "Sources: Book 03, Chapter 15 (Who does what; Privacy, records and redress; Readiness checks); Book 04, Appendix C (The exception profile).");
  notes(s, t, "Book 03, Chapter 15 — Readiness checks; Book 04, Appendix C — The exception profile.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "NIST SP 800-63-4, Digital Identity Guidelines, July 31, 2025.  ·  NIST SP 800-63C-4, Federation and Assertions, July 31, 2025.",
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022 (note 7, \"partners\").  ·  FIPS 201-3, January 2022.",
    "FICAM Architecture, version 3.3.  ·  CISA Zero Trust Maturity Model, version 2.0.  ·  NIST SP 800-53 Rev. 5 (AC-2, AC-3, AC-6, AU-6, CA-3, CA-7, IA-8, PT-2, PT-3, RA-8).",
    "Privacy Act of 1974, 5 U.S.C. 552a (a)(5) and (m).  ·  NARA GRS 3.2, items 030 and 031.  ·  Section 508, 29 U.S.C. 794d.",
    "Microsoft Learn: cross-tenant synchronization overview; Govern access for external users in entitlement management.",
    "Workbook: Book 03, Chapter 15 and Appendix D; Book 04, Appendix C (all draft, November 6, 2026). Decision register WD-132 to WD-143.",
  ];
  txt(s, "Source list", bullets(src, 13.5), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

if (n !== SAY.length) throw new Error(`built ${n} narrated slides, narration.json has ${SAY.length}`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
