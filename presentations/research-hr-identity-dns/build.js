// DNS for HR-Driven Identity Across Clouds.  A ~17-minute plain-language EXPLAINER for a federal architect still learning DNS.
//   1 Title · 2 The HR-driven chain, end to end · 3 Almost every name is public and vendor-owned · 4 What must resolve where
//   5 Government clouds use different names · 6 Oracle: private access is routing, not DNS · 7 Amazon Connect and VMware
//   8 The clouds disagree on precedence · 9 How it breaks · 10 Hub, not mesh · 11 What the agency must do (program design guidance)
//   12 Decisions, next steps and where this fits
//   Backup (not narrated): full "what must resolve where" table, full failure-mode table, what couldn't be verified, full source lists.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_HR_Identity_DNS.pptx
// Modeled on presentations/research-device-naming/build.js and reuses the shared kit in ../_build/ (icons and backgrounds unchanged).
// Every fact comes from C:\tmp\ib\research_hr_dns.md (primary; all sources opened 2026-10-22; "(excerpt)" caveats kept),
// Book 03 Ch03 and Ch05, Book 08 Ch02, Ch07, Ch08 and Ch10 (docs/books/), and C:\tmp\ib\research_multicloud.md.
// Recommendations are labeled PROGRAM DESIGN GUIDANCE; inferences are labeled as such; vendor documentation is named as such.
// Items the brief couldn't verify are kept out of the claims and listed on a backup slide.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const path = require("path");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "DNS for HR-Driven Identity Across Clouds", title: "Explainer",
  footer: "DNS for HR-Driven Identity Across Clouds  ·  Explainer  ·  Research — under review" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Research_HR_Identity_DNS.pptx";

// ------------------------------------------------------------------ helpers (as in the Trinzic research deck)
const WPM = 142;
let clock = 0, words = 0;
const per = [];
const titles = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; per.push({ slide: pres.slides.length, n });
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nSources: ${ref}`);
};
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6;
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const sources = (s, text, y = 6.62) => {
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

const T = (s, name, t, o) => {
  const size = o.fontSize || 14;
  const runs = typeof t === "string" ? [{ text: t, options: {} }] : t;
  const paras = []; let cur = { chars: 0, size };
  runs.forEach((r) => {
    const ro = r.options || {}; const sz = ro.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / size);
    if (ro.breakLine || ro.bullet) { paras.push(cur); cur = { chars: 0, size }; }
  });
  if (cur.chars) paras.push(cur);
  const need = paras.reduce((h, p) => h + lines("x".repeat(Math.round(p.chars)), o.w - 0.1, p.size) * p.size / 72 * 1.2 + (o.paraSpaceAfter || 0) / 72, 0);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
  return txt(s, name, t, o);
};

const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.32, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`slide ${pres.slides.length} ${name} table`, bottom);
  return bottom;
};

const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.34 : 0) + (runs.length ? 0.08 : 0);
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.05, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

const subhead = (s, name, text, x, y, w, color = HEX.slate) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color });

// Diagram pieces: a labeled box (node) and an arrow (line with a triangle head) between two points.
const node = (s, name, x, y, w, h, color, tint, headText, body, pt = 11.5) => {
  box(s, name, x, y, w, h, tint, color);
  const runs = [{ text: headText, options: { bold: true, color, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!body } }];
  if (body) runs.push({ text: body, options: { fontSize: pt, color: HEX.ink } });
  T(s, `${name} text`, runs, { x: x + 0.1, y: y + 0.07, w: w - 0.2, h: h - 0.14, fontSize: pt, paraSpaceAfter: 1, valign: "middle" });
};
const arrow = (s, name, x1, y1, x2, y2, color = HEX.slate, both = false) => {
  s.addShape(pres.shapes.LINE, { objectName: name, x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color, width: 2, endArrowType: "triangle" }, both ? { beginArrowType: "triangle" } : {}) });
};
const label = (s, name, text, x, y, w, color = HEX.slate, align = "center") =>
  txt(s, name, text, { x, y, w, h: 0.28, fontSize: 10.5, italic: true, color, align, valign: "middle" });


const SEC = "Explainer";

// ================================================================== 1 Title
{
  const s = titleSlide(SEC, "DNS for HR-Driven Identity Across Clouds", "Oracle, Azure, AWS and on-premises  ·  Research — under review");
  txt(s, "Session map", [
    { text: "ABOUT 17 MINUTES  ·  BUILT FOR ARCHITECTS STILL LEARNING DNS", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The HR-to-identity chain  ·  Which names are public, which are yours", options: { color: HEX.ink, breakLine: true } },
    { text: "Government clouds, Oracle, Amazon Connect and VMware  ·  How it breaks", options: { color: HEX.ink, breakLine: true } },
    { text: "Hub, not mesh  ·  What the agency must do, and what's still open", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Microsoft Learn, Oracle, AWS, Broadcom and Infoblox NIOS 9.1 docs; FedRAMP Marketplace data; Books 03 and 08. All opened Oct. 22, 2026.", 6.08);
  notes(s,
`Federal HR 2.0, the program OPM runs, moves agencies' core HR records onto one Oracle platform. If an agency builds HR-driven identity on top of it, so that a hire in HR becomes an account and a departure removes one, the data crosses Oracle's cloud, Microsoft's cloud, the agency's own network, and possibly AWS. Every one of those hops starts with a DNS lookup. DNS, the domain name system, turns a name into a network address.

This explainer answers three questions. Which names must resolve where? What breaks? And when do you need private DNS or forwarding, instead of ordinary public DNS? It's built for architects still learning, so terms are defined as we go.

This is research under review. Every fact comes from sources opened on October twenty-second, 2026, mostly vendor documentation. A few Microsoft facts come from search excerpts of Microsoft Learn pages rather than full pages, and I'll say so when they come up. Where I drew a conclusion that no source states directly, I'll call it an inference. And recommendations are labeled program design guidance.`,
  "Research brief, DNS for HR-driven identity across Oracle, Microsoft, on-premises, VMware and AWS (verified Oct. 22, 2026), Method and Bottom line; Book 03 Ch03 (OPM as the Federal HR 2.0 program owner); Book 08.");
}

// ================================================================== 2 The chain, end to end
{
  const s = content(SEC, "The HR-driven chain, end to end");
  tag(s, "What");
  const y1 = 1.55, h1 = 1.4, w = 2.7, xs = [0.6, 3.75, 6.9, 10.05];
  node(s, "Fusion", xs[0], y1, w, h1, HEX.amber, HEX.amberTint, "Oracle Fusion Cloud HCM", "HR system as a service; changes leave as extracts or Atom feeds", 11);
  node(s, "MW", xs[1], y1, w, h1, HEX.navy, HEX.navyTint, "Middleware", "Oracle Integration (OIC), Azure Functions, Logic Apps or Data Factory", 11);
  node(s, "API", xs[2], y1, w, h1, HEX.teal, HEX.tealTint, "Entra inbound provisioning", "Graph /bulkUpload, then the Entra provisioning service", 11);
  node(s, "Entra", xs[3], y1, w, h1, HEX.teal, "FFFFFF", "Microsoft Entra ID", "Cloud user accounts", 11);
  arrow(s, "A1", xs[0] + w, y1 + h1 / 2, xs[1], y1 + h1 / 2, HEX.amber);
  label(s, "A1 l", "pulls", xs[0] + w, y1 + 0.2, xs[1] - xs[0] - w);
  arrow(s, "A2", xs[1] + w, y1 + h1 / 2, xs[2], y1 + h1 / 2, HEX.navy);
  label(s, "A2 l", "SCIM", xs[1] + w, y1 + 0.2, xs[2] - xs[1] - w);
  arrow(s, "A3", xs[2] + w, y1 + h1 / 2, xs[3], y1 + h1 / 2, HEX.teal);
  const y2 = 3.45, h2 = 1.25;
  node(s, "AD", xs[1], y2, w, h2, HEX.navy, "FFFFFF", "Active Directory", "While it exists: hybrid users", 11);
  node(s, "Agent", xs[2], y2, w, h2, HEX.teal, HEX.tealTint, "Provisioning agent", "On-premises server; outbound connections only", 11);
  node(s, "LCW", xs[3], y2, w, h2, HEX.teal, HEX.tealTint, "Lifecycle Workflows", "Joiner and leaver tasks on hire and leave dates", 11);
  arrow(s, "A4", xs[2] + w / 2, y1 + h1, xs[2] + w / 2, y2, HEX.teal);
  arrow(s, "A5", xs[2], y2 + h2 / 2, xs[1] + w, y2 + h2 / 2, HEX.teal);
  arrow(s, "A6", xs[3] + w / 2, y1 + h1, xs[3] + w / 2, y2, HEX.teal);
  T(s, "Legend", [
    { text: "DNS view: ", options: { bold: true, color: HEX.navy } },
    { text: "every arrow in the top row crosses a vendor's public name. The agent-to-AD hop is the one that needs internal DNS: it finds domain controllers through AD's service (SRV) records (inference)." },
  ], { x: 0.6, y: 3.45, w: 2.75, h: 1.95, fontSize: 11.5 });
  callout(s, "Takeaway", 5.55, 0.85, "FaRoute", HEX.navy, "In this pattern the middleware pulls from Oracle. ", "So the middleware's DNS and internet path are part of the HR pipeline.");
  sources(s, "Sources: Microsoft Learn Oracle HCM provisioning tutorial [S1], bulkUpload [S5], agents [S6, S8 (excerpt)], Lifecycle Workflows [S11 (excerpt)]; Oracle Atom [S18]; Book 03 Ch05.");
  notes(s,
`Here's the chain end to end, as Microsoft's Oracle tutorial and Book 03 describe it.

