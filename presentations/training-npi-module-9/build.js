// Non-Person Identity learning path, Module 9: Govern AI agent identities — the module's narrated deck.
// Teaches docs/training/non-person-identity/09-ai-agent-identities.md, Learn-style: objectives, the concepts, four
// "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the path's
// verification log, the guide's AI agents section and workbook Chapter 09 that the page sends the learner to, or the
// kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-9/build.js \
//                      presentations/training-npi-module-9/Training_NPI_Module_9.pptx
const TITLE = "Module 9: Govern AI agent identities";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 9: Govern AI agent identities",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Non-Person Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "NON-PERSON IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_NPI_Module_9.pptx";
const M = "Training, Non-Person Identity, Module 9";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 9: Govern AI agent identities", "Non-Person Identity learning path · The guide's AI agents section, with workbook Chapter 09",
    ["What agents add  ·  Blueprints and sponsors  ·  D-N6 as data  ·  The program's rules", "The checks  ·  The agent CA plan  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 9 of the Non-Person Identity learning path: govern A I agent identities. This module teaches the guide's A I agents section, with Chapter 9 of the developer workbook. A I agents are non-person identities, and they follow every gate before this module. In it you'll check a fictional tenant's agents against the program's rules, see the same rules run in a cloud that has no agent identities, and plan two report-only Conditional Access policies for agents. Then you'll apply one of them to a fake, by its approved hash. The tenant and its agents are fictional, and the apply changes only a fake. The code is illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why agents add three things to every gate");
  tag(s, "Why");
  const b = table(s, "Add", 1.45, [3.0, 9.15], ["What agents add", "So the program"], [
    ["An agent can act", "Disables an orphaned agent once the finding is confirmed, as the program's orphan rule does for every identity"],
    ["A blueprint holds the credentials for every agent made from it", "Treats one secret on a blueprint as every agent's secret"],
    ["By default the creator becomes sponsor and owner", "Gates creation"],
  ], { fontSize: 13.5, limit: 3.9 });
  callout(s, "Point", b + 0.35, 0.95, "FaUserShield", HEX.red, "This module: ",
    "check agents against the program's rules, run the same rules where the cloud has no agent identities, and plan two report-only agent policies.");
  sources(s, "Sources: Module 9, \"Introduction\"; Microsoft Learn, Agent identities, service principals, and applications; Administrative relationships in Agent ID; the guide.");
  notes(s,
`Why does this module exist? Agents follow every gate before it, but they add three things. First, an agent can act. So an orphaned agent is disabled as soon as the finding is confirmed. That's the program's orphan rule for every identity, and agents are why it's the stricter one. Second, Microsoft Learn's Agent I D documentation says a blueprint holds the credentials for every agent made from it, so one secret on a blueprint is every agent's secret. And third, Learn's page on administrative relationships in Agent I D says that by default the user who creates an agent becomes its sponsor, and the guide adds that the creator becomes the blueprint's owner too. So creation has to be gated. In this module you check a fictional tenant's agents against the program's rules, see the same rules run where the cloud has no agent identities, and plan two report-only agent Conditional Access policies.`,
  `${M} — Unit "Introduction"; the guide — "AI agents," "Orphans."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 9", [
    "Describe a blueprint, an agent identity and a sponsor, and why the blueprint is the credential boundary",
    "Explain decision D-N6 as data, and what the code does in a cloud without Agent ID",
    "Run the AI identity check and read its findings, including the P1 drift",
    "Explain the ten-business-day sponsor rule and what happens to an orphaned agent",
    "Show that the agent CA plan is report-only and runs only by its approved hash",
  ], [
    "Module 2: the lab reads Chapter 02's ownership run and its sponsor fields",
    "Module 6: Conditional Access for workload identities, report-only first",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
  ], 65);
  sources(s, "Sources: Module 9, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty-five minutes with the lab. You'll describe a blueprint, an agent identity and a sponsor, and why the blueprint is the credential boundary. You'll explain decision D N six as data, and what the code does in a cloud without Agent I D. You'll run the A I identity check and read its findings, including the top-priority drift. You'll explain the ten-business-day sponsor rule, and what happens to an orphaned agent. And you'll show that the agent Conditional Access plan is report-only, and runs only by its approved hash. Before you start, finish Module 2, because the lab reads Chapter 2's ownership run, and Module 6, on Conditional Access for workload identities.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Agent ID and its stage
{
  const s = content(SC, "Agent ID: blueprints, agent identities, and the stage");
  tag(s, "What");
  const l = panel(s, "Objects", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE OBJECTS", "The blueprint is the credential boundary", [
    "A blueprint holds the credentials and creates agent identities; it gets tokens on their behalf",
    "So a compromise of its credential affects every agent under it",
    "Agent identities hold the permissions and appear in the logs",
  ], 12.5);
  const r = panel(s, "Stage", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "RELEASE STAGE", "GA, preview and beta", [
    "Blueprints, agent identities and sponsors: GA",
    "Conditional Access for agents and agent risk: preview",
    "Agent CA properties in Graph: beta only",
    "GCC lists a subset; GCC High and DoD: not published",
  ], 12.5);
  sources(s, "Sources: Module 9, Unit 2; Microsoft Learn, Agent identities, service principals, and applications; Entra releases; Conditional Access for agents; Agent 365.");
  notes(s,
`Unit 2 starts with what Microsoft Entra Agent I D is, in Microsoft Learn's words. A blueprint holds the credentials and creates agent identities, and it gets tokens on their behalf. So a compromise of the blueprint's credential affects every agent under it. That's why the blueprint is the credential boundary. The agent identities hold the permissions, and they're what appears in the logs. The pieces are at different stages, and Learn's release announcements, its Conditional Access for agents page and the Agent three sixty-five service description say which. The core objects, blueprints, agent identities and sponsors, are generally available. Conditional Access for agents and agent risk are preview, and the Graph properties for agent policies exist only in beta. In G C C, a documented subset is listed. In G C C High and D O D, nothing is published yet. So the program holds its decision about this as data.`,
  `${M} — Unit 2 "The rules as code": workbook Chapter 09, "What Microsoft Entra Agent ID is, and its stage."`);
}

