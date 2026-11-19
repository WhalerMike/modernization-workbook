# Building Defender XDR, Chapter 04 — Attack Surface Reduction: Audit, Warn, Block — narration script (practice copy)

## Slide 1 — Chapter 04: Attack Surface Reduction: Audit, Warn, Block

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 4: attack surface reduction, through audit, warn and block. Audit is configured but protects nothing. A rule is done when it's in block on every ring, or its exception is written down. The code's job is to say which rules can move this week, and why the others can't. We'll start from Learn's modes and syntax, read the rule catalog, the plan and the readiness rules, and walk two labs. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.

## Slide 2 — Why the rollout needs bookkeeping

Why does this rollout need code? Because it's fourteen rules times five rings, each pair with its own clock and its own audit hits. Audit is configured, but protects nothing. By the end of this chapter you can produce the rule-by-ring matrix the assessor reads, say which rules each ring can move this week, and hand the change board the exact value that moves them. It's for the developers, the platform owner who owns this gate, and the security operations lead who reads the weekly counts. The rule list and the stage lengths, thirty days of audit and fourteen of warn, are the Devices book's policy.

## Slide 3 — What Microsoft Learn gives you

Microsoft Learn gives you the rule modes: zero off, one block, two audit, five not configured, six warn. The custom-profile path in Intune, with one rule GUID equals mode per line. Warn's requirements: Windows 10 1809 or later, two rules that don't support it, the LSASS rule and the Office code-injection rule, and since platform 4.18.26060, Unblock needs an administrator's approval. The rules reference gives each rule's GUID and its advanced hunting action types. And Learn lists a known issue: on Windows Server, a rule can show as compliant without being enforced.

## Slide 4 — What Learn leaves to you, and the verdict

What does that leave to you? Nothing ties an event back to its rule and ring, so the kit carries the fourteen rules with their action types. A count can't say whether a hit already has an exclusion, so the per-device query keeps the file path, and each hit is matched to the register. Someone has to count days, so the plan records each stage and its start date. A plan might put a no-warn rule in warn, so that's an error. Fourteen lines per ring by hand invites typos, so the kit writes them. And a compliance report can be wrong on servers, so the device itself is checked. The verdict: keep Learn exactly; build the bookkeeping.

## Slide 5 — What the ASR check writes

The ASR check reads the plan, the exclusion register, the inventory and the device states, runs the guide's query and its per-device form, and writes five things. The matrix: each rule's stage on each ring, which is what the assessor reads. Readiness: per ring and rule, the stage, days in it, audit hits and open hits, blocks, the next stage, and a status with the reason. The custom-profile value for each ring, now and next. What each device actually enforces. And the exclusions that have expired. A status is ready, hold, done, warn, fail, or not applicable for a rule Windows Server doesn't support.

## Slide 6 — The readiness rules

Here are the readiness rules, which are the program's design from the Devices book's policy. A rule in audit is ready after thirty days, when every audit hit on the ring's devices has an exclusion, a fix or a decision in the register. It moves to warn, or straight to block if it doesn't support warn. A rule in warn is ready after fourteen days with no open hit. A hit is covered by a valid register row for its rule, or for every rule, whose path is the same file, or a folder that contains it. And the change board, not the kit, puts the next value in Intune, under a change record.

## Slide 7 — Who moves a rule, who watches the blocks

Who's involved? The platform owner owns this gate, keeps the plan and the register, and brings ready rules to the change board. The security operations lead reads blocks per rule per week, and starts any new rule from Microsoft at audit on ring 1. And the help desk is briefed before each warn stage, because Unblock now needs an administrator. One note: Microsoft's own position is lighter than the program's. Learn says standard protection rules can go to block without extensive testing. The program runs all three stages, and the kit enforces the program's stages.

## Slide 8 — Lab 1: run the ASR check mid-rollout

Lab 1, in the kit's folder. Step 1 lists the rules and which skip warn. Step 2 runs the check. Ring 0 is done. Ring 1 has twelve rules ready for block; the Office child-process rule is held, six of fourteen warn days. Ring 2 is ready to leave audit, except the same Office rule, with one audit hit nobody decided. The PSExec and WMI rule is a warning there, because Configuration Manager manages one device. Ring 3's plan puts the LSASS rule in warn, which it doesn't support: a plan error. And one server enforces none of the thirteen rules its plan puts in audit.

## Slide 9 — Lab 1: the held rule, and ring 1's next value

Step 3 reads why the ring 2 rule is held. Seventeen audit events, one open hit. Two paths fired the rule: the line-of-business helper, which has a per-rule exclusion in the register, and a macro runner in a public tools folder, which has nothing. Someone decides an exclusion or a fix before the rule moves to warn. Step 4 prints the value that moves ring 1. Every rule at one, block, except the Office child-process rule, still at six, warn. That's the exact string the change board pastes into the ring 1 policy.

## Slide 10 — Lab 2: the ASR check in a test tenant

Lab 2 uses a test tenant, never production, with the policy assigned to a ring 0 device group in audit. Collect the test device's state, sign in, and run the check live. The device check should show every rule in audit on the device. A row saying not configured on the device while the plan says audit is either the server issue, or a policy the device hasn't received yet. Compare with Learn's own one-line listing on the device. Nothing changed. If you set a rule locally for an investigation, Learn's cmdlet puts it back in audit, and Intune overwrites it at the next refresh anyway.

## Slide 11 — Federal requirements and the evidence

Here's what this gate proves, against NIST's catalog. Each rule's stage on each ring, with the date it began, supports least functionality. The value each ring is set to, now and next, supports configuration settings. What devices actually enforce, with blocks per rule, supports malicious code protection. And exclusions with owners and expiry dates, with the expired ones listed, supports configuration settings again. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.

## Slide 12 — Dangers, and the guard for each

What breaks in production? A server that reports compliant but enforces nothing; the device check reads the server itself. A rule moved on a calendar, not on its hits, which breaks a line-of-business app; every hit is dispositioned first. A no-warn rule in warn, which acts as block on older Windows. A rule set in both Intune and Group Policy: Group Policy wins by default, and the device check shows the value that won. A folder exclusion that's too wide, so file paths are preferred. And warn treated as a bypass: brief the help desk, and turn repeated needs into exclusions.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. The plan matches each ring's Intune policy, with the change record that set it. No rule without warn is planned in warn. Every audit hit has an exclusion, a fix or a decision before its rule moves. Every server's device check matches its plan. No expired exclusion remains in the register. And the run folder is recorded as evidence. Next, Chapter 5 turns from settings to findings: who owns each exposed device, and each incident. Thanks for watching.
