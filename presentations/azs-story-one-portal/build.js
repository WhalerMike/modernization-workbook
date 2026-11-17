// Building Azure Security — the story deck: one application's estate, followed end to end.
// Teaches the whole developer workbook (docs/project-plans/developer-workbooks/azure-security/) through one case:
// Contoso's portal in the kit's own fixtures (examples/azure-security/tests/fixtures/week1 and week2): the subscription
// sub-online-portal and the connectivity hub that serves it. Nine scenes, one per chapter: the baseline read back
// (Ch 01), the exposure register (Ch 02), DDoS (Ch 03), the WAF (Ch 04), the origin (Ch 05), egress (Ch 06), the vault
// (Ch 07), policy, drift and evidence (Ch 08), and the runbook (Ch 09). Each scene has a story slide, a "Try it" slide with
// the chapter's Lab 1 command and its real output, read at build time from data/kit-captures/azs/NN-k.txt (Ch 09 has no
// Lab 1: its slide shows the page's own fixture-mode output), and a one-question check whose answer opens the next
// slide's narration and sits in the check slide's notes. The chapters are drafts awaiting the owner's review.
// Facts come only from the workbook's chapters, their footnotes and the captures. No new external facts.
// Shared helpers: ../attribute-driven-migration-technical-part-1/slides.js, plus the code-panel helper of the PN story deck.
// The build also writes narration.json (one {slide, title, say} per narrated slide) for narrate.py.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/azs-story-one-portal/build.js //                      presentations/azs-story-one-portal/AZS_Story_One_Portal.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Building Azure Security — One Portal, End to End",
  footer: "Federal Modernization Workbook  ·  Building Azure Security  ·  One portal, end to end",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || path.join(__dirname, "AZS_Story_One_Portal.pptx");
const WB = "Building Azure Security";
const GUIDE = "Azure Security Engineering";
const CHECKS = 9;
const BANNED = /\bUIAO\b|\bSSA\b|Social Security|Mainframe PIN|\bDISA\b|\bSTIGs?\b|\bsatisf(y|ies)\b|\bmeets\b|GCC[ -]?High|\bGCCH\b|\bDoD\b|Azure Government|AzureUSGovernment|\busgov/i;

// ------------------------------------------------------------------ captures
// cap("01-5", [0, 1, 5]) returns those lines (0-based) of data/kit-captures/pn/01-5.txt, each cut to max characters
// with "…" (the slide's label says lines are cut). A prompt line longer than max is continued PowerShell-style.
const CAP = path.join(__dirname, "..", "..", "data", "kit-captures", "azs");
const MAX = 146; // characters that fit a full-width panel at 10.5 pt
const cap = (id, idx, max = MAX) => {
  const all = fs.readFileSync(path.join(CAP, `${id}.txt`), "utf8").replace(/\r/g, "").split("\n");
  const out = [];
  for (const k of idx) {
    const line = all[k];
    if (line === undefined) throw new Error(`capture ${id} has no line ${k}`);
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
    } else out.push(line.slice(0, max - 1).trimEnd() + "…");
  }
  return out;
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

// ------------------------------------------------------------------ code panel (as in the ADM deeper dive)
const CODE_FILL = "F1F5F9";
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 10.5;
  const lh = pt / 72 * 1.2;
  const top = y + 0.1 + (o.label ? 0.27 : 0);
  const h = (top - y) + lines.length * lh + 0.14;
  box(s, name, x, y, w, h, CODE_FILL, HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
  const widest = Math.max(...lines.map((l) => l.length));
  const need = widest * 0.55 * pt / 72 + 0.4;
  if (need > w + 0.01) throw new Error(`${name}: code too wide: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
  const runs = lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1,
    color: /^\s*#/.test(l) ? HEX.teal : HEX.ink, bold: /^PS> |^>>  /.test(l) } }));
  txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
  const bottom = y + h;
  if (bottom > (o.limit || 6.6) + 0.01) throw new Error(`${name}: code overflows: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars`);
  return bottom;
};

// A one-line plain statement (navy, bold), with a fit check.
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};

// ------------------------------------------------------------------ narration and notes
const narration = [];
let slideNo = 0;
const speak = (s, title, say, more, ref) => {
  slideNo += 1;
  const spoken = say.trim().replace(/\s+/g, " ");
  const n = spoken.split(" ").length;
  if (n > 170) throw new Error(`narration over 170 words (${n}) on "${title}"`);
  [spoken, more].forEach((t) => { if (BANNED.test(t)) throw new Error(`neutrality: "${title}"`); });
  if (/\bBooks? \d\d\b/.test(spoken)) throw new Error(`narration names a book by number on "${title}"`);
  narration.push({ slide: slideNo, title, say: spoken });
  notes(s, `${spoken}\n\nDetail: ${more.trim()}`, ref);
};
const slide = (sec, part, title) => { const s = content(sec, title); tag(s, part); return s; };
const src = (s, t) => { if (BANNED.test(t)) throw new Error("neutrality: sources"); sources(s, t); };

// A scene's story slide: the beat (left), what the chapter's kit does about it (right), the requirement (bottom).
const scene = (s, beat, kit, kitLabel, whyLabel, whyText, o = {}) => {
  const lw = o.lw || 6.0;
  const pb = panel(s, "Beat", 0.6, 1.45, lw, null, HEX.amber, HEX.amberTint, "THE STORY BEAT", null, beat, o.pt || 13);
  const pk = panel(s, "Kit", 0.6 + lw + 0.25, 1.45, 12.15 - lw - 0.25, null, HEX.navy, HEX.navyTint, kitLabel, null, kit, o.pt || 13);
  const y = Math.max(pb, pk) + 0.22;
  callout(s, "Why", y, o.whyH || 1.0, o.icon || "FaFileShield", HEX.navy, whyLabel, whyText);
};

// A "Try it" slide: one code panel of real capture lines, and a "Read it" callout.
const tryIt = (sec, title, label, lines, read, sourcesLine, say, more, ref, o = {}) => {
  const s = slide(sec, "How", title);
  const cb = code(s, "Run", 0.6, 1.45, 12.15, lines, { label, pt: o.pt || 10.5 });
  callout(s, "Read", cb + 0.2, o.readH || 0.9, o.icon || "FaListCheck", HEX.teal, "Read it: ", read);
  src(s, sourcesLine);
  speak(s, title, say, more, ref);
};

// A check slide: one question, four options; the answer opens the next slide and is in these notes.
const check = (sec, n, title, question, options, say, more, ref) => {
  const s = slide(sec, "How", title);
  txt(s, "Question", question, { x: 0.6, y: 1.5, w: 12.15, h: 1.15, fontSize: 21, bold: true, color: HEX.navy, fontFace: "Cambria", valign: "middle" });
  const w = (12.15 - 0.3) / 2, h = 1.2;
  options.forEach((t, k) => {
    const x = 0.6 + (k % 2) * (w + 0.3), y = 2.95 + Math.floor(k / 2) * (h + 0.25);
    box(s, `Option ${k + 1}`, x, y, w, h, "FFFFFF", HEX.teal);
    txt(s, `Option ${k + 1} text`, [{ text: `${"ABCD"[k]}   `, options: { bold: true, color: HEX.teal, fontSize: 20 } }, { text: t, options: { color: HEX.ink } }],
      { x: x + 0.25, y: y + 0.08, w: w - 0.45, h: h - 0.16, fontSize: 15.5, valign: "middle" });
  });
  line(s, "Answer note", `Check ${n} of ${CHECKS}: the answer opens the next slide, and it's in this slide's notes.`, 5.95, 0.4, 13);
  speak(s, title, say, more, ref);
  return s;
};


// ================================================================== Title
const S0 = "Opening";
{
  const s = titleSlide(S0, "One Portal, End to End", "Building Azure Security — the whole workbook through one application's estate");
  txt(s, "Session map", [
    { text: "Contoso's portal: sub-online-portal, its Front Door, its gateway, its spoke and its vault, and the hub that serves it", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Baseline · exposure · DDoS · WAF · origin · egress · vault · policy and drift · deploy", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Every value shown is from the kit's fictional fixtures; every output is a real Lab 1 capture", options: { color: HEX.ink, breakLine: true } },
    { text: "Draft chapters awaiting the owner's review  ·  illustrative code, tested against fixtures", options: { color: HEX.red, bold: true } },
  ], { x: 0.8, y: 4.75, w: 10.6, h: 1.6, fontSize: 15, paraSpaceAfter: 2 });
  speak(s, "One Portal, End to End",
    `Welcome to the story deck for Building Azure Security, a developer workbook in the Federal Modernization Workbook. Instead of nine chapters one at a time, we'll follow one application all the way through: Contoso's public portal, its subscription, its Front Door and gateway, its network, its key vault, and the hub that serves it. It's fictional: every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. Two notes before we begin. The chapters are drafts awaiting the owner's review. And the code is illustrative, tested against fixtures, not against a live subscription.`,
    `The deck teaches the whole developer workbook through one case: the portal in the kit's fixture estate (examples/azure-security/tests/fixtures/week1 and week2, settings.lab.json, AzureCloud). The portal lives in the subscription sub-online-portal (vnet-portal with snet-web, snet-jump and snet-pe, the vault kv-portal, the App Service origins app-portal-east and app-portal-west) and is served by the connectivity hub (vnet-hub, the Front Door profile afd-portal, the application gateway appgw-portal with its WAF policy wafp-portal, and Azure Firewall afw-hub). Chapters 01 to 08 each have a Lab 1 whose output is captured by scripts/kit_captures.py; Chapter 09 is a runbook with no Lab 1, and its scene quotes the chapter's own fixture-mode output, produced November 17, 2026. Every chapter is status draft, review pending.`,
    `${WB}, index (status, "Chapters"); ${GUIDE}, "In this guide."`);
}

// ================================================================== The route
{
  const s = slide(S0, "What", "The portal's path through the nine chapters");
  const tb = table(s, "Path", 1.45, [0.6, 5.0, 1.6, 4.95], ["#", "Scene", "Guide step", "Try it (Lab 1)"], [
    ["1", "Read the baseline back: logs and Defender plans", "1", "Ch 01: the baseline findings"],
    ["2", "Every public face of the portal, with an owner", "2", "Ch 02: the register, then week 2"],
    ["3", "Which public IPs are really protected", "3", "Ch 03: each IP's status"],
    ["4", "A WAF that logs but doesn't block", "4", "Ch 04: policies and the plan"],
    ["5", "An origin nothing can reach around the edge", "5", "Ch 05: each origin's lock-down"],
    ["6", "Egress that skips the firewall", "6", "Ch 06: default routes, the draft"],
    ["7", "A vault missing every part of its posture", "7, 8", "Ch 07: the vaults"],
    ["8", "An exemption due soon; a week of drift; the evidence", "9, 10", "Ch 08: drift and records"],
    ["9", "The kit goes live, test first", "1 to 10", "Ch 09: the page's fixture run"],
  ], { fontSize: 12.5, limit: 5.7 });
  line(s, "Shape", "Each scene: the story beat, what the kit does, the requirement it supports; a Try it; a one-question check.", tb + 0.22, 0.4, 14);
  src(s, "Sources: workbook index, “Chapters”; Chapters 01–09; Azure Security Engineering, “The path on one page.”");
  speak(s, "The portal's path through the nine chapters",
    `Here's the route. Scene one reads the landing-zone baseline back. Scene two lists every public face of the portal, with its owner. Scene three asks which of its public IP addresses are really under DDoS protection. Scene four finds a web application firewall that logs but doesn't block. Scene five checks whether the portal's origins can be reached around the edge. Scene six follows its egress. Scene seven reads its key vault. Scene eight holds it all with policy, compares two weeks, and records the evidence. And scene nine takes the kit live, test first. Each scene has a story slide, a try-it slide with real output, and a one-question check.`,
    `The guide's ten steps: 1 landing-zone security baseline, 2 public exposure inventory, 3 DDoS protection, 4 web application firewall, 5 Front Door and Application Gateway, 6 firewall and segmentation, 7 Private Link and DNS, 8 managed identities and Key Vault, 9 policy and drift, 10 operations and evidence. The workbook groups them into eight chapters whose work the kit scripts and tests (Chapter 07 covers Steps 7 and 8; Chapter 08 covers Steps 9 and 10), then Chapter 09, the runbook. Steps 1 and 2 come first; the guide lets Steps 3 to 8 run in parallel by workload once the inventory exists. The target estate is Microsoft 365 GCC (Moderate) with commercial Azure.`,
    `${WB}, index ("Chapters"); ${GUIDE}, "The path on one page."`);
}
endModule(S0);

