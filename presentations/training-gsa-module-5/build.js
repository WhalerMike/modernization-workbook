// Global Secure Access learning path, Module 5: Internet Access and TLS inspection — the module's narrated deck.
// Teaches docs/training/global-secure-access/05-internet-access-and-tls-inspection.md, Learn-style: objectives, the concepts
// (security profiles and their limits, QUIC and bypass governance, TLS inspection from a dedicated CA, the privacy scope,
// pinned applications and the failure line), Lab 2's exact commands in a test tenant (not run by the authors, as the page
// says; the path has no Lab 1), the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page and the Global Secure Access implementation guide it sends the learner to (Steps 5 and 9 and
// their footnotes); the deck adds none.
// Helpers: ../training-gsa-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-gsa-module-5/build.js \
//                      presentations/training-gsa-module-5/Training_GSA_Module_5.pptx
const P = require("../training-gsa-module-1/shared.js")({
  title: "Module 5: Internet Access and TLS inspection",
  footer: "Federal Modernization Workbook  ·  Global Secure Access learning path, Module 5: Internet Access and TLS inspection",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_GSA_Module_5.pptx";
const M = "Training, Global Secure Access, Module 5";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: Internet Access and TLS inspection", "Global Secure Access as the Identity-Aware Network · Steps 5 and 9",
    ["Security profiles  ·  QUIC and bypasses  ·  Where agencies are", "TLS inspection, last  ·  The privacy scope  ·  Lab 2 in a test tenant"]);
  notes(s,
`Welcome to Module 5 of Global Secure Access as the Identity-Aware Network: Internet Access and T L S inspection. Internet Access is the identity-aware web gateway for remote users. T L S inspection comes last of all, because it's the step most likely to break applications and to read content the agency shouldn't. This module covers Steps 5 and 9 of the Global Secure Access implementation guide, and takes about fifty minutes, plus a lab in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: an identity-aware web gateway, inspection last");
  tag(s, "Why");
  const l = panel(s, "IA", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "INTERNET ACCESS", null, [
    "Conditional Access decides which security profile a user gets",
    "The profile decides what the user can reach",
    "Separately licensed; an agency may keep its current gateway",
  ], 13);
  const r = panel(s, "TLS", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "TLS INSPECTION, LAST", null, [
    "Most likely to break applications",
    "Most likely to read what the agency shouldn't",
    "Only after filtering works on server names alone",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaLock", HEX.navy, "This module: ",
    "build a pilot security profile, govern every bypass, then add inspection from a dedicated CA within a scope the privacy officer approved.");
  sources(s, "Sources: Module 5, \"Introduction\"; Guide, Steps 5 and 9; Network and Transport, Chapter 05 (Internet Access policy).");
  notes(s,
`Why does this matter? With Internet Access, Conditional Access decides which security profile a user gets, and the profile decides what the user can reach. It comes late in the run order because it's separately licensed, and because an agency may keep its current gateway; that's a decision from Module 1. T L S inspection comes last of all. It's the step most likely to break applications, and the step most likely to read content the agency shouldn't, so it starts only after filtering works on server names alone. In this module you build a pilot security profile, govern every bypass, and then add inspection from a dedicated certificate authority, within a scope the privacy officer approved.`,
  `${M} — "Introduction"; guide, Step 5 (Authority), Step 9 (opening).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Build a filtering policy, a security profile, the link, and its policy",
    "Explain why both profiles are enabled, and what Learn's limits leave out",
    "Govern every bypass with an owner, a reason and an expiry",
    "Choose the CA for TLS inspection, and deploy trust before activation",
    "Set the privacy scope, handle pinned apps, and read the 1% line",
  ], [
    "Module 2",
    "Network and Transport, Chapter 05: Internet Access policy",
    "PKI and Certificates, Chapter 04: skim it",
  ], 50);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll build a filtering policy, a security profile, the link between them, and the Conditional Access policy that assigns it. You'll explain why both the Microsoft and internet profiles are enabled, and what Learn's limits leave out. You'll govern every bypass and allow-list entry with an owner, a reason and an expiry. You'll choose the certificate authority for T L S inspection, and deploy trust before activation. And you'll set the privacy boundary, handle pinned applications, and read the T L S outcomes against the one percent line. You need Module 2, Network and Transport, chapter five, on Internet Access policy, and a skim of PKI and Certificates, chapter four, for the dedicated issuing C A. The lab runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Security profiles
{
  const s = content(SC, "Unit 1: security profiles, from Learn's Graph tutorial");
  tag(s, "How");
  const tb = table(s, "SP", 1.45, [3.0, 9.15], ["Piece", "What it does"], [
    ["Filtering policy", "Blocks the categories the acceptable-use policy names; ArtificialIntelligence is Learn's example"],
    ["Security profile", "Groups filtering, threat intelligence, TLS inspection and file policies"],
    ["Policy link", "Puts the filtering policy in the profile, with logging on"],
    ["Conditional Access", "Assigns the profile: All internet resources with Global Secure Access, for the pilot, emergency access excluded"],
    ["Baseline profile", "Applies to all traffic, last; threat intelligence goes here, to cover everyone"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Both", tb + 0.25, 1.15, "FaRightLeft", HEX.teal, "Enable both profiles: ",
    "the internet profile doesn't include the Microsoft traffic profile's destinations, so full coverage needs both.");
  sources(s, "Sources: Module 5, Unit 1; Guide, Step 5.1 to 5.5; Internet Access using Microsoft Graph APIs; Global Secure Access traffic forwarding profiles.");
  notes(s,
`Unit 1 is security profiles, built with Learn's Graph tutorial. A filtering policy blocks the categories the agency's acceptable-use policy names; artificial intelligence is Learn's example, and the category list is the agency's. A security profile groups web content filtering, threat intelligence, T L S inspection and file policies. A policy link puts the filtering policy into the profile, with logging on. A Conditional Access policy assigns the profile: it targets All internet resources with Global Secure Access, with the filtering profile session control, scoped to the pilot, and with emergency access excluded. The baseline profile applies to all traffic, last; the guide puts threat intelligence filtering there, so it covers everyone in the internet profile. And enable both profiles: the internet profile doesn't include the Microsoft traffic profile's destinations, so full coverage needs both.`,
  `${M} — Unit 1 "Security profiles and their limits"; guide, Step 5.1 to 5.5; Microsoft Learn — "Configure Microsoft Entra Internet Access using Microsoft Graph APIs," "Global Secure Access traffic forwarding profiles."`);
}

// ================================================================== 5 Limits, QUIC, bypasses
{
  const s = content(SC, "Unit 2: Learn's limits, QUIC, and every bypass");
  tag(s, "What");
  const p1 = panel(s, "Limits", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "LEARN'S LIMITS", null, [
    "256 profiles, 1,000 policies, 1,000 rules, 8,000 destinations",
    "HTTP and HTTPS on 80 and 443 only",
    "No IPv6, no UDP",
  ], 12.5);
  const p2 = panel(s, "QUIC", 0.6 + W3 + G3, 1.45, W3, null, HEX.amber, HEX.amberTint, "QUIC", null, [
    "Not forwarded end to end",
    "Cloud firewall block: preview",
    "The guide: a Windows Firewall rule on UDP 443, by Intune, piloted",
  ], 12.5);
  const p3 = panel(s, "Bypass", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.red, HEX.redTint, "EVERY BYPASS", null, [
    "An owner's approval, a reason, an expiry",
    "In the exception register",
    "Not on remote networks: set on the branch equipment",
  ], 12.5);
  callout(s, "RO", Math.max(p1, p2, p3) + 0.3, 1.25, "FaTriangleExclamation", HEX.amber, "Not yet specified: ",
    "whether a report-only policy applies a security profile. So the pilot is a group-scoped policy, On for the pilot only, with an Allow-and-log policy for categories under review.");
  sources(s, "Sources: Module 5, Units 1 and 2; Guide, Step 5.5 to 5.7; Known limitations for Global Secure Access; Configure TLS inspection policies; Common operations for Global Secure Access.");
  notes(s,
`Unit 2. First, Learn's limits: two hundred fifty-six security profiles, a thousand policies, a thousand rules and eight thousand destinations per tenant; H T T P and H T T P S on ports eighty and four forty-three only; no I P version six, and no U D P. Second, QUIC. Internet Access doesn't forward QUIC end to end. Learn's newer guidance blocks it with the cloud firewall, which is preview; its T L S inspection page blocks outbound U D P four forty-three with Windows Firewall. Until the cloud firewall for clients is generally available, the guide uses the generally available path: a firewall rule delivered by Intune, piloted first. Third, every custom bypass and allow-list entry gets an owner's approval, a reason, and an expiry, in the exception register, as Learn's change guidance asks. Custom bypass doesn't work on remote networks; those are made on the branch equipment. And one gap: the pages read don't say whether a report-only policy applies a security profile. So the pilot is a policy set to on for the pilot group only, with an allow policy, with logging, for categories under review.`,
  `${M} — Units 1 and 2; guide, Step 5.5, 5.6, 5.7, How-section (Report-only); Microsoft Learn — "Known limitations," "Configure Transport Layer Security inspection policies," "Common operations for Global Secure Access."`);
}

// ================================================================== 6 TLS CA
{
  const s = content(SC, "Unit 3: TLS inspection, from a dedicated CA");
  tag(s, "How");
  const tb = table(s, "CA", 1.45, [3.0, 9.15], ["", "What Learn and the guide say"], [
    ["What it does", "Decrypts at the edge for full URLs, files and content, then re-encrypts; needed for URL, file, content and prompt policies"],
    ["The certificate", "Microsoft-managed, or the agency's own: it signs an intermediate, the service issues short-lived leaves"],
    ["Its limits", "Valid at least six months; one active at a time; Server Auth, CA:TRUE, pathlen 1, keyCertSign and cRLSign"],
    ["Which CA", "Learn: a dedicated CA, not your production PKI. The program: a dedicated issuing CA under the agency's root"],
    ["Trust first", "Root and intermediate to clients by Intune before activation; an expired certificate stops all inspection"],
  ], { fontSize: 11.5, limit: 5.0 });
  callout(s, "Why", tb + 0.25, 1.2, "FaKey", HEX.red, "Never the authentication CA: ",
    "a compromised inspection CA can impersonate any site to every managed device. Renew at least 90 days before expiry.");
  sources(s, "Sources: Module 5, Unit 3; Guide, Step 9.1 to 9.3; What is TLS inspection?; TLS inspection with your own certificate; Tutorial: Enable TLS inspection.");
  notes(s,
`Unit 3 is T L S inspection. It decrypts H T T P S at the service edge, so full U R L's, files and content can be filtered, then re-encrypts; it's the prerequisite for U R L rules, file and content policies, and A I prompt inspection. Learn offers a Microsoft-managed certificate, or the agency's own. With the agency's own, the agency signs an intermediate C A, and the service issues short-lived leaf certificates from it. Learn's limits: valid at least six months, only one active at a time, with server authentication and the C A extensions Learn lists. Which C A? Learn's tutorial suggests a dedicated C A, not your production P K I. The program issues it from a dedicated issuing C A under the agency's root, never from the C A that issues authentication certificates, because a compromised inspection C A can impersonate any site to every managed device. Deploy trust before activation: the root and intermediate go to clients by Intune first, because an expired inspection certificate disables all T L S inspection across the tenant. Renew at least ninety days ahead.`,
  `${M} — Unit 3 "TLS inspection, last"; guide, Step 9.1, 9.2, 9.3, How-section (Day-two); Microsoft Learn — "What is Transport Layer Security inspection?," "Configure TLS inspection with your own certificate," "Tutorial: Enable TLS inspection," "Operate Microsoft Entra Internet Access."`);
}

// ================================================================== 7 Privacy, pinned, failure line
{
  const s = content(SC, "Privacy, pinned applications and the 1% line");
  tag(s, "Who");
  const p1 = panel(s, "Priv", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "THE PRIVACY SCOPE", null, [
    "Learn's system bypass, and recommended bypass for Education, Finance, Government, Health & Medicine",
    "Plus what the privacy officer names",
    "Users told before inspection starts",
  ], 12);
  const p2 = panel(s, "Pinned", 0.6 + W3 + G3, 1.45, W3, null, HEX.amber, HEX.amberTint, "PINNED APPS", null, [
    "Fail under inspection",
    "A custom bypass, without duplicating the system list",
    "Dev tools with their own stores need the root",
  ], 12);
  const p3 = panel(s, "Fail", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.red, HEX.redTint, "THE FAILURE LINE", null, [
    "Microsoft: above 1% is a systemic problem",
    "No HTTP/2; no AIA or OCSP fetching",
    "Group TlsStatus by the values the workspace holds",
  ], 12);
  callout(s, "Where", Math.max(p1, p2, p3) + 0.3, 1.25, "FaRoute", HEX.teal, "Where agencies are: ",
    "Internet Access or Suite license; available in GCC by Learn's product-wide sentence. The cloud firewall and Explicit Forward Proxy are preview: GCC not yet specified.");
  sources(s, "Sources: Module 5, Unit 3; Guide, Step 9.4 to 9.6, Validate, availability table; Configure TLS inspection policies; FAQ for TLS inspection; Zero Trust: Protect networks.");
  notes(s,
`Three more things before you inspect. The privacy scope: Learn auto-creates a system bypass rule for incompatible destinations, and an editable recommended bypass for the Education, Finance, Government, and Health and Medicine categories. The guide keeps them, adds the categories the privacy officer names, and records the scope in the system's privacy documentation. Learn says to establish and communicate a T L S policy to users before inspection starts. Pinned applications fail under inspection; Learn's answer is a custom bypass for their destinations, without duplicating the system list, and developer tools with their own certificate stores need the root added. And the failure line: Microsoft's recommendation treats a failure rate above one percent as a systemic problem. Inspection doesn't negotiate H T T P two, and doesn't follow A I A or O C S P links. Learn's pages give the T L S status values differently in two places, so group by what your workspace actually holds before writing an alert. Where are agencies? Internet Access and T L S inspection need an Internet Access or Suite license, and are available in G C C by Learn's product-wide statement. The cloud firewall for clients and the Explicit Forward Proxy are preview, and their G C C availability isn't yet specified.`,
  `${M} — Unit 3; guide, Step 9.4, 9.5, 9.6, Validate (1% line; TlsStatus values), "Government cloud and licensing"; Microsoft Learn — "Configure TLS inspection policies," "FAQ for TLS inspection," "Configure Microsoft Entra for Zero Trust: Protect networks."`);
}
endModule(SC);

// ================================================================== 8 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 5: a pilot security profile");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: find and enable the internet profile; assign the pilot group in the admin center",
    "$p = Invoke-MgGraphRequest -Method GET -Uri \".../beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'internet'\"",
    "# Step 2: NET-WCF-Block-HighRisk, a webCategory rule on ArtificialIntelligence, action block",
    "Invoke-MgGraphRequest -Method POST -Uri \"https://graph.microsoft.com/beta/networkaccess/filteringPolicies\" -Body $policy ...",
    "# Step 3: the security profile SP-Pilot, and the link to the policy, logging enabled",
    "Invoke-MgGraphRequest -Method POST -Uri \".../beta/networkaccess/filteringProfiles/<security-profile-id>/policies\" ...",
    "# Step 4: NET-IA-SecurityProfile-Pilot: All internet resources with Global Secure Access, pilot only,",
    "#         emergency access excluded, globalSecureAccessFilteringProfile session control",
    "# Step 5: browse to an ArtificialIntelligence site, then in the workspace's Logs",
    "NetworkAccessTraffic | where TimeGenerated > ago(24h) and TrafficType == \"internet\"",
    "| summarize Allowed = countif(Action == \"Allowed\"), Denied = countif(Action == \"Denied\") by UserPrincipalName",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  FULL COMMANDS ON THE MODULE PAGE", pt: 10 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expect: ",
    "the block page on the test site, and a Denied count on the pilot user's row.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2,\" steps 1 to 5; Guide, Step 5.1 to 5.4 and Validate.");
  notes(s,
`The lab runs in a test tenant, never production, and the authors haven't run it. You need Module 2's lab done and an Internet Access test license. Step one finds the internet profile with Learn's filtered request, enables it, and assigns the pilot group in the admin center. Step two creates the filtering policy, blocking Learn's example category, artificial intelligence. Step three creates the pilot security profile and links the policy to it, with logging on. Step four assigns the profile with Conditional Access, scoped to the pilot, with emergency access excluded. Step five tests it: on the pilot device, as a pilot user, browse to a site in that category and expect the block page. Then the guide's traffic query in the workspace should show a denied count on the pilot user's row.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 5; guide, Step 5.1 to 5.4, Validate.`);
}

