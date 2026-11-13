// Azure Security Engineering learning path, Module 4: Private Link, DNS and Key Vault — the module's narrated deck.
// Teaches docs/training/azure-security/04-private-link-dns-and-key-vault.md, Learn-style: objectives, the concepts (why
// private endpoints fail at name resolution, central zones and zone groups, policy at scale, public access off, on-premises
// forwarding and the exfiltration path; vaults on RBAC with purge protection, roles at vault scope, rotation by policy,
// audit logs and a compromised key), where agencies are, the lab's exact commands in a test subscription (not run by the
// authors, as the page says; the module has no Lab 1), the federal requirement and evidence, a two-question check, and the
// summary. Every fact comes from the module page and the Azure Security Engineering implementation guide it sends the
// learner to (Steps 7 and 8, Government-cloud availability, The same controls on AWS, Google Cloud and Oracle Cloud,
// Dangers, and their footnotes) or the path's verification log; the deck adds none.
// Helpers: ../training-azs-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-azs-module-4/build.js \
//                      presentations/training-azs-module-4/Training_AZS_Module_4.pptx
const P = require("../training-azs-module-1/shared.js")({
  title: "Module 4: Private Link, DNS and Key Vault",
  footer: "Federal Modernization Workbook  ·  Azure Security Engineering learning path, Module 4: Private Link, DNS and Key Vault",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_AZS_Module_4.pptx";
const M = "Training, Azure Security Engineering, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;
const LAB = "LAB 2  ·  A TEST SUBSCRIPTION, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Private Link, DNS and Key Vault", "Azure Security Engineering · PaaS off the internet, and keys only the right identity can read",
    ["Name resolution  ·  Central zones and zone groups  ·  Policy at scale  ·  Public access off", "Vaults on RBAC  ·  Purge protection and rotation  ·  Lab 2 in a test subscription  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of the Azure Security Engineering learning path: Private Link, D N S and Key Vault. A private endpoint gives a pass resource an address inside the agency's network, and D N S decides whether anyone uses it. The secrets and keys a workload needs belong in a vault that only its managed identity and eligible administrators can use. This module takes pass off the internet, starting with Key Vault, and puts the vault itself behind role-based access, purge protection and an audit log. It covers Steps 7 and 8 of the Azure Security Engineering implementation guide, and takes about fifty minutes, plus a lab in your own test subscription.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a private endpoint nobody resolves isn't private");
  tag(s, "Why");
  const l = panel(s, "DNS", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "WHERE PRIVATE ENDPOINTS FAIL", null, [
    "The zone must exist and be linked to the virtual network",
    "The zone must hold the record",
    "On-premises DNS must forward to Azure",
  ], 13);
  const r = panel(s, "Keys", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHO CAN READ A KEY", null, [
    "Secrets out of code, in a vault",
    "Read by the workload's managed identity, nobody else",
    "Administrators eligible through PIM, not standing",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaKey", HEX.red, "This module: ",
    "central private DNS, public access off, and vaults on RBAC with purge protection, a closed firewall, rotation and an audit log.");
  sources(s, "Sources: Module 4, \"Introduction\"; Guide, Steps 7 and 8; Integrate Key Vault with Azure Private Link; Secure your Azure Key Vault.");
  notes(s,
`Why does this matter? Learn's page, Integrate Key Vault with Azure Private Link, is blunt about where private endpoints fail: name resolution. The private D N S zone has to exist and be linked to the virtual network, it has to hold the record, and on-premises D N S has to forward to Azure. Miss any of the three and clients quietly keep using the public address. And the vault: Learn's page, Secure your Azure Key Vault, recommends role-based access, not legacy access policies; pim for administrators; purge protection; rotation; audit logs; and private endpoints with public access disabled. So this module builds central private D N S, turns public access off, and puts each vault behind role-based access, with purge protection, a closed firewall, rotation and an audit log.`,
  `${M} — "Introduction"; guide, Step 7 (opening), Step 8 (opening); Microsoft Learn — "Integrate Key Vault with Azure Private Link," "Secure your Azure Key Vault."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Name what private-endpoint resolution needs, and where zones live",
    "Explain zone groups, and how policy does them at scale",
    "Prove a vault resolves privately and refuses outsiders",
    "Check RBAC, purge protection, firewall and public access",
    "Read an allowed and a denied read in the audit log",
  ], [
    "Module 3: the hub and its routes",
    "The service account guide, Migration C: managed identities",
    "DNS, DHCP and IPAM: DNS authority",
  ], 50);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll name the three things private-endpoint name resolution needs, and say where the zones live. You'll explain what a private D N S zone group does, and how policy does it at scale. You'll prove a vault resolves to a private address inside the network and refuses requests from outside. You'll check a vault's role-based access, purge protection, firewall and public access in one command. And you'll read the audit log for an allowed and a denied secret read, and say why disabling a suspected key comes last. You need Module 3; Migration C of the service account guide, Service Accounts, from User Accounts to gMSAs to Microsoft Entra Workload Identities, for the managed identities; and a skim of D N S, D H C P and I P A M, which owns the agency's D N S authority.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Zones
{
  const s = content(SC, "Unit 1: zones once, centrally, and a zone group");
  tag(s, "How");
  const c = code(s, "PL", 0.6, 1.45, 12.15, [
    "# Create each privatelink zone once, in the connectivity subscription, and link it to the hub (Key Vault shown)",
    "az network private-dns zone create --resource-group <rg> --name privatelink.vaultcore.azure.net",
    "az network private-dns link vnet create --resource-group <rg> --virtual-network <vnet> `",
    "    --zone-name privatelink.vaultcore.azure.net --name <vnet>-link --registration-enabled false",
    "# The private endpoint, and its zone group, which registers the A record with it and removes it with it",
    "az network private-endpoint create ... --name <pe-name> --private-connection-resource-id <vault-resource-id> --group-ids vault ...",
    "az network private-endpoint dns-zone-group create --resource-group <rg> --endpoint-name <pe-name> --name default `",
    "    --private-dns-zone privatelink.vaultcore.azure.net --zone-name vault",
  ], { label: "THE GUIDE'S STEP 7 COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "Off", 0.6, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "PUBLIC ACCESS OFF", null, [
    "Once the private path works",
    "Key Vault: the firewall's default action is deny",
  ], 12);
  const p2 = panel(s, "Onprem", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.teal, HEX.tealTint, "ON PREMISES", null, [
    "Conditional forwarders for vault.azure.net and vaultcore.azure.net",
    "To Azure DNS Private Resolver",
  ], 12);
  const p3 = panel(s, "Exfil", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.amber, HEX.amberTint, "THE EXFILTRATION PATH", null, [
    "Traffic to an endpoint can bypass the firewall",
    "Where inspection is required: a /32 route through it",
  ], 12);
  if (Math.max(p1, p2, p3) > 6.61) console.warn("  ! zone panels may overflow");
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 7 (steps 1, 2, 4 to 6); Integrate Key Vault with Azure Private Link; Private Endpoint DNS integration; private endpoint troubleshooting.");
  notes(s,
`Unit 1 is the guide's Step 7. Create each private link zone once, centrally, in the connectivity subscription, and link it to the hub. The example is Key Vault's zone, from Learn's Private Link integration page. Then create the private endpoint, with a private D N S zone group. Learn's D N S integration page says the zone group registers the A record with the endpoint and removes it when the endpoint goes, so nobody edits records by hand. Once the private path works, turn public access off; for Key Vault, the firewall's default action becomes deny. On premises, add conditional forwarders for the vault's public zones to Azure D N S Private Resolver. And one exfiltration note: a private endpoint reaches only its own resource, but traffic to it can bypass the firewall. Where inspection is required, Learn's troubleshooting page shows a slash thirty-two route for the endpoint's address through the firewall.`,
  `${M} — Unit 1; guide, Step 7 (steps 1, 2, 4, 5, 6); Microsoft Learn — "Integrate Key Vault with Azure Private Link," "Azure Private Endpoint DNS integration scenarios," "Troubleshoot private endpoint connectivity failure."`);
}

