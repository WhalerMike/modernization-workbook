// Building Azure Security, Chapter 02 — The Public Exposure Register: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/azure-security/02-the-public-exposure-register.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-azs-02-public-exposure-register/build.js
require("../_build/devwb.js")({
  workbook: "azs", chapter: 2, dir: __dirname,
  base: "DW_AZS_02_Public_Exposure_Register",
  title: "The Public Exposure Register",
  map: "Why a register · what Learn gives and leaves · the register's columns · the five rules · who · two labs, a week apart · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Azure Security, the Federal Modernization Workbook's developer workbook for the Azure Security Engineering guide. This is Chapter 2: the public exposure register. DDoS protection, the web application firewall and origin lock-down can't be proved complete without a list of what is exposed. So the list is code, it runs every week, and it notices what is new. We'll start from the guide's Resource Graph queries, built from Microsoft Learn's starter sample, see what they leave to you, read the register and its rules, then walk two labs a week apart. The chapter has been reviewed and approved, and the code is illustrative.`,
      detail: `The chapter is the code behind the guide's Step 2, the public exposure inventory. You start with the guide's four Resource Graph queries, built from Learn's starter sample, and what they leave to you: joining them into one register, an owner on every row, last week's register to compare with, and Defender for Cloud's view to reconcile. Lab 1 builds the register for the Contoso estate, then a week later finds the new public IP and the one that went away. Lab 2 builds it for a test management group and checks it against Defender for Cloud.`,
      cite: ["azs02-guide", "azs02-arg-starter"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why the exposure list comes before the controls",
      body: [
        { cols: [[{ bullets: [
          "One row per exposure: **resource, type, public name, owner, DDoS state, WAF and mode**",
          "Regenerated **every week**",
          "Every **ownerless** row flagged; every **new** and **gone** exposure reported",
          "Every resource Defender for Cloud calls internet-exposed that the register **lacks**",
        ], label: "By the end you can build", color: "navy", pt: 14 }], [{ bullets: [
          "Platform owners who run the register",
          "Workload owners who answer for their rows",
          "Developers who keep the queries current",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
        { callout: "the register is a map of the attack surface. Keep it inside the boundary, never in a public repository.", label: "Keep it in: ", icon: "FaShieldHalved", color: "red" },
      ],
      sources: "Sources: Chapter 02, opening, “Goal and audience”; the guide's Step 2.",
      say: `Why a register first? Because the later steps can't be proved complete without it. By the end of this chapter you can build the register the guide's Step 2 asks for: one row per exposure with its resource, type, public name, owner, DDoS state, and its WAF and mode, regenerated every week. Every ownerless row is flagged, every new exposure since last week reported, every one that went away reported with a reminder to remove its DNS record, and every resource Defender for Cloud calls internet-exposed that the register lacks. It's for platform owners, workload owners and the developers who keep the queries current. And the register is a map of the attack surface: it stays inside the boundary.`,
      detail: `Goal: build the register the guide's Step 2 asks for: one row per exposure (resource ID, type, public name, owner, DDoS state, WAF and its mode, origin lock-down, last reviewed), regenerated every week, with every ownerless row flagged, every new exposure since last week reported, every exposure that went away reported with a reminder to remove its DNS record, and every resource Defender for Cloud calls internet-exposed that the register lacks. Audience: platform owners who run the register, workload owners who answer for their rows, and the developers who keep the queries current. The guide says the register must stay inside the boundary.`,
      cite: ["azs02-guide"],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What the guide's Learn queries give you",
      body: [
        { table: { head: ["Learn and the guide give", "What it says"], w: [3.8, 8.35], rows: [
          ["Starter sample: list all public IPs", "The base of the guide's public IP query"],
          ["The guide's four queries", "Public IPs with DDoS mode, attachment and owner tag; Front Door profiles; application gateways with WAF; PaaS with public network access not Disabled"],
          ["Learn's DDoS guidance", "Keep an inventory of every public IP and its protection with Resource Graph; review it quarterly"],
          ["Learn's cost guidance", "Fewer public IPs means less to protect"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Starter Resource Graph samples; Secure your Azure DDoS Protection deployment; DDoS cost optimization. The guide's Step 2.",
      say: `Here's the starting point. The guide builds four Resource Graph queries from Microsoft Learn's starter sample that lists every public IP: public IPs with their DDoS mode, the resource they're attached to and an owner tag; Front Door profiles; application gateways with their WAF policy; and every resource whose public network access isn't disabled. Learn recommends an inventory of every public IP and its protection, kept with Resource Graph, and a quarterly review of which IPs still need protection. And Learn's cost guidance adds that fewer public IPs means less to protect.`,
      detail: `The guide builds four queries from Learn's starter sample "List all public IP addresses" and the ddosSettings property Learn's DDoS samples read: public IPs with their DDoS mode, the resource they are attached to and an owner tag; Front Door profiles; application gateways with their WAF policy; and every resource whose publicNetworkAccess isn't Disabled. Learn recommends an inventory of every public IP and its protection status, kept with Resource Graph, and a quarterly review of which IPs still need protection. Learn's DDoS cost optimization principles: fewer public IPs, less to protect. The guide adds the rest of the register's shape and says it must stay inside the boundary.`,
      cite: ["azs02-arg-starter", "azs02-ddos-secure", "azs02-ddos-cost", "azs02-guide"],
      ref: "“Start with Microsoft Learn” — “What the guide's queries give you”",
    },
    {
      part: "What", title: "What four queries leave to you",
      body: [
        { table: { head: ["As published", "Why it matters", "What the kit adds"], w: [3.4, 3.9, 4.85], rows: [
          ["Four queries, four JSON files", "Four lists aren't a register", "One register, 11 columns, JSON and CSV"],
          ["attachedTo is an IP configuration ID", "Which WAF covers the IP?", "The gateway behind the IP, its WAF and mode"],
          ["Front Door profiles without names or WAF", "Names are custom domains; WAF is a security policy", "Both read per profile"],
          ["Nothing about classic Front Door", "Public too; retires March 31, 2027", "Classic profiles in the register"],
          ["No comparison with last week", "A public IP nobody knows about", "New and gone rows, with the DNS reminder"],
          ["Compare with Defender by hand", "A gap in the queries stays hidden", "Defender's export reconciled"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Chapter 02, “What it leaves to you”; Learn, Migrate Azure Front Door (classic).",
      say: `What do four queries leave to you? Four lists aren't a register, so the kit joins them into one with eleven columns. A public IP's attachment is an IP configuration ID, so the kit finds the gateway behind it and that gateway's WAF and mode. A Front Door profile's public names are its custom domains and its WAF lives in a security policy, so both are read per profile. Classic Front Door is public too, and retires on March 31, 2027, so it's in the register. Nothing compares with last week, so the kit reports new and gone rows. And Defender for Cloud's view is reconciled, not eyeballed. A test pins each answer.`,
      detail: `Every row is pinned by a test (Exposure register tests). Four queries, four JSON files: one register, 11 columns, register.json and register.csv. A public IP's attachedTo is an IP configuration ID: the gateway behind each public IP, with its WAF policy and mode. Front Door profiles without their names or WAF: custom domains and security policies read per profile; the WAF's mode from its policy. Nothing about classic Front Door: classic profiles (microsoft.network/frontdoors) in the register; classic retires March 31, 2027. No comparison with last week: AZS-EX-03 for each new row, AZS-EX-04 for each row gone, with the dangling DNS record to remove. "Compare with Defender for Cloud's view": AZS-EX-05. The publicNetworkAccess query is a starting list: the property's name and values vary by service.`,
      cite: ["azs02-afd-classic", "azs02-guide"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The register's columns, and its five rules",
      body: [
        { table: { head: ["Column", "From"], w: [3.4, 8.75], rows: [
          ["publicName", "IP's DNS name and address; profile's custom domains; gateway's public IP"],
          ["owner", "The owner tag (design guidance: the guide's tag name)"],
          ["ddos", "protectionMode; \"Front Door edge\", which has built-in L3 and L4 protection"],
          ["waf, wafMode", "The gateway's or profile's WAF policy, and its mode"],
        ] }, pt: 12 },
        { table: { head: ["Rule", "Severity", "What it flags"], w: [1.8, 1.5, 8.85], rows: [
          ["AZS-EX-01", "Finding", "An exposure without an owner tag"],
          ["AZS-EX-02", "Warn", "A public IP attached to nothing"],
          ["AZS-EX-03 / 04", "Info / Warn", "New since last week / gone, check for a dangling DNS record"],
          ["AZS-EX-05", "Warn", "Defender for Cloud reports an exposure the register lacks"],
        ] }, pt: 12 },
      ],
      sources: "Sources: examples/azure-security (Get-AzsExposureCheck, config/rules.json); Learn, What is Azure Front Door? Chapter 02, “The code.”",
      say: `Here's what the register holds. The public name is a public IP's DNS name and address, a Front Door profile's custom domains, or an application gateway's public IP. The owner is the owner tag. The DDoS column is the IP's protection mode, or "Front Door edge", because Learn says Front Door's edge has built-in layer three and four protection. And the WAF columns name the policy and its mode. Five rules read it: a row without an owner is a finding; a public IP attached to nothing is a warning; a new row since last week is information; a row that went away is a warning to check its DNS records; and an exposure Defender reports that the register lacks is a gap in the queries.`,
      detail: `Get-AzsExposureCheck runs the guide's queries (arg-public-ips, arg-frontdoor-profiles, arg-classic-frontdoors, arg-app-gateways, arg-paas-public), the two WAF policy queries, and per Front Door profile its custom domains and security policies. Columns: resourceId, type, name, subscriptionId; publicName; owner (design guidance: the tag name is the guide's); ddos (protectionMode, or "Front Door edge"); waf and wafMode; originLockdown ("Step 5"); lastReviewed. With -PreviousRegisterPath it compares by resource ID; with -DefenderExposurePath it reads a CSV with a resourceId column, exported from Defender for Cloud's internet exposure analysis; the export format isn't fixed here. Rules: AZS-EX-01 Finding, no owner tag (design guidance); AZS-EX-02 Warn, attached to nothing (Learn: fewer public IPs); AZS-EX-03 Info, new; AZS-EX-04 Warn, gone, check for a dangling DNS record; AZS-EX-05 Warn, Defender gap (design guidance).`,
      cite: ["azs02-afd-overview", "azs02-ddos-cost"],
      ref: "“The code: the exposure area”",
    },
    {
      part: "Who", title: "Who runs the register, and who answers for it",
      body: [
        { cards: [
          { title: "Platform owner", text: "Runs it weekly; reviews it quarterly with the ISSO; keeps it inside the boundary", color: "navy" },
          { title: "Workload owners", text: "Answer for their rows: an owner tag, a ticket for every finding", color: "teal" },
          { title: "ISSO", text: "Reconciles the register with Defender for Cloud at the quarterly review", color: "amber" },
        ], pt: 13.5 },
        { lead: "The reads need Reader on the intermediate root; nothing in this chapter writes." },
      ],
      sources: "Sources: Chapter 02, “Goal and audience,” “Federal requirements and evidence,” “Dangers.”",
      say: `Who's involved? The platform owner runs the register every week, keeps it inside the boundary, and reviews it each quarter with the security officer. Workload owners answer for their own rows: every row needs an owner tag, and every finding a ticket. The security officer reconciles the register with Defender for Cloud at that quarterly review. The kit's reads need only Reader on the intermediate root. Nothing in this chapter writes.`,
      detail: `Who keeps what: the register (register.json and register.csv) — platform owner, inside the boundary; ownerless and unattached exposures — platform owner, workload owners for their rows; what changed since last week — platform owner; the register reconciled with Defender for Cloud — the ISSO, for the quarterly review. The danger "an owner tag nobody checks" is handled at the quarterly review with the ISSO in the guide's Step 10. The calls are Reader. Defender for Cloud's internet exposure analysis is generally available in commercial Azure.`,
      cite: ["azs02-guide", "azs02-b12"],
      ref: "“Goal and audience”; “Federal requirements and evidence”; “Dangers”",
    },
    {
      part: "How", title: "Lab 1: build the first week's register",
      body: [
        { terminal: "02-3", label: "examples/azure-security  ·  fixture data  ·  real output" },
        { terminal: "02-4", lines: "1-3,6,8,10-14" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 02, “Lab 1: fixtures, no subscription,” steps 1–2.",
      say: `Lab 1 needs PowerShell 7 with Pester, in the kit's folder. The fixture estate is read twice, a week apart, and a small file stands in for Defender for Cloud's export. Step 1 builds the first week's register: nineteen exposures, eight public IPs, three Front Door profiles, two application gateways and six PaaS resources, sixteen with an owner. Step 2 reads it. The application gateway's public IP carries the gateway's WAF policy. The careers Front Door profile has no WAF, the legacy profile is classic, and three rows have no owner.`,
      detail: `You need PowerShell 7.1 or later with Pester 5, in examples/azure-security. The fixture estate is read twice: week1 on November 9, 2026 and week2 on November 16. tests/fixtures/defender-exposure.csv stands in for Defender for Cloud's export. Step 1: 19 exposures: 8 public IPs, 3 Front Door profiles, 2 application gateways and 6 PaaS resources; 16 with an owner. Step 2: pip-appgw-portal carries wafp-portal, the WAF of the gateway it fronts; afd-careers has no WAF; fd-legacy-intranet is classic; three rows have no owner.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: findings now, and a week later",
      body: [
        { terminal: "02-5" },
        { terminal: "02-7" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 02, “Lab 1: fixtures, no subscription,” steps 3–5.",
      say: `Step 3 reads the findings: three exposures with no owner, a public IP attached to nothing, and one resource Defender reports that no query finds. It's a container group with a public address that isn't a public IP resource, so it's a gap in the queries. Step 4 builds the register again a week later, against the first one, and step 5 reads what changed. One public IP is new, and has no owner. The orphan is gone, with the reminder to remove any DNS record that still points at its address. Step 6 runs the chapter's tests.`,
      detail: `Step 3: three AZS-EX-01 (no owner); AZS-EX-02 for pip-orphan, attached to nothing; AZS-EX-05 for ci-batch-export: Defender reports a container group with a public address that isn't a public IP resource, so no query finds it. Step 4: Invoke-AzsCheck.ps1 -Area exposure on week2 with -PreviousRegisterPath out/week1/exposure/register.json. Step 5: pip-new-api is new (AZS-EX-03), and has no owner; pip-orphan is gone (AZS-EX-04), with the reminder to remove any DNS record that still points at its address. Step 6: the two Exposure tests pass.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 3–6",
    },
    {
      part: "How", title: "Lab 2: a test subscription",
      body: [
        { steps: [
          { title: "Sign in to commercial Azure", text: "az cloud set --name AzureCloud; az login --tenant; the resource-graph extension" },
          { title: "Write the test settings file", text: "From deploy/settings.template.json, outside any repository" },
          { title: "Build the register, live", text: "With Defender's export and -AllowUnverified; check unverified rows in the portal" },
          { title: "Create a public IP, build again", text: "pip-lab-02 should appear as new and attached to nothing" },
          { title: "Back it out", text: "Delete the public IP and the lab's output; sign out" },
        ], pt: 12.5 },
        { callout: "a test tenant and test subscription, never production. The authors haven't run this lab.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Chapter 02, “Lab 2: a test subscription.”",
      say: `Lab 2 moves to a test subscription in a test tenant, never production. Sign in to commercial Azure, write the settings file, and build the register live with Defender for Cloud's export. The classic Front Door, gateway and WAF queries aren't verified on Learn yet, so allow them and check their rows in the portal. Then run the guide's own test: create a public IP and build the register again. It should appear as new, and as attached to nothing; Resource Graph can take a few minutes to show it. Back out by deleting the public IP and the output, and sign out. The authors haven't run this lab.`,
      detail: `Use a test tenant with a test management group and subscription in commercial Azure, never production, with at least one public IP. You need Reader on the test management group, Defender for Cloud on the test subscription, Azure CLI with resource-graph, and PowerShell 7. Step 3: Invoke-AzsCheck.ps1 -Area exposure -DefenderExposurePath <defender-export> -AllowUnverified; check rows in Front Door and CDN profiles, Application gateways, Web Application Firewall policies. Step 4: az network public-ip create --name pip-lab-02 --sku Standard; build again with -PreviousRegisterPath; pip-lab-02 should appear as AZS-EX-03 and AZS-EX-02. Step 5: az network public-ip delete; Remove-Item the output folders; az logout.`,
      cite: [],
      ref: "“Lab 2: a test subscription”",
    },
    {
      part: "How", title: "Federal requirements and the register",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.6, 2.3, 2.0, 2.25], rows: [
          ["Every exposure with its owner (register.json, register.csv)", "CM-8; SC-7", "CNA-MAT", "Platform owner, in the boundary"],
          ["Ownerless and unattached exposures (AZS-EX-01, 02)", "CM-8", "CNA-MAT", "Platform and workload owners"],
          ["What changed since last week, and the DNS to remove", "CM-8; SC-7", "CNA-MAT", "Platform owner"],
          ["The register reconciled with Defender for Cloud", "CM-8", "CNA-MAT", "ISSO, quarterly"],
        ] }, pt: 12.5 },
        { lead: "The kit's output supports these controls; the assessor decides." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP KSIs, through the guide's requirements table (Step 2). Chapter 02, “Federal requirements and evidence.”",
      say: `Each output is evidence for something specific, from the guide's requirements table. The register itself, every exposure with its owner, supports NIST's system component inventory and boundary protection controls, and aligns to a FedRAMP cloud-native architecture indicator. Ownerless and unattached exposures, what changed since last week, and the reconciliation with Defender for Cloud support the same inventory control. The kit's output supports those controls; the assessor decides, and the agency lines its own evidence up with FedRAMP's indicators rather than reporting them.`,
      detail: `Every public IP, Front Door profile, application gateway and public PaaS resource with its owner (register.json and register.csv, Lab 1 step 1): CM-8, system component inventory; SC-7, boundary protection; KSI-CNA-MAT; platform owner, inside the boundary. Ownerless and unattached exposures (AZS-EX-01 and AZS-EX-02): CM-8; KSI-CNA-MAT; platform owner, workload owners for their rows. What changed since last week (AZS-EX-03 and AZS-EX-04): CM-8; SC-7; KSI-CNA-MAT. The register reconciled with Defender for Cloud (AZS-EX-05, or none): CM-8; the ISSO, for the quarterly review. CM-8 is in the Moderate baseline FIPS 200 requires.`,
      cite: ["azs02-guide"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.3, 4.2, 4.65], rows: [
          ["The register in a public repository", "A map of the attack surface published", "A warning every run; the runbook's preflight"],
          ["An exposure the queries can't see", "A public address that isn't a public IP resource stays off", "AZS-EX-05 against Defender's export"],
          ["A dangling DNS record", "A name points at an address someone else can get", "AZS-EX-04 names every exposure gone"],
          ["An owner tag nobody checks", "A team that no longer exists", "The quarterly review with the ISSO"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Chapter 02, “Dangers.”",
      say: `What breaks, and what guards against it? Published in a public repository, the register is a map of the attack surface, so the check prints a warning every run and the runbook's preflight refuses an output folder inside the kit's repository. Some public addresses aren't public IP resources, so the queries can't see them; Defender for Cloud's export closes that gap. A DNS record left pointing at a released address can be taken over, so every exposure that goes away is named. And an owner tag nobody checks names a team that may no longer exist, which is what the quarterly review is for.`,
      detail: `The register in a public repository: a map of the attack surface published; the check prints the warning every run; the runbook's preflight refuses an output folder inside the kit's repository. An exposure the queries can't see: a container group's or service's public address that isn't a public IP resource stays off the register; AZS-EX-05 against Defender for Cloud's export. A dangling DNS record: a name keeps pointing at an address someone else can now be given; AZS-EX-04 names every exposure that went away. An owner tag nobody checks: a tag with a team that no longer exists; the quarterly review with the ISSO, in the guide's Step 10.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the register's checklist",
      body: [
        { bullets: [
          "The register runs weekly, and every AZS-EX-01 row has a ticket with an owner",
          "Every AZS-EX-04 row's DNS records were checked and removed",
          "Defender for Cloud's export was reconciled; every AZS-EX-05 row is added to the queries or explained",
          "The register and its run folders live inside the boundary",
        ], pt: 15 },
        { callout: "Chapter 03 traces each public IP in the register to its DDoS protection.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 02, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The register runs every week, and every ownerless row has a ticket with an owner. Every exposure that went away had its DNS records checked and removed. Defender for Cloud's export was reconciled, and every gap is either added to the queries or explained. And the register and its run folders live inside the boundary. Next, Chapter 3 traces each public IP in this register to its DDoS protection.`,
      detail: `Checklist: the register runs weekly, and every AZS-EX-01 row has a ticket with an owner; every AZS-EX-04 row's DNS records were checked and removed; Defender for Cloud's export was reconciled, and every AZS-EX-05 row is either added to the queries or explained; the register and its run folders live inside the boundary. Next, Chapter 03 traces each public IP in the register to its DDoS protection. The guide's Step 2 holds the register's review cadence.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