// ================================================================== 5 D-N6
{
  const s = content(SC, "Decision D-N6 as data: AgentId or Fallback mode");
  tag(s, "What");
  const b = table(s, "DN6", 1.45, [2.4, 2.4, 7.35], ["Cloud", "Mode", "What the code does"], [
    ["global, gcc", "AgentId", "Reads blueprints and agent identities, and checks them against the rules"],
    ["gcchigh, dod", "Fallback", "No agent identity read; the same rules on the service principals the agents run as"],
  ], { fontSize: 13.5, limit: 3.2 });
  callout(s, "Prev", b + 0.35, 0.95, "FaScaleBalanced", HEX.navy, "D-N6 is design guidance, status Proposed: ",
    "config/agent-id-capabilities-ch09.json holds each capability's stage by cloud. Preview is reported, never enforced.");
  sources(s, "Sources: Module 9, Unit 2; Knowledge check, answer 2; the program's design guidance, D-N6; Microsoft Learn, Microsoft Entra feature availability.");
  notes(s,
`The program's decision D N six is held as data, in a configuration file with each capability's stage by cloud, and its status is proposed. The code reads it and picks a mode. In the worldwide and G C C clouds it runs in Agent I D mode: it reads blueprints and agent identities and checks them against the rules. In G C C High and D O D, where Microsoft Learn's feature availability page publishes no Agent I D availability, it runs in fallback mode. It sends no agent identity read at all, and applies the same rules to the service principals the agents run as. So the rules don't change by cloud; only what the code reads does. Preview features are reported, never enforced. That's design guidance.`,
  `${M} — Unit 2 "The rules as code": workbook Chapter 09, "Decision D-N6 as data"; Knowledge check, answer 2.`);
}

