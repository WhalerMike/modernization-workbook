# Verification — Chapter 10, The Migration Sequence

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch: DnsServer, DhcpServer and DnsClient cmdlet references, Azure CLI `dns-resolver` reference, Azure DNS, Private DNS, Private Resolver and Virtual Network documentation, Windows Server DHCP failover) and Infoblox NIOS documentation. Sources: the series chapter (old Ch09), the DNS Modernization Guide `docs/operational-guides/network-transformation/dns-modernization.md` (this chapter and Ch11 are its main home) and its short twin `docs/operational-guides/dns-modernization.md`, and the migration sections of the whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md`. None of these is linked from the chapter. Footnote keys below drop the `c10-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Six-phase canonical sequence; rollback point and consistency test per phase | Six phases | restated-as-design (series text kept) | — |
| 2 | Playbook-to-phase mapping, validation criteria and durations (1–2 days … 30 days, 1–2 weeks) | Playbook mapping table | restated-as-design (program planning estimates; guide §13 and Canon Phase Mapping re-pointed from the six-phase Directory Migration model to this book's six phases) | — |
| 3 | Lower TTL to 300 s at least 48 h before cutover; record original TTL | Cutover loop | restated-as-design (guide §14 prevention column) | — |
| 4 | Do not migrate SOA or apex NS records; target platform creates its own | Cutover loop | restated-as-design (guide App. A); Azure creates apex SOA it won't let you delete | Remove-AzPrivateDnsRecordSet reference (search result, not footnoted) |
| 5 | 30-day observation before the old copy retires | Zones and records | restated-as-design (guide §5.2 step 6) | — |
| 6 | Records cannot be recovered from a decommissioned DC; inventory first | Phase 1 | restated-as-design (whitepaper §10.2 Decision 4; Ch04 owns the mechanics) | — |
| 7 | Inventory items list (zones, records, health, SRV, forwarders, DNSSEC, DHCP, paths, OCSP/CRL) | Phase 1 table | restated-as-design (condensed from guide §4.1–4.7; forwarder test "over DNS, not just ICMP" from guide §4.5) | — |
| 8 | Get-DnsServerZone properties ZoneName, ZoneType, IsDsIntegrated, IsReverseLookupZone, IsSigned | Phase 1 code | verified (properties shown in Learn output; guide's `DirectoryPartitionName`, `DynamicUpdate` not used) | dnsserver-module; cf-cmdlet (example output) |
| 9 | Get-DnsServerResourceRecord -ZoneName -ComputerName; returns HostName, RecordType, TimeToLive, Timestamp, RecordData | Phase 1 code | verified | get-rr |
| 10 | Get-DnsServerForwarder exists | Phase 1 code | verified | dnsserver-module |
| 11 | Resolve-DnsName -Name -Type SRV -Server | Phase 1 code | verified | resolve |
| 12 | Export-DhcpServer -ComputerName -File -Leases exports config, v4/v6 scopes and leases | Phase 1 code and text | verified | dhcp-export |
| 13 | Export-DnsServerZone output "not in the same format as a file-backed zonefile"; written to DNS directory | Phase 1 text | verified (added; corrects guide §5.1 "export zone file" assumption for AD-integrated zones) | export-zone |
| 14 | Component migration matrix (guide §2.10 + §5.1) | Where each component goes | restated-as-design; reworked to "target under the policy plane" plus "Azure-native equivalent" columns | — |
| 15 | Guide §2.10/§5.1: AD SRV records "forwarded via DNS Private Resolver"/import SRV to Private Zone | Matrix and note | corrected: Azure Private DNS ignores client registration messages, so DCs cannot register locator records; static imports go stale; AD zones stay where DCs can register | pdns-faq |
| 16 | Guide §2.10 "Dynamic DNS → Azure DNS Auto-Registration" | Matrix | corrected: autoregistration covers VMs only (primary NIC), not other resources | autoreg |
| 17 | Guide App. A "dynamic PTRs managed by auto-registration" | Matrix note | corrected: autoregistration doesn't support PTR records | autoreg |
| 18 | Guide §2.10 DNSSEC row (Private Zones unsupported) | Matrix | verified against Ch06 (c06-azdnssec); detail left to Ch06 | Ch06 |
| 19 | NIOS manages Microsoft Windows DNS and DHCP servers from Grid Manager and synchronizes their data | Phase 2 | verified (opened page states central management and synchronization; read-only vs read/write modes from search results, stated as "start read-only" design) | nios-ms |
| 20 | Private Resolver subnets ≥ /28, delegated to Microsoft.Network/dnsResolvers; ≤1,000 rules per ruleset | Phase 2 | verified | pr-overview |
| 21 | One authoritative path per namespace avoids loops | Phase 2 | restated-as-design (guide §14) | — |
| 22 | UDP and TCP 53 open; NSGs on resolver subnets allow it | Phase 2 | verified | vnet-names |
| 23 | Add-DnsServerConditionalForwarderZone -Name -MasterServers -ReplicationScope "Forest" | Phase 2 code | verified (accepted values Forest, Domain, Legacy, Custom) | cf-cmdlet |
| 24 | az dns-resolver forwarding-rule create: --ruleset-name, --name, --domain-name, --forwarding-rule-state, --target-dns-servers shorthand `[{ip-address:…,port:53}]` | Phase 2 code | verified (guide used PowerShell only; CLI shorthand copied from Learn example) | az-fwdrule |
| 25 | `az dns-resolver` is a CLI extension that installs on first use | Phase 2 | verified (added) | az-fwdrule |
| 26 | Forwarding-rule domain names take a trailing dot | Phase 2 | verified | pr-quickstart |
| 27 | On-premises forwarder targeting 168.63.129.16 silently fails to public | Phase 2 | verified (added) | pr-troubleshoot |
| 28 | Windows forwarder timeout should exceed 4 s when forwarding to Azure | Phase 2 | verified (added) | vnet-names |
| 29 | Set-DnsServerResourceRecord with -OldInputObject/-NewInputObject; clone via `[ciminstance]::new()` and set TimeToLive | Phase 3 code | verified (Learn example pattern) | set-rr |
| 30 | Record-type differences (DNAME, ALIAS, TXT length) | Zones and records | not carried here; pointed to Appendix A | — |
| 31 | Three cutover patterns with configuration and rollback (guide §9.1–9.3) | Patterns table | restated-as-design; Ch07 carries the Azure configuration of the same patterns | — |
| 32 | Guide §9.1 rollback "Remove Private Zone VNet link" | Rollback callout | corrected: unlinking removes autoregistered VM records; disabling autoregistration deletes them immediately | pdns-faq |
| 33 | Deleted autoregistered records cannot be restored | Rollback callout | verified (added) | dns-faq |
| 34 | GlobalNames migrates as CNAMEs; single-label resolution needs the suffix search list via GPO/Intune | GlobalNames | restated-as-design (guide Phase 5) | — |
| 35 | Reverse zones reconcile with IPAM before migration | GlobalNames and reverse zones | restated-as-design (guide §5.1, Phase 7) | — |
| 36 | Import-DhcpServer requires -BackupPath (backs up target DB first); -File, -Leases, -ScopeId | DHCP scopes | verified | dhcp-import |
| 37 | DHCP failover hot standby reserve 5% default; load balance 50:50 default | DHCP scopes | verified (added) | dhcp-failover |
| 38 | Split-scope designs for unreliable WAN (whitepaper §7.3) | DHCP scopes | restated generically ("enterprise DDI platforms also offer"); whitepaper's NIOS-specific HA claims not carried | — |
| 39 | Option 6 must move with the scope; rogue DHCP governance in Ch05 | DHCP scopes | restated-as-design (whitepaper §7.3) | — |
| 40 | Three DHCP target states (guide §11.3) | DHCP scopes | restated-as-design (vendor names Infoblox/BlueCat removed from the option name) | — |
| 41 | VNet DNS servers used in list order, not round-robin; first reachable used even if unhealthy | Moving clients | verified (added; supports correction of guide §3.6 "168.63.129.16 as fallback", also corrected in Ch07) | vnet-manage |
| 42 | VMs keep old DNS settings until restart or DHCP lease renewal | Moving clients | verified (added) | vnet-manage; vnet-faq |
| 43 | Guide Phase 8 "add resolver IP as secondary DNS in DHCP options" | Moving clients | corrected to "change option 6 deliberately per wave"; a secondary resolver with a different view is the split-brain the book argues against | vnet-manage (ordering behavior) |
| 44 | redirect-dns retargeting; SASE resolver as forwarding target | Retargeting the edge | restated (Ch05/Ch08 own and verify) | — |
| 45 | Federation validation matrix | Phase 4 | restated-as-design (guide Phase 6 validation and §10.5, generalized to every origin) | — |
| 46 | While a DC remains, its zones must be on a DNS service accepting DC secure dynamic registration | Phase 5 | restated-as-design, grounded in claim 15 and Ch04 (GSS-TSIG coexistence) | pdns-faq |
| 47 | Gates: 15-minute SRV checks, 100% for 30 consecutive days; 90-day parallel operation; 7-day burn-in | Phase 5 | restated-as-design (guide Phases 9–10) | — |
| 48 | Decommission order; archive exports before removal | Phase 5 | restated-as-design (guide Phase 10; "archive to Gitea" generalized to the program repository) | — |
| 49 | Remove-DhcpServerInDC de-authorizes the DHCP server in AD | Phase 5 | verified (added) | dhcp-indc |
| 50 | Guide Phase 10 "remove DNS Server role from domain controllers" | Phase 5 | corrected in effect: role removal comes last and only after the locator-record question is settled (claim 46) | — |
| 51 | DNSSEC rollover rules during migration (guide §8.5) | Phase 6 | restated-as-design (program rule); DNSSEC mechanics left to Ch06 | — |
| 52 | Azure DNS signs public zones only; Private DNS not signable | Matrix | verified in Ch06 (c06-azdnssec); cross-referenced, not re-footnoted | Ch06 |
| 53 | Success criteria and key risks (short twin) | What success looks like | restated-as-design | — |
| 54 | Five steps before the next change (whitepaper Call to Action) | What success looks like | restated; INR sovereign-cloud limit pointed to Appendix C (verified there) rather than restated | — |
| 55 | Series: "Retarget SD-WAN redirect-dns … (Chapter 08, Decision 1)" | Six phases | verified cross-reference | — |
| 56 | Series: "consistency test (Chapter 12)" | Six phases | verified cross-reference (Ch12 defines resolution-path consistency) | — |

## 2. Carry-forward ledger

### Series chapter (old Chapter 09, now 10)

| Source § | Went to | Or why not carried |
|---|---|---|
| Front matter, title, subtitle | Front matter (house style: `Chapter 10 — …` title, description, `lifecycle_review: 2027-04-01`, doc-type `workbook-chapter`) | Subtitle replaced by description |
| "Download this chapter" callout | — | Removed per brief (Word download callouts) |
| Phased Migration and Cutover Sequence (diagram + six phases) | The six phases (kept verbatim, Phase 3 extended with client waves) | — |
| Rollback-point sentence | The six phases | Kept |
| "What this chapter establishes" | Kept, points 2–3 extended | — |
| Previous/Next footer | "Continue the book" callout (Previous now Ch09) | — |
| Diagram `ch10-migration-phases` | Kept | Source comment "Chapter 09" corrected to "Chapter 10" |

### DNS Modernization Guide (complete, section by section)

| Guide § | Went to | Or why not carried |
|---|---|---|
| Front matter, classification banner, document-control table | — | Classification/boundary stamps not carried (removed repo-wide); document ID and owner are internal |
| Canon Phase Mapping (11 phases → six-phase Directory Migration model) | Ch10 "How the operational playbook maps to the six phases" | Remapped to this book's six phases; the Directory Migration page link not carried |
| Table of Contents | — | Navigation only |
| 1.1 Purpose | Ch10 opening prose | — |
| 1.2 Scope | Ch10 "Where each component goes" | Scope list folded into the matrix |
| 1.3 Companion document cross-references | — | Internal companion documents; workbook cross-links used instead (Ch04, Ch06, Book 02, Book 07) |
| 1.4 Classification and handling | — | Stamp, not carried |
| 2 intro; 2.1 AD-integrated zones; 2.2 standard zones; 2.3 stub zones; 2.4 conditional forwarders; 2.5 GlobalNames; 2.6 SRV records; 2.7 dynamic updates; 2.8 reverse zones; 2.9 DNSSEC | Ch04 (AD DNS mechanics) | Owned by Ch04's editor; Ch10 links Ch04 and uses the components only in the matrix |
| 2.10 Component migration matrix | Ch10 "Where each component goes" | Corrected (claims 15–17) |
| 3.1 Azure DNS public zones | Ch07 | Ch07 ledger |
| 3.2 Azure DNS private zones | Ch07; Ch10 matrix note (autoregistration limits) | — |
| 3.3 Azure DNS Private Resolver | Ch07; Ch10 Phase 2 (subnet and ruleset limits) | — |
| 3.4 Architecture overview (diagram placeholder 1) | Ch07 (diagram `ch07-hub-spoke-resolver`) | — |
| 3.5 Split-brain DNS | Ch02; Ch10 cutover patterns (split horizon row) | — |
| 3.6 VNet DNS settings | Ch07 (corrected there); Ch10 "Moving clients in waves" | 168.63.129.16 "fallback" advice corrected (claims 41, 43) |
| 3.7 Hub-spoke topology | Ch07 | — |
| 4 intro (pipeline, JSON to Gitea) | Ch10 Phase 1 | "Gitea assessments branch" generalized to the program's assessment repository |
| 4.1 Get-FMPDNSZoneInventory | Ch10 Phase 1 (inventory table row + `Get-DnsServerZone` example) | Full function not carried: brief limits code to short illustrative commands |
| 4.2 Get-FMPDNSRecordExport | Ch10 Phase 1 (table + `Get-DnsServerResourceRecord` example) | Full function not carried (as above) |
| 4.3 Get-FMPDNSHealthCheck | Ch10 Phase 1 (zone health row); Ch11 record hygiene | Full function not carried; its 14-day stale and 50/20 warning thresholds not carried (program heuristics, not needed to act) |
| 4.4 Get-FMPDNSSRVValidation | Ch10 Phase 1 (SRV row + `Resolve-DnsName` example) | Full function not carried |
| 4.5 Get-FMPDNSForwarderAudit | Ch10 Phase 1 (forwarder row; DNS-not-ICMP test) | Full function not carried |
| 4.6 Get-FMPDNSSECStatus | Ch10 Phase 1 (DNSSEC row) | Full function not carried; DNSSEC content owned by Ch06 |
| 4.7 Output format table | Ch10 Phase 1 ("commits the output, as JSON, to the program's assessment repository") | File-name table not carried (module-specific) |
| 5.1 Zone type decision matrix | Ch10 "Where each component goes" (merged with 2.10) | Registrar NS propagation "24–48 hours" not carried (unverified, registrar-dependent) |
| 5.2 Record migration methodology (six steps) | Ch10 cutover loop and "Zones and records" | — |
| 5.3 Export-FMPDNSToAzure (+ WhatIf warning) | Ch10 cutover loop step 2 ("dry run first") and "Zones and records" | Full function not carried (code length rule); the WhatIf-first warning kept as "dry run first" |
| 6.1 Step-by-step resolver deployment (10 steps, PowerShell/CLI) | Ch07 (deployment, corrected there); Ch10 Phase 2 (one conditional forwarder and one CLI forwarding rule) | — |
| 6.2 High availability | Ch07 | Corrected there (Traffic Manager advice) |
| 6.3 Cost estimation guidance | Ch12 | Owned and corrected by Ch12 |
| 7.1 Critical AD SRV records (failure-impact table) | Ch04 (SRV mechanics); Ch11 SRV monitoring (dependency list) | Impact table owned by Ch04 |
| 7.2 SRV record monitoring (Test-FMPSRVRecords, 15-minute task, Gitea alert) | Ch11 "SRV record monitoring"; Ch10 Phase 5 gate | Full function and Gitea issue code not carried; short loop instead |
| 8.1–8.5 DNSSEC modernization | Ch06 (mechanics); Ch09 (trade-off acceptance owner); Ch10 Phase 6 (rollover rule during migration, as program design) | — |
| 9.1 Same namespace, different answers | Ch10 cutover patterns (split horizon); Ch02; Ch07 | Validation with `nslookup … 8.8.8.8` not carried (use governed vantage points) |
| 9.2 Subdomain delegation | Ch10 cutover patterns; Ch07 | — |
| 9.3 Full migration with conditional forwarding | Ch10 cutover patterns (progressive migration) | — |
| 9 diagram placeholders 2–4 | Ch10 diagram `ch10-cutover-loop` (new) covers the per-zone loop; Ch07 covers resolution paths | Placeholders not reproduced |
| 10.1–10.5 Private endpoint DNS | Ch07 | Ch10 Phase 4 links it and adds the validation matrix |
| 11.1 DHCP and DNS current state | Ch09 (DnsUpdateProxy ownership); Ch10 DHCP scopes ("re-establish dynamic DNS registration") | — |
| 11.2 Hybrid state | Ch10 DHCP scopes and matrix (autoregistration for VMs) | "Azure VNet DHCP (168.63.129.16)" detail not carried |
| 11.3 Target state options | Ch10 DHCP scopes (three target states) | Vendor names removed |
| 11.4 Scavenging equivalent in Azure DNS | Ch11 "Record hygiene" | Autoregistration lifecycle verified (records removed when the VM is deleted, or stopped and deallocated); "set appropriate TTLs" as a cleanup mechanism not carried (TTL does not remove records) |
| 11.5 IPAM integration | Ch07 | Corrected there |
| 12.1 Azure DNS metrics | Ch11 "Platform metrics and alert thresholds" | Corrected in Ch11 (public-cloud-only note) |
| 12.2 DNS Private Resolver metrics | Ch11 | Corrected in Ch11 (metrics named in the guide do not exist) |
| 12.3 Log Analytics / DNS Analytics | Ch11 "Sources of query, lease and change logs" | Corrected in Ch11 (DNS Analytics replaced by resolver policy logs and the Sentinel AMA connector) |
| 12.4 Drift detection (Invoke-FMPDNSDriftDetection) | Ch11 "Drift detection" | Full function not carried; method and two verified commands instead |
| 13 Migration execution playbook intro | Ch10 playbook mapping | "Ten sequential phases" (actually eleven, 0–10) counted correctly |
| 13 Phase 0 Assessment | Ch10 mapping row 0; Phase 1 | — |
| 13 Phase 1 Deploy Private Resolver | Ch10 mapping row 1; Phase 2; Ch07 | — |
| 13 Phase 2 Private zones and non-AD zones | Ch10 mapping row 2; Phase 3 zones | — |
| 13 Phase 3 Forwarding rulesets | Ch10 mapping row 3; Phase 2 | — |
| 13 Phase 4 Conditional forwarders | Ch10 mapping row 4; matrix | — |
| 13 Phase 5 GlobalNames | Ch10 mapping row 5; GlobalNames and reverse zones | — |
| 13 Phase 6 Private endpoint zones | Ch10 mapping row 6; Phase 4; Ch07 | — |
| 13 Phase 7 Reverse lookup zones | Ch10 mapping row 7; GlobalNames and reverse zones | — |
| 13 Phase 8 Client DNS migration | Ch10 mapping row 8; "Moving clients in waves" | Secondary-DNS advice corrected (claim 43) |
| 13 Phase 9 SRV validation and monitoring | Ch10 mapping row 9; Phase 5 gate 2; Ch11 SRV monitoring | — |
| 13 Phase 10 Decommission | Ch10 mapping row 10; Phase 5 | — |
| 13 Decommission warning callout | Ch10 Phase 5 warning callout | — |
| 14 Troubleshooting reference (15 rows) | Ch11 "Troubleshooting reference" | Condensed to 12 rows; corrections there |
| Appendix A Record type migration reference | Appendix A (record-type behavior); Ch10 cutover loop (SOA, NS, SRV handling) | — |
| Appendix B Private Resolver cost calculator | Ch12 | Owned and corrected by Ch12; no prices carried here |
| Appendix C PowerShell module FMPDNSAssessment (manifest, orchestrator, function index) | Ch10 Phase 1 (what the assessment collects) | Module and orchestrator code not carried (code rule; module is not a published artifact); the manifest's placeholder GUID and internal Gitea URL dropped |
| Appendix D Companion document cross-reference | Ch09 (change control per phase); Ch11 (monitoring consumers) | Internal companion documents not carried |
| End-of-document banner | — | Stamp, not carried |

### DNS Modernization Guide, short twin (`docs/operational-guides/dns-modernization.md`)

| Source § | Went to | Or why not carried |
|---|---|---|
| Purpose | Ch10 opening | — |
| Phases (0–9) | Ch10 playbook mapping (the long guide's 0–10 list supersedes it) | Duplicate |
| Key risks (split-brain, private endpoint fallback, SRV orphaning, OCSP/CRL) | Ch10 "What success looks like" | — |
| Success criteria (four) | Ch10 "What success looks like" | — |

### Whitepaper (migration and operations sections)

| Source § | Went to | Or why not carried |
|---|---|---|
| 4.4 What must be reprovisioned before AD leaves | Ch04 (owner); Ch10 Phase 1 and Phase 5 | — |
| 7.3 DHCP: failover, split scope, option 6, DDNS | Ch10 DHCP scopes | NIOS-specific HA and latency figures not carried; option table owned by Ch05 |
| 10.2 Decision 4 (AD DNS inventory, "irreversible to skip") | Ch10 Phase 1; Ch08 owns the decisions | — |
| Call to Action — five steps | Ch10 "What success looks like" (final paragraph) | Endpoint-specific step 1 wording ("local BloxOne Endpoint") replaced by Ch08's corrected network-addressable resolver decision |
| Appendix B Q6 (Microsoft migration guidance for AD DNS → DDI) | — | Open vendor question; not a claim |
| Other whitepaper parts | Ch01–Ch09, Ch12, Appendix A | Owned by those chapters; see Ch11 ledger for §7.4, §7.5, §7.7 |

### Diagrams

| Diagram | Status |
|---|---|
| `ch10-migration-phases.flow.yaml` | Kept; comment line corrected from "Chapter 09" to "Chapter 10" |
| `ch10-cutover-loop.flow.yaml` | New: the per-zone cutover loop and rollback point |

## Cross-chapter consistency pass (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| CP-1 | Signed zones move in Phase 3 by the signed-zone sequence and must validate before the Phase 5 gate; Phase 5 gate 1 counts a signed zone as moved only once its new chain validates and old signing has stopped; Phase 6 covers newly signed zones and validation | Inventory table; component table; Phase 3; Phase 5 gate 1; Phase 6 | resolved internal contradiction (program design) | Chapter 06 "Moving signed zones" (revised to match) |
| CP-2 | Observe at least 30 days after a zone switch; the old copy stays as rollback point until decommissioning in Phase 5 (was "before the old copy is retired") | Phase 3, Zones and records | aligned with the cutover loop step 6 (program design) | Cutover loop step 6, this chapter |
