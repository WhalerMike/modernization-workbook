// Book 12 — Security Operations & Telemetry: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b12-security-operations/build.js presentations/b12-security-operations/B12_Security_Operations.pptx
// Every fact comes from a footnoted chapter of docs/books/b12-security-operations/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 12", title: "Security Operations & Telemetry" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B12_Security_Operations.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's narration is edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const narrate = (s, body, ref) => {
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};
// Three tinted cards across the slide, each with an icon, a heading and a bullet list.
const cards = (s, prefix, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `${prefix} card ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
  icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], size || 13.5), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, paraSpaceAfter: 6 });
});
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: 14, valign: "middle" });
  });
};
// A tinted box on the right with an icon, a small label, a heading and a bullet list.
const sideBox = (s, prefix, iconName, color, tint, label, heading, list, size) => {
  box(s, `${prefix} box`, 7.1, 1.55, 5.65, 3.65, tint);
  icon(s, iconName, 7.35, 1.75, 0.72, color);
  txt(s, `${prefix} head`, [
    { text: label, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: heading, options: { bold: true, color, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
};
// A tinted box to the right of a table, with an icon, a heading and a bullet list.
const tableBox = (s, prefix, iconName, color, tint, heading, list, h) => {
  box(s, `${prefix} box`, 7.75, 1.5, 5.0, h || 3.55, tint);
  icon(s, iconName, 8.0, 1.68, 0.6, color);
  txt(s, `${prefix} head`, heading, { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, 13.5), { x: 8.0, y: 2.42, w: 4.6, h: (h || 3.55) - 1.0, paraSpaceAfter: 6 });
};
// A row of numbered step boxes across the slide.
const steps = (s, prefix, list, tints) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 14, breakLine: !!f[1] } },
      ...(f[1] ? [{ text: f[1], options: { fontSize: 12 } }] : []),
    ], { x: x + 0.12, y: 1.55, w: w - 0.24, h: 1.25, valign: "middle" });
  });
};
// Two tinted panels side by side under the step row.
const panels = (s, list) => list.forEach((p, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Panel ${i + 1}`, x, 3.05, 6.0, 2.0, p[3]);
  icon(s, p[0], x + 0.2, 3.13, 0.56, p[2]);
  txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.13, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 3.75, w: 5.6, h: 1.27, paraSpaceAfter: 2 });
});

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why visibility comes first", "Why Can't You Defend What You Can't See?", "Book 12 — Security Operations & Telemetry");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 12 of the Federal Modernization Workbook, Security Operations and Telemetry: how an agency makes every part of its estate emit evidence, turns it into detection and response, and proves that it works.

I'll take four questions: why you can't defend what you can't see, what each plane must emit and how findings reach one queue, who runs security operations, and how to run detection, response and monitoring.

The short version: design visibility instead of assuming it, and close a finding only when the thing is fixed, with proof.`,
  "Book 12, index; Chapter 01 — You Can't Defend What You Can't See.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why visibility comes first", "A log warehouse is not a detection engine");
  tag(s, "Why");
  rows(s, "Controls", "WHAT THE CONTROLS KEEP APART", [
    ["AU-12", "Generate the audit records"],
    ["AU-6", "Review and analyze them; report findings"],
    ["SI-4", "Detect attacks; analyze events and anomalies"],
    ["M-26-14", "Searchable 6 months; retrievable 1 year"],
  ], 1.92, 0.8, 0.68);
  sideBox(s, "Maturity", "FaChartLine", HEX.navy, HEX.navyTint, "HOW M-26-14 SCORES COLLECTION", "Alerts, not volume", [
    "Level 1: actionable alerts cover under half the baseline",
    "Level 3: at least 70%, routinely evaluated and tuned",
    "Level 4: at least 95%",
    "Each system scores at its lowest element",
  ], 14);
  callout(s, "Lake", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "Storage meets retention, not AU-6: ",
    "Microsoft says logs ingested only into the Sentinel data lake tier don't generate alerts. A detection source routed there to save money has no detection coverage.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-6, AU-12, SI-4); OMB M-26-14, Appendices B and C; CISA Logging Reference Architecture; Microsoft Learn — Sentinel data lake. Book 12, Chapter 01.");
  narrate(s,
`Why can't you defend what you can't see? Most agencies run a SIEM, pay for log storage, and can show an auditor millions of events a day. But each of those measures what arrived. None of them measures what didn't.

NIST keeps apart two things that are easy to buy as one. AU-12 says generate the audit records. AU-6 says review and analyze them for unusual activity and report what you find, and SI-4 adds detecting attacks. An agency can satisfy the first completely and still fail the other two.

OMB M-26-14 measures the same way. Logs must be searchable for six months and retrievable for a year, but its maturity model scores collection by alerting: under half of the baseline covered by actionable alerts at Level 1, at least 70 percent at Level 3.

