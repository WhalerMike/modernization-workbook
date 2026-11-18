// Building Global Secure Access, Chapter 06 — Private Applications and Administrative Paths: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/06-private-apps-and-admin-paths.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-06-private-apps-admin-paths/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 6, dir: __dirname,
  base: "DW_GSA_06_Private_Apps_Admin_Paths",
  title: "Private Applications and Administrative Paths",
  map: "Why one app, not a range · what Learn gives and leaves · the nine checks · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Global Secure Access. This is Chapter 6: private applications and administrative paths. A VPN gives a device an address range. Private Access gives a group one application, on its ports, behind its own Conditional Access. The code checks that each app is that narrow, and that administrative paths ask for phishing-resistant authentication. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's Step 6, Private applications, and Step 10, Privileged protocols. The design is Book 09, Chapter 05; the privileged groups behind the administrative apps are Building Privileged Access's. Checks GSA-PA-01 to -09. Lab 1 finds a connector group with one active connector, a Finance app published as a /16 on every port and assigned to a person, an RDP app without the phishing-resistant strength, and Quick Access still in use. Lab 2 publishes one app in a test tenant with the guide's requests, puts its policy on from a plan, and removes both.`,
      cite: ["gsa06-pa"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why one application, not a range",
      body: [
        { lead: "A VPN gives a device an address range. Private Access gives a group one application, on its ports, behind its own Conditional Access." },
        { cols: [[{ bullets: [
          "Show, app by app, that each reaches **only its host and ports, only for its group**",
          "Under a policy that excludes emergency access",
          "Administrative RDP and SSH require **phishing-resistant** authentication",
          "Connectors that survive a patch night",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The platform owner (servers), application owners",
          "The privileged access owner",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 06, opening, “Goal and audience.”",
      say: `Why narrow? Because a compromised user or device on a VPN address pool can move laterally across everything the pool reaches. Private Access replaces the range with one application for one group, behind that application's own policy. So the goal: show, application by application, that each reaches only its host and ports, only for its group, under a policy that excludes emergency access; that administrative RDP and SSH require phishing-resistant authentication; and that connectors survive a patch night. It's for the developers, the server and application owners, and the privileged access owner.`,
      detail: `Goal: show, application by application, that each Private Access app reaches only its host and ports, only for its group, under a policy that excludes emergency access, and that administrative RDP and SSH require phishing-resistant authentication, with connectors that survive a patch night. Audience: developers who build or maintain the kit, the platform owner (servers) who runs the connectors, application owners, and the privileged access owner. The guide's attack chain for Step 6: a compromised user or device moving laterally across a VPN address pool.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["The Private Access Graph tutorial", "Create from the custom template, mark it Private Access, bind a connector group, add segments, assign a group"],
          ["Segments", "No overlap between per-app apps; per-app overrides Quick Access; up to 15 minutes to take effect"],
          ["Connectors", "Directory.ReadWrite.All, delegated only; status active or inactive; version"],
          ["Zero Trust recommendations", "Two healthy, current connectors per group; least-privilege segments; every app assigned"],
          ["Domain controllers", "The Private Access sensor, Audit first; application SPNs before the DC's own"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Private Access Graph tutorial; per-app access; connector pages; Zero Trust: Protect networks; DCs.",
      say: `Learn's Private Access tutorial creates an application from the custom template, marks it a Private Access app, binds it to a connector group, adds its segments and assigns a group with the app's user role. Segments may not overlap between per-app applications; a per-app segment overrides Quick Access; and clients can take fifteen minutes to see a change. Connectors are read with a write-capable permission and report active or inactive, and their version. Learn's Zero Trust recommendations ask for two healthy, current connectors per group, least-privilege segments and every app assigned. And for domain controllers, the sensor starts in audit, with application service names before the DC's own.`,
      detail: `Learn's Private Access Graph tutorial creates an application from the custom application template, marks it a Private Access app (onPremisesPublishing with isAccessibleViaZTNAClient), binds it to a connector group, adds application segments, and assigns a group with the app's User role. Segments may not overlap between per-app applications; a per-app segment overrides an overlapping Quick Access segment; clients take up to 15 minutes to pick up a change. Connector groups and their members are read with Directory.ReadWrite.All, delegated only; a connector has status (active or inactive) and version. Learn's Zero Trust recommendations ask for healthy, current connectors with at least two per group, least-privilege segments, every app assigned, and phishing-resistant authentication for domain controller RDP; Learn's domain controller page adds the Private Access sensor, in Audit first, with application SPNs before the DC's own.`,
      cite: ["gsa06-pa", "gsa06-perapp", "gsa06-cg", "gsa06-conn", "gsa06-zt", "gsa06-dc"],
      ref: "“What Microsoft gives you”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.4, 3.4, 5.35], rows: [
          ["Requests that create one app", "No read back of all apps", "The private-apps read (unverified until a Learn page gives it); Lab 2 compares with the portal"],
          ["Two connectors per group", "One inactive connector looks fine in a list", "PA-01 counts active members; PA-02 compares versions"],
          ["Least-privilege segments", "A /16 on every port is the VPN again", "PA-04 fails wider than /24 or 1-65535; PA-05 overlaps"],
          ["Assign a group", "Direct assignments escape reviews", "PA-06"],
          ["Phishing-resistant RDP, in prose", "Plain MFA passes a casual look", "PA-08: 22 or 3389 needs strength ...0004 and a compliant device"],
          ["Quick Access as a bridge", "It quietly becomes permanent", "PA-03 warns until zero; Chapter 08's metric"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Learn, Private Access tutorial; per-app access; Zero Trust: Protect networks. Chapter 06, “What it leaves to you.”",
      say: `What does it leave to you? The requests create one app, but nothing reads all of them back with their segments and assignments, so the kit has a read for that, marked unverified, and the lab compares it with the portal. A group with one inactive connector looks fine in a list, so the kit counts active members. A wide range on every port is the VPN again, so wide segments and overlaps fail. A person assigned directly escapes the access review. Plain MFA on RDP passes a casual look, so any app covering port 22 or 3389 needs the phishing-resistant strength and a compliant device. And Quick Access is tracked until it's empty.`,
      detail: `Each row is pinned by a test in the Chapter 06 or Plans blocks. Requests that create one app: the private-apps read, one record per app (marked unverified until a Learn page gives the request); Lab 2 compares it with the portal. "At least two connectors per group": GSA-PA-01 counts active connectors per group from its members; GSA-PA-02 compares versions with minConnectorVersion. "Least-privilege segments": GSA-PA-04 fails an IP range wider than /24 or ports 1-65535; GSA-PA-05 fails overlaps. "Assign a group, not individuals": GSA-PA-06. Phishing-resistant RDP, in prose: GSA-PA-08, any app whose segment covers 22 or 3389 needs strength 00000000-0000-0000-0000-000000000004 and a compliant device. Quick Access as a bridge: GSA-PA-03 warns while it holds segments; Chapter 08 counts them as a metric. The domain controller sensor is configured on the DCs and in the portal; the kit doesn't read it; its evidence is the guide's klist test record and the sensor's mode.`,
      cite: ["gsa06-pa", "gsa06-zt"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The nine private access checks",
      body: [
        { table: { head: ["Check", "What it looks for"], w: [2.0, 10.15], rows: [
          ["GSA-PA-01, -02", "Two or more active connectors per group; every connector at the minimum version"],
          ["GSA-PA-03", "Segments left in Quick Access (Warn until zero)"],
          ["GSA-PA-04, -05", "Each segment a host or narrow range on named ports; no overlaps"],
          ["GSA-PA-06", "Group assignments only"],
          ["GSA-PA-07", "A NET-PA- policy targets the app and excludes the emergency group"],
          ["GSA-PA-08", "RDP and SSH apps require the phishing-resistant strength and a compliant device"],
          ["GSA-PA-09", "Private sessions in the last day, by destination (Info)"],
        ] }, pt: 13 },
        { callout: "the administrative policy is a reviewed file, the guide's Step 10.2 policy. When the tenant's copy drifts, the plan's ca-update step brings it back.", label: "And: ", icon: "FaShieldHalved", color: "amber" },
      ],
      sources: "Sources: examples/global-secure-access (Test-GsaPrivateAccess; config/policies). Chapter 06, “The code.”",
      say: `Nine checks. Two or more active connectors per group, each at the minimum version. Segments left in Quick Access, a warning until there are none. Each segment a host or a narrow range, on named ports, with no overlaps. Group assignments only. A policy that targets the app and excludes the emergency group. RDP and SSH apps that require the phishing-resistant strength and a compliant device. And the last day's private sessions by destination, to compare with the assignments. The administrative policy is a reviewed file, the guide's own; when the tenant's copy drifts, the plan brings it back.`,
      detail: `GSA-PA-01 two or more active connectors per group. GSA-PA-02 every connector at minConnectorVersion or later. GSA-PA-03 segments left in Quick Access (Warn until zero). GSA-PA-04 each segment is a host, or a narrow range, on named ports. GSA-PA-05 no two per-app segments overlap. GSA-PA-06 group assignments only. GSA-PA-07 a NET-PA- policy targets the app and excludes the emergency access group. GSA-PA-08 RDP and SSH apps require the phishing-resistant strength and a compliant device. GSA-PA-09 private sessions in the last day, by destination (Info, to compare with assignments). The administrative policy is config/policies/NET-PA-AdminRDP-PhishingResistant.json, the guide's Step 10.2 policy; when the tenant's copy drifts (the pilot's asks only for MFA), the plan's ca-update step brings it back to the file.`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who owns apps, connectors and admin paths",
      body: [
        { cols: [[{ bullets: [
          "**Application owner**: the app's assignment, reviewed each quarter",
          "**Platform owner (servers)**: two healthy, current connectors per group",
          "**Privileged access owner**: admin apps and the DC sensor (Building Privileged Access)",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "Directory.ReadWrite.All for connectors; Application.Read.All for apps (unverified)",
          "Policy.Read.All and Policy.ReadWrite.ConditionalAccess for policies",
          "GSA, Application and Conditional Access Administrator via PIM, for the lab",
        ], label: "Permissions and roles", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Learn, connector pages. Chapter 06, “Federal requirements,” Lab 2; guide Step 6 day-two ownership.",
      say: `Who owns what? Application owners own their app's assignment and review it each quarter. The platform owner for servers keeps two healthy, current connectors in every group. The privileged access owner owns the administrative apps and the domain controller sensor, and that's where Building Privileged Access comes in, for the privileged groups behind them. For permissions: a write-capable delegated permission for the connector reads, an application read for the apps, which isn't verified yet, the policy permissions, and three administrator roles activated just for the lab.`,
      detail: `Evidence owners (Chapter 06): each app reaches one host and its ports, for one group (the application owner; the platform owner); two active, current connectors per group (the platform owner, servers); administrative paths require phishing-resistant authentication and a compliant device (the privileged access owner); each app's policy, planned and approved by its hash (the change record). The guide's day-two ownership: the application owner reviews the assignment each quarter (an access review); the platform owner keeps at least two healthy, current connectors per group. Lab 2: activate Global Secure Access Administrator, Application Administrator and Conditional Access Administrator through PIM for the lab only.`,
      cite: ["gsa06-cg"],
      ref: "“Federal requirements and evidence”; Lab 2",
    },
    {
      part: "How", title: "Lab 1: the connectors, group by group",
      body: [
        { terminal: "06-3", lines: "3-8" },
        { terminal: "06-4", lines: "2-5,9-12,16-17" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 06, “Lab 1: fixtures, no tenant,” steps 3–4.",
      say: `Lab 1, after listing the reads and collecting the pilot. Step 3 reads the connectors group by group. Headquarters has two active connectors on the current version. The cloud group has one active and one inactive, and the active one is old. Step 4 runs the checks. Both connector problems fail. The Finance app is a slash sixteen on every port, assigned to a person, under an enforced policy that doesn't exclude emergency access. Because every port includes RDP, it's an administrative path too. The RDP app asks only for MFA. And Quick Access still holds two segments.`,
      detail: `Step 1: Get-GsaRequiredPermission -Area private-access | Format-Table (private-apps is the read without a verified Learn page). Step 2: collect the pilot. Step 3: $c = Read-GsaCollection -Path out/pilot; for each connector group, its members as Group, Connector, Status, Version: CG-HQ con01 and con02 active 1.5.4522.0; CG-Cloud-East con11 active 1.5.3437.0, con12 inactive 1.5.4522.0. Step 4: ./Invoke-GsaCheck.ps1 -Area private-access ...: GSA-PA-01 Fail CG-Cloud-East 1 of 2 active; GSA-PA-02 Fail below 1.5.4522.0; PA-Finance: GSA-PA-04 Fail 10.20.0.0/16 ports 1-65535, GSA-PA-06 Fail 0 group and 1 direct assignments, GSA-PA-07 Fail (enabled) emergency group NOT excluded, GSA-PA-08 Fail; PA-AdminRDP-Tier1 GSA-PA-08 Fail; GSA-PA-03 Warn 2 segments in Quick Access. (Passing rows are left out of the slide.)`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–4",
    },
    {
      part: "How", title: "Lab 1: the plan restores the RDP policy",
      body: [
        { terminal: "06-5", lines: "1-3,7-8" },
        { terminal: "06-5", lines: "9-18", label: "examples/global-secure-access  ·  the ca-update step's grant controls  ·  real output" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures; config/policies). Chapter 06, “Lab 1,” step 5.",
      say: `Step 5 plans the pilot and reads the administrative policy's fix. The plan has two Graph steps: the internet profile off, and a patch for the RDP policy, because the tenant's copy differs from the reviewed file. The body of that patch sets the built-in phishing-resistant authentication strength, the one ending in four, and a compliant device. That's the guide's Step 10 policy, as written. Nothing is sent: it's a dry run, and fixture mode never applies.`,
      detail: `Step 5: ./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -DesiredPath config/desired.lab.json -OutputPath out/plan -AsOf 2026-11-16T12:00:00Z; (Read-GsaJson -Path out/plan/plan.json).steps | Where-Object { $_.call -eq 'ca-update' } | ForEach-Object { $_.body.grantControls | ConvertTo-Json -Depth 5 }. PL-01 WouldApply PATCH internet profile enabled -> disabled; PL-02 WouldApply PATCH NET-PA-AdminRDP-PhishingResistant: conditions or controls differ from the reviewed file. The body: operator AND, builtInControls compliantDevice, authenticationStrength id 00000000-0000-0000-0000-000000000004. (The MAN-ASSIGN lines are left out of the slide.)`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 5",
    },
    {
      part: "How", title: "Lab 1: two weeks later, every app passes",
      body: [
        { terminal: "06-6", lines: "24,27-28,32-34,38-39,42" },
        { terminal: "06-7" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 06, “Lab 1,” steps 6–7.",
      say: `Step 6 checks the tenant two weeks later. Finance is one host on port 443 for the pilot group, with the emergency group excluded. Both cloud connectors are active and current. The RDP policy has its strength and a compliant device. And Quick Access is empty. Every check passes. Step 7 runs this chapter's tests: four passed, none failed. Then delete the output folder.`,
      detail: `Step 6: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -OutputPath out/ring1 -AsOf 2026-11-30T12:00:00Z; ./Invoke-GsaCheck.ps1 -Area private-access ... -OutputPath out/check-pa-ring1: CG-Cloud-East 2 of 2 active, every connector at 1.5.4522.0 or later; PA-Finance fin01.contoso.example ports 443-443, 1 group, emergency group excluded; PA-AdminRDP-Tier1 phishing-resistant strength required, compliant device required; Quick Access 0 segments. private-access: 16 checks (1 Info, 15 Pass). Step 7: Invoke-Pester -FullNameFilter 'Chapter 06*': 4 passed, 0 failed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–7",
    },
    {
      part: "How", title: "Lab 2: publish one app, then remove it",
      body: [
        { steps: [
          { title: "Sign in", text: "Application, directory, app role assignment and policy permissions, as a person" },
          { title: "Publish one app with the guide's Steps 6.1–6.4", text: "Named PA-HR-Portal, so the reviewed policy file finds it; one host on 443; the pilot group" },
          { title: "Collect and check", text: "Compare private-apps with the portal first; PA-07 fails: no policy yet" },
          { title: "Plan and apply the app's policy, report-only", text: "The approved hash" },
          { title: "Validate", text: "Reach the host on 443 off the corporate network; another port fails; Policy tester" },
          { title: "Back it out", text: "Delete the policy, then the application" },
        ], pt: 12 },
      ],
      sources: "Sources: Learn, Private Access tutorial; per-app access. Chapter 06, “Lab 2: a test tenant.”",
      say: `Lab 2 needs a test tenant with Private Access licenses, a connector group with two connectors on Windows Server 2019 or later, a test server and a pilot group. Publish one app with the guide's own requests, named so the kit's reviewed policy file finds it, one host on 443, for the pilot group. Collect and check, comparing the app read with the portal first; the policy check fails, because there's no policy yet. Plan and apply its policy in report-only. Then validate: from a device off the corporate network, the host is reachable on 443 and not on another port. Back it out by deleting the policy, then the application. The authors haven't run this lab.`,
      detail: `Placeholders: <tenant-id>, <settings-file>, <inputs-folder>, <connector-group-id>, <app-fqdn>, <pilot-group-id>, <app-object-id>, <sp-object-id>, <user-role-id>, <desired-file> (conditionalAccess lists only policies/NET-PA-PA-HR-Portal-Device-MFA.json), <plan-sha256>, <policy-id>. 1 Connect-MgGraph -Environment Global with Application.ReadWrite.All, Directory.ReadWrite.All, AppRoleAssignment.ReadWrite.All, Policy.Read.All, Policy.ReadWrite.ConditionalAccess and the reads. 2 The guide's Steps 6.1 to 6.4: instantiate template 8adf8e6e-67b2-4cf2-a259-e3dc5476c621 as PA-HR-Portal; PATCH onPremisesPublishing (nonwebapp, isAccessibleViaZTNAClient); PUT the connectorGroup $ref; POST the segment (<app-fqdn>, 443-443, tcp); read the app roles; POST the app role assignment for the pilot group. 3 Collect -AllowUnverified; check private-access; compare with Global Secure Access > Applications > Enterprise applications. 4 Plan and apply with the approved hash. 5 From a pilot device off the corporate network: reach <app-fqdn> on 443, confirm another port fails, Advanced diagnostics > Forwarding profile > Policy tester. 6 DELETE the policy, then DELETE the application; Disconnect-MgGraph; delete outputs.`,
      cite: ["gsa06-pa", "gsa06-perapp"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Keeps it"], w: [5.3, 2.7, 2.3, 1.85], rows: [
          ["Each app: one host and its ports, for one group", "AC-3, AC-6, AC-17(3)", "IAM-ELP, CNA-ULN, CNA-MAT", "App owner"],
          ["Two active, current connectors per group", "AC-17", "CNA-ULN", "Platform owner"],
          ["Admin paths: phishing-resistant and a compliant device", "IA-2(1), IA-2(2), AC-6(9)", "IAM-APM, IAM-ELP", "Privileged access owner"],
        ] }, pt: 12 },
        { cols: [[{ bullets: [
          "A wide segment: the VPN under a new name (PA-04)",
          "One active connector: a patch takes the app down (PA-01)",
          "Plain MFA on RDP: a phished admin reaches a server (PA-08)",
        ], label: "Dangers and guards", color: "red", pt: 12.5 }], [{ bullets: [
          "Every group: two active, current connectors",
          "Every app: narrow segments, a group, a policy",
          "RDP and SSH: the strength and a compliant device",
        ], label: "Done when", color: "teal", pt: 12.5 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 06, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `Narrow apps for one group support access enforcement, least privilege and managed access control points. Resilient connectors support remote access. Phishing-resistant administrative paths support multifactor authentication and logging privileged functions; the guide lists OMB M-22-09's phishing-resistant MFA and VPN-free application access among the requirements this supports. The assessor decides the controls. The dangers: a wide segment, a group with one connector, plain MFA on RDP, Quick Access left as a range, and protecting a domain controller's own service name before the applications', which can lock administrators out. You're done when every group, every app and every administrative path passes. Next, Chapter 7.`,
      detail: `Requirements (config/requirements.json): each app reaches one host and its ports, for one group: AC-3, AC-6, AC-17(3); KSI-IAM-ELP, KSI-CNA-ULN, KSI-CNA-MAT. Two active, current connectors per group: AC-17; KSI-CNA-ULN. Administrative paths require phishing-resistant authentication and a compliant device: IA-2(1), IA-2(2), AC-6(9); KSI-IAM-APM, KSI-IAM-ELP. Each app's policy planned and approved by its hash: CM-3; KSI-CMT-LMC. M-22-09's application access without a VPN and its phishing-resistant MFA are the memo's requirements this step supports, as the guide's table says. The kit's records support these controls; the agency's assessor decides them. Dangers: a wide segment (GSA-PA-04); one active connector (GSA-PA-01); a person assigned instead of a group (GSA-PA-06); plain MFA on RDP (GSA-PA-08; the plan restores the reviewed file); Quick Access left as a range (GSA-PA-03 and Chapter 08's metric); the DC's own SPN protected first (Learn's order; the guide's break-glass mode, outside the kit). Checklist: every connector group has two or more active connectors at the current version; every per-app segment is narrow, with no overlaps; every app assigned to a group with a NET-PA- policy that excludes emergency access; RDP and SSH apps require the strength and a compliant device; a plan for Quick Access to reach zero; the private-apps read compared with the portal. Next: Chapter 07 — Internet Access, QUIC and TLS Inspection.`,
      cite: ["gsa06-dc"],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