// ================================================================== Scene 1 (Chapter 01)
const S1 = "Scene 1 — The baseline";
{
  const s = slide(S1, "What", "Scene 1: the baseline, read back every week");
  scene(s, [
    "Step 1 set four things once: hierarchy settings, initiatives in audit, platform logs, Defender plans",
    "Nobody reads them back across every subscription",
    "For the portal: its subscription's Key Vault plan is Free",
    "And the hub firewall's public IP sends its logs to an application team's workspace, not the platform's",
  ], [
    "One check reads all four, scoped to the intermediate root",
    "A log counts only if it is enabled and goes to the platform workspace",
    "Every call is a read, as Reader, declared with its Learn page",
    "A run folder keeps every response, each file hashed",
  ], "WHAT THE KIT DOES (CHAPTER 01)", "Step 1 — CM-2, CM-6, CA-7: ",
  "the baseline as read, which resources log and which subscriptions have the plans. The platform owner and the ISSO keep it.");
  src(s, "Sources: Learn, Protect your resource hierarchy; Diagnostic Settings - List; Pricings - List. Ch 01, “What it leaves to you,” “The code.”");
  speak(s, "Scene 1: the baseline, read back every week",
    `Scene one. The guide's Step 1 sets four things once: the hierarchy settings, the initiatives in audit at the intermediate root, platform logs, and Defender for Cloud plans. Microsoft Learn gives the commands, and its REST reference gives the reads, but nobody runs them back every week across every subscription. So the kit does, with one check scoped to the intermediate root. For our portal, two things turn up. Its subscription's Key Vault plan is on the Free tier. And the hub firewall's public address does send logs, but to an application team's workspace, which doesn't count: a log counts only if it's enabled and goes to the platform workspace.`,
    `Chapter 01: Learn's Az PowerShell for protecting the hierarchy sets -Authorization and -DefaultManagementGroup; Hierarchy Settings - Get reads them back (API version 2020-05-01). Diagnostic Settings - List returns workspaceId and logs; Pricings - List returns each plan's pricingTier, Free or Standard. The baseline check reports AZS-BL-01 to AZS-BL-06. In the fixtures, AZS-BL-06 flags sub-online-portal: "Free or absent: KeyVaults". AZS-BL-05 flags pip-afw-hub because its diagnostic setting sends logs to law-portal-app, not the platform workspace law-contoso-platform; Test-AzsDiag counts a setting only when it sends an enabled log to the settings' workspace. Requirements: CM-2, CM-6 and CA-7 (KSI-SVC-ACM, KSI-MLA-EVC), the guide's Step 1 row.`,
    `${WB}, Chapter 01, "Start with Microsoft Learn," "The code," "Federal requirements and evidence."`);
}
tryIt(S1, "Try it: the baseline check on week one",
  "WORKBOOK CH 01, LAB 1, STEPS 2–3, IN examples/azure-security (SEVEN OF THE TEN AZS-BL-05 ROWS LEFT OUT)",
  [...cap("01-2", [0, 1, 2, 3]), ...cap("01-3", [0, 1, 2, 3, 12, 13])],
  "pip-afw-hub logs, but to the wrong workspace; the portal's subscription has KeyVaults on Free; the FedRAMP initiative is in audit, as intended.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 01, “Lab 1: fixtures, no subscription,” steps 2–3.",
  `Try it. From the kit's folder, run the baseline check on the first week's estate. It reads the hierarchy settings, four policy assignments, sixteen platform resources and four subscriptions, from six calls, every one a read. Twelve findings and one information row. Read them: creating management groups doesn't need authorization; the firewall and its public IP send nothing to the platform workspace; the online subscription, the portal's, has its Key Vault plan on Free; and the FedRAMP initiative is in audit, exactly as Step 1 intends.`,
  `Step 2: ./Invoke-AzsCheck.ps1 -Area baseline -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/week1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/week1/baseline printed: Read: hierarchy settings, 4 policy assignments, 16 platform resources, 4 subscriptions; Findings: 12 Finding, 0 Warn, 1 Info; Written to out/week1/baseline (6 calls, every one a read). Step 3: AZS-BL-01 hierarchy settings: requireAuthorizationForGroupCreation is false; ten AZS-BL-05 rows (the slide shows afw-hub and pip-afw-hub); AZS-BL-06 sub-online-portal: Free or absent: KeyVaults; AZS-BL-04 Info azs-fedramp-mod: enforcementMode DoNotEnforce (audit); Step 9 enforces. The summary: 6 of 16 platform resources log to the workspace (37.5%).`,
  `${WB}, Chapter 01, "Lab 1: fixtures, no subscription," steps 2–3.`);
check(S1, 1, "Check 1: does pip-afw-hub's log count?",
  "The hub firewall's public IP has a diagnostic setting that sends allLogs to an application team's workspace. Does the kit count it?",
  ["Yes: any enabled diagnostic setting counts", "No: only an enabled log to the platform workspace counts", "Yes, if the application team owns the IP", "Only when Defender for Cloud is on"],
  `Check one. The hub firewall's public address has a diagnostic setting that sends all its logs to an application team's workspace. Does the kit count that as logging? Any enabled setting? Only one to the platform workspace? Yes, if the application team owns the address? Or only when Defender for Cloud is on? The answer opens the next scene.`,
  `Answer: B. Chapter 01: Test-AzsDiag counts a diagnostic setting only if it sends an enabled log to the platform workspace named in the settings; "a list compared by eye misses the one resource that logs to the wrong workspace." In the fixtures pip-afw-hub's setting points at law-portal-app, so AZS-BL-05 fires for it in Chapter 01 and AZS-DD-04 in Chapter 03.`,
  `${WB}, Chapter 01, "What it leaves to you," "Lab 1," step 3.`);
