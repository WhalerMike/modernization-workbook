// Start series, Episode 2: The First Four Weeks — a ~6-minute EXECUTIVE briefing on what Phase 0 produces.
// Entry conditions, the platform host, the read-only assessment and its provenance, seeding the repository,
// least-privilege access for the program itself, owners and classified findings, Gate G0 and what leadership
// holds at week four.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Start_02_First_Four_Weeks.pptx
// Reuses the shared kit in ../_build/ and the helpers of ../start-here/build.js (Episode 1).
// Every fact comes from a footnoted chapter: Book 01 Ch03/Ch10/Ch12, Book 00 Ch01/Ch03/Ch08. Agency-neutral.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Start 02", title: "The First Four Weeks",
  footer: "Start series, Episode 2  ·  Federal Modernization Workbook  ·  Executive briefing" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Start_02_First_Four_Weeks.pptx";

// ------------------------------------------------------------------ helpers (as in the CyberArk research deck)
const NARR = require("./narration.js");
const used = new Set();
const WPM = 160;
let clock = 0;
const per = [];
const titles = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const title = titles[titles.length - 1];
  const say = NARR[title];
  if (!say) throw new Error(`no narration for slide: ${title}`);
  used.add(title);
  const n = say.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; per.push({ slide: pres.slides.length, n, title });
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${say.trim()}\n\nDetail: ${body.trim()}\n\nSources: ${ref}`);
};

const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams");
const img = (s, name, alt, x, y, maxW, maxH) => {
  const [series, base] = name.split("/");
  const file = path.join(DIAG, series, "png", `${base}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  return { w, h };
};
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6;
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const sources = (s, text, y = 6.62) => {
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

const T = (s, name, t, o) => {
  const size = o.fontSize || 14;
  const runs = typeof t === "string" ? [{ text: t, options: {} }] : t;
  const paras = []; let cur = { chars: 0, size };
  runs.forEach((r) => {
    const ro = r.options || {}; const sz = ro.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / size);
    if (ro.breakLine || ro.bullet) { paras.push(cur); cur = { chars: 0, size }; }
  });
  if (cur.chars) paras.push(cur);
  const need = paras.reduce((h, p) => h + lines("x".repeat(Math.round(p.chars)), o.w - 0.1, p.size) * p.size / 72 * 1.2 + (o.paraSpaceAfter || 0) / 72, 0);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
  return txt(s, name, t, o);
};

const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.32, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`slide ${pres.slides.length} ${name} table`, bottom);
  return bottom;
};

const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.34 : 0) + (runs.length ? 0.08 : 0);
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.05, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

const flow = (s, name, y, h, steps, pt = 12, x0 = 0.6, W = 12.15) => {
  const n = steps.length, gap = 0.28, w = (W - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    const runs = [{ text: st.head, options: { bold: true, color: c, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!st.body } }];
    if (st.body) runs.push({ text: st.body, options: { fontSize: pt } });
    T(s, `${name} ${i + 1} text`, runs, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, paraSpaceAfter: 2, fontSize: pt });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

const label = (s, name, text, x, y, w, color = HEX.red) =>
  txt(s, name, text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color, valign: "middle" });


const SUB = "Executive briefing  ·  Start series, Episode 2";
const S = "Episode 2";

