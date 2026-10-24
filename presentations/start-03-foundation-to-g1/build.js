// Start series, Episode 3: Foundation to Gate G1 — a ~6-minute EXECUTIVE briefing on Phase 1, weeks 5 to 8.
// Enterprise dynamic groups and administrative units, the Conditional Access baseline and emergency access accounts,
// the first HR-to-cloud feed for a foundation scope, IPAM for Tier 0, pilot servers on Azure Arc; each G1 criterion
// and how it is measured from data; what can go wrong.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Start_03_Foundation_to_G1.pptx
// Reuses the shared kit in ../_build/ and the helpers of ../start-here/build.js (Episode 1).
// Every fact comes from a footnoted chapter: Book 01 Ch06/Ch12, Book 00 Ch09, Book 02 Ch05, Book 03 Ch12,
// Book 04 Ch02/Ch03/Ch04/Ch07, Book 05 Ch09, Book 08 Ch07/Ch10. Agency-neutral.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Start 03", title: "Foundation to Gate G1",
  footer: "Start series, Episode 3  ·  Federal Modernization Workbook  ·  Executive briefing" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Start_03_Foundation_to_G1.pptx";

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


const SUB = "Executive briefing  ·  Start series, Episode 3";
const S = "Episode 3";

// ================================================================== 1 Title
{
  const s = titleSlide(S, "Foundation to Gate G1: Weeks Five to Eight", SUB);
  txt(s, "Session map", [
    { text: "PHASE 1 IN PRACTICE  ·  ABOUT 6 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Groups and administrative units  ·  The sign-in baseline  ·  Emergency access", options: { color: HEX.ink, breakLine: true } },
    { text: "The first HR feed  ·  IPAM and Arc  ·  Gate G1 from data  ·  What can go wrong", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 01, Ch 06 and 12; Book 00, Ch 09; Books 02, 03, 04, 05 and 08 (cited per slide). Facts as of October 2026.", 6.08);
  notes(s,
`Episode 3 of the Start series. Episode 2 ended at Gate G0, Ready to Plan: platform host operational, assessment committed, no open priority-one findings (Book 01 Chapter 12; Book 00 Chapter 08). Phase 1 — Foundation, weeks 5 to 8 in Book 01's illustrative calendar, has one goal: "put the identity primitives in place before anything else moves." This episode walks through enterprise dynamic groups and administrative units (Book 02), the Conditional Access baseline and emergency access accounts (Book 04), the first HR-to-cloud feed for a foundation scope (Book 03 Chapter 12), IPAM for Tier 0 (Book 01 Chapter 06; Book 08), pilot servers on Azure Arc (Book 05 Chapter 09), each Gate G1 criterion and how it is measured from data, and the common failure modes. The workbook is independent analysis, not an official publication of any agency.`,
  "Book 01, Chapter 12 (Phase 1 — Foundation); Book 00, Chapter 09.");
}

// ================================================================== 2 Five workstreams
{
  const s = content(S, "Five workstreams, one foundation");
  tag(s, "Why");
  flow(s, "Workstreams", 1.6, 2.15, [
    { head: "Identity", body: "Enterprise dynamic groups; administrative units for Tier 1 and selected Tier 2 scopes; the HR feed" },
    { head: "Policy", body: "The enterprise Conditional Access baseline, with emergency access excluded" },
    { head: "Services", body: "IP address management covering the platform host and Tier 0 infrastructure" },
    { head: "Compute", body: "The platform host and pilot servers connected through Azure Arc" },
    { head: "Access", body: "Single sign-on; FIDO2 keys and passkeys open to Tier 0 administrators" },
  ], 12.5);
  callout(s, "Plans first", 4.05, 1.1, "FaListCheck", HEX.navy, "It opens with the plans: ",
    "the eight plans from the assessment are approved first, and the designs are reviewed while the shared foundation is built.");
  callout(s, "Parallel", 5.4, 1.1, "FaRoute", HEX.teal, "Parallel, not sequential: ",
    "finishing one workstream before starting the next doubles the duration and produces worse outcomes.");
  sources(s, "Sources: Book 01, Ch 12 (Phase 1 — Foundation; two properties define the program); Book 00, Ch 09 (Phase 1 — Foundation).");
  notes(s,
`Book 01 Chapter 12, Phase 1 — Foundation (weeks 5–8). Goal: put the identity primitives in place before anything else moves. Identity: enterprise-level dynamic groups; administrative units for Tier 1 and selected Tier 2 scopes; the HR-to-cloud provisioning feed for the foundation scope (Book 03, Chapter 12). Policy: the enterprise Conditional Access baseline (MFA for all users, legacy authentication blocked, emergency access accounts excluded from every policy that blocks or restricts sign-in). Services: IP address management covering the platform host and Tier 0 infrastructure. Compute: the platform host and pilot servers connected through Azure Arc. Access: single sign-on configured; FIDO2 security keys and passkeys open for registration to Tier 0 administrators. "Parallel, not sequential. The five workstreams run together. Finishing one before starting the next doubles the duration and produces worse outcomes." Book 00 Chapter 09: Phase 1 opens with the eight plans generated, reviewed and approved by the steward; then two halves run together: designing every surface from the approved plans (M-014 to M-021), and building the shared primitives the pilot needs.`,
  "Book 01, Chapter 12 (Phase 1; The program claim); Book 00, Chapter 09 (Phase 1 — Foundation).");
}

// ================================================================== 3 Groups and AUs
{
  const s = content(S, "Groups and administrative units: scope from attributes");
  tag(s, "What");
  img(s, "b02-identity/ch05-three-tier-delegation", "The three-tier delegation model from Book 02: Tier 1 at tenant scope holds Global Reader, Security Reader and Reports Reader; Tier 2 department administrative units (IT, HR, Finance) carry User and Groups Administrator; Tier 3 division administrative units (CyberOps, InfraOps, created on demand) carry Helpdesk, Password and Authentication Administrator. Division units relate to departments by naming only, not nesting.", 0.6, 1.45, 6.0, 3.3);
  panel(s, "Scope", 6.85, 1.5, 5.9, 2.8, HEX.navy, HEX.navyTint, "IDENTITY · WEEKS 5–8", "Scope is declared on purpose", [
    "Entra ID is flat: dynamic groups and AUs take membership from HR-sourced attributes such as department",
    "AUs limit who can change an account, not who can see it, and they can't be nested",
    "Groups that hold admin roles stay assigned; members are made eligible through PIM",
  ], 13.5);
  callout(s, "Hours", 5.05, 1.2, "FaUserClock", HEX.amber, "Plan in hours, not minutes: ",
    "dynamic membership changes usually process within a few hours and can take more than 24. Dynamic AUs aren't offered in specialized clouds such as Azure Government.");
  sources(s, "Sources: Book 02, Ch 05 (what administrative units are; dynamic AUs; role assignment matrix); Book 00, Ch 09 (dynamic groups).");
  notes(s,
`Book 02 Chapter 05: in Active Directory the OU tree was the delegation model; Microsoft Entra ID's directory is flat, and administrative units (AUs) create scope boundaries inside it. AUs can't be nested; they scope management, not visibility ("Treat AUs as a write boundary, not a confidentiality boundary"); only some roles can be AU-scoped. Dynamic AUs maintain membership by rule from the same attributes as dynamic groups, which lets the program derive scope from HR-sourced attributes; dynamic AUs are available in the global Azure cloud, not in specialized clouds such as Azure Government, so a tenant in a Microsoft government cloud may have to maintain membership another way. Role-assignable groups can't be dynamic; the program keeps the *-Admins groups assigned and makes members eligible through Privileged Identity Management. Restricted management is a per-AU decision, default no. Book 00 Chapter 09: dynamic membership groups need Entra ID P1 per unique member; membership changes are usually processed within a few hours and can take more than 24, so waves are planned around hours, not minutes. Book 01 Chapter 12: administrative units for Tier 1 and selected Tier 2 scopes.`,
  "Book 02, Chapter 05 (Delegation Without OUs); Book 00, Chapter 09 (Dynamic groups, policy and access); Book 01, Chapter 12.");
}

// ================================================================== 4 CA baseline
{
  const s = content(S, "The Conditional Access baseline, report-only first");
  tag(s, "What");
  const b = table(s, "Baseline", 1.5, [3.2, 8.95], ["Baseline element", "What it does"], [
    ["MFA for all users", "Every sign-in meets at least one policy; nobody sits outside the MFA requirement except the emergency accounts"],
    ["Legacy authentication blocked", "Removes protocols that can't do MFA; blocking it is a mandatory BOD 25-01 configuration (MS.AAD.1.1)"],
    ["Emergency access excluded", "One dedicated group is excluded from every policy that blocks or restricts sign-in"],
    ["A coverage probe", "A permanent report-only policy that shows, for every sign-in, who couldn't yet meet the end-state requirement"],
  ], { fontSize: 12.5 });
  flow(s, "Rollout", b + 0.35, 1.25, [
    { head: "Report-only", body: "At least seven days; two to four weeks preferred", color: HEX.amber, tint: HEX.amberTint },
    { head: "Pilot ring", body: "IT and security staff first" },
    { head: "Expanding rings", body: "Ring by ring, watched for 48 hours each" },
    { head: "Enforced", body: "Rollback by Off or report-only, never by deleting" },
  ], 12.5);
  sources(s, "Sources: Book 01, Ch 12 (Phase 1 policy); Book 04, Ch 03 (baseline principles; exclusions) and Ch 07 (Wave 1; rollout; rollback).");
  notes(s,
`Book 01 Chapter 12, Phase 1 policy: the enterprise Conditional Access baseline: MFA for all users, legacy authentication blocked, emergency access accounts excluded from every policy that blocks or restricts sign-in; Microsoft's procedure starts the legacy-authentication block in report-only mode. Book 04 Chapter 03, baseline principles: every sign-in meets at least one policy; report-only first, and enforcement is a separate change; never delete during an incident. Exclusions: one permanent exclusion, the emergency access group, from every policy that blocks or restricts sign-in. Book 04 Chapter 07, Wave 1 (foundation): CA001 blocks legacy authentication and meets MS.AAD.1.1, which CISA lists as mandatory under BOD 25-01; CA090 is a permanent report-only coverage probe that never moves to On. Rollout: every policy is created in report-only, measured for at least seven days with two to four weeks preferred (Microsoft recommends at least a week as a deployment tip), enforced for a pilot ring (IT and security staff), then expanded ring by ring with 48 hours of watching after each. Rollback: report-only, scope reduction, Off, or wave rollback; never delete a policy. Book 00 Chapter 09's G1 checklist: baseline enforced after at least seven days in report-only with no unexpected impact.`,
  "Book 01, Chapter 12; Book 04, Chapters 03 and 07; Book 00, Chapter 09.");
}

// ================================================================== 5 Emergency access
{
  const s = content(S, "Emergency access: the one standing exception");
  tag(s, "Who");
  panel(s, "Standard", 0.6, 1.5, 7.0, 3.3, HEX.navy, HEX.navyTint, "THE PROGRAM'S STANDARD", "Governed, not forgotten", [
    "Two or more cloud-only accounts, not tied to any individual",
    "Permanent active Global Administrator, assigned in PIM",
    "Phishing-resistant sign-in: a FIDO2 passkey or certificate-based authentication",
    "Excluded from blocking policies through one dedicated group",
    "An alert on every sign-in; every use reviewed afterward",
    "Validated at least every 90 days, and after staff changes",
  ], 13.5);
  panel(s, "Order", 7.85, 1.5, 4.9, 3.3, HEX.red, HEX.redTint, "THE ORDERING RULE", "Before anything goes just-in-time", [
    "The accounts exist and are tested before any role is made eligible or any approval is switched on",
    "Otherwise, eligible roles with no available approver can lock the agency out of its own tenant",
    "The security plan records them as a documented deviation from AC-2(2), with compensating controls",
  ], 13.5);
  callout(s, "Worst case", 5.1, 1.15, "FaUserShield", HEX.red, "The worst standing privilege of all: ",
    "an undocumented, untested or shared emergency account, with full control, excluded from policy and owned by nobody.");
  sources(s, "Sources: Book 04, Ch 02 (break-glass: the one governed exception) and Ch 04 (emergency access accounts); Book 01, Ch 12 (Phase 1; Gate G1).");
  notes(s,
`Book 04 Chapter 02: emergency access ("break-glass") accounts "are the only standing privilege the program accepts by design." Microsoft's current guidance: two or more cloud-only accounts in the onmicrosoft.com domain using passwordless, phishing-resistant authentication (a FIDO2 passkey, recommended, or certificate-based authentication); exclude a dedicated group from every policy that blocks or restricts sign-in; Global Administrator as a permanent active assignment in PIM; validate sign-in and an administrative task at least every 90 days and after staff changes; alert on every sign-in and audit event and review every use. Microsoft lists the lockout case where all Global Administrator and Privileged Role Administrator assignments are eligible, activation requires approval and no approvers are available. Because NIST's AC-2(2) expects emergency accounts to be disabled automatically after a defined period, the system security plan records the permanent accounts as a documented deviation with compensating controls. Book 04 Chapter 04: the accounts must exist and be tested before any role is converted to eligible or any approval requirement is switched on. Book 01 Chapter 12: Microsoft recommends at least two cloud-only emergency access accounts using phishing-resistant methods, monitored on every use and tested at least every 90 days; Gate G1 requires them vaulted and tested.`,
  "Book 04, Chapters 02 and 04; Book 01, Chapter 12.");
}

// ================================================================== 6 HR feed
{
  const s = content(S, "The first HR feed, for a foundation scope");
  tag(s, "How");
  flow(s, "HR feed", 1.6, 2.35, [
    { head: "1  Name the feed", body: "List the HR-driven identity feed among the agency's HR 2.0 integration points, with a point of contact" },
    { head: "2  Correct the source", body: "Sign the attribute authority map; fix HR data at the source; correlate the pilot cohort (proposed: 99%)", color: HEX.amber, tint: HEX.amberTint },
    { head: "3  Prove the pipe", body: "Joiner, mover and leaver run end to end in a test tenant, with provenance" },
    { head: "4  Shadow, then act", body: "The pilot cohort runs in shadow mode first; every difference is explained" },
  ], 13);
  callout(s, "Correct", 4.25, 1.05, "FaTriangleExclamation", HEX.red, "Correct, not just designated: ",
    "a drifted HR feed produces drifted access faster than any ticket queue could.");
  callout(s, "G1 asks", 5.5, 1.0, "FaPeopleArrows", HEX.teal, "Gate G1 asks: ",
    "HR-to-cloud provisioning operational for the foundation scope, with the attribute slots in use confirmed free and single-writer.");
  sources(s, "Sources: Book 03, Ch 12 (sequencing principle; Phases 0 to 3; the numbers in the gates); Book 00, Ch 09 (Gate G1); Book 01, Ch 12.");
  notes(s,
`Book 03 Chapter 12 has its own phase numbering (0 to 6) for the HR-driven identity program; Book 01 Chapter 12 points to it for "the HR-to-cloud provisioning feed for the foundation scope." The order: Phase 0, program alignment: inventory integration points and name the HR-driven identity feed as one of them, with the agency's HR 2.0 points of contact. Phase 1, attribute authority and schema: record the enterprise identifier decision; sign the attribute authority map; baseline HR data against reality and fix errors at the source; gate includes correlation-key population on the pilot cohort (proposed starting point: at least 99%). Phase 2, pipeline build and test: joiner, mover and leaver each run end to end in a test tenant with a provenance record and a workflow run. Phase 3, hybrid go-live (pilot): the pilot cohort runs in shadow mode first, every pipeline-versus-directory difference explained and fixed; zero unmatched-record creations. Sequencing principle: "the source must be correct, not just designated. A drifted HR feed produces drifted access faster than any ticket queue could." Thresholds are proposed starting criteria the agency approves or replaces. Book 00 Chapter 09's G1 checklist: HR-to-cloud provisioning operational for the foundation scope, and the attribute slots in use confirmed free and single-writer.`,
  "Book 03, Chapter 12 (Execution Plan); Book 00, Chapter 09 (Gate G1); Book 01, Chapter 12.");
}

// ================================================================== 7 IPAM and Arc
{
  const s = content(S, "Address management for Tier 0, Arc for pilot servers");
  tag(s, "How");
  panel(s, "IPAM", 0.6, 1.5, 5.95, 3.05, HEX.navy, HEX.navyTint, "SERVICES · IPAM FOR TIER 0", "One governed address authority", [
    "A spreadsheet one person maintains produces conflicts and ghost records",
    "IPAM owns addressing; DNS and DHCP derive their records from it",
    "Phase 1 covers the platform host and Tier 0 infrastructure first",
    "The enterprise IPAM stays authoritative across on-premises, cloud and VMware",
  ], 13.5);
  panel(s, "Arc", 6.8, 1.5, 5.95, 3.05, HEX.teal, HEX.tealTint, "COMPUTE · PILOT SERVERS ON ARC", "A cloud address for each server", [
    "Intune doesn't manage Windows Server; Arc gives each server an Azure resource and a managed identity",
    "Day-one baseline on the same change: machine configuration, Update Manager, Defender for Servers",
    "Onboarding doesn't change domain membership; an Arc outage affects management, not the workload",
  ], 13.5);
  callout(s, "ESU", 4.85, 1.1, "FaServer", HEX.amber, "Windows Server 2016 hosts: ",
    "Arc can deliver Extended Security Updates for up to three years; billing begins January 13, 2027.");
  sources(s, "Sources: Book 01, Ch 06 (IPAM, informal to governed) and Ch 12; Book 08, Ch 07 (SDN–IPAM consistency); Book 05, Ch 09 (servers under Arc; ESUs).");
  notes(s,
`Book 01 Chapter 06: many organizations discover they have no real IPAM, "a spreadsheet one person maintains, a stale wiki page, or partial tools"; moving DNS and DHCP but leaving IPAM in a spreadsheet produces conflicts and ghost records; the program treats the three as one domain, with IPAM owning addressing and DNS and DHCP deriving from it. Book 01 Chapter 12: Phase 1 services, IP address management covering the platform host and Tier 0 infrastructure; Gate G1, Tier 0 covered by IPAM. Book 08 Chapter 07: treat the enterprise IPAM as the authoritative source for address blocks across on-premises, cloud and VMware environments. Book 05 Chapter 09: Intune's supported platforms don't include Windows Server; a server running the Connected Machine agent appears in Azure as a resource with a resource ID and a system-assigned managed identity; attach Azure Policy machine configuration, Azure Update Manager and Defender for Servers on the same change; onboarding doesn't change domain membership; an Arc outage impairs management only, not the workload; the agent sends a heartbeat every five minutes. Windows Server 2016 reaches end of support January 12, 2027; ESUs through Arc for up to three years, billing beginning January 13, 2027. Book 00 Chapter 09: the platform host and pilot servers connected through Arc with machine configuration compliant (M-007) by G1.`,
  "Book 01, Chapters 06 and 12; Book 08, Chapter 07; Book 05, Chapter 09; Book 00, Chapter 09.");
}

// ================================================================== 8 G1 from data
{
  const s = content(S, "Gate G1 is measured from data, not signature");
  tag(s, "How");
  const b = table(s, "G1", 1.5, [5.4, 6.75], ["Gate G1 passes when", "Measured from"], [
    ["Enterprise groups and administrative units are drift-clean", "The drift report: the registry and role matrix compared with the tenant"],
    ["Baseline Conditional Access enforced; nobody outside MFA but the emergency accounts", "Sign-in logs and the coverage probe, after at least seven days in report-only"],
    ["Emergency access accounts vaulted, monitored and tested", "Sign-in and audit alerts; the logged validation sign-in"],
    ["Tier 0 infrastructure covered by IPAM", "IPAM entries for the platform host and Tier 0 infrastructure"],
    ["Platform host and pilot servers connected through Arc", "Agent heartbeat; machine configuration compliance"],
    ["HR-to-cloud provisioning operational for the foundation scope", "Provisioning logs; attribute slots confirmed free and single-writer"],
    ["High findings remediated; zero drift across the foundation", "Re-scan results; the drift report"],
  ], { fontSize: 12 });
  callout(s, "Steward", b + 0.2, Math.min(0.95, 6.5 - b - 0.2), "FaClipboardCheck", HEX.teal, "The steward decides G1: ",
    "the engine reports green, the steward concurs. A gate the engine can't evaluate needs a better criterion.");
  sources(s, "Sources: Book 01, Ch 12 (Gate G1; gates, rollback and authority); Book 00, Ch 09 (Gate G1 checklist); Book 02, Ch 05 (drift detection).");
  notes(s,
`Book 01 Chapter 12, Gate G1, Foundation Complete: enterprise groups and administrative units drift-clean; baseline Conditional Access enforced, with no user outside the MFA requirement other than the documented emergency access accounts; Tier 0 covered by IPAM; emergency access accounts vaulted and tested; HR-to-cloud provisioning operational for the foundation scope; zero drift across the foundation. "Every gate criterion is evaluated from the repository and the drift reports... The engine reports green, the steward concurs, and the pull request merges. A gate the engine can't evaluate needs a better criterion." G1 authority: the steward. Book 00 Chapter 09 adds to the checklist: all eight plans and every design APPROVED; baseline enforced after at least seven days in report-only with no unexpected impact; emergency accounts vaulted, monitored and tested; platform host and pilot servers on Arc with machine configuration compliant; attribute slots confirmed free and single-writer; every High finding remediated and verified by re-scan; pilot scope and staged pilot objects in place. Book 02 Chapter 05: drift detection compares the AU registry and role matrix with the tenant on a schedule. Book 04 Chapter 07: CA090, the report-only coverage probe. Book 04 Chapter 04: alert on every sign-in and audit event; validate at least every 90 days. Book 05 Chapter 09: the heartbeat makes connection state evidence.`,
  "Book 01, Chapter 12; Book 00, Chapter 09; Book 02, Chapter 05; Book 04, Chapters 04 and 07; Book 05, Chapter 09.");
}

// ================================================================== 9 What can go wrong
{
  const s = content(S, "What can go wrong in weeks five to eight");
  tag(s, "Why");
  const b = table(s, "Failures", 1.5, [5.6, 6.55], ["What goes wrong", "The guard"], [
    ["A broad MFA policy blocks critical edge-case sign-ins", "Attribute scoping, report-only first, pilot groups first"],
    ["Roles go just-in-time before emergency access works", "Emergency accounts created and tested first"],
    ["A policy aimed at a group misses everyone whose attribute is empty", "Include all users and exclude narrowly; check attribute completeness first"],
    ["The HR feed automates on data nobody verified", "Data quality is Phase 1 work; shadow mode before the feed acts"],
    ["The HR connector breaks mid-rollout and the program stalls", "G1 requires HR provisioning before rollout begins"],
    ["Conditional Access blocks too many legitimate sign-ins", "A rollback trigger: revert the policy, then authorize a replacement"],
    ["Drift stays above threshold for more than 24 hours", "A rollback trigger: halt; no new deliveries until clean"],
  ], { fontSize: 12.5 });
  callout(s, "Thresholds", b + 0.3, Math.min(1.1, 6.5 - b - 0.3), "FaTriangleExclamation", HEX.amber, "Thresholds, not judgment calls: ",
    "the agency sets each trigger's value in advance. Pilots exist to catch problems before they become rollbacks.");
  sources(s, "Sources: Book 01, Ch 12 (common failure modes; rollback triggers); Book 04, Ch 03 (exclusions) and Ch 04; Book 03, Ch 12 (sequencing principle).");
  notes(s,
`Book 01 Chapter 12, common failure modes: half-finished identity (the HR connector breaks mid-rollout and the program stalls; mitigation: G1 requires HR provisioning before rollout); unscoped Conditional Access (a broad MFA policy blocks critical edge-case sign-ins; mitigation: attribute scoping, report-only first, pilot groups first). Rollback triggers are thresholds, not judgment calls, with values the agency sets: drift above threshold for more than 24 hours halts the phase with no new deliveries until clean; Conditional Access blocking more than a set share of legitimate sign-ins reverts the policy and authorizes a replacement. "Pilots exist to catch problems before they become rollbacks." Book 04 Chapter 03: "A policy that includes a dynamic group misses every user whose attribute is empty, so incomplete attributes are an exclusion nobody approved"; baseline policies include all users and exclude narrowly, and attribute completeness is checked before any attribute-scoped policy is enforced. Book 04 Chapter 04: emergency accounts must exist and be tested before any role is converted to eligible. Book 03 Chapter 12: data quality at the source is Phase 1 work; Phases 1 and 2 produce no visible change for end users, "which is exactly why estates skip them."`,
  "Book 01, Chapter 12 (Common failure modes; Gates, rollback and authority); Book 04, Chapters 03 and 04; Book 03, Chapter 12.");
}

// ================================================================== 10 At G1
{
  const s = content(S, "What leadership sees at Gate G1");
  tag(s, "How");
  panel(s, "Sees", 0.6, 1.5, 6.6, 3.0, HEX.navy, HEX.navyTint, "AT GATE G1, LEADERSHIP CAN SEE", "A foundation that holds", [
    "Everyone under MFA, except governed, tested emergency accounts",
    "Administration scoped by attributes, not by an undocumented tree",
    "HR driving identity for a first, foundation scope",
    "Tier 0 addresses and the first servers under management",
    "Zero drift across the foundation, shown by data",
  ], 13.5);
  panel(s, "Next phase", 7.45, 1.5, 5.3, 3.0, HEX.teal, HEX.tealTint, "NEXT IN THE ROADMAP", "Phase 2, the pilot division", [
    "The whole pattern on one division, typically IT, which tolerates disruption best",
    "Ends at Gate G2, Pilot Clean, co-signed by the steward and the executive sponsor",
    "Each phase opens only when the last gate is green",
  ], 13.5);
  callout(s, "Next", 4.8, 1.1, "FaRoute", HEX.amber, "Next in the Start series: ",
    "Episode 4, Making the Case at Your Agency, turns all of this into a one-page ask.");
  sources(s, "Sources: Book 01, Ch 12 (Gate G1; Phase 2 — Pilot division; gate authority); Book 00, Ch 09.");
  notes(s,
`What G1 shows, from Book 01 Chapter 12's criteria: baseline Conditional Access enforced with no user outside MFA other than the documented emergency access accounts, which are vaulted and tested; enterprise groups and administrative units drift-clean (scope from attributes, Book 02 Chapter 05); HR-to-cloud provisioning operational for the foundation scope; Tier 0 covered by IPAM; platform host and pilot servers on Arc (Book 00 Chapter 09); zero drift across the foundation. Next in the roadmap: Phase 2 — Pilot division (weeks 9–16), proving the full pattern on one division, typically IT, which tolerates disruption best; Gate G2, Pilot Clean, co-signed by the steward and the executive sponsor. Next in the Start series: Episode 4, Making the Case at Your Agency.`,
  "Book 01, Chapter 12; Book 00, Chapter 09.");
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
    "Book 01, Chapter 06 — Network services (IPAM, informal to governed); Chapter 12 — Migration roadmap (Phase 1, Gate G1, gates and rollback, common failure modes; Microsoft Learn on legacy authentication and emergency access).",
    "Book 00, Chapter 09 — Design, pilot and rollout (Phase 1 milestones, dynamic group processing, Gate G1 checklist; Microsoft Learn).",
    "Book 02, Chapter 05 — Delegation without OUs (administrative units, dynamic and restricted AUs, role-assignable groups, drift). Book 03, Chapter 12 — Execution plan (Phases 0 to 3; OMB/OPM Federal HR 2.0 memo).",
    "Book 04, Chapters 02 and 04 (emergency access; NIST SP 800-53 AC-2(2)), Chapter 03 (baseline principles, exclusions) and Chapter 07 (Wave 1, rollout, rollback; CISA BOD 25-01 MS.AAD.1.1).",
    "Book 05, Chapter 09 — Servers under Azure Arc (day-one baseline; ESUs). Book 08, Chapter 07 — SDN–IPAM consistency. Full footnotes are in each chapter at whalermike.github.io/modernization-workbook.",
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
