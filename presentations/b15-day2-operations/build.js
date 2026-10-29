// Book 15 — Compliance Automation & Day-2 Operations: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b15-day2-operations/build.js presentations/b15-day2-operations/B15_Day2_Operations.pptx
// Every fact comes from a footnoted chapter of docs/books/b15-day2-operations/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 15", title: "Compliance Automation & Day-2 Operations" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B15_Day2_Operations.pptx";

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
const rows = (s, prefix, label, list, top, step, h, size) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: size || 14, valign: "middle" });
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
const steps = (s, prefix, list, tints, labels, labelColor) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: labels ? labels[i] : `${i + 1}`, options: { bold: true, color: labelColor ? labelColor[i] : HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
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
// Two tall tinted columns, each with an icon, a small label, a heading and a bullet list.
const columns = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Column ${i + 1}`, x, 1.5, 6.0, 3.6, c[3]);
  icon(s, c[0], x + 0.25, 1.68, 0.68, c[2]);
  txt(s, `Column head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 18, fontFace: "Cambria" } },
  ], { x: x + 1.12, y: 1.66, w: 4.75, h: 0.75, valign: "middle" });
  txt(s, `Column text ${i + 1}`, bullets(c[5], size || 14), { x: x + 0.3, y: 2.6, w: 5.45, h: 2.4, paraSpaceAfter: 6 });
});

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why day two decides", "Can Your Help Desk Run the New Estate?", "Book 15 — Compliance Automation & Day-2 Operations");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing for CIOs, service desk and operations leads, and ISSOs", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 15 of the Federal Modernization Workbook, Compliance Automation and Day-Two Operations. It's written for C I Os, service desk and operations leads, and information system security officers.

I'll take four questions: why modernization succeeds or fails at the help desk; what day two runs on; who runs it; and how to run it and prove it works.

The short version: cutover proves the new estate can be built. The first locked-out user on Monday morning proves whether it can be run.`,
  "Book 15, index; Chapter 01 — Modernization Succeeds or Fails at the Help Desk.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why day two decides", "The help desk holds the keys");
  tag(s, "Why");
  columns(s, [
    ["FaTriangleExclamation", "AS FOUND", HEX.red, HEX.redTint, "A click and a reply", [
      "An emailed request; a standing admin account",
      "“Require re-register MFA” with no check on who asked",
      "The temporary password goes back to the same inbox",
      "The next person to enroll a method owns the account",
    ]],
    ["FaUserCheck", "UNDER THE NEW MODEL", HEX.teal, HEX.tealTint, "A request with a record", [
      "A typed request against the identity record",
      "The person verified to the CISO's procedure",
      "A just-in-time, scoped role; a pass on a separate channel",
      "Closed with who asked, who approved and what changed",
    ]],
  ], 14);
  callout(s, "Transfer", 5.3, 1.2, "FaKey", HEX.red, "An authenticator reset is an account transfer: ",
    "Microsoft labels Helpdesk Administrator privileged. CISA's Scattered Spider advisory describes callers who got help desks to reset passwords and transfer MFA tokens.");
  sources(s, "Sources: Microsoft Learn, Entra built-in roles and MFA user settings; CISA Advisory AA23-320A, Scattered Spider (rev. July 29, 2025). Book 15, Chapters 01 and 02.");
  narrate(s,
`A modernization program spends most of its attention on day one: the tenant is built, identities synchronize, the cutover runs. The estate is judged on day two, when every reset, unlock and new hire lands at the help desk.

In Entra ID the help desk's power is explicit. Microsoft labels the Helpdesk Administrator role privileged, and warns that changing a user's password may mean the ability to assume that user's identity. Requiring M F A re-registration deletes the user's phones, Authenticator registrations and software tokens, and whoever signs in next and registers a method controls the account. So a reset on an unverified request isn't a support task. It's a transfer of the account to whoever asked.

