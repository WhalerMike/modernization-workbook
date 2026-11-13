// Companion guide — Global Secure Access & Zero Trust Network Engineering: An Implementation Guide.
// A narrated Why / What / Who / How deck of about 15 minutes (16 narrated slides, then a backup section).
// The guide is a draft awaiting the editor's review: the title slide and its narration say so.
//   Why:   a VPN proves only that a device arrived; TIC 3.0's remote-user options; beside a third-party SSE and across clouds.
//   What:  the twelve steps in run order; government cloud and licensing by feature; the reference architecture.
//   Who:   the RACI.
//   How:   decision and baseline export; the client; Microsoft traffic and the compliant network; Internet Access;
//          private apps and privileged protocols; tenant restrictions and TLS inspection; rings, rollback and telemetry;
//          dangers, what couldn't be verified, and where to go next.
// Sources: docs/books/guides/global-secure-access-implementation.md and the sources it footnotes (Microsoft Learn's
// Global Secure Access and Microsoft Graph network access pages, CISA's TIC 3.0 Remote User Use Case, fedramp.gov; read
// November 11, 2026; listed in docs/books/guides/_verification/global-secure-access-implementation.md), and the book
// chapters the guide links (Book 09, Chapters 03, 05 and 12; Book 04, Chapter 07 and Appendix C; Book 12, Chapter 03).
// The commands on the slides are the guide's, with its placeholders; long ones are shortened only by dropping
// Out-File/ConvertTo-Json tails, and continued PowerShell-style with a backtick. No new facts.
// The speaker notes are the narration (spoken by narrate.py), written to be heard: acronyms the voice misreads are spelled
// out, and every source is named by its original or a book by its title, never by a workbook book number.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/guide-global-secure-access/build.js \
//                      presentations/guide-global-secure-access/Guide_Global_Secure_Access.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide",
  footer: "Federal Modernization Workbook  ·  Companion guide: Global Secure Access, an implementation guide (draft)",
});
const { HEX, txt, box, tag, content, titleSlide, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Guide_Global_Secure_Access.pptx";
const G = "Companion guide, Global Secure Access";

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
  const s = titleSlide(SWHY, "Global Secure Access: every connection proves itself", "An implementation guide: twelve steps from the license decision to the evidence package");
  // The guide is a draft: say so before anything else on the slide.
  box(s, "Draft notice", 0.8, 0.55, 7.9, 0.75, "FFFFFF", HEX.red);
  txt(s, "Draft notice text", [
    { text: "DRAFT GUIDE, AWAITING THE EDITOR'S REVIEW.  ", options: { bold: true, color: HEX.red } },
    { text: "Recheck it after the review; nothing in it was run in a tenant." },
  ], { x: 1.0, y: 0.6, w: 7.55, h: 0.65, fontSize: 14, valign: "middle", color: HEX.ink });
  txt(s, "Session map", [
    { text: "Why: a VPN proves only that a device arrived   ·   What: twelve steps, the clouds, the architecture", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Who: the RACI and the decision record", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "How: client, Microsoft traffic, compliant network, internet, private apps, tenant restrictions, TLS, rings, telemetry", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: Global Secure Access and Zero Trust Network Engineering, an implementation guide. One thing first: the guide is a draft, awaiting the editor's review, so recheck it after the review. Its idea fits in a sentence. A V P N proves that a device reached the network; the work in this guide makes every connection prove who is asking, from which device, for which application, and leaves a record that it did. The guide assumes a civilian agency at fed-ramp Moderate on Microsoft three sixty-five G C C. Its product facts come from Microsoft Learn, its tick three point oh statements from CISA's own documents, all read on November eleventh, 2026. Nothing in it was run against a tenant. We'll go in four parts: why, what, who, and how.`,
  `${G} — status: draft; opening statement, "In this guide," "How to read this guide."`);
}

// ================================================================== 2 Why: a VPN proves only that the device arrived
{
  const s = content(SWHY, "Why this matters: a VPN proves only that a device arrived");
  tag(s, "Why");
  const p1 = panel(s, "What", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "MICROSOFT'S SECURITY SERVICE EDGE", null, [
    "Entra Internet Access and Entra Private Access, as the identity-aware network layer",
    "Three traffic profiles: Microsoft traffic, internet traffic, private traffic",
    "Conditional Access decides; the service edge enforces; the logs prove it",
  ], 13);
  const p2 = panel(s, "Where", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "WHERE IT RUNS TODAY", null, [
    "Available in GCC; not yet supported in GCC High, DoD or other sovereign clouds (Learn)",
    "The Graph network access APIs are beta: run interactively, keep each result as evidence",
  ], 13);
  const p3 = panel(s, "Order", 0.6, Math.max(p1, p2) + 0.2, FULL, null, HEX.teal, HEX.tealTint, "THE ORDER THE GUIDE RUNS THE TWELVE STEPS", null, [
    "1, 2, 12 (logging only), 3, 4, 7, 8, 6, 10, 5, 9, 11, then 12 again for the evidence package",
    "So the logs exist before anything is enforced, and nothing blocks before its path exists",
  ], 13);
  callout(s, "Closure", p3 + 0.25, 0.9, "FaScaleBalanced", HEX.navy, "Ready for closure: ",
    "every applicable control state has evidence. The authorizing official or assessor decides.");
  sources(s, "Sources: Guide, \"How to read this guide,\" \"Where each topic lives\"; Known limitations for Global Secure Access; Microsoft Graph network access APIs (preview).");
  notes(s,
`Why does this matter? Global Secure Access is Microsoft's security service edge: Entra Internet Access and Entra Private Access, used as the agency's identity-aware network layer. It carries three kinds of traffic, each with its own profile: Microsoft traffic, internet traffic, and private traffic. Conditional Access decides, the service edge enforces, and the logs prove it. Two facts shape everything after. Learn's known limitations page says the service is available in G C C, but isn't yet supported in G C C High, D O D, or other sovereign clouds. And Microsoft's Graph network access A P I's are in beta, which Learn says is subject to change and not supported in production, so the guide runs them by hand and keeps each result as evidence. The twelve steps run in a set order, so the logs exist before anything is enforced, and nothing blocks before its path exists.`,
  `${G} — "How to read this guide" (The Graph API is beta), "Where each topic lives" (run order), "The control states and the closure chain"; Microsoft Learn — "Known limitations for Global Secure Access," "Secure access … using Microsoft Graph network access APIs (preview)."`);
}

// ================================================================== 3 Why: TIC 3.0
{
  const s = content(SWHY, "TIC 3.0: one way to build three remote-user options");
  tag(s, "Why");
  const tb = table(s, "TIC", 1.4, [3.6, 4.1, 4.45], ["Remote User Use Case pattern", "The Global Secure Access function", "What to watch"], [
    ["Pattern 1: to the agency campus", "Private Access, with per-app Conditional Access on top", "Each application published on its own"],
    ["Pattern 2: to sanctioned cloud providers", "The Microsoft traffic profile with the compliant network check", "Microsoft 365 is the sanctioned provider"],
    ["Pattern 3: to the web", "Internet Access", "CISA calls it the riskiest: the greatest rigor"],
    ["Branch Office Use Case", "Remote networks (IPsec)", "Baseline profile only, no Conditional Access: parity is a design question"],
  ], { fontSize: 12, limit: 4.4 });
  const p1 = panel(s, "Telemetry", 0.6, tb + 0.2, W2, null, HEX.red, HEX.redTint, "TELEMETRY IS WHAT A DESIGN LOSES", null, [
    "The use case: CISA's visibility must be preserved through telemetry sharing (OMB M-26-14)",
    "Agree the path with the TIC delegates before the VPN's web path is retired",
  ], 12.5);
  const p2 = panel(s, "Not", 0.6 + W2 + G2, tb + 0.2, W2, null, HEX.navy, HEX.navyTint, "WHAT IT ISN'T", null, [
    "Not a TIC 3.0 product: CISA certifies no products",
    "CISA's SASE guide permits and describes; it doesn't require",
  ], 12.5);
  fit("TIC panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, \"TIC 3.0 alignment\"; CISA TIC 3.0 Remote User Use Case v2.2; TIC 3.0 Branch Office Use Case v3.0; CISA SASE guide; Book 09, Ch 03 and 05.");
  notes(s,
`Where does this sit in federal terms? Tick three point oh is technology-neutral: it sets goals, not products. CISA's Remote User Use Case has three security patterns, and each has an option that runs through a security-as-a-service provider. In the program's reading, Private Access is that option for the campus, the Microsoft traffic profile with the compliant network check is the option for a sanctioned cloud provider, and Internet Access is the option for the web, which CISA calls the riskiest pattern. For branches, remote networks get only the baseline profile and no Conditional Access, so parity between a branch user and a client user is a design question. The part a design most often loses is telemetry. The use case says CISA's visibility must be preserved, so agree the path with the agency's tick delegates before the V P N's web path is retired. And none of this makes Global Secure Access a tick product: CISA certifies no products.`,
  `${G} — "TIC 3.0 alignment"; CISA — Trusted Internet Connections 3.0 Remote User Use Case, v2.2 (§6.1–6.3, §8); TIC 3.0 Branch Office Use Case; CISA SASE guidance; Book 09, Chapters 03 and 05.`);
}

// ================================================================== 4 Why: beside a third-party SSE, and across clouds
{
  const s = content(SWHY, "Beside a third-party SSE, and across clouds");
  tag(s, "Why");
  const tb = table(s, "SSE", 1.4, [3.0, 4.35, 4.8], ["Question", "Global Secure Access", "Typical third-party SSE (as Learn's coexistence pages describe them)"], [
    ["Where policy is decided", "Entra Conditional Access, the same engine as sign-in", "The vendor's own engine, usually fed by Entra ID"],
    ["Government-cloud reach", "GCC only today", "Per offering; several hold FedRAMP High listings"],
    ["Signals only Entra can produce", "Compliant network check, universal tenant restrictions, source IP restoration", "Not available from a third party"],
    ["Running both", "Supported: each traffic type to one or the other, with mutual bypasses", "Same"],
  ], { fontSize: 12, limit: 4.6 });
  const p1 = panel(s, "Clouds", 0.6, tb + 0.2, FULL, null, HEX.teal, HEX.tealTint, "PRIVATE APPS IN AWS, GOOGLE CLOUD AND ORACLE CLOUD INFRASTRUCTURE", null, [
    "Reached like on-premises apps: Learn says Private Access works across hybrid and multicloud environments",
    "Through connectors on Windows Server hosts with line of sight to the app: each cloud's network gets its own connector group",
    "Learn describes no connector deployment specific to any of the three: not yet specified",
  ], 12.5);
  fit("Clouds panel", p1);
  sources(s, "Sources: Guide, \"A brief comparison with other security service edge offerings\"; What is Global Secure Access?; Book 09, Ch 05; FedRAMP Marketplace.");
  notes(s,
`Most agencies already hold a fed-ramp authorized S S E or V P N, so the question is usually which functions to move, not which vendor to buy. Global Secure Access decides policy in Entra Conditional Access, the same engine as sign-in; a third party uses its own engine, usually fed by Entra I D. Global Secure Access reaches G C C only today; several third-party offerings hold fed-ramp High listings. Three signals only Entra can produce: the compliant network check, universal tenant restrictions, and source I P restoration. Running both is supported. Private apps in A W S, Google Cloud or Oracle Cloud Infrastructure are reached like on-premises ones, through connectors with line of sight to the application, one connector group per cloud network. Learn has no procedure specific to any of those clouds.`,
  `${G} — "A brief comparison with other security service edge offerings"; Microsoft Learn — "What is Global Secure Access?"; Book 09, Chapter 05 — "Coexistence with …," "Authorization status is not uniform."`);
}
endModule(SWHY);

// ================================================================== 5 What: the twelve steps
{
  const s = content(SWHAT, "Twelve steps, run so the logs come first");
  tag(s, "What");
  const tb = table(s, "Path", 1.4, [3.0, 5.6, 3.55], ["Step (run order: 1, 2, 12, 3, 4, 7, 8, 6, 10, 5, 9, 11, 12)", "Done when", "Validate with"], [
    ["1 Decision and licensing", "A decision record per function, with licenses, availability quote and exit criteria", "License export; tenant status"],
    ["2 Reference architecture", "Connector groups, DNS suffixes, branches and workspace written down", "Graph export and hash manifest"],
    ["3 Client deployment", "Client on every managed device; users can't silently turn it off", "Health check; device usage summary"],
    ["4 Microsoft traffic", "Profile on by ring; source IP restoration and signaling on", "Share of sign-ins through the service"],
    ["5 Internet traffic", "Security profiles assigned by Conditional Access; bypasses governed", "Blocked-category test"],
    ["6 Private applications", "Each app with its own segments, group and policy; Quick Access to zero", "Reachable and unreachable port tests"],
    ["7 Compliant network", "Report-only 10 days, then On by ring", "Disable-the-client-and-retry test"],
    ["8 Tenant restrictions", "TRv2 policy approved; tagging on", "The four-case test"],
    ["9 TLS inspection", "Dedicated CA, privacy scope, failure rate under 1%", "Issuer check; TLS outcomes query"],
    ["10 Privileged protocols", "Admin RDP and domain controllers behind phishing-resistant policy", "Sign-in log; klist test"],
    ["11 Coexistence and migration", "Each ring exited on its criteria; VPN routes removed after", "Ring exit records"],
    ["12 Telemetry and evidence", "Four log categories exported, fresh, shared as agreed", "Freshness query"],
  ], { fontSize: 10.5, limit: 6.55 });
  fit("Path", tb);
  sources(s, "Sources: Guide, \"Where each topic lives,\" Steps 1 to 12 (each Validate), \"Implementation checklist.\"");
  notes(s,
`Here are the twelve steps. One: a decision record per function, with licenses, a dated availability quote, and exit criteria. Two: the reference architecture written down for this tenant, with a configuration export. Three: the client on every managed device. Four: the Microsoft traffic profile, with source I P restoration. Five: internet traffic, through security profiles. Six: private applications, each with its own segments, group and policy. Seven: the compliant network check. Eight: tenant restrictions. Nine: T L S inspection. Ten: privileged protocols. Eleven: coexistence and migration, ring by ring. Twelve: telemetry and evidence. They run in a different order: logging first, and internet filtering and T L S inspection last.`,
  `${G} — "Where each topic lives" (the twelve topics and the run order); Steps 1 to 12 (Validate); "Implementation checklist."`);
}

// ================================================================== 6 What: government cloud and licensing
{
  const s = content(SWHAT, "Government cloud and licensing, feature by feature");
  tag(s, "What");
  const tb = table(s, "Gov", 1.4, [4.6, 2.35, 2.2, 3.0], ["Feature", "GCC", "GCC High and DoD", "License (with Entra ID P1 or P2)"], [
    ["Windows client", "Available (product-wide)", "Not yet supported", "Per the profiles it carries"],
    ["Microsoft traffic profile; source IP restoration; compliant network; universal tenant restrictions", "Available (product-wide)", "Not yet supported", "Included in P1 or P2"],
    ["Internet Access: web filtering, threat intelligence, TLS inspection", "Available (product-wide)", "Not yet supported", "Internet Access or Entra Suite"],
    ["Cloud firewall for clients; Explicit Forward Proxy (preview)", "Not yet specified", "Not yet supported", "Internet Access or Suite"],
    ["Private Access; the domain controller sensor", "Available (product-wide)", "Not yet supported", "Private Access or Suite"],
    ["Remote networks (branch IPsec)", "Available (product-wide)", "Not yet supported", "At least 50 P1 and Internet Access combined"],
  ], { fontSize: 11, limit: 5.3 });
  line(s, "Conflict", "A conflict on Learn: Graph's settings pages list US Government L4 and L5; the product page says not yet supported. The guide follows the product page and asks the account team.",
    tb + 0.12, 0.6, 13);
  sources(s, "Sources: Guide, \"Government cloud and licensing\"; Known limitations for Global Secure Access; Global Secure Access traffic forwarding profiles; Book 09, Ch 05; Book 10, Ch 04.");
  notes(s,
`What's available where? Learn's statement covers the whole product: available in G C C, not yet supported in G C C High, D O D, or other sovereign clouds. No feature page narrows that, so the G C C column rests on that one sentence, and a preview feature's G C C availability is not yet specified. Licensing follows the profiles. The Microsoft traffic profile, and with it source I P restoration, the compliant network check and universal tenant restrictions, comes with Entra I D P one or P two. Internet Access and Private Access are separately licensed, or come with the Entra Suite. Remote networks need at least fifty P one and Internet Access licenses combined. One conflict: Graph's settings pages list U S Government L four and L five, but the product page says not yet supported. The guide follows the product page, and the question goes to the agency's Microsoft account team. Re-read the limitations page before each ring.`,
  `${G} — "Government cloud and licensing, feature by feature" (table, the conflict between Learn pages, Authorization); Microsoft Learn — "Known limitations for Global Secure Access," "Global Secure Access traffic forwarding profiles," "Update conditionalAccessSettings"; Book 09, Chapter 05; Book 10, Chapter 04.`);
}

// ================================================================== 7 What: the reference architecture
{
  const s = content(SWHAT, "The reference architecture: planes and boundaries");
  tag(s, "What");
  const tb = table(s, "Arch", 1.4, [2.55, 4.2, 3.6, 1.8], ["Zone or plane", "What sits there", "Trust boundary it crosses", "Owner"], [
    ["Managed endpoint", "Windows client, Intune policy, device identity", "To the edge, in a tunnel opened after Entra sign-in", "Platform owner"],
    ["Branch", "Customer premises equipment with an IPsec tunnel", "To the edge; no user identity on the tunnel", "Platform owner"],
    ["Control plane", "Conditional Access, named locations, cross-tenant access, authentication strengths", "Decides; never carries traffic", "Policy owner"],
    ["Policy plane", "Traffic forwarding and security profiles, TLS policies, signaling", "Configures the data plane", "Platform owner"],
    ["Data plane", "Microsoft service edge in commercial Azure regions", "Enforces; holds traffic in transit", "Microsoft"],
    ["Agency private network", "Connector groups, private DNS, apps, domain controllers with sensors", "Outbound-only; no inbound ports", "Platform owner"],
    ["Evidence", "Log Analytics workspace, Sentinel, the evidence store", "Logs leave through diagnostic settings", "Security monitor"],
  ], { fontSize: 11, limit: 5.6 });
  line(s, "DNS", "DNS stays split: private suffixes resolve through the edge to the connector group's servers. The client doesn't support DNS over HTTPS.",
    tb + 0.12, 0.6, 13);
  sources(s, "Sources: Guide, \"The reference architecture,\" Step 2; Book 09, Ch 05 and 08; Book 10, Ch 04.");
  notes(s,
`The reference architecture has seven zones and planes. Managed Windows endpoints open a tunnel to the service edge after Entra sign-in. Branches send traffic over an I P sec tunnel, with no user identity on it. The control plane, Conditional Access, decides and never carries traffic. The policy plane holds the traffic forwarding profiles, security profiles, T L S policies and signaling, and configures the data plane. The data plane is Microsoft's service edge in commercial Azure regions, and it holds the agency's traffic in transit. The agency's private network holds connector groups, private D N S, applications and domain controllers with sensors, all outbound-only. And the evidence zone is the Log Analytics workspace and Sentinel. D N S stays split. The client doesn't support D N S over H T T P S, so secure D N S in browsers is turned off on managed devices.`,
  `${G} — "The reference architecture" (figure, trust boundaries and planes, identity signals, DNS); Step 2; Book 09, Chapters 05 and 08; Book 10, Chapter 04.`);
}
endModule(SWHAT);

// ================================================================== 8 Who: RACI
{
  const s = content(SWHO, "Who does what: the RACI and the closure decision");
  tag(s, "Who");
  const tb = table(s, "RACI", 1.4, [5.6, 3.55, 3.0], ["Activity (from the guide's RACI)", "Responsible", "Accountable"], [
    ["Decision record and exit criteria; reference architecture", "Platform owner", "Policy owner"],
    ["Client packaging and rings", "Platform owner; operator", "—"],
    ["Traffic profiles; Conditional Access policies and exclusions", "Platform owner", "Policy owner"],
    ["TLS certificate, policy and privacy scope", "Platform owner", "Policy owner"],
    ["Connectors and domain controller sensors", "Platform owner; operator", "—"],
    ["Alerts, freshness and metrics", "Operator; security monitor", "—"],
    ["Tier-1 user issues", "Help desk", "—"],
    ["Assess the evidence; recommend ready for closure", "Assessor", "—"],
    ["Decide closure", "Authorizing official (or assessor for an assessment finding)", ""],
  ], { fontSize: 11.5, limit: 5.6 });
  line(s, "Two", "Policy owner: the service owner, ISSO consulted. Platform owner: network security and identity engineers. Learn: at least two people per role.",
    tb + 0.12, 0.6, 13);
  sources(s, "Sources: Guide, \"RACI\"; Common operations for Global Secure Access; Global Secure Access operations guide.");
  notes(s,
`Now, who. Microsoft's operations guide gives a RACI with a service owner, network security engineer, identity engineer, S O C analyst, help desk and platform operations. The guide maps those to six roles and adds the assessor, who is independent of the work. The policy owner, the service owner with the I S S O consulted, is accountable for the decision record, the architecture, the traffic profiles, the Conditional Access policies and their exclusions, and the T L S inspection scope. The platform owner, the network security and identity engineers, is responsible for building them. Operators run the client rings, the connectors and the domain controller sensors. The security monitor owns alerts, log freshness and the metrics. The help desk takes tier-one user issues. The assessor assesses the evidence and recommends a finding ready for closure, and the authorizing official decides. Learn's advice is at least two people for every role.`,
  `${G} — "RACI" (the fourth artifact); Microsoft Learn — "Common operations for Microsoft Entra Global Secure Access" (roles and responsibilities), "Microsoft Entra Global Secure Access operations guide."`);
}
endModule(SWHO);

// ================================================================== 9 How: Steps 1 and 2
{
  const s = content(SHOW, "Steps 1 and 2: decide per function, export a baseline");
  tag(s, "How");
  const c = code(s, "Decide", 0.6, 1.4, FULL, [
    "# Step 1: the tenant's licenses and its onboarding state (GCC uses the Global environment)",
    "Connect-MgGraph -Environment Global -Scopes \"Organization.Read.All\",\"NetworkAccess.Read.All\"",
    "Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits | Export-Csv .\\gsa-01-licenses.csv -NoTypeInformation",
    "Invoke-MgGraphRequest -Method GET -Uri \"https://graph.microsoft.com/beta/networkAccess/tenantStatus\"",
    "# Step 2: export profiles, policies, settings, connectors, Conditional Access and named locations to $out, then hash",
    "Invoke-MgGraphRequest -Method GET -Uri $uris[$k] | ConvertTo-Json -Depth 20 | Out-File \"$out\\$k.json\"",
    "Get-ChildItem $out | Get-FileHash -Algorithm SHA256 | Export-Csv \"$out\\manifest.csv\" -NoTypeInformation",
  ], { label: "THE GUIDE'S COMMANDS (STEP 2'S LOOP RUNS ONCE PER URI)", pt: 10.5 });
  const p1 = panel(s, "Rec", 0.6, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "THE DECISION RECORD, PER FUNCTION", null, [
    "Microsoft traffic, internet, private, branch: adopt, retain-current, coexist or defer",
    "Availability quote dated within 30 days; license count; compensating controls; exit criteria; approver",
  ], 12);
  const p2 = panel(s, "Defer", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.red, HEX.redTint, "GCC HIGH AND DOD: DON'T BUILD", null, [
    "Record defer, cite the limitations sentence",
    "Compensating path: a FedRAMP-authorized SSE, per-app VPN lists, named-location Conditional Access, device TRv2",
  ], 12);
  fit("Decide panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Steps 1 and 2; What is Global Secure Access?; Common operations for Global Secure Access; Known limitations for Global Secure Access.");
  notes(s,
`Now how. Step one decides, per function, because the gates differ: Microsoft traffic, internet, private and branch can each be adopted, kept on the current V P N or S S E, run side by side, or deferred. Read the tenant's licenses and onboarding state first. The decision record, the guide's second artifact, holds a dated availability quote, the license count, compensating controls, exit criteria and an approver. In G C C High or D O D, don't build: record defer, and keep a compensating path, such as a fed-ramp authorized S S E, per-application V P N access lists, and named-location Conditional Access. Step two: Learn's operations guidance is to back up the configuration through Graph exports weekly and before every change. The guide hashes that export, and it becomes the configuration evidence for every later step.`,
  `${G} — Step 1 (1.1 to 1.3, Validate), Step 2 (2.1, Validate); Microsoft Learn — "What is Global Secure Access?" (licensing), "Common operations for Microsoft Entra Global Secure Access" (configuration backup), "Known limitations for Global Secure Access."`);
}

// ================================================================== 10 How: Step 3 client
{
  const s = content(SHOW, "Step 3: package, harden and count the client");
  tag(s, "How");
  const c = code(s, "Client", 0.6, 1.4, FULL, [
    "# Wrap Learn's install script and the client for an Intune Win32 app (Required, to the pilot group)",
    "IntuneWinAppUtil.exe -c C:\\Packages\\GSA -s Install-GSAClient.ps1 -o C:\\Packages\\Out -q",
    "# From ring 2: Learn's remediation sets these values under HKLM:\\SOFTWARE\\Microsoft\\Global Secure Access Client",
    "$gsaSettings = @{ \"HideSignOutButton\" = 1; \"HideDisablePrivateAccessButton\" = 1; \"HideDisableButton\" = 1; \"RestrictNonPrivilegedUsers\" = 1 }",
    "# Validate on a pilot device: version, then the client's Advanced diagnostics > Health check",
    "(Get-Item \"C:\\Program Files\\Global Secure Access Client\\TrayApp\\GlobalSecureAccessClient.exe\").VersionInfo.FileVersion",
  ], { label: "THE GUIDE'S COMMANDS, FROM LEARN'S CLIENT PAGE", pt: 10.5 });
  const p1 = panel(s, "Pre", 0.6, c + 0.15, W3, null, HEX.navy, HEX.navyTint, "WHERE IT RUNS", null, [
    "Windows 10 LTSC 2021+, Windows 11; Entra joined, hybrid joined or registered",
    "Not on a Hyper-V external switch host or AVD multi-session; IPv4 only",
  ], 11.5);
  const p2 = panel(s, "DoH", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.amber, HEX.amberTint, "TURN OFF DNS OVER HTTPS", null, [
    "Edge and Chrome: Intune settings catalog, set to Disabled",
    "Firefox: Learn's remediation script",
  ], 11.5);
  const p3 = panel(s, "Count", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.teal, HEX.tealTint, "COUNT THE COVERAGE", null, [
    "Device usage summary (beta): activeDeviceCount",
    "Divided by Intune's in-scope Windows devices: the client coverage metric",
  ], 11.5);
  fit("Client panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 3; Install the Global Secure Access client for Windows; Known limitations for Global Secure Access; reports: getDeviceUsageSummary.");
  notes(s,
`Step three puts the client on every managed device. It runs on Windows ten L T S C 2021 or later and Windows eleven, on devices joined, hybrid joined or registered in the tenant; registered devices carry only Private Access. It can't go on a machine that hosts virtual machines with a Hyper-V external switch, and it tunnels I P version four only. Package Learn's installation script with the client, and create the Win32 app in Intune with Learn's commands, detection rule and return codes, assigned as required to the pilot group. Because the client doesn't support secure D N S, turn off D N S over H T T P S in Edge and Chrome. Learn's advice is to let users run unrestricted first; from ring two, a remediation hides the disable and sign-out buttons and restricts non-privileged users. Then count: the device usage summary's active devices, divided by Intune's in-scope Windows devices, is the client coverage metric.`,
  `${G} — Step 3 (3.1 to 3.5, Validate, How-section); Microsoft Learn — "Install the Global Secure Access client for Windows," "Known limitations for Global Secure Access," "reports: getDeviceUsageSummary."`);
}

// ================================================================== 11 How: Steps 4 and 7
{
  const s = content(SHOW, "Steps 4 and 7: Microsoft traffic and the compliant network");
  tag(s, "How");
  const c = code(s, "MS", 0.6, 1.4, FULL, [
    "# Step 4: enable the Microsoft traffic profile (assign the pilot group in the portal), then signaling",
    "Invoke-MgGraphRequest -Method PATCH -Uri \"https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<profile-id>\" `",
    "    -Body '{\"state\":\"enabled\"}' -ContentType \"application/json\"",
    "Invoke-MgGraphRequest -Method PATCH -Uri \"https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess\" `",
    "    -Body '{\"signalingStatus\":\"enabled\"}' -ContentType \"application/json\"",
    "# Step 7: block All resources from outside <compliant-location-id>, Intune apps and emergency group excluded",
    "#         \"state\": \"enabledForReportingButNotEnforced\" for 10 business days, then \"enabled\" by ring",
  ], { label: "THE GUIDE'S COMMANDS, FROM LEARN'S GRAPH PAGES", pt: 10.5 });
  const tb = table(s, "Fail", c + 0.15, [3.6, 4.4, 4.15], ["Failure", "What happens", "Design response"], [
    ["Client disabled or not installed", "Blocked at the next authentication", "Restrict disabling; a help desk reinstall script"],
    ["Global Secure Access outage", "Resources the check secures are unreachable", "Microsoft's break-glass scripts, rehearsed"],
    ["Signaling off while policies are On", "Users can be blocked", "Policies to report-only first, signaling last"],
    ["A Private Access app in scope", "The check isn't supported there", "Step 6's per-app policies instead"],
  ], { fontSize: 11, limit: 6.55 });
  fit("Fail", tb);
  sources(s, "Sources: Guide, Steps 4 and 7; Source IP restoration; Enable compliant network check with Conditional Access; Tutorial: Enable the compliant network check.");
  notes(s,
`Steps four and seven belong together. The Microsoft traffic profile acquires Microsoft three sixty-five and Entra traffic, and only that profile can. Enable it, assign the pilot group in the portal, and turn on signaling, which carries source I P restoration, so Entra sees the user's real address. Learn's test: a SharePoint sign-in shows the same I P with the client on or off. The compliant network check then passes only for users who come through this tenant's Global Secure Access, and denies a replayed token. Learn's example policy goes straight to on; the guide runs it in report-only for ten business days, excluding the Intune enrollment apps and the emergency access group. Know the failure modes first. A disabled client is blocked at the next sign-in. In an outage, Microsoft's break-glass scripts switch the policies to report-only. Turning signaling off while policies are on blocks users. And the check doesn't apply to Private Access apps.`,
  `${G} — Step 4 (4.1 to 4.3, Validate), Step 7 (7.1 to 7.4, failure modes, Validate); Microsoft Learn — "Tutorial: Enable the Microsoft traffic profile," "Source IP restoration," "Enable compliant network check with Conditional Access," "Tutorial: Enable the compliant network check."`);
}

// ================================================================== 12 How: Step 5
{
  const s = content(SHOW, "Step 5: Internet Access through security profiles");
  tag(s, "How");
  const c = code(s, "IA", 0.6, 1.4, FULL, [
    "# A filtering policy (block the categories the acceptable-use policy names), a security profile, then the link",
    "Invoke-MgGraphRequest -Method POST -Uri \"https://graph.microsoft.com/beta/networkaccess/filteringPolicies\" -Body $policy",
    "Invoke-MgGraphRequest -Method POST -Uri \"https://graph.microsoft.com/beta/networkaccess/filteringProfiles\" -ContentType \"application/json\" `",
    "  -Body '{\"name\":\"SP-Pilot\",\"state\":\"enabled\",\"priority\":100,\"policies\":[]}'",
    "# Conditional Access assigns it: \"All internet resources with Global Secure Access\", session control",
    "#   globalSecureAccessFilteringProfile, scoped to <pilot-group-id>, excluding <emergency-group-id>",
    "# QUIC: the generally available path, delivered by Intune and piloted first",
    "New-NetFirewallRule -DisplayName \"Block QUIC\" -Direction Outbound -Action Block -Protocol UDP -RemotePort 443",
  ], { label: "THE GUIDE'S COMMANDS, FROM LEARN'S INTERNET ACCESS GRAPH TUTORIAL", pt: 10.5 });
  const p1 = panel(s, "Limits", 0.6, c + 0.15, W3, null, HEX.navy, HEX.navyTint, "LEARN'S LIMITS", null, [
    "HTTP and HTTPS on ports 80 and 443 only; no IPv6, no UDP",
    "256 profiles, 1,000 policies, 8,000 destinations",
  ], 11.5);
  const p2 = panel(s, "TI", 0.6 + W3 + G3, c + 0.15, W3, null, HEX.teal, HEX.tealTint, "THREAT INTELLIGENCE", null, [
    "In the baseline profile, so it covers everyone in the internet profile",
    "Enable both profiles: internet excludes Microsoft traffic",
  ], 11.5);
  const p3 = panel(s, "Bypass", 0.6 + 2 * (W3 + G3), c + 0.15, W3, null, HEX.red, HEX.redTint, "EVERY BYPASS EXPIRES", null, [
    "Each custom bypass and allow-list entry: owner, reason, expiry",
    "Custom bypass doesn't work on remote networks",
  ], 11.5);
  fit("IA panels", Math.max(p1, p2, p3));
  sources(s, "Sources: Guide, Step 5; Internet Access using Microsoft Graph APIs; Known limitations for Global Secure Access; Common operations for Global Secure Access.");
  notes(s,
`Step five. Internet Access groups web content filtering, threat intelligence, T L S inspection and file policies into security profiles, and Conditional Access assigns a profile to users. Learn's Graph tutorial is the procedure: a filtering policy that blocks the categories the agency's acceptable-use policy names, a security profile, the link between them, and a Conditional Access policy that assigns it, scoped to the pilot. Enable both profiles, because the internet profile doesn't include Microsoft traffic. Put threat intelligence in the baseline profile so it covers everyone. Learn's limits: H T T P and H T T P S on ports eighty and four forty-three, no I P version six and no U D P. Quick isn't forwarded end to end, so the guide blocks U D P four forty-three with a Windows firewall rule. And every bypass gets an owner, a reason and an expiry.`,
  `${G} — Step 5 (5.1 to 5.7, Validate, How-section); Microsoft Learn — "Configure Microsoft Entra Internet Access using Microsoft Graph APIs," "Known limitations for Global Secure Access," "Common operations for Microsoft Entra Global Secure Access" (allow-list expiry), "Configure Transport Layer Security inspection policies" (QUIC); Book 09, Chapter 05.`);
}

// ================================================================== 13 How: Steps 6 and 10
{
  const s = content(SHOW, "Steps 6 and 10: per-app private access and admin paths");
  tag(s, "How");
  const c = code(s, "PA", 0.6, 1.4, FULL, [
    "# Step 6: one app per application, bound to a connector group, with only the segments it uses",
    "Invoke-MgGraphRequest -Method POST -Uri \"https://graph.microsoft.com/beta/applications/<app-object-id>/onPremisesPublishing/`",
    "  segmentsConfiguration/microsoft.graph.ipSegmentConfiguration/applicationSegments\" -ContentType \"application/json\" `",
    "  -Body '{\"destinationHost\":\"<app-fqdn>\",\"destinationType\":\"fqdn\",\"port\":0,\"ports\":[\"<app-ports>\"],\"protocol\":\"tcp\"}'",
    "# Step 10: admin hosts on 3389-3389; Conditional Access requires authentication strength",
    "#   00000000-0000-0000-0000-000000000004 (phishing-resistant) and a compliant device, in report-only first",
    "# Domain controllers: the sensor installs in Audit; test with klist before enforcing",
    "klist purge",
    "klist get cifs/<server-fqdn>",
  ], { label: "THE GUIDE'S COMMANDS, FROM LEARN'S PRIVATE ACCESS PAGES", pt: 10.5 });
  const p1 = panel(s, "Apps", 0.6, c + 0.15, W2, null, HEX.teal, HEX.tealTint, "PRIVATE APPS (STEP 6)", null, [
    "Assign a group, not individuals; Conditional Access per app, report-only first",
    "Quick Access is the bridge: shrink it to zero from application discovery",
  ], 11.5);
  const p2 = panel(s, "DC", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.red, HEX.redTint, "DOMAIN CONTROLLERS (STEP 10)", null, [
    "Application SPNs first, the DC's own later, to avoid admin lockout",
    "Break-glass mode known before Enforce; the registration token used once",
  ], 11.5);
  fit("PA panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Steps 6 and 10; Private Access using Microsoft Graph APIs; Private Access for domain controllers; authentication strengths; Book 09, Ch 05.");
  notes(s,
`Steps six and ten replace the V P N's address pool with one path per application. Learn's Graph tutorial creates each application from the custom template, binds it to a connector group, and adds only the segments it uses: one host, its ports, its protocol. Assign a group, not individuals, and put Conditional Access on the app, in report-only first. Quick Access is the bridge: application discovery shows what's used, and each piece moves into its own app until Quick Access is empty. Step ten does the same for the paths an attacker wants most. Administrative hosts get their own apps on R D P, and their policy requires the phishing-resistant authentication strength and a compliant device. Domain controllers, for as long as they remain, get the Private Access sensor, which installs in audit mode. Learn's advice: protect application S P N's first and the domain controller's own later, to avoid locking out administrators, and test with klist.`,
  `${G} — Step 6 (6.1 to 6.6, Validate, How-section), Step 10 (10.1 to 10.3, Validate, How-section); Microsoft Learn — "Configure Microsoft Entra Private Access using Microsoft Graph APIs," "How to configure per-app access," "Configure Microsoft Entra Private Access for Active Directory domain controllers"; Book 04, Chapter 03; Book 09, Chapter 05.`);
}

// ================================================================== 14 How: Steps 8 and 9
{
  const s = content(SHOW, "Steps 8 and 9: tenant restrictions and TLS inspection");
  tag(s, "How");
  const c = code(s, "TR", 0.6, 1.4, FULL, [
    "# Step 8: with the TRv2 policy approved (default block, partner policies), turn on tagging",
    "Invoke-MgGraphRequest -Method PATCH -Uri \"https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess\" `",
    "    -Body '{\"networkPacketTaggingStatus\":\"enabled\"}' -ContentType \"application/json\"",
    "# Step 9: sign the service's CSR from a dedicated issuing CA, never the authentication PKI",
    "certreq -submit -config \"<ca-config>\" -attrib \"CertificateTemplate:<tls-inspection-subca-template>\" gsa.csr gsa-signed.cer",
  ], { label: "THE GUIDE'S COMMANDS", pt: 10.5 });
  const p1 = panel(s, "TR", 0.6, c + 0.15, W2, null, HEX.navy, HEX.navyTint, "UNIVERSAL TENANT RESTRICTIONS", null, [
    "TRv2 without a proxy, for devices with the client or on a remote network",
    "Reaches sign-in and the Graph data plane, not SharePoint or Exchange data",
    "Learn's four-case test: member, allowed partner, blocked tenant, guest",
  ], 11.5);
  const p2 = panel(s, "TLS", 0.6 + W2 + G2, c + 0.15, W2, null, HEX.red, HEX.redTint, "TLS INSPECTION", null, [
    "Intermediate: Server Auth EKU, CA:TRUE, six months' validity; one active",
    "Trust deployed before activation; an expired certificate stops all inspection",
    "Privacy officer approves the scope; users told first; failures under 1%",
  ], 11.5);
  fit("TR panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, Steps 8 and 9; Turn on Universal Tenant Restrictions; Configure TLS inspection policies; TLS inspection with your own certificate; Book 04, App. C.");
  notes(s,
`Steps eight and nine. Universal tenant restrictions apply the tenant restrictions version two policy to devices with the client, or on a remote network, without a proxy, so users can sign in only to tenants the policy allows. The policy comes first, default block, then tagging. It reaches sign-in and the Microsoft Graph data plane, not the SharePoint or Exchange data plane. Learn's four-case test checks a member, an allowed partner, a blocked tenant, and a guest. T L S inspection is the step most likely to break applications, so it comes last. Learn suggests a dedicated certificate authority, not your production P K I. Deploy trust before activation, because an expired certificate stops all inspection. The privacy officer approves the scope, users are told first, and a failure rate above one percent is a systemic problem.`,
  `${G} — Step 8 (8.1, 8.2, Validate), Step 9 (9.1 to 9.6, Validate); Microsoft Learn — "Turn on Universal Tenant Restrictions," "Configure TLS inspection with your own certificate," "Tutorial: Enable TLS inspection," "Configure Transport Layer Security inspection policies," "Operate Microsoft Entra Internet Access," "Configure Microsoft Entra for Zero Trust: Protect networks"; Book 04, Appendix C; Book 09, Chapter 12.`);
}

// ================================================================== 15 How: Steps 11 and 12
{
  const s = content(SHOW, "Steps 11 and 12: rings, rollback and telemetry");
  tag(s, "How");
  const tb = table(s, "Rings", 1.4, [1.0, 4.4, 6.75], ["Ring", "Scope", "Exit criteria"], [
    ["0", "The implementing team", "Every step's Validate passed; break-glass rehearsed"],
    ["1", "Pilot, fewer than 20 users across roles and sites", "10 business days; no unresolved Sev-2; report-only results clean"],
    ["2", "Early adopters, about 10%, including one branch", "20 business days; help desk within threshold; TLS failures under 1%"],
    ["3", "Everyone in scope, in waves", "Ring 2's criteria per wave; VPN routes removed only after the wave holds"],
  ], { fontSize: 11, limit: 3.6 });
  const c = code(s, "Logs", 0.6, tb + 0.15, FULL, [
    "# Step 12, before the pilot: one Entra diagnostic setting exports the four categories to the workspace",
    "#   NetworkAccessTrafficLogs, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts",
    "union isfuzzy=true withsource=Table NetworkAccessTraffic, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts",
    "| where TimeGenerated > ago(1d) | summarize Rows = count(), Last = max(TimeGenerated) by Table",
  ], { pt: 10.5, limit: 5.7 });
  line(s, "Rollback", "Rollback, newest first: policies to report-only; profile links removed; the wave's group out of the profiles; VPN route restored; signaling off last.",
    c + 0.1, 0.55, 13);
  sources(s, "Sources: Guide, Steps 11 and 12, \"Rollback\"; Global Secure Access logs and monitoring; Security operations for network access; Common operations for Global Secure Access.");
  notes(s,
`Steps eleven and twelve make it a migration. Ring zero is the implementing team. Ring one is a pilot of fewer than twenty users, for ten business days. Ring two is about ten percent, including one branch, for twenty. Ring three is everyone, in waves, and a V P N route is removed only after its wave holds. The emergency access group is excluded from every policy, and tested at the start of each ring. Rolling back runs newest first: policies to report-only, security profile links removed, the wave's group out of the profiles, the V P N route restored, and signaling turned off last. Telemetry comes before any of it. Learn keeps traffic logs in the service for thirty days, so a diagnostic setting exports the four network categories to the workspace, and a freshness query runs daily. A sudden drop in traffic volume is an alert in itself: it covers offboarding, a disabled profile, or an outage.`,
  `${G} — Step 11 (11.1 rings and change safety, 11.2 to 11.4), Step 12 (12.1 to 12.3, Validate), "Rollback"; Microsoft Learn — "Global Secure Access logs and monitoring," "Security operations for network access," "Common operations for Microsoft Entra Global Secure Access"; Book 12, Chapter 03.`);
}

// ================================================================== 16 How: dangers, open questions, next
{
  const s = content(SHOW, "Dangers, open questions and where to go next");
  tag(s, "How");
  const tb = table(s, "Dangers", 1.4, [4.6, 7.55], ["Danger", "The guard"], [
    ["Building in GCC High or DoD", "Step 1 stops; the compensating path recorded"],
    ["Compliant network enforced before the client is everywhere", "Report-only for 10 days; ring by ring; the client coverage metric first"],
    ["Emergency access caught by a block policy", "The excluded group on every policy; a quarterly sign-in test"],
    ["Quick Access left as a VPN-wide range", "Application discovery; per-app moves; Quick Access residual to zero"],
    ["TLS inspection CA from the authentication PKI", "A dedicated issuing CA"],
    ["VPN web path retired without CISA telemetry agreed", "Step 12.3 before ring 3"],
  ], { fontSize: 11, limit: 4.6 });
  const p1 = panel(s, "Open", 0.6, tb + 0.15, W2, null, HEX.red, HEX.redTint, "WHAT COULDN'T BE VERIFIED", null, [
    "Per-feature government-cloud availability; profile assignment through Graph",
    "Report-only with security profiles; TlsStatus values; nothing run in a tenant",
  ], 11.5);
  const p2 = panel(s, "Next", 0.6 + W2 + G2, tb + 0.15, W2, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", null, [
    "Book 09, Ch 05: what Global Secure Access is and its gates",
    "Book 04, Ch 07; Book 12, Ch 03; the guide's implementation checklist",
  ], 11.5);
  fit("Close panels", Math.max(p1, p2));
  sources(s, "Sources: Guide, \"Dangers and how to avoid them,\" \"What couldn't be verified,\" \"Implementation checklist,\" \"Back to the books.\"");
  notes(s,
`To close, the dangers. Building in G C C High or D O D, where the service isn't yet supported. Enforcing the compliant network before the client is everywhere in scope. Catching the emergency access accounts in a block policy. Leaving Quick Access as a V P N-wide range, which is the old lateral movement exposure under a new name. Issuing the T L S inspection certificate from the authentication P K I. And retiring the V P N's web path before CISA telemetry is agreed. Each has its guard in the steps. The guide is plain about what it couldn't verify: government-cloud availability feature by feature, assigning users to a traffic profile through Graph, whether report-only policies apply security profiles, and the T L S status values. Nothing was run in a tenant. To go further, read Network and Transport, chapter five; the Conditional Access library in Access and Privilege; and Security Operations and Telemetry, chapter three. Thank you.`,
  `${G} — "Dangers and how to avoid them," "What couldn't be verified," "Implementation checklist," "Back to the books"; Book 09, Chapter 05; Book 04, Chapter 07; Book 12, Chapter 03.`);
}
endModule(SHOW);

// ================================================================== Backup
backup();
sourceSlide("Sources: the guide and Microsoft Learn", [
  "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide (companion guide, draft): \"How to read this guide,\" \"Government cloud and licensing,\" \"TIC 3.0 alignment,\" \"The reference architecture,\" Steps 1 to 12, \"RACI,\" \"Evidence catalog,\" \"Metrics,\" \"Dangers,\" \"What couldn't be verified.\" Its verification log lists every claim.",
  "Microsoft Learn, read November 11, 2026: What is Global Secure Access?; Known limitations for Global Secure Access; Global Secure Access traffic forwarding profiles; Install the Global Secure Access client for Windows; Source IP restoration; Enable compliant network check with Conditional Access; Turn on Universal Tenant Restrictions.",
  "Microsoft Learn: Internet Access using Microsoft Graph APIs; Private Access using Microsoft Graph APIs; Private Access for domain controllers; Configure TLS inspection policies; TLS inspection with your own certificate; Microsoft Graph network access APIs (preview); reports: getDeviceUsageSummary.",
  "Microsoft Learn, operations: Common operations for Global Secure Access; Global Secure Access operations guide; Operate Microsoft Entra Internet Access; Global Secure Access logs and monitoring; Security operations for network access; Zero Trust: Protect networks.",
]);
sourceSlide("Sources: federal requirements and the books", [
  "CISA TIC 3.0 Remote User Use Case v2.2; TIC 3.0 Branch Office Use Case v3.0; CISA SASE guide. OMB M-26-14 (as the use case cites it).",
  "Federal requirements: NIST SP 800-53 Rev. 5 (SC-7, AC-3, AC-4, AC-6, AC-17, AC-20, IA-2, SC-8, SC-12, SI-4, AU-2, AU-6, CM-3, CP-2); FedRAMP 20x KSIs (the guide's mapping is design guidance).",
  "Book 09, Ch 03 (what TIC 3.0 requires), Ch 05 (SD-WAN, SASE and governed-path transport), Ch 12 (Microsoft 365 traffic); Book 04, Ch 07 and App. C; Book 10, Ch 04; Book 11, Ch 10; Book 12, Ch 03.",
]);

finish(OUT);