And Microsoft says logs ingested only into the Sentinel data lake tier don't generate alerts. That source meets retention and detects nothing.`,
  "Book 12, Chapter 01 — You Can't Defend What You Can't See (The question this book answers; A warehouse is not a detection engine; OMB M-26-14).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why visibility comes first", "Coverage gaps raise no alarm on their own");
  tag(s, "Why");
  steps(s, "Gap", [["Never connected", "Resource logs need a diagnostic setting"], ["Connected, not flowing", "A green connector, no data"], ["Collected, not analyzed", "No rule reads it"], ["Switched off", "Documented attacker behavior"]],
    [HEX.redTint, HEX.redTint, HEX.redTint, HEX.redTint]);
  panels(s, [
    ["FaTriangleExclamation", "Exchange Online intrusion, 2023", HEX.red, HEX.redTint, ["First detected by a federal victim's own alert", "Built on mailbox-access events, then premium-only", "Microsoft later extended those logs to lower tiers", "Default audit retention raised from 90 to 180 days"]],
    ["FaListCheck", "Compare expected with what arrived", HEX.navy, HEX.navyTint, ["M-26-14: use CDM and asset data to confirm coverage", "BOD 23-01: asset visibility is “a basic pre-condition”", "Inventory visibility Level 1 starts at 70% of assets", "The inventory is the denominator"]],
  ]);
  callout(s, "Quiet", 5.25, 1.25, "FaPlugCircleXmark", HEX.red, "A dark source looks like a quiet network: ",
    "none of the four gaps can be found by looking at what arrived. Count a source as covered only when a rule runs on it and someone responds to what it finds.");
  sources(s, "Sources: Microsoft Learn — Azure resource logs, AWS S3 connector troubleshooting, Sentinel data lake; CISA Microsoft Expanded Cloud Logs Implementation Playbook (May 2026); OMB M-26-14; CISA BOD 23-01. Book 12, Chapter 01.");
  narrate(s,
`Coverage gaps don't announce themselves, and there are four ways they stay quiet. Some sources are never connected: Azure resource logs aren't collected until each resource has a diagnostic setting. Some connected sources aren't flowing: Microsoft says the AWS connector's green status means a collection rule exists, not that data arrived. Some collected data is never analyzed. And some sources are switched off on purpose; CISA calls tampering with logging well-documented threat actor behavior.

In the 2023 Exchange Online intrusion, a federal victim caught it with its own alert on mailbox-access events that, at the time, came only with a premium audit license. Agencies without those events had nothing to look at.

None of these gaps shows up in what arrived, only in comparing what arrived with what was expected. That's why M-26-14 tells agencies to use CDM and asset data to confirm log coverage, and why BOD 23-01 calls asset visibility a basic pre-condition. The inventory is the denominator.`,
  "Book 12, Chapter 01 — You Can't Defend What You Can't See (Why gaps stay silent; BOD 23-01 and CDM: the asset denominator).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why visibility comes first", "The evidence contract: one record, one join key");
  tag(s, "Why");
  const fields = [
    ["asset_id", "Authoritative name or address: the join key"],
    ["source", "The stack, appliance or agent that produced it"],
    ["surface", "Cloud, network, operating system, identity, data"],
    ["control", "The SP 800-53 control it is evidence for"],
    ["state", "The measured value: patch level, posture, label"],
    ["verdict", "Pass, warn or fail against the intended state"],
    ["observed_at", "When it was measured, in synchronized time"],
    ["disposition", "Applied, accepted risk (with its POA&M) or open"],
  ];
  s.addTable([head(["Field", "What every record carries"]), ...fields.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 0 ? HEX.red : HEX.navy, fontFace: "Consolas" } }, { text: r[1] }])],
    tableOpts([1.7, 5.2], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.41, 0.41, 0.41, 0.41, 0.41, 0.41, 0.41, 0.41] }));
  tableBox(s, "Join", "FaFingerprint", HEX.navy, HEX.navyTint, "Asset identity plus time", [
    "Each vendor has its own device ID; a hostname is “a last resort”",
    "The key comes from the naming plane: IPAM and DDI, CM-8",
    "Correlate on when it was observed, not when it arrived",
    "AU-12(1) is High baseline; the program selects it at Moderate",
  ], 3.75);
  callout(s, "Close", 5.45, 1.05, "FaLock", HEX.teal, "A record closes only on proof: ",
    "a later observation of the same asset shows the fixed state, or the authorizing official accepts the risk with a POA&M reference. A ticket marked resolved closes nothing.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-3, AU-8, AU-12(1), CM-8) and SP 800-53B; FedRAMP Rev. 5 baseline workbook; OMB M-26-14; Microsoft Learn — ASIM. Book 12, Chapter 02.");
  narrate(s,
`A multi-cloud agency runs several stacks: Azure Update Manager, AWS Systems Manager, a virtualization lifecycle manager, firewall syslog, a Linux host agent. Five partial views can't prove one vulnerability is fixed everywhere.

The program's answer is an evidence contract: one record shape every source emits, with eight fields fixed before any data flows. They carry the six things NIST's AU-3 asks a record to establish, plus the control it evidences, a verdict and a disposition.

The join key is authoritative asset identity plus time. Every stack has its own identifier. Even Microsoft's normalization model lists separate device IDs per product and calls a hostname a last resort. So the key comes from the naming plane, which has to exist before the pipeline. And time means when the state was observed, because arrival time joins the wrong records silently.

One caution: the system-wide, time-correlated trail, AU-12(1), is a High-baseline control. At Moderate, the program selects it by design.`,
  "Book 12, Chapter 02 — Telemetry Is the Precondition: The Evidence Contract (The contract; The join key; One queue for every finding; Controls this chapter closes).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What reaches the queue", "What each plane must emit, and how each goes quiet");
  tag(s, "What");
  const planes = [
    ["Identity", "Sign-ins (all four streams), audit, Graph activity", "Entra ID keeps 30 days with P1 or P2 unless routed"],
    ["Cloud platform", "Activity log; resource logs inside each resource", "Activity log deleted at 90 days; resource logs off by default"],
    ["Microsoft 365", "Unified audit log: Exchange, SharePoint, Teams, DLP", "180 days on Standard; one year only for E5-level users"],
    ["Endpoints", "Process, file, network and sign-in events; alerts", "Enrolled isn't reporting: a failed sensor sends nothing"],
    ["Network", "Flows, firewall and proxy decisions, DNS queries", "A forwarder's heartbeat says nothing of devices behind it"],
    ["Data", "Labels, DLP matches, sensitive-store access", "A vendor default can move a finding type out of the queue"],
  ];
  s.addTable([head(["Plane", "What it must emit (examples)", "How it goes quiet"]), ...planes.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.red } }])],
    tableOpts([2.0, 4.85, 5.3], { y: 1.5, fontSize: 13, rowH: [0.42, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52] }));
  callout(s, "Enforce", 5.3, 1.2, "FaArrowsRotate", HEX.amber, "Emission is enforced, then verified: ",
    "Azure Policy keeps new resources emitting, but existing ones are fixed only by a remediation task. The check names every expected table, so a missing one shows up as a row, not as silence.");
  sources(s, "Sources: OMB M-26-14, Appendix B; Microsoft Learn — Entra ID retention and diagnostic settings, Azure activity and resource logs, Azure Policy remediation, Purview audit retention, DLP alerts in Defender XDR. Book 12, Chapters 01–04, 06.");
  narrate(s,
`What must each plane emit? The program treats the estate as six planes: identity, cloud platform, Microsoft 365, endpoints, network and data. No one plane covers M-26-14's baseline, and systems a third party runs for the agency are in scope too.

Each plane has a default that looks instrumented and isn't. Entra ID shows sign-ins but keeps them only 30 days with P1 or P2, so the program streams all four sign-in streams, not just the interactive one, plus Microsoft Graph activity. Azure deletes its activity log after 90 days, and resource logs aren't collected at all until each resource has a diagnostic setting. Microsoft 365 audit records last 180 days on the Standard tier; the one-year default applies only to users with an E5-level license, everyone else, guests included, stays at 180.

So emission is enforced by policy, and verified by a query that names every expected table, so a missing one shows up as a row instead of silently disappearing.`,
  "Book 12, Chapter 01 (The six planes that must emit); Chapter 03 — Identity Telemetry from Entra ID; Chapter 04 — Azure Platform and Microsoft 365 Audit Telemetry; Chapter 02 and Chapter 06 (forwarders; coverage verification).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What reaches the queue", "Warehouse to detection: rules, incidents, closure");
  tag(s, "What");
  rows(s, "Floor", "WHAT BOUNDS TIME TO DETECT", [
    ["Scheduled rule", "Every 5 minutes at best, plus a 5-minute delay"],
    ["Near-real-time rule", "Every minute, 2-minute delay; at most 50"],
    ["Behavioral baseline", "Only as fast as its window"],
    ["Defender XDR", "Its own sensors and pipeline"],
  ], 1.92, 0.8, 0.68);
  sideBox(s, "Assessor", "FaClipboardCheck", HEX.teal, HEX.tealTint, "THE ASSESSOR'S TEST", "An alert, an incident, an outcome", [
    "Alert record: the rule, evidence, entities and time",
    "Incident ticket, linked by incident ID",
    "Response notes, with every playbook action",
    "Closure: classification, remediation, verification",
  ], 14);
  callout(s, "Monitored", 5.4, 1.1, "FaFilter", HEX.navy, "No source counts as monitored until an enabled rule reads it, ",
    "and no rule counts until its output reaches a queue someone owns. Defender XDR detects what its sensors see; Sentinel rules cover DNS, SASE, SQL audit and other clouds.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-6, SI-4); OMB M-26-14; Microsoft Learn — Sentinel scheduled and NRT rules, SecurityIncident, Defender XDR connector; CISA and FBI AA23-193A. Book 12, Chapter 05.");
  narrate(s,
`A workspace full of tables is still a warehouse. Rules, incidents and automation make it a detection engine, and the program's rule is strict: no source counts as monitored until an enabled rule reads it, and no rule counts until its output reaches a queue someone owns.

The engine also sets a floor on time to detect. A scheduled rule runs every five minutes at best, with a five-minute delay for ingestion. A near-real-time rule runs every minute on a two-minute delay, and a workspace can enable only 50 of them. Behavioral baselines are slower by design.

Defender XDR detects what its own sensors see on endpoints, identities and email. Sentinel rules cover what Defender can't see: DNS, SASE, SQL audit and other clouds.

Then prepare for the assessor's test: show an alert from the last 30 days, the incident it opened and what was done. That takes four records: the alert, the ticket, the response notes and the closure.`,
  "Book 12, Chapter 05 — From Log Warehouse to Detection: SIEM and XDR (Warehouse versus detection engine; Mean time to detect; The assessor evidence standard; What Defender XDR contributes).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What reaches the queue", "The federal clocks: BOD 26-04 and M-26-14");
  tag(s, "What");
  const tl = [
    ["KEV, total impact, and exposed or automatable", "3 days and forensic triage"],
    ["KEV, exposed, automatable, partial impact", "3 days"],
    ["Every other KEV finding", "14 days"],
    ["Not KEV, but exposed or automatable", "3, 14 or 60 days"],
    ["Not KEV, not exposed, not automatable", "Fix on system upgrade"],
  ];
  s.addTable([head(["BOD 26-04: the vulnerable asset", "Maximum timeline"]), ...tl.map((r, i) => [{ text: r[0] }, { text: r[1], options: { bold: true, color: i < 2 ? HEX.red : HEX.navy } }])],
    tableOpts([4.4, 2.5], { y: 1.5, fontSize: 13, rowH: [0.42, 0.6, 0.6, 0.6, 0.6, 0.6] }));
  tableBox(s, "Logging", "FaUserClock", HEX.navy, HEX.navyTint, "M-26-14 and CISA clocks", [
    "Logging Reference Architecture: August 20, 2026",
    "Agency Logging Plan due within 90 days of it",
    "Maturity Levels 1, 2 and 3 within 120, 180 and 320 days",
    "Incidents to CISA within one hour of identification",
  ]);
  callout(s, "Clock", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "The clock starts early, and there are no waivers: ",
    "at the KEV listing or the agency's own identification and CDM update, whichever is first. Phase III, remediation within the table, applies from December 7, 2026.");
  sources(s, "Sources: CISA BOD 26-04 (June 10, 2026), Appendix A and Implementation Guidance; CISA KEV catalog; OMB M-26-14; CISA Logging Reference Architecture; CISA Federal Incident Notification Guidelines. Book 12, Chapters 01, 06 and 10.");
  narrate(s,
`Two federal clocks run against this work. CISA's BOD 26-04, issued June 10, 2026, revoked BOD 22-01 and BOD 19-02, and replaced severity buckets with four questions about each vulnerable asset: is it publicly exposed, is the flaw in the Known Exploited Vulnerabilities catalog, can exploitation be automated, and does it give partial or total control?

The answers set a maximum timeline. Three days, with forensic triage on the worst rows, because, in CISA's words, applying a patch generally does not evict a threat actor. Then 14 days, 60 days, or the next system upgrade. The clock starts when CISA lists the flaw or when the agency finds it and updates CDM, whichever comes first, and there are no waivers. Phase III, remediation within the table, applies from December 7.

M-26-14's clock runs from CISA's Logging Reference Architecture, published August 20, 2026: the Agency Logging Plan within 90 days, and maturity Levels 1, 2 and 3 within 120, 180 and 320 days.`,
  "Book 12, Chapter 06 — Vulnerability Management (The directive that governs KEV: BOD 26-04); Chapter 01 (OMB M-26-14); Chapter 10 (CISA's incident notification guidelines).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What reaches the queue", "Vulnerability and patch: a scanner fixes nothing");
  tag(s, "What");
  steps(s, "Queue", [["Pull KEV", "Daily, before the review"], ["Pull findings", "Current state only"], ["Join the asset", "ID and exposure tag"], ["Look up CISA data", "Automatable; impact"], ["Apply the table", "Keep first-detected"], ["Write the queue", "Archive it"]],
    [HEX.grey, HEX.grey, HEX.navyTint, HEX.navyTint, HEX.tealTint, HEX.tealTint]);
  panels(s, [
    ["FaDatabase", "Assessment: one queue", HEX.navy, HEX.navyTint, ["One row per CVE per asset, with its deadline", "Use the catalog's due date; Defender has no KEV flag", "No exposure tag: treat the asset as publicly exposed", "The first-detected date is never recalculated"]],
    ["FaServer", "Actuation: platform-native", HEX.teal, HEX.tealTint, ["Each platform patches with its own stack", "Every stack returns the same remediation record", "No cross-platform tool reaches hypervisor or firmware", "Closed when the fix is recorded and re-scanned"]],
  ]);
  callout(s, "Native", 5.25, 1.25, "FaRoute", HEX.amber, "Actuation is platform-native; governance is unified: ",
    "a scanner measures a gap and never closes one. The fix belongs to the platform; the proof is a record keyed to the same asset identity.");
  sources(s, "Sources: CISA BOD 26-04 and Implementation Guidance; CISA KEV feed and Vulnrichment; NIST SP 800-53 (RA-5, SI-2(2), SI-2(3)); Microsoft Learn — Defender Vulnerability Management; AWS Systems Manager Patch Manager. Book 12, Chapters 06 and 07.");
  narrate(s,
`Vulnerability management fails at three points assessors probe: a stale inventory, prioritization by score alone, and no record of found, due and fixed. The program's answer is a daily queue. Pull the KEV feed before the morning review. Pull findings from Defender Vulnerability Management. Join each device to the authoritative asset record and its exposure tag. Look up CISA's automation and impact data, apply the directive's table, and keep the first-detected date, never resetting it.

Use the catalog's due date, because Defender's vulnerability data carries no KEV flag. Treat an asset with no exposure tag as publicly exposed. And Defender's exports carry no history, so the program keeps its own.

A scanner authors no state; it measures a gap. Each platform patches with its own native stack, and every stack returns the same remediation record, keyed to the same asset. A finding closes when the fix is recorded and the next scan no longer sees it.`,
  "Book 12, Chapter 06 — Vulnerability Management (The program's remediation clock; Building the daily queue; The scanner is not remediation); Chapter 07 — Patch, Configuration and Hardening Baselines (Actuation is platform-native; Governance is unified: the record).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What reaches the queue", "Configuration, posture and CUI data share the queue");
  tag(s, "What");
  cards(s, "Streams", [
    ["FaArrowsRotate", "Configuration", HEX.amber, HEX.amberTint, ["CM-6 baselines: SCuBA, CIS, DISA STIG", "Assign in audit mode first", "Auto-correct hides drift: no record it happened", "Unremediated drift becomes a queue row"]],
    ["FaCloud", "Cloud posture", HEX.navy, HEX.navyTint, ["An open storage account has no missing patch", "An owned native tool is primary on its platform", "Defender for Cloud doesn't cover Oracle Cloud", "Its AWS connector isn't in Azure Government"]],
    ["FaLock", "CUI data protection", HEX.teal, HEX.tealTint, ["Two levels: CUI Basic and CUI Specified", "Privacy Act records: Basic; taxpayer data: Specified", "Labels drive DLP on service, endpoint and CASB", "Simulate first, then watch the overrides"]],
  ], 13.5);
  callout(s, "Membership", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "Check queue membership: ",
    "since early October 2026, a built-in tuning rule sets Purview DLP signals as behaviors that no longer reach the Defender XDR incident queue unless an administrator disables it.");
  sources(s, "Sources: NIST SP 800-53 (CM-6, CM-7, AC-4, SC-28); Microsoft Learn — machine configuration, Defender for Cloud, Purview labels, DLP alerts in Defender XDR; 32 CFR Part 2002; CUI Registry. Book 12, Chapters 02, 07, 08 and 09.");
  narrate(s,
`Three more streams share the queue. Configuration first: a patched host that drifts from its baseline isn't remediated. Baselines come from SCuBA, CIS or DISA STIGs. Azure machine configuration's auto-correct mode fixes drift without recording it, so the program keeps it for low-risk settings.

Cloud posture next. A storage account open to the internet has no missing patch, so a scanner never reports it. Each provider's native posture tool is primary for its own platform. Defender for Cloud doesn't cover Oracle Cloud, and its AWS connector isn't available in Azure Government.

Then data. The CUI framework has two levels, Basic and Specified, decided by the authority in the CUI Registry: Privacy Act records are Basic, and federal taxpayer information is Specified. Labels drive data loss prevention on the service, the endpoint and the CASB.

And check queue membership. Since early October 2026, a built-in Microsoft tuning rule keeps DLP signals out of the incident queue unless an administrator turns it off.`,
  "Book 12, Chapter 07 (Configuration state; The baseline lifecycle); Chapter 08 — Cloud-Native Posture; Chapter 09 — Data Protection and Classification; Chapter 02 (One queue for every finding).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who runs it", "Who runs security operations, and who decides");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["CIO and sponsor", "Scope, funding, the top-level SOC"], ["Authorizing official", "The risk of not seeing; missed deadlines"], ["Records officer", "Disposition; any shortened retention"]]],
    ["FaClipboardCheck", "Set requirements", HEX.teal, HEX.tealTint, [["CISO", "What each plane emits; the Logging Plan"], ["System owner and ISSO", "How and when a finding is fixed"], ["Privacy office and counsel", "Log content; monitoring opinion"]]],
    ["FaUsersGear", "Run it", HEX.amber, HEX.amberTint, [["Top-level SOC", "The queue; the one-hour CISA notice"], ["Security engineering", "SIEM, rules, playbooks, pipeline"], ["Platform owners", "Keep their own plane emitting"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "THREE DECISIONS THAT OFTEN GET MADE AT THE CONSOLE", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Suppressing a rule", "with an end date, the CISO approves; with none, the authorizing official decides", HEX.teal],
    ["Carrying a telemetry gap", "a risk acceptance the authorizing official signs, with an end date and a POA&M", HEX.navy],
    ["Shortening retention", "needs the records officer's concurrence, because lost evidence can't come back", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 and SP 800-53 Rev. 5; OMB M-26-14; CISA Federal Incident Notification Guidelines; CISA BOD 26-04; TIC 3.0 Program Guidebook; NARA GRS 3.2. Book 12, Chapter 10.");
  narrate(s,
`Who runs security operations? Most agencies can name their SOC. Fewer can say who decided that a log source is collected, how long it's kept, or who accepted the risk when it went quiet for three weeks.

The program assigns them. The CIO sets scope and funding and designates the top-level SOC. The CISO decides what each plane must emit, owns the Agency Logging Plan, and approves any playbook that acts on production. Platform owners keep their own planes emitting. Security engineering builds the SIEM, the rules, the playbooks and the evidence pipeline. The SOC runs the queue, and CISA's one-hour clock starts there.

Two roles are easy to forget. The records officer decides disposition, and must concur before anyone shortens retention, because evidence that's gone can't come back. And the authorizing official, the only official who can accept risk, accepts the risk of not seeing: a gap carried rather than closed, a suppression with no end date, a missed deadline.`,
  "Book 12, Chapter 10 — Who Runs Security Operations (Where the roles come from; The SOC is a common control provider; The roles; Three questions, one owner each; The responsibility matrix).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to run it", "Detection engineering: rules as code, tested, owned");
  tag(s, "How");
  steps(s, "Rule", [["Author", "From a template; thresholds marked"], ["Test", "History and a known-bad sample"], ["Alert-only", "Two weeks at least"], ["Promote", "A reviewed commit"], ["Review", "Quarterly; auto-disable daily"]],
    [HEX.grey, HEX.navyTint, HEX.navyTint, HEX.tealTint, HEX.amberTint]);
  panels(s, [
    ["FaCodeBranch", "A library, not a portal", HEX.navy, HEX.navyTint, ["Version-controlled; no portal edits in production", "One named owner, a test and a review date per rule", "Up to 512 scheduled and 50 NRT rules per workspace", "Missing vendor analytics rebuilt inside the boundary"]],
    ["FaTriangleExclamation", "Detections rot", HEX.red, HEX.redTint, ["Thresholds drift; sources stop without an error", "Sentinel marks broken rules “AUTO DISABLED”", "A rule over a stale table covers nothing", "Re-tuning is a standing, staffed cost"]],
  ]);
  callout(s, "Fire", 5.25, 1.25, "FaListCheck", HEX.teal, "A rule that can't be shown to fire isn't finished: ",
    "replay a known-bad sample before it ships, keep it alert-only until its false positives are documented, and record the rate when it's promoted.");
  sources(s, "Sources: Microsoft Learn — Sentinel rule templates, Repositories, scheduled rules and results simulation, auto-disabled rules, service limits, feature availability in Azure Government. Book 12, Chapters 10 and 11.");
  narrate(s,
`How do detections get built? As code. The rule library lives in version control, and nobody edits a production rule in the portal; a change is a reviewed commit. Every rule has one named owner, a test and a review date.

Each rule moves through five steps. Author it, starting from Microsoft's template where one exists. Test it against history and replay a known-bad sample, because a rule that can't be shown to fire isn't finished. Run it alert-only for at least two weeks, and until its false positives are documented. Promote it. Then review it at least quarterly.

Where a vendor analytic isn't available in the agency's cloud, the program rebuilds an equivalent inside its own boundary, and says it isn't parity.

Plan for rot. Thresholds drift, sources stop without an error, and Sentinel disables a rule after repeated failures and marks it auto disabled. The standing tuning effort is the real cost of having a library.`,
  "Book 12, Chapter 11 — Detection Engineering and Response Automation (The in-boundary principle; A rule library as code; Rule lifecycle and testing); Chapter 10 (Who owns each detection and playbook).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to run it", "Response within the actuation ladder");
  tag(s, "How");
  const ladder = [
    ["L1 Observe", "Incident opened; evidence kept", "Every promoted rule"],
    ["L2 Advise", "Enrich and ticket; an analyst decides", "Off-hours privileged activation"],
    ["L3 Gated", "Playbook prepares; a named approver releases", "Revoke sessions; disable a standard user; isolate a workstation"],
    ["L4 Guardrails", "Runs alone, logged and reversible", "Close known-benign incidents; vendor disruption the AO accepts"],
  ];
  s.addTable([head(["Rung", "What happens", "Examples"]), ...ladder.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 2 ? HEX.amber : HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([1.45, 2.65, 2.8], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.62, 0.62, 0.85, 0.85] }));
  tableBox(s, "Limits", "FaUserShield", HEX.red, HEX.redTint, "Limits, stated", [
    "Always L3: server isolation, privileged or emergency accounts, tenant-wide changes",
    "Session revocation can take up to 15 minutes in CAE-aware services",
    "Hybrid users are disabled in Active Directory too",
    "Every action is written back to the incident",
  ]);
  callout(s, "Gate", 5.3, 1.2, "FaShieldHalved", HEX.amber, "Confidence gates the action: ",
    "high confidence prepares containment, medium confidence enriches for a human, low confidence never acts. Auto-containment on a noisy rule is its own denial of service.");
  sources(s, "Sources: NIST SP 800-53 (SI-4(7), IR-4, IR-8) and SP 800-61 Rev. 3; Microsoft Learn — revokeSignInSessions, continuous access evaluation, automatic attack disruption, device isolation, revoking hybrid user access. Book 12, Chapter 11.");
  narrate(s,
`Detection without response shortens the investigation, not the exposure. So every playbook is confidence-gated: high confidence prepares containment, medium confidence enriches and tickets for a human, and low confidence never acts.

Responses sit on the workbook's actuation ladder. L1 observes. L2 advises. L3, gated actuation, is the default for anything with a large blast radius: the playbook checks its preconditions and prepares the action, and a named approver releases it. L4 runs alone, logged and reversible, for enumerated classes such as closing known-benign incidents. Three classes stay at L3 permanently: isolating a server, disabling a privileged or emergency account, and any tenant-wide change.

Defender XDR's attack disruption acts on its own, so the authorizing official decides whether to accept it as L4.

Latency is real. Session revocation can take up to 15 minutes in services that support continuous access evaluation, and a hybrid user must be disabled in Active Directory too, or the next synchronization undoes it.`,
  "Book 12, Chapter 11 — Detection Engineering and Response Automation (The response ladder; Playbooks; Honest limits).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to run it", "Continuous monitoring: metrics that prove it works");
  tag(s, "How");
  steps(s, "Stage", [["Emit", "Every plane, own cadence"], ["Normalize", "The contract's shape"], ["Correlate", "Asset ID plus time"], ["Bind", "Record to control"], ["Report", "Metrics, OSCAL, POA&M"], ["Respond", "Fix, accept, escalate"]],
    [HEX.grey, HEX.grey, HEX.navyTint, HEX.navyTint, HEX.tealTint, HEX.amberTint]);
  panels(s, [
    ["FaChartLine", "Metrics that can't flatter", HEX.navy, HEX.navyTint, ["Detection coverage: of M-26-14's 11 baseline activities", "Telemetry completeness: a stale source is an AU-5 failure", "KEV: closed within timeline, and open past it", "Configuration: pass, fail and excepted, kept apart"]],
    ["FaScaleBalanced", "Read outside scores carefully", HEX.amber, HEX.amberTint, ["M-26-14 scores a system at its lowest element", "Advanced can still miss the 6-month searchable floor", "FedRAMP's 46 KSIs bind providers, not agencies", "Review each provider's quarterly report"]],
  ]);
  callout(s, "Retest", 5.25, 1.25, "FaClipboardCheck", HEX.teal, "A finding closes on re-test evidence: ",
    "the platform owner fixes it, the pipeline re-tests, and the record links the two. One that can't close in time is carried by the authorizing official, with an end date.");
  sources(s, "Sources: NIST SP 800-137, SP 800-37 Rev. 2, SP 800-53 (CA-7, AU-5, SI-2(3)) and SP 800-53A; OMB M-26-14, Appendices B and C; CISA BOD 26-04; FedRAMP Consolidated Rules for 2026. Book 12, Chapter 12.");
  narrate(s,
`Last, prove it works. Continuous monitoring is a pipeline: emit, normalize, correlate, bind each record to its control, report, and respond.

The metrics are built so they can't flatter. Detection coverage counts how many of M-26-14's eleven baseline activities have an enabled, tested rule over a fresh source, not how many rules exist. Telemetry completeness treats a stale required source as an AU-5 failure. KEV remediation counts closures within the BOD 26-04 timeline, plus open items past it, because a share of the open queue improves every time new findings arrive. And configuration reports passing, failing and excepted settings separately.

Read outside scores carefully. M-26-14 scores each system at its lowest element, and a system can reach Advanced while missing the six-month searchable floor. FedRAMP's 46 Key Security Indicators bind cloud providers, not agencies; the agency reviews each provider's quarterly report.

A finding closes on re-test evidence, or the authorizing official carries it with an end date.`,
  "Book 12, Chapter 12 — Evidence, Metrics and Continuous Monitoring (The continuous-monitoring pipeline; The metric set; FedRAMP's Key Security Indicators; Closing a finding).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to run it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaListCheck", "Name every expected emitter", "Each plane and asset, checked against what arrives", HEX.navy, HEX.navyTint],
    ["FaSitemap", "Build the naming plane first", "One asset identity before the evidence pipeline", HEX.teal, HEX.tealTint],
    ["FaFileShield", "Fund the Logging Plan as visibility", "Coverage and detection, not a storage purchase", HEX.amber, HEX.amberTint],
    ["FaScaleBalanced", "Send blind spots to the AO", "Gaps, open-ended suppressions, missed deadlines, all dated", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaClipboardCheck", HEX.navy, "Next step, no procurement: ",
    "run the coverage check against the inventory, tag the exposure of every externally reachable asset before December 7, 2026, and count a source as covered only when a tested rule reads it.");
  sources(s, "Sources: OMB M-26-14; CISA BOD 26-04; NIST SP 800-37 Rev. 2 and SP 800-53 Rev. 5. Book 12, Chapters 01, 02, 06, 10 and 12.");
  narrate(s,
`So, four decisions.

Name the planes and assets that are expected to emit, and check each one against what actually arrives.

Stand up the naming plane before the evidence pipeline, so every record joins on one asset identity.

Fund the Agency Logging Plan as the program's visibility plan, not as a storage purchase.

And send every blind spot to the authorizing official: a telemetry gap, a suppression with no end date, a missed BOD 26-04 deadline, each with an end date.

The next step needs no procurement. Run the coverage check against the inventory, tag the exposure of every externally reachable asset before December 7, and count a source as covered only when a tested rule reads it.

You can't defend what you can't see, and a finding closes only when the thing is fixed, with proof. Book 12 has the detail, every claim footnoted. Thank you.`,
  "Book 12, Chapters 01 (The case in one paragraph), 02, 06 (What the directive requires, and by when), 10 and 12; Appendix A.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "OMB M-26-14 (May 22, 2026; rescinds M-21-31), including Appendices B and C.  ·  CISA Logging Reference Architecture (August 20, 2026).",
    "CISA: BOD 26-04 (June 10, 2026), Appendix A and Implementation Guidance; KEV catalog feed and Vulnrichment; BOD 23-01; BOD 25-01 and Implementation Guidance (July 27, 2026); BOD 26-02; ED 26-03; CDM program.",
    "CISA: Federal Incident Notification Guidelines; TIC 3.0 Program Guidebook v1.2 (September 2026); Microsoft Expanded Cloud Logs Implementation Playbook (May 2026); CISA and FBI AA23-193A.",
    "NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; SP 800-53A Rev. 5; SP 800-37 Rev. 2; SP 800-137; SP 800-61 Rev. 3; SP 800-190; OSCAL.",
    "FedRAMP Consolidated Rules for 2026 (Key Security Indicators; Vulnerability Detection and Response; Collaborative Continuous Monitoring); Rev. 5 baseline workbook; FedRAMP Marketplace (October 21, 2026).",
    "32 CFR Part 2002 and the CUI Registry.  ·  NARA General Records Schedule 3.2 and GRS status updates.",
    "Microsoft Learn: Entra ID diagnostic settings and retention; Azure activity and resource logs; Azure Policy remediation; Purview audit, sensitivity labels and DLP; Office 365 Management Activity API; Sentinel (data lake, ASIM, scheduled and NRT rules, health, roles, Repositories, limits); Defender XDR, Vulnerability Management and attack disruption; Defender for Cloud; machine configuration; Microsoft Graph; continuous access evaluation.",
    "AWS Systems Manager, Config, Security Hub and Inspector; Oracle OS Management Hub, Ksplice and Cloud Guard; vSphere Lifecycle Manager; Red Hat Satellite; Kubernetes Pod Security Admission.",
    "Full footnotes with links and access dates: Book 12, every chapter (whalermike.github.io/modernization-workbook/docs/books/b12-security-operations/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 5 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