// ================================================================== 5 At scale
{
  const s = content(SC, "At scale, let policy place the records");
  tag(s, "What");
  const p1 = panel(s, "Deny1", 0.6, 1.45, W3, null, HEX.red, HEX.redTint, "DENY", null, [
    "privatelink zones in workload subscriptions",
    "PaaS with public endpoints",
  ], 13);
  const p2 = panel(s, "DINE", 0.6 + W3 + G3, 1.45, W3, null, HEX.navy, HEX.navyTint, "DEPLOY IF NOT EXISTS", null, [
    "Adds the zone group in the central zone",
    "The landing zones initiative: Configure Azure PaaS services to use private DNS zones",
  ], 13);
  const p3 = panel(s, "Role", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.teal, HEX.tealTint, "THE POLICY'S IDENTITY", null, [
    "Needs Private DNS Zone Contributor on the zones",
  ], 13);
  callout(s, "Danger", Math.max(p1, p2, p3) + 0.3, 1.0, "FaTriangleExclamation", HEX.red, "The danger it prevents: ",
    "zones in workload subscriptions split records across zones, and resolution fails or goes public.");
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 7 (step 3, How template), \"Dangers\"; Cloud Adoption Framework, Private Link and DNS integration at scale.");
  notes(s,
`At scale, let policy do it. The Cloud Adoption Framework's pattern, Private Link and D N S integration at scale, has three parts. Deny private link zones in workload subscriptions. Deny pass with public endpoints. And a deploy-if-not-exists policy that adds the zone group in the central zone. The Azure landing zones initiative, Configure Azure pass services to use private D N S zones, carries the built-in definitions, and the policy's managed identity needs Private D N S Zone Contributor on the zones. This prevents a danger the guide lists: zones in workload subscriptions split records across zones, and resolution fails or quietly goes public. The rollout follows the usual pattern: the deny policies in audit first, with Module 1's public pass list reviewed, then public access off per resource, then the deny policies.`,
  `${M} — Unit 1; guide, Step 7 (step 3; How template: audit phase, enforcement), "Dangers"; Microsoft Learn, Cloud Adoption Framework — "Private Link and DNS integration at scale."`);
}

