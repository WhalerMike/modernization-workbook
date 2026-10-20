# Verification — Chapter 06, DNS Identity, Certificates and DNSSEC

File: `docs/books/b08-ddi/06-dns-identity-and-dnssec.md`
Diagram sources: `docs/images/diagrams/b08-ddi/src/ch06-trust-chain.flow.yaml`, `ch06-dnssec-validation.flow.yaml` (both kept unchanged; content correct, chapter numbers current)
Checked 2026-10-20 against Microsoft Learn (Entra national-cloud endpoints, AADSTS900439, Office 365 GCC service description, access token claims, Windows Server DNSSEC overview, Key Master, zone signing and validation, Azure DNS DNSSEC and FAQ, Azure DNS unsign, Azure Virtual Network encryption, Windows DoH server), AWS Route 53 documentation, NIST SP 800-81r3 (PDF text extracted), the NIST SP 800-53 Rev. 5 OSCAL catalog (release 5.2.0, SC-20 and SC-21 statements extracted), OMB M-08-23 (PDF text extracted), the RFC Editor, and Book 07 (branch `book/b07-pki`, chapters 01, 02 and 08) for certificate consistency. Sources: the series chapter (old Ch06), the whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md` (Parts 5.2–5.5, Part 6 except §6.5, §7.2 DNSSEC paragraph, §7.8 PKI bullet) and the DNS Modernization Guide `docs/operational-guides/network-transformation/dns-modernization.md` (§8.1–8.5). All nine existing footnotes were re-opened and resolve. Footnote keys below drop the `c06-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ACME dns-01 needs TXT records under controlled authority | DNS identity | verified (re-opened; §8.4) | rfc8555 |
| 2 | CAA limits which CAs may issue | DNS identity | verified (re-opened; authors added) | rfc8659 |
| 3 | Book 07: CyberArk Certificate Manager is the lifecycle platform; dns-01 makes the zone the gate; DNS team consulted | DNS identity | verified against Book 07 Ch08 (consistency) | Book 07 Ch08 |
| 4 | Public TLS lifetimes falling to 47 days under CA/B Forum schedule | DNS identity | verified against Book 07 Ch01 (SC-081v3, BR 2.3.1) | Book 07 Ch01 |
| 5 | DNSSEC makes DANE TLSA usable | DNS identity | verified (re-opened) | rfc6698 |
| 6 | DoH server certificate needs Server Authentication EKU and SAN matching URI template | DNS identity | verified (added) | ws-doh |
| 7 | FQDN-based ZTNA policy; tokens after connection; Protective DNS helps | DNS identity | restated-as-design (series text) | — |
| 8 | Global endpoint login.microsoftonline.com; Azure Government login.microsoftonline.us | Kerberos to tokens | verified | national |
| 9 | login.microsoftonline.us serves Microsoft 365 GCC High and DoD; public endpoint rejected for Azure Government apps | Kerberos to tokens | verified | aadsts |
| 10 | Whitepaper §5.2: GCC uses login.microsoftonline.us | Kerberos to tokens | corrected: GCC operates with Azure Public Cloud and uses the global endpoint; .us is GCC High and DoD | gcc; aadsts |
| 11 | Whitepaper §5.2: aud "contains the FQDN" | Kerberos to tokens | corrected: v2.0 aud is always the API client ID; v1.0 may be the resource URI | aud |
| 12 | Renaming a host doesn't change the audience | Kerberos to tokens | restated-as-design (follows from claim 11) | aud |
| 13 | SAN mismatch fails the handshake | Kerberos to tokens | restated (TLS behavior, also RFC 9525) | rfc9525 |
| 14 | Entra CBA: one HTTP CRL per CA, no OCSP, no LDAP | Kerberos to tokens | verified against Book 07 Ch02/Ch07 (consistency) | Book 07 Ch02 |
| 15 | Certificate split-brain scenario (payments/OCSP/Route 53 rule) | Certificate split-brain | restated-as-design (whitepaper §5.3 worked example; CRL added alongside OCSP; "OCSP unreachable error" wording generalized) | — |
| 16 | Hard-fail vs soft-fail clients on revocation unavailability | Certificate split-brain | restated (generic TLS client behavior; no product claim) | — |
| 17 | DNS correctness is a PKI trust prerequisite | Certificate split-brain | restated-as-design (whitepaper §5.4) | — |
| 18 | RFC 9525 Nov 2023 obsoletes RFC 6125 (Mar 2011); wildcard only as complete leftmost label, one, matches one label; otherwise invalid | Geographic scoping | verified | rfc9525 |
| 19 | Whitepaper §5.5 history: RFC 2818 ambiguity, CA/B BR 2012 prohibition, named TLS libraries rejecting mid-label wildcards | Geographic scoping | removed (not verified; RFC 9525 settles the point) | — |
| 20 | DNS wildcards can match multiple labels; certificate wildcards one | Geographic scoping | verified (RFC 9525 notes the difference from RFC 1034/4592) | rfc9525 |
| 21 | Multi-SAN wildcard widens key-compromise blast radius | Geographic scoping | restated-as-design | — |
| 22 | Whitepaper: name constraints mean "a browser or TLS client will reject" out-of-scope certificates | Geographic scoping | corrected: RFC 5280 requires CAs to mark the extension critical, but dNSName constraint processing is SHOULD for applications; test relying parties | rfc5280 |
| 23 | Three-layer table (DNS, SANs, name constraints) | Geographic scoping | restated-as-design (whitepaper table; "one certificate or one per region" added) | — |
| 24 | Geographic split-brain crosses data boundary silently | Geographic scoping | restated-as-design (whitepaper §5.5, §6.6) | — |
| 25 | L4 vs L7 policy; FQDN as stable identity | DNS as application surface | restated-as-design (whitepaper §6.1–6.2); NIST ZTA policy enforcement points cited for framing | sp800207 |
| 26 | Wildcards defined since RFC 1034, clarified in RFC 4592 | DNS as application surface | verified (RFC 4592 updates 1034) | rfc4592 |
| 27 | Wildcard failure takes out every API behind the gateway | DNS as application surface | restated-as-design (whitepaper §6.4) | — |
| 28 | Geographic split-brain yields NXDOMAIN with different alert signature | DNS as application surface | restated-as-design (whitepaper §6.6) | — |
| 29 | Whitepaper §6.5: Universal DDI "the only currently available platform" for full FQDN namespace | — | not carried here (vendor-positioning; §6.5 owned by Ch07) | — |
| 30 | DNSSEC: origin authentication, integrity, authenticated denial; RFC 4033–4035; RFC 9364 BCP | DNSSEC | verified (re-opened; RFC 4034/4035 added) | rfc4033 |
| 31 | Chain of trust via DNSKEY and DS; SERVFAIL on bad signature | DNSSEC | verified | azdnssec |
| 32 | DNSSEC no confidentiality; encrypted DNS no data integrity | DNSSEC | verified | nist81 §3.8 |
| 33 | M-08-23: deploy DNSSEC to all applicable systems by Dec 2009; sign all agency .gov domains | Why it matters | verified (PDF text) | m0823 |
| 34 | SC-20 for external queries; SC-21 "request and perform" | Why it matters | verified (OSCAL statement text); series said "SC-20 and SC-21 require signing and validation" — refined to their actual scope | sp80053 |
| 35 | Series: "NIST SP 800-81r3 recommends deploying it" | Why it matters | corrected/refined: recommends validation with the root trust anchor and automated trust-anchor rollover; signing internal zones "not recommended" unless required (§3.8.6), with three reasons and the separate-delegation advice | nist81 |
| 36 | Program position: sign external, validate everywhere, sign internal only where required | Why it matters | restated-as-design | — |
| 37 | Validation on an agency-controlled resolver | Why it matters | restated-as-design (series text; links Ch05) | — |
| 38 | HSM for KSK; DNSKEY RRSIG validity 5–7 days; key lifetimes 1–3 years | Operational considerations | verified (added) | nist81 §3.8.1–3.8.2 |
| 39 | NIST algorithm table: RSA-SHA256 ≥ 2048, ECDSA P-256/P-384; prefers ECDSA | Operational considerations | verified (added) | nist81 §3.8.1 |
| 40 | Windows wizard defaults: RSA/SHA-256, KSK 2048, ZSK 1024; ECDSA options; NSEC3 "recommended" | Operational considerations | verified (added); program correction that a 1,024-bit default ZSK is below NIST's RSA floor | ws-sign |
| 41 | NIST: NSEC3 only raises zone-walk cost, uses SHA-1; NSEC "more prudent" | Operational considerations | verified (added) | nist81 §3.8.3 |
| 42 | RFC 9824 compact denial of existence, Sept 2025; Azure uses it | Operational considerations | verified (NIST 81r3 §3.8.4 still calls it IETF work in progress; RFC since published) | rfc9824; azdnssec |
| 43 | EDNS(0) needed; responses larger during algorithm rollover | Operational considerations | verified (re-opened RFC 6891; NIST §3.8.5) | rfc6891; nist81 |
| 44 | Inconsistent signing across views surfaces as app/cert errors; stubs see generic failure; check validator logs | Operational considerations | verified for the stub/log point (NIST §5.2); rest restated-as-design | nist81 |
| 45 | Windows Key Master role; keys replicated via AD; in-memory signed copies; HSM option | Platforms | verified | keymaster; ws-sign |
| 46 | Trust anchors in forest directory partition on DCs; TrustAnchors.dns standalone; RFC 5011 automatic update | Platforms | verified | ws-dnssec; ws-validate |
| 47 | Windows 10/11 non-validating security-aware stubs; NRPT can require validation | Platforms | verified | azdnssec |
| 48 | Azure DNS public zones only (Private DNS not covered by DNSSEC docs) | Platforms | verified/restated: FAQ says "Azure Public DNS supports DNSSEC"; no Private DNS DNSSEC documentation exists; series' "Private DNS zones cannot be signed" restated in that documented form | azfaq; azdnssec |
| 49 | Azure: ECDSAP256SHA256; automatic ZSK rollover; KSK via support; Azure-provided resolver doesn't validate | Platforms | verified (re-opened; algorithm and KSK detail added) | azdnssec |
| 50 | Route 53: public hosted zones only; customer KSK as asymmetric KMS key; Route 53 manages ZSK | Platforms | verified (re-opened; KMS detail added) | r53sign |
| 51 | Route 53 VPC Resolver validation per VPC for public signed names; forward target must validate; ignores DO/CD, no AD bit | Platforms | verified (added) | r53validate |
| 52 | Entra ID does nothing for DNSSEC or private endpoint DNS | Platforms | restated (series text; product scope) | — |
| 53 | Microsoft-owned service domains as CNAME targets may be unsigned | — | removed (only a community Q&A source found) | — |
| 54 | nslookup isn't DNSSEC-aware; Resolve-DnsName -DnssecOk | Platforms; code | verified | azdnssec |
| 55 | Get-DnsServerDnsSecZoneSetting and Get-DnsServerSigningKey exist | Code | verified (cmdlet pages resolve; used in guide §4.6 script) | Learn cmdlet pages |
| 56 | Guide §8.5: finish rollovers before migrating; none during migration; verify new chain before removing source signing | Moving signed zones | restated-as-design (program sequence) | — |
| 57 | Remove DS at parent and wait for TTL before unsigning | Moving signed zones | verified (added) | az-unsign |
| 58 | Guide §8.2: Azure manages key generation and signing; DS registration with registrar | Moving signed zones; Platforms | verified (DS managed in parent; KSK replacement via support) | azdnssec |
| 59 | Guide §8.2/8.3: Private Zones DNSSEC "not applicable within trusted networks" | Moving signed zones | restated: a documented risk decision; NIST §3.8.6 is the stronger basis | nist81 |
| 60 | Guide §8.3: "VNet encryption — VNet traffic is encrypted at the infrastructure layer" | Moving signed zones | corrected: opt-in; VM-to-VM on supported sizes with Accelerated Networking; AllowUnencrypted only; public preview in Azure Government | vnetenc |
| 61 | Guide §8.3: Private Link eliminates DNS spoofing vectors | Moving signed zones | corrected: removes the public endpoint, doesn't make in-network DNS tamper-proof | — (reasoning; Private Link behavior in Ch07) |
| 62 | Guide §8.4 step 5: remove trust anchors after 90-day validation | Moving signed zones | restated-as-design (program period) | — |
| 63 | Whitepaper §7.8: federal PKI migrating "from legacy CRL distribution to OCSP" | — | not carried: contradicts Book 07 (Entra CBA uses CRLs, Cloud PKI has no OCSP responder) | Book 07 Ch02/Ch04 |
| 64 | Whitepaper §7.2: NIOS performs DNSSEC validation and signing | Platforms ("Everywhere" bullet, generic) | restated generically (DDI platform signs under one policy) | — |

