// Certificates, Tokens and Keys Across the Hybrid Estate: a ~11-minute research EXPLAINER.
//   Orientation · Path 1 SQL Server with Entra ID · Path 2 the clouds' key vaults · Path 3 PIV from AD to Entra
//   · Path 4 RADIUS, 802.1X and NAC · Path 5 who issues and who renews.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_Hybrid_Credentials.pptx
// Modeled on presentations/research-cyberark-clm/build.js and reuses the shared kit in ../_build/.
// Every fact comes from the verified research brief on hybrid credentials (all sources opened 2026-10-23),
// mirrored with notes on docs/books/explainers/hybrid-credentials.md, and Books 03, 04, 06, 07 and 09.
// Program recommendations are labeled design guidance; inferences are labeled as inferences.
// Narration: narration.js holds the spoken text; narrate.py, captions.py and build_narrated.ps1 from ../_build/.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Certificates, Tokens and Keys Across the Hybrid Estate", title: "Explainer",
  footer: "Certificates, tokens and keys across the hybrid estate  ·  Explainer  ·  Research — under review" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Research_Hybrid_Credentials.pptx";

// ------------------------------------------------------------------ helpers (as in the CyberArk research deck)
const NARR = require("./narration.js");
const used = new Set();
const WPM = 160;
let clock = 0;
const per = [];
const titles = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const title = titles[titles.length - 1];
  const say = NARR[title];
  if (!say) throw new Error(`no narration for slide: ${title}`);
  used.add(title);
  const n = say.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; per.push({ slide: pres.slides.length, n, title });
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${say.trim()}\n\nDetail: ${body.trim()}\n\nSources: ${ref}`);
};

const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b07-pki", "png");
const img = (s, name, alt, x, y, maxW, maxH) => {
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  return { w, h };
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

const flow = (s, name, y, h, steps, pt = 12, x0 = 0.6, W = 12.15) => {
  const n = steps.length, gap = 0.28, w = (W - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    const runs = [{ text: st.head, options: { bold: true, color: c, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!st.body } }];
    if (st.body) runs.push({ text: st.body, options: { fontSize: pt } });
    T(s, `${name} ${i + 1} text`, runs, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, paraSpaceAfter: 2, fontSize: pt });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

const label = (s, name, text, x, y, w, color = HEX.red) =>
  txt(s, name, text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color, valign: "middle" });

const SUB = "Explainer  ·  Research — under review";
const OR = "Orientation";
const P1 = "Path 1 — SQL Server with Entra ID";
const P2 = "Path 2 — The clouds' key vaults";
const P3 = "Path 3 — PIV from AD to Entra";
const P4 = "Path 4 — RADIUS, 802.1X and NAC";
const P5 = "Path 5 — Who issues and who renews";

// ================================================================== 1 Title
{
  const s = titleSlide(OR, "Certificates, Tokens and Keys Across the Hybrid Estate", SUB);
  txt(s, "Session map", [
    { text: "WHAT HAPPENS TO AD'S CREDENTIAL WORK  ·  ABOUT 11 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "SQL Server with Entra ID  ·  The clouds' key vaults  ·  PIV from AD to Entra", options: { color: HEX.ink, breakLine: true } },
    { text: "RADIUS, 802.1X and NAC  ·  Who issues and who renews", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Microsoft Learn and Support; CyberArk Certificate Manager 26.1 docs; AWS; Google Cloud; IDManagement.gov; Cisco; FedRAMP Marketplace. All opened Oct. 23, 2026.", 6.08);
  notes(s,
`A research explainer for architects learning the area. Active Directory does more credential work than its name suggests; as the estate moves to Entra ID, Intune and Azure Arc, each job needs a new owner. Four paths, each at three stages (today, coexistence, after AD), and a summary of issuer and renewer per credential. It builds on Book 07, which makes CyberArk Certificate Manager the system of record for every certificate Intune and the PIV system don't manage. Every fact comes from a primary source opened on October 23, 2026. Recommendations are labeled design guidance, inferences as inferences.`,
  "Research brief, Certificates, Tokens and Keys Across the Hybrid Estate (verified Oct. 23, 2026); Book 07, Chapters 04 to 08 and Appendix C.");
}

// ================================================================== 2 What AD does
{
  const s = content(OR, "What AD does for credentials today");
  tag(s, "Why");
  const b = table(s, "AD jobs", 1.5, [3.4, 4.3, 4.45], ["AD's job today", "Why it matters", "Who takes it after AD"], [
    ["Trusts the PIV issuer (NTAuth) and maps each card to an account", "Smart card logon fails without both since the Feb. 2025 enforcement", "Entra certificate-based authentication and certificateUserIds"],
    ["Hands out Kerberos tickets to SQL Server", "Apps and users sign in without a token or certificate of their own", "Entra tokens through Azure Arc; managed identities"],
    ["Autoenrolls DC and server certificates", "Renewal happens without anyone tracking it", "DC certificates end; server TLS moves to the CLM"],
    ["Authorizes network access through NPS", "NPS reads dial-in properties from AD", "A NAC platform checking Intune; no Entra RADIUS"],
    ["Feeds Entra through Connect Sync", "Carries the card binding into the cloud", "Graph writes from the card issuance event (design guidance)"],
  ], { fontSize: 11.5 });
  callout(s, "Rule", b + 0.2, Math.min(0.95, 6.5 - b - 0.2), "FaKey", HEX.teal, "One renewer per credential: ",
    "every certificate gets exactly one system that renews it, written down in the CLM.");
  sources(s, "Sources: KB5014754; Microsoft Learn: smart card logon with third-party CAs, Plan NPS as a RADIUS server, certificateUserIds; Book 07, Ch 04 and Ch 07.");
  notes(s,
`AD's credential jobs: NTAuth trusts the third-party issuing CA ("Active Directory must have the third-party issuing CA in the NTAuth store"); the KDC maps the certificate to an account, and since the February 2025 update denies a certificate that can't be strongly mapped. Kerberos gives SQL Server Windows authentication. AD CS autoenrollment issues domain controller and server certificates. NPS reads users' dial-in properties from AD during authorization. Entra Connect Sync carries altSecurityIdentities into certificateUserIds. After AD: Entra CBA, Entra tokens via Arc and managed identities, the CLM for server TLS (Book 07 Ch 04), a NAC platform with Intune compliance retrieval, and Graph writes from the card management system's issuance event (design guidance). The rule "one renewer per credential" is program design guidance.`,
  "Microsoft Support, KB5014754; Microsoft Learn: Guidelines for enabling smart card logon with third-party CAs (Feb. 12, 2026), Plan NPS as a RADIUS server (Mar. 11, 2025), Mapping to the certificateUserIds attribute (Apr. 21, 2025); Book 07, Chapters 04 and 07.");
}

