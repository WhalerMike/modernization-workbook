// Companion guide — Ansible for Configuration Automation: the TECHNICAL deep dive, in four modules.
//   Module 1 — What Ansible is, and where it fits (the tool table, one owning tool per setting, the coverage tiers and
//              tracks, Arc onboarding at scale, the tier-2 populations).
//   Module 2 — Ansible Automation Platform in a federal setting (versions, authorization status, FIPS, baseline content, hosting,
//              sign-in, logging, content, and the controller as a non-person identity).
//   Module 3 — Evidence and dangers (CM-2, CM-3, CM-6, CM-7, CM-8, AU, AC-6, SR; the dangers table and lint).
//   Module 4 — Adoption and the examples (the phased path, the CMDB-driven inventory, the four playbooks, the tests,
//              the checklist and the decisions).
// Build:  node presentations/guide-ansible-technical/build.js presentations/guide-ansible-technical/Guide_Ansible_Technical.pptx
// Every fact on a slide comes from docs/books/guides/ansible-configuration-automation.md (checked October 29, 2026),
// the books it links, or the example folder's README (examples/ansible/README.md); the notes name the guide section.
// The program's own recommendations are labeled "design guidance", as the guide does, and the items the guide marks
// not published or unverified stay labeled that way. The example playbooks are described, not reproduced.
// The guide has no committed diagrams, so the deck uses the kit's tables, panels and callouts and draws no images.
// Narration: narration.json (intent-first voice, keyed by slide title) is read by presentations/_build/narrate.py
// (the editor runs that). The notes keep the full detail for a live presenter.
const D = require("../_build/lib.js")({
  book: "Companion guide",
  title: "Ansible for Configuration Automation — Technical Deep Dive",
  footer: "Federal Modernization Workbook  ·  Companion guide: Ansible for Configuration Automation — Technical Deep Dive",
});
const { HEX, txt, box, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "Guide_Ansible_Technical.pptx";

// ------------------------------------------------------------------ helpers
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`${name} callout`, y + h);
  if (process.env.FIT) console.log(`  callout ${name}: bottom ${(y + h).toFixed(2)} in`);
  return D.callout(s, name, y, h, iconName, color, label, text);
};

