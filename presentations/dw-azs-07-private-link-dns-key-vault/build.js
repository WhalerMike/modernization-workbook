// Building Azure Security, Chapter 07 — Private Link, DNS and Key Vault: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/azure-security/07-private-link-dns-and-key-vault.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-azs-07-private-link-dns-key-vault/build.js
require("../_build/devwb.js")({
  workbook: "azs", chapter: 7, dir: __dirname,
  base: "DW_AZS_07_Private_Link_DNS_Key_Vault",
  title: "Private Link, DNS and Key Vault",
  map: "Why three questions · what Learn gives and leaves · zones and endpoints · the vault posture · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Azure Security, Chapter 7: Private Link, DNS and Key Vault. A private endpoint is an address. Whether anything uses it is a DNS question, and whether the public path is closed is a third one. The code asks all three. We'll start from Microsoft Learn's Private Link commands for Key Vault, the zone group, the Cloud Adoption Framework's central-zone pattern and Learn's Key Vault recommendations, see what they leave to you, read the kit's check, and walk two labs, the evidence and the dangers. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against a fictional estate.`,
      detail: `The chapter is the code behind the Azure Security Engineering guide's Step 7, Private Link and DNS, and Step 8, managed identities and Key Vault. You start with Learn's Private Link commands for Key Vault, its zone group, the Cloud Adoption Framework's central-zone pattern and Learn's Key Vault recommendations. Then you read how the kit checks the zones, the endpoints and their zone groups, the resources still public, and each vault. Lab 1 checks Contoso's two zones, three endpoints and three vaults; Lab 2 checks a test vault beside nslookup and the guide's Validate query. Managed identities are the service account guide's; this chapter reads the vaults they use.`,
      cite: ["azs07-guide"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why an endpoint is three questions, not one",
      body: [
        { cols: [[{ bullets: [
          "Is every privatelink zone **central** and **linked to the hub**?",
          "Does every private endpoint **register its record** in a central zone?",
          "Which resources still accept **public traffic** beside their endpoint?",
          "Which vaults miss any part of the **posture Learn recommends**?",
        ], label: "By the end you can answer", color: "navy", pt: 14 }], [{ bullets: [
          "Platform owners, who own the zones and the policy",
          "Workload owners, who own endpoints and vaults",
          "Developers who review both",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
        { callout: "the guide's vault-posture metric: RBAC, purge protection, a private endpoint and audit logs, together.", label: "And compute: ", icon: "FaKey", color: "amber" },
      ],
      sources: "Sources: Chapter 07, opening, “In this chapter,” “Goal and audience.”",
      say: `Why three questions? Because a private endpoint that exists can still go unused if the name doesn't resolve to it, and can still be bypassed if the public path stays open. By the end of this chapter you can answer four things: whether every privatelink zone is central and linked to the hub, whether every private endpoint registers its record in a central zone, which resources still accept public traffic beside their endpoint, and which key vaults miss any part of the posture Microsoft Learn recommends. And you can compute the guide's vault-posture metric. It's for platform owners, who own the zones; workload owners, who own endpoints and vaults; and the developers who review both.`,
      detail: `Goal: by the end of this chapter you can say whether every privatelink zone is central and linked to the hub, whether every private endpoint registers its record in a central zone, which resources still accept public traffic beside their private endpoint, and which vaults miss any part of the posture Learn recommends; and compute the guide's vault-posture metric. Audience: platform owners, who own the zones and the policy; workload owners, who own endpoints and vaults; the developers who review both. Key Vault Administrator is made eligible rather than standing in Building Privileged Access, Chapter 06.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.4, 8.75], rows: [
          ["Key Vault Private Link", "An RBAC vault with purge protection, a closed firewall, the privatelink.vaultcore.azure.net zone and link, the endpoint; validate with nslookup"],
          ["Private DNS zone group", "Registers the endpoint's record, and removes it with the endpoint"],
          ["Private Link and DNS at scale", "Central zones in the connectivity subscription; deny zones in workload subscriptions; deployIfNotExists zone groups"],
          ["Zone Groups - List", "Each group's privateDnsZoneConfigs[].properties.privateDnsZoneId"],
          ["Secure your Azure Key Vault", "Azure RBAC, not access policies; soft delete and purge protection; private endpoints with public access off; audit logs"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Learn, Integrate Key Vault with Private Link; DNS integration; CAF Private Link and DNS at scale; Zone Groups - List; Secure your Azure Key Vault.",
      say: `Here's Microsoft's starting point. Learn's Key Vault Private Link page creates a vault on role-based access with purge protection, closes its firewall, creates the vault's privatelink zone and its link, and the private endpoint, then validates with nslookup. It also says name resolution is where private endpoints fail. A private DNS zone group registers the endpoint's record, and removes it with the endpoint. The Cloud Adoption Framework keeps privatelink zones central in the connectivity subscription and adds zone groups by policy. The zone group API returns each group's zone. And Learn's Key Vault recommendations: role-based access, not access policies; purge protection; private endpoints with public access disabled; and audit logging.`,
      detail: `Learn's Key Vault Private Link page creates an RBAC vault with purge protection, closes its firewall (--default-action deny), creates the privatelink.vaultcore.azure.net zone and its link, and the private endpoint with --group-ids vault; it validates with nslookup, says name resolution is where private endpoints fail, and covers on-premises forwarders. A private DNS zone group registers the endpoint's record and removes it with the endpoint. The Cloud Adoption Framework keeps privatelink zones central in the connectivity subscription, denies them in workload subscriptions, and adds zone groups with deployIfNotExists; the policy's identity needs Private DNS Zone Contributor. The zone group API (2026-01-01) returns privateDnsZoneConfigs[].properties.privateDnsZoneId. Zone names: one per service, for example privatelink.vaultcore.azure.net, privatelink.blob.core.windows.net. Key Vault recommendations: Azure RBAC, not access policies; soft delete and purge protection; private endpoints with public access disabled; audit logging with AuditEvent.`,
      cite: ["azs07-kv-pl", "azs07-zonegroup", "azs07-scale", "azs07-zg-api", "azs07-pe-dns", "azs07-kv-secure", "azs07-kv-log"],
      ref: "“Start with Microsoft Learn” — “What Learn gives you”; “Verified facts”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn gives", "Why it matters", "What the kit adds"], w: [3.4, 4.1, 4.65], rows: [
          ["One zone, one link, one endpoint", "Zones get created in workload subscriptions anyway", "AZS-PL-01 and PL-02 for every non-central or unlinked zone"],
          ["A zone group per endpoint", "Without one, nobody manages the record", "AZS-PL-03 (none) and PL-04 (non-central zone)"],
          ["Turn public access off once private works", "The private path works; the public one stays open", "AZS-PL-05 for an endpoint with public access on"],
          ["Key Vault's recommendations, one page", "Read once; next quarter's vault misses one", "Six checks on every vault, every run"],
          ["nslookup from a linked VM", "The kit can't resolve names inside a network", "Records' configuration checked; Lab 2 runs nslookup"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 07, “What it leaves to you”; the kit's Private Link, DNS and Key Vault tests.",
      say: `What does Learn leave to you? The commands make one zone, one link, one endpoint; in practice, zones still get created in workload subscriptions, and records split. A zone group per endpoint means an endpoint without one has no record anybody manages. "Turn public access off once the private path works" leaves room for the private path to work while the public one stays open. Key Vault's recommendations are read once, and a vault created next quarter misses one. And nslookup has to run from inside a network, which the kit can't do. So the kit checks the records' configuration every run, and Lab 2 runs nslookup.`,
      detail: `Each row is pinned by a test in the Private Link, DNS and Key Vault tests. One zone, one link, one endpoint, by command: AZS-PL-01 and AZS-PL-02 for every privatelink zone outside the connectivity subscription or not linked to the hub. A zone group per endpoint: AZS-PL-03 for an endpoint with no zone group; AZS-PL-04 for one that registers in a non-central zone. "Turn public access off once the private path works": AZS-PL-05 for a resource with an endpoint and public network access still on. Key Vault's recommendations, one page: six checks on every vault, every run (AZS-KV-01 to 06). nslookup from a linked VM: the kit can't resolve names inside a network; it checks the records' configuration; Lab 2 runs nslookup.`,
      cite: ["azs07-scale"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "Zones, endpoints and public access: six rules",
      body: [
        { table: { head: ["Rule", "Severity", "What it flags"], w: [1.6, 1.4, 9.15], rows: [
          ["AZS-PL-01", "Finding", "A privatelink zone outside the connectivity subscription"],
          ["AZS-PL-02", "Finding", "A privatelink zone not linked to the hub virtual network"],
          ["AZS-PL-03", "Finding", "A private endpoint with no DNS zone group"],
          ["AZS-PL-04", "Finding", "A zone group that registers in a zone outside the connectivity subscription"],
          ["AZS-PL-05", "Finding", "A resource with a private endpoint and public network access still on"],
          ["AZS-PL-06", "Warn", "Public PaaS with no private endpoint (vaults go to the Key Vault rules)"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/azure-security (config/rules.json); Learn, CAF Private Link and DNS at scale; zone groups. Chapter 07, “The code: the private area.”",
      say: `Six rules cover the network side. A privatelink zone outside the connectivity subscription, or not linked to the hub, is a finding, as the Cloud Adoption Framework's central pattern asks. A private endpoint with no zone group, or one that registers in a zone outside the connectivity subscription, is a finding. A resource with a private endpoint and public network access still on is a finding. And a platform service that's public with no private endpoint at all is a warning, not a finding: the guide's private PaaS target is the agency's own, rising, and a Front Door origin locked by Chapter 5's checks may be public by design. Vaults go to the Key Vault rules.`,
      detail: `Get-AzsPrivateCheck reads the private DNS zones and their virtual network links, the private endpoints and each one's zone groups, the public PaaS list from Chapter 02, the key vaults, and each vault's diagnostic settings. AZS-PL-01, Finding: a privatelink zone outside the connectivity subscription (Learn, CAF). AZS-PL-02, Finding: a privatelink zone not linked to the hub virtual network (Learn). AZS-PL-03, Finding: a private endpoint with no DNS zone group (Learn). AZS-PL-04, Finding: a zone group that registers in a zone outside the connectivity subscription (Learn, CAF). AZS-PL-05, Finding: a resource with a private endpoint and public network access still on (Learn). AZS-PL-06, Warn: a PaaS resource that is public with no private endpoint, vaults excluded (Learn); a Warn because the guide's private PaaS target is the agency's own, rising, and a Front Door origin locked by Chapter 05's checks may be public by design.`,
      cite: ["azs07-scale", "azs07-zonegroup", "azs07-kv-pl"],
      ref: "“The code: the private area”",
    },
    {
      part: "What", title: "Every vault, six checks",
      body: [
        { table: { head: ["Rule", "Severity", "What it flags"], w: [1.6, 1.4, 9.15], rows: [
          ["AZS-KV-01", "Finding", "A vault on access policies, not Azure RBAC"],
          ["AZS-KV-02", "Finding", "A vault without purge protection"],
          ["AZS-KV-03", "Finding", "A vault's firewall default action isn't Deny"],
          ["AZS-KV-04", "Warn", "A vault's public network access is on"],
          ["AZS-KV-05", "Finding", "A vault with no approved private endpoint"],
          ["AZS-KV-06", "Finding", "No AuditEvent (or the audit or allLogs group) to the platform workspace"],
        ] }, pt: 12.5 },
        { lead: "Full posture: RBAC, purge protection, an approved private endpoint and AuditEvent. Rotation policies are data-plane reads the kit doesn't make." },
      ],
      sources: "Sources: examples/azure-security (config/rules.json); Learn, Secure your Azure Key Vault; Enable Key Vault logging. Chapter 07, “The code.”",
      say: `Then every vault gets six checks from Learn's Key Vault recommendations: role-based access, not access policies; purge protection; a firewall whose default is deny; public network access, which is a warning; an approved private endpoint; and audit events sent to the platform workspace. A vault has the full posture when it has role-based access, purge protection, an approved private endpoint and audit logs: the four parts of the guide's vault-posture metric. Key rotation policies are read through the vault's own data plane, which the kit doesn't call. Lab 2 reads one with the guide's command.`,
      detail: `AZS-KV-01, Finding: a vault on access policies, not Azure RBAC (Learn). AZS-KV-02, Finding: a vault without purge protection (Learn). AZS-KV-03, Finding: a vault's firewall default action isn't Deny (Learn, Key Vault Private Link). AZS-KV-04, Warn: a vault's public network access is on (Learn). AZS-KV-05, Finding: a vault with no approved private endpoint (Learn). AZS-KV-06, Finding: a vault with no AuditEvent (or the audit or allLogs group) to the platform workspace (Learn, Enable Key Vault logging). A vault has the full posture when it is on RBAC, has purge protection, an approved private endpoint and AuditEvent logs: the four parts of the guide's "Vault posture" metric. Rotation policies are read through the vault's data plane, which the kit doesn't call; Lab 2 reads one with the guide's command (research gaps, row 9). Two tests cover this area.`,
      cite: ["azs07-kv-secure", "azs07-kv-log", "azs07-guide"],
      ref: "“The code: the private area”",
    },
    {
      part: "Who", title: "Who owns the zones, endpoints and vaults",
      body: [
        { cards: [
          { title: "Platform owner", text: "Owns the central zones, their links and the policy that adds zone groups", color: "navy" },
          { title: "Workload owner", text: "Owns endpoints and vaults; closes the public path once private works", color: "teal" },
          { title: "Application owner", text: "Keeps the vault's posture, with the platform owner", color: "amber" },
        ], pt: 13.5 },
        { lead: "Every read is Reader; the kit doesn't read the vault's data plane." },
      ],
      sources: "Sources: Chapter 07, “Goal and audience”; “Federal requirements and evidence.”",
      say: `Who's involved? The platform owner owns the central zones, their links to the hub, and the policy that adds zone groups. Workload owners own their endpoints and vaults, and close the public path once the private one works. And the application owner keeps each vault's posture, with the platform owner. Every read the check makes is Reader, and it never touches a vault's data plane: no secrets, no keys.`,
      detail: `Audience: platform owners, who own the zones and the policy; workload owners, who own endpoints and vaults. In the evidence table: central zones and endpoints, platform owner; public PaaS without an endpoint, workload owners; vault posture, application owner and platform owner. Every call the private area makes is a Resource Graph or Resource Manager read with the role Reader; rotation policies are data-plane reads the kit doesn't make.`,
      cite: [],
      ref: "“Goal and audience”; “Federal requirements and evidence”",
    },
    {
      part: "How", title: "Lab 1: run the check, read each vault",
      body: [
        { terminal: "07-1", label: "examples/azure-security  ·  fixture data  ·  real output" },
        { terminal: "07-2" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 07, “Lab 1: fixtures, no subscription,” steps 1–2.",
      say: `Lab 1 needs PowerShell 7 with Pester, in the kit's folder, and no subscription. Contoso's vault zone is central and linked to the hub; the payroll team created its own blob zone in its workload subscription. Step 1 runs the check: one of three vaults has the full posture. Step 2 reads each vault. The payroll vault has everything. The hub certificates vault has no private endpoint, and its public access is on. And the portal vault misses every part: access policies, no purge protection, an open firewall, public access, no endpoint and no audit log.`,
      detail: `You need PowerShell 7.1 or later with Pester 5, working in examples/azure-security. Contoso's vault zone is central and linked to the hub; the payroll team created its own blob zone in its workload subscription. Three vaults: kv-payroll, kv-hub-certs and kv-portal. Step 1: Invoke-AzsCheck.ps1 -Area private: one of three vaults has the full posture. Step 2: kv-payroll has everything; kv-hub-certs has no private endpoint and its public access is on; kv-portal misses every part.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: endpoints and the findings",
      body: [
        { terminal: "07-3" },
        { terminal: "07-4", lines: "1-7,13" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 07, “Lab 1: fixtures, no subscription,” steps 3–4.",
      say: `Step 3 reads each private endpoint and the zone it registers in. The vault's endpoint registers in the central vault zone. The blob endpoint registers in the payroll team's own zone. And the queue endpoint has no zone group at all: nothing registers its record. Step 4 reads the findings. The blob zone is in the payroll subscription and not linked to the hub; the blob endpoint registers there; the queue endpoint has no zone group; the storage account has two endpoints and public access still on. Then the vault findings, and warnings for public services with no endpoint. Step 5 runs this chapter's two tests.`,
      detail: `Step 3: pe-kv-payroll registers in privatelink.vaultcore.azure.net; pe-st-payroll-blob in privatelink.blob.core.windows.net (in the payroll subscription); pe-st-payroll-queue has no zone group. Step 4: AZS-PL-01 and AZS-PL-02 for the blob zone (in subscription 3333…, not linked to vnet-hub); AZS-PL-04 for pe-st-payroll-blob; AZS-PL-03 for pe-st-payroll-queue; AZS-PL-05 for stpayrolldata (two endpoints, public access on); AZS-KV-05 for kv-hub-certs; AZS-KV-01, 02, 03, 05, 06 for kv-portal; AZS-PL-06 warnings for stcareersweb and the two portal web apps; AZS-KV-04 for kv-hub-certs and kv-portal. Step 5: two tests pass. Expected result: every zone, endpoint and vault checked, and the one vault with the full posture.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 3–5",
    },
    {
      part: "How", title: "Lab 2: a test vault, nslookup and the CLI",
      body: [
        { steps: [
          { title: "Sign in and write the settings", text: "az cloud set --name AzureCloud; az login --tenant; resource-graph; settings outside any repository" },
          { title: "Run the private-access check, live", text: "With -AllowUnverified for the zone, link and endpoint queries" },
          { title: "Compare with the guide's Validate", text: "az keyvault show for RBAC, purge, firewall and public access; az keyvault key rotation-policy show" },
          { title: "Resolve from a linked VM", text: "nslookup <vault>.vault.azure.net: a private address through privatelink.vaultcore.azure.net" },
          { title: "Back it out", text: "Nothing changed in Azure: delete what the lab wrote, and sign out" },
        ], pt: 12.5 },
        { callout: "a test vault behind a private endpoint, never production. The authors haven't run this lab.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Chapter 07, “Lab 2: a test subscription”; Learn, Integrate Key Vault with Private Link.",
      say: `Lab 2 moves to a test subscription with a test vault behind a private endpoint and the central zone, and a test machine in a linked network, never production. Sign in, write the settings, and run the check live, allowing the unverified calls. Compare with the guide's Validate query, which reads the vault's role-based access, purge protection, firewall and public access, and read one key's rotation policy, which the kit doesn't. Then, from the test machine, look up the vault's name: the answer should come through the vault's privatelink zone with a private address. From outside, the same name resolves to the public frontend, which refuses the request. Back out by deleting the output and signing out.`,
      detail: `Use a test tenant with a test management group and subscription in commercial Azure, never production, with a test vault behind a private endpoint and the central zone, and a test VM in a linked network. Steps: sign in (az cloud set --name AzureCloud; az login --tenant <tenant-id>; az extension add --name resource-graph); write the test settings file; run Invoke-AzsCheck.ps1 -Area private live with -AllowUnverified; compare az keyvault show --query "{rbac, purge, net, pna}" with the vault's row, and run az keyvault key rotation-policy show (needs a data-plane role and a private path). From the test VM, nslookup <vault>.vault.azure.net should answer through privatelink.vaultcore.azure.net with a private address; from outside, the public frontend refuses the request. Back out: Remove-Item the output; az logout.`,
      cite: ["azs07-kv-pl"],
      ref: "“Lab 2: a test subscription”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.3, 2.5, 2.2, 2.15], rows: [
          ["Central zones linked to the hub; every endpoint registered there; nothing public behind one (PL-01 to 05)", "SC-7; AC-4", "CNA-ULN", "Platform owner"],
          ["Public PaaS without an endpoint, named (PL-06)", "SC-7", "CNA-ULN", "Workload owners"],
          ["Every vault on RBAC with purge protection, an endpoint and audit logs; vaultPosturePercent", "SC-12; SC-28; IA-5", "SVC-ASM, IAM-SNU", "Application, platform owner"],
        ] }, pt: 12 },
        { lead: "The kit's output supports these controls; the assessor decides. KSIs are FedRAMP 20x indicators for providers." },
      ],
      sources: "Sources: the guide's Federal requirements and KSIs (Steps 7 and 8). Chapter 07, “Federal requirements and evidence.”",
      say: `Each output is evidence for something specific, from the guide's requirements table against NIST SP 800-53. Central zones linked to the hub, every endpoint registered there, and nothing public behind an endpoint support boundary protection and information flow enforcement. Public services without an endpoint, named, support boundary protection. And every vault on role-based access with purge protection, a private endpoint and audit logs supports cryptographic key management, protection of information at rest, and authenticator management. The kit's output supports these controls; the assessor decides. The key security indicators are FedRAMP's indicators for cloud providers, which the agency lines its own evidence up with.`,
      detail: `Central zones linked to the hub, every endpoint registered there, nothing public behind an endpoint (AZS-PL-01 to 05, or none): SC-7, boundary protection; AC-4, information flow enforcement; KSI-CNA-ULN; platform owner. Public PaaS without an endpoint, named (AZS-PL-06): SC-7; KSI-CNA-ULN; workload owners. Every vault on RBAC with purge protection, a private endpoint and audit logs (private.json vault rows, vaultPosturePercent): SC-12, cryptographic key establishment and management; SC-28, protection of information at rest; IA-5, authenticator management; KSI-SVC-ASM, KSI-IAM-SNU; application owner, platform owner. The controls are the guide's Step 7 and Step 8 rows and their KSIs; the guide notes KSI-CNA-ULN cites AC-4(21) and SC-7, and KSI-SVC-ASM cites SC-12 and IA-5(2).`,
      cite: ["azs07-guide"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.4, 4.4, 4.35], rows: [
          ["Zones in workload subscriptions", "Records split; resolution fails or goes public", "AZS-PL-01, AZS-PL-04"],
          ["An endpoint with no zone group", "Its record is hand-made, or missing", "AZS-PL-03"],
          ["The public path left open", "The endpoint works, and so does the internet", "AZS-PL-05, KV-03, KV-04"],
          ["Purge protection read as a rollback", "It can't be turned off once on", "AZS-KV-02 only ever asks for it on"],
          ["Configuration taken as resolution", "Records exist; clients still resolve the public name", "Lab 2 runs nslookup from a linked VM"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 07, “Dangers.”",
      say: `What breaks in production? Zones in workload subscriptions split the records, so resolution fails or goes public; the kit flags them. An endpoint with no zone group has a record somebody made by hand, or none at all. The public path left open means the private endpoint works, and so does the internet; three rules catch it. Purge protection can't be turned off once it's on, which is the point, so the kit only ever asks for it on. And configuration isn't resolution: the records can exist while clients still resolve the public name, which is why Lab 2 runs nslookup from a linked machine.`,
      detail: `Zones in workload subscriptions: records split across zones; resolution fails or goes public; guard AZS-PL-01, AZS-PL-04. An endpoint with no zone group: its record is hand-made, or missing; guard AZS-PL-03. The public path left open: the private endpoint works, and so does the internet; guard AZS-PL-05, AZS-KV-03, AZS-KV-04. Purge protection read as a rollback: it can't be turned off once on; that is the point; guard: AZS-KV-02 only ever asks for it on. Configuration taken as resolution: records exist; clients still resolve the public name; guard: Lab 2 runs nslookup from a linked VM.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { bullets: [
          "Every privatelink zone is in the connectivity subscription and linked to the hub",
          "Every private endpoint has a zone group in a central zone",
          "No resource has an endpoint with public network access still on, unless a decision record says why",
          "Every vault has the full posture, or a dated plan",
          "nslookup from a linked VM returned a private address",
        ], pt: 14.5 },
        { callout: "Chapter 08: policy that holds all of this in place, and the evidence that it did.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 07, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. Every privatelink zone is in the connectivity subscription and linked to the hub. Every private endpoint has a zone group in a central zone. No resource has an endpoint with public network access still on, unless a decision record says why. Every vault has the full posture, or a dated plan. And nslookup from a linked machine returned a private address. Next, Chapter 8: the policy that holds all of this in place, and the evidence that it did.`,
      detail: `Checklist: every privatelink zone is in the connectivity subscription and linked to the hub; every private endpoint has a zone group in a central zone; no resource has an endpoint with public network access still on, unless a decision record says why; every vault has the full posture, or a dated plan; nslookup from a linked VM returned a private address. Next, Chapter 08: policy that holds all of this in place, and the evidence that it did. The guide's Steps 7 and 8 hold the commands that build the zones, endpoints and vaults.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