// ================================================================== 6 Key Vault
{
  const s = content(SC, "Unit 2: vaults on RBAC, with purge protection");
  tag(s, "How");
  const c = code(s, "KV", 0.6, 1.45, 12.15, [
    "# An RBAC vault with purge protection; close its firewall",
    "az keyvault create --name <vault> --resource-group <rg> --location <location> --enable-rbac-authorization true --enable-purge-protection true",
    "az keyvault update --name <vault> --resource-group <rg> --default-action deny",
    "# The workload's managed identity gets a data-plane role at the vault, not the subscription",
    "az role assignment create --assignee <managed-identity-principal-id> --role \"Key Vault Secrets User\" --scope <vault-resource-id>",
    "# Rotation by policy, and AuditEvent logs to the workspace (shortened)",
    "az keyvault key rotation-policy update --vault-name <vault> --name <key> --value rotation-policy.json",
    "az monitor diagnostic-settings create --name kv-to-workspace --resource <vault-resource-id> ... AuditEvent ...",
  ], { label: "THE GUIDE'S STEP 8 COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "Purge", 0.6, c + 0.2, W3, null, HEX.red, HEX.redTint, "PURGE PROTECTION", null, [
    "Can't be turned off once on: that's the point",
    "Never an exclusion",
  ], 12);
  const p2 = panel(s, "Admins", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "ADMINISTRATORS", null, [
    "Key Vault Administrator, eligible through PIM",
    "One vault per app, region, environment",
  ], 12);
  const p3 = panel(s, "Rot", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.teal, HEX.tealTint, "ROTATION", null, [
    "The guide's periods are an example",
    "The key management policy sets them",
  ], 12);
  if (Math.max(p1, p2, p3) > 6.61) console.warn("  ! KV panels may overflow");
  sources(s, "Sources: Module 4, Unit 2; Guide, Step 8; Secure your Azure Key Vault; Integrate Key Vault with Azure Private Link; key autorotation; Enable Key Vault logging.");
  notes(s,
`Unit 2 is the guide's Step 8. Managed identities themselves are covered in the service account guide; this step covers the vault they read. Create vaults on role-based access with purge protection, and close the firewall, with the commands from Learn's Private Link integration page. Purge protection can't be turned off once it's on; that's the point, and the guide never excludes a vault from it. Grant the workload's managed identity a data-plane role, such as Key Vault Secrets User, at the vault's scope, not the subscription's. Administrators get Key Vault Administrator as an eligible pim assignment. Rotate keys by policy, with Learn's autorotation command; the periods in the guide's policy file are an example, and the agency's key management policy sets them. And send the audit event log to the workspace, as Learn's page, Enable Key Vault logging, shows. Learn also recommends one vault per application, region and environment.`,
  `${M} — Unit 2; guide, Step 8 (steps 1 to 5); Microsoft Learn — "Secure your Azure Key Vault," "Integrate Key Vault with Azure Private Link," "Configure cryptographic key autorotation in Azure Key Vault," "Enable Key Vault logging."`);
}