// ================================================================== 9 Lab part 2
{
  const s = content(SL, "Lab 2, steps 6 to 9: QUIC, issuer, TLS outcomes");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 6, on the pilot device as an administrator: the generally available QUIC path",
    "New-NetFirewallRule -DisplayName \"Block QUIC\" -Direction Outbound -Action Block -Protocol UDP -RemotePort 443",
    "# Step 7: with a pilot TLS policy linked to SP-Pilot, check the issuer of an inspected site",
    "# Step 8, in the workspace's Logs: the TLS outcomes",
    "let T = NetworkAccessTraffic",
    "    | where TimeGenerated > ago(24h) and TrafficType == \"internet\" and isnotempty(TlsStatus)",
    "    | summarize Count = count() by TlsStatus, TlsAction;",
    "let Total = toscalar(T | summarize sum(Count));",
    "T | extend Share = round(100.0 * Count / Total, 2)",
    "# Step 9: export the filtering profiles and policies",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.15, "FaClipboardCheck", HEX.teal, "Expect: ",
    "issuer Microsoft Global Secure Access Intermediate, or your test chain; TlsAction Bypassed or Intercepted; a failure share under 1%. Module 6 removes it all.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2,\" steps 6 to 9; Guide, Step 5.6, Step 9 Validate.");
  notes(s,
`Step six adds the QUIC rule on the pilot device, Learn's Windows Firewall command; in production the same rule goes out through Intune, piloted first. Steps seven and eight need a T L S inspection certificate created, enabled and trusted on the test device, and a pilot T L S policy linked to the pilot security profile, never the baseline, as the guide's Step 9 describes, with the privacy officer's approval of the test scope. Step seven checks the issuer of an inspected site in the browser's certificate viewer: Microsoft Global Secure Access Intermediate, or your test chain. Step eight reads the T L S outcomes: T L S action reads bypassed or intercepted, and the failure share should stay under one percent. Step nine exports the profiles and policies. Keep it all in place. Module 6 removes it, and the T L S policy in Learn's order: the link from the profile, then the policy, then the certificate.`,
  `${M} — "Exercise: Lab 2," steps 6 to 9; guide, Step 5.6, Step 9.4, Step 9 Validate, How-section (Rollback).`);
}
endModule(SL);

