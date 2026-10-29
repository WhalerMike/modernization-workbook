// Companion guide — Attribute-Driven Migration to Entra ID, technical deep dive, PART 1: the model and the HR track.
//   Module 1 (the model):              the OU tree's four jobs, the four tracks, the end state, the federal requirements,
//                                      the attributes primer, the stage map, Stage 0.
//   Module 2 (the HR track: sourcing): HR as the authority, Federal HR 2.0, API-driven provisioning, contractors,
//                                      the canonical schema, Stages 2 and 3.
//   Module 3 (HR-track mechanisms):    Stages 4 to 6, the dangers of dynamic user groups, dynamic-membership limits,
//                                      the HR-track decisions, and what Part 2 covers.
// Part 2 (../attribute-driven-migration-technical-part-2/) carries the Intune, Arc and non-person tracks and running it.
// The slide builders are shared in ./slides.js; this file picks Part 1's slides and adds its own title, dividers and close.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node presentations/attribute-driven-migration-technical-part-1/build.js \
//                      presentations/attribute-driven-migration-technical-part-1/Attribute_Driven_Migration_Technical_Part_1.pptx
const P = require("./slides.js")({
  title: "Attribute-Driven Migration to Entra ID — Technical Deep Dive, Part 1",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration — Part 1: The model and the HR track",
});
const { SL, HEX, txt, tag, G, content, titleSlide, divider, notes, endModule, section, table, panel, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Attribute_Driven_Migration_Technical_Part_1.pptx";

const M1 = "Module 1 — The model";
const M2 = "Module 2 — The HR track: sourcing and proving";
const M3 = "Module 3 — HR-track mechanisms";

// ================================================================== Title
{
  const s = titleSlide("Orientation", "Part 1: The model and the HR track", "Attribute-Driven Migration to Entra ID — technical deep dive, in two parts");
  txt(s, "Session map", [
    { text: "Module 1  The model   ·   Module 2  The HR track: sourcing and proving", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Module 3  HR-track mechanisms: groups, units, Conditional Access", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 2: the Intune, Arc and non-person tracks, and running the migration", options: { color: HEX.ink, breakLine: true } },
    { text: "Facts dated October 29, 2026  ·  design guidance labeled as such", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 9.6, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 1 of the technical deep dive for the Federal Modernization Workbook's companion guide, Attribute-Driven Migration from Active Directory to Microsoft Entra ID. It's for identity engineers, Entra and AD administrators, Intune and Azure platform owners, PKI and credential teams, and ISSOs: the people who will write the attributes, the rules that read them and the evidence that shows they were true.

The guide's claim fits in one line. In Active Directory an object's place in the tree decided what applied to it; in Entra ID what the object says about itself decides. So the migration is the work of making those statements true and keeping them true.

The forest's identities move on four tracks, each with its own source of truth: the HR track for people, the Intune track for end-user devices, the Azure Arc track for servers, and the non-person track for service accounts, service principals, managed and workload identities and AI agents. The deep dive is split by track. Part 1 is the model and the HR track; Part 2 is devices, servers, non-person identities and running the migration.

Part 1 has three modules. Module 1 is the model: what the OU tree encoded, the four tracks, what the migration accomplishes and the federal rules behind it, the attributes primer, the nine-stage map and Stage 0. Module 2 is the HR track's sourcing: HR as the authority, Federal HR 2.0 and API-driven inbound provisioning, contractors, the canonical schema and its single writer, then proof and sync. Module 3 is the HR track's mechanisms: dynamic user groups, administrative units and Conditional Access personas, the dangers of dynamic user groups and their limits, and the HR-track decisions.

Three labels to listen for. The guide is a map; the books hold the depth, and each slide names the chapter. Microsoft facts were checked against Microsoft Learn on October 29, 2026. And the program's own recommendations are marked design guidance.`,
  `${G}, "How to read this guide," "Four tracks," "The path on one page"; Book 01, Chapter 04; Books 02, 03, 04 and 06 as linked.`);
}
SL.why();
endModule("Orientation");

// ================================================================== Module 1
section(M1);
{
  const s = divider(M1, "Module 1: The model, from placement to attributes", "Book 01, Chapter 04  ·  Book 02, Chapters 07–09  ·  the four tracks",
    ["What the OU tree encoded; the four tracks and their sources of truth", "What the migration accomplishes, the federal rules behind it, and the attributes", "The nine stages and their gates; Stage 0, reading the tree"], 23);
  notes(s,
`Module 1: the model. Before anything moves, the team needs a shared picture of what the OU tree was doing and where each of those jobs lands in Entra ID, because the target has to reproduce intent, not structure.

So: the four jobs and the mechanism that replaces each; the four tracks the forest's identities move on, HR for people, Intune for end-user devices, Azure Arc for servers and the non-person track for workloads, each with its own source of truth; what the migration accomplishes on each track, how you know you're there, and the federal requirements each track satisfies; a primer on Entra ID's attributes against Active Directory's; the nine stages of the guide's path, each with one decider and a gate that says it's done; and Stage 0, the read-only inventory of the tree, its GPO links and its hand-made delegations.`,
  `${G}, "What this migration accomplishes," "Four tracks," "Attributes," "The path on one page," Stage 0; Book 01, Chapter 04; Book 02, Chapters 07–09.`);
}
["oujobs", "tracks", "accomplish", "federal", "model", "mapping", "stores", "stagemap", "stage0"].forEach((k) => SL[k]());
endModule("Module 1");

// ================================================================== Module 2
section(M2);
{
  const s = divider(M2, "Module 2: Sourcing and proving the attributes", "The HR track: people  ·  Stages 1 to 3  ·  Book 03, Chapters 03–07 and 12",
    ["HR as the authority; Federal HR 2.0 and API-driven provisioning", "Contractors, the canonical schema and its single writer", "Proving the attributes true, then mapping them through sync"], 13);
  notes(s,
`Module 2: sourcing and proving the attributes. This module is the HR track: the people, employees and contractors, whose attributes come from HR and the contractor source. Devices, servers and workloads are Part 2. Every mechanism in Module 3 reads these values, so this is where the migration is won or lost, and it's the work estates skip because users never see it.

So: which system owns each fact, and the enterprise person key; Federal HR 2.0 as the coming source and how Core HCM reaches Entra ID through API-driven inbound provisioning; the facts HR doesn't supply, including contractors; the canonical schema and its one writer; and then Stages 2 and 3, proving the values true and carrying them through sync.`,
  `${G}, Stages 1–3; Book 03, Chapters 03–07 and 12; Book 02, Chapter 09.`);
}
["authority", "hr20", "api", "contractors", "schema", "stage2", "stage3"].forEach((k) => SL[k]());
endModule("Module 2");

// ================================================================== Module 3
section(M3);
{
  const s = divider(M3, "Module 3: HR-track mechanisms", "Stages 4 to 6  ·  dynamic user groups, administrative units, Conditional Access",
    ["Stage 4: OU subtrees as dynamic user groups; Stage 5: administrative units", "Stage 6: Conditional Access personas", "The dangers of dynamic user groups, their limits, and the HR-track decisions"], 15);
  notes(s,
`Module 3: the HR track's mechanisms. The attributes are true and in the directory. Now each mechanism that replaces an OU job for people reads them, and each has its own rules for what it can read.

So: Stage 4, OU subtrees rebuilt as dynamic user-group rules; Stage 5, delegation through administrative units; Stage 6, Conditional Access personas built from the attributes. Then the dangers of dynamic user groups and how to avoid them, the limits of dynamic membership and its latency, and the decisions the HR track needs, with their owners. Dynamic device groups, Intune targeting, Arc and the non-person identities are Part 2.`,
  `${G}, Stages 4–6, "Dynamic group dangers and how to avoid them," "Limits"; Book 01, Chapter 04; Book 02, Chapter 05; Book 03, Chapter 10; Book 04, Chapter 03; Book 06, Chapters 16–17.`);
}
["stage4", "stage5", "stage6", "dangersU", "limits1"].forEach((k) => SL[k]());

// ================================================================== Part 1 decisions (new)
{
  const s = content(M3, "Part 1 decisions: the HR track, owners, where to start");
  tag(s, "How");
  table(s, "Decisions1", 1.5, [5.0, 3.15, 0.9], ["Decision (design guidance)", "Who decides", "Stage"], [
    ["Where each OU function goes; each group's fate", "Identity engineering", "0"],
    ["Authority map, person key, contractor source", "ICAM governance body", "1"],
    ["Code lists; the schema", "HR; the data architect", "1"],
    ["Correlation threshold", "Agency risk governance", "2"],
    ["Write permissions on HR-mastered attributes", "Security", "1–2"],
    ["Sync engine, sign-in method, provisioning rules", "Identity engineering", "3"],
    ["An application's access rule", "The application owner", "4"],
    ["Delegation model; restriction per unit", "Identity engineering", "5"],
    ["Control requirements", "The CISO", "6"],
  ], { fontSize: 12.5, limit: 6.5 });
  panel(s, "Start1", 9.85, 1.5, 2.9, null, HEX.teal, HEX.tealTint, "FROM THE CHECKLIST", "Start with these", [
    "Export the tree, read-only",
    "Name the HR feed to the Steering Committee",
    "Populate employeeId",
    "Remove other writers",
    "Route logs out now",
  ], 14);
  sources(s, "Sources: Guide, \"The path on one page,\" \"Checklist\"; Book 02, Ch 06 and Book 03, Ch 07 responsibility matrices. Decisions and sequence are design guidance.");
  notes(s,
`The HR track's decisions, each with one decider from the two responsibility matrices, Book 02 Chapter 06 for the directory and Book 03 Chapter 07 for the data. All of it is the program's recommended model, design guidance.

Identity engineering decides where each OU function goes and each group's fate, the sync engine, sign-in method and provisioning rules, and the delegation model, with restriction per unit defaulting to no. The ICAM governance body decides the authority map, the enterprise person key and the contractor source. HR owns the code lists and the data architect owns the schema. The agency's risk governance sets the correlation threshold. Security decides who may write HR-mastered attributes. Each application's owner decides its access rule. And the CISO owns the control requirements.

Five places to start, all from the checklist and none needing a new platform. Export the OU tree, its GPO links and its hand-made delegations, read-only. Name the HR-to-identity feed and take it to the HR 2.0 Steering Committee before the interconnection goes live. Populate employeeId before the first full sync. Remove every other writer to the access attributes. And route logs out of Entra ID from day one, because history starts the day export does.

The wave go/no-go, drift findings, service-account conversion and AI sponsors are Part 2's decisions.`,
  `${G}, "The path on one page," "Checklist," Stages 0–6; Book 02, Chapter 06 — "The responsibility matrix"; Book 03, Chapter 07 — "The responsibility matrix."`);
}

// ================================================================== What's in Part 2 (new)
{
  const s = content(M3, "What's in Part 2");
  tag(s, "What");
  const a = panel(s, "P2A", 0.6, 1.5, 3.9, null, HEX.navy, HEX.navyTint, "MODULE 1", "Intune and Arc tracks", [
    "What Intune covers; targeting and device attributes",
    "Dangers of dynamic device groups",
    "What Azure Arc covers; servers through Resource Manager",
    "Devices neither tool covers: four tiers",
  ], 13.5);
  const b = panel(s, "P2B", 4.725, 1.5, 3.9, null, HEX.teal, HEX.tealTint, "MODULE 2", "Non-person track and PIV", [
    "Service accounts, MSAs and gMSAs",
    "Service principals, managed and workload identities, AI agents",
    "The object-type crosswalk",
    "PIV and CAC binding; certificateUserIds",
  ], 13.5);
  const c = panel(s, "P2C", 8.85, 1.5, 3.9, null, HEX.amber, HEX.amberTint, "MODULE 3", "Running it", [
    "One analyst through a mover event",
    "Phased cutover; drift at the source",
    "Units, Lifecycle Workflows, what still needs AD",
    "The checklist and decisions for every track",
  ], 13.5);
  P.callout(s, "P2Recap", Math.max(a, b, c) + 0.3, 0.85, "FaRoute", HEX.navy, "Part 2 opens with a recap: ",
    "the four tracks and the store table from this part's attributes primer.");
  sources(s, "Sources: Guide, \"Beyond users: the Intune, Arc and non-person identity tracks,\" Stages 7–8, \"Limits,\" \"Checklist\"; Books 02, 03, 05, 17 as Part 2 cites them.");
  notes(s,
`That's Part 1: the model and the HR track. Part 2 covers devices, servers and non-person identities, and then runs the migration.

Module 1 of Part 2 is the Intune and Arc tracks: what Intune covers, which isn't only Windows, how it targets devices and how device attributes are written, the dangers of dynamic device groups, what Azure Arc covers and how a server becomes attribute-driven through Azure Resource Manager, and the four-tier strategy for devices neither tool reaches.

Module 2 is the non-person track: service accounts, MSAs and gMSAs and their targets; service principals, managed identities, workload identities and AI agents, each with an owner and sponsor, a credential and a lifecycle; the object-type crosswalk; and PIV and CAC certificate binding.

Module 3 runs it: one analyst through a mover event, the phased cutover, drift correction at the source, the limits of administrative units and Lifecycle Workflows and what still needs AD during hybrid, and the checklist and decisions for every track. Part 2 opens with a short recap of the four tracks and the store table.`,
  `${G}, "Beyond users," Stages 7–8, "Limits," "Checklist."`);
}
endModule("Module 3");

// ================================================================== Backup
backup();
sourceSlide("Sources behind the orientation and Module 1", [
  "Attribute-Driven Migration guide: \"How to read this guide,\" \"What this migration accomplishes,\" \"Four tracks,\" \"Attributes,\" \"The path on one page,\" Stage 0, \"How the books' phase numbers line up\" (approximate; each book's gates govern its own work).",
  "Book 01, Chapter 04 — Identity Transformation: \"The identity claim,\" \"What the attributes drive,\" \"The four mechanisms,\" \"Where the attributes live,\" \"Verification.\"",
  "Book 02, Chapter 06 — \"The responsibility matrix\"; Chapter 07 — \"Recording what read-only discovery couldn't see\"; Chapter 08 — \"OU hierarchy and delegation,\" \"What to collect\"; Chapter 09 — \"Organizational units,\" \"The per-group decision,\" \"AdminSDHolder\"; Chapter 10 — Phases 0 and 4.",
  "Book 03, Chapter 06 — \"Design rules,\" \"Program attribute map\"; Chapter 07 — \"The responsibility matrix\"; Chapter 12 — Phases 1 and 5; Appendix C — \"Proving HR is the sole source.\"  ·  Book 05, Chapters 08–10.  ·  Book 17, Chapter 05.",
  "Microsoft Learn (Oct. 29, 2026): dynamic membership rules; user resource type; onPremisesExtensionAttributes; directory extensions; custom security attributes; certificateUserIds; Connect attributes synchronized; source anchor.",
  "Diagrams: Book 01 ch04-one-attribute-five-outcomes; Book 02 ch09-ad-to-entra-objects, ch08-gpo-analysis (committed renders; alt text from each chapter's fig-alt).",
]);
sourceSlide("Sources behind Module 2 — The HR track", [
  "Attribute-Driven Migration guide: Stage 1 (including \"Building the attributes from Federal HR 2.0\" and \"Licensing and GCC\"), Stage 2, Stage 3; attribute-to-mechanism crosswalk.",
  "Book 03, Chapter 03 — \"The program facts\" (dated Oct. 20, 2026), \"What OPM requires and what it leaves to the agency\"; Chapter 04 — authority, layered identifiers; Chapter 05 — the provisioning pipeline, two landing zones.",
  "Book 03, Chapter 06 — design rules, writers, program attribute map, standard attribute layer, one fact one authority; Chapter 07 — ownership, privacy office; Chapter 12 — Phases 0, 1 and 3; Chapter 13 — reference deployment.",
  "Book 02, Chapter 09 — sync engine, filtering, attribute flow, soft and hard match, Connect Sync deadline; Chapter 10 — Phase 1.  ·  Book 05, Chapter 08 — device attribute schema.  ·  Book 06, Chapter 17.",
  "Microsoft Learn (accessed Oct. 29, 2026): API-driven inbound provisioning concepts; Archive for Microsoft Entra releases (June 2025); Microsoft Entra feature availability; What are lifecycle workflows?",
  "Research: HCM-to-Entra implementation guide (provisioning apps; sequences).",
  "Diagrams: Book 03 ch04-authority-map, ch03-hr20-window, ch05-provisioning-services, ch07-attribute-ownership-chain, ch12-phase-gates; Book 02 ch09-sync-auth-decision.",
]);
sourceSlide("Sources behind Module 3 — HR-track mechanisms", [
  "Attribute-Driven Migration guide: Stages 4, 5 and 6; \"Dynamic group dangers and how to avoid them\" (dynamic user groups; monitoring); \"Limits\" (where dynamic membership stops; rule limits; latency); \"Checklist.\"",
  "Book 01, Ch 04; Book 02, Ch 05, 06, 09, 10; Book 03, Ch 06, 07, 08, 10; Book 04, Ch 03; Book 06, Ch 16, 17 and Runbook R07.",
  "Microsoft Learn (Oct. 29, 2026): dynamic membership rules; validate rules; dynamic group processing; memberOf operator (preview; ends Nov. 3, 2026); dynamic administrative units; group-based licensing; Exchange Online licensing.",
  "Microsoft Learn (Oct. 29, 2026): Conditional Access users, groups and workload identities; Assign policies in Microsoft Intune (user versus device groups).",
  "Diagrams: Book 03 ch10-derivation-chain; Book 02 ch05-three-tier-delegation; Book 04 ch03-grant-block-pair.",
]);
sourceSlide("Federal requirements: full citations", [
  "NIST, SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations, release 5.2.0 (August 27, 2025): AC-2, AC-2(1), AC-2(3), AC-3, AC-3(13), AC-6, AC-6(5), AC-6(7); AU-2, AU-6, AU-12; CA-7; CM-2, CM-3, CM-6, CM-7, CM-8; IA-2(1), (2), (8), (12), IA-3, IA-4, IA-4(4), IA-5, IA-9; PS-4, PS-5; SI-4.",
  "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022, §III.A Identity.  ·  OMB M-19-17, Enabling Mission Delivery through Improved Identity, Credential, and Access Management, May 21, 2019.",
  "OMB M-26-14, Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats, May 22, 2026 (rescinds M-21-31).  ·  OMB M-25-21, Accelerating Federal Use of AI through Innovation, Governance, and Public Trust, April 3, 2025, Sections 3(b) and 4(a)–(b).",
  "OMB and OPM, Creating \"Federal HR 2.0\" by Consolidating Core Human Capital Management Across the Federal Government, December 10, 2025, p. 1 and §I.  ·  GSA, IDManagement.gov, Identity Lifecycle Management Playbook (not official policy).",
  "NIST, FIPS 201-3, Personal Identity Verification (PIV) of Federal Employees and Contractors, January 2022, §2.9.1, §2.9.4, §2.10.2.  ·  NIST, SP 800-63-4, Digital Identity Guidelines, July 2025 (supersedes SP 800-63-3).",
  "CISA, BOD 25-01, Implementing Secure Practices for Cloud Services, December 17, 2024, and its Required Configurations (SCuBA policies such as MS.AAD.1.1v1, MS.AAD.3.1v1, MS.AAD.5.1v1–5.3v1).",
  "Microsoft Learn, Plan for Microsoft 365 Government GCC deployments (FedRAMP Moderate), accessed Oct. 29, 2026; the NIST baseline and the FedRAMP class are separate facts (Book 14, Ch 03).",
  "Mapping: the guide's \"The federal requirements each track satisfies,\" reusing Book 02 App A, Book 03 Ch 11, Book 05 Ch 10, Book 06 App A, Book 17 App A and Books 01, 11, 12, 14. The program's reading; the authorizing official decides.",
]);

finish(OUT);
