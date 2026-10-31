# Building Non-Person Identity, Chapter 09 — AI Agent Identities — narration script (practice copy)

## Slide 1 — Chapter 09: AI Agent Identities

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 9: AI agent identities. An agent can act at a speed no person can, so the questions the program asks of every identity, who answers for it, what it holds, how it proves itself and when it ends, are asked before it exists, written down, and checked by code every week. We'll cover what's generally available and what's still preview, the program's decision as data, Learn's samples and their gaps, the rules, the sponsor checks, the agent Conditional Access plan, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — What Agent ID is, and why its blueprint matters

Why does this chapter come with so many questions up front? Because an agent works at machine speed, so whatever it can reach, it reaches fast. Microsoft's answer is Agent ID. A blueprint holds the credentials and creates the agent identities, which hold the permissions and show up in the logs. That structure has a sharp edge: the blueprint gets tokens on behalf of every agent under it, so one compromised blueprint credential is every agent at once. The platform became generally available in April; the extra security features need Agent 365.

## Slide 3 — Release stage by cloud, and D-N6 as data

Before any code, you need to know what's actually available, because the pieces are at different stages. The core objects are generally available. Conditional Access for agents and agent risk are preview, and the Graph properties for agent policies exist only in beta. In this estate's G C C cloud, the documented subset is listed, mostly for delegated access. In the higher government clouds, nothing is published yet. So the program's decision is held as data: in G C C the code reads agent identities, and elsewhere it falls back to applying the same rules to service principals.

## Slide 4 — The program's rules, N6.1 to N6.7

Here are the program's rules, from Book 17, each held as a finding with a stable ID. Creation is closed, so an agent can't just appear. Every production agent has a reviewed handshake before it exists, naming who answers for it and what it may do. Credentials prefer a managed identity, and never a production secret. Inheritance never hands every future grant to every agent, and no agent holds a standing privileged role. Sponsors are real employees, and a transfer has ten business days to be confirmed. And drift is watched, with priorities.

## Slide 5 — Learn's Agent ID samples, pinned and sent to a fake

Microsoft gives you more samples here than in most chapters. There's a walk-through that creates a blueprint with a sponsor, an owner and credentials; samples for inheritable permissions; three agent Conditional Access policies; and Graph requests to list blueprints, agents and their sponsors. There's also a PowerShell module, but the chapter calls Graph directly so every request sits in its reviewed call list. Two sets of pages are pinned, eleven files in all, and a harness sends every sample, unmodified, to a fake Graph so the chapter's own checks can run on the result.

## Slide 6 — What the samples leave out: reads and sponsors

The list requests are a good model, but they stop short. They read one page, and a page holds at most a hundred agents, so a bigger tenant is half-read. They hard-code the worldwide host. The agent sponsor request returns IDs only, and names only a write permission for what is a read, so the code expands sponsors on the list under a read permission instead. And the blueprint sample makes the same person sponsor and owner, meaning whoever decides an agent should exist also holds its keys. The code flags that.

## Slide 7 — What they leave out: secrets, inheritance, CA

The rest of the gaps are about safety. The blueprint sample adds a password next to the managed identity, which Learn itself doesn't recommend for production. The inheritance sample starts with allow-all, so every future grant to the blueprint quietly reaches every agent. The pages disagree on a path and a limit, so the code follows the API reference. And the block-all-agents policy has no exclusion, so if you enforced it, you'd block the approved agents too. So the verdict: use the reads and the credential model, and never enforce that block without its exclusion.

## Slide 8 — The code, its inputs and what it reads

What does the code add? Its own module, a read-only entry script and a separate write path, plus the decision table, the program's rules and two reviewed policies. It builds on Chapters 1 and 2 and changes neither. The inputs are where accountability lives: the Chief AI Officer's use-case inventory, the handshake records, HR's mover and leaver events with each new sponsor's confirmation, and the change board's approved credential changes. One setting has no Graph property at all, so a person reads it in the admin center and records the reading with a date.

## Slide 9 — The checks, part 1: creation, handshake, sponsors

There are twenty-three rules, so let's take them in two halves. The first half covers how an agent comes to exist and who answers for it. Creation must be closed, with a recent reading to prove it. Every identity with a record needs a complete handshake, made before the agent was created, not after. Every agent needs a real sponsor, an enabled employee, plus a group, and a technical owner who isn't the sponsor, and the directory must agree with the record. Then the credential rules: no production secrets, and a certificate only with a reason.