// ================================================================== 1 Title
{
  const s = titleSlide(S, "The First Four Weeks: What Phase 0 Produces", SUB);
  txt(s, "Session map", [
    { text: "WHAT THE PRE-FLIGHT PRODUCES  ·  ABOUT 6 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Entry conditions  ·  The platform host  ·  Reading the estate  ·  Provenance", options: { color: HEX.ink, breakLine: true } },
    { text: "Least privilege  ·  Owners and findings  ·  Gate G0, Ready to Plan  ·  Week four", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 01, Ch 03, 10 and 12; Book 00, Ch 01, 03 and 08. Facts as of October 2026.", 6.08);
  notes(s,
`Episode 2 of the Start series. Episode 1 asked leadership to approve Phase 0, a four-week pre-flight that needs no vendor decision and produces an inventory, an owner and a date (Book 01 Chapter 12, "Where to start"). This episode opens that phase: the entry conditions, the platform host (Book 01 Chapter 03), the read-only assessment and its provenance (Book 01 Chapter 10), seeding the repository, least-privilege service principals, owners and classified findings, Gate G0 "Ready to Plan" and its checklist (Book 00 Chapter 08), and what leadership holds at week four. The workbook is independent analysis, not an official publication of any agency.`,
  "Book 01, Chapters 03, 10 and 12; Book 00, Chapters 01, 03 and 08.");
}

// ================================================================== 2 Shape of the phase
{
  const s = content(S, "Four weeks, one goal, one exit");
  tag(s, "What");
  flow(s, "Phase 0", 1.6, 1.85, [
    { head: "Entry", body: "Sponsor and steward named; platform host provisioned; read-only assessment account created" },
    { head: "Work", body: "Build the platform host; run the assessment; seed the repository; create least-privilege service principals" },
    { head: "Gate G0, Ready to Plan", body: "Host operational; assessment committed; no open priority-one findings", color: HEX.amber, tint: HEX.amberTint },
  ], 13.5);
  callout(s, "Milestones", 3.8, 1.15, "FaRoute", HEX.teal, "Plan from the milestones, not the week count: ",
    "four weeks is the roadmap's illustrative calendar; the program's master plan spends about nine on the same work, and large estates run longer.");
  callout(s, "Assessment first", 5.2, 1.15, "FaListCheck", HEX.navy, "Assessment before action: ",
    "no migration work starts until the whole forest is inventoried and committed. A plan without an assessment is a guess.");
  sources(s, "Sources: Book 01, Ch 12 (Phase 0 — Pre-flight); Book 00, Ch 08 (Where pre-flight sits in the program).");
  notes(s,
`Book 01 Chapter 12, Phase 0 — Pre-flight (weeks 1–4). Goal: produce the planning artifacts and stand up the platform host. Entry: executive sponsor and steward named; platform host provisioned; read-only assessment account created. Work: build the platform host (Chapter 03); run the assessment (Chapter 10); seed the repository; create least-privilege service principals for Microsoft Entra ID, Intune and Azure Arc; profile the transactions of any application proposed to move away from its data. Gate G0, Ready to Plan: platform host operational; assessment committed; no open priority-one findings. Book 00 Chapter 08: Book 01's illustrative calendar gives pre-flight four weeks; the master plan spends about nine weeks on the same work (three to build the host, six to assess, generate plans, review them and prepare for the pilot). "Neither figure is a commitment, and large estates run longer. Plan from the milestone list, not the week count." The rule adopted unchanged: "assessment before action... A plan without an assessment is a guess."`,
  "Book 01, Chapter 12 (Phase 0); Book 00, Chapter 08 (Where pre-flight sits in the program).");
}

// ================================================================== 3 Entry conditions
{
  const s = content(S, "Day one: three entry conditions");
  tag(s, "Who");
  const b = table(s, "Entry", 1.5, [3.6, 8.55], ["Entry condition", "Why it has to exist first"], [
    ["An executive sponsor and a steward, named", "The sponsor, with the CIO, owns scope, funding and sequence; the steward, the program office's accountable lead, decides Gate G0"],
    ["The platform host, provisioned", "Every artifact, from the first assessment run to each gate decision, is written there as a reviewed commit"],
    ["A read-only assessment account, created", "A dedicated standard account with no added rights: forest-wide read, never Domain Admin or Enterprise Admin"],
  ], { fontSize: 13 });
  panel(s, "Existing roles", 0.6, b + 0.3, 12.15, 1.8, HEX.teal, HEX.tealTint, "BUILD FROM ROLES YOU ALREADY HAVE", "The names may already exist", [
    "OMB M-22-09 required a zero trust strategy implementation lead; OMB M-19-17 requires an agency-wide ICAM governance structure",
    "The steward and steering committee should be built from those, not alongside them",
  ], 13.5);
  sources(s, "Sources: Book 01, Ch 12 (Phase 0 entry); Book 00, Ch 03 (charter roles; governance and ownership); Book 01, Ch 10 (two tiers).");
  notes(s,
`Book 01 Chapter 12, Phase 0 entry: executive sponsor and steward named; platform host provisioned; read-only assessment account created. Book 00 Chapter 03, charter roles: the project sponsor (executive sponsor, with the CIO) decides scope, funding and sequence; the project lead (the steward, the program office's accountable lead) decides target architecture and the authoritative repository and gates G0, G1 and G4. The charter leaves names blank; the agency fills them in. Book 00 Chapter 03 also: OMB M-22-09 required each agency to designate a zero trust strategy implementation lead within 30 days; OMB M-19-17 requires an integrated, agency-wide ICAM office, team or other governance structure; "The program's steward and steering committee should be built from those, not alongside them." Book 01 Chapter 10: the assessment needs forest-wide read, never Domain Admin or Enterprise Admin; Tier A is a dedicated standard account with no added rights. Book 00 Chapter 08: every artifact is a file in the repository, changed only through a reviewed commit.`,
  "Book 01, Chapters 10 and 12; Book 00, Chapters 03 and 08.");
}

// ================================================================== 4 Platform host
{
  const s = content(S, "The platform host: where every decision is written down");
  tag(s, "What");
  img(s, "b01-transformation-arc/ch03-platform-host", "The platform host from Book 01: one Windows Server 2025 host with five roles (source of truth repository with a standby replica, IIS reverse proxy with mutual TLS, authentication bridge that is domain-joined and Arc-connected, transformation engine, adapter dispatcher). It reads Active Directory read-only and writes to Entra ID, Intune, Arc, IPAM, NAC, ITSM and PAM only through authorized plans.", 0.6, 1.45, 5.5, 5.05);
  panel(s, "Host", 6.35, 1.5, 6.4, 4.1, HEX.navy, HEX.navyTint, "THE REFERENCE DESIGN", "One host, one authoritative writer", [
    "One Windows Server 2025 server with a standby for recovery; one writer is the property that matters",
    "Holds the repository: every artifact a signed, attributable commit",
    "Reads Active Directory read-only; writes to the cloud only through authorized plans",
    "Protected as a Tier 0 asset, with its logs in central logging (OMB M-26-14)",
    "Built from standard components; a reference design, not a product",
  ], 13.5);
  sources(s, "Sources: Book 01, Ch 03 (the architectural claim; why one host; operational properties); Book 00, Ch 08 (the reference design).");
  notes(s,
`Book 01 Chapter 03: every analysis, plan, delivery and evidence artifact can run on one Windows Server 2025 host, with a standby for recovery; "The property that matters is a single authoritative writer, and one host is the simplest way to get it. This is a reference architecture to build from standard components, not an existing product." Five roles: canonical source of truth (version control, for example Gitea, with signed, attributable commits), HTTPS reverse proxy (IIS with URL Rewrite and ARR), legacy-to-modern authentication bridge (domain-joined, Arc-connected, enterprise-CA certificate), transformation engine host (PowerShell, Python, API integrators) and adapter dispatcher. The AD side is read-only by policy; the cloud side is read-write because plans land there. Operational properties: treat it as Tier 0; forward its logs to central logging (OMB M-26-14 requires logs that identify the identity behind each operation). Book 00 Chapter 08: Gitea on Windows Server 2025 behind IIS is the reference design, "one well-understood way to meet the requirement, not the only one."`,
  "Book 01, Chapter 03; Book 00, Chapter 08 (The platform host: the program's reference design).");
}

// ================================================================== 5 Read-only assessment
{
  const s = content(S, "Reading the estate without changing it");
  tag(s, "How");
  img(s, "b01-transformation-arc/ch10-assessment-pipeline", "The assessment pipeline from Book 01: a dedicated Tier A account with default read rights and no writes reads into eleven streams; Tier B adds narrow read-only additions (DHCP Users membership, a DNS server settings export, a CA database export) for recorded gaps; graph analysis produces dependency graphs, risk scores and gap findings, committed as a provenance-bound artifact set that is the plan generator's only input.", 0.6, 1.45, 4.6, 5.05);
  panel(s, "Read-only", 5.45, 1.5, 7.3, 3.65, HEX.navy, HEX.navyTint, "READ-ONLY BY POLICY", "Three locks, two tiers", [
    "Read-only at three levels: the account holds no write rights, the code imports no write commands, and every call is logged",
    "Tier A: a standard account reads what default permissions expose, which is more than most teams expect",
    "Tier B: narrow read-only additions for the gaps Tier A recorded, such as DNS server settings and the CA database; never rights that expose secrets",
    "Security operations is told the window, the account and the query pattern first: broad enumeration looks like reconnaissance",
  ], 13.5);
  sources(s, "Sources: Book 01, Ch 10 (three design principles: read-only by policy; least privilege in two tiers); Book 00, Ch 08 (five steps).");
  notes(s,
`Book 01 Chapter 10, "Read-only by policy": every assessment operation is limited to read rights, enforced at three levels: the account (no write rights), the code (no write cmdlets imported) and the audit trail (every call logged with its operation class). "Read-only isn't an honor system." Broad directory enumeration looks like reconnaissance to monitoring tools, so the security operations team is told the window, the account and the expected query pattern before the first run. "Least-privilege delegation in two tiers": Tier A, a dedicated standard account with no added rights, reads what default grants to Authenticated Users and Pre-Windows 2000 Compatible Access expose (topology, OU tree, most Group Policy settings, users, groups, computers, certificate templates, often AD-integrated DNS zones); Tier B adds read-only rights or administrator-run exports for recorded gaps (DHCP Users membership, DNS server settings, the CA's issued-certificate database, replication health and DC event logs). Rights that expose secrets are never requested. Book 00 Chapter 08 runs it as steps: read-only assessment (M-008), delegated assessment (M-009), security assessment (M-010) before G0.`,
  "Book 01, Chapter 10 (The assessment discipline; Three design principles); Book 00, Chapter 08.");
}

// ================================================================== 6 What it inventories
{
  const s = content(S, "What the assessment inventories");
  tag(s, "What");
  const b = table(s, "Inventory", 1.5, [2.4, 6.85, 2.9], ["Area", "What is read", "It feeds"], [
    ["Structure", "Forest and domain topology, trusts, the OU tree and its delegation, schema extensions", "Identity and attribute design"],
    ["Accounts", "Users, computers, groups, service accounts and their service principal names", "Identity and compute plans"],
    ["Policy", "Every Group Policy Object: links, filtering and full settings", "The Group Policy sunset"],
    ["Network services", "DNS zones and records, DHCP scopes, and the RADIUS and NPS servers that depend on the directory", "Network services"],
    ["Certificates", "Certification authorities, templates and their permissions, including known escalation patterns", "PKI and security findings"],
    ["Applications", "LDAP bindings, the Kerberos map, and transaction profiles for any app that would move away from its data", "Compute and access"],
  ], { fontSize: 12.5 });
  callout(s, "Findings", b + 0.25, Math.min(1.0, 6.5 - b - 0.25), "FaTriangleExclamation", HEX.red, "Risk findings come out too: ",
    "unconstrained delegation, RC4-only accounts, and every server on Windows Server 2012 or 2016 needs a disposition in the plan.");
  sources(s, "Sources: Book 01, Ch 10 (the eleven ingestion streams; profiling transactions); Book 00, Ch 08 (twelve domains and the added streams).");
  notes(s,
`Book 01 Chapter 10's eleven ingestion streams: 1 forest and domain topology (with trusts and schema version); 2 OU hierarchy (with delegation ACLs); 3 users; 4 computers; 5 service accounts and SPNs; 6 security and distribution groups; 7 Group Policy Objects; 8 DNS zones and records; 9 DHCP scopes and reservations (Tier B); 10 certificate services (templates, permissions including escalation patterns such as ESC1, which Microsoft Defender for Identity reports); 11 LDAP bindings and the Kerberos SPN map. RADIUS/NPS is inventoried separately (Book 09, Chapter 07). Transaction profiles record, per business transaction, the measured synchronous round trips for any application proposed to move away from its data. Risk scoring from Stream 4: unconstrained delegation; weak encryption types (Windows Server 2025 domain controllers no longer issue RC4 ticket-granting tickets); unsupported operating systems (Windows Server 2012/2012 R2 ESUs ended October 13, 2026; Windows Server 2016 reaches end of support January 12, 2027), each needing a disposition in the plan. Book 00 Chapter 08: the master plan's twelve assessment domains plus DHCP, LDAP bindings and the SPN map, transaction profiles and the RADIUS and NPS inventory; the program needs the union of both.`,
  "Book 01, Chapter 10 (The eleven ingestion streams; Profiling transactions before separation); Book 00, Chapter 08 (Twelve domains).");
}

// ================================================================== 7 Provenance and the repository
{
  const s = content(S, "Provenance, and seeding the repository");
  tag(s, "Why");
  panel(s, "Provenance", 0.6, 1.5, 5.95, 3.3, HEX.navy, HEX.navyTint, "EVERY RUN CARRIES", "Proof of how the estate was read", [
    "Who ran it, and when (UTC)",
    "Against what: forest, domains, and the domain controller that served each read",
    "With what rights profile: Tier A or Tier B",
    "A SHA-256 hash of every output file, and the commit it landed in",
    "The engine rejects a run without provenance",
  ], 13.5);
  panel(s, "Repository", 6.8, 1.5, 5.95, 3.3, HEX.teal, HEX.tealTint, "SEEDING THE REPOSITORY", "Every artifact is a reviewed commit", [
    "Main holds only approved artifacts; changes arrive through a pull request the steward approves",
    "Every governed document carries a status: draft, in review, approved, current or deprecated",
    "Server-side checks reject controlled-information markings",
    "The assessment set is sensitive: stored encrypted, and the assessment workstation is sanitized afterward (NIST SP 800-88 Rev. 2)",
  ], 13.5);
  callout(s, "Attest", 5.1, 1.1, "FaFileShield", HEX.navy, "Good enough to attest to: ",
    "not a best-effort inventory or a sample, but the full record, reproducible from the repository.");
  sources(s, "Sources: Book 01, Ch 10 (provenance-bound output; one artifact set per run); Book 00, Ch 08 (repository conventions; the deliverables).");
  notes(s,
`Book 01 Chapter 10, "Provenance-bound output": every run records who ran it (account or service principal), when (UTC timestamp), against what (forest DNS name, domain FQDNs, the domain controller that served each read), with what profile (Tier A, Tier B or a recorded custom profile), producing what (a SHA-256 hash of each output file), and committed where (repository branch and commit). "The engine rejects a run without provenance." One artifact set per run under assessments/<run-id>/; every commit signed and attributable; the set maps privileged groups, service accounts and certificate-template permissions, so it is stored encrypted and handled under the agency's data classification policy. Book 00 Chapter 08, repository conventions: main is canonical and protected, changes arrive through a pull request the steward approves; five document states (DRAFT, IN_REVIEW, APPROVED, CURRENT, DEPRECATED); server-side hooks reject controlled-information markings (the agency's CUI markings and the legacy ones). The assessment workstation is sanitized under NIST SP 800-88 Rev. 2 once the initial assessment is committed.`,
  "Book 01, Chapter 10; Book 00, Chapter 08 (Repository conventions; The twenty-three deliverables).");
}

// ================================================================== 8 Least privilege
{
  const s = content(S, "Least privilege for the program's own access");
  tag(s, "Who");
  const b = table(s, "Access", 1.5, [3.4, 8.75], ["The program's access", "How Phase 0 sets it up"], [
    ["Directory reads", "A dedicated forest-reader account; never Domain Admin or Enterprise Admin (NIST SP 800-53 AC-6, applied to the assessment team)"],
    ["Entra ID, Intune and Azure Arc", "Least-privilege service principals for each; Microsoft Graph calls get only the permissions they need"],
    ["Arc onboarding", "A certificate-based service principal scoped to the Azure Connected Machine Onboarding role; not needed once the server connects"],
    ["Registering the repository app", "The narrowest Entra role that does the job, such as Cloud Application Administrator, not Global Administrator"],
    ["Signing in to the repository", "Directory and Entra ID sign-in, with MFA enforced after at least a week in report-only"],
  ], { fontSize: 12.5 });
  callout(s, "Separate", b + 0.25, Math.min(1.0, 6.5 - b - 0.25), "FaKey", HEX.teal, "Decide and act stay separate: ",
    "the layer that validates a plan and the layer that runs it use different service accounts, credentials and logs.");
  sources(s, "Sources: Book 01, Ch 12 (Phase 0 work), Ch 03 (authentication bridge; separation of governance and execution) and Ch 10; Book 00, Ch 08 (M-003, M-004).");
  notes(s,
`Book 01 Chapter 12, Phase 0 work: create least-privilege service principals for Microsoft Entra ID, Intune and Azure Arc. Book 01 Chapter 10: least privilege for the assessment account is NIST SP 800-53 AC-6 applied to the assessment team; never Domain Admin or Enterprise Admin. Book 01 Chapter 03: the host's AD side is read-only using a least-privilege forest-reader account; Microsoft Graph calls use a workload identity granted only the permissions it needs; Arc onboarding is a separate, one-time credential, and Microsoft recommends the certificate form of service principal scoped to the Azure Connected Machine Onboarding role; the credential isn't needed after the server connects. Separation of governance and execution: separate service accounts, credential stores and log streams; "A component that both decides and acts can cover its tracks." Book 00 Chapter 08: Microsoft's least-privileged role for creating an enterprise application is Cloud Application Administrator (Application Developer where registration is restricted), rather than Global Administrator; Microsoft recommends each Conditional Access policy run in report-only for at least a week before enforcement, and MFA is enforced for the repository application before G0.`,
  "Book 01, Chapters 03, 10 and 12; Book 00, Chapter 08 (Seven build milestones).");
}

// ================================================================== 9 Owners and findings
{
  const s = content(S, "Owners named, findings classified");
  tag(s, "Who");
  table(s, "Classes", 1.5, [1.5, 3.85], ["Class", "Must be closed by"], [
    ["Critical", "Gate G0: remediated, or formally accepted by the authorizing official"],
    ["High", "Gate G1, before the pilot opens"],
    ["Medium", "Gate G3, during rollout"],
    ["Low", "Accepted or tracked; reviewed at each gate"],
  ], { fontSize: 13 });
  panel(s, "Owners", 6.2, 1.5, 6.55, 2.65, HEX.teal, HEX.tealTint, "WHO OWNS WHAT AT G0", "One decider per decision", [
    "The steward decides G0, with the executive sponsor as backup",
    "Workstream leads (identity, policy, services, compute, access) review the assessment and findings for their domain",
    "The steering committee reviews; its review is an input, not a second signature",
    "Every High finding has an owner and a date before G1",
  ], 13.5);
  callout(s, "No carry", 4.5, 1.1, "FaScaleBalanced", HEX.red, "A Critical finding can't carry into planning: ",
    "it is fixed before G0, or the authorizing official accepts the risk in writing.");
  sources(s, "Sources: Book 00, Ch 08 (finding classes; Gate G0 checklist); Book 01, Ch 12 (gate authority) and Ch 09 (decision rights).");
  notes(s,
`Book 00 Chapter 08, step 3 (security assessment, M-010): certificate-template analysis, privileged access audit and imported posture findings merged into one set and classified. Critical (blocks migration) must be closed by G0, Book 01's "no open priority-one findings"; High by G1, before Phase 2 opens; Medium by G3; Low accepted or tracked and reviewed at each gate. A Critical finding is either remediated before G0 or formally accepted by the authorizing official, who holds risk acceptance (Book 01 Chapter 09: the authorizing official is the only organizational official who can accept security and privacy risk on the organization's behalf). G0 is decided by the steward with the executive sponsor as backup (Book 01 Chapter 12 gate authority table); the steering committee's review is an input, not a second signature. The G0 checklist requires every High finding to have an owner and a remediation date before G1, and the workstream leads and steering committee to have reviewed the assessment and the classified findings.`,
  "Book 00, Chapter 08 (Step 3; Gate G0); Book 01, Chapters 09 and 12.");
}

// ================================================================== 10 Gate G0
{
  const s = content(S, "Gate G0, Ready to Plan: the checklist");
  tag(s, "How");
  const b = table(s, "G0", 1.5, [2.9, 9.25], ["Gate G0 checks", "Answered from the repository"], [
    ["Platform host operational", "Platform checklist met with evidence; least-privilege service principals for Entra ID, Intune and Azure Arc; host protected as Tier 0, logging centrally"],
    ["Assessment committed", "Read-only and delegated runs cover every area, with provenance on every file; RADIUS and NPS inventory and transaction profiles committed"],
    ["Findings", "Every finding classified; no Critical open unless the authorizing official accepted it; every High owned and dated"],
    ["Gate record", "Go, no-go or conditional go, merged by pull request with who decided; the approved state frozen on a release branch"],
  ], { fontSize: 12.5 });
  callout(s, "Evidence", b + 0.3, Math.min(1.05, 6.5 - b - 0.3), "FaClipboardCheck", HEX.teal, "Hold the gate on evidence, not the calendar: ",
    "a gate passed on a date without its evidence only moves the failure later.");
  sources(s, "Sources: Book 00, Ch 08 (Gate G0: the go/no-go checklist) and Ch 01 (what leadership should take from this); Book 01, Ch 12.");
  notes(s,
`Book 00 Chapter 08, "Gate G0: the go/no-go checklist", each item answered from the repository. Platform host operational: every platform checklist item met with evidence (Gitea reachable over HTTPS; directory and Entra ID sign-in with MFA enforced; upstream mirrored and the promotion path tested; hooks and branch protection verified; Arc connected or scheduled for Phase 1; M-001 to M-007 signed off; completion report committed); least-privilege service principals for Entra ID, Intune and Azure Arc; host protected as Tier 0 with logs in central logging. Assessment committed: read-only run reviewed and delegation request recorded (M-008); delegated run covers all twelve domains plus DHCP, LDAP bindings and the SPN map, with provenance on every file (M-009); RADIUS and NPS inventory committed; transaction profiles committed; the fifteen assessment deliverables under one run identifier. Findings: every finding classified, no Critical open unless accepted by the authorizing official; every High owned and dated before G1. Gate record: the decision (go, no-go or conditional go) merged by pull request, recording who decided; the approved state frozen on a release/ branch. Book 00 Chapter 01: "Hold gates on evidence, not on the calendar... a gate passed on a date without its evidence only moves the failure later."`,
  "Book 00, Chapters 01 and 08; Book 01, Chapter 12.");
}

// ================================================================== 11 Week four
{
  const s = content(S, "What leadership sees at week four");
  tag(s, "How");
  panel(s, "Holds", 0.6, 1.5, 6.2, 2.45, HEX.navy, HEX.navyTint, "AT WEEK FOUR, LEADERSHIP HOLDS", "Facts, not estimates", [
    "An inventory of the whole estate, with proof of how it was read",
    "A classified findings list, every item owned and dated",
    "A platform that records every decision and who made it",
    "A Gate G0 decision, merged and on the record",
  ], 13.5);
  panel(s, "After G0", 7.05, 1.5, 5.7, 2.45, HEX.teal, HEX.tealTint, "RIGHT AFTER G0", "Phase 1 opens", [
    "Eight modernization plans generated from the assessment, not designed by hand",
    "Each workstream lead reviews their plan; the steward approves",
    "Then the foundation build toward Gate G1",
  ], 13.5);
  const b = table(s, "Deeper", 4.2, [3.2, 8.95], ["To go deeper", "For"], [
    ["Book 00, Chapter 08", "Pre-flight: the build milestones, the twenty-three deliverables and the full G0 checklist"],
    ["Book 01, Chapter 03", "The platform host: its five roles and how it is protected"],
    ["Book 01, Chapter 10", "Analyzing the estate: the eleven streams, the two tiers and provenance"],
  ], { fontSize: 12.5 });
  callout(s, "Next", b + 0.2, Math.min(0.9, 6.5 - b - 0.2), "FaRoute", HEX.amber, "Next in the Start series: ",
    "Episode 3, Foundation to Gate G1, covers weeks five to eight.");
  sources(s, "Sources: Book 00, Ch 08 (steps 4 and 5; key takeaways); Book 01, Ch 12 (Where to start).");
  notes(s,
`Book 00 Chapter 08 key takeaways: pre-flight has one exit (the platform host works, the assessment is committed, and no priority-one finding is open); every artifact is a reviewed commit with a status. Steps 4 and 5 are the first work after G0: plan generation (M-011) produces eight machine-readable plans (computer, identity, GPO, DNS, PKI, attribute design, trust decommission and security remediation) generated from the committed assessment and only from it, "produced by generators from data, not drawn up by hand"; review and approval (M-012), where each workstream lead reviews their own plan, the security lead validates severities, and the steward approves each plan. Book 01 Chapter 12: Phase 1 — Foundation (weeks 5–8) ends at Gate G1, Foundation Complete. Next: Episode 3 of the Start series, Foundation to Gate G1.`,
  "Book 00, Chapter 08 (Five steps from default read to approved plans; Key takeaways); Book 01, Chapter 12.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slide after this one is reference material and is not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full list on the following slide.");
}
{
  const s = content("Backup", "Sources behind this briefing");
  T(s, "Source list", bullets([
    "Book 00, Chapter 01 — Why modernize now (hold gates on evidence, not on the calendar); Chapter 03 — The charter (roles; M-22-09 and M-19-17 named roles).",
    "Book 00, Chapter 08 — Pre-flight: platform and assessment (milestones M-001 to M-010, repository conventions, finding classes, Gate G0 checklist; Gitea, Microsoft Learn and NIST SP 800-88 Rev. 2 citations).",
    "Book 01, Chapter 03 — The platform foundation (one authoritative writer, five roles, separation of governance and execution, operational properties; Microsoft Learn and OMB M-26-14).",
    "Book 01, Chapter 10 — Analyzing the estate (read-only by policy, two tiers, provenance, eleven streams, transaction profiles; NIST SP 800-53 Rev. 5 AC-6; Microsoft Learn). Chapter 12 — Migration roadmap (Phase 0, Gate G0, gate authority).",
    "Full footnotes with links and access dates are in each chapter at whalermike.github.io/modernization-workbook.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: as listed. Facts as of October 2026.");
}

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
per.forEach((p) => console.log(`  ${String(p.slide).padStart(2)}  ${String(p.n).padStart(3)}  ${p.title}`));
const unused = Object.keys(NARR).filter((t) => !used.has(t));
if (unused.length) throw new Error("narration with no slide: " + unused.join(" | "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
