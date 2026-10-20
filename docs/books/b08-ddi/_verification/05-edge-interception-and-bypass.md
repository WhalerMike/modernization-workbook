# Verification — Chapter 05, Edge Interception, Encrypted DNS and Rogue DHCP

File: `docs/books/b08-ddi/05-edge-interception-and-bypass.md`
Diagram sources: `docs/images/diagrams/b08-ddi/src/ch05-redirect-dns.flow.yaml`, `ch05-encrypted-dns-paths.flow.yaml` (both kept unchanged; content correct, chapter numbers current)
Checked 2026-10-20 against Cisco documentation (redirect-dns configuration guide; Umbrella integration support article), Microsoft Learn (Windows DoH client and server, Zero Trust DNS, Windows 11 security book, Edge policy, INR, Azure DNSSEC, DHCP authorization, DHCP option definition, WinHTTP AutoProxy), the FedRAMP Marketplace dataset (`products.json`), OMB M-22-09 (PDF text extracted, pp. 12–14), the CISA Encrypted DNS Implementation Guidance PDF (text extracted), NIST SP 800-81r3 (PDF text extracted), Mozilla, Google Chrome Enterprise, IANA, MITRE ATT&CK, the RFC Editor and Infoblox documentation. Sources: the series chapter (old Ch05) and the whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md` (Parts 8 and 9, §7.3 options table, §7.8 option-6 bullet, Appendix A sources, Appendix B Q1 and Q4). The DNS Modernization Guide has no edge, encrypted-DNS or rogue-DHCP section. All seven existing footnotes were re-opened and resolve. Footnote keys below drop the `c05-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Edges intercept DNS regardless of the client's resolver; Catalyst SD-WAN redirect-dns in a centralized data policy | SD-WAN interception | verified (re-opened) | cisco |
| 2 | Unconditional and conditional redirect use cases (printers example) | SD-WAN interception | verified (added) | cisco |
| 3 | Service-side VPN redirect from 17.8.1a / 20.8.1; before that NAT DIA only | SD-WAN interception | verified | cisco |
| 4 | IPv4 only; UDP only; not overlay-tunnel DNS; not fragmented or self-generated; requires NAT | SD-WAN interception | verified (fragmented, self-generated and NAT restrictions added) | cisco |
| 5 | Correct and bypassed paths | SD-WAN interception | restated-as-design (series text) | — |
| 6 | Whitepaper §8.2/§10.2 Decision 1: redirect-dns must target the "local BloxOne Endpoint" | Refinements | corrected: Infoblox Endpoint is a loopback stub on the device (127.0.0.1 / 127.0.0.2, DoT on TCP 443), not a network redirect target; target is a network-addressable resolver (answers whitepaper App. B Q1) | ibendpoint |
| 7 | Infoblox Endpoint sends bypassed internal domains and DHCP-learned search domains to local DNS | Refinements | verified | ibendpoint |
| 8 | Cisco Umbrella for Government, within Cisco Security Cloud for Government, FedRAMP Certified High; describes CISA Protective DNS integration | Refinements | verified (FR2304757473A, certified 2026-08-06) | fr-cisco |
| 9 | Whitepaper §8.3: Umbrella-first is "non-compliant" | Refinements | restated: what an Umbrella-first hop bypasses is the agency's own policy plane; redirect target always the agency resolver is the program's position | — |
| 10 | Umbrella integration: dns-redirect umbrella per VPN; EDNS0 device and org IDs; local domain bypass list to enterprise DNS | Umbrella integration | verified (added) | umbrella |
| 11 | Local bypass list is a second copy of the internal namespace that can drift | Umbrella integration | restated-as-design | — |
| 12 | Whitepaper §8.3: validator must "sit at the first recursive position" | DNSSEC and forwarder position | corrected: each recursive server in the chain must be able to validate; last-hop resolver must be secure; validating forwarder behind another resolver is valid | azdnssec; nist81 |
| 13 | Most stubs can't validate; acceptable when link protected | DNSSEC and forwarder position | verified | nist81 §5.2 |
| 14 | SC-21 "request and perform" verification | DNSSEC and forwarder position | verified (detail in Ch06) | Ch06 c06-sp80053 |
| 15 | INR shares per-location experience data for Exchange, SharePoint/OneDrive, Teams; SD-WAN may reroute | INR | verified (re-opened) | inr |
| 16 | Cisco IOS XE SD-WAN 20.4/17.4 only enabled solution | INR | verified | inr |
| 17 | WW commercial only; not GCC Moderate, GCC High, DoD, Germany, China | INR | verified | inr |
| 18 | Breakout and application-aware routing as alternatives | INR | restated-as-design (whitepaper §9.2) | — |
| 19 | Whitepaper §8.4: INR telemetry would reflect the Umbrella-selected endpoint (ECS) | INR | restated (follows from design; undocumented by either vendor; kept only as a reason for one path) | — |
| 20 | Whitepaper §9.2: "DSCP marking" breakout pattern "recommended in Microsoft's network connectivity principles" | INR | not carried as stated (DSCP claim not verified); breakout kept generically | — |
| 21 | M-22-09 quotes: encrypted DNS wherever supported; resolvers support DoH/DoT and use upstream; endpoints enable; explicitly configure rather than discovery; already routed via CISA infrastructure | Encrypted DNS | verified (PDF pp. 12–14) | m2209 |
| 22 | CISA target state: Protective DNS upstream; endpoints can't reach third-party DNS | Encrypted DNS | verified (Executive Summary) | cisaedns |
| 23 | NIST: block outbound DNS except authorized servers | What the network can block | verified (§4.2.2) | nist81 |
| 24 | DoT TCP 853, DoQ UDP 853 blockable by port; DoH on 443 | What the network can block | verified | nist81; cisaedns; rfcs |
| 25 | DoT/DoQ can't be redirected without breaking TLS (client validates resolver certificate) | What the network can block | verified (re-opened RFCs) | rfcs |
| 26 | NIST: RPZ against known DoH names plus firewall rules; CISA: break-and-inspect or ZTA | What the network can block | verified | nist81; cisaedns |
| 27 | Cisco: DoH/DoT can bypass Umbrella, "impossible to use if not carefully planned"; block TCP 853 and proxy/anonymizer | What the network can block | verified (added) | umbrella |
| 28 | Windows Server 2022 DNS client supports DoH; known-server list (Cloudflare, Google, Quad9); Add-DnsClientDohServerAddress; GPO allow/prohibit/require | Windows | verified (re-opened) | doh |
| 29 | Windows 11 DNS client supports DoH and DoT | Windows | verified | win11 |
| 30 | Windows Server 2025 DNS Server accepts DoH from the 2026-06 update (KB5094125); certificate SAN matches URI template; upstream, zone transfers, dynamic updates unencrypted | Windows | verified (added) | ws-doh |
| 31 | Client page still says Windows DNS Server doesn't support DoH; suggests IPsec | Windows | verified; flagged as stale relative to the 2026-06 server feature | doh |
| 32 | CISA: IPsec-tunnelled port-53 DNS "not considered an acceptable substitute" | Windows | verified (§3.3) | cisaedns |
| 33 | Zero Trust DNS: Windows 11 Enterprise/Education; blocks outbound except to IPs resolved by configured PDNS over DoH/DoT or exceptions | Windows | verified (added) | ztdns |
| 34 | CISA: proxy for servers that can't encrypt upstream; disable root hints; fallback resolvers only when PDNS unavailable, with alerting | Windows | verified (§3.3) | cisaedns |
| 35 | Enterprise DDI platforms generally support encrypted upstream forwarding | Windows | restated (generic; readers told to confirm per release) | — |
| 36 | CISA browser rule: OS resolver or DoH only to agency DNS; DoH straight to PDNS breaks internal names | Browsers | verified (App. A.1.1, A.1.2) | cisaedns |
| 37 | Edge DnsOverHttpsMode off/automatic/secure; unset on managed devices sends no DoH | Browsers | verified | edge |
| 38 | Chrome has the same DnsOverHttpsMode policy | Browsers | verified (Chrome Enterprise policy page title; CISA App. A.1.2) | chrome; cisaedns |
| 39 | Firefox canary use-application-dns.net; enterprise policies disable DoH unless DNSOverHTTPS policy enables it | Browsers | verified (Mozilla wiki quote; canary page listed in search results and cited by CISA footnote 19; the support page itself returned no content to a plain fetch) | ff-heur; ff-canary |
| 40 | Firefox disables DoH when parental controls on; re-validate per release | Browsers | verified | cisaedns |
| 41 | Add-DnsClientDohServerAddress parameters; Get-DnsClientDohServerAddress; Edge registry path and value | Code block | verified | doh; edge |
| 42 | Series: "Windows supports configuring DoH to a named resolver" | Windows | verified, expanded | doh |
| 43 | Series: "MDM, Group Policy or a SASE or DDI endpoint agent should point clients' encrypted DNS at the governed resolver" | Windows; browsers | restated-as-design, consistent with NIST §4.2.2 (MDM) and CISA | nist81 |
| 44 | Alert on resolution-path anomalies | Alerting | restated-as-design (series text, extended) | — |
| 45 | Rogue DHCP option 6 moves a subnet; MITRE T1557.003 "provide adversary-owned DNS servers" | Rogue DHCP | verified (added MITRE) | mitre |
| 46 | Whitepaper §7.8: technique "observed in federal network incidents" | Rogue DHCP | removed (unverifiable) | — |
| 47 | RDNSS in RFC 8106 | Rogue DHCP | verified (re-opened) | rfc8106 |
| 48 | Router advertisements often less governed than DHCPv4 | Rogue DHCP | restated-as-design (series text) | — |
| 49 | RFC 9463 DNR lets DHCP and RAs advertise encrypted resolvers | Rogue DHCP | verified (added) | rfc9463 |
| 50 | Options 6, 15, 81, 82, 119 names; 224–254 private use | Options table | verified; option 6 name corrected to IANA's "Domain Server"; option 60 (vendor class) and 43 (vendor-specific) from whitepaper table dropped as not DNS-relevant; option 81 added | iana-dhcp |
| 51 | WPAD option 252 | Options table | corrected: a private-use convention, Microsoft example defines 252 as WPAD; WPAD never left Internet-Draft | wpad |
| 52 | Windows DHCP authorization: unauthorized servers stop leasing; server checks its own status hourly against the Configuration container | Windows controls | verified | dhcp-auth |
| 53 | Authorization doesn't stop non-Windows rogue servers | Windows controls | restated-as-design (inference from the documented self-check mechanism) | dhcp-auth |
| 54 | MITRE recommends DHCP snooping on layer 2 switches | Controls | verified | mitre |
| 55 | RA Guard RFC 6105 | Controls | verified (added) | rfc6105 |
| 56 | Centralized scope management, detection, IPAM integration | Controls | restated-as-design (series text) | — |
| 57 | Existing footnote c05-cisaedns (landing page only) | Footnotes | updated to the PDF with sections cited; landing page kept | — |
| 58 | Existing footnote c05-rfc7858 | Footnotes | renamed `rfcs`, authors and dates added | — |

