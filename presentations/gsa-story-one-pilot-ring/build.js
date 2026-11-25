// Building Global Secure Access — the story deck: one pilot ring, from the decision to Go.
// Teaches the whole developer workbook (docs/project-plans/developer-workbooks/global-secure-access/) through one case:
// the pilot ring of the fictional tenant contoso.example in the kit's own fixtures (examples/global-secure-access/tests/
// fixtures/pilot, November 16, 2026, and ring1, November 30, 2026). Nine scenes, one per chapter, in the guide's run order.
// Each scene has a story slide, a "Try it" slide with the chapter's Lab 1 output, read at build time from
// data/kit-captures/gsa/NN-k.txt (Ch 09 has no Lab 1: its slide shows the page's own fixture output), and a
// one-question check whose answer opens the next slide's narration and sits in the check slide's notes.
// Facts come only from the workbook's chapters, their footnotes and the captures. No new external facts.
// Shared helpers: ../attribute-driven-migration-technical-part-1/slides.js, with the code panel and scene helpers
// of the Provider Notices story deck. The build also writes narration.json (one {slide, title, say}) for narrate.py.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/gsa-story-one-pilot-ring/build.js \
//                      presentations/gsa-story-one-pilot-ring/GSA_Story_One_Pilot_Ring.pptx
const fs = require("fs");
const path = require("path");
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Building Global Secure Access — One Pilot Ring, Decision to Go",
  footer: "Federal Modernization Workbook  ·  Building Global Secure Access  ·  One pilot ring, decision to Go",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || path.join(__dirname, "GSA_Story_One_Pilot_Ring.pptx");
const WB = "Building Global Secure Access";
const GUIDE = "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide";
const BANNED = /\bUIAO\b|\bSSA\b|Social Security|Mainframe PIN|\bDISA\b|\bSTIGs?\b|\bsatisf(y|ies)\b|\bmeets\b|GCC[ -]?High|\bGCCH\b|\bDoD\b|Azure Government|\bCAC\b/i;

// ------------------------------------------------------------------ captures
// cap("01-7", [0, 1, 5]) returns those lines (0-based) of data/kit-captures/pn/01-5.txt, each cut to max characters
// with "…" (the slide's label says lines are cut). A prompt line longer than max is continued PowerShell-style.
const CAP = path.join(__dirname, "..", "..", "data", "kit-captures", "gsa");
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
  line(s, "Answer note", `Check ${n} of 9: the answer opens the next slide, and it's in this slide's notes.`, 5.95, 0.4, 13);
  speak(s, title, say, more, ref);
  return s;
};