// ================================================================== 6 Rules
{
  const s = content(SC, "The program's rules the code holds, N6.1 to N6.7");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [2.8, 9.35], ["Rule", "What it says (design guidance)"], [
    ["Creation closed", "Users can create agent blueprints: No"],
    ["The handshake", "A reviewed record before the agent exists: sponsor and group, an owner who isn't the sponsor, permissions"],
    ["Credentials", "A managed identity, else federation, else a certificate; no production client secret"],
    ["Least privilege", "Never allAllowed for application roles; no standing privileged role"],
    ["Sponsors", "A federal employee; on a move or leave the new sponsor confirms within ten business days, or the agent is orphaned"],
    ["Conditional Access", "Two report-only policies: block agents not approved by an attribute; block high-risk agents"],
    ["Drift", "No governed identity, a shadow AI identity, a credential added outside the pipeline: P1"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Inherit", "Inheritance set to allAllowed for roles means any future grant to the blueprint becomes a grant to every agent.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, Unit 2; the program's design guidance; Microsoft Learn, Configure inheritable permissions for agent identity blueprints; Authorization in Agent ID.");
  notes(s,
`Here are the program's rules the code holds. They're the program's design guidance, not Microsoft's. Creation is closed: users can't create agent blueprints. Every production agent has a reviewed handshake before it exists, naming its sponsor and group, a technical owner who isn't the sponsor, and its permissions. Credentials prefer a managed identity, then federation, then a certificate, and never a production client secret. Least privilege means inheritance is never allow-all for application roles, because, as Microsoft Learn's page on inheritable permissions explains, any future grant to the blueprint then becomes a grant to every agent, and no agent holds a standing privileged role. Sponsors are federal employees, and on a move or leave the new sponsor confirms within ten business days, or the agent is orphaned. Two report-only policies. And three kinds of drift are top priority.`,
  `${M} — Unit 2 "The rules as code": workbook Chapter 09, "The program's rules the code holds"; Knowledge check, answer 4.`);
}

// ================================================================== 7 Checks
{
  const s = content(SC, "The checks: NPI-AI-01 to NPI-AI-23");
  tag(s, "What");
  const b = table(s, "AI", 1.45, [2.3, 9.85], ["Rules", "What they check"], [
    ["NPI-AI-01 to -03", "Creation is closed, with a recent reading; an agent on an ordinary service principal"],
    ["NPI-AI-04 to -09", "The handshake, made before the agent; a sponsor who is an enabled employee; an owner who isn't the sponsor"],
    ["NPI-AI-10, -11", "A client secret on a production blueprint; a certificate as the best credential"],
    ["NPI-AI-12 to -15", "Access mode, inheritance, standing directory roles, app permissions"],
    ["NPI-AI-16, -17", "A sponsor's move or leave unconfirmed after ten business days: orphaned; the workflows"],
    ["NPI-AI-18 to -20", "The two agent policies and the approval attribute"],
    ["NPI-AI-21 to -23", "P1 drift: no governed identity; a shadow AI identity; a credential with no change record"],
  ], { fontSize: 12, limit: 5.5 });
  line(s, "Days", "Ten business days skip federal holidays: a leaver on October 9, 2026 is due October 26, because October 12 is one.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, Unit 2; the program's design guidance; Microsoft Learn, Agent identity sponsor tasks in Lifecycle Workflows. Chapter 09, \"The checks.\"");
  notes(s,
`The checks are twenty-three rules, N P I A I oh one to twenty-three. The first three check that creation is closed, with a recent reading, and flag an agent on an ordinary service principal. Four to nine check the handshake, made before the agent existed, and the people: a sponsor who's an enabled employee, and a technical owner who isn't the sponsor. Ten and eleven are the credentials: a client secret on a production blueprint is a finding. Twelve to fifteen are privilege. Sixteen and seventeen are the program's sponsor clock: a move or leave unconfirmed after ten business days makes the agent orphaned. The days skip federal holidays, so a leaver on October ninth is due October twenty-sixth. Eighteen to twenty check the two policies, and twenty-one to twenty-three are the top-priority drift.`,
  `${M} — Unit 2 "The rules as code": workbook Chapter 09, "The checks," "The ten business days."`);
}

// ================================================================== 8 CA plan and write path
{
  const s = content(SC, "The agent CA plan and the separate write path");
  tag(s, "What");
  const l = panel(s, "Plan", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PLAN", "agent-ca-plan.json", [
    "Compares the two reviewed policies with the tenant's: Create, InPlace or Differs",
    "NotAvailable where D-N6 says agent CA isn't published",
    "Refuses a reviewed file that isn't report-only Block",
  ], 12.5);
  const r = panel(s, "Write", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "THE WRITE PATH REFUSES UNLESS", "Invoke-NpiAgentCaAction.ps1", [
    "The plan's SHA-256 is the approved one; this tenant and cloud; no more than seven days old",
    "Every write creates a report-only policy, Block alone",
    "A person with Conditional Access Administrator",
  ], 12.5);
  callout(s, "Never", Math.max(l, r) + 0.3, 0.85, "FaLock", HEX.amber, "And it never turns a policy on: ",
    "that waits until the agent targets leave preview in the agency's cloud.");
  sources(s, "Sources: Module 9, Unit 2; the kit's design; Microsoft Learn, Conditional Access for agents; Create conditionalAccessPolicy. Chapter 09, the agent CA plan.");
  notes(s,
`The only thing this chapter ever writes is the two agent policies, report-only, and that's the kit's design. The plan compares the two reviewed policies with the tenant's, and says create, in place, or differs for each. Where decision D N six says agent Conditional Access isn't published, it marks them not available. And it refuses a reviewed file that isn't report-only Block. The write path is a separate script. It refuses to run unless the plan's hash is the approved one, for this tenant and cloud, and no more than seven days old. Every write creates a report-only policy with Block as the only grant. It runs as a person with the Conditional Access Administrator role. And it never turns a policy on. Microsoft Learn's page on Conditional Access for agents lists the feature as preview, so that waits until the agent targets leave preview in the agency's cloud.`,
  `${M} — Unit 2 "The rules as code": workbook Chapter 09, "The agent Conditional Access plan and the separate write path."`);
}
endModule(SC);

// ================================================================== 9 Try it: steps 1-4
{
  const s = content(SL, "Try it: Learn's samples, permissions, D-N6 by cloud");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1 makes Chapter 01's register and Chapter 02's ownership run; its last line:",
    "Plan SHA-256: 1e1799d7181bd1a3dc271c645fff8a60fc741ab1ebc219bb3011cc25953bad3e",
    "# Step 2: Invoke-Pester -Path tests/NpiAgentId.Tests.ps1 -FullNameFilter '*Learn*' ...",
    "PassedCount 13   FailedCount 0   NotRunCount 49",
    "# Step 3: Get-NpiAgentRequiredPermission for each task",
    "agent-id : AgentIdentity.Read.All, AgentIdentityBlueprint.Read.All, Application.Read.All, AuditLog.Read.All, ...",
    "agent-ca-apply : Policy.Read.All, Policy.ReadWrite.ConditionalAccess",
    "# Step 4: Get-NpiAgentCapability for each cloud",
    "Cloud   Mode     AgentIdentities AgentCA                        SponsorWorkflows",
    "global  AgentId  GA (April 2026) Preview (policy builder label) GA (May 2026)",
    "gcc     AgentId  GA (April 2026) Preview (policy builder label) GA (May 2026)",
    "gcchigh Fallback Not published   Not published                  Not published",
    "dod     Fallback Not published   Not published                  Not published",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "agent-id holds ten read permissions, none ending in ReadWrite. Commands: the module page, steps 1 to 4.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 1 to 4; Microsoft Learn's Agent ID samples, pinned; examples/non-person-identity (NpiAgentId).");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder of the examples, in PowerShell 7. Its step one makes Chapter 1's register and Chapter 2's ownership run, so the chapter's steps are one ahead here. The ownership run's last line is its plan's hash. Step two sends Microsoft Learn's Agent I D samples to the fake: thirteen pass, none fail, and forty-nine of the file's other tests aren't run. Step three lists what each task needs. The read task holds ten read permissions, and none ends in ReadWrite. The write task holds only the two policy permissions. Step four reads decision D N six for each cloud. The worldwide and G C C clouds run in Agent I D mode, with agent identities generally available and agent Conditional Access in preview. G C C High and D O D run in fallback mode: nothing published.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 4.`);
}

// ================================================================== 10 Try it: check and findings
{
  const s = content(SL, "Try it: check eight AI identities, read the findings");
  tag(s, "How");
  const c = code(s, "Check", 0.6, 1.45, 12.15, [
    "# Step 5: ./Invoke-NpiAgentId.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership ...",
    "D-N6 (Proposed): AgentId mode in cloud 'gcc'; agent Conditional Access Preview (policy builder label); agent risk Preview",
    "AI identities: 8 checked (4 AgentIdentity, 3 AgentIdentityBlueprint, 1 ServicePrincipal); Chapter 02 sponsor fields",
    "  filled: 2 of 2",
    "Findings: 22 Finding (4 P1, 2 P2), 6 Warn, 4 Info. Orphan candidates for Chapter 02: 2",
    "Agent CA plan: Unapproved InPlace, HighRisk Create; nothing sent",
    "Plan SHA-256: 754fda6b79d55b514ea438039da2ca764e14dc98a88f0c70a60f4ac9762ce450",
    "# Step 6: the Findings grouped by rule (Name, Count): 16 rules, among them",
    "NPI-AI-10 2   NPI-AI-13 1   NPI-AI-16 1   NPI-AI-21 1   NPI-AI-22 2   NPI-AI-23 1   (and ten more: ...)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; WRAPPED)", pt: 10.5 });
  const b = table(s, "Read", c + 0.2, [2.4, 9.75], ["Rule", "What it found"], [
    ["NPI-AI-10 twice", "Case Triage Blueprint's secret, and Correspondence Drafting's app registration"],
    ["NPI-AI-13, -16", "Case Triage Blueprint inherits all Graph roles; Records Search: its sponsor left October 9, unconfirmed by October 26"],
    ["NPI-AI-21 to -23", "The P1 drift. Benefits Q&A Agent and its blueprint pass every rule"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 5 and 6; examples/non-person-identity/tests/fixtures/ch09 (fictional agents).");
  notes(s,
`Step five checks the A I identities in G C C and builds the plan. Eight are checked: four agent identities, three blueprints and one ordinary service principal, and the two sponsor fields Chapter 2 recorded are filled. There are twenty-two findings, four of them priority one and two priority two, six warnings and four information items, and two orphan candidates for Chapter 2. The policy plan: the block-unapproved policy is already in place, and the high-risk policy is to be created. Nothing is sent. Step six groups the findings: sixteen rules. Look for these. A client secret on Case Triage Blueprint, and on Correspondence Drafting's app registration. Case Triage Blueprint inherits every Graph role. Records Search's sponsor left on October ninth, and nobody confirmed a new one by the twenty-sixth. And the top-priority drift. Benefits Q and A Agent passes every rule.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6.`);
}

// ================================================================== 11 Try it: sponsor fields and fallback
{
  const s = content(SL, "Try it: the sponsor fields, and the GCC High fallback");
  tag(s, "How");
  const c = code(s, "Fields", 0.6, 1.45, 12.15, [
    "# Step 7: ai-identities.json (Name, FederalSponsor, TechnicalOwner, InventoryRecord, Handshake, SponsorState)",
    "Benefits Q&A Agent       erin@contoso.example  alice@contoso.example CMDB-4001 HS-001  None",
    "Case Triage Agent        carol@contoso.example carol@contoso.example CMDB-4002 HS-002  AwaitingConfirmation until 2026-11-10",
    "Records Search Agent     carol@contoso.example alice@contoso.example CMDB-4003 HS-003  Orphaned",
    "Sandbox Helper                                 alice@contoso.example                   None",
    "  (and four blueprint and service principal rows: ...)",
    "# Step 8: Chapters 01, 02 and 09 again, with -Cloud gcchigh; the AI check prints",
    "D-N6 (Proposed): Fallback mode in cloud 'gcchigh'; agent Conditional Access Not published; agent risk Not published",
    "AI identities: 1 checked (1 ServicePrincipal); Chapter 02 sponsor fields filled: 0 of 2",
    "Agent CA plan: Unapproved NotAvailable, HighRisk NotAvailable; nothing sent   (...)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Read", "Case Triage Agent's sponsor is also its owner. In GCC High, no agent identity read is sent.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 7 and 8; examples/non-person-identity/tests/fixtures/ch09 (fictional agents).");
  notes(s,
`Step seven reads the sponsor fields Chapter 2 recorded, now filled for all eight A I identities. Case Triage Agent has carol as both its sponsor and its technical owner, so whoever decides the agent should exist also holds its keys. Records Search Agent is orphaned. And Sandbox Helper has no sponsor, no inventory record and no handshake at all. Step eight runs the decision's fallback in G C C High. You run Chapters 1 and 2 again in that cloud, then the A I check. It prints fallback mode in G C C High, with agent Conditional Access and agent risk not published. Only one identity is checked, the ordinary service principal, and no agent identity read is sent. Both agent policies are marked not available.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 and 8.`);
}