## Slide 10 — The checks, part 2: privilege, sponsors, CA, drift

The second half is about what an agent holds and how it's watched. Inheritance and directory roles come first: any directory role is a finding unless it's recorded with an end date, because Microsoft's list of roles an agent may hold includes some the program counts as privileged. Then the sponsor clock: ten business days, counted around federal holidays, and an unconfirmed transfer means the agent is orphaned and goes to Chapter 2's rule, where a person decides. Then the two policies, the approval attribute, and the three top-priority drift checks.

## Slide 11 — The agent CA plan and the separate write path

The only thing this chapter ever writes is the two agent policies, report-only. The plan compares the reviewed files with the tenant, and where the program's decision says agent Conditional Access isn't published, it simply marks them not available. The write path refuses unless the plan is the approved one, recent, and for this tenant, and every write creates a report-only block policy and nothing else. It runs as a person with the Conditional Access administrator role. And it never turns a policy on; that waits until the feature leaves preview.

## Slide 12 — Who keeps the records, and what each task may hold

Who's involved? Developers build it. The identity governance officer keeps the handshakes and confirms orphans. The Chief AI Officer's staff keep the use-case inventory, security operations own the drift findings, and the security officers review the evidence. The read task holds ten read permissions and nothing that ends in read-write; a test enforces that. A person running it also needs a reader role for custom attributes, and the agent administrator role unless they own the agents. The write task holds only the policy permissions, in a person's signed-in session.

## Slide 13 — Lab 1: Learn's samples, D-N6, then the check

Lab 1 runs on a laptop, with Chapters 1 and 2's output in place. First, send Learn's samples to the fake, and read the one test that matters most: the block-all-agents policy has no exclusion for approved agents. Then list each task's permissions, and read the decision table for each cloud: agent mode in the worldwide and G C C clouds, fallback in the higher ones. Then run the check in G C C. Eight AI identities, twenty-two findings, four of them top priority, and two orphan candidates for Chapter 2.

## Slide 14 — Lab 1: reading the findings and the sponsor fields

Reading the findings, the fictional tenant shows almost every way this can go wrong. One agent's handshake is incomplete and was reviewed a month after the agent already existed, and it holds a mail administrator role with no end date. Its blueprint has a secret, inherits every Graph role, and had a secret added outside any change window. Another agent's sponsor left and nobody confirmed a new one in time, so it's orphaned. There's a shadow agent nobody declared, and a piloted system with no identity at all. One agent passes everything, which is the target.

## Slide 15 — Lab 1: the GCC High fallback, a dry run, a refusal

Next, run the same estate as if it lived in G C C High. The code switches to fallback mode and sends no agent identity read at all. The one ordinary service principal gets the same credential and permission findings it got before, and three records that name agent identities become findings, because that cloud doesn't have them. Back in G C C, the dry run would send exactly one request: a report-only high-risk policy, since the other already exists. Applying it to the fake creates it report-only, and a hash nobody approved is refused.

## Slide 16 — Lab 2: a test tenant, one governed agent

Lab 2 uses a licensed test tenant with fictional people, never production. Read the blueprint-creation setting yourself, since there's no Graph property for it, set it to No, and record the reading. Then build one properly governed agent from Learn's sample: a sponsor who isn't the owner, a managed identity credential, a handshake, an inventory row, and the approval attribute. Run the check with read permissions only, compare the policy shape with one made in the admin center, apply the plan as a person, and confirm both policies are report-only. Then remove it all by hand.

## Slide 17 — Dangers, and the guard for each

Agents make every familiar danger faster. Open creation means whoever builds an agent becomes its sponsor and owner. A secret on a blueprint isn't one credential, it's every agent made from it. Allow-all inheritance turns one future grant into a grant to every agent. A sponsor who leaves unnoticed leaves an agent nobody answers for. And preview features bring their own risks: enforcing a policy on a feature that can still change, or assuming the higher government clouds have objects they don't. Each danger has a guard that runs every week.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Creation is closed and the reading is recent. Every production agent had its handshake reviewed before it existed, with a real employee sponsor, a group, and a separate owner. No production blueprint holds a secret, nothing inherits every role, and no agent holds a standing directory role. Every sponsor transfer was confirmed on time, or handed to the orphan rule. Both policies are report-only and reviewed, and no top-priority drift is open. Next, Chapter 10 brings it all together: drift and evidence for the security officer. Thanks for watching.