// ================================================================== 3 Stages and paths
{
  const s = content(OR, "Three stages, five paths");
  tag(s, "What");
  flow(s, "Stages", 1.55, 1.55, [
    { head: "Today", body: "AD at the center: Kerberos, NTAuth, autoenrollment, NPS" },
    { head: "Coexistence", body: "AD and Entra side by side; both must work; the longest stage" },
    { head: "After AD", body: "The last domain controller is gone; cloud owners only", color: HEX.amber, tint: HEX.amberTint },
  ], 13);
  table(s, "Paths", 3.35, [3.0, 9.15], ["Path", "The question it answers"], [
    ["1  SQL Server with Entra ID", "If SQL Server takes Entra tokens, which certificates and identities does it still need, and who renews them?"],
    ["2  The clouds' key vaults", "Are Azure Key Vault, AWS Certificate Manager and Google's services coordinated with the CLM?"],
    ["3  PIV from AD to Entra", "What happens to smart card sign-in when the card's relying party moves from AD to Entra?"],
    ["4  RADIUS, 802.1X and NAC", "If AD is no longer behind RADIUS, what answers the switch?"],
    ["5  Who issues and who renews", "One table of every credential above, at every stage"],
  ], { fontSize: 12 });
  sources(s, "Sources: Book 07, Ch 07 (coexistence rules and waves); research brief §1 and §6.");
  notes(s,
`The three stages follow Book 07 Chapter 07's coexistence model: today (AD-centric), coexistence (hybrid, during the waves), and after AD (the last domain controller retired). Paths 1 to 4 each end with a three-stage table; Path 5 is the ownership summary. The questions are the ones the program asked: SQL with Entra tokens and CyberArk; whether each CSP's key vault is coordinated with CyberArk; PIV, currently mapped to AD and synced to Entra, as AD deprecates; and how NAC, 802.1X and RADIUS are managed when AD no longer backs RADIUS.`,
  "Book 07, Chapter 07; research brief sections 1 and 6.");
}

// ================================================================== 4 SQL diagram
{
  const s = content(P1, "SQL Server: one server, three credentials");
  tag(s, "What");
  img(s, "hybrid-sql", "One SQL Server on an Arc-enabled host and its three credentials: the TLS certificate the CLM installs from AD CS, the SQL Server 2022 app-registration certificate in Azure Key Vault, and the SQL Server 2025 managed identity from the Connected Machine agent; clients send Entra tokens over TLS and SQL Server validates them with Entra ID.", 0.6, 1.45, 12.15, 4.6);
  sources(s, "Sources: Microsoft Learn: Entra authentication for SQL Server; Arc setup tutorial; Managed identity for Arc-enabled SQL Server; Rotate certificates.");
  notes(s,
`"SQL Server 2022 (16.x) introduces support for authentication with Microsoft Entra ID, on both Windows and Linux on-premises"; the host needs the Connected Machine agent and the Azure extension for SQL Server. Supported methods include password, integrated, universal with MFA, service principal, managed identity and access token; the token audience is https://database.windows.net/. Three credentials: (1) the TLS certificate in the machine store, installed by the CLM's CAPI driver over WinRM; (2) on 2022, the instance's app registration uses a certificate "stored in Azure Key Vault (AKV). The Azure Arc agent downloads the certificate to the SQL Server instance host"; it needs a unique CN, at most 12 months' validity, and must be a CSP certificate because Entra doesn't support CNG certificates; (3) on 2025, the Arc server's system-assigned managed identity authenticates inbound and outbound, only on Windows Server, with public-cloud access. A manual non-Arc path exists on Windows.`,
  "Microsoft Learn: Microsoft Entra authentication for SQL Server (Nov. 6, 2025); Tutorial: Set up Microsoft Entra authentication for SQL Server enabled by Azure Arc (Nov. 18, 2025); Managed identity for SQL Server enabled by Azure Arc (Nov. 18, 2025); CyberArk 26.1 CAPI driver.");
}

