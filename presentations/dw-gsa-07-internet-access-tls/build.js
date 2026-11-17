// Building Global Secure Access, Chapter 07 — Internet Access, QUIC and TLS Inspection: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/07-internet-access-and-tls-inspection.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-07-internet-access-tls/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 7, dir: __dirname,
  base: "DW_GSA_07_Internet_Access_TLS",
  title: "Internet Access, QUIC and TLS Inspection",
  map: "Why bypasses, QUIC and the CA · what Learn gives and leaves · GCC's interim path · twelve checks · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Global Secure Access. This is Chapter 7: Internet Access, QUIC, and TLS inspection. Filtering the web by identity is the easy part. The hard parts are the bypasses that never expire, the protocol the service doesn't carry, and a certificate authority that could impersonate every site. The code watches all three. This is also the chapter where GCC availability bites. The chapter is a draft awaiting review, and the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's Step 5, Internet traffic, and Step 9, TLS inspection, which the run order puts last among the controls, after filtering works on server names. Checks GSA-IA-01 to -06 and GSA-TLS-01 to -06. The cloud firewall for clients is a preview whose GCC availability isn't stated, so the kit checks the guide's interim path instead. Lab 1 finds an expired bypass, a bypass nobody approved, an inspection certificate 74 days from expiry and a 1.5% failure share. Lab 2 builds a pilot security profile in a test tenant, blocks QUIC on a test device and reads the outcomes.`,
      cite: ["gsa07-ia", "gsa07-limits"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why bypasses, QUIC and the CA",
      body: [
        { lead: "Filtering the web by identity is the easy part. The hard parts are what get around it." },
        { cols: [[{ bullets: [
          "Web traffic filtered by an **identity-aware** policy",
          "Every exception has an **owner and an end date**",
          "QUIC can't slip past the filter",
          "TLS inspection from a **dedicated CA**, within an approved privacy scope, under 1% failures",
        ], label: "By the end of the chapter you can show", color: "navy", pt: 13.5 }], [{ bullets: [
          "Developers; the platform owner",
          "The policy owner (categories, bypasses)",
          "The privacy officer",
          "The PKI team",
        ], label: "Who it's for", color: "teal", pt: 13.5 }]] },
      ],
      sources: "Sources: Chapter 07, opening, “Goal and audience.”",
      say: `Why these three? A bypass with no end date is a permanent hole in the filter. QUIC isn't forwarded end to end, so a browser could carry web traffic around the service. And a TLS inspection certificate authority that's compromised could impersonate any site to every managed device. So the goal: show that the ring's web traffic is filtered by an identity-aware policy, that every exception has an owner and an end date, that QUIC can't slip past it, and that inspection runs from a dedicated authority, within an approved privacy scope, breaking under one percent of sessions.`,
      detail: `Goal: show that the ring's web traffic is filtered by an identity-aware policy, that every exception to it has an owner and an end date, that QUIC can't slip past it, and that TLS inspection runs from a dedicated CA, within an approved privacy scope, without breaking more than 1% of sessions. Audience: developers who build or maintain the kit, the platform owner, the policy owner who approves categories and bypasses, the privacy officer, and the PKI team. The guide's Step 9 position: a compromised inspection CA can impersonate any site to every managed device.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.4, 8.75], rows: [
          ["Internet Access Graph tutorial", "Filtering policy, security profile, link, and a CA policy with the security profile session control"],
          ["Limits", "256 profiles, 1,000 policies, 1,000 rules, 8,000 destinations; QUIC not forwarded end to end"],
          ["QUIC", "A cloud firewall rule (preview), or Windows Firewall on outbound UDP 443"],
          ["Allow-lists", "Set an expiration or review date"],
          ["Inspection certificate", "Server Auth, CA:TRUE, pathLen 1, at least six months; one active; renew 90 days ahead"],
          ["Dedicated CA; outcomes", "“a dedicated CA for TLS inspection, not your production PKI”; TlsStatus; above 1% failures is systemic"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Learn, Internet Access tutorial; limits; TLS policies; operations; own certificate; TLS tutorial; concept; Zero Trust.",
      say: `Learn's Internet Access tutorial creates a filtering policy, a security profile, the link between them, and a Conditional Access policy that assigns the profile. Its limits are generous, but Internet Access doesn't forward QUIC end to end. Learn's newer pages block QUIC with a cloud firewall rule, which is preview; its TLS page uses Windows Firewall instead. Learn asks for an expiration or review date on allow-list entries. The agency's inspection intermediate needs specific extensions and at least six months' validity, only one is active, and renewal starts ninety days ahead. Learn suggests a dedicated authority, not the production PKI, and Microsoft treats failures above one percent as systemic.`,
      detail: `Learn's Internet Access Graph tutorial creates a filtering policy, a security (filtering) profile, a link between them, and a Conditional Access policy targeting All internet resources with Global Secure Access with the globalSecureAccessFilteringProfile session control. Security profiles are listed with NetworkAccess.Read.All, and each lists its conditionalAccessPolicies. Learn's limits are 256 security profiles, 1,000 policies, 1,000 rules and 8,000 destinations per tenant; Internet Access doesn't forward QUIC end to end. Learn's newer pages handle QUIC with a cloud firewall rule, which is preview; its TLS page blocks outbound UDP 443 with Windows Firewall. Learn's change guidance asks for an expiration or review date on allow-list entries. The agency's own intermediate needs Server Auth, CA:TRUE, pathLenConstraint=1, at least six months' validity, and only one can be active; Learn's tutorial suggests "a dedicated CA for TLS inspection, not your production PKI"; an expired certificate disables all TLS inspection, and renewal starts 90 days ahead; the traffic logs carry TlsAction and TlsStatus; Microsoft treats a failure rate above 1% as systemic.`,
      cite: ["gsa07-ia", "gsa07-sp", "gsa07-limits", "gsa07-tls", "gsa07-ops", "gsa07-byoc", "gsa07-tlstut", "gsa07-opsia", "gsa07-concept", "gsa07-zt"],
      ref: "“What Microsoft gives you”",
    },
    {
      part: "What", title: "GCC: QUIC through the interim path",
      body: [
        { table: { head: ["Feature", "GCC (guide's table)", "What the kit expects instead"], w: [3.6, 2.6, 5.95], rows: [
          ["Cloud firewall for clients", "Not yet specified (preview)", "Block outbound UDP 443 with an Intune-delivered Windows Firewall rule, piloted first"],
          ["Explicit Forward Proxy", "Not yet specified (preview)", "Client acquisition only; a PAC file excludes what the client tunnels"],
          ["HTTP method filtering", "Not yet specified (preview)", "Category and FQDN filtering in security profiles"],
          ["Web filtering, threat intelligence, TLS inspection", "Available (product-wide)", "—"],
        ] }, pt: 12.5 },
        { callout: "GSA-IA-05 passes only when the architecture record names the interim block (method, profile, ring); a decision using the preview without an exception fails GSA-DEC-07.", label: "In the kit: ", icon: "FaCloud", color: "teal" },
      ],
      sources: "Sources: Learn, Known limitations; TLS policies. Chapter 07, “What it leaves to you”; guide, availability table and Step 5.6.",
      say: `Here's where GCC bites. In the guide's table, web filtering, threat intelligence and TLS inspection rest on Learn's product-wide GCC sentence. But the cloud firewall for clients, the Explicit Forward Proxy and HTTP method filtering are previews whose GCC availability isn't stated. So the kit doesn't assume them. For QUIC, it expects the guide's interim path: an Intune-delivered Windows Firewall rule blocking outbound UDP 443, piloted first and recorded in the architecture record. The QUIC check passes only when that block is recorded, and a decision that leans on the preview fails Chapter 1's check.`,
      detail: `The guide's availability table (config/availability.json): Internet Access web content filtering, threat intelligence and security profiles; TLS inspection: available (product-wide). Cloud firewall for clients, Explicit Forward Proxy, source traffic type and HTTP method filtering: not yet specified (preview). Interim paths: block QUIC (outbound UDP 443) with an Intune-delivered Windows Firewall rule, piloted first (the guide's Step 5.6), recorded in the architecture record's quicBlock; acquire traffic with the client only, and where a PAC file stays, exclude every FQDN and IP the client tunnels (Step 11.2); filter by web category and FQDN in security profiles. GSA-IA-05 requires the interim block recorded (method, profile, assignedTo). GSA-DEC-07 fails a decision using a preview feature without an approved exception.`,
      cite: ["gsa07-limits", "gsa07-tls"],
      ref: "“What it leaves to you”; “The code”",
    },
    {
      part: "What", title: "Twelve checks: six for filtering, six for TLS",
      body: [
        { cols: [[{ table: { head: ["Check", "Internet Access"], w: [1.1, 4.85], rows: [
          ["IA-01", "NET-IA policy links an existing profile; emergency excluded"],
          ["IA-02, -03", "High-risk categories blocked; threat intelligence"],
          ["IA-04", "Each bypass owned, approved, unexpired"],
          ["IA-05", "QUIC blocked by the interim path"],
          ["IA-06", "Within 256 profiles, 1,000 policies"],
        ] }, pt: 11.5 }], [{ table: { head: ["Check", "TLS inspection"], w: [1.1, 4.85], rows: [
          ["TLS-01", "Over 90 days left; six months' validity"],
          ["TLS-02", "Issuer isn't an authentication CA"],
          ["TLS-03", "Not on the baseline profile before ring 3"],
          ["TLS-04", "Privacy approval and user notice"],
          ["TLS-05", "Each custom bypass registered"],
          ["TLS-06", "Failure share under 1%"],
        ] }, pt: 11.5 }]] },
        { callout: "no Graph read for TLS inspection was verified for the kit, so the TLS record is the platform owner's export from the portal.", label: "Note: ", icon: "FaLightbulb", color: "amber" },
      ],
      sources: "Sources: examples/global-secure-access (Test-GsaInternetAccess, Test-GsaTls; templates/tls.template.json). Chapter 07, “The code.”",
      say: `Twelve checks. For filtering: each Internet Access policy links an existing profile and excludes emergency access; the acceptable-use categories and threat intelligence are blocked; every bypass is owned, approved and unexpired; QUIC is blocked by the interim path; and the tenant is inside Learn's limits. For TLS: more than ninety days left on a certificate issued for at least six months; an issuer that isn't an authentication authority; never the baseline profile before ring 3; the privacy approval and user notice recorded; every custom bypass registered; and failures under one percent. One note: no Graph read for TLS inspection was verified, so its record comes from the portal.`,
      detail: `GSA-IA-01 each NET-IA- policy links an existing security profile and excludes the emergency group. GSA-IA-02, -03 the high-risk categories are blocked; a threat intelligence policy exists. GSA-IA-04 each custom bypass is owned, approved and unexpired. GSA-IA-05 QUIC is blocked by the interim path while the cloud firewall for clients isn't available. GSA-IA-06 within 256 profiles and 1,000 policies. GSA-TLS-01 more than 90 days left, and at least six months' validity. GSA-TLS-02 the issuer isn't an authentication CA. GSA-TLS-03 not linked to the baseline profile before ring 3. GSA-TLS-04 the privacy approval and user notice are recorded. GSA-TLS-05 each custom bypass in a TLS policy is in the register, current. GSA-TLS-06 Failure sessions under 1% of the sessions with a TLS status. No Graph request for TLS inspection policies or certificates was verified for the kit (research gap 6), so templates/tls.json is the platform owner's export from the portal. The guide notes TlsStatus values differ between Learn pages (research gap 5).`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who approves categories, bypasses, privacy",
      body: [
        { cols: [[{ bullets: [
          "**Policy owner**: approves categories and each bypass, reviews bypasses quarterly",
          "**Privacy officer**: approves the inspection scope",
          "**PKI team**: the dedicated issuing CA",
          "**Platform owner**: applies; renews the certificate 90 days ahead",
          "**Security monitor**: failure rate, top blocked destinations",
        ], label: "Roles", color: "teal", pt: 13.5 }], [{ bullets: [
          "NetworkAccess.Read.All / ReadWrite.All: profiles and policies",
          "Policy.ReadWrite.ConditionalAccess: the NET-IA policy",
          "GSA and Conditional Access Administrator via PIM, for the lab",
        ], label: "Permissions and roles", color: "navy", pt: 13.5 }]] },
      ],
      sources: "Sources: Learn, filteringProfiles; operations. Chapter 07, “Federal requirements,” Lab 2; guide Steps 5 and 9 day-two ownership.",
      say: `Who's involved? The policy owner approves categories and every bypass, and reviews bypasses each quarter. The privacy officer approves the inspection scope before it starts. The PKI team runs the dedicated issuing authority. The platform owner applies the changes and renews the certificate ninety days ahead. And the security monitor watches the failure rate and the top blocked destinations. For permissions: Network Access read and write for the profiles and policies, Policy Read Write Conditional Access for the Internet Access policy, and two administrator roles activated just for the lab.`,
      detail: `Evidence owners (Chapter 07): web access filtered by an identity-aware profile (the platform owner; the policy owner approves categories); every bypass has an owner, an approver and an end date (the policy owner keeps the register); QUIC blocked by the interim path (the endpoint engineer); inspection from a dedicated CA, renewed in time, within an approved privacy scope, under 1% failures (the platform owner; the privacy officer keeps the approval). The guide's day-two ownership: the policy owner approves category changes and reviews bypasses each quarter; the platform owner renews the certificate at least 90 days before expiry; the security monitor reviews top blocked destinations weekly and alerts on failure rate. Lab 2: activate Global Secure Access Administrator and Conditional Access Administrator through PIM for the lab only.`,
      cite: ["gsa07-sp", "gsa07-opsia"],
      ref: "“Federal requirements and evidence”; Lab 2",
    },
    {
      part: "How", title: "Lab 1: two bypasses fail",
      body: [
        { terminal: "07-4", lines: "2-6,8" },
        { terminal: "07-5" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 07, “Lab 1: fixtures, no tenant,” steps 4–5.",
      say: `Lab 1, after listing the reads, reading the GCC rows for Step 5, and collecting the pilot. Step 4 runs the Internet Access checks. The profile, the categories, threat intelligence, the QUIC interim block and the limits all pass. Two bypasses fail: E X 3 expired on November first, and E X 4 has no approver. Step 5 reads the bypass rows of the exception register, the agency's own record: target, reason, owner, approver and expiry.`,
      detail: `Step 1: Get-GsaRequiredPermission -Area internet-access. Step 2: Get-GsaAvailability | Where-Object step -EQ 5 | Format-Table id, gcc, status, interim -Wrap: internet-filtering available ga; cloud-firewall-clients, explicit-forward-proxy, http-method-filtering not yet specified preview, each with its interim path. Step 3: collect the pilot. Step 4: ./Invoke-GsaCheck.ps1 -Area internet-access ...: GSA-IA-01, -02, -03, -05, -06 Pass; GSA-IA-04 Fail bypass EX-03 *.payroll-partner.example expires 2026-11-01 (expired); GSA-IA-04 Fail bypass EX-04 updates.vendor.example approver none. Step 5: Import-Csv tests/fixtures/pilot/inputs/exceptions.csv | Where-Object kind -EQ 'custom-bypass' | Format-Table id, target, reason, owner, approver, expires. (The QUIC row, whose text is long, is left out of the slide's first panel.)`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–5",
    },
    {
      part: "How", title: "Lab 1: TLS — a certificate near expiry",
      body: [
        { terminal: "07-6" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 07, “Lab 1,” step 6.",
      say: `Step 6 runs the TLS checks. Three fail. The certificate has seventy-four days left, inside the ninety-day renewal window, and it was issued for only ninety days, short of Learn's six months. The pinned payroll site's bypass is E X 3, which expired. And one and a half percent of sessions failed, above the one percent threshold. Three pass: the issuer is a dedicated inspection authority, not the authentication one; the policy is linked only to the pilot's profile; and the privacy approval and the user notice came before inspection started.`,
      detail: `Step 6: ./Invoke-GsaCheck.ps1 -Area tls -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-tls -AsOf 2026-11-16T12:00:00Z. GSA-TLS-01 Fail: certificate contosotls1, 74 days left (renew 90 days ahead); valid for 90 days in all (Learn: at least six months). GSA-TLS-02 Pass: issuer Contoso TLS Inspection CA. GSA-TLS-03 Pass: policy TLS-Pilot linked to SP-Pilot. GSA-TLS-05 Fail: custom bypass *.payroll-partner.example is EX-03, expires 2026-11-01. GSA-TLS-04 Pass: approved 2026-11-05 by Privacy officer; user notice 2026-11-06. GSA-TLS-06 Fail: failure share 1.5% of 10000 sessions (threshold 1%). tls: 6 checks (3 Fail, 3 Pass).`,
      cite: ["gsa07-byoc", "gsa07-zt"],
      ref: "“Lab 1: fixtures, no tenant,” step 6",
    },
    {
      part: "How", title: "Lab 1: two weeks later, thirteen pass",
      body: [
        { terminal: "07-7", lines: "33,37-38,41,44,46,48" },
        { terminal: "07-8" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 07, “Lab 1,” steps 7–8.",
      say: `Step 7 checks both areas two weeks later, after the certificate was rolled, the bypasses renewed and approved, and the failing destinations bypassed. The certificate has a hundred and eighty days left on two hundred and ten. Both bypasses have an approver and a future date. The failure share is half a percent. All thirteen checks pass. Step 8 runs this chapter's tests: six passed, none failed. Then delete the output folder.`,
      detail: `Step 7: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -OutputPath out/ring1 -AsOf 2026-11-30T12:00:00Z; ./Invoke-GsaCheck.ps1 -Area internet-access, tls ... -OutputPath out/check-ring1: GSA-IA-04 Pass for EX-03 (expires 2027-02-01) and EX-04 (approver Policy owner); GSA-TLS-01 Pass 180 days left, valid for 210 days; GSA-TLS-05 Pass; GSA-TLS-06 Pass 0.5%. internet-access, tls: 13 checks (13 Pass). (Other rows and the collection output are left out of the slide.) Step 8: Invoke-Pester -FullNameFilter 'Chapter 07*': 6 passed, 0 failed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 7–8",
    },
    {
      part: "How", title: "Lab 2: a pilot security profile and QUIC",
      body: [
        { steps: [
          { title: "Sign in", text: "NetworkAccess.ReadWrite.All, Policy.ReadWrite.ConditionalAccess and the reads" },
          { title: "Filtering policy and pilot profile", text: "The guide's Steps 5.2 and 5.3: block a category; SP-Pilot; the link" },
          { title: "Plan and apply the NET-IA policy", text: "On for the pilot group only, as the guide does; the approved hash" },
          { title: "Block QUIC on the test device", text: "Learn's New-NetFirewallRule on UDP 443; in the rings, the same rule from Intune" },
          { title: "Validate", text: "A blocked category shows the block page; the guide's query; collect and check" },
          { title: "Back it out", text: "The policy, the firewall rule, then the profile and filtering policy in the portal" },
        ], pt: 12 },
        { callout: "it doesn't enable TLS inspection: that needs a dedicated test CA and the privacy officer's scope. Not run by the authors.", label: "Scope: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, Internet Access tutorial; TLS policies (QUIC rule). Chapter 07, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant with Internet Access licenses, the Internet profile on for a pilot group, and a test device with the client. It doesn't enable TLS inspection, which needs a dedicated test authority and the privacy officer's scope. Create the filtering policy and the pilot profile with the guide's requests. Plan and apply the Internet Access policy, on for the pilot group only, as the guide does, because Learn doesn't say whether report-only applies a profile. Block QUIC on the device with Learn's firewall command. Then browse to a blocked category and expect the block page. Back out newest first. The authors haven't run this lab.`,
      detail: `Placeholders: <tenant-id>, <settings-file> (with securityProfile SP-Pilot), <inputs-folder>, <security-profile-id>, <filtering-policy-id>, <desired-file> (internet enabled; conditionalAccess lists only policies/NET-IA-SecurityProfile-Pilot.json), <plan-sha256>, <policy-id>, <workspace-guid>. 1 Connect-MgGraph -Environment Global with NetworkAccess.ReadWrite.All, Policy.Read.All, Policy.ReadWrite.ConditionalAccess and the reads. 2 POST filteringPolicies (NET-WCF-Block-HighRisk, webCategory ArtificialIntelligence, block); POST filteringProfiles (SP-Pilot); POST the filteringPolicyLink. 3 Collect -AllowUnverified; plan; apply with the approved hash (the plan creates it On for the pilot group only, as the guide does, because Learn doesn't say whether a report-only policy applies a security profile). 4 On the device as an administrator: New-NetFirewallRule -DisplayName "Block QUIC" -Direction Outbound -Action Block -Protocol UDP -RemotePort 443. 5 Browse to a site in the blocked category and expect the block page; az monitor log-analytics query with the allowed and denied query; collect and check internet-access. 6 DELETE the policy; Remove-NetFirewallRule -DisplayName "Block QUIC"; delete the profile and the filtering policy in the portal (Global Secure Access > Secure > Security profiles, then Web content filtering policies); Disconnect-MgGraph; delete outputs.`,
      cite: ["gsa07-ia", "gsa07-tls"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Keeps it"], w: [5.1, 2.9, 2.35, 1.8], rows: [
          ["Identity-aware filtering, categories, threat intelligence", "SC-7, SC-7(5), SI-3", "CNA-ULN, CNA-RNT, CNA-MAT", "Platform owner"],
          ["Every bypass owned, approved, with an end date", "SC-7(5); CM-6", "CNA-MAT", "Policy owner"],
          ["QUIC blocked by the interim path", "SC-7", "CNA-RNT", "Endpoint eng."],
          ["Dedicated CA, renewed, privacy scope, under 1%", "SC-8, SC-12, SC-17, SI-4", "SVC-SIN, SVC-ASM, CNA-MAT", "Platform owner; privacy officer"],
        ] }, pt: 11.5 },
        { cols: [[{ bullets: [
          "A preview firewall assumed in GCC: DEC-07, IA-05",
          "The authentication CA reused: TLS-02",
          "The certificate expires: TLS-01 at 90 days",
        ], label: "Dangers and guards", color: "red", pt: 12 }], [{ bullets: [
          "Every bypass registered, approved, dated",
          "QUIC blocked from Intune",
          "Privacy approved and users told first",
        ], label: "Done when", color: "teal", pt: 12 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 07, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `Identity-aware filtering supports boundary protection, deny by default, and malicious code protection. Governed bypasses support deny by default and configuration settings. The QUIC block supports boundary protection. And inspection from a dedicated, renewed authority, within an approved privacy scope, supports transmission confidentiality, key management, PKI certificates and monitoring. The guide reads these steps as TIC 3.0's remote user pattern to the web. The assessor decides the controls. The dangers: assuming a preview firewall exists in GCC, reusing the authentication authority, and letting the certificate expire, which stops all inspection. You're done when every bypass is governed, QUIC is blocked, and privacy came first. Next, Chapter 8.`,
      detail: `Requirements (config/requirements.json): web access filtered by an identity-aware profile with the acceptable-use categories and threat intelligence: SC-7, SC-7(5), SI-3; KSI-CNA-ULN, KSI-CNA-RNT, KSI-CNA-MAT. Every bypass has an owner, an approver and an end date: SC-7(5); CM-6; KSI-CNA-MAT. QUIC blocked by the interim path: SC-7; KSI-CNA-RNT. Inspection from a dedicated CA, renewed in time, within an approved privacy scope, under 1% failures: SC-8, SC-12, SC-17, SI-4; KSI-SVC-SIN, KSI-SVC-ASM, KSI-CNA-MAT. TIC 3.0's Remote User Use Case, Pattern 3, and its Web PEP capabilities are the guide's reading. The kit's records support these controls; the agency's assessor decides them. Dangers: a preview firewall assumed in GCC (GSA-DEC-07, GSA-IA-05); a bypass with no end date (GSA-IA-04, GSA-TLS-05); the authentication CA issues the inspection intermediate (GSA-TLS-02); the certificate expires and all inspection stops (GSA-TLS-01 at 90 days); inspection on the baseline profile early (GSA-TLS-03); a pinned application broken (GSA-TLS-06 and a registered bypass). Checklist: categories and threat intelligence blocked; every bypass and allow-list entry registered with owner, approver and end date; QUIC blocked by the Intune-delivered rule; the intermediate from a dedicated CA with more than 90 days left and trust deployed before activation; privacy approved and users told before inspection; failure share under 1%. Next: Chapter 08 — Rings, Metrics and the Evidence Package.`,
      cite: [],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