## 2. Carry-forward ledger

### Series chapter (old Chapter 06)

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter and subtitle | Front matter; italic thesis | Restyled as in the brief |
| "Download this chapter" callout | — | Removed per brief |
| DNS Identity as the Foundation for Certificates, Application-Aware Networking and Tokens | "DNS identity as the foundation for certificates, policy and tokens" | Kept; Book 07 alignment and DoH certificate detail added |
| Diagram `ch06-trust-chain` | Kept, with `#fig-` id | — |
| DNSSEC (definition, three properties, chain of trust) | "DNSSEC" | Kept |
| Why It Matters in Hybrid Multi-Cloud and Federal Environments | Same heading (sentence case) | Federal bullets refined (claims 34, 35) |
| Diagram `ch06-dnssec-validation` | Kept, with `#fig-` id | — |
| Operational Considerations | Same heading | Expanded (algorithms, NSEC, validity periods) |
| Inconsistent-views paragraph | "Consistency across views" bullet | — |
| DNSSEC Across Azure, AWS and Other Cloud Providers | "DNSSEC on Windows Server, Azure and AWS" | Windows added; AWS validation detail added |
| What this chapter establishes | Kept, four points | — |
| Previous/Next footer | "Continue the book" callout | — |

### Whitepaper, absorbed sections

