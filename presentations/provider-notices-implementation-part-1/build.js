// Implementation guide — Provider Notices, IMPLEMENTATION SERIES, PART 1:
// orientation and the four provider gates G1–G4 (Azure Service Health, Microsoft 365, OCI, AWS Health).
//   Orientation:  why notices go unread, the six kinds, the five providers compared, prerequisites, the seven gates.
//   G1–G4:        the steps, the kit's real Lab 1 output, requirement and evidence, government cloud, interim path, rollback.
//   Close:        what G1–G4 leave in the evidence file, and the handoff to Part 2 (G5–G7, dangers, evidence, rollback).
// Sources: docs/books/guides/provider-notices-implementation.md (status: draft; the deck says so on the title slide and
// in the opening and closing narration), the developer workbook docs/project-plans/developer-workbooks/provider-notices/
// (Chapters 01–04, Lab 1 of each), the kit examples/provider-notices, and the real Lab 1 captures in data/kit-captures/pn/.
// No new external facts: provider facts are the ones the guide footnotes (read November 9, 2026).
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js),
// with the NPI implementation series' code panel and one-line statement. Every terminal line on a slide is read from
// data/kit-captures/pn/NN-k.txt at build time, so it stays the kit's real output; a panel that leaves lines out says so.
// Narration: the spoken text is SAY below; the build writes it to narration.json, which narrate.py speaks. The speaker
// notes carry the same text plus the presenter's detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/provider-notices-implementation-part-1/build.js \
//                      presentations/provider-notices-implementation-part-1/Provider_Notices_Implementation_Part_1.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Provider Notices — Implementation, Part 1",
  footer: "Federal Modernization Workbook  ·  Provider Notices — Implementation, Part 1: G1–G4",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || path.join(__dirname, "Provider_Notices_Implementation_Part_1.pptx");
const IG = "Provider Notices: An Implementation Guide";
const WB = "Developer workbook, Building Provider Notices";

// ------------------------------------------------------------------ captures
// cap("01-4", [0, 1, 2], { max }) returns those lines of data/kit-captures/pn/01-4.txt (0-based).
// A prompt line (PS>) longer than max is continued PowerShell-style (" `", then ">>     "); an output line is cut with "…".
const CAP = path.join(__dirname, "..", "..", "data", "kit-captures", "pn");
const cap = (id, idx, o = {}) => {
  const all = fs.readFileSync(path.join(CAP, `${id}.txt`), "utf8").replace(/\r/g, "").split("\n");
  const pick = idx === "all" ? all.filter((l, k) => k < all.length - 1 || l.length) : idx.map((k) => {
    if (all[k] === undefined) throw new Error(`capture ${id} has no line ${k}`);
    return all[k];
  });
  const max = o.max || 999;
  const out = [];
  for (const line of pick) {
    if (line.length <= max) { out.push(line); continue; }
    if (/^PS> /.test(line)) {
      let rest = line, first = true;
      while (rest.length > (first ? max : max - 7)) {
        const room = (first ? max : max - 7) - 2;
        const cut = rest.lastIndexOf(" ", room);
        out.push((first ? "" : ">>     ") + rest.slice(0, cut) + " `");
        rest = rest.slice(cut + 1); first = false;
      }
      out.push((first ? "" : ">>     ") + rest);
    } else {
      out.push(line.slice(0, max - 1).trimEnd() + "…");
    }
  }
  return out;
};
const fitChars = (w, pt = 10.5) => Math.floor((w - 0.4) / (0.55 * pt / 72));