endModule(S1);

// ================================================================== Scene 2 (Chapter 02)
const S2 = "Scene 2 — The register";
{
  const s = slide(S2, "What", "Scene 2: every public face of the portal, owned");
  scene(s, [
    "The portal is public in many places: a Front Door profile, a gateway's IP, a jump box's IP, a load balancer, two web apps, a vault",
    "pip-jump, the jump box's address in the portal's network, has no owner tag",
    "A week later a new address appears, pip-new-api, with no owner either",
    "And pip-orphan is gone: is a DNS record still pointing at its address?",
  ], [
    "One register: type, public name, owner, DDoS state, WAF and mode, last reviewed",
    "AZS-EX-01 for every row without an owner",
    "Last week's register in: new rows (EX-03), gone rows with the DNS reminder (EX-04)",
    "Defender for Cloud's export in: anything it sees that the queries miss (EX-05)",
  ], "WHAT THE KIT DOES (CHAPTER 02)", "Step 2 — CM-8, SC-7: ",
  "a dated inventory of every exposure with an owner. It maps the attack surface, so it stays inside the boundary.", { icon: "FaListCheck" });
  src(s, "Sources: Learn, Starter Resource Graph samples; Secure your DDoS deployment (inventory). Ch 02, “What it leaves to you,” “The code.”");
  speak(s, "Scene 2: every public face of the portal, owned",
    `The answer to check one: no. Only an enabled log to the platform workspace counts. Scene two. Steps 3 to 5 can't be proved complete without a list of what's exposed, and the portal is public in many places: a Front Door profile, the gateway's address, a jump box, a load balancer, two web apps and a vault. The kit joins the guide's Resource Graph queries, built from Microsoft Learn's starter sample, into one register, with an owner on every row. The jump box's address has no owner. A week later a new address appears, with no owner either, and an orphan address is gone, with a reminder to remove any DNS record still pointing at it.`,
    `Chapter 02: the guide builds four queries from Learn's starter sample "List all public IP addresses" and the ddosSettings property; Learn recommends an inventory of every public IP and its protection status, kept with Resource Graph, and a quarterly review. The register has one row per exposure: resourceId, type, name, subscriptionId, publicName, owner, ddos, waf, wafMode, originLockdown and lastReviewed, as register.json and register.csv. AZS-EX-01 no owner tag; AZS-EX-02 a public IP attached to nothing; AZS-EX-03 new since the previous register; AZS-EX-04 gone, check for a dangling DNS record; AZS-EX-05 Defender for Cloud reports an internet-exposed resource the register lacks. The portal's rows in the fixtures: pip-appgw-portal (wafp-portal), pip-jump (no owner), pip-lb-portal, pip-test-app, afd-portal (afdwafportal), appgw-portal, kv-portal, app-portal-east and app-portal-west. Requirements: CM-8 and SC-7 (KSI-CNA-MAT). The register is a map of the attack surface: keep it inside the boundary.`,
    `${WB}, Chapter 02, "Start with Microsoft Learn," "The code," "Federal requirements and evidence," "Dangers."`);
}
tryIt(S2, "Try it: the register, then a week later",
  "WORKBOOK CH 02, LAB 1, STEPS 1, 2 AND 5 (THE PORTAL'S ROWS; OTHER ROWS LEFT OUT)",
  [...cap("02-1", [1, 2]), ...cap("02-2", [0, 2, 5, 6, 8, 9, 12, 17, 18, 19]), ...cap("02-5", [0, 1, 2])],
  "pip-jump has no owner; pip-appgw-portal carries its gateway's WAF; in week 2 pip-new-api is new and pip-orphan is gone.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 02, “Lab 1: fixtures, no subscription,” steps 1, 2 and 5.",
  `Try it. Build the first week's register: nineteen exposures, sixteen with an owner. Read the portal's rows. The gateway's public address carries the gateway's web application firewall policy, wafp-portal. The Front Door profile carries its own. The jump box's address has no owner. Then build the register again a week later, against the first one. The new address, pip-new-api, is reported as new, and the orphan as gone, with the reminder to remove any DNS record that still points at its old address.`,
  `Step 1: Register: 19 exposures (8 public IPs, 3 Front Door, 2 application gateways, 6 PaaS); 16 with an owner; Findings: 3 Finding, 2 Warn, 0 Info. Step 2 (the slide shows the portal's rows): pip-appgw-portal portal-team wafp-portal; pip-jump (none); pip-lb-portal portal-team; pip-test-app portal-team; afd-portal portal-team afdwafportal; appgw-portal portal-team wafp-portal; kv-portal portal-team; app-portal-east and app-portal-west portal-team. Step 5 (week 2 against week 1): AZS-EX-04 Warn pip-orphan: was PublicIP 198.51.100.30; remove any DNS record that still points at it; AZS-EX-03 Info pip-new-api: new PublicIP 198.51.100.50. Step 3 also showed AZS-EX-05 for ci-batch-export, a container group Defender for Cloud's export lists that no query finds.`,
  `${WB}, Chapter 02, "Lab 1: fixtures, no subscription," steps 1, 2 and 5.`);
check(S2, 2, "Check 2: where does the register live?",
  "The register lists every public IP, Front Door profile and gateway with its owner. Where should it be kept?",
  ["In the workbook's public repository, so assessors can find it", "Inside the agency's boundary, never in a public repository", "Only in the portal's own subscription", "Nowhere: it's regenerated each week"],
  `Check two. The register lists every public address, Front Door profile and gateway, with its owner. Where should it be kept? In a public repository, so assessors can find it? Inside the agency's boundary? Only in the portal's own subscription? Or nowhere, since it's regenerated each week?`,
  `Answer: B. Chapter 02: the register is a map of the attack surface; keep it inside the boundary, never in a public repository. The check prints that line on every run, and the runbook's preflight (PF-03) fails an output folder inside the kit's own repository. The dated register is also the assessor-ready artifact for Step 2, so it is kept, not discarded.`,
  `${WB}, Chapter 02, "The code," "Dangers"; Chapter 09, "Preflight."`);
endModule(S2);

// ================================================================== Scene 3 (Chapter 03)
const S3 = "Scene 3 — DDoS";
{
  const s = slide(S3, "What", "Scene 3: which of the portal's IPs are protected");
  scene(s, [
    "pip-jump says VirtualNetworkInherited, which sounds protected",
    "But it inherits from vnet-portal, which has no DDoS protection plan",
    "The gateway's address, pip-appgw-portal, inherits from vnet-hub, linked to the plan",
    "And it's the one address with both DDoS logs to the workspace and an enabled alert",
  ], [
    "Each address followed to its owner resource, subnet, network and the network's plan",
    "Statuses: IpProtection, Inherited, Unprotected, Unknown, NatGateway, Unattached",
    "On each protected address: DDoS logs (AZS-DD-04) and an IfUnderDDoSAttack alert (AZS-DD-05)",
    "Coverage: protected over in scope, NAT gateway addresses left out",
  ], "WHAT THE KIT DOES (CHAPTER 03)", "Step 3 — SC-5, SI-4: ",
  "every public IP's protection and the network it depends on, with the logs and the alert the security monitor answers.", { icon: "FaShieldHalved" });
  src(s, "Sources: Learn, DDoS tier comparison; Zero Trust for DDoS Protection; simulation testing; IfUnderDDoSAttack. Ch 03, “The code.”");
  speak(s, "Scene 3: which of the portal's IPs are protected",
    `The answer to check two: inside the agency's boundary, never in a public repository, because it maps the attack surface. Scene three. Microsoft Learn's Zero Trust recommendations check that every public address in a virtual network is protected, with metrics and logs. The jump box's address says it inherits its protection, which sounds protected. But the kit follows it to its network, the portal's spoke, and that network has no DDoS protection plan. So it's unprotected. The gateway's address inherits from the hub, which is linked to the plan. And it's the one address with both DDoS logs to the platform workspace and an enabled alert on Under DDoS attack.`,
    `Chapter 03: every public IP gets infrastructure protection at no cost; Network Protection and IP Protection add tuning, metrics, alerts and reports; neither covers a public IP on a NAT gateway. The guide's Validate step expects ddosMode Enabled, or VirtualNetworkInherited in a linked network. The kit records each IP configuration's subnet from the resources that own public IPs; a load balancer frontend is Unknown (AZS-DD-02). In the fixtures, pip-jump is attached to nic-jump in vnet-portal/snet-jump; vnet-portal has no plan, so AZS-DD-01. pip-appgw-portal is the frontend of appgw-portal, whose gateway subnet is vnet-hub/snet-appgw; vnet-hub is linked to ddos-contoso. It has a diagnostic setting to the platform workspace and an enabled metric alert on IfUnderDDoSAttack. Learn's tutorial alerts at maximum 1 or more. Requirements: SC-5 and SI-4 (KSI-CNA-RVP, KSI-MLA-LET).`,
    `${WB}, Chapter 03, "Start with Microsoft Learn," "The code," "Federal requirements and evidence."`);
}
tryIt(S3, "Try it: each public IP's protection",
  "WORKBOOK CH 03, LAB 1, STEPS 2 AND 4 (FIVE OF THE NINE FINDINGS SHOWN)",
  [...cap("03-2", [1, 2, 3, 4, 5, 6, 7, 8, 9]), ...cap("03-4", [0, 5, 2, 6, 7])],
  "pip-jump is Unprotected in vnet-portal; pip-appgw-portal is Inherited from vnet-hub with logs and an alert; pip-test-app's alert is off.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 03, “Lab 1: fixtures, no subscription,” steps 2 and 4.",
  `Try it. Read each public address's status. The hub's three addresses inherit from the hub network. The test application's address has IP Protection on the address itself. The jump box's inherits from the portal's spoke, which has no plan, so it's unprotected. The load balancer's is unknown: its protection depends on a backend network the frontend doesn't name, and the kit says so rather than guessing. Then the findings: the jump box unprotected, the firewall's address with no logs to the workspace and no alert, and the test application's alert, which exists but is disabled.`,
  `Step 2: pip-afw-hub Inherited vnet-hub logs False alert False; pip-appgw-portal Inherited vnet-hub logs True alert True; pip-nat-egress NatGateway; pip-vpngw Inherited vnet-hub; pip-jump Unprotected vnet-portal; pip-lb-portal Unknown; pip-orphan Unattached; pip-test-app IpProtection logs True alert False. Coverage: 4 of 6 in scope (66.7%). Step 4 (the slide shows four of nine): AZS-DD-01 pip-jump: inherits from vnet-portal, which has no DDoS protection plan; AZS-DD-05 pip-afw-hub; AZS-DD-05 pip-test-app (its alert exists but is disabled); AZS-DD-02 pip-lb-portal: a load balancer frontend.`,
  `${WB}, Chapter 03, "Lab 1: fixtures, no subscription," steps 2 and 4.`);
