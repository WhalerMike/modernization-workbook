// Implementation guide — Provider Notices, IMPLEMENTATION SERIES, PART 2:
// G5 Google Cloud, G6 routing to owners, G7 the digest and evidence, then running it safely.
//   Recap:        where Part 1 left off (every provider collected into one record).
//   G5–G7:        the steps, the kit's real Lab 1 output, requirement and evidence, government cloud, interim path, rollback.
//   Running it:   control states and change rings, dangers, evidence by gate, rollback, what couldn't be verified.
//   Close:        the guide's checklist.
// Sources: docs/books/guides/provider-notices-implementation.md (status: draft; the deck says so on the title slide and
// in the opening and closing narration), the developer workbook docs/project-plans/developer-workbooks/provider-notices/
// (Chapters 05–07, Lab 1 of each), the kit examples/provider-notices, and the real Lab 1 captures in data/kit-captures/pn/.
// No new external facts: provider facts are the ones the guide footnotes (read November 9, 2026).
// The slide helpers come from the ADM technical deep dive's shared builders (../attribute-driven-migration-technical-part-1/slides.js),
// with the NPI implementation series' code panel and one-line statement. Every terminal line on a slide is read from
// data/kit-captures/pn/NN-k.txt at build time, so it stays the kit's real output; a panel that leaves lines out says so.
// Narration: the spoken text is SAY below; the build writes it to narration.json, which narrate.py speaks. The speaker
// notes carry the same text plus the presenter's detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/provider-notices-implementation-part-2/build.js \
//                      presentations/provider-notices-implementation-part-2/Provider_Notices_Implementation_Part_2.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Provider Notices — Implementation, Part 2",
  footer: "Federal Modernization Workbook  ·  Provider Notices — Implementation, Part 2: G5–G7",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || path.join(__dirname, "Provider_Notices_Implementation_Part_2.pptx");
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

const S0 = "Recap";
const SG5 = "G5 — Google Cloud";
const SG6 = "G6 — Routing";
const SG7 = "G7 — Digest and evidence";
const SR = "Running it safely";
const SC = "Close";
const FULL = 12.15;
const NFULL = fitChars(FULL); // 146 characters at 10.5 pt

