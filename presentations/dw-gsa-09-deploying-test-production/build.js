// Building Global Secure Access, Chapter 09 — Deploying to Test and Production: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/09-deploying-to-test-and-production.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js. The runbook has no Lab 1, so its
// output panels are the page's own fixture-mode output (November 17, 2026), shown as code.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-09-deploying-test-production/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 9, dir: __dirname,
  base: "DW_GSA_09_Deploying_Test_Production",
  title: "Deploying to Test and Production",
  map: "Why a runbook · before you start · settings · preflight · rollback first · staged enable · smoke test · evidence · go/no-go · production",
  slides: [
    {
      say: `Welcome to the last chapter of Building Global Secure Access, Chapter 9: deploying to test and production. The labs proved the code on fixtures and in a test tenant. This runbook moves the rollout itself: one ring at a time, logs first, emergency access checked before anything changes, every change from a plan a second person approved, and a go or no-go from measured values. It hasn't been run against a live tenant; the output you'll see is the kit's fixture mode, run on November 17, 2026.`,
      detail: `A runbook, not a code chapter: it has no labs of its own. It runs Chapters 02 to 08's entry scripts and the kit's deploy/ scripts in the order of the guide's Step 11 rings: settings per environment, preflight, Stage 1 in a live test tenant (staged enable, smoke test, rollback rehearsed), the go/no-go, Stage 2 in production ring by ring, and the evidence each stage must hold. Not yet run against a live tenant. The output shown is the kit's fixture mode, run on November 17, 2026.`,
      cite: [],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why a runbook, and what comes first",
      body: [
        { lead: "Logs first, emergency access checked first, every change from an approved plan, and Go only on measured values." },
        { table: { head: ["Before you start", "From"], w: [8.2, 3.95], rows: [
          ["Every Lab 2 run in a test tenant; findings fixed or recorded", "Chapters 01–08"],
          ["Decision records approved for every function the ring enables", "Chapter 01"],
          ["The network diagnostic setting exists", "Chapter 02"],
          ["Emergency access accounts and their group, tested", "Building Privileged Access"],
          ["Microsoft's break-glass scripts staged and rehearsed; the date in the ring record", "Chapter 08"],
          ["The change record open: a new traffic profile is a major change", "Learn, operations"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Common operations (change categories). Chapter 09, “Before you start.”",
      say: `Why a runbook? Because the order is the safety. Before you start: every chapter's Lab 2 has run in a test tenant, with its findings fixed or recorded. The decision records are approved for every function the ring enables. The network diagnostic setting exists. The emergency access accounts exist and have been tested, from Building Privileged Access. Microsoft's break-glass scripts for compliant network outages are staged and rehearsed. And the change record is open, because Learn treats enabling a new traffic profile as a major change for the change advisory board. Roles are activated through privileged identity management for the window only.`,
      detail: `Before you start: Chapters 01 to 08's Lab 2s have been run in a test tenant, and their findings fixed or recorded. The decision records (Chapter 01) are approved for every function the first ring enables. The network diagnostic setting exists (Chapter 02); the preflight fails without it. The emergency access accounts and their group exist and have been tested (Book 04, Chapter 04; Building Privileged Access, Chapter 02). Microsoft's break-glass scripts for compliant network outages are staged and rehearsed, and the date is in the ring record. The change record is open; enabling a new traffic profile is a major change for the change advisory board, as Learn categorizes it. Roles are activated through PIM for the change window only: Global Secure Access Administrator, Conditional Access Administrator and, for assignments, Application Administrator.`,
      cite: ["gsa09-ops"],
      ref: "“Before you start”",
    },
    {
      part: "What", title: "One settings file per environment",
      body: [
        { code: [
          "Copy-Item deploy/settings.template.json settings.test.json",
          "Copy-Item deploy/settings.template.json settings.production.json",
        ], label: "Step 1: one copy per environment, every placeholder filled", pt: 12 },
        { cols: [[{ bullets: [
          "The tenant, the ring, the groups (pilot, emergency, administrators, next ring)",
          "The Intune application IDs, the security profile, the workspace",
          "The in-scope device count from Intune; minimum client and connector versions",
          "The acceptable-use categories and the authentication CAs",
        ], label: "What each file names", color: "navy", pt: 12.5 }], [{ bullets: [
          "A secret-like value",
          "A placeholder left in a test or production file",
          "An unknown cloud: gcc or global only, no default",
        ], label: "Read-GsaSettings refuses", color: "red", pt: 12.5 }]] },
      ],
      sources: "Sources: examples/global-secure-access (deploy/settings.template.json, Read-GsaSettings). Chapter 09, Step 1.",
      say: `Step 1 is one settings file per environment, copied from the template, with every placeholder filled: the tenant, the ring, the groups, the Intune application IDs, the security profile, the workspace, the in-scope device count from Intune, the minimum versions, the acceptable-use categories, and the authentication authorities. The settings hold names and IDs only; the operator signs in as a person. The kit refuses a file with anything that looks like a secret, a test or production file with a placeholder left in it, and any cloud but GCC or global. Everything after this is the same command for both stages; only the file, the evidence folder and the tenant change.`,
      detail: `Step 1: Copy-Item deploy/settings.template.json settings.test.json; Copy-Item deploy/settings.template.json settings.production.json. Fill every placeholder: the tenant, the ring, the groups (pilot, emergency, administrators, the next ring), the Intune application IDs, the security profile, the workspace, the in-scope device count from Intune, the minimum client and connector versions, the acceptable-use categories and the authentication CAs. Read-GsaSettings refuses a file with a secret-like value, and, for test and production, any placeholder left in it. The settings hold names and IDs only; the operator signs in as a person. File both copies with the change record. Everything below is the same command for both stages; only the settings file, the evidence folder and the tenant change.`,
      cite: [],
      ref: "Step 1: One settings file per environment",
    },
    {
      part: "What", title: "Preflight: six checks before anything changes",
      body: [
        { table: { head: ["Check", "What it requires"], w: [1.6, 10.55], rows: [
          ["PF-01", "The settings file names this stage"],
          ["PF-02", "The collection matches its manifest and was read in the settings' tenant"],
          ["PF-03", "The emergency access group is excluded from every NET- Conditional Access policy"],
          ["PF-04", "The gsa-network-telemetry diagnostic setting exists: logs before the ring"],
          ["PF-05", "Every function the desired state enables has an approved decision"],
          ["PF-06", "Production only: the test stage's evidence passes -Check -Stage test"],
        ] }, pt: 13 },
        { callout: "a preflight failure stops the stage. The pilot fixture fails PF-03: its Finance policy doesn't exclude the emergency group (Chapter 06).", label: "Stop: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: examples/global-secure-access (deploy/Test-GsaPreflight.ps1). Chapter 09, Step 2.",
      say: `Step 2 signs in to the stage's tenant, collects, and runs the preflight, which only reads. Six checks. The settings file names this stage. The collection matches its manifest and was read in the right tenant. The emergency access group is excluded from every network policy in the tenant, not just the ones in the plan. The network diagnostic setting exists, so logs come before the ring. Every function the desired state enables has an approved decision. And in production, the test stage's evidence passes. Any failure stops the stage; the pilot fixture fails the emergency check, because of the Finance policy from Chapter 6.`,
      detail: `Step 2: Connect-MgGraph -Environment Global -TenantId <tenant-id> with NetworkAccess.Read.All, Policy.Read.All, Directory.ReadWrite.All, LicenseAssignment.Read.All, NetworkAccessPolicy.Read.All; az login --tenant <tenant-id>; ./Invoke-GsaCollect.ps1 -SettingsPath settings.test.json -OutputPath out/deploy-test/collect -AllowUnverified; ./deploy/Test-GsaPreflight.ps1 -SettingsPath settings.test.json -Stage test -CollectionPath out/deploy-test/collect -InputsPath <inputs-folder> -DesiredPath <desired-file> -OutputPath out/deploy-test/preflight. PF-01 the settings file names this stage; PF-02 the collection matches its manifest and was read in the settings' tenant; PF-03 the emergency access group is excluded from every NET- Conditional Access policy in the tenant; PF-04 the gsa-network-telemetry diagnostic setting exists; PF-05 every function the desired state enables has an approved decision; PF-06 production only: the test stage's evidence passes -Check -Stage test. A preflight failure stops the stage. The pilot fixture fails PF-03, because its Finance policy doesn't exclude the emergency group (Chapter 06).`,
      cite: [],
      ref: "Step 2: Collect and preflight",
    },
    {
      part: "Who", title: "Who does each step",
      body: [
        { table: { head: ["Role", "In the runbook"], w: [3.6, 8.55], rows: [
          ["Platform owner", "Fills the settings, collects, plans, applies, does the manual steps"],
          ["Second person (change board)", "Approves each plan's and each rollback's SHA-256"],
          ["Policy owner", "Approves decision records and the desired state; passes -AllowEnforce"],
          ["Technical program manager", "Runs the rings; keeps the ring record"],
          ["Service owner", "Approves each ring's exit"],
          ["ISSO", "Keeps each stage's evidence folder, inside the boundary"],
        ] }, pt: 13 },
      ],
      sources: "Sources: Chapter 09, Steps 1–9 and “Federal requirements”; guide, RACI.",
      say: `Who does what? The platform owner fills the settings, collects, plans, applies, and does the manual portal steps. A second person, from the change board, approves each plan's hash and each rollback's. The policy owner approves the decision records and the ring's desired state, and passes the enforce switch when a policy's report-only period is clean. The technical program manager runs the rings and keeps the ring record, and the service owner approves each exit. The security officer keeps each stage's evidence folder, inside the boundary. No one approves their own change.`,
      detail: `From the runbook: each ring's plan hash approved by someone other than the person who applied it; -AllowEnforce only for a ring whose desired state enforces a policy that has passed its report-only period (Chapter 05), passed by the policy owner; the policy owner approved the production decision records and the ring's desired state; the change advisory board approved the change. The technical program manager runs the waves; the service owner approves each exit (the guide's Step 11 how-section). Evidence owners: the preflight (the ISSO), the plan (the change record), the smoke test (the technical program manager; the service owner approves), the rollback (the change record), the evidence (the ISSO).`,
      cite: [],
      ref: "Steps 1–9; “Federal requirements and evidence”; “Checklist”",
    },
    {
      part: "How", title: "Preflight and the rollback, fixture mode",
      body: [
        { code: [
          "PF-01  Pass  settings environment 'test', stage 'test'; ring ring1",
          "PF-02  Pass  18 files match the manifest; tenant 11111111-1111-4111-8111-111111111111",
          "PF-03  Pass  emergency group excluded from all 5 NET- policies",
          "PF-04  Pass  gsa-network-telemetry exists",
          "PF-05  Pass  every enabled function has an approved decision",
        ], label: "Step 2 preflight (fixture, Nov 17, 2026)", pt: 11 },
        { code: [
          "RB-01      WouldApply  PATCH Step 7: NET-CN-Require-Compliant-Network-Pilot enabled -> report-only",
          "RB-02      WouldApply  PATCH Step 6: NET-PA-PA-Finance-Device-MFA enabled -> report-only",
          "RB-03      WouldApply  PATCH Step 5: NET-IA-SecurityProfile-Pilot enabled -> report-only",
          "RB-04      WouldApply  PATCH Step 8: universal tenant restrictions tagging disabled (the TRv2 policy stays)",
          "MAN-GROUPS Manual      Portal: remove the ring's groups from the traffic profiles' user and group assignments",
          "MAN-VPN    Manual      Agency change: restore the VPN route for the affected applications",
        ], label: "Step 3 rollback planned before the ring (fixture; the two MAN-LINK lines left out)", pt: 11 },
      ],
      sources: "Sources: examples/global-secure-access (fictional ring 1 fixture). Chapter 09, Steps 2–3, fixture output.",
      say: `Here's the fixture run, the fictional tenant at ring 1. The preflight passes all five test-stage checks: the right stage, a collection that matches its manifest in the right tenant, the emergency group excluded from all five network policies, the diagnostic setting, and approved decisions. Step 3 plans the rollback for the state the ring starts from, before the ring starts: three enforced policies to report-only in the guide's order, tagging off with the tenant restrictions policy kept, then the manual steps. It's reviewed, its hash filed, and it's applied only if a backout trigger fires.`,
      detail: `Fixture mode, November 17, 2026 (tests/fixtures/settings.test.json and tests/fixtures/ring1). Preflight: PF-01 Pass settings environment 'test', stage 'test'; ring ring1; PF-02 Pass 18 files match the manifest; tenant 11111111-1111-4111-8111-111111111111; PF-03 Pass emergency group excluded from all 5 NET- policies; PF-04 Pass gsa-network-telemetry exists; PF-05 Pass every enabled function has an approved decision; Preflight (test): 5 checks, 0 failed. Step 3: ./deploy/Invoke-GsaRollback.ps1 -SettingsPath settings.test.json -CollectionPath out/deploy-test/collect -OutputPath out/deploy-test/rollback: RB-01 to RB-04 WouldApply; MAN-LINK (two, left out of the slide), MAN-GROUPS, MAN-VPN Manual; Plan SHA-256 77609a56...; Dry run: nothing changed.`,
      cite: [],
      ref: "Steps 2–3 (fixture-mode output)",
    },
    {
      part: "How", title: "Staged enable, then the smoke test",
      body: [
        { steps: [
          { title: "Plan the ring from its reviewed desired state", text: "A second person approves the plan's SHA-256" },
          { title: "Apply with the approved hash", text: "-AllowEnforce only when a policy's report-only period is clean" },
          { title: "Do the manual steps", text: "Each MAN-ASSIGN: Traffic forwarding > the profile > User and group assignments > Add; widen the Intune client assignment" },
          { title: "After the exit period, collect and run the smoke test", text: "Every area's checks and the ring exit criteria; Go only if nothing fails" },
        ], pt: 12.5 },
        { code: [
          "Checks: 100 run, 0 fail",
          "RX-01 time in ring                             Pass  10 business days since 2026-11-16 (needs 10)",
          "RX-05 report-only results clean                Pass  0 report-only failures carried by the service; ...",
          "RX-07 emergency exclusion tested at ring start Pass  tested 2026-11-16; ring started 2026-11-16",
          "Ring ring1: Go. Written to out/deploy-test/smoke",
        ], label: "Step 5 smoke test (fixture, Nov 17, 2026; RX-02 to -04, -06 and -08 left out, all Pass)", pt: 10.5 },
      ],
      sources: "Sources: examples/global-secure-access (Invoke-GsaPlan.ps1, deploy/Invoke-GsaSmokeTest.ps1). Chapter 09, Steps 4–5.",
      say: `Step 4 is the staged enable. Plan the ring from its reviewed desired state, have a second person approve the hash, and apply it. Pass the enforce switch only for a policy whose report-only period was clean. Then do the plan's manual steps: assign the ring's group to each profile in the portal, and widen the Intune client assignment in the same change. Step 5 comes after the ring's exit period: collect again and run the smoke test. It runs every area's checks and the ring exit criteria. In the fixture at ring 1, a hundred checks run, none fail, every criterion passes, and the ring says go. Then run the guide's own Validate steps for the ring's group.`,
      detail: `Step 4: ./Invoke-GsaPlan.ps1 -SettingsPath settings.test.json -CollectionPath out/deploy-test/collect -DesiredPath <desired-file> -OutputPath out/deploy-test/plan; then the same with -Apply -ApprovedSha256 <plan-sha256>. For each MAN-ASSIGN line: Microsoft Entra admin center > Global Secure Access > Connect > Traffic forwarding > the profile > User and group assignments > View > Add user/group. The client reaches the ring through its Intune assignment (the guide's Step 3.2), widened in the same change. Rings: 0 the implementing team; 1 the pilot of fewer than 20 users; 2 about 10% including one branch; 3 everyone in waves. Step 5, after the exit period (10 business days for rings 0 and 1, 20 for rings 2 and 3): ./Invoke-GsaCollect.ps1 -OutputPath out/deploy-test/after -AllowUnverified; ./deploy/Invoke-GsaSmokeTest.ps1 -CollectionPath out/deploy-test/after -InputsPath <inputs-folder> -OutputPath out/deploy-test/smoke. Fixture: Checks: 100 run, 0 fail; RX-01 to RX-08 Pass; Ring ring1: Go. The same command on the pilot fixture says No-go and exits 1. Run the guide's Validate steps for the ring's group as well: the smoke test reads configuration and logs, not what a user sees.`,
      cite: [],
      ref: "Steps 4–5",
    },
    {
      part: "How", title: "Roll back on a trigger; record the evidence",
      body: [
        { cols: [[{ bullets: [
          "Sign-in failures above the baseline",
          "Help desk calls above the agreed threshold",
          "A mission application unreachable",
          "TLS failure share above 1%",
          "Apply Step 3's plan with its hash; manual steps in order; collect again",
          "Stage 1: rehearse it once",
        ], label: "Step 6: backout triggers", color: "red", pt: 12 }], [{ code: [
          "SUMS            Pass  39 files match SHA256SUMS",
          "CHAIN           Pass  5 records, chain unbroken",
          "STEP-PRE        Pass  a passing record covers it",
          "STEP-BASELINE   Pass  a passing record covers it",
          "STEP-PLAN       Pass  a passing record covers it",
          "STEP-SMOKE      Pass  a passing record covers it",
          "STEP-RB         Pass  a passing record covers it",
        ], label: "Step 7: -Check -Stage test (fixture)", pt: 10.5 }]], split: 0.46 },
        { lead: "Production's evidence must also hold TELEMETRY: the telemetry check passing and CISA telemetry agreed." },
      ],
      sources: "Sources: examples/global-secure-access (Invoke-GsaRollback.ps1, Invoke-GsaEvidence.ps1). Chapter 09, Steps 6–7.",
      say: `Step 6: backout triggers are set before each ring, for example sign-in failures above the baseline, help desk calls above the threshold, a mission application unreachable, or TLS failures above one percent. When one fires, apply Step 3's rollback with its approved hash, do its manual steps in order, and collect again so the evidence shows the state after it. In Stage 1, rehearse it once. Step 7 records every run of the stage and checks the stage's evidence. In the fixture, every file matches, five records form a chain, and each step the test stage needs has a passing record. Production also needs the telemetry step, with CISA telemetry agreed.`,
      detail: `Step 6: backout triggers are set before each ring: a sign-in failure rate above the baseline, help desk calls above the agreed threshold, a mission application unreachable, or a TLS failure share above 1%. When one fires: ./deploy/Invoke-GsaRollback.ps1 ... -Apply -ApprovedSha256 <rollback-sha256>, then its manual steps in order. In Stage 1, rehearse it once: apply the rollback in the test tenant, confirm the policies are report-only and tagging is off, then re-apply Step 4's plan. Signaling stays on; turn it off only in a separate change, with -DisableSignaling, after no policy depends on it. After any rollback, collect again. Step 7: foreach run of preflight, collect, plan, smoke, rollback: ./Invoke-GsaEvidence.ps1 -EvidencePath <evidence-test> -RunPath out/deploy-test/<run> -ChangeRecord <change-record>; then -Check -Stage test. Fixture: SUMS Pass 39 files; CHAIN Pass 5 records; STEP-PRE, STEP-BASELINE, STEP-PLAN, STEP-SMOKE, STEP-RB Pass. Stage requirements: test PRE, BASELINE, PLAN, SMOKE, RB; production PRE, BASELINE, TELEMETRY (the telemetry check passing, CISA telemetry agreed), PLAN, SMOKE.`,
      cite: [],
      ref: "Steps 6–7",
    },
    {
      part: "How", title: "Go/no-go, then production ring by ring",
      body: [
        { cols: [[{ bullets: [
          "The test stage's evidence passes; PF-06 re-checks it",
          "The test tenant said Go; the rollback was rehearsed",
          "Policy owner approved the production records and desired state; the board approved the change",
          "CISA telemetry agreed before ring 3",
        ], label: "Step 8: production starts only when", color: "navy", pt: 12.5 }], [{ code: [
          "PF-01  Pass  ... stage 'production'; ring ring1",
          "PF-03  Pass  emergency group excluded from all 5",
          "             NET- policies",
          "PF-06  Pass  the test stage's evidence passes",
          "",
          "Preflight (production): 6 checks, 0 failed.",
        ], label: "Step 9 production preflight (fixture; cut to fit)", pt: 10.5 }]], split: 0.47 },
        { lead: "Each later ring: change the ring in the settings, use its desired state, widen the assignments; remove a VPN route only after 10 business days with no traffic." },
      ],
      sources: "Sources: examples/global-secure-access (deploy/Test-GsaPreflight.ps1). Chapter 09, Steps 8–9.",
      say: `Step 8 is the go or no-go for production. It starts only when the test stage's evidence passes, which the production preflight re-checks; the test tenant said go and the rollback was rehearsed; the policy owner approved the production records and desired state, and the change board approved the change; and CISA telemetry is agreed before ring 3 retires the VPN's web path. Step 9 repeats Steps 2 to 7 in production, one ring at a time. Its preflight takes the test evidence, and in the fixture all six checks pass. For each later ring, change the ring, use its desired state and widen the assignments. Remove a VPN route only after ten business days with no traffic on it.`,
      detail: `Step 8: production starts only when the test stage's evidence check passes (-Check -Stage test, which the production preflight's PF-06 re-checks); the test tenant's smoke test said Go for the ring, and the rollback was rehearsed; the policy owner approved the production decision records and the ring's desired state, and the change advisory board approved the change; CISA telemetry is agreed with the TIC delegates before ring 3, which retires the VPN's web path. Step 9: repeat Steps 2 to 7 with settings.production.json, out/deploy-prod/... and <evidence-production>. ./deploy/Test-GsaPreflight.ps1 -SettingsPath settings.production.json -Stage production ... -TestEvidencePath <evidence-test>. Fixture: PF-01 to PF-06 Pass; Preflight (production): 6 checks, 0 failed. For each ring after the first, change ring in the settings file, use the ring's desired-state file, and widen the Intune client assignment and the profile assignments. Remove a migrated application's VPN route only after the VPN's own logs show no traffic for it for 10 business days. After each ring, re-run the Zero Trust Assessment and update each network finding's closure register entry (Chapter 08). Disconnect-MgGraph at the end of each window.`,
      cite: [],
      ref: "Steps 8–9",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the stage's evidence proves", "Supports", "KSI"], w: [7.0, 2.6, 2.55], rows: [
          ["Logs and the emergency exclusion in place first (preflight)", "CM-4; CP-2", "CMT-VTD"],
          ["Each change planned, approved by hash, applied in order", "CM-3, CM-4", "CMT-LMC, CMT-VTD"],
          ["The ring exited on measured criteria (smoke test)", "CM-3, CM-4", "CMT-LMC, CMT-VTD"],
          ["The rollback planned and rehearsed in the guide's order", "CP-2, CM-3", "CMT-LMC"],
          ["Every run hashed and chained", "AU-9, AU-6", "MLA-OSM, MLA-RVL"],
        ] }, pt: 11.5 },
        { cols: [[{ bullets: [
          "A ring before its logs: PF-04",
          "A policy catching emergency accounts: PF-03",
          "Unattended beta runs: app-only sessions refused",
        ], label: "Dangers and guards", color: "red", pt: 12 }], [{ bullets: [
          "Preflight passed; PF-06 for production",
          "Rollback reviewed and rehearsed",
          "Every hash approved by someone else",
        ], label: "Done when", color: "teal", pt: 12 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 09, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `The stage's evidence supports impact analysis and contingency planning for the preflight, configuration change control for the plans and the ring exits, the contingency plan for the rehearsed rollback, and protection of audit information for the chain. The assessor decides the controls. The dangers: changing a ring before its logs exist, a policy that catches the emergency accounts, a plan applied that differs from the one reviewed, an improvised rollback, production before the test evidence is complete, and unattended runs of the beta API. You're done when every stage's preflight passed, the rollback was reviewed and rehearsed, and every hash was approved by someone else. That's the end of Building Global Secure Access. Thanks for watching.`,
      detail: `Requirements: logs and the emergency exclusion in place before any change (preflight): CM-4; CP-2; KSI-CMT-VTD. Each change planned, approved by its hash and applied in order (plan): CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-VTD. The ring exited on measured criteria (smoke test): CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-VTD. The rollback planned and rehearsed in the guide's order: CP-2, CM-3; KSI-CMT-LMC. Every run hashed and chained: AU-9, AU-6; KSI-MLA-OSM, KSI-MLA-RVL. The kit's records support these controls; the agency's assessor decides them. KSIs are FedRAMP 20x indicators for cloud service providers. Dangers: a ring changed before its logs exist (PF-04); a new policy that catches the emergency accounts (PF-03; the plan refuses the file); a plan applied that differs from the one reviewed (-ApprovedSha256 must equal the file's hash); rollback improvised during an incident (the plan from Step 3, signaling last); production before the test evidence is complete (PF-06); unattended runs of the beta API (the live reader refuses an app-only session). Checklist: one filled settings file per environment, filed; the preflight passed, PF-06 too for production; the rollback reviewed before the ring and rehearsed in Stage 1; each plan hash approved by someone other than the person who applied it; each smoke test said Go and the guide's Validate steps passed; the stage's evidence check passes, inside the boundary.`,
      cite: [],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