| Source § | Went to | Or why not carried |
|---|---|---|
| In this whitepaper, arguments 5 and 6 | "From Kerberos to tokens"; "DNS as the application surface" | — |
| Part 5.1 How Kerberos uses DNS | Ch04 | Owned by Ch04 (corrected there) |
| Part 5.2 How Entra ID tokens replace Kerberos | "From Kerberos to tokens" | Corrected (claims 10, 11); OCSP/CRL bullet aligned with Book 07 |
| Part 5.3 The certificate split-brain problem | "The certificate split-brain problem" | Kept as worked example; CRL added |
| Part 5.4 DNS correctness is a PKI trust prerequisite | End of the split-brain subsection | — |
| Part 5.5 Geographic certificate scoping | "Geographic scoping" | History removed (claim 19); name-constraint enforcement corrected (claim 22) |
| Part 6.1 Session versus application networking | "DNS as the application surface" | Condensed |
| Part 6.2 FQDN as the stable service identity | Same | — |
| Part 6.3 Wildcard DNS and the application surface | Same | — |
| Part 6.4 What wildcard DNS means for governance | Same | — |
| Part 6.5 The IPAM implication | Ch07 (link) | Owned by Ch07; vendor "only platform" claim not carried |
| Part 6.6 Geographic namespace | "DNS as the application surface" (last paragraph) | — |
| §7.2 NIOS DNSSEC paragraph | Platforms ("Everywhere") | Generic |
| §7.8 "The PKI modernization timeline" bullet | — | Not carried (claim 63); remainder owned by Ch01/Ch03 |
| Decision 5 (OCSP/CRL reachability) | Split-brain subsection (link to Ch08) | Ch08 owns it |
| Part 3 record catalog (CAA, TLSA, SSHFP, DNSSEC record family) | Appendix A | Owned by Appendix A |

### DNS Modernization Guide, absorbed sections

| Guide § | Went to | Or why not carried |
|---|---|---|
| 2.9 DNSSEC (Key Master, trust anchors via AD) | Platforms (Windows Server) | Also summarized in Ch04 |
| 4.6 Get-FMPDNSSECStatus | Code block (two read-only cmdlets it uses) | Full function owned by Ch10 ledger (not carried) |
| 8.1 Current state assessment | Platforms (Windows) and Ch10 Phase 1 | — |
| 8.2 Azure DNS DNSSEC support table | Platforms (Azure) | Corrected wording (claim 48) |
| 8.3 Security trade-off documentation | "Moving signed zones" step 4 | Two controls corrected (claims 60, 61) |
| 8.4 Transition plan (five steps) | "Moving signed zones" steps 2, 4, 5 | — |
| 8.5 Key rollover during migration | "Moving signed zones" steps 1–3 | "DNS Analytics" monitoring replaced by validator logs (DNS Analytics retired; see Ch11 ledger) |

### Diagrams

| Diagram | Status |
|---|---|
| `ch06-trust-chain.flow.yaml` | Kept unchanged |
| `ch06-dnssec-validation.flow.yaml` | Kept unchanged |