It starts in Oracle Fusion Cloud HCM, the HR system Oracle runs as a service. HCM means human capital management. Changes leave Fusion as extracts, or as Atom feeds, which are lists of recent changes that another program polls. In this pattern, the middleware pulls from Oracle.

The middleware is the program in the middle. Microsoft says it can run in Oracle Integration Cloud, called OIC, or in Azure as an Azure Function, a Logic App, or a Data Factory pipeline. It turns HR records into a standard format called SCIM and posts them to Microsoft Graph, Microsoft's main API, at an endpoint called bulkUpload. That's Entra's API-driven inbound provisioning.

The Entra provisioning service then writes the user into Entra ID. For users who still live in Active Directory, it hands the change to a provisioning agent: a small service on an on-premises server that makes outbound connections only, and writes into AD. Lifecycle Workflows then run joiner and leaver tasks on the hire and leave dates.

Notice the DNS pattern. Every arrow in the top row crosses a vendor's public name. Only the agent-to-AD hop needs internal DNS.`,
  "Microsoft Learn: Configure Oracle HCM for automatic user provisioning [S1], Perform bulkUpload [S5], On-premises application provisioning architecture [S6 (excerpt)], Plan cloud HR application to Entra user provisioning [S8 (excerpt)], Lifecycle workflows attribute sync [S11 (excerpt)]; Oracle, Working with Atom [S18]; Book 03 Ch05, Provisioning Services.");
}

// ================================================================== 3 The key idea
{
  const s = content(SEC, "Almost every name is public and vendor-owned");
  tag(s, "What");
  panel(s, "Public", 0.6, 1.5, 5.95, 3.85, HEX.teal, HEX.tealTint, "VENDOR-OWNED PUBLIC NAMES", "Resolve them; never host or shadow them", [
    "Oracle Fusion host: <env>.fa.ocs.oraclecloud.com",
    "Microsoft Graph and the Entra sign-in hosts",
    "The provisioning agent's relay names",
    "Amazon Connect names that agents' browsers use",
    "Job: resolve correctly from every resolver a component can reach",
  ], 12.5);
  panel(s, "Private", 6.8, 1.5, 5.95, 3.85, HEX.navy, HEX.navyTint, "PRIVATE DNS OR FORWARDING", "Needed in only four places", [
    "1  Agency-owned names: AD domains and their SRV records, evidence stores, internal HR and identity APIs, vCenter and ESXi",
    "2  Cloud private endpoints the middleware uses (for example, storage behind Azure Private Link)",
    "3  Cloud private zones that on-premises systems must read",
    "4  AWS interface endpoints with private DNS",
  ], 12.5);
  callout(s, "Takeaway", 5.55, 0.85, "FaLightbulb", HEX.amber, "Rule of thumb: ", "private DNS is for your own names and your private endpoints. Everything else is public resolution.");
  sources(s, "Sources: research brief, Bottom line 1–2 [S2, S4, S10, S20, S23, S27–S29, S31, S36]; Book 08 Ch07, Ch08; prior multi-cloud research [S57].");
  notes(s,
`That leads to the key idea of this talk. Almost every name in this path is public and owned by a vendor. The Fusion host, which looks like your environment's name, then dot f-a dot o-c-s dot oraclecloud dot com. Microsoft Graph and the Entra sign-in hosts. The provisioning agent's relay names. And the Amazon Connect names that contact-center agents' browsers use.

The agency's job is to resolve those correctly from every resolver a component can reach. A resolver is the DNS server a machine asks. The agency must never host or shadow those names in a private zone of its own. We'll see why on the failure slide.

Private DNS is needed, along with forwarding, which means one resolver passing a query to another that knows the answer, in only four places. One: names the agency owns, like AD domains and their service records, the middleware's evidence store, internal HR or identity APIs, and VMware hosts. Two: cloud private endpoints the middleware uses, such as a storage account behind Azure Private Link, which gives a cloud service a private address in your network. Three: cloud private zones that on-premises systems must read. Four: AWS interface endpoints with private DNS.

Everything else is ordinary public resolution.`,
  "Research brief, Bottom line items 1 and 2, citing Microsoft Learn [S2, S4, S10], Oracle [S20, S23], AWS [S27–S29, S31], Broadcom [S36]; Book 08 Ch07 and Ch08; research_multicloud.md [prior-M S57].");
}