// ================================================================== 10 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.7, 3.2, 4.25], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["SC-7, SC-7(5), SI-3, SI-4: web access filtered by identity-aware policy, bypasses governed", "KSI-CNA-ULN, KSI-CNA-RNT, KSI-CNA-MAT", "Policy, profile and CA exports; the blocked-category test; the bypass register"],
    ["SC-8, SC-12, SC-17, SI-4: encrypted traffic inspected in an approved scope, with a governed CA", "KSI-SVC-SIN, KSI-SVC-ASM, KSI-CNA-MAT", "Certificate and chain, trust profile, policy export, issuer check, failure rate, privacy approval, notice"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.15, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. The program's mapping lines Step 5 up with TIC 3.0 Remote User Pattern 3, and Step 9 with TIC 3.0's Web PEP capabilities.");
  sources(s, "Sources: Module 5, \"The federal requirement\"; Guide, Federal requirements and KSIs, by step; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; TIC 3.0 Remote User Use Case v2.2.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five. Internet Access supports S C seven, its enhancement five, S I three and S I four: web access filtered by identity-aware policy, with bypasses governed. The evidence is the filtering policy, profile and Conditional Access exports, the blocked-category test, and the bypass register. T L S inspection supports S C eight, S C twelve, S C seventeen and S I four: encrypted web traffic inspected within an approved privacy scope, with a governed C A. The evidence is the certificate and chain, the trust profile's deployment status, the policy export, the issuer check, the failure rate, the privacy approval and the user notice. The program's mapping lines Step 5 up with tick three point oh's Remote User Pattern three, which CISA calls the riskiest, and Step 9 with tick's web policy enforcement point capabilities. The evidence supports the controls; the assessor decides.`,
  `${M} — "The federal requirement" table; guide, "Federal requirements and KSIs, by step" (Steps 5 and 9), "TIC 3.0 alignment."`);
}

