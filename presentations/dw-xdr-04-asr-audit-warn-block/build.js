// Building Defender XDR, Chapter 04 — Attack Surface Reduction: Audit, Warn, Block: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/04-attack-surface-reduction-audit-warn-block.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-04-asr-audit-warn-block/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 4, dir: __dirname,
  base: "DW_XDR_04_ASR_Audit_Warn_Block",
  title: "Attack Surface Reduction: Audit, Warn, Block",
  map: "Why bookkeeping · what Learn gives · what it leaves · the outputs · the readiness rules · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 4: attack surface reduction, through audit, warn and block. Audit is configured but protects nothing. A rule is done when it's in block on every ring, or its exception is written down. The code's job is to say which rules can move this week, and why the others can't. We'll start from Learn's modes and syntax, read the rule catalog, the plan and the readiness rules, and walk two labs. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G4 Attack Surface Reduction. You start with Learn's rule modes, its OMA-URI syntax and the guide's two queries, and what they leave to you. Then you read the rule catalog, the plan, the readiness rules and the device check. Lab 1 runs the check on a fictional estate in the middle of its rollout, reads which rules can move, prints the value that moves ring 1, and finds a server that enforces nothing. Lab 2 runs it in a test tenant.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why the rollout needs bookkeeping",
      body: [
        { lead: "Fourteen rules times five rings, each with its own clock and its own audit hits. Audit is configured but protects nothing." },
        { cols: [[{ bullets: [
          "Produce the rule-by-ring matrix the assessor reads",
          "Say which rules each ring can move this week",
          "Hand the change board the exact value that moves them",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who maintain the kit",
          "The platform owner who owns G4",
          "The SOC lead who reads the per-rule counts",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
        { callout: "the rule list and the stage lengths are the Devices book's ES-005: audit 30 days, warn 14.", label: "Program: ", icon: "FaBook", color: "amber" },
      ],
      sources: "Sources: Chapter 04, opening, “Goal and audience.” Devices, Chapter 08, ES-005.",
      say: `Why does this rollout need code? Because it's fourteen rules times five rings, each pair with its own clock and its own audit hits. Audit is configured, but protects nothing. By the end of this chapter you can produce the rule-by-ring matrix the assessor reads, say which rules each ring can move this week, and hand the change board the exact value that moves them. It's for the developers, the platform owner who owns this gate, and the security operations lead who reads the weekly counts. The rule list and the stage lengths, thirty days of audit and fourteen of warn, are the Devices book's policy.`,
      detail: `Goal: by the end of this chapter you can produce the rule-by-ring matrix the assessor reads, say for each ring which rules are ready for their next stage, and hand the change board the exact OMA-URI value that moves them. Audience: developers who maintain the kit, the platform owner who owns G4, and the SOC lead who reads the weekly per-rule counts. The rule list and the stage lengths are Book 05's ES-005 (Devices, Chapter 08): every rule in audit 30 days, then warn 14 days for the rules that support it, then block.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "The detail"], w: [3.6, 8.55], rows: [
          ["Rule modes", "0 off, 1 block, 2 audit, 5 not configured, 6 warn"],
          ["The custom-profile OMA-URI", "./Vendor/MSFT/Policy/Config/Defender/AttackSurfaceReductionRules; one <rule GUID>=<mode> per line in Intune"],
          ["Warn", "Windows 10 1809 or later; the LSASS and Office code-injection rules don't support it; Unblock needs administrator approval from 4.18.26060"],
          ["Each rule", "Its GUID and its hunting action types, ...Audited and ...Blocked"],
          ["A known issue", "On Windows Server, a rule can show compliant without being enforced"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Configure ASR rules and exclusions; ASR rules overview; ASR rules reference; Monitor ASR rule activity. Chapter 04.",
      say: `Microsoft Learn gives you the rule modes: zero off, one block, two audit, five not configured, six warn. The custom-profile path in Intune, with one rule GUID equals mode per line. Warn's requirements: Windows 10 1809 or later, two rules that don't support it, the LSASS rule and the Office code-injection rule, and since platform 4.18.26060, Unblock needs an administrator's approval. The rules reference gives each rule's GUID and its advanced hunting action types. And Learn lists a known issue: on Windows Server, a rule can show as compliant without being enforced.`,
      detail: `Learn gives the rule modes, 0 off, 1 block, 2 audit, 5 not configured, 6 warn; the custom-profile OMA-URI ./Vendor/MSFT/Policy/Config/Defender/AttackSurfaceReductionRules with one <rule GUID>=<mode> per line in Intune; and a PowerShell line that lists a device's rules and actions from Get-MpPreference. Warn needs Windows 10 1809 or later with a recent platform and engine; two rules don't support warn (the LSASS rule and the Office code-injection rule); since platform 4.18.26060 Unblock needs administrator approval. The rules reference gives each rule's GUID and its advanced hunting action types. The guide's queries count DeviceEvents with ActionType starting Asr over 30 days. Known issue: on Windows Server, a rule can show as compliant without being enforced.`,
      cite: ["xdr04-configure", "xdr04-overview", "xdr04-reference", "xdr04-monitor"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide and Learn give you”",
    },
    {
      part: "What", title: "What Learn leaves to you, and the verdict",
      body: [
        { table: { head: ["Learn gives", "Why it isn't enough", "What the kit adds"], w: [3.1, 3.9, 5.15], rows: [
          ["GUIDs and action types per rule", "Nothing ties an event to its rule and ring", "config/asr-rules.json: the fourteen ES-005 rules"],
          ["A count by action type", "Can't say whether a hit has an exclusion", "The per-device query keeps the path; hits matched to the register"],
          ["Stage lengths", "Someone counts days per ring per rule", "The plan records each stage and its start date"],
          ["Two rules without warn", "A plan puts them in warn anyway", "A plan error; audit goes straight to block"],
          ["The OMA-URI syntax", "Fourteen lines typed by hand per ring", "<ring>.txt now and <ring>-next.txt"],
          ["A compliance report", "Compliant without enforced on servers", "Each device's own Get-MpPreference against its plan"],
        ] }, pt: 11.5 },
        { lead: "Verdict: keep Learn's modes, syntax and queries exactly; build the bookkeeping." },
      ],
      sources: "Sources: examples/defender-xdr tests/Checks.Tests.ps1 (Chapter 04). Chapter 04, “What it leaves to you,” “The verdict.”",
      say: `What does that leave to you? Nothing ties an event back to its rule and ring, so the kit carries the fourteen rules with their action types. A count can't say whether a hit already has an exclusion, so the per-device query keeps the file path, and each hit is matched to the register. Someone has to count days, so the plan records each stage and its start date. A plan might put a no-warn rule in warn, so that's an error. Fourteen lines per ring by hand invites typos, so the kit writes them. And a compliance report can be wrong on servers, so the device itself is checked. The verdict: keep Learn exactly; build the bookkeeping.`,
      detail: `Each row is pinned by a test in tests/Checks.Tests.ps1, Chapter 04. Rule GUIDs and action types: config/asr-rules.json, the fourteen ES-005 rules with GUID, warn support, action types and Windows Server support. A count of events by action type: the per-device query keeps the file path; each audit hit is matched to the exclusion register. Stage lengths: the plan records each rule's stage and start date; readiness is computed. Two rules without warn: a plan error, and audit goes straight to block for them. The OMA-URI syntax: oma-uri/<ring>.txt now and <ring>-next.txt with only the ready rules moved. A compliance report: each device's own Get-MpPreference against its ring's plan. Microsoft's note on PSExec and WMI and Configuration Manager: a warning when a ring holds a device Configuration Manager manages.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "What the ASR check writes",
      body: [
        { table: { head: ["File", "What it holds"], w: [3.9, 8.25], rows: [
          ["matrix.csv", "Each rule's stage on each ring: the assessor's rule-by-ring matrix"],
          ["readiness.csv", "Per ring and rule: stage, days, audit hits, open hits, blocks, next stage, status and why"],
          ["oma-uri/<ring>.txt and <ring>-next.txt", "Learn's custom-profile value now, and with only the ready rules moved"],
          ["device-checks.csv", "What each device enforces against its ring's plan"],
          ["exclusions-expired.csv", "Register rows past their expiry"],
        ] }, pt: 13 },
        { callout: "Ready, Hold, Done, Warn, Fail, or NotApplicable for a rule Windows Server doesn't support on a server ring.", label: "Statuses: ", icon: "FaListCheck", color: "teal" },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrAsr.ps1, Get-XdrAsrReadiness, ConvertTo-XdrOmaUriValue). Chapter 04, “The code.”",
      say: `The ASR check reads the plan, the exclusion register, the inventory and the device states, runs the guide's query and its per-device form, and writes five things. The matrix: each rule's stage on each ring, which is what the assessor reads. Readiness: per ring and rule, the stage, days in it, audit hits and open hits, blocks, the next stage, and a status with the reason. The custom-profile value for each ring, now and next. What each device actually enforces. And the exclusions that have expired. A status is ready, hold, done, warn, fail, or not applicable for a rule Windows Server doesn't support.`,
      detail: `Invoke-XdrAsr.ps1 (Invoke-XdrAsrCheck) reads the plan, the exclusion register, the inventory and the device states named in the settings, runs the guide's query and its per-device form, and writes matrix.csv (each rule's stage on each ring), readiness.csv (per ring and rule: stage, days in it, audit hits, open hits, blocks, next stage, status (Ready, Hold, Done, Warn, Fail, NotApplicable) and why), oma-uri/<ring>.txt and oma-uri/<ring>-next.txt (Learn's custom-profile value now, and with only the ready rules moved), device-checks.csv (what each device enforces against its ring's plan) and exclusions-expired.csv (register rows past their expiry).`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "What", title: "The readiness rules",
      body: [
        { steps: [
          { title: "Audit to warn (or to block)", text: "30 days, and every audit hit on the ring's devices has an exclusion, a fix or a decision; a rule without warn moves to block" },
          { title: "Warn to block", text: "14 days, with no open hit" },
          { title: "A hit is covered", text: "By a valid register row for its rule (or *) whose path is the same file, or a folder ending in \\ that contains it" },
          { title: "Not applicable", text: "Rules Windows Server doesn't support, on a ring of servers" },
        ], pt: 13.5 },
        { callout: "the change board puts the -next value in the Intune policy under a change record, then updates the plan. The kit never changes a policy.", label: "Who moves it: ", icon: "FaUserCheck", color: "amber" },
      ],
      sources: "Sources: examples/defender-xdr (Get-XdrAsrReadiness, Test-XdrAsrHitCovered). Chapter 04, “The code” (design guidance, from ES-005).",
      say: `Here are the readiness rules, which are the program's design from the Devices book's policy. A rule in audit is ready after thirty days, when every audit hit on the ring's devices has an exclusion, a fix or a decision in the register. It moves to warn, or straight to block if it doesn't support warn. A rule in warn is ready after fourteen days with no open hit. A hit is covered by a valid register row for its rule, or for every rule, whose path is the same file, or a folder that contains it. And the change board, not the kit, puts the next value in Intune, under a change record.`,
      detail: `The readiness rules (design guidance, from ES-005): a rule in audit is ready when it has 30 days and every audit hit on the ring's devices has an exclusion, a fix or a decision in the register; it moves to warn, or to block if it doesn't support warn. A rule in warn is ready after 14 days with no open hit. A hit is covered by a register row for its rule (or *) whose path is the same file, or a folder ending in \\ that contains it. Rules Windows Server doesn't support are NotApplicable on a ring of servers. The kit never changes the Intune policy: the change board puts the -next value in it under a change record, then updates the plan.`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who moves a rule, who watches the blocks",
      body: [
        { cards: [
          { title: "Platform owner", text: "Owns G4; keeps the plan and the register; brings ready rules to the change board", color: "navy" },
          { title: "SOC lead", text: "Reads blocks per rule per week; a new Microsoft rule starts at audit on ring 1", color: "teal" },
          { title: "Help desk", text: "Briefed before each warn stage: Unblock needs an administrator now", color: "amber" },
        ], pt: 13.5 },
        { callout: "Microsoft's own position is lighter: standard protection rules can go to block without extensive testing. The kit enforces the program's stages.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Learn, ASR rules overview. Chapter 04, “Goal and audience,” the “Illustrative code” callout, “Dangers.”",
      say: `Who's involved? The platform owner owns this gate, keeps the plan and the register, and brings ready rules to the change board. The security operations lead reads blocks per rule per week, and starts any new rule from Microsoft at audit on ring 1. And the help desk is briefed before each warn stage, because Unblock now needs an administrator. One note: Microsoft's own position is lighter than the program's. Learn says standard protection rules can go to block without extensive testing. The program runs all three stages, and the kit enforces the program's stages.`,
      detail: `Audience: developers who maintain the kit, the platform owner who owns G4, and the SOC lead who reads the weekly per-rule counts. Day-two (the guide's G4): platform owner; weekly per-rule review by the SOC; a new rule from Microsoft starts at audit on ring 1. Warn treated as a bypass is a danger: brief the help desk; repeated needs become per-rule exclusions. Illustrative code: Lab 1's estate is fictional and mid-rollout on purpose. Microsoft's own position is lighter than the program's: standard protection rules can go to block without extensive testing. The program runs all three stages; the kit enforces the program's stages, not Microsoft's minimum.`,
      cite: ["xdr04-overview"],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: run the ASR check mid-rollout",
      body: [
        { terminal: "04-2", lines: "2-8,11-18,21-23,25", pt: 10.5 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 04, “Lab 1: fixtures, no tenant,” step 2.",
      say: `Lab 1, in the kit's folder. Step 1 lists the rules and which skip warn. Step 2 runs the check. Ring 0 is done. Ring 1 has twelve rules ready for block; the Office child-process rule is held, six of fourteen warn days. Ring 2 is ready to leave audit, except the same Office rule, with one audit hit nobody decided. The PSExec and WMI rule is a warning there, because Configuration Manager manages one device. Ring 3's plan puts the LSASS rule in warn, which it doesn't support: a plan error. And one server enforces none of the thirteen rules its plan puts in audit.`,
      detail: `Work in examples/defender-xdr. Step 1: (Get-Content config/asr-rules.json | ConvertFrom-Json).rules | Format-Table id, supportsWarn, actionTypePrefix -AutoSize. Step 2: ./Invoke-XdrAsr.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/asr -AsOf 2026-11-16T12:00:00Z. The slide shows the per-ring summary, the rules that need attention and the device check. Ring 0 is done. Ring 1 has twelve rules ready for block; the Office child-process rule is held at 6 of 14 warn days. Ring 2: the Office child-process rule has one audit hit with no exclusion or decision; the PSExec and WMI rule is a warning because Configuration Manager manages WKS-R2-02. Ring 3's plan puts the LSASS rule in warn: a plan error. SRV-APP01 enforces none of the thirteen rules its plan puts in audit: Learn's known server issue, caught on the device. ASR: 36 ready, 16 held, 15 in block, 1 plan error, 1 warning; 13 device mismatches; 1 expired exclusion.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the held rule, and ring 1's next value",
      body: [
        { terminal: "04-3", pt: 10.5 },
        { cols: [[{ terminal: "04-4", pt: 10.5 }], [{ bullets: [
          "Two audit hits for the rule on ring 2: the line-of-business helper has per-rule exclusion EX-ASR-01; the macro runner has nothing",
          "Ring 1's next value: every rule at 1 (block), except the Office child-process rule still at 6 (warn)",
          "This is the string the change board pastes into the ring 1 policy",
        ], label: "Read it", color: "navy", pt: 13.5 }]], split: 0.48 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 04, “Lab 1: fixtures, no tenant,” steps 3–4.",
      say: `Step 3 reads why the ring 2 rule is held. Seventeen audit events, one open hit. Two paths fired the rule: the line-of-business helper, which has a per-rule exclusion in the register, and a macro runner in a public tools folder, which has nothing. Someone decides an exclusion or a fix before the rule moves to warn. Step 4 prints the value that moves ring 1. Every rule at one, block, except the Office child-process rule, still at six, warn. That's the exact string the change board pastes into the ring 1 policy.`,
      detail: `Step 3: Import-Csv out/asr/readiness.csv | Where-Object { $_.Ring -eq 'ring2' -and $_.OpenHits -ne '0' } | Format-Table Rule, AuditHits, OpenHits, Note -AutoSize -Wrap. Two audit hits for the rule on ring 2: the line-of-business helper has a per-rule exclusion, EX-ASR-01; the macro runner in C:\\Users\\Public\\Tools has nothing. Step 4: Get-Content out/asr/oma-uri/ring1-next.txt. Every rule at 1 (block), except the Office child-process rule still at 6 (warn). This is the string the change board pastes into the ring 1 policy. Step 5 reads the matrix. Expected result: 36 ready, 16 held, 15 in block, 1 plan error, 1 warning, 13 device mismatches, 1 expired exclusion. Delete out when you're done.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–5",
    },
    {
      part: "How", title: "Lab 2: the ASR check in a test tenant",
      body: [
        { steps: [
          { title: "Collect the test device's state, then run the check", text: "Get-XdrDeviceState.ps1 on the device; Connect-MgGraph -Environment Global; ./Invoke-XdrAsr.ps1 -SettingsPath <settings-file>" },
          { title: "Read the device check", text: "Every rule in audit on the device; notConfigured where the plan says audit is the server issue or a policy not yet received" },
          { title: "Compare with Learn's listing", text: "Learn's Get-MpPreference one-liner on the device, elevated" },
          { title: "Back it out", text: "Nothing changed; a rule set locally goes back to audit with Learn's Add-MpPreference, and Intune overwrites it anyway" },
        ], pt: 13.5 },
        { callout: "a test tenant, never production, with the ASR policy assigned to a ring 0 device group in audit.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, Configure ASR rules and exclusions. Chapter 04, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant, never production, with the policy assigned to a ring 0 device group in audit. Collect the test device's state, sign in, and run the check live. The device check should show every rule in audit on the device. A row saying not configured on the device while the plan says audit is either the server issue, or a policy the device hasn't received yet. Compare with Learn's own one-line listing on the device. Nothing changed. If you set a rule locally for an investigation, Learn's cmdlet puts it back in audit, and Intune overwrites it at the next refresh anyway.`,
      detail: `Use a test tenant, never production, with the ASR policy assigned to a ring 0 device group in audit, as the guide's G4 describes. Placeholders: <tenant-id>, <settings-file> (with inputs.asrPlan, inputs.asrExclusions and inputs.deviceStates naming the test tenant's files), <output-folder> and <rule GUID>. 1 ./Get-XdrDeviceState.ps1 -OutputPath <output-folder>/devices; Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ThreatHunting.Read.All; ./Invoke-XdrAsr.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/asr. 2 Learn's listing: $p = Get-MpPreference;0..([math]::Min($p.AttackSurfaceReductionRules_Ids.Count,$p.AttackSurfaceReductionRules_Actions.Count)-1) | % {...} | Format-Table -AutoSize. 3 Back it out: Add-MpPreference -AttackSurfaceReductionRules_Ids <rule GUID> -AttackSurfaceReductionRules_Actions AuditMode. Not run by the authors.`,
      cite: ["xdr04-configure"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.8, 1.7, 2.0, 2.65], rows: [
          ["Each rule's stage on each ring, with its start date (matrix.csv, readiness.csv)", "CM-7", "SVC-ACM", "Platform owner; the assessor reads it"],
          ["The value each ring is set to, now and next (oma-uri/)", "CM-6", "SVC-ACM", "Change board"],
          ["What devices enforce; blocks per rule (device-checks.csv)", "SI-3", "MLA-EVC", "SOC lead, weekly"],
          ["Exclusions with owners and expiry; expired ones listed", "CM-6", "MLA-EVC", "Policy owner, quarterly"],
        ] }, pt: 12.5 },
        { lead: "The pairs are the guide's G4 row. The kit's records support these controls; the assessor decides them." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators. Chapter 04, “Federal requirements and evidence.”",
      say: `Here's what this gate proves, against NIST's catalog. Each rule's stage on each ring, with the date it began, supports least functionality. The value each ring is set to, now and next, supports configuration settings. What devices actually enforce, with blocks per rule, supports malicious code protection. And exclusions with owners and expiry dates, with the expired ones listed, supports configuration settings again. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.`,
      detail: `Each rule's stage on each ring, with the date it entered it (matrix.csv, readiness.csv): CM-7; KSI-SVC-ACM; the platform owner, the assessor reads the matrix. The value each ring is set to, now and next (oma-uri/): CM-6; KSI-SVC-ACM; the change board, with the change record. What devices enforce, and blocks per rule (device-checks.csv, readiness.csv Blocks): SI-3; KSI-MLA-EVC; the SOC lead, weekly. Exclusions with owners and expiry; expired ones listed (exclusions-expired.csv): CM-6; KSI-MLA-EVC; the policy owner, quarterly. The pairs are the guide's G4 row. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them.`,
      cite: [],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.8, 3.9, 4.45], rows: [
          ["A server reports compliant but enforces nothing", "The matrix says audit; nothing is logged", "The device check reads Get-MpPreference"],
          ["A rule moved on a calendar, not on its hits", "A line-of-business app breaks in block", "Every audit hit dispositioned first"],
          ["A rule without warn put in warn", "Acts as block on older Windows", "A plan error"],
          ["A rule set in Intune and Group Policy", "Group Policy wins; the Intune value loses", "One control plane; the device shows what won"],
          ["A folder exclusion that's too wide", "A whole tree escapes the rule", "File paths preferred; owner and expiry"],
          ["Warn treated as a bypass", "Help-desk volume, then a rollback", "Brief the help desk; exclusions, not unblocks"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Learn, Configure ASR rules and exclusions; ASR rules overview. Chapter 04, “Dangers.”",
      say: `What breaks in production? A server that reports compliant but enforces nothing; the device check reads the server itself. A rule moved on a calendar, not on its hits, which breaks a line-of-business app; every hit is dispositioned first. A no-warn rule in warn, which acts as block on older Windows. A rule set in both Intune and Group Policy: Group Policy wins by default, and the device check shows the value that won. A folder exclusion that's too wide, so file paths are preferred. And warn treated as a bypass: brief the help desk, and turn repeated needs into exclusions.`,
      detail: `A server reports compliant but enforces nothing: the matrix says audit; nothing is logged; guard: the device check reads Get-MpPreference on the server. A rule moved on a calendar, not on its hits: a line-of-business app breaks in block; guard: readiness needs every audit hit dispositioned. A rule without warn put in warn: acts as block on older Windows; plan and reality differ; guard: a plan error. A rule set in Intune and Group Policy: Group Policy wins by default; the Intune value silently loses; guard: one control plane per setting (Devices, Chapter 07); the device check shows the value that won. A folder exclusion that's too wide: a whole tree escapes the rule; guard: prefer a file path; a folder must end in \\, and the register names an owner and expiry. Warn treated as a bypass: help-desk volume, then a rollback; guard: brief the help desk; repeated needs become per-rule exclusions.`,
      cite: ["xdr04-configure", "xdr04-overview"],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The plan matches each ring's Intune policy, with its change record",
          "No rule without warn is planned in warn",
          "Every audit hit has an exclusion, a fix or a decision before its rule moves",
        ], label: "The plan", color: "navy", pt: 13.5 }], [{ bullets: [
          "Every server's device check matches its plan",
          "No expired exclusion remains in the register",
          "The run folder is recorded as evidence (Chapter 08)",
        ], label: "The devices and the record", color: "teal", pt: 13.5 }]] },
        { callout: "Chapter 05, Exposure and Incidents, turns from settings to findings: who owns each exposed device and each incident.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 04, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The plan matches each ring's Intune policy, with the change record that set it. No rule without warn is planned in warn. Every audit hit has an exclusion, a fix or a decision before its rule moves. Every server's device check matches its plan. No expired exclusion remains in the register. And the run folder is recorded as evidence. Next, Chapter 5 turns from settings to findings: who owns each exposed device, and each incident. Thanks for watching.`,
      detail: `Checklist: The plan matches each ring's Intune policy, with the change record that set it. No rule without warn is planned in warn. Every audit hit has an exclusion, a fix or a decision before its rule moves. Every server's device check matches its plan. No expired exclusion remains in the register. The run folder is recorded as evidence (Chapter 08). Next: Chapter 05 — Exposure and Incidents.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