Attackers know it. CISA's advisory on the Scattered Spider group describes calls that convinced help desk staff to reset passwords and transfer M F A tokens. And when the governed path is hard, the desk works around it: an emergency admin account, an email treated as a request, a temporary password sent back to the same inbox.`,
  "Book 15, Chapter 01 — Modernization Succeeds or Fails at the Help Desk (The help desk holds the keys; Attackers know where the keys are; How modernization quietly reverts); Chapter 02 (What changes for everyday tasks).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why day two decides", "Federal guidance treats recovery as a bypass");
  tag(s, "Why");
  cards(s, "Guide", [
    ["FaLandmark", "OMB M-22-09", HEX.navy, HEX.navyTint, ["Phishing-resistant MFA for staff, contractors and partners", "Recovery is “a potential bypass” and a significant threat vector", "High friction: in-person or live video"]],
    ["FaIdCard", "NIST SP 800-63B-4", HEX.teal, HEX.tealTint, ["Four recovery methods, July 2025", "A help desk agent only on a documented risk analysis", "Re-proofing as strong as the original; always notify"]],
    ["FaClipboardCheck", "The control catalog", HEX.amber, HEX.amberTint, ["IA-5: verify who receives an authenticator", "IA-5(1): a new password after recovery", "IA-12: identity proofing; all at Moderate"]],
  ], 13.5);
  callout(s, "Never", 5.3, 1.2, "FaUserXmark", HEX.red, "These verify no one: ",
    "email alone, caller ID, a callback to a number the caller supplies, knowledge questions, or a manager's say-so. The reset is an exception, high-friction for the account's risk, and always followed by a notice.");
  sources(s, "Sources: OMB M-22-09 (Jan. 26, 2022); NIST SP 800-63B-4 (July 2025), §§ 4.2, 4.6; NIST SP 800-53 Rev. 5 (IA-5, IA-5(1), IA-12), release 5.2.0. Book 15, Chapters 01 and 03.");
  narrate(s,
`Two federal documents frame the reset and recovery path. OMB's zero trust memorandum, M-22-09, requires phishing-resistant M F A, and then names the hole: recovery processes are a potential bypass of standard authentication, and a significant threat vector if not mitigated. It asks for high-friction methods that are costly for an adversary, such as in-person verification or live video.

NIST's digital identity guidelines, revised in July 2025, give recovery its own section. They recognize four methods: saved recovery codes, issued recovery codes, recovery contacts, and repeated identity proofing. A help desk agent is allowed only on the basis of a documented risk analysis, repeated proofing has to be consistent with the original, and every recovery must notify the account holder.

Read together, the help desk reset has to be an exception, not the main path; high-friction for the account's risk; at least as strong as the original proofing; and always followed by a notice. Email, caller I D and knowledge questions verify no one.`,
  "Book 15, Chapter 01 (Federal guidance treats recovery as a bypass); Chapter 03 — Intake, Triage and Routing (Verify the person before a sensitive action).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why day two decides", "Compliance decays a click at a time");
  tag(s, "Why");
  const erode = [
    ["AC-2", "An account created from an email has no approval"],
    ["AC-6", "Routine work done under standing admin rights"],
    ["IA-5", "A reset on an unverified request"],
    ["CM-3", "A change whose only trace is a “done” reply"],
    ["CM-8", "A server stood up by hand never reaches the inventory"],
    ["AU-9", "Logs on a share the audited admins can edit"],
  ];
  s.addTable([head(["Control", "How hand-run day-two work erodes it"]), ...erode.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([1.2, 5.7], { y: 1.5, fontSize: 13, rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  tableBox(s, "Rules", "FaRoute", HEX.red, HEX.redTint, "Five rules for every operation", [
    "Originate with the source of truth",
    "Carry the approval the control requires",
    "Run under a just-in-time scoped role",
    "Close with proof the change took",
    "Emit the evidence automatically",
  ], 3.42);
  callout(s, "Layers", 5.3, 1.2, "FaArrowsRotate", HEX.red, "Designed, deployed, operated: ",
    "a control designed and deployed still decays without an owner, a gate, a clock and an evidence feed. Moderate asks for automation only in places; automating the rest is a design choice about volume.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and SP 800-53B Moderate baseline, release 5.2.0 (AC-2, AC-2(1), AC-2(4), AC-6, IA-5, CM-3, CM-8, CM-8(1), AU-9); NIST SP 800-137. Book 15, Chapter 02.");
  narrate(s,
`The same argument holds from the side of the authorization package. An authorization describes the system as it was assessed. The day after, the help desk resets passwords, onboards people, changes groups and fixes a synchronization error, and each change touches a control: account management, least privilege, authenticators, change control, the inventory, the audit trail. Done as portal clicks, each leaves no record the control recognizes, and the package ages with every click.

The moderate baseline asks for automation only in specific places, so the book's emphasis on automation is a design position about volume. At day-two volume, people assembling the record by hand can't keep up, and what they produce is a reconstruction, not evidence.

A control passes three layers: designed, deployed as code, and operated, with an owner, a gate, a clock and an evidence feed. Every operation starts from the source of truth, carries the approval its control requires, runs under a just-in-time role, closes with proof and emits its evidence. Miss one, and the work can't be attested.`,
  "Book 15, Chapter 02 — Day Two Is Where Compliance Lives or Dies (Compliance decays through routine work; Designed, deployed, operated; The day-two operating rules).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What day two runs on", "One front door, triage by authority");
  tag(s, "What");
  steps(s, "Class", [["No access change", "Verified reset; log lookup"], ["Own account", "Requester's manager approves"], ["Owner-governed", "Application owner approves"], ["Governance action", "Owner and governance officer"], ["Out of scope", "Escalate to security or engineering"]],
    [HEX.grey, HEX.grey, HEX.navyTint, HEX.navyTint, HEX.redTint], ["A0", "A1", "A2", "A3", "Escalate"], [HEX.amber, HEX.amber, HEX.amber, HEX.amber, HEX.red]);
  panels(s, [
    ["FaDoorOpen", "Every source, one queue", HEX.navy, HEX.navyTint, ["Mailbox rule redirects; a blind copy leaves two queues", "Pilot the rule in audit mode first", "A reroute rule pulls back work sent straight to cloud services"]],
    ["FaFilter", "Dangerous cases first", HEX.teal, HEX.tealTint, ["Claims to come from Microsoft: escalate only", "Target holds a directory role: escalate", "Check the tenant's audit log, not the sender"]],
  ]);
  callout(s, "Reject", 5.25, 1.25, "FaListCheck", HEX.navy, "Silence never grants access: ",
    "every approval carries a due date that rejects or cancels, never approves. The ticket closes with the approval chain, the verification rung, the role activation and the audit-log reference.");
  sources(s, "Sources: Microsoft Learn, New-TransportRule and PIM email notifications; ServiceNow, inbound email actions and Ask for Approval. Book 15, Chapter 03; classes as settled in Book 04, Chapter 06.");
  narrate(s,
`Now what day two runs on, starting at the front door. Nothing is handled as ad hoc email to the cloud services team. Self-service requests, the team mailbox, the identity governance platform and monitoring alerts all land in one triage queue in the service management platform. The mailbox rule has to redirect, not blind-copy, or there are two queues; pilot it in audit mode first. A reroute rule pulls back anything assigned straight to cloud services.

Triage asks one question: what authority does this task need? No access change is class A0. A change to the requester's own account is A1, and the manager approves. Access an owner governs is A2. Governance actions, such as admin consent, are A3 and never automated. Conditional Access and directory roles escalate.

The checks run in a fixed order, so the dangerous cases are caught first: anything claiming to come from Microsoft, then any target holding a directory role. And an approval nobody answers expires to reject, never to approve.`,
  "Book 15, Chapter 03 — Intake, Triage and Routing (One front door; Redirecting the mailbox; Triage by required authority; Routing: two pipelines and an escalation lane; The evidence each ticket leaves).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What day two runs on", "Least-privileged roles, and verify before acting");
  tag(s, "What");
  rows(s, "Role", "THE ROLE, THE TARGET, THE SCOPE", [
    ["Password reset", "Password or Helpdesk Administrator"],
    ["Methods and passes", "Authentication Administrator, members only"],
    ["Privileged admins", "Privileged Authentication Admin: not the desk"],
    ["App assignment", "A custom role, never Application Admin"],
    ["Scope", "Administrative units; executives restricted"],
    ["Delivery", "Role-assignable groups, eligible through PIM"],
  ], 1.92, 0.56, 0.5, 13.5);
  sideBox(s, "Ladder", "FaFingerprint", HEX.teal, HEX.tealTint, "THE CISO SETS THE VERIFICATION LADDER", "Approval isn't verification", [
    "Phishing-resistant sign-in: proceed",
    "Every method lost: identity proofing, in person or by Entra account recovery",
    "A directory role on the target: escalate",
    "One-time pass, shortest lifetime; notify on another channel",
  ], 14);
  callout(s, "Two", 5.4, 1.1, "FaUserShield", HEX.teal, "High-risk tasks need two approvers besides the executor: ",
    "a reset for a protected account, an ImmutableID repair, an out-of-lifecycle delete. PIM's ticket field isn't checked, so the program correlates it in the SIEM.");
  sources(s, "Sources: Microsoft Learn, privileged roles and permissions, restricted management units, PIM settings, Temporary Access Pass, account recovery; NIST SP 800-63B-4. Book 15, Chapters 03 and 04; Appendix A.");
  narrate(s,
`In Entra ID, three things decide what a technician can do: the role decides the action, the target decides whether it applies, and the administrative unit narrows the population. The least-privileged role for a non-admin password reset is Password Administrator. Authentication Administrator handles methods and Temporary Access Passes for members. Only the Privileged Authentication Administrator can reset a privileged administrator, so that role sits outside the desk.

Capability isn't authority. Authentication Administrator can delete and disable users, and Application Administrator can grant consent, so the program replaces it with a custom role that only assigns groups to applications. Executives sit in restricted management units the general desk can't reach. Roles reach technicians through role-assignable groups, eligible through P I M.

And approval isn't identity verification. The ladder is the CISO's decision: a phishing-resistant sign-in first; identity proofing, in person against a PIV card or through Entra account recovery, when every method is lost. Then a one-time pass with the shortest lifetime, a notice on a separate channel, and for high-risk tasks, two approvers besides the executor.`,
  "Book 15, Chapter 04 — Help Desk Authority in Entra ID (The built-in roles; Capability is not authority; Restricted management units; How the roles reach a technician; The high-risk tasks); Chapter 03 (Verify the person before a sensitive action); Appendix A.");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What day two runs on", "Catalogs and SaaS: typed requests, verdict first");
  tag(s, "What");
  columns(s, [
    ["FaTableList", "THE SERVICE CATALOGS", HEX.navy, HEX.navyTint, "Every change is a typed request", [
      "Ten identity items, each bound to its control and gate",
      "Closes only when a read of the target confirms it",
      "Leaver: disable, revoke, deprovision apps, reassign",
      "Telephony: a validated 911 address gates every number",
    ]],
    ["FaCloud", "SAAS INTEGRATION GOVERNANCE", HEX.teal, HEX.tealTint, "No verdict, no configuration", [
      "GCC shows the full commercial app gallery",
      "A FedRAMP Marketplace verdict recorded first",
      "Program default for identity data: Class C or higher",
      "Single sign-on without provisioning is a manual island",
    ]],
  ], 14);
  callout(s, "Whether", 5.3, 1.2, "FaScaleBalanced", HEX.teal, "Consent restriction answers who, not whether: ",
    "a tenant can pass every consent check and still let an administrator, within policy, connect a service with no FedRAMP certification. Only a recorded verdict closes that gap.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5; 47 CFR §§ 9.3, 9.16; CISA BOD 25-01 required configurations (MS.AAD.5); FedRAMP Marketplace data (Oct. 21, 2026); Microsoft Learn, app provisioning. Book 15, Chapters 05 and 06.");
  narrate(s,
`Every routine change arrives as a typed request. The help desk catalog has ten items, for joiners, movers, leavers, credentials, groups, licenses, Conditional Access exceptions and guests, each bound to the control it exercises and the approval that control needs. Each item closes only when a read of the target confirms the change. The leaver fails audits most often: disable the account, revoke sessions, deprovision every connected application, and reassign what the person owned. And federal 911 rules bind whoever operates the phone system, so a validated emergency address gates every number assignment.

SaaS integration is the densest moment. In GCC, an administrator sees the full commercial application gallery and can federate a third-party service in about fifteen minutes, and nothing in the vendor's path asks about authorization. Restricting consent decides who may approve, not whether the service may hold federal data. So the catalog records a FedRAMP Marketplace verdict before anything is configured, with Class C or higher as the program's default for identity data.`,
  "Book 15, Chapter 05 — The Service Catalogs: ITSM and Teams Telephony (The identity catalog; The leaver is the one that fails audits; Emergency calling is the agency's obligation); Chapter 06 — SaaS Integration Governance (Why the gate has to be the agency's; Consent restriction answers who, not whether; Phase 1).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What day two runs on", "The CMDB is a reconciled projection");
  tag(s, "What");
  steps(s, "Recon", [["Populate", "Discovery and connectors, never hand entry"], ["Identify", "The platform's engine stops duplicates"], ["Match", "Authoritative name or address first"], ["Bind or flag", "Shadow asset, or a naming-plane gap"]],
    [HEX.grey, HEX.grey, HEX.navyTint, HEX.tealTint], ["1", "2", "3", "4"]);
  panels(s, [
    ["FaDatabase", "What the inventory control asks", HEX.navy, HEX.navyTint, ["Accurate, complete, no duplicate accounting", "Moderate: updated with every install and removal", "Discover assets every 7 days (BOD 23-01)"]],
    ["FaSitemap", "Duplicates and stale items", HEX.teal, HEX.tealTint, ["Resolve duplicates by binding, not deleting", "Disable and attest before retiring a stale item", "Fix naming gaps upstream, never in the CMDB"]],
  ]);
  callout(s, "Patch", 5.25, 1.25, "FaTriangleExclamation", HEX.navy, "Patching and evidence depend on it: ",
    "a fix that lands on one duplicate leaves the finding open on the other, and compliance computed over phantom items is wrong. Watch for the connector that quietly returns half its records.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and SP 800-53B (CM-8 and enhancements); NIST SP 800-128; CISA BOD 23-01; ServiceNow, IRE, CMDB Health and Data Manager; Microsoft Learn, stale devices. Book 15, Chapter 07.");
  narrate(s,
`Every ticket names an asset, so the help desk can only be as right as the inventory it routes to. The configuration database earns that trust by agreeing with one authoritative identity, not by being one. Discovery and connectors populate it; the naming and addressing record governs identity. Where the two disagree, the database is wrong, and the disagreement is a finding.

The inventory control asks for no duplicate accounting of components. ServiceNow's identification and reconciliation engine already prevents duplicates and lets only authorized sources write each attribute. The program adds one pass: match each asset to the naming record first, bind it, and flag the rest, either a shadow asset nobody approved, or a gap that's fixed in address management, never in the database.

Duplicates are resolved by binding, not deleting, so no open finding loses its asset. Stale items are disabled and attested before they're retired. It matters because a fix that lands on one duplicate leaves the finding open on the other. And watch the connector that quietly returns half its usual records.`,
  "Book 15, Chapter 07 — The CMDB and Asset Identity (The CMDB is a projection, not the authority; What CM-8 asks of an inventory; How the platform reconciles, and what the program adds; Duplicate CIs; Stale CIs; Why patching and evidence depend on it).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What day two runs on", "Control automation per cloud, and the gaps");
  tag(s, "What");
  const clouds = [
    ["Microsoft 365", "ScubaGear, Graph, Purview", "Compliance Manager continuous assessments still rolling out in GCC"],
    ["Azure", "Azure Policy, Defender for Cloud", "Defender's ServiceNow integration not in Azure Government"],
    ["AWS", "Config packs, Security Hub CSPM", "Audit Manager closed to new accounts; no GovCloud endpoint"],
    ["VMware VCF", "Config Profiles, posture scans", "9.1 lists no NIST benchmark; map the vendor hardening guide to CM-6"],
  ];
  s.addTable([head(["Platform", "Native tests", "Government-cloud or on-premises gap"]), ...clouds.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.red } }])],
    tableOpts([1.45, 2.2, 3.25], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.75, 0.75, 0.75, 0.75] }));
  tableBox(s, "Loop", "FaArrowsRotate", HEX.navy, HEX.navyTint, "One loop on every surface", [
    "The native tool tests",
    "Drift is detected",
    "A typed task is raised against the CI",
    "The owner fixes it natively",
    "Closed on a re-test, not a click",
  ], 3.42);
  callout(s, "Dates", 5.3, 1.2, "FaUserClock", HEX.navy, "Dates to plan around: ",
    "AWS Audit Manager closed to new customers April 30, 2026; the AWS ServiceNow connector loses support March 31, 2027; Security Hub keeps findings 90 days. The service platform reads control state; it never writes it.");
  sources(s, "Sources: CISA ScubaGear v1.8.0, BOD 25-01; Microsoft Learn (Defender for Cloud support matrix; Purview GCC plan); AWS docs (Audit Manager, Service Management Connector, Security Hub); Broadcom TechDocs, VCF 9.0 and 9.1. Book 15, Chapters 08 and 09.");
  narrate(s,
`Microsoft, AWS and VMware already ship tools that test most of the settings an assessor asks about. The gap is turning each failed test into owned work with a clock, and each closed task into a record. The program runs one loop everywhere: the native tool tests, drift is detected, a typed task is raised against the configuration item, the owning team fixes it natively, and the task closes on a re-test, not a click. The service management platform reads control state; it never writes it.

The government clouds differ. Defender for Cloud's ServiceNow integration isn't available in Azure Government. Compliance Manager's continuous assessments are still rolling out in GCC. AWS Audit Manager closed to new customers on April 30, 2026, and has no GovCloud endpoint. AWS's ServiceNow connector loses support on March 31, 2027, and Security Hub keeps findings only ninety days. In VMware Cloud Foundation 9.1, the compliance benchmarks were replaced by a posture tool built on Broadcom's own hardening guide, with no NIST 800-53 benchmark, so the agency maps that guide, and CIS ESXi where it uses it, to its own CM-6 settings. On premises, the agency produces every piece of evidence itself.`,
  "Book 15, Chapter 08 — Control Compliance Automation: Microsoft 365 and Azure (One loop on every surface; Purview Compliance Manager; Three routes to the ITSM platform); Chapter 09 — Control Compliance Automation: AWS and VMware (AWS Audit Manager; Getting AWS results into the ITSM platform; VMware: the on-premises evidence gap).");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content("What day two runs on", "Native ServiceNow capabilities first");
  tag(s, "What");
  const native = [
    ["Control tests and issues", "Policy and Compliance Management", "Load controls from the control map"],
    ["RMF workflow, POA&M view, OSCAL", "Continuous Authorization and Monitoring", "Link each POA&M item to its fix"],
    ["Posture findings to work", "Configuration Compliance", "A path for Azure Government, AWS, VMware"],
    ["CI identity and health", "IRE, CMDB Health, Data Manager", "Reconcile to the asset identity"],
    ["Close only with proof", "Workflow configuration", "The closure gate; flag human-only"],
  ];
  s.addTable([head(["Need", "Native coverage", "What the agency adds"]), ...native.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.teal } }])],
    tableOpts([1.95, 2.55, 2.4], { y: 1.5, fontSize: 12, rowH: [0.4, 0.6, 0.6, 0.6, 0.6, 0.6] }));
  tableBox(s, "Buy", "FaCubes", HEX.navy, HEX.navyTint, "Buy first, build the rest", [
    "Government offering: FedRAMP Certified, Class D (High)",
    "The Entra ID spoke has no MFA reset action",
    "Systems prove what they can see; people attest the rest",
    "FedRAMP's indicators bind providers, not agencies",
  ], 3.42, 13);
  callout(s, "Record", 5.3, 1.2, "FaClipboardCheck", HEX.navy, "The platform is the workflow record, not the evidence store: ",
    "it holds the test, the approval, the POA&M item and the closure. Telemetry stays in the log stores, so the agency can change platforms without losing its evidence.");
  sources(s, "Sources: ServiceNow docs (Policy and Compliance Management; Continuous Authorization and Monitoring release notes; Configuration Compliance; IRE; Entra ID spoke); FedRAMP Marketplace data (Oct. 21, 2026); FedRAMP 2026 rules. Book 15, Chapters 02, 03, 07, 08 and 11.");
  narrate(s,
`Before anyone builds a compliance application, know what the platform already does. ServiceNow's Policy and Compliance Management schedules control tests and turns gaps into issues. Continuous Authorization and Monitoring walks the seven steps of the Risk Management Framework, gives one view of every plan of action, and in recent releases imports and exports security plans, plans of action and assessment results in OSCAL. Configuration Compliance imports Defender for Cloud results and matches them to configuration items. The government offering is listed as FedRAMP Certified at Class D, High.

So the recommendation is to buy the native applications first and build only what they don't do: join every finding to the authoritative asset identity, close only with proof and flag human-only closures, and check the platform's control set against the control map.

A control is proven by system evidence wherever a system can see it; people attest only to what no system can observe. And FedRAMP's indicators bind providers; for the agency they're vocabulary, not a deliverable.`,
  "Book 15, Chapter 11 — Attestation, Evidence and the Compliance Application (System evidence first; A correction about FedRAMP's indicators; The platform is the workflow record; What ServiceNow already provides; Build, buy or both); Chapter 02 (What the platform already ships); Chapter 03 (Prefer the connector); Chapter 07; Chapter 08 (Where ServiceNow's own products overlap).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who runs day two", "One decider per row, and nobody holding the keyboard");
  tag(s, "Who");
  const cols = [
    ["FaUsersGear", "Execute", HEX.teal, HEX.tealTint, [["Service desk, first line", "Intake, triage, verification, execution"], ["Cloud services, second line", "Escalation tier, not a second queue"], ["Supervisor", "Approves routine credential work only"]]],
    ["FaSitemap", "Own the artifacts", HEX.navy, HEX.navyTint, [["Platform owners", "Runbooks and what each catalog item does"], ["CISO or governance officer", "The approval gate an item enforces"], ["CMDB owner", "The model and the queue, not the facts"]]],
    ["FaBuildingColumns", "Authorize and accept", HEX.amber, HEX.amberTint, [["Change advisory board", "Authorizes changes; doesn't accept risk"], ["System owner and ISSO", "Remediation, impact analysis, evidence"], ["Authorizing official", "Accepts risk; government-only"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "THE SEPARATIONS THE PLATFORM ENFORCES", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Executors don't approve", "the platform refuses a ticket whose approver and executor are the same identity", HEX.teal],
    ["Nobody changes their own gate", "an approval-rule change is a normal change the advisory board authorizes", HEX.navy],
    ["Contractors prepare", "a contracted desk executes and prepares; government officials decide", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Appendix D; Task M-1); SP 800-53 Rev. 5 (AC-5, CM-3, CM-3(4), CM-5, CM-8(4), CM-9(1)); SP 800-128; ServiceNow change types. Book 15, Chapter 10.");
  narrate(s,
`Day two is run by the people who touch the estate most often and decide the least, so every decision sits with someone who isn't holding the keyboard, and every artifact has one owner and a review date.

The service desk has three lines. The first takes every request, classifies it, verifies the person and executes against an approved ticket. Cloud services is the escalation tier, not a second queue. Technicians approve nothing. The supervisor approves routine credential work for ordinary users, never a ticket they execute.

Platform owners own the runbooks and what each catalog item does. The control owner, the CISO or the identity governance officer, owns the approval gate. The service management team builds both and decides neither: changing an approval rule is a normal change the change advisory board authorizes. The configuration database owner keeps the model, not the facts. The board has security and privacy members and authorizes changes, but doesn't accept risk; that goes to the CISO or the authorizing official. A contracted desk fits, because contractors prepare and execute while government officials decide.`,
  "Book 15, Chapter 10 — Who Runs Day Two (Where the roles come from; The service desk lines; The ITSM platform team; The CMDB owner; The change advisory board; The authorizing official; The responsibility matrix; Keeping the roles apart).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to run it and prove it", "The runbook, and harnesses that check the automation");
  tag(s, "How");
  steps(s, "Cadence", [["Probe and route", "Sync probe; log sources; tasks closed with proof"], ["Test the detectors", "Replay known-bad events; review human-only closures"], ["Regenerate and review", "Results and POA&M; harness results"], ["Step back", "Privileged access; trends; refresh the library"]],
    [HEX.amberTint, HEX.amberTint, HEX.navyTint, HEX.tealTint], ["Daily", "Weekly", "Monthly", "Quarterly"]);
  panels(s, [
    ["FaListCheck", "Everyday tasks, governed", HEX.navy, HEX.navyTint, ["A reset delivered on a separate channel", "Parameters travel; commands don't", "A read-only probe replaces the morning logon"]],
    ["FaChartLine", "Make silent failure loud", HEX.teal, HEX.tealTint, ["A source past its freshness limit raises an alert", "A deploy that doesn't close its control fails", "Workflow tests run only in non-production"]],
  ]);
  callout(s, "Ran", 5.25, 1.25, "FaTriangleExclamation", HEX.amber, "A harness that stops running looks like one that passes: ",
    "the monthly review checks that each one ran. At Moderate the harnesses are evidence for control assessment and continuous monitoring; SI-6 is in the High baseline only.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and SP 800-53B (CA-2, CA-7, AC-6(7), AU-9, SI-6); Microsoft Learn (Entra Connect Sync scheduler; Connect Health; KQL union); ServiceNow ATF. Book 15, Chapter 12.");
  narrate(s,
`The runbook turns all of this into a cadence, and each step says what it proves. Daily, a read-only synchronization probe replaces the morning interactive logon to the sync servers, and each error becomes a task; a completeness check confirms every log source is still sending; catalog tasks close with proof. Weekly, detection rules are tested against replayed known-bad events, and every task closed without automated proof is either evidenced or reopened. Monthly, results and the plan of action are regenerated, and the I S S O reviews the harness results. Quarterly, privileged access and trends are reviewed.

The runbook also rewrites eight everyday tasks. A password reset is delivered on a channel separate from the request. A requester's script is never pasted and run: parameters travel, commands don't.

The harnesses check the automation itself. A source past its freshness limit raises a high-severity alert. A deployment that doesn't close its control fails the pipeline. And a harness that stops running looks like one that passes, so check that each one ran.`,
  "Book 15, Chapter 12 — The Day-Two Operator Runbook and Validation (The runbook at a glance; Daily: the eight everyday tasks, governed; Weekly, monthly and quarterly; Validation and test harnesses; What the harnesses can't prove).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to run it and prove it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaFingerprint", "Put verification under the CISO", "Most friction on sensitive accounts; alert on every reset", HEX.red, HEX.redTint],
    ["FaDoorOpen", "Build one front door", "Redirect the mailbox; triage by authority; expire to reject", HEX.navy, HEX.navyTint],
    ["FaCubes", "Buy native, build the gaps", "Verdict before SaaS; check every feature in your cloud", HEX.teal, HEX.tealTint],
    ["FaUsersGear", "Fund the third layer", "Owner, gate, clock, evidence feed; mostly automation", HEX.amber, HEX.amberTint],
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
    "measure before you build. Run the read-only SaaS integration inventory and synchronization probe in a test tenant, size the catalog from what they find, and plan the move off AWS's ServiceNow connector before March 31, 2027.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-63B-4; FedRAMP Marketplace data; AWS Service Management Connector end-of-support notice. Book 15, Chapters 01, 02, 03, 06, 08, 09, 11 and 12.");
  narrate(s,
`So, four decisions.

Put the identity-verification procedure under the CISO, and treat every authenticator reset as an account transfer: the most friction on the most sensitive accounts, and an alert on every reset.

Build one front door. Redirect the team mailbox, triage by authority, and let unanswered approvals expire to reject.

Buy the platform's native compliance applications first, and build only what they lack. Record an authorization verdict before any SaaS integration is configured, and check every feature in your own cloud.

And fund the third layer: an owner, a gate, a clock and an evidence feed for every control.

The next step needs no procurement. Measure before you build: run the read-only integration inventory and synchronization probe in a test tenant, size the catalog from what they find, and plan the move off AWS's ServiceNow connector before March 31, 2027.

Operations is where modernization becomes routine or quietly reverts. Book 15 has the detail, every claim footnoted. Thank you.`,
  "Book 15, Chapters 01 (What leadership should take from this), 02 (What leadership should take from this), 03 (Key takeaways), 06 (Honest limits; the read-only inventory), 08 and 09 (What to take from this chapter), 11 (Build, buy or both) and 12 (the morning synchronization check); index.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "OMB M-22-09 (January 26, 2022).  ·  NIST SP 800-63B-4 (July 2025), §§ 2.2.2, 3.2.5, 4.1.2.1, 4.2, 4.6.  ·  NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B baselines; SP 800-37 Rev. 2; SP 800-128; SP 800-137.",
    "CISA: Advisory AA23-320A, Scattered Spider (November 16, 2023, revised July 29, 2025); BOD 23-01; BOD 25-01 and its required configurations; ScubaGear v1.8.0; BOD 26-04 (June 10, 2026).  ·  FCC 19-76; 47 CFR §§ 9.3, 9.16.",
    "FedRAMP Consolidated Rules for 2026 (Using a Certified Cloud Service; Key Security Indicators; Security Decision Record; Vulnerability Detection and Response); FedRAMP Marketplace data, products.json (October 21, 2026).",
    "Microsoft Learn: Entra built-in roles, privileged roles, administrative and restricted management units, PIM, Temporary Access Pass, account recovery and Verified ID, SSPR and writeback, app provisioning, Defender for Cloud, Azure Policy, Purview, Teams emergency calling, Entra Connect.",
    "ServiceNow: Microsoft Entra ID spoke; inbound email and approvals; MID Server; Discovery, IRE, CMDB Health and Data Manager; Policy and Compliance Management; Continuous Authorization and Monitoring; Configuration Compliance; change types; ATF.",
    "AWS: Config conformance packs, Security Hub CSPM and Security Hub, Audit Manager availability change, Service Management Connector end of support.  ·  Broadcom: vSphere Configuration Profiles, Lifecycle Manager, VCF Operations 9.0 and 9.1 (Security Posture Management).  ·  CIS Benchmarks (VMware ESXi).",
    "Full footnotes with links and access dates (October 21, 2026): Book 15, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b15-day2-operations/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