// ================================================================== 12 Try it: dry run, apply, refusal
{
  const s = content(SL, "Try it: dry-run, apply to the fake, and a refusal");
  tag(s, "How");
  const c = code(s, "Apply", 0.6, 1.45, 12.15, [
    "# Step 9: dry-run the agent CA plan with its approved hash",
    "$ $sha = (Get-FileHash out/agent-id/agent-ca-plan.json -Algorithm SHA256).Hash.ToLower()",
    "$ ./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 $sha ...",
    "DryRun: 1 WouldSend",
    "  WouldSend HighRisk POST https://graph.microsoft.com/beta/identity/conditionalAccess/policies",
    "# Step 10: the same with -Apply, then with -ApprovedSha256 ('0' * 64)",
    "Apply: 1 Sent",
    "  Sent HighRisk Created ca000000-0000-4000-8000-000000000103 report-only; review its report-only results",
    "  before any change of state",
    "The plan's SHA-256 is 754fda6b79d55b514ea438039da2ca764e14dc98a88f0c70a60f4ac9762ce450, not the approved",
    "  0000000000000000000000000000000000000000000000000000000000000000; refusing to run a plan nobody reviewed.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; WRAPPED)", pt: 10.5 });
  line(s, "Tests", "Step 11: Invoke-Pester -Path tests prints 513 passed, 0 failed. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 9 to 11; examples/non-person-identity (Invoke-NpiAgentCaAction.ps1; tests).");
  notes(s,
`Step nine dry-runs the agent Conditional Access plan with its approved hash. It would send exactly one request: a POST to the beta Conditional Access endpoint on the cloud's own Graph host, for the high-risk policy, because the other is already in place. Step ten runs the same command with the apply switch, against the fake. One write is sent, and the policy is created report-only, with a reminder to review its report-only results before any change of state. Then you pass a hash of zeros, one nobody approved, and the script refuses: the plan's hash isn't the approved one, and it won't run a plan nobody reviewed. Pasted line by line, your shell carries on. Step eleven runs every test: five hundred thirteen pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 9 to 11; learning path verification log — "Found during the re-run."`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: one governed agent in your test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production, fictional people; Agent 365 (or Microsoft 365 E7) with Entra ID P1, P2 for agent risk"],
    ["Close creation", "Read and set Users can create agent blueprints to No"],
    ["Make one agent", "A sponsor who isn't its owner, and a managed identity as its credential"],
    ["Check and apply", "Run the check with an app holding only the agent-id permissions; dry-run and apply as a Conditional Access Administrator"],
    ["Back it out", "Step 6, in the admin center: delete the two policies, remove the attribute, disable then delete the agent and blueprint"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 09, Lab 2, which has the exact commands. The code deletes nothing.");
  sources(s, "Sources: Module 9, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 moves to your own test tenant, worldwide or G C C, never production, with fictional people. It needs Agent three sixty-five, or Microsoft three sixty-five E seven, with Entra I D P one, and P two for agent risk, and Chapters 1 and 2's Lab 2 runs. Read the setting that lets users create agent blueprints, and set it to No. Make one governed agent, with a sponsor who isn't its owner and a managed identity as its credential. Run the check with an app holding only the read task's permissions, then dry-run and apply the plan as a person with Conditional Access Administrator. To back it out, step six, in the admin center: delete the two policies, remove the attribute, disable then delete the test agent and blueprint, and delete the output folders. The code deletes nothing. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for AI agents");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.8, 3.4, 4.95], ["Requirement", "KSI", "Evidence"], [
    ["AC-2; OMB M-25-21, 3(b)(v)", "KSI-IAM-SNU", "ai-identities.json: sponsor, group, owner and record"],
    ["AC-2; AC-5 Separation of Duties", "KSI-IAM-SNU; KSI-IAM-JIT", "findings.json, NPI-AI-03 to -09"],
    ["IA-5(2); AC-6; AC-6(5)", "KSI-IAM-SNU, KSI-SVC-ASM; KSI-IAM-ELP, KSI-IAM-JIT", "findings.json, NPI-AI-10 to -15"],
    ["CM-8; AC-2(4)", "KSI-PIY-GIV; KSI-MLA-LET, KSI-MLA-RVL", "NPI-AI-21 to -23: no shadow AI identity"],
    ["AC-3; SCuBA MS.AAD.9.1v1; CM-3", "KSI-IAM-ELP, KSI-IAM-JIT; KSI-CMT-LMC, KSI-CMT-RVP", "agent-ca-plan.json; the dry run's and apply's results and manifest"],
    ["SA-9 External System Services", "KSI-SCR-MIT, KSI-SCR-MON", "The D-N6 capabilities file; Get-NpiAgentCapability"],
  ], { fontSize: 11, limit: 5.6 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.2, 0.45, 12.5);
  sources(s, "Sources: Module 9, \"Introduction\"; NIST SP 800-53 Rev. 5; OMB M-25-21; CISA ScubaGear MS.AAD.9.1v1; FedRAMP, Key Security Indicators; the guide.");
  notes(s,
`The federal requirement. The guide's A I agents section adds to the gates, and its evidence table carries CISA's ScubaGear baseline policy for risky agents, M S dot A A D dot nine dot one. The controls are NIST special publication eight hundred fifty-three's. The module's table maps each lab step. Account management and section three B five of O M B M twenty-five twenty-one: the A I identities file, with a sponsor, group, owner and record for each. Separation of duties: the handshake and sponsor findings. Authenticators and least privilege: the credential and privilege findings. Inventory and automated audit actions: the drift findings, so no shadow A I identity. Access enforcement and change control: the policy plan, with the dry run's and the apply's results and manifest. And external system services: the capabilities file. Which file supports which K S I is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — "AI agents," "Evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on agents", [
    { q: "Why is a client secret on a production blueprint a Finding?", options: ["a. Secrets can't be read in GCC", "b. The blueprint holds the credentials for every agent made from it, so one leaked secret is every agent's", "c. A secret makes the agent multitenant"] },
    { q: "A sponsor leaves. When does the agent become orphaned?", options: ["a. At once", "b. After 30 days", "c. When the new sponsor hasn't confirmed within ten business days"] },
  ], "1 b: the blueprint is the credential boundary. 2 c: the program's sponsor rule (NPI-AI-16).");
  sources(s, "Sources: Module 9, \"Knowledge check,\" questions 1 and 3, \"Check your answers\"; Microsoft Learn, Agent identities, service principals, and applications.");
  notes(s,
`Check yourself with two questions. First: why is a client secret on a production blueprint a finding? The answer is b. Microsoft Learn's Agent I D documentation says the blueprint holds the credentials for every agent made from it, so one leaked secret is every agent's secret. That's why the blueprint is the credential boundary, and why the program prefers a managed identity. Second: a sponsor leaves. When does the agent become orphaned? The answer is c: when the new sponsor hasn't confirmed within ten business days. That's the program's design guidance, and N P I A I sixteen checks it, counting around federal holidays. Then the orphaned agent goes to Chapter 2's orphan candidates. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 10, drift and evidence");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked eight fictional AI identities and filled Chapter 02's sponsor fields",
    "Found an orphaned agent and four P1 drift findings",
    "Ran the same rules in GCC High's Fallback mode",
    "Applied a report-only agent policy to a fake by its approved hash",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 10: Find drift and file the evidence", [
    "An approved baseline",
    "Packages the ISSO verifies",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "the AI identities, findings, orphan candidates, the plan and its SHA-256, the runs' results and manifests, dated; D-N6; the tests.");
  sources(s, "Sources: Module 9, \"Summary\"; Module 10, \"Introduction.\"");
  notes(s,
`To sum up. You checked eight fictional A I identities, filled the sponsor fields Chapter 2 recorded, found an orphaned agent and four top-priority drift findings, ran the same rules in G C C High's fallback mode, and applied a report-only agent policy to a fake by its approved hash. The evidence an ISSO keeps from this module is the A I identities file, the findings, the orphan candidates, the policy plan with its approved hash, and the dry run's and apply's results and manifests, all dated; the capability table for decision D N six; and the test result. Next is Module 10: find drift and file the evidence. It keeps every gate's state true against an approved baseline, and hands the ISSO evidence they can verify themselves.`,
  `${M} — Unit "Summary"; Module 10 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 9 deck", [
  "Module page: docs/training/non-person-identity/09-ai-agent-identities.md (Non-Person Identity learning path, Module 9): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, \"AI agents,\" \"Orphans,\" \"Dangers\" and \"Evidence\"; workbook Chapter 09, \"What Microsoft Entra Agent ID is, and its stage,\" \"Decision D-N6 as data,\" \"The program's rules the code holds,\" \"The checks,\" \"The agent Conditional Access plan and the separate write path.\"",
  "Kit: examples/non-person-identity (Invoke-NpiAgentId.ps1, Invoke-NpiAgentCaAction.ps1; powershell/NpiAgentId; config/agent-id-capabilities-ch09.json; tests/fixtures/ch09). Fictional tenant and agents; -Apply changes only a fake. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; output trimmed and wrapped where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