check(S3, 3, "Check 3: is pip-jump protected?",
  "pip-jump's protectionMode is VirtualNetworkInherited. What decides whether it is protected?",
  ["Nothing: inherited always means protected", "Whether vnet-portal, its network, is linked to a DDoS plan", "Whether it has an owner tag", "Whether Front Door is in front of it"],
  `Check three. The jump box's address has the protection mode virtual network inherited. What decides whether it's actually protected? Nothing, because inherited always means protected? Whether its network is linked to a DDoS protection plan? Whether it has an owner tag? Or whether Front Door sits in front of it?`,
  `Answer: B. Chapter 03: protectionMode VirtualNetworkInherited is protected only when the subnet's virtual network has enableDdosProtection and a plan; otherwise it is Unprotected (AZS-DD-01). Danger: trusting VirtualNetworkInherited, when the network behind it has no plan. Guard: the kit follows the address to its network and the network's plan.`,
  `${WB}, Chapter 03, "The code," "Dangers."`);
endModule(S3);

// ================================================================== Scene 4 (Chapter 04)
const S4 = "Scene 4 — WAF";
{
  const s = slide(S4, "What", "Scene 4: a WAF that logs but doesn't block");
  scene(s, [
    "The portal's gateway has a WAF policy, wafp-portal, still in Detection",
    "Detection logs and forwards; only Prevention blocks",
    "The portal's Front Door WAF, afdwafportal, blocks, but has no bot rule set",
    "Both run Default Rule Set 2.1; Learn recommends the latest, 2.2 at the guide's reading",
  ], [
    "Every policy on both services read the same way: mode, body inspection, rule sets, rate limit",
    "Coverage: internet-facing endpoints behind a WAF in Prevention",
    "The switch to Prevention written to plan-prevention.txt, never run",
    "The application owner runs it after the false-positive review",
  ], "WHAT THE KIT DOES (CHAPTER 04)", "Step 4 — SC-7, SI-10: ",
  "each policy's state and every internet-facing endpoint behind a WAF in Prevention, or named.", { icon: "FaShieldHalved" });
  src(s, "Sources: Learn, Zero Trust for Application Gateway WAF; network security Zero Trust; Secure Application Gateway. Ch 04, “The code.”");
  speak(s, "Scene 4: a WAF that logs but doesn't block",
    `The answer to check three: whether its network is linked to a DDoS protection plan, and the portal's spoke isn't. Scene four. DDoS protection stops at layers three and four; layer seven needs a web application firewall. Microsoft Learn is plain about it: detection mode logs and forwards, and only prevention mode blocks. The portal's gateway policy is still in detection. Its Front Door policy blocks, but has no bot protection rule set. The kit checks every policy on both services the same way, and writes the switch to prevention to a plan, which it never runs. The application owner runs it, after reviewing the false positives.`,
    `Chapter 04: Azure WAF runs on Front Door and Application Gateway WAF_v2; detection mode only logs, only prevention mode blocks. Microsoft's Zero Trust recommendations check prevention mode, request body inspection, the default rule set, the bot protection rule set, rate limiting and diagnostic logging. Learn recommends the latest Default Rule Set, 2.2 at the guide's reading, validated in log mode first; the CLI's default is 2.1. In the fixtures, wafp-portal (on appgw-portal) is in Detection with DRS 2.1, bot rules and a rate limit: AZS-WAF-01 and AZS-WAF-03. afdwafportal (on afd-portal) is in Prevention, DRS 2.1, no bot rule set: AZS-WAF-03 and AZS-WAF-04. For every Application Gateway policy not in prevention, the check writes the guide's switch command to plan-prevention.txt; nothing runs it. Requirements: SC-7 and SI-10 (KSI-CNA-MAT, KSI-CNA-RVP).`,
    `${WB}, Chapter 04, "Start with Microsoft Learn," "The code," "Federal requirements and evidence."`);
}
tryIt(S4, "Try it: the portal's WAF policies, and the plan",
  "WORKBOOK CH 04, LAB 1, STEPS 2 AND 4 (THE PLAN'S LONG LINE CUT)",
  [...cap("04-2", [1, 2, 3]), ...cap("04-4", [0, 1, 3])],
  "wafp-portal is in Detection; afdwafportal blocks but has no bot rules; the switch is a plan line nobody has run.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 04, “Lab 1: fixtures, no subscription,” steps 2 and 4.",
  `Try it. Read each policy. The gateway's policy, wafp-portal: detection, body inspection on, rule set 2.1, bot rules and a rate limit. The Front Door policy: prevention, body inspection on, rule set 2.1, no bot rules. Then read the plan the kit wrote: a header that says the kit did not run it, then Microsoft Learn's own switch command for wafp-portal, with its resource group and subscription, setting prevention, the state and body inspection. One of three internet-facing endpoints is behind a firewall in prevention this week.`,
  `Step 2: wafp-portal appgw Detection body True DRS 2.1 bot True rate limit True; afdwafportal afd Prevention body True DRS 2.1 bot False rate limit True. Step 4: # Reviewed commands the kit did NOT run. Read the guide's Step 4 first; run each in a change window, from a session signed in to AzureCloud. Then: az network application-gateway waf-policy policy-setting update --policy-name wafp-portal --resource-group rg-hub --subscription 11111111-1111-4111-8111-111111111111 --mode Prevention --state Enabled --request-body-check true. Step 1 printed: Behind a WAF in Prevention: 1 of 3 (afd-portal; appgw-portal is in Detection and afd-careers has no WAF).`,
  `${WB}, Chapter 04, "Lab 1: fixtures, no subscription," steps 2 and 4.`);
check(S4, 4, "Check 4: who sends the switch to Prevention?",
  "wafp-portal is in Detection, and the kit wrote the switch command to plan-prevention.txt. Who runs it, and when?",
  ["The kit, on its next weekly run", "The application owner, after the false-positive review, in a change window", "Azure Policy, automatically", "Nobody: Detection is enough"],
  `Check four. The gateway's policy is in detection, and the kit wrote the switch to prevention into a plan file. Who runs it, and when? The kit, on its next weekly run? The application owner, after the false-positive review, in a change window? Azure Policy, automatically? Or nobody, because detection is enough?`,
  `Answer: B. Chapter 04: the kit writes the command to plan-prevention.txt and never runs it; a person runs it after the false-positive review. Danger: automation that switches to Prevention blocks legitimate traffic before tuning. Detection isn't enough: attacks are logged and reach the backend (AZS-WAF-01 every week until it switches). The guide's pilot keeps Detection for at least one full business cycle.`,
  `${WB}, Chapter 04, "What it leaves to you," "Dangers."`);
endModule(S4);

