// Companion guide — Azure Security Engineering (an implementation guide). The guide is a DRAFT awaiting the editor's
// review; the title slide and its narration say so.
// A narrated Why / What / Who / How deck of about 15 minutes (17 narrated slides, then a backup section).
//   Why:   a landing zone doesn't decide what the internet reaches; what the books own and what the guide adds.
//   What:  the ten steps on one page; commercial Azure for a GCC tenant, with Azure Government notes;
//          the same controls on AWS, Google Cloud and Oracle Cloud Infrastructure.
//   Who:   the roles, eligible through PIM; the RACI.
//   How:   Steps 1 and 2 (baseline, exposure inventory); 3 DDoS; 4 WAF; 5 Front Door and Application Gateway;
//          6 Azure Firewall; 7 Private Link and DNS; 8 Key Vault; 9 policy and drift; 10 operations, metrics;
//          dangers, what couldn't be verified and the pieces still planned.
// Sources: docs/books/guides/azure-security-implementation.md and the sources it footnotes (Microsoft Learn, NIST,
// FedRAMP, AWS, Google Cloud and Oracle documentation; read November 11, 2026; listed in
// docs/books/guides/_verification/azure-security-implementation.md). The commands on the slides are the guide's, with
// its placeholders; long ones are continued PowerShell-style with a backtick. No new facts.
// The speaker notes are the narration (spoken by narrate.py), written to be heard: acronyms the voice misreads are spelled
// out, and every source is named by its original or a book by its title, never by a workbook book number.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/guide-azure-security/build.js \
//                      presentations/guide-azure-security/Guide_Azure_Security.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Azure Security Engineering: An Implementation Guide",
  footer: "Federal Modernization Workbook  ·  Companion guide: Azure Security Engineering (draft)",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Guide_Azure_Security.pptx";
const G = "Companion guide, Azure Security Engineering";

// ------------------------------------------------------------------ code panel (as in the Zero Trust Assessment guide's deck)
// A light panel with monospaced text (Consolas). Lines starting with "#" are comments, in teal.
const CODE_FILL = "F1F5F9";
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 11;
  const lh = pt / 72 * 1.2;
  const top = y + 0.1 + (o.label ? 0.27 : 0);
  const h = (top - y) + lines.length * lh + 0.14;
  box(s, name, x, y, w, h, CODE_FILL, HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.18, y: y + 0.08, w: w - 0.36, h: 0.25, fontSize: 10.5, bold: true, color: HEX.slate });
  const widest = Math.max(...lines.map((l) => l.length));
  const need = widest * 0.55 * pt / 72 + 0.4;
  if (need > w + 0.01) console.warn(`  ! ${name} code may overflow its width: ${widest} chars need ${need.toFixed(2)} in, has ${w.toFixed(2)}`);
  const runs = lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1,
    color: /^\s*#/.test(l) ? HEX.teal : HEX.ink } }));
  txt(s, `${name} code`, runs, { x: x + 0.18, y: top, w: w - 0.3, h: h - (top - y) - 0.06, fontFace: "Consolas", fontSize: pt, valign: "top" });
  const bottom = y + h;
  if (bottom > (o.limit || 6.6) + 0.01) console.warn(`  ! ${name} code may overflow: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${bottom.toFixed(2)} in, widest ${widest} chars (${need.toFixed(2)} of ${w.toFixed(2)} in)`);
  return bottom;
};

// A one-line plain statement under a table or panel (navy, bold), with a fit check.
const line = (s, name, text, y, h, pt = 14) => {
  const need = Math.ceil((text.length * 0.5 * pt / 72) / 11.9) * pt / 72 * 1.2 + 0.05;
  if (need > h) console.warn(`  ! ${name} line may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} line may overflow: bottom ${(y + h).toFixed(2)} in`);
  if (process.env.FIT) console.log(`  line ${name}: bottom ${(y + h).toFixed(2)} in`);
  txt(s, name, text, { x: 0.6, y, w: 12.15, h, fontSize: pt, color: HEX.navy, bold: true });
  return y + h;
};
const fit = (what, bottom) => { if (process.env.FIT) console.log(`  ${what} bottom ${bottom.toFixed(2)}`); if (bottom > 6.61) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const SWHY = "Why", SWHAT = "What", SWHO = "Who", SHOW = "How";
const FULL = 12.15;
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = titleSlide(SWHY, "Azure security, engineered one service at a time", "An implementation guide: ten steps from the landing-zone baseline to the evidence an assessor reads");
  // The guide is a draft: say so before anything else on the slide.
  box(s, "Draft notice", 0.8, 0.55, 7.4, 0.75, "FFFFFF", HEX.red);
  txt(s, "Draft notice text", [
    { text: "DRAFT GUIDE, AWAITING THE EDITOR'S REVIEW.  ", options: { bold: true, color: HEX.red } },
    { text: "Recheck it after the review." },
  ], { x: 1.0, y: 0.6, w: 7.05, h: 0.65, fontSize: 14, valign: "middle", color: HEX.ink });
  txt(s, "Session map", [
    { text: "Why: a landing zone doesn't decide what the internet reaches   ·   What: ten steps, two clouds, four providers", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Who: eligible roles and the RACI", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "How: baseline, exposure, DDoS, WAF, ingress, firewall, Private Link, Key Vault, policy, operations", options: { color: HEX.ink } },
  ], { x: 0.8, y: 5.05, w: 11.0, h: 1.15, fontSize: 14, paraSpaceAfter: 2 });
  notes(s,
`Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: Azure Security Engineering. One thing first: the guide is a draft, awaiting the editor's review, so recheck it after that review. The guide engineers the security of an agency's Azure estate on top of the landing zone, as ten gated steps an operator can run: from the security baseline and an inventory of public exposure, through DDoS protection, the web application firewall, ingress, Azure Firewall, Private Link and Key Vault, to policy, operations and evidence. Its commands and service behavior come from Microsoft Learn, read on November eleventh, 2026, and its control statements from NIST. The program's own choices are called design guidance. Nothing in it was run against a live subscription. We'll go in four parts: why, what, who, and how.`,
  `${G} — opening statement, "In this guide," "How to read this guide" (Where the facts come from); status: draft.`);
}

// ================================================================== 2 Why: a landing zone isn't exposure control
{
  const s = content(SWHY, "Why this matters: a landing zone isn't a defense");
  tag(s, "Why");
  const p1 = panel(s, "Decides", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHAT A LANDING ZONE DECIDES", null, [
    "What can be deployed, and where: the hierarchy, the boundary policies, the exemption rule",
    "Designed in Cloud Boundary and Landing Zone",
  ], 13);
  const p2 = panel(s, "Doesnt", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "WHAT IT DOESN'T DECIDE", null, [
    "What the internet can reach",
    "What leaves the estate",
    "Who can read a key",
  ], 13);
  const p3 = panel(s, "Goal", 0.6, Math.max(p1, p2) + 0.2, FULL, null, HEX.teal, HEX.tealTint, "THE GUIDE'S GOAL (DESIGN GUIDANCE)", null, [
    "Every internet-facing service in an inventory with an owner, behind DDoS protection and a WAF in prevention mode, with no way around them",
    "Egress only through an inspecting firewall; PaaS only through private endpoints",
    "Secrets and keys in vaults only managed identities and eligible administrators can use",
    "Azure Policy holds it in place and reports drift; every statement has evidence an assessor can inspect",
  ], 13);
  callout(s, "Ready", p3 + 0.25, 0.9, "FaScaleBalanced", HEX.navy, "Ready for closure: ",
    "every applicable control state has evidence. The authorizing official or assessor decides.");
  sources(s, "Sources: Guide, opening statement, \"How to read this guide,\" \"The track at a glance,\" \"Control states\"; Book 10, Ch 05.");
  notes(s,
`Here's the idea the guide starts from. A landing zone decides what can be deployed, and where: the management group hierarchy, the boundary policies and the exemption rule that Cloud Boundary and Landing Zone designs. It doesn't decide what the internet can reach, what leaves the estate, or who can read a key. Those are engineered one service at a time, and each one has to be proved. So the guide's goal is this. Every internet-facing service is in an inventory with an owner, behind DDoS protection and a web application firewall in prevention mode, and nothing can reach around them. Workloads leave Azure only through an inspecting firewall and reach platform services only through private endpoints. Keys sit in vaults that only managed identities and eligible administrators can use. And Azure Policy holds it all in place. A finding is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.`,
  `${G} — opening statement, "How to read this guide," "The track at a glance" (The goal), "Control states and assessment mapping"; Book 10, Chapter 05.`);
}

