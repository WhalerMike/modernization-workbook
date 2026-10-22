// Who Names the Device After AD?  A ~17-minute plain-language EXPLAINER for a federal architect still learning DNS and device management.
//   1 Title · 2 Two jobs AD did at once · 3 Who names the device now · 4 Why clients can't register securely
//   5 DHCP registers on the device's behalf · 6 The migration trap · 7 IPv6 addresses no one registers
//   8 Servers and the cloud · 9 Remote and VPN clients · 10 Why names still matter · 11 Platform-by-platform table
//   12 What the agency must do (program design guidance) · 13 Decisions, next steps and where this fits
//   Backup (not narrated): full per-platform table, what couldn't be verified, full source lists.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_Device_Naming.pptx
// Modeled on presentations/research-trinzic-multicloud/build.js and reuses the shared kit in ../_build/ (icons and backgrounds unchanged).
// Every fact comes from C:\tmp\ib\research_device_naming.md (primary; all sources opened 2026-10-22), Book 05 Ch04 and
// Book 08 Ch04, Ch07 and Ch10 (docs/books/), and C:\tmp\ib\research_multicloud.md.
// Recommendations are labeled PROGRAM DESIGN GUIDANCE; inferences are labeled as such; vendor documentation is named as such.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const path = require("path");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Who Names the Device After AD?", title: "Explainer",
  footer: "Who Names the Device After AD?  ·  Explainer  ·  Research — under review" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Research_Device_Naming.pptx";

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
  const s = titleSlide(SEC, "Who Names the Device After AD?", "A plain-language explainer  ·  Research — under review");
  txt(s, "Session map", [
    { text: "ABOUT 17 MINUTES  ·  BUILT FOR ARCHITECTS STILL LEARNING DNS AND DEVICE MANAGEMENT", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The two jobs AD did at once  ·  Who names each kind of device now", options: { color: HEX.ink, breakLine: true } },
    { text: "Who registers DNS records: DHCP, the clouds, and the gaps (IPv6, remote clients)", options: { color: HEX.ink, breakLine: true } },
    { text: "Why names still matter  ·  What the agency must do, and when", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Microsoft Learn, Apple, systemd, cloud-init, FreeIPA, AWS and Infoblox NIOS 9.1 docs; IETF RFCs; Books 05 and 08. All opened Oct. 22, 2026.", 6.08);
  notes(s,
`When an agency retires Active Directory, two questions come up that nobody owned before, because AD answered them quietly. Who gives a device its name? And who puts that name into DNS, the system that turns names into network addresses, so other machines can find it?

This explainer walks through both. It's built for someone still learning, so every term is explained the first time it appears. We start with the two jobs AD did at once. Then who names each kind of device now. Then why devices can't register their own names securely without AD, what takes over, and where nothing does, such as IPv6 and remote clients. Then why names still matter, and a checklist of what the agency must do, before, during and after cutover.

This is research under review. Every fact comes from sources opened on October twenty-second, 2026. Where I drew a conclusion that no source states directly, I'll call it an inference. And recommendations are labeled program design guidance, not vendor requirements.`,
  "Research brief, After Active Directory: Who Names Devices, Who Registers Their DNS Records, and What an Agency Must Do (verified Oct. 22, 2026); Microsoft Learn, Apple, freedesktop.org, cloud-init, NetworkManager, FreeIPA, AWS and Infoblox NIOS 9.1 documentation; IETF RFCs; Book 05 Ch04; Book 08 Ch04, Ch07, Ch10.");
}

// ================================================================== 2 Two jobs AD did at once
{
  const s = content(SEC, "Two jobs Active Directory did at once");
  tag(s, "What");
  label(s, "Illus", "ILLUSTRATIVE NAMES", 0.6, 1.45, 3.0, HEX.red, "left");
  subhead(s, "Job 1 head", "JOB 1 — THE NAME", 0.6, 1.78, 3.0, HEX.navy);
  node(s, "PC", 0.6, 2.1, 3.0, 1.55, HEX.navy, HEX.navyTint, "Domain-joined Windows PC",
    "Computer name pc-0042 + primary DNS suffix corp.agency.gov (the AD domain's name)", 11.5);
  subhead(s, "Job 2 head", "JOB 2 — THE DNS RECORD", 4.65, 1.78, 3.0, HEX.teal);
  node(s, "Zone", 4.65, 2.1, 3.0, 1.55, HEX.teal, HEX.tealTint, "AD-integrated DNS zone",
    "Stored in the directory on domain controllers; secure updates only, by default", 11.5);
  arrow(s, "Client update", 3.6, 2.9, 4.65, 2.9, HEX.navy);
  txt(s, "Client update label", "A record, signed", { x: 3.62, y: 2.3, w: 1.0, h: 0.55, fontSize: 10.5, italic: true, color: HEX.navy, align: "center", valign: "bottom" });
  node(s, "DHCP", 4.65, 4.15, 3.0, 0.95, HEX.amber, HEX.amberTint, "Windows DHCP server", "Registers the PTR (reverse) record", 11.5);
  arrow(s, "DHCP update", 6.15, 4.15, 6.15, 3.65, HEX.amber);
  T(s, "Default note", [
    { text: "By default ", options: { bold: true, color: HEX.navy } },
    { text: "the client registers its own A record and the DHCP server registers the PTR. Signing uses Kerberos (GSS-TSIG on the wire)." },
  ], { x: 0.6, y: 4.15, w: 3.85, h: 0.95, fontSize: 11.5 });
  panel(s, "Words", 7.95, 1.5, 4.8, 3.7, HEX.navy, "FFFFFF", "WORDS ON THIS SLIDE", null, [
    "A record: name → IPv4 address. AAAA: name → IPv6 address",
    "PTR record: address → name, kept in a reverse zone",
    "Dynamic update (RFC 2136): a device or server adds or changes DNS records over the network",
    "Secure dynamic update: signed with Kerberos; only the name's owner can change it later",
    "Kerberos: AD's ticket-based sign-in protocol; a domain-joined PC has a machine account",
  ], 11.5);
  callout(s, "Takeaway", 5.45, 0.85, "FaLightbulb", HEX.amber, "When AD retires, ", "both jobs need a new owner. The second one is harder.");
  sources(s, "Sources: Book 08 Ch04 (AD-integrated zones, secure dynamic update, GSS-TSIG); Microsoft Learn Dynamic update [S26]; Policy CSP ADMX_DnsClient [S27].");
  notes(s,
`In Active Directory, a Windows PC joined to the domain gets two jobs done almost for free.

Job one is the name. The PC has a computer name, say pc-zero-zero-four-two, and a primary DNS suffix, which is usually the name of the AD domain it joined. Put them together and you get its full name, its FQDN, or fully qualified domain name.

Job two is the DNS record. An A record maps a name to an IPv4 address; an AAAA record maps a name to an IPv6 address; and a PTR record goes the other way, address to name, in what's called a reverse zone. Dynamic update is the standard way to add or change those records over the network.

In AD, the domain's DNS zone lives in the directory, on domain controllers, and by default it accepts only secure dynamic updates. Secure means the update is signed with Kerberos, AD's ticket-based sign-in protocol, and once a name exists, only its owner can change it. The domain-joined PC has a machine account in AD, so it can sign. By default, the PC registers its own A record and the Windows DHCP server registers the PTR.

When AD retires, both jobs need a new owner, and the second one is harder.`,
  "Book 08, Chapter 04, What AD-integrated DNS actually is, and Secure dynamic updates and the DHCP server; Microsoft Learn, Dynamic update (Windows Server DNS) [S26]; Policy CSP ADMX_DnsClient [S27].");
}

// ================================================================== 3 Who names the device now
{
  const s = content(SEC, "Who names the device now");
  tag(s, "Who");
  table(s, "Naming", 1.45, [2.75, 4.35, 5.05], ["Platform", "What sets the name", "Limits and caveats"], [
    ["Windows: classic Autopilot, Entra join", "Profile name template, with %SERIAL% or %RAND:x%", "15 characters or fewer; letters, numbers, hyphens; not all numbers"],
    ["Windows: classic Autopilot, hybrid join", "Domain Join profile prefix; the rest is random", "Up to 15 characters; no %SERIAL% or %RAND:x%"],
    ["Windows: Autopilot device preparation", "\"Apply device name template\": prefix + %RAND:4% or %SERIAL%", "Up to 63 characters, only for devices with device association; no effect on corporate-identifier-only devices"],
    ["Windows, after enrollment", "Intune Rename (corporate-owned), carried out by the Accounts CSP", "Reboot needed. Not for hybrid-joined devices: use domain methods. Macros don't guarantee unique names"],
    ["macOS", "Intune Rename or bulk rename, after enrollment", "No enrollment-time name template found for macOS"],
    ["Linux", "cloud-init hostname or fqdn, or a static hostnamectl name", "64 characters; a DHCP-supplied (transient) name is only a fallback"],
    ["Servers and Azure Arc", "Build pipeline or OS install; Arc resource name defaults to the hostname", "Arc resource name can't change without disconnecting and reconnecting the agent"],
    ["Cloud VMs", "Azure: computerName at create. AWS: IP name or resource name", "Azure: can't change after create; 15 characters Windows, 64 Linux"],
  ], { fontSize: 11 });
  sources(s, "Sources: Microsoft Learn Autopilot and device preparation [S1–S4], Rename [S5], Accounts CSP [S6], macOS ADE [S7]; systemd, cloud-init [S10–S12]; Arc [S15, S16]; Azure [S17]; AWS [S21].");
  notes(s,
`So who names the device now? The short answer: whatever provisions it, at build time.

For Windows, that's usually Autopilot, which sets up a new PC out of the box. Classic Autopilot with Microsoft Entra join, which joins the PC to Microsoft's cloud directory instead of AD, has a name template: fifteen characters or fewer, with macros for the serial number or random digits. Hybrid join, which joins both AD and Entra, gets only a prefix, and the rest is random.

The newer Autopilot device preparation now has a name template too, up to sixty-three characters. The caveat matters: it works only for devices with device association, and has no effect on devices onboarded with corporate identifiers only. As an inference, Book 05's description of device preparation needs a review against this.

After enrollment, Intune's Rename action can rename corporate-owned Windows PCs and Macs, but not hybrid-joined devices, which need domain methods. Macs have no enrollment-time name template that I found; you rename after enrollment.

Linux takes its name from cloud-init or a static hostname. Azure Arc keeps the server's hostname as a fixed resource name. Cloud VMs get names at create time.`,
  "Microsoft Learn: Autopilot device preparation Entra join policy [S1], Compare device preparation and Autopilot [S2], Entra join Autopilot profile [S3], Hybrid join Domain Join profile [S4], Rename a device in Intune [S5], Accounts CSP [S6], macOS automated device enrollment [S7]; hostnamectl and hostname(5) [S10, S11]; cloud-init Set Hostname [S12]; azcmagent connect and Arc rename [S15, S16]; Azure ComputerName [S17]; EC2 hostname types [S21]; Book 05 Ch04, Naming.");
}

// ================================================================== 4 Why clients can't register securely
{
  const s = content(SEC, "Why devices can't register themselves securely");
  tag(s, "Why");
  const y1 = 1.6, nh = 1.2, nw = 2.55, xs = [0.6, 3.6, 6.6];
  node(s, "S1", xs[0], y1, nw, nh, HEX.navy, HEX.navyTint, "Entra-joined PC", "No AD machine account; no AD-derived DNS suffix (inference)", 11);
  node(s, "S2", xs[1], y1, nw, nh, HEX.amber, HEX.amberTint, "1  Unsigned update", "Tried first, by default", 11);
  node(s, "S3", xs[2], y1, nw, nh, HEX.red, HEX.redTint, "Secure-only zone", "Refuses it, as it should", 11);
  arrow(s, "S a1", xs[0] + nw, y1 + nh / 2, xs[1], y1 + nh / 2);
  arrow(s, "S a2", xs[1] + nw, y1 + nh / 2, xs[2], y1 + nh / 2);
  const y2 = 3.35;
  node(s, "S4", xs[2], y2, nw, nh, HEX.amber, HEX.amberTint, "2  Secure update", "Windows supports Kerberos only", 11);
  node(s, "S5", xs[1], y2, nw, nh, HEX.red, HEX.redTint, "Can't sign", "No Kerberos identity in the domain (inference)", 11);
  node(s, "S6", xs[0], y2, nw, nh, HEX.red, "FFFFFF", "Result", "No record from this client at all (inference)", 11);
  arrow(s, "S a3", xs[2] + nw / 2, y1 + nh, xs[2] + nw / 2, y2);
  arrow(s, "S a4", xs[2], y2 + nh / 2, xs[1] + nw, y2 + nh / 2);
  arrow(s, "S a5", xs[1], y2 + nh / 2, xs[0] + nw, y2 + nh / 2);
  T(s, "Open zone", [
    { text: "Don't fix it by opening the zone. ", options: { bold: true, color: HEX.red } },
    { text: "In a zone without secure update, \"any computer on the network can modify the existing A record.\"" },
  ], { x: 0.6, y: 4.8, w: 8.55, h: 0.62, fontSize: 12 });
  panel(s, "Also", 9.4, 1.5, 3.35, 3.95, HEX.navy, "FFFFFF", "ALSO TRUE", null, [
    "Over VPN, Windows doesn't try dynamic update by default",
    "Since the May 2020 update, no registration on servers named in an NRPT rule",
    "ipconfig /registerdns without permission: \"the registration silently fails\"",
    "Microsoft's advice to let clients register is written for domain-joined clients (inference: it can't apply here)",
  ], 11.5);
  callout(s, "Takeaway", 5.6, 0.85, "FaLock", HEX.navy, "So: ", "something else has to register endpoints, and it has to sign its updates.");
  sources(s, "Sources: Microsoft Learn Dynamic update [S26]; ADMX_DnsClient [S27]; enable/disable DNS updates [S28]; DNS dynamic update troubleshooting [S29]; DirectAccess known issues [S56].");
  notes(s,
`Here's the core problem. A PC joined only to Microsoft Entra ID still tries to register its name in DNS. What happens?

By default, Windows tries an unsigned update first, and only if that's refused does it try a secure one. A zone that is set to accept only secure updates refuses the unsigned attempt, as it should. Then the secure attempt: Microsoft documents that Windows dynamic update clients and DNS servers can use only Kerberos for secure update. As an inference, an Entra-joined PC has no machine account in the domain, so it can't sign, and the zone gets no record from that client at all.

The tempting fix is to let the zone accept unsigned updates. Don't. Microsoft says that without secure update, any computer on the network can modify the existing A record.

More facts. Over a VPN, Windows doesn't attempt dynamic update by default. Since the May 2020 Windows 10 update, it also skips servers named in an NRPT rule, the Name Resolution Policy Table, which sends certain names to certain DNS servers. And Microsoft's advice to let clients register their own records assumes domain-joined clients. As an inference, it can't apply here.

So something else has to register endpoints, and it has to sign.`,
  "Microsoft Learn: Dynamic update (Windows Server DNS) [S26]; Policy CSP ADMX_DnsClient [S27]; How to enable or disable DNS updates in Windows [S28]; Troubleshooting DNS dynamic update issues [S29]; DirectAccess known issues (DNS registration and NRPT) [S56].");
}

// ================================================================== 5 DHCP registers on the device's behalf
{
  const s = content(SEC, "DHCP registers the record on the device's behalf");
  tag(s, "How");
  const y = 1.75, h = 1.45;
  node(s, "D dev", 0.6, y, 2.2, h, HEX.navy, HEX.navyTint, "Device", "Asks for an address; sends its host name", 11);
  node(s, "D dhcp", 3.9, y, 2.5, h, HEX.amber, HEX.amberTint, "DHCP server", "Set to \"always update DNS\"; signs with TSIG or GSS-TSIG", 11);
  node(s, "D zone", 7.5, y, 2.7, h, HEX.teal, HEX.tealTint, "DNS zone (DDI)", "\"Allow updates from\" = the DHCP servers only", 11);
  arrow(s, "D a1", 2.8, y + h / 2, 3.9, y + h / 2);
  txt(s, "D a1 l", "option 12 or 81", { x: 2.82, y: y + 0.1, w: 1.06, h: 0.6, fontSize: 10.5, italic: true, color: HEX.slate, align: "center", valign: "bottom" });
  arrow(s, "D a2", 6.4, y + h / 2, 7.5, y + h / 2);
  txt(s, "D a2 l", "A, AAAA, PTR (signed)", { x: 6.42, y: y + 0.1, w: 1.06, h: 0.6, fontSize: 10.5, italic: true, color: HEX.slate, align: "center", valign: "bottom" });
  T(s, "D terms", [
    { text: "DHCP ", options: { bold: true, color: HEX.amber } }, { text: "hands a device its address for a lease period.  " },
    { text: "Option 81 ", options: { bold: true, color: HEX.amber } }, { text: "(IPv6: option 39) carries the device's full name.  " },
    { text: "TSIG / GSS-TSIG ", options: { bold: true, color: HEX.amber } }, { text: "sign an update with a shared key or Kerberos." },
  ], { x: 0.6, y: 3.35, w: 9.6, h: 0.62, fontSize: 11.5 });
  node(s, "D own", 0.6, 4.1, 4.7, 1.25, HEX.navy, "FFFFFF", "Ownership record beside each name",
    "TXT (Infoblox \"Interim\", the default) or DHCID (RFC 4701, \"Standard\"): one client per name", 11);
  node(s, "D exp", 5.5, 4.1, 4.7, 1.25, HEX.teal, "FFFFFF", "Lease expires",
    "Server removes the A, AAAA and PTR records it created, not records the client created", 11);
  panel(s, "D nios", 10.4, 1.5, 2.35, 4.85, HEX.navy, HEX.navyTint, "INFOBLOX NIOS 9.1", null, [
    "Accepts no DDNS updates by default",
    "Rewrites invalid name characters (IPv4 only, one policy)",
    "Duplicate names: first client wins",
    "Always updates the PTR",
  ], 11);
  T(s, "D win", [
    { text: "Windows DHCP equivalent: ", options: { bold: true, color: HEX.navy } },
    { text: "\"always update both\" makes the client skip its own attempt; name protection writes DHCID records (Book 08 Ch04)." },
  ], { x: 0.6, y: 5.55, w: 9.6, h: 0.62, fontSize: 11.5 });
  sources(s, "Sources: RFC 4701–4704 [S31–S34]; Microsoft Learn Dynamic update [S26]; Infoblox NIOS 9.1 DDNS pages [S40–S44, S47]; Book 08 Ch04.");
  notes(s,
`What takes over is the DHCP server. DHCP is the service that hands a device its address for a set time, called a lease. It already talks to every device, so it can register names for them.

Here's the flow. The device asks for an address and sends its host name, in DHCP option twelve, or its full name in option eighty-one, the client FQDN option. For IPv6 the equivalent is DHCPv6 option thirty-nine. The DHCP server is set to always update DNS, and signs its updates with TSIG, a shared-key signature, or GSS-TSIG, which uses Kerberos. On Infoblox NIOS, a DDI platform, meaning DNS, DHCP and IP address management in one product, a server accepts no dynamic updates by default; a setting called Allow updates from lists who may. Make that the DHCP servers only.

Two safeguards. Beside each name, the server writes an ownership record, so only one client holds a name at a time. That's a TXT record in Infoblox's default Interim mode, or a DHCID record in Standard mode. And when the lease expires, the server removes the records it created.

On Windows DHCP, always updating both records makes the client skip its own attempt.`,
  "RFC 4701 DHCID, RFC 4702 DHCPv4 Client FQDN option, RFC 4703 FQDN conflict resolution, RFC 4704 DHCPv6 Client FQDN option [S31–S34]; Microsoft Learn Dynamic update [S26]; Infoblox NIOS 9.1: Understanding DDNS Updates from DHCP, About the Client FQDN Option, Sending Updates for Zones on an External Name Server, Configuring DNS Servers for DDNS, Configuring DDNS Features, Accepting DDNS Updates from DHCP Clients [S40–S44, S47]; Book 08 Ch04, Secure dynamic updates and the DHCP server.");
}

// ================================================================== 6 The migration trap
{
  const s = content(SEC, "The migration trap: who owns the existing names");
  tag(s, "Why");
  panel(s, "M1", 0.6, 1.5, 6.0, 3.95, HEX.red, HEX.redTint, "TRAP 1", "Ownership records don't carry over", [
    "Infoblox's default \"Interim\" mode checks ownership with TXT records; \"Standard\" uses DHCID",
    "Records registered by Microsoft-based systems have no TXT: \"new DDNS updates fail after the migration\"",
    "Mixed Microsoft and ISC DHCP environments are a documented failure case",
    "Mobility: a laptop's wired and Wi-Fi interfaces have different DHCIDs",
  ], 12);
  panel(s, "M2", 6.75, 1.5, 6.0, 3.95, HEX.amber, HEX.amberTint, "TRAP 2", "Rotating Wi-Fi addresses on Macs", [
    "Macs use a different Wi-Fi hardware (MAC) address per network: Fixed is the default on WPA2-or-better; Rotating changes every 2 weeks",
    "An MDM network profile can turn it off: DisableAssociationMACRandomization (macOS 15 and later; not under User Enrollment)",
    "Inference: rotating MACs change the DHCP identity that ownership records are built on, the same \"mobility\" failure",
    "Android and Windows equivalents: not verified",
  ], 12);
  callout(s, "Guidance", 5.6, 0.85, "FaListCheck", HEX.navy, "PROGRAM DESIGN GUIDANCE: ",
    "pick Standard or Interim once, migrate deliberately, and turn off MAC randomization on agency Wi-Fi.");
  sources(s, "Sources: Infoblox NIOS 9.1 Enabling DDNS (Interim vs Standard) [S45], DDNS Update Verification [S46]; Apple private Wi-Fi addresses [S49]; Apple Wi-Fi payload schema [S50].");
  notes(s,
`Now the migration trap. Ownership records only help if the old and new systems agree on them.

Infoblox's default mode, Interim, checks ownership with TXT records. Its Standard mode uses DHCID records, the format the standards define. Infoblox documents three cases where TXT checking fails. First, migration from Microsoft-based systems: those records have no TXT, and, in Infoblox's words, new DDNS updates fail after the migration. Second, a mix of Microsoft and ISC DHCP servers. Third, mobility: a laptop's wired and Wi-Fi interfaces look like two different clients.

The second trap is on Macs. Apple's private Wi-Fi address feature gives a Mac a different hardware address, its MAC address, on each network. Fixed is the default on WPA2 or better networks; Rotating changes the address every two weeks. An MDM, mobile device management, profile can turn it off with a key called DisableAssociationMACRandomization, on macOS fifteen and later. As an inference, a rotating address changes the DHCP identity that ownership records rest on, the same mobility failure. I didn't verify the Android or Windows equivalents.

The program design guidance: pick Standard or Interim once, migrate deliberately, and turn off address randomization on agency Wi-Fi.`,
  "Infoblox NIOS 9.1: Enabling DDNS for IPv4 and IPv6 DHCP Clients (Interim vs Standard) [S45], Configuring DDNS Update Verification [S46]; Apple Support, Use private Wi-Fi addresses on Apple devices [S49]; apple/device-management com.apple.wifi.managed.yaml [S50]; research checklist steps 6 and 7 (program design guidance).");
}

// ================================================================== 7 IPv6
{
  const s = content(SEC, "IPv6: addresses that nobody registers");
  tag(s, "Why");
  subhead(s, "V6 p1", "PATH 1 — DHCPv6 GIVES THE ADDRESS (IA_NA)", 0.6, 1.5, 8.0, HEX.teal);
  const w = 2.45, xs = [0.6, 3.45, 6.3];
  node(s, "V a1", xs[0], 1.85, w, 0.95, HEX.navy, "FFFFFF", "Device", "Gets an address from DHCPv6", 11);
  node(s, "V a2", xs[1], 1.85, w, 0.95, HEX.amber, HEX.amberTint, "DHCPv6 server", "Knows the address; option 39", 11);
  node(s, "V a3", xs[2], 1.85, w, 0.95, HEX.teal, HEX.tealTint, "AAAA record", "Can be registered", 11);
  arrow(s, "V a12", xs[0] + w, 2.32, xs[1], 2.32); arrow(s, "V a23", xs[1] + w, 2.32, xs[2], 2.32);
  subhead(s, "V6 p2", "PATH 2 — THE DEVICE FORMS ITS OWN ADDRESS (SLAAC, PRIVACY)", 0.6, 3.0, 8.0, HEX.red);
  node(s, "V b1", xs[0], 3.35, w, 0.95, HEX.navy, "FFFFFF", "Device", "Builds its own address", 11);
  node(s, "V b2", xs[1], 3.35, w, 0.95, HEX.red, HEX.redTint, "No DHCPv6 server", "Never learns the address (inference)", 11);
  node(s, "V b3", xs[2], 3.35, w, 0.95, HEX.red, "FFFFFF", "No AAAA record", "Absent by design (inference)", 11);
  arrow(s, "V b12", xs[0] + w, 3.82, xs[1], 3.82); arrow(s, "V b23", xs[1] + w, 3.82, xs[2], 3.82);
  T(s, "V terms", [
    { text: "SLAAC ", options: { bold: true, color: HEX.navy } }, { text: "(RFC 4862): hosts build their own IPv6 addresses from router announcements.  " },
    { text: "Temporary (privacy) addresses ", options: { bold: true, color: HEX.navy } }, { text: "(RFC 8981) \"are typically employed for initiating outgoing sessions.\"" },
  ], { x: 0.6, y: 4.5, w: 8.15, h: 0.85, fontSize: 11.5 });
  panel(s, "V so", 9.0, 1.5, 3.75, 4.85, HEX.navy, HEX.navyTint, "WHAT FOLLOWS", null, [
    "Inference: for Entra-joined endpoints, treat AAAA records for SLAAC or privacy addresses as absent",
    "Find endpoints by DHCP-assigned IPv4 or DHCPv6 addresses",
    "Correlate IPv6 activity from DHCP and neighbor logs, not DNS",
    "AWS: only the EC2 resource name returns AAAA",
    "Azure DNS Private Resolver: no IPv6-enabled subnets (Book 08 Ch07)",
  ], 11.5);
  T(s, "V unv", [
    { text: "Couldn't verify: ", options: { bold: true, color: HEX.red } },
    { text: "whether Windows registers its temporary IPv6 addresses through dynamic update. No Microsoft statement was found." },
  ], { x: 0.6, y: 5.55, w: 8.15, h: 0.62, fontSize: 11.5 });
  sources(s, "Sources: RFC 4862 [S37], RFC 8981 [S38], RFC 4704 [S34]; AWS EC2 hostname types [S21]; Book 08 Ch07; research brief, Couldn't verify.");
  notes(s,
`There are two ways a device gets an IPv6 address. In the first, a DHCPv6 server assigns it. The server knows the address, so it can register an AAAA record using option thirty-nine. In the second, called SLAAC, stateless address autoconfiguration, the device builds its own address from what the router announces. Devices also create temporary, or privacy, addresses, typically used for outgoing connections.

The DHCPv6 name option covers only addresses DHCPv6 assigned. So, as an inference, no DHCPv6 server ever learns a SLAAC address, and no server-side registration creates an AAAA record for it. The device could register it itself, but as we saw, a post-AD Windows client can't do that securely.

The consequence, also an inference: for Entra-joined endpoints, treat AAAA records for SLAAC or privacy addresses as absent by design. Find endpoints by their DHCP-assigned addresses, and correlate IPv6 activity from DHCP and neighbor logs, not DNS.

Two cloud notes: in AWS, only the instance resource name returns AAAA records, and Azure's DNS Private Resolver doesn't support IPv6-enabled subnets. And I couldn't verify whether Windows registers its temporary addresses.`,
  "RFC 4862 IPv6 Stateless Address Autoconfiguration [S37]; RFC 8981 Temporary Address Extensions [S38]; RFC 4704 DHCPv6 Client FQDN option [S34]; Amazon EC2 instance hostname types [S21]; Book 08 Ch07 (Azure DNS Private Resolver platform constraints); research brief, Couldn't verify (Windows temporary IPv6 addresses).");
}

// ================================================================== 8 Servers and the cloud
{
  const s = content(SEC, "Servers and the cloud register differently");
  tag(s, "How");
  panel(s, "C srv", 0.6, 1.5, 3.95, 4.85, HEX.navy, HEX.navyTint, "ON-PREMISES SERVERS", "Explicit records", [
    "Static-IP servers: static records in IPAM/DDI; static records aren't scavenged",
    "Design guidance: the build pipeline creates and deletes A and PTR records",
    "Linux in an IdM domain: --enable-dns-updates signs with GSS-TSIG, but falls back to unauthenticated updates if that fails at install",
    "Azure Arc: set --resource-name to match the DNS name; it can't change later",
  ], 11.5);
  panel(s, "C az", 4.7, 1.5, 3.95, 4.85, HEX.teal, HEX.tealTint, "AZURE", "Autoregistration, with limits", [
    "Private DNS autoregistration: VMs only, primary NIC only, A records only, no PTR",
    "One autoregistration zone per virtual network",
    "Records go when the VM is deleted or stopped; deleted records can't be restored, and unlinking deletes them (Book 08 Ch10)",
    "VM computer name is fixed at create",
  ], 11.5);
  panel(s, "C aws", 8.8, 1.5, 3.95, 4.85, HEX.amber, HEX.amberTint, "AWS", "Your own pipeline", [
    "Default names: ip-10-24-34-0.ec2.internal (IP name) or the instance ID (resource name)",
    "AWS (2016 blog): VPC DNS \"doesn't dynamically create resource records\"",
    "AWS sample: EventBridge + Lambda + DynamoDB creates and removes A, PTR, CNAME",
    "No built-in registration into your own Route 53 zones found in AWS docs",
  ], 11.5);
  sources(s, "Sources: Microsoft Learn aging [S30], Arc [S15, S16], Azure VM [S17], autoregistration [S20]; FreeIPA [S14]; AWS [S21–S23]; Book 08 Ch07, Ch10.");
  notes(s,
`Servers and cloud machines don't follow the endpoint pattern.

On premises, servers with fixed addresses get static records in the IPAM and DDI system. Static records aren't removed by scavenging, the cleanup job that deletes stale entries. As program design guidance, the build pipeline that creates a server should also create and delete its A and PTR records. Linux servers in an identity domain can register themselves with GSS-TSIG, but watch for one documented behavior: if signing fails at install, the client falls back to unauthenticated updates. For Azure Arc, set the resource name to match the DNS name at connect time, because it can't change later.

In Azure, private DNS autoregistration does the job, with limits: virtual machines only, the primary network interface only, A records only, no PTR records, and one autoregistration zone per virtual network. Records disappear when the VM is deleted or stopped, deleted records can't be restored, and unlinking the network deletes them.

In AWS, instances get AWS-made names. An AWS blog from 2016 says VPC DNS doesn't create records dynamically, and offers a sample event-driven pipeline. I found no built-in registration into your own Route 53 zones in AWS's docs.`,
  "Microsoft Learn: DNS aging and scavenging [S30], azcmagent connect [S15], Rename Azure Arc-enabled servers [S16], VirtualMachineOSProfile.ComputerName [S17], Azure DNS private zones autoregistration [S20]; FreeIPA ipa-client-install [S14]; AWS: EC2 instance hostname types [S21], Working with private hosted zones [S22], AWS Compute Blog, Building a Dynamic DNS for Route 53 (2016) [S23]; Book 08 Ch07 and Ch10.");
}

// ================================================================== 9 Remote and VPN clients
{
  const s = content(SEC, "Remote and VPN clients: resolved, not registered");
  tag(s, "Who");
  const y = 1.75, w = 2.1, h = 1.3, xs = [0.6, 3.15, 5.7];
  node(s, "R lap", xs[0], y, w, h, HEX.navy, HEX.navyTint, "Remote laptop", "Global Secure Access client; NRPT rules for private suffixes", 11);
  node(s, "R edge", xs[1], y, w, h, HEX.teal, HEX.tealTint, "Secure Access edge", "DNS proxy in Microsoft's network", 11);
  node(s, "R conn", xs[2], y, w, h, HEX.amber, HEX.amberTint, "Connector", "Resolves against on-premises DNS", 11);
  arrow(s, "R a1", xs[0] + w, y + h / 2, xs[1], y + h / 2, HEX.slate, true);
  arrow(s, "R a2", xs[1] + w, y + h / 2, xs[2], y + h / 2, HEX.slate, true);
  T(s, "R synth", [
    { text: "The client gets a synthetic IP ", options: { bold: true, color: HEX.navy } },
    { text: "and a search suffix, AppId.globalsecureaccess.local. Nothing documents Global Secure Access registering the laptop's own name or address in agency DNS." },
  ], { x: 0.6, y: 3.2, w: 7.4, h: 0.85, fontSize: 12 });
  node(s, "R inf", 0.6, 4.2, 7.4, 1.0, HEX.red, HEX.redTint, "Inference: remote clients are resolvers of names, not registrants",
    "Windows also skips dynamic update over VPN by default. Third-party VPN DDNS wasn't researched.", 11.5);
  panel(s, "R hd", 8.25, 1.5, 4.5, 4.85, HEX.navy, "FFFFFF", "SO THE HELP DESK FINDS DEVICES BY NAME IN INTUNE", null, [
    "Remote Help starts from Devices > All devices > select the device: no DNS lookup needed",
    "The help desk picks the device by its Intune device name",
    "TeamViewer integration passes the Entra device ID, with device name as a fallback",
    "Inference: that name must be unique and meaningful",
    "Admin-center rename doesn't change the Management name or the Company Portal name",
  ], 11.5);
  sources(s, "Sources: Microsoft Learn Global Secure Access Private DNS [S51]; Dynamic update [S26]; NRPT [S56]; Remote Help [S52]; TeamViewer [S53]; Rename [S5].");
  notes(s,
`What about people working remotely?

Take Microsoft's Global Secure Access, which includes Entra Private Access. You list your private DNS suffixes, and its client on the laptop turns them into NRPT rules. Matching queries go to a DNS proxy at Microsoft's edge, and a connector inside your network resolves them against on-premises DNS. The laptop gets back a synthetic IP address, a stand-in that routes through the tunnel.

Notice what's missing: that's all about the laptop finding names. I found no primary source saying Global Secure Access registers the laptop's own name or address in agency DNS. So, as an inference, remote clients are resolvers of names, not registrants. Windows also skips dynamic update over VPN by default. Third-party VPN products weren't researched.

That changes how the help desk finds a remote device. Intune's Remote Help starts from the Intune admin center: you pick the device from the device list, and no DNS lookup is needed. But you pick it by its Intune device name. As an inference, that name must be unique and meaningful. One subtlety: renaming in the admin center doesn't change the management name or the name in the Company Portal app.`,
  "Microsoft Learn: Understand Microsoft Entra Private DNS and Troubleshoot application access (Global Secure Access) [S51]; Dynamic update [S26]; DirectAccess known issues (NRPT) [S56]; Using Remote Help with Microsoft Intune [S52]; TeamViewer integration in Intune [S53]; Rename a device in Intune [S5].");
}

// ================================================================== 10 Why names still matter
{
  const s = content(SEC, "Why device names still matter after AD");
  tag(s, "Why");
  const cards = [
    ["Kerberos islands", HEX.navy, HEX.navyTint, "FaKey",
      "Entra-joined devices that sign in to on-premises resources need \"line-of-sight\" to domain controllers, found through DNS service (SRV) records. A name that resolves to the wrong host turns a valid ticket into a rejection (Book 08 Ch04)."],
    ["Certificates", HEX.teal, HEX.tealTint, "FaFileShield",
      "Intune SCEP offers {{DeviceName}}; {{FullyQualifiedDomainName}} is \"only applicable for Windows and domain-joined devices.\" Inference: a device certificate's DNS name must be {{DeviceName}} + a fixed suffix, and match what's registered."],
    ["Logs and asset identity", HEX.amber, HEX.amberTint, "FaChartLine",
      "Book 12's evidence records join on asset_id from the naming plane (IPAM and DDI). Microsoft's ASIM calls a hostname used as a device ID \"a last resort.\" Inference: unregistered or duplicate names break the join."],
    ["Duplicates", HEX.red, HEX.redTint, "FaTriangleExclamation",
      "Accounts CSP macros: \"a unique name isn't guaranteed.\" NIOS updates DNS only for the first client with a name. The help desk picks devices by name (slide 9)."],
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.5;
    box(s, `Card ${i + 1}`, x, y, 6.0, 2.3, c[2], c[1]);
    D.icon(s, c[3], x + 0.2, y + 0.2, 0.6, c[1]);
    txt(s, `Card ${i + 1} head`, c[0], { x: x + 0.95, y: y + 0.25, w: 4.8, h: 0.5, fontSize: 16, bold: true, fontFace: "Cambria", color: c[1], valign: "middle" });
    T(s, `Card ${i + 1} body`, c[4], { x: x + 0.25, y: y + 0.88, w: 5.55, h: 1.35, fontSize: 12 });
  });
  sources(s, "Sources: Microsoft Learn SSO on Entra-joined devices [S55], SCEP [S54], Accounts CSP [S6]; NIOS [S41]; Book 08 Ch04; Book 12 Ch02; Book 15 Ch07; Book 07 Ch01.");
  notes(s,
`If devices sign in with cloud tokens, why do names still matter? Four reasons.

First, Kerberos islands. Microsoft says an Entra-joined device signing in to on-premises resources needs line-of-sight to domain controllers, which clients find through DNS service records. And Book 08 explains that if a name resolves to the wrong host, a perfectly valid ticket is presented to the wrong machine and rejected. 

Second, certificates. A certificate binds a name to a key. Intune's SCEP certificate profiles, the protocol Intune uses to request device certificates, offer a device-name variable, but the full domain name variable is only for Windows domain-joined devices. As an inference, after AD the certificate's DNS name has to be built from the device name plus a fixed agency suffix, and it only matches DNS if that same name is registered.

Third, logs. Book 12 joins every evidence record on an asset identity from the naming plane. Microsoft's own log model calls a hostname used as a device ID a last resort. As an inference, an unregistered or duplicated name breaks that join.

Fourth, duplicates: Microsoft says its naming macros don't guarantee unique names.`,
  "Microsoft Learn: How SSO to on-premises resources works on Microsoft Entra joined devices [S55]; Create and assign SCEP certificate profiles in Intune [S54]; Accounts CSP [S6]; Infoblox NIOS 9.1 About the Client FQDN Option [S41]; Book 08 Ch04 (What Kerberos needs from DNS); Book 12 Ch02 (evidence contract, ASIM); Book 15 Ch07 (CMDB reconcile); Book 07 Ch01.");
}

// ================================================================== 11 Platform-by-platform
{
  const s = content(SEC, "Platform by platform: who names, who registers");
  tag(s, "Who");
  table(s, "Platform", 1.45, [2.65, 4.5, 5.0], ["Platform", "Who sets the name", "Who registers DNS (post-AD target)"], [
    ["Windows, Entra-joined", "Autopilot template or Intune Rename", "DHCP server, signed (TSIG or GSS-TSIG)"],
    ["Windows, hybrid (transition)", "Domain Join prefix + random; no Intune rename", "Client secure update to AD zones, or the DHCP credential, as today"],
    ["macOS", "Intune Rename after enrollment; no ADE name template found", "DHCP server (inference; macOS DDNS behavior not verified)"],
    ["Linux (on-premises)", "cloud-init or a static hostnamectl name", "DHCP server from the sent name; or SSSD with GSS-TSIG in IdM domains"],
    ["Servers, on-premises (static IP)", "Build pipeline / OS install; Arc keeps the hostname", "Static records in IPAM/DDI, protected from scavenging"],
    ["Azure VMs", "computerName at create (fixed)", "Azure: autoregistration (VMs, primary NIC, A only, one zone per VNet)"],
    ["AWS EC2", "AWS IP name or resource name", "VPC DNS for AWS names; custom names need your own pipeline or IPAM"],
    ["Printers / IoT", "Device default or DHCP reservation; NIOS can generate names", "DHCP server on the device's behalf"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: research brief per-platform table [S1, S3–S7, S9–S17, S19–S23, S26, S27, S30, S41, S42, S48]; Book 08 Ch04, Ch10. Full table with notes in Backup.");
  notes(s,
`Here's the whole picture. The full version, with notes, is in the backup.

For Windows devices joined to Entra, Autopilot or Intune names the device, and the DHCP server registers it, with signed updates. Hybrid-joined Windows, during the transition, keeps working as it does today, through AD; it moves to the first row when it's rebuilt.

Macs are renamed in Intune after enrollment. The DHCP server should register them, but that's an inference: I couldn't verify how macOS behaves with dynamic DNS.

Linux gets its name from cloud-init or a static hostname, and DHCP registers it, unless it's in an identity domain that signs its own updates.

On-premises servers with fixed addresses get static records. Azure VMs are named at create time and autoregistered, within the limits we saw. AWS instances get AWS names, and anything custom needs your own pipeline or IPAM integration. And printers and other devices that can't be managed get their names from a reservation or the device itself, with DHCP registering on their behalf.`,
  "Research brief, Per-platform table, and the sources cited in each row: Autopilot and Rename [S1, S3–S5], Accounts CSP [S6], macOS ADE and Apple MDM [S7, S9], systemd, cloud-init, NetworkManager, FreeIPA [S10–S14], Arc and Azure [S15–S17, S19, S20], AWS [S21–S23], Dynamic update and ADMX_DnsClient [S26, S27], aging [S30], NIOS [S41, S42, S48]; Book 08 Ch04 and Ch10.");
}

// ================================================================== 12 What the agency must do
{
  const s = content(SEC, "What the agency must do: before, cutover, after");
  tag(s, "How");
  T(s, "PDG flag", [
    { text: "PROGRAM DESIGN GUIDANCE — NOT A VENDOR OR STANDARDS REQUIREMENT.  ", options: { bold: true, color: HEX.red } },
    { text: "Condensed from a 17-step checklist." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.32, fontSize: 12 });
  panel(s, "Before", 0.6, 1.9, 4.0, 4.5, HEX.navy, HEX.navyTint, "BEFORE AD DNS RETIRES", null, [
    "One naming authority per platform, with a written length budget",
    "Windows default: classic Autopilot, Entra join, %SERIAL%; device preparation naming only once device association is in place",
    "Inventory who registers each record today (Book 08 Ch04 checks)",
    "Make DHCP the registrant; lock zones to DHCP servers' keys",
    "Pick DHCID or TXT once; turn off MAC randomization; create reverse zones for every scope",
  ], 11.5);
  panel(s, "Cutover", 4.75, 1.9, 4.0, 4.5, HEX.teal, HEX.tealTint, "CUTOVER", null, [
    "Deliver suffixes both ways: DHCP options 15 and 119, RA DNSSL; Intune DNS_PrimaryDnsSuffix and DNS_SearchList",
    "Entra-joined Windows: turn client registration off, or accept refused updates; never open zones to unsigned updates",
    "Cloud names handled separately (Azure autoregistration, AWS pipeline)",
    "Servers registered explicitly; remote clients resolve through Global Secure Access",
  ], 11.5);
  panel(s, "After", 8.9, 1.9, 3.85, 4.5, HEX.amber, HEX.amberTint, "AFTER AD DNS RETIRES", null, [
    "Scavenging only after a quiet-period check; match lease length to timers",
    "Monitor duplicates, A/PTR mismatches and devices with no record, as naming-plane gaps",
    "No AAAA for SLAAC or privacy addresses",
    "Certificate DNS names from {{DeviceName}} + the registered suffix; test they resolve",
  ], 11.5);
  sources(s, "Sources: research brief, Agency checklist steps 1–17 and their cited facts (S1–S56); Book 08 Ch04, Ch10; Book 12 Ch02; Book 15 Ch07.");
  notes(s,
`So what must the agency do? Everything on this slide is program design guidance, not a vendor or standards requirement, condensed from a seventeen-step checklist.

Before AD DNS retires: choose one naming authority for each platform and write down its length limit. For Windows, default to classic Autopilot with Entra join and the serial number, and use device preparation naming only once device association is in place. Inventory who registers each record today. Make the DHCP server the registrant, and lock each zone so only the DHCP servers' keys can update it. Pick DHCID or TXT ownership records once, turn off address randomization on agency Wi-Fi, and create reverse zones for every DHCP scope.

At cutover: deliver DNS suffixes both ways, through DHCP options and router announcements, and through Intune policy. For Entra-joined Windows, either turn client registration off or accept refused attempts, but never open zones to unsigned updates. Handle cloud names and servers separately.

After: turn on scavenging only after a quiet period, with lease times matched to its timers. Monitor duplicates, mismatched records and devices with no record. Expect no AAAA records for SLAAC addresses. And build certificate names from the registered device name.`,
  "Research brief, Agency checklist (steps 1–17, all PROGRAM DESIGN GUIDANCE) and the facts each step cites: [S1–S6, S10, S12, S14–S17, S19–S21, S23, S26, S27, S29, S30, S34–S39, S41, S43–S46, S48–S52, S54]; Book 08 Ch04 and Ch10; Book 12 Ch02; Book 15 Ch07; Book 07 Ch01.");
}

// ================================================================== 13 Decisions, next steps, where it fits
{
  const s = content(SEC, "Decisions, next steps and where this fits");
  tag(s, "How");
  panel(s, "Decide", 0.6, 1.5, 4.0, 4.85, HEX.teal, HEX.tealTint, "DECISIONS TO TAKE", null, [
    "The naming authority and length budget for each platform",
    "DHCP as the registrant for endpoints, and which keys may update each zone",
    "DHCID (Standard) or TXT (Interim) ownership records",
    "Client registration on or off for Entra-joined Windows",
  ], 12);
  panel(s, "Next", 4.75, 1.5, 4.0, 4.85, HEX.amber, HEX.amberTint, "NEXT STEPS (OPEN CHECKS)", null, [
    "Confirm which Apple setting Intune's macOS Rename sends, and how Macs handle DHCP names",
    "Confirm an Entra device's display name follows an Intune rename",
    "Recheck Book 05 Ch04's device preparation text and the GCC High availability note",
    "Ask the VPN vendor about concentrator DDNS",
  ], 12);
  panel(s, "Fit", 8.9, 1.5, 3.85, 4.85, HEX.navy, HEX.navyTint, "WHERE IT FITS", null, [
    "Book 05 Ch04: Intune-first onboarding and naming",
    "Book 08 Ch04: the AD DNS departure; Ch07: cloud private DNS; Ch10: the migration sequence",
    "Research: Trinzic Alone, or Trinzic Plus Cloud DDI? and Infoblox DDI for Federal Agencies",
  ], 12);
  sources(s, "Sources: research brief, Couldn't verify and Agency checklist; Book 05 Ch04; Book 08 Ch04, Ch07, Ch10; research: Trinzic multi-cloud and Infoblox DDI deep dives.");
  notes(s,
`The decisions: which tool names each kind of device, and how long names may be. The DHCP server as the registrant for endpoints, and exactly which keys may update each zone. DHCID or TXT ownership records. And whether Entra-joined Windows PCs try to register at all.

The next steps are the things I couldn't verify. Which Apple setting Intune's Mac rename actually sends, and how Macs handle DHCP names. Whether an Entra-joined device's display name follows an Intune rename. Book 05's description of device preparation, and its note on availability in the higher government clouds, both need a recheck. And ask any third-party VPN vendor whether its concentrator registers clients.

Where does this fit? Book 05, Chapter 04 covers Intune-first onboarding and the naming convention. Book 08 covers the AD DNS departure in Chapter 04, cloud private DNS in Chapter 07, and the migration sequence in Chapter 10. And two research items sit beside this one: Trinzic Alone, or Trinzic Plus Cloud DDI, and Infoblox DDI for Federal Agencies.

One note on standing: this is research under review, not an endorsement by any federal agency. Thank you.`,
  "Research brief, Couldn't verify and Agency checklist; Book 05 Ch04, Intune-First Onboarding; Book 08 Ch04, Ch07 and Ch10; research items Trinzic Alone, or Trinzic Plus Cloud DDI? and Infoblox DDI for Federal Agencies.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full per-platform table, open questions and source lists on the following slides. All sources opened Oct. 22, 2026.");
}
{
  const s = content("Backup", "Per-platform detail: Windows, macOS, Linux");
  table(s, "Platform detail A", 1.45, [1.65, 3.6, 3.5, 3.4], ["Platform", "Who sets the name", "Who registers DNS (post-AD target)", "Notes"], [
    ["Windows, Entra-joined", "Autopilot template (classic: 15 characters, %SERIAL%/%RAND%; device preparation: 63 characters, associated devices only) or Intune Rename / Accounts CSP [S1, S3, S5, S6]", "DHCP server (option 81 \"always update\"; option-12 name + scope domain), signed with TSIG/GSS-TSIG to the DDI platform [S26, S41, S42]", "Client secure update needs Kerberos and fails; nonsecure is tried first [S26, S27]. No AD-derived primary suffix; set it by CSP [S27] (inference)"],
    ["Windows, hybrid (transition)", "Domain Join profile prefix + random characters to 15; no Intune rename [S4, S5]", "Client secure update (Kerberos) to AD-integrated zones, or the DHCP credential, as today [S26; Book 08 Ch04]", "Moves to the Entra-joined row at re-provisioning; locator records stay on AD DNS or GSS-TSIG DDI until the last DC [Book 08 Ch10]"],
    ["macOS", "Intune Rename (corporate-owned) / bulk rename; no macOS ADE name template found. Apple MDM has DeviceName and HostName [S5, S7, S9]", "DHCP server (inference; macOS DDNS behavior not verified)", "Disable private Wi-Fi address rotation on agency SSIDs [S49, S50]"],
    ["Linux (on-premises)", "cloud-init hostname/fqdn, or a static hostnamectl name; DHCP-provided transient name only as a fallback [S10–S12]", "DHCP server from the sent hostname/FQDN (NetworkManager dhcp-send-hostname, dhcp-fqdn) [S13, S41]; or SSSD GSS-TSIG in IdM domains [S14]", "ipa-client-install falls back to unauthenticated updates if GSS-TSIG fails at install [S14]"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief, Per-platform table (rows 1–4), with the source keys shown in each cell.");
}
{
  const s = content("Backup", "Per-platform detail: servers, clouds, devices");
  table(s, "Platform detail B", 1.45, [1.65, 3.6, 3.5, 3.4], ["Platform", "Who sets the name", "Who registers DNS (post-AD target)", "Notes"], [
    ["Servers, on-premises (static IP)", "Build pipeline / OS install; Arc resource name defaults to the hostname and is immutable [S15, S16]", "Static records in IPAM/DDI (protected from scavenging) [S30, S48]", "Static-IP Windows clients self-register every 24 hours if allowed [S27]"],
    ["Azure VMs", "osProfile.computerName at create (Windows 15, Linux 64; immutable) [S17]", "Azure: internal.cloudapp.net names and PTRs automatically; Private DNS autoregistration (VMs only, primary NIC, A records only, one zone per VNet) [S19, S20]", "Non-VM resources and PTRs in custom zones need IPAM/automation [S20; Book 08 Ch10]"],
    ["AWS EC2", "AWS-assigned IP name or resource name (instance ID) [S21]", "VPC DNS for AWS names; custom names need your own pipeline (AWS sample: EventBridge/CloudWatch Events + Lambda + DynamoDB) or IPAM integration [S22, S23]", "Only resource names return AAAA [S21]"],
    ["Printers / IoT", "Device's own default, or a DHCP reservation; NIOS can generate host names when none is sent [S41]", "DHCP server on the device's behalf (Windows: \"clients that don't request updates\"; NIOS: server-provided domain) [S26, S41]", "Hostname rewrite fixes bad characters (IPv4 only) [S44]; reservations recommended (program guidance)"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief, Per-platform table (rows 5–8), with the source keys shown in each cell.");
}
{
  const s = content("Backup", "What we couldn't verify");
  table(s, "Unverified", 1.45, [3.6, 8.55], ["Open question", "Status as of Oct. 22, 2026"], [
    ["Intune macOS Rename and Apple keys", "Which Apple setting it sends (DeviceName, HostName or both): Intune docs don't say [S5, S9]"],
    ["macOS DHCP behavior", "Whether macOS sends option 81 or only option 12, or does any client-side dynamic update: no current Apple primary source; community posts not relied on"],
    ["Entra device displayName", "That an Entra-joined device's displayName comes from the Windows computer name and follows an Intune rename"],
    ["Windows temporary IPv6 addresses", "Whether Windows registers temporary (privacy) IPv6 addresses through dynamic update: no Microsoft statement found"],
    ["Global Secure Access", "Any Global Secure Access feature that registers remote clients in agency DNS: none documented; docs describe resolution only [S51]"],
    ["Route 53 and RFC 2136", "Whether private hosted zones accept RFC 2136 dynamic updates: no AWS statement either way [S22, S23]"],
    ["Device preparation in GCC High", "Whether device-preparation naming is available in the higher government clouds: Book 05 Ch04 cites it as \"planned\"; not re-checked"],
    ["Red Hat documentation", "docs.redhat.com returned a bot block, not bypassed; Linux claims rely on systemd, NetworkManager, cloud-init and FreeIPA"],
    ["Not researched", "Jamf naming; third-party VPN concentrator DDNS; Android or Windows MAC-randomization MDM keys; whether Azure's [vmname] is the resource or computer name [S19]"],
  ], { fontSize: 11 });
  sources(s, "Sources: research brief, Couldn't verify.");
}
const srcSlide = (title, src) => {
  const s = content("Backup", title);
  T(s, "Source list", bullets(src, 10.5), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 2, fontSize: 10.5 });
  sources(s, "Sources: primary documents as listed; access date for all: Oct. 22, 2026. Page dates shown where the page carries one.");
};
srcSlide("Sources: Microsoft Learn", [
  "Autopilot and Intune: S1 Autopilot device preparation, user-driven Entra join: create a policy (Aug. 25, 2026)  ·  S2 Compare Windows Autopilot device preparation and Windows Autopilot (Aug. 7, 2026)  ·  S3 User-driven Entra join: create and assign Autopilot profile (June 13, 2025)  ·  S4 Deploy hybrid joined devices with Intune and Autopilot (Domain Join profile).",
  "S5 Rename a device in Microsoft Intune (Sept. 28, 2026)  ·  S6 Accounts CSP (Oct. 29, 2025)  ·  S7 Set up automated device enrollment for macOS (May 18, 2026)  ·  S8 Shared device mode (iOS device name template)  ·  S52 Using Remote Help with Intune  ·  S53 TeamViewer integration in Intune  ·  S54 SCEP certificate profiles in Intune.",
  "Azure: S15 azcmagent connect (Mar. 24, 2026)  ·  S16 Rename Azure Arc-enabled servers  ·  S17 VirtualMachineOSProfile.ComputerName  ·  S18 Windows VM FAQ (Mar. 6, 2024)  ·  S19 Name resolution for resources in Azure virtual networks (July 24, 2025)  ·  S20 Autoregistration in Azure DNS private zones (Feb. 10, 2025).",
  "Entra and Graph: S24 device resource type (Graph v1.0)  ·  S25 Entra Connect Sync: attributes synchronized  ·  S51 Understand Microsoft Entra Private DNS; Troubleshoot application access (Global Secure Access)  ·  S55 How SSO to on-premises resources works on Entra joined devices (June 27, 2025).",
  "Windows DNS: S26 Dynamic update (Feb. 13, 2025)  ·  S27 Policy CSP ADMX_DnsClient (Sept. 10, 2026)  ·  S28 Enable or disable DNS updates in Windows  ·  S29 Troubleshooting DNS dynamic update issues (Feb. 12, 2026)  ·  S30 DNS aging and scavenging; Configure aging and scavenging  ·  S56 DirectAccess known issues (DNS registration and NRPT).",
]);
srcSlide("Sources: Apple, Linux, AWS and IETF", [
  "Apple: S9 apple/device-management, mdm/commands/settings.yaml (DeviceName, HostName)  ·  S49 Use private Wi-Fi addresses on Apple devices  ·  S50 apple/device-management, com.apple.wifi.managed.yaml (DisableAssociationMACRandomization).",
  "Linux: S10 hostnamectl(1)  ·  S11 hostname(5) (freedesktop.org, systemd)  ·  S12 cloud-init module reference, Set Hostname  ·  S13 NetworkManager nm-settings-nmcli(5): dhcp-send-hostname, dhcp-fqdn, dhcp-hostname-flags  ·  S14 FreeIPA ipa-client-install(1), --enable-dns-updates.",
  "AWS: S21 Amazon EC2 instance hostname types  ·  S22 Working with private hosted zones (Route 53)  ·  S23 AWS Compute Blog, \"Building a Dynamic DNS for Route 53 using CloudWatch Events and Lambda\" (Apr. 4, 2016).",
  "IETF (rfc-editor.org): S31 RFC 4701 DHCID RR  ·  S32 RFC 4702 DHCPv4 Client FQDN Option  ·  S33 RFC 4703 Resolution of FQDN Conflicts  ·  S34 RFC 4704 DHCPv6 Client FQDN Option  ·  S35 RFC 2132 DHCP Options (15)  ·  S36 RFC 3397 Domain Search Option (119)  ·  S37 RFC 4862 SLAAC  ·  S38 RFC 8981 Temporary Address Extensions  ·  S39 RFC 8106 RA DNS options (DNSSL).",
]);
srcSlide("Sources: Infoblox NIOS 9.1 and the workbook", [
  "Infoblox NIOS 9.1 (vendor documentation, read at infoblox-docs.atlassian.net, the same pages served at docs.infoblox.com): S40 Understanding DDNS Updates from DHCP (May 20, 2026)  ·  S41 About the Client FQDN Option (May 14, 2026)  ·  S42 Sending Updates for Zones on an External Name Server (May 20, 2026).",
  "S43 Configuring DNS Servers for DDNS (May 20, 2026)  ·  S44 Configuring DDNS Features: hostname rewrite, lease-expiry deletion (May 20, 2026)  ·  S45 Enabling DDNS for IPv4 and IPv6 DHCP Clients: Interim vs Standard (Aug. 18, 2026)  ·  S46 Configuring DDNS Update Verification (May 20, 2026)  ·  S47 Accepting DDNS Updates from DHCP Clients (May 14, 2026)  ·  S48 DNS Record Scavenging (June 3, 2026).",
  "Federal Modernization Workbook (verified text, cited not re-verified): Book 05 Ch04 Intune-First Onboarding  ·  Book 08 Ch04 The Active Directory DNS Departure, Ch07 Cloud Private Endpoints and IPAM, Ch10 The Migration Sequence  ·  Book 12 Ch02 The Evidence Contract  ·  Book 15 Ch07  ·  Book 07 Ch01, Ch07  ·  Book 02 Ch04.",
  "Research: Trinzic Alone, or Trinzic Plus Cloud DDI? (multi-cloud DDI brief) and Infoblox DDI for Federal Agencies, both under review.",
]);

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated notes: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:", per.map((p) => `${p.slide}:${p.n} (${(p.n / WPM).toFixed(1)}m)`).join(" "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(path.join(__dirname, OUT)).catch((e) => { console.error(e); process.exit(1); });