// ================================================================== Scene 5 (Chapter 05)
const S5 = "Scene 5 — The origin";
{
  const s = slide(S5, "What", "Scene 5: can the portal be reached around the edge?");
  scene(s, [
    "The portal's two web apps sit behind afd-portal, in origin group og-portal",
    "origin-east allows the AzureFrontDoor.Backend tag with this profile's X-Azure-FDID",
    "origin-west allows the tag alone, with no header",
    "The tag's addresses are shared by every Front Door customer",
  ], [
    "Each App Service origin's access restrictions read and compared with the profile's Front Door ID",
    "States: PrivateLink, ServiceTag+FDID, TagOnly, OtherFrontDoor, Open, Unchecked",
    "AZS-EDGE-03 for the tag without the header",
    "Configuration first; the guide's test is a direct request, refused",
  ], "WHAT THE KIT DOES (CHAPTER 05)", "Step 5 — SC-7, SC-8, CP-2: ",
  "origins only the edge can reach, TLS 1.2 minimum, and a second origin to fail over to.", { icon: "FaRoute" });
  src(s, "Sources: Learn, Secure traffic to Front Door origins; App Service multi-region tutorial; Web Apps - Get Configuration. Ch 05, “The code.”");
  speak(s, "Scene 5: can the portal be reached around the edge?",
    `The answer to check four: the application owner, after the false-positive review, in a change window. Scene five. A web application firewall only helps if nothing can reach the origin around it. Microsoft Learn says to use the Front Door service tag and the Front Door ID header together, because the tag's addresses are shared by every Front Door customer. The portal's east web app does both, with this profile's own ID. The west web app allows the tag alone. So any customer's Front Door can reach it. The kit reads each origin's access restrictions and compares the header with the profile's ID. And it knows configuration isn't proof: the guide's test is a direct request, refused.`,
    `Chapter 05: Learn's origin security page says to use the AzureFrontDoor.Backend service tag and the X-Azure-FDID header together, because the tag's addresses are shared by every Front Door customer. For an App Service origin, Learn's tutorial does both in one access restriction. The App Service configuration API returns ipSecurityRestrictions and the default action; the X-Azure-FDID header matches exactly. In the fixtures, afd-portal's og-portal has origin-east (app-portal-east, tag plus this profile's Front Door ID: ServiceTag+FDID) and origin-west (app-portal-west, tag only: TagOnly, AZS-EDGE-03). The metric is "locked by configuration"; the guide's Validate step is a direct request to the origin refused and the same request through Front Door accepted. Requirements: SC-7, SC-8, CP-2 (KSI-CNA-MAT, KSI-SVC-SIN).`,
    `${WB}, Chapter 05, "Start with Microsoft Learn," "The code," "Dangers."`);
}
tryIt(S5, "Try it: each origin's lock-down",
  "WORKBOOK CH 05, LAB 1, STEPS 2–3 (THREE OF THE EIGHT FINDINGS SHOWN)",
  [...cap("05-2", [1, 2, 3, 4, 5, 6]), ...cap("05-3", [0, 2, 3, 6])],
  "origin-east is locked with the tag and this profile's ID; origin-west has the tag only; api-public is one the kit can't check.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 05, “Lab 1: fixtures, no subscription,” steps 2–3.",
  `Try it. Read each origin's lock-down. In the portal's origin group, the east web app is locked with the service tag and the Front Door ID; the west one has the tag only. In the API group, one origin reaches its back end over Private Link and one is a public host the kit can't check, so it says to test a direct request by hand. Then the findings: the west origin's rule has no header, and the API group mixes a private and a public origin, which Learn says not to do.`,
  `Step 2: afd-portal og-api api-private PrivateLink; afd-portal og-api api-public Unchecked; afd-portal og-portal origin-east ServiceTag+FDID; afd-portal og-portal origin-west TagOnly; afd-careers og-careers careers-static Unchecked. Two of five origins locked by configuration. Step 3 (three of eight): AZS-EDGE-05 afd-portal/og-api: Private Link and public origins in one origin group; AZS-EDGE-03 afd-portal/og-portal/origin-west: the AzureFrontDoor.Backend rule on app-portal-west has no X-Azure-FDID header; AZS-EDGE-04 afd-portal/og-api/api-public: test a direct request by hand.`,
  `${WB}, Chapter 05, "Lab 1: fixtures, no subscription," steps 2–3.`);
check(S5, 5, "Check 5: why isn't the tag enough?",
  "origin-west allows the AzureFrontDoor.Backend service tag, with no X-Azure-FDID header. What's wrong with that?",
  ["Nothing: the tag is Front Door's own", "The tag's addresses are shared by every Front Door customer", "The tag blocks Front Door's health probes", "The tag works only with Private Link"],
  `Check five. The west origin allows the Front Door service tag, with no Front Door ID header. What's wrong with that? Nothing, since the tag is Front Door's own? The tag's addresses are shared by every Front Door customer? The tag blocks Front Door's health probes? Or the tag works only with Private Link?`,
  `Answer: B. Chapter 05: Learn's origin security page says to use the AzureFrontDoor.Backend service tag and the X-Azure-FDID header together, because the tag's addresses are shared by every Front Door customer. A rule with the tag alone admits any customer's Front Door (AZS-EDGE-03). The header must be this profile's Front Door ID; another profile's is AZS-EDGE-02.`,
  `${WB}, Chapter 05, "Start with Microsoft Learn," "Dangers."`);
endModule(S5);

// ================================================================== Scene 6 (Chapter 06)
const S6 = "Scene 6 — Egress";
{
  const s = slide(S6, "What", "Scene 6: the portal's egress skips the firewall");
  scene(s, [
    "The portal's web subnet, snet-web, sends 0.0.0.0/0 straight to the Internet",
    "The jump subnet sends it to 10.9.9.9, an appliance that isn't the hub firewall",
    "The hub firewall's policy, afwp-hub, has threat intelligence and IDPS in Alert",
    "Alert logs; only Deny stops a known-bad destination",
  ], [
    "Every workload subnet's declared default route followed to its next hop",
    "Firewall when it's a firewall's private IP; another appliance is a Warn",
    "Learn's Draft + Deployment commands written to plan-deny.txt, never run",
    "Declared routes only: Lab 2 checks the effective route on a running NIC",
  ], "WHAT THE KIT DOES (CHAPTER 06)", "Step 6 — SC-7, SC-7(5), SI-4: ",
  "deny by default on the firewall, and every workload subnet's way out through it.", { icon: "FaRoute" });
  src(s, "Sources: Learn, Zero Trust for Azure Firewall; Integrate NAT gateway (route table); Draft + Deployment. Ch 06, “The code.”");
  speak(s, "Scene 6: the portal's egress skips the firewall",
    `The answer to check five: the tag's addresses are shared by every Front Door customer, so the header has to prove it's yours. Scene six, what leaves. Microsoft Learn's Zero Trust recommendations for Azure Firewall check that outbound traffic routes through the firewall, with threat intelligence and intrusion detection in alert and deny. The portal's web subnet sends its default route straight to the internet. Its jump subnet sends it to an appliance that isn't the hub firewall. And the hub policy is still in alert. The kit writes Learn's draft-and-deploy commands for the move to deny into a plan, which it never runs, because deploying replaces the whole applied policy.`,
    `Chapter 06: Microsoft's Zero Trust recommendations for Azure Firewall check that outbound traffic from workloads routes through the firewall, that threat intelligence and IDPS are in alert and deny, that outbound TLS is inspected, and that diagnostic logs are on; IDPS and TLS inspection need Premium. Learn's route commands add a 0.0.0.0/0 route with next hop VirtualAppliance at the firewall's private IP. In the fixtures, afw-hub's private IP is 10.0.0.4; rt-portal sends vnet-portal/snet-web's default route to the Internet (AZS-FW-03); rt-jump sends snet-jump's to 10.9.9.9 (AZS-FW-04, Warn). afwp-hub is Premium with threatIntelMode Alert and IDPS Alert (AZS-FW-01, AZS-FW-02). Learn's Draft + Deployment: draft create, draft update to Deny, draft show, deploy; deploying replaces the applied policy. Requirements: SC-7, SC-7(5), SI-4 (KSI-CNA-RNT, KSI-CNA-ULN).`,
    `${WB}, Chapter 06, "Start with Microsoft Learn," "The code," "Dangers."`);
}
tryIt(S6, "Try it: default routes, and the draft to Deny",
  "WORKBOOK CH 06, LAB 1, STEPS 2 AND 4 (THE PLAN'S LONG LINES CUT)",
  [...cap("06-2", [1, 2, 3, 4, 5, 6]), ...cap("06-4", [0, 1, 3, 4, 5, 6])],
  "snet-web goes to the Internet and snet-jump to an unknown appliance; the plan stages Deny in a draft nobody has deployed.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 06, “Lab 1: fixtures, no subscription,” steps 2 and 4.",
  `Try it. Read each workload subnet's default route. Two go to the hub firewall at 10.0.0.4. The payroll data subnet has no route table at all. The portal's jump subnet goes to an unknown appliance, and its web subnet straight to the internet. Two of five route to the firewall. Then read the plan: Microsoft Learn's four commands, create a draft, set threat intelligence and intrusion detection to deny, show it, and deploy it, each with the policy's resource group and subscription, under a header that says the kit did not run them.`,
  `Step 2: vnet-payroll/snet-app rt-payroll Firewall 10.0.0.4 (afw-hub); vnet-payroll/snet-data NoRouteTable; vnet-portal/snet-jump rt-jump OtherAppliance 10.9.9.9; vnet-portal/snet-pe rt-portal-pe Firewall 10.0.0.4 (afw-hub); vnet-portal/snet-web rt-portal Internet. Two of five workload subnets route to the firewall (declared). Step 4: the header, then az network firewall policy draft create, draft update --threat-intel-mode Deny --idps-mode Deny, draft show, and deploy, for afwp-hub in rg-hub.`,
  `${WB}, Chapter 06, "Lab 1: fixtures, no subscription," steps 2 and 4.`);
