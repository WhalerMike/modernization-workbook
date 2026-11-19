// Building Azure Security, Chapter 05 — Front Door, Application Gateway and the Origin: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/azure-security/05-front-door-application-gateway-and-the-origin.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-azs-05-front-door-and-the-origin/build.js
require("../_build/devwb.js")({
  workbook: "azs", chapter: 5, dir: __dirname,
  base: "DW_AZS_05_Front_Door_and_the_Origin",
  title: "Front Door, Application Gateway and the Origin",
  map: "Why the header matters · what Learn gives and leaves · lock-down states · the rules · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Azure Security, Chapter 5: Front Door, Application Gateway and the origin. The service tag tells an origin a request came from a Front Door. Only the header tells it the request came from yours. We'll start from Microsoft Learn's two ways to lock an origin to the edge, see what they leave to you, read how the kit checks each origin's configuration and where it stops and says "test this by hand", then walk two labs, the evidence and the dangers. The chapter has been reviewed and approved, and the code is illustrative, tested against a fictional estate.`,
      detail: `The chapter is the code behind the Azure Security Engineering guide's Step 5, Front Door and Application Gateway. You start with Learn's two ways to lock an origin to the edge, Private Link or the service tag and the X-Azure-FDID header together, and its TLS and failover guidance. Then you read how the kit checks each origin's configuration, and where it stops and says "test this by hand". Lab 1 checks Contoso's five origins; Lab 2 checks a test profile and ends with the guide's own test: a direct request to the origin, refused.`,
      cite: ["azs05-guide"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why an origin must refuse the way around",
      body: [
        { cols: [[{ bullets: [
          "Whether every Front Door origin's configuration lets **only your Front Door** reach it",
          "Which origin groups **can't fail over**, or **mix private and public** origins",
          "Which custom domains or gateways allow **TLS below 1.2**",
          "Which **classic profiles** still need migrating",
        ], label: "By the end you can say", color: "navy", pt: 14 }], [{ bullets: [
          "Application owners, who own origins and certificates",
          "Platform owners, who own the profiles",
          "Read Chapter 04 first: the WAF only protects what can't be reached around it",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
        { callout: "the kit reads configuration; the guide's test is a request. You'll know which answers still need it.", label: "The limit: ", icon: "FaTriangleExclamation", color: "amber" },
      ],
      sources: "Sources: Chapter 05, opening, “In this chapter,” “Goal and audience.”",
      say: `Why does this matter? A web application firewall at the edge only helps if nothing can reach the origin around it. By the end of this chapter you can say, for every Front Door origin, whether its configuration lets only your Front Door reach it; which origin groups can't fail over or mix private and public origins; which custom domains or application gateways allow TLS below 1.2; and which classic profiles still need migrating. It's for application owners, who own origins and certificates, and platform owners, who own the profiles. One limit to keep in mind: the kit reads configuration, and the guide's test is a request. You'll know which answers still need that test.`,
      detail: `Goal: by the end of this chapter you can say, for every Front Door origin, whether its configuration lets only your Front Door reach it, which origin groups can't fail over or mix private and public origins, which custom domains or application gateways allow TLS below 1.2, and which classic profiles still need migrating; and you know which of those answers still need the guide's request test. Audience: application owners, who own origins and certificates, and platform owners, who own the profiles. Read Chapter 04 first: the WAF only protects what can't be reached around it.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.4, 8.75], rows: [
          ["Origin security", "Use the AzureFrontDoor.Backend service tag and the X-Azure-FDID header together; the tag's addresses are shared by every Front Door customer"],
          ["App Service access restriction", "One rule does both: --service-tag AzureFrontDoor.Backend --http-header x-azure-fdid=<front-door-id>"],
          ["Private Link origins", "Premium requests a private endpoint connection the owner approves; don't mix public and private origins in one group"],
          ["Site configuration and origins APIs", "ipSecurityRestrictions and the default action; X-Azure-FDID matches exactly; azureOrigin and the private link status"],
          ["TLS and classic", "TLS 1.2 or 1.3 only, a predefined policy such as AppGwSslPolicy20220101; classic retires March 31, 2027"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Learn, Secure traffic to Azure Front Door origins; App Service multi-region tutorial; Front Door Private Link; Web Apps Get Configuration; AFD Origins; Internet ingress.",
      say: `Here's what Microsoft Learn gives you. The origin security page says to use the Azure Front Door Backend service tag and the X-Azure-FDID header together, because the tag's addresses are shared by every Front Door customer. Learn's App Service tutorial does both in one access restriction. Where the origin supports it, Private Link is the alternative: Front Door Premium requests a private endpoint connection that the origin owner approves, and an origin group shouldn't mix public and private origins. The App Service configuration and Front Door origins APIs return what the kit reads, and the header matches exactly. On TLS, 1.2 or 1.3 only. And classic Front Door retires on March 31, 2027.`,
      detail: `Learn's origin security page: use the AzureFrontDoor.Backend service tag and the X-Azure-FDID header together, because the tag's addresses are shared by every Front Door customer. Learn's tutorial: az webapp config access-restriction add --service-tag AzureFrontDoor.Backend --http-header x-azure-fdid=<front-door-id>. Private Link: Front Door Premium requests a private endpoint connection the origin owner approves; an origin group shouldn't mix public and private origins. The App Service configuration API returns ipSecurityRestrictions (tag, ipAddress, headers, action) and the default action for unmatched requests; the X-Azure-FDID header matches exactly. The Front Door origins API, version 2025-04-15, returns azureOrigin and sharedPrivateLinkResource with its status. TLS 1.2 or 1.3 only; a predefined policy such as AppGwSslPolicy20220101 on Application Gateway. Classic Front Door retires March 31, 2027.`,
      cite: ["azs05-origin", "azs05-appsvc", "azs05-pl", "azs05-webcfg", "azs05-origins", "azs05-ingress", "azs05-agw-tls", "azs05-classic"],
      ref: "“Start with Microsoft Learn” — “What Learn gives you”; “Verified facts”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn gives", "Why it matters", "What the kit adds"], w: [3.3, 4.0, 4.85], rows: [
          ["The command that adds the restriction", "Nothing reads back what origins have today", "Every Standard and Premium origin read through its groups"],
          ["Tag and header together", "The tag alone admits any customer's Front Door", "AZS-EDGE-03 for a tag rule with no header"],
          ["The header is the profile's ID", "Another profile's header admits that profile", "The header compared with this profile's frontDoorId"],
          ["Restrictions, not their default", "Allow-any, or default Allow, opens the origin", "AZS-EDGE-02 for either"],
          ["Don't mix origins; two in the quickstart", "A sentence; one origin can't fail over", "AZS-EDGE-05 and AZS-EDGE-08"],
          ["Origins of every type", "Each restricts access its own way", "AZS-EDGE-04 names what the kit couldn't check"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Chapter 05, “What it leaves to you”; the kit's Edge tests.",
      say: `What does Learn leave to you? The command adds a restriction, but nothing reads back what every origin has today. A rule with the tag alone admits any customer's Front Door. A header copied from another profile admits that profile, not this one. An allow rule for any address, or a default action of allow, opens the origin whatever the tag rule says. "Don't mix origins" is a sentence, not a check, and one origin can't fail over. And origins of other types restrict access their own ways. The kit answers each, and says plainly which origins it couldn't check, so a person tests them.`,
      detail: `Each row is pinned by a test in the Edge (Step 5) tests. The command that adds the restriction: every Standard and Premium origin read through its profile's origin groups. Tag and header together: AZS-EDGE-03 for a tag rule with no header. The header value is the profile's Front Door ID: compared with this profile's frontDoorId (AZS-EDGE-02, test "refuses another profile's X-Azure-FDID"). Restrictions, not their default: AZS-EDGE-02 for an Allow rule for any address or a default action of Allow. Don't mix public and private origins: AZS-EDGE-05. The quickstart's two origins: AZS-EDGE-08 for fewer than two enabled origins. Origins of every type: AZS-EDGE-04 names the ones the kit couldn't check. The kit reads configuration; the guide's Validate step is a request, and the metric is "locked by configuration".`,
      cite: ["azs05-guide"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "Each origin gets one lock-down state",
      body: [
        { table: { head: ["State", "When", "Locked"], w: [2.5, 7.6, 2.05], rows: [
          ["PrivateLink", "sharedPrivateLinkResource status is Approved", "Yes"],
          ["ServiceTag+FDID", "An Allow rule for the tag with this profile's header; no allow-any rule; no default Allow", "Yes"],
          ["TagOnly", "The tag rule has no header", "No (EDGE-03)"],
          ["OtherFrontDoor", "The header isn't this profile's ID", "No (EDGE-02)"],
          ["Open", "No tag rule, an allow-any rule, or default Allow", "No (EDGE-02)"],
          ["Unchecked", "Any other origin type, or no Azure resource", "Not counted (EDGE-04)"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/azure-security (Get-AzsEdgeCheck). Chapter 05, “The code: the edge area.”",
      say: `Here's how the kit decides. Every origin gets one lock-down state. Private Link, when the shared private link connection is approved. Service tag plus Front Door ID, when an App Service origin has an allow rule for the tag with this profile's header, no allow rule for any address, and no default of allow. Those two count as locked. Tag only, when the header's missing. Other Front Door, when the header is some other profile's. Open, when there's no tag rule, an allow-any rule, or a default of allow. And unchecked, for any origin type the kit can't read: it's not counted as locked by anybody.`,
      detail: `Get-AzsEdgeCheck reads the classic profiles, the Standard and Premium profiles with their origin groups, origins and custom domains, each App Service origin's site configuration, and the application gateways. PrivateLink: sharedPrivateLinkResource.status is Approved; locked. ServiceTag+FDID: an App Service origin with an Allow rule for the AzureFrontDoor.Backend service tag whose x-azure-fdid header is this profile's Front Door ID, no Allow rule for any address, and no default action of Allow; locked. TagOnly: the tag rule has no header (AZS-EDGE-03). OtherFrontDoor: the header isn't this profile's ID (AZS-EDGE-02). Open: no tag rule, an Allow rule for any address, or a default of Allow (AZS-EDGE-02). Unchecked: any other origin type, or a hostname with no Azure resource (AZS-EDGE-04), not counted.`,
      cite: ["azs05-webcfg", "azs05-origins"],
      ref: "“The code: the edge area”",
    },
    {
      part: "What", title: "The edge rules, beyond the origin",
      body: [
        { table: { head: ["Rule", "Severity", "What it flags", "Source"], w: [1.8, 1.4, 6.2, 2.75], rows: [
          ["AZS-EDGE-01", "Finding", "A classic Front Door profile", "Learn"],
          ["AZS-EDGE-05", "Finding", "Private Link and public origins in one group", "Learn"],
          ["AZS-EDGE-06", "Finding", "A custom domain's minimum TLS below 1.2", "Learn"],
          ["AZS-EDGE-07", "Finding", "A gateway TLS policy not one of the baseline's predefined policies", "Learn"],
          ["AZS-EDGE-08", "Warn", "Fewer than two enabled origins in a group", "Learn"],
        ] }, pt: 12.5 },
        { lead: "Baseline: AppGwSslPolicy20220101 and 20220101S; Front Door minimum TLS12. Origin groups and domains are unverified calls." },
      ],
      sources: "Sources: examples/azure-security (config/rules.json, config/baseline.json). Chapter 05, “The code: the edge area.”",
      say: `Beyond each origin, five more rules. A classic Front Door profile is a finding, because it retires. An origin group that mixes Private Link and public origins is a finding, as Learn advises. A custom domain whose minimum TLS is below 1.2 is a finding, and so is an application gateway whose TLS policy isn't one of the two predefined policies Learn names. An origin group with fewer than two enabled origins is a warning: it can't fail over. The origin groups' and custom domains' calls are still unverified, read by their Resource Manager names, which Lab 2 confirms.`,
      detail: `AZS-EDGE-01, Finding: a classic Front Door profile (Learn). AZS-EDGE-05, Finding: Private Link and public origins in one group (Learn). AZS-EDGE-06, Finding: a custom domain's minimum TLS below 1.2 (Learn). AZS-EDGE-07, Finding: an application gateway's TLS policy not one of the baseline's predefined policies (Learn). AZS-EDGE-08, Warn: fewer than two enabled origins in a group (Learn's quickstart). The baseline's predefined policies are AppGwSslPolicy20220101 and AppGwSslPolicy20220101S; the minimum Front Door TLS is TLS12; both are in config/baseline.json. The origin groups' and custom domains' calls are unverified: the kit reads tlsSettings.minimumTlsVersion and the health probe settings by their ARM names, which Lab 2 confirms (research gaps, row 6). Two tests cover this area.`,
      cite: ["azs05-classic", "azs05-pl", "azs05-ingress", "azs05-agw-tls", "azs05-afd-cli"],
      ref: "“The code: the edge area”",
    },
    {
      part: "Who", title: "Who owns the origin and who owns the profile",
      body: [
        { cards: [
          { title: "Application owner", text: "Owns origins and certificates; runs the direct-request test", color: "navy" },
          { title: "Platform owner", text: "Owns the Front Door profiles and the gateways' TLS policy", color: "teal" },
          { title: "Developers", text: "Keep the lock-down states honest, and the Unchecked list visible", color: "amber" },
        ], pt: 13.5 },
        { lead: "Every read is Reader; the check sends nothing." },
      ],
      sources: "Sources: Chapter 05, “Goal and audience”; “Federal requirements and evidence.”",
      say: `Who's involved? The application owner owns the origins and their certificates, and runs the direct-request test the guide asks for. The platform owner owns the Front Door profiles and the gateways' TLS policy. Developers keep the lock-down states honest, and make sure the unchecked list stays visible, so nobody counts it as done. Every read the check makes is Reader, and it sends nothing.`,
      detail: `Audience and ownership: application owners own origins and certificates; platform owners own the profiles. In the evidence table, origin lock-down and failover are kept by the application owner; TLS by the application owner and platform owner; classic profiles by the platform owner. Every call the edge area makes is a read declared in config/calls.json with the role Reader.`,
      cite: [],
      ref: "“Goal and audience”; “Federal requirements and evidence”",
    },
    {
      part: "How", title: "Lab 1: run the edge check, read each origin",
      body: [
        { terminal: "05-1", label: "examples/azure-security  ·  fixture data  ·  real output" },
        { terminal: "05-2" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 05, “Lab 1: fixtures, no subscription,” steps 1–2.",
      say: `Lab 1 needs PowerShell 7 with Pester, in the kit's folder, and no subscription. Contoso's Premium profile has two origin groups: one with two App Service origins, one with a Private Link origin and a public one. The Standard careers profile has a single storage origin. Step 1 runs the edge check: two of five origins locked by configuration. Step 2 reads each origin. The east origin has the tag and the header; the west origin has the tag only. The private API origin reaches its origin over Private Link. And two are unchecked.`,
      detail: `You need PowerShell 7.1 or later with Pester 5, working in examples/azure-security. Contoso's afd-portal (Premium) has two origin groups: og-portal with two App Service origins, and og-api with a Private Link origin and a public one. afd-careers (Standard) has one origin, a storage static website. Step 1: Invoke-AzsCheck.ps1 -Area edge: two of five origins locked by configuration. Step 2: origin-east has the tag and the header (ServiceTag+FDID); origin-west has the tag only (TagOnly); api-private reaches its origin over Private Link; api-public and careers-static are Unchecked.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the findings",
      body: [
        { terminal: "05-3" },
        { terminal: "05-4" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 05, “Lab 1: fixtures, no subscription,” steps 3–4.",
      say: `Step 3 reads the findings. The API origin group mixes a private and a public origin. The west origin's tag rule has no header. The careers custom domain allows TLS 1.0. The intranet gateway uses an old 2015 TLS policy. The careers origin group has one origin, so it can't fail over. The classic profile is still there. And the two unchecked origins get a warning that says, in plain words, test a direct request by hand. Step 4 runs this chapter's two tests.`,
      detail: `Step 3: AZS-EDGE-05, og-api mixes a private and a public origin; AZS-EDGE-03, origin-west's AzureFrontDoor.Backend rule has no X-Azure-FDID header; AZS-EDGE-06, careers.contoso.example allows TLS 1.0; AZS-EDGE-07, appgw-intranet uses AppGwSslPolicy20150501; AZS-EDGE-08, og-careers has one origin; AZS-EDGE-01, the classic fd-legacy-intranet is still there; AZS-EDGE-04 for api-public and careers-static: test a direct request by hand. Step 4: two Edge tests pass. Expected result: every origin with one lock-down state, the two the kit couldn't check named, and the TLS and failover gaps beside them.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 3–4",
    },
    {
      part: "How", title: "Lab 2: a test profile, and the refused request",
      body: [
        { steps: [
          { title: "Sign in and write the settings", text: "az cloud set --name AzureCloud; az login --tenant; settings from the template, outside any repository" },
          { title: "Run the edge check, live", text: "With -AllowUnverified for the origin group and custom domain calls" },
          { title: "Compare the restrictions", text: "az webapp config access-restriction show; each domain's minimum TLS in the portal" },
          { title: "The guide's test", text: "A direct request to the origin should be 403; the same request through Front Door should succeed" },
          { title: "Back it out", text: "Nothing changed in Azure: delete what the lab wrote, and sign out" },
        ], pt: 12.5 },
        { callout: "a test profile in a test subscription, never production. The authors haven't run this lab.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Chapter 05, “Lab 2: a test subscription.”",
      say: `Lab 2 moves to a test subscription with a Front Door Premium profile and an App Service origin, never production. Sign in to commercial Azure, write the settings, and run the edge check live, allowing the unverified calls. Compare the origin's access restrictions with what the kit read, and check each custom domain's minimum TLS in the portal. Then run the guide's own test: a direct request to the origin should come back 403, and the same request through Front Door should succeed. If the kit said locked and the direct request isn't refused, record it. Back out by deleting what the lab wrote, and signing out. The authors haven't run this lab.`,
      detail: `Use a test tenant with a test management group and subscription in commercial Azure, never production, with a Front Door Premium profile and an App Service origin. Steps: sign in (az cloud set --name AzureCloud; az login --tenant <tenant-id>; az extension add --name resource-graph); write the test settings file; run Invoke-AzsCheck.ps1 -Area edge live with -AllowUnverified; compare az webapp config access-restriction show with the origin's row in edge.json, and each custom domain's minimum TLS in the portal; run Invoke-WebRequest against https://<app-name>.azurewebsites.net/ (should be 403) and https://<endpoint-host>/ (the application's own status). If the kit said ServiceTag+FDID and the first request isn't refused, record it (research gaps, row 7). Back out: Remove-Item the output; az logout.`,
      cite: ["azs05-guide"],
      ref: "“Lab 2: a test subscription”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.6, 1.9, 2.15, 2.5], rows: [
          ["Each origin's lock-down by configuration, with Lab 2's request test", "SC-7", "CNA-MAT", "Application owner"],
          ["TLS 1.2 minimum on every custom domain and gateway", "SC-8", "SVC-SIN", "Application, platform owner"],
          ["A second origin in every group, with the failover test", "CP-2", "CNA-MAT", "Application owner"],
          ["Classic profiles named before their retirement", "SC-7", "CNA-MAT", "Platform owner"],
        ] }, pt: 12.5 },
        { lead: "The kit's output supports these controls; the assessor decides. KSIs are FedRAMP 20x indicators for providers." },
      ],
      sources: "Sources: the guide's Federal requirements and KSIs (Step 5). Chapter 05, “Federal requirements and evidence.”",
      say: `Each output is evidence for something specific, from the guide's requirements table against NIST SP 800-53. Each origin's lock-down, read from configuration and backed by Lab 2's request test, supports boundary protection. TLS 1.2 as the minimum on every custom domain and gateway supports transmission confidentiality and integrity. A second origin in every group, with the failover test, supports the contingency plan. And classic profiles named before their retirement support boundary protection too. The kit's output supports these controls; the assessor decides. And the key security indicators are FedRAMP's indicators for cloud providers, which the agency lines its own evidence up with.`,
      detail: `Each origin's lock-down by configuration (edge.json origin rows, Lab 1 step 2), with the request test of Lab 2 step 5: SC-7, boundary protection; KSI-CNA-MAT; application owner. TLS 1.2 minimum on every custom domain and gateway (AZS-EDGE-06 and AZS-EDGE-07, or none): SC-8, transmission confidentiality and integrity; KSI-SVC-SIN; application owner, platform owner. A second origin in every group (AZS-EDGE-08, or none), with the guide's failover test: CP-2, contingency plan; KSI-CNA-MAT; application owner. Classic profiles named before their retirement (AZS-EDGE-01): SC-7; KSI-CNA-MAT; platform owner. The controls are the guide's Step 5 row (SC-7, SC-8, CP-2) and its KSIs; the guide notes KSI-CNA-MAT and KSI-SVC-SIN cite SC-8.`,
      cite: ["azs05-guide"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.2, 4.4, 4.55], rows: [
          ["The service tag alone", "Any customer's Front Door reaches the origin", "AZS-EDGE-03"],
          ["A header from another profile", "That profile reaches the origin; this one may not", "The header compared with this profile's ID"],
          ["Configuration taken as proof", "A rule reads right; a request still gets through another path", "The metric says “by configuration”; Lab 2 step 5 is the test"],
          ["An origin the kit can't read", "Counted locked by nobody, tested by nobody", "AZS-EDGE-04 every week until someone tests it"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Chapter 05, “Dangers.”",
      say: `What breaks in production? The service tag alone lets any customer's Front Door reach the origin: the kit flags it. A header copied from another profile lets that profile in, so the kit compares the header with this profile's own ID. Configuration taken as proof is a danger of its own: a rule can read right while a request still gets through another path, like another slot or the deployment site. So the metric says "by configuration", and Lab 2's direct request is the test. And an origin the kit can't read would otherwise be counted locked by nobody and tested by nobody, so it's flagged every week until someone tests it.`,
      detail: `The service tag alone: any customer's Front Door reaches the origin; guard AZS-EDGE-03. A header from another profile: the other profile reaches the origin, this one may not; guard: the header compared with this profile's ID. Configuration taken as proof: a rule that reads right still lets a request through (another path, another slot, the SCM site); guard: the metric says "by configuration", Lab 2 step 5 is the test. An origin the kit can't read: counted as locked by nobody and tested by nobody; guard: AZS-EDGE-04 every week until someone tests it.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { bullets: [
          "Every origin is PrivateLink or ServiceTag+FDID, or has a decision record with a compensating control",
          "Every Unchecked origin has a dated direct-request test",
          "Every origin group has a second origin, and failover was tested this half year",
          "No custom domain or gateway allows TLS below 1.2",
          "No classic profile remains, or its migration is scheduled before March 31, 2027",
        ], pt: 14.5 },
        { callout: "Chapter 06: what leaves Azure, through the firewall.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 05, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. Every origin is locked by Private Link or by the tag and this profile's header, or has a decision record with a compensating control. Every unchecked origin has a dated direct-request test. Every origin group has a second origin, and failover was tested this half year. No custom domain or gateway allows TLS below 1.2. And no classic profile remains, or its migration is scheduled before March 31, 2027. Next, Chapter 6 turns from what comes in to what leaves: Azure Firewall and egress.`,
      detail: `Checklist: every origin is PrivateLink or ServiceTag+FDID, or has a decision record with a compensating control; every Unchecked origin has a dated direct-request test; every origin group has a second origin, and failover was tested this half year; no custom domain or gateway allows TLS below 1.2; no classic profile remains, or its migration is scheduled before March 31, 2027. Next, Chapter 06: what leaves Azure, through the firewall. The guide's Step 5 holds the commands that lock the origin and set TLS.`,
      cite: ["azs05-classic"],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