// Speaker notes with an automatic timing cue (live delivery runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0, modWords = 0;
const modules = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const GUIDE = "Companion guide, Ansible for Configuration Automation";
const notes = (s, body, section) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; modWords += n;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${GUIDE} — ${section}`);
};
const endModule = (name) => { modules.push([name, modWords]); modWords = 0; };

// Titles: at most 58 characters and unique across the deck (narrate.py keys narration on them).
const titles = new Set();
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.has(t)) throw new Error(`duplicate slide title: ${t}`);
  titles.add(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));

// The short Sources line on every content slide: at most 185 characters.
const sources = (s, text) => {
  if (text.length > 185) throw new Error(`sources line over 185 characters (${text.length}): ${text}`);
  return D.sources(s, text);
};

// A table whose row heights follow the text. rows: arrays of strings or {text, options}.
const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.34, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, w: colW.reduce((a, b) => a + b, 0), h: rowH.reduce((a, b) => a + b, 0), fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`${name} table`, bottom);
  if (o.limit && bottom > o.limit + 0.01) console.warn(`  ! ${name} table runs into the shape below: bottom ${bottom.toFixed(2)}, limit ${o.limit.toFixed(2)}`);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets. Pass h = null to size it to its text.
// Returns the panel's bottom edge.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (h == null) h = Math.ceil((need + 0.14 - y) * 20) / 20;
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: top - y - 0.14 });
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h - need > 0.75) console.warn(`  ! ${name} panel has ${(y + h - need).toFixed(2)} in of empty space`);
  if (process.env.FIT) console.log(`  panel ${name}: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  warn(`${name} panel`, y + h);
  return y + h;
};

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const M1 = "Module 1 — What Ansible is, and where it fits";
const M2 = "Module 2 — The platform in a federal setting";
const M3 = "Module 3 — Evidence and dangers";
const M4 = "Module 4 — Adoption and the examples";
const W3 = 3.95; // three panels across
const X3 = (k) => 0.6 + k * (W3 + 0.15);

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Ansible for Configuration Automation: technical deep dive",
    "Companion guide — where it fits, its federal posture, the evidence and the dangers");
  txt(s, "Session map", [
    { text: "Module 1  ", options: { bold: true, color: HEX.navy } }, { text: "What Ansible is, and where it fits", options: { color: HEX.ink, breakLine: true } },
    { text: "Module 2  ", options: { bold: true, color: HEX.navy } }, { text: "Ansible Automation Platform in a federal setting", options: { color: HEX.ink, breakLine: true } },
    { text: "Module 3  ", options: { bold: true, color: HEX.teal } }, { text: "Evidence and dangers", options: { color: HEX.ink, breakLine: true } },
    { text: "Module 4  ", options: { bold: true, color: HEX.teal } }, { text: "Adoption and the example playbooks", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.9, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for the Federal Modernization Workbook's companion guide, Ansible for Configuration Automation. It's for server, network and platform engineers, configuration managers and the security staff who assess them: the people who decide which tool may change which setting, and who have to prove it afterward.

Ansible appears in several books, always in passing: as an Azure Arc onboarding method in Book 05, as the Red Hat configuration stack in Book 12, as a remediation tool in VMware's hardening content in Book 15, and as the Infoblox collection in Book 08. The guide gathers those mentions into one implementation view, and so does this deck.

Four modules you can watch separately. Module 1 is what Ansible is and where it fits. Module 2 is Ansible Automation Platform in a federal setting. Module 3 is the evidence it produces and the dangers. Module 4 is the adoption path and the example playbooks.

Three labels to listen for. Design guidance is the program's recommendation and is marked as such. Product statements were checked on October 29, 2026, and change. And where the guide says a fact is not published or couldn't be verified, the slide says so too. The example playbooks are described, not walked through line by line.`,
  "How to read this guide; In this guide.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: Ansible can write almost anywhere");
  tag(s, "Why");
  const a = panel(s, "Reach", 0.6, 1.5, 5.95, null, HEX.navy, HEX.navyTint, "WHAT ANSIBLE CAN REACH", null, [
    "Anything with an SSH port, WinRM or an API: servers, network gear, appliances, VMware, Infoblox",
    "No agent on the target: it connects, runs small modules, and removes them",
    "It acts when a playbook runs, and keeps no record of its own",
  ], 14);
  const b = panel(s, "Fail", 6.8, 1.5, 5.95, null, HEX.red, HEX.redTint, "WHAT GOES WRONG WITHOUT A RULE", null, [
    "It can write to a server Azure machine configuration already governs, and neither tool notices",
    "Auto-correct reverts the setting, and Microsoft says there's no way to report that it did",
    "The controller holds the keys to every host it manages",
  ], 14);
  callout(s, "Rule", Math.max(a, b) + 0.3, 0.95, "FaScaleBalanced", HEX.red, "The guide's answer: ",
    "decide, setting by setting, where Ansible may write. One owning tool per setting, recorded in the CMDB (design guidance).");
  sources(s, "Sources: Ansible docs (intro to Windows; playbooks); Microsoft Learn, machine configuration remediation options; Book 05, Ch 04. Guide: What Ansible is; One owning tool.");
  notes(s,
`Why this matters. Ansible can reach almost anything with an SSH port or an API, which is exactly why a program has to decide, setting by setting, where it is allowed to write.

It's an automation engine that connects to the hosts it manages, over SSH for Linux and Unix and over WinRM, PowerShell Remoting or SSH for Windows, runs small programs called modules there, and removes them. There's no agent on the target, and it keeps no record of its own: it does what a playbook says, when the playbook runs.

That reach is the risk. Book 05's onboarding standard allows one management plane per asset and no co-management for new assets, and Ansible makes that rule easy to break. It can write to a server that Azure machine configuration already governs, and nothing in either tool notices. Machine configuration's auto-correct mode makes it worse: when a setting drifts, the agent corrects it, and Microsoft says there's no way to report that a drift was automatically corrected. Two tools that disagree can flip a setting back and forth while both report success.

And the controller that runs the playbooks holds the keys to every host it manages, more reach than almost any administrator.

The guide's answer, as design guidance, is one owning tool per setting, recorded as an attribute in the CMDB. The rest of the deck builds on that rule.`,
  "Introduction; What Ansible is, and what it isn't; One owning tool per setting.");
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(M1, "Module 1: What Ansible is, and where it fits", "Beside Intune, Azure Arc, Azure Policy and Configuration Manager",
    ["What Ansible is and isn't, and the five tools side by side", "One owning tool per setting; the tiers and the four tracks", "Arc onboarding at scale, and the tier-2 populations"], 14);
  notes(s,
`Module 1: what Ansible is, and where it fits. Before deciding where Ansible may write, an engineer needs two things settled: what kind of tool it is, and which populations the other tools already own.

So: what Ansible is and isn't, beside Intune, Azure Arc with machine configuration, Azure Policy and Configuration Manager; the rule that keeps them from fighting; Ansible's role across the program's coverage tiers and the four tracks; onboarding servers to Arc at scale; and the populations Intune and Arc don't reach, which the program calls tier 2.`,
  "What Ansible is, and what it isn't; Where Ansible fits.");
}

// ================================================================== 4 What it is
{
  const s = content(M1, "What Ansible is, and what it isn't");
  tag(s, "What");
  const a = panel(s, "How", X3(0), 1.5, W3, null, HEX.navy, HEX.navyTint, "HOW IT WORKS", null, [
    "Connects over SSH, or WinRM, PSRP or SSH for Windows",
    "Runs modules on the target, then removes them",
    "Playbook: tasks in YAML; inventory: hosts and groups",
    "Collection: modules, plugins and roles for a platform",
  ], 13.5);
  const b = panel(s, "Products", X3(1), 1.5, W3, null, HEX.teal, HEX.tealTint, "TWO PRODUCTS", null, [
    "ansible-core: the free command-line engine",
    "Automation Platform: a controller with web UI, API, roles, credential store, scheduling and logging",
    "A private automation hub, and execution environments with pinned collections",
  ], 13.5);
  const c = panel(s, "Isnt", X3(2), 1.5, W3, null, HEX.red, HEX.redTint, "WHAT IT ISN'T", null, [
    "A management plane with a record of its own",
    "It doesn't enroll a device or evaluate compliance continuously",
    "It doesn't re-apply a desired state by itself; it acts when a playbook runs",
  ], 13.5);
  callout(s, "Check", Math.max(a, b, c) + 0.3, 0.95, "FaClipboardCheck", HEX.amber, "Idempotent, mostly: ",
    "modules should be, but the docs say not every playbook or module is. Check mode simulates a run without changing anything.");
  sources(s, "Sources: Ansible docs: Managing Windows hosts; Glossary and Ansible playbooks (idempotency); Validating tasks: check mode and diff mode. Guide: What Ansible is, and what it isn't.");
  notes(s,
`The mechanics first. Ansible connects to the hosts it manages, over SSH for Linux and Unix and over WinRM, PowerShell Remoting or SSH for Windows, runs small programs called modules there, and removes them. A playbook lists tasks in YAML; an inventory lists hosts and groups; a collection packages modules, plugins and roles for a platform.

Two products. ansible-core is the free command-line engine. Red Hat Ansible Automation Platform is the supported product around it: an automation controller with a web interface, an API, role-based access, a credential store, job scheduling and logging; a private automation hub for approved content; and execution environments that package ansible-core with pinned collections.

Modules should be idempotent, meaning that running a task once has the same result as running it repeatedly, but the documentation is candid that not every playbook or module behaves that way. Ansible also has a check mode that simulates a run without making changes, and the guide leans on it heavily.

What Ansible isn't is a management plane with a record of its own. It doesn't enroll a device, evaluate compliance continuously, or keep a desired state that it re-applies by itself. That distinction decides where it fits.`,
  "What Ansible is, and what it isn't.");
}

// ================================================================== 5 Five tools
{
  const s = content(M1, "Five tools, and the population each one owns");
  tag(s, "What");
  table(s, "Tools", 1.5, [2.55, 3.85, 3.35, 2.4], ["Tool", "What it manages", "How it acts", "Owns (design guidance)"], [
    ["Microsoft Intune", "Windows, macOS, iOS and Android end-user devices; not Windows Server", "Enrollment; the device checks in and applies assigned policy", "Tier 1 end-user devices"],
    ["Azure Arc with machine configuration", "Windows and Linux servers outside Azure, on the versions Microsoft lists", "The Connected Machine agent; audit, apply and monitor, or apply and auto-correct", "Tier 1 servers"],
    ["Azure Policy", "Azure resources, including the Arc machine resource and its tags", "Assignments evaluated by Azure Resource Manager", "Azure resources"],
    ["Configuration Manager", "Windows devices and servers where it's already deployed", "Its client; co-management moves workloads to Intune one at a time", "Existing estates only; no greenfield use"],
    ["Ansible", "Anything reachable over SSH, WinRM or an API, including network devices and appliances", "Push: a playbook runs when someone or a schedule starts it", "Tier 2 assets the CMDB names it for; Arc onboarding"],
  ], { fontSize: 13 });
  sources(s, "Sources: Microsoft Learn: Connected Machine agent prerequisites; machine configuration remediation options. Book 05, Ch 01, 03, 04. Guide: What Ansible is (tool table).");
  notes(s,
`The guide's tool table, with the owning population in the last column as design guidance.

Intune manages end-user devices: Windows, macOS, iOS and Android. Its supported platforms don't include Windows Server, as Book 05, Chapter 03 records. It acts by enrollment: the device checks in and applies assigned policy. It owns tier 1 end-user devices.

Azure Arc with Azure Policy machine configuration manages Windows and Linux servers outside Azure, on the versions Microsoft lists. The Connected Machine agent and machine configuration audit, apply and monitor, or apply and auto-correct operating system settings. It owns tier 1 servers.

Azure Policy governs Azure resources, including the Arc machine resource and its tags, through assignments that Azure Resource Manager evaluates.

Configuration Manager manages Windows devices and servers where it's already deployed, and co-management moves workloads to Intune one at a time. Book 05's pillar 4 gives it existing estates only, with no greenfield use.

And Ansible manages anything reachable over SSH, WinRM or an API, including network devices and appliances. It pushes: a playbook runs when someone or a schedule starts it. It owns tier 2 assets whose CMDB record names it, and it onboards tier 1 servers to Arc.`,
  "What Ansible is, and what it isn't — \"Which tool owns which population.\"");
}

// ================================================================== 6 One owning tool
{
  const s = content(M1, "One owning tool per setting, recorded in the CMDB");
  tag(s, "Why");
  const a = panel(s, "Collision", 0.6, 1.5, 5.6, null, HEX.red, HEX.redTint, "THE COLLISION", null, [
    "Ansible can write to a server machine configuration governs; neither tool notices",
    "Auto-correct reverts drift, and there's no way to report that it did",
    "Two tools can flip one setting indefinitely while both report success",
    "Microsoft's warning is narrow (older DSC versions): \"don't try to manage the same settings\"",
    "Microsoft publishes no guidance on dividing settings with Ansible, Chef or Puppet",
  ], 13.5);
  const b = panel(s, "Rules", 6.45, 1.5, 6.3, null, HEX.navy, HEX.navyTint, "THE PROGRAM'S RULE (DESIGN GUIDANCE)", null, [
    "The owner is an attribute: every CMDB record names one config_owner",
    "Ansible reads anything and writes only what it owns: the inventory group and an assertion in the playbook",
    "Onboarding isn't owning: once the Arc agent connects, Ansible doesn't set what machine configuration sets",
    "An exception is a dated record with a reason; the owner's baseline catches up within its life",
  ], 13.5);
  sources(s, "Sources: Microsoft Learn: machine configuration remediation options; PowerShell DSC in machine configuration. Book 05, Ch 03, 04. Guide: One owning tool per setting.");
  notes(s,
`The rule that keeps the tools from fighting. Book 05's onboarding standard allows one management plane per asset and no co-management for new assets. Ansible makes that easy to break, because it can write to a server that machine configuration already governs, and nothing in either tool notices. Auto-correct makes the collision worse: when a setting drifts the agent corrects it, and Microsoft says there's no way to report that a drift was automatically corrected. So two tools that disagree can flip a setting back and forth indefinitely while both report success.

Microsoft's own warning is narrow, about running machine configuration beside older Desired State Configuration versions, but the principle is general: don't try to manage the same settings. Microsoft doesn't publish guidance on dividing settings between machine configuration and Ansible, Chef or Puppet.

So the program's rule, as design guidance, has four parts. The owner is an attribute: every asset's CMDB record names the one tool that owns its configuration settings, in a config_owner field; the CMDB is already the origin of business facts about devices and servers. Ansible reads anything and writes only what it owns, enforced twice: the inventory group is built from that attribute, and the playbook itself asserts it. Onboarding isn't owning: installing the Arc agent hands the server to Arc. And an exception is a record: dated, with a reason, and the owning tool's baseline updated to match within the exception's life.`,
  "One owning tool per setting.");
}

// ================================================================== 7 Tiers and tracks
{
  const s = content(M1, "Ansible across the coverage tiers and the four tracks");
  tag(s, "Who");
  table(s, "Tiers", 1.5, [3.0, 4.6], ["Coverage tier", "Ansible's role (design guidance)"], [
    ["1. Intune or Arc", "Onboards servers to Arc at scale; reads facts for the CM-8 feed; doesn't own settings"],
    ["2. Platform's own tool, with an evidence feed", "Owns configuration where the CMDB names it; posts every job's results to the evidence store; reads its targets from the CMDB"],
    ["3. Discovered only", "Reads facts where allowed, to move an asset into tier 1 or 2; never changes it"],
    ["4. Segmented or retired", "Nothing: no playbook targets the group"],
  ], { fontSize: 13 });
  panel(s, "Tracks", 8.45, 1.5, 4.3, null, HEX.teal, HEX.tealTint, "THE FOUR TRACKS", null, [
    "HR, for people",
    "Intune, for end-user devices",
    "Azure Arc, for servers: Ansible onboards them and manages the ones Arc can't",
    "Non-person identities: the controller is an identity with standing access to many hosts",
  ], 13.5);
  sources(s, "Sources: the guide's coverage tiers and four tracks, from the device, server and identity material. Tier roles are design guidance. Guide: How to read this guide; Where Ansible fits.");
  notes(s,
`Where Ansible sits in the program's structure, in two views.

The device and server tracks sort every asset into four coverage tiers: tier 1, managed by Intune or Arc; tier 2, managed by the platform's own tool with an evidence feed, with the CMDB as the attribute source; tier 3, discovered only; tier 4, segmented or retired. Ansible is the natural tier-2 tool, and an onboarding tool for tier 1.

Its role per tier is design guidance. In tier 1 it onboards servers to Arc at scale and reads facts for the CM-8 feed, but doesn't own settings. In tier 2 it owns configuration where the CMDB names it, posts every job's results to the evidence store, and reads its targets from the CMDB. In tier 3 it reads facts where it's allowed to, to move an asset into tier 1 or 2, and never changes it. In tier 4 it does nothing: no playbook targets the group.

The guide also follows the identity and device material's four tracks: HR for people, Intune for end-user devices, Azure Arc for servers, and non-person identities. Ansible belongs to two of them. The Arc track, where it onboards servers and manages the ones Arc can't. And the non-person identity track, because the automation controller is itself an identity with standing access to many hosts.`,
  "How to read this guide; Where Ansible fits — \"Ansible across the coverage tiers.\"");
}

// ================================================================== 8 Arc onboarding
{
  const s = content(M1, "Arc onboarding at scale: Microsoft's role, three sign-ins");
  tag(s, "How");
  txt(s, "Role", [
    { text: "The azure.azcollection.azure_arc role ", options: { bold: true, color: HEX.navy } },
    { text: "installs the Connected Machine agent and registers each target. Microsoft calls it idempotent; it skips machines already connected, and neither discovers machines nor replaces Azure Policy–based management." },
  ], { x: 0.6, y: 1.5, w: 12.15, h: 0.62, fontSize: 14.5 });
  const tb = table(s, "Signin", 2.25, [3.3, 5.0, 3.85], ["Sign-in", "What Microsoft says", "Program use (design guidance)"], [
    ["Managed identity of the control node", "Recommended for production automation: no stored secret. The node must be an Azure VM or an Arc-enabled server; no permissions until granted", "First choice where the controller runs in Azure or is Arc-enabled"],
    ["Service principal via the platform's Azure credential", "The platform injects the values, so no secret is hard-coded in the playbook", "Where there's no managed identity: a certificate credential, as Book 05 recommends"],
    ["Azure CLI sign-in", "Interactive use and development; not applicable in Automation Platform", "Pilots only"],
  ], { fontSize: 12.5, limit: 5.35 });
  callout(s, "Scope", tb + 0.25, 0.95, "FaKey", HEX.amber, "Onboarding role only: ",
    "Azure Connected Machine Onboarding on the target resource group, nothing else; Book 05 creates and removes it per wave.");
  sources(s, "Sources: Microsoft Learn: Deployment options; Connect machines at scale with Ansible; Arc identity and authorization. Book 05, Ch 09. Guide: Arc onboarding at scale.");
  notes(s,
`Arc onboarding is where Ansible earns its first place in the program. Microsoft lists Ansible among the at-scale Arc onboarding methods, through the Azure Arc onboarding role in Ansible Core or Ansible Automation Platform. The role installs the Connected Machine agent and registers each target. Microsoft calls it idempotent, it skips machines already connected, and it neither discovers machines nor replaces Azure Policy–based management. It takes the resource group, subscription, tenant, region, cloud and tags as variables.

How the role signs in to Azure decides how much secret handling the program inherits. The managed identity of the control node is, in Microsoft's words, the recommended authentication method for production automation, because it removes stored secrets; the control node must be an Azure VM or an Arc-enabled server, and the identity has no Azure permissions until they're granted. The program uses it first wherever the controller can have one. Next, a service principal through Automation Platform's Azure credential, where the platform injects the values so nothing is hard-coded; the program makes that a certificate credential, as Book 05 recommends. Azure CLI sign-in is for interactive use and development and isn't applicable in Automation Platform: pilots only.

Whichever identity signs in holds the Azure Connected Machine Onboarding role on the target resource group and nothing else, and Microsoft's security guidance recommends assigning that role only to the onboarding service principal. Book 05 adds a dedicated, certificate-based service principal, scoped to the resource group, created and removed per wave, because the credential is needed only while the connect command runs.`,
  "Where Ansible fits — Arc onboarding at scale.");
}

// ================================================================== 9 Waves and tags
{
  const s = content(M1, "Onboarding waves: CMDB tags, secrets off the console");
  tag(s, "How");
  const a = panel(s, "Waves", X3(0), 1.5, W3, null, HEX.navy, HEX.navyTint, "BOOK 05'S WAVES", null, [
    "Credential, connect, attach the baseline, verify, close",
    "The wave's credential is removed when it closes",
    "For production, prefer Microsoft's role",
  ], 13.5);
  const b = panel(s, "Tags", X3(1), 1.5, W3, null, HEX.teal, HEX.tealTint, "TAGS FROM THE CMDB", null, [
    "The inventory comes from the CMDB, so the run writes owner, environment, location and patch group onto the Arc resource",
    "Same change, so the derived pointer starts out explainable from its origin",
  ], 13.5);
  const c = panel(s, "Agent", X3(2), 1.5, W3, null, HEX.amber, HEX.amberTint, "WHEN A PLAYBOOK CALLS AZCMAGENT", null, [
    "Pass the secret in a configuration file, not on the command line, to keep it out of console logs",
    "The config flag takes a JSON or YAML file; tags are Name=Value pairs",
    "Azure Government: --cloud AzureUSGovernment with --location",
  ], 13.5);
  callout(s, "Gate", Math.max(a, b, c) + 0.3, 0.95, "FaDoorClosed", HEX.teal, "The example, 02_arc_onboarding.yml: ",
    "the same steps spelled out with azcmagent, gated so nothing changes without confirm_change=true.");
  sources(s, "Sources: Microsoft Learn: azcmagent connect; azcmagent CLI reference. Book 05, Ch 03 (the rule), Ch 09 (onboarding). Guide: Arc onboarding at scale; The example playbooks.");
  notes(s,
`The tags are where Ansible earns its place. The inventory comes from the CMDB, so the onboarding run writes the CMDB's owner, environment, location and patch group onto the Arc resource on the same change, and the derived pointer starts out explainable from its origin, as Book 05, Chapter 03 requires.

Run onboarding in Book 05's waves: credential, connect, attach the baseline, verify, close. The wave's credential is removed when the wave closes.

Where a playbook calls azcmagent connect itself, Microsoft recommends passing the service principal secret in a configuration file rather than on the command line, to keep it out of console logs. The config flag takes a JSON or YAML file of the command's flags, and the tags flag takes a comma-delimited list of Name equals Value pairs. For Azure Government, the cloud flag set to AzureUSGovernment goes with the location flag.

The example playbook, 02 Arc onboarding, spells those steps out with azcmagent, gated so nothing changes without confirm_change set to true. It's a teaching example, so the gate, the waves, the tags and the secret handling are visible and testable. For production, the guide says to prefer Microsoft's role.`,
  "Where Ansible fits — Arc onboarding at scale.");
}

// ================================================================== 10 Tier 2: Unix, Linux, network
{
  const s = content(M1, "Tier 2: Unix, Linux beyond Arc, and network gear");
  tag(s, "What");
  const a = panel(s, "Arc", X3(0), 1.5, W3, null, HEX.red, HEX.redTint, "WHAT ARC DOESN'T COVER", null, [
    "\"If an OS version isn't listed, it's not supported\": no AIX, Solaris or HP-UX",
    "Nov. 2026: end of new agent versions for several Ubuntu, Debian, SUSE, Oracle Linux 7 and Amazon Linux 2 releases",
    "The agent isn't tested on CIS-hardened systems",
  ], 13);
  const b = panel(s, "Linux", X3(1), 1.5, W3, null, HEX.navy, HEX.navyTint, "LINUX AND UNIX BASELINES", null, [
    "SSH, escalating with sudo, su, pfexec, doas, pbrun, dzdo and others",
    "Escalation can't be limited to commands, so the account is a privileged non-person identity",
    "Check mode is a simulation: write each drift comparison to stand alone",
  ], 13);
  const c = panel(s, "Net", X3(2), 1.5, W3, null, HEX.teal, HEX.tealTint, "NETWORK DEVICES", null, [
    "Cisco IOS facts over network_cli: host name, model, serial, version",
    "A CM-8 feed with no new software on any device",
    "Design guidance: where a vendor controller exists it owns the config; otherwise Ansible can, with the rendered config as the CM-2 baseline",
  ], 13);
  sources(s, "Sources: Microsoft Learn, Connected Machine agent prerequisites; Ansible docs: become; check mode; cisco.ios ios_facts. Guide: Linux and Unix; Network devices.");
  notes(s,
`Now the populations Intune and Arc don't reach, starting with Unix, Linux beyond Arc, and the network.

Arc supports the Windows and Linux versions on Microsoft's list, and if an OS version isn't listed, it's not supported. AIX, Solaris and HP-UX aren't on it. Neither, after November 2026, are new agent versions for several Linux releases still common in federal estates: Ubuntu 18.04 and 20.04, Debian 11 and 12, SUSE Linux Enterprise Server 12 SP5 and 15 SP3 through SP6, Oracle Linux 7 and Amazon Linux 2, with the final compatible agent serviced for 12 months after its release. Microsoft also says the agent isn't tested on CIS-hardened systems.

Those hosts are tier 2. Ansible reaches them over SSH and escalates with the host's own mechanism. Two cautions. Escalation can't be limited to particular commands, because modules run from temporary files whose names change every run, so the escalation account has broad rights and is governed as a privileged non-person identity. And check mode is just a simulation: a task that depends on an earlier task's result won't report, so the example baseline check writes each comparison to stand alone. For RHEL, Red Hat ships SCAP Security Guide content that turns a CIS profile into Ansible remediation; whatever content is adopted, the playbook version in Git is the baseline.

Network devices take no agent. The Cisco IOS facts module runs over network_cli and gathers the min subset by default: host name, model, serial number and software version. That's a CM-8 feed with no new software on any device. Ownership is design guidance: where an SD-WAN manager, wireless controller or firewall manager exists, it owns the configuration and Ansible reads or drives its API; where none exists, Ansible can own it, with the rendered configuration as the CM-2 baseline.`,
  "Where Ansible fits — Linux and Unix baselines; Network devices.");
}

// ================================================================== 11 VMware, Infoblox, Windows, cloud
{
  const s = content(M1, "VMware, Infoblox, Windows and cloud VMs: who owns what");
  tag(s, "What");
  table(s, "Targets", 1.5, [1.75, 5.6, 4.8], ["Target", "What Ansible does", "Who owns the setting"], [
    ["VMware", "Hypervisor and appliances, which can't run an OS agent: agency CM-6 settings from Broadcom's VCF hardening guide and CIS ESXi Benchmarks. VM inventory through vmware.vmware.vms; the old community plugin was removed", "VMs on vCenter can be tier 1 through Arc-enabled vSphere; Configuration Profiles or Security Posture Management own what they govern, and Ansible reads"],
    ["Infoblox NIOS", "DNS, DHCP and IPAM objects through the WAPI with infoblox.nios_modules; Universal DDI has a certified collection; lookups need infoblox-client", "Book 08's scoped service accounts: an admin group scoped to the objects it manages, read-only for evidence"],
    ["Windows without Configuration Manager", "WinRM, PSRP or SSH (official since ansible-core 2.18): appliances on Windows, enclaves Arc can't reach", "An Arc-connected server's OS settings are machine configuration's; Ansible may own the application (design guidance)"],
    ["Cloud VMs", "Inventory plugins for AWS, Google Cloud and Azure read each provider's API; State Manager can run Ansible playbooks", "No Arc agent on an Azure VM; reconcile the cloud's view against the CMDB, not replace it"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Ansible docs and collection repos (vmware, nios_modules, Windows SSH, cloud inventory); Microsoft Learn, deployment options. Books 05, 08, 12, 15. Guide: Where Ansible fits.");
  notes(s,
`The rest of tier 2, target by target, with the owner of each setting.

VMware is two layers, two owners. Virtual machines on vCenter can be tier 1: Arc-enabled VMware vSphere installs the Connected Machine agent on supported VMs at scale. The hypervisor and its appliances can't run an operating system agent, and that's where Ansible fits. Their baseline is the agency's CM-6 settings, drawn from Broadcom's VMware Cloud Foundation Security Configuration and Hardening Guide and the CIS VMware ESXi 8.0 and 9.0 Benchmarks. Broadcom's STIG readiness content for VCF 9, High only, also remediates appliances with Ansible playbooks, as an optional reference. Book 15 records the content version each scan used; the same discipline applies to the playbook version that remediated. For VM inventory, use the vmware.vmware.vms plugin; the older community plugin was removed in community.vmware 7.0.0. Where VMware's own Configuration Profiles or Security Posture Management govern a setting, they own it, and Ansible reads.

Infoblox NIOS: the nios_modules collection manages DNS, DHCP and IPAM objects through the WAPI, and Universal DDI has a Red Hat–certified collection of its own. The lookup plugins run on the control node and need the infoblox-client package. Book 08, Chapter 11 has the rules for who may change DDI objects: give the automation account an admin group scoped to its objects, and a read-only group for evidence.

Windows where Configuration Manager isn't used: WinRM, PSRP or SSH, which is officially supported since ansible-core 2.18. That suits appliances built on Windows and enclaves Arc can't reach. An Arc-connected server's operating system settings belong to machine configuration, but Ansible may still own the application, as design guidance.

Cloud VMs: the Arc agent isn't supported on an Azure VM; the multicloud connector onboards EC2, and AWS Systems Manager State Manager can run Ansible playbooks. The cloud inventory plugins reconcile the cloud's view against the CMDB: the cloud knows the instance exists, the CMDB knows who owns it and why.`,
  "Where Ansible fits — VMware; Infoblox NIOS; Windows where Configuration Manager isn't used; Cloud VMs.");
}
endModule("Module 1");

// ================================================================== 12 Module 2 divider
{
  const s = divider(M2, "Module 2: Ansible Automation Platform in a federal setting", "Software the agency runs, in almost every deployment option",
    ["Versions, and authorization status as published", "FIPS mode, baseline content and hosting", "Sign-in, logging, content, and the controller's identity"], 10);
  notes(s,
`Module 2: Ansible Automation Platform in a federal setting. Automation Platform is software the agency runs, in almost every deployment option, and that one fact drives its federal treatment.

So: the supported versions; authorization status, exactly as published; what Red Hat does and doesn't say about FIPS mode; baseline content for the controller and the hosts it manages; where the controller can run; the sign-in, logging and content controls to set; and the controller governed as a non-person identity. Everything here was checked on October 29, 2026. Recheck it before an authorization decision, because product status changes.`,
  "Ansible Automation Platform in a federal setting.");
}

// ================================================================== 13 Versions and authorization
{
  const s = content(M2, "Versions, and authorization status as published");
  tag(s, "What");
  const a = panel(s, "Versions", 0.6, 1.5, 4.3, null, HEX.navy, HEX.navyTint, "VERSIONS (RED HAT LIFE CYCLE)", null, [
    "2.7: GA June 2, 2026; full support to June 2, 2027; maintenance to June 2, 2029",
    "2.6: left full support Oct. 1, 2026; maintained to Oct. 1, 2028",
    "Default engine ansible-core 2.16, supported for 2.5 to 2.7's life",
    "2.7: containers on RHEL 9 or 10, rootless by default, or OpenShift; no RPM installer",
    "2.7: the gateway is the only path for external sign-in and API access",
  ], 12.5);
  const tb = table(s, "FedRAMP", 1.5, [3.1, 4.5], ["Offering", "FedRAMP status, as published"], [
    ["Self-managed, on agency infrastructure or agency-provisioned cloud VMs", "Not a cloud service offering; not on the Marketplace. Neither Red Hat nor FedRAMP publishes a statement; inside the agency's own boundary, as Book 12 treats it"],
    ["Service on AWS (Red Hat runs the control plane)", "Not on the FedRAMP Marketplace; not on Red Hat's FedRAMP list"],
    ["On Microsoft Azure (managed application)", "Not on the Marketplace; Azure Government availability not published"],
    ["For contrast: OpenShift Service on AWS", "FedRAMP Certified at High (FR2102031769)"],
  ], { x: 5.15, fontSize: 12.5, limit: 5.4 });
  callout(s, "Default", Math.max(a, tb) + 0.2, 0.9, "FaLandmark", HEX.navy, "Program default (design guidance): ",
    "self-managed, inside the system boundary, authorized as an agency-operated component.");
  sources(s, "Sources: Red Hat AAP life cycle; ansible-core support matrix; FedRAMP Marketplace (searched Oct. 29, 2026); Red Hat FedRAMP page; Book 12, Ch 07. Guide: Versions; Authorization status.");
  notes(s,
`Versions first, because they set what you're authorizing. Ansible Automation Platform 2.7 became generally available on June 2, 2026, with full support until June 2, 2027 and maintenance until June 2, 2029. 2.6 left full support on October 1, 2026 and is maintained until October 1, 2028. The default engine is ansible-core 2.16, which Red Hat supports for the whole life of 2.5, 2.6 and 2.7 even though the community version reached end of life in July 2025; 2.18 execution environments are supported the same way, and 2.7 adds an optional 2.20 stream. 2.7 installs as containers on RHEL 9 or 10, rootless by default, or through the operator on OpenShift; there's no RPM installer. And the platform gateway is the only supported path for external sign-in and API access.

Authorization status, exactly as published. Self-managed Automation Platform isn't a cloud service offering and isn't on the FedRAMP Marketplace; neither Red Hat nor FedRAMP publishes a statement about it. It's customer-operated software inside the agency system's own boundary, as Book 12 treats it. Red Hat's service on AWS isn't on the Marketplace or on Red Hat's FedRAMP list. Automation Platform on Azure isn't on the Marketplace, and its Azure Government availability isn't published. For contrast, OpenShift Service on AWS is FedRAMP Certified at High. Red Hat's page says FedRAMP is only applicable to the products listed, and the Marketplace data held no Ansible offering on October 29.

So the program's default, as design guidance, is self-managed, inside the system boundary, authorized as an agency-operated component and hardened like any other, with the managed offerings considered only after their status changes.`,
  "Ansible Automation Platform in a federal setting — Versions; Authorization status.");
}

// ================================================================== 14 FIPS and baseline content
{
  const s = content(M2, "FIPS mode and baseline content: what's published");
  tag(s, "Why");
  const a = panel(s, "FIPS", 0.6, 1.5, 5.95, null, HEX.amber, HEX.amberTint, "FIPS MODE: NO SUPPORT STATEMENT FOUND FOR 2.6 OR 2.7", null, [
    "Red Hat's FIPS 140 certificates cover RHEL's modules and generally apply to Red Hat products on unmodified RHEL; the platform isn't named",
    "History: gateway on FIPS-enabled RHEL 9 was unsupported in 2.5 (AAP-39146), fixed April 9, 2025",
    "Ask Red Hat for a written statement for your version, and test it",
    "Design guidance: where the agency requires FIPS 140-validated crypto, the controller's RHEL host runs in FIPS mode",
  ], 13);
  const b = panel(s, "Baseline", 6.8, 1.5, 5.95, null, HEX.navy, HEX.navyTint, "BASELINE CONTENT: CIS AND AGENCY CM-6 SETTINGS", null, [
    "Managed RHEL hosts: Red Hat's CIS profiles, remediated with an SSG Ansible playbook; customize in Git, check mode first",
    "Community CIS roles (Ansible Lockdown, e.g. RHEL9-CIS and RHEL9-CIS-Audit): review and pin as third-party content",
    "Controller host: CIS RHEL 9 or 10 plus agency settings; 2.7 documents fapolicyd, noexec and umask caveats",
    "High only: a DISA STIG for the controller (first released April 2023), an optional reference",
  ], 13);
  sources(s, "Sources: Red Hat FIPS page; AAP 2.5 notes; NIST SP 800-53 CM-6; CIS Benchmarks; RHEL Security hardening; Ansible Lockdown; AAP 2.7 hardened hosts. Guide: FIPS; Baseline content.");
  notes(s,
`FIPS mode and baseline content are the two questions an assessor asks first, and the honest answer on FIPS is partial.

FIPS mode. Red Hat's FIPS 140 page lists certificates for RHEL's cryptographic modules and says they generally apply to other Red Hat products running unmodified on that RHEL; Automation Platform isn't listed by name. The 2.6 and 2.7 documentation opened for the guide doesn't state whether the platform is supported on RHEL in FIPS mode, so treat that as unverified. The history shows the combination has been worked on: the 2.5 release notes listed platform gateway on FIPS-enabled RHEL 9 as unsupported, known issue AAP-39146, and fixed it in the April 9, 2025 update, with later fixes for PostgreSQL password handling on FIPS systems. Ask Red Hat for a written support statement for the version you deploy, and test it. FIPS mode is a question in its own right, not a side effect of a hardening profile: as design guidance, where the agency requires FIPS 140-validated cryptography for the controller, its RHEL host runs in FIPS mode, and the platform's support for that mode is what has to be confirmed.

Baseline content. A Moderate civilian agency doesn't adopt a hardening profile wholesale. NIST's CM-6 asks it to set configuration settings from common secure configurations it chooses, and to document and approve deviations; NIST's National Checklist Program is where to find them. CISA's SCuBA baselines cover Microsoft 365 and Google Workspace, not servers, so for the hosts Ansible manages the starting points are the CIS Benchmarks and the vendor's own hardening guidance.

For RHEL hosts, Red Hat's SCAP Security Guide ships CIS profiles, Level 1 and Level 2 for servers and workstations, and Red Hat's RHEL 9 and 10 security hardening guides document remediating a system to a baseline using an SSG Ansible playbook from that package. CIS publishes the benchmarks themselves, including RHEL 9 version 3.0.0 and RHEL 10 version 1.0.1. The community Ansible Lockdown project, sponsored by MindPoint Group, publishes CIS roles such as RHEL9-CIS, which warns that it will make changes to the system, and RHEL9-CIS-Audit, which only checks; on October 29 both tracked CIS RHEL 9 version 2.0.0, behind CIS's 3.0.0. It's community content, not Red Hat-supported, so review it, pin it and check which benchmark version it tracks. Whatever content is adopted is customized in Git to the agency's CM-6 settings and run in check mode first.

For the controller, the 2.7 documentation covers installing on hosts hardened to CIS, PCI DSS or the DISA STIG: fapolicyd rules, noexec on tmp and var during installation, and the umask a containerized install needs. So the controller host is hardened like any other RHEL server, to the CIS RHEL 9 or 10 Benchmark and the agency's CM-6 settings. Red Hat also lists a DISA STIG for Red Hat Ansible Automation Controller, first released in April 2023. That's High only: material for FedRAMP High or Defense environments, kept as an optional reference for the controller's own settings, not a requirement. Its current release couldn't be confirmed at the DoD Cyber Exchange.`,
  "Ansible Automation Platform in a federal setting — FIPS mode; Baseline content.");
}

// ================================================================== 15 Hosting
{
  const s = content(M2, "Where the controller can run");
  tag(s, "Who");
  const tb = table(s, "Hosting", 1.5, [2.5, 4.75, 4.9], ["Option", "What Red Hat documents", "Program view (design guidance)"], [
    ["On premises", "Containerized installation on RHEL, or the OpenShift operator", "The default where the managed estate is on premises; nearest to the targets"],
    ["Self-managed on cloud VMs", "Self-managed offers on the AWS, Google Cloud and Oracle marketplaces; or the agency installs on RHEL VMs it provisions", "Inherits the cloud's authorization for the services and Region it uses; a managed identity becomes possible on an Azure VM"],
    ["Azure managed application", "From Azure Marketplace into the customer's tenant; Red Hat reaches only the managed resource group", "Published for commercial regions only; not FedRAMP-listed, which keeps it out of the default"],
    ["AWS managed service", "Red Hat runs the control plane; execution nodes in the customer's network; job logs erased every 30 days", "Published for commercial regions only; not FedRAMP-listed; export job results for AU retention"],
  ], { fontSize: 13, limit: 5.4 });
  callout(s, "Edge", tb + 0.25, 0.95, "FaRoute", HEX.teal, "Every placement crosses an edge: ",
    "management traffic to the targets is an external connection, recorded with its own agreement, as Book 12 does.");
  sources(s, "Sources: Red Hat: AAP 2.7 installation; deployment options; AAP on Microsoft Azure guide; AAP Service on AWS. AWS FedRAMP pages. Book 12, Ch 07. Guide: Hosting.");
  notes(s,
`Where the controller runs decides which authorization it inherits and what it can sign in with.

On premises, Red Hat documents a containerized installation on RHEL or the OpenShift operator. The program's view is that this is the default where the managed estate is on premises, because it's nearest to the targets.

Self-managed on cloud VMs the agency provisions, for example in AWS GovCloud (US), AWS US East/West or Azure Government: Red Hat lists self-managed offers on the AWS, Google Cloud and Oracle marketplaces, and on any cloud the agency can install on RHEL VMs it provisions itself. The controller then inherits the cloud's infrastructure authorization for the services and Region it uses, checked per service, and adds its own controls, and a managed identity becomes possible where the controller is an Azure VM.

The Azure managed application deploys from Azure Marketplace into the customer's tenant, and Red Hat reaches only the managed resource group. The AWS managed service has Red Hat run the control plane in its own infrastructure, with execution nodes in the customer's network, and job logs erased every 30 days. Red Hat publishes no Azure Government or GovCloud availability for either managed offering; both guides' region tables list commercial regions only. A commercial Region isn't the obstacle for a Moderate system: AWS lists US East/West as FedRAMP Certified Class C, formerly the Moderate baseline, and GovCloud (US) as Class D, formerly High, and records each service's authorization per Region. What keeps the managed offerings out of the default is that neither is FedRAMP-listed. And the 30-day log erasure means job results must be exported for audit retention.

Wherever the controller runs, the management traffic to its targets crosses a boundary edge, and Book 12 records each such channel as an external connection with its own agreement.`,
  "Ansible Automation Platform in a federal setting — Hosting.");
}

// ================================================================== 16 Sign-in, logging, content
{
  const s = content(M2, "Sign-in, logging and content: the controls to set");
  tag(s, "How");
  const a = panel(s, "Signin", X3(0), 1.5, W3, null, HEX.navy, HEX.navyTint, "SIGN-IN, ROLES AND TOKENS", null, [
    "The gateway brokers local, LDAP, SAML, OIDC and Entra ID sign-in; roles per resource",
    "Federate to the agency's identity provider; local accounts for break-glass only (design guidance)",
    "Token lifetime cut from 1,000 years to 1; older tokens keep theirs, so revoke on upgrade",
  ], 12.5);
  const b = panel(s, "Logs", X3(1), 1.5, W3, null, HEX.teal, HEX.tealTint, "LOGGING AND AUDIT", null, [
    "Logs to Splunk, Loggly, Sumo Logic or Elastic over HTTPS, TCP or UDP",
    "The activity stream records time, user and action for every object change",
    "Cleanup jobs delete history older than a set number of days: match retention, or rely on the SIEM",
  ], 12.5);
  const c = panel(s, "Content", X3(2), 1.5, W3, null, HEX.amber, HEX.amberTint, "CONTENT AND CHANGE SOURCES", null, [
    "Hub: Certified and validated content, plus approved Galaxy content",
    "Hub signing is off by default; clients verify only with a keyring",
    "Project signing: a failed signature blocks the update, so jobs don't launch",
  ], 12.5);
  callout(s, "Sign", Math.max(a, b, c) + 0.3, 0.95, "FaCodeBranch", HEX.amber, "Why project signing matters: ",
    "it ties the CM-3 pull request to what actually runs. Job templates can also start from GitHub or GitLab webhooks.");
  sources(s, "Sources: Red Hat AAP 2.7: authentication; tokens; logging; activity streams; content signing; project signing; webhooks. AAP 2.5 cleanup jobs. Guide: Sign-in; Logging; Content.");
  notes(s,
`Three groups of settings on the controller itself.

Sign-in, roles and tokens. The platform gateway brokers user sign-in through local accounts, LDAP, SAML, generic OIDC, Microsoft Entra ID and others, and role-based access assigns predefined or custom roles per resource to users and teams. As design guidance, federate sign-in to the agency's identity provider, so Conditional Access, phishing-resistant MFA and joiner-mover-leaver processes apply, and keep local accounts to the break-glass minimum. In 2.7, API tokens come only from the gateway, and the default access-token lifetime was cut from 1,000 years to 1 year; tokens created before the 2.5.20250604 update keep the old lifetime, so inventory and revoke old tokens when upgrading.

Logging and audit. The controller sends logs to an external aggregator, Splunk, Loggly, Sumo Logic or Elastic, over HTTPS, TCP or UDP, and Red Hat names job facts, job events, activity stream data and log messages as the most useful streams. The activity stream records the time, user and action for every change to a controller object. Collect it centrally, alongside RHEL's audit daemon. Cleanup jobs delete job history and activity-stream records older than a configured number of days, so set them to the agency's retention schedule, or rely on the SIEM copy.

Content. Automation hub serves Red Hat Certified collections and validated content, alongside whatever the agency approves from Galaxy. Signing in the hub is disabled by default and enabled with GPG keys at installation, 2.7 adds a post-quantum option, and clients verify only if a keyring is configured. Project signing with ansible-sign makes the controller refuse to update a project whose signature fails, so its jobs don't launch. That ties the CM-3 pull request to what actually runs.`,
  "Ansible Automation Platform in a federal setting — Sign-in, roles and tokens; Logging and audit; Content and change sources.");
}

// ================================================================== 17 Controller identity
{
  const s = content(M2, "The controller is a non-person identity");
  tag(s, "Who");
  const a = panel(s, "Rules", 0.6, 1.5, 6.9, null, HEX.navy, HEX.navyTint, "GOVERNED AS ONE (DESIGN GUIDANCE)", null, [
    "An owner: two named humans for the controller and for each credential, as for a service principal",
    "Least privilege by credential: one per purpose and scope, never one account that does everything",
    "No standing secrets: managed identity or federation, then certificates, then a vault at run time",
    "Expiring credentials: Arc onboarding credentials live for one wave; the rest rotate",
    "Reviewed quarterly; launching a production change is a logged, attributable privileged action",
  ], 13.5);
  const b = panel(s, "Plugins", 7.75, 1.5, 5.0, null, HEX.teal, HEX.tealTint, "CREDENTIAL PLUGINS", null, [
    "Fetch at run time from AWS Secrets Manager, Centrify, CyberArk, HashiCorp Vault, Azure Key Vault or Thycotic",
    "2.7: Vault credential types with a short-lived token per job",
    "Ansible Vault \"ONLY protects 'data at rest'\"; no_log is the author's job",
  ], 13.5);
  callout(s, "Reach", Math.max(a, b) + 0.3, 0.95, "FaUserShield", HEX.red, "More reach than almost any administrator: ",
    "the controller holds the keys to every host it manages, so it's governed like a privileged account.");
  sources(s, "Sources: Red Hat AAP 2.7: credential types; Vault OIDC credentials. Ansible docs: Vault; logging. Book 02, Ch 09; Book 04, Ch 05; Book 05, Ch 09. Guide: Credentials and the controller.");
  notes(s,
`An automation controller holds the keys to every host it manages. It's a non-person identity with more reach than almost any administrator, and the program governs it as one, all design guidance.

An owner: two named human owners for the controller and for each of its credentials, as for any service principal in Book 02, Chapter 09. Least privilege, by credential: one credential per purpose and scope, such as Arc onboarding for one resource group, read-only facts for the network estate, or change rights for one tier-2 platform; never one account that can do everything. The Linux and Unix escalation account has broad rights by necessity, so confine it to the hosts whose config_owner is Ansible. No standing secrets: prefer a managed identity or workload identity federation for Azure, as in Book 04, Chapter 05; otherwise certificates; and fetch every remaining secret at run time from the agency's vault. Expiring credentials: every one has an end date, and Arc onboarding credentials live for one wave. Reviewed like a privileged account: role assignments, credentials and the people who can launch jobs are in the quarterly access review, and launching a job that changes production is itself a privileged action, logged and attributable to a person.

The platform makes the vault rule practical. Credential plugins fetch secrets at run time from AWS Secrets Manager, Centrify, CyberArk Central Credential Provider and Conjur, HashiCorp Vault, Azure Key Vault and Thycotic, and 2.7 adds Vault credential types that use a short-lived token issued per job. Ansible Vault protects secrets in files, but the documentation warns that it only protects data at rest: once decrypted for a run, keeping the value out of output is the playbook author's job, with no_log.`,
  "Ansible Automation Platform in a federal setting — Credential plugins; Credentials and the controller's identity.");
}
endModule("Module 2");

// ================================================================== 18 Module 3 divider
{
  const s = divider(M3, "Module 3: Evidence and dangers", "What Ansible proves as a side effect, and how it fails",
    ["CM-2, CM-3, CM-6, CM-7 and CM-8 evidence", "AU, least privilege, supply chain, and the evidence store", "Seven dangers and how to avoid them; lint as a gate"], 8);
  notes(s,
`Module 3: evidence and dangers. Ansible produces evidence as a side effect of being used properly: the playbook is a file in Git, the change is a pull request, the run is a job with a result. The program's job is to land those artifacts where assessors look.

So: the configuration management controls and what Ansible shows for each; the audit, least-privilege and supply chain controls; how job results reach Book 12's evidence store; and then the seven ways Ansible goes wrong, with the controls that prevent each, and lint as a gate on every pull request.`,
  "Evidence to the program; Dangers and how to avoid them.");
}

// ================================================================== 19 CM evidence
{
  const s = content(M3, "Evidence for CM-2, CM-3, CM-6, CM-7 and CM-8");
  tag(s, "What");
  const tb = table(s, "CM", 1.5, [2.5, 3.2, 6.45], ["Control", "What it asks", "Ansible's evidence (design guidance unless cited)"], [
    ["CM-2 Baseline Configuration", "A current, documented baseline", "The playbook or role version, by Git commit and tag, as Book 12 already records Ansible playbook versions"],
    ["CM-3 Configuration Change Control", "Changes reviewed, approved and recorded", "Every change reaches main only by pull request with a required reviewer; the controller runs only main (Book 12)"],
    ["CM-6 Configuration Settings", "Settings established, implemented and monitored", "The baseline playbook implements; the same playbook in check mode monitors and reports drift (Book 12)"],
    ["CM-7 Least Functionality", "Only essential capabilities", "Tasks that remove packages and disable services, checked by the drift run (telnet-server and rsh-server absent)"],
    ["CM-8 System Component Inventory", "An accurate, current inventory", "Inventory comes from the CMDB, so Ansible never invents a host; unreached hosts are recorded as not collected"],
  ], { fontSize: 13, limit: 5.5 });
  callout(s, "Moderate", tb + 0.2, 0.85, "FaListCheck", HEX.navy, "All in the Moderate baseline: ",
    "control titles are from NIST SP 800-53 Revision 5, release 5.2.0.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5.2.0 (CM-2, CM-3, CM-6, CM-7, CM-8) and Moderate baseline; Book 12, Ch 07. Mapping is design guidance unless cited. Guide: Evidence to the program.");
  notes(s,
`The configuration management family, control by control. The titles are from NIST SP 800-53 Revision 5, release 5.2.0, and every control here is in the Moderate baseline. The evidence column is design guidance unless a book is cited.

CM-2, Baseline Configuration: the playbook or role version, by Git commit and tag, is the baseline version for the hosts it owns, as Book 12 already records Ansible playbook versions.

CM-3, Configuration Change Control: every change to a playbook, inventory source or variable reaches the main branch only by pull request with a required reviewer, and the controller runs only content from main. Book 12 treats baseline changes by pull request as CM-3.

CM-6, Configuration Settings: the baseline playbook implements, and the same playbook in check mode monitors and reports drift. Book 12 lists Ansible enforcement under CM-6.

CM-7, Least Functionality: baseline tasks that remove packages and disable services, checked by the same drift run; the example checks that telnet-server and rsh-server are absent.

CM-8, System Component Inventory: inventory comes from the CMDB, so Ansible never invents a host. A facts run reports what each host actually is beside what the CMDB says, and records any host nothing reached as not collected, which is the example inventory assessment playbook.`,
  "Evidence to the program — \"Controls and the Ansible evidence for each.\"");
}

// ================================================================== 20 AU, AC, SR and the evidence store
{
  const s = content(M3, "Audit, privilege, supply chain, and the evidence store");
  tag(s, "What");
  const tb = table(s, "More", 1.5, [3.4, 8.75], ["Control", "Ansible's evidence (design guidance unless cited)"], [
    ["AU-2 Event Logging, AU-12 Audit Record Generation", "The controller's job records, activity stream and external logging to the SIEM; for ansible-core alone, a callback or log file shipped to the SIEM"],
    ["AC-6 Least Privilege, AC-6(5) Privileged Accounts", "Per-purpose credentials, and the controller governed as a non-person identity"],
    ["SR-3 Supply Chain Controls, SR-11 Component Authenticity", "Collections from a reviewed, signed source, pinned by version and verified. SA-12, the Revision 4 control, was withdrawn into the SR family"],
  ], { fontSize: 13, limit: 4.3 });
  panel(s, "Contract", 0.6, tb + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "JOB RESULTS TO THE EVIDENCE STORE (BOOK 12'S EVIDENCE CONTRACT)", null, [
    "Each result carries the asset's authoritative identity as the join key, aap as the source stack, the finding or baseline reference, and the job ID as the evidence pointer",
    "Because the inventory came from the CMDB, every result already carries the configuration item number the contract joins on",
    "The example playbooks write CSV and JSON with that column for the same reason",
  ], 13.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5.2.0 (AU-2, AU-12, AC-6, AC-6(5), SR-3, SR-11; SA-12 withdrawn); Book 12, Ch 07. Guide: Evidence to the program.");
  notes(s,
`The rest of the evidence table, and where the evidence goes.

AU-2 and AU-12, event logging and audit record generation: the controller's job records, its activity stream and external logging to the SIEM. For ansible-core on its own, a callback or log file shipped to the SIEM.

AC-6 and AC-6(5), least privilege and privileged accounts: per-purpose credentials, and the controller governed as a non-person identity, which Module 2 covered.

SR-3 and SR-11, supply chain controls and component authenticity: collections from a reviewed, signed source, pinned by version and verified, which the dangers table comes back to. SA-12, the Revision 4 supply chain control, was withdrawn and incorporated into the SR family, so cite SR.

Then the evidence store. Book 12's evidence contract already expects Ansible Automation Platform job results to be posted to the coordination layer's inbound integration, in the same shape every other stack emits: the asset's authoritative identity as the join key, aap as the source stack, the finding or baseline reference, and the job ID as the evidence pointer. Because the inventory came from the CMDB, every result already carries the CMDB's configuration item number, which is the join key the contract needs. The example playbooks write CSV and JSON with that column for the same reason.`,
  "Evidence to the program — \"Controls and the Ansible evidence for each,\" \"Job results to the evidence store.\"");
}

// ================================================================== 21 Dangers 1
{
  const s = content(M3, "Dangers: blast radius, inventory drift, credential sprawl");
  tag(s, "Why");
  const tb = table(s, "Dangers1", 1.5, [2.0, 3.8, 6.35], ["Danger", "How it fails", "How to avoid it"], [
    ["Blast radius", "A playbook runs against all, or a group is wider than anyone thought, and one bad task changes every host", "Check mode first; target with --limit; serial batches so the first is a canary; stop with max_fail_percentage or any_errors_fatal; --diff, but not on secret tasks"],
    ["Inventory drift", "A hand-kept hosts file disagrees with the CMDB: retired hosts targeted, new ones missed, owners wrong", "Generate inventory from the CMDB at run time; plugins over scripts; constructed for groups; fail on a duplicate or malformed record"],
    ["Credential sprawl", "Keys in engineers' local files; one service account everywhere; a secret in a playbook", "One controller; per-purpose, expiring credentials; no_log on every secret task, and no production runs at high verbosity"],
  ], { fontSize: 13, limit: 5.45 });
  callout(s, "Lint", tb + 0.25, 0.95, "FaFilter", HEX.amber, "Lint as a gate (design guidance): ",
    "require ansible-lint's production profile on every pull request; it makes several of these controls mechanical.");
  sources(s, "Sources: Ansible docs: check mode; patterns; strategies; error handling; dynamic inventory; constructed; logging. Ansible Lint, Profiles. Guide: Dangers and how to avoid them.");
  notes(s,
`The dangers, in the guide's order, starting with the three that cause the biggest failures.

Blast radius. A playbook runs against all, or an inventory group is wider than anyone thought, and one bad task changes every host at once. Run in check mode first: Ansible runs without making any changes on remote systems, though modules without check-mode support report nothing and do nothing. Target narrowly with --limit. Change in batches with serial, which takes a number, a percentage or a list such as one, five, then 25 percent, so the first batch is a canary. Set max_fail_percentage, which applies per batch and must be exceeded, not equaled, or any_errors_fatal to stop on the first failure. Use --diff to see what would change, but it can reveal sensitive information, so turn it off on tasks that handle secrets.

Inventory drift. A hand-kept hosts file disagrees with the CMDB: decommissioned hosts are still targeted, new ones are missed, owners are wrong. Generate inventory from the CMDB at run time. Ansible recommends inventory plugins over scripts, and the constructed plugin builds groups from variables an earlier source supplied. Fail the run on a duplicate or malformed record instead of producing a partial inventory.

Credential sprawl. Each engineer keeps keys in local files, one service account is used everywhere, a secret sits in a playbook. One controller, with credentials stored or brokered there, per purpose and expiring. Mark every secret-handling task no_log; it doesn't hide debugging output, so don't run production jobs at high verbosity.

And lint as a gate. ansible-lint's profiles rise in strictness from min to production, which meets requirements for inclusion in Automation Platform; safety flags risky module calls, and production requires fully qualified collection names. Requiring production on every pull request is design guidance.`,
  "Dangers and how to avoid them — blast radius, inventory drift, credential sprawl; \"Lint as a gate.\"");
}

// ================================================================== 22 Dangers 2
{
  const s = content(M3, "Dangers: two tools, Galaxy content, root and idempotence");
  tag(s, "Why");
  table(s, "Dangers2", 1.5, [2.0, 3.8, 6.35], ["Danger", "How it fails", "How to avoid it"], [
    ["Two tools on one setting", "Ansible and machine configuration both set a value; auto-correct reverts Ansible, Ansible reverts it back, both report success", "One owning tool per setting, as a CMDB attribute that builds the groups, and an assertion in every changing playbook that refuses another tool's host"],
    ["Unreviewed Galaxy content", "A run installs the latest collection from public Galaxy; the new version changes behavior, or isn't what it claims", "A private hub or review; pin exact versions (the default is latest); collection verify, with --keyring where signed; keep the list as the bill of materials (SR-3, SR-11)"],
    ["Running as root", "Every task escalates, so a mistake in any task has root's reach", "become false by default, true only per task; confine escalation to hosts, since it can't be confined to commands"],
    ["Idempotence failures", "command and shell tasks report a change every time, so drift reports are noise and reruns aren't safe", "Purpose-built modules; a changed_when on every command (no-changed-when flags the rest); run twice in test, and the second run must change nothing"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Ansible docs: Galaxy glossary; installing and verifying collections; become; command module. Ansible Lint rules. Microsoft Learn, remediation options. Guide: Dangers.");
  notes(s,
`Four more dangers, each with a control that can be checked.

Two tools fighting over one setting. Ansible and machine configuration both set a value; auto-correct silently reverts Ansible, Ansible reverts it back, and both report success. The control is the rule from Module 1: one owning tool per setting, as a CMDB attribute that builds the inventory groups, and an assertion in every changing playbook that refuses a host another tool owns.

Unreviewed Galaxy content. A playbook installs the latest version of a collection from the public Galaxy server at run time, and the new version changes behavior or isn't what it claims to be. Galaxy is a site for finding and sharing community content. Install collections from a private automation hub or after review, and pin each to an exact version, because by default ansible-galaxy installs the latest. Verify installed content with ansible-galaxy collection verify, and where the source signs collections, require signatures with --keyring, which Ansible checks only for collections from a distribution server. Record each collection's name, version and source as the automation's software bill of materials, under SR-3 and SR-11.

Running as root. Every task escalates, so a mistake in any task has root's reach. Escalate per task: become false as the default and true only where needed. Escalation can't be confined to commands, so confine it to hosts. Read-only checks that need root run pinned to check mode.

Idempotence failures. Command and shell tasks report a change every time, or make one every time, so drift reports are noise and reruns aren't safe. Prefer a purpose-built module; the command module supports check mode only with creates or removes. Give every command task a changed_when; ansible-lint's no-changed-when rule flags those that don't. And run each playbook twice in test, requiring the second run to report no changes.`,
  "Dangers and how to avoid them — two tools on one setting, Galaxy content, running as root, idempotence failures.");
}
endModule("Module 3");

// ================================================================== 23 Module 4 divider
{
  const s = divider(M4, "Module 4: Adoption and the example playbooks", "Read-only first, enforcement under change control, the platform last",
    ["Five phases, each with a decision and a gate", "The CMDB-driven inventory and the four playbooks", "How they're tested, the checklist, and the decisions"], 12);
  notes(s,
`Module 4: adoption and the examples. Everything so far comes together in a path that starts read-only and earns its way to enforcement.

So: the five phases, each ending at a gate whose evidence the next phase builds on, with the decision and the decider for each; the example folder, starting with the CMDB-driven inventory that every playbook reads; the four playbooks and what each one proves; how they're tested and what they don't prove; the checklist; and the decisions, with who makes each.`,
  "A phased adoption path; The example playbooks; Checklist.");
}

// ================================================================== 24 Phases
{
  const s = content(M4, "A phased path: read-only first, enforcement later");
  tag(s, "How");
  const tb = table(s, "Phases", 1.5, [2.15, 3.55, 3.3, 3.15], ["Phase", "What happens", "Decision, and who decides", "Gate: done when"], [
    ["0. Read-only inventory", "ansible-core on a hardened node; inventory from the CMDB export; facts runs only, posted as evidence", "Group attributes and config_owner values: the CMDB owner with the platform teams", "Every record has a collected or not-collected row; findings sent to the CMDB"],
    ["1. Arc onboarding", "Book 05's waves, by Microsoft's role or a gated playbook; tags from the CMDB", "Onboarding identity and wave plan: server infrastructure", "Each wave verified; its credential removed; Arc tags match the CMDB"],
    ["2. Tier-2 baselines, check mode", "Baselines for Unix, Linux beyond Arc, network, VMware, Infoblox; drift reported", "Baseline content (agency CM-6 settings from CIS or the vendor's guide): the CISO's configuration authority", "Every tier-2 host has a drift report against a versioned baseline"],
    ["3. Enforcement under change control", "Applied by pull request, canary-first, on hosts Ansible owns", "Go-live per platform: the platform owner, through change control", "Two clean runs; rollback tested; exceptions recorded"],
    ["4. The platform at scale", "Controller, hub, execution environments; vault credentials; SIEM; automatic results", "Hosting, boundary, credentials: the system owner and the authorizing official", "In the boundary documentation; reviewed as privileged; no hand steps"],
  ], { fontSize: 11.5, limit: 5.75 });
  callout(s, "Start", tb + 0.15, 0.75, "FaLightbulb", HEX.teal, "Phase 0 can start in a week: ",
    "a laptop-class control node and a CMDB export. The platform isn't needed until phase 3.");
  sources(s, "Sources: the guide's adoption path (design guidance); Book 05, Ch 09 (onboarding waves). Guide: A phased adoption path.");
  notes(s,
`The adoption path is design guidance, and each phase ends at a gate whose evidence the next phase builds on.

Phase 0, read-only inventory. ansible-core on a hardened control node, inventory from the CMDB export, facts runs only, posted to the evidence store. The CMDB owner decides, with the platform teams, which attributes drive groups and the config_owner values. It's done when every managed CMDB record has a collected or not-collected row, and owner-missing and version-mismatch findings have gone back to the CMDB.

Phase 1, Arc onboarding. Book 05's waves, run by Microsoft's role or a gated playbook, with tags from the CMDB. Server infrastructure decides the onboarding identity and wave plan. Done when each wave is connected, baselined and verified, its credential removed, and Arc tags match the CMDB.

Phase 2, tier-2 baselines in check mode, for Unix, Linux beyond Arc, network, VMware and Infoblox, with drift reported. The CISO's configuration authority decides the baseline content: the agency's CM-6 settings, drawn from the CIS Benchmark, Red Hat's CIS profile or the vendor's hardening guide. Done when every tier-2 host has a drift report against a versioned baseline, and findings are triaged.

Phase 3, enforcement under change control: baselines applied for real, by pull request, in canary-first batches, on hosts whose config_owner is Ansible. The platform owner decides go-live per platform. Done after two clean consecutive runs with no changes on the second, a tested rollback, and recorded exceptions.

Phase 4, Automation Platform at scale: controller, private hub, execution environments, vault-brokered credentials, SIEM logging and automatic results. The system owner and authorizing official decide hosting, boundary and credential design. Done when the controller is in the boundary documentation, reviewed as a privileged account, and evidence arrives with no hand steps.

Phase 0 can start in a week, and Automation Platform isn't a prerequisite for phases 0 to 2; it's how phase 3 becomes governable at scale.`,
  "A phased adoption path — \"Adoption phases, decisions and gates.\"");
}

// ================================================================== 25 CMDB inventory
{
  const s = content(M4, "The CMDB-driven inventory: groups from attributes");
  tag(s, "What");
  const tb = table(s, "Groups", 1.5, [3.45, 3.7, 5.0], ["Group", "From the CMDB column", "Used by"], [
    ["managed, unmanaged, tier_1 to tier_4", "management_tier: tiers 1 to 4", "All playbooks; none targets unmanaged"],
    ["os_linux, os_unix, os_windows, os_network_ios, os_infoblox_nios, os_vmware_vcenter", "os_family", "Each play's hosts line"],
    ["config_owner_ansible, config_owner_arc_machine_configuration", "config_owner: the one tool that owns the settings", "The baseline check runs only on config_owner_ansible"],
    ["arc_onboarding_candidates", "Tier 1, Linux or Windows, not onboarded", "The onboarding playbook"],
    ["env_production, env_nonproduction", "environment", "A first run limited to nonproduction"],
    ["owner_missing", "owner is empty", "A CM-8 finding to fix in the CMDB, never a target"],
  ], { fontSize: 12.5, limit: 5.45 });
  callout(s, "Fail", tb + 0.2, 0.95, "FaDatabase", HEX.navy, "Fail, don't guess: ",
    "a duplicate record, missing column or unknown tier stops the script. In production, use an inventory plugin instead.");
  sources(s, "Sources: examples/ansible README (inventory); Ansible docs: dynamic inventory; constructed inventory. Book 05, Ch 03. Guide: The example playbooks; Dangers (inventory drift).");
  notes(s,
`The example folder starts with the inventory, because every other pattern depends on it. The inventory is a dynamic inventory script that reads a CSV export from the CMDB, or a fictional sample export, and only reads it: the CMDB stays the origin of every business fact, as Book 05, Chapter 03 says. It builds groups from the record's attributes.

The management tier gives managed and unmanaged groups and tiers 1 to 4, and no playbook targets unmanaged. The OS family gives the Linux, Unix, Windows, Cisco IOS, Infoblox NIOS and vCenter groups each play targets. The config_owner column gives a group per owning tool, and the baseline check runs only on the Ansible group. Arc onboarding candidates are tier 1 Linux or Windows servers whose Arc status is not onboarded. The environment column gives production and nonproduction groups, so a first run can be limited to nonproduction. And an empty owner puts the host in owner_missing: a CM-8 finding to fix in the CMDB, never a target.

A duplicate record, a missing column or an unknown tier stops the script with an error instead of producing a partial inventory. Ansible recommends inventory plugins over scripts; the example uses a script because it needs nothing but Python and shows the whole mapping in one file. In production, read the CMDB through its own inventory plugin if it has one, or through the constructed plugin over its export.`,
  "The example playbooks — \"What the example folder contains\"; examples/ansible README, \"What's here.\"");
}

// ================================================================== 26 Four playbooks
{
  const s = content(M4, "Four example playbooks, and what each one proves");
  tag(s, "How");
  table(s, "Playbooks", 1.5, [2.8, 4.75, 1.65, 2.95], ["Playbook", "What it does", "Changes targets?", "Pattern it proves"], [
    ["01 Inventory assessment", "Minimal facts and Arc agent status from every managed server, beside the CMDB record, as CSV and JSON; unreached hosts say not collected", "No", "The CM-8 feed"],
    ["02 Arc onboarding", "Installs and connects the agent on tier 1 candidates, tags from the CMDB; one canary, then 5, then 25 percent, stopping on first failure", "Only with confirm_change=true", "Gated change; the secret from a vault, passed in a deleted file, never logged"],
    ["03 Linux baseline check", "Compares example settings on hosts the CMDB says Ansible owns, and reports drift", "No: pinned to check mode", "Drift as evidence; refuses another tool's host"],
    ["04 Network and DDI facts", "Cisco IOS facts and the Infoblox Grid's members through the WAPI, as a CSV feed", "No", "Tier-2 evidence without agents"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: examples/ansible README (What's here; How read-only is enforced); Microsoft Learn, azcmagent connect. Guide: The example playbooks.");
  notes(s,
`Four small playbooks, each showing one pattern from the guide. Rather than read the code, here's what each does and proves.

01, inventory assessment, is the CM-8 feed. It gathers minimal facts from every managed Linux, Unix and Windows server, checks for the Connected Machine agent and reads its status, and writes CSV and JSON with the CMDB's record and what was observed side by side. Every CMDB record gets a row, and one nothing reached says not collected. It changes nothing.

02, Arc onboarding, is the gated change. It installs and connects the agent on the tier 1 servers the CMDB says aren't connected, with tags from the CMDB record. It runs in check mode unless confirm_change is set to true on the command line, then goes one canary host first, then 5, then 25 percent at a time, stopping at the first failure. The secret comes from Ansible Vault or the environment, every task that handles it is no_log, and it's written to a root-only parameter file for azcmagent and deleted in an always block.

03, the Linux baseline check, is drift as evidence. It compares a handful of example settings on the Linux hosts whose CMDB record names Ansible as owner, and it's pinned to check mode by the play itself, so a changed result is drift, even when run without the check flag. It refuses a host another tool owns.

04, network and DDI facts, reads Cisco IOS facts and the Infoblox Grid's members through the NIOS WAPI, and writes a CSV feed: tier-2 evidence without agents.

Report writers run only on the control node and write only under the reports folder.`,
  "The example playbooks; examples/ansible README, \"What's here,\" \"How read-only is enforced.\"");
}

// ================================================================== 27 Tests and limits
{
  const s = content(M4, "How the examples are tested, and what they don't prove");
  tag(s, "How");
  const a = panel(s, "Tests", 0.6, 1.5, 6.4, null, HEX.teal, HEX.tealTint, "THE TESTS", null, [
    "yamllint and ansible-lint, production profile, both strict; a syntax check on every playbook",
    "A static read-only checker that fails on any ungated write, with negative tests that prove it",
    "Inventory tests: tiers, owners, candidates, and failure on bad records",
    "Local runs: 01 and 03 write reports; 02 without the gate leaves nothing behind",
  ], 13.5);
  const b = panel(s, "Limits", 7.25, 1.5, 5.5, null, HEX.red, HEX.redTint, "WHAT THEY DON'T PROVE", null, [
    "Tested Oct. 29, 2026, on the control node only",
    "Arc, Windows, Cisco and Infoblox paths pass lint and syntax, but haven't run on those platforms",
    "The baseline is seven example settings, not a CIS Benchmark profile",
    "No VMware playbook; 02 is a teaching example, not a replacement for Microsoft's role",
  ], 13.5);
  callout(s, "Illus", Math.max(a, b) + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "Illustrations, not production code: ",
    "review every task, pin collections from a reviewed source, and run them first in test.");
  sources(s, "Sources: examples/ansible README (Tests; Known limits; status note); the guide's verification log. Guide: The example playbooks.");
  notes(s,
`The examples follow the house rules of the workbook's Start Kit: read-only by default, tested, and a test that fails on any write it doesn't allow.

The test runner prints the tool versions, then runs yamllint and ansible-lint with the production profile, both strict, a syntax check on every playbook, and the Python tests. The read-only test parses every playbook and fails on any task that could change a target outside the rules, and its negative tests prove it catches a copy to etc, an unpinned lineinfile, a shell task, a service restart, an arbitrary azcmagent command and a package install. The inventory tests check that every CMDB record becomes a host, with tiers, owners, Arc candidates and the missing-owner finding, and that a duplicate, a missing column or an unknown tier fails. The local runs execute playbooks 01 and 03 against the control node; the baseline check changes no file and refuses a host another tool owns, and the onboarding playbook without the gate leaves no agent, parameter file or installer behind.

What they don't prove. They were tested on October 29, 2026, with ansible-core 2.21.5, ansible-lint 26.10.1 and yamllint 1.38.0, on the control node only. The Arc, Windows, Cisco and Infoblox paths pass lint and syntax checks but haven't run against those platforms. The baseline is seven example settings that show the pattern, not a CIS Benchmark profile or an agency's CM-6 baseline. There's no VMware playbook. And the onboarding playbook is a teaching example, not a replacement for Microsoft's supported role.

They're illustrations, not production code. Review every task, pin the collections from a source you've reviewed, and run them first in a test environment.`,
  "The example playbooks; examples/ansible README, \"Tests,\" \"Known limits.\"");
}

// ================================================================== 28 Checklist
{
  const s = content(M4, "The adoption checklist, area by area");
  tag(s, "How");
  table(s, "Checklist", 1.5, [2.0, 10.15], ["Area", "Done when"], [
    ["Ownership", "Every CMDB record names one configuration owner  ·  Changing playbooks run only on hosts Ansible owns  ·  Exceptions are dated records"],
    ["Inventory", "Generated from the CMDB at run time  ·  Malformed records fail the run  ·  Not-collected hosts reported, never counted as compliant"],
    ["Arc onboarding", "Managed identity or certificate service principal  ·  Onboarding role only, on the resource group  ·  Credential removed when the wave closes  ·  Tags from the CMDB"],
    ["Change safety", "Check mode first  ·  --limit and canary-first serial  ·  Stop on first failure  ·  Second run reports no changes"],
    ["Credentials", "Two human owners  ·  One credential per purpose  ·  No secret in Git or a playbook  ·  Every credential expires  ·  no_log on secret tasks"],
    ["Content", "Reviewed or signed source  ·  Pinned versions  ·  collection verify in the pipeline  ·  Collection list kept as the bill of materials"],
    ["Evidence", "Playbook version as the CM-2 baseline  ·  Pull requests as CM-3  ·  Job results posted with the CMDB key  ·  Controller logs in the SIEM"],
    ["Platform", "Authorization treatment recorded  ·  FIPS mode where required  ·  CIS-aligned CM-6 baseline on the controller and its hosts  ·  Controller reviewed as a privileged identity"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: the guide's checklist, drawing on its sections above; NIST SP 800-53 Rev. 5.2.0 (CM-2, CM-3). Guide: Checklist.");
  notes(s,
`The guide closes its technical material with a checklist, eight areas, each with what done looks like.

Ownership: every asset's CMDB record names one configuration owner, changing playbooks run only on hosts Ansible owns, and exceptions are dated records. Inventory: generated from the CMDB at run time, malformed records fail the run, and not-collected hosts are reported, never counted as compliant. Arc onboarding: a managed identity or certificate service principal, the onboarding role only on the resource group, the credential removed when the wave closes, and tags from the CMDB.

Change safety: check mode first, --limit and canary-first serial, stop on the first failure, and a second run that reports no changes. Credentials: two human owners, one credential per purpose, no secret in Git or a playbook, every credential expiring, and no_log on every secret-handling task. Content: collections from a reviewed or signed source, pinned versions, collection verify in the pipeline, and the collection list kept as the automation's bill of materials.

Evidence: the playbook version as the CM-2 baseline, pull requests as CM-3, job results posted with the CMDB key, and controller logs in the SIEM. And platform: the authorization treatment recorded, FIPS mode where required, a CIS-aligned agency CM-6 baseline applied to the controller host and the hosts it manages, and the controller reviewed as a privileged non-person identity.`,
  "Checklist — \"Ansible adoption checklist.\"");
}

// ================================================================== 29 Decisions
{
  const s = content(M4, "Decisions, owners, and where to start");
  tag(s, "How");
  table(s, "Decisions", 1.5, [5.5, 3.2], ["Decision (design guidance)", "Who decides"], [
    ["Which CMDB attributes drive groups; the config_owner values", "The CMDB owner, with the platform teams"],
    ["The Arc onboarding identity and the wave plan", "Server infrastructure"],
    ["The baseline content per platform: agency CM-6 settings from CIS or the vendor's guide", "The CISO's configuration authority"],
    ["Go-live for enforcement on each platform", "The platform owner, through change control"],
    ["Hosting, authorization boundary and credential design", "The system owner and the authorizing official"],
    ["An exception: Ansible touching a setting another tool owns", "A dated record with a reason"],
  ], { fontSize: 13.5, limit: 6.5 });
  panel(s, "Start", 9.55, 1.5, 3.2, null, HEX.teal, HEX.tealTint, "PHASE 0, THIS WEEK", "Start with these", [
    "Add config_owner to the CMDB",
    "Export the CMDB; build groups from it",
    "Run facts only, posted as evidence",
    "Send owner-missing findings back",
  ], 14.5);
  sources(s, "Sources: the guide's adoption path and ownership rules (design guidance); Book 05, Ch 09. Guide: A phased adoption path; One owning tool per setting.");
  notes(s,
`So, the decisions, each with its decider from the guide's adoption table, all design guidance.

The CMDB owner, with the platform teams, decides which CMDB attributes drive the inventory groups and what the config_owner values are. That's the decision everything else rests on, because it's what lets Ansible read anything and write only what it owns. Server infrastructure decides the Arc onboarding identity, managed identity or certificate service principal, and the wave plan. The CISO's configuration authority decides the baseline content per platform: the agency's CM-6 settings, drawn from the CIS Benchmark, Red Hat's CIS profile or the vendor's hardening guide. The platform owner decides go-live for enforcement, platform by platform, through change control. And the system owner and authorizing official decide hosting, the authorization boundary and the credential design for the platform at scale. Where Ansible must touch a setting another tool owns, that's not a decision made in a playbook; it's a dated exception record with a reason, and the owning tool's baseline catches up within its life.

Where to start is phase 0, which the guide says can start in a week with a laptop-class control node and a CMDB export. Add the config_owner attribute. Export the CMDB and build the inventory groups from it. Run facts only, and post the results as evidence. And send the owner-missing and version-mismatch findings back to the CMDB. It produces evidence the program needs anyway.

Ansible can reach almost anything, so decide where it may write, record the decision in the CMDB, and let the evidence follow. The guide carries every claim footnoted and dated, and the example folder is downloadable with its tests. Thank you.`,
  "A phased adoption path; One owning tool per setting; Checklist.");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const sourceSlide = (title, src, pt = 12) => {
  const s = content("Backup", title);
  txt(s, "Source list", bullets(src, pt), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
  const need = 1.5 + src.reduce((a, t) => a + lines(t, 11.8, pt) * pt / 72 * 1.2 + 0.07, 0);
  if (need > 6.6) console.warn(`  ! ${title} source list may overflow: needs ${need.toFixed(2)}`);
  if (process.env.FIT) console.log(`  sources ${title}: needs ${need.toFixed(2)}`);
};
sourceSlide("Sources behind the orientation and Module 1", [
  "Ansible documentation (checked against the ansible-documentation sources): Managing Windows hosts; Windows SSH; Glossary and Ansible playbooks (idempotency); Validating tasks: check mode and diff mode; Understanding privilege escalation: become.",
  "Microsoft Learn: Connected Machine agent prerequisites (supported operating systems); Remediation options for machine configuration; PowerShell DSC in machine configuration; Azure Connected Machine agent deployment options.",
  "Microsoft Learn: Connect machines to Azure Arc at scale with Ansible (azure.azcollection.azure_arc); Arc-enabled servers identity and authorization; azcmagent connect; azcmagent CLI reference.",
  "Collections: cisco.ios ios_facts; community.vmware changelog 7.0.0 and vmware.vmware vms plugin; vmware.vmware_rest vcenter_vm_info; infoblox.nios_modules lookups; amazon.aws aws_ec2, google.cloud gcp_compute, azure.azcollection azure_rm.",
  "Workbook: Book 05, Chapters 01, 03, 04 and 09; Book 08, Chapter 11 and Appendix A; Book 12, Chapter 07; Book 15, Chapter 09; Infoblox NIOS implementation guide (research).",
  "Full footnotes with links and access dates (Oct. 29, 2026): Companion guide, Ansible for Configuration Automation, \"What Ansible is\" and \"Where Ansible fits\"; verification log.",
]);
sourceSlide("Sources behind Module 2 — The platform, federal setting", [
  "Red Hat: Ansible Automation Platform Life Cycle; Ansible ansible-core support matrix; AAP 2.7 containerized and OpenShift installation; pluggable authentication and mandatory gateway authentication; tokens.",
  "FedRAMP Marketplace products (searched for Ansible and Red Hat); FedRAMP Marketplace, Red Hat OpenShift Service on AWS (FR2102031769); Red Hat Customer Portal, FedRAMP.",
  "Red Hat: AAP on Microsoft Azure guide; AAP Service on AWS; deployment options. AWS: FedRAMP; FedRAMP services in scope. Red Hat Customer Portal: FIPS; DISA STIG (High only). AAP 2.5 release notes (AAP-39146). Red Hat blog, \"DISA releases the first Ansible STIG\" (Apr. 11, 2023).",
  "Red Hat AAP 2.7: host-level security controls and security profiles; logging to third-party aggregators; activity streams; secure logging; content in automation hub; content signing; project signing; webhooks; credential types; Vault OIDC credentials. AAP 2.5 cleanup jobs.",
  "Red Hat: RHEL 9 and RHEL 10 Security hardening (CIS profiles; remediating with an SSG Ansible playbook). CIS Benchmarks. Ansible Lockdown (RHEL9-CIS, RHEL9-CIS-Audit). CISA SCuBA. Ansible documentation: Ansible Vault; Logging Ansible output (no_log).",
  "Workbook: Book 02, Chapter 09; Book 04, Chapter 05; Book 05, Chapter 09; Book 12, Chapter 07. Full footnotes (Oct. 29, 2026): the guide, \"Ansible Automation Platform in a federal setting.\"",
]);
sourceSlide("Sources behind Modules 3 and 4 — Evidence and adoption", [
  "NIST SP 800-53 Rev. 5, release 5.2.0, and its OSCAL catalog and Moderate baseline profile: CM-2, CM-3, CM-6, CM-7, CM-8, AU-2, AU-12, AC-6, AC-6(5), SR-3, SR-11; SA-12 withdrawn.",
  "Ansible documentation: Patterns (--limit); Strategies (serial); Error handling; Working with dynamic inventory; constructed inventory; Galaxy glossary; Installing collections; Verifying collections; command module.",
  "Ansible Lint documentation: Profiles (min to production); rules no-changed-when, risky-shell-pipe and fqcn.",
  "Workbook: Book 12, Chapter 07 (evidence contract; CM-2, CM-3, CM-6); Book 05, Chapters 03 and 09; Book 00, Chapter 08 (the Start Kit's house rules).",
  "Example folder: examples/ansible README (inventory groups, playbooks, read-only enforcement, tests, known limits), downloadable as ansible-examples.zip.",
  "Full footnotes (Oct. 29, 2026): the guide, \"Evidence to the program,\" \"Dangers,\" \"A phased adoption path,\" \"The example playbooks,\" \"Checklist\"; verification log.",
]);
sourceSlide("Federal requirements: full citations", [
  "NIST, SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations, release 5.2.0 (Aug. 27, 2025): CM-2, CM-3, CM-6 (organization-defined common secure configurations), CM-7, CM-8, AU-2, AU-12, AC-6, AC-6(5), IA-5, SR-3, SR-11, and withdrawn SA-12. csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
  "NIST, OSCAL Rev. 5 catalog and Moderate baseline profile, version 5.2.0 (control titles, baseline membership, SA-12 withdrawal). github.com/usnistgov/oscal-content, nist.gov/SP800-53/rev5",
  "FedRAMP, Marketplace Products (searched for Ansible and Red Hat offerings), fedramp.gov/marketplace/products; Red Hat OpenShift Service on AWS, package FR2102031769 (FedRAMP Certified, High).",
  "NIST, SP 800-70 Rev. 5, National Checklist Program (May 2026), csrc.nist.gov/pubs/sp/800/70/r5/final. High only: DISA STIG for Red Hat Ansible Automation Controller, as listed at access.redhat.com/compliance/disa-stig; current release unverified.",
  "FIPS 140 certificates for RHEL cryptographic modules, as listed on Red Hat Customer Portal, FIPS, access.redhat.com/compliance/fips. AAP 2.6 and 2.7 FIPS-mode support statement: not found.",
  "All accessed Oct. 29, 2026. Short forms on the slides: \"NIST SP 800-53 Rev. 5.2.0\", \"FedRAMP Marketplace\", \"Red Hat DISA STIG page\", \"Red Hat FIPS page\".",
], 12.5);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
