// Building Provider Notices, Chapter 05 — Google Cloud Personalized Service Health: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js. The chapter is a draft, and the tour says so.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-pn-05-google-personalized-service-health/build.js
require("../_build/devwb.js")({
  workbook: "pn", chapter: 5, dir: __dirname,
  base: "DW_PN_05_Google_Personalized_Service_Health",
  title: "Google Cloud Personalized Service Health",
  map: "Why say what it can't see · what Google gives and leaves · the two gaps · the collector · the unverified call · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 5: Google Cloud's Personalized Service Health. It's the smallest collector, with the largest gaps, and saying plainly what it can't see is part of the job. We'll start from Google Cloud's own documentation for the events API and the viewer role, see what it leaves to you, then read how the kit fills the record, which two gaps it writes down instead of hiding, and why one call is refused. Then two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.`,
      detail: `The chapter is the Google Cloud collector behind the guide's G5 Google Cloud. You start with what Google documents: the Personalized Service Health events API for a project or an organization, the viewer role, and the Event resource, whose only category is INCIDENT. Then you read how the kit fills Chapter 01's record from an event's impacts and updates, and which two gaps it records instead of hiding: no planned maintenance in the API, and no Personalized Service Health in the Assured Workloads FedRAMP or IL packages. Lab 1 collects both fixture weeks and shows the unverified organization call being refused; Lab 2 reads a test project and removes the role afterwards. Status: the chapter is a draft (status: draft), awaiting the owner's review.`,
      cite: ["pn05-list", "pn05-event"],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why this chapter: read it, and say what's missing",
      body: [
        { lead: "The smallest collector, with the largest gaps. Saying plainly what it can't see is part of the job." },
        { cols: [[{ bullets: [
          "Read a project's or organization's Personalized Service Health **incidents** with the **viewer role**",
          "Into records the router and digest treat like any other provider's",
          "And tell the ISSO **exactly what Google's notices don't cover**",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14.5 }], [{ bullets: [
          "Developers who maintain the kit",
          "The Google Cloud project owner, who owns G5",
          "The ISSO, who records the gaps",
          "You should know Chapter 01's record",
        ], label: "Who it's for", color: "teal", pt: 14.5 }]] },
      ],
      sources: "Sources: Chapter 05, opening, “In this chapter,” “Goal and audience.”",
      say: `Why this chapter? Because Google's notices are the narrowest of the five providers, and the danger is an empty list that looks like good news. So the goal has two halves. By the end you can read a project's or an organization's Personalized Service Health incidents, with the viewer role, into records the router and the weekly digest treat like any other provider's. And you can tell the security officer exactly what Google's notices don't cover. It's for developers who maintain the kit, the project owner who owns this gate, and the security officer, who records the gaps.`,
      detail: `Goal: by the end of this chapter you can read a project's or organization's Personalized Service Health incidents with the viewer role, into records the router and digest treat like any other provider's, and you can tell the ISSO exactly what Google's notices don't cover. Audience: developers who maintain the kit, the Google Cloud project owner who owns G5, and the ISSO who records the gaps. You should know Chapter 01's record.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "Why", title: "Which cloud and which scope, for this read",
      body: [
        { table: { head: ["", "What the kit uses", "Where it comes from"], w: [2.6, 5.0, 4.55], rows: [
          ["Cloud", "global: no separate government endpoint in the kit's table", "The source link is the event on servicehealth.googleapis.com"],
          ["Scope", "project (google-events), or organization when providers.google.scope says so", "Google documents projects.locations.events.list and an organization equivalent"],
          ["The API", "Enabled once per project: servicehealth.googleapis.com", "Google Cloud, List events"],
          ["Government packages", "Not in the Assured Workloads FedRAMP or IL packages: a recorded gap", "Assured Workloads, Supported products"],
        ] }, pt: 13 },
        { callout: "the settings name the project or the organization; the project scope is the one Google's command line was verified for.", label: "In the kit: ", icon: "FaCloud", color: "teal" },
      ],
      sources: "Sources: Google Cloud, events.list; List events; Assured Workloads, Supported products. Chapter 05, “What Google gives you,” “The code,” “Verified facts.”",
      say: `Next, which cloud and which scope. Unlike Azure or AWS, Personalized Service Health has no separate government endpoint in the kit's table, so the cloud is simply global, and each record links to the event on Google's Service Health host. The scope comes from the settings: a project, which is the call Google's command line was verified for, or an organization when the settings say so. The API is enabled once per project. And for government workloads, the question isn't an endpoint at all, but a package: as we'll see, Personalized Service Health isn't in the Assured Workloads FedRAMP or impact-level packages.`,
      detail: `Get-PnProviderNotice -Provider google makes google-events, or google-organization-events when the settings' providers.google.scope is organization. The source link is the event on servicehealth.googleapis.com. Personalized Service Health has no separate government endpoint in the kit's table; the cloud is global. Google's REST reference documents projects.locations.events.list (permission servicehealth.events.list) and the organization equivalent; the API is enabled once per project (servicehealth.googleapis.com). Assured Workloads' supported-products page lists Personalized Service Health under 25 regional packages, including US Data Boundary, but not under FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS or ITAR. The REST organization call is verified; the gcloud flags for it weren't read.`,
      cite: ["pn05-list", "pn05-enable", "pn05-aw"],
      ref: "“What Google gives you”; “The code”; “Verified facts”",
    },
    {
      part: "What", title: "What Google Cloud's documentation gives you",
      body: [
        { table: { head: ["Google gives", "What it says"], w: [3.3, 8.85], rows: [
          ["projects.locations.events.list", "Permission servicehealth.events.list; an organization equivalent"],
          ["The Event resource", "A category whose only value is INCIDENT; a state, a detailed category, relevance, impacts (product and location) and updates. Planned maintenance isn't in it"],
          ["Enable the API", "Once per project: servicehealth.googleapis.com"],
          ["roles/servicehealth.viewer", "Personalized Service Health Viewer reads it"],
          ["gcloud", "gcloud service-health events list --project --location=global"],
        ] }, pt: 13 },
      ],
      sources: "Sources: Google Cloud, Personalized Service Health REST reference (events.list; Event); List events; roles and permissions; gcloud service-health events list.",
      say: `Here's Google's starting point. Google Cloud's REST reference documents the project events list, with its permission, and an organization equivalent. The event resource has a category whose only value is incident, plus a state, a detailed category, relevance, its impacts by product and location, and its updates over time. Planned maintenance isn't in it. The API is enabled once per project. The Personalized Service Health Viewer role reads it. And the command line lists a project's events at the global location.`,
      detail: `Google's REST reference documents projects.locations.events.list (permission servicehealth.events.list) and the organization equivalent. The Event resource has a category whose only value is INCIDENT, a state, a detailed category, relevance, impacts (product and location) and updates; planned maintenance isn't in it. The API is enabled once per project (servicehealth.googleapis.com), and roles/servicehealth.viewer, Personalized Service Health Viewer, reads it. gcloud service-health events list --project --location=global lists a project's events.`,
      cite: ["pn05-list", "pn05-event", "pn05-enable", "pn05-iam", "pn05-gcloud"],
      ref: "“Start with Google's documentation” — “What Google gives you”",
    },
    {
      part: "What", title: "Gap one: incidents only, no planned maintenance",
      body: [
        { cols: [[{ bullets: [
          "The Event's category has **one value: INCIDENT**",
          "Planned maintenance isn't in the resource",
          "So maintenance and retirements **never arrive** through this API",
        ], label: "What Google documents", color: "navy", pt: 15 }], [{ bullets: [
          "Every Google notice is an incident",
          "The gap is written in the guide, this chapter and the ISSO's record: not papered over",
          "It shows in the digest's provider table",
          "Google's maintenance reaches the project by other channels",
        ], label: "What the kit does", color: "teal", pt: 15 }]] },
        { callout: "a maintenance window lands with nobody told, because Google maintenance was assumed covered.", label: "The danger: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Google Cloud, Personalized Service Health REST reference, the Event resource. Chapter 05, “What it leaves to you,” “Dangers.”",
      say: `Here's the first gap, and it's built into Google's API. The event's category has one value, incident. Planned maintenance isn't in the resource at all. So maintenance and retirements never arrive through this API, and no amount of code changes that. What the kit does is refuse to hide it. Every Google notice is recorded as an incident, and the gap is written in the guide, in this chapter and in the security officer's record, and it shows in the weekly digest's provider table. Google's maintenance reaches the project by other channels. The danger is assuming it's covered, and a maintenance window landing with nobody told.`,
      detail: `Google's material: one category, INCIDENT; maintenance and retirements never arrive here. What the kit adds: every Google notice is an incident; the gap is in the guide, this chapter and the ISSO's record, not papered over. Danger: Google maintenance assumed covered; a maintenance window lands with nobody told; guard: the gap is in the record, the digest's provider table and the ISSO's file; Google's maintenance reaches the project by other channels. Lab 2, step 3: in every case, record with the ISSO that Google's planned maintenance doesn't come through this API.`,
      cite: ["pn05-event"],
      ref: "“What it leaves to you”; “Dangers”; “Lab 2,” step 3",
    },
    {
      part: "What", title: "Gap two: not in the FedRAMP or IL packages",
      body: [
        { table: { head: ["Assured Workloads package", "Personalized Service Health listed?"], w: [6.0, 6.15], rows: [
          ["25 regional packages, including US Data Boundary", "Yes"],
          ["FedRAMP Moderate, FedRAMP High", "No"],
          ["IL2, IL4, IL5", "No"],
          ["CJIS, ITAR", "No"],
        ] }, pt: 14 },
        { callout: "recorded as a gap with the ISSO (design guidance). A workload in one of these packages has nothing to read, and an empty list looks like good news. The ISSO decides the compensating channel.", label: "In the kit: ", icon: "FaFileShield", color: "amber" },
      ],
      sources: "Sources: Google Cloud, Assured Workloads, Supported products. Chapter 05, “What Google gives you,” “What it leaves to you,” “Verified facts,” “Dangers.”",
      say: `The second gap is about government packages. Google Cloud's Assured Workloads supported-products page lists Personalized Service Health under twenty-five regional packages, including the U S Data Boundary, but not under FedRAMP Moderate, FedRAMP High, I L 2, I L 4, I L 5, C J I S or I T A R. So a workload in one of those packages has nothing to read, and an empty list there looks like good news when it isn't. The kit's answer, which is the program's design guidance, is to record the package as a gap with the security officer, who decides the compensating channel.`,
      detail: `Assured Workloads' supported-products page lists Personalized Service Health under 25 regional packages, including US Data Boundary, but not under FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS or ITAR. What the kit adds: recorded as a gap with the ISSO (design guidance). Danger: a FedRAMP or IL workload expected to have Personalized Service Health; nothing to read, and an empty list looks like good news; guard: Lab 2, step 3 records the package; the ISSO decides the compensating channel. Lab 2, step 3: if the project is in an Assured Workloads FedRAMP Moderate, FedRAMP High, IL4 or IL5 folder, Personalized Service Health isn't in that package. Personalized Service Health has no separate government endpoint in the kit's table; the cloud is global.`,
      cite: ["pn05-aw"],
      ref: "“What Google gives you”; “What it leaves to you”; “Verified facts”; “Dangers”",
    },
    {
      part: "What", title: "What it leaves to you, and the verdict",
      body: [
        { table: { head: ["Google, as published", "Why it matters", "What the kit adds"], w: [3.5, 3.4, 5.25], rows: [
          ["Impacts as product and location objects", "Services and regions are nested", "Products and locations become the record's services and regions"],
          ["Updates over time; the description sometimes empty", "A task with no text", "The latest update's description when the event has none"],
          ["No field that says action is required", "—", "No action rule for Google: an open incident naming resources routes by the agency's rule (Chapter 06)"],
          ["Organization call verified in REST; its gcloud flags not read", "A command run on a guess", "Marked unverified in config/calls.json; refused without -AllowUnverified"],
          ["A REST response object or gcloud's bare list", "Two shapes for one answer", "Both accepted"],
        ] }, pt: 12 },
        { lead: "Verdict: use Google's project call and viewer role as published; build the mapping, and write the gaps down where the ISSO will read them." },
      ],
      sources: "Sources: Google Cloud, Event resource; events.list; gcloud service-health events list. Chapter 05, “What it leaves to you,” “The verdict.”",
      say: `What else does Google leave to you? Impacts are nested product and location objects, so the kit turns them into the record's services and regions. An event's description is sometimes empty, so the kit takes the latest update's text. Nothing says action is required, and the kit adds no rule of its own here: an open incident that names resources routes by the agency's rule, in Chapter 6. The organization call is verified in REST but its command-line flags weren't read, so it's marked unverified. And two response shapes are both accepted. The verdict: use Google's project call and viewer role as published, build the mapping, and write the gaps down.`,
      detail: `Each row is pinned by a test in the Google Cloud Personalized Service Health block of tests/Collectors.Tests.ps1, or in tests/Live.Tests.ps1. Impacts as product and location objects: services and regions are nested; products and locations become the record's services and regions. Updates over time, the description sometimes empty: a task with no text; the latest update's description when the event has none. No field that says action is required: no action rule for Google; an open incident that names resources routes by the agency's rule (Chapter 06). The REST organization call verified, the gcloud flags for it not read: a command run on a guess; the call is marked unverified in config/calls.json; the live invoker refuses it without -AllowUnverified. A REST response object or gcloud's bare list: two shapes for one answer; both accepted. Not in the Assured Workloads FedRAMP or IL packages: recorded as a gap with the ISSO (design guidance). The verdict: use Google's project call and viewer role as published. Build the mapping, and write the gaps down where the ISSO will read them.`,
      cite: ["pn05-event", "pn05-list", "pn05-gcloud"],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "The collector: incidents into the record",
      body: [
        { steps: [
          { title: "Pick the call", text: "google-events for a project, or google-organization-events when providers.google.scope is organization" },
          { title: "Keep only INCIDENT events", text: "Anything else would be left out and counted" },
          { title: "Close and map", text: "State CLOSED closes the record; products and locations from eventImpacts become services and regions" },
          { title: "Record the provider's severity", text: "detailedCategory and relevance, as text" },
          { title: "Link the source", text: "The event on servicehealth.googleapis.com; no separate government endpoint in the kit's table, so the cloud is global" },
        ], pt: 13.5 },
      ],
      sources: "Sources: examples/provider-notices (Get-PnProviderNotice, ConvertTo-PnGoogleNotice); Google Cloud, Event resource. Chapter 05, “The code.”",
      say: `Now the code. The collector makes one declared call: the project's events, or the organization's when the settings' scope says organization. The normalizer keeps only incident events; anything else would be left out and counted. An event whose state is closed closes the record. Products and locations from the event's impacts become the record's services and regions. The detailed category and relevance are kept as the provider's severity. And the source link is the event on Google's Service Health host. Personalized Service Health has no separate government endpoint in the kit's table, so the cloud is global.`,
      detail: `Get-PnProviderNotice -Provider google makes google-events, or google-organization-events when the settings' providers.google.scope is organization. ConvertTo-PnGoogleNotice keeps only INCIDENT events (anything else would be left out and counted), closes those whose state is CLOSED, takes products and locations from eventImpacts, and records detailedCategory and relevance as the provider's severity. The source link is the event on servicehealth.googleapis.com. Personalized Service Health has no separate government endpoint in the kit's table; the cloud is global.`,
      cite: ["pn05-event"],
      ref: "“The code”",
    },
    {
      part: "What", title: "The unverified call, and the tests",
      body: [
        { cols: [[{ bullets: [
          "Google's REST organization call is verified",
          "The gcloud group for organization events is listed on the gcloud **beta** reference; its exact GA flags weren't read",
          "So config/calls.json marks the call **unverified**",
          "The live invoker refuses it without -AllowUnverified, and it isn't in the scheduled run",
        ], label: "A call nobody verified isn't run", color: "navy", pt: 14 }], [{ bullets: [
          "The Google Cloud Personalized Service Health block of tests/Collectors.Tests.ps1: 6 tests",
          "In tests/Live.Tests.ps1: the gcloud project command, and the refusal of an unverified call",
          "Tested against stand-in CLI output, not a live project",
        ], label: "The tests (Pester 5)", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Google Cloud, events.list; gcloud service-health events list. Kit config/calls.json and tests. Chapter 05, “What it leaves to you,” “The tests,” “Verified facts.”",
      say: `One call gets special treatment. Google's REST call for organization events is verified against Google's documentation, but the command-line group for it is listed on the beta reference, and its exact flags weren't read. So the kit marks the call unverified, and the live invoker refuses to run it unless someone passes an explicit override. It stays out of the scheduled run until someone reads those flags. A command run on a guess is how a read goes wrong. The tests pin it: six in the collector's Google block, plus the live tests for the project command and the refusal.`,
      detail: `The REST organization call verified, the gcloud flags for it not read: a command run on a guess; the call is marked unverified in config/calls.json; the live invoker refuses it without -AllowUnverified. The refusal reads: Call google-organization-events isn't verified against its provider's documentation (The gcloud group organization-events is listed on the gcloud beta reference; the exact GA flags for it weren't read. The REST call is verified). Pass -AllowUnverified to run it. Not yet specified: the gcloud flags for organization events (the REST call is verified; the kit runs the gcloud call only with -AllowUnverified). Checklist: the organization call stays unverified until someone reads its gcloud flags; it isn't in the scheduled run. The tests: the Google Cloud Personalized Service Health block of tests/Collectors.Tests.ps1 (6 tests), and in tests/Live.Tests.ps1 the gcloud project command and the refusal of an unverified call. Illustrative code: Lab 1 reads fictional incidents for a fictional project; nothing signs in. The live reader has been tested against stand-in CLI output, not a live project.`,
      cite: ["pn05-list", "pn05-gcloud"],
      ref: "“What it leaves to you”; “The tests”; “Verified facts”; “Checklist”",
    },
    {
      part: "Who", title: "Who owns it, and the role it may hold",
      body: [
        { cards: [
          { title: "Developers", text: "Maintain the kit; know Chapter 01's record", color: "navy" },
          { title: "Project owner", text: "Owns G5: enables the API and grants the viewer role at the project", color: "teal" },
          { title: "ISSO", text: "Keeps the binding; records the maintenance and package gaps", color: "amber" },
        ], pt: 13.5 },
        { table: { head: ["Call", "Role and permission", "Verified"], w: [3.6, 6.7, 1.85], rows: [
          ["google-events", "roles/servicehealth.viewer on the project: servicehealth.events.list", "Yes"],
          ["google-organization-events", "roles/servicehealth.viewer on the organization: servicehealth.organizationEvents.list", "No"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Google Cloud, Personalized Service Health roles and permissions; events.list. Chapter 05, “Goal and audience,” Lab 1 step 1, “Dangers.”",
      say: `Who's involved? Developers maintain the kit. The project owner owns this gate: enabling the API and granting the viewer role. And the security officer keeps the role binding and records the two gaps. The permissions are short. The project call needs the viewer role on the project. The organization call needs the same role on the organization, and it's the unverified one. Grant at the project unless the settings' scope really is organization, because a viewer role granted at the organization for a project read is more read scope than needed. Nothing the reader holds can write.`,
      detail: `Audience: developers who maintain the kit, the Google Cloud project owner who owns G5, and the ISSO who records the gaps. Evidence: the reader holds the viewer role and nothing that writes; the project owner; the ISSO keeps the binding. Calls: google-events, roles/servicehealth.viewer (Personalized Service Health Viewer) on the project: servicehealth.events.list, verified. google-organization-events, roles/servicehealth.viewer on the organization: servicehealth.organizationEvents.list, not verified. Danger: the viewer role granted at the organization for a project read; more read scope than needed; guard: grant at the project unless the settings' scope is organization.`,
      cite: ["pn05-iam", "pn05-list"],
      ref: "“Goal and audience”; Lab 1, step 1; “Dangers”",
    },
    {
      part: "How", title: "Lab 1: what Google Cloud needs, and week one",
      body: [
        { terminal: "05-1", lines: "2-4,7-9" },
        { terminal: "05-2", lines: "1,4-5" },
        { terminal: "05-3" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures, fictional project). Chapter 05, “Lab 1: fixtures, no tenant,” steps 1–3.",
      say: `Lab 1 needs only PowerShell 7 with Pester, working in the kit's folder. The lab settings name a fictional project, and nothing signs in. Step 1 lists what Google Cloud needs. The organization call carries its reason for being unverified: verified is false. Step 2 collects the day-one fixtures: two notices, both incidents, one open, none needing action, both valid against the schema. Step 3 reads them: one open and one closed, with products and locations taken from their impacts, Cloud S Q L in U S East 4, and Cloud Storage in U S Central 1.`,
      detail: `You need PowerShell 7.1 or later with Pester 5. Work in examples/provider-notices. The lab settings name a fictional project, contoso-example-prod. Step 1: Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1; Get-PnRequiredPermission -Provider google | Format-List Call, Permissions, Verified. The organization call carries its reason for being unverified (the slide leaves out the Import-Module line and the project call's Verified : True line). Step 2: ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider google -AsOf 2026-11-09T12:00:00Z -OutputPath out/google. Output: google global, 2 notices, 1 open, 0 action, incident 2; each valid against schema/notice.schema.json. Step 3: Import-Csv out/google/notices.csv | Format-Table kind, status, title, services, regions. Two incidents, one open and one closed, with products and locations from their impacts.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–3",
    },
    {
      part: "How", title: "Lab 1: week two, and only one kind",
      body: [
        { terminal: "05-4", lines: "1-2,4-5,8-12" },
        { terminal: "05-5" },
        { callout: "four records across two weeks, every one an incident. Maintenance never arrives here; that's the gap the ISSO records.", label: "Look for: ", icon: "FaFilter", color: "teal" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures). Chapter 05, “Lab 1: fixtures, no tenant,” steps 4–5.",
      say: `Step 4 collects the second week. The open incident has closed: both records are closed now, each with the end of its window. Step 5 groups both weeks by kind, and there's only one: incident, four times. That's the first gap made visible. However many weeks you collect, maintenance never arrives through this API, which is exactly why the chapter writes it down with the security officer rather than letting an all-incident list suggest that nothing is planned.`,
      detail: `Step 4: ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider google -AsOf 2026-11-16T12:00:00Z -OutputPath out/google-day2; Import-Csv out/google-day2/notices.csv | Format-Table kind, status, title, windowEnd. The open incident closed: Cloud SQL connection errors in us-east4, closed, windowEnd 2026-11-09T13:00:00Z; Cloud Storage latency in us-central1, closed, windowEnd 2026-11-04T13:20:00Z. Step 5: Import-Csv out/google/notices.csv, out/google-day2/notices.csv | Group-Object kind | Format-Table Name, Count. There is only one kind: incident, 4.`,
      cite: ["pn05-event"],
      ref: "“Lab 1: fixtures, no tenant,” steps 4–5",
    },
    {
      part: "How", title: "Lab 1: the refusal, the command, the tests",
      body: [
        { terminal: "05-6" },
        { terminal: "05-7" },
        { terminal: "05-8" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures). Chapter 05, “Lab 1: fixtures, no tenant,” steps 6–8 and the expected result.",
      say: `Step 6 switches the scope to organization in memory and asks the live invoker for the organization call. It refuses before it starts the Google command line, because the call isn't verified, and the message says why: the group is on the beta reference, and its flags weren't read. Step 7 builds the project command a live run would use, without running it: service health events list, for the fictional project, at the global location, as JSON. Step 8 runs this chapter's tests: eight passed, none failed. Then delete the output folder.`,
      detail: `Step 6: $s = Read-PnSettings -Path tests/fixtures/settings.lab.json; $s.providers.google.scope = 'organization'; $s.providers.google.organization = '123456789012'; Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $s -SkipContextCheck) -CallId google-organization-events. The invoker refuses before it starts gcloud, because the call isn't verified. Step 7: (Get-PnLiveCommand -CallId google-events -Settings $s).Arguments -join ' ' gives service-health events list --project=contoso-example-prod --location=global --format=json. Step 8: Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Google Cloud Personalized Service Health*', '*Google*', '*unverified*' -Output None -PassThru | Select-Object PassedCount, FailedCount. Expected result: PassedCount 8 and FailedCount 0, and out/google/raw/google.json holding the events as read. Delete out: Remove-Item -Recurse -Force out.`,
      cite: ["pn05-gcloud"],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–8; expected result",
    },
    {
      part: "How", title: "Lab 2: a Google Cloud test project",
      body: [
        { steps: [
          { title: "Enable the API and grant the viewer role", text: "As the project owner: gcloud services enable servicehealth.googleapis.com; add-iam-policy-binding for the reader's group, roles/servicehealth.viewer" },
          { title: "Sign in as the reader", text: "gcloud auth login" },
          { title: "Cross-check, then collect", text: "gcloud service-health events list --location=global, counted; the kit's collection should agree" },
          { title: "Record the gaps with the ISSO", text: "No planned maintenance through this API; and an Assured Workloads FedRAMP Moderate, FedRAMP High, IL4 or IL5 folder has no Personalized Service Health" },
          { title: "Back it out", text: "Remove the role binding and delete the run; leave the API enabled unless the project owner decides otherwise" },
        ], pt: 12.5 },
        { callout: "a test project, never production. No incidents is a valid result.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Google Cloud, List events; roles and permissions; gcloud events list; gcloud auth login; remove-iam-policy-binding; Assured Workloads. Chapter 05, “Lab 2.”",
      say: `Lab 2 moves to a Google Cloud test project, never production, and no incidents is a valid result. As the project owner, enable the API and grant the viewer role to the reader's group. Sign in as the reader. Cross-check with Google's own command: its count and the kit's collection should agree. Then the step that matters most in this chapter: record the gaps with the security officer. Planned maintenance doesn't come through this API, and a project in an Assured Workloads FedRAMP or impact-level folder has no Personalized Service Health at all. Finally, remove the role binding and delete the run.`,
      detail: `Use a Google Cloud test project, never production; it may have no incidents, which is a valid result. Placeholders: <project-id>, <group-email>, <settings-file> (deploy/settings.template.json with environment test, only google enabled, scope project and the project ID). 1 Enable the API and grant the viewer role, as the project owner: gcloud services enable servicehealth.googleapis.com --project=<project-id>; gcloud projects add-iam-policy-binding <project-id> --member=group:<group-email> --role=roles/servicehealth.viewer. 2 gcloud auth login. 3 gcloud service-health events list --project=<project-id> --location=global --format=json | ConvertFrom-Json | Measure-Object | Select-Object Count; ./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider google -OutputPath out/google-test. The counts should agree. Then record the gaps with the ISSO: if the project is in an Assured Workloads FedRAMP Moderate, FedRAMP High, IL4 or IL5 folder, Personalized Service Health isn't in that package; and in every case, Google's planned maintenance doesn't come through this API. 4 Back it out: gcloud projects remove-iam-policy-binding <project-id> --member=group:<group-email> --role=roles/servicehealth.viewer; Remove-Item -Recurse -Force out/google-test; leave the API enabled unless the project owner decides otherwise.`,
      cite: ["pn05-enable", "pn05-iam", "pn05-gcloud", "pn05-auth", "pn05-aw"],
      ref: "“Lab 2: a test project”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.3, 2.4, 2.15, 2.3], rows: [
          ["The reader holds the viewer role and nothing that writes", "SA-9 c", "SCR-MIT, SCR-MON", "Project owner; ISSO keeps the binding"],
          ["Every incident for the project was read and recorded (raw/google.json, notices.json, manifest.json)", "SA-9 c; SI-5 a", "SCR-MIT, SCR-MON", "ISSO, with the run folder"],
          ["A call nobody verified isn't run", "SA-9 c", "SCR-MON", "The repository's tests"],
          ["The gaps (no maintenance; not in the FedRAMP or IL packages) are written down", "SA-9 c; RA-3 f", "SCR-MON, SCR-MIT", "ISSO"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators; kit config/requirements.json. Chapter 05, “Federal requirements and evidence.”",
      say: `Each output is evidence for something specific, against NIST's control catalog. The viewer role, and nothing that writes, supports monitoring an external service provider. The run folder shows every incident was read, which also supports receiving security alerts and advisories. A call nobody verified isn't run. And the gaps written down support updating the risk assessment, which is the evidence this chapter adds that no other provider chapter needs. The indicators are FedRAMP's, and which output supports which indicator is the program's mapping. The kit's records support these controls; the agency's assessor decides them.`,
      detail: `The collection is what the guide's G5 checks. The mappings are the kit's config/requirements.json. The reader holds the viewer role and nothing that writes (Lab 1 step 1; Lab 2 step 1): SA-9 c; KSI-SCR-MIT, KSI-SCR-MON; the project owner, the ISSO keeps the binding. Every incident for the project was read and recorded (Lab 1 steps 2 and 4; Lab 2 step 3: raw/google.json, notices.json, manifest.json): SA-9 c; SI-5 a; KSI-SCR-MIT, KSI-SCR-MON; the ISSO, with the run folder. A call nobody verified isn't run (Lab 1 step 6): SA-9 c; KSI-SCR-MON; the repository's tests. The gaps (no maintenance; not in the FedRAMP or IL packages) are written down (Lab 2 step 3): SA-9 c; RA-3 f (update the risk assessment); KSI-SCR-MON, KSI-SCR-MIT; the ISSO. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The kit's records support these controls; the agency's assessor decides them. Which output supports which indicator is the program's mapping (design guidance).`,
      cite: ["pn05-oscal", "pn05-ksi"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.6, 3.9, 4.65], rows: [
          ["Google maintenance assumed covered", "A maintenance window lands with nobody told", "The gap is in the record, the digest's provider table and the ISSO's file; maintenance reaches the project by other channels"],
          ["A FedRAMP or IL workload expected to have Personalized Service Health", "Nothing to read, and an empty list looks like good news", "Lab 2, step 3 records the package; the ISSO decides the compensating channel"],
          ["An unverified call run in production", "A command whose flags nobody read", "Marked unverified; refused without -AllowUnverified"],
          ["The viewer role granted at the organization for a project read", "More read scope than needed", "Grant at the project unless the settings' scope is organization"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Google Cloud, Event resource; Assured Workloads, Supported products; roles and permissions. Chapter 05, “Dangers.”",
      say: `What breaks in production, and what guards against it? Assume Google's maintenance is covered, and a maintenance window lands with nobody told; the guard is the gap written in the record, the digest and the security officer's file. Expect Personalized Service Health in a FedRAMP or impact-level workload, and an empty list looks like good news; the guard is recording the package, so the security officer can choose a compensating channel. Run the unverified call, and you've run a command whose flags nobody read; it's refused. And grant the viewer role at the organization for a project read, and you've granted more than needed.`,
      detail: `Google maintenance assumed covered: a maintenance window lands with nobody told; guard: the gap is in the record, the digest's provider table and the ISSO's file; Google's maintenance reaches the project by other channels. A FedRAMP or IL workload expected to have Personalized Service Health: nothing to read, and an empty list looks like good news; guard: Lab 2, step 3 records the package; the ISSO decides the compensating channel. An unverified call run in production: a command whose flags nobody read; guard: marked unverified; refused without -AllowUnverified. The viewer role granted at the organization for a project read: more read scope than needed; guard: grant at the project unless the settings' scope is organization.`,
      cite: ["pn05-event", "pn05-aw", "pn05-iam"],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The API is enabled on the project and the reader's group holds roles/servicehealth.viewer only",
          "Google's list and the kit's collection agree in the test project",
          "The organization call stays unverified until someone reads its gcloud flags; it isn't in the scheduled run",
          "The test binding was removed",
        ], label: "The reader and the read", color: "navy", pt: 13.5 }], [{ bullets: [
          "The planned-maintenance gap is recorded with the ISSO",
          "Any workload in an Assured Workloads FedRAMP or IL package is recorded as having no Personalized Service Health",
        ], label: "The gaps, written down", color: "amber", pt: 13.5 }]] },
        { callout: "Chapter 06, Routing to Owners and Ticket-to-Machine Tasks, routes what all five collectors gather.", label: "Next: ", icon: "FaRoute", color: "teal" },
      ],
      sources: "Sources: Chapter 05, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The API is enabled on the project, and the reader's group holds only the viewer role. Google's list and the kit's collection agree in the test project. The organization call stays unverified, and out of the scheduled run, until someone reads its flags. The test binding was removed. And the two gaps are written down: planned maintenance, and any workload in an Assured Workloads FedRAMP or impact-level package. Next, Chapter 6 routes what all five collectors gather to owners, as Ticket-to-Machine tasks. Thanks for watching.`,
      detail: `Checklist: The API is enabled on the project and the reader's group holds roles/servicehealth.viewer only. Google's list and the kit's collection agree in the test project. The planned-maintenance gap is recorded with the ISSO. Any workload in an Assured Workloads FedRAMP or IL package is recorded as having no Personalized Service Health. The organization call stays unverified until someone reads its gcloud flags; it isn't in the scheduled run. The test binding was removed. Next: Chapter 06 — Routing to Owners and Ticket-to-Machine Tasks.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