// ================================================================== 3 Why: what the books own, what the guide adds
{
  const s = content(SWHY, "The books design it; the guide engineers each service");
  tag(s, "Why");
  const tb = table(s, "Cover", 1.4, [3.4, 4.6, 4.15], ["Topic", "Where the design lives", "What the guide adds"], [
    ["Landing-zone baseline", "Cloud Boundary and Landing Zone: hierarchy, boundary policy, provisioning loop, ownership", "Step 1: the security settings on top, logging, the gate"],
    ["Public exposure", "Security Operations and Telemetry: internet exposure analysis", "Step 2: Resource Graph inventory, owners, the register"],
    ["DDoS, WAF, Front Door and Application Gateway", "Covered nowhere else", "Steps 3, 4 and 5"],
    ["Firewall; Private Link and DNS", "Network and Transport (the edge, TIC); DNS, DHCP and IPAM", "Steps 6 and 7: the Azure side"],
    ["Managed identities and Key Vault", "The service account guide, Migration C", "Step 8: the vault only"],
    ["Policy, drift, operations", "Landing zone; Governance, Drift and Evidence; Zero Trust and Assessment", "Steps 9 and 10"],
  ], { fontSize: 11.5, limit: 5.3 });
  line(s, "ZT", "What a Zero Trust assessment tests: DDoS on every public IP, WAF in prevention, origins only the edge reaches, inspected egress, private PaaS, keys behind RBAC.",
    tb + 0.15, 0.6, 13.5);
  sources(s, "Sources: Guide, \"How to read this guide,\" \"Where each topic is covered\"; Azure network security Zero Trust recommendations.");
  notes(s,
`The workbook's books already design most of this. Cloud Boundary and Landing Zone builds the hierarchy, the boundary policies, the provisioning loop and the ownership. Security Operations and Telemetry chooses the posture tool. Network and Transport owns the agency edge, and DNS, DHCP and IPAM owns name resolution. What none of them gives is the service-by-service engineering of the Azure controls a Zero Trust assessment tests: DDoS protection on every public I P, a web application firewall in prevention mode, origins only the edge can reach, egress through an inspecting firewall, platform services reached only through private endpoints, and keys behind role-based access with purge protection. Microsoft Learn's Azure network security Zero Trust recommendations list those checks, and the guide takes each one as a step.`,
  `${G} — "How to read this guide," "Where each topic is covered"; Microsoft Learn — "Azure network security Zero Trust recommendations."`);
}
endModule(SWHY);

// ================================================================== 4 What: the ten steps
{
  const s = content(SWHAT, "The ten steps on one page");
  tag(s, "What");
  const tb = table(s, "Path", 1.4, [3.1, 5.55, 3.5], ["Step", "Done when", "Validate with"], [
    ["1 Landing-zone baseline", "Hierarchy protected; security initiative assigned; platform logs flowing", "az policy assignment list"],
    ["2 Public exposure inventory", "Every public IP, Front Door endpoint and gateway in the register, with an owner", "The inventory queries, weekly"],
    ["3 DDoS protection", "Every public IP protected, logged and alerting; one exercise run", "ddosSettings query; the alert"],
    ["4 Web application firewall", "Prevention mode, request body inspection, current rule set, rate limits", "waf-policy show; a test request blocked"],
    ["5 Front Door and App Gateway", "Origins reachable only through the edge; TLS 1.2 minimum; failover tested", "A direct request refused"],
    ["6 Firewall and segmentation", "Default routes to the firewall; threat intelligence and IDPS in deny", "Effective routes; a test domain denied"],
    ["7 Private Link and DNS", "PaaS public access off; central zones; records registered by policy", "nslookup gives a private IP"],
    ["8 Managed identities, Key Vault", "RBAC, purge protection, private endpoint, rotation, audit logs", "az keyvault show; AuditEvent"],
    ["9 Policy and drift", "Initiatives enforced; exemptions expire; monthly export", "az policy state summarize"],
    ["10 Operations and evidence", "Owners, cadence, exercises and the evidence catalog in use", "The quarterly review record"],
  ], { fontSize: 11, limit: 6.0 });
  line(s, "Order", "Steps 1 and 2 first; 3 to 8 in parallel by workload; 9 turns them into policy; 10 runs from the start.",
    tb + 0.1, 0.4, 13.5);
  sources(s, "Sources: Guide, \"The path on one page,\" \"Prerequisites.\"");
  notes(s,
`Here's the path on one page, each step with a done-when and a way to validate it. One: protect the hierarchy, assign the security initiative, and get platform logs flowing. Two: put every public I P, Front Door endpoint and application gateway in a register with an owner. Three: DDoS protection on every public I P, logged and alerting, with one exercise run. Four: the web application firewall in prevention mode. Five: origins that only the edge can reach, T L S one point two at least, and failover tested. Six: default routes to Azure Firewall, with threat intelligence and intrusion detection in deny. Seven: platform services with public access off, resolving through central private zones. Eight: vaults on role-based access with purge protection. Nine: policy that holds it, with exemptions that expire. Ten: owners, cadence and evidence. Steps one and two come first; three to eight can run in parallel by workload.`,
  `${G} — "The path on one page" (table and ordering), "Prerequisites."`);
}