check(S6, 6, "Check 6: why a draft, and why not automated?",
  "Why does the kit write the move to Deny as a Draft + Deployment plan instead of sending it?",
  ["Drafts are cheaper", "Deploying replaces the whole applied policy, so it goes through review and a change window", "Deny can't be set from the CLI", "The kit has no network access"],
  `Check six. Why does the kit write the move to deny as a draft-and-deploy plan, instead of sending it? Because drafts are cheaper? Because deploying replaces the whole applied policy, so it goes through review and a change window? Because deny can't be set from the command line? Or because the kit has no network access?`,
  `Answer: B. Chapter 06: Learn's Draft + Deployment stages every change in a draft and deploys it at once; deploying replaces the whole applied policy, so live edits made since the draft are lost. The kit never deploys; plan-deny.txt's header points at the guide's Step 6 and the change window. The kit reads Resource Manager only and writes nothing outside the runbook's one approved plan.`,
  `${WB}, Chapter 06, "What it leaves to you," "Dangers."`);
endModule(S6);

// ================================================================== Scene 7 (Chapter 07)
const S7 = "Scene 7 — The vault";
{
  const s = slide(S7, "What", "Scene 7: the portal's vault, missing every part");
  scene(s, [
    "The portal reads its secrets from kv-portal",
    "Access policies, not Azure RBAC; no purge protection; the firewall allows all networks",
    "Public access on, no private endpoint, no AuditEvent logs",
    "kv-payroll, next door, has every part: it shows what done looks like",
  ], [
    "Six checks on every vault, every run: AZS-KV-01 to 06",
    "Full posture: RBAC, purge protection, an approved private endpoint, AuditEvent",
    "Private Link and DNS too: central zones, zone groups, nothing public behind an endpoint",
    "Rotation policies are data-plane reads the kit doesn't make; Lab 2 reads one",
  ], "WHAT THE KIT DOES (CHAPTER 07)", "Steps 7 and 8 — SC-12, SC-28, IA-5, SC-7, AC-4: ",
  "every vault's posture, and PaaS reached only through private endpoints that resolve through central DNS.", { icon: "FaKey" });
  src(s, "Sources: Learn, Secure your Azure Key Vault; Key Vault Private Link; Key Vault logging; Private Link and DNS at scale. Ch 07, “The code.”");
  speak(s, "Scene 7: the portal's vault, missing every part",
    `The answer to check six: deploying replaces the whole applied policy, so it goes through review and a change window. Scene seven, the vault. Microsoft Learn's Key Vault recommendations are clear: Azure role-based access, not access policies; soft delete and purge protection; private endpoints with public access disabled; and audit logging. The portal's vault misses every part. It uses access policies, has no purge protection, a firewall that allows all networks, public access on, no private endpoint, and no audit events to the workspace. The payroll team's vault next door has every part, so the estate already shows what done looks like.`,
    `Chapter 07: Learn's Key Vault recommendations: Azure RBAC, not access policies; soft delete and purge protection; private endpoints with public access disabled; audit logging. Learn's Private Link page creates an RBAC vault with purge protection and closes its firewall (--default-action deny). The kit's six vault rules: AZS-KV-01 access policies, KV-02 no purge protection, KV-03 firewall default not Deny, KV-04 public network access on (Warn), KV-05 no approved private endpoint, KV-06 no AuditEvent (or audit, allLogs) to the platform workspace. In the fixtures, kv-portal (sub-online-portal) has all six; kv-payroll has the full posture. Full posture is RBAC, purge protection, an approved private endpoint and AuditEvent: the guide's vault-posture metric (1 of 3 in week 1). Requirements: SC-12, SC-28, IA-5 (KSI-SVC-ASM, KSI-IAM-SNU); SC-7, AC-4 (KSI-CNA-ULN).`,
    `${WB}, Chapter 07, "Start with Microsoft Learn," "The code," "Federal requirements and evidence."`);
}
tryIt(S7, "Try it: the vaults",
  "WORKBOOK CH 07, LAB 1, STEPS 2 AND 4 (THE PORTAL VAULT'S FINDINGS; OTHER ROWS LEFT OUT)",
  [...cap("07-2", [1, 2, 3, 4]), ...cap("07-4", [0, 7, 8, 9, 10, 11, 16])],
  "kv-portal misses every part of the posture; kv-payroll has all of it; one of three vaults has the full posture.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 07, “Lab 1: fixtures, no subscription,” steps 2 and 4.",
  `Try it. Read each vault. The hub's certificate vault has role-based access, purge protection, a closed firewall and audit logs, but public access on and no private endpoint. The payroll vault has everything. The portal's vault has nothing: no role-based access, no purge protection, a firewall that allows all networks, public access, no endpoints, no audit. Then its findings, one per missing part, from access policies to the missing audit events. One of three vaults has the full posture.`,
  `Step 2: kv-hub-certs rbac True purge True firewall Deny public Enabled endpoints 0 audit True posture False; kv-payroll rbac True purge True firewall Deny public Disabled endpoints 1 audit True posture True; kv-portal rbac False purge False firewall Allow public Enabled endpoints 0 audit False posture False. Step 4 (kv-portal's rows): AZS-KV-01 enableRbacAuthorization is not true; AZS-KV-02 enablePurgeProtection is not true; AZS-KV-03 networkAcls.defaultAction Allow; AZS-KV-05 no approved private endpoint connection; AZS-KV-06 no AuditEvent (or audit, allLogs) to the platform workspace; AZS-KV-04 Warn publicNetworkAccess Enabled.`,
  `${WB}, Chapter 07, "Lab 1: fixtures, no subscription," steps 2 and 4.`);
check(S7, 7, "Check 7: can purge protection be undone?",
  "The fix for kv-portal includes turning on purge protection. Can that be rolled back later?",
  ["Yes, with az keyvault update", "No: once on, it can't be turned off; that is the point", "Only by Microsoft support", "Only in a test subscription"],
  `Check seven. The fix for the portal's vault includes turning on purge protection. Can that be rolled back later? Yes, with a key vault update? No, because once it's on it can't be turned off, and that's the point? Only by Microsoft support? Or only in a test subscription?`,
  `Answer: B. Chapter 07, Dangers: purge protection can't be turned off once on; that is the point (design guidance, from the guide's Step 8: "purge protection itself has no rollback"). AZS-KV-02 only ever asks for it on. The other parts of the vault's posture do roll back (the firewall default action, role assignments).`,
  `${WB}, Chapter 07, "Dangers"; ${GUIDE}, Step 8.`);
endModule(S7);