// ================================================================== 7 Recovery and gov
{
  const s = content(SC, "A compromised key, recovery, and the other clouds");
  tag(s, "Who");
  const p1 = panel(s, "Comp", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "A SUSPECTED COMPROMISE", null, [
    "Rotate and migrate dependents first",
    "Then disable the old key: disabling it first takes dependent services offline",
    "Back up keys that can't be recreated, and test a restore",
  ], 12.5);
  const tb = table(s, "Gov", 1.45, [2.2, 3.75], ["", "Azure Government (side note)"], [
    ["Zone names", "privatelink.vaultcore.usgovcloudapi.net"],
    ["Key Vault", "vault.usgovcloudapi.net"],
    ["Policy", "Needs the government zone names"],
  ], { fontSize: 12, limit: 4.5, x: 0.6 + W2 + G2 });
  line(s, "Other", "Other clouds: Google Cloud's Private Service Connect; OCI private endpoints, a private IP in a VCN subnet for an Oracle service. AWS PrivateLink isn't compared.", Math.max(p1, tb) + 0.3, 0.9, 13.5);
  sources(s, "Sources: Module 4, Units 2 and 3; Guide, Step 8 (step 6), \"Government-cloud availability,\" \"The same controls ... Oracle Cloud\"; Secure your Azure Key Vault.");
  notes(s,
`Two more things. First, a suspected compromise. Learn's page, Secure your Azure Key Vault, says to rotate and migrate dependents before disabling the old key, because disabling it first takes dependent databases and storage offline. The guide lists that as a danger. Back up the keys that can't be recreated, and test a restore. Second, where agencies are. In commercial Azure, which a G C C tenant uses, the zone names are the ones in the commands, such as private link dot vault core dot azure dot net. As a side note for Azure Government, Learn's private endpoint D N S page gives different zone names, such as private link dot vault core dot U S gov cloud A P I dot net, so any policy that registers records needs the government names, and Key Vault's own endpoint differs too. On other clouds, the guide names Google Cloud's Private Service Connect, and O C I private endpoints, a private I P in a V C N subnet for an Oracle service.`,
  `${M} — Units 2 and 3; guide, Step 8 (step 6), "Dangers," "Government-cloud availability" (Private Link, Key Vault rows), "The same controls on AWS, Google Cloud and Oracle Cloud"; Microsoft Learn — "Secure your Azure Key Vault," "Azure Private Endpoint private DNS zone values," "Compare Azure Government and global Azure"; Google Cloud and Oracle documentation.`);
}
endModule(SC);

// ================================================================== 8 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 6: resolution and the vault's posture");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: on the test VM, inside the linked network",
    "nslookup <vault>.vault.azure.net",
    "# Step 2: on your own machine, outside the network",
    "nslookup <vault>.vault.azure.net",
    "az keyvault secret show --vault-name <vault> --name <secret-name> --query name",
    "# Step 3: the endpoint's zone group      # Step 4: Module 1's public PaaS query, again (shortened)",
    "az network private-endpoint dns-zone-group list --endpoint-name <pe-name> --resource-group <rg> -o table",
    "az graph query -q \"Resources | where ... tostring(properties.publicNetworkAccess) !~ 'Disabled' | project ...\" ... -o table",
    "# Step 5: the vault's posture",
    "az keyvault show --name <vault> --query \"{rbac:properties.enableRbacAuthorization, purge:properties.enablePurgeProtection, `",
    "    net:properties.networkAcls.defaultAction, pna:properties.publicNetworkAccess}\"",
    "# Step 6: the key's rotation policy",
    "az keyvault key rotation-policy show --vault-name <vault> --name <key>",
  ], { label: LAB, pt: 10 });
  line(s, "Expect", "Expected (the guide's Validate): a private address inside; the public frontend outside, which refuses; true, true, Deny, Disabled.", c + 0.15, 0.55, 13);
  sources(s, "Sources: Module 4, \"Exercise: Lab 2,\" steps 1 to 6; Guide, Steps 7 and 8 (Validate).");
  notes(s,
`The lab runs the guide's Step 7 and Step 8 checks in a test subscription where someone has applied them to a test vault, with a private endpoint, public access off, a test secret and a key with a rotation policy. The authors haven't run it, and nothing in Azure changes. Step one runs on a Windows test V M inside a linked network: look up the vault's name. The guide's Validate step says it returns a private address, through the private link zone. Step two runs on your own machine, outside: the lookup returns the public frontend, and the secret request is refused. Step three lists the endpoint's zone group. Step four reruns Module 1's public pass query; the vault shouldn't appear. Step five checks the vault's posture with the guide's own query: expect true, true, Deny, and, with public access off, Disabled. Step six exports the key's rotation policy, which is evidence.`,
  `${M} — "Exercise: Lab 2, a test subscription," "You need," steps 1 to 6; guide, Steps 7 and 8 (Validate).`);
}

