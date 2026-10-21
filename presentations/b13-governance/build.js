// Book 13 — Governance, Drift & Evidence: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b13-governance/build.js presentations/b13-governance/B13_Governance.pptx
// Every fact comes from a footnoted chapter of docs/books/b13-governance/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 13", title: "Governance, Drift & Evidence" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B13_Governance.pptx";

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
const tableBox = (s, prefix, iconName, color, tint, heading, list, h, size) => {
  box(s, `${prefix} box`, 7.75, 1.5, 5.0, h || 3.55, tint);
  icon(s, iconName, 8.0, 1.68, 0.6, color);
  txt(s, `${prefix} head`, heading, { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 13.5), { x: 8.0, y: 2.42, w: 4.6, h: (h || 3.55) - 1.0, paraSpaceAfter: 6 });
};
// A row of step boxes across the slide (numbered unless labels are given).
const steps = (s, prefix, list, tints, labels) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: labels ? labels[i] : `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
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
  const s = D.titleSlide("Why compliance decays", "Why Does Compliance Decay After the Audit?", "Book 13 — Governance, Drift & Evidence");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 13 of the Federal Modernization Workbook, Governance, Drift and Evidence: why compliance decays the day after the audit, and the governance that doesn't.

I'll take four questions: why a signed package starts aging at once, what keeps governance true between assessments, who governs it, and how to run it at machine tempo, reuse it across agencies and scale it.

The short version: keep one authoritative record, let the systems prove they still match it, and keep people on the decisions only people can make.`,
  "Book 13, index; Chapter 01 — Why Compliance Decays the Day After the Audit.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why compliance decays", "A package is true on the day it's signed");
  tag(s, "Why");
  rows(s, "Guidance", "WHAT FEDERAL GUIDANCE ALREADY ASKS FOR", [
    ["FISMA", "Test at least annually, with automated tools"],
    ["SP 800-137", "Monitoring is ongoing awareness, not a calendar"],
    ["SP 800-37", "Make ongoing authorization a priority (Task M-6)"],
    ["A-130", "Transition when eligible; until then, agency-set end dates"],
  ], 1.92, 0.8, 0.68);
  sideBox(s, "Words", "FaLandmark", HEX.red, HEX.redTint, "IN NIST'S OWN WORDS", "Reauthorization is “static”", [
    "Reauthorization: “the static, single point-in-time” decision",
    "Systems are “in a constant state of change”",
    "Without substantial automation, ongoing authorization isn't “feasible or practical”",
    "No federal three-year rule: the agency sets the term",
  ], 14);
  callout(s, "Paradox", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "The compliance paradox: ",
    "the package describes one day, the estate changes every day, and adding checkboxes makes reporting heavier without touching the change.");
  sources(s, "Sources: 44 U.S.C. § 3554(b)(5) (FISMA); NIST SP 800-37 Rev. 2 (Task M-6, Appendix F); NIST SP 800-137; SP 800-53 Rev. 5 (CA-7); OMB Circular A-130, Appendix I. Book 13, Chapter 01.");
  narrate(s,
`Picture the week an authorization package is signed. On that day the package is true. The next morning an administrator changes a firewall rule to fix an outage, a contractor's account outlives the contract, a cloud provider ships a new default. None of it reaches the package.

Federal guidance already points away from the snapshot. FISMA sets a floor: test at least annually, with automated tools. There's no federal three-year rule; the authorization's term is the agency's to set. NIST defines continuous monitoring as ongoing awareness, not a calendar. The Risk Management Framework calls reauthorization the static, single point-in-time decision, and asks agencies to make ongoing authorization a priority. OMB's Circular A-130 tells them to make that transition when eligible.

So why do so few systems get there? NIST answers it: without substantial automation, ongoing authorization isn't feasible or practical. And adding checkboxes makes reporting heavier while leaving the change untouched. That's the compliance paradox.`,
  "Book 13, Chapter 01 — Why Compliance Decays the Day After the Audit (The compliance paradox; What federal guidance already asks for).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why compliance decays", "Drift is the primary threat");
  tag(s, "Why");
  steps(s, "Source", [["Unauthorized change", "Attack or honest error"], ["Never written back", "Approved, not recorded"], ["Provider change", "Made outside your view"], ["Facts decay", "People move and leave"], ["Tool updates", "New versions, new defaults"]],
    [HEX.redTint, HEX.redTint, HEX.redTint, HEX.redTint, HEX.redTint]);
  panels(s, [
    ["FaTriangleExclamation", "Why it comes first", HEX.red, HEX.redTint, ["Continuous: a gradient, not an event", "Silent: systems report what they were told", "The opening other threats use", "NSA and CISA: top misconfigurations are “systemic”"]],
    ["FaListCheck", "NIST describes it without the word", HEX.navy, HEX.navyTint, ["CM-2: a current baseline under configuration control", "CM-3: controlled change, monitored", "CM-6: every deviation identified and approved", "CA-7: keep checking, and act on what you find"]],
  ]);
  callout(s, "Drift", 5.25, 1.25, "FaArrowsRotate", HEX.red, "Drift is any difference between the record and the estate: ",
    "a setting changed and never recorded, an account that outlived its owner, a rule that stopped evaluating. Without a comparison, none of it raises an alarm.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task M-1); NIST SP 800-137 §3.2.2; SP 800-53 Rev. 5 (CM-2, CM-3, CM-6, CA-7); NSA and CISA Advisory AA23-278A. Book 13, Chapter 02.");
  narrate(s,
`The mechanism has a name: drift. Drift is any difference between what the authoritative record says should be true and what the running estate does. A setting changed and never recorded, an account that outlived its owner, a rule that quietly stopped evaluating.

NIST names the sources: unauthorized change, from attackers or from honest errors by authorized staff; changes made outside change control; provider changes that are hard to detect; staff turnover; and upgrades.

The program ranks drift first among governance threats for three reasons. It's continuous, a gradient rather than an event. It's silent: the directory reports the rule as configured and the console reports the policy as assigned, because each reports what it was told. And it's the opening other threats use. NSA and CISA called the most common misconfigurations their teams find systemic weaknesses.

NIST's controls describe drift detection without the word: a baseline, controlled change, approved deviations, and someone who keeps checking.`,
  "Book 13, Chapter 02 — Drift Is the Primary Threat (What drift is, in NIST's terms; Where drift comes from; Why drift is the primary threat).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What keeps governance true", "One authoritative record; every copy is a pointer");
  tag(s, "What");
  const planes = [
    ["Identity", "Every actor named once, with its assurance level"],
    ["Addressing", "IP addresses, DNS and DHCP derived from identity"],
    ["Network", "Routing and segmentation from who and where"],
    ["Telemetry", "Signals in one claim form, with location"],
    ["Security", "Policy decision and enforcement points"],
    ["Management", "Drift detection, stewardship and evidence"],
  ];
  s.addTable([head(["Control plane", "Authoritative for"]), ...planes.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 0 ? HEX.teal : HEX.navy } }, { text: r[1] }])],
    tableOpts([2.0, 4.9], { y: 1.5, fontSize: 13, rowH: [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  tableBox(s, "Use", "FaBook", HEX.teal, HEX.tealTint, "The rules for using it", [
    "Upstream systems own their facts: HR owns who a worker is",
    "Runtime systems read it; they never write it",
    "No private copies: each is a second source of truth",
    "Every report carries its source, version, time and producer",
  ], 3.42);
  callout(s, "Single", 5.3, 1.2, "FaSitemap", HEX.teal, "Single means logically single: ",
    "one copy accepts authoritative writes and replicas are explicitly subordinate. Drift is measured against the record, and against nothing else.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-2); FedRAMP 2026 Rev5 control reference; NIST SP 800-207; Pro Git §10.2; Microsoft Graph, onPremisesExtensionAttributes. Book 13, Chapter 03.");
  narrate(s,
`Drift can only be measured against something. For twenty years many enterprises kept their governance, unwritten, in the Active Directory tree. A flat cloud directory doesn't carry it, so the program writes the governance down, in one authoritative record.

The record is a version-controlled repository of policies, plans, evidence, schemas and rules. It doesn't master every fact. HR owns who a worker is; the identity platform issues credentials. The record holds the authority: which system owns each fact, and who may write it.

Runtime systems read it and never write it. Private copies are forbidden, because a local copy someone reads because the repository was slow is a second source of truth. Every derived report carries its source, version, time and producer.

The record covers six control planes, each authoritative for one domain, so every finding has one owning team. NIST's CM-2 baseline is this record, kept in a form machines can compare.`,
  "Book 13, Chapter 03 — One Authoritative Record: Single Source of Truth and the Six Planes (The governance nobody wrote down; What the record is; The consumer rule; The six control planes; Who is authoritative for what).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What keeps governance true", "Every change travels one path, and leaves its proof");
  tag(s, "What");
  steps(s, "Clause", [["Originate", "From the source of truth"], ["Authorize", "From the authority model"], ["Execute", "Least privilege, just in time"], ["Close", "With a verification payload"], ["Emit", "Evidence, automatically"]],
    [HEX.grey, HEX.navyTint, HEX.navyTint, HEX.tealTint, HEX.tealTint]);
  panels(s, [
    ["FaCodeBranch", "Changing the record itself", HEX.navy, HEX.navyTint, ["A reviewed pull request is the authorization", "Two people per change; the merge is signed", "Branch rules must bind administrators too", "Emergencies back-ported within one business day"]],
    ["FaUserShield", "Deciding and acting kept apart", HEX.teal, HEX.tealTint, ["Separate service principals for each side", "Separate credentials and log streams", "The author never approves", "No standing privilege: just-in-time roles"]],
  ]);
  callout(s, "Proof", 5.25, 1.25, "FaClipboardCheck", HEX.amber, "No closure counts unless it carries its proof: ",
    "a task closed by a person clicking “complete” is prose, not evidence. Human-only closure is a flagged exception, counted separately.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-3, CM-5, AU-10) and FedRAMP 2026 Rev5 reference; GitHub Docs — protected branches; Microsoft Learn — Entra PIM; FedRAMP KSI-CMT indicators. Book 13, Chapter 04.");
  narrate(s,
`A record is only as good as the path into it. Most drift isn't malicious; it's a hotfix during an outage. So the program allows one path for every operational change, whether it moves, adds, changes, deletes or resets something, and no second path for urgent work.

The path has five clauses. Originate from the source of truth. Authorize from the authority model, not from whoever is nearby. Execute under least privilege, elevated just in time. Close with the verification that justified it. And emit the evidence automatically. Skip a clause and the operation isn't a change with a missing form; it's a drift finding.

Changes to the record travel as reviewed pull requests: two people, a signed merge, and branch protection that binds administrators too. Emergencies are back-ported within one business day, and reported as drift until then.

The identity that decides never acts, and the one that acts never decides. And no closure counts unless it carries its proof.`,
  "Book 13, Chapter 04 — Change Control and Provenance (Five change classes; The five-clause path; Changing the record: pull requests; Two identities, not one; No closure counts unless it carries its proof).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What keeps governance true", "Deterministic rules: same inputs, same evidence");
  tag(s, "What");
  cards(s, "Layer", [
    ["FaBook", "1 · Rules", HEX.navy, HEX.navyTint, ["What rules exist and what they mean", "Changed by governance review", "Each change leaves a recorded decision", "Read-only to the runtime"]],
    ["FaSitemap", "2 · Mappings", HEX.amber, HEX.amberTint, ["Which rules apply to which controls", "Changed by a schema-validated edit", "A dangling entry is a finding", "Owned by the adapter owner"]],
    ["FaServer", "3 · Runtime", HEX.teal, HEX.tealTint, ["How rules are evaluated", "Changed by code, with tests", "The only layer that changes state", "Capped by the actuation ladder"]],
  ], 13.5);
  callout(s, "Rerun", 5.3, 1.2, "FaFingerprint", HEX.navy, "The re-run is the verification: ",
    "the same record version and archived inputs give a byte-identical bundle. No silent drops, append-only, ordered, idempotent; a hash that differs is a finding.");
  sources(s, "Sources: RFC 8785 (JSON Canonicalization Scheme); CISA ScubaGear; Open Policy Agent; NIST SP 800-53 Rev. 5 and SP 800-53B; NIST OSCAL layers and models. Book 13, Chapters 01 and 05.");
  narrate(s,
`When the program says a control is satisfied, how does anyone know it's right? The usual answer is trust. The program's answer is determinism: given the same version of the record and the same collected inputs, the platform produces the same evidence, byte for byte. Then an assessor doesn't have to trust the run. They repeat it and compare the hashes.

Automation isn't the same thing. Automation makes the answer arrive faster; determinism makes it the same answer no matter who asks.

The rules live in three layers, each with its own reviewer. Rules say what exists and what it means, and change only through governance review. Mappings say which rules apply to which controls. Runtime code evaluates them, and is the only layer allowed to change state.

One limit: determinism is faithful to the record, not a check on it. A wrong rule gives the same wrong answer every time.`,
  "Book 13, Chapter 05 — Deterministic Governance: The Three-Layer Rule Model (The same inputs, the same evidence; Automation is not determinism; Three layers of rules; Rules as code; How the pipeline keeps determinism; Honest limits); Chapter 01 (The deterministic response).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What keeps governance true", "The drift engine: one model, computed severity");
  tag(s, "What");
  const classes = [
    ["Schema", "Is the shape still valid?"],
    ["Semantic", "Is the value still true?"],
    ["Provenance", "Does every change trace to an authorized source?"],
    ["Authorization", "Did anything act outside what was authorized?"],
    ["Identity", "Does every object resolve to the record?"],
  ];
  s.addTable([head(["Drift class", "The question it asks"]), ...classes.map((r, i) => [{ text: r[0], options: { bold: true, color: i < 2 ? HEX.amber : HEX.red } }, { text: r[1] }])],
    tableOpts([1.9, 5.0], { y: 1.5, fontSize: 13.5, rowH: [0.42, 0.6, 0.6, 0.6, 0.6, 0.6] }));
  tableBox(s, "Severity", "FaUserClock", HEX.navy, HEX.navyTint, "Severity sets the clock", [
    "P1: halt and alert; never fixed automatically",
    "P2: 1 hour · P3: 24 hours · P4: 72 hours",
    "Computed from the class and whether the claim is in use",
    "The actuation ladder, not severity, decides who acts",
  ]);
  callout(s, "Built", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "What's built today, stated honestly: ",
    "schema and provenance detection are built; semantic is partly built; authorization and identity are design only, found today by assessment modules and people.");
  sources(s, "Sources: NIST SP 800-128; NIST SP 800-53 Rev. 5 (CA-7, CA-7(4), CM-3(5), CM-6(2)) and SP 800-53B; Microsoft Learn — Azure Machine Configuration. Book 13, Chapters 02 and 06.");
  narrate(s,
`The drift engine compares observed state with a versioned record, not a last-known-good snapshot. An approved change updates the record first, so it isn't drift.

There's one drift model, with five classes, each a question. Schema: is the shape still valid? Semantic: is the value still true? Provenance: does every change trace to an authorized source? Authorization: did anything act outside what it was authorized to do? Identity: does every object resolve to the record? The drift checks in the other books are instances of these five, not separate lists.

Severity is computed, not argued, from the class and whether the claim is in active use. P1 halts and alerts a named role, and is never fixed automatically. P2 has an hour, P3 a day, P4 three days. Severity sets the clock; the actuation ladder decides who may act.

And be precise with an assessor about what's built: schema and provenance detection are built, semantic is partial, and authorization and identity are still design.`,
  "Book 13, Chapter 06 — The Drift Engine (What the engine compares against; The program's drift model: five classes; Severity; What the engine remediates, and what it doesn't; What is built today); Chapter 02 (How the program names drift).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What keeps governance true", "Evidence over attestation");
  tag(s, "What");
  const cmp = [
    ["What it is", "A person signing it's true", "A system-made artifact showing it"],
    ["Question", "Who is accountable?", "Is it true, and can I check?"],
    ["Time covered", "The moment of signing", "Every collection"],
    ["Verified by", "Re-reading; interviewing the signer", "Repeating the collection; comparing hashes"],
  ];
  s.addTable([head(["", "Attestation", "Evidence"]), ...cmp.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.teal } }])],
    tableOpts([1.6, 2.5, 2.8], { y: 1.5, fontSize: 13, rowH: [0.42, 0.68, 0.68, 0.68, 0.68] }));
  tableBox(s, "Agree", "FaClipboardCheck", HEX.teal, HEX.tealTint, "Federal guidance agrees", [
    "SP 800-53A: automated desired-state checks equal assessment results",
    "SP 800-37: a tool's report can be the assessment report",
    "FedRAMP: “don't simply review documentation or screenshots”",
    "Manual assessment still covers what tools can't",
  ]);
  callout(s, "Prove", 5.3, 1.2, "FaFingerprint", HEX.navy, "Claim no more than each mechanism proves: ",
    "a hash shows that something changed, a hash chain shows removal or reordering, and only a signature shows who produced it.");
  sources(s, "Sources: NIST SP 800-53A Rev. 5 (Appendix F); NIST SP 800-37 Rev. 2; FedRAMP Consolidated Rules for 2026 (IVV, CPO); NIST OSCAL; FIPS 186-5; SP 800-53 Rev. 5 (AU-9, AU-10, SI-7, SR-4). Book 13, Chapter 07.");
  narrate(s,
`An attestation is a person signing that a system was in a stated condition. It answers who is accountable, and federal authorization needs that answer. Evidence answers a different question: is the claim true, and can I check it? 

The program inverts the usual package. Evidence is the substance, and attestation is the accountability wrapper: people sign for the rules, the exceptions and the acceptance of risk.

NIST's assessment guide says that when the intended state is expressed as data and compared automatically with the actual state, the output is equivalent to control assessment results. The Risk Management Framework lets a tool's report serve as the assessment report. And FedRAMP's 2026 rules tell assessors: don't simply review documentation or screenshots.

Be careful what you claim. A hash shows that something changed. A hash chain shows removal or reordering. Only a signature shows who produced it. And some controls, like a training record or a contract clause, stay attestations.`,
  "Book 13, Chapter 07 — Evidence Over Attestation (Two artifacts, two questions; What federal assessment guidance already says; Integrity: what each mechanism proves; What changes, and what doesn't).");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content("What keeps governance true", "Adapters: every platform, one record");
  tag(s, "What");
  rows(s, "Kinds", "TWO KINDS, FIVE MISSIONS", [
    ["Conformance", "Read-only; observes and emits claims (L1)"],
    ["Modernization", "Changes state on authorized plans (L3)"],
    ["Missions", "Identity, telemetry, policy, enforcement, integration"],
    ["Two lists", "The change-making list is the grant to write"],
  ], 1.92, 0.8, 0.68);
  sideBox(s, "Invariants", "FaLock", HEX.teal, HEX.tealTint, "EVERY ADAPTER INHERITS FOUR INVARIANTS", "No opting out", [
    "Runs inside the declared authorization boundary",
    "Never edits the authoritative record",
    "Emits under a certificate-bound identity",
    "Names objects by authoritative identifier",
  ], 14.5);
  callout(s, "Lockin", 5.4, 1.1, "FaRightLeft", HEX.amber, "Lock-in moves to the adapter: ",
    "replace a vendor by writing an adapter that emits the same record. Read-only comes first, and it is verified by comparing granted permissions with the declaration.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-6, SA-9); Microsoft Learn — Graph permissions, versioning and national clouds; CISA ScubaGear permissions; Semantic Versioning 2.0.0; NIST OSCAL component definition. Book 13, Chapter 08.");
  narrate(s,
`The program doesn't replace the platforms an agency runs. It reaches each one through an adapter: a translator that reads the platform's native state through its own interface and writes it into the program's common record, with provenance. The rules, the drift engine and the evidence chain see one record, whichever vendor produced it. Adapters hold no rules and make no decisions.

Adapters come in two kinds, kept in separate lists. Conformance adapters are read-only and sit at L1. Modernization adapters change state, only on authorized plans, at L3 by default. Each declares one of five missions, and every one inherits four invariants.

Read-only comes first, and it has to be verified. CISA's ScubaGear is read-only in purpose, yet its documentation notes that a Global Administrator always has the permissions it needs. So the program compares what an identity is actually granted with what it declares.

Lock-in doesn't disappear. It moves to small, replaceable adapters and to a record the agency owns.`,
  "Book 13, Chapter 08 — The Adapter Model (An overlay, not a replacement; Two kinds; Five missions; The contract; Read-only first; Platform neutrality and lock-in).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who governs", "Who keeps the record, and who decides");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Sponsor and CIO", "Charter the board; architecture changes"], ["Authorizing official", "Residual risk, open-ended gaps, L4 classes"], ["CISO", "Requirements, drift evidence, bounded exceptions"]]],
    ["FaUsersGear", "Keep and review", HEX.teal, HEX.tealTint, [["Steward and program office", "Custody of the record; daily triage"], ["Governance board", "Every two weeks; reviews, doesn't vote"], ["Information owners", "What each fact in the record means"]]],
    ["FaClipboardCheck", "Do and check", HEX.amber, HEX.amberTint, [["Platform teams", "Mappings, runtime code, remediation"], ["Records officer", "Retention; any rewrite of history"], ["Control assessors", "Read and re-run; never edit"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "WHEN A FINDING CAN'T SIMPLY BE FIXED, OR THE RULES THEMSELVES CHANGE", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Bounded exception", "an end date and a compensating control; the CISO approves, and it never renews automatically", HEX.teal],
    ["Risk acceptance", "no end date or no compensating control; the authorizing official decides, with a POA&M entry", HEX.red],
    ["Platform change", "a change to what counts as drift needs a reviewer from outside the program office", HEX.navy],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Appendix D; Tasks P-7, M-1, M-6); NIST SP 800-137 §2.4; SP 800-53 Rev. 5 (CM-3(4), CA-5, AC-5); 36 CFR 1220.34 and 1236.10; NARA GRS 3.1. Book 13, Chapter 09.");
  narrate(s,
`None of this machinery decides anything. A drift finding asks: change the estate, change the record, or carry the difference? Only people can answer the last two, so the program names one decider for each.

The steward keeps the record: its protections, merge rights, checks and backups. The steward doesn't decide what the facts mean; HR, application and data owners do. The CISO decides control requirements, even when they're written as code, and decides on drift evidence. The governance board is the change control element NIST's CM-3 calls for. It meets every two weeks and reviews rather than votes, so every decision has one accountable owner.

The authorizing official, the only official who can accept risk, signs every open-ended gap and every class of change allowed to run at L4. A bounded exception, with an end date and a compensating control, is the CISO's, and none renews automatically.

And the repository is a federal record: the records officer decides retention, and history is never rewritten without that decision.`,
  "Book 13, Chapter 09 — Who Governs (Where the roles come from; Five questions, one owner each; The governance board; The authorizing official's role; Who governs the governors).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to run it", "Ticket to machine, within the actuation ladder");
  tag(s, "How");
  const tempo = [
    ["P1, critical", "No: the run halts and alerts", "Immediate", "A named role decides"],
    ["P2, high", "If deterministic and the class qualifies", "1 hour", "Each instance, unless L4"],
    ["P3, medium", "If the class qualifies", "24 hours", "Each instance, or the class"],
    ["P4, low", "If the class qualifies", "72 hours", "The class, reviewed after"],
  ];
  s.addTable([head(["Severity", "May a machine fix it?", "Window", "Who approves"]), ...tempo.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 0 ? HEX.red : HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: true } }, { text: r[3] }])],
    tableOpts([1.3, 2.45, 1.05, 2.1], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.7, 0.7, 0.7, 0.7] }));
  tableBox(s, "Tests", "FaListCheck", HEX.amber, HEX.amberTint, "Six tests a class must pass", [
    "A machine can reach the surface",
    "The fix comes from the record",
    "Bounded scope; blast radius known",
    "A way back, or a defined recovery",
    "A re-read can verify it",
    "Not on the permanent-L3 list",
  ], 3.62, 13);
  callout(s, "Ladder", 5.3, 1.2, "FaShieldHalved", HEX.amber, "L3 approves the instance; L4 approves the class: ",
    "the authorizing official accepts each L4 class in writing. Where no machine can reach, the fallback is an approved, time-boxed, recorded privileged session.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-3, CM-3(1), CM-6(1), AC-5, AU-14) and SP 800-53B; NIST SP 800-137; CISA BOD 26-04; CISA Federal Incident Notification Guidelines; Microsoft Learn — Entra PIM. Book 13, Chapter 10; Appendix B.");
  narrate(s,
`A platform that detects perfectly and closes slowly produces an accurate list of things nobody fixed. Tempo keeps that list short. The program declares a response window for each severity: immediate for P1, then an hour, a day and three days. External clocks win: a known exploited vulnerability runs on BOD 26-04, and an incident runs on CISA's one-hour notice.

The usual ticket sends a person to a console, and their reply of done is an assertion. The program's rule is that wherever a machine can reach the surface, the ticket authorizes a machine. A person approves; the platform executes from a versioned plan under a service identity, after a dry run, and re-reads the object to verify.

A class qualifies when it passes six tests. At L3, the default, a named approver releases each instance. At L4 the authorizing official accepts the whole class in advance. Conditional Access and tenant-wide role changes stay at L3 permanently. Where no machine can reach, the fallback is a declared, recorded privileged session, never a quiet trip to the console.`,
  "Book 13, Chapter 10 — Operational Tempo: Ticket to Machine, Not Ticket to Human (The program's tempo; Ticket to machine, not ticket to human; Which change classes qualify; Approval gates; When no machine can reach the surface); Appendix B (Severity and tempo).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to run it", "Reciprocity: shared evidence, each agency's decision");
  tag(s, "How");
  const mech = [
    ["Authorization to use", "Accept another federal entity's package for your own information", "Your official, with full ATO-level responsibility"],
    ["Joint authorization", "Several officials authorize one system together", "All of them, while they agree"],
    ["Type authorization", "One package for a system deployed identically", "Each site's official, for its deployment"],
  ];
  s.addTable([head(["NIST mechanism", "What it is", "Who accepts the risk"]), ...mech.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.teal } }])],
    tableOpts([1.75, 2.75, 2.4], { y: 1.5, fontSize: 12.5, rowH: [0.42, 1.0, 1.0, 1.0] }));
  tableBox(s, "Reuse", "FaLandmark", HEX.navy, HEX.navyTint, "M-24-15 and FedRAMP 2026", [
    "Presume a FedRAMP package adequate while it's maintained",
    "Asking for more needs a documented, demonstrable need",
    "“Each agency still authorizes its own federal information systems”",
    "46 Key Security Indicators bind providers, not agencies",
  ], 3.42);
  callout(s, "Ongoing", 5.3, 1.2, "FaArrowsRotate", HEX.teal, "Ongoing authorization keeps reuse current: ",
    "the evidence that keeps one agency's decision current keeps the shared package current for every agency that reuses it.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Appendix F); SP 800-53 Rev. 5 (CA-6(1), CA-6(2)); OMB M-24-15; OMB Circular A-130; FedRAMP Consolidated Rules for 2026 (agency rules, KSIs, Collaborative Continuous Monitoring). Book 13, Chapter 11.");
  narrate(s,
`A platform that twenty agencies use is examined by twenty assessment teams, producing twenty snapshots at twenty different times. Reciprocity is the alternative. NIST defines it as accepting each other's assessments. Nothing in it lets one authorizing official accept risk for another agency.

NIST gives three mechanisms. An authorization to use accepts another federal entity's package, and the customer's official carries the same responsibility as one issuing an authorization to operate. A joint authorization has several officials accept one system's risk together.

For cloud services, OMB's M-24-15 makes reuse the default: agencies presume a FedRAMP package adequate, but only while continuous monitoring maintains it, and asking for more needs a documented need. FedRAMP is plain that each agency still authorizes its own systems. Its 46 Key Security Indicators bind providers, not agencies; agencies review each provider's quarterly report.

So the program's old single-authorization wording is corrected: one package, many decisions, each agency signing for its own risk.`,
  "Book 13, Chapter 11 — Reciprocity, Indicators and One Authorization (What reciprocity means; What M-24-15 says about reuse; What FedRAMP's 2026 rules add; One package for a shared service; The 2026 Key Security Indicators; One body of evidence, one standing decision).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to run it", "Governance at scale: small definitions, honest coverage");
  tag(s, "How");
  steps(s, "Coverage", [["Covered", "Enforced, with evidence"], ["Partial", "Evidence or enforcement incomplete"], ["Gap", "Required, not delivered"], ["Out of scope", "Not required here"]],
    [HEX.tealTint, HEX.amberTint, HEX.redTint, HEX.grey]);
  panels(s, [
    ["FaCubes", "Hold definitions small; let uses grow", HEX.navy, HEX.navyTint, ["Fixed: the record's core, five classes, four severities", "Growing: adapters, mappings and evidence", "One repository and one merge gate", "Boundaries recorded as governed objects"]],
    ["FaTableList", "The gap closure register", HEX.amber, HEX.amberTint, ["Owner, residual risk, required evidence, date", "Close by configuration, compensate, or accept", "Only the authorizing official accepts", "Closed items stay in the register, for audit"]],
  ]);
  callout(s, "Honest", 5.25, 1.25, "FaChartLine", HEX.teal, "Report proven and asserted separately: ",
    "counts of each, not a single percentage. SP 800-137 says every implemented control must be assessed, even when its monitoring can't be automated.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-5, CA-7, PM-4, PM-31); NIST SP 800-37 Rev. 2 (Tasks P-5, P-7, R-4); NIST SP 800-137; OMB Circular A-130, Appendix I. Book 13, Chapter 12.");
  narrate(s,
`A real agency doesn't have one estate. It has hundreds of systems and several boundaries. NIST draws the line: each system's monitoring strategy follows an organization-wide one, approved by the senior accountable official for risk management, with minimum frequencies.

The program's scaling rule is to hold the definitions small and let the uses grow. The record's core, the five drift classes and the four severities stay fixed, so a P1 means the same thing in every program. Adapters, mappings and evidence grow, each validated on entry. Boundaries are recorded as governed objects, so findings cite the boundary they crossed.

Coverage is reported honestly. Every control is covered, partial, a gap, or out of scope. Every partial or gap enters a register with an owner, the evidence that will prove closure, and a date. It closes by configuration, by a compensating control, or by the authorizing official's acceptance, and closed items stay for audit.`,
  "Book 13, Chapter 12 — Governance at Scale and the Continuous-Monitoring Program (What stays small and what grows; Boundaries as governed objects; The continuous-monitoring program as a project; Coverage, gaps and how gaps close; The honest limits of coverage).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to run it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaBuildingColumns", "Charter the board; name the steward", "In writing, with one decider per decision", HEX.navy, HEX.navyTint],
    ["FaBook", "Settle the record before the change", "Who owns each fact, the rules and their provenance", HEX.teal, HEX.tealTint],
    ["FaScaleBalanced", "Set the tempo and the ladder", "L3 by default; the AO signs each L4 class", HEX.amber, HEX.amberTint],
    ["FaArrowsRotate", "Plan for ongoing authorization", "On evidence the systems produce, not attestation", HEX.red, HEX.redTint],
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
    "classify every control as covered, partial, gap or out of scope, open the gap register, and record every drift finding in one contract shape, however it was found.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; NIST SP 800-137; OMB Circular A-130; OMB M-24-15. Book 13, Chapters 01, 03, 06, 09, 10, 11 and 12.");
  narrate(s,
`So, four decisions.

Charter the governance board in writing and name the steward, with one decider for every kind of decision.

Settle the record before the next migration: which system owns each fact, the rules, and the provenance each value carries, so the migration changes who supplies a fact, not what it means.

Set the tempo: response windows by severity, gated actuation at L3 by default, and the authorizing official's signature on every class that runs at L4.

And plan the move to ongoing authorization, on evidence the systems produce rather than attestations people assemble.

The next step needs no procurement. Classify every control's coverage, open the gap register, and record every drift finding in the same contract shape, however it was found.

A package describes one day. Governance that doesn't decay keeps proving itself every day after. Book 13 has the detail, every claim footnoted. Thank you.`,
  "Book 13, Chapters 01 (Governance has to lead the change), 03, 06 (What is built today), 09, 10, 11 (One body of evidence, one standing decision) and 12 (Coverage, gaps and how gaps close); Appendix A.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Federal Information Security Modernization Act of 2014, 44 U.S.C. § 3554(b)(5).  ·  OMB Circular A-130 (July 2016), Appendix I.  ·  OMB M-24-15 (July 25, 2024).",
    "NIST SP 800-37 Rev. 2 (Tasks P-7, M-1, M-6, R-4; Appendices D and F); SP 800-137; SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; SP 800-53A Rev. 5; SP 800-128; SP 800-207; FIPS 186-5; OSCAL layers, models and reference.",
    "FedRAMP Consolidated Rules for 2026: Rev5 control reference; Key Security Indicators (46 in ten themes); agency rules; Collaborative Continuous Monitoring; Independent Verification and Validation; Certification Package Overview; machine-readable ruleset (October 13, 2026).",
    "CISA: BOD 26-04 (June 10, 2026); Federal Incident Notification Guidelines; ScubaGear and its permissions documentation.  ·  NSA and CISA Advisory AA23-278A (October 5, 2023).",
    "36 CFR §§ 1220.34 and 1236.10; NARA General Records Schedule 3.1.  ·  RFC 8785 (JSON Canonicalization Scheme); Semantic Versioning 2.0.0; Open Policy Agent; Pro Git §10.2.",
    "Microsoft Learn: Entra Privileged Identity Management; Microsoft Graph permissions, versioning and national cloud deployments; onPremisesExtensionAttributes; Azure Machine Configuration.  ·  GitHub Docs: About protected branches.",
    "Full footnotes with links and access dates: Book 13, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b13-governance/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