## 2. Carry-forward ledger

### Series chapter (old Chapter 05)

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter and subtitle | Front matter; italic thesis | Restyled as in the brief |
| "Download this chapter" callout | — | Removed per brief |
| SD-WAN DNS Interception | "SD-WAN DNS interception" | Expanded; two corrections (claims 6, 12) |
| Diagram `ch05-redirect-dns` | Kept, with `#fig-` id | — |
| Correct/bypassed path bullets | Kept | — |
| DNSSEC validation paragraph | "DNSSEC and the forwarder position" | Reframed against Microsoft and NIST |
| Microsoft 365 informed network routing | Same heading | Kept; whitepaper §8.4 point added as restated |
| Encrypted DNS and Bypass Controls | "Encrypted DNS and bypass controls" | Split into network, Windows, browsers, alerting |
| Diagram `ch05-encrypted-dns-paths` | Kept, with `#fig-` id | — |
| "Know what the edge can reach" bullet | "What the network can and can't block" | — |
| "Control the endpoint" bullet | Windows and browsers subsections | — |
| "Block known public encrypted DNS endpoints" bullet | "What the network can and can't block" (NIST RPZ + firewall) | — |
| "Alert on resolution-path anomalies" bullet | "Alert on resolution-path anomalies" | — |
| DHCP Option 6 and Rogue DHCP | "DHCP option 6 and rogue DHCP" | Expanded |
| What this chapter establishes | Kept, four points | — |
| Previous/Next footer | "Continue the book" callout | — |