// ================================================================== 9 Lab part 2
{
  const s = content(SL, "Lab 2, steps 7 to 10: an allowed and a denied read");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 7: on the test VM, as its managed identity (it holds Key Vault Secrets User)",
    "az login --identity",
    "az keyvault secret show --vault-name <vault> --name <secret-name> --query name",
    "az logout",
    "# Step 8: on the test VM, as yourself (no data-plane role on the vault)",
    "az login",
    "az keyvault secret show --vault-name <vault> --name <secret-name> --query name",
    "az logout",
    "# Step 9: back on your machine, both reads in the audit log (Key Vault writes to AzureDiagnostics)",
    "az monitor log-analytics query --workspace <workspace-guid> --analytics-query \"AzureDiagnostics | where ResourceProvider == `",
    "    'MICROSOFT.KEYVAULT' and TimeGenerated > ago(1h) | project TimeGenerated, OperationName, ResultSignature, CallerIPAddress\" -o table",
  ], { label: LAB, pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expected (the guide's Validate): ",
    "the identity's read succeeds and yours is refused as forbidden: the network allows it, RBAC doesn't. Both rows in the log. Step 10: nothing to undo.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2,\" steps 7 to 10; Guide, Step 8 (Validate); Monitor Azure Key Vault; az monitor log-analytics.");
  notes(s,
`Steps seven and eight read the same secret twice, on the test V M, so the network allows both. First as the V M's managed identity, which has the Key Vault Secrets User role on the vault: the secret's name comes back. Then as yourself, with no data-plane role on the vault: the request is refused as forbidden. The network allowed it; role-based access didn't. That's the pair the guide's Validate step asks for. Step nine, back on your machine, finds both reads in the audit log. The guide's diagnostic setting writes to the workspace's Azure Diagnostics table, and Learn's page, Monitor Azure Key Vault, filters it by resource provider. Its result signature column holds the H T T P status, such as O K or Forbidden. Expect a row for each read. Step ten: both az logout commands signed you out of the test V M, and nothing in Azure changed, so there's nothing to undo.`,
  `${M} — "Exercise: Lab 2," steps 7 to 10; guide, Step 8 (Validate); Microsoft Learn — "Monitor Azure Key Vault," Azure CLI "az monitor log-analytics" (read November 13, 2026, per the path's verification log).`);
}
endModule(SL);

// ================================================================== 10 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["Step 7: SC-7 boundary protection, AC-4 information flow enforcement", "KSI-CNA-ULN (cites AC-4(21), SC-7)", "Zones, endpoints, the public-access state"],
    ["Step 8: SC-12 key establishment and management, SC-28 protection at rest, IA-5 authenticator management", "KSI-SVC-ASM (cites SC-12, IA-5(2)), KSI-IAM-SNU", "Vault posture, rotation policies, AuditEvent"],
  ], { fontSize: 12, limit: 4.8 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The steps support the controls; ",
    "the organization sets their parameters, and the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers.");
  sources(s, "Sources: Module 4, \"The federal requirement,\" \"Summary\"; Guide, \"Federal requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five, as the guide's requirements table maps it. Step 7 supports S C seven, boundary protection, and A C four, information flow enforcement; its evidence is the zones, the endpoints, and the public-access state of each resource. Step 8 supports S C twelve, cryptographic key establishment and management, S C twenty-eight, protection of information at rest, and I A five, authenticator management; its evidence is the vault posture, the rotation policies, and the audit event log. Each row lines up with the fed-ramp twenty X key security indicators the guide names. The steps support these controls; the organization still sets their parameters, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; "Summary"; guide, "Federal requirements and KSIs" (rows 7 and 8).`);
}