// ================================================================== Scene 8 (Chapter 08)
const S8 = "Scene 8 — Policy, drift, evidence";
{
  const s = slide(S8, "What", "Scene 8: an exemption due, a week of drift, the evidence");
  scene(s, [
    "The portal's WAF tuning runs under an exemption, ex-portal-waf, due December 1",
    "A week later the platform team switches wafp-portal to Prevention, adds origin-west's header, routes snet-web to the firewall and turns on kv-portal's purge protection",
    "And pip-new-api arrives, with no owner and no protection",
    "Every run is recorded as evidence the ISSO can check",
  ], [
    "Exemptions: none without expiry, none expired, warnings 30 days ahead",
    "Two runs compared by fingerprint: new, fixed, still open",
    "Each run recorded with its controls and KSIs, every file's hash, the record before it",
    "Fixture records never pass a stage check",
  ], "WHAT THE KIT DOES (CHAPTER 08)", "Steps 9 and 10 — CM-6, CA-7, AU-9: ",
  "what changed since last week, the metrics, and records that support the controls; the assessor decides.", { icon: "FaFileShield", pt: 12.5 });
  src(s, "Sources: Learn, Resource Graph samples for Azure Policy; exemption structure. Ch 08, “The code”; config/requirements.json.");
  speak(s, "Scene 8: an exemption due, a week of drift, the evidence",
    `The answer to check seven: no. Once on, purge protection can't be turned off, and that's the point. Scene eight. The portal's WAF tuning runs under a waiver that expires on December first, so the kit warns it's due within thirty days. A week later, the platform team switches the gateway's firewall to prevention, adds the west origin's header, routes the web subnet to the firewall, and turns on the vault's purge protection. A new address arrives, with no owner and no protection. The kit compares the two weeks by fingerprint, and records each run as evidence that supports the controls, with its key security indicators, its hashes and the record before it.`,
    `Chapter 08: Learn's Resource Graph samples for Azure Policy read assignments, exemptions and compliance; an exemption is Mitigated or Waiver, can carry expiresOn, and an expired one is kept but no longer honored. AZS-POL-05 warns 30 days ahead (config/baseline.json). In the fixtures, ex-portal-waf is a Waiver expiring 2026-12-01 ("DR-AZS-012: WAF tuning for the portal"). Week 2 changes: wafp-portal to Prevention, origin-west's header, rt-portal to 10.0.0.4, kv-portal purge protection, azs-security to Default, hierarchy authorization; pip-new-api new, pip-orphan gone. Invoke-AzsCompare.ps1 compares Finding and Warn rows by fingerprint (rule and lower-cased resource ID). Invoke-AzsEvidence.ps1 writes a record with the steps' SP 800-53 controls and KSIs, every file's SHA-256 and the previous record's hash; with -Stage it requires passing records from live runs. The record says: supports the controls listed; the agency's assessor decides.`,
    `${WB}, Chapter 08, "Start with Microsoft Learn," "The code," "Federal requirements and evidence."`);
}
tryIt(S8, "Try it: the exemption, the drift, the records",
  "WORKBOOK CH 08, LAB 1, STEPS 2, 4, 6 AND 7 (SELECTED LINES; THE PORTAL'S ROWS)",
  [...cap("08-2", [0, 5]), ...cap("08-4", [9, 15, 19, 20, 21, 24, 26]), ...cap("08-6", [0, 1, 15, 17]), ...cap("08-7", [1, 2, 3])],
  "ex-portal-waf is due; the portal's four fixes show as fixed and pip-new-api as new; the chain holds, and a stage check still refuses it.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 08, “Lab 1: fixtures, no subscription,” steps 2, 4, 6 and 7.",
  `Try it. The policy check flags the portal's waiver, due December first. Compare the two weeks: thirteen fixed, four new. Among the fixed, the portal's firewall policy, the west origin, the web subnet's route and the vault's purge protection. Among the new, the arriving address, with no owner and no protection plan. Record the run as evidence: it covers all nine area steps, and the check shows the hashes match and the chain is unbroken. Then ask whether this evidence could promote anything to production. Every stage step fails: no passing live record.`,
  `Step 2: AZS-POL-05 Warn ex-portal-waf: Waiver, expires 2026-12-01; DR-AZS-012: WAF tuning for the portal. Step 4: Total: new 4, fixed 13, still open 54; New ddos AZS-DD-01 pip-new-api (and baseline AZS-BL-05, exposure AZS-EX-01 for it, and AZS-EX-04 for pip-orphan); Fixed waf AZS-WAF-01 wafp-portal; Fixed edge AZS-EDGE-03 origin-west; Fixed firewall AZS-FW-03 vnet-portal/snet-web; Fixed private AZS-KV-02 kv-portal. Step 6: Record 1: Pass (BL, EXP, DDOS, WAF, EDGE, FW, PL, KV, POL, EVIDENCE) with sixteen controls; the check: SUMS Pass 103 files match SHA256SUMS; CHAIN Pass 3 records, chain unbroken. Step 7: every STEP-* row Fail: no passing live record.`,
  `${WB}, Chapter 08, "Lab 1: fixtures, no subscription," steps 2, 4, 6 and 7.`, { pt: 10 });
check(S8, 8, "Check 8: why does the stage check fail?",
  "The evidence folder's hashes match and its chain is unbroken. Why does the test-stage check still fail every step?",
  ["The chain is too short", "The records come from fixture runs, and only live records count toward a stage", "The KSIs are wrong", "The metrics weren't recorded"],
  `Check eight. The evidence folder's hashes match, and its chain is unbroken. Why does the test-stage check still fail every step? Is the chain too short? Do the records come from fixture runs, when only live records count toward a stage? Are the key security indicators wrong? Or were the metrics not recorded?`,
  `Answer: B. Chapter 08: a fixture run is recorded as mode Fixture and never counts toward a stage, so lab evidence can't promote anything. Test-AzsEvidence -Stage requires a passing record from a live run for every step the stage needs. The metrics were recorded (record 3), and the controls and KSIs come from config/requirements.json, the guide's table.`,
  `${WB}, Chapter 08, "The evidence," "Dangers."`);
endModule(S8);

// ================================================================== Scene 9 (Chapter 09)
const S9 = "Scene 9 — Test, then production";
{
  const s = slide(S9, "How", "Scene 9: the kit goes live, test first");
  scene(s, [
    "The runbook runs the same commands twice: test, then production; only the settings file changes",
    "Reads need only Reader; the one write is the security initiative in DoNotEnforce",
    "That write is a plan, applied only with its approved SHA-256, and its rollback is rehearsed in test",
    "Go or no-go is the test stage's live evidence",
  ], [
    "Preflight PF-01 to PF-07; production's PF-07 needs the test stage's evidence",
    "The weekly run: every area, the register against last week's, the comparison, the metrics, a record",
    "A settings file with no secrets, outputs outside any repository",
    "Nobody has run it against a live subscription",
  ], "WHAT THE RUNBOOK DOES (CHAPTER 09)", "Every step — CM-3, CM-4, CP-2, CA-7, AU-9: ",
  "one change record per stage, an approved hash at the one write, a rehearsed rollback, evidence checked by hash.", { icon: "FaRoute", pt: 12.5 });
  src(s, "Sources: Ch 09, “Before you start,” “Preflight,” Stages 1 and 2, “The evidence the ISSO keeps”; Learn, Azure Policy assignment structure.");
  speak(s, "Scene 9: the kit goes live, test first",
    `The answer to check eight: the records come from fixture runs, and only live records count toward a stage. Scene nine, the runbook. It's one ordered set of commands, run against a test subscription, then production, and only the settings file changes. The weekly run needs only Reader. The kit's one write is the security initiative's assignment at the intermediate root in DoNotEnforce, which evaluates without enforcing, as Microsoft Learn's assignment structure page describes. It's a plan, applied only with its approved hash, and its rollback is rehearsed in test before production. Go or no-go is the test stage's live evidence. One honest label: nobody has run this runbook against a live subscription.`,
    `Chapter 09: a runbook, not a code chapter; it has no labs of its own. Identities: a reader with Reader on the intermediate root and the tenant root group, without a secret; an operator eligible through PIM for Resource Policy Contributor for the change window. Preflight PF-01 to PF-07 (PF-03: output outside the kit's repository; PF-07: production only, the test stage's evidence). Stage 1: the first scheduled run; plan the initiative (az policy assignment create ... --enforcement-mode DoNotEnforce --mi-system-assigned --role <identity-role>); apply with -Apply -ApprovedSha256; smoke test; rehearse the rollback (-Mode Delete in test; production's rollback is -Mode DoNotEnforce); a week later, the second run with its comparison. Go/no-go: Invoke-AzsEvidence.ps1 -Check -Stage test. Stage 2 repeats it in production. Nothing here has been run against a live subscription; the fixture-mode output was produced on November 17, 2026.`,
    `${WB}, Chapter 09, "Before you start," "Preflight," "Stage 1," "Go or no-go," "Stage 2."`);
}
tryIt(S9, "Try it: the runbook's rehearsal on the fixtures",
  "WORKBOOK CH 09, “REHEARSE IT IN FIXTURE MODE”: OUTPUT AS THE PAGE PRINTS IT (FIXTURE MODE, NOVEMBER 17, 2026)",
  [
    "PS> ./deploy/Invoke-AzsScheduledRun.ps1 -SettingsPath <rehearsal-folder>/settings.test.json -FixturePath tests/fixtures/week1 `",
    ">>     -AsOf 2026-11-09T12:00:00Z",
    "Run run-2026-11-09: 48 Finding, 18 Warn, 2 Info",
    "No earlier run: this run is the baseline",
    "Evidence record 1: Pass (RUN, BL, EXP, DDOS, WAF, EDGE, FW, PL, KV, POL, METRICS, EVIDENCE)",
    "PS> ./deploy/Invoke-AzsScheduledRun.ps1 -SettingsPath <rehearsal-folder>/settings.test.json -FixturePath tests/fixtures/week2 `",
    ">>     -AsOf 2026-11-16T12:00:00Z",
    "Run run-2026-11-16: 40 Finding, 17 Warn, 3 Info",
    "Against run-2026-11-09: new 4, fixed 13, still open 53",
    "Evidence record 2: Pass (RUN, BL, EXP, DDOS, WAF, EDGE, FW, PL, KV, POL, METRICS, DRIFT, EVIDENCE)",
    "PS> ./deploy/Invoke-AzsRollback.ps1 -SettingsPath <rehearsal-folder>/settings.test.json -Mode DoNotEnforce `",
    ">>     -OutputPath <rehearsal-folder>/rollback -AsOf 2026-11-16T12:00:00Z -Fixture",
    "az policy assignment update --name azs-security --scope /providers/Microsoft.Management/managementGroups/contoso `",
    ">>     --enforcement-mode DoNotEnforce",
    "Plan SHA-256: 3215132646d6464cde2858095e4eb26db7c462d975e92c453a3ada3a83b97d66",
    "Dry run: nothing was sent.",
  ],
  "two weekly runs, each recorded; the second carries its comparison; the rollback is a plan with a hash, sent only with -Apply.",
  "Sources: Workbook Ch 09, steps 3, 7 and 8 and “Rehearse it in fixture mode” (output as the page prints it, fixture mode, Nov 17, 2026).",
  `Try it. The runbook's own rehearsal on the fixtures. The first weekly run reads every area, records itself as the baseline, and covers every area step and the metrics. A week later, the second run finds last week's, compares them, thirteen fixed and four new, and its record adds the comparison. Then the rollback for production, back to audit: one command, printed with its plan's hash, and nothing sent. In a live stage, a second person approves that hash before anyone applies it.`,
  `Chapter 09, steps 3, 7 and 8, and "Rehearse it in fixture mode": the scheduled run on week 1 printed Run run-2026-11-09: 48 Finding, 18 Warn, 2 Info; No earlier run: this run is the baseline; Evidence record 1: Pass (RUN, BL, EXP, DDOS, WAF, EDGE, FW, PL, KV, POL, METRICS, EVIDENCE). On week 2: Run run-2026-11-16: 40 Finding, 17 Warn, 3 Info; Against run-2026-11-09: new 4, fixed 13, still open 53; Evidence record 2 adds DRIFT. The rollback with -Mode DoNotEnforce printed the plan's command and Plan SHA-256 3215132646d6464cde2858095e4eb26db7c462d975e92c453a3ada3a83b97d66; Dry run: nothing was sent. The commands on the slide are the page's, continued with a backtick; <rehearsal-folder> is a folder outside any repository. The scheduled run here doesn't pass Defender for Cloud's export, so its warning count differs by one from Chapter 08's.`,
  `${WB}, Chapter 09, steps 3, 7 and 8; "Rehearse it in fixture mode."`, { pt: 10 });
