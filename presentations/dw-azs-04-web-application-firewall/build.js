// Building Azure Security, Chapter 04 — The Web Application Firewall: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/azure-security/04-the-web-application-firewall.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-azs-04-web-application-firewall/build.js
require("../_build/devwb.js")({
  workbook: "azs", chapter: 4, dir: __dirname,
  base: "DW_AZS_04_Web_Application_Firewall",
  title: "The Web Application Firewall",
  map: "Why detection isn't protection · what Learn gives and leaves · every policy, every endpoint · eight rules · the plan · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Azure Security. This is Chapter 4: the web application firewall. A firewall in detection mode is a log with good intentions. The check reads the mode, and the switch to prevention stays a decision a person makes. We'll start from what Microsoft Learn gives you, see what it leaves to you, read how the kit checks every policy and every internet-facing endpoint, and why it writes the switch to a plan instead of sending it. Then two labs, the evidence and the dangers. The chapter has been reviewed and approved, and the code is illustrative.`,
      detail: `The chapter is the code behind the guide's Step 4, the web application firewall. You start with what Learn gives you: WAF policies on Application Gateway WAF_v2 and Front Door, Microsoft's Zero Trust checks for them, the built-in policies that require a WAF and a mode, and the commands that create and switch a policy. Then you read how the kit checks every policy and every internet-facing endpoint, and why it writes the Prevention switch to a plan instead of sending it. Lab 1 checks Contoso's two policies and three endpoints; Lab 2 checks a test subscription beside the guide's own Validate query.`,
      cite: ["azs04-guide"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why a WAF in detection mode isn't protection",
      body: [
        { cols: [[{ bullets: [
          "Check every WAF policy against **Microsoft's Zero Trust recommendations**",
          "Find every internet-facing endpoint with **no WAF or no logs**",
          "Compute the guide's **WAF prevention coverage**",
          "Hand the owner the exact command to **switch to Prevention**, unsent",
        ], label: "By the end you can", color: "navy", pt: 14 }], [{ bullets: [
          "Application owners and developers, who tune and switch",
          "Platform owners, who own the policies",
          "Security monitors, who read the WAF logs",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
        { callout: "detection mode logs and forwards; only prevention mode blocks.", label: "Learn: ", icon: "FaShieldHalved", color: "red" },
      ],
      sources: "Sources: Chapter 04, opening, “Goal and audience”; Learn, Zero Trust for Application Gateway WAF.",
      say: `Why does the mode matter so much? Because, as Microsoft Learn puts it, detection mode only logs, and only prevention mode blocks. By the end of this chapter you can check every WAF policy against Microsoft's Zero Trust recommendations, find every internet-facing application gateway and Front Door profile that has no WAF or no logs, compute the guide's prevention coverage, and hand the application owner the exact command that moves a policy to prevention, without the kit ever sending it. It's for application owners who tune and switch the WAF, platform owners who own the policies, and security monitors who read the logs.`,
      detail: `Goal: check every WAF policy against Microsoft's Zero Trust recommendations, find every internet-facing application gateway and Front Door profile that has no WAF or no logs, compute the guide's WAF prevention coverage, and hand the application owner the exact command that moves a policy to Prevention, without the kit ever sending it. Audience: application owners and their developers, who tune and switch the WAF; platform owners, who own the policies; security monitors, who read the WAF logs. Read Chapter 02: the register's waf and wafMode columns come from the same reads. Learn: detection mode only logs, and only prevention mode blocks.`,
      cite: ["azs04-zt-agw"],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["Zero Trust checks", "Prevention mode, request body inspection, default rule set, bot rule set, rate limiting, logging, among others"],
          ["Default Rule Set", "Learn recommends the latest, 2.2 at the guide's reading, validated in log mode first; the CLI's default is 2.1"],
          ["Front Door managed rules", "Need the Premium tier"],
          ["Built-in policies", "Require a WAF on each service, and a given mode"],
          ["The switch", "policy-setting update --mode Prevention, documented for both directions"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, network security Zero Trust; Secure your Application Gateway; az network application-gateway waf-policy; Front Door CLI quickstart; WAF and Azure Policy; WAF 403.",
      say: `Here's Microsoft's starting point. Microsoft's Zero Trust recommendations for both services check prevention mode, request body inspection, the default rule set, the bot protection rule set, rate limiting and diagnostic logging, among others. Learn recommends the latest Default Rule Set, two point two at the guide's reading, validated in log mode before blocking; the command line's default is two point one. Front Door's managed rules need the Premium tier. Built-in policies require a WAF on each service, and a given mode. And Learn documents the switch between detection and prevention with one command.`,
      detail: `Azure WAF runs on Front Door and on Application Gateway WAF_v2 as a policy of managed rules, custom rules and settings; detection mode only logs, only prevention blocks. Zero Trust checks: prevention mode, request body inspection, default rule set, bot rule set, rate limiting, JavaScript challenge, logging; Application Gateway adds the HTTP DDoS rule set, Front Door a CAPTCHA. Default Rule Set: Learn recommends the latest (2.2 at the reading), validated in log mode first; az network application-gateway waf-policy create defaults to Microsoft_DefaultRuleSet 2.1. Front Door managed rules need Premium. Built-in policies require a WAF on Front Door and Application Gateway, and a mode; Audit, Deny, Disabled. Switch: az network application-gateway waf-policy policy-setting update --mode Prevention --state Enabled --request-body-check true. Detection mode doesn't block (WAF FAQ).`,
      cite: ["azs04-zt-netsec", "azs04-agw-secure", "azs04-waf-cli", "azs04-afd-cli", "azs04-waf-policy", "azs04-waf-403", "azs04-waf-faq"],
      ref: "“Start with Microsoft Learn” — “What Learn gives you”; “Verified facts”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["As given", "Why it matters", "What the kit adds"], w: [3.4, 3.9, 4.85], rows: [
          ["A Validate query for one policy", "An estate has several, on two services", "Every policy on both services, the same checks"],
          ["requestBodyCheck: Enabled vs true", "Code for one reads the other as off", "Each service's shape read as its own"],
          ["A policy requiring a WAF", "Audits; doesn't count endpoints", "Every internet-facing endpoint in the coverage"],
          ["Front Door's WAF in a security policy", "No security policy, no WAF, nothing says so", "Security policies read per profile"],
          ["The switch, as a command", "Sent by automation, it blocks users before tuning", "Written to plan-prevention.txt, never run"],
          ["\"Name the version you've validated\"", "2.1 drifts behind Learn's advice", "A Warn below 2.2, not a Finding"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Chapter 04, “What it leaves to you”; the kit's WAF tests.",
      say: `What does Learn leave to you? Its Validate query reads one policy; an estate has several, on two services, so the kit reads them all with the same checks. Front Door says body inspection is enabled where Application Gateway says true, and code written for one reads the other as off, so each shape is read as its own. A policy that requires a WAF audits resources but doesn't count endpoints, so the kit counts them. A Front Door's WAF lives in a security policy, so those are read per profile. The switch to prevention, sent by automation, blocks users before tuning, so it's written to a plan. And an old rule set is a warning, because moving needs validation first.`,
      detail: `Each row is pinned by a test (WAF (Step 4) tests). A Validate query for one policy: every policy on both services, read from Resource Graph, with the same checks. Front Door's requestBodyCheck is Enabled; Application Gateway's is true: each service's shape read as its own. The built-in policy that requires a WAF audits resources that can have a WAF; it doesn't count endpoints: every internet-facing gateway (one with a public frontend) and every Front Door profile, with or without a WAF, in the coverage metric. A Front Door's WAF lives in a security policy: security policies read per profile; AZS-WAF-06 when none holds a WAF policy. The switch to Prevention as a command: written to plan-prevention.txt, never run. "Name the version you've validated": AZS-WAF-03 as a Warn below the baseline's version (2.2).`,
      cite: ["azs04-waf-policy"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "Eight rules, and the coverage count",
      body: [
        { table: { head: ["Rule", "Severity", "What it flags"], w: [1.8, 1.5, 8.85], rows: [
          ["AZS-WAF-01", "Finding", "A policy in Detection mode, or disabled"],
          ["AZS-WAF-02", "Finding", "Request body inspection off"],
          ["AZS-WAF-03", "Warn", "No Default Rule Set, or one older than the baseline's"],
          ["AZS-WAF-04 / 05", "Warn", "No bot protection rule set / no rate-limit rule"],
          ["AZS-WAF-06", "Finding", "An internet-facing gateway or Front Door profile with no WAF"],
          ["AZS-WAF-07", "Finding", "That gateway or profile sends no logs to the platform workspace"],
          ["AZS-WAF-08", "Info", "A Front Door WAF policy that isn't Premium"],
        ] }, pt: 12 },
        { lead: "Coverage = endpoints behind a WAF in prevention ÷ internet-facing endpoints. A private-only gateway isn't counted." },
      ],
      sources: "Sources: examples/azure-security (Get-AzsWafCheck, config/rules.json); Learn, as each rule cites. Chapter 04, “The code: the waf area.”",
      say: `Eight rules come out of that. A policy in detection, or disabled, is a finding, and so is body inspection switched off. A missing or older rule set, no bot protection, and no rate limit are warnings. An internet-facing gateway or Front Door profile with no WAF at all is a finding, and so is one that sends no logs to the platform workspace. And a Front Door policy that isn't Premium is information: it can't use managed rule sets. Coverage is the endpoints behind a WAF in prevention over all internet-facing endpoints, the guide's metric. A gateway with only a private frontend isn't counted.`,
      detail: `Get-AzsWafCheck reads the Application Gateway and Front Door WAF policies, the application gateways, the Front Door profiles with their security policies, and the gateways' and profiles' diagnostic settings. For each policy: mode, enabled, request body inspection, Default Rule Set version, bot rule set, rate-limit custom rule, and whether it is in prevention (enabled, Prevention, body inspection on). Rules: AZS-WAF-01 Finding (Learn); AZS-WAF-02 Finding (Learn); AZS-WAF-03 Warn (Learn); AZS-WAF-04 Warn; AZS-WAF-05 Warn (Learn, Zero Trust); AZS-WAF-06 Finding (Learn, WAF and Azure Policy); AZS-WAF-07 Finding (Learn, Application Gateway and Front Door logs); AZS-WAF-08 Info (Learn, Front Door quickstart). Coverage: endpoints behind a WAF in prevention over all internet-facing endpoints. The JavaScript challenge, the CAPTCHA and the HTTP DDoS rule set aren't read yet (research gaps, row 4).`,
      cite: ["azs04-zt-agw", "azs04-zt-netsec", "azs04-agw-logs", "azs04-afd-logs", "azs04-afd-cli"],
      ref: "“The code: the waf area”",
    },
    {
      part: "What", title: "The switch to Prevention, as a plan",
      body: [
        { steps: [
          { title: "The check finds a policy not in prevention", text: "AZS-WAF-01: Detection mode, or disabled" },
          { title: "It writes Learn's switch command", text: "policy-setting update --mode Prevention --state Enabled --request-body-check true, with the policy's resource group and subscription" },
          { title: "For a Front Door policy", text: "A line pointing at the guide's Step 4" },
          { title: "Nothing runs it", text: "A person runs it after the false-positive review, in a change window" },
        ], pt: 13.5 },
        { callout: "sent by automation before tuning, a switch to Prevention blocks legitimate users.", label: "Why a plan: ", icon: "FaClipboardCheck", color: "amber" },
      ],
      sources: "Sources: examples/azure-security (plan-prevention.txt); Learn, troubleshoot WAF blocking legitimate requests. Chapter 04, “The code.”",
      say: `Here's the one thing this check could change, and doesn't. For every Application Gateway policy not in prevention, the check writes Learn's switch command, with the policy's resource group and subscription, to a plan file. For a Front Door policy it writes a line pointing at the guide. Nothing runs either. A person runs the command after the false-positive review, in a change window, because a switch sent by automation before tuning blocks legitimate users. Learn documents the same command in reverse for backing out.`,
      detail: `For every Application Gateway policy not in prevention, the check writes the guide's switch command to plan-prevention.txt, with the policy's resource group and subscription; for a Front Door policy, a line pointing at the guide. Nothing runs it. The file's header says the kit did not run the commands and to read the guide's Step 4 first, running each in a change window. A test checks the plan file is written only when there is something to switch. Learn documents switching policy-setting update --mode between Prevention and Detection with --request-body-check.`,
      cite: ["azs04-waf-403"],
      ref: "“The code: the waf area”; Lab 1, step 4",
    },
    {
      part: "Who", title: "Who tunes, who switches, who watches",
      body: [
        { cards: [
          { title: "Application owner", text: "Tunes the policy in detection, then runs the switch after the false-positive review", color: "navy" },
          { title: "Platform owner", text: "Owns the WAF policies and their rule-set versions", color: "teal" },
          { title: "Security monitor", text: "Reads the WAF logs; confirms every endpoint's logs reach the workspace", color: "amber" },
        ], pt: 13.5 },
        { lead: "The kit's reads need Reader on the intermediate root. The plan is the application owner's to run." },
      ],
      sources: "Sources: Chapter 04, “Goal and audience,” “Federal requirements and evidence.”",
      say: `Who's involved? The application owner tunes the policy while it's in detection, and runs the switch after the false-positive review. The platform owner owns the policies and their rule-set versions. And the security monitor reads the WAF logs, and confirms every endpoint's logs reach the platform workspace. The kit's reads need only Reader. The plan is the application owner's to run.`,
      detail: `Each policy's mode, body inspection, rule sets and rate limit: platform owner. Every internet-facing endpoint behind a WAF in prevention, or named: platform owner, with the application owners. The switch to Prevention reviewed before it is run (plan-prevention.txt): application owner. Logs from every endpoint to the platform workspace: security monitor. The kit's calls are Reader.`,
      cite: [],
      ref: "“Goal and audience”; “Federal requirements and evidence”",
    },
    {
      part: "How", title: "Lab 1: run the check, read each policy",
      body: [
        { terminal: "04-3", label: "examples/azure-security  ·  fixture data  ·  real output" },
        { terminal: "04-4", lines: "2-4" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 04, “Lab 1: fixtures, no subscription,” steps 1–2.",
      say: `Lab 1 needs PowerShell 7 with Pester, in the kit's folder. Contoso has two WAF policies: one on its portal application gateway, and one on its portal Front Door profile. A second Front Door profile, for careers, has none. Step 1 runs the check: one of three internet-facing endpoints is behind a WAF in prevention, and the plan file is written. Step 2 reads each policy. The gateway's policy is still in detection. The Front Door policy blocks, but has no bot rule set. Both are on Default Rule Set two point one.`,
      detail: `You need PowerShell 7.1 or later with Pester 5, in examples/azure-security. Contoso has two WAF policies: wafp-portal on the application gateway appgw-portal, and afdwafportal on the Front Door profile afd-portal. The second profile, afd-careers, has none. Step 1: Read: 2 WAF policies, 3 internet-facing endpoints; behind a WAF in Prevention: 1 of 3; plan-prevention.txt holds the reviewed commands; none was run. Step 2: wafp-portal is still in Detection; afdwafportal blocks, but has no bot rule set; both are on Default Rule Set 2.1.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the findings, and the unsent plan",
      body: [
        { terminal: "04-5" },
        { terminal: "04-6", lines: "1,4" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 04, “Lab 1: fixtures, no subscription,” steps 3–4.",
      say: `Step 3 reads the findings. The gateway's policy is in detection. The careers Front Door profile has no WAF and sends no logs. Both policies are a rule-set version behind the baseline, and the Front Door policy has no bot protection. The intranet gateway has a private frontend only, so it isn't counted. Step 4 reads the plan the kit wrote and didn't run: Learn's switch command for the gateway's policy, with its resource group and subscription, ready for the application owner. Step 5 runs the chapter's tests.`,
      detail: `Step 3: AZS-WAF-01 for wafp-portal; AZS-WAF-06 and AZS-WAF-07 for afd-careers, with no WAF and no logs; AZS-WAF-03 for both policies (2.1 below the baseline's 2.2); AZS-WAF-04 for afdwafportal. appgw-intranet has a private frontend only, so it isn't counted. Step 4: plan-prevention.txt holds az network application-gateway waf-policy policy-setting update --policy-name wafp-portal --resource-group rg-hub --subscription <id> --mode Prevention --state Enabled --request-body-check true. Step 5: the two WAF tests pass.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 3–5",
    },
    {
      part: "How", title: "Lab 2: a test subscription",
      body: [
        { steps: [
          { title: "Sign in to commercial Azure", text: "az cloud set --name AzureCloud; az login --tenant; the resource-graph extension" },
          { title: "Write the test settings file", text: "From deploy/settings.template.json, outside any repository" },
          { title: "Run the WAF check, live", text: "-AllowUnverified for the WAF policy queries" },
          { title: "Compare with the guide's Validate query", text: "waf-policy show: mode, body inspection, rule sets should match waf.json" },
          { title: "Back it out", text: "Nothing changed, the plan wasn't run: delete the output, sign out" },
        ], pt: 12.5 },
        { callout: "a test tenant and test subscription with a WAF_v2 gateway and its policy, never production. The authors haven't run this lab.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Chapter 04, “Lab 2: a test subscription.”",
      say: `Lab 2 moves to a test subscription with an Application Gateway WAF version two and its policy, as the guide's pilot builds them, never production. Sign in to commercial Azure, write the settings file, and run the check live, allowing the WAF policy queries that aren't verified on Learn yet. Then compare with the guide's Validate query: the mode, body inspection and rule sets should match the kit's row. If a property is named differently, record it. Nothing changed in Azure and the plan wasn't run, so back out by deleting the output. The guide's own blocked-request test is the application owner's, after the switch. The authors haven't run this lab.`,
      detail: `Use a test tenant with a test management group and subscription in commercial Azure, never production, with an Application Gateway WAF_v2 and its WAF policy. You need Reader on the test management group, Azure CLI with the resource-graph extension, and PowerShell 7. Step 3: Invoke-AzsCheck.ps1 -Area waf -AllowUnverified. Step 4: az network application-gateway waf-policy show --name <waf-policy> --resource-group <rg> --query "{mode:policySettings.mode, body:policySettings.requestBodyCheck, sets:managedRules.managedRuleSets[].ruleSetType}"; if a property is named differently, record it (research gaps, row 5). Step 5: Remove-Item the output; az logout. The guide's own test, a benign SQL injection string returning 403 with a matching firewall log row, is the application owner's, after the switch.`,
      cite: [],
      ref: "“Lab 2: a test subscription”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.6, 2.3, 2.0, 2.25], rows: [
          ["Each policy's mode, body inspection, rule sets, rate limit (waf.json)", "SI-10; SC-7", "CNA-MAT", "Platform owner"],
          ["Every internet-facing endpoint behind a WAF in prevention, or named", "SC-7", "CNA-RVP", "Platform, application owners"],
          ["The switch reviewed before it runs (plan-prevention.txt)", "SC-7", "CNA-MAT", "Application owner"],
          ["Logs from every endpoint to the platform workspace", "SC-7", "CNA-RVP", "Security monitor"],
        ] }, pt: 12.5 },
        { lead: "The kit's output supports these controls; the assessor decides." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP KSIs, through the guide's requirements table (Step 4). Chapter 04, “Federal requirements and evidence.”",
      say: `Each output supports a specific control from the guide's requirements table. Each policy's mode, body inspection, rule sets and rate limit support NIST's information input validation and boundary protection controls, aligned to a FedRAMP indicator that cites input validation. Every internet-facing endpoint behind a WAF in prevention, the plan reviewed before it runs, and the logs from every endpoint all support boundary protection. The kit's output supports these controls; the assessor decides.`,
      detail: `Each WAF policy's mode, body inspection, rule sets and rate limit (waf.json, Lab 1 step 2): SI-10, information input validation; SC-7, boundary protection; KSI-CNA-MAT; platform owner. Every internet-facing endpoint behind a WAF in prevention, or named (AZS-WAF-06, coverage in summary.json): SC-7; KSI-CNA-RVP; platform owner, with the application owners. The switch to Prevention reviewed before it is run (plan-prevention.txt, never run by the kit): SC-7; KSI-CNA-MAT; application owner. Logs from every endpoint to the platform workspace (AZS-WAF-07, or none): SC-7; KSI-CNA-RVP; security monitor. The controls are the guide's Step 4 row (SC-7, SI-10); the guide notes KSI-CNA-MAT cites SI-10.`,
      cite: ["azs04-guide"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.3, 4.2, 4.65], rows: [
          ["The WAF left in detection", "Attacks are logged and reach the backend", "AZS-WAF-01 every week until it switches"],
          ["Automation that switches to Prevention", "Legitimate traffic blocked before tuning", "The command goes to a plan, never sent"],
          ["A Front Door profile with no security policy", "Its endpoints have no WAF, silently", "Security policies read per profile; AZS-WAF-06"],
          ["Two property shapes", "Front Door's body inspection read as off", "Each shape read on its own; a test covers both"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Chapter 04, “Dangers.”",
      say: `What breaks, and what guards against it? A WAF left in detection logs attacks and lets them reach the backend, so the finding comes back every week until it switches. Automation that switches to prevention blocks legitimate traffic before tuning, so the kit only writes the command down. A Front Door profile with no security policy has no WAF, and nothing on the profile says so, so security policies are read per profile. And the two services' property shapes differ, so each is read on its own, with a test for both.`,
      detail: `The WAF left in detection: attacks are logged and reach the backend; AZS-WAF-01 every week until it switches. Automation that switches to Prevention: legitimate traffic blocked before tuning; the kit writes the command to a plan; it never sends it. A Front Door profile with no security policy: its endpoints have no WAF, and nothing on the profile says so; security policies read per profile; AZS-WAF-06. Two property shapes: a Front Door policy read as an Application Gateway one shows body inspection off; each service's shape read on its own; a test covers both.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the WAF checklist",
      body: [
        { bullets: [
          "Every internet-facing endpoint is behind a WAF in Prevention, or has a decision record",
          "Every policy's rule set is the version the application owner validated",
          "plan-prevention.txt was reviewed with the application owner before anyone ran it",
          "Every endpoint's WAF logs reach the platform workspace",
        ], pt: 15 },
        { callout: "Chapter 05: a WAF only helps if nothing can reach the origin around it.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 04, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. Every internet-facing endpoint is behind a WAF in prevention, or has a decision record. Every policy's rule set is the version the application owner validated. The plan file was reviewed with the application owner before anyone ran it. And every endpoint's WAF logs reach the platform workspace. Next, Chapter 5: a WAF only helps if nothing can reach the origin around it.`,
      detail: `Checklist: every internet-facing endpoint is behind a WAF in Prevention, or has a decision record; every policy's rule set is the version the application owner validated; plan-prevention.txt was reviewed with the application owner before anyone ran it; every endpoint's WAF logs reach the platform workspace. Next, Chapter 05: a WAF only helps if nothing can reach the origin around it. The guide's Step 4 holds the commands that create and tune the policy.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