// ================================================================== 11 Check
{
  const s = check(SS, "Check yourself: two questions on Module 4", [
    { q: "A private endpoint exists, but clients still reach the vault's public address. Where do you look first?", options: ["a. The vault's RBAC roles", "b. Name resolution: the zone, its link, the record, and on-premises forwarding", "c. The firewall's IDPS mode"] },
    { q: "A key is suspected compromised. What comes first?", options: ["a. Disable the key immediately", "b. Rotate and migrate dependents, then disable the old key", "c. Delete the vault"] },
  ], "1 b: resolution is where private endpoints fail. 2 b: disabling first takes dependents offline.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 1 and 4; Units 1 and 2; Guide, Steps 7 and 8, \"Dangers.\"");
  notes(s,
`Check yourself with two questions. First: a private endpoint exists, but clients still reach the vault's public address. Where do you look first? The answer is b, name resolution: the zone, its link to the virtual network, the record, and on-premises forwarding. Second: a key is suspected compromised. What comes first? The answer is b: rotate and migrate dependents, then disable the old key, because disabling it first takes dependent services offline. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 4, and "Check your answers."`);
}

// ================================================================== 12 Summary
{
  const s = content(SS, "Summary: private by name, readable by one identity");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Built central private DNS, with zone groups by policy",
    "Proved the vault resolves privately and refuses outsiders",
    "Checked RBAC, purge protection, firewall and rotation",
    "Found an allowed and a denied read in the audit log",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5", [
    "Policy, drift and evidence: hold it all with policy, and hand the assessor the evidence",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "zones, links, endpoints and zone groups; policy compliance; the nslookup results; vault properties, roles and rotation policies; AuditEvent rows; the restore test.");
  sources(s, "Sources: Module 4, \"Summary\"; learning path index; Module 5.");
  notes(s,
`To sum up. You built central private D N S, with zone groups placed by policy. You proved the vault resolves to a private address inside the network and refuses requests from outside. You checked its role-based access, purge protection, firewall and rotation policy. And you found an allowed and a denied read in its audit log. The evidence an I S S O keeps from this module: the zones, links, endpoints and zone groups; policy compliance for the private D N S and public-access policies; the two lookup results and the refused public request; the vault properties, role assignments at vault scope and rotation policies; the audit event rows; and the restore test when it runs. Next is Module 5: policy, drift and evidence, holding all of it in place and handing the assessor what they need.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/azure-security/04-private-link-dns-and-key-vault.md (Azure Security Engineering learning path, Module 4), a draft; the path's verification log is docs/training/azure-security/_verification/learning-path.md.",
  "Azure Security Engineering (implementation guide): Steps 7 and 8; Government-cloud availability; The same controls on AWS, Google Cloud and Oracle Cloud; Dangers. Its footnotes carry each source, read November 11, 2026: Microsoft Learn, Integrate Key Vault with Azure Private Link; Private Endpoint DNS integration; Private Endpoint private DNS zone values; private endpoint troubleshooting; Cloud Adoption Framework, Private Link and DNS integration at scale; Secure your Azure Key Vault; key autorotation; Enable Key Vault logging; Compare Azure Government and global Azure; Google Cloud, Private Service Connect; OCI private access.",
  "Read for the lab, November 13, 2026: Microsoft Learn, Monitor Azure Key Vault; Azure CLI, az monitor log-analytics.",
  "Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities, Migration C. NIST SP 800-53 Rev. 5 (SC-7, AC-4, SC-12, SC-28, IA-5); FedRAMP 20x KSIs, as the guide's requirements table maps them.",
  "The lab's commands are the page's, with its placeholders; the module has no Lab 1, and the lab wasn't run by the authors.",
]);

finish(OUT);