check(S9, 9, "Check 9: production before test passes",
  "An operator runs production's preflight before the test stage's evidence passes its stage check. What happens?",
  ["It passes; the stages are independent", "PF-07 fails: production needs the test stage's evidence to pass", "It warns, and the operator decides", "The initiative is assigned anyway"],
  `Check nine, the last one. An operator runs production's preflight before the test stage's evidence passes its stage check. Does it pass anyway, fail on the check that reads the test evidence, warn and let the operator decide, or assign the initiative regardless?`,
  `Answer: B. Chapter 09: PF-07 (production only) fails unless the test stage's evidence passes its stage check (Invoke-AzsEvidence.ps1 -Check -Stage test). Danger: lab evidence used to promote; guard: fixture records never count toward a stage, and PF-07 checks the test stage.`,
  `${WB}, Chapter 09, "Preflight," "Go or no-go," "Dangers."`);
endModule(S9);

// ================================================================== Close
const SC = "Close";
{
  const s = slide(SC, "How", "Your turn: Lab 2, and where to go next");
  const pl = panel(s, "Lab2", 0.6, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "LAB 2: YOUR OWN TEST SUBSCRIPTION", null, [
    "A test tenant with a test management group and subscription in commercial Azure",
    "Reader is enough for every check; the guide's Validate commands run beside the kit",
    "Each Lab 2 says how to back out what it wrote",
    "Never production; the authors haven't run the Lab 2s",
  ], 13);
  const pr = panel(s, "Next", 6.75, 1.45, 6.0, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "The workbook, Building Azure Security: nine draft chapters, eight with Lab 1 and Lab 2, and the runbook",
    "A narrated tour of each chapter",
    "The learning path, Azure Security Engineering: five modules with knowledge checks",
    "Azure Security Engineering, the implementation guide: the ten steps",
  ], 13);
  callout(s, "Case", Math.max(pl, pr) + 0.22, 1.0, "FaRoute", HEX.navy, "The portal, end to end: ",
    "baseline read back, every exposure owned, protection traced, a WAF switched by a person, origins locked, egress through the firewall, the vault fixed, drift recorded.");
  src(s, "Sources: workbook index; Chapters 01–08, “Lab 2”; Chapter 09; learning path index; Azure Security Engineering, “In this guide.”");
  speak(s, "Your turn: Lab 2, and where to go next",
    `The answer to check nine: the preflight's last check fails, because production needs the test stage's evidence to pass first. That's the portal, end to end: its baseline read back, every public face owned, its protection traced to the network behind it, a web application firewall switched by a person, origins locked to the edge, egress through the firewall, its vault fixed, and every week's drift recorded as evidence. Now it's your turn. Each chapter has a second lab in your own test subscription, never production, with Reader and the guide's own Validate commands beside the kit. Then go deeper: the draft chapters and their narrated tours, the learning path, and the implementation guide. Thanks for watching.`,
    `Lab 2 environment, every chapter: a test tenant with a test management group and subscription in commercial Azure, never production; Reader on the test management group (and the tenant root group for Chapter 01), Azure CLI with the resource-graph extension, PowerShell 7. Each Lab 2 ends with a back-out step; the authors haven't run them. Where to go next: the workbook index (docs/project-plans/developer-workbooks/azure-security/), its nine chapters (drafts awaiting the owner's review), the narrated chapter tours, the learning path Azure Security Engineering (docs/training/azure-security/, five modules, each with a Lab 1 from these chapters, a Lab 2 and a knowledge check), and the implementation guide Azure Security Engineering (docs/books/guides/azure-security-implementation.md).`,
    `${WB}, index; Chapters 01–08, "Lab 2"; Chapter 09; learning path, index; ${GUIDE}.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: the workbook and the kit", [
  "Building Azure Security (docs/project-plans/developer-workbooks/azure-security/), draft chapters awaiting review: index; Chapter 01 The Landing-Zone Baseline; 02 The Public Exposure Register; 03 DDoS Protection; 04 The Web Application Firewall; 05 Front Door, Application Gateway and the Origin; 06 Azure Firewall and Egress; 07 Private Link, DNS and Key Vault; 08 Policy, Drift and Evidence; 09 Deploying to Test and Production. Each chapter's facts are footnoted there, read November 11 to 17, 2026.",
  "examples/azure-security: Invoke-AzsCheck.ps1, Invoke-AzsCompare.ps1, Invoke-AzsMetrics.ps1, Invoke-AzsEvidence.ps1; powershell/AzureSecurity; config/calls.json, rules.json, baseline.json, requirements.json; deploy/ (Test-AzsPreflight.ps1, Invoke-AzsScheduledRun.ps1, New-AzsPolicyPlan.ps1, Invoke-AzsRollback.ps1, AzsDeploy.psm1).",
  "Fixtures (all fictional): tests/fixtures/week1 and week2, settings.lab.json, defender-exposure.csv; deploy/tests/fixtures. The portal's resources are the fixture estate's sub-online-portal and the connectivity hub that serves it.",
  "Every Try it output is read at build time from data/kit-captures/azs/ (scripts/kit_captures.py), trimmed where the slide says so; Scene 9 shows Chapter 09's own fixture-mode output, as the page prints it.",
]);
sourceSlide("Sources: Microsoft Learn and the requirements", [
  "Microsoft Learn: Protect your resource hierarchy; Hierarchy Settings - Get; Diagnostic Settings - List; Pricings - List; Starter Resource Graph samples; DDoS Protection tier comparison, Zero Trust recommendations and simulation testing; Zero Trust recommendations for Application Gateway WAF and network security; Secure traffic to Azure Front Door origins; Web Apps - Get Configuration; Zero Trust recommendations for Azure Firewall; Azure Firewall Draft + Deployment; Secure your Azure Key Vault; Integrate Key Vault with Azure Private Link; Azure Resource Graph samples for Azure Policy; Azure Policy exemption and assignment structure.",
  "NIST SP 800-53 Rev. 5 and SP 800-53B; FedRAMP, Key Security Indicators (FedRAMP Consolidated Rules for 2026). The kit's config/requirements.json carries the guide's step-to-control and control-to-KSI pairs; the kit's records support the controls, and the assessor decides them. KSIs are indicators for cloud service providers; the agency lines its own evidence up with them.",
  "Design guidance in this deck: the kit's own rules (owners, enforce-by dates, one DDoS plan, the warning window), the order of the runbook, and the story's choice of the portal as one case.",
]);

const count = narration.length;
fs.writeFileSync(path.join(__dirname, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
const spokenWords = narration.reduce((a, e) => a + e.say.split(" ").length, 0);
console.log(`narration.json: ${count} narrated slides, ${spokenWords} spoken words (about ${(spokenWords / 150).toFixed(1)} min at 150 wpm)`);
finish(OUT);