// ================================================================== 4 What must resolve where
{
  const s = content(SEC, "What must resolve where");
  tag(s, "Who");
  table(s, "Where", 1.45, [2.75, 4.0, 1.35, 4.05], ["Component", "Names it must resolve", "Answer", "How it gets the answer"], [
    ["HR middleware (Functions or Logic Apps Standard, in a virtual network)", "Fusion host; Graph and sign-in for your cloud", "Public", "Agency resolver, recursive; no private zone"],
    ["", "Its evidence store and key vault behind private endpoints", "Private", "Linked privatelink zone, or WEBSITE_DNS_SERVER → a resolver that forwards to Azure"],
    ["Lifecycle Workflow extension (Consumption Logic App)", "Public targets only (inference)", "Public", "Multitenant; no virtual network"],
    ["Provisioning agent (on-premises)", "AD domain controller locators (SRV)", "Private", "Internal resolver: AD DNS, later the Grid"],
    ["", "Microsoft relay, sign-in, CRL and OCSP names", "Public", "Recursive through egress; no TLS inspection"],
    ["On-premises clients and servers", "Azure, AWS and Oracle Cloud private names", "Private", "Grid forwards to each cloud's inbound or listening endpoint"],
    ["Fusion private-access users", "<env>.fa.ocs.oraclecloud.com", "Public", "Public DNS; private routing through the Service Gateway"],
    ["Connect flow Lambda (in a VPC)", "Agency HR or identity APIs", "Private", "VPC Resolver outbound rule → Grid"],
    ["vCenter, ESXi, NSX", "Each other's names, forward and reverse", "Private", "Grid A and PTR records"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief §8 [S2, S4, S8, S11b, S13–S15, S20–S24, S29, S30, S36 — several Microsoft rows from excerpts]; Book 08 Ch07, Ch08. Full table in Backup.");
  notes(s,
`This table condenses the brief's what-must-resolve-where table. The full version is in the backup.

The HR middleware, if it runs as Azure Functions or Logic Apps Standard joined to a virtual network, resolves the Fusion host, Graph and sign-in publicly, through the agency's resolver. Its evidence store and key vault sit behind private endpoints, so it needs a linked private zone, or a resolver that forwards to Azure. Microsoft documents an app setting, WEBSITE_DNS_SERVER, for pointing the app at your own DNS server.

Lifecycle Workflow extensions run in Consumption Logic Apps, the multitenant kind. As an inference, they can reach only public names.

The provisioning agent resolves domain controller locator records internally, and Microsoft's relay and sign-in names publicly.

On-premises systems reach cloud private names by forwarding from the Grid, meaning the Infoblox appliances, to each cloud's inbound endpoint: an address inside the cloud network that accepts queries from outside. Fusion users on Oracle's private access still get Fusion's public DNS answer. A Lambda function in a VPC, a virtual private cloud, reaches agency APIs through an outbound rule to the Grid. And vCenter and ESXi need forward and reverse records, A and PTR, in the Grid.`,
  "Research brief §8, What must resolve where, and the sources in each row: Microsoft Learn [S2, S4, S4b (excerpt), S8 (excerpt), S11b (excerpt), S13–S15 (excerpts)]; Oracle [S20–S24]; AWS [S29, S30]; Broadcom [S36]; Book 08 Ch07 and Ch08; research_multicloud.md [prior-M S31, S57].");
}

// ================================================================== 5 Government-cloud names differ
{
  const s = content(SEC, "Government clouds use different names");
  tag(s, "Why");
  table(s, "Graph", 1.45, [2.6, 3.3, 2.75], ["Microsoft 365 environment", "Microsoft Graph", "Sign-in"], [
    ["GCC", "graph.microsoft.com (worldwide)", "login.microsoftonline.com"],
    ["GCC High", "graph.microsoft.us", "login.microsoftonline.us"],
    ["The higher government cloud", "a separate .us Graph host", "login.microsoftonline.us"],
  ], { fontSize: 11.5 });
  T(s, "Tokens", [
    { text: "Microsoft: ", options: { bold: true, color: HEX.red } },
    { text: "access tokens from one national cloud \"are not interchangeable\" with another." },
  ], { x: 0.6, y: 3.2, w: 8.65, h: 0.32, fontSize: 12 });
  table(s, "Agent", 3.65, [1.9, 3.3, 3.45], ["Provisioning agent", "Public cloud (also GCC)", "U.S. Government cloud"], [
    ["Service relay", "*.msappproxy.net, *.servicebus.windows.net", "*.msappproxy.us, *.servicebus.usgovcloudapi.net"],
    ["Certificate checks (port 80)", "crl.microsoft.com, ocsp.msocsp.com and others", "crl.microsoft.us, ocsp.msocsp.us and others"],
  ], { fontSize: 11 });
  panel(s, "Agent rules", 9.5, 1.5, 3.25, 4.85, HEX.navy, HEX.navyTint, "THE AGENT'S NETWORK RULES", null, [
    "Outbound 443 for service traffic; 80 for certificate revocation lists",
    "No inbound ports",
    "Per Microsoft Learn (excerpt): public DNS is a CNAME chain; avoid inline TLS inspection",
    "Per Microsoft Learn (excerpt): installs to the default Azure environment unless told otherwise",
  ], 11.5);
  sources(s, "Sources: Microsoft Learn Graph national clouds [S2]; cloud sync prerequisites [S4]; troubleshooting [S4b (excerpt)]; agent install [S7 (excerpt)]; agents [S6 (excerpt)].");
  notes(s,
`Next, the government clouds use different names, and getting this wrong fails quietly.

Microsoft Graph has a separate address per cloud. A GCC tenant, Microsoft's government community cloud, keeps using the worldwide endpoints: graph dot microsoft dot com, and login dot microsoftonline dot com. A GCC High tenant uses graph dot microsoft dot us, and login dot microsoftonline dot us. The higher government cloud has its own Graph host and the same dot-us sign-in. Microsoft says access tokens from one national cloud aren't interchangeable with another's.

The provisioning agent has its own list. In the public cloud, which GCC tenants also use, it reaches relay names under msappproxy dot net and servicebus dot windows dot net. In the U.S. Government cloud those become msappproxy dot us and servicebus dot usgovcloudapi dot net, with dot-us certificate-check names too.

The agent uses outbound port 443 for service traffic and port 80 for certificate revocation lists, and needs no inbound ports. Per Microsoft Learn, from search excerpts: public DNS for these names is a chain of CNAME records, you should avoid inline TLS inspection, meaning a proxy that decrypts the traffic, and the agent installs to the default Azure environment unless told otherwise.

So keep a per-cloud list of names, and test through the real egress path.`,
  "Microsoft Learn: Microsoft Graph national cloud deployments [S2]; Prerequisites for Microsoft Entra Cloud Sync, firewall and proxy requirements [S4]; Cloud sync troubleshooting [S4b (excerpt)]; On-premises application provisioning architecture [S6 (excerpt)]; Install the provisioning agent and Hybrid identity considerations for Azure Government [S7 (excerpt)].");
}

// ================================================================== 6 Oracle
{
  const s = content(SEC, "Oracle: private access is routing, not DNS");
  tag(s, "Why");
  const y = 1.55, h = 1.15, w = 2.7, xs = [0.6, 3.75, 6.9, 10.05];
  node(s, "O1", xs[0], y, w, h, HEX.navy, HEX.navyTint, "On-premises", "Private addresses", 11);
  node(s, "O2", xs[1], y, w, h, HEX.navy, "FFFFFF", "FastConnect or VPN", "BGP exchanges the routes", 11);
  node(s, "O3", xs[2], y, w, h, HEX.amber, HEX.amberTint, "VCN Service Gateway", "Transit routing; no inbound connections", 11);
  node(s, "O4", xs[3], y, w, h, HEX.amber, "FFFFFF", "Oracle Services Network", "The region's public IP ranges", 11);
  [0, 1, 2].forEach((i) => arrow(s, `O a${i}`, xs[i] + w, y + h / 2, xs[i + 1], y + h / 2, HEX.slate));
  T(s, "O dns", [
    { text: "DNS doesn't change. ", options: { bold: true, color: HEX.red } },
    { text: "Neither Oracle page describes a DNS change; the Fusion name keeps its public answer (inference). Don't create a private zone for Fusion. Turn off content acceleration (Oracle's caching)." },
  ], { x: 0.6, y: 2.85, w: 12.15, h: 0.62, fontSize: 12 });
  panel(s, "Atom", 0.6, 3.6, 5.95, 2.75, HEX.red, HEX.redTint, "ATOM FEEDS", "Outages can lose events", [
    "Oracle: \"Atom server data can be periodically purged\"",
    "Microsoft: delaying Atom feeds \"can lead to loss of changes\"",
    "Inference: a middleware DNS or egress outage longer than the purge window loses HR events; reconcile against full extracts",
  ], 12);
  panel(s, "Gov", 6.8, 3.6, 5.95, 2.75, HEX.navy, HEX.navyTint, "FEDRAMP AND GOVERNMENT REGIONS", null, [
    "FedRAMP Marketplace: Oracle \"Fusion Cloud\", FedRAMP Moderate, SaaS",
    "Oracle Cloud government regions: private DNS zones supported; \"Public DNS isn't available\"",
    "Which Oracle environment hosts a given agency tenant: not verified (Backup)",
  ], 12);
  sources(s, "Sources: Oracle Fusion network setup [S21], transit routing [S22], Atom [S18], US Government Cloud [S26]; Microsoft Learn [S1]; FedRAMP Marketplace data, products.json [S40].");
  notes(s,
`Now Oracle, and a common mistake.

Oracle Fusion offers private access from on-premises, which Oracle describes as reaching your environment without going through the internet. It sounds like a DNS feature. It isn't. It's routing. Traffic goes over FastConnect, Oracle's private circuit, or a site-to-site VPN, into an Oracle virtual cloud network, a VCN. From there it goes through the VCN's Service Gateway to the Oracle Services Network's public IP ranges. You add an access rule for the VCN and turn off content acceleration, Oracle's caching. Neither Oracle page says anything about DNS. As an inference, the Fusion name keeps its public answer. So don't build a private zone for Fusion.

Second, Atom feeds. Oracle says Atom data can be periodically purged, and Microsoft warns that delaying Atom feeds can lose changes. As an inference, if the middleware loses DNS or internet access for longer than the purge window, HR events are lost. Middleware DNS is a correctness issue, not just uptime. Reconcile against full extracts.

Third, FedRAMP. The Marketplace lists Oracle Fusion Cloud at FedRAMP Moderate. Oracle's government cloud regions support private DNS zones, but public DNS isn't available there. Which Oracle environment hosts a given agency's tenant wasn't verified.`,
  "Oracle: OCI Fusion Applications, Securely Accessing Fusion Applications [S21]; Transit Routing for Private Access to Oracle Services [S22]; REST API for Fusion Cloud HCM, Working with Atom [S18]; US Government Cloud with FedRAMP authorization [S26]; Microsoft Learn, Oracle HCM provisioning tutorial [S1]; FedRAMP Marketplace products.json, record F1603257882 [S40].");
}

// ================================================================== 7 Amazon Connect and VMware
{
  const s = content(SEC, "Amazon Connect and VMware");
  tag(s, "Who");
  panel(s, "Connect", 0.6, 1.5, 4.05, 4.85, HEX.amber, HEX.amberTint, "AMAZON CONNECT AGENTS", "Public endpoints", [
    "AWS: agent traffic \"traverses the public WAN\"",
    "Allowlist by domain: <instance>.my.connect.aws, telemetry, participant, transport",
    "Voice media relays (TURN): TurnNlb-*.elb.<region>.amazonaws.com, UDP 3478",
    "Can't resolve TURN names → the softphone can't set up its media channel",
  ], 11.5);
  panel(s, "Gov", 4.8, 1.5, 4.05, 4.85, HEX.navy, HEX.navyTint, "GOVCLOUD AND PRIVATE PATHS", null, [
    "Connect in GovCloud: US-West only; names under *.govcloud.connect.aws",
    "Not there: Customer Profiles, Cases, outbound campaigns, email, AI agents and others; no cross-partition integration",
    "PrivateLink covers a subset of Connect APIs (inference: API calls, not the agent or voice path)",
    "A Lambda in a VPC reaches only that VPC without NAT",
  ], 11.5);
  panel(s, "VMware", 9.0, 1.5, 3.75, 4.85, HEX.teal, HEX.tealTint, "VMWARE", "Forward and reverse records", [
    "Broadcom KB: changing vCenter's hostname or IP runs forward and reverse DNS lookups",
    "The change is blocked if the name doesn't fully resolve",
    "Fix the A and PTR records first; keep them in the Grid",
  ], 11.5);
  sources(s, "Sources: AWS Connect CCP networking [S27], GovCloud Connect [S28], Connect interface endpoints [S29], Lambda in a VPC [S30]; Broadcom KB 440783 [S36].");
  notes(s,
`Two more components: Amazon Connect, AWS's contact center service, and VMware.

Connect agents work in a browser, in the Contact Control Panel, and AWS says that traffic traverses the public network. AWS prefers a domain allowlist: the instance name under my dot connect dot aws, plus telemetry, participant and transport names, and media names for TURN, a relay that carries the call audio, on UDP port 3478. If agents' DNS can't resolve those TURN names, the softphone can't set up its media channel. So don't over-restrict DNS for agents.

In AWS GovCloud, Connect is available only in the US-West region. It uses names under govcloud dot connect dot aws, has no cross-partition integration with commercial regions, and lacks several features, including Customer Profiles, Cases and outbound campaigns.

AWS PrivateLink, which gives an AWS API a private address inside your network, covers only a subset of Connect APIs. As an inference, that helps workloads making API calls, not the agent or voice path. A Lambda function attached to a VPC can reach only that VPC unless you add NAT or interface endpoints.

VMware: a Broadcom knowledge article says changing vCenter's hostname or address runs forward and reverse DNS lookups, and the change is blocked if the name doesn't fully resolve. Keep those records right in the Grid.`,
  "AWS: Amazon Connect, Set up your network for the CCP [S27]; AWS GovCloud (US) User Guide, Connect Customer [S28]; Amazon Connect and interface VPC endpoints [S29]; AWS Lambda, Giving functions access to resources in a VPC [S30]; Broadcom KB 440783, VAMI hostname or IP change fails [S36].");
}

// ================================================================== 8 Precedence
{
  const s = content(SEC, "The clouds disagree on precedence");
  tag(s, "Why");
  T(s, "Setup", [
    { text: "Same network, same name: ", options: { bold: true, color: HEX.navy } },
    { text: "a private zone AND a forwarding rule both cover it. Which answer wins?" },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.35, fontSize: 14 });
  const cols = [
    ["AWS", HEX.amber, HEX.amberTint, "The Route 53 Resolver rule wins", ["The rule beats the private hosted zone", "A matching private zone with no record returns NXDOMAIN; it doesn't go to public DNS"]],
    ["Azure", HEX.teal, HEX.tealTint, "The private zone wins", ["A linked private zone beats the ruleset rule", "Microsoft: the rule is \"silently ignored\""]],
    ["Oracle Cloud", HEX.red, HEX.redTint, "The private view wins", ["Attached views are checked before resolver rules", "\"After an answer is provided, no further items are evaluated, even if the answer is negative\""]],
  ];
  cols.forEach((c, i) => panel(s, c[0], 0.6 + i * 4.1, 1.95, 3.95, 3.35, c[1], c[2], c[0].toUpperCase(), c[3], c[4], 12));
  callout(s, "Takeaway", 5.5, 0.9, "FaScaleBalanced", HEX.navy, "Inference: ", "the same zone and rule give different answers in each cloud. One owner per name, and forward to it, is the only design that behaves the same everywhere.");
  sources(s, "Sources: AWS Route 53 private hosted zone considerations [S25]; Microsoft Learn NXDOMAIN troubleshooting [S12 (excerpt)]; Oracle OCI Private DNS [S23].");
  notes(s,
`Here's the subtle one. Suppose a cloud network has both a private zone and a forwarding rule for the same name. Which wins? The three clouds disagree.

In AWS, the Route 53 Resolver rule wins over the private hosted zone.

In Azure, a linked private DNS zone wins, and, per Microsoft Learn, the forwarding-ruleset rule is silently ignored.

In Oracle Cloud, the attached private views are checked before resolver rules. Once a view answers, evaluation stops, even if the answer is negative.

That word negative matters. A private zone can shadow a name. If the zone covers a name but has no record for it, it returns NXDOMAIN, which means the name doesn't exist, instead of asking anyone else. All three clouds document that behavior.

So, as an inference, the same zone and the same rule give different answers in each cloud. The only design that behaves the same everywhere is one owner per name. The Grid owns agency zones. Each cloud owns its own private zones. Everything else forwards to the owner. Never put a zone and a rule for the same name in one network, and test resolution from every origin, because a configuration that works in one cloud can fail in the next.`,
  "AWS, Route 53, Considerations when working with a private hosted zone [S25]; Microsoft Learn, Troubleshoot NXDOMAIN from an Azure Private DNS zone [S12 (excerpt)]; Oracle, OCI Private DNS [S23]; research brief, Bottom line 4 and failure mode F3.");
}

// ================================================================== 9 How it breaks
{
  const s = content(SEC, "How it breaks: seven failure modes");
  tag(s, "Why");
  table(s, "Fail", 1.45, [2.6, 5.0, 4.55], ["Failure", "What you see", "Prevention"], [
    ["Shadowing a vendor zone", "A private zone for, say, oraclecloud.com returns NXDOMAIN for every name not copied into it", "Never create private zones for vendor domains"],
    ["Privatelink name resolves publicly", "Rule missing or slow; per a Microsoft Learn excerpt, Windows forwarders to Azure need a timeout above 4 seconds", "Forward the public service zone; raise timeouts; alert on public answers"],
    ["Grid falls back to the internet", "NIOS: with \"Use Forwarders Only\" off, failed forwarders → root hints (inference: a public answer)", "Turn on \"Use Forwarders Only\" for cloud private zones (inference)"],
    ["Forwarding loops", "Azure: a rule targeting an inbound endpoint, linked to that endpoint's own network", "One authoritative path per namespace; review for cycles"],
    ["TLS name mismatch", "Connecting by private name or IP fails certificate checks (inference)", "Keep the public FQDN in every connection string"],
    ["Wrong cloud's endpoints", "A GCC High tenant calling the worldwide Graph fails", "Per-cloud endpoint inventory"],
    ["Resolver capacity", "Route 53: 10,000 queries/s per endpoint IP, as low as 1,500 with connection tracking", "Size before each onboarding wave"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: Microsoft Learn [S2, S10, S10b, S12, S14b — excerpts]; AWS [S25, S32]; Oracle [S23]; Infoblox NIOS 9.1 [S37]; Book 08 Ch02, Ch10. Full table in Backup.");
  notes(s,
`How does this break? Here are seven failures from the brief's table of sixteen. The full table is in the backup.

One, shadowing. Someone creates a private zone for a vendor's domain, say oraclecloud dot com, and every name not copied into it returns NXDOMAIN.

Two, silent fallback. A private endpoint name resolves to the public address, because a forwarding rule is missing or slow. Per a Microsoft Learn excerpt, Windows DNS servers that forward to Azure need a forwarder timeout above four seconds, or private records may resolve to public addresses.

Three, the Grid's own fallback. Infoblox documents that if Use Forwarders Only is off and the forwarders fail, the member falls back to resolving from the internet's root servers. As an inference, a failed forward can then return the public answer instead of failing.

Four, loops. Azure warns that a ruleset rule that targets an inbound endpoint must not be linked to the network where that endpoint lives.

Five, TLS name mismatch. Keep the public name in every connection string, because the service's certificate carries it.

Six, the wrong cloud's endpoints, as we saw on the government-cloud slide.

Seven, capacity. A Route 53 Resolver endpoint address handles about ten thousand queries per second, but as few as fifteen hundred with connection tracking. Size endpoints before each onboarding wave.`,
  "Research brief §6, failure modes F1, F4, F5, F6, F9, F10, F11: Microsoft Learn [S2, S10 (excerpt), S10b (excerpt), S12 (excerpt), S14b (excerpt)]; AWS [S25, S32]; Oracle [S23]; Infoblox NIOS 9.1, Specifying Forwarders [S37]; Book 08 Ch02 and Ch10.");
}

// ================================================================== 10 Hub, not mesh
{
  const s = content(SEC, "Hub, not mesh");
  tag(s, "How");
  label(s, "Illus", "ILLUSTRATIVE ARITHMETIC", 0.6, 1.45, 4.0, HEX.red, "left");
  const envs = ["On-premises", "Azure", "AWS", "Oracle Cloud", "VMware"];
  const nw = 1.45, nh = 0.5;
  const ring = (cx, cy, r) => envs.map((_, i) => {
    const a = (-90 + i * 72) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.82];
  });
  const m = ring(2.75, 3.45, 1.45);
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) arrow(s, `Mesh ${i}${j}`, m[i][0], m[i][1], m[j][0], m[j][1], HEX.red, true);
  m.forEach((p, i) => node(s, `M n${i}`, p[0] - nw / 2, p[1] - nh / 2, nw, nh, HEX.red, HEX.redTint, envs[i], null, 8.5));
  T(s, "Mesh cap", [{ text: "Mesh: ", options: { bold: true, color: HEX.red } }, { text: "5 × 4 = up to 20 one-way rule sets" }],
    { x: 0.6, y: 5.0, w: 4.0, h: 0.32, fontSize: 12, align: "center" });
  const hb = ring(7.0, 3.45, 1.45);
  hb.forEach((p, i) => arrow(s, `Hub ${i}`, p[0], p[1], 7.0, 3.45, HEX.teal));
  hb.forEach((p, i) => node(s, `H n${i}`, p[0] - nw / 2, p[1] - nh / 2, nw, nh, HEX.teal, HEX.tealTint, envs[i], null, 8.5));
  node(s, "Hub", 7.0 - 0.7, 3.45 - 0.3, 1.4, 0.6, HEX.navy, HEX.navyTint, "Hub resolver", null, 10.5);
  T(s, "Hub cap", [{ text: "Hub: ", options: { bold: true, color: HEX.teal } }, { text: "about 5 rule sets, one per environment" }],
    { x: 4.95, y: 5.0, w: 4.0, h: 0.32, fontSize: 12, align: "center" });
  T(s, "Vendors", [
    { text: "Vendors document hubs: ", options: { bold: true, color: HEX.navy } },
    { text: "Azure links one ruleset to every spoke; AWS shares Resolver rules through RAM; Oracle shares a view across VCNs. No vendor recommends a full mesh." },
  ], { x: 0.6, y: 5.45, w: 8.35, h: 0.95, fontSize: 11.5 });
  panel(s, "IB", 9.2, 1.5, 3.55, 4.85, HEX.navy, HEX.navyTint, "WHERE INFOBLOX FITS", "The Grid as the hub", [
    "Each Grid member can have its own forwarders for a forward zone",
    "Infoblox reference design: vNIOS in a shared-services hub VPC as a Grid member",
    "Prior research, design guidance: Grid + each cloud's native resolver as the baseline; customer-operated appliances for FedRAMP High",
  ], 11);
  sources(s, "Sources: Microsoft Learn [S10, S10c (excerpts)]; AWS [S33]; Oracle [S23]; Infoblox NIOS 9.1 [S38]; prior multi-cloud research [S27, bottom line]. Arithmetic is illustrative.");
  notes(s,
`With several clouds, how do you wire the forwarding? Every vendor documents a hub. None recommends a mesh.

Azure documents two hub designs: link one forwarding ruleset to every spoke network, or point the spokes at the hub's inbound endpoint. AWS shares Resolver rules from one account through Resource Access Manager. Oracle shares a view across networks in a region.

Here's some illustrative arithmetic. Take five environments: on-premises, Azure, AWS, Oracle Cloud and VMware. In a full mesh, each forwards directly to every other, so you need up to twenty one-way rule sets, five times four. With a hub, you need about five, one per environment pointing at the hub. As an inference, every extra path is one more place for the precedence, fallback and loop failures we just saw.

Where does Infoblox fit? The Grid is a natural hub for agency names. Each Grid member can have its own forwarders for a forward zone, and Infoblox's reference design puts vNIOS, its virtual appliance, in a shared-services hub network as a Grid member. The earlier multi-cloud research, labeled as design guidance, recommends a baseline of the Grid plus each cloud's native resolver, forwarding both ways, with customer-operated appliances for FedRAMP High workloads, because Infoblox's software-as-a-service offering is FedRAMP Moderate only.`,
  "Microsoft Learn, Azure DNS Private Resolver endpoints and rulesets [S10 (excerpt)] and Private resolver architecture [S10c (excerpt)]; AWS, Route 53, Managing forwarding rules [S33]; Oracle, OCI Private DNS [S23]; Infoblox NIOS 9.1, Configuring a Forward Zone [S38]; research_multicloud.md, Bottom line and Option A (Infoblox Shared-Services VPC Deployments [S27]); mesh-versus-hub arithmetic is illustrative.");
}

// ================================================================== 11 What the agency must do
{
  const s = content(SEC, "What the agency must do");
  tag(s, "How");
  T(s, "PDG flag", [
    { text: "PROGRAM DESIGN GUIDANCE — NOT A VENDOR OR STANDARDS REQUIREMENT.  ", options: { bold: true, color: HEX.red } },
    { text: "Condensed from a 13-step checklist." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.32, fontSize: 12 });
  panel(s, "Names", 0.6, 1.9, 4.0, 4.5, HEX.navy, HEX.navyTint, "NAMES AND OWNERS", null, [
    "Inventory every name in the HR path, per cloud",
    "Never create a private zone for a vendor's domain",
    "One owner per agency namespace; everything else forwards",
    "Never a zone and a rule for the same name in one network",
  ], 12);
  panel(s, "Fwd", 4.75, 1.9, 4.0, 4.5, HEX.teal, HEX.tealTint, "FORWARDING", null, [
    "Grid → Azure inbound endpoints in two regions, forwarding the public service zone",
    "\"Use Forwarders Only\" on those zones; Windows forwarder timeouts above 4 seconds",
    "A hub per cloud; review the forwarding graph for loops at every change",
    "Size resolver endpoints before each onboarding wave",
  ], 12);
  panel(s, "Comp", 8.9, 1.9, 3.85, 4.5, HEX.amber, HEX.amberTint, "COMPONENTS AND TESTS", null, [
    "Middleware on a network-joined plan; Lifecycle Workflow extensions to public targets only",
    "Two or more dedicated provisioning agents; no TLS inspection",
    "Middleware DNS is a data-integrity control: reconcile with full extracts",
    "Connect: let TURN names resolve. VMware: A and PTR in the Grid",
    "Test from every origin",
  ], 11.5);
  sources(s, "Sources: research brief §9, Agency checklist steps 1–13 and their cited facts [S1–S38]; Book 03 Ch05; Book 08 Ch02, Ch07, Ch08, Ch10.");
  notes(s,
`So what must the agency do? This is program design guidance, not a vendor requirement, condensed from a thirteen-step checklist.

Names and owners first. Inventory every name in the HR path, per cloud. Never create a private zone for a vendor's domain. Give each agency namespace one owner, and forward everything else. And never let a zone and a rule for the same name exist in one network.

Forwarding. From the Grid, forward each Azure service's public zone, not its privatelink zone, to inbound endpoints in two regions, and set Use Forwarders Only on those zones. Raise Windows forwarder timeouts above four seconds. Run a hub in each cloud, and review the forwarding graph for loops at every change. Size resolver endpoints before each HR 2.0 onboarding wave.

Components. Put the middleware in a Logic Apps Standard or Functions plan joined to a virtual network, using the agency resolver path, and keep Lifecycle Workflow extensions to public targets. Run at least two provisioning agents dedicated to HR provisioning, near preferred domain controllers, with no TLS inspection. Treat middleware DNS as a data-integrity control, and reconcile against full extracts. For Connect, let the TURN names resolve. For VMware, keep A and PTR records in the Grid.

And test from every origin. Any public answer or NXDOMAIN for a private name is a defect.`,
  "Research brief §9, Agency checklist steps 1–13 (all PROGRAM DESIGN GUIDANCE) and the facts each step cites: Microsoft Learn [S1, S2, S4, S4b, S7b, S8, S10, S10c, S11b, S12, S12b, S13–S15, S14b]; Oracle [S18, S21–S23]; AWS [S25, S27–S30, S32, S33]; Broadcom [S36]; Infoblox [S37]; Book 03 Ch03, Ch05; Book 08 Ch02, Ch07, Ch08, Ch10.");
}

// ================================================================== 12 Decisions, next steps, where it fits
{
  const s = content(SEC, "Decisions, next steps and where this fits");
  tag(s, "How");
  panel(s, "Decide", 0.6, 1.5, 4.0, 4.85, HEX.teal, HEX.tealTint, "DECISIONS TO TAKE", null, [
    "Who owns each namespace: the Grid or a cloud",
    "Which middleware platform, and so which network and resolver path",
    "The hub design in each cloud",
    "Whether Oracle private access is needed at all (it's routing)",
  ], 12);
  panel(s, "Next", 4.75, 1.5, 4.0, 4.85, HEX.amber, HEX.amberTint, "NEXT STEPS (OPEN CHECKS)", null, [
    "Which Oracle environment and hostnames the agency's Core HCM tenant uses",
    "Whether /bulkUpload is available in the U.S. Government Graph cloud",
    "Government-cloud availability of Azure DNS Private Resolver, Lifecycle Workflows and Connect PrivateLink",
    "VMware install-guide DNS rules; Oracle's connectivity patterns",
  ], 12);
  panel(s, "Fit", 8.9, 1.5, 3.85, 4.85, HEX.navy, HEX.navyTint, "WHERE IT FITS", null, [
    "Book 03 Ch03: Federal HR 2.0; Ch05: the provisioning pipeline",
    "Book 08 Ch02: split-brain DNS; Ch07: cloud private endpoints; Ch08: reference architecture; Ch10: migration",
    "Research: Trinzic multi-cloud, Infoblox DDI, and device naming after AD",
  ], 12);
  sources(s, "Sources: research brief, Couldn't verify and Agency checklist; Book 03 Ch03, Ch05; Book 08 Ch02, Ch07, Ch08, Ch10; related research items.");
  notes(s,
`The decisions. Who owns each namespace, the Grid or a cloud. Which middleware platform, and so which network and resolver path it uses. The hub design in each cloud. And whether Oracle's private access is needed at all, remembering that it's routing, not DNS.

The next steps are the things I couldn't verify. Which Oracle environment and hostnames the agency's Core HCM tenant will use. Whether API-driven inbound provisioning is available in the U.S. Government Graph cloud. Whether Azure's DNS Private Resolver, Lifecycle Workflows and Connect private endpoints are available in the government clouds. And the VMware install guides' DNS rules and Oracle's own connectivity patterns, which I couldn't open. They're all listed in the backup.

Where does this fit? Book 03 covers HR-driven identity, with Federal HR 2.0 in Chapter 03 and the provisioning pipeline in Chapter 05. Book 08 covers DNS, DHCP and IP address management: split-brain DNS in Chapter 02, cloud private endpoints in Chapter 07, the reference architecture in Chapter 08, and the migration sequence in Chapter 10. Three research items sit beside this one: Trinzic Alone, or Trinzic Plus Cloud DDI; Infoblox DDI for Federal Agencies; and Who Names the Device After AD.

One note on standing: this is research under review, not an endorsement by any federal agency. Thank you.`,
  "Research brief, Couldn't verify and Agency checklist; Book 03 Ch03 and Ch05; Book 08 Ch02, Ch07, Ch08 and Ch10; research items Trinzic Alone, or Trinzic Plus Cloud DDI?, Infoblox DDI for Federal Agencies, and Who Names the Device After AD?");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full tables, open questions and source lists on the following slides. All sources opened Oct. 22, 2026.");
}
const WHERE_HEAD = ["Component (where it runs)", "Names it must resolve", "Answer", "Zone owner", "How it gets the answer"];
const WHERE_W = [2.3, 3.75, 1.2, 1.5, 3.4];
{
  const s = content("Backup", "Resolve where: middleware, workflows, agents");
  table(s, "Where A", 1.45, WHERE_W, WHERE_HEAD, [
    ["HR middleware: Functions or Logic Apps Standard (VNet-integrated)", "<env>.fa.ocs.oraclecloud.com (Atom, REST, extracts) [S20, S19]", "Public", "Oracle", "Agency resolver, recursive; no private zone"],
    ["", "Graph and sign-in for your cloud: worldwide for GCC, .us for GCC High and the higher cloud [S2]", "Public", "Microsoft", "Recursive; allow the AzureActiveDirectory service tag [S16 (excerpt)]"],
    ["", "Evidence store, Key Vault (*.blob.core.windows.net, *.vault.azure.net)", "Private (privatelink)", "Agency (cloud)", "Linked privatelink zone, or WEBSITE_DNS_SERVER → resolver forwarding to Azure [S13, S14 (excerpts)]"],
    ["HR middleware: Oracle Integration", "Fusion host; Graph and sign-in", "Public", "Oracle; Microsoft", "OIC itself; the agent goes over the internet [S24]"],
    ["", "VCN-private targets", "Private", "Agency (OCI)", "Private endpoint, by FQDN [S24]; OCI view or rule [S23]"],
    ["Lifecycle Workflows extension (Consumption Logic App)", "Public targets only (inference)", "Public", "Varies", "Multitenant; no VNet [S11b, S15 (excerpts)]"],
    ["Entra provisioning agent / cloud sync (on-premises)", "AD domain controller locators (SRV, _msdcs)", "Private", "Agency (AD DNS → Grid)", "Internal resolver [S8 (excerpt); Book 08 Ch08 Decision 4]"],
    ["", "*.msappproxy.net, *.servicebus.windows.net, sign-in, CRL/OCSP; gov: *.msappproxy.us, *.servicebus.usgovcloudapi.net, *.microsoftonline.us, crl.microsoft.us [S4]", "Public", "Microsoft", "Recursive through proxy or egress; no TLS inspection [S4b (excerpt)]"],
    ["Entra provisioning service (cloud), for writeback", "Fusion host (SCIM /hcmRestApi/scim/Users)", "Public", "Oracle", "Microsoft side; the agency has no control"],
  ], { fontSize: 10, minRow: 0.28 });
  sources(s, "Sources: research brief §8, What must resolve where (rows 1–9), with the source keys shown in each cell.");
}
{
  const s = content("Backup", "Resolve where: on-premises, Connect, VMware, OCI");
  table(s, "Where B", 1.45, WHERE_W, WHERE_HEAD, [
    ["On-premises clients and servers (AD-joined)", "Azure private endpoints (forward the public service zone)", "Private answer", "Agency (cloud)", "Grid forward zone → Azure inbound endpoint [Book 08 Ch07, Ch08]"],
    ["", "Route 53 private hosted zones", "Private", "Agency (cloud)", "Grid → Route 53 inbound endpoint [prior-M S57]"],
    ["", "OCI private views (for example, an OIC private target's zone)", "Private", "Agency (OCI)", "Grid → OCI listening endpoint [S23]"],
    ["", "Fusion, Entra and Connect hosts", "Public", "Vendors", "Recursive (Protective DNS chain) [Book 08 Ch08 Decision 2]"],
    ["Fusion private-access users (on-premises)", "<env>.fa.ocs.oraclecloud.com", "Public DNS, private routing", "Oracle", "Service Gateway transit; disable content acceleration [S21, S22]"],
    ["Amazon Connect agents (browser)", "<instance>.my.connect.aws (or *.govcloud.connect.aws), telemetry, participant, transport, TurnNlb-*.elb.<region>.amazonaws.com, *.cloudfront.net, SAML IdP [S27, S28]", "Public", "AWS; Microsoft", "Recursive; allow TURN resolution"],
    ["Connect flow Lambda (VPC-attached)", "Agency HR or identity APIs", "Private", "Agency (Grid)", "VPC Resolver outbound rule → Grid [prior-M S31]"],
    ["", "AWS APIs (for example connect.<region>.amazonaws.com)", "Private via interface endpoint, or public via NAT", "AWS", "[S29, S30]"],
    ["vCenter, ESXi, NSX", "Each other's FQDNs, forward and reverse", "Private", "Agency (Grid)", "Grid A and PTR records [S36]"],
    ["OCI VCN workloads (government realm)", "Agency names", "Private", "Agency (Grid)", "OCI forwarding endpoint + rule → Grid; no OCI public DNS there [S23, S26]"],
  ], { fontSize: 10, minRow: 0.28 });
  sources(s, "Sources: research brief §8, What must resolve where (rows 10–19), with the source keys shown in each cell.");
}
const FAIL_HEAD = ["#", "Failure", "What you see", "Prevention"];
const FAIL_W = [0.55, 2.5, 5.2, 3.9];
{
  const s = content("Backup", "Failure modes F1–F8");
  table(s, "Fail A", 1.45, FAIL_W, FAIL_HEAD, [
    ["F1", "A private zone shadows a public namespace", "Authoritative NXDOMAIN for every name not in the private copy: Azure [S12], AWS [S25], OCI [S23]", "No private zones for vendor SaaS domains; one owner per agency zone [Book 08 Ch02]"],
    ["F2", "Privatelink zone without fallback hides partners' resources", "NXDOMAIN for a partner's storage account; fallback applies only to privatelink.* zones, A/AAAA/CNAME [S12, S12b (excerpts)]", "Enable fallback to internet on privatelink zone links where needed [Book 08 Ch07]"],
    ["F3", "The clouds disagree on precedence", "AWS rule beats zone [S25]; Azure zone beats rule [S12]; OCI views beat rules [S23]", "Never a zone and a rule for the same name in one network; test from every origin"],
    ["F4", "Silent fallback to a public IP", "Private endpoint name resolves publicly; app uses the public path or gets 403. Windows forwarders to Azure need > 4 s [S14b (excerpt); Book 08 Ch02]", "Forward the public zone to an inbound endpoint; raise timeouts; alert on public answers"],
    ["F5", "Grid resolver falls back to root hints", "NIOS reverts to root hints if \"Use Forwarders Only\" is off [S37]; inference: a public answer", "\"Use Forwarders Only\" on cloud private forward zones (inference); monitor endpoints"],
    ["F6", "Forwarding loops", "Azure ruleset → inbound endpoint linked to its own VNet; 168.63.129.16 can't be a target [S10]; Book 08 Ch10", "One authoritative path per namespace; review the graph for cycles"],
    ["F7", "Mixed custom and Azure-provided DNS server lists", "Some queries reach a server that can't answer the custom namespace [Book 08 Ch07]", "List only custom servers, forwarding to Azure (VPN Gateway exception)"],
    ["F8", "On-premises queries the wrong cloud address", "168.63.129.16 valid only inside a VNet [S14c (excerpt)]; AWS CIDR+2 not supported from outside [prior-M S33]", "Target the Azure inbound, Route 53 inbound or OCI listening endpoint"],
  ], { fontSize: 10, minRow: 0.28, firstColor: HEX.red });
  sources(s, "Sources: research brief §6, Failure modes F1–F8, with the source keys shown in each cell.");
}
{
  const s = content("Backup", "Failure modes F9–F16");
  table(s, "Fail B", 1.45, FAIL_W, FAIL_HEAD, [
    ["F9", "TLS name mismatch", "DNS must resolve the connection string's FQDN [S10b (excerpt)]; OIC needs an FQDN, not an IP [S24]; no TLS inspection for Entra agents [S4b (excerpt)]", "Keep the public FQDN; exempt agent traffic from break-and-inspect"],
    ["F10", "Wrong cloud's endpoints", "Tokens not interchangeable [S2]; agent defaults to public environment [S7 (excerpt)]; gov .us names [S4]; Connect GovCloud domain [S28]", "Per-cloud endpoint inventory and allowlist; test through production egress"],
    ["F11", "Resolver quotas", "Route 53: 10,000 UDP QPS per endpoint IP, as low as 1,500 with connection tracking or an NLB [S32]. Azure: 10,000 QPS per endpoint; 5/5 endpoints [S10; prior-M S28]", "Size from metrics; add endpoint IPs at 50% load [S32]"],
    ["F12", "DNS blocked for media", "Connect softphone fails when TurnNlb-* names can't resolve [S27]", "Allow resolution of the Connect names"],
    ["F13", "Middleware loses egress or DNS", "Atom data can be purged [S18]; delay can lose changes [S1]; VPC Lambda has no internet without NAT [S30]; App Service DNS 3 s per server [S15b (excerpt)]", "Reconcile with full extracts; redundant resolvers"],
    ["F14", "Oracle-initiated connections can't use the Service Gateway", "Oracle services must use a public path inward [S22]", "Prefer pull patterns: Atom, extracts, OIC agent"],
    ["F15", "vCenter DNS drift", "Hostname or IP change blocked when A or PTR is wrong [S36]", "Manage vCenter and ESXi records in the Grid"],
    ["F16", "Dangling private zones during rollback", "Rollback can delete Azure Private DNS records [Book 08 Ch10]", "Export first; dry-run every change"],
  ], { fontSize: 10, minRow: 0.28, firstColor: HEX.red });
  sources(s, "Sources: research brief §6, Failure modes F9–F16, with the source keys shown in each cell.");
}
{
  const s = content("Backup", "What we couldn't verify");
  table(s, "Unverified", 1.45, [3.4, 8.75], ["Open question", "Status as of Oct. 22, 2026"], [
    ["Oracle's Fusion connectivity patterns", "The Oracle A-Team page returned HTTP 403 (not retried or worked around); the support note needs a login; Oracle's docs give no DNS guidance for private access"],
    ["The agency Core HCM tenant", "Which Oracle environment it runs in, and its hostname domain; no document ties the tenant to Oracle's government cloud or gives its URLs"],
    ["/bulkUpload in the U.S. Government Graph cloud", "The API reference showed no national-cloud availability table"],
    ["Private Link for Graph or Entra sign-in", "None found; treat them as public-only"],
    ["Azure DNS Private Resolver and Lifecycle Workflows in Azure Government", "Resolver availability page is client-rendered; Lifecycle Workflows not checked"],
    ["OCI private DNS limits and government-realm endpoints", "Numeric limits not on the page; only \"private DNS zones are supported\" is documented for the government realm"],
    ["Connect PrivateLink in GovCloud", "The Connect PrivateLink page doesn't mention GovCloud"],
    ["VMware install-guide DNS rules", "Forward and reverse records required, and vCenter–ESXi mutual resolution, seen only in search excerpts; VCF 9.x prerequisites not opened"],
    ["Forwarding-loop guidance from AWS or Infoblox", "None found; only Azure documents loops"],
    ["Excerpt-only Microsoft pages", "Windows forwarder timeout, Lifecycle Workflows and the agent's government install pages were read as search excerpts"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief, Couldn't verify.");
}
const srcSlide = (title, src) => {
  const s = content("Backup", title);
  T(s, "Source list", bullets(src, 10.5), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 2, fontSize: 10.5 });
  sources(s, "Sources: primary documents as listed; access date for all: Oct. 22, 2026. \"(excerpt)\" = read from a Microsoft Learn search excerpt.");
};
srcSlide("Sources: Microsoft Learn", [
  "Entra provisioning: S1 Configure Oracle HCM for automatic user provisioning  ·  S3 API-driven inbound provisioning FAQ  ·  S5 Perform bulkUpload (Graph v1.0)  ·  S6 On-premises application provisioning architecture (excerpt)  ·  S7b Provisioning users into applications using PowerShell (excerpt)  ·  S8 Plan cloud HR application to Entra user provisioning (excerpt).",
  "Clouds and agents: S2 Microsoft Graph national cloud deployments  ·  S4 Prerequisites for Microsoft Entra Cloud Sync, firewall and proxy  ·  S4b Cloud sync troubleshooting (excerpt)  ·  S7 Install the provisioning agent; Hybrid identity considerations for Azure Government (excerpts)  ·  S7c Entra Connect special considerations for instances (excerpt).",
  "Lifecycle Workflows and Logic Apps: S11 Synchronize attributes for Lifecycle workflows; LCW with synced users (excerpts)  ·  S11b Lifecycle Workflows custom task extension (excerpt)  ·  S13 Secure traffic between Standard logic apps and virtual networks (excerpt)  ·  S15 Logic Apps scenarios (excerpt)  ·  S15b Troubleshoot VNet integration with App Service (excerpt).",
  "Azure DNS: S9b Azure DNS Private Resolver architecture (excerpt)  ·  S10 Private Resolver endpoints and rulesets (excerpt)  ·  S10b Private endpoint DNS zone values (excerpt)  ·  S10c Private resolver architecture (excerpt)  ·  S12 Troubleshoot NXDOMAIN from a private DNS zone (excerpt)  ·  S12b Fallback to internet (excerpt).",
  "Networking: S14 Integrate your app with an Azure virtual network (excerpt)  ·  S14b Name resolution for resources in Azure virtual networks (excerpt)  ·  S14c Azure ML custom DNS (excerpt)  ·  S16 Purview private endpoints, AzureActiveDirectory service tag (excerpt).",
]);
srcSlide("Sources: Oracle, AWS, Broadcom, Infoblox, FedRAMP", [
  "Oracle: S18 REST API for Fusion Cloud HCM, Working with Atom  ·  S19 Employee Atom Feeds  ·  S20 Fusion Applications demo environment setup (host pattern)  ·  S21 Securely Accessing Fusion Applications  ·  S22 Transit Routing for Private Access to Oracle Services  ·  S23 OCI Private DNS  ·  S24 Oracle Integration connectivity agent; Private Endpoint vs. Connectivity Agent; Connect to Private Resources  ·  S26 US Government Cloud with FedRAMP authorization.",
  "AWS: S25 Route 53, Considerations when working with a private hosted zone  ·  S27 Amazon Connect, Set up your network for the CCP  ·  S28 GovCloud (US) User Guide, Connect Customer  ·  S29 Amazon Connect and interface VPC endpoints  ·  S30 Lambda, Giving functions access to resources in a VPC  ·  S32 Route 53 quotas  ·  S33 Managing forwarding rules  ·  S34 Using rules to control which queries are forwarded.",
  "Broadcom: S36 KB 440783, VAMI hostname or IP change fails (vCenter 7.x/8.x).  Infoblox NIOS 9.1 (vendor documentation): S37 Specifying Forwarders (May 20, 2026)  ·  S38 Configuring a Forward Zone (May 25, 2026).",
  "FedRAMP: S40 FedRAMP Marketplace products.json (last change Oct. 22, 2026), records for Oracle Fusion Cloud, Oracle Cloud Infrastructure-Government Cloud, Amazon Connect and Microsoft 365.  Not opened (HTTP 403): Oracle A-Team, Network connectivity patterns for Oracle Cloud HCM and ERP on OCI.",
  "Workbook and prior research: Book 03 Ch03 Federal HR 2.0, Ch05 Provisioning Services  ·  Book 08 Ch02 Split-Brain DNS, Ch07 Cloud Private Endpoints, Ch08 Reference Architecture, Ch10 Migration Sequence  ·  Trinzic Alone, or Trinzic Plus Cloud DDI? (multi-cloud research, S27, S28, S31, S33, S57 as cited there).",
]);

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated notes: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:", per.map((p) => `${p.slide}:${p.n} (${(p.n / WPM).toFixed(1)}m)`).join(" "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(path.join(__dirname, OUT)).catch((e) => { console.error(e); process.exit(1); });