// ------------------------------------------------------------------ code panel (Consolas on a light panel; "#" lines teal)
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 10.5;
  const lh = pt / 72 * 1.2;
  const top = y + 0.1 + (o.label ? 0.27 : 0);
  const h = (top - y) + lines.length * lh + 0.14;
  box(s, name, x, y, w, h, "F1F5F9", HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
  const widest = Math.max(...lines.map((l) => l.length));
  const need = widest * 0.55 * pt / 72 + 0.4;
  if (need > w + 0.01) console.warn(`  ! ${name} code may overflow its width: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
  const runs = lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1, color: /^\s*#/.test(l) ? HEX.teal : HEX.ink } }));
  txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
  const bottom = y + h;
  if (bottom > (o.limit || 6.6) + 0.01) console.warn(`  ! ${name} code may overflow: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars`);
  return bottom;
};
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  if (process.env.FIT) console.log(`  line ${name}: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};

// ------------------------------------------------------------------ narration: spoken text by slide, written to narration.json
const SAY = [];
let n = 0;
const speak = (s, title, say, detail, ref) => {
  n += 1;
  const words = say.trim().split(/\s+/).length;
  if (words > 175) console.warn(`  ! narration over 175 words (${words}) on "${title}"`);
  if (/\bBook \d\d\b/.test(say)) throw new Error(`narration names a book by number on "${title}"`);
  if (/\b(satisf|meets?\b)/i.test(say)) throw new Error(`narration says satisfies/meets on "${title}"`);
  SAY.push({ slide: n, title, say: say.trim().replace(/\s+/g, " ") });
  notes(s, `${say.trim()}\n\n${detail.trim()}`, ref);
};

const S0 = "Orientation";
const SG1 = "G1 — Azure Service Health";
const SG2 = "G2 — Microsoft 365";
const SG3 = "G3 — Oracle Cloud Infrastructure";
const SG4 = "G4 — AWS Health";
const SC = "Close";
const FULL = 12.15;
const NFULL = fitChars(FULL); // 146 characters at 10.5 pt

// ================================================================== 1 Title
{
  const T = "Part 1: Collecting what four providers publish";
  const s = titleSlide(S0, T, "Provider Notices — implementation, Gates G1–G4");
  box(s, "Draft notice", 0.8, 0.55, 8.4, 0.75, "FFFFFF", HEX.red);
  txt(s, "Draft notice text", [
    { text: "DRAFT GUIDE, AWAITING THE OWNER'S REVIEW.  ", options: { bold: true, color: HEX.red } },
    { text: "Recheck it after the review; the kit is fixture-tested, not run in a tenant." },
  ], { x: 1.0, y: 0.6, w: 8.05, h: 0.65, fontSize: 14, valign: "middle", color: HEX.ink });
  txt(s, "Session map", [
    { text: "Orientation  ·  G1 Azure Service Health  ·  G2 Microsoft 365", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "G3 Oracle Cloud Infrastructure  ·  G4 AWS Health", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 2: G5 Google Cloud  ·  G6 Routing  ·  G7 Digest and evidence  ·  dangers, evidence, rollback", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.35, fontSize: 15, paraSpaceAfter: 2 });
  speak(s, T,
`Welcome to Part 1 of the implementation series for provider notices. One thing first: Provider Notices, An Implementation Guide, is a draft. It's awaiting the owner's review, so check it again after that review. The guide's premise fits in one line. Every provider tells you, in writing and ahead of time, what it will change, retire or patch in your tenant. The gap is that nobody reads it, owns it or closes it. The guide closes that gap in seven gates. Part 1 covers the orientation and the four collection gates for Azure Service Health, Microsoft 365, Oracle Cloud Infrastructure and AWS Health. Part 2 covers Google Cloud, routing to owners, the digest and the evidence, then the dangers and rollback. For each gate you'll see the steps, what the kit really prints on its fixtures, the federal requirement, the evidence and the government cloud. The kit's code is illustrative, tested against fixtures, not against a live tenant.`,
`Status: the guide's front matter says status: draft. Every API, permission, endpoint, field name and government-cloud statement was checked against the provider's own documentation on November 9, 2026: Microsoft Learn for Azure and Microsoft 365, Oracle's documentation for OCI, AWS's for AWS Health, and Google Cloud's for Personalized Service Health. Control statements were read from NIST's OSCAL catalog and the KSIs' related controls from fedramp.gov's 2026 pages on the same day. Where a fact couldn't be verified, the guide says not yet specified and lists it. Design guidance marks the program's recommendations. The audience is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, with workloads in Oracle Cloud Infrastructure and possibly AWS or Google Cloud. The examples use the fictional contoso.example.`,
  `${IG}, opening; "In this guide"; "How to read this guide."`);
}

// ================================================================== 2 Why
{
  const T = "Why: notices nobody reads, owns or closes";
  const s = content(S0, T);
  tag(s, "Why");
  const w = 5.95;
  const p1 = panel(s, "Today", 0.6, 1.45, w, null, HEX.red, HEX.redTint, "WHAT THE BOOKS DO TODAY", null, [
    "Day-2 operations routes Microsoft's service health email to the help desk supervisor, to correlate with open tickets",
    "It warns that nothing is approved or changed on the strength of an email",
    "Security operations sends the Azure activity log's ServiceHealth category to the workspace",
    "Neither collects the notices, assigns an owner, or tracks one to closure",
  ], 13);
  const p2 = panel(s, "Goal", 0.6 + w + 0.25, 1.45, w, null, HEX.navy, HEX.navyTint, "THE GOAL (DESIGN GUIDANCE)", null, [
    "Every notice about the agency's own estate is collected on a schedule and held as one record",
    "Each is given to an owner as a task with a due date, or put in a weekly digest the owners read",
    "A task closes only after the next collection shows the notice closed or the resource no longer affected: the re-read, clause C4",
  ], 13);
  panel(s, "Done", 0.6, Math.max(p1, p2) + 0.2, FULL, null, HEX.amber, HEX.amberTint, "DONE WHEN (DESIGN GUIDANCE)", null, [
    "Every enabled provider is collected at least weekly, by a reader with only the read role, in the cloud the settings file names",
    "Every notice that needs action has a task with an owner, a severity and a due date, and closes only on a re-read",
    "Retirements and maintenance that name the agency's resources prompt a contingency plan review; the digest goes out weekly; every run is in the evidence chain",
  ], 12.5);
  sources(s, "Sources: Provider Notices guide, \"How to read this guide,\" \"The track at a glance\"; Compliance Automation & Day-2 Operations, Ch 03; Security Operations & Telemetry, Ch 04.");
  speak(s, T,
`Why does this need a guide? Because the workbook mentions provider notices but doesn't run them. The day-two operations book routes Microsoft's service health email to the help desk supervisor, and warns that nothing is approved or changed on the strength of an email. The security operations book sends Azure's service health log category to the workspace. Neither collects the notices, assigns an owner, or tracks one to closure. So the goal, which is design guidance, is a loop. Every notice is collected on a schedule and held as one record. It either goes to an owner as a task with a due date, or into a weekly digest. And a task closes only when the next collection shows the notice closed or the resource no longer affected. That's the re-read, never someone's word that it's done.`,
`The books mention provider notices but don't run them. Book 15, Chapter 03 routes Microsoft's service health email to the help desk supervisor, to correlate with open tickets, and warns that nothing is approved or changed on the strength of an email. Book 12, Chapter 04 sends the Azure activity log's ServiceHealth category to the workspace. This guide does the rest, with the code in examples/provider-notices; the routing is the Ticket-to-Machine pattern of Book 13, Chapter 10 and Appendix B. Done when (design guidance): every enabled provider is collected at least weekly, by a reader with only the read role, in the cloud the settings file names; every notice that needs action has a task with an owner, a severity and a due date, and closes only on a re-read; retirements and maintenance that name the agency's resources prompt a contingency plan review; the digest goes to the owners every week, and every run is in the evidence chain.`,
  `${IG}, "How to read this guide"; "The track at a glance" — "The goal," "Done when."`);
}

// ================================================================== 3 Six kinds
{
  const T = "Six kinds of notice, from five providers' types";
  const s = content(S0, T);
  tag(s, "What");
  const tb = table(s, "Kinds", 1.45, [1.45, 2.3, 2.1, 2.1, 2.3, 1.9], ["Kind", "Azure", "Microsoft 365", "OCI", "AWS", "Google Cloud"], [
    ["maintenance", "PlannedMaintenance", "none", "*_MAINTENANCE*", "scheduledChange", "none (not in the API)"],
    ["retirement", "HealthAdvisory with EventSubType Retirement", "a post tagged Retirement", "none", "scheduledChange whose code names a retirement (kit rule)", "none"],
    ["advisory", "HealthAdvisory", "stayInformed posts; advisory issues", "ACTION_RECOMMENDED, INFORMATION", "accountNotification", "none"],
    ["security", "SecurityAdvisory", "none", "none", "accountNotification, SECURITY persona", "none"],
    ["change", "none", "planForChange, preventOrFixIssue posts", "*_CHANGE*, ACTION_REQUIRED", "none", "none"],
    ["incident", "ServiceIssue", "incident issues", "PRODUCTION_EVENT_NOTIFICATION", "issue", "INCIDENT"],
  ], { fontSize: 11, limit: 5.6 });
  line(s, "Action", "Each record says whether action is required and by when, and whether the provider said so or a kit rule inferred it.", tb + 0.2, 0.6, 14);
  sources(s, "Sources: Microsoft Learn, Resource Graph samples for Service Health; Oracle, Announcement model; AWS Health API, Event; Google Cloud, Event resource. Guide, \"The track at a glance.\"");
  speak(s, T,
`The kit turns every provider's notice into one record with one of six kinds: maintenance, retirement, advisory, security, change and incident. The table maps each provider's own types onto them. Two rows are worth a closer look. A retirement in Azure is a health advisory with the subtype retirement, and in AWS the kit infers it from a scheduled change whose event code names a retirement. That second one is the kit's rule, not AWS's. And Google Cloud's column is almost empty: its Personalized Service Health API has a single category, incident. Each record also says whether action is required, by when, and who said so. Microsoft 365, Oracle and AWS each have a field for that. Azure doesn't, so the kit applies its own stated rule: a retirement is due at the advisory's end, which Microsoft Learn says is its end time.`,
`Each record says whether action is required and by when, and whether the provider said so (Microsoft 365's actionRequiredByDateTime, OCI's ACTION_REQUIRED and ACTION_REQUIRED_BY, AWS's actionability) or a kit rule inferred it (an Azure retirement is due at the advisory's end, which Learn says is its end time). The full mapping: maintenance: Azure PlannedMaintenance; M365 none; OCI *_MAINTENANCE*; AWS scheduledChange; Google none (no planned maintenance in the API). Retirement: Azure HealthAdvisory with EventSubType Retirement; M365 a post tagged Retirement; OCI none; AWS scheduledChange whose code names a retirement or lifecycle event (kit rule); Google none. Advisory: Azure HealthAdvisory; M365 stayInformed posts and advisory issues; OCI ACTION_RECOMMENDED, INFORMATION; AWS accountNotification; Google none. Security: Azure SecurityAdvisory; AWS accountNotification with the SECURITY persona; others none. Change: M365 planForChange and preventOrFixIssue posts; OCI *_CHANGE*, ACTION_REQUIRED. Incident: Azure ServiceIssue; M365 incident issues; OCI PRODUCTION_EVENT_NOTIFICATION; AWS issue; Google INCIDENT.`,
  `${IG}, "The track at a glance" — "The kinds of notice."`);
}

// ================================================================== 4 Providers compared
{
  const T = "The five providers compared";
  const s = content(S0, T);
  tag(s, "What");
  table(s, "Compare", 1.45, [2.05, 2.2, 2.15, 2.0, 1.95, 1.8], ["", "Azure", "Microsoft 365", "Oracle Cloud", "AWS", "Google Cloud"], [
    ["Where notices live", "Service Health, through Resource Graph", "Message center and service health, Graph", "Announcements service", "AWS Health API", "Personalized Service Health"],
    ["Says action is required", "No field: the kit's rule", "actionRequiredByDateTime", "ACTION_REQUIRED, ACTION_REQUIRED_BY", "actionability", "No"],
    ["Least-privileged reader", "Reader", "ServiceMessage.Read.All, ServiceHealth.Read.All", "read announcements", "Three health:Describe* actions", "roles/servicehealth.viewer"],
    ["Cost or plan", "None stated", "None stated", "None stated", "A qualifying AWS Support plan", "None stated"],
    ["Push alternative", "Service Health alerts, through Azure Policy", "Message center email", "Subscriptions (not used)", "EventBridge aws.health", "Not used"],
    ["Government cloud", "Azure Government (side note)", "GCC: worldwide endpoint; GCC High, DoD: own hosts", "US Gov Cloud OC2; OC3 not yet specified", "GovCloud (US): us-gov-west-1", "Not in FedRAMP Moderate or High packages"],
  ], { fontSize: 10.5, limit: 6.55 });
  sources(s, "Sources: Microsoft Learn (Service Health, service communications API, national clouds); Oracle; AWS Health; Google Cloud. Guide, \"The five providers compared.\"");
  speak(s, T,
`Here are the five providers side by side, including Oracle Cloud, where the HR platform runs. Each keeps its notices in its own place: Azure's Service Health through Resource Graph, Microsoft 365's message center and service health through Microsoft Graph, Oracle's Announcements service, the AWS Health API, and Google Cloud's Personalized Service Health. The least-privileged reader is small everywhere: Reader in Azure, two read permissions in Graph, a read statement in Oracle, three describe actions in AWS, and a viewer role in Google Cloud. Only AWS has a cost: a qualifying support plan. On government clouds, Microsoft 365 GCC stays on the worldwide Graph endpoint, while GCC High and the Defense Department have their own hosts. Oracle's US Government Cloud has its own endpoints. AWS GovCloud has one. And Google's documentation doesn't list Personalized Service Health in its FedRAMP Moderate or High packages.`,
`Where notices live: Azure Service Health, queried through Azure Resource Graph's ServiceHealthResources; Microsoft 365 message center and service health, through Graph's service communications API; OCI's Announcements service; the AWS Health API; Google Cloud's Personalized Service Health. Maintenance: Azure yes, with impacted resources; M365 no separate type; OCI yes, affected resources on the details call; AWS yes (scheduledChange) with affected entities; Google no, the API has one category, INCIDENT. Retirements: Azure health advisories with EventSubType Retirement; M365 posts tagged Retirement (the tag set isn't enumerated on Learn); OCI and AWS no separate type (the kit infers AWS's from the event type code); Google no. Security advisories: Azure yes, sensitive fields need an elevated role; AWS: the kit uses the SECURITY persona. Push alternatives: Service Health alerts at scale through Azure Policy; message center email; OCI announcement subscriptions (not used by the kit); EventBridge aws.health events; Google not used. Government cloud: Azure Government (management.usgovcloudapi.net), Learn's samples link the Azure Government portal; M365 GCC on the global endpoint, GCC High graph.microsoft.us, DoD dod-graph.microsoft.us; OCI US Government Cloud (OC2) endpoints in us-langley-1 and us-luke-1, OC3 not yet specified; AWS GovCloud (US) one endpoint in us-gov-west-1; Google Cloud not in Assured Workloads' FedRAMP Moderate, High, IL4 or IL5 packages.`,
  `${IG}, "The five providers compared."`);
}

// ================================================================== 5 Prerequisites
{
  const T = "Before G1: decisions, a change process, a reader each";
  const s = content(S0, T);
  tag(s, "Who");
  const w = 5.95;
  const p1 = panel(s, "Decide", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "DECISIONS FIRST, WRITTEN AT WORK", null, [
    "Who owns each provider's notices; which become tasks, for which assignment group, at which severity; who receives each provider's email today",
    "The routing is the agency's, written from the kit's template with its Copilot prompts in Microsoft 365 Copilot Chat",
    "Routing, settings, notices and digests stay inside the agency's boundary",
  ], 12.5);
  const p2 = panel(s, "Change", 0.6 + w + 0.25, 1.45, w, null, HEX.teal, HEX.tealTint, "A CHANGE PROCESS THAT TAKES THE TASKS", null, [
    "The router writes ServiceNow-shaped payloads",
    "Sending them needs an endpoint the agency builds on its own instance; until then, the payloads are files the service desk reads (design guidance)",
    "Tools: PowerShell 7.1+, Pester 5, Azure CLI with resource-graph, Microsoft.Graph.Authentication, the OCI, AWS and Google Cloud CLIs",
  ], 12.5);
  panel(s, "Reader", 0.6, Math.max(p1, p2) + 0.2, FULL, null, HEX.amber, HEX.amberTint, "A READER PER PROVIDER, HOLDING ONLY ITS READ ROLE", null, [
    "Azure: Reader on each subscription; Service Health Security Reader to see a security advisory's sensitive fields",
    "Microsoft 365: ServiceMessage.Read.All, ServiceHealth.Read.All; data privacy messages need Global Administrator or Message Center Privacy Reader",
    "OCI: read announcements in tenancy · AWS: a customer managed policy with three health:Describe* actions · Google: roles/servicehealth.viewer",
    "Writes (the Azure Policy assignment, rollback) run as a different identity, and only with -Apply (design guidance)",
  ], 12);
  sources(s, "Sources: Learn (Service Health, Graph service communications, admin roles); Oracle, Announcements policy; AWS Health IAM; Google Cloud IAM. Guide, \"Prerequisites.\"");
  speak(s, T,
`Before the first gate, three things. Decisions first: who owns each provider's notices, which notices become tasks, for which group and at which severity, and who receives each provider's email today. That routing belongs to the agency. It's written at work from the kit's template, with its prompts in Microsoft 365 Copilot Chat, and it never goes in a public repository. Second, a change process that takes the tasks. The router writes ServiceNow-shaped payloads, and until the agency builds an endpoint for them, they're files the service desk reads. Third, a reader per provider, holding only its read role. The roles come from each provider's own documentation, and they're short. The writes, meaning the Azure Policy assignment and rollback, run as a different identity, and only with an explicit apply switch.`,
`Permissions by provider. Azure: Reader on each subscription; elevated, Service Health Security Reader, to see a security advisory's sensitive fields and impacted resources (Reader and Monitoring Reader can't); write, deploy only: permission to create the policy assignment and the role assignment for its managed identity at the scope. Microsoft 365: ServiceMessage.Read.All and ServiceHealth.Read.All; a delegated sign-in also needs an admin role; Global Administrator or Message Center Privacy Reader for data privacy messages. OCI: Allow group <group> to read announcements in tenancy (inspect lists summaries only). AWS: a customer managed policy with health:DescribeEvents, health:DescribeEventDetails, health:DescribeAffectedEntities; AWS publishes no read-only managed policy for Health; elevated: a qualifying AWS Support plan on the account (AWS's pages name the plans differently). Google Cloud: roles/servicehealth.viewer on the project or organization; the Service Health API enabled on the project, once. Tools: PowerShell 7.1 or later, Pester 5 for the labs, Azure CLI with the resource-graph extension, the Microsoft.Graph.Authentication module, the OCI CLI, the AWS CLI and the Google Cloud CLI.`,
  `${IG}, "Prerequisites" — decisions, change process, tools, permissions by provider.`);
}

// ================================================================== 6 Seven gates
{
  const T = "The seven gates on one page";
  const s = content(S0, T);
  tag(s, "What");
  const tb = table(s, "Gates", 1.45, [2.45, 6.1, 3.6], ["Gate", "Done when", "Validate with"], [
    ["G1 Azure Service Health", "Every subscription read by a Reader, security advisories by Service Health Security Reader; the alert policy assigned and remediated", "Invoke-PnCollect.ps1 -Provider azure; deploy/New-PnAlertPolicy.ps1"],
    ["G2 Microsoft 365", "Message center posts and service health issues collected on the tenant's own Graph host", "Invoke-PnCollect.ps1 -Provider m365"],
    ["G3 Oracle Cloud Infrastructure", "Every tenancy's announcements collected, the latest in each chain, with affected resources", "Invoke-PnCollect.ps1 -Provider oci"],
    ["G4 AWS Health", "Every account's open and upcoming events, with descriptions and affected entities", "Invoke-PnCollect.ps1 -Provider aws"],
    ["G5 Google Cloud", "Incidents collected, and the gap for planned maintenance recorded", "Invoke-PnCollect.ps1 -Provider google"],
    ["G6 Routing", "Routing reviewed; every notice that needs action has a task; re-runs de-duplicate", "Invoke-PnRoute.ps1 (dry run)"],
    ["G7 Digest and evidence", "The weekly run scheduled, the digest reaches the owners, each stage's evidence passes", "Invoke-PnDigest.ps1; Invoke-PnEvidence.ps1 -Check -Stage"],
  ], { fontSize: 11, limit: 5.75 });
  line(s, "Checks", "G1–G5 are independent: enable only the providers the agency uses. Every check reads; the only writes are in deploy/, with -Apply and the plan's approved SHA-256.", tb + 0.15, 0.6, 13);
  sources(s, "Sources: Provider Notices guide, \"The path on one page,\" \"How to read this guide\" (the checks).");
  speak(s, T,
`Here are all seven gates on one page. The first five are collection, one per provider: Azure Service Health, Microsoft 365, Oracle Cloud Infrastructure, AWS Health and Google Cloud. They're independent, so enable only the providers the agency uses. Gate six routes what they collect: every notice that needs action gets a task, and a second run doesn't make a second task. Gate seven schedules the weekly run, sends the digest to the owners and checks the evidence for each stage. Each gate is validated with one of the kit's entry scripts. Every one of those checks only reads. The only writes are in the kit's deploy folder, and they run only with an apply switch and the plan's approved hash. And the checks are tested against fixtures, not proven against a live tenant.`,
`The kit has no VK- IDs; its checks are its entry scripts. Every collector call is a read declared in the kit's config/calls.json with its least-privileged role. The only writes are in deploy/, and they run only with -Apply and the plan's approved SHA-256. G6 and G7 need at least one of G1 to G5. Deploying to test and then production uses the kit's deploy/ scripts with one settings file per environment, described under G7. The checks are fixture-tested, not proven against a live tenant. Every gate's hands-on work is a lab in the developer workbook Building Provider Notices: Lab 1 on a laptop with the kit's fixtures, Lab 2 in a non-production environment.`,
  `${IG}, "The path on one page"; "How to read this guide" — "The checks."`);
}
endModule(S0);

// ================================================================== 7 G1 steps
{
  const T = "G1: Azure Service Health, the steps";
  const s = content(SG1, T);
  tag(s, "How");
  const c = code(s, "Steps", 0.6, 1.45, FULL, [
    "# 1 Grant the reader its roles (a subscription Owner, for each subscription in scope)",
    "az role assignment create --assignee <reader-object-id> --role \"Reader\" --scope /subscriptions/<subscription-id>",
    "az role assignment create --assignee <reader-object-id> --role \"Service Health Security Reader\" --scope /subscriptions/<subscription-id>",
    "# 2 Sign in, in the right cloud, with the Resource Graph extension (Azure Government: AzureUSGovernment)",
    "az cloud set --name AzureCloud; az login; az extension add --name resource-graph",
    "# 3 Collect: Learn's all-active sample, plus the retirement sample's EventSubType; impacted resources as Learn publishes",
    "./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider azure -OutputPath out/azure",
    "# 4 Alert at scale: plan the built-in policy, then apply only after the change record approves the hash",
    "./deploy/New-PnAlertPolicy.ps1 -SettingsPath <settings-file> -OutputPath out/alerts",
    "./deploy/New-PnAlertPolicy.ps1 -SettingsPath <settings-file> -OutputPath out/alerts -Apply -ApprovedSha256 <plan-sha256>",
  ], { label: "THE GUIDE'S STEPS, FROM examples/provider-notices (step 2's three commands on one line here)" });
  const w = 5.95;
  panel(s, "Elevated", 0.6, c + 0.2, w, null, HEX.red, HEX.redTint, "WHY THE SECOND ROLE", null, [
    "Reader sees a security advisory but not its sensitive fields or impacted resources",
    "Service Health Security Reader does; Reader and Monitoring Reader can't",
  ], 12.5);
  panel(s, "Policy", 0.6 + w + 0.25, c + 0.2, w, null, HEX.navy, HEX.navyTint, "THE ALERT POLICY", null, [
    "Configure subscriptions to enable Service Health Monitoring Alert Rules, at the management group, with remediation",
    "No resource group scope; the CLI grants the role with --role and --identity-scope; don't edit its rules by hand",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn, Resource Graph samples; security advisories access; Service Health alerts with Azure Policy; Remediate non-compliant resources. Guide, Step 1.");
  speak(s, T,
`Gate one is Azure Service Health. Resource Graph answers the same questions for every subscription in scope with one query, and Microsoft Learn publishes the queries. Four steps. A subscription owner grants the reader two roles: Reader, and Service Health Security Reader. Learn explains why the second one matters: with Reader alone you see a security advisory, but not its sensitive fields or the resources it affects. Then sign in to the right cloud, with the Resource Graph extension. The workbook's estate is GCC with commercial Azure, so that's Azure Cloud. Third, collect. The kit's query starts from Learn's sample for all active events. Fourth, alert between collections with Learn's built-in policy, assigned at the management group with a remediation task. The kit writes it as a plan, and applies it only with the hash the change record approved.`,
`Service Health is where Azure publishes service issues, planned maintenance, health advisories (including upcoming retirements) and security advisories for a subscription. Step 3: the kit's query starts from Learn's "all active Service Health events" sample, adds the retirement sample's EventSubType, and converts the impact times as Learn's health advisory sample does; the impacted-resources query is Learn's, as published. Step 4: with no parameters, the remediation creates rg-serviceHealthAlert, the alert rule ServiceHealthSubscriptionAlertRule and the action group ag-ServiceHealthAlertActionGroup in each subscription and emails the subscription owners for every event type. The policy doesn't support a resource group scope. The CLI path needs the managed identity granted the definition's role, which the plan does with --role and --identity-scope (only the portal grants it automatically). Don't edit the alert rules the policy creates; change the assignment's parameters and remediate again, or the policy may overwrite the edit. The settings file's providers.azure names the cloud and the subscriptions or management group.`,
  `${IG}, Step 1 — prerequisites and steps 1–4.`);
}

// ================================================================== 8 G1 in code
{
  const T = "G1 in code: five notices, and the alert plan";
  const s = content(SG1, T);
  tag(s, "How");
  const c1 = code(s, "Collect", 0.6, 1.45, FULL, cap("01-3", [0, 3, 4, 6], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 01, LAB 1, STEP 3 (fictional fixtures, no tenant; blank lines left out)" });
  const c2 = code(s, "Records", 0.6, c1 + 0.12, FULL, cap("01-4", "all", { max: NFULL }),
    { label: "STEP 4: THE RECORDS" });
  code(s, "Plan", 0.6, c2 + 0.12, FULL, cap("01-7", [0, 4, 5], { max: NFULL }),
    { label: "STEP 7: THE ALERT PLAN (ITS TWO WouldApply STEPS, AL-01 AND AL-02, LEFT OUT)" });
  sources(s, "Sources: Developer workbook, Building Provider Notices, Ch 01, Lab 1, steps 3, 4 and 7; data/kit-captures/pn/01-3, 01-4, 01-7.");
  speak(s, T,
`Here's what the kit really prints, from the workbook's first chapter, on fictional fixtures with no tenant. One collection gives five notices from six rows: an incident that appeared in two subscriptions became one notice. Every record is valid against the schema. The records show the two that need action. The retirement of basic public IP addresses is due September 30, 2027, by the kit's rule. The security advisory needs action with no date, for the security officer to review. The incident, the advisory and the maintenance window need no action, so they'll go to the weekly digest. Then the alert plan: two steps, the policy assignment at the management group and its remediation, the plan's hash, and a dry run that changes nothing. And in fixture mode, the script refuses to apply at all.`,
`Lab 1 step 3: ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider azure -AsOf 2026-11-09T12:00:00Z -OutputPath out/azure. Five notices: advisory 1, incident 1, maintenance 1, retirement 1, security 1; five open, two needing action. Five notices from six rows: the incident's rows from two subscriptions are one notice. The guide's Try it says the same: one incident, one maintenance window, one retirement, one security advisory and one advisory. Step 4 reads the records: the retirement is action required by 2027-09-30, the security advisory with no date. Step 7 plans the alert policy from the production fixture, which names a management group: AL-01 az policy assignment create with the built-in definition 98903777-a9f6-47f5-90a9-acaf62ab01a8, a system-assigned managed identity, --role and --identity-scope; AL-02 az policy remediation create; then the plan's SHA-256 and "Dry run: nothing changed." The role ID in the fixture is made up. Step 8, applying in fixture mode, fails with "Fixture mode never applies."`,
  `${WB}, Chapter 01 — "Lab 1: fixtures, no tenant," steps 3, 4, 7 and 8; data/kit-captures/pn/01-3.txt, 01-4.txt, 01-7.txt.`);
}

// ================================================================== 9 G1 requirement
{
  const T = "G1: requirement, evidence, availability, rollback";
  const s = content(SG1, T);
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 2.45, 4.1], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "What the ISSO keeps"], [
    ["SA-9 c: monitor an external provider's control compliance on an ongoing basis", "KSI-SCR-MIT, KSI-SCR-MON", "raw/azure.json, notices.json, manifest.json with every call and its permission"],
    ["SI-5 a: receive security alerts and advisories from external organizations", "KSI-SCR-MON", "The same; sensitive fields only with the elevated role"],
    ["SI-5 and CA-7: the alert path that runs between collections", "KSI-SCR-MON, KSI-MLA-EVC", "The alert plan, results.json, and the change record that approved the hash"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 3.9, g = 0.225;
  const top = tb + 0.2;
  panel(s, "Gov", 0.6, top, w, null, HEX.teal, HEX.tealTint, "GOVERNMENT CLOUD (SIDE NOTE)", null, [
    "Azure Government: az cloud set --name AzureUSGovernment; Resource Manager management.usgovcloudapi.net",
    "Learn's samples link its portal; the table's availability there is not yet specified",
  ], 11.5);
  panel(s, "Interim", 0.6 + w + g, top, w, null, HEX.amber, HEX.amberTint, "VALIDATE AND INTERIM PATH", null, [
    "Pass: every subscription's events listed; each security advisory has its summary",
    "Before the reader exists, a person with Reader runs Learn's query and keeps the output",
  ], 11.5);
  panel(s, "Rollback", 0.6 + 2 * (w + g), top, w, null, HEX.red, HEX.redTint, "ROLLBACK", null, [
    "The collection only reads",
    "Invoke-PnRollback.ps1 plans deleting the assignment; what remediation created stays until the change record decides",
  ], 11.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators; Learn, Connect to Azure Government with Azure CLI. Guide, Step 1.");
  speak(s, T,
`What does gate one support? Three things in NIST's catalog. Monitoring an external provider's control compliance on an ongoing basis. Receiving security alerts and advisories from outside organizations. And continuous monitoring, through the alert path that runs between collections. The key security indicators are FedRAMP's, and which record supports which indicator is the program's mapping. The security officer keeps the raw Azure file, the notices, and the manifest with every call and its permission, plus the alert plan and the change record that approved its hash. As a side note, Azure Government has its own CLI cloud and Resource Manager host, and Learn hasn't stated the table's availability there in so many words. Until the reader identity exists, a person with Reader runs Learn's own query and keeps the output. And rollback: the collection only reads, and the alert policy has a planned rollback.`,
`Requirements: SA-9 (external system services), part c: monitor the provider's control compliance on an ongoing basis — KSI-SCR-MIT, KSI-SCR-MON. SI-5 (security alerts, advisories and directives), part a: receive them from external organizations on an ongoing basis — KSI-SCR-MON. SI-5 and CA-7 (continuous monitoring): the alert path between collections — KSI-SCR-MON, KSI-MLA-EVC. The KSI column names the FedRAMP 20x Key Security Indicators whose related SP 800-53 controls include the row's control. KSIs are indicators for cloud service providers: the agency authorizes its own system and lines its evidence up with what its providers report against them; it doesn't report KSIs itself. Which record supports which indicator is the program's mapping (design guidance). Government cloud: Azure Government uses az cloud set --name AzureUSGovernment and Resource Manager management.usgovcloudapi.net; every ServiceHealthResources sample on Learn links the Azure Government portal; an explicit availability statement is not yet specified. Validate: Invoke-PnCollect.ps1 -Provider azure; an empty summary means the reader lacks Service Health Security Reader; New-PnAlertPolicy.ps1 dry run shows the assignment at the management group and its remediation; after -Apply, Azure Policy shows the assignment compliant once remediation finishes. Gate owner: the cloud platform lead, with the ISSO. Rollback: deploy/Invoke-PnRollback.ps1 plans deleting the assignment; the resource groups, alert rules and action groups its remediation created stay until the change record decides on them.`,
  `${IG}, Step 1 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Validate," "Rollback."`);
}
endModule(SG1);

// ================================================================== 10 G2 steps
{
  const T = "G2: Microsoft 365 message center and service health";
  const s = content(SG2, T);
  tag(s, "How");
  const c = code(s, "Steps", 0.6, 1.45, FULL, [
    "# 1 Install the module and sign in to the tenant's own cloud (GCC: Global)",
    "Install-Module Microsoft.Graph.Authentication -Scope CurrentUser",
    "Connect-MgGraph -Environment Global -Scopes ServiceMessage.Read.All,ServiceHealth.Read.All",
    "# 2 Collect: /admin/serviceAnnouncement/messages, /issues and /healthOverviews on v1.0, following @odata.nextLink",
    "./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider m365 -OutputPath out/m365",
  ], { label: "THE GUIDE'S STEPS, FROM examples/provider-notices" });
  const c2 = code(s, "Clouds", 0.6, c + 0.15, 7.2, cap("02-2", "all", { max: fitChars(7.2) }),
    { label: "WORKBOOK CHAPTER 02, LAB 1, STEP 2: EACH CLOUD'S GRAPH HOST (REAL OUTPUT)" });
  panel(s, "Consent", 8.0, c + 0.15, 4.75, null, HEX.navy, HEX.navyTint, "WHO CAN GRANT, WHO CAN SEE", null, [
    "Both permissions are granted only by an administrator; a delegated sign-in also needs an admin role",
    "Data privacy messages: Global Administrators and Message Center Privacy Readers only",
  ], 12);
  callout(s, "GCC", Math.max(c2, 4.5) + 0.2, 0.85, "FaCloud", HEX.teal, "GCC: ",
    "the worldwide endpoint. GCC High and DoD have their own hosts, and the kit refuses a session in another environment or tenant.");
  sources(s, "Sources: Microsoft Learn, service communications API overview; National cloud deployments; List serviceAnnouncement messages, issues; admin roles. Guide, Step 2.");
  speak(s, T,
`Gate two is Microsoft 365. The message center is where Microsoft announces changes, retirements and actions for a tenant, and service health lists incidents and advisories. Microsoft Graph's service communications API reads both. Two steps: sign in to the tenant's own cloud with two read permissions, and collect three lists, following every next link. Microsoft Learn says both permissions are granted only by an administrator, and a delegated sign-in also needs an admin role. Data privacy messages are visible only to Global Administrators and Message Center Privacy Readers. Now the cloud. A GCC tenant keeps the worldwide Graph endpoint, which Learn's national cloud page confirms. GCC High and the Defense Department have their own hosts, and the workbook's capture shows the kit's map of all three. The kit sends each call only to the cloud's own host, and refuses a session in another environment or tenant.`,
`Step 1: GCC uses Global; GCC High USGov; DoD USGovDoD. Step 2: the kit reads /admin/serviceAnnouncement/messages, /issues and /healthOverviews on v1.0 and follows @odata.nextLink. Learn's overview says the service communications API is available on Microsoft Graph national clouds, and each list method's table shows US Government L4 and L5. GCC keeps the worldwide endpoint, graph.microsoft.com; GCC High uses graph.microsoft.us and DoD dod-graph.microsoft.us. The kit sends each call only to the cloud's own host and refuses a Graph session in another environment or tenant. The capture is Chapter 02, Lab 1, step 2: gcc https://graph.microsoft.com Global; gcchigh https://graph.microsoft.us USGov; dod https://dod-graph.microsoft.us USGovDoD. Gate owner: the Microsoft 365 service owner.`,
  `${IG}, Step 2 — prerequisites, steps, "Government-cloud availability"; ${WB}, Chapter 02, Lab 1, step 2; data/kit-captures/pn/02-2.txt.`);
}

// ================================================================== 11 G2 in code
{
  const T = "G2 in code: a provider's date, and a kit rule";
  const s = content(SG2, T);
  tag(s, "How");
  const c1 = code(s, "Collect", 0.6, 1.45, FULL, cap("02-3", [0, 3, 4, 6], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 02, LAB 1, STEP 3 (fictional fixtures, no tenant; blank lines left out)" });
  const c2 = code(s, "Basis", 0.6, c1 + 0.12, 7.0, cap("02-5", [1, 2, 3, 4, 5, 6, 7, 8]),
    { label: "STEP 5 OUTPUT: WHO SAID ACTION IS REQUIRED" });
  panel(s, "Req", 7.85, c1 + 0.12, 4.9, null, HEX.navy, HEX.navyTint, "REQUIREMENT AND EVIDENCE", null, [
    "As G1: SA-9 c, SI-5 a; raw/m365.json, notices, manifest",
    "CM-3 b: review announced changes with an impact analysis; the change and retirement task payloads (G6)",
    "Interim: Learn's Get-MgServiceAnnouncementMessage",
    "Rollback: none, read-only; revoke consent when retired",
  ], 11.5);
  if (process.env.FIT) console.log(`  basis bottom ${c2.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 02, Lab 1, steps 3, 5; data/kit-captures/pn/02-3, 02-5. Microsoft Learn, List serviceAnnouncement messages. NIST SP 800-53 Rev. 5.");
  speak(s, T,
`On the fixtures, Microsoft 365 gives six notices: a retirement with a provider date, a change the kit marks action required by its rule, three advisories and an incident. The next capture shows the difference that matters. The retirement of basic authentication for SMTP client submission is action required because Microsoft said so, in its action-required-by date field. The SharePoint Framework change is action required because of a stated kit rule about a message center category. The record says which, so nobody argues with Microsoft about a date Microsoft never set. This gate supports the same two controls as gate one, plus configuration change control: a change Microsoft announces is reviewed, with an impact analysis, before it lands. Until the reader exists, Learn's own cmdlet lists the same posts. And there's nothing to roll back: the collection only reads.`,
`Lab 1 step 3: ./Invoke-PnCollect.ps1 ... -Provider m365 -AsOf 2026-11-09T12:00:00Z -OutputPath out/m365: m365 gcc, 6 notices, 5 open, 2 action: advisory 3, change 1, incident 1, retirement 1. The guide's Try it: six notices, a retirement with a provider date, a change the kit marks action required by its rule, three advisories and an open incident. Step 5: m365:MC900001 provider: actionRequiredByDateTime; m365:MC900003 rule: Message center category preventOrFixIssue; the rest none. Validate (G2): a post with an action-required date is actionRequired with that date and the basis provider: actionRequiredByDateTime. Requirements: SA-9 c and SI-5 a, as in Gate 1 (KSI-SCR-MIT, KSI-SCR-MON; raw/m365.json, notices.json, manifest.json); CM-3 (configuration change control), part b: review proposed changes with a security and privacy impact analysis, for posts that announce a change (KSI-CMT-LMC, KSI-CMT-RVP; the task payloads for change and retirement notices, Gate 6). Interim path: Install-Module Microsoft.Graph.Devices.ServiceAnnouncement; Get-MgServiceAnnouncementMessage | Select-Object Id, Title, Category, ActionRequiredByDateTime. Rollback: nothing to roll back; revoke the reader's consent when the kit is retired. Not verified: Learn doesn't enumerate the message center tags; the kit treats a post tagged Retirement as a retirement; and Learn doesn't name which admin roles Graph accepts for a delegated read.`,
  `${WB}, Chapter 02, Lab 1, steps 3 and 5; ${IG}, Step 2 — "Federal requirements and evidence," "Interim path," "Validate," "Rollback"; data/kit-captures/pn/02-3.txt, 02-5.txt.`);
}
endModule(SG2);

// ================================================================== 12 G3 steps
{
  const T = "G3: Oracle Cloud Infrastructure announcements";
  const s = content(SG3, T);
  tag(s, "How");
  const c = code(s, "Steps", 0.6, 1.45, FULL, [
    "# Prerequisite: an IAM administrator adds this statement for the reader's group, in the tenancy (root compartment)",
    "Allow group <group> to read announcements in tenancy",
    "# 1 Configure the OCI CLI for the reader, in the tenancy's home region   # 2 Cross-check Oracle's list, latest in each chain",
    "oci announce announcements list --compartment-id <tenancy-ocid> --all --should-show-only-latest-in-chain true",
    "# 3 Collect: list, then read each announcement's details for its affected resources",
    "./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider oci -OutputPath out/oci",
  ], { label: "THE GUIDE'S STEPS, FROM examples/provider-notices" });
  const c2 = code(s, "Realms", 0.6, c + 0.15, FULL, cap("03-2", [1, 2, 3], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 03, LAB 1, STEP 2: THE REALMS (OUTPUT ONLY)" });
  const w = 5.95;
  panel(s, "Why", 0.6, c2 + 0.15, w, null, HEX.teal, HEX.tealTint, "WHY IT MATTERS", null, [
    "An agency whose HR platform runs on OCI reads that tenancy here, so platform maintenance reaches the HR system's owners first",
  ], 12);
  panel(s, "Inspect", 0.6 + w + 0.25, c2 + 0.15, w, null, HEX.navy, HEX.navyTint, "READ, NOT INSPECT", null, [
    "inspect lists summaries only, without the details call's affected resources",
  ], 12);
  sources(s, "Sources: Oracle, OCI CLI announcements list and get; Details for Announcements; Common Policies; Oracle US Government Cloud. Guide, Step 3; workbook Ch 03.");
  speak(s, T,
`Gate three is Oracle Cloud Infrastructure, and it matters here because the HR platform runs on Oracle Cloud. Reading that tenancy's announcements means platform maintenance reaches the HR system's owners before it lands. Oracle publishes maintenance, changes, action-required notices and production events as announcements, and updates to one announcement form a chain. The kit keeps only the latest in each chain. Oracle's documentation gives the policy statement: allow the reader's group to read announcements in the tenancy. Read, not inspect, because inspect lists summaries only, without the affected resources. Then cross-check with Oracle's own list command, and collect. For government, Oracle's US Government Cloud page lists the Announcements endpoints in two regions, in the realm called OC2. The third realm's endpoint isn't specified, because Oracle's page wasn't readable, so the kit refuses that realm.`,
`OCI publishes maintenance, changes, action-required notices and production events for a tenancy as announcements. Updates to one announcement form a chain; the kit keeps only the latest in each. Prerequisite: Allow group <group> to read announcements in tenancy (root compartment); inspect instead of read lists summaries only, without the details call's affected resources. Step 1: configure the OCI CLI for the reader, in the tenancy's home region, as Oracle's CLI documentation describes. Step 2: oci announce announcements list --compartment-id <tenancy-ocid> --all --should-show-only-latest-in-chain true. Step 3: the kit lists, then reads each announcement's details (oci announce announcements get) for its affected resources. Government-cloud availability: Oracle's US Government Cloud page lists the Announcements API at announcements.us-langley-1.oraclegovcloud.com and announcements.us-luke-1.oraclegovcloud.com, in realm OC2. OC3's endpoint is not yet specified; the kit refuses that realm. The capture (Chapter 03, Lab 1, step 2): oc1 oraclecloud.com; oc2 oraclegovcloud.com us-langley-1, us-luke-1; oc3 not yet specified (Oracle's page wasn't readable on November 9, 2026). Gate owner: the OCI platform lead, with the owner of each system on OCI. Not verified: the OCI CLI's output keys (camelCase or kebab-case) aren't shown in Oracle's CLI reference; the kit accepts both.`,
  `${IG}, Step 3 — prerequisites, steps, "Government-cloud availability"; ${WB}, Chapter 03, Lab 1, step 2; data/kit-captures/pn/03-2.txt.`);
}

// ================================================================== 13 G3 in code
{
  const T = "G3 in code: chains, resources, a new window";
  const s = content(SG3, T);
  tag(s, "How");
  const c1 = code(s, "Day1", 0.6, 1.45, FULL, cap("03-4", "all", { max: NFULL }),
    { label: "WORKBOOK CHAPTER 03, LAB 1, STEP 4: DAY ONE'S RECORDS (fictional fixtures, no tenant)" });
  const c2 = code(s, "Day2", 0.6, c1 + 0.12, 7.6, cap("03-5", [7, 8, 9, 10, 11, 12, 13], { max: fitChars(7.6) }),
    { label: "STEP 5: A WEEK LATER (SUMMARY LEFT OUT)" });
  panel(s, "Req", 8.4, c1 + 0.12, 4.35, null, HEX.navy, HEX.navyTint, "REQUIREMENT AND EVIDENCE", null, [
    "As G1: SA-9 c, SI-5 a; raw/oci.json",
    "CP-2 e: maintenance naming the agency's resources prompts a contingency plan review",
    "Interim: Oracle's announcement email, its recipients named in noticeContacts",
    "Rollback: remove the policy statement when retired",
  ], 11.5);
  if (process.env.FIT) console.log(`  day2 bottom ${c2.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 03, Lab 1, steps 4–5; data/kit-captures/pn/03-4, 03-5. Oracle, Announcement model. NIST SP 800-53 Rev. 5. Guide, Step 3.");
  speak(s, T,
`Here's Oracle on the fixtures. Day one gives four notices, one per chain. The maintenance names a database system and its window. The change is action required, by December 15, because Oracle's own action-required fields say so, and it names a load balancer. A week later, the provider has rescheduled the maintenance. Because the kit keeps only the latest in each chain, the new announcement replaces the original, with the new window, rather than becoming a second notice. That's exactly what the guide's try-it says to look for. Beyond monitoring the provider and receiving advisories, this gate supports contingency planning: maintenance that names the agency's resources prompts a contingency plan review, and the task carries a flag that says so. Until the reader exists, Oracle's announcement email is the interim path, and the settings file names who receives it.`,
`Lab 1 step 4 (day one): oci:chain-example-01 maintenance, window start 2026-11-22T04:00:00Z, resource ocid1.dbsystem...exampledb01; chain-example-02 change, action required by 2026-12-15, resource ocid1.loadbalancer...examplelb01; chain-example-03 advisory; chain-example-04 incident, closed. Step 5 (day two, AsOf 2026-11-16): chain-example-01 now 2026-11-29T04:00:00Z to 08:00:00Z, the rescheduled window. The guide's Try it: four notices; the rescheduled maintenance replaces the original in its chain, with the new window. Validate (G3): one notice per chain; an ACTION_REQUIRED announcement is action required with its ACTION_REQUIRED_BY date, and maintenance lists its affected resources. Requirements: SA-9 c and SI-5 a, as in Gate 1 (raw/oci.json, notices.json, manifest.json); CP-2 (contingency plan), part e: update the plan for changes to the system or environment of operation, when maintenance names the agency's resources — KSI-RPL-ARP; the task payload with contingency_review: true (Gate 6). Interim path: the announcement email Oracle sends to the tenancy's notification recipients, filed with the change record until the reader exists; name who receives it in the settings file's noticeContacts; the preflight checks it. Rollback: nothing to roll back; remove the policy statement when the kit is retired.`,
  `${WB}, Chapter 03, Lab 1, steps 4–5; ${IG}, Step 3 — "Try it," "Federal requirements and evidence," "Interim path," "Validate," "Rollback"; data/kit-captures/pn/03-4.txt, 03-5.txt.`);
}
endModule(SG3);

// ================================================================== 14 G4 steps
{
  const T = "G4: AWS Health and the support plan";
  const s = content(SG4, T);
  tag(s, "How");
  const c = code(s, "Steps", 0.6, 1.45, FULL, [
    "# 1 Create the read policy from health-read.json, then attach it to the reader's role",
    "{ \"Effect\": \"Allow\", \"Action\": [\"health:DescribeEvents\", \"health:DescribeEventDetails\", \"health:DescribeAffectedEntities\"], \"Resource\": \"*\" }",
    "aws iam create-policy --policy-name ProviderNoticesHealthRead --policy-document file://health-read.json",
    "# 2 Cross-check from the Health endpoint: commercial us-east-1; GovCloud (US) us-gov-west-1",
    "aws health describe-events --region us-east-1",
    "# 3 Collect: open and upcoming events, then details and affected entities ten events at a time",
    "./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider aws -OutputPath out/aws",
  ], { label: "THE GUIDE'S STEPS (step 1 shows the policy's one statement)" });
  const w = 5.95;
  const p1 = panel(s, "Plan", 0.6, c + 0.2, w, null, HEX.red, HEX.redTint, "A QUALIFYING SUPPORT PLAN", null, [
    "Without one, the API answers SubscriptionRequiredException",
    "AWS's pages name the plans differently (CLI reference, Health User Guide, GovCloud guide): check the account against the current pages",
  ], 12);
  const p2 = panel(s, "Iam", 0.6 + w + 0.25, c + 0.2, w, null, HEX.navy, HEX.navyTint, "A CUSTOMER MANAGED POLICY", null, [
    "AWS publishes no read-only managed policy for Health; AWSHealthFullAccess includes writes",
    "Interim: an EventBridge rule on aws.health events; without a plan, the AWS Health Dashboard and its email",
  ], 12);
  if (process.env.FIT) console.log(`  aws panels bottom ${Math.max(p1, p2).toFixed(2)}`);
  sources(s, "Sources: AWS, CLI reference health; Health User Guide (concepts, IAM, API); GovCloud (US) User Guide, AWS Health; EventBridge, AWS Health events. Guide, Step 4.");
  speak(s, T,
`Gate four is AWS Health, which publishes issues, scheduled changes and account notifications per account, with the affected resources. It's the one provider with a cost. AWS's documentation says the account needs a qualifying support plan, and without one the API answers with a subscription-required error. AWS's own pages name the qualifying plans differently, so check the account against the current pages. The reader holds a customer managed policy with three describe actions, because AWS publishes no read-only managed policy for Health, and its full-access policy includes writes. Then cross-check from the Health endpoint, which is US East for commercial accounts and the GovCloud West region for GovCloud. And collect. Until the reader exists, an EventBridge rule on AWS Health events pushes scheduled changes. Without a support plan, the AWS Health Dashboard and its email are the only path.`,
`AWS's pages name the qualifying plans differently: the CLI reference names Business, Enterprise On-Ramp or Enterprise Support; the AWS Health User Guide names Business Support+, Enterprise Support or Unified Operations; the GovCloud (US) guide names Business or Enterprise. The reader holds a customer managed policy with the three read actions; AWS publishes no read-only managed policy for Health, and AWSHealthFullAccess includes writes. health-read.json: Version 2012-10-17, one statement allowing health:DescribeEvents, health:DescribeEventDetails, health:DescribeAffectedEntities on Resource *. Step 2: commercial accounts use us-east-1; GovCloud (US) us-gov-west-1. Step 3: DescribeEventDetails takes 1 to 10 event ARNs. Government-cloud availability: in AWS GovCloud (US) the Health API has a single regional endpoint in us-gov-west-1, and EventBridge there doesn't send public events from the Service Health view. The kit refuses a caller outside the settings' partition. Interim path: an EventBridge rule on aws.health events, with detail-type AWS Health Event, pushes scheduled changes as they're published; the kit doesn't build the rule. Without a support plan, the AWS Health Dashboard and its email are the only path. Gate owner: the AWS account owner.`,
  `${IG}, Step 4 — prerequisites, steps, "Government-cloud availability," "Interim path."`);
}

// ================================================================== 15 G4 in code
{
  const T = "G4 in code: who said action is required";
  const s = content(SG4, T);
  tag(s, "How");
  const c1 = code(s, "Collect", 0.6, 1.45, FULL, cap("04-3", [0, 3, 4, 6], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 04, LAB 1, STEP 3 (fictional fixtures, no tenant; blank lines left out)" });
  const c2 = code(s, "Basis", 0.6, c1 + 0.12, FULL, cap("04-5", [1, 2, 3, 4, 5, 6, 7], { max: NFULL }),
    { label: "STEP 5 OUTPUT: THE ACTION BASIS" });
  const c3 = code(s, "Ten", 0.6, c2 + 0.12, FULL, cap("04-7", [1], { max: NFULL }),
    { label: "STEP 7: ELEVEN EVENT ARNS ON ONE DETAILS CALL (OUTPUT ONLY)" });
  line(s, "Req", "Supports, beyond G1's two: SI-5 d, implementing directives in the established time frames, for ACTION_REQUIRED events (the task's action_due).", c3 + 0.12, 0.6, 13);
  sources(s, "Sources: Developer workbook, Ch 04, Lab 1, steps 3, 5, 7; data/kit-captures/pn/04-3, 04-5, 04-7. AWS Health API, Event; DescribeEventDetails. NIST SP 800-53.");
  speak(s, T,
`On the fixtures, AWS gives five notices: two retirements, a maintenance window, a security notification and a closed incident. Three need action. Look at the basis. The EC2 instance retirement and the IAM security notification are action required because AWS said so, in its actionability field. The Lambda lifecycle event is action required by the kit's rule: a scheduled change whose event code names a retirement, due at its start time. Again, the record tells you which is AWS's word and which is the kit's. And the kit holds AWS's documented limit: the details call takes one to ten event identifiers, so eleven is refused before anything is sent. Beyond monitoring and receiving advisories, this gate supports implementing directives in the established time frames: an action-required event becomes a task with its due date.`,
`Lab 1 step 3: aws aws, 5 notices, 4 open, 3 action: incident 1, maintenance 1, retirement 2, security 1. The guide's Try it: two retirements, one maintenance window, one security notification and a closed incident. Step 5: EC2: Instance retirement scheduled — provider: actionability ACTION_REQUIRED; IAM: Security notification — provider: actionability ACTION_REQUIRED; RDS maintenance and S3 issue — none; LAMBDA: Planned lifecycle event — rule: AWS scheduled change whose event type code names a retirement; due at its start time. Step 7: "aws-describe-event-details takes 1 to 10 event ARNs; got 11." Validate (G4): the instance retirement is a retirement, due at its start, with the instance as its resource; an error naming SubscriptionRequiredException means the account has no qualifying support plan. Requirements: SA-9 c and SI-5 a, as in Gate 1 (raw/aws.json, notices.json, manifest.json); SI-5 d: implement directives in the established time frames, for events whose actionability is ACTION_REQUIRED — KSI-SCR-MON; the task payload with its action_due (Gate 6). Rollback: nothing to roll back; detach and delete the read policy when the kit is retired.`,
  `${WB}, Chapter 04, Lab 1, steps 3, 5 and 7; ${IG}, Step 4 — "Try it," "Federal requirements and evidence," "Validate," "Rollback"; data/kit-captures/pn/04-3.txt, 04-5.txt, 04-7.txt.`);
}
endModule(SG4);

// ================================================================== 16 Handoff
{
  const T = "Handing G1–G4 to Part 2";
  const s = content(SC, T);
  tag(s, "How");
  const tb = table(s, "Pack", 1.45, [1.7, 4.55, 2.3, 3.6], ["Gate", "In the evidence file", "Key requirements", "What Part 2 does with it"], [
    ["G1 Azure", "raw/azure.json, notices, manifest; the alert plan and results", "SA-9, SI-5, CA-7", "G6 routes the retirement and the security advisory"],
    ["G2 Microsoft 365", "raw/m365.json, notices, manifest", "SA-9, SI-5, CM-3", "G6 opens change and retirement tasks"],
    ["G3 OCI", "raw/oci.json, notices, manifest", "SA-9, SI-5, CP-2", "G6 flags contingency reviews"],
    ["G4 AWS", "raw/aws.json, notices, manifest", "SA-9, SI-5", "G6 carries AWS's action date"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Next", tb + 0.25, 1.2, "FaRoute", HEX.teal, "Next: ",
    "Part 2 takes G5 Google Cloud, G6 routing, G7 the digest and evidence, then dangers and rollback. To build Part 1's code: Building Provider Notices, Chapters 01 to 04.");
  sources(s, "Sources: Provider Notices guide, \"Evidence,\" Steps 6–7; developer workbook, Building Provider Notices, index (chapters).");
  speak(s, T,
`To close Part 1, here's what the four collection gates leave in the evidence file. Each one keeps the provider's raw response, the normalized notices and a manifest with every call and its permission. Azure adds the alert plan and its results. Together they support monitoring external providers, receiving their advisories, continuous monitoring, configuration change control for announced changes, and contingency planning for maintenance. Part 2 picks up from there: Google Cloud's incidents and its maintenance gap, then routing every notice that needs action to an owner as a task, the weekly digest, and the evidence chain the security officer keeps, with the dangers and rollback. To build Part 1's code, use the developer workbook, Building Provider Notices, chapters one to four, each with a fixture lab. And a last reminder: this guide is a draft, awaiting the owner's review. Thank you.`,
`Evidence by gate: G1 raw/azure.json, notices, manifest; the alert plan and results — SA-9, SI-5, CA-7; KSI-SCR-MIT, KSI-SCR-MON, KSI-MLA-EVC. G2 raw/m365.json, notices, manifest — SA-9, SI-5, CM-3; KSI-SCR-MIT, KSI-SCR-MON, KSI-CMT-LMC. G3 raw/oci.json, notices, manifest — SA-9, SI-5, CP-2; KSI-SCR-MIT, KSI-SCR-MON, KSI-RPL-ARP. G4 raw/aws.json, notices, manifest — SA-9, SI-5; KSI-SCR-MIT, KSI-SCR-MON. What Part 2 does with it: G6's routing turns the retirement and the security advisory into tasks (Azure), change and retirement posts into tasks with an impact analysis (Microsoft 365), maintenance naming the agency's resources into payloads with contingency_review: true (OCI), and ACTION_REQUIRED events into tasks with their action_due (AWS). The kit's records support these controls; the agency's assessor decides them. Status: the guide is a draft awaiting the owner's review.`,
  `${IG}, "Evidence"; Steps 2–4 (requirements tables); Step 6; ${WB}, index — "Chapters."`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: orientation and G1–G2", [
  "Provider Notices: An Implementation Guide (draft): \"In this guide,\" \"How to read this guide,\" \"The track at a glance,\" \"Prerequisites,\" \"The five providers compared,\" \"The path on one page,\" Steps 1 and 2, \"Evidence.\"",
  "Microsoft Learn pages the guide footnotes (read November 9, 2026): Resource Graph sample queries for Service Health; impacted resources; Subscription versus tenant level events; security advisories access and elevated access; Service Health alerts at scale using Azure Policy; Remediate non-compliant resources; Connect to Azure Government with Azure CLI; service communications API overview; National cloud deployments; List serviceAnnouncement messages, issues and healthOverviews; About admin roles.",
  "NIST SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0; FedRAMP, Key Security Indicators (FedRAMP Consolidated Rules for 2026).",
  "Developer workbook, Building Provider Notices: Chapters 01 and 02 (Lab 1). Captures: data/kit-captures/pn/01-3, 01-4, 01-7, 02-2, 02-3, 02-5 (fictional fixtures).",
]);
sourceSlide("Sources: G3, G4 and the handoff", [
  "Provider Notices: An Implementation Guide (draft): Steps 3 and 4; \"Evidence\"; Step 6.",
  "Oracle (read November 9, 2026): OCI CLI, oci announce announcements list and get; the Announcement model; Details for Announcements; Common Policies; Oracle US Government Cloud.",
  "AWS (read November 9, 2026): AWS Health API Reference, Event, DescribeEventDetails, AffectedEntity; AWS CLI reference, health and describe-events; AWS Health User Guide (concepts, identity-based policy examples, managed policies, Accessing the API); AWS GovCloud (US) User Guide, AWS Health; Amazon EventBridge events reference, AWS Health.",
  "Developer workbook, Building Provider Notices: Chapters 03 and 04 (Lab 1). Captures: data/kit-captures/pn/03-2, 03-4, 03-5, 04-3, 04-5, 04-7 (fictional fixtures). Part 2: Provider Notices — implementation, Part 2.",
]);

fs.writeFileSync(path.join(__dirname, "narration.json"), JSON.stringify(SAY, null, 2) + "\n");
const total = SAY.reduce((a, e) => a + e.say.split(" ").length, 0);
console.log(`narration.json: ${SAY.length} slides, ${total} spoken words, about ${(total / 150).toFixed(1)} min`);
finish(OUT);