// ================================================================== 5 What: government clouds
{
  const s = content(SWHAT, "GCC uses commercial Azure; Azure Government differs");
  tag(s, "What");
  const tb = table(s, "Gov", 1.4, [3.3, 2.2, 6.65], ["Service", "Commercial Azure (GCC)", "Azure Government: what to plan for"], [
    ["Front Door Standard and Premium", "Available", "GA in US Gov Arizona and Texas; Private Link origins unconfirmed outside Virginia. Classic retires March 31, 2027"],
    ["Azure WAF on Application Gateway", "Available", { text: "No bot protection rule sets and no geo-filtering custom rules: record the bot test Skipped-Not-Applicable, not Fail", options: { color: HEX.red, bold: true } }],
    ["Azure DDoS Protection", "Available", "No variation listed; the Red Button simulation partner is public cloud only"],
    ["Azure Firewall Standard, Premium", "Available", "No variation listed; Premium's regions not yet specified on Learn"],
    ["Private Link and private DNS", "Available", "Different zone names, such as privatelink.vaultcore.usgovcloudapi.net"],
    ["Key Vault; Azure Policy", "Available", "Endpoints only (vault.usgovcloudapi.net); FedRAMP initiatives per cloud"],
    ["Azure Lighthouse", "Available", "No PIM for delegated access, no delegation across clouds"],
  ], { fontSize: 11, limit: 5.7 });
  line(s, "Pair", "Microsoft 365 GCC pairs with commercial Azure; GCC High and DoD pair with Azure Government. Sign in to the cloud the subscription lives in.",
    tb + 0.12, 0.6, 13.5);
  sources(s, "Sources: Guide, \"Government-cloud availability\"; Compare Azure Government and global Azure; Application Gateway WAF FAQ; Front Door Private Link origins.");
  notes(s,
`Which cloud? Microsoft three sixty-five G C C pairs with commercial Azure, so a G C C agency's subscriptions are usually commercial, and every service here is available. G C C High and D O D pair with Azure Government, and Microsoft Learn's page, Compare Azure Government and global Azure, says a service there has all its features unless the page lists a variation. A few matter. Front Door Standard and Premium are generally available in two U S Gov regions, and Private Link origins outside Virginia are unconfirmed. On Application Gateway, Learn's web application firewall F A Q says sovereign clouds have no bot protection rule sets and no geo-filtering custom rules, so that Zero Trust test is recorded as skipped, not applicable, rather than failed. Private DNS zone names differ, and Lighthouse has no pim for delegated access. Whatever the cloud, sign in to the one the subscription lives in.`,
  `${G} — "Government-cloud availability" (table and notes), "Prerequisites" (The right cloud); Microsoft Learn — "Compare Azure Government and global Azure," "Frequently asked questions for Azure Web Application Firewall on Application Gateway," "Secure your origin with Private Link in Azure Front Door Premium."`);
}

// ================================================================== 6 What: other clouds
{
  const s = content(SWHAT, "The same controls on AWS, Google Cloud and Oracle");
  tag(s, "What");
  const tb = table(s, "Clouds", 1.4, [2.15, 2.5, 2.5, 2.5, 2.5], ["Control", "Azure", "AWS", "Google Cloud", "Oracle Cloud (OCI)"], [
    ["L3/L4 DDoS", "Infrastructure protection (free), plus Network or IP Protection", "Shield Standard (free); Shield Advanced with response team and cost protection", "Cloud Armor: always-on L3/L4 behind load balancers", "Not compared; not yet specified"],
    ["Web application firewall", "Azure WAF on Front Door and Application Gateway", "AWS WAF on CloudFront, ALB, API Gateway, AppSync", "Cloud Armor policies with OWASP CRS rules", "OCI WAF: regional or edge policy, rate limiting"],
    ["Inspecting firewall", "Azure Firewall Premium: IDPS, TLS inspection", "Network Firewall; not compared", "Cloud NGFW; not compared", "OCI Network Firewall: IDPS, TLS inspection, URL filtering"],
    ["Private access to PaaS", "Private Link private endpoints", "PrivateLink; not compared", "Private Service Connect", "Private endpoints in a VCN subnet"],
    ["Government cloud", "Azure Government, previous slide", "WAF in GovCloud: AWS managed rule groups only", "FedRAMP High package lists Cloud Armor, not Private Service Connect", "Government Cloud WAF and firewall: not yet specified"],
  ], { fontSize: 10.5, limit: 5.9 });
  line(s, "HR", "An agency's HR platform may run on Oracle Cloud Infrastructure. Each provider's own documentation carries the build.", tb + 0.12, 0.4, 13.5);
  sources(s, "Sources: Guide, \"The same controls on AWS, Google Cloud and Oracle Cloud\"; AWS Shield and AWS WAF; Google Cloud Armor overview; OCI Web Application Firewall; OCI Network Firewall.");
  notes(s,
`An agency's H R platform may run on Oracle Cloud Infrastructure, so the guide lines up the equivalents on four clouds. For network-layer DDoS, Azure's infrastructure protection is free, with Network or I P Protection on top; A W S has Shield Standard and Shield Advanced; Google Cloud Armor is always on behind load balancers. For the web application firewall: Azure W A F, A W S W A F, Cloud Armor policies, and the O C I web application firewall, regional or at the edge. For inspection, Azure Firewall Premium and the O C I Network Firewall both offer intrusion detection and T L S inspection. For private access to platform services: Private Link, Google's Private Service Connect, and O C I private endpoints. In the government clouds, A W S W A F in GovCloud offers only A W S managed rule groups, and Oracle's government availability isn't yet specified.`,
  `${G} — "The same controls on AWS, Google Cloud and Oracle Cloud" (table); AWS — "How AWS Shield and Shield Advanced work," "AWS WAF in AWS GovCloud (US)"; Google Cloud — "Google Cloud Armor overview," "Private Service Connect," Assured Workloads "Supported products"; Oracle — OCI "Web Application Firewall overview," "Network Firewall overview," "Access to Oracle Services: private access."`);
}
endModule(SWHAT);

