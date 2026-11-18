// Building Global Secure Access, Chapter 04 — Microsoft Traffic and Change Plans: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/04-microsoft-traffic-and-change-plans.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-04-microsoft-traffic-plans/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 4, dir: __dirname,
  base: "DW_GSA_04_Microsoft_Traffic_Plans",
  title: "Microsoft Traffic and Change Plans",
  map: "Why the first write needs a plan · what Learn gives and leaves · the traffic checks · the plan and its guards · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Global Secure Access. This is Chapter 4: Microsoft traffic, and change plans. The Microsoft traffic profile is the prerequisite for everything identity-aware the service adds. Turning it on is also the first write, so this chapter builds the plan every later write goes through: a file a second person approves by its hash before anything changes. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's Step 4, Microsoft traffic. It starts with Learn's Graph tutorial pattern for a forwarding profile, the signaling setting that is both source IP restoration and Conditional Access signaling, and the guide's sign-in query. Then the traffic checks GSA-MS-01 to -04 and the plan: a reviewed desired-state file, compared with the collection, written as plan.json with a SHA-256 a second person approves. Lab 1 finds the pilot's sign-in share under target and plans the pilot's changes without sending anything. Lab 2 enables the profile and signaling in a test tenant from an approved plan, and backs it out.`,
      cite: ["gsa04-ia", "gsa04-sip"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why the first write needs a plan",
      body: [
        { lead: "The Microsoft traffic profile is the prerequisite for everything identity-aware. Turning it on is the first write." },
        { cols: [[{ bullets: [
          "Show a ring's Microsoft 365 and Entra ID traffic goes through the service, **with its real source address**",
          "Change the tenant **only through a plan file** whose hash a reviewer approved",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The platform owner (network) who runs the changes",
          "The change advisory board's reviewer",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 04, opening, “Goal and audience.”",
      say: `Why a plan, now? Because source IP restoration, the compliant network check and universal tenant restrictions all depend on the Microsoft traffic profile, and switching it on is the first time the kit changes anything. So the goal has two halves. Show that a ring's Microsoft 365 and Entra ID traffic goes through the service, carrying its real source address. And change the tenant only through a plan file whose hash a reviewer approved. It's for the developers, the platform owner who runs the changes, and the change board's reviewer.`,
      detail: `Goal: show that a ring's Microsoft 365 and Entra ID traffic goes through the service with its real source address, and change the tenant only through a plan file whose hash a reviewer approved. Audience: developers who build or maintain the kit, the platform owner (network) who runs the changes, and the change advisory board's reviewer.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["The Microsoft traffic profile", "Acquires Microsoft 365 and Entra ID traffic, which only this profile can acquire"],
          ["Enable it", "Find it by trafficForwardingType; PATCH its state; NetworkAccess.ReadWrite.All"],
          ["Assign users and groups", "A portal step on the pages read; Application Administrator"],
          ["Signaling", "Source IP restoration and the Conditional Access signal; on by default after June 2025; turning it off can block users"],
          ["Validate", "Compare a SharePoint sign-in's IP with the client on and off; the guide's sign-in share query"],
          ["Change category", "Enabling a new traffic profile is a major change"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Internet Access Graph tutorial; enable the Microsoft traffic profile; source IP restoration; settings; deployment guide; operations.",
      say: `Here's what Learn gives. The Microsoft traffic profile acquires Microsoft 365 and Entra ID traffic, and only that profile can. Learn's Graph tutorial finds a profile by its traffic type and sets its state with a patch. Assigning users and groups is a portal step on the pages read. Signaling is source IP restoration and the signal Conditional Access needs. It's on by default for newer tenants, and Learn cautions that turning it off while policies depend on it can block users. The test compares a SharePoint sign-in's address with the client on and off. And Learn treats enabling a new profile as a major change.`,
      detail: `The Microsoft traffic profile acquires Microsoft 365 and Entra ID traffic, which only that profile can acquire; Learn's Graph tutorial finds a profile by trafficForwardingType and sets its state with a PATCH, using NetworkAccess.ReadWrite.All. Assigning users and groups to the profile is a portal step on the pages read, and needs Application Administrator. Signaling, set with PATCH /networkAccess/settings/conditionalAccess and signalingStatus, is source IP restoration and the Conditional Access signal Chapter 05 needs; it is on by default for tenants onboarded after June 2025, and Learn cautions that turning it off while policies depend on it can block users. The guide's Validate step is Learn's deployment guide test (a SharePoint sign-in's IP with the client on and off) and a KQL query for the share of sign-ins with IsThroughGlobalSecureAccess true. Learn's change guidance treats enabling a new traffic profile as a major change for the change advisory board.`,
      cite: ["gsa04-ia", "gsa04-fp", "gsa04-ms", "gsa04-sip", "gsa04-sig", "gsa04-dg", "gsa04-ops"],
      ref: "“What Microsoft gives you”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.4, 3.4, 5.35], rows: [
          ["One PATCH per change, typed by hand", "A board can't approve an unwritten command", "plan.json: every request with call ID, method, URI, body, reason, and its SHA-256"],
          ["The assignment is a portal step", "A Graph-only plan misses it", "MAN-ASSIGN lines with the exact click path"],
          ["Turning signaling off can block users", "A plan could do it in the wrong order", "Signaling first in a plan; the rollback turns it off last, on request"],
          ["A percentage per day", "No pass or fail", "GSA-MS-03 sums the week against the target"],
          ["Nothing ties a profile to a decision", "Internet Access on before anyone decided", "GSA-MS-04 fails a profile without an approved decision"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Learn, source IP restoration; enable the Microsoft traffic profile. Chapter 04, “What it leaves to you.”",
      say: `What does it leave to you? Each change is one patch typed by hand, and a change board can't approve a command that isn't written down, so the kit writes the plan as a file, with every request and its hash. The assignment is a portal step, so the plan lists it as a manual line with the click path. A plan could turn signaling off in the wrong order, so plans turn it on first and only the rollback turns it off, last. A daily percentage has no pass or fail, so the check sums the week. And nothing ties a profile to its decision, so a profile with no approved decision fails.`,
      detail: `Each row is pinned by a test in the Chapter 04 or Plans blocks of tests/GlobalSecureAccess.Tests.ps1. One PATCH per change, typed by hand: plan.json, every request with its call ID, method, URI, body and reason, and its SHA-256. The profile assignment is a portal step: portal steps in the plan as MAN-ASSIGN lines with the exact click path. Turning signaling off can block users: the plan sets signaling before the profiles; the rollback plan (Chapter 08) disables it last, only on request. A sign-in query with a percentage per day: GSA-MS-03 sums the week and compares it with targets.signinShare (95% in the guide's metrics). Nothing ties a profile to its decision: GSA-MS-04 fails an enabled internet or private profile with no approved decision (Chapter 01).`,
      cite: ["gsa04-sip", "gsa04-ms"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The plan, and its four guards",
      body: [
        { lead: "A desired-state file (profiles, signaling, tagging, the guide's policies as files) compared with a collection. Order: signaling, profiles, policies, tagging; assignments as manual steps." },
        { cards: [
          { title: "Report-only first", text: "New Conditional Access policies are report-only; enforcing needs -AllowEnforce" },
          { title: "Emergency excluded", text: "A policy file that doesn't exclude the emergency group isn't planned" },
          { title: "Tagging waits", text: "No tagging while the TRv2 default doesn't block" },
          { title: "Back to the file", text: "A drifted policy gets a PATCH back to its reviewed file" },
        ], pt: 13 },
        { callout: "without -Apply, every step is WouldApply. With -Apply: a live collection, a delegated session in the settings' tenant, and -ApprovedSha256 equal to the plan's hash; it stops at the first error.", label: "Apply: ", icon: "FaLock", color: "amber" },
      ],
      sources: "Sources: examples/global-secure-access (New-GsaPlan, Invoke-GsaPlanSteps). Chapter 04, “The plan.”",
      say: `Here's the plan. It reads a desired-state file: the three profiles' state, signaling, tagging, and the guide's Conditional Access policies as files. It compares them with a collection and writes the requests that close the gap, in a safe order: signaling, then profiles, then policies, then tagging, with the assignments as manual steps. Four guards. New policies are report-only, and enforcing one needs an explicit switch. A policy that doesn't exclude the emergency group isn't planned. Tagging waits for a blocking tenant restrictions default. And a drifted policy is brought back to its file. Nothing applies without the approved hash, a live collection and a delegated session.`,
      detail: `New-GsaPlan (and Invoke-GsaPlan.ps1) reads a collection and a desired-state file such as config/desired.lab.json: the three profiles' state, signalingStatus, networkPacketTaggingStatus, the Conditional Access policy files under config/policies (the guide's policies, with placeholders the settings fill), and the profile assignments. Order: signaling, then the profiles, then the policies, then tagging; the assignments as manual steps. Guards: new Conditional Access policies are report-only (a policy carrying a Global Secure Access security profile is the exception, because the guide pilots those with a group-scoped On policy); enforcing a report-only policy needs -AllowEnforce; every policy excludes the emergency access group, or it isn't planned; tagging waits for a blocking TRv2 default; a changed policy is brought back to its reviewed file with a PATCH of its conditions and controls. Invoke-GsaPlanSteps lists WouldApply without -Apply; with -Apply it refuses unless the collection was read live, the Graph session is the settings' tenant and delegated, and -ApprovedSha256 equals the plan file's hash; then it sends each step in order and stops at the first error.`,
      cite: [],
      ref: "“The code” — “The plan”",
    },
    {
      part: "Who", title: "Who plans, who approves, who applies",
      body: [
        { cols: [[{ bullets: [
          "**Platform owner (network)**: writes the desired state, plans, applies",
          "**Second person** (change board reviewer): approves the plan's SHA-256",
          "**Security monitor**: reads the sign-in share",
          "**Change record**: holds the approved hash",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "Reads: NetworkAccess.Read.All; the workspace for the query",
          "Writes: NetworkAccess.ReadWrite.All (profiles, signaling, tagging)",
          "Policy.ReadWrite.ConditionalAccess (policies)",
          "Application Administrator for the portal assignment, via PIM",
        ], label: "Permissions", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Learn, enable the Microsoft traffic profile; settings. Chapter 04, “Federal requirements,” Lab 1 step 1, Lab 2.",
      say: `Who does what? The platform owner writes the desired state, plans and applies. A second person, the change board's reviewer, approves the plan's hash, and the change record keeps it. The security monitor reads the sign-in share. For permissions, the reads need Network Access Read All and access to the workspace. The writes are Network Access Read Write All for the profiles, signaling and tagging, and Policy Read Write Conditional Access for the policies. The portal assignment needs Application Administrator, activated through privileged identity management for the window only.`,
      detail: `Evidence owners: the Microsoft profile and signaling (the platform owner); the sign-in share (the security monitor); each change planned, approved by its hash and applied (the change record holds the approved hash). Get-GsaRequiredPermission -Area traffic: forwarding-profiles and ca-signaling with NetworkAccess.Read.All; law-query with read access to the workspace. Get-GsaRequiredPermission -Writes: profile-state, signaling, tagging with NetworkAccess.ReadWrite.All; ca-create and ca-update with Policy.ReadWrite.ConditionalAccess. Lab 2: activate Global Secure Access Administrator and Application Administrator through PIM for the lab only.`,
      cite: ["gsa04-ms"],
      ref: "“Federal requirements and evidence”; Lab 1, step 1; Lab 2",
    },
    {
      part: "How", title: "Lab 1: the sign-in share is under target",
      body: [
        { terminal: "04-3" },
        { terminal: "04-4" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 04, “Lab 1: fixtures, no tenant,” steps 3–4.",
      say: `Lab 1. Steps 1 and 2 list the reads and writes and collect the whole pilot tenant, because the plan compares against everything. Step 3 runs the traffic checks. The profile and signaling are on, and the internet and private profiles each have an approved decision. But only two thousand five hundred fifty-five of two thousand eight hundred sign-ins, ninety-one percent, went through the service, under the ninety-five percent target. Step 4 reads the guide's query day by day: rising, but not there yet.`,
      detail: `Step 1: Get-GsaRequiredPermission -Area traffic | Format-Table; Get-GsaRequiredPermission -Writes | Format-Table. Step 2: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath out/pilot -AsOf 2026-11-16T12:00:00Z. Step 3: ./Invoke-GsaCheck.ps1 -Area traffic ...: GSA-MS-01 Pass, GSA-MS-02 Pass, GSA-MS-03 Fail 2555 of 2800 sign-ins in 7 days (91.2%), target 95%, GSA-MS-04 Pass for internet (NET-GSA-03) and private (NET-GSA-02). Step 4: (Read-GsaCollection -Path out/pilot)['law-query']['signin-share'] | ForEach-Object { [pscustomobject]$_ } | Format-Table TimeGenerated, Total, ThroughGSA, PctThroughGSA: 90.5% rising to 92.0%.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–4",
    },
    {
      part: "How", title: "Lab 1: plan the pilot, read a step",
      body: [
        { terminal: "04-5", lines: "1-3,6-7" },
        { terminal: "04-6" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 04, “Lab 1,” steps 5–6.",
      say: `Step 5 plans the pilot from its desired state. Two Graph steps. The internet profile goes off, because the pilot's desired state hasn't adopted Internet Access yet. And the administrative RDP policy goes back to its reviewed file; Chapter 6 says why. Two portal steps assign the pilot group. Then the plan's hash, and dry run, nothing changed. Step 6 reads the plan's first step in full, as the reviewer does before approving the hash: the call, the method, the address on graph dot microsoft dot com, and the reason.`,
      detail: `Step 5: ./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -DesiredPath config/desired.lab.json -OutputPath out/plan -AsOf 2026-11-16T12:00:00Z. PL-01 WouldApply PATCH internet profile enabled -> disabled; PL-02 WouldApply PATCH NET-PA-AdminRDP-PhishingResistant: conditions or controls differ from the reviewed file; two MAN-ASSIGN lines (left out of the slide); Plan SHA-256; Dry run: nothing changed. Step 6: (Read-GsaJson -Path out/plan/plan.json).steps | ... | Select-Object -First 1 | Format-List id, call, method, uri, why: PL-01, profile-state, PATCH, https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<fixture id>, internet profile enabled -> disabled.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 5–6",
    },
    {
      part: "How", title: "Lab 1: fixture mode refuses to apply",
      body: [
        { terminal: "04-7" },
        { terminal: "04-8" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 04, “Lab 1,” steps 7–8.",
      say: `Step 7 tries to apply the plan in fixture mode, with a made-up hash. It's refused before the hash is even read: apply runs only with a live invoker, and fixture mode never changes anything. The tests also show the other refusals: a live session with the wrong hash is refused, and the right hash sends the steps in order through the Graph runner. Step 8 runs this chapter's tests: nine passed, none failed. Then delete the output folder.`,
      detail: `Step 7: ./Invoke-GsaPlan.ps1 ... -Apply -ApprovedSha256 ('0' * 64). Exception: Refused: -Apply runs only with a live invoker; fixture mode never changes anything. The Plans block of the tests also covers: -Apply refused with another hash in a live session; the approved plan applied through a stand-in Graph runner, in order. Step 8: Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapter 04*', 'Plans*' -Output None -PassThru: 9 passed, 0 failed. Delete out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 7–8",
    },
    {
      part: "How", title: "Lab 2: the profile on, from an approved plan",
      body: [
        { steps: [
          { title: "Sign in", text: "NetworkAccess.ReadWrite.All and the reads, as a person" },
          { title: "Collect, then plan", text: "A desired file with only Microsoft traffic and signaling; send plan.json and its hash to the reviewer" },
          { title: "Apply the approved plan", text: "-Apply -ApprovedSha256 <plan-sha256>" },
          { title: "Assign the pilot group in the portal", text: "Global Secure Access > Connect > Traffic forwarding > Microsoft traffic profile > User and group assignments" },
          { title: "Validate", text: "Learn's source IP test on the device; the guide's query; collect and check" },
          { title: "Back it out", text: "Remove the group in the portal, then disable the profile; leave signaling on" },
        ], pt: 12.5 },
      ],
      sources: "Sources: Learn, enable the Microsoft traffic profile; deployment guide. Chapter 04, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant with Entra ID P1, a pilot group of fictional users and a test device with the client. Sign in, collect, and plan from a desired file that only turns on Microsoft traffic and signaling. Send the plan and its hash to the reviewer, then apply it with the approved hash. Assign the pilot group in the portal, as the plan's manual line says. Validate with Learn's test, comparing the sign-in address with the client on and off, then the guide's query and the kit's checks. Back it out in the guide's order: remove the group, disable the profile, and leave signaling on. The authors haven't run this lab.`,
      detail: `Use a test tenant with Microsoft Entra ID P1, a pilot group of fictional users and a test device with the client (Chapter 03), never production. Placeholders: <tenant-id>, <settings-file>, <inputs-folder>, <desired-file> (a copy of config/desired.lab.json with internet disabled, private disabled and conditionalAccess an empty list), <workspace-guid>, <plan-sha256>, <m365-profile-id>. 1 Connect-MgGraph -Environment Global with NetworkAccess.ReadWrite.All, Policy.Read.All, Directory.ReadWrite.All, LicenseAssignment.Read.All, NetworkAccessPolicy.Read.All. 2 ./Invoke-GsaCollect.ps1 -OutputPath out/before -AllowUnverified; ./Invoke-GsaPlan.ps1 -DesiredPath <desired-file> -OutputPath out/plan-test. 3 Apply with -ApprovedSha256 <plan-sha256>. 4 Portal: Microsoft Entra admin center > Global Secure Access > Connect > Traffic forwarding > Microsoft traffic profile > User and group assignments > View > Add user/group. 5 Learn's test on the device; az monitor log-analytics query with the sign-in share query; collect and check traffic. 6 Remove the group in the portal; PATCH the profile state disabled; Disconnect-MgGraph; delete outputs.`,
      cite: ["gsa04-ms", "gsa04-dg"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Keeps it"], w: [5.6, 2.3, 2.3, 1.95], rows: [
          ["The Microsoft profile and signaling are on", "AC-17", "IAM-ELP", "Platform owner"],
          ["The share of sign-ins carried, with the real source address", "AU-3, SI-4", "MLA-OSM", "Security monitor"],
          ["Each change planned, approved by its hash, applied in order", "CM-3, CM-4", "CMT-LMC, CMT-VTD", "Change record"],
        ] }, pt: 12 },
        { cols: [[{ bullets: [
          "A plan nobody read: the hash; fixture mode never applies",
          "Internet Access before its decision: GSA-MS-04",
          "Signaling off with policies on: only the rollback, last",
        ], label: "Dangers and guards", color: "red", pt: 12.5 }], [{ bullets: [
          "Profile on for the ring; signaling on",
          "Sign-in share meets target over a week",
          "Every change from a plan a second person approved",
        ], label: "Done when", color: "teal", pt: 12.5 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 04, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `The profile and signaling support remote access control. The sign-in share, with the real source address, supports the content of audit records and system monitoring. And every plan, approved by its hash and applied in order, supports configuration change control and impact analysis. The guide reads this step as TIC 3.0's remote user pattern to a sanctioned cloud service. The assessor decides the controls. The dangers: a plan nobody read, Internet Access turned on before its decision, and signaling turned off while policies need it. You're done when the profile and signaling are on for the ring, the week's share meets the target, and every change came from an approved plan. Next, Chapter 5: the compliant network and tenant restrictions.`,
      detail: `Requirements (config/requirements.json): the Microsoft profile and signaling are on: AC-17; KSI-IAM-ELP. The share of sign-ins carried by the service, with the real source address: AU-3, SI-4; KSI-MLA-OSM. Each change planned as a file, approved by its hash and applied in order (plan.json, results.json, the change record): CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-VTD. TIC 3.0's Remote User Use Case, Pattern 2, is the guide's reading for this step. The kit's records support these controls; the agency's assessor decides them. Dangers: a plan applied that nobody read (the hash; -Apply refuses any other; fixture mode never applies); Internet Access enabled before its decision (GSA-MS-04; the desired state keeps it off); signaling turned off with policies on (plans set it on first; only the rollback plan turns it off, last, on request); a sign-in share read for one day (GSA-MS-03 sums the week); an assignment forgotten because it isn't in Graph (a manual step with the click path). Checklist: the profile on for the ring's group, signaling on; the week's share meets its target; every change from a plan whose SHA-256 a second person approved, filed with the change record; the manual assignment steps done and recorded; Learn's source IP test run and recorded. Next: Chapter 05 — The Compliant Network and Tenant Restrictions.`,
      cite: [],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