// ================================================================== 1 Title
{
  const T = "Part 2: Routing, the digest, evidence and rollback";
  const s = titleSlide(S0, T, "Provider Notices — implementation, Gates G5–G7");
  box(s, "Draft notice", 0.8, 0.55, 8.4, 0.75, "FFFFFF", HEX.red);
  txt(s, "Draft notice text", [
    { text: "DRAFT GUIDE, AWAITING THE OWNER'S REVIEW.  ", options: { bold: true, color: HEX.red } },
    { text: "Recheck it after the review; the kit is fixture-tested, not run in a tenant." },
  ], { x: 1.0, y: 0.6, w: 8.05, h: 0.65, fontSize: 14, valign: "middle", color: HEX.ink });
  txt(s, "Session map", [
    { text: "G5 Google Cloud  ·  G6 Routing to owners  ·  G7 Digest and evidence", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Control states and change safety  ·  dangers  ·  evidence  ·  rollback  ·  what couldn't be verified", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 1: orientation  ·  G1 Azure  ·  G2 Microsoft 365  ·  G3 Oracle Cloud Infrastructure  ·  G4 AWS", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.2, h: 1.35, fontSize: 15, paraSpaceAfter: 2 });
  speak(s, T,
`Welcome to Part 2 of the implementation series for provider notices. As in Part 1, one thing first: Provider Notices, An Implementation Guide, is a draft, awaiting the owner's review, so check it again after that review. Part 1 collected four providers into one record: Azure Service Health, Microsoft 365, Oracle Cloud Infrastructure and AWS Health. Part 2 finishes the loop. Gate five adds Google Cloud's incidents, and records the gap for planned maintenance. Gate six routes every notice that needs action to an owner, as a task, without duplicates. Gate seven writes the weekly digest the owners read, and the evidence chain the security officer keeps. Then how to run it safely: control states and change rings, the dangers, the evidence file, rollback, and what couldn't be verified. The kit's code is illustrative, tested against fixtures, not against a live tenant.`,
`Status: the guide's front matter says status: draft. Every provider fact was checked against the provider's own documentation on November 9, 2026, control statements against NIST's OSCAL catalog and the KSIs' related controls against fedramp.gov's 2026 pages. Design guidance marks the program's recommendations; facts that couldn't be verified are marked not yet specified. The audience is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, with workloads in Oracle Cloud Infrastructure and possibly AWS or Google Cloud. Part 1 covered the orientation and G1 to G4.`,
  `${IG}, opening; "In this guide"; "How to read this guide."`);
}

// ================================================================== 2 Recap
{
  const T = "Where Part 1 left off: one record, five providers";
  const s = content(S0, T);
  tag(s, "Why");
  const c = code(s, "All", 0.6, 1.45, FULL, cap("06-3", [0, 3, 4, 5, 6, 7, 8, 10], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 06, LAB 1, STEP 3: EVERY PROVIDER ON DAY ONE (fictional fixtures, no tenant; blank lines left out)" });
  const w = 5.95;
  panel(s, "Have", 0.6, c + 0.2, w, null, HEX.navy, HEX.navyTint, "WHAT THE COLLECTION GIVES", null, [
    "22 notices, each one record with a kind, a window, resources, and whether action is required, by when and on whose word",
    "A manifest of every call and its permission, per run",
  ], 12.5);
  panel(s, "Need", 0.6 + w + 0.25, c + 0.2, w, null, HEX.red, HEX.redTint, "WHAT IT DOESN'T GIVE YET", null, [
    "An owner and a due date for each notice that needs action, without a second task on the next run",
    "A weekly read for the owners, and evidence an assessor can trust",
  ], 12.5);
  sources(s, "Sources: Developer workbook, Building Provider Notices, Ch 06, Lab 1, step 3; data/kit-captures/pn/06-3. Provider Notices guide, \"The track at a glance.\"");
  speak(s, T,
`Here's where Part 1 left off, on the kit's fixtures with every provider enabled. One collection gives twenty-two notices: five from Azure, six from Microsoft 365, four from Oracle Cloud, five from AWS and two from Google Cloud, and every one is valid against the same schema. Each record says what kind of notice it is, its window, the resources it names, and whether action is required, by when, and on whose word. What the collection doesn't give you yet is the part that closes the gap. Nobody owns these notices until each one that needs action has an owner and a due date, and a second run mustn't make a second task. The owners need something to read every week. And the security officer needs evidence that can't be quietly edited. That's gates six and seven. First, Google Cloud.`,
`Chapter 06, Lab 1, step 3 collects every provider from the day-one fixtures: azure AzureCloud 5 notices, 5 open, 2 action; m365 gcc 6, 5, 2; oci oc1 4, 3, 1; aws aws 5, 4, 3; google global 2, 1, 0. 22 notices, each valid against schema/notice.schema.json, written to out/day1: notices.json, notices.csv, raw/, manifest.json. The goal (design guidance): every notice is collected on a schedule, held as one record, and either given to an owner as a task with a due date or put in a weekly digest the owners read; a task closes only after the next collection shows the notice closed or the resource no longer affected (the re-read, clause C4 of the request chain), never because someone said it was done.`,
  `${WB}, Chapter 06, Lab 1, step 3; ${IG}, "The track at a glance"; data/kit-captures/pn/06-3.txt.`);
}
endModule(S0);

// ================================================================== 3 G5 steps
{
  const T = "G5: Google Cloud Personalized Service Health";
  const s = content(SG5, T);
  tag(s, "How");
  const c = code(s, "Steps", 0.6, 1.45, FULL, [
    "# Prerequisite (the project owner, once): enable the API, grant the reader's group the viewer role",
    "gcloud services enable servicehealth.googleapis.com --project=<project-id>",
    "gcloud projects add-iam-policy-binding <project-id> --member=group:<group-email> --role=roles/servicehealth.viewer",
    "# 1 Cross-check the list",
    "gcloud service-health events list --project=<project-id> --location=global",
    "# 2 Collect (for an organization: providers.google.scope = organization, and the role on the organization)",
    "./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider google -OutputPath out/google",
  ], { label: "THE GUIDE'S STEPS, FROM examples/provider-notices" });
  const w = 3.9, g = 0.225;
  panel(s, "Gap", 0.6, c + 0.2, w, null, HEX.red, HEX.redTint, "INCIDENTS ONLY", null, [
    "The API has one event category, INCIDENT",
    "Planned maintenance isn't in it: record the gap with the ISSO",
  ], 12);
  panel(s, "Gov", 0.6 + w + g, c + 0.2, w, null, HEX.teal, HEX.tealTint, "ASSURED WORKLOADS", null, [
    "Listed under 25 regional packages, including US Data Boundary",
    "Not under FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS or ITAR: a gap to record",
  ], 12);
  panel(s, "Org", 0.6 + 2 * (w + g), c + 0.2, w, null, HEX.amber, HEX.amberTint, "ORGANIZATION EVENTS", null, [
    "The REST call is verified; the gcloud flags weren't read",
    "So the kit marks it unverified and runs it only with -AllowUnverified",
  ], 12);
  sources(s, "Sources: Google Cloud, Personalized Service Health REST (events list, Event); List events; gcloud service-health events list; roles; Assured Workloads products. Guide, Step 5.");
  speak(s, T,
`Gate five is Google Cloud's Personalized Service Health, which lists the incidents relevant to a project or organization. Google's documentation sets one hard limit: the API has a single event category, incident. Planned maintenance isn't in it, so this gate covers incidents only, and the gap is recorded with the security officer. The project owner enables the API once and grants the reader's group the viewer role. Then cross-check with Google's own list command, and collect. For an organization, the settings say so and the role is granted on the organization. But the gcloud flags for organization events weren't read, so the kit marks that call unverified and runs it only when told to. And for government workloads: Google's Assured Workloads page lists this product under regional packages, but not under FedRAMP Moderate or High. A workload in those packages has nothing to read here.`,
`Personalized Service Health lists Google Cloud incidents relevant to a project or organization. Its API has one event category, INCIDENT: planned maintenance isn't in it, so this gate covers incidents only. Prerequisites: the project owner enables servicehealth.googleapis.com once, and grants the reader's group roles/servicehealth.viewer (Personalized Service Health Viewer). Government-cloud availability: Assured Workloads' supported-products page lists Personalized Service Health under 25 regional packages, including US Data Boundary, but not under FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS or ITAR. A workload in one of those packages has no Personalized Service Health to read; record that as a gap with the ISSO. Interim path: the organization-events call is verified on Google's REST reference, but the gcloud flags for it weren't read, so the kit marks it unverified and runs it only with -AllowUnverified. Gate owner: the Google Cloud project owner.`,
  `${IG}, Step 5 — prerequisites, steps, "Government-cloud availability," "Interim path."`);
}

// ================================================================== 4 G5 in code
{
  const T = "G5 in code: two incidents, one unverified call";
  const s = content(SG5, T);
  tag(s, "How");
  const c1 = code(s, "Perm", 0.6, 1.45, FULL, cap("05-1", [1, 2, 3, 4, 5, 6, 7, 8], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 05, LAB 1, STEP 1: WHAT GOOGLE CLOUD NEEDS (fictional fixtures, no tenant)" });
  const c2 = code(s, "Collect", 0.6, c1 + 0.12, FULL, cap("05-2", [0, 3, 4, 6], { max: NFULL }),
    { label: "STEP 2: COLLECT (BLANK LINES LEFT OUT)" });
  const c3 = code(s, "Records", 0.6, c2 + 0.12, FULL, cap("05-3", "all", { max: NFULL }),
    { label: "STEP 3: THE RECORDS" });
  if (process.env.FIT) console.log(`  g5 bottom ${c3.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 05, Lab 1, steps 1–3; data/kit-captures/pn/05-1, 05-2, 05-3. Google Cloud, Personalized Service Health roles; Event resource.");
  speak(s, T,
`On the fixtures, Google Cloud looks like this. The kit declares two calls with the viewer role. The project call is verified against Google's documentation. The organization call says verified, false, which is why it runs only when you allow it. The collection gives two incidents, one open and one closed, and none needs action: Google's API has no field that says action is required. The records show where the products and locations come from, the event's impacts, which is what the guide's validate step checks. Cloud SQL in one region is open; Cloud Storage in another is closed. And that's the whole gate. It supports the same two controls as gate one, monitoring the provider and receiving its advisories. Rollback is simply removing the role binding when the kit is retired.`,
`Lab 1 step 1: google-events, roles/servicehealth.viewer (Personalized Service Health Viewer) on the project: servicehealth.events.list, Verified True; google-organization-events, roles/servicehealth.viewer on the organization: servicehealth.organizationEvents.list, Verified False. Step 2: google global, 2 notices, 1 open, 0 action: incident 2. The guide's Try it: two incidents, one open and one closed. Step 3: incident open, Cloud SQL connection errors in us-east4, Google Cloud SQL, us-east4; incident closed, Cloud Storage latency in us-central1. Validate (G5): every incident written; products and locations come from eventImpacts, and closed incidents are closed. Requirements: SA-9 c and SI-5 a, as in Gate 1 — KSI-SCR-MIT, KSI-SCR-MON; raw/google.json, notices.json, manifest.json. Rollback: nothing to roll back; remove the role binding when the kit is retired; leave the API enabled unless the project owner decides otherwise.`,
  `${WB}, Chapter 05, Lab 1, steps 1–3; ${IG}, Step 5 — "Try it," "Federal requirements and evidence," "Validate," "Rollback"; data/kit-captures/pn/05-1.txt, 05-2.txt, 05-3.txt.`);
}
endModule(SG5);

// ================================================================== 5 G6 steps
{
  const T = "G6: route every notice that needs action to an owner";
  const s = content(SG6, T);
  tag(s, "Who");
  const c = code(s, "Steps", 0.6, 1.45, FULL, [
    "# 2 Check the routing: the kit refuses an unknown match key, a task rule without a severity or group, and a placeholder",
    "pwsh -NoProfile -Command \"Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1; Read-PnRouting -Path <routing-file>\"",
    "# 3 Route, as a dry run",
    "./Invoke-PnRoute.ps1 -NoticesPath out/azure/notices.json -RoutingPath <routing-file> -StatePath out/state.json -OutputPath out/route",
  ], { label: "THE GUIDE'S STEPS 2 AND 3, FROM examples/provider-notices" });
  const w = 3.9, g = 0.225;
  panel(s, "Write", 0.6, c + 0.2, w, null, HEX.navy, HEX.navyTint, "1 WRITE IT AT WORK", null, [
    "From templates/routing.template.json or the worksheet, inside the boundary, with the kit's Copilot prompts",
    "First match wins: security advisories and retirements before the general rule (design guidance)",
  ], 11.5);
  panel(s, "Payload", 0.6 + w + g, c + 0.2, w, null, HEX.teal, HEX.tealTint, "3 A SERVICENOW-SHAPED TASK", null, [
    "Severity, priority and response window: P1 immediate, P2 one hour, P3 24 hours, P4 72 hours (program design)",
    "The provider's own date kept separate; de-duplication key: provider and provider ID",
    "The five clauses of the request chain, Human decision lane",
  ], 11.5);
  panel(s, "Send", 0.6 + 2 * (w + g), c + 0.2, w, null, HEX.amber, HEX.amberTint, "4 SEND, ONCE THE ENDPOINT EXISTS", null, [
    "Only with routing.send true and -Send, to an https endpoint, token from an environment variable",
    "A task closes only on the re-read (C4); a provider's close asks for it (design guidance)",
  ], 11.5);
  sources(s, "Sources: Provider Notices guide, Step 6; Governance, Drift & Evidence, App. B (Ticket-to-Machine reference); kit copilot-prompts.md.");
  speak(s, T,
`Gate six turns notices into work. A notice that needs action becomes a task with an owner; the rest go in the digest. First, the routing is written at work, inside the agency's boundary, from the kit's template, with its prompts in Copilot Chat. Rules are tried in order and the first match wins, so security advisories and retirements come before the general action-required rule. Second, check it: the kit refuses an unknown match key, a task rule with no severity or group, and a placeholder left in. Third, route as a dry run. Each task is shaped for ServiceNow, with a severity and a response window from the program's finding contract, the provider's own date kept separate, and the five clauses of the Ticket-to-Machine request chain. Fourth, send once the agency's endpoint exists. And a task closes only on the re-read, never because the provider closed the notice.`,
`Prerequisites: at least one of G1 to G5; the agency's routing file, written at work from the kit's template. Step 1: copy templates/routing.template.json, or fill templates/routing-worksheet.csv, inside the agency's boundary; the kit's Copilot prompts draft and review it in Microsoft 365 Copilot Chat. Rules are tried in order and the first match wins (design guidance). Step 3: each task payload is ServiceNow-shaped: the finding contract's severity, priority and response window (P1 immediate, P2 one hour, P3 24 hours, P4 72 hours; program design, not a federal requirement), the provider's own action date kept separate, a de-duplication key of provider and provider ID, and the five clauses of the request chain in the Human decision lane (Book 13, Appendix B). Step 4: the scheduled run sends only when the settings file's routing.send is true and -Send is given, to the settings' https endpoint with a token from the environment variable it names. A task closes only after the re-read (C4): the next collection shows the notice closed or no longer listed. A provider closing a notice produces a close payload that asks for the re-read; it doesn't close the task (design guidance). Gate owner: the change manager, with the ISSO for the security route.`,
  `${IG}, Step 6 — prerequisites and steps 1–4; Book 13, Appendix B.`);
}

// ================================================================== 6 G6 day one
{
  const T = "G6 in code: day one makes twelve tasks, once";
  const s = content(SG6, T);
  tag(s, "How");
  const c1 = code(s, "Day1", 0.6, 1.45, FULL, cap("06-4", [0, 1, 2, 3, 5, 6, 9, 11, 12, 13, 16, 18], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 06, LAB 1, STEP 4: ROUTE DAY ONE (FIVE OF THE TWELVE create LINES LEFT OUT; fictional fixtures)" });
  const c2 = code(s, "Rerun", 0.6, c1 + 0.12, FULL, cap("06-6", [1, 2, 3, 4, 6], { max: NFULL }),
    { label: "STEP 6: ROUTE THE SAME COLLECTION AGAIN (blank lines left out)" });
  if (process.env.FIT) console.log(`  g6 day1 bottom ${c2.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 06, Lab 1, steps 4 and 6; data/kit-captures/pn/06-4, 06-6. Provider Notices guide, Step 6, \"Try it,\" \"Validate.\"");
  speak(s, T,
`Here's routing on the fixtures. Day one's twenty-two notices are all new. Twelve route to a task, nine are digest only and one is ignored, so the dry run writes twelve create payloads and sends nothing. You can see the routing working: the security notifications go to security operations at P2, the retirements and maintenance to cloud platform engineering at P3, and the Azure incident to the service desk. Then the important test. Route the same collection again, against a copy of the state, and every notice is unchanged, so no payload is written at all. That's what the guide's validate step asks for: every security advisory and retirement routes to a task, and a second run on the same collection writes nothing. The provider hasn't changed the notice, so nobody gets a second task.`,
`Step 4: ./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z. Notices: 22 new, 0 changed, 0 unchanged, 0 no longer listed. Routes: 12 task, 9 digest only, 1 ignored. Payloads: 12 create, 0 update, 0 close. The lines shown: the AWS instance retirement (P3 Cloud Platform Engineering), the AWS IAM security notification (P2 Security Operations), the Azure incident AB1C-2DE (P2 Service Desk), the Azure retirement RT5J-6KL (P3), the Azure security advisory SA7M-8NP (P2 Security Operations), the M365 retirement MC900001 (P3) and the OCI change chain-example-02 (P3 Cloud Operations); the other create lines are left out. "Dry run: 12 payloads written to out/day1-route/tasks, nothing sent." The assignment groups are the kit's example routing (config/routing.json), not an agency's. Step 6 copies the state and routes the same collection: 0 new, 0 changed, 22 unchanged; 0 create, 0 update, 0 close; "No payloads: nothing new or changed needs a task." The guide's Try it: day 1 writes 12 create payloads.`,
  `${WB}, Chapter 06, Lab 1, steps 4 and 6; ${IG}, Step 6 — "Try it," "Validate"; data/kit-captures/pn/06-4.txt, 06-6.txt.`);
}

// ================================================================== 7 G6 day two
{
  const T = "G6 in code: a week later, and the five clauses";
  const s = content(SG6, T);
  tag(s, "How");
  const c1 = code(s, "Day2", 0.6, 1.45, FULL, cap("06-7", [11, 12, 13, 14, 16, 17, 18, 19, 20, 21], { max: NFULL }),
    { label: "WORKBOOK CHAPTER 06, LAB 1, STEP 7: ROUTE DAY TWO (THE COLLECTION AND THE LAST LINE LEFT OUT)" });
  const c2 = code(s, "Clauses", 0.6, c1 + 0.12, FULL, cap("06-5", [14, 15, 16, 17, 18, 19, 20], { max: NFULL }),
    { label: "STEP 5: THE RETIREMENT'S TASK, ITS REQUEST-CHAIN CLAUSES (the payload's other fields left out)" });
  if (process.env.FIT) console.log(`  g6 day2 bottom ${c2.toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 06, Lab 1, steps 5 and 7; data/kit-captures/pn/06-5, 06-7. Governance, Drift & Evidence, App. B. Guide, Step 6.");
  speak(s, T,
`A week later, the providers have moved. Day two's routing finds two new notices, six changed, fifteen unchanged and one no longer listed. So it writes one create, four updates and one close, and nothing for the fifteen unchanged. The updates are two rescheduled maintenance windows, an updated Microsoft 365 post, and an incident the provider no longer lists. The close is the AWS security notification the provider closed, and that close payload asks for the re-read rather than closing the task. Below it is the request chain on the Azure retirement's task, in the Human decision lane. Clause one says where it came from. Two names the approver role, the system owner. Three is the action, under change control. Four is the re-read check that closes it. And five says what evidence is kept.`,
`Step 7 routes day two against the same state: Notices: 2 new, 6 changed, 15 unchanged, 1 no longer listed. Routes: 12 task, 10 digest only, 1 ignored. Payloads: 1 create, 4 update, 1 close: close P2 AWS IAM security notification; update P2 azure:AB1C-2DE (an incident no longer listed); update P3 azure:PM3F-4GH (rescheduled maintenance); update P3 m365:MC900003 (an updated post); create P3 m365:MC900005; update P3 oci:chain-example-01 (rescheduled maintenance). The guide's Try it: day 2 writes 1 create, 4 updates (two rescheduled maintenance windows, an updated post, an incident no longer listed) and 1 close, and nothing for the 15 unchanged notices. Step 5's payload for azure:RT5J-6KL: action create, dedupe_key azure|RT5J-6KL, severity P3, priority 3, response window 86400 seconds, action_required True, action_due 2027-09-30, assignment group Cloud Platform Engineering (example), contingency_review True, controls CM-3, CM-4, CP-2, SI-5. ticket_to_machine: lane Human decision; c1_origin Provider notice azure:RT5J-6KL, read by the provider notices kit; c2_approver_role System owner; c3_action Plan the change the notice calls for and run it under change control; c4_reread_check The next collection shows the notice closed or no longer listed, or the named resources no longer affected; c5_evidence_kept notices.json and this payload from the run, the change or decision record, and the evidence chain.`,
  `${WB}, Chapter 06, Lab 1, steps 5 and 7; ${IG}, Step 6 — steps 3–4, "Try it"; data/kit-captures/pn/06-5.txt, 06-7.txt.`);
}

// ================================================================== 8 G6 requirement
{
  const T = "G6: requirement, evidence, interim path, rollback";
  const s = content(SG6, T);
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 2.55, 4.0], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "What the ISSO keeps"], [
    ["SI-5 c and d: disseminate advisories to the people who act; implement directives in the established time frames, or report the gap", "KSI-SCR-MON", "tasks/, tasks.json, routing.csv, state.json"],
    ["CM-3 b and f, CM-4: a change a provider announces is reviewed and its impact analyzed before it lands", "KSI-CMT-LMC, KSI-CMT-RVP", "The change, retirement and maintenance payloads, and the change records they open"],
    ["CP-2 e: retirements and maintenance that name the agency's resources prompt a contingency plan review", "KSI-RPL-ARP", "Payloads with contingency_review: true"],
  ], { fontSize: 11.5, limit: 6.6 });
  const w = 3.9, g = 0.225;
  const top = tb + 0.2;
  panel(s, "Gov", 0.6, top, w, null, HEX.teal, HEX.tealTint, "GOVERNMENT CLOUD", null, [
    "Routing runs on the operator's workstation or a scheduler and calls no cloud",
    "The ServiceNow endpoint is the agency's own",
  ], 11.5);
  panel(s, "Interim", 0.6 + w + g, top, w, null, HEX.amber, HEX.amberTint, "INTERIM PATH", null, [
    "The service desk works from the dry run's tasks/ folder and routing.csv",
    "Each task's number goes in the change record",
  ], 11.5);
  panel(s, "Rollback", 0.6 + 2 * (w + g), top, w, null, HEX.red, HEX.redTint, "ROLLBACK", null, [
    "Revert the routing file to the last reviewed version",
    "Keep the state file: it is the record of what was routed",
  ], 11.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators. Provider Notices guide, Step 6.");
  speak(s, T,
`What does routing support? Three things in NIST's catalog. Getting advisories to the people who act on them, and acting within set time frames or reporting the gap. Configuration change control and impact analysis, so a change a provider announces is reviewed before it lands. And contingency planning, because retirements and maintenance that name the agency's resources prompt a review of the plan. The security officer keeps the task payloads, the routing file's output and the state. One honest note from FedRAMP's pages: no key security indicator cites the base impact-analysis control, only its enhancement. Routing calls no cloud at all, so there's no government-cloud question here; the ServiceNow endpoint is the agency's own. Until it exists, the service desk works from the dry run's files. And rollback is reverting the routing file, while keeping the state.`,
`Requirements: SI-5 c and d: disseminate advisories to the people who act, and implement directives in the established time frames or report the gap — KSI-SCR-MON; tasks/, tasks.json, routing.csv, state.json. CM-3 b and f, CM-4 (impact analyses): a change a provider announces is reviewed and its impact analyzed before it lands — KSI-CMT-LMC, KSI-CMT-RVP; the task payloads for change, retirement and maintenance, and the change records they open. CP-2 e: retirements and maintenance that name the agency's resources prompt a contingency plan review — KSI-RPL-ARP; payloads with contingency_review: true. No KSI cites base CM-4; KSI-CMT-LMC and KSI-CMT-VTD cite CM-4(2). CM-3 to KSI-CMT-LMC is also Book 13, Appendix A's row. Which record supports which indicator is the program's mapping (design guidance). Government-cloud availability: routing runs on the operator's workstation or a scheduler and calls no cloud; the ServiceNow endpoint is the agency's own. Interim path: before the endpoint exists, the service desk works from the dry run's tasks/ folder and routing.csv, and records each task's number in the change record. Rollback: revert the routing file to the last reviewed version; the state file is the record of what was routed; keep it.`,
  `${IG}, Step 6 — "Federal requirements and evidence," "Government-cloud availability," "Interim path," "Rollback."`);
}
endModule(SG6);

// ================================================================== 9 G7 steps
{
  const T = "G7: preflight, the weekly run, and the go/no-go";
  const s = content(SG7, T);
  tag(s, "How");
  const c = code(s, "Steps", 0.6, 1.45, FULL, [
    "# 1 Preflight the stage: reads only (PF-01 to PF-07)",
    "./deploy/Test-PnPreflight.ps1 -SettingsPath <settings-file> -Stage test -OutputPath out/preflight",
    "# 2 Run the weekly collection, routing and digest; each step is recorded as evidence under the settings' output root",
    "./deploy/Invoke-PnScheduledRun.ps1 -SettingsPath <settings-file>",
    "# 3 Record the preflight, then check the stage",
    "./Invoke-PnEvidence.ps1 -EvidencePath <output-folder>/evidence -RunPath out/preflight",
    "./Invoke-PnEvidence.ps1 -EvidencePath <output-folder>/evidence -Check -Stage test",
  ], { label: "THE GUIDE'S STEPS, FROM examples/provider-notices (<output-folder> is the settings file's outputRoot)" });
  const w = 5.95;
  panel(s, "Pre", 0.6, c + 0.2, w, null, HEX.navy, HEX.navyTint, "WHAT THE PREFLIGHT READS", null, [
    "The settings and routing files; each enabled provider's tool and signed-in cloud; the reader's first call (for AWS, the support plan)",
    "The named notice contacts, the output root, and in production the test stage's evidence (-TestEvidencePath)",
  ], 12);
  panel(s, "Go", 0.6 + w + 0.25, c + 0.2, w, null, HEX.amber, HEX.amberTint, "THE GO/NO-GO", null, [
    "A passing record for every step the stage lists: test PRE, RUN, ROUTE, DIGEST; production adds ALERTS",
    "An unbroken chain and a matching SHA256SUMS; the scheduler is the agency's, not the kit's",
  ], 12);
  sources(s, "Sources: Provider Notices guide, Step 7; developer workbook, Building Provider Notices, Ch 07 and Ch 08 (deploying to test and production).");
  speak(s, T,
`Gate seven makes it a weekly habit and proves it ran. The digest is what the owners read every week; the evidence is what the security officer keeps. The deployment runbook takes both to a test environment and then production, with the same commands and one settings file per environment. Three steps. First, a preflight that only reads: the settings and routing files, each provider's tool and signed-in cloud, the reader's first call, and for AWS the support plan, the named notice contacts, and in production the test stage's evidence. Second, the weekly run: collection, routing and the digest, each step recorded as evidence. Third, the go or no-go. It needs a passing record for every step the stage lists, with production adding the alert policy, an unbroken chain, and matching hashes. The scheduler is the agency's; the kit doesn't register one.`,
`Prerequisites: G6; a settings file per environment, and a scheduler the agency runs; the kit doesn't register one. Step 1: preflight the stage; reads only: the settings and routing files, each enabled provider's tool and signed-in cloud, the reader's first call (for AWS also the support plan), the named notice contacts, the output root, and in production the test stage's evidence (PF-01 to PF-07). Step 2: ./deploy/Invoke-PnScheduledRun.ps1 -SettingsPath <settings-file>; each step is recorded as evidence under the settings' output root. Step 3: record the preflight and check the stage. The go/no-go needs a passing record for every step the stage lists (test: PRE, RUN, ROUTE, DIGEST; production adds ALERTS), an unbroken chain and a matching SHA256SUMS. In production, pass the test stage's evidence folder to the preflight with -TestEvidencePath. Government cloud: as in Gates 1 to 5, per provider; the run reads each provider in the cloud its settings file names. Interim path: run the four entry scripts by hand each week and record each run folder with Invoke-PnEvidence.ps1 until the scheduler is in place. Gate owner: the ISSO.`,
  `${IG}, Step 7 — prerequisites, steps 1–3, "Government-cloud availability," "Interim path."`);
}

// ================================================================== 10 G7 in code
{
  const T = "G7 in code: the digest and the evidence chain";
  const s = content(SG7, T);
  tag(s, "How");
  const c1 = code(s, "Digest", 0.6, 1.45, FULL, cap("07-2", "all", { max: NFULL }),
    { label: "WORKBOOK CHAPTER 07, LAB 1, STEP 2: THE DIGEST (after routing day one and day two; fictional fixtures)" });
  const c2 = code(s, "Records", 0.6, c1 + 0.12, FULL, cap("07-4", [0, 1, 5, 6, 10, 11], { max: NFULL }),
    { label: "STEP 4: THREE EVIDENCE RECORDS (THEIR CONTROLS, KSIS AND FILE LINES LEFT OUT)" });
  const w = 5.95;
  const c3 = code(s, "Check", 0.6, c2 + 0.12, w, cap("07-5", "all", { max: fitChars(w) }),
    { label: "STEP 5: CHECK THE CHAIN" });
  const c4 = code(s, "Stage", 0.6 + w + 0.25, c2 + 0.12, w, cap("07-6", [1, 2, 3, 4, 5, 6, 7], { max: fitChars(w) }),
    { label: "STEP 6: CHECK AS THE TEST STAGE (OUTPUT ONLY)" });
  if (process.env.FIT) console.log(`  g7 bottom ${Math.max(c3, c4).toFixed(2)}`);
  sources(s, "Sources: Developer workbook, Ch 07, Lab 1, steps 2 and 4–6; data/kit-captures/pn/07-2, 07-4, 07-5, 07-6. Provider Notices guide, Step 7, \"Try it.\"");
  speak(s, T,
`Here's gate seven on the fixtures, after routing both days. The digest shows sixteen open notices, eight needing action, five starting in the next thirty days, two new, and four closed or no longer listed. Every action-required notice shows its due date and the group it was routed to, which is the guide's pass condition. Then the evidence. Each run folder becomes a numbered record: the collection, the routing and the digest, each passing. The check confirms that every file matches the hash list and the three records form an unbroken chain. And watch what happens when you check them as the test stage. The chain still passes, but the preflight and the scheduled run have no passing record, because on a laptop nobody ran them. So the go or no-go fails, and the script exits with an error. That's the point: the stage can't pass on a partial run.`,
`Step 2: ./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z: "Digest: 16 open, 8 need action, 5 starting in the next 30 days, 2 new, 4 closed or no longer listed"; written to out/digest: digest.md, digest.csv, manifest.json. The digest's five sections: open notices by provider; action required (due, provider, kind, title, routed to, notice); maintenance and changes starting in the next 30 days; new in the last 7 days; closed or no longer listed in the last 7 days. Step 4 records three runs: Record 1 Pass (COL-AZURE, COL-M365, COL-OCI, COL-AWS, COL-GOOGLE, NORMALIZE, EVIDENCE); Record 2 Pass (ROUTE, CONTINGENCY, EVIDENCE); Record 3 Pass (DIGEST, EVIDENCE). Step 5: SUMS Pass, 25 files match SHA256SUMS; CHAIN Pass, 3 records, chain unbroken. Step 6 with -Stage test: SUMS and CHAIN Pass; STEP-PRE Fail, no passing record; STEP-RUN Fail, no passing record; STEP-ROUTE and STEP-DIGEST Pass; exit code 1. The guide's Try it: the digest shows 16 open notices, 8 needing action and 5 starting in the next 30 days; the check shows the three records' chain unbroken. Validate (G7): every action-required notice shows its due date and owner; Invoke-PnEvidence.ps1 -Check -Stage test (then production): every row passes.`,
  `${WB}, Chapter 07, Lab 1, steps 2, 4, 5 and 6; ${IG}, Step 7 — "Try it," "Validate"; data/kit-captures/pn/07-2.txt, 07-4.txt, 07-5.txt, 07-6.txt.`);
}

// ================================================================== 11 G7 requirement
{
  const T = "G7: what the ISSO keeps, and an edited file";
  const s = content(SG7, T);
  tag(s, "What");
  const tb = table(s, "Req", 1.45, [5.6, 2.55, 4.0], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "What the ISSO keeps"], [
    ["SI-5 c, SA-9, RA-3 f: update the risk assessment when the environment of operation changes significantly", "KSI-SCR-MON, KSI-SCR-MIT", "digest.md, digest.csv, each week"],
    ["CA-7 continuous monitoring; AU-9 protection of audit information", "KSI-MLA-EVC, KSI-MLA-OSM", "records/, records.csv, SHA256SUMS: each record holds every file's hash and the previous record's"],
    ["SA-9 and SR-8 notification agreements: who receives each provider's notices is named and current", "KSI-SCR-MON", "The preflight's results.json (PF-05)"],
  ], { fontSize: 11.5, limit: 6.6 });
  code(s, "Edit", 0.6, tb + 0.2, FULL, cap("07-8", "all", { max: NFULL }),
    { label: "WORKBOOK CHAPTER 07, LAB 1, STEP 8: EDIT THE DIGEST AFTER IT WAS RECORDED, THEN CHECK" });
  sources(s, "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators. Guide, Step 7; workbook Ch 07, Lab 1, step 8; data/kit-captures/pn/07-8.");
  speak(s, T,
`What does gate seven support? Each week's digest supports getting advisories to the people who act, monitoring the providers, and updating the risk assessment when the environment changes significantly. The evidence chain supports continuous monitoring and the protection of audit information: each record holds the time, the environment, the change record, the command, the result, the controls, every file's hash, and the previous record's hash. And the preflight's check that each provider's notice contacts are named and current supports NIST's control for notification agreements. Here's why the chain matters. In the workbook's lab, someone appends a line to the digest after it was recorded. The next check fails twice: the file no longer matches the hash list, and it no longer matches its record. Nobody can quietly edit the evidence an assessor will read.`,
`Requirements: SI-5 c, SA-9, RA-3 (risk assessment), part f: update the assessment when the environment of operation changes significantly — KSI-SCR-MON, KSI-SCR-MIT; digest.md, digest.csv, each week. CA-7 (continuous monitoring), AU-9 (protection of audit information) — KSI-MLA-EVC, KSI-MLA-OSM; records/, records.csv, SHA256SUMS: time, environment, change record, command, result, controls, KSIs, every file's hash and the previous record's hash. SA-9 and SR-8 (notification agreements): who receives each provider's notices is named and current — KSI-SCR-MON; the preflight's results.json (PF-05). Chapter 07, Lab 1, step 8: Add-Content -Path out/evidence/runs/0003-digest/digest.md -Value 'edited after it was recorded'; then Invoke-PnEvidence.ps1 -Check: SUMS Fail, runs/0003-digest/digest.md changed; CHAIN Fail, runs/0003-digest/digest.md doesn't match 0003-digest.json; exit code 1. Rollback (G7): deploy/Invoke-PnRollback.ps1 plans, in reverse order, unregistering the scheduled task and deleting the Service Health policy assignment, and runs only with -Apply and the approved hash; the state, runs and evidence are kept.`,
  `${IG}, Step 7 — "Federal requirements and evidence," "Rollback"; ${WB}, Chapter 07, Lab 1, step 8; data/kit-captures/pn/07-8.txt.`);
}
endModule(SG7);

// ================================================================== 12 Control states and change safety
{
  const T = "Control states and change safety";
  const s = content(SR, T);
  tag(s, "What");
  const tb = table(s, "States", 1.45, [1.6, 10.55], ["State", "In provider notices (a detective, operating loop: it informs and opens tasks, and blocks nothing)"], [
    ["Designed", "Owners, routing decisions and notice contacts; the reviewed routing file"],
    ["Configured", "A reader per provider holding only its read role; G1's alert policy planned"],
    ["Enforced", "Not applicable for the notices; the one setting applied at scope is G1's alert policy"],
    ["Evidenced", "Each gate's Validate; G7's Invoke-PnEvidence.ps1 -Check -Stage"],
    ["Operated", "The weekly run, the digest, tasks closed only on the re-read; the ISSO as gate owner"],
  ], { fontSize: 11.5, limit: 4.5 });
  table(s, "Rings", tb + 0.2, [1.0, 5.4, 5.75], ["Ring", "Scope (design guidance)", "Exit criteria"], [
    ["0", "The test stage: test settings, test subscriptions, a test ServiceNow endpoint if built", "Invoke-PnEvidence.ps1 -Check -Stage test passes"],
    ["1", "Production, collection and dry-run routing only", "One week's digest read; the dry run's tasks match what the owners expected"],
    ["2", "Production, G1's alert policy applied and G6's -Send on", "Invoke-PnEvidence.ps1 -Check -Stage production passes"],
  ], { fontSize: 11.5, limit: 6.6 });
  sources(s, "Sources: Provider Notices guide, \"Control states, change safety and assessment mapping\"; Orientation & Program, App. D (control states and evidence).");
  speak(s, T,
`Before the dangers, how the guide states itself against the workbook's control-state conventions. Provider notices are a detective, operating loop. They inform owners and open tasks, and they block nothing. So the design is the owners, the routing and the notice contacts. The configuration is a reader per provider holding only its read role. Enforcement doesn't apply, except G1's alert policy at scope. The evidence is each gate's validate step and the stage check. And operation is the weekly run, with tasks closed only on the re-read. Change safety, which is design guidance, runs in three rings. Ring zero is the test stage, which exits when its evidence check passes. Ring one is production with collection and dry-run routing only, until the owners have read a week's digest. Ring two applies the alert policy and turns on sending.`,
`Control states (Book 00, Appendix D): Designed: Prerequisites (owners, routing decisions, notice contacts); G6 step 1 (the routing file); evidence: the reviewed routing file and the named owner of each provider's notices. Configured: G1 to G5, a reader per provider holding only its read role; G1's alert policy planned; evidence: role assignments and policy statements, each run's manifest.json, the alert plan. Enforced: not applicable for the notices; the loop blocks nothing; the one setting applied at scope is G1's Service Health alert policy, remediated at the management group; evidence: the assignment compliant after remediation, and results.json. Evidenced: each gate's Validate; G7's Invoke-PnEvidence.ps1 -Check -Stage; evidence: the check output, and the evidence records and SHA256SUMS it verified. Operated: G7, the weekly run, the digest, tasks closed only on the re-read; evidence: the schedule, each week's digest, the evidence chain with no gap, the ISSO as gate owner. A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides. Change safety (design guidance): only G1's policy assignment and G6's sending change anything outside the kit's own folders. Emergency access: not applicable. Change window: the change record that approves each plan's SHA-256, with the cloud platform lead on hand for G1 and the service desk for G6. Backout triggers: remediation that fails or reaches subscriptions outside scope; duplicate tasks on a re-run; tasks sent to the wrong assignment group (program decision WD-150). Post-change validation: G1's and G6's Validate steps, after each ring. The guide addresses no Zero Trust Assessment test family.`,
  `${IG}, "Control states, change safety and assessment mapping"; Book 00, Appendix D.`);
}

// ================================================================== 13 Dangers
{
  const T = "Dangers, and how to avoid them";
  const s = content(SR, T);
  tag(s, "How");
  table(s, "Dangers", 1.45, [3.4, 4.1, 4.65], ["Danger", "What goes wrong", "Mitigation"], [
    ["A notice acted on from email alone", "Look-alike provider mail; a technician follows a link", "Act only on the notice the kit read from the provider's API, linked in the task"],
    ["Security advisories read without the elevated role", "The advisory, but not its summary or impacted resources", "Service Health Security Reader; an empty summary is the sign"],
    ["A reader in the wrong cloud", "A GCC High tenant read from graph.microsoft.com returns nothing; the gate passes", "Settings name each cloud; the kit refuses another cloud, tenant, partition or realm"],
    ["A task closed because the provider closed the notice", "A retirement closes while the resource runs the retired SKU", "A close payload asks for the re-read (C4) (design guidance)"],
    ["Google maintenance assumed covered", "Personalized Service Health has no planned maintenance", "Record the gap with the ISSO"],
    ["AWS without a support plan", "SubscriptionRequiredException; nothing is read", "The preflight's first call fails (PF-04-aws); use the dashboard"],
    ["Policy-created alert rules edited by hand", "Remediation may overwrite the edit", "Change the assignment's parameters; remediate again"],
    ["The agency's routing in a public repository", "Owners, groups and which clouds matter, published", "Routing, settings, notices and digests stay inside; templates only"],
    ["The weekly run stops silently", "No digest, no evidence, no tasks", "The chain shows the gap; the go/no-go fails without a RUN record"],
  ], { fontSize: 10.5, limit: 6.6 });
  sources(s, "Sources: Microsoft Learn, security advisories access; Service Health alerts with Azure Policy; AWS CLI health; Google Cloud, Event resource. Guide, \"Dangers.\"");
  speak(s, T,
`Nine dangers, each with its guard. Never act on a notice from email alone: attackers send look-alike provider mail, so act only on the notice the kit read from the provider's own API. Read security advisories without the elevated role and you miss their details. Read from the wrong cloud and you get nothing, and the gate passes on an empty list, so every cloud is named and the kit refuses any other. Don't close a task because the provider closed the notice: a retirement can close while the resource still runs the retired product, so the close asks for the re-read. Don't assume Google maintenance is covered; it isn't. AWS without a support plan reads nothing, and the preflight catches it. Hand-edited alert rules can be overwritten. The agency's routing never goes in a public repository. And if the weekly run stops silently, the evidence chain shows the gap.`,
`A notice acted on from email alone: attackers send look-alike provider mail; a technician follows a link (Book 15, Chapter 03); act only on the notice the kit read from the provider's API, linked in the task. Security advisories read without the elevated role: Reader sees the advisory but not its summary, description or impacted resources; grant Service Health Security Reader (G1); an empty summary in a security notice is the sign. A reader in the wrong cloud: a GCC High tenant read from graph.microsoft.com returns nothing, and the gate passes on an empty list; the settings name each cloud; the kit refuses a session in another cloud, tenant, partition or realm. A task closed because the provider closed the notice: the provider's fix isn't the agency's: a retirement can close while the resource still runs the retired SKU; a close payload asks for the re-read (C4); the task closes on the agency's own check (design guidance). Google maintenance assumed covered: Personalized Service Health has no planned maintenance; record the gap with the ISSO; Google's maintenance reaches the project by other channels. AWS without a support plan: SubscriptionRequiredException; nothing is read; the preflight's first call fails (PF-04-aws); use the dashboard until the plan is in place. Policy-created alert rules edited by hand: remediation may overwrite the edit; change the assignment's parameters and remediate again. The agency's routing in a public repository: owners, assignment groups and which clouds matter, published; routing, settings, notices and digests stay inside the boundary; the kit ships templates only. The weekly run stops silently: no digest, no evidence, no tasks; the evidence chain shows the gap; the go/no-go fails without a passing RUN record.`,
  `${IG}, "Dangers and how to avoid them."`);
}

// ================================================================== 14 Evidence
{
  const T = "Evidence by gate: one file for the assessor";
  const s = content(SR, T);
  tag(s, "How");
  const tb = table(s, "Evidence", 1.45, [1.25, 4.5, 2.95, 3.45], ["Gate", "Evidence", "Key requirements", "KSIs"], [
    ["G1", "raw/azure.json, notices, manifest; the alert plan and results", "SA-9, SI-5, CA-7", "SCR-MIT, SCR-MON, MLA-EVC"],
    ["G2", "raw/m365.json, notices, manifest", "SA-9, SI-5, CM-3", "SCR-MIT, SCR-MON, CMT-LMC"],
    ["G3", "raw/oci.json, notices, manifest", "SA-9, SI-5, CP-2", "SCR-MIT, SCR-MON, RPL-ARP"],
    ["G4, G5", "raw/aws.json, raw/google.json, notices, manifest", "SA-9, SI-5", "SCR-MIT, SCR-MON"],
    ["G6", "Task payloads, routing.csv, state", "SI-5, CM-3, CM-4, CP-2", "SCR-MON, CMT-LMC, CMT-RVP, RPL-ARP"],
    ["G7", "Digests, preflight results, evidence records, records.csv, SHA256SUMS", "SI-5, SA-9, RA-3, CA-7, AU-9, SR-8", "SCR-MON, SCR-MIT, MLA-EVC, MLA-OSM"],
  ], { fontSize: 11, limit: 5.3 });
  line(s, "Who", "The kit's records support these controls; the agency's assessor decides them. File every run with its date, environment and kit version.", tb + 0.15, 0.55, 13);
  callout(s, "Check", tb + 0.8, 0.9, "FaClipboardCheck", HEX.teal, "The checklist: ",
    "configuration, operational, test, exception (providers not enabled, Google's maintenance gap, interim paths) and the evidence chain for the period.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators. Provider Notices guide, \"Evidence.\"");
  speak(s, T,
`Each gate's table names what the security officer keeps, and together they make one file. The collection gates keep each provider's raw response, the notices and a manifest, with Azure's alert plan. Routing keeps the task payloads, the routing output and the state. And the digest gate keeps the weekly digests, the preflight results and the evidence chain with its hash list. The controls run from monitoring external providers and receiving their advisories, through change control, impact analysis and contingency planning, to risk assessment, continuous monitoring, protection of audit information and notification agreements. The kit's records support those controls; the agency's assessor decides them. The guide's evidence checklist has five parts: the configuration, the weekly operational files, each test result, the exceptions, including providers not enabled and Google's maintenance gap, and the evidence chain for the period.`,
`Evidence by gate, KSIs in full: G1 KSI-SCR-MIT, KSI-SCR-MON, KSI-MLA-EVC; G2 KSI-SCR-MIT, KSI-SCR-MON, KSI-CMT-LMC; G3 KSI-SCR-MIT, KSI-SCR-MON, KSI-RPL-ARP; G4 and G5 KSI-SCR-MIT, KSI-SCR-MON; G6 KSI-SCR-MON, KSI-CMT-LMC, KSI-CMT-RVP, KSI-RPL-ARP; G7 KSI-SCR-MON, KSI-SCR-MIT, KSI-MLA-EVC, KSI-MLA-OSM. SI-5, SA-9, CP-2 and CA-7 are in the NIST Low, Moderate and High baselines and FedRAMP Classes B, C and D, and CM-3 in Moderate and High and Classes C and D (Book 13, Appendix A; Book 12, Appendix A; Book 14, Chapter 06). Evidence checklist: Configuration: the settings file per environment, the routing file, the readers' role assignments and policy statements, and G1's alert plan, kept inside the boundary. Operational: each week's raw/ files, notices.json, task payloads, state.json and digest, kept with the evidence records. Test: each gate's Validate result and the stage's Invoke-PnEvidence.ps1 -Check output, with date and operator. Exception: providers not enabled, the Google Cloud planned-maintenance gap, and any gate passed on its interim path, each with the ISSO's acceptance. Assessor-ready artifact: the evidence chain (records/, records.csv, SHA256SUMS) for the period, traceable to the four above.`,
  `${IG}, "Evidence" and its checklist.`);
}

// ================================================================== 15 Rollback and unverified
{
  const T = "Rollback by gate, and what couldn't be verified";
  const s = content(SR, T);
  tag(s, "How");
  table(s, "Rollback", 1.45, [1.75, 3.9], ["Gate", "Rollback"], [
    ["G1 Azure", "Plan and apply the assignment's deletion; the change record decides on what remediation created"],
    ["G2–G5", "None: read-only. When retired: revoke consent, remove the OCI statement, detach the AWS policy, remove the Google binding"],
    ["G6 Routing", "Revert the routing file; keep the state"],
    ["G7 Digest and evidence", "Unregister the schedule; keep runs and evidence"],
  ], { fontSize: 11.5, x: 0.6, limit: 6.6 });
  panel(s, "Unverified", 6.5, 1.45, 6.25, null, HEX.amber, HEX.amberTint, "NOT YET SPECIFIED (THE GUIDE'S LIST, IN SHORT)", null, [
    "Azure Resource Graph's column schema and LastUpdateTime's format; redaction of security fields for a Reader; the table in Azure Government",
    "The az graph query output keys; the policy's alert resource type and parameter names",
    "Microsoft 365 message center tags; which admin roles Graph accepts for a delegated read",
    "OCI CLI output keys, and realm OC3; the gcloud flags for organization events",
    "The ServiceNow side and the scheduler are the agency's to build",
    "Tenant behavior: nothing was run in a tenant, account, tenancy or project",
  ], 11.5);
  sources(s, "Sources: Provider Notices guide, \"Rollback,\" \"What couldn't be verified.\"");
  speak(s, T,
`Rollback is short, because almost everything only reads. For Azure, plan and apply the deletion of the policy assignment, and let the change record decide on what its remediation created. Gates two to five have nothing to roll back; when the kit is retired, remove each reader's permission. Routing reverts to the last reviewed file and keeps its state. And the digest gate unregisters the schedule and keeps every run and its evidence. The guide is also candid about what it couldn't verify. Several Azure details aren't stated on Learn, including Resource Graph's full column schema and the alert policy's parameter names. Learn doesn't enumerate the message center tags. Oracle's CLI output keys and its third realm, and the gcloud flags for organization events, weren't confirmed. The ServiceNow side and the scheduler are the agency's to build. And nothing in the guide was run in a tenant.`,
`Rollback by gate: G1 Azure: none for the collection; plan and apply the policy assignment's deletion; the change record decides on the resources remediation created. G2 Microsoft 365: none, read-only; revoke consent when retired. G3 OCI: none, read-only; remove the policy statement when retired. G4 AWS: none, read-only; detach the read policy when retired. G5 Google Cloud: none, read-only; remove the role binding when retired. G6 Routing: revert the routing file; keep the state. G7 Digest and evidence: unregister the schedule; keep runs and evidence. What couldn't be verified: Azure Resource Graph's column schema and time format (the kit projects the columns Learn's samples use; LastUpdateTime's raw format is not yet specified; the kit accepts an ISO time, epoch seconds or milliseconds, or ticks); whether Resource Graph redacts security advisories' sensitive fields for a Reader, as the REST list does; Resource Graph's Service Health table in Azure Government; the az graph query output keys (the kit reads data and skip_token); the alert resource type the Service Health policy creates and its parameter names (read them with az policy definition show); Microsoft 365 message center tags (the kit treats a post tagged Retirement as a retirement); which admin roles Graph accepts for a delegated read; OCI CLI output keys (the kit accepts both) and realm OC3 (the kit refuses it); the gcloud flags for organization events (the kit runs the call only with -AllowUnverified); the ServiceNow side; the scheduler (rollback's step to unregister a Windows scheduled task assumes the agency used one); tenant behavior: nothing in the guide was run in a tenant, account, tenancy or project; the checks are fixture-tested, and every live command is unrun by the authors.`,
  `${IG}, "Rollback"; "What couldn't be verified."`);
}
endModule(SR);

// ================================================================== 16 Close
{
  const T = "Done when: the guide's checklist";
  const s = content(SC, T);
  tag(s, "How");
  const p = panel(s, "Checklist", 0.6, 1.45, FULL, null, HEX.navy, HEX.navyTint, "THE GUIDE'S CHECKLIST", null, [
    "G1: every subscription read by a Reader, security advisories by Service Health Security Reader; the alert policy assigned and remediated",
    "G2: message center and service health read on the tenant's own Graph host · G3: every OCI tenancy, latest in each chain, with affected resources",
    "G4: every AWS account with a qualifying support plan, from its partition's Health endpoint · G5: Google incidents read, the maintenance gap recorded",
    "G6: the routing reviewed; every notice that needs action has a task; re-runs de-duplicate; tasks close on the re-read",
    "G7: the weekly run scheduled; the digest reaches the owners; each stage's evidence passes the go/no-go",
  ], 12.5);
  callout(s, "Next", p + 0.25, 1.2, "FaRoute", HEX.teal, "To build it: ",
    "Building Provider Notices, Chapters 01 to 08, with fixture labs and the runbook, and the training path. The guide is a draft: recheck it after the owner's review.");
  sources(s, "Sources: Provider Notices guide, \"Checklist\"; developer workbook, Building Provider Notices, index; Learning path: Provider Notices.");
  speak(s, T,
`Here's what done looks like, gate by gate. Every Azure subscription read by a Reader, security advisories by the elevated role, and the alert policy assigned and remediated. Microsoft 365 read on the tenant's own Graph host. Every Oracle tenancy read, latest in each chain, with affected resources. Every AWS account with a qualifying support plan, read from its partition's endpoint. Google's incidents read, and the maintenance gap recorded. The routing reviewed, every notice that needs action with a task, no duplicates on a re-run, and tasks closed only on the re-read. And the weekly run scheduled, the digest reaching the owners, and each stage's evidence passing the go or no-go. To build it, use the developer workbook, Building Provider Notices, and its training path. And one last time: this guide is a draft, awaiting the owner's review, so check it again after that review. Thank you.`,
`Checklist: Every subscription in scope read by a Reader, security advisories by Service Health Security Reader; the Service Health alert policy assigned and remediated (G1). Message center and service health read on the tenant's own Graph host (G2). Every OCI tenancy's announcements read, latest in each chain, with affected resources (G3). Every AWS account with a qualifying support plan read from its partition's Health endpoint (G4). Google Cloud incidents read, and the planned-maintenance gap recorded with the ISSO (G5). The routing reviewed; every notice that needs action has a task; re-runs de-duplicate; tasks close on the re-read (G6). The weekly run scheduled; the digest reaches the owners; each stage's evidence passes the go/no-go (G7). To build it: the developer workbook Building Provider Notices (eight chapters: one per provider, routing, the digest and evidence, and the runbook for test and production) and the nine-module training path. Status: the guide is a draft awaiting the owner's review.`,
  `${IG}, "Checklist"; ${WB}, index; Learning path: Provider Notices.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: G5 and G6", [
  "Provider Notices: An Implementation Guide (draft): \"How to read this guide,\" \"The track at a glance,\" Steps 5 and 6.",
  "Google Cloud (read November 9, 2026): Personalized Service Health REST reference, projects.locations.events.list and the Event resource; List events; gcloud service-health events list; Personalized Service Health roles and permissions; Assured Workloads, Supported products.",
  "Governance, Drift & Evidence, Chapter 10 and Appendix B (Ticket-to-Machine); the kit's templates/ and copilot-prompts.md.",
  "NIST SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0; FedRAMP, Key Security Indicators (FedRAMP Consolidated Rules for 2026).",
  "Developer workbook, Building Provider Notices: Chapters 05 and 06 (Lab 1). Captures: data/kit-captures/pn/05-1, 05-2, 05-3, 06-3, 06-4, 06-5, 06-6, 06-7 (fictional fixtures).",
]);
sourceSlide("Sources: G7 and running it safely", [
  "Provider Notices: An Implementation Guide (draft): Step 7; \"Control states, change safety and assessment mapping\"; \"Dangers and how to avoid them\"; \"Evidence\"; \"Rollback\"; \"Checklist\"; \"What couldn't be verified.\"",
  "Microsoft Learn (read November 9, 2026): security advisories access; Service Health alerts at scale using Azure Policy. AWS CLI reference, health. Google Cloud, Event resource.",
  "Orientation & Program, Appendix D (control states and evidence); Compliance Automation & Day-2 Operations, Chapter 03 (look-alike provider mail).",
  "Developer workbook, Building Provider Notices: Chapters 07 and 08. Captures: data/kit-captures/pn/07-2, 07-4, 07-5, 07-6, 07-8 (fictional fixtures). Part 1: Provider Notices — implementation, Part 1.",
]);

fs.writeFileSync(path.join(__dirname, "narration.json"), JSON.stringify(SAY, null, 2) + "\n");
const total = SAY.reduce((a, e) => a + e.say.split(" ").length, 0);
console.log(`narration.json: ${SAY.length} slides, ${total} spoken words, about ${(total / 150).toFixed(1)} min`);
finish(OUT);