// ================================================================== 7 Who: roles and RACI
{
  const s = content(SWHO, "Eligible roles, named owners: who does what");
  tag(s, "Who");
  const p1 = panel(s, "Roles", 0.6, 1.45, W2, null, HEX.teal, HEX.tealTint, "ROLES, ELIGIBLE THROUGH PIM, NOT STANDING", null, [
    "Network Contributor for the connectivity work; Resource Policy Contributor for Azure Policy",
    "Key Vault Administrator for vault settings; Security Admin for Defender for Cloud",
  ], 12);
  const p2 = panel(s, "Owners", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "THE OWNERS (DESIGN GUIDANCE)", null, [
    "Policy owner, platform owner, operator, security monitor, help desk, assessor",
    "Application owners answer for origins, certificates and vault contents",
  ], 12);
  const tb = table(s, "RACI", Math.max(p1, p2) + 0.2, [5.6, 3.35, 3.2], ["Activity (from the guide's RACI)", "Responsible", "Accountable"], [
    ["Decision records; baseline and initiatives (Steps 1, 9)", "Platform owner", "Policy owner"],
    ["Exposure register; private DNS zones and endpoints", "Operator", "Platform owner"],
    ["DDoS plan, WAF and firewall policies (Steps 3, 4, 6)", "Operator", "Platform owner"],
    ["Alert response and DDoS incidents", "Security monitor", "Security monitor"],
    ["WAF false positives reported by users", "Help desk (first contact); operator", "—"],
    ["Evidence package and closure readiness", "Platform owner", "Policy owner; assessor decides"],
  ], { fontSize: 11, limit: 6.55 });
  fit("RACI", tb);
  sources(s, "Sources: Guide, \"Prerequisites\" (roles), \"RACI\"; Book 10, Ch 08; Book 15; privileged access guide.");
  notes(s,
`Now, who. Every role this work needs is eligible through pim, not standing, as the Privileged Access guide sets up: Network Contributor for the connectivity work, Resource Policy Contributor for Azure Policy, Key Vault Administrator for vault settings, and Security Admin for Defender for Cloud. The guide's RACI follows Cloud Boundary and Landing Zone's chapter on who owns the boundary, and it's design guidance. The policy owner is accountable for the decision records, the baseline and the evidence package. The platform owner is accountable for the register, the DDoS plan, the web application firewall and firewall policies, and the private DNS zones, with the operator doing the work. The security monitor owns alert response and DDoS incidents. Application owners answer for their origins, certificates and vault contents, and the assessor decides closure.`,
  `${G} — "Prerequisites" (Roles, eligible through PIM), "RACI"; Book 10, Chapter 08; Book 15; Privileged Access: An Implementation Guide.`);
}
endModule(SWHO);

