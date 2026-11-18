// Building Global Secure Access, Chapter 05 — The Compliant Network and Tenant Restrictions: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/05-compliant-network-and-tenant-restrictions.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-05-compliant-network-tenant-restrictions/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 5, dir: __dirname,
  base: "DW_GSA_05_Compliant_Network_Tenant_Restrictions",
  title: "The Compliant Network and Tenant Restrictions",
  map: "Why these two need a gate · what Learn gives and leaves · the eleven checks · the enforcement gate · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Global Secure Access. This is Chapter 5: the compliant network, and tenant restrictions. These are two settings only Microsoft Entra can provide, and two of the easiest ways to lock users out. The code's job is to say when each is safe to enforce. We'll start from Learn's example policy and its universal tenant restrictions, see what they leave to you, read eleven checks and the plan's enforcement gate, and walk two labs. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's Step 7, Compliant network, and Step 8, Tenant restrictions. The design is Book 04, Chapter 07's network traffic family and Book 04, Appendix C's TRv2 policy. Checks GSA-CN-01 to -07 and GSA-TR-01 to -04, and the plan's -AllowEnforce gate. Lab 1 finds the pilot's compliant network policy not ready (the service carried three report-only failures) and an unregistered partner tenant, and shows the plan refusing to enforce. Lab 2 creates the policy report-only in a test tenant, runs Learn's disable-and-retry test, turns tagging on and backs both out.`,
      cite: ["gsa05-cn", "gsa05-utr"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why these two need a gate",
      body: [
        { lead: "Two settings only Microsoft Entra can provide, and two of the easiest ways to lock users out." },
        { cols: [[{ bullets: [
          "Keep the compliant network policy and the tenant restrictions as **reviewed configuration**",
          "Show **when** the compliant network policy is ready to enforce",
          "Show agency devices can sign in only to the tenants the register allows",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The identity engineer who runs the policies",
          "The policy owner who decides enforcement",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 05, opening, “Goal and audience.”",
      say: `Why a gate? The compliant network check passes only for users who come through the agency's own Global Secure Access, so a replayed token from anywhere else is refused. Tenant restrictions let agency devices sign in only to tenants the policy allows. Both are strong, and both can lock people out if they're enforced too early. So the goal: keep both as reviewed configuration, show when the compliant network policy is ready to enforce, and show that agency devices reach only the tenants the register allows. It's for the developers, the identity engineer, and the policy owner who decides enforcement.`,
      detail: `Goal: keep the compliant network policy and the tenant restrictions as reviewed configuration, show when the compliant network policy is ready to enforce, and show that agency devices can sign in only to the tenants the register allows. Audience: developers who build or maintain the kit, the identity engineer who runs the policies, and the policy owner who decides enforcement. The compliant network check passes only for users connected through the tenant's own Global Secure Access.`,
      cite: ["gsa05-cn"],
      ref: "“Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["Compliant network check", "Passes only through this tenant's GSA; block outside All Compliant Network locations"],
          ["Exclusions", "Microsoft Intune Enrollment and Microsoft Intune (circular dependency); emergency access"],
          ["Limits", "Not supported for Private Access apps; turning signaling off can block users"],
          ["Named location", "compliantNetworkNamedLocation, Policy.Read.All"],
          ["Universal tenant restrictions", "networkPacketTaggingStatus; TRv2 default with Policy.Read.All; four-case test; block error 5000211"],
          ["Validate", "Disable the client and sign in again"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, compliant network check; Known limitations; namedLocations; tutorial; Universal Tenant Restrictions; tagging; TRv2 default; operations.",
      say: `Learn gives a lot here. Its example policy blocks everything outside the All Compliant Network locations named location, excludes the two Intune applications so devices can still enroll, and excludes emergency access. The check isn't supported for Private Access apps, and turning signaling off while policies depend on it can block users. The named location is listed with Policy Read All. Universal tenant restrictions apply the TRv2 policy to traffic the Microsoft profile carries, through one tagging setting. Learn's tests are disabling the client and signing in again, and a four-case matrix for tenants, with a block query for error five million two hundred eleven.`,
      detail: `The compliant network check passes only for users connected through the tenant's own Global Secure Access; Learn's example policy blocks all resources outside the All Compliant Network locations named location, excludes Microsoft Intune Enrollment and Microsoft Intune to avoid a circular dependency, and excludes emergency access; the check isn't supported for Private Access apps; turning signaling off while policies depend on it can block users. The named location is listed with $filter=isof('microsoft.graph.compliantNetworkNamedLocation'), with Policy.Read.All. Learn's tutorial validates by disabling the client and signing in again. Universal tenant restrictions apply the TRv2 policy to traffic the Microsoft profile carries, with networkPacketTaggingStatus on /networkAccess/settings/crossTenantAccess; Learn's test is four cases (member, allowed partner, blocked tenant, guest) and its block query looks for error 5000211. The TRv2 default is read from /policies/crossTenantAccessPolicy/default with Policy.Read.All.`,
      cite: ["gsa05-cn", "gsa05-limits", "gsa05-nl", "gsa05-tut", "gsa05-utr", "gsa05-tag", "gsa05-opsms", "gsa05-trv2"],
      ref: "“What Microsoft gives you”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.4, 3.4, 5.35], rows: [
          ["The example policy is On", "The guide starts every policy in report-only", "The policy file is report-only; new policies stay report-only"],
          ["No rule for when report-only is done", "Enforcement by calendar, or by feel", "GSA-CN-06: 10 business days and no failure carried by the service; -AllowEnforce"],
          ["Exclusions in prose", "One missing exclusion locks out enrollment", "GSA-CN-03, -04; the plan refuses a file without the emergency exclusion"],
          ["Not for Private Access apps", "A tenant-wide policy can include one", "GSA-CN-05 compares the scope with the apps"],
          ["Tagging is a tenant-wide toggle", "With an allowing default it enforces nothing", "GSA-TR-03 and the plan require a blocking default"],
          ["Partner allowances", "Nobody remembers why a tenant is allowed", "GSA-TR-02: a register row with owner and review date"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Learn, compliant network check; Universal Tenant Restrictions. Chapter 05, “What it leaves to you.”",
      say: `What does it leave to you? Learn's example policy is on from the start, but the guide begins every policy in report-only, so the kit's file is report-only. Nothing says when report-only is done, so the kit's rule is ten business days and no failure carried by the service, and the plan won't enforce without an explicit switch. Exclusions are prose, so two checks look for them and the plan refuses a file without the emergency one. The tagging toggle enforces nothing with an allowing default, so tagging waits for a blocking default. And every partner allowance needs a register row with an owner.`,
      detail: `Each row is pinned by a test in the Chapter 05 and Plans blocks. Learn's example creates the policy On; config/policies/NET-CN-Require-Compliant-Network-Pilot.json is report-only; the plan keeps new policies report-only. No rule for when report-only is done: GSA-CN-06, 10 business days since the policy was created and no reportOnlyFailure with Through true (the guide's defect rule); the plan won't enforce without -AllowEnforce. Exclusions in prose: GSA-CN-03 and -04; the plan refuses a file without the emergency exclusion. Not supported for Private Access apps: GSA-CN-05 compares the policy's apps with the Private Access apps. Tagging is a tenant-wide toggle: GSA-TR-03 and the plan require a blocking default before tagging. Partner allowances: GSA-TR-02 requires a trv2-partner row in the exception register with an owner and a review date.`,
      cite: ["gsa05-cn", "gsa05-utr"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "Eleven checks across the two steps",
      body: [
        { cols: [[{ table: { head: ["Check", "Compliant network"], w: [1.5, 4.45], rows: [
          ["CN-01", "The named location exists"],
          ["CN-02", "Blocks everything outside it"],
          ["CN-03, -04", "Emergency group and both Intune apps excluded"],
          ["CN-05", "No Private Access app in scope"],
          ["CN-06", "Report-only days and defects; Info until ready"],
          ["CN-07", "Enforced only with signaling on"],
        ] }, pt: 12 }], [{ table: { head: ["Check", "Tenant restrictions"], w: [1.5, 4.45], rows: [
          ["TR-01", "TRv2 default blocks all users and apps"],
          ["TR-02", "Each partner allowance registered, current"],
          ["TR-03", "Tagging on only with a blocking default"],
          ["TR-04", "Blocked tenants listed for the weekly review"],
        ] }, pt: 12 }]] },
      ],
      sources: "Sources: examples/global-secure-access (Test-GsaCompliantNetwork, Test-GsaTenantRestrictions). Chapter 05, “The code.”",
      say: `Eleven checks. For the compliant network: the named location exists, which tells you signaling was turned on; the policy blocks everything outside it; the emergency group and both Intune apps are excluded; no Private Access app is in scope; while it's report-only, the business days and the defects are counted, as information until it's ready; and once it's enforced, signaling must be on. For tenant restrictions: the default blocks everyone and everything; each partner allowance is in the register and current; tagging is on only with a blocking default; and each blocked tenant is listed for the weekly review.`,
      detail: `GSA-CN-01 a compliantNetworkNamedLocation exists (it appears when signaling is turned on). GSA-CN-02 each NET-CN- policy blocks, and excludes that location. GSA-CN-03, -04 the emergency access group and both Intune applications are excluded. GSA-CN-05 no Private Access app is in the policy's scope. GSA-CN-06 in report-only: business days since creation, and failures carried by the service; Info until ready. GSA-CN-07 when enforced, signaling is on. GSA-TR-01 the TRv2 default blocks all users and all applications. GSA-TR-02 each partner with a tenant restrictions allowance is in the register, current. GSA-TR-03 tagging is on only with a blocking default. GSA-TR-04 each resource tenant in the block query, flagged when it isn't a registered partner (Info, for the weekly review).`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who decides enforcement",
      body: [
        { cols: [[{ bullets: [
          "**Policy owner**: decides enforcement, passes -AllowEnforce, on the record",
          "**Identity engineer**: runs the policies; owns the partner list",
          "**Security monitor**: watches blocks with Through false",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "Policy.Read.All: policies, named locations, TRv2",
          "NetworkAccess.Read.All / ReadWrite.All: signaling and tagging",
          "Policy.ReadWrite.ConditionalAccess: creating the policy",
          "Conditional Access Administrator and GSA Administrator via PIM",
        ], label: "Permissions and roles", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Learn, namedLocations; tagging; TRv2 default. Chapter 05, “Federal requirements,” “Lab 2,” guide Step 7.",
      say: `Who decides? The policy owner decides enforcement, and passes the enforce switch on the record, only after the report-only result is clean. The identity engineer runs the policies and owns the partner list, reviewed with the partner register. The security monitor watches blocks that weren't carried by the service: those are either an attack or a broken client. For permissions: Policy Read All for policies, named locations and the tenant restrictions policy; Network Access Read All and Read Write All for signaling and tagging; and Policy Read Write Conditional Access to create the policy, with the two administrator roles activated just for the window.`,
      detail: `Evidence owners: the compliant network policy as a reviewed file (the identity engineer); report-only results read before enforcement, and enforcement only with -AllowEnforce (the policy owner approves enforcement); the TRv2 default, registered partners and tagging (the identity engineer, with the partner register). The guide's Step 7 how-section: the security monitor watches blocks with Through == false, which are either an attack or a broken client. Lab 2 permissions: NetworkAccess.ReadWrite.All, Policy.Read.All, Policy.ReadWrite.ConditionalAccess, Application.Read.All, Directory.ReadWrite.All, LicenseAssignment.Read.All, NetworkAccessPolicy.Read.All; activate Conditional Access Administrator and Global Secure Access Administrator through PIM for the lab only.`,
      cite: ["gsa05-nl", "gsa05-tag", "gsa05-trv2"],
      ref: "“Federal requirements and evidence”; Lab 2",
    },
    {
      part: "How", title: "Lab 1: built right, but not ready",
      body: [
        { terminal: "05-3", lines: "2-7,9" },
        { terminal: "05-4" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 05, “Lab 1: fixtures, no tenant,” steps 3–4.",
      say: `Lab 1, after listing the reads and collecting the pilot tenant. Step 3 checks the compliant network policy. It's built right: the location, the block, both exclusions, no Private Access app. And it has been in report-only for ten business days. But it isn't ready: the service carried three report-only failures. Step 4 reads the guide's query to see why that matters. Forty-one failures came from users off the service, which is exactly what the policy is for. The three with through equal true are defects: users on the service who would have been blocked.`,
      detail: `Step 1: Get-GsaRequiredPermission -Area compliant-network; -Area tenant-restrictions. Step 2: ./Invoke-GsaCollect.ps1 ... -FixturePath tests/fixtures/pilot -OutputPath out/pilot. Step 3: ./Invoke-GsaCheck.ps1 -Area compliant-network ...: GSA-CN-01 to -05 Pass; GSA-CN-06 Info: report-only for 10 business days; 3 failures carried by the service: not ready to enforce. Step 4: (Read-GsaCollection -Path out/pilot)['law-query']['cn-report-only'] | ForEach-Object { [pscustomobject]$_ } | Format-Table Result, Through, count_: reportOnlySuccess true 1830; reportOnlyFailure false 41; reportOnlyFailure true 3. The 41 with Through false are users off the service, which is what the policy is for; the three with Through true are defects.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–4",
    },
    {
      part: "How", title: "Lab 1: a partner nobody registered",
      body: [
        { terminal: "05-5", lines: "2-6,8" },
        { terminal: "05-6", lines: "1-3,8-9" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 05, “Lab 1,” steps 5–6.",
      say: `Step 5 checks the tenant restrictions. The default blocks, and tagging is on. But one partner tenant is allowed with no register entry, and the block query shows a tenant that isn't a registered partner, listed for the weekly review. Step 6 plans ring 1, whose desired state wants the compliant network policy enforced. Without the enforce switch, the plan leaves it report-only and says so on a manual line. A reviewer passes the switch only once step 3's check is clean, which it isn't yet.`,
      detail: `Step 5: ./Invoke-GsaCheck.ps1 -Area tenant-restrictions ...: GSA-TR-01 Pass (users and applications blocked); GSA-TR-02 Pass for the registered partner (EX-05), Fail for the second partner: allowed by TRv2 but not in the exception register; GSA-TR-03 Pass (tagging enabled; default blocking); GSA-TR-04 Info: a resource tenant with 7 blocks (Office 365 Exchange Online), not a registered partner: review weekly. Step 6: ./Invoke-GsaPlan.ps1 ... -DesiredPath config/desired.ring1.json -OutputPath out/plan-ring1: PL-01 WouldApply PATCH NET-PA-AdminRDP-PhishingResistant (Chapter 06); MAN-ENF Manual: NET-CN-Require-Compliant-Network-Pilot stays report-only: enforcing it needs -AllowEnforce after its report-only results are clean; MAN-ASSIGN lines (left out of the slide).`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 5–6",
    },
    {
      part: "How", title: "Lab 1: two weeks later, enforced and clean",
      body: [
        { terminal: "05-7", lines: "24-34,36" },
        { terminal: "05-8" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 05, “Lab 1,” steps 7–8.",
      say: `Step 7 checks the same policy two weeks later, after ring 1's collection. It's enforced, and the check that only applies to an enforced policy passes: signaling is on. The unregistered partner is gone, and the blocked tenant is still listed for review, which is its job. Step 8 runs this chapter's tests: five passed, none failed. Then delete the output folder.`,
      detail: `Step 7: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -OutputPath out/ring1 -AsOf 2026-11-30T12:00:00Z; ./Invoke-GsaCheck.ps1 -Area compliant-network, tenant-restrictions ... -OutputPath out/check-ring1: GSA-CN-07 Pass: enforced; signaling enabled; the unregistered partner is gone; 10 checks (1 Info, 9 Pass). (The collection's output is left out of the slide.) Step 8: Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru: 5 passed, 0 failed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 7–8",
    },
    {
      part: "How", title: "Lab 2: report-only, then Learn's tests",
      body: [
        { steps: [
          { title: "Sign in; find the two Intune apps", text: "Get-MgServicePrincipal for Microsoft Intune Enrollment and Microsoft Intune; into the settings file" },
          { title: "Collect, plan, apply the report-only policy", text: "A desired file with only the compliant network policy; the approved hash" },
          { title: "Learn's disable-and-retry test", text: "Sign in; disable the client; new browser session; sign in again; read the report-only result" },
          { title: "Read TRv2 and check", text: "If the default doesn't block, stop and set it from Book 04, Appendix C" },
          { title: "Learn's four-case test", text: "Member, allowed partner, blocked tenant, guest; record each" },
          { title: "Back it out", text: "Delete the lab's policy; tagging off if the lab turned it on; the TRv2 policy stays" },
        ], pt: 12 },
      ],
      sources: "Sources: Learn, compliant network check; tutorial; Universal Tenant Restrictions. Chapter 05, “Lab 2: a test tenant.”",
      say: `Lab 2 needs a test tenant with the Microsoft profile on for a pilot group, a test device, an emergency access group, and a second test tenant as the partner. Find the two Intune apps and put their IDs in the settings. Collect, plan and apply the report-only policy with the approved hash. Run Learn's test: sign in, disable the client, open a new browser session, and sign in again; in report-only, that's a recorded failure. Read the tenant restrictions policy, and stop if its default doesn't block. Run Learn's four-case test. Then back it out: delete the lab's policy, and turn tagging off if the lab turned it on. The authors haven't run this lab.`,
      detail: `Placeholders: <tenant-id>, <settings-file> (with apps.intuneEnrollment and apps.intune from step 2), <inputs-folder>, <desired-file> (a copy of config/desired.lab.json whose conditionalAccess lists only the compliant network policy file), <plan-sha256>, <workspace-guid>, <policy-id>. 1 Connect-MgGraph -Environment Global with NetworkAccess.ReadWrite.All, Policy.Read.All, Policy.ReadWrite.ConditionalAccess, Application.Read.All and the reads. 2 Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune Enrollment'" | Select-Object AppId; the same for Microsoft Intune. 3 Collect; Invoke-GsaPlan.ps1 -DesiredPath <desired-file>; apply with -ApprovedSha256. 4 On the test device as a pilot user: sign in with the client on; disable it from the tray; new browser session; sign in again; the report-only result is a failure (enforced, it would be "You can't access this right now"); re-enable. az monitor log-analytics query with the report-only query. 5 Collect and check compliant-network and tenant-restrictions. 6 The four-case test from the device with the client on; record each outcome in the change record. 7 Invoke-MgGraphRequest DELETE the policy; PATCH networkPacketTaggingStatus disabled; Disconnect-MgGraph; delete outputs.`,
      cite: ["gsa05-cn", "gsa05-tut", "gsa05-utr"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Keeps it"], w: [5.6, 2.4, 2.3, 1.85], rows: [
          ["The policy as a reviewed file, with its exclusions", "AC-3, SC-23", "IAM-ELP, CNA-ULN", "Identity engineer"],
          ["Report-only read first; enforcement only with -AllowEnforce", "AC-3, AC-12; CM-4", "IAM-APM", "Policy owner"],
          ["TRv2 default blocks; partners registered; tagging on", "AC-20, AC-20(1), AC-4", "IAM-ELP, CNA-MAT", "Identity engineer"],
        ] }, pt: 12 },
        { cols: [[{ bullets: [
          "Enforced before the client is everywhere: CN-06, -AllowEnforce",
          "Intune apps not excluded: CN-04",
          "Tagging with an allowing default: TR-03; the plan refuses",
        ], label: "Dangers and guards", color: "red", pt: 12.5 }], [{ bullets: [
          "10 business days report-only, no defect",
          "-AllowEnforce passed on the record",
          "Every partner allowance registered and owned",
        ], label: "Done when", color: "teal", pt: 12.5 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 05, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `The reviewed policy file supports access enforcement and session authenticity. Reading report-only results before enforcing supports session termination and impact analysis. A blocking default, registered partners and tagging support the controls on external systems and information flow. The assessor decides them. The dangers: enforcing before the client is everywhere, forgetting the Intune exclusions so new devices can't enroll, and tagging with a default that allows everything. A Global Secure Access outage is a danger too: Microsoft's break-glass scripts are rehearsed, and Chapter 8's ring record holds the date. You're done after a clean report-only period, an enforce decision on the record, and an owned partner list. Next, Chapter 6.`,
      detail: `Requirements (config/requirements.json): the compliant network policy as a reviewed file with its exclusions: AC-3, SC-23; KSI-IAM-ELP, KSI-CNA-ULN. Report-only results read before enforcement, and enforcement only with -AllowEnforce: AC-3, AC-12; CM-4; KSI-IAM-APM. The TRv2 default blocks, partners are registered, tagging is on: AC-20, AC-20(1), AC-4; KSI-IAM-ELP, KSI-CNA-MAT. The kit's records support these controls; the agency's assessor decides them. Dangers: enforced before the client is everywhere (GSA-CN-06; -AllowEnforce; Chapter 03's coverage first); the Intune applications not excluded (GSA-CN-04); the emergency group in scope (GSA-CN-03; the plan refuses the file); a Global Secure Access outage (Microsoft's break-glass scripts, rehearsed, Chapter 08's ring record); tagging with an allowing default (GSA-TR-03; the plan refuses); a partner allowance nobody owns (GSA-TR-02). Checklist: report-only for 10 business days with no failure carried by the service; both Intune applications and the emergency group excluded, no Private Access app in scope; -AllowEnforce passed by the policy owner on the record; Learn's tests run and recorded; the TRv2 default blocks and every partner allowance has a register entry. Next: Chapter 06 — Private Applications and Administrative Paths.`,
      cite: ["gsa05-cn"],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
