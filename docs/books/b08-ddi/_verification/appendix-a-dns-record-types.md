# Verification — Appendix A, DNS Record Types and Ecosystem Integrations

Checked October 20, 2026. Sources: the existing series page (Next Generation DDI, Appendix A) verified and upgraded in place, plus the whole of the archived reference companion `docs/whitepapers/infoblox-dns-reference.md` (record-type catalog, security-integration matrix, "Infoblox DDI and the full record type surface," and the Universal DDI ecosystem-integration section), merged without duplication. Record types and RFC numbers were checked against the IANA RR TYPEs registry (last updated 2026-10-16) and each RFC on rfc-editor.org or the IETF Datatracker. Microsoft claims were checked on Microsoft Learn; AWS, HashiCorp, ServiceNow, Splunk and Infoblox claims on their own documentation. No diagram (appendix).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | IANA registers "dozens" / "more than fifty standardized" record types | How to read | corrected: close to a hundred assigned type values, including obsolete and experimental | IANA RR TYPEs registry |
| 2 | RFC numbers for A, AAAA, CNAME, PTR, SRV, NAPTR, CAA, TLSA, SSHFP, SMIMEA, SVCB/HTTPS, DS, DNSKEY, RRSIG, NSEC, NSEC3, CDS, CDNSKEY | Throughout | verified | IANA registry references |
| 3 | CNAME not permitted at apex (RFC 1034 §3.6.2) | Address records | verified; reasoning added (apex holds SOA/NS; "no other data should be present") | RFC 1034 §3.6.2; Learn, Alias records overview |
| 4 | CNAME chains add a lookup per hop; dangling CNAME → subdomain takeover | Address records | verified (Azure alias doc describes dangling records); kept as stated | Learn, Alias records overview |
| 5 | ALIAS/ANAME non-standard; Route 53 "Alias record," Azure "Alias record set"; answered as A/AAAA | Address records | verified; Route 53 quote ("a Route 53–specific extension to DNS"), apex support, appears as A/AAAA; Azure alias targets and dangling protection added; neither in IANA registry | AWS Route 53 Developer Guide; Learn, Alias records overview; IANA |
| 6 | Infoblox NIOS implements ALIAS | Address records | removed (vendor-neutral catalog; not needed for the argument) | — |
| 7 | AAAA: IPv6 mandatory under M-21-07; dual-stack doubles governance | Address records | restated: M-21-07 sets IPv6-only targets (milestones in Ch 07); "invisible to diagnostic tools" restated as program experience | M-21-07 (verified in Ch 07/App B) |
| 8 | PTR needed for mail deliverability and SIEM attribution | Address records | restated-as-design (general practice; no footnote) | — |
| 9 | PTR: "some Kerberos implementations perform reverse lookup to validate the client host" | Address records | corrected: MIT Kerberos uses reverse lookup (rdns, default true) to canonicalize service host names, not to validate the client | MIT krb5.conf documentation |
| 10 | PTR: NIST CSF logging "implicitly assumes" named hosts | Address records | removed (unsupported inference) | — |
| 11 | PTR automation by Infoblox IPAM | Address records | restated-as-design (IPAM-driven allocation creates A and PTR together) | — |
| 12 | SRV record format | Service discovery | verified | RFC 2782 (IANA reference) |
| 13 | AD SRV list: `_kerberos._tcp/_udp`, `_ldap._tcp`, `_ldap._tcp.dc._msdcs`, `_gc._tcp.<forest>`, `_kpasswd._tcp`, `_ldap._tcp.pdc._msdcs` | Service discovery | verified and expanded into a table from the Netlogon mnemonic list; corrected `_msdcs.<domain>` "entire subtree" to the forest-level `<DsaGuid>._msdcs.<forest>` and `gc._msdcs.<forest>` records; added `_kpasswd._udp`, site-specific variants and hourly re-registration | Learn, KB 267855; Learn, Locating domain controllers |
| 14 | AD DS remains supported in Windows Server 2025 | Service discovery | not carried (Chapter 04 owns the AD departure; linked instead) | — |
| 15 | SRV records don't migrate when AD retires; legacy Java, AD-joined Linux, network devices fail | Service discovery | kept as program position (Ch 04/Ch 10 linked) | — |
| 16 | SIP SRV `_sip._tls`, `_sips._tcp` | Service discovery | corrected: RFC 3263 labels are `_sip._udp`, `_sip._tcp`, `_sips._tcp` (`_sip._tls` is a vendor-specific legacy label) | RFC 3263 |
| 17 | Cisco UCM, Teams Direct Routing and Zoom Phone publish/consume SRV | Service discovery | removed (not verified per product) | — |
| 18 | XMPP `_xmpp-client._tcp`, `_xmpp-server._tcp`; "still used in some federal agencies" | Service discovery | labels verified; agency-usage claim removed | RFC 6120 §3.2.1 |
| 19 | Mail autoconfig `_imap._tcp`, `_imaps._tcp`, `_smtp._tcp` | Service discovery | corrected: RFC 6186 defines `_submission._tcp`, `_imap._tcp`, `_imaps._tcp`, `_pop3._tcp`, `_pop3s._tcp`; `_smtp._tcp` is not defined (SMTP uses MX) | RFC 6186 |
| 20 | Service meshes Istio/Consul use SRV | Service discovery | corrected: Consul DNS answers SRV queries (verified); Istio claim removed | HashiCorp Consul DNS reference |
| 21 | Cisco SD-WAN application-aware routing consumes DNS SRV data | Service discovery | removed (not verified) | — |
| 22 | NAPTR regex rewriting; ENUM (RFC 6116) maps E.164 to URIs; NAPTR then SRV | Service discovery | verified; SIP NAPTR→SRV procedure added | RFC 3403 (IANA); RFC 6116; RFC 3263 |
| 23 | E911 `_e911._udp.agency.gov`; Teams Phone NAPTR patterns; CUCM PSTN | Service discovery | removed (not verifiable as stated) | — |
| 24 | CAA tags issue / issuewild / iodef | Certificate governance | verified; issuewild precedence added | RFC 8659 |
| 25 | CAA mandatory for CA/B Forum CAs, BR §3.2.2.8, effective 2017 | Certificate governance | verified: Ballot 187, effective September 8, 2017; RFC 8659 §3 MUST quoted | CA/B Forum Ballot 187; RFC 8659 |
| 26 | Split-brain CAA affects internal ACME, not public issuance | Certificate governance | kept as program analysis | — |
| 27 | TLSA usage / selector / matching type fields | Certificate governance | verified; usage values 0–3 named precisely | RFC 6698 §2.1 |
| 28 | DANE requires DNSSEC | Certificate governance | verified (quote) | RFC 6698 §1.3, §8 |
| 29 | SSHFP requires DNSSEC | Certificate governance | verified ("MUST NOT be trusted" unless authenticated) | RFC 4255 §2.4 |
| 30 | SMIMEA at `_smimecert`, requires DNSSEC | Certificate governance | verified; added that RFC 8162 is Experimental and the hashed local-part naming | RFC 8162 |
| 31 | Email auth: "five mechanisms, all TXT or CNAME, none require a new record type" | Email | restated: TXT records plus an HTTPS policy for MTA-STS | RFC 7208, 8461 |
| 32 | SPF exactly one record; duplicates → permanent failure (RFC 7208 §3.2) | Email | verified (`permerror`, §3.2 and §4.5) | RFC 7208 |
| 33 | SPF 10-lookup limit; mechanisms counted | Email | verified; corrected list: `redirect` modifier counts; `ip4`, `ip6`, `all` don't; count is global | RFC 7208 §4.6.4 |
| 34 | SPF published as TXT | Email | verified; added SPF RR type 99 discontinued | RFC 7208 §3.1 |
| 35 | DKIM at `selector._domainkey`; selectors enable rotation | Email | verified | RFC 6376 |
| 36 | DMARC RFC 9989 (May 2026) obsoletes 7489 and 9091; drops `pct`; DNS tree walk; RFC 9990/9991 | Email | verified | RFC 9989; Datatracker |
| 37 | BOD 18-01 requires p=reject for second-level domains | Email | verified and made precise: all second-level domains and mail-sending hosts, by October 16, 2018 | CISA BOD 18-01 |
| 38 | BIMI at `default._bimi`; VMC requires DMARC enforcement; "IETF draft / AuthIndicators WG"; Gmail, Apple Mail, Yahoo display logos; federal agencies evaluating | Email | corrected: individual Internet-Draft (rev. 14, May 1, 2026), "no formal standing," not a WG document; DMARC quarantine or reject required for BIMI itself; VMC and CMC evidence; mail-client and agency-adoption claims removed | IETF Datatracker, BIMI draft -14 |
| 39 | MTA-STS TXT + policy file; enforce TLS; certificate dependency | Email | verified; modes enforce/testing/none added | RFC 8461 |
| 40 | SVCB/HTTPS RFC 9460 "August 2023" | Service binding | corrected: November 2023 | Datatracker RFC 9460 |
| 41 | HTTPS record carries ALPN, port, IPv4/IPv6 hints | Service binding | verified | RFC 9460 §7 |
| 42 | HTTPS record carries ECH configuration | Service binding | corrected: `ech` SvcParam is defined in RFC 9848 (March 2026), ECH in RFC 9849, not in RFC 9460 | RFC 9848; RFC 9849 |
| 43 | Cloudflare and Google serve HTTPS records | Service binding | removed (not verified; not needed) | — |
| 44 | Infoblox Universal DDI added HTTPS/SVCB support; "as of BloxOne DDI release; ECH distribution" | Service binding | removed (vendor feature claim not verified; vendor-neutral catalog) | — |
| 45 | ECH vs. DPI split-brain risk | Service binding | kept as program analysis; inspection interaction linked to Ch 05 | — |
| 46 | DNSSEC = RFC 4033/4034/4035; integrity not encryption | DNSSEC | verified; RFC 9364 BCP 237 summary added | RFC 4034; RFC 9364; Learn, DNSSEC overview |
| 47 | KSK/ZSK split | DNSSEC | verified as operational convention; SEP flag is a hint | RFC 4034; Learn, DNSSEC overview |
| 48 | DS in parent; mismatch fails validation; "updated within the TTL window or validation fails globally" | DNSSEC | corrected: missing or mismatched DS breaks the chain; publish new DS before withdrawing old key | Learn, DNSSEC overview |
| 49 | RRSIG expiry → SERVFAIL; automate signing | DNSSEC | verified | RFC 4034 ("MUST NOT be used for authentication after the expiration date"); Learn, DNSSEC overview |
| 50 | NSEC3 / RFC 9276 quotes (iterations 0 MUST, no salt SHOULD NOT, opt-out NOT RECOMMENDED for small zones); August 2022 | DNSSEC | verified; BCP 236 added | RFC 9276; Datatracker |
| 51 | NSEC3 "preventing zone enumeration" (matrix) | DNSSEC, matrix | corrected: raises the cost; hashes subject to offline dictionary attack | RFC 9276; Learn, DNSSEC overview |
| 52 | Compact denial of existence | DNSSEC | added: RFC 9824; Azure Public DNS uses it instead of NSEC/NSEC3 | RFC 9824; Learn, DNSSEC overview |
| 53 | CDS/CDNSKEY RFC 7344 automates rollover; "Infoblox NIOS supports CDS/CDNSKEY" | DNSSEC | RFC verified; parent must act on it added; NIOS claim removed (vendor-neutral) | RFC 7344 |
| 54 | Security integration matrix values | Matrix | kept as program assessment (labeled); ALIAS row added; NSEC row relabeled; "App-aware routing" for SRV generalized to service discovery | — |
| 55 | Infoblox "full record type surface" feature list (SPF lookup validation, CAA drift alerts, TLSA from cert metadata, SRV orphan detection, DNSSEC on BloxOne resolvers) | Not carried | removed: vendor feature list, not verified; the governance implication paragraph kept in the matrix section | — |
| 56 | REST API / WAPI | Integrations | verified as product names; kept in the example column | Infoblox Terraform/Ansible docs (WAPI basis) |
| 57 | Infoblox "maintains an official Terraform provider" | Integrations | corrected: two partner-tier providers on the Terraform Registry, `infobloxopen/infoblox` (NIOS) and `infobloxopen/bloxone` (Universal DDI) | Terraform Registry |
| 58 | Ansible modules | Integrations | verified: collection `infoblox.nios_modules` | Ansible documentation (search result; page rate-limited on direct fetch) |
| 59 | IPAM-driven CI/CD | Integrations | kept; AWS VPC IPAM external authority example added (private scopes) | AWS VPC IPAM User Guide |
| 60 | Network Insight discovery and rogue DHCP detection | Integrations | restated: discovery and rogue-DHCP detection as a requirement; vendor example corrected to the documented NetMRI + NIOS rogue DHCP workflow (Network Insight-specific documentation not found) | Infoblox NetMRI docs (search result) |
| 61 | Splunk: log streaming + Splunk App | Integrations | verified: Splunk Add-on for Infoblox (NIOS DNS/DHCP logs) | Splunk documentation (search result; direct fetch blocked) |
| 62 | ServiceNow: CMDB + ITSM connector | Integrations | verified: ServiceNow Service Graph Connector for Infoblox (subnets, allocated IPs, DNS into CMDB) | ServiceNow Store |
| 63 | Palo Alto: "RPZ ↔ EDL sync," bidirectional sharing | Integrations | corrected: NIOS outbound API pushes IPAM data and DNS threat events to PAN address groups; bidirectional/EDL claim not verified, removed | Infoblox PAN deployment guide (Dec 2023) |
| 64 | CrowdStrike Falcon host enrichment | Integrations | removed as a named vendor (no Infoblox-published guide found); kept as an EDR integration category | — |
| 65 | Cisco ISE IPAM ↔ policy context | Integrations | removed as a named vendor (not found); kept as a NAC category | — |
| 66 | Microsoft Sentinel log connector | Integrations | verified: Sentinel data connectors for NIOS syslog and the Infoblox cloud data connector | Learn, Sentinel data connectors reference; Syslog via AMA |
| 67 | Qualys / Tenable scan-target enrichment | Integrations | Tenable verified (NIOS outbound API guide); Qualys removed (not verified) | Infoblox Tenable.io guide |
| 68 | DNS as earliest incident signal | Integrations | kept as program analysis | — |
| 69 | Audit trail and change control; maps to SP 800-53 CM controls | Integrations | verified and made specific: CM-3 Configuration Change Control text; vendor-specific "Grid Manager"/"pre-commit hook" wording generalized | SP 800-53 Rev. 5 (OSCAL 5.2.0) |
| 70 | Glossary: GCC-Moderate "at FedRAMP Moderate" | Glossary | verified (Marketplace Class C / Moderate); linked to App C | FedRAMP Marketplace MSO365MT (App C) |
| 71 | Glossary: INR Worldwide only | Glossary | verified (App C footnote) | Learn, INR |
| 72 | Glossary: redirect-dns, DNS-01, RPZ, Protective DNS | Glossary | verified in the owning chapters; linked | Ch 03, Ch 05, Ch 11 |
| 73 | Glossary: ECH | Glossary | added | RFC 9849 |
| 74 | Source note (Word edition, source list) | Source note | removed from this page: the full source list lives in Appendix B; no duplication | — |
| 75 | Front matter, title form, thesis, In-this-appendix and Continue callouts | Page | restyled to the Books 02–07 template; `lifecycle_review` 2027-04-01; keys `[^aA-…]` | brief |