// ================================================================== 11 Check
{
  const s = check(SS, "Check yourself: two questions on Module 5", [
    { q: "Which CA issues the TLS inspection intermediate, in the program's position?", options: ["a. The CA that issues authentication certificates, to reuse its trust", "b. A dedicated issuing CA under the agency's root", "c. Any public CA"] },
    { q: "What happens when the inspection certificate expires?", options: ["a. New sessions fall back to a Microsoft certificate", "b. All TLS inspection across the tenant stops; so renew 90 days ahead and deploy trust first", "c. Traffic is blocked until renewal"] },
  ], "1 b: a dedicated issuing CA. 2 b: all inspection stops, so renew early.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 4 and 5; Unit 3; Guide, Step 9.1, 9.3 and How-section.");
  notes(s,
`Check yourself with two questions. First: which certificate authority issues the T L S inspection intermediate, in the program's position? The answer is b: a dedicated issuing C A under the agency's root, never the C A that issues authentication certificates. Second: what happens when the inspection certificate expires? The answer is b: all T L S inspection across the tenant stops, so the guide renews at least ninety days ahead and deploys trust before activation. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 4 and 5, and "Check your answers."`);
}

// ================================================================== 12 Summary
{
  const s = content(SS, "Summary: filtered by identity, inspected in scope");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Built and assigned a pilot security profile",
    "Proved the block and read the traffic",
    "Added the QUIC rule on the test device",
    "Checked the inspection issuer and the TLS outcomes",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6", [
    "Rings, rollback and the evidence package",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the profile, policy and CA exports, the block test, the bypass register, the certificate and chain, the trust status, issuer check, failure share, privacy approval and notice.");
  sources(s, "Sources: Module 5, \"Summary\"; learning path index; Module 6.");
  notes(s,
`To sum up. You enabled the internet profile for the pilot, built a security profile with one blocked category and assigned it with Conditional Access, proved the block, added the QUIC rule, checked the inspection issuer, and read the T L S outcomes. The evidence an I S S O keeps from this module: the filtering profile, policy and Conditional Access exports; the blocked-category test and the traffic query; the bypass register; the certificate and chain, the trust profile's deployment status, the issuer check and the failure share; and the privacy approval and the user notice. Next is Module 6, rings, rollback and the evidence package, where the pilot becomes a migration, and where you roll the whole test tenant back in the guide's order.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/global-secure-access/05-internet-access-and-tls-inspection.md (Global Secure Access as the Identity-Aware Network, Module 5); the path's verification log is docs/training/global-secure-access/_verification/learning-path.md.",
  "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide: Steps 5 and 9, Government cloud and licensing, Federal requirements and KSIs, by step; its footnotes carry each source, read November 11, 2026.",
  "Microsoft Learn: Configure Microsoft Entra Internet Access using Microsoft Graph APIs; Global Secure Access traffic forwarding profiles; Known limitations for Global Secure Access; Common operations for Global Secure Access; What is TLS inspection?; Configure TLS inspection with your own certificate; Tutorial: Enable TLS inspection; Configure TLS inspection policies; FAQ for TLS inspection; Operate Microsoft Entra Internet Access; Zero Trust: Protect networks.",
  "Network and Transport, Chapter 05; PKI and Certificates, Chapter 04. NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; TIC 3.0 Remote User Use Case v2.2.",
  "Lab 2's commands are the module page's, abbreviated on the slides, with the guide's placeholders; the path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