### Whitepaper, absorbed sections

| Source § | Went to | Or why not carried |
|---|---|---|
| Scope boundary — Cisco Catalyst SD-WAN only | SD-WAN section (Cisco as worked example) | — |
| In this whitepaper, arguments 8 and 9 | SD-WAN section; INR | "Only Microsoft-certified INR partner" kept as "only solution Microsoft lists" |
| Part 8.1 The gap in vendor documentation | — | Not carried: the Cisco redirect-dns guide now documents the mechanics, and the Umbrella article documents the bypass; "undocumented" no longer accurate |
| Part 8.2 How Cisco SD-WAN intercepts DNS | SD-WAN interception | Endpoint target corrected (claim 6) |
| Part 8.3 DNSSEC validation and the forwarder position problem | "DNSSEC and the forwarder position"; Refinements | Corrected (claims 9, 12) |
| Part 8.4 INR telemetry and DNS interaction | INR (last sentences) | Restated (claim 19) |
| Part 9.1 INR is WW Commercial only | INR | Verified |
| Part 9.2 What federal agencies use instead | INR | DSCP specifics not carried (claim 20); "Infoblox DDI operates identically" generalized; FINDING-001 fixture and Vol I Book 05 App. A pointer not carried (internal artifact; Appendix C owns applicability) |
| §7.3 DHCP options table | Options table | Corrected (claims 50, 51) |
| §7.3 DHCP fingerprinting, failover, DDNS, lease analytics, DHCPv6, cloud DHCP | — | Owned by Ch10 (DHCP scopes), Ch11 (lease analytics) and Ch07 (IPv6, cloud DHCP) |
| §7.4 BloxOne Endpoint paragraph (endpoint enforcement off-network) | Refinements (Infoblox Endpoint) | Rest of §7.4 owned by Ch11/Ch12 |
| §7.5 Network Insight rogue-DHCP detection | Controls ("enterprise DDI platforms commonly include it") | Generalized |
| §7.6 BloxOne Threat Defense | — | Owned by Ch11/Ch12 (threat analytics) |
| §7.8 "The DHCP option-6 attack surface" bullet | Rogue DHCP | "Observed in federal incidents" removed (claim 46) |
| §10.2 Decisions 1 and 2 | Refinements (link to Ch08) | Ch08 owns them |
| §10.3 Deployment comparison table | — | Owned by Ch08 and Appendix C |
| Appendix A rows: Cisco redirect-dns guide; Infoblox Managing Endpoint | Footnotes cisco, ibendpoint | — |
| Appendix A rows: Microsoft INR; Cisco INR blogs | Footnote inr | Cisco blogs not cited (Microsoft page suffices) |
| Appendix B Q1 (Endpoint transparent proxy with redirect-dns) | Refinements | Answered from the Infoblox page: loopback stub, not a redirect target |
| Appendix B Q4 (source IP seen by the redirect target, ECS) | — | Open vendor question; not documented by Cisco's guide |
| Appendix B Q5 (INR roadmap for GCC) | — | Open vendor question |
| Call to Action steps on redirect-dns and forwarding order | Ch08/Ch10 | Owned there |

### DNS Modernization Guide

| Guide § | Went to | Or why not carried |
|---|---|---|
| (no edge, encrypted-DNS or rogue-DHCP sections) | — | Nothing to absorb; §11 DHCP sections are in the Ch04 and Ch10 ledgers |

### Diagrams

| Diagram | Status |
|---|---|
| `ch05-redirect-dns.flow.yaml` | Kept unchanged |
| `ch05-encrypted-dns-paths.flow.yaml` | Kept unchanged (its "Block UDP 853" and "Block port 853" rows match NIST and CISA) |