## Carry-forward ledger

### Series page (existing Appendix A)

| Source page § | Went to | Or why not carried |
|---|---|---|
| Intro paragraph | "How to read the catalog" | — |
| DNS Record Type Catalog (intro) | "How to read the catalog" | count corrected |
| Address and Alias Records | "Address and alias records" | — |
| Service Discovery Records | "Service discovery records" | — |
| Certificate Governance Records | "Certificate governance records" | — |
| Email Authentication Records | "Email authentication records" | — |
| Modern Service Binding Records | "Modern service binding records" | — |
| DNSSEC Record Types | "DNSSEC record types" | — |
| Security Integration Matrix (Summary) | "Security integration matrix" (prose under the table) | merged with the full matrix from the reference |
| Ecosystem Integrations | "Ecosystem integrations" (table + audit paragraph) | — |
| Governance-implication paragraph | End of "Security integration matrix" | — |
| Glossary | "Glossary" | ECH added |
| Source Note | Not carried | duplicated Appendix B's source list and the index page's source note |
| Previous/Next links | "Continue the book" callout | — |

### Absorbed: `docs/whitepapers/infoblox-dns-reference.md`

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, download callout, companion intro, citation pointer | Not carried | page-specific scaffolding for the archived paper; never link to it |
| DNS Record Type Catalog (intro) | "How to read the catalog" | "more than fifty standardized" corrected |
| Address and Alias Records — A | "Address and alias records," A | — |
| — AAAA | AAAA | M-21-07 wording corrected |
| — CNAME | CNAME | — |
| — ALIAS / ANAME | ALIAS / ANAME | NIOS mention removed; AWS/Azure detail verified |
| — PTR (four uses) | PTR | Kerberos corrected; NIST CSF inference removed |
| Service Discovery — SRV format | SRV code block | — |
| — AD SRV list | SRV DC locator table | expanded and corrected from Microsoft's list |
| — AD retirement consequences | SRV paragraph | Windows Server 2025 note left to Ch 04 |
| — SRV beyond AD (SIP, XMPP, mail, meshes, SD-WAN) | SRV, "Outside Active Directory" | labels corrected; unverified product and SD-WAN claims removed |
| — NAPTR | NAPTR | E911/Teams/CUCM specifics removed |
| Certificate Governance — CAA (tags, mandate, split-brain) | CAA | — |
| — TLSA / DANE | TLSA | — |
| — SSHFP | SSHFP | — |
| — SMIMEA | SMIMEA | Experimental status added |
| Email Authentication — intro | Email intro | corrected |
| — SPF (three failure modes) | SPF numbered list | — |
| — DKIM | DKIM | — |
| — DMARC (RFC 9989 detail, BOD 18-01, reporting) | DMARC | — |
| — BIMI | BIMI | status corrected; client and agency-adoption claims removed |
| — MTA-STS | MTA-STS | — |
| Modern Service Binding — HTTPS/SVCB (ALPN, ECH, port, hints) | SVCB and HTTPS | ECH RFC corrected |
| — provider deployment (Cloudflare, Google) | Not carried | unverified, not needed |
| — three federal reasons | Numbered list | Infoblox reason replaced by an inspection reason (Ch 05) |
| DNSSEC — intro | DNSSEC intro | — |
| — DNSKEY | DNSKEY | — |
| — DS | DS | rollover timing corrected |
| — RRSIG | RRSIG | — |
| — NSEC / NSEC3 (RFC 9276) | NSEC and NSEC3 | compact denial added |
| — CDS / CDNSKEY | CDS and CDNSKEY | NIOS mention removed |
| Security Integration Matrix (table) | "Security integration matrix" table | — |
| Infoblox DDI and the Full Record Type Surface (feature bullets) | Not carried | unverified vendor feature list; Chapter 12 owns selection criteria |
| — governance implication paragraph | End of matrix section | — |
| Universal DDI Ecosystem Integrations — intro | "Ecosystem integrations" intro | made vendor-neutral |
| — REST API and WAPI; Terraform; Ansible; IPAM-driven CI/CD | Integration table rows 1–4 | Terraform claim corrected |
| — Network Insight (discovery, compliance inventory) | "Network discovery" row | vendor example corrected to NetMRI |
| — Rogue DHCP detection | "Network discovery" row; Ch 05 linked | — |
| — Ecosystem Exchange table (Splunk, ServiceNow, Palo Alto, CrowdStrike, Cisco ISE, Sentinel, Qualys/Tenable) | Integration table rows 6–10 | CrowdStrike, Cisco ISE, Qualys not verified, kept only as categories; PAN detail corrected |
| — "DNS is often the earliest signal" | Paragraph after the table | — |
| — Audit trail and change control | "Audit trail and change control" paragraph | CM-3 made specific |
| — NIOS change-control approval workflow | Same paragraph, generalized | vendor feature name dropped |
| Footnote `ibr-adds2025` (Windows Server 2025 AD DS) | Not carried | AD DS support status is Chapter 04's claim; not needed here |
