# Verification — Chapter 04, The Active Directory DNS Departure

File: `docs/books/b08-ddi/04-active-directory-dns-departure.md`
Diagram source: `docs/images/diagrams/b08-ddi/src/ch04-ad-dns-departure.flow.yaml` (kept unchanged; its content is correct and its chapter number is current)
Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch: Windows Server DNS zones, dynamic update, DNSSEC Key Master, DC locator, Netlogon policy CSP, DnsServer and DhcpServer cmdlet references, DHCP failover, Entra cloud-first guidance, Entra Domain Services DNS), the RFC Editor, and Infoblox deployment guides. Sources: the series chapter (old Ch04), the whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md` (Part 4, Part 5.1, §7.8 AD bullet) and the DNS Modernization Guide `docs/operational-guides/network-transformation/dns-modernization.md` (§2, §7.1, §11.1). None is linked from the chapter. Both existing footnotes were re-opened; both resolve and support the text. Footnote keys below drop the `c04-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AD DS uses DNS so clients locate DCs and DCs communicate | Opening | verified (re-opened) | adds |
| 2 | AD has been the hidden DNS substrate for ~20 years; domain name becomes a zone; DCs authoritative; clients use them for all resolution | Opening | restated-as-design (whitepaper §4.1 framing); zone auto-creation verified | zones ("When you deploy Active Directory, a DNS zone … is automatically created") |
| 3 | Entra ID hosts no zones and publishes no locator records | Opening; "What Entra ID does not carry" | restated-as-design (product scope; consistent with SOA guidance and Entra DS docs) | soa; aadds-dns |
| 4 | Records can't be recovered from a retired DC | Opening | restated-as-design (whitepaper §10.2 Decision 4) | — |
| 5 | Zone stored in file or AD DS; AD-integrated only on DCs with DNS role; secure updates; every DC hosting the zone is a primary | AD-integrated DNS | verified | zones |
| 6 | Replication scopes Domain, Forest, Legacy, Custom | AD-integrated DNS | verified (guide §2.1 named ForestDnsZones/DomainDnsZones; cmdlet values used instead) | scope |
| 7 | File-backed zones in %windir%\System32\Dns; secondaries via AXFR/IXFR | Component table | verified | zones |
| 8 | Stub zone holds only records to find authoritative servers | Component table | verified (guide said SOA, NS, glue; consistent) | zones |
| 9 | Conditional forwarders "stored as zones," with replication scope | Component table; following paragraph | verified | cf |
| 10 | Conditional forwarders "not easily exported" (whitepaper §4.4) | Following paragraph | corrected: listed by Get-DnsServerZone as zones; the hard part is knowing why each exists | cf |
| 11 | GlobalNames resolves single-label names without WINS | Component table | verified | gnz |
| 12 | Reverse zones under in-addr.arpa | Component table | verified | zones |
| 13 | AD-integrated DNSSEC: Key Master; keys and trust anchors in AD | Component table | verified (detail in Ch06) | keymaster |
| 14 | Netlogon registers SRV/A; locator via DsGetDcName, SRV query, LDAP UDP ping, cache | Locator records | verified | dclocator |
| 15 | Locator record names in table (_ldap._tcp.dc._msdcs, _kerberos._tcp.dc._msdcs and _kerberos._tcp, _ldap._tcp.gc._msdcs and _gc._tcp, site-specific, pdc, _kpasswd._tcp) | Locator table | verified (all appear in Netlogon mnemonic table) | netlogon-records |
| 16 | Failure impacts per record (guide §7.1) | Locator table | restated-as-design (operational consequences; PDC row reworded to "anything that must find the PDC emulator"; guide's Exchange address-book example generalized) | — |
| 17 | Kerberos KDC unavailable → Windows uses MSV1_0 (NTLM) | Locator table | verified | kerb-ssp |
| 18 | Netlogon.dns in %systemroot%\System32\Config for non-Microsoft DNS; records in _msdcs and _sites folders | Locator records | verified | srv (re-opened) |
| 19 | Locator records must live where DCs can register securely; Azure Private DNS can't host them | Locator records | restated-as-design; Azure behavior verified and footnoted in Ch10 (c10-pdns-faq) | — |
| 20 | 30 days clean SRV resolution as decommission gate | Locator records | restated-as-design (Ch10 Phase 5) | — |
| 21 | Dynamic update defined in RFC 2136 | Secure dynamic updates | verified | rfc2136 |
| 22 | Secure update only for AD-integrated zones; AD-integrated default secure-only | Secure dynamic updates | verified | dynupdate |
| 23 | Any authenticated user can create A/PTR; then only ACL principals modify | Secure dynamic updates | verified | zones |
| 24 | Windows signs secure updates with GSS-TSIG (RFC 3645) | Secure dynamic updates | verified (RFC; Windows' use is the documented TSIG-signed exchange in "Dynamic update" and the Infoblox GSS-TSIG guide) | rfc3645; dynupdate; nios-gss |
| 25 | DHCP server becomes owner; partner can't update | Secure dynamic updates | verified | dynupdate |
| 26 | Failover partners must use the same DNS credentials | Secure dynamic updates | verified | dhcp-failover |
| 27 | DnsUpdateProxy leaves records unsecured; next registrant owns; warning for secure-only zones | Secure dynamic updates | verified | dynupdate |
| 28 | Dedicated user account; DHCP on a DC inherits DC authority over secure records | Secure dynamic updates | verified | dynupdate |
| 29 | Microsoft "strongly recommends" DNSCredentials when DHCP and DNS share a DC | Secure dynamic updates | verified | dnscred |
| 30 | DHCP DNS credentials not backed up; reconfigure after restore | Secure dynamic updates | verified | dynupdate |
| 31 | Name protection creates DHCID records; update fails instead of overwriting | Secure dynamic updates | verified (added; not in sources) | nameprot; rfc4701 |
| 32 | Scavenging/lease mismatch yields duplicate records and Kerberos tickets sent to the wrong computer | Secure dynamic updates; Kerberos section | verified (added) | dupes |
| 33 | Cmdlets Get-DhcpServerv4DnsSetting (-ScopeId), Get-DhcpServerv4Scope, Get-DhcpServerDnsCredential, Get-ADGroupMember | Code block | verified (cmdlet pages resolve; -ScopeId parameter present) | nameprot (related link); Learn cmdlet pages |
| 34 | Kerberos: KDC via locator; service ticket for SPN encrypted with the account key | Kerberos section | verified (mechanism as documented in Book 06 Ch01 sources; locator footnoted) | dclocator |
| 35 | Whitepaper §5.1 step 5: service resolves SPN back to IP to validate the ticket | Kerberos section | corrected: no such check; real failure is a ticket for host A presented to host B | dupes |
| 36 | Missing SPN → NTLM fallback | Kerberos section | verified via link to Book 06 Ch01 (footnoted there) | — |
| 37 | Microsoft guidance: phased SOA conversion toward cloud-first and AD-minimized | Entra section | verified (re-opened whitepaper footnote ibh-soa) | soa |
| 38 | AD DS ships in Windows Server 2025 with new functional levels; not deprecated | Entra section | verified (whitepaper footnote ibh-adds2025 re-opened) | ws2025 |
| 39 | Whitepaper §4.2: Entra-only join "removes the AD dependency entirely"; hybrid join devices "fundamentally AD-dependent" | Entra section | restated (narrowed to "Entra-only devices don't look for a DC; hybrid-joined devices still do") | — |
| 40 | App Proxy with KCD and cloud Kerberos trust as Microsoft's bridges | Entra section | verified | soa |
| 41 | Entra Domain Services has its own DNS; VNet DNS points at managed DCs; on-prem zones not synchronized; conditional forwarders; root hints and non-168.63.129.16 forwarder unsupported | Entra section | verified (added) | aadds-dns |
| 42 | Decoupling DNS from identity removes a shared failure | Entra section | restated-as-design (series text) | — |
| 43 | Reprovisioning list (locators, forwarders, namespace, dynamic registration, GlobalNames/reverse/signed) | Reprovision section | restated-as-design (whitepaper §4.4, expanded) | — |
| 44 | Whitepaper §4.4: "Infoblox NIOS is the natural landing point" | Reprovision section | restated vendor-neutrally (NIOS as example; "other DDI platforms offer comparable integrations") | — |
| 45 | NIOS manages Microsoft DNS/DHCP over MS-RPC, no software on servers, Read-Only and Read/Write sync | Reprovision section | verified (Nov 2023 guide, NIOS 8.6) | nios-ms |
| 46 | NIOS accepts GSS-TSIG updates from AD clients; NIOS DHCP sends GSS-TSIG updates to DC-hosted zones | Reprovision section | verified (Dec 2016 guide; the guide's limitation that both can't run at once on one appliance not carried, as it may be release-specific; text tells readers to confirm per release) | nios-gss |
| 47 | Series: "DDI platforms commonly provide a coexistence mode … preserve DC SRV resolution and GSS-TSIG secure updates" | Reprovision section | verified via the NIOS example; generalized claim kept as "commonly" | nios-ms; nios-gss |
| 48 | SQL Server shift to Entra auth, managed identities, certificates | SQL Server section | restated (series text; Book 06 owns it) | — |
| 49 | SQL bullets: SPNs, SANs, private connectivity, revocation endpoints | SQL Server section | restated-as-design; revocation bullet corrected from "OCSP and CRL" to the CRL for Entra CBA (no OCSP), consistent with Book 07 Ch02 | Book 07 Ch02 (c02-cba-ca) |
| 50 | Series footnote c04-adds combined two pages | Footnotes | split into adds and srv, both re-opened | — |

## 2. Carry-forward ledger

### Series chapter (old Chapter 04)

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter (`doc-type: modernization-book-chapter`, subtitle, `lifecycle_review: 2027-01-01`) | Front matter | Restyled: `workbook-chapter`, `description`, audience set to match Books 02–07, `lifecycle_review: 2027-04-01`; subtitle replaced by the italic thesis |
| H1 and italic thesis | H1; new thesis | Thesis rewritten as a claim |
| "Download this chapter" callout | — | Removed per brief (per-page Word download callouts) |
| Diagram `ch04-ad-dns-departure` | Kept, right after opening prose; `#fig-` id added | — |
| Opening paragraphs (AD as substrate; inventory problem; coexistence mode; decoupling) | Opening; "What must be reprovisioned"; "What Entra ID does not carry" | Expanded with verified detail |
| Implications for Modern Microsoft SQL Server | Same heading (sentence case) | Revocation bullet corrected |
| "What this chapter establishes" callout | Kept, extended to four points | — |
| Previous/Next footer | "Continue the book" callout | Restyled |
| Footnote c04-adds | adds + srv | Split |

### Whitepaper (`docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md`), absorbed sections

| Source § | Went to | Or why not carried |
|---|---|---|
| In this whitepaper, argument 4 (AD as hidden substrate; DNS orphaning) | Opening | — |
| Part 4.1 What AD DNS actually does (SRV for Kerberos and LDAP, DC locator, DFS, GPO) | Locator records; Kerberos section | DFS and GPO dependencies folded into the record-impact table (domain join, GPO processing); DFS namespace detail not carried separately (it is a consumer of the same locator and host records) |
| Part 4.2 Microsoft's deprecation trajectory | "What Entra ID does not carry" | Heading's "deprecation" framing not carried (AD DS isn't deprecated); join-type claims narrowed (claim 39); reference to the SQL Server series replaced by the Book 06 link |
| Part 4.3 What happens to DNS when AD goes away | Opening; reprovision section | Condensed; argument kept |
| Part 4.4 What must be reprovisioned before AD leaves | "What must be reprovisioned before AD leaves" | Forwarder-export claim corrected (claim 10); NIOS landing point made vendor-neutral |
| Part 5.1 How Kerberos uses DNS | "What Kerberos needs from DNS on the way out" | Step 5 corrected (claim 35) |
| §7.8 "The AD retirement timeline" bullet | Opening ("before the last DC is decommissioned") | Rest of §7.8 belongs to Ch01/Ch03/Ch05/Ch12 |
| §10.2 Decision 4 | Opening (irrecoverability) | Ch08 owns the decisions |
| Appendix B Q6 (Microsoft migration guidance AD DNS → DDI) | — | Open vendor question, not a claim |

### DNS Modernization Guide (`docs/operational-guides/network-transformation/dns-modernization.md`), absorbed sections

| Guide § | Went to | Or why not carried |
|---|---|---|
| 2 intro (decompose the landscape) | "What AD-integrated DNS actually is" | — |
| 2.1 AD-integrated zones (ForestDnsZones, DomainDnsZones, custom partitions) | Same section | Restated with cmdlet scope values |
| 2.2 Standard primary/secondary zones | Component table | — |
| 2.3 Stub zones | Component table | — |
| 2.4 Conditional forwarders | Component table and paragraph | — |
| 2.5 GlobalNames zone | Component table | Migration method in Ch10 |
| 2.6 SRV records (record families) | Locator records table | Expanded to the full Netlogon list |
| 2.7 Dynamic DNS updates (secure updates, DHCP on behalf of clients, scavenging) | "Secure dynamic updates and the DHCP server" | Expanded (ownership, DnsUpdateProxy, credentials, name protection) |
| 2.8 Reverse lookup zones | Component table | ISP delegation for public reverse DNS not carried (not an AD dependency) |
| 2.9 DNSSEC (Key Master, trust anchors in AD) | Component table; Ch06 | — |
| 2.10 Component migration matrix | Ch10 "Where each component goes" | Owned by Ch10 |
| 7.1 Critical AD SRV records (failure-impact table) | Locator records table | Merged with the Netlogon record list |
| 7.2 SRV record monitoring | Ch11; Ch10 Phase 5 gate | Owned there |
| 11.1 DHCP and DNS current state (DHCP registers A and PTR with its service account; scavenging) | "Secure dynamic updates and the DHCP server" | "Credentials of the DHCP service account" corrected to the configured DNS credential (the documented pattern) |
| All other sections | See the Ch10, Ch07, Ch06 and Ch11 ledgers | Not this chapter's scope |

### Diagram

| Diagram | Status |
|---|---|
| `ch04-ad-dns-departure.flow.yaml` | Kept unchanged |