// ================================================================== 5 TLS mandatory
{
  const s = content(P1, "SQL Server: the TLS certificate becomes mandatory");
  tag(s, "How");
  panel(s, "TLS", 0.6, 1.5, 6.0, 4.95, HEX.navy, HEX.navyTint, "THE TLS CERTIFICATE", "Always encrypted with Entra", [
    "\"Connections authenticated by Microsoft Entra ID are always encrypted\"",
    "Self-signed fallback forces TrustServerCertificate, which doesn't check who the server is",
    "Needs: Server Authentication EKU; every client name in the SAN; key read access for the service account",
    "KeySpec must be AT_KEYEXCHANGE: KSP keys \"aren't compatible with SQL Server\"",
    "The CLM's CAPI driver documents key location, not CSP vs KSP: prove KeySpec = 1 before rollout (design guidance)",
  ], 12.5);
  panel(s, "App", 6.75, 1.5, 6.0, 4.95, HEX.amber, HEX.amberTint, "SQL SERVER 2022 APP CERTIFICATE", "It can rotate itself", [
    "Service-managed certificate and app registration, plus Key Vault Sign for the Arc identity: the extension rotates it",
    "Key Vault renews at 80% of the lifetime by default",
    "Customer-managed: the owner uploads the new .cer; the extension checks daily, up to 24 hours",
    "No CLM driver uploads to an app registration: the CLM watches, it doesn't renew",
    "Correction: Book 06 Ch 10 said \"not rotated automatically\"",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn: Arc tutorial; Configure encryption; Certificate requirements; Rotate certificates; CyberArk 26.1 CAPI object settings.");
  notes(s,
`TLS: "Connections authenticated by Microsoft Entra ID are always encrypted. If SQL Server is using a self-signed certificate, you must add trust server cert = true in the connection string." Without a provisioned certificate SQL Server generates a self-signed one at startup, which "doesn't protect against identity spoofing by the server." Requirements: local computer or service-account store; Server Authentication EKU 1.3.6.1.5.5.7.3.1; KeySpec AT_KEYEXCHANGE (a legacy CSP such as Microsoft RSA SChannel Cryptographic Provider; "Certificates created with a Key Storage Provider (KSP) ... use KeySpec = 0 and aren't compatible with SQL Server"); SAN with all client names; availability groups share one certificate with every replica and listener name, or one per replica; restart after a change. The CAPI driver documents key generation on the device or Luna or nShield HSMs but not CSP versus KSP, hence the test gate (design guidance). App certificate: the automation tutorial says "The certificates created for Microsoft Entra aren't rotated automatically"; the newer rotation page says the extension "can automatically rotate certificates for Microsoft Entra ID for service managed certificates and service managed app registration", with the Key Vault key permission Sign granted to the Arc identity through an access policy. Customer-managed: create the new version and upload the .cer to the app registration; the extension "checks for a new certificate daily".`,
  "Microsoft Learn: Tutorial, Entra authentication for SQL Server enabled by Azure Arc; Configure SQL Server Database Engine for encrypting connections (Dec. 2, 2025); Certificate requirements for SQL Server (Mar. 3, 2026); Tutorial: Using automation to set up the Entra admin (June 19, 2026); Rotate certificates (June 23, 2026); CyberArk 26.1 CAPI application object settings.");
}

// ================================================================== 6 SQL stages
{
  const s = content(P1, "SQL Server across the three stages");
  tag(s, "Who");
  const b = table(s, "SQL stages", 1.5, [1.75, 3.4, 3.45, 3.55], ["Stage", "How users and apps sign in", "TLS certificate", "Instance identity"], [
    ["Today", "Windows authentication (Kerberos or NTLM); TLS optional", "AD CS autoenrollment, manual, or the CLM; or the self-signed fallback", "Service account (gMSA or domain account)"],
    ["Coexistence", "Windows and Entra logins side by side on Arc-enabled 2022 and 2025", "Mandatory; retained AD CS through the CLM", "2022: app certificate in Key Vault; 2025: managed identity (Arc agent)"],
    ["After AD", "Entra logins only; apps by managed identity or service principal certificate", "Standalone AD CS under the same root, through the CLM", "2025 managed identity"],
  ], { fontSize: 12 });
  callout(s, "SQL advice", b + 0.25, Math.min(1.0, 6.5 - b - 0.25), "FaDatabase", HEX.teal, "Design guidance: ",
    "move to SQL Server 2025 with the managed identity so the app certificate disappears; where 2022 remains, use the service-managed pattern and let the CLM monitor it.");
  sources(s, "Sources: Microsoft Learn: Managed identity for SQL Server enabled by Azure Arc; Rotate certificates; Book 07, Ch 04; Book 05, Ch 09; Book 06, Ch 09, Ch 10 and Ch 22.");
  notes(s,
`Today: Windows authentication, TLS optional but recommended; the TLS certificate from AD CS (Book 06 Ch 22) or SQL's self-signed fallback; servers aren't Intune-managed (Book 05 Ch 09). Coexistence: Entra logins FROM EXTERNAL PROVIDER on Arc-enabled 2022 and 2025; TLS mandatory; retained AD CS through the CLM (Book 07 Ch 04); 2022 app certificate in Key Vault, renewed by Key Vault and the Arc extension when service-managed or by the owner when customer-managed; 2025 managed identity, managed by the Arc agent. After AD: Entra only; standalone AD CS under the same root through the CLM. Applications on Arc-enabled servers can use the server's managed identity from localhost:40342 if in local Administrators or Hybrid Agent Extension Applications (himds on Linux). In 2025, OPENROWSET BULK can read the agent's tokens folder, so bulk permissions "should be treated as equivalent to sysadmin". Azure SQL uses Microsoft's own server certificate; the customer owns client trust stores (DigiCert Global Root G2, Microsoft RSA Root CA 2017, Microsoft ECC Root CA 2017).`,
  "Microsoft Learn: Managed identity for SQL Server enabled by Azure Arc; Rotate certificates; Access Azure resources by using managed identity on Azure Arc-enabled servers (Feb. 5, 2026); Root CA change for Azure SQL; Books 05, 06 and 07.");
}

// ================================================================== 7 Vaults diagram
{
  const s = content(P2, "The clouds' key vaults: one renewer per certificate");
  tag(s, "What");
  img(s, "hybrid-vaults", "Who renews what in each cloud: CyberArk Certificate Manager above Google Cloud, AWS ACM and Private CA, and Azure Key Vault; below them, keys and secrets owned by each cloud's own service under its own access control, not the CLM.", 0.6, 1.45, 12.15, 4.65);
  sources(s, "Sources: Microsoft Learn: About Key Vault certificates (July 10, 2026); AWS ACM managed renewal; Google Certificate Manager (Oct. 20, 2026); CyberArk 26.1 cloud drivers.");
  notes(s,
`The CLM pushes certificates into Azure Key Vault through its Azure Key Vault application driver; requests from or imports into AWS Certificate Manager (ACM CA template driver; AWS application driver); and writes classic SSL certificate resources to Google Cloud load balancers. Each cloud also issues and renews its own certificates. Keys and secrets: no CLM driver page treats Key Vault keys or secrets, AWS KMS keys, Secrets Manager secrets, Google Secret Manager secrets or Cloud KMS keys as managed objects (inference from the driver list); they stay with each cloud's own service. CyberArk's separate secrets products are Secrets Manager (Self-Hosted, formerly Conjur Enterprise, and SaaS) and Secrets Hub, which syncs secrets into the clouds' native stores; choosing one is outside this explainer. Coordination model: one renewer per certificate, recorded in the CLM policy folder (design guidance).`,
  "Microsoft Learn: About Azure Key Vault certificates (July 10, 2026); AWS ACM user guide, managed renewal; Google Cloud, Certificate Manager overview (Oct. 20, 2026); CyberArk 26.1: Azure Key Vault, AWS and Google Cloud Load Balancer drivers; CyberArk docs: Secrets Manager, Secrets Hub.");
}

// ================================================================== 8 Per cloud
{
  const s = content(P2, "Azure, AWS and Google: who renews what");
  tag(s, "Who");
  const b = table(s, "Clouds", 1.5, [2.2, 3.6, 3.45, 2.9], ["Cloud", "The cloud renews by itself", "The CLM's part", "Government"], [
    ["Azure Key Vault", "Partner CAs (DigiCert, GlobalSign) and self-signed only; any other CA: \"Key Vault doesn't enroll or renew\"", "Pushes certificates, keys and chains; Key Vault's own renewal off for these", "Driver Environment can be AzureUSGovernment; endpoint vault.usgovcloudapi.net"],
    ["AWS ACM and Private CA", "ACM-issued certificates; never imported ones", "Imports CLM-issued certificates and renews them; or requests from ACM and monitors", "ACM, Private CA, KMS, Secrets Manager in GovCloud; CLM driver pages silent on GovCloud"],
    ["Google Cloud", "Google-managed certificates in Certificate Manager", "Pushes classic SSL certificates to load balancers; can request from CA Service", "Assured Workloads lists the services; CLM pages silent"],
  ], { fontSize: 11.5 });
  callout(s, "Driver cred", b + 0.25, Math.min(0.95, 6.5 - b - 0.25), "FaKey", HEX.amber, "Don't forget the CLM's own credential: ",
    "the Key Vault driver signs in with an app-registration certificate. Inventory it in the CLM with its own owner.");
  sources(s, "Sources: Microsoft Learn: Key Vault certificates, CSR merge, Azure Government comparison; AWS ACM and GovCloud guides; CyberArk 26.1 Web SDK schema and drivers.");
  notes(s,
`Azure: "When a Key Vault certificate is created, an addressable key and secret are also created with the same name." Auto-renewal works with partner providers DigiCert and GlobalSign, "Supported in all Key Vault service locations in public cloud and Azure Government", and Key Vault handles autorenewal of self-signed certificates; lifetime actions default to 80 percent of the lifetime. For a non-partnered CA, IssuerName is Unknown and "Key Vault doesn't enroll or renew the certificate"; the workflow is CSR, sign, merge. The CLM's Web SDK schema has an Environment attribute that "can replace the default AzureGlobalCloud with an environment: AzureUSGovernment", closing a gap the earlier CLM guide listed. AWS: ACM renews Amazon-issued certificates; "ACM does not provide managed renewal for imported certificates"; private certificates issued directly through the Private CA IssueCertificate API aren't eligible either. CyberArk's ACM driver can request from ACM and Private CA and advises leaving ACM renewal on and widening the CLM renewal window about a week. GovCloud: ACM, Private CA, KMS and Secrets Manager run in US-West and US-East; the CLM AWS driver pages show no aws-us-gov partition (couldn't verify). Google: Certificate Manager issues and renews Google-managed certificates, including through CA Service; the CLM's load balancer driver uses compute.sslCertificates, not Certificate Manager maps (inference).`,
  "Microsoft Learn: About Azure Key Vault certificates; Configure certificate auto-rotation (July 8, 2026); Create and merge a CSR (July 8, 2026); Compare Azure Government and global Azure; AWS: ACM managed renewal, import, GovCloud ACM and Private CA; Google: Certificate Manager, CA Service, Assured Workloads; CyberArk 26.1: Azure Key Vault schema, ACM CA template, AWS, Google Cloud Load Balancer, CA Service drivers.");
}

// ================================================================== 9 PIV diagram
{
  const s = content(P3, "PIV: the card stays, AD's side goes");
  tag(s, "What");
  img(s, "hybrid-piv", "The PIV card through AD retirement: the card and the card management system are unchanged; domain controllers, the NTAuth store, strong mapping and Entra Connect Sync end with AD; Entra certificate-based authentication, certificateUserIds and Conditional Access remain.", 0.6, 1.45, 12.15, 5.1);
  sources(s, "Sources: Microsoft Learn: smart card logon with third-party CAs (Feb. 12, 2026); Entra CBA configuration (Aug. 15, 2025); certificateUserIds (Apr. 21, 2025); KB5014754.");
  notes(s,
`The card, the Federal PKI shared service provider or agency CA under Common Policy, and the card management system are unchanged by AD retirement. What disappears (inference from the cited pages): the NTAuth store, domain controller certificates and their autoenrollment, Kerberos PKINIT smart card logon, KDC strong-mapping enforcement with altSecurityIdentities and the name-based tuple policy, and the Connect Sync rule flowing altSecurityIdentities to certificateUserIds. What stays: the PIV issuer, the Entra trust store and CRLs, and certificateUserIds, written as a cloud attribute. Coexistence caveat: Entra-joined devices reaching on-premises resources still use DC certificates, which need HTTP CDPs and the root on the device (Book 07 Ch 07); keep the DC certificate path healthy until the last DC retires.`,
  "Microsoft Learn: Guidelines for enabling smart card logon with third-party CAs; How to configure Entra CBA; Mapping to certificateUserIds; Microsoft Support KB5014754; Book 07, Chapter 07; Book 03, Chapter 09.");
}

// ================================================================== 10 PIV today
{
  const s = content(P3, "PIV today: strong mapping for non-Microsoft CAs");
  tag(s, "Why");
  flow(s, "Dates", 1.55, 1.3, [
    { head: "Feb. 2025", body: "Full Enforcement: certificates that can't be strongly mapped are denied" },
    { head: "Sept. 9, 2025", body: "The fallback to Compatibility mode ends" },
    { head: "PIV's problem", body: "The SID extension covers AD CS only; PIV comes from the Federal PKI", color: HEX.red, tint: HEX.redTint },
  ], 12.5);
  panel(s, "Alt", 0.6, 3.1, 6.0, 3.35, HEX.navy, HEX.navyTint, "ROUTE 1", "Explicit mapping on each account", [
    "altSecurityIdentities with a strong form: issuer and serial number, SKI, or SHA1 public key",
    "IDManagement.gov calls it \"recommended\" over UPN mapping",
    "Subject and RFC822 mappings are rejected in Full Enforcement",
  ], 12.5);
  panel(s, "Name", 6.75, 3.1, 6.0, 3.35, HEX.teal, HEX.tealTint, "ROUTE 2 · NEW IN THE BOOKS", "Federal name-based strong mapping", [
    "KDC policy \"Allow name-based strong mappings for certificates\" (Sept. 2024 update)",
    "Accepts a name or UPN mapping for certificates from a named issuing CA that carry a named policy OID",
    "Microsoft's example uses a Federal PKI policy OID; KB5014754 points to it",
  ], 12.5);
  sources(s, "Sources: Microsoft Support KB5014754; Microsoft Public Sector Blog, name-based mapping in government scenarios; IDManagement.gov, Network Smart Card Logon for Windows.");
  notes(s,
`KB5014754: the February 2025 security update moves domain controllers to Full Enforcement, "Authentication will be denied if a certificate cannot be strongly mapped"; "The option to move back to Compatibility mode will remain until the September 9, 2025 Windows security update", after which StrongCertificateBindingEnforcement is no longer supported. "Environments that have non-Microsoft CA deployments will not be protected using the new SID extension." The SID extension is OID 1.3.6.1.4.1.311.25.2. Strong altSecurityIdentities forms: X509IssuerSerialNumber, X509SKI, X509SHA1PublicKey. IDManagement.gov's Windows smart card logon guide calls altSecurityIdentities recommended over UPN mapping, notes a domain can't use both, records that Subject and RFC822 mappings "as of September 2025 will be rejected in Full Enforcement", and requires DCs on Windows Server 2019 or later with the September 2025 updates. The government name-based policy, since the September 10, 2024 update, treats an Issuer/Subject or UPN mapping as strong for certificates from an issuing CA named by thumbprint and carrying a policy OID; Microsoft's example uses 2.16.840.1.101.3.2.1.3.45. Book 07 Chapter 06 now has a sidebar on it.`,
  "Microsoft Support, KB5014754; Microsoft Public Sector Blog, Enable strong name-based mapping in government scenarios; IDManagement.gov, Network Smart Card Logon for Windows; IDManagement.gov, Enterprise Trust of the FCPCA.");
}

// ================================================================== 11 PIV coexistence
{
  const s = content(P3, "PIV in coexistence: Entra CBA and certificateUserIds");
  tag(s, "How");
  panel(s, "CBA", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "ENTRA CBA", "Entra checks the card", [
    "PKI trust store: up to 250 CAs, loaded by a Privileged Authentication Administrator",
    "One HTTP CRL per CA; with no CRL URL, a revoked card still works",
    "Windows sign-in with the card on hybrid and Entra-joined devices, for managed (not federated) users",
    "Only multifactor CBA counts as phishing-resistant",
  ], 12);
  panel(s, "CUID", 4.75, 1.5, 4.0, 4.95, HEX.teal, HEX.tealTint, "THE BINDING", "certificateUserIds", [
    "Holds up to 10 values, unique across the tenant",
    "Synced users: \"Only Microsoft Entra Connect\" can write it, usually from altSecurityIdentities",
    "Cloud Sync: not documented; plan for it if you move",
    "AD administrators can change synced values: a risk while AD feeds it",
  ], 12);
  panel(s, "Aff", 8.9, 1.5, 3.85, 4.95, HEX.amber, HEX.amberTint, "A TENSION TO SETTLE", "Low or high affinity?", [
    "IDManagement.gov's CBA guide: \"Select the Low affinity binding\"",
    "Microsoft: \"should exclusively use high-affinity bindings\"",
    "Book 07: high affinity, tied to one certificate (issuer and serial, or SKI)",
  ], 12);
  sources(s, "Sources: Microsoft Learn: Entra CBA configuration; Windows smart card sign-in (Mar. 4, 2025); certificateUserIds; authentication strengths; IDManagement.gov CBA guide v2.0.");
  notes(s,
`Entra CBA: "A PKI-based trust store supports up to 250 CAs and 8 KB for each CA object", needing Privileged Authentication Administrator; "If the URL isn't set, an attempt to authenticate by using a revoked certificate doesn't fail"; one CDP per CA, HTTP only (no OCSP or LDAP). Allow *.certauth.login.microsoftonline.com and turn off TLS inspection on it. Windows smart card sign-in: "Microsoft Entra CBA is supported on Windows devices that are hybrid or Microsoft Entra joined"; users need managed authentication or Staged Rollout; the PRT can carry the multifactor claim. certificateUserIds: up to 10 values of 1,024 characters; formats X509:<PN>, <RFC822>, <I><S>, <S> (low affinity), <SKI>, <SHA1-PUKEY>, <I><SR> (high affinity). "Only Microsoft Entra Connect can be used to update certificateUserIds by synchronizing the value from on-premises"; Cloud Sync isn't documented (couldn't verify). Phishing-resistant MFA strength includes "Microsoft Entra certificate-based authentication (multifactor)". IDManagement.gov's guide v2.0 (Mar. 17, 2026): "Select the Low affinity binding here" and "select PrincipalName as the preferred binding"; Microsoft: administrators "should exclusively use high-affinity bindings". The program follows Microsoft and Book 07 Chapter 06 (design guidance).`,
  "Microsoft Learn: How to configure Entra CBA (Aug. 15, 2025); CBA technical concepts (Aug. 29, 2025); Windows smart card sign-in using Entra CBA (Mar. 4, 2025); Mapping to certificateUserIds (Apr. 21, 2025); Authentication strengths (Oct. 24, 2025); IDManagement.gov, CBA on Microsoft Entra ID Guide v2.0 (Mar. 17, 2026).");
}

// ================================================================== 12 PIV after AD
{
  const s = content(P3, "PIV after AD: who writes the binding");
  tag(s, "Who");
  flow(s, "Issuance", 1.55, 1.45, [
    { head: "Card issued", body: "The card management system knows the new certificate's serial number" },
    { head: "Graph write", body: "It writes the high-affinity value to certificateUserIds" },
    { head: "First sign-in", body: "Entra CBA finds the user by that value" },
  ], 13);
  label(s, "DG", "DESIGN GUIDANCE · NOT DOCUMENTED BY MICROSOFT · PROVE IN A PILOT", 0.6, 3.15, 12.15, HEX.red);
  panel(s, "Gone", 0.6, 3.55, 6.0, 2.9, HEX.red, HEX.redTint, "ENDS WITH AD", null, [
    "NTAuth store, DC certificates, Kerberos smart card logon",
    "AD's mapping and the Connect Sync rule",
    "HR can't replace it: HR knows the person, not the certificate",
  ], 12.5);
  panel(s, "Stays", 6.75, 3.55, 6.0, 2.9, HEX.teal, HEX.tealTint, "STAYS", null, [
    "The card, its Federal PKI issuer, the card management system",
    "The Entra trust store, CRLs and certificateUserIds",
    "Windows Hello for Business as the PIV-bootstrapped alternative where PIV is impractical",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn: certificateUserIds; Source of Authority; IDManagement.gov, Windows Hello for Business guide v1.3; Book 03, Ch 09.");
  notes(s,
`No Microsoft page describes HR-driven or API-driven inbound provisioning writing certificateUserIds (couldn't verify). For cloud-only or Source-of-Authority-converted users, a Graph PATCH of authorizationInfo.certificateUserIds by a workload holding the right permission can carry X509:<I>…<SR>… or X509:<SKI>… values from the card management system's issuance event, the only place the serial number or SKI exists before first use (inference). Book 03 Chapter 09's design is consistent and is labeled design guidance. For cloud-only users Microsoft documents admin-center or Graph writes by a Privileged Authentication Administrator; whether that applies to SOA-converted users isn't stated. IDManagement.gov's WHfB guide (v1.3, Aug. 31, 2026) calls WHfB "an alternative authenticator for use cases where using PIV is impractical" and allows enrollment that requires PIV first. Microsoft recommends WHfB or FIDO2 over virtual smart cards for new installations. PIV stays the primary credential (design guidance).`,
  "Microsoft Learn: Mapping to certificateUserIds; Configure user Source of Authority; Windows security book, smart cards; IDManagement.gov, Windows Hello for Business (v1.3, Aug. 31, 2026); Book 03, Chapter 09.");
}

// ================================================================== 13 RADIUS options
{
  const s = content(P4, "RADIUS: there is no Entra RADIUS");
  tag(s, "Why");
  img(s, "hybrid-radius-options", "What answers RADIUS when AD retires: keep NPS as a bridge only; a NAC platform with Intune, the program default; a cloud RADIUS service, none FedRAMP-authorized on October 23, 2026; Global Secure Access for remote access, not for 802.1X on the LAN.", 0.6, 1.45, 7.4, 5.05);
  panel(s, "Why NPS", 8.2, 1.5, 4.55, 4.95, HEX.red, HEX.redTint, "WHY NPS ENDS WITH AD", null, [
    "NPS reads users' dial-in properties from AD to authorize",
    "Only an NPS proxy, which doesn't authorize, runs without a domain",
    "Entra-joined devices can't use an AD computer object for Wi-Fi",
    "The MFA extension adds a factor after AD; it doesn't replace AD",
    "Microsoft's only statement: a Q&A answer, \"Entra ID does not have a native RADIUS feature\"",
  ], 12);
  sources(s, "Sources: Microsoft Learn: Plan NPS server and proxy; Entra join planning (June 17, 2026); NPS MFA extension; RADIUS with Entra ID; Microsoft Q&A; FedRAMP Marketplace, Oct. 23, 2026.");
  notes(s,
`NPS: "To allow the NPS to read the dial-in properties of user accounts during the authorization process, you must add the computer account of the NPS to the RAS and NPSs group for each domain." "The NPS proxy can be a domain member or it can be a stand-alone server with no domain membership", because it "does not perform authorization"; no page documents an authorizing NPS without AD (couldn't verify). Entra-joined devices "don't support RADIUS authentication using an on-premises computer object and certificate for connecting to Wi-Fi"; use "certificates pushed via Intune or user credentials". The NPS extension "connects to Active Directory Domain Services (AD DS) to perform the primary authentication"; PAP supports all methods; CHAPv2 and EAP support phone call and app notification; no number matching. Microsoft's RADIUS architecture page reaches RADIUS only through NPS and recommends SAML federation for VPNs. "Entra ID does not have a native RADIUS feature" is a Microsoft Q&A accepted answer, community-tier. FedRAMP Marketplace (last change Oct. 23, 2026, 781 products): the only RADIUS-first listing, IronWiFi Cloud RADIUS, is at Initial Implementation; Forescout for Government is FedRAMP High (authorized Mar. 20, 2026) but describes visibility and enforcement, not RADIUS. Global Secure Access: available in GCC, "isn't yet supported" in GCC High or DoD; Internet Access doesn't support UDP yet.`,
  "Microsoft Learn: Plan NPS as a RADIUS server (Mar. 11, 2025); Plan NPS as a RADIUS proxy; Plan your Entra join deployment (June 17, 2026); NPS extension for Entra MFA; RADIUS authentication with Entra ID; Global Secure Access known limitations; Microsoft Q&A, RADIUS feature in Entra ID; FedRAMP Marketplace products.json.");
}

// ================================================================== 14 NAC flow
{
  const s = content(P4, "802.1X with Intune: EAP-TLS and compliance");
  tag(s, "How");
  img(s, "hybrid-nac", "A managed device on the wire: Cloud PKI or AD CS issues the device certificate with the Intune device ID; EAP-TLS through the switch to the NAC platform; the NAC asks Intune compliance retrieval by device ID; the CLM supplies the NAC server certificate; NPS and its MFA extension are today's bridge.", 0.6, 1.45, 4.3, 5.1);
  panel(s, "ISE", 5.1, 1.5, 3.75, 4.95, HEX.navy, HEX.navyTint, "WATCH 1", "Patch Cisco ISE", [
    "Compliance retrieval needs the Intune device ID in the SAN as a URI",
    "With the SID extension added, Intune certificates carry a second URI",
    "ISE before 3.1 P10, 3.2 P7, 3.3 P4, 3.4 P1: certificate logins fail",
  ], 12);
  panel(s, "Srv", 9.0, 1.5, 3.75, 4.95, HEX.amber, HEX.amberTint, "WATCH 2", "Certificates nobody tracked", [
    "NAC server certificate: no CLM driver for ISE or ClearPass; Adaptable driver or manual CSR",
    "NPS MFA extension: its own self-signed certificate, 2 years, renewed by rerunning the script",
    "Both now in the Book 09 inventory",
  ], 12);
  sources(s, "Sources: Microsoft Learn, NAC integration with Intune (Apr. 15, 2026); Cisco FN74227; Cisco ISE 3.1 and 3.4 admin guides; CyberArk 26.1 system requirements; NPS MFA extension.");
  notes(s,
`Compliance retrieval "was released in July 2021 and replaced the previous Intune NAC service", with legacy support "through March 31, 2024". Partners include Cisco ISE 3.1 and later, Aruba ClearPass with Intune Extension v6 and later, Forescout, FortiNAC, Portnox and others. "The compliance retrieval service requires certificate-based authentication and the use of the Intune device ID as the subject alternative name", as a URI defined by the NAC provider (example IntuneDeviceId://{{DeviceID}}); the broad noncompliant query runs at most every four hours. Cisco ISE 3.1+ uses MDM API v3 with the GUID in the SAN URI; FN74227 (Jan. 8, 2025): certificate-based logins fail when Intune's KB5014754 changes add a second URI; fixed in 3.1 P10, 3.2 P7, 3.3 P4, 3.4 P1. ISE ships a self-signed EAP certificate normally replaced by CSR and bind or import; "You must always use a new private key for each certificate that you import into Cisco ISE." No SCEP, EST or ACME enrollment of ISE's own certificates was found; a community post on native ACME is unverified. The CLM's 26.1 driver list has no ISE or ClearPass driver; the Adaptable driver route is inference. HPE Aruba's ClearPass pages returned HTTP 403 and weren't read. NPS MFA extension: the script "Creates a self-signed certificate"; these "are valid for 2 years"; Microsoft also allows your own certificates with Client Authentication EKU and NETWORK SERVICE read access.`,
  "Microsoft Learn: Network access control integration with Intune (Apr. 15, 2026); NPS extension for Entra MFA; Cisco Field Notice FN74227 (Jan. 8, 2025); Cisco ISE Administrator Guides 3.1 (Secure Wired Access) and 3.4 (Basic Setup); CyberArk 26.1 System Requirements.");
}

// ================================================================== 15 NAC stages
{
  const s = content(P4, "RADIUS and NAC across the three stages");
  tag(s, "Who");
  table(s, "NAC stages", 1.5, [1.75, 3.75, 3.2, 3.45], ["Stage", "What admits a device", "Device certificate", "RADIUS server certificate"], [
    ["Today", "NPS against AD (EAP-TLS or PEAP); VPN through NPS and the MFA extension", "AD CS autoenrollment, mapped to the AD computer account", "AD CS, renewed by the CLM; plus the extension's self-signed certificate"],
    ["Coexistence", "Intune devices by EAP-TLS to a NAC platform with compliance retrieval; hybrid devices still through NPS", "Intune SCEP or PKCS with the device ID URI; Intune renews", "NAC server: retained AD CS, renewed by the CLM (Adaptable driver or manual)"],
    ["After AD", "The NAC platform for the LAN; Global Secure Access or a federated VPN for remote access", "Cloud PKI through Intune", "Standalone AD CS under the same root, renewed by the CLM"],
  ], { fontSize: 12 });
  sources(s, "Sources: research brief §5.8; Book 07, Ch 04, Ch 06 and Ch 08; Book 09, Ch 07; Microsoft Learn, NAC integration with Intune; Global Secure Access overview.");
  notes(s,
`Today: devices and users to the network via NPS against AD; VPN users through NPS and the MFA extension; device certificates from AD CS autoenrollment; NPS server certificate from AD CS renewed by the CLM's CAPI driver (Book 07 Ch 08); the extension's self-signed certificate rerun every two years. Coexistence: Intune devices by EAP-TLS with the device-ID URI to ISE or ClearPass using compliance retrieval; hybrid devices still via NPS; device certificates from Cloud PKI or AD CS through the connector, renewed by Intune; NAC server certificates from retained AD CS, renewed by the CLM through an Adaptable driver or manually (inference). After AD: Intune devices only; the NAC platform for the LAN, or an authorized cloud RADIUS when one exists; Global Secure Access Private Access, which provides "a quick and easy way to replace your VPN", or a federated ZTNA for remote access; device certificates from Cloud PKI; NAC and RadSec server certificates from standalone AD CS under the same root (Book 07 Ch 04).`,
  "Research brief section 5.8; Book 07, Chapters 04, 06 and 08; Book 09, Chapter 07; Microsoft Learn: NAC integration with Intune; Learn about Microsoft Entra Private Access.");
}

// ================================================================== 16 Ownership grid
{
  const s = content(P5, "Who issues and who renews: the whole estate");
  tag(s, "Who");
  table(s, "Grid", 1.4, [3.05, 3.0, 3.1, 3.0], ["Credential (issuer / renewer)", "Today", "Coexistence", "After AD"], [
    ["SQL Server TLS", "AD CS / autoenrollment or CLM", "Retained AD CS / CLM", "Standalone AD CS / CLM"],
    ["SQL 2022 app certificate", "None", "Key Vault / Arc extension, or app owner", "Gone with SQL 2025"],
    ["SQL 2025 managed identity", "None", "Azure / Arc agent", "Azure / Arc agent"],
    ["App service principal certificates", "AD CS or self-signed / owner", "Trusted CA / owner", "Same; Entra caps lifetimes"],
    ["Cloud certificates", "Cloud or CLM / one renewer each", "Same", "Same"],
    ["PIV Authentication certificate", "Federal PKI / card system", "Same", "Same"],
    ["PIV binding", "AD mapping / AD admins", "certificateUserIds / Connect Sync", "certificateUserIds / issuance event (DG)"],
    ["Domain controller certificates", "AD CS / autoenrollment", "Same", "Gone"],
    ["Intune device certificates", "AD CS / Intune", "Cloud PKI or AD CS / Intune", "Cloud PKI / Intune"],
    ["NPS server and MFA extension", "AD CS / CLM; self-signed / NPS admin", "Same while NPS remains", "Gone with NPS"],
    ["NAC server certificates", "AD CS / manual", "Retained AD CS / CLM", "Standalone AD CS / CLM"],
  ], { fontSize: 10.5, minRow: 0.28 });
  sources(s, "Sources: research brief §6, built from the sources on Paths 1–4. DG = design guidance. Full table on the research page.");
  notes(s,
`Each cell is issuer / renewer. SQL Server TLS: AD CS or self-signed fallback, then retained AD CS through the CLM (KeySpec test gate), then standalone AD CS through the CLM. SQL 2022 app-registration certificate: Key Vault Self or a chosen CA, renewed by Key Vault and the Arc extension when service-managed or by the app owner when customer-managed; removed with SQL 2025's managed identity. App service-principal certificates: the owner renews; the CLM can place them in Key Vault but the upload to Entra is the owner's step; Entra app-management policy caps lifetime at 180 days (Book 04 Ch 05). Cloud certificates: Key Vault for partner or self-signed, the CLM for pushed; ACM for ACM-issued, the CLM for imported; Google for Google-managed, the CLM for load-balancer pushes. Vault PKI intermediates (HashiCorp): the CLM. PIV certificate: the card management system, unchanged. PIV binding: AD, then Connect Sync, then the issuance-event workload (inference, design guidance). DC certificates: autoenrollment, watched by the CLM; gone after AD. Intune device certificates: Intune throughout. NPS server certificate: the CLM; extension certificate: the NPS admin every two years, or a CLM-issued replacement; both retire with NPS. NAC server certificates: the CLM via an Adaptable driver or manual CSR (inference). The CLM's own Key Vault driver credential: the CLM.`,
  "Research brief section 6, built from sections 2 to 5 and the sources cited there; Book 04, Chapter 05; Book 07, Chapters 04 to 08.");
}

// ================================================================== 17 Close
{
  const s = content(P5, "What changed in the books, and next steps");
  tag(s, "How");
  panel(s, "Changed", 0.6, 1.5, 6.0, 4.95, HEX.navy, HEX.navyTint, "WHAT THIS CHANGED IN THE BOOKS", null, [
    "Book 06 Ch 10: the SQL 2022 Key Vault certificate rotates automatically when service-managed",
    "Book 06 Ch 22 and Book 04 Ch 05: Entra ID doesn't renew certificate credentials; Key Vault and the Arc extension, or the owner, do; the KeySpec test; managed identities on Arc servers",
    "Book 07 Ch 06: federal name-based strong mapping; why high affinity",
    "Book 09 Ch 07: the NPS extension's own certificate; NAC server certificates by Adaptable driver or manual CSR",
  ], 12);
  panel(s, "Next", 6.75, 1.5, 6.0, 4.95, HEX.teal, HEX.tealTint, "NEXT STEPS (DESIGN GUIDANCE)", null, [
    "Lab: prove a CLM-renewed SQL certificate shows KeySpec = 1",
    "Pilot: card management system writes certificateUserIds through Graph",
    "Ask CyberArk in writing: AWS GovCloud and Google government regions for its drivers",
    "Patch Cisco ISE before Intune certificates carry the SID URI",
    "Plan SQL Server 2025 upgrades to retire the app certificate",
  ], 12);
  sources(s, "Sources: research brief §1.1 and §8; Books 04, 06, 07 and 09 as updated Oct. 23, 2026.");
  notes(s,
`Book corrections from this research: Book 06 Chapter 10's table said the Key Vault certificate is "not rotated automatically", true only for the customer-managed pattern. Book 06 Chapter 22 and Book 04 Chapter 05 named Entra ID as a renewer; it isn't. Book 04 Chapter 05 now notes managed identities are available on Azure Arc-enabled servers too. Book 06 Chapter 22 gains the KeySpec test gate. Book 07 Chapter 06 gains the federal name-based strong-mapping option and notes the federal CBA guide's low-affinity recommendation versus the program's high affinity. Book 09 Chapter 07 gains the NPS extension's self-signed two-year certificate and narrows the NAC server certificate path. Couldn't verify: CLM drivers in AWS GovCloud and Google government regions; CSP versus KSP in the CAPI driver; always-encrypted on the 2025 managed-identity path (stated only for 2022); Cloud Sync writing certificateUserIds; Graph writes for SOA-converted users; an official Microsoft statement that Entra has no RADIUS; NPS authorizing without AD; Aruba ClearPass documentation (HTTP 403); ISE or ClearPass SCEP or EST enrollment for their own certificates; the NAC partner's Entra app credential type. This is the program's research, under review, not an endorsement by any federal agency.`,
  "Research brief sections 1.1 and 8; Books 04, 06, 07 and 09.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full lists on the following slides. All sources opened Oct. 23, 2026.");
}

{
  const s = content("Backup", "Couldn't verify");
  T(s, "Gaps", bullets([
    "CyberArk drivers in AWS GovCloud and Google government regions: the driver pages show no us-gov regions or aws-us-gov partition.",
    "Whether the CLM's CAPI driver generates a CSP (KeySpec 1) or KSP key for SQL Server: not documented.",
    "\"Always encrypted\" for SQL Server 2025's managed-identity path: stated only on the 2022 tutorial.",
    "Cloud Sync writing certificateUserIds; Graph writes for Source-of-Authority-converted users; HR-driven provisioning of the attribute.",
    "An official Microsoft statement that Entra ID has no RADIUS service (only a Microsoft Q&A answer); NPS authorizing without AD.",
    "Aruba ClearPass documentation (HTTP 403, not bypassed): device-ID formats, government cloud, server-certificate enrollment.",
    "Cisco ISE or ClearPass SCEP or EST enrollment of their own server certificates; native ACME for ISE (community post only).",
    "The NAC partner's Entra app credential type; whether Idira's FedRAMP High offering includes Secrets Hub or Secrets Manager.",
    "Google Assured Workloads per-package membership for Certificate Manager, CA Service, KMS and Secret Manager (inferred from table position).",
  ], 12.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 5, fontSize: 12.5 });
  sources(s, "Sources: research brief §8 (couldn't verify), Oct. 23, 2026.");
}

const srcSlide = (title, src) => {
  const s = content("Backup", title);
  T(s, "Source list", bullets(src, 11), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 3, fontSize: 11 });
  sources(s, "Sources: primary documents as listed. Access date for all: Oct. 23, 2026.");
};
srcSlide("Sources: Microsoft", [
  "SQL Server: Entra authentication overview; Arc setup tutorial; managed identity; managed identity setup; automation tutorial; Rotate certificates; without Arc; Arc in US Government; encrypting connections; certificate requirements; Azure SQL root CA change.",
  "Azure: managed identity on Arc-enabled servers; Key Vault certificates; auto-rotation; CSR merge; renewal; certificate lifecycle architecture; Azure Government comparison.",
  "Entra: CBA overview, configuration, classic CA store, technical concepts; certificateUserIds; Windows smart card sign-in; migration from federation; authentication strengths; Source of Authority; Entra join planning.",
  "Windows: KB5014754; smart card logon with third-party CAs; Windows security book, smart cards; Public Sector Blog, name-based strong mapping in government scenarios.",
  "Network: Plan NPS as a RADIUS server and proxy; EAP-TLS certificate requirements; NPS extension for Entra MFA; RADIUS with Entra ID; Microsoft Q&A RADIUS answer; NAC integration with Intune; Global Secure Access overview, Private Access, known limitations.",
]);
srcSlide("Sources: CyberArk, clouds, government and vendors", [
  "CyberArk Certificate Manager, Self-Hosted 26.1 (docs.venafi.com): system requirements; cloud overview; Azure prerequisites, credential and permissions; Azure Key Vault Web SDK schema; ACM CA template; AWS driver, object settings, lifecycle, FQDN; Google Cloud Load Balancer; Google CA Service; HashiCorp Vault; CAPI driver and object settings.",
  "CyberArk docs: Secrets Manager (Self-Hosted); Secrets Hub.",
  "AWS: ACM managed renewal, import, private certificate renewal and export; GovCloud ACM, Private CA and KMS; Secrets Manager and endpoints.",
  "Google Cloud: Certificate Manager; CA Service; Secret Manager; Cloud KMS; Assured Workloads supported products.",
  "IDManagement.gov: CBA on Entra ID guide v2.0; Network Smart Card Logon for Windows; FCPCA trust; Windows Hello for Business v1.3; FPKI notifications; GSA PKI SSP guide.",
  "Cisco: FN74227; ISE 3.1 and 3.4 administrator guides  ·  HPE Aruba ClearPass Intune pages (HTTP 403, not read)  ·  FedRAMP Marketplace products.json (Oct. 23, 2026).",
]);

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:\n" + per.map((p) => `  ${p.slide}  ${(p.n / WPM).toFixed(1)} min  ${p.n} w  ${p.title}`).join("\n"));
const unused = Object.keys(NARR).filter((t) => !used.has(t));
if (unused.length) throw new Error("narration with no slide: " + unused.join(" | "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
