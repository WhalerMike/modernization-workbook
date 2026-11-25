// Building Global Secure Access, Chapter 01 — Decision, Licensing and GCC Availability: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/01-decision-licensing-and-gcc-availability.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-01-decision-licensing-gcc/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 1, dir: __dirname,
  base: "DW_GSA_01_Decision_Licensing_GCC",
  title: "Decision, Licensing and GCC Availability",
  map: "Why a decision record · what Learn gives and leaves · the calls · the GCC table · the checks · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to the Federal Modernization Workbook's developer workbook, Building Global Secure Access. This is Chapter 1: the decision, licensing, and availability in GCC. A network control is adopted by a written decision with exit criteria, not by turning on a toggle, so the first code reads what the tenant holds and checks the decision against it. We'll start from what Microsoft Learn says, see what it leaves to you, read the kit's call list, its availability table and nine checks, and walk two labs. One note before we begin: this chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The chapter is the code behind the guide's Step 1, Decision and licensing, and its GCC and licensing table. It starts with what Microsoft Learn gives: the product-wide GCC statement, the license each function needs, and two Graph reads. Then the kit's call list, its copy of the availability table with an interim path for every preview feature, and the decision checks GSA-DEC-01 to -09. Lab 1 runs them on a fictional tenant's pilot and again two weeks later. Lab 2 runs the same reads in a test tenant.`,
      cite: ["gsa01-limits", "gsa01-overview"],
      ref: "“In this chapter”; “Goal and audience”",
    },
    {
      part: "Why", title: "Why the decision comes first",
      body: [
        { lead: "A network control is adopted by a written decision with exit criteria, not by turning on a toggle." },
        { cols: [[{ bullets: [
          "Read the tenant's licenses and onboarding state with the **least-privileged permissions**",
          "Keep one decision record per function: Microsoft traffic, internet, private, branch",
          "Show an assessor each record is current, licensed, approved and **honest about GCC**",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The policy owner who signs the decision records",
          "The ISSO who keeps them",
          "Read PowerShell 7; no tenant until Lab 2",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 01, opening, “In this chapter,” “Goal and audience.”",
      say: `Why start with a decision? Because each function of Global Secure Access has its own gate: the Microsoft traffic profile comes with Entra ID P1, while Internet Access and Private Access are licensed separately. So the goal is concrete. By the end you can read the tenant's licenses and onboarding state with the least-privileged permissions, keep one decision record for each of the four functions, and show an assessor that each record is current, licensed, approved, and honest about what GCC does and doesn't state. It's for the developers, the policy owner who signs the records, and the security officer who keeps them.`,
      detail: `Goal: read a tenant's licenses and Global Secure Access onboarding state with the least-privileged permissions, keep one decision record per function (Microsoft traffic, internet, private, branch) as reviewed JSON, and show an assessor that each record is current, licensed, approved and honest about GCC. Audience: developers who build or maintain the kit, the policy owner who signs the decision records, and the ISSO who keeps them. You should read PowerShell 7. You don't need a tenant until Lab 2.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["GCC availability", "Global Secure Access is available in GCC, for the product as a whole; no feature page narrows or widens it"],
          ["Licenses", "Microsoft traffic with Entra ID P1 or P2; Internet Access and Private Access separately, or the Entra Suite"],
          ["GET /subscribedSkus (v1.0)", "LicenseAssignment.Read.All, delegated or application; Global Reader, Directory Readers"],
          ["GET /networkAccess/tenantStatus (beta)", "onboardingStatus; NetworkAccessPolicy.Read.All, delegated only"],
          ["Endpoints", "Both on the global service, graph.microsoft.com, which GCC uses"],
        ] }, pt: 13 },
      ],
      sources: "Sources: Learn, Known limitations; What is Global Secure Access?; List subscribedSkus; Get tenantStatus; national cloud deployments.",
      say: `Here's Microsoft's starting point. Learn's known limitations page says Global Secure Access is available in GCC, for the product as a whole; no feature page narrows or widens that, so a preview feature's GCC availability is not yet specified. Learn names the licenses: the Microsoft traffic profile with Entra ID P1 or P2, and Internet Access and Private Access separately, or through the Entra Suite. Two Graph reads tell you what the tenant holds: the subscribed SKUs, with License Assignment Read All, and the tenant status on the beta endpoint, with Network Access Policy Read All. Both live on the global service, which GCC uses.`,
      detail: `Learn's known limitations page states, for the whole product, that Global Secure Access is available in the US Government Community Cloud (GCC); no feature page the guide read narrows or widens that, so a preview feature's GCC availability is not yet specified. Learn's overview: the Microsoft traffic profile comes with Microsoft Entra ID P1 or P2, while Internet Access and Private Access are licensed separately or through the Microsoft Entra Suite. GET /subscribedSkus (v1.0): LicenseAssignment.Read.All least privileged, delegated or application. GET /networkAccess/tenantStatus (beta): onboardingStatus, NetworkAccessPolicy.Read.All, delegated only. Both are available on the global service, which GCC uses.`,
      cite: ["gsa01-limits", "gsa01-overview", "gsa01-skus", "gsa01-status", "gsa01-deployments"],
      ref: "“Start with Microsoft's documentation” — “What Microsoft gives you”",
    },
    {
      part: "What", title: "What it leaves to you, and the verdict",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.4, 3.4, 5.35], rows: [
          ["One GCC sentence for the product", "Nothing per feature; previews are silent", "config/availability.json: each feature's GCC state, license, stage, step, and an interim path"],
          ["License names, no plan IDs", "A script can't match by ID", "The record names the SKU part number; GSA-DEC-04 compares counts"],
          ["A beta onboarding read", "Beta APIs are subject to change", "Beta calls marked; the live reader refuses an app-only session"],
          ["Nothing about the decision", "The guide's record is YAML in a page", "A JSON template, read from an inputs folder, and nine checks"],
        ] }, pt: 12 },
        { lead: "Verdict: keep Learn's statements and reads as they are; build the table, the record and its checks." },
      ],
      sources: "Sources: Learn, Known limitations; overview; Get tenantStatus (beta notice). Chapter 01, “What it leaves to you.”",
      say: `What does Learn leave to you? One GCC sentence covers the whole product, so nothing says anything per feature, and preview features are silent. License names come without service plan identifiers, so a script can't match a license by ID. The onboarding read is beta, and beta APIs are subject to change. And nothing covers the decision itself. So the kit adds an availability table, one row per feature with an interim path where GCC isn't stated; a decision record that names the SKU the agency reads from its own export; and nine checks. The verdict: keep Learn's statements as they are, and build what it leaves.`,
      detail: `Each row is pinned by a test in the Chapter 01 block of tests/GlobalSecureAccess.Tests.ps1. One sentence on GCC for the whole product: config/availability.json, the guide's table, one row per feature, with gcc (available or not yet specified), the license, the release stage, the step and, for every feature that isn't available, the guide's interim path. License names but no service plan identifiers: the decision record names the SKU part number the agency reads from its own export; GSA-DEC-04 compares the count with license_needed. A beta read of the onboarding state: the call list marks every beta call; the live reader refuses an app-only session, so the beta API runs interactively. Nothing about the decision: templates/decision-record.template.json, read from an inputs folder, and nine checks.`,
      cite: ["gsa01-limits", "gsa01-beta"],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "GCC: the features Learn doesn't state",
      body: [
        { table: { head: ["Feature (preview)", "Interim path the kit expects"], w: [4.6, 7.55], rows: [
          ["Client on registered devices", "Joined or hybrid joined devices only"],
          ["Cloud firewall for clients", "Block QUIC, outbound UDP 443, with an Intune-delivered Windows Firewall rule"],
          ["Explicit Forward Proxy", "Client acquisition only; a PAC file excludes what the client tunnels"],
          ["HTTP method filtering", "Category and FQDN filtering in security profiles"],
          ["Custom Private Access profiles", "Per-app applications in the one Private Access profile"],
          ["Enriched log categories", "Not exported without a decision record"],
        ] }, pt: 12.5 },
        { callout: "a decision that uses one of these without an approved exception fails GSA-DEC-07, and the finding names the interim path.", label: "In the kit: ", icon: "FaCloud", color: "teal" },
      ],
      sources: "Sources: Learn, Known limitations. Chapter 01, “The availability table”; guide, “GCC and licensing, feature by feature.”",
      say: `This is where GCC matters. Because Learn's sentence covers the product, every preview feature's GCC availability is not yet specified, and the kit's table lists them with the guide's interim path. Registered devices: use joined or hybrid joined devices. The cloud firewall for clients: block QUIC with an Intune-delivered Windows Firewall rule. The Explicit Forward Proxy: acquire with the client only. HTTP method filtering: filter by category and name. Custom Private Access profiles: per-app applications. Enriched log categories: not exported without a decision. A decision that uses one without an approved exception fails, and the finding says what to do instead.`,
      detail: `Get-GsaAvailability -NotAvailable lists the features whose GCC availability isn't stated, each with its interim path: client on Microsoft Entra registered devices (preview): joined or hybrid joined devices only. Cloud firewall for clients (preview): block QUIC (outbound UDP 443) with an Intune-delivered Windows Firewall rule (the guide's Step 5.6). Explicit Forward Proxy (preview): client acquisition only; a PAC file excludes everything the client tunnels. Source traffic type and HTTP method filtering (preview): category and FQDN filtering in security profiles. Custom Private Access profiles (preview): per-app applications in the one Private Access profile. Enriched Microsoft 365 and generative AI log categories (preview): not exported without a decision record. Intelligent Local Access and AI gateway prompt injection protection (preview): not adopted; a Zero Trust Assessment test against them is not applicable, with the decision record as exception evidence. Microsoft 365 GCC Moderate only.`,
      cite: ["gsa01-limits"],
      ref: "“The code” — “The availability table”",
    },
    {
      part: "What", title: "The nine decision checks",
      body: [
        { table: { head: ["Check", "What it looks for"], w: [2.2, 9.95], rows: [
          ["GSA-DEC-01", "onboardingStatus is onboarded"],
          ["GSA-DEC-02", "One record for each of the four functions"],
          ["GSA-DEC-03", "The availability quote was read within 30 days of the run"],
          ["GSA-DEC-04", "For adopt or coexist, the named SKU has at least license_needed enabled units"],
          ["GSA-DEC-05, -08, -09", "An approver and approval date; exit criteria; a review date within 12 months"],
          ["GSA-DEC-06", "For retain-current or defer, at least one compensating control"],
          ["GSA-DEC-07", "Each preview feature used has an approved exception; otherwise the fix is the interim path"],
        ] }, pt: 13 },
      ],
      sources: "Sources: examples/global-secure-access (Test-GsaDecision). Chapter 01, “The decision checks.”",
      say: `Here are the nine checks Test-Gsa-Decision runs on the collection and the records. The tenant is onboarded. There's one record for each of the four functions. Each availability quote was read on Learn within thirty days. An adopted function has enough licenses for the pilot and the first ring. Each record has an approver, exit criteria and a review date within a year. A deferred or retained function names what protects it meanwhile. And any preview feature has an approved exception, or the finding names the interim path. The checks only read files; the policy owner still signs.`,
      detail: `Test-GsaDecision reads the collection and the decision records (inputs/decisions/*.json) and returns: GSA-DEC-01 onboardingStatus is onboarded; GSA-DEC-02 one record for each of the four functions; GSA-DEC-03 the availability quote was read within 30 days of the run; GSA-DEC-04 for adopt or coexist, the named SKU has at least license_needed enabled units; GSA-DEC-05 an approver and an approval date; GSA-DEC-06 for retain-current or defer, at least one compensating control; GSA-DEC-07 each preview feature used has an approved exception, otherwise the finding's fix is the interim path; GSA-DEC-08 exit criteria; GSA-DEC-09 a review date within 12 months.`,
      cite: [],
      ref: "“The code” — “The decision checks”",
    },
    {
      part: "Who", title: "Who signs, who reads, with what",
      body: [
        { cols: [[{ bullets: [
          "**Policy owner**: signs each decision record and approves exceptions",
          "**Developers**: build and maintain the kit and its tests",
          "**ISSO**: keeps the records, the license export and the run folders",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "licenses: LicenseAssignment.Read.All, v1.0",
          "tenant-status: NetworkAccessPolicy.Read.All, beta, delegated only",
          "Global Reader is enough for both",
          "The guide's Step 1.1 now connects with the same least-privileged permissions",
        ], label: "The reader holds", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Learn, List subscribedSkus; Get tenantStatus. Chapter 01, “The calls,” “Verified facts,” Lab 2 step 1.",
      say: `Who is involved? The policy owner signs each decision record and approves any exception. Developers build and maintain the kit. The security officer keeps the records, the license export and the run folders. And the reader holds very little: License Assignment Read All for the licenses, on version 1.0, and Network Access Policy Read All for the tenant status, on beta, delegated only. Global Reader is enough for both. And since November 18, the guide's step connects with these same two permissions; before, it used Organization Read All, a higher permission Learn also lists.`,
      detail: `Audience and evidence owners: the policy owner signs the decision records; the ISSO keeps them with the license export and run folders. config/calls.json: licenses, GET https://graph.microsoft.com/v1.0/subscribedSkus, LicenseAssignment.Read.All (Global Reader, Directory Readers); tenant-status, GET https://graph.microsoft.com/beta/networkAccess/tenantStatus, NetworkAccessPolicy.Read.All, delegated only (Global Reader, Global Secure Access Log Reader). Learn's own permission tables name LicenseAssignment.Read.All and NetworkAccessPolicy.Read.All as least privileged for these two reads. The kit follows Learn's tables, and since Nov 18, 2026, so does the guide's Step 1.1, which connected with Organization.Read.All and NetworkAccess.Read.All before (research gap 1, resolved). In live mode the reader sends nothing until Assert-GsaLiveContext has seen a Graph session in the Global environment, in the settings' tenant, signed in as a person.`,
      cite: ["gsa01-skus", "gsa01-status"],
      ref: "“The calls”; “Verified facts”; Lab 2, step 1",
    },
    {
      part: "How", title: "Lab 1: the reads, and the unstated features",
      body: [
        { terminal: "01-3" },
        { terminal: "01-4", lines: "1-6", label: "examples/global-secure-access  ·  fixture data  ·  real output (first rows)" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 01, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1 needs only PowerShell 7 with Pester, in the kit's folder, against one fictional tenant, contoso dot example, seen during its pilot and two weeks later. No tenant at all. Step 1 lists what the decision area reads: two calls, each with its least-privileged permission, one of them beta, both verified against their Learn pages. Step 2 lists the features whose GCC availability Learn doesn't state, each with the interim path the kit expects instead. The first rows are on the slide; the chapter shows them all.`,
      detail: `You need PowerShell 7.1 or later with Pester 5. Work in examples/global-secure-access. The fixtures are one fictional tenant, contoso.example: tests/fixtures/pilot on November 16, 2026, during its pilot, and tests/fixtures/ring1 two weeks later. Step 1: Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1; Get-GsaRequiredPermission -Area decision | Format-Table. Two calls: subscribedSkus on v1.0 with LicenseAssignment.Read.All, and tenantStatus on beta with NetworkAccessPolicy.Read.All. Step 2: Get-GsaAvailability -NotAvailable | Format-Table id, status, step, interim -Wrap.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: four failures in the pilot's records",
      body: [
        { terminal: "01-6", lines: "1,14-17,20-21,25-26" },
        { terminal: "01-7" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 01, “Lab 1,” steps 3–5.",
      say: `Step 3 reads the pilot tenant's licenses and onboarding state. Step 4 checks the four decision records, and finds four failures. The internet decision's availability quote is forty-six days old. Its SKU has twenty-five units for sixty users. It uses the cloud firewall for clients, a preview feature, with no exception. And the branch decision defers remote networks without naming what protects branches meanwhile. Step 5 reads the preview finding in full. Look at the fix: it isn't "enable the preview". It's the guide's interim path, a Windows Firewall rule delivered by Intune.`,
      detail: `Step 3: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -Area decision -OutputPath out/decision -AsOf 2026-11-16T12:00:00Z. Step 4: ./Invoke-GsaCheck.ps1 -Area decision ... -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-decision. decision: 23 checks (4 Fail, 19 Pass). GSA-DEC-03 Fail, NET-GSA-03: availability quote read 2026-10-01, 46 days before the run; GSA-DEC-04 Fail: FIXTURE-ENTRA-SUITE 25 enabled, 60 needed; GSA-DEC-07 Fail: uses cloud-firewall-clients (GCC: not yet specified; preview) with no approved exception; GSA-DEC-06 Fail, NET-GSA-04 (branch, defer): no compensating controls. Step 5: Import-Csv out/check-decision/findings.csv | Where-Object Id -EQ 'GSA-DEC-07' | Format-List Object, Detail, Fix. Fix: Interim path: Block QUIC (outbound UDP 443) with an Intune-delivered Windows Firewall rule, piloted first (the guide's Step 5.6); record it in the architecture record's quicBlock. (The passing rows are left out of the slide.)`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–5",
    },
    {
      part: "How", title: "Lab 1: two weeks later, every check passes",
      body: [
        { terminal: "01-8", lines: "1,22-26,28-33" },
        { terminal: "01-9" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 01, “Lab 1,” steps 6–7.",
      say: `Step 6 checks the same records two weeks later. The internet record was re-read on Learn and drops the preview feature, its SKU now has seventy-five units, and the branch record names its compensating controls: branch traffic stays on the current TIC path, and managed devices at branches keep the client. Every check passes. Step 7 runs this chapter's tests: thirteen passed, none failed. Then delete the output folder.`,
      detail: `Step 6: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -Area decision -OutputPath out/decision-ring1 -AsOf 2026-11-30T12:00:00Z, then ./Invoke-GsaCheck.ps1 -Area decision ... -InputsPath tests/fixtures/ring1/inputs -OutputPath out/check-decision-ring1. Every check passes. Step 7: Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Calls and availability*', 'Settings*', 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount: 13 passed, 0 failed. Delete out when you're done: Remove-Item -Recurse -Force out. (Only the end of the collection's output and the last check rows are on the slide.)`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–7; expected result",
    },
    {
      part: "How", title: "Lab 2: a test tenant",
      body: [
        { steps: [
          { title: "Sign in as a person", text: "Connect-MgGraph -Environment Global with LicenseAssignment.Read.All and NetworkAccessPolicy.Read.All; Global Reader is enough" },
          { title: "Run the guide's own reads", text: "Get-MgSubscribedSku and the tenantStatus request, as a cross-check" },
          { title: "Collect and check with the kit", text: "Your own decision records, on agency storage, never in this repository; the SKU counts match step 2" },
          { title: "Back it out", text: "The lab only reads: Disconnect-MgGraph, then delete or file the outputs" },
        ], pt: 13 },
        { callout: "a test tenant, never production. A tenant with no Global Secure Access licenses is a valid result: GSA-DEC-04 fails, which is the point. Not run by the authors.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, List subscribedSkus; Get tenantStatus. Chapter 01, “Lab 2: a test tenant.”",
      say: `Lab 2 moves to a test tenant, never production, and a tenant with no Global Secure Access licenses is a valid result. Sign in as a person with the two least-privileged permissions. Run the guide's own reads as a cross-check. Then collect and check with the kit, using your own decision records, kept on agency storage and never in this repository. The kit's license counts should match the guide's. If the tenant isn't onboarded, onboard it before any later chapter. The lab only reads, so backing it out is signing out and filing or deleting the outputs. The authors haven't run this lab.`,
      detail: `Placeholders: <tenant-id>, <settings-file> (your copy of deploy/settings.template.json with environment test and every placeholder filled), <inputs-folder> (your own decision records, from templates/decision-record.template.json, kept on agency storage). 1 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes "LicenseAssignment.Read.All","NetworkAccessPolicy.Read.All". 2 Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, Enabled; Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/tenantStatus". 3 ./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -Area decision -OutputPath out/decision-test; ./Invoke-GsaCheck.ps1 -Area decision ... -InputsPath <inputs-folder>. The kit's SKU counts match step 2's. If onboardingStatus isn't onboarded, onboard the tenant in the admin center before any later chapter. 4 Disconnect-MgGraph; Remove-Item the two output folders.`,
      cite: ["gsa01-skus", "gsa01-status"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "Who keeps it"], w: [6.6, 2.6, 2.95], rows: [
          ["Licenses and onboarding read with least privilege, hashed", "PL-2, SA-9", "ISSO"],
          ["Each function's decision current, licensed, approved, with exit criteria", "PL-2, SA-9, CA-3", "Policy owner signs; ISSO keeps"],
          ["A preview feature used only with an approved exception, or not at all", "SA-9", "Policy owner"],
        ] }, pt: 12 },
        { cols: [[{ bullets: [
          "A preview adopted because “the product is in GCC”: GSA-DEC-07",
          "A stale availability quote: GSA-DEC-03",
          "Beta reads in an unattended job: app-only sessions refused",
        ], label: "Dangers and guards", color: "red", pt: 12.5 }], [{ bullets: [
          "One record per function, on agency storage",
          "Quotes within 30 days; licenses cover pilot and ring 1",
          "No preview without an exception; the interim path in place",
        ], label: "Done when", color: "teal", pt: 12.5 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 01, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `What does the output prove? The license and onboarding reads, hashed, and the decision records support the system security plan and the control on external system services; the decision supports information exchange too. The guide maps no key security indicator to a decision record, and the kit doesn't invent one. The records support these controls; the assessor decides them. The dangers: adopting a preview because the product is in GCC, a stale availability quote, and beta reads in an unattended job, each with its guard. You're done when every function has a current, signed record, and no preview runs without its exception. Next, Chapter 2: the configuration export, and logs first.`,
      detail: `Requirements (config/requirements.json, from the guide's requirements table): licenses and onboarding state read with least privilege and hashed (raw/, manifest.json): PL-2, SA-9; not mapped to a KSI (the guide maps no indicator to a decision record). Each function's decision current, licensed, approved, with exit criteria and compensating controls (findings.json): PL-2, SA-9, CA-3; TIC 3.0 use case selection. A preview feature without a stated GCC availability used only with an approved exception (step 5): SA-9. The kit's records support these controls; the agency's assessor decides them. Dangers: a preview feature adopted because the product is available in GCC (GSA-DEC-07); an old availability quote (GSA-DEC-03; the Provider Notices guide routes Learn changes); reading licenses with Directory.Read.All (the call list names the least privilege); a deferred function with no protection (GSA-DEC-06); beta reads in an unattended job (the live reader refuses an app-only Graph session). Checklist: one record per function on agency storage; quotes dated within 30 days with Learn's sentence as written; licenses cover the pilot and the first ring; no preview feature without an approved exception; a deferred function names its compensating controls; the reader used only LicenseAssignment.Read.All and NetworkAccessPolicy.Read.All. Next: Chapter 02 — The Configuration Export and Logs First.`,
      cite: ["gsa01-limits"],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