// ================================================================== 1 Title
const S0 = "Opening";
{
  const s = titleSlide(S0, "One Pilot Ring, Decision to Go", "Building Global Secure Access — the whole workbook through one tenant's pilot ring");
  txt(s, "Session map", [
    { text: "contoso.example (fictional): the pilot ring on November 16, 2026, and the same tenant two weeks later", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Decide · export and log · client · Microsoft traffic · compliant network · private apps · web and TLS · rings · deploy", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Every value shown is from the kit's fictional fixtures; every output is a real Lab 1 capture", options: { color: HEX.ink, breakLine: true } },
    { text: "Workbook review status: approved  ·  illustrative code, tested against fixtures  ·  Microsoft 365 GCC (Moderate)", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 10.6, h: 1.6, fontSize: 15, paraSpaceAfter: 2 });
  speak(s, "One Pilot Ring, Decision to Go",
    `Welcome to the story deck for Building Global Secure Access, a developer workbook in the Federal Modernization Workbook. Instead of nine chapters one at a time, we'll follow one pilot ring all the way through: a fictional agency tenant, contoso dot example, on November 16, 2026, and the same tenant two weeks later. Every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. One note before we begin: the workbook has been reviewed and approved, and the code is illustrative, tested against fixtures, not against a live tenant.`,
    `The deck teaches the whole developer workbook through one case: the pilot ring of the fictional tenant contoso.example in the kit's fixtures (examples/global-secure-access/tests/fixtures/pilot, November 16, 2026, and ring1, November 30, 2026). Each scene is one chapter: the decision (Ch 01), the export and logs (Ch 02), the client (Ch 03), Microsoft traffic and the plan (Ch 04), the compliant network and tenant restrictions (Ch 05), private apps and admin paths (Ch 06), Internet Access and TLS (Ch 07), rings, metrics and evidence (Ch 08), and the runbook (Ch 09). The workbook targets Microsoft 365 GCC (Moderate) with commercial Azure. Chapter 09's runbook hasn't been run against a live tenant; no Lab 2 has been run by the authors.`,
    `${WB}, index; Chapters 01–09; ${GUIDE}, "In this guide."`);
}

// ================================================================== 2 The route
{
  const s = slide(S0, "What", "The pilot's path through nine chapters");
  const tb = table(s, "Path", 1.45, [0.6, 4.5, 1.6, 5.45], ["#", "Scene", "Guide step", "What the pilot shows"], [
    ["1", "Internet Access, decided on a preview", "1", "A preview with no stated GCC availability; the interim path"],
    ["2", "A category the logs leave out", "2, 12", "The export and the diagnostic setting"],
    ["3", "One device behind the rest", "3", "Coverage and PC-PILOT-03"],
    ["4", "Sign-ins short of target; the first plan", "4", "91.2%, and a plan approved by its hash"],
    ["5", "Three failures the service carried", "7, 8", "Not ready to enforce; an unregistered partner"],
    ["6", "A Finance app that is a VPN again", "6, 10", "A /16 on every port; plain MFA on RDP"],
    ["7", "A bypass that expired", "5, 9", "Governed bypasses; a certificate near expiry"],
    ["8", "No-go, then Go", "11, 12", "The metrics, the ring exit, the evidence"],
    ["9", "The same commands, test then production", "11", "Preflight, smoke test, rollback, go/no-go"],
  ], { fontSize: 12, limit: 5.75 });
  line(s, "Shape", "Each scene: the story beat and what the kit does; a Try it with real output; a one-question check.", tb + 0.2, 0.4, 14);
  src(s, "Sources: workbook index, “Chapters”; Chapters 01–09; guide, “Where each topic lives,” run order.");
  speak(s, "The pilot's path through nine chapters",
    `Here's the route, in the guide's run order. Scene one: the pilot decides Internet Access on a feature whose GCC availability isn't stated. Scene two: the logs leave a category out. Scene three: one device is behind the rest. Scene four: sign-ins are short of the target, and the first change goes through a plan. Scene five: the compliant network policy isn't ready, and a partner tenant isn't registered. Scene six: a Finance app that's really a VPN again. Scene seven: an expired bypass and a certificate near expiry. Scene eight: the ring says no-go, then go. And scene nine runs the same commands in test, then production.`,
    `The guide's run order: 1, 2, 12 (logging only), 3, 4, 7, 8, 6, 10, 5, 9, 11, then 12 again for the evidence package. The workbook's chapters follow it, two per learning path module: Ch 01 and 02 (Module 1), 03 and 04 (Module 2), 05 (Module 3), 06 (Module 4), 07 (Module 5), 08 and the runbook 09 (Module 6). Each scene here uses the chapter's own Lab 1 on the pilot fixture, and the ring 1 fixture where the chapter does.`,
    `${WB}, index ("Chapters"); ${GUIDE}, "Where each topic lives."`);
}
endModule(S0);

// ================================================================== Scene 1 (Chapter 01)
const S1 = "Scene 1 — The decision";
{
  const s = slide(S1, "What", "Scene 1: Internet Access, decided on a preview");
  scene(s, [
    "The pilot adopts Internet Access with a decision record",
    "Its availability quote is 46 days old; its SKU has 25 units for 60 users",
    "It relies on the cloud firewall for clients to handle QUIC: a preview",
    "Learn states GCC availability for the product only; for a preview it is not yet specified",
  ], [
    "Reads licenses and onboarding with the least-privileged permissions",
    "config/availability.json: the guide's table, an interim path per preview",
    "GSA-DEC-07 fails a preview without an exception and names the interim path",
    "The fix: block QUIC with an Intune-delivered Windows Firewall rule",
  ], "WHAT THE KIT DOES (CHAPTER 01)", "Step 1 — PL-2, SA-9, CA-3: ",
  "each function decided, licensed, approved and honest about GCC. The policy owner signs; the ISSO keeps it.", { icon: "FaCloud" });
  src(s, "Sources: Learn, Known limitations; List subscribedSkus; Get tenantStatus. Ch 01, “The availability table,” “The decision checks.”");
  speak(s, "Scene 1: Internet Access, decided on a preview",
    `Scene one. The pilot's Internet Access decision record looks fine at a glance: adopted, approved. But its quote of Learn's availability sentence is forty-six days old, its SKU has twenty-five units for sixty users, and it counts on the cloud firewall for clients to handle QUIC. That's a preview. Learn says Global Secure Access is available in GCC for the product as a whole, so a preview's GCC availability is not yet specified. The kit doesn't assume it. Its availability table carries the guide's interim path, and the check that catches the preview names it: block QUIC with a Windows Firewall rule delivered by Intune.`,
    `Chapter 01: Learn's known limitations page states, for the whole product, that Global Secure Access is available in GCC; a preview feature's GCC availability is not yet specified. config/availability.json lists cloud-firewall-clients as not yet specified (preview), interim: block QUIC (outbound UDP 443) with an Intune-delivered Windows Firewall rule, piloted first (the guide's Step 5.6). GSA-DEC-03 (quote within 30 days), GSA-DEC-04 (licenses), GSA-DEC-07 (preview without an approved exception; the fix is the interim path). Reads: subscribedSkus with LicenseAssignment.Read.All; tenantStatus with NetworkAccessPolicy.Read.All. Requirements: PL-2, SA-9, CA-3; no KSI mapped to a decision record.`,
    `${WB}, Chapter 01, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S1, "Try it: check the decision records",
  "WORKBOOK CH 01, LAB 1, STEPS 4–5, IN examples/global-secure-access (PASSING ROWS LEFT OUT)",
  [...cap("01-6", [0, 13, 14, 16, 21, 25]), ...cap("01-7", [0, 1, 2, 3])],
  "four failures. The preview's fix is the guide's interim path, not “enable the preview.”",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 01, “Lab 1: fixtures, no tenant,” steps 4–5.",
  `Try it. From the kit's folder, check the pilot's four decision records. Four failures: the internet decision's stale quote, its short licenses and its preview feature, and the branch decision, which defers remote networks without naming what protects branches meanwhile. Then read the preview finding in full. Look at the fix. It isn't "enable the preview": it's the guide's interim path, piloted first and recorded in the architecture record.`,
  `Step 4: ./Invoke-GsaCheck.ps1 -Area decision -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/decision -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-decision -AsOf 2026-11-16T12:00:00Z: decision: 23 checks (4 Fail, 19 Pass): GSA-DEC-03, -04, -07 for NET-GSA-03 (internet), GSA-DEC-06 for NET-GSA-04 (branch, defer). Step 5: Import-Csv out/check-decision/findings.csv | Where-Object Id -EQ 'GSA-DEC-07' | Format-List Object, Detail, Fix. Long lines are cut on the slide.`,
  `${WB}, Chapter 01, "Lab 1: fixtures, no tenant," steps 4–5.`);
check(S1, 1, "Check 1: a preview in GCC",
  "Learn says Global Secure Access is available in GCC. What does the guide's table say about the cloud firewall for clients there?",
  ["Available, because the product is", "Not yet specified: it's a preview, and Learn's sentence covers the product", "Not available", "Available after onboarding"],
  `Check one. Learn says Global Secure Access is available in GCC. So what does the guide's table say about the cloud firewall for clients, a preview, in GCC? Available, because the product is? Not yet specified? Not available? Or available after onboarding? The answer opens the next scene.`,
  `Answer: B. Chapter 01 and the guide's availability table: Learn states availability for the product only; no feature page narrows or widens it; a preview feature's GCC availability is not yet specified. The kit fails a decision that relies on one without an approved exception, and names the interim path.`,
  `${WB}, Chapter 01, "What it leaves to you," "The availability table."`);
endModule(S1);

// ================================================================== Scene 2 (Chapter 02)
const S2 = "Scene 2 — Export and logs";
{
  const s = slide(S2, "What", "Scene 2: a category the logs leave out");
  scene(s, [
    "The guide's run order puts logging before the client: logs exist before anything is enforced",
    "The pilot's diagnostic setting sends three of the four network categories",
    "RemoteNetworkHealthLogs is off: when a branch joins, its health is never seen",
  ], [
    "One read-only collection: 17 calls, 24 reads, a SHA-256 per file",
    "Read-GsaCollection refuses a folder that changed after its manifest",
    "GSA-LOG-01 names any category not sent",
    "Connector reads need Directory.ReadWrite.All: sign out after",
  ], "WHAT THE KIT DOES (CHAPTER 02)", "Steps 2 and 12 — CM-2, CM-8, AU-2, AU-12: ",
  "the export as the baseline, and the logs before the pilot. The security monitor owns the setting.", { icon: "FaDatabase" });
  src(s, "Sources: Learn, Common operations (backup); logs; connector pages; Book 12, Ch 03. Ch 02, “The code.”");
  speak(s, "Scene 2: a category the logs leave out",
    `The answer to check one: not yet specified, because Learn's sentence covers the product, not the preview. Scene two. The guide runs logging before the client, so the logs exist before anything is enforced. The kit's collector reads the whole tenant in one read-only run: seventeen calls, twenty-four reads, every file hashed, and later steps refuse a collection that changed. The pilot's diagnostic setting looks right but sends only three of the four network categories. Remote network health is off. No branch is on a remote network yet, but when one is, its health would never reach the workspace.`,
    `Chapter 02: Learn's operations guidance is to back up the configuration as Graph JSON weekly and before every change; the collector is that export. Connector groups and members need Directory.ReadWrite.All, delegated only (no read-only permission). Traffic logs stay 30 days; the gsa-network-telemetry setting (microsoft.aadiam/diagnosticSettings, 2017-04-01) sends NetworkAccessTrafficLogs, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs and NetworkAccessAlerts. GSA-LOG-01 names any not sent. Requirements: CM-2, CM-8 (KSI-CNA-ULN, KSI-PIY-GIV); AU-2, AU-12 (KSI-MLA-OSM, KSI-MLA-LET).`,
    `${WB}, Chapter 02, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S2, "Try it: the baseline, and a changed file",
  "WORKBOOK CH 02, LAB 1, STEPS 4 AND 6 (LONG LINES CUT)",
  [...cap("02-6", [0, 1, 2, 3, 4, 5, 6, 8]), ...cap("02-8", [0, 1, 2, 3])],
  "the setting misses RemoteNetworkHealthLogs; one space added to one file, and the collection is refused.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 02, “Lab 1: fixtures, no tenant,” steps 4 and 6.",
  `Try it. Run the baseline checks on the pilot collection. Both connector groups are in the architecture record with two hosts, the forest is in the DNS suffixes, the workspace is named, the export is complete, and the one failure is the missing category. Then copy the collection, add one space to one file, and try to read it. The read is refused: the licenses file changed since its manifest. Every later chapter reads the collection through that check.`,
  `Step 4: ./Invoke-GsaCheck.ps1 -Area baseline ...: GSA-ARC-01 Pass (CG-HQ, CG-Cloud-East, 2 hosts each), GSA-ARC-02 Pass, GSA-ARC-03 Pass, GSA-LOG-01 Fail not sent: RemoteNetworkHealthLogs, GSA-ARC-04 Pass. Step 6: Copy-Item -Recurse out/pilot out/tampered; Add-Content ... raw/licenses.json -Value ' '; Read-GsaCollection -Path out/tampered: Exception: Collection out/tampered doesn't match its manifest: raw/licenses.json changed since its manifest.`,
  `${WB}, Chapter 02, "Lab 1: fixtures, no tenant," steps 4 and 6.`);
check(S2, 2, "Check 2: when the logs come",
  "In the guide's run order, when is the network diagnostic setting turned on?",
  ["After the pilot, once there's traffic", "Before the client, so logs exist before anything is enforced", "At ring 3, with the CISA agreement", "Only if a finding needs it"],
  `Check two. In the guide's run order, when is the network diagnostic setting turned on? After the pilot, once there's traffic? Before the client, so the logs exist before anything is enforced? At ring 3, with the CISA agreement? Or only when a finding needs it?`,
  `Answer: B. The guide's run order is 1, 2, 12 (logging only), 3, 4, 7, 8, 6, 10, 5, 9, 11, then 12 again for the evidence package. The runbook's preflight PF-04 fails without the setting.`,
  `${WB}, Chapter 02, opening; Chapter 09, Step 2; ${GUIDE}, run order.`);
endModule(S2);

// ================================================================== Scene 3 (Chapter 03)
const S3 = "Scene 3 — The client";
{
  const s = slide(S3, "What", "Scene 3: one device behind the rest");
  scene(s, [
    "The service sees 15 active devices of the 18 Intune puts in scope: 83.3% against 98%",
    "PC-PILOT-03 runs an old client, prefers IPv6, and Chrome still uses DNS over HTTPS",
    "PC-PILOT-04 is disconnected",
    "Every later policy assumes the client is there",
  ], [
    "A read-only device script records each device's Validate values",
    "Coverage divides the service's count by Intune's in-scope count",
    "Hardening is information in the pilot, a check from ring 2",
    "Exclusions live in the register with owner and expiry",
  ], "WHAT THE KIT DOES (CHAPTER 03)", "Step 3 — CM-6, CM-7, SI-4: ",
  "managed devices carry the client and, from ring 2, can't silently turn it off. The endpoint engineer owns it.", { icon: "FaLaptop" });
  src(s, "Sources: Learn, Install the client for Windows; getDeviceUsageSummary; Known limitations. Ch 03, “The code.”");
  speak(s, "Scene 3: one device behind the rest",
    `The answer to check two: before the client, so the logs exist before anything is enforced. Scene three. Every later policy assumes the client is on the device, connected, current and hard to turn off. The service sees fifteen active devices, but Intune says eighteen are in scope, so coverage is eighty-three percent against a target of ninety-eight. One device, pilot 3, runs an old client, prefers IPv6, and Chrome still uses DNS over HTTPS. Pilot 4 is disconnected. The kit's device script records each device's values without changing anything, and hardening waits for ring 2, as Learn advises.`,
    `Chapter 03: getDeviceUsageSummary (beta) with NetworkAccessPolicy.Read.All returns totalDeviceCount, activeDeviceCount, inactiveDeviceCount. GSA-CLI-01 divides activeDeviceCount by inScopeDevices (from Intune) against targets.clientCoverage. GSA-CLI-02 minimum version (1.8.239.0, Universal CAE); GSA-CLI-03 DisabledComponents 0x20; GSA-CLI-04 DNS over HTTPS off; GSA-CLI-05 Connected; GSA-CLI-06 hardening from ring 2 (Learn: let users run unrestricted first); GSA-CLI-07 exclusions governed. tools/Get-GsaClientState.ps1 reads only. Requirements: CM-6, CM-7, SI-4; KSI-MLA-EVC, KSI-CNA-RNT.`,
    `${WB}, Chapter 03, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S3, "Try it: coverage and the four devices",
  "WORKBOOK CH 03, LAB 1, STEP 4 (PASSING AND INFORMATION ROWS LEFT OUT; LONG LINES CUT)",
  cap("03-6", [0, 1, 12, 13, 14, 20, 22, 24]),
  "83.3% coverage; PC-PILOT-03 fails three checks, PC-PILOT-04 one; the Hyper-V exclusion is governed.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 03, “Lab 1: fixtures, no tenant,” step 4.",
  `Try it. Run the client checks. Coverage fails at eighty-three point three percent. Pilot 3 fails three checks: the old client, IPv6 preferred, and DNS over HTTPS left on in Chrome. Pilot 4 fails on health: disconnected. And the one client exclusion, a lab machine with a Hyper-V external switch, passes, because it has an owner, an approver and an expiry. The pilot isn't ready to exit, and Scene eight will say so.`,
  `Step 4: ./Invoke-GsaCheck.ps1 -Area client ...: GSA-CLI-01 Fail 15 active of 18 in-scope devices (83.3%), target 98%; PC-PILOT-03 GSA-CLI-02 Fail client 1.7.669.0, minimum 1.8.239.0; GSA-CLI-03 Fail DisabledComponents = 0x0; GSA-CLI-04 Fail DNS over HTTPS not off in Chrome; PC-PILOT-04 GSA-CLI-05 Fail Disconnected; GSA-CLI-07 Pass EX-06; client: 22 checks (5 Fail, 4 Info, 13 Pass).`,
  `${WB}, Chapter 03, "Lab 1: fixtures, no tenant," step 4.`);
check(S3, 3, "Check 3: hardening in the pilot",
  "Learn advises letting users run the client unrestricted first. What does the kit do with the hardening values in the pilot?",
  ["Fails every device without them", "Reports them as information, and checks them from ring 2", "Applies them automatically", "Ignores them in every ring"],
  `Check three. Learn advises letting users run the client unrestricted first, and restricting later. So what does the kit do with the four hardening values during the pilot? Fail every device without them? Report them as information, and check them from ring 2? Apply them automatically? Or ignore them in every ring?`,
  `Answer: B. Chapter 03: GSA-CLI-06 is Info in the pilot and a check from ring 2; the guide deploys the remediation from ring 2, not in the pilot. Lab 1 step 5 shows three devices failing when the same records are checked as ring 2.`,
  `${WB}, Chapter 03, "What it leaves to you," "Lab 1," step 5.`);
endModule(S3);

// ================================================================== Scene 4 (Chapter 04)
const S4 = "Scene 4 — Microsoft traffic";
{
  const s = slide(S4, "What", "Scene 4: sign-ins short of target; the first plan");
  scene(s, [
    "The Microsoft traffic profile and signaling are on",
    "2,555 of 2,800 sign-ins in a week went through the service: 91.2% against 95%",
    "The pilot's desired state hasn't adopted Internet Access, but its profile is on",
    "The first write needs a plan a second person approves",
  ], [
    "GSA-MS-03 sums the guide's sign-in query over the week",
    "plan.json: each request, its reason, the file's SHA-256",
    "Signaling first; new policies report-only; emergency always excluded",
    "-Apply needs the hash, a live collection and a delegated session",
  ], "WHAT THE KIT DOES (CHAPTER 04)", "Step 4 — AC-17, AU-3, SI-4, CM-3: ",
  "Microsoft traffic carried with its real source address, and every change approved by its hash.", { icon: "FaLock" });
  src(s, "Sources: Learn, Microsoft traffic profile; source IP restoration; settings; Common operations. Ch 04, “The code.”");
  speak(s, "Scene 4: sign-ins short of target; the first plan",
    `The answer to check three: information in the pilot, a check from ring 2. Scene four. The Microsoft traffic profile and signaling are on. Signaling is source IP restoration and the signal Conditional Access needs. But only ninety-one percent of the week's sign-ins went through the service, against ninety-five. And the internet profile is on, though the pilot's desired state hasn't adopted Internet Access yet. Fixing that is the first write, so it goes through a plan: a file listing each request and its reason, with a hash a second person approves before anything is sent.`,
    `Chapter 04: the Microsoft traffic profile acquires Microsoft 365 and Entra ID traffic; signaling (signalingStatus) is source IP restoration and the Conditional Access signal; Learn: turning it off while policies depend on it can block users; enabling a new traffic profile is a major change. GSA-MS-03 sums the sign-in query's seven days against targets.signinShare (95%). New-GsaPlan: signaling, profiles, policies, tagging; assignments as manual steps; guards: report-only, emergency exclusion, tagging after a blocking TRv2 default, drifted policies back to their files. Invoke-GsaPlanSteps -Apply refuses unless live, delegated, in the settings' tenant, with the approved SHA-256. Requirements: AC-17, AU-3, SI-4; CM-3, CM-4.`,
    `${WB}, Chapter 04, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S4, "Try it: the traffic checks and the pilot's plan",
  "WORKBOOK CH 04, LAB 1, STEPS 3 AND 5 (MAN-ASSIGN LINES LEFT OUT; LONG LINES CUT)",
  [...cap("04-5", [0, 1, 2, 3, 7]), ...cap("04-7", [0, 1, 2, 6, 7])],
  "91.2% fails; the plan turns the internet profile off and restores the RDP policy, and changes nothing yet.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 04, “Lab 1: fixtures, no tenant,” steps 3 and 5.",
  `Try it. Run the traffic checks: the profile passes, signaling passes, and the sign-in share fails at ninety-one point two percent. Then plan the pilot from its desired state. Two Graph steps: the internet profile goes off, and the administrator RDP policy goes back to its reviewed file, which Scene six explains. The plan's hash is printed, and it's a dry run: nothing changed. In fixture mode, applying it is refused outright.`,
  `Step 3: ./Invoke-GsaCheck.ps1 -Area traffic ...: GSA-MS-01 Pass, GSA-MS-02 Pass, GSA-MS-03 Fail 2555 of 2800 sign-ins in 7 days (91.2%), target 95%; traffic: 5 checks (1 Fail, 4 Pass). Step 5: ./Invoke-GsaPlan.ps1 ... -DesiredPath config/desired.lab.json -OutputPath out/plan: PL-01 WouldApply PATCH internet profile enabled -> disabled; PL-02 WouldApply PATCH NET-PA-AdminRDP-PhishingResistant; Plan SHA-256 2777f111…; Dry run: nothing changed. Step 7 (not shown): -Apply in fixture mode is refused: -Apply runs only with a live invoker.`,
  `${WB}, Chapter 04, "Lab 1: fixtures, no tenant," steps 3, 5 and 7.`);
check(S4, 4, "Check 4: applying a plan",
  "What does Invoke-GsaPlan.ps1 -Apply need before it sends anything?",
  ["Only the -Apply switch", "The approved SHA-256, a live collection and a delegated session in the settings' tenant", "A Global Administrator", "A fixture folder"],
  `Check four. What does the plan script need before it sends anything with the apply switch? Only the switch? The approved hash, a live collection and a delegated session in the right tenant? A Global Administrator? Or a fixture folder?`,
  `Answer: B. Chapter 04: Invoke-GsaPlanSteps with -Apply refuses unless the collection was read live, the Graph session is the settings' tenant and delegated, and -ApprovedSha256 equals the plan file's hash; then it sends each step in order and stops at the first error.`,
  `${WB}, Chapter 04, "The plan."`);
endModule(S4);

// ================================================================== Scene 5 (Chapter 05)
const S5 = "Scene 5 — Compliant network";
{
  const s = slide(S5, "What", "Scene 5: three failures the service carried");
  scene(s, [
    "The compliant network policy has been report-only for 10 business days, built right",
    "41 report-only failures came from users off the service: what the policy is for",
    "3 came from users on the service: defects to fix before enforcing",
    "And one partner tenant is allowed by TRv2 with no register entry",
  ], [
    "GSA-CN-06: ready only after 10 business days with no failure carried by the service",
    "The plan won't enforce without -AllowEnforce",
    "GSA-TR-02: every partner allowance registered and owned",
    "Tagging waits for a blocking TRv2 default",
  ], "WHAT THE KIT DOES (CHAPTER 05)", "Steps 7 and 8 — AC-3, AC-12, SC-23, AC-20: ",
  "sign-in bound to the agency's path, and devices limited to approved tenants. The policy owner decides enforcement.", { icon: "FaShieldHalved" });
  src(s, "Sources: Learn, compliant network check; tutorial; Universal Tenant Restrictions; TRv2 default. Ch 05, “The code.”");
  speak(s, "Scene 5: three failures the service carried",
    `The answer to check four: the approved hash, a live collection, and a delegated session in the right tenant. Scene five. The compliant network policy is built right, and it has been in report-only for ten business days. In that time, forty-one sign-ins would have been blocked from users off the service, which is exactly what the policy is for. But three would have been blocked for users on the service. Those are defects, and the policy isn't ready to enforce. The plan won't enforce it without an explicit switch the policy owner passes. And one partner tenant is allowed by the tenant restrictions policy with nobody's name on it.`,
    `Chapter 05: Learn's example policy blocks all resources outside All Compliant Network locations, excludes Microsoft Intune Enrollment and Microsoft Intune, and emergency access; the kit's file is report-only. GSA-CN-06: 10 business days since creation and no reportOnlyFailure with Through true (the guide's defect rule); the plan's MAN-ENF line until -AllowEnforce. GSA-TR-01 a blocking default; GSA-TR-02 each partner allowance in the exception register with an owner and a review date; GSA-TR-03 tagging only with a blocking default. Requirements: AC-3, AC-12, SC-23 (KSI-IAM-ELP, KSI-CNA-ULN, KSI-IAM-APM); AC-20, AC-20(1), AC-4 (KSI-IAM-ELP, KSI-CNA-MAT).`,
    `${WB}, Chapter 05, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S5, "Try it: not ready, and the plan holds it",
  "WORKBOOK CH 05, LAB 1, STEPS 3, 4 AND 6 (PASSING AND MANUAL LINES LEFT OUT; LONG LINES CUT)",
  [...cap("05-5", [0, 6]), ...cap("05-6", [0, 1, 2, 3, 4, 5]), ...cap("05-8", [0, 2, 8])],
  "three failures with Through true: not ready. The ring 1 plan leaves the policy report-only (MAN-ENF).",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 05, “Lab 1: fixtures, no tenant,” steps 3, 4 and 6.",
  `Try it. Check the compliant network policy: built right, ten business days in report-only, and three failures carried by the service, so not ready. Read the guide's report-only query: eighteen hundred thirty successes, forty-one failures off the service, three on it. Then plan ring 1, whose desired state wants the policy enforced. The plan leaves it report-only and says why on a manual line: enforcing needs the switch, after the results are clean.`,
  `Step 3: GSA-CN-06 Info: report-only for 10 business days; 3 failures carried by the service: not ready to enforce. Step 4: reportOnlySuccess true 1830; reportOnlyFailure false 41; reportOnlyFailure true 3. Step 6: ./Invoke-GsaPlan.ps1 ... -DesiredPath config/desired.ring1.json: MAN-ENF Manual: NET-CN-Require-Compliant-Network-Pilot stays report-only: enforcing it needs -AllowEnforce after its report-only results are clean; Dry run: nothing changed.`,
  `${WB}, Chapter 05, "Lab 1: fixtures, no tenant," steps 3, 4 and 6.`);
check(S5, 5, "Check 5: which failures matter",
  "In report-only, which compliant network failures are defects to fix before enforcing?",
  ["Every failure", "Failures with Through false: users off the service", "Failures with Through true: users the service carried", "None: report-only can't fail"],
  `Check five. In report-only, which compliant network failures are defects to fix before enforcing? Every failure? Failures with through false, users off the service? Failures with through true, users the service carried? Or none, because report-only can't fail?`,
  `Answer: C. The guide's Step 7: a non-zero reportOnlyFailure count with Through == "true" is a defect to fix before enforcement; failures with Through false are users off the agency's path, which is what the policy is for (either an attack or a broken client, which the security monitor watches).`,
  `${WB}, Chapter 05, "Lab 1," step 4; ${GUIDE}, Step 7.`);
endModule(S5);

// ================================================================== Scene 6 (Chapter 06)
const S6 = "Scene 6 — Private apps";
{
  const s = slide(S6, "What", "Scene 6: a Finance app that is a VPN again");
  scene(s, [
    "PA-Finance is published as 10.20.0.0/16 on every port, assigned to a person",
    "Its enforced policy doesn't exclude the emergency access group",
    "Every port includes RDP, so it is an administrative path with plain MFA",
    "PA-AdminRDP-Tier1 asks only for MFA; one cloud connector group has one active connector",
  ], [
    "PA-04, -05: narrow, non-overlapping segments",
    "PA-06: group assignments only; PA-07: the emergency exclusion",
    "PA-08: RDP and SSH need the phishing-resistant strength and a compliant device",
    "PA-01, -02: two active, current connectors per group",
  ], "WHAT THE KIT DOES (CHAPTER 06)", "Steps 6 and 10 — AC-3, AC-6, IA-2(1), AC-6(9): ",
  "each app one host and its ports for one group; admin paths phishing-resistant.", { icon: "FaServer" });
  src(s, "Sources: Learn, Private Access tutorial; per-app access; connectors; Zero Trust: Protect networks. Ch 06, “The code.”");
  speak(s, "Scene 6: a Finance app that is a VPN again",
    `The answer to check five: failures the service carried. Scene six. Private Access is meant to give a group one application on its ports. The pilot's Finance app is a slash sixteen on every port, assigned to one person, under an enforced policy that doesn't exclude emergency access. Every port includes RDP, so it's also an administrative path with plain MFA. That's the VPN again, under a new name. The RDP app asks only for MFA too, and one cloud connector group has a single active connector. The plan from Scene four brings the RDP policy back to its reviewed file: the phishing-resistant strength and a compliant device.`,
    `Chapter 06: GSA-PA-04 fails a range wider than /24 or ports 1-65535; GSA-PA-06 group assignments only; GSA-PA-07 a NET-PA- policy excluding the emergency group; GSA-PA-08 any app covering 22 or 3389 needs strength 00000000-0000-0000-0000-000000000004 and a compliant device; GSA-PA-01, -02 connector resilience; GSA-PA-03 Quick Access residual. The administrative policy file is the guide's Step 10.2 policy; the plan's ca-update step restores it. Requirements: AC-3, AC-6, AC-17(3); IA-2(1), IA-2(2), AC-6(9); KSI-IAM-ELP, KSI-CNA-ULN, KSI-CNA-MAT, KSI-IAM-APM.`,
    `${WB}, Chapter 06, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S6, "Try it: the private access checks",
  "WORKBOOK CH 06, LAB 1, STEP 4 (PASSING ROWS LEFT OUT; LONG LINES CUT)",
  cap("06-6", [0, 3, 4, 8, 9, 10, 11, 15, 16, 19]),
  "seven failures, one warning: Finance is a VPN range; the RDP app lacks the strength; Quick Access isn't empty.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 06, “Lab 1: fixtures, no tenant,” step 4.",
  `Try it. Run the private access checks. The cloud connector group has one of two connectors active, and the active one is old. Finance fails four ways: the wide segment, the direct assignment, the missing emergency exclusion, and an administrative path without the phishing-resistant strength. The RDP app fails the same strength check. And Quick Access still holds two segments. Two weeks later, in the workbook, every one of these passes.`,
  `Step 4: ./Invoke-GsaCheck.ps1 -Area private-access ...: GSA-PA-01 Fail CG-Cloud-East 1 of 2 active; GSA-PA-02 Fail below 1.5.4522.0; PA-Finance GSA-PA-04 Fail 10.20.0.0/16 ports 1-65535, GSA-PA-06 Fail 0 group and 1 direct, GSA-PA-07 Fail emergency group NOT excluded, GSA-PA-08 Fail; PA-AdminRDP-Tier1 GSA-PA-08 Fail; GSA-PA-03 Warn 2 segments; private-access: 17 checks (7 Fail, 1 Info, 8 Pass, 1 Warn). Step 6 (ring 1): 16 checks, 15 Pass, 1 Info.`,
  `${WB}, Chapter 06, "Lab 1: fixtures, no tenant," steps 4 and 6.`);
check(S6, 6, "Check 6: an administrative path",
  "An app's segment covers port 3389. What does the kit require of its Conditional Access policy?",
  ["MFA", "The phishing-resistant strength and a compliant device", "A trusted location", "Nothing extra"],
  `Check six. An application's segment covers port 3389, RDP. What does the kit require of its Conditional Access policy? MFA? The phishing-resistant authentication strength and a compliant device? A trusted location? Or nothing extra?`,
  `Answer: B. Chapter 06: GSA-PA-08: any app whose segment covers 22 or 3389 needs the built-in phishing-resistant strength 00000000-0000-0000-0000-000000000004 and a compliant device, as the guide's Step 10.2 policy sets them.`,
  `${WB}, Chapter 06, "The code"; ${GUIDE}, Step 10.`);
endModule(S6);

// ================================================================== Scene 7 (Chapter 07)
const S7 = "Scene 7 — Web and TLS";
{
  const s = slide(S7, "What", "Scene 7: a bypass that expired");
  scene(s, [
    "The pilot's security profile blocks the acceptable-use categories; threat intelligence is on",
    "QUIC is blocked by the interim path, an Intune firewall rule: the preview isn't assumed",
    "But bypass EX-03 expired on November 1, and EX-04 has no approver",
    "The inspection certificate has 74 days left; 1.5% of sessions failed",
  ], [
    "GSA-IA-04: every bypass owned, approved, unexpired",
    "GSA-IA-05: the interim QUIC block recorded",
    "GSA-TLS-01: over 90 days left; six months' validity",
    "GSA-TLS-02, -06: a dedicated CA; failures under 1%",
  ], "WHAT THE KIT DOES (CHAPTER 07)", "Steps 5 and 9 — SC-7(5), SI-3, SC-8, SC-17: ",
  "identity-aware filtering with governed exceptions, and inspection within an approved privacy scope.", { icon: "FaFilter" });
  src(s, "Sources: Learn, Internet Access tutorial; limits; TLS policies; own certificate; TLS tutorial; Zero Trust. Ch 07, “The code.”");
  speak(s, "Scene 7: a bypass that expired",
    `The answer to check six: the phishing-resistant strength and a compliant device. Scene seven. The pilot's web filtering works: the acceptable-use categories and threat intelligence are blocked, and QUIC is blocked by the guide's interim path, an Intune firewall rule, because the preview firewall's GCC availability isn't stated. But two exceptions slipped. One bypass expired on November first, and another has no approver. And TLS inspection is in trouble: the certificate has seventy-four days left, inside the ninety-day renewal window, and one and a half percent of sessions failed. The issuer, at least, is a dedicated inspection authority.`,
    `Chapter 07: GSA-IA-04 each custom bypass owned, approved and unexpired (Learn: set an expiration or review date); GSA-IA-05 QUIC blocked by the interim path while the cloud firewall for clients (preview) has no stated GCC availability; GSA-TLS-01 more than 90 days left and at least six months' validity (Learn: renew 90 days ahead; an expired certificate disables all inspection); GSA-TLS-02 not an authentication CA (Learn: a dedicated CA, not the production PKI); GSA-TLS-06 failures under 1% (Microsoft: above 1% is systemic). Requirements: SC-7, SC-7(5), SI-3 (KSI-CNA-ULN, KSI-CNA-RNT, KSI-CNA-MAT); SC-8, SC-12, SC-17, SI-4 (KSI-SVC-SIN, KSI-SVC-ASM, KSI-CNA-MAT).`,
    `${WB}, Chapter 07, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S7, "Try it: bypasses and the TLS checks",
  "WORKBOOK CH 07, LAB 1, STEPS 4 AND 6 (PASSING ROWS LEFT OUT; LONG LINES CUT)",
  [...cap("07-6", [0, 4, 5, 6, 9]), ...cap("07-8", [0, 1, 4, 6, 8])],
  "two bypasses fail; QUIC's interim block passes; the certificate, the payroll bypass and the failure share fail.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 07, “Lab 1: fixtures, no tenant,” steps 4 and 6.",
  `Try it. Run the Internet Access checks: the two bypasses fail, and the QUIC check passes on the interim block, with the preview's GCC state written into the finding. Then the TLS checks: the certificate fails on both counts, the pinned payroll site's bypass is the expired one, and the failure share is one and a half percent against a threshold of one. Two weeks later the certificate has been rolled, the bypasses renewed and approved, and all thirteen checks pass.`,
  `Step 4: GSA-IA-04 Fail EX-03 *.payroll-partner.example expires 2026-11-01 (expired); GSA-IA-04 Fail EX-04 approver none; GSA-IA-05 Pass QUIC: cloud firewall for clients: GCC not yet specified (preview); interim block: Intune firewall rule NET-QUIC-Block-UDP443, assigned to pilot. Step 6: GSA-TLS-01 Fail 74 days left; valid for 90 days in all (Learn: at least six months); GSA-TLS-05 Fail custom bypass is EX-03, expires 2026-11-01; GSA-TLS-06 Fail 1.5% of 10000 sessions; tls: 6 checks (3 Fail, 3 Pass). Step 7 (ring 1): 13 checks, 13 Pass.`,
  `${WB}, Chapter 07, "Lab 1: fixtures, no tenant," steps 4, 6 and 7.`);
check(S7, 7, "Check 7: the inspection certificate",
  "Learn says an expired inspection certificate disables all TLS inspection. When does the kit fail the certificate?",
  ["On the day it expires", "With 90 days or fewer left, or less than six months' validity", "Only after inspection stops", "Never: renewal is manual"],
  `Check seven. Learn says an expired inspection certificate disables all TLS inspection across the tenant. When does the kit fail the certificate? On the day it expires? With ninety days or fewer left, or less than six months' validity? Only after inspection stops? Or never, because renewal is manual?`,
  `Answer: B. Chapter 07: GSA-TLS-01 fails a certificate with 90 days or fewer left (Learn: renew at least 90 days ahead) or one issued for less than six months (Learn: at least six months' validity).`,
  `${WB}, Chapter 07, "The code," "Verified facts."`);
endModule(S7);

// ================================================================== Scene 8 (Chapter 08)
const S8 = "Scene 8 — Rings and evidence";
{
  const s = slide(S8, "What", "Scene 8: No-go, then Go");
  scene(s, [
    "November 16: the pilot is five business days in, with a Sev-2 open",
    "Coverage 83.3%; three report-only defects; TLS failures 1.5%",
    "November 30, ring 1: every fix from Scenes 1 to 7 is in",
    "Every metric is met, every exit criterion passes: Go",
  ], [
    "Eight metrics from one collection, each with a target",
    "Eight exit criteria from the guide's ring table",
    "A rollback plan in the guide's order, signaling last",
    "Hashed, chained evidence: the ZTA closure register's ready-for-closure evidence",
  ], "WHAT THE KIT DOES (CHAPTER 08)", "Steps 11 and 12 — CM-3, CM-4, CP-2, AU-9: ",
  "each ring exits on measured criteria, with a rollback ready and every run verifiable.", { icon: "FaChartLine" });
  src(s, "Sources: Learn, logs; security operations; deployment guide; CISA TIC 3.0 Remote User. Ch 08, “The code”; examples/zta-results.");
  speak(s, "Scene 8: No-go, then Go",
    `The answer to check seven: with ninety days or fewer left, or less than six months' validity. Scene eight. On November sixteenth, the pilot is measured against the guide's exit criteria. Five business days in, one severity-two ticket open, eighty-three percent coverage, three report-only defects, and one and a half percent TLS failures: no-go. Two weeks later, ring 1 has every fix from the last seven scenes in place. Every metric is met, every criterion passes, and the ring says go. Before it moves on, its rollback is planned in the guide's order, and every run is recorded as evidence that the Zero Trust Assessment's closure register can point to.`,
    `Chapter 08: Get-GsaMetrics (client coverage, sign-ins through the service, compliant network enforcement, Private Access least privilege, connector resilience, bypass exposure, TLS health, telemetry freshness); Test-GsaRingExit RX-01 to RX-08 (time in ring, Sev-2, help desk, coverage 100%, clean report-only, TLS under 1%, emergency exclusion tested at ring start, break-glass rehearsed). New-GsaRollbackPlan: enforced NET- policies to report-only (Steps 10, 7, 6, 5), links and groups (portal), tagging off, VPN route, signaling last on request. Write-GsaEvidence: controls and KSIs per step, SHA-256 per file and of the previous record. Reused: examples/zta-results's network-access finding family points at the guide; this evidence is that register's ready-for-closure evidence. Requirements: CM-3, CM-4, CP-2; AU-2, AU-6, AU-9, AU-12, SI-4.`,
    `${WB}, Chapter 08, "Start with Microsoft's documentation," "The code."`);
}
tryIt(S8, "Try it: the pilot's exit, then ring 1's",
  "WORKBOOK CH 08, LAB 1, STEPS 3 AND 4 (METRIC ROWS LEFT OUT; LONG LINES CUT)",
  [...cap("08-5", [11, 12, 14, 15, 16, 19]), ...cap("08-6", [33, 36, 37, 40, 42])],
  "No-go for the pilot, with each reason; Go for ring 1, every criterion passing.",
  "Sources: kit fixtures (fictional), captured output. Workbook Ch 08, “Lab 1: fixtures, no tenant,” steps 3–4.",
  `Try it. Compute the pilot's metrics and exit. The failing criteria are on the slide: time in the ring, the open severity-two, coverage, the report-only defects, and the TLS failures. Pilot: no-go. Then the same for ring 1, two weeks later: time in the ring passes at ten business days, coverage is a hundred percent, report-only is clean, the emergency exclusion was tested on the ring's start date, and the ring says go.`,
  `Step 3: ./Invoke-GsaMetrics.ps1 ... (pilot): RX-01 Fail 5 business days since 2026-11-09 (needs 10); RX-02 Fail 1 unresolved; RX-04 Fail 83.3%; RX-05 Fail 3 report-only failures carried by the service; RX-06 Fail 1.50% failures, 74 days to expiry; Ring pilot: No-go. Step 4 (ring 1): RX-01 Pass 10 business days since 2026-11-16; RX-04 Pass 100.0%; RX-05 Pass 0 report-only failures; RX-07 Pass tested 2026-11-16; Ring ring1: Go, every exit criterion passes. (RX-03, -07 and -08 pass in the pilot; other ring 1 rows pass.)`,
  `${WB}, Chapter 08, "Lab 1: fixtures, no tenant," steps 3–4.`);
check(S8, 8, "Check 8: signaling in a rollback",
  "A ring is rolled back. Where does turning signaling off come in the guide's order?",
  ["First, to stop the policies", "Last, only after no policy depends on it", "Never", "With tagging"],
  `Check eight. A ring is being rolled back. Where does turning signaling off come in the guide's order? First, to stop the policies? Last, only after no policy depends on it? Never? Or together with tagging?`,
  `Answer: B. The guide's rollback order: Conditional Access policies from Steps 10, 7, 6 and 5 to report-only; security profile links removed; tagging disabled; groups removed from the profiles; the VPN route restored; signaling disabled only after no policy depends on it. The kit adds signaling only with -DisableSignaling, and refuses it while a compliant network policy would stay enforced.`,
  `${WB}, Chapter 08, "The rollback plan"; ${GUIDE}, "Rollback."`);
endModule(S8);

// ================================================================== Scene 9 (Chapter 09)
const S9 = "Scene 9 — Test, then production";
{
  const s = slide(S9, "What", "Scene 9: the same commands, test then production");
  scene(s, [
    "Ring 1 goes live in a test tenant first, then production",
    "One settings file per environment; the commands don't change",
    "Preflight before any change: logs, emergency exclusion, approved decisions",
    "Production starts only when the test stage's evidence passes",
  ], [
    "PF-01 to PF-06, read only; any Fail stops the stage",
    "Staged enable from a plan approved by its hash",
    "Smoke test: every check and the ring exit; Go or No-go",
    "-Check -Stage: the stage's evidence complete",
  ], "WHAT THE KIT DOES (CHAPTER 09)", "Step 11 — CM-3, CM-4, CP-2: ",
  "each stage preflighted, planned, smoke-tested, rolled back if needed, and evidenced. Not run against a live tenant.", { icon: "FaRoute" });
  src(s, "Sources: Learn, Common operations (change categories). Ch 09, Steps 1–9.");
  speak(s, "Scene 9: the same commands, test then production",
    `The answer to check eight: last, only after no policy depends on it. Scene nine. Ring 1 goes live, in a test tenant first and then production, with one settings file per environment and the same commands. Before any change, a read-only preflight checks the stage, the collection, the emergency group's exclusion from every network policy, the logs, and the approved decisions. The ring is enabled from a plan approved by its hash, smoke-tested after its exit period, and rolled back from a plan written before it started if a trigger fires. Production starts only when the test stage's evidence passes. The runbook hasn't been run against a live tenant.`,
    `Chapter 09: Step 1 one settings file per environment (Read-GsaSettings refuses secrets and leftover placeholders); Step 2 collect and preflight (PF-01 stage, PF-02 manifest and tenant, PF-03 emergency exclusion in every NET- policy, PF-04 the diagnostic setting, PF-05 approved decisions, PF-06 production: the test evidence passes); Step 3 rollback planned before the ring; Step 4 staged enable from an approved plan, manual assignments, the Intune client widened; Step 5 smoke test (every area's checks and the ring exit); Step 6 backout triggers; Step 7 evidence with -Check -Stage; Step 8 go/no-go; Step 9 production ring by ring. Enabling a new traffic profile is a major change (Learn).`,
    `${WB}, Chapter 09, Steps 1–9.`);
}
{
  const s = slide(S9, "How", "Try it: the runbook's fixture run");
  const cb = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Step 2, test preflight (fixture mode, November 17, 2026; the ring 1 fixture)",
    "PF-03  Pass  emergency group excluded from all 5 NET- policies",
    "PF-04  Pass  gsa-network-telemetry exists",
    "Preflight (test): 5 checks, 0 failed. Written to out/deploy-test/preflight",
    "# Step 5, smoke test",
    "Checks: 100 run, 0 fail",
    "Ring ring1: Go. Written to out/deploy-test/smoke",
    "# Step 7, the test stage's evidence",
    "CHAIN           Pass  5 records, chain unbroken",
    "STEP-SMOKE      Pass  a passing record covers it",
    "# Step 9, production preflight",
    "PF-06  Pass  the test stage's evidence passes",
    "Preflight (production): 6 checks, 0 failed. Written to out/deploy-prod/preflight",
  ], { label: "WORKBOOK CH 09, FIXTURE OUTPUT AS THE PAGE PRINTS IT (SELECTED LINES)", pt: 11 });
  callout(s, "Read", cb + 0.2, 0.85, "FaListCheck", HEX.teal, "Read it: ", "the test stage's evidence passes, so the production preflight's PF-06 passes, and production can start.");
  src(s, "Sources: Workbook Ch 09, Steps 2, 5, 7 and 9 (output as the page prints it, fixture mode, Nov 17, 2026).");
  speak(s, "Try it: the runbook's fixture run",
    `Try it. The runbook's own fixture run, the fictional tenant at ring 1. The test preflight passes, including the emergency exclusion from all five network policies and the diagnostic setting. The smoke test runs a hundred checks, none fail, and the ring says go. The test stage's evidence forms an unbroken chain, with a passing record for every step the stage needs. And so the production preflight's last check, which reads that evidence, passes too.`,
    `Chapter 09's fixture output (November 17, 2026; tests/fixtures/settings.test.json, settings.production.json and ring1): test preflight PF-01 to PF-05 Pass; rollback RB-01 to RB-04 WouldApply with manual lines; smoke test Checks: 100 run, 0 fail, RX-01 to RX-08 Pass, Ring ring1: Go; evidence SUMS Pass 39 files, CHAIN Pass 5 records, STEP-PRE, -BASELINE, -PLAN, -SMOKE, -RB Pass; production preflight PF-01 to PF-06 Pass. The same sequence is a Pester test (tests/Deploy.Tests.ps1).`,
    `${WB}, Chapter 09, Steps 2, 5, 7 and 9.`);
}
check(S9, 9, "Check 9: production before test passes",
  "An operator runs the production preflight before the test stage's evidence passes. What happens?",
  ["It passes; the stages are independent", "PF-06 fails: production needs the test evidence", "It warns, and the operator decides", "The plan applies anyway"],
  `Check nine, the last one. An operator runs the production preflight before the test stage's evidence passes. Does it pass anyway, fail on the check that reads the test evidence, warn and let the operator decide, or apply the plan regardless?`,
  `Answer: B. Chapter 09: PF-06 (production only) requires the test stage's evidence to pass -Check -Stage test. Danger: production before the test stage's evidence is complete; the guard is PF-06.`,
  `${WB}, Chapter 09, Step 2, Step 8, "Dangers."`);
endModule(S9);

// ================================================================== Close
const SC = "Close";
{
  const s = slide(SC, "How", "Your turn: Lab 2, and where to go next");
  const pl = panel(s, "Lab2", 0.6, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "LAB 2: YOUR OWN TEST TENANT", null, [
    "A test tenant (worldwide or GCC for learning), never production",
    "Entra ID P1; trial Internet Access and Private Access, or the Suite",
    "A pilot group of fictional users; an emergency access group",
    "A Windows 11 test device; a test connector group; a test workspace",
  ], 13);
  const pr = panel(s, "Next", 6.75, 1.45, 6.0, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "Building Global Secure Access: eight chapters with Lab 1 and Lab 2, and the runbook",
    "A narrated tour of each chapter",
    "The learning path: six modules with knowledge checks",
    "The implementation guide: the twelve steps",
  ], 13);
  callout(s, "Case", Math.max(pl, pr) + 0.22, 1.0, "FaRoute", HEX.navy, "The pilot, end to end: ",
    "decided honestly about GCC, logged first, measured, changed only by approved plans, enforced when clean, and evidenced.");
  src(s, "Sources: workbook index; Chapters 01–08, Lab 2; Chapter 09; training path index; guide, “In this guide.”");
  speak(s, "Your turn: Lab 2, and where to go next",
    `The answer to check nine: the production preflight fails, because production needs the test stage's evidence first. That's the pilot ring, end to end: decided honestly about what GCC does and doesn't state, logged before anything was enforced, measured device by device, changed only through plans a second person approved, enforced only when report-only was clean, and recorded as evidence an assessor can check. Now it's your turn. Each chapter has a second lab in your own test tenant, never production. Then go deeper: the workbook's chapters and their narrated tours, the learning path, and the implementation guide. Thanks for watching.`,
    `Lab 2 needs: a test tenant in the worldwide or GCC cloud for learning, with Microsoft Entra ID P1 or P2 and trial or test licenses for Internet Access and Private Access (or the Microsoft Entra Suite); an emergency access group and a pilot group of fictional users; one Windows 11 test device joined to Microsoft Entra ID and enrolled in Intune; a test connector group with two connectors on Windows Server 2019 or later and a test application server; an Azure test subscription with a Log Analytics workspace. Where to go next: docs/project-plans/developer-workbooks/global-secure-access/ (nine chapters), the narrated tours, the learning path Global Secure Access as the Identity-Aware Network (docs/training/global-secure-access/, six modules), and the implementation guide (docs/books/guides/global-secure-access-implementation.md). No Lab 2 has been run by the authors.`,
    `${WB}, index; Chapters 01–08, "Lab 2"; Chapter 09; learning path index; ${GUIDE}.`);
}
endModule(SC);

// ================================================================== Backup
backup();
sourceSlide("Sources: the workbook and the kit", [
  "Building Global Secure Access (docs/project-plans/developer-workbooks/global-secure-access/): index; Chapters 01 Decision, Licensing and GCC Availability; 02 The Configuration Export and Logs First; 03 The Client and Its Coverage; 04 Microsoft Traffic and Change Plans; 05 The Compliant Network and Tenant Restrictions; 06 Private Applications and Administrative Paths; 07 Internet Access, QUIC and TLS Inspection; 08 Rings, Metrics and the Evidence Package; 09 Deploying to Test and Production.",
  "examples/global-secure-access: Invoke-GsaCollect.ps1, Invoke-GsaCheck.ps1, Invoke-GsaPlan.ps1, Invoke-GsaMetrics.ps1, Invoke-GsaEvidence.ps1; powershell/GlobalSecureAccess; config/calls.json, availability.json, queries.json, requirements.json, desired.*.json, policies/; deploy/; tools/Get-GsaClientState.ps1.",
  "Fixtures (all fictional): tests/fixtures/pilot and ring1 (contoso.example), settings.lab.json, settings.lab-ring1.json, settings.test.json, settings.production.json.",
  "Every Try it output is read at build time from data/kit-captures/gsa/ (scripts/kit_captures.py), trimmed where the slide says so; Scene 9 shows Chapter 09's own fixture output, as the page prints it.",
]);
sourceSlide("Sources: Microsoft Learn, CISA and the requirements", [
  "Microsoft Learn: Known limitations for Global Secure Access; What is Global Secure Access?; Install the Global Secure Access client for Windows; Microsoft traffic profile and source IP restoration; compliant network check; Universal Tenant Restrictions; Private Access and Internet Access Graph tutorials; TLS inspection pages; Common operations and operations guides; logs and security operations; the Microsoft Graph reference pages the chapters cite.",
  "CISA, Trusted Internet Connections 3.0 Remote User Use Case (telemetry). The guide's GCC availability table (Learn, read November 11, 2026) and its requirements table.",
  "NIST SP 800-53 Rev. 5 and FedRAMP 20x Key Security Indicators, as the guide maps them (config/requirements.json); KSI alignment is the program's mapping (design guidance); the kit's records support the controls, and the assessor decides them.",
  "Design guidance in this deck: the kit's checks, thresholds and plan guards, and the story's ordering of fixtures into one case.",
]);

const count = narration.length;
fs.writeFileSync(path.join(__dirname, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
const spokenWords = narration.reduce((a, e) => a + e.say.split(" ").length, 0);
console.log(`narration.json: ${count} narrated slides, ${spokenWords} spoken words (about ${(spokenWords / 150).toFixed(1)} min at 150 wpm)`);
finish(OUT);