// ================================================================== 8 How: Steps 1 and 2
{
  const s = content(SHOW, "Steps 1 and 2: baseline in audit, then inventory");
  tag(s, "How");
  const c = code(s, "Base", 0.6, 1.4, FULL, [
    "# Step 1: protect the hierarchy; assign the FedRAMP initiative in audit at the intermediate root",
    "New-AzManagementGroupHierarchySetting -GroupName <tenant-root-group-id> -Authorization True -DefaultManagementGroup <sandbox-mg-id>",
    "az policy assignment create --name azs-fedramp-mod --policy-set-definition <initiative-name> `",
    "    --scope /providers/Microsoft.Management/managementGroups/<mg-id> --enforcement-mode DoNotEnforce",
    "# Step 2: every public IP and its DDoS state, from Resource Graph (also Front Door, gateways, public PaaS)",
    "az graph query -q \"Resources | where type =~ 'microsoft.network/publicipaddresses' | project id, name, `",
    "    ddosMode = tostring(properties.ddosSettings.protectionMode), owner = tostring(tags['owner'])\" --first 1000",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN (SHORTENED; PLACEHOLDERS IN ANGLE BRACKETS)", pt: 10.5 });
  const p1 = panel(s, "Audit", 0.6, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "STEP 1: AUDIT FIRST", null, [
    "DoNotEnforce evaluates compliance without enforcing; Step 9 enforces",
    "Every hub resource sends diagnostics to the workspace; Defender for Cloud on every subscription",
  ], 11.5);
  const p2 = panel(s, "Register", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.red, HEX.redTint, "STEP 2: THE REGISTER", null, [
    "One row per exposure: owner, DNS names, certificate, DDoS, WAF and mode, origin lock-down",
    "A map of the attack surface: keep it inside the boundary, never in a public repository",
  ], 11.5);
  fit("Step 1-2 panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Steps 1 and 2; Protect your resource hierarchy; Azure Policy assignment structure; Starter Resource Graph query samples.");
  notes(s,
`Now how, starting with steps one and two. Step one adds the security settings the landing zone needs. Protect the hierarchy, as Learn's page, Protect your resource hierarchy, shows: require authorization to create management groups and send new subscriptions to a default group. Assign the Microsoft cloud security benchmark and the fed-ramp initiative at the intermediate root in do-not-enforce mode, which, per Learn's Azure Policy assignment structure, evaluates compliance without enforcing; step nine enforces. Send every platform resource's logs to the workspace, and turn on Defender for Cloud. Step two builds what nothing else can be proved complete without: a list of what's exposed. Learn recommends an inventory of every public I P and its protection status, kept with Resource Graph. The register adds the owner, the D N S names and certificates, and whether a web application firewall covers each one. It's a map of the attack surface, so keep it inside the boundary.`,
  `${G} — Step 1 (steps 1 to 4), Step 2 (steps 1 to 6); Microsoft Learn — "Protect your resource hierarchy," "Azure Policy assignment structure," "Starter Resource Graph query samples," "Secure your Azure DDoS Protection deployment."`);
}

// ================================================================== 9 How: DDoS
{
  const s = content(SHOW, "Step 3: DDoS protection on every public IP");
  tag(s, "How");
  const c = code(s, "DDoS", 0.6, 1.4, FULL, [
    "# One Network Protection plan in the connectivity subscription; link each virtual network that holds public IPs",
    "az network ddos-protection create --resource-group <rg> --name <ddos-plan>",
    "az network vnet update --resource-group <rg> --name <vnet> --ddos-protection-plan <ddos-plan> --ddos-protection true",
    "# Or IP Protection on one Standard public IP",
    "az network public-ip update --resource-group <rg> --name <pip> --ddos-protection-mode Enabled",
    "# Alert while under attack: IfUnderDDoSAttack is 1 during mitigation",
    "az monitor metrics alert create --name ddos-under-attack-<pip> --resource-group <rg> --scopes <pip-resource-id> `",
    "    --condition \"max IfUnderDDoSAttack >= 1\" --window-size 5m --evaluation-frequency 1m --action <action-group-id>",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "Tier", 0.6, c + 0.15, W3, null, HEX.navy, HEX.navyTint, "CHOOSE THE TIER", null, [
    "Network: many IPs, Rapid Response, cost protection",
    "IP Protection: a few critical IPs",
  ], 11.5);
  const p2 = panel(s, "Limits", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.red, HEX.redTint, "LIMITS", null, [
    "Layers 3 and 4 only: layer 7 needs the WAF",
    "NAT gateway IPs aren't covered",
  ], 11.5);
  const p3 = panel(s, "Ex", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.amber, HEX.amberTint, "EXERCISE IT", null, [
    "Approved partners only, against your own protected IPs",
    "Red Button is public cloud only",
  ], 11.5);
  fit("DDoS panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 3; Azure DDoS Protection tier comparison; Secure your Azure DDoS Protection deployment; DDoS simulation testing.");
  notes(s,
`Step three is DDoS protection. Every public I P in Azure gets infrastructure protection at no cost. Learn's tier comparison says Network Protection and I P Protection add adaptive tuning, attack analytics, metrics, alerts and mitigation reports; Network Protection also adds the Rapid Response team and cost protection. Choose Network Protection when many public I Ps need coverage, and I P Protection for a few critical ones, and record the choice. Both work at layers three and four, so layer seven needs the web application firewall, and neither covers a public I P on a NAT gateway. Create one plan, link each virtual network, turn on diagnostic logs, and alert on the metric that reads one while an attack is mitigated. Then hold it with policy in step nine. Exercise the response: Learn allows simulations only through approved partners, only against your own protected I Ps, and one partner, Red Button, is public cloud only.`,
  `${G} — Step 3 (Choose the tier; steps 1 to 6; How template); Microsoft Learn — "About Azure DDoS Protection tier comparison," "What is Azure DDoS Protection?," "QuickStart: Create and configure Azure DDoS Network Protection using Azure CLI," "Secure your Azure DDoS Protection deployment," "Tutorial: Azure DDoS Protection simulation testing."`);
}

// ================================================================== 10 How: WAF
{
  const s = content(SHOW, "Step 4: the WAF, from detection to prevention");
  tag(s, "How");
  const c = code(s, "WAF", 0.6, 1.4, FULL, [
    "# Application Gateway: create in detection mode with request body inspection; name the rule set version you validated",
    "az network application-gateway waf-policy create --name <waf-policy> --resource-group <rg> --type Microsoft_DefaultRuleSet --version 2.1",
    "az network application-gateway waf-policy policy-setting update --policy-name <waf-policy> --resource-group <rg> `",
    "    --mode Detection --state Enabled --request-body-check true",
    "# Bot protection (commercial Azure only) and a rate limit on the login path; then log and tune",
    "az network application-gateway waf-policy managed-rule rule-set add --policy-name <waf-policy> --resource-group <rg> `",
    "    --type Microsoft_BotManagerRuleSet --version 1.1",
    "# After a full business cycle of tuning: prevention",
    "az network application-gateway waf-policy policy-setting update ... --mode Prevention --state Enabled --request-body-check true",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN'S CLI REFERENCE", pt: 10.5 });
  const p1 = panel(s, "Only", 0.6, c + 0.15, W2, null, HEX.red, HEX.redTint, "ONLY PREVENTION BLOCKS", null, [
    "Detection mode logs and forwards the attack to the backend",
    "Learn: the latest Default Rule Set, 2.2 when read, validated in log mode first",
  ], 11.5);
  const p2 = panel(s, "FD", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "FRONT DOOR AND AS CODE", null, [
    "Front Door managed rules need Premium; same detection-then-prevention path",
    "Bicep from Azure Verified Modules; leave out bot rules in Azure Government",
  ], 11.5);
  fit("WAF panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Step 4; Zero Trust recommendations for Application Gateway WAF; Secure your Azure Application Gateway; Application Gateway WAF FAQ.");
  notes(s,
`Step four is the web application firewall, on Front Door globally or Application Gateway regionally. Learn's Zero Trust recommendations for Application Gateway say it plainly: detection mode logs an attack and forwards it; only prevention mode blocks. The checks cover prevention mode, request body inspection, the default rule set, bot protection, rate limiting and diagnostic logging. Learn recommends the latest default rule set, two point two when read, validated in log mode before blocking. So create the policy in detection mode with request body inspection on, naming the rule set version you validated. Add bot protection, which is commercial Azure only, and a rate limit on the login path. Attach the policy, send the firewall log to the workspace, and tune for at least a full business cycle, scoping every exception to the narrowest rule. Then switch to prevention. Front Door's managed rules need Premium. In Azure Government, leave out the bot rule set.`,
  `${G} — Step 4 (Application Gateway steps 1 to 4, Front Door Premium, As code, How template); Microsoft Learn — "Zero Trust recommendations for Application Gateway WAF," "Azure network security Zero Trust recommendations," "Secure your Azure Application Gateway," Azure CLI "az network application-gateway waf-policy," "Frequently asked questions for Azure Web Application Firewall on Application Gateway."`);
}

// ================================================================== 11 How: Front Door and Application Gateway
{
  const s = content(SHOW, "Step 5: an origin nothing can reach around the edge");
  tag(s, "How");
  const c = code(s, "Origin", 0.6, 1.4, FULL, [
    "# Where Private Link doesn't apply: the service tag AND the Front Door ID header, together (App Service origin)",
    "az webapp config access-restriction add --resource-group <rg> --name <app-name> --priority 100 `",
    "    --service-tag AzureFrontDoor.Backend --http-header x-azure-fdid=<front-door-id>",
    "# Application Gateway: TLS 1.2 or 1.3 only, through a predefined policy",
    "$AppGw = Get-AzApplicationGateway -Name <appgw> -ResourceGroupName <rg>",
    "Set-AzApplicationGatewaySslPolicy -PolicyType Predefined -PolicyName \"AppGwSslPolicy20220101S\" -ApplicationGateway $AppGw",
    "Set-AzApplicationGateway -ApplicationGateway $AppGw",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "PL", 0.6, c + 0.15, W3, null, HEX.teal, HEX.tealTint, "PRIVATE LINK FIRST", null, [
    "Front Door Premium reaches App Service, Blob, internal load balancers and more privately",
    "Don't mix public and private origins in one group",
  ], 11.5);
  const p2 = panel(s, "Tag", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.red, HEX.redTint, "THE TAG ALONE ISN'T ENOUGH", null, [
    "AzureFrontDoor.Backend addresses are shared by every Front Door customer",
    "Add the X-Azure-FDID check",
  ], 11.5);
  const p3 = panel(s, "Fail", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.amber, HEX.amberTint, "PROBES AND FAILOVER", null, [
    "Two origins in different regions; stop one to test",
    "Migrate classic Front Door before March 31, 2027",
  ], 11.5);
  fit("Origin panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 5; Secure traffic to Azure Front Door origins; Front Door Private Link origins; Internet ingress; Migrate Azure Front Door (classic).");
  notes(s,
`Step five finishes the ingress. Front Door is global, at the Microsoft edge with built-in network-layer DDoS protection; Application Gateway is regional, in the agency's own network. Either works with the firewall from step four. What matters is that nothing can reach the origin around the edge, or an attacker skips both the firewall and the DDoS controls. Use Private Link where the origin supports it: Front Door Premium reaches App Service, Blob Storage, internal load balancers and others privately. Where it doesn't, Learn's page, Secure traffic to Azure Front Door origins, says to use the service tag and the Front Door I D header together, because the tag's addresses are shared by every Front Door customer. Set T L S one point two or one point three only. Build health probes and two origins in different regions, then stop one to prove failover. And migrate any classic Front Door before March thirty-first, 2027.`,
  `${G} — Step 5 (Selection, steps 1 to 4, How template); Microsoft Learn — "What is Azure Front Door?," "Secure your origin with Private Link in Azure Front Door Premium," "Secure traffic to Azure Front Door origins," "Internet ingress," "Configure TLS policy versions and cipher suites on Application Gateway using PowerShell," "Migrate Azure Front Door (classic) to Standard or Premium tier."`);
}

// ================================================================== 12 How: Azure Firewall
{
  const s = content(SHOW, "Step 6: egress through Azure Firewall, then deny");
  tag(s, "How");
  const c = code(s, "FW", 0.6, 1.4, FULL, [
    "# Premium policy in alert mode; a default route from each workload subnet to the firewall",
    "az network firewall policy create --name <fw-policy> --resource-group <rg> --sku Premium --threat-intel-mode Alert --idps-mode Alert",
    "az network route-table route create --resource-group <rg> --route-table-name <route-table> --name default-to-firewall `",
    "    --address-prefix 0.0.0.0/0 --next-hop-type VirtualAppliance --next-hop-ip-address <fw-private-ip>",
    "# After two weeks in alert: move to deny through a draft, reviewed, then deployed",
    "az network firewall policy draft create --policy-name <fw-policy> --resource-group <rg>",
    "az network firewall policy draft update --policy-name <fw-policy> --resource-group <rg> --threat-intel-mode Deny --idps-mode Deny",
    "az network firewall policy deploy --name <fw-policy> --resource-group <rg>",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "SKU", 0.6, c + 0.15, W3, null, HEX.navy, HEX.navyTint, "WHICH SKU", null, [
    "Threat intelligence deny: Standard or Premium",
    "IDPS, TLS inspection, full URL filtering: Premium",
  ], 11.5);
  const p2 = panel(s, "Draft", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.red, HEX.redTint, "A DRAFT REPLACES ALL", null, [
    "Deploying replaces the applied policy",
    "Live edits made after the draft are lost",
  ], 11.5);
  const p3 = panel(s, "EW", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.amber, HEX.amberTint, "TLS AND EAST-WEST", null, [
    "TLS inspection needs a trusted CA certificate in Key Vault",
    "Spoke to spoke through the hub firewall",
  ], 11.5);
  fit("FW panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 6; Zero Trust recommendations for Azure Firewall; Azure Firewall Draft + Deployment; Azure Firewall Premium features.");
  notes(s,
`Step six inspects what leaves. Network and Transport owns the agency's edge; inside Azure, Azure Firewall is the inspection point for egress and east-west traffic. Learn's Zero Trust recommendations for Azure Firewall check that outbound traffic routes through it, that threat intelligence and intrusion detection are in alert and deny mode, that outbound T L S is inspected, and that logs are on. Threat intelligence deny needs Standard or Premium; intrusion detection and T L S inspection need Premium. Create a Premium policy in alert mode, add a default route from each workload subnet to the firewall, and log everything. After two weeks of reading the alerts, move to deny through a draft, so every change lands at once and can be reviewed. Learn warns that deploying a draft replaces the whole applied policy, so live edits made after the draft are lost. T L S inspection needs a trusted certificate authority in Key Vault, and spokes talk through the hub.`,
  `${G} — Step 6 (steps 1 to 6, How template); Microsoft Learn — "Zero Trust recommendations for Azure Firewall," "Azure Firewall and traffic inspection," Azure CLI "az network firewall policy," "Integrate NAT gateway with Azure Firewall," "Azure Firewall Draft + Deployment," "Azure Firewall Premium features implementation guide"; Book 09.`);
}

// ================================================================== 13 How: Private Link and DNS
{
  const s = content(SHOW, "Step 7: Private Link works only if DNS does");
  tag(s, "How");
  const c = code(s, "PL", 0.6, 1.4, FULL, [
    "# One central zone per service, in the connectivity subscription, linked to the hub (Key Vault shown)",
    "az network private-dns zone create --resource-group <rg> --name privatelink.vaultcore.azure.net",
    "az network private-dns link vnet create --resource-group <rg> --virtual-network <vnet> `",
    "    --zone-name privatelink.vaultcore.azure.net --name <vnet>-link --registration-enabled false",
    "# The private endpoint and its zone group, which registers and removes the A record with the endpoint",
    "az network private-endpoint dns-zone-group create --resource-group <rg> --endpoint-name <pe-name> --name default `",
    "    --private-dns-zone privatelink.vaultcore.azure.net --zone-name vault",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN (AZURE GOVERNMENT USES ITS OWN ZONE NAMES)", pt: 10.5 });
  const p1 = panel(s, "Scale", 0.6, c + 0.15, W2, null, HEX.teal, HEX.tealTint, "AT SCALE, POLICY DOES IT", null, [
    "Deny privatelink zones and public endpoints in workload subscriptions",
    "deployIfNotExists adds the zone group in the central zone",
  ], 11.5);
  const p2 = panel(s, "Then", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "THEN CLOSE THE PUBLIC PATH", null, [
    "Public access off once the private path works",
    "On premises: conditional forwarders to Azure DNS Private Resolver",
  ], 11.5);
  fit("PL panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Step 7; Integrate Key Vault with Azure Private Link; Private Link and DNS integration at scale; Private Endpoint private DNS zone values.");
  notes(s,
`Step seven gives platform services a private address in the agency's network. A private endpoint does that; D N S decides whether clients use it. Learn's Key Vault Private Link page is clear that name resolution is where private endpoints fail: the zone must exist, be linked to the virtual network and hold the record, and on-premises D N S must forward to Azure. So create each private link zone once, centrally, in the connectivity subscription, and link it to the hub. Create the private endpoint with a zone group, which registers the record and removes it with the endpoint. At scale, the Cloud Adoption Framework's pattern lets policy do it: deny private link zones and public endpoints in workload subscriptions, and deploy the zone group automatically. Then turn public access off, and add conditional forwarders on premises. In Azure Government the zone names differ, so policy needs those names.`,
  `${G} — Step 7 (steps 1 to 6, How template); Microsoft Learn — "Integrate Key Vault with Azure Private Link," "Azure Private Endpoint DNS integration scenarios," "Private Link and DNS integration at scale," "Azure Private Endpoint private DNS zone values"; Book 08.`);
}

// ================================================================== 14 How: Key Vault
{
  const s = content(SHOW, "Step 8: vaults behind RBAC, with purge protection");
  tag(s, "How");
  const c = code(s, "KV", 0.6, 1.4, FULL, [
    "# RBAC and purge protection at creation; then close the vault's firewall",
    "az keyvault create --name <vault> --resource-group <rg> --location <location> --enable-rbac-authorization true --enable-purge-protection true",
    "az keyvault update --name <vault> --resource-group <rg> --default-action deny",
    "# The workload's managed identity gets a data-plane role at the vault, not the subscription",
    "az role assignment create --assignee <managed-identity-principal-id> --role \"Key Vault Secrets User\" --scope <vault-resource-id>",
    "# Rotation by policy file; audit logs to the workspace",
    "az keyvault key rotation-policy update --vault-name <vault> --name <key> --value rotation-policy.json",
    "az monitor diagnostic-settings create --name kv-to-workspace --resource <vault-resource-id> `",
    "    --logs '[{\"category\":\"AuditEvent\",\"enabled\":true}]' --workspace <workspace-id>",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "Learn", 0.6, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "WHAT LEARN RECOMMENDS", null, [
    "One vault per application, region and environment; RBAC, not access policies; PIM for administrators",
    "Private endpoints, autorotation, logging and alerts, tested backups",
  ], 11.5);
  const p2 = panel(s, "Compromise", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.red, HEX.redTint, "A SUSPECTED COMPROMISE", null, [
    "Rotate and migrate dependents first, then disable the old key",
    "Disabling it first takes dependent services offline",
  ], 11.5);
  fit("KV panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Step 8; Secure your Azure Key Vault; Integrate Key Vault with Azure Private Link; Enable Key Vault logging; service account guide, Migration C.");
  notes(s,
`Step eight covers the vault that managed identities read. The identities themselves are in the Service Accounts guide: a workload that moves to Azure gets a user-assigned managed identity, and continuous delivery uses workload identity federation. Learn's page, Secure your Azure Key Vault, recommends one vault per application, region and environment; role-based access, not legacy access policies; pim for administrators; soft delete and purge protection; autorotation; audit logging and alerts; private endpoints; and tested backups. So create each vault on role-based access with purge protection, and close its firewall. Give the workload's identity a data-plane role at the vault, not the subscription. Rotate keys by a policy file, and send audit events to the workspace. If a key is suspected compromised, rotate and migrate its dependents first; disabling it first takes them offline.`,
  `${G} — Step 8 (steps 1 to 6, How template); Microsoft Learn — "Secure your Azure Key Vault," "Integrate Key Vault with Azure Private Link," "Configure cryptographic key autorotation in Azure Key Vault," "Enable Key Vault logging"; Service Accounts guide, Migration C.`);
}

// ================================================================== 15 How: policy and drift
{
  const s = content(SHOW, "Step 9: policy holds it; exemptions expire");
  tag(s, "How");
  const c = code(s, "Pol", 0.6, 1.4, FULL, [
    "# One security initiative at the intermediate root: in audit first, then Default after the compliance review",
    "az policy assignment create --name azs-security --policy-set-definition <initiative-name> --scope <mg-scope> `",
    "    --enforcement-mode DoNotEnforce --mi-system-assigned --location <location>",
    "az policy assignment update --name azs-security --scope <mg-scope> --enforcement-mode Default",
    "# Every exemption has a category and an expiry, and cites its decision record",
    "az policy exemption create --name <exemption-name> --policy-assignment <assignment-id> --exemption-category Waiver `",
    "    --expires-on <expiry> --scope <rg-scope> --description \"<decision record reference>\"",
    "# Monthly evidence",
    "az policy state summarize --management-group <mg-id> -o json > out/policy-summary.json",
  ], { label: "THE GUIDE'S COMMANDS, FROM MICROSOFT LEARN (SCOPES SHORTENED)", pt: 10.5 });
  const p1 = panel(s, "Init", 0.6, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "WHAT THE INITIATIVE HOLDS", null, [
    "DDoS on virtual networks and DDoS logs; WAF enabled and in the specified mode",
    "Private DNS and public-access policies; the Key Vault policies",
  ], 11.5);
  const p2 = panel(s, "Ex", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.amber, HEX.amberTint, "EXEMPTIONS", null, [
    "Mitigated: intent met another way. Waiver: accepted for a time",
    "Expired ones are kept for the record, no longer honored",
  ], 11.5);
  fit("Policy panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Step 9; Azure Policy assignment structure; Azure Policy exemption structure; Azure Policy remediation; Book 13, Ch 02.");
  notes(s,
`Step nine turns steps three to eight into policy, because drift is the threat, as Governance, Drift and Evidence explains. Gather the security definitions into one initiative at the intermediate root: DDoS protection on virtual networks and its logs, the web application firewall enabled and in the specified mode, the private D N S and public-access policies, and the Key Vault policies. Look up each definition's name in the cloud you're in, because built-ins differ by cloud. Assign it in do-not-enforce mode, review compliance with the owners, then switch to default. Run a remediation task for what already exists. Every exemption gets a category and an expiry. Learn's Azure Policy exemption structure says mitigated means the intent is met another way, waiver means non-compliance is accepted for a time, and an expired exemption is kept for the record but no longer honored. Export compliance every month.`,
  `${G} — Step 9 (steps 1 to 5, How template); Microsoft Learn — "Azure Policy assignment structure," "Azure Policy exemption structure," "Azure Web Application Firewall and Azure Policy"; Book 10, Chapter 05; Book 13, Chapter 02.`);
}

// ================================================================== 16 How: operations, metrics, requirements
{
  const s = content(SHOW, "Step 10: owners, cadence, metrics and requirements");
  tag(s, "How");
  const tb = table(s, "Cadence", 1.4, [2.1, 7.1, 2.95], ["Cadence (design)", "Review", "Owner"], [
    ["Weekly", "Exposure register rerun; new public IPs and ownerless rows", "Platform owner"],
    ["Monthly", "Policy compliance export; exemptions due or expired; WAF false positives", "Policy owner, ISSO"],
    ["Quarterly", "DDoS coverage and cost; firewall rules; Key Vault access; WAF rule-set version", "Platform owner, monitor"],
    ["Twice a year; yearly", "Front Door failover and vault restore; DDoS simulation with an approved partner", "Owners; security monitor"],
  ], { fontSize: 11, limit: 3.6 });
  const tb2 = table(s, "Req", tb + 0.15, [4.0, 3.1, 5.05], ["Metric (protected coverage, not settings)", "Steps", "Supports (NIST SP 800-53 Rev. 5)"], [
    ["DDoS coverage, WAF prevention coverage", "3, 4", "SC-5, SC-7, SI-10"],
    ["Origin lock-down, egress inspection", "5, 6", "SC-7, SC-7(5), SC-8"],
    ["Private PaaS, vault posture", "7, 8", "AC-4, SC-12, SC-28, IA-5"],
    ["Policy compliance, exemption hygiene", "1, 9", "CM-2, CM-6, CA-7"],
  ], { fontSize: 11, limit: 6.0 });
  line(s, "KSI", "Each row also names FedRAMP 20x KSIs whose related controls include it; KSIs bind cloud providers, and the agency uses them as a vocabulary.",
    tb2 + 0.1, 0.5, 12.5);
  sources(s, "Sources: Guide, Step 10, \"Metrics,\" \"Federal requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP KSIs; Secure your Azure DDoS Protection deployment.");
  notes(s,
`Step ten puts every owner, cadence and test in one place. The cadence is design guidance: weekly, rerun the exposure register; monthly, the policy compliance export, exemptions due, and false positives; quarterly, DDoS coverage and cost, firewall rules, vault access and the rule-set version; twice a year, a Front Door failover and a vault restore; and yearly, a DDoS simulation with an approved partner. In a DDoS attack, the alert pages the security monitor, and under Network Protection a severity A request goes to Rapid Response. The metrics measure protected coverage, not whether a setting exists. And each step supports controls in NIST special publication eight hundred fifty-three, such as denial-of-service and boundary protection, with the fed-ramp twenty X key security indicators as a vocabulary. The steps support those controls; the assessor decides.`,
  `${G} — Step 10 (Incident response for a DDoS attack, Recurring reviews), "Metrics," "Federal requirements and KSIs"; NIST SP 800-53 Rev. 5; FedRAMP Key Security Indicators; Microsoft Learn — "Secure your Azure DDoS Protection deployment."`);
}

// ================================================================== 17 How: dangers, open questions, next
{
  const s = content(SHOW, "Dangers, open questions and what comes next");
  tag(s, "How");
  const tb = table(s, "Dangers", 1.4, [4.3, 7.85], ["Danger", "The guard"], [
    ["The WAF left in detection mode", "Validate shows Prevention; Step 9's mode policy"],
    ["An origin reachable around the edge", "Private Link, or the service tag plus X-Azure-FDID; the refused-request test"],
    ["A public IP nobody knows about", "The weekly register; the DDoS Modify policy; a new-IP alert"],
    ["A firewall draft deployed over newer changes", "One change path: drafts only, through the change record"],
    ["Commercial features assumed in Azure Government", "The availability table; skipped tests recorded as environment, not failures"],
    ["Disabling a key to contain a compromise", "Rotate and migrate first, then disable"],
  ], { fontSize: 11, limit: 4.6 });
  const p1 = panel(s, "Open", 0.6, tb + 0.15, W2, null, HEX.red, HEX.redTint, "WHAT COULDN'T BE VERIFIED", null, [
    "Front Door and its Private Link by Azure Government region; Front Door WAF in sovereign clouds",
    "DDoS tiers and partners in Azure Government; nothing run in a subscription",
  ], 11.5);
  const p2 = panel(s, "Next", 0.6 + W2 + G2, tb + 0.15, W2, null, HEX.teal, HEX.tealTint, "WHAT COMES NEXT", null, [
    "A draft guide: recheck after the editor's review",
    "Planned: a developer workbook with labs, and a training path",
  ], 11.5);
  fit("Close panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, \"Dangers and how to avoid them,\" \"What couldn't be verified,\" \"The guide's pieces.\"");
  notes(s,
`To close, the dangers. A web application firewall left in detection mode, logging attacks that reach the backend. An origin reachable around the edge, or protected only by a service tag every Front Door customer shares. A public I P nobody knows about. A firewall draft deployed over newer changes. Commercial features assumed in Azure Government. And disabling a key to contain a compromise, which takes its dependents offline. Each has its guard in the steps. The guide is plain about what it couldn't verify: Front Door and its Private Link origins region by region in Azure Government, Front Door's firewall limits in sovereign clouds, and which DDoS tiers and simulation partners serve Azure Government. Nothing was run in a subscription. Remember that the guide is a draft awaiting the editor's review. Its developer workbook with labs and its training path are planned. Thank you.`,
  `${G} — "Dangers and how to avoid them," "What couldn't be verified," "The pieces" (the guide's pieces table).`);
}
endModule(SHOW);

// ================================================================== Backup
backup();
sourceSlide("Sources: the guide and Microsoft Learn", [
  "Azure Security Engineering (companion guide, draft): \"How to read this guide,\" \"Where each topic is covered,\" \"The track at a glance,\" \"Prerequisites,\" \"Government-cloud availability,\" Steps 1 to 10, \"RACI,\" \"Metrics,\" \"Federal requirements and KSIs,\" \"Dangers,\" \"What couldn't be verified.\" Its verification log lists every claim.",
  "Microsoft Learn, read November 11, 2026: Compare Azure Government and global Azure; Azure network security Zero Trust recommendations; Zero Trust recommendations for Application Gateway WAF; Zero Trust recommendations for Azure Firewall; Application Gateway WAF FAQ; Secure your Azure Application Gateway.",
  "Microsoft Learn: Azure DDoS Protection tier comparison; Secure your Azure DDoS Protection deployment; DDoS simulation testing; Secure traffic to Azure Front Door origins; Front Door Private Link origins; Internet ingress; Migrate Azure Front Door (classic).",
  "Microsoft Learn: Azure Firewall Draft + Deployment; Azure Firewall Premium features; Integrate Key Vault with Azure Private Link; Private Link and DNS integration at scale; Private Endpoint private DNS zone values; Secure your Azure Key Vault; Enable Key Vault logging.",
  "Microsoft Learn: Protect your resource hierarchy; Azure Policy assignment structure; Azure Policy exemption structure; Azure Policy remediation; Starter Resource Graph query samples.",
]);
sourceSlide("Sources: other clouds, requirements and the books", [
  "AWS: AWS Shield and AWS WAF; AWS WAF in AWS GovCloud (US). Google Cloud: Google Cloud Armor overview; Private Service Connect; Assured Workloads supported products. Oracle: OCI Web Application Firewall; OCI Network Firewall; OCI private access.",
  "Federal requirements: NIST SP 800-53 Rev. 5 and SP 800-53B (SC-5, SC-7, SC-7(5), SC-8, SC-12, SC-28, SI-4, SI-10, AC-4, IA-5, CM-2, CM-6, CM-8, CA-7, IR-4, CP-4); FIPS 200; FedRAMP KSIs (Consolidated Rules for 2026).",
  "Book 10, Ch 04 (GCC and the feature gap), Ch 05 (the landing zone), Ch 07 (the provisioning loop), Ch 08 (who owns the boundary); Book 12, Ch 08 (cloud-native posture); Book 11, Ch 10 (evidence, not verdicts); Book 13, Ch 02 (drift); Book 08; Book 09.",
  "The service account guide (Migration C, managed identities) and the privileged access guide (PIM for Azure roles). The developer workbook and training path for this guide are planned.",
]);

finish(OUT);
