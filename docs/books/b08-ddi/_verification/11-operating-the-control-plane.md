# Verification — Chapter 11, Operating the Control Plane: Delegation, Automation and Evidence

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch: Azure DNS, Private DNS and resolver policy, Azure Monitor reference for DNS, Windows DNS logging, Microsoft Sentinel DNS connector, Windows DHCP failover and audit, AD security groups, DnsClient and DnsServer cmdlets, Azure CLI `private-dns`), the OMB M-21-31 PDF (text extracted from the whitehouse.gov file), NIST CSRC, Infoblox documentation, the Terraform provider repository, the Red Hat Ecosystem Catalog, ServiceNow documentation (search results), and the Posh-ACME and lego documentation. Sources: the series chapter (old Ch10), the monitoring, logging, automation, troubleshooting and delegation sections of the DNS Modernization Guide (its full section-by-section ledger is in `10-migration-sequence.md`, because Ch10 and Ch11 share it), and the operations sections of the whitepaper. Footnote keys drop the `c11-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Delegation model: corporate visibility, divisional scopes, roles, inheritance, one audit trail | Delegated administration | restated-as-design (series text kept) | — |
| 2 | "Infoblox Universal DDI implements this model as Access Views combined with role-based access control" | Illustrative callout | corrected and narrowed: access policies join role, user group and access view; IP spaces, address blocks, DNS views and zones assignable; subnets, ranges, fixed addresses and DHCP objects inherit | ib-views (search result; JS-rendered page), ib-policies (opened) |
| 3 | (implicit) predefined DNS/DHCP/IPAM roles scope to views | Illustrative callout | corrected: Infoblox states access views currently support only DDI IPAM manager, operator, auditor and user roles; readers told to confirm DNS/DHCP role scoping | ib-policies |
| 4 | DnsAdmins: read, write, create and delete child objects on DNS data | Delegation table | verified (added) | ad-groups |
| 5 | DnsAdmins listed among AD privileged groups | Delegation table | verified (added; Appendix B privileged groups reference) | ad-groups |
| 6 | DHCP Administrators manage scopes, back up and restore; DHCP Users read-only | Delegation table | verified (added) | ad-groups |
| 7 | DNS Zone Contributor covers public zones only, not private | Delegation table | verified (added) | az-protect |
| 8 | Private DNS Zone Contributor at RG, zone or record-set scope; custom role limited to CNAMEs | Delegation table | verified (added) | az-protect-private |
| 9 | Custom role without delete doesn't protect a record set (it can be emptied) | Delegation text | verified (added) | az-protect-private |
| 10 | Resource locks CanNotDelete/ReadOnly on critical zones | Delegation text | verified (added) | secure-dns |
| 11 | API coverage, non-interactive service accounts, legacy-API migration path | API and automation | restated-as-design (series); "some platforms proxy legacy API calls" restated as a question to ask (unverified) | — |
| 12 | Universal DDI Terraform provider manages DNS zones/views/records, DHCP, IPAM, more | API and automation | verified (added) | tf |
| 13 | Red Hat–certified Ansible collection `infoblox.universal_ddi` | API and automation | verified (added; catalog shows certified collection by Infoblox) | ansible |
| 14 | ITSM functions (CMDB sync, workflow actions, incidents) | ITSM | restated-as-design (series) | — |
| 15 | ServiceNow Infoblox spoke: register or reserve IP from catalog request | ITSM | verified (added; ServiceNow docs, search result) | snow-spoke |
| 16 | Service Graph Connector for Infoblox imports subnets, IP pools, allocated IPs, DNS to CMDB; documented against NIOS WAPI | ITSM | verified (added; search result); Universal DDI support not confirmed, stated as such | snow-sgc |
| 17 | ACME clients create/remove DNS-01 TXT records through the DDI API | Certificate automation | verified for Posh-ACME and lego (both target the Infoblox WAPI) | poshacme, lego |
| 18 | Series named "cert-manager webhooks" as an Infoblox-capable client | Certificate automation | removed: no Infoblox cert-manager webhook could be verified | — |
| 19 | Plug-in accounts need only TXT-record rights in the zones/view | Certificate automation | verified (both plug-in pages) | poshacme, lego |
| 20 | DNSSEC, CAA, private endpoint consistency as prerequisites; separate certificate lifecycle platform | Certificate automation | restated (Ch06/Ch07/Book 07 own) | — |
| 21 | SailPoint reaches DDI through APIs/ITSM, custom development | Identity governance | restated-as-design (series; no packaged connector found or claimed) | — |
| 22 | M-21-31 EL1 includes passive DNS; DNS logging must include encrypted DNS; analytics to identify querying host | M-21-31 section | verified (text of memo: EL1 Table 2 and Passive DNS requirement) | m2131 |
| 23 | DNS query/response/errors, all record types, zone transfers; DHCP lease info (MAC, IP); 12 months active, 18 months cold | M-21-31 section; evidence | verified (Appendix C tables) | m2131 |
| 24 | Series footnote: M-21-31 "DNS logs at event-logging tier EL-1" | Evidence | verified and expanded; key renamed from c10-m2131 to c11-m2131, access date added | m2131 |
| 25 | Windows DNS audit events on by default; analytic events off by default | Log sources | verified (added) | dns-logging |
| 26 | Analytic logging ~5% degradation at 100,000 QPS; no apparent impact ≤50,000 QPS | Log sources | verified (added) | dns-logging |
| 27 | Sentinel "Windows DNS Events via AMA" collects analytic events; Azure Arc needed outside Azure | Log sources | verified (added) | sentinel-dns |
| 28 | Guide §12.3 "Use the DNS Analytics solution" | Log sources | corrected: replaced by Azure DNS resolver policy query logs and the Sentinel AMA connector; DNS Analytics not carried | resolver-policy, dns-traffic, sentinel-dns |
| 29 | DNS resolver policy logs VNet queries to Log Analytics, storage or Event Hubs; allow/block/alert | Log sources | verified (added) | resolver-policy |
| 30 | `DNSQueryLogs` fields: QueryName, QueryType, SourceIpAddress, ResolutionPath, ResolverPolicyRuleAction | Log sources | verified (added) | dns-traffic |
| 31 | DHCP failover events in Admin/Operational channels and audit log; Get-DhcpServerAuditLog shows audit-log settings | Log sources | verified (added) | dhcp-failover-events, dhcp-audit |
| 32 | Azure activity log records control-plane changes | Log sources | verified | monitor-ref |
| 33 | Lease history enables host attribution | Log sources | restated-as-design (whitepaper §7.3, §7.6 SOC correlation) | — |
| 34 | Guide §12.1 metrics Query Volume, Record Set Count, Record Set Capacity Utilization | Metrics table | verified | monitor-ref |
| 35 | Public-zone metrics and alerting supported only in Azure public cloud; sovereign later | Metrics text | verified (added; relevant to Azure Government) | monitor-ref |
| 36 | Private DNS zone metrics include record set count, VNet link count and capacity | Metrics table | verified (added) | monitor-ref |
| 37 | Guide §12.2 Private Resolver metrics "Inbound Queries Processed", "Outbound Queries Forwarded", "Forwarding Failures" | Metrics table | corrected: Private Resolver exposes Queries Per Second per endpoint and endpoint counts; no forwarding-failure metric; failures detected from query logs and synthetic tests | monitor-ref |
| 38 | Alert thresholds (>50% drop, 80% capacity, zero inbound, >200% spike) | Metrics table | restated-as-design (guide §12 thresholds, re-attached to real metrics) | — |
| 39 | SRV checks every 15 minutes from every site and VNet; incident on failure | SRV monitoring | restated-as-design (guide §7.2; Gitea issue API replaced by "open an incident") | — |
| 40 | `_gc._tcp` is under the forest root name | SRV code | restated (guide §2.6 and §4.4 use the forest name; code corrected from domain to forest variable) | — |
| 41 | Resolve-DnsName -Type, -DnsOnly, -Server, -DnssecOk | SRV code; troubleshooting | verified | resolve |
| 42 | Site-specific locator records; missing ones send clients to remote DCs | SRV monitoring | restated (guide §7.1; Ch04 owns SRV mechanics) | — |
| 43 | Drift detection method (normalize, exclude SOA/NS, report one-sided records) | Drift detection | restated-as-design (guide §12.4) | — |
| 44 | `az network private-dns record-set list -g -z` lists all record sets | Drift detection | verified (added) | az-recordset |
| 45 | Get-DnsServerResourceRecord as source side | Drift detection | verified | get-rr |
| 46 | Dangling CNAMEs to deprovisioned resources enable subdomain takeover | Record hygiene | verified (added) | dangling |
| 47 | Windows aging/scavenging per zone and server | Record hygiene | verified (cmdlets Set-DnsServerZoneAging / Set-DnsServerScavenging exist; not footnoted separately) | Ch10 c10-dnsserver-module |
| 48 | Long Azure DHCP leases can cause scavenging to remove DDNS records prematurely | Record hygiene | verified (added) | vnet-names |
| 49 | Autoregistered records removed when VM deleted or stopped and deallocated | Record hygiene | verified | pdns-faq |
| 50 | Troubleshooting table (guide §14) | Troubleshooting | restated-as-design, condensed to 12 rows; rows below corrected or added | — |
| 51 | Private endpoint returns public address: forwarder targets 168.63.129.16 | Troubleshooting | verified (added cause) | pr-troubleshoot |
| 52 | Windows forwarder timeout >4 s | Troubleshooting | verified (added cause) | vnet-names |
| 53 | Guide "Private Endpoint DNS record not created automatically → recreate endpoint with DNS integration" | Troubleshooting | not carried as a row; Ch07 corrected the mechanism (private DNS zone group) | — |
| 54 | Intermittent failures: VNet list order; restart or renew | Troubleshooting | verified | vnet-manage |
| 55 | Records missing after rollback; autoregistered records not restorable | Troubleshooting | verified (added row) | pdns-faq |
| 56 | Guide "DNS Private Resolver ... subnet exhaustion" | Troubleshooting | corrected: endpoints need a dedicated subnet; "exhaustion" dropped | — (Ch10 c10-pr-overview) |
| 57 | Evidence list (series) | Compliance evidence | restated; DHCP lease history, drift and SRV history added; M-21-31 retention attached | m2131 |
| 58 | CM-8, AU-2, AU-6 (series); AU-12 added | Compliance evidence | verified against SP 800-53 Rev. 5 control catalog | sp80053 |
| 59 | Evidence checklist mapped to the five decisions | Checklist | restated-as-design (index says decisions are "checked in Chapter 11"; Decision 3 item added) | — |
| 60 | M-22-09, CISA guidance, SP 800-81r3 alignment | Checklist | restated (Ch03 verifies) | — |
| 61 | 2026-10-21 correction: M-21-31 presented as the logging floor (description, In this chapter, Monitoring section and its subsection, figure alt text, lease-history attribution, evidence list, checklist, "What this chapter establishes") | M-26-14 section; evidence; checklist; figure | corrected: M-21-31 was rescinded by M-26-14 (May 22, 2026); M-26-14 names neither DNS nor DHCP and sets no 12-month active / 18-month cold split, so those claims were removed; replaced with M-26-14 Appendix B (6 months actively searchable, 1 year retrievable; traceable timestamps; logs available to the top-level SOC; required log-supported activities incl. source/destination address, protocol, port, session) and the Agency Logging Plan; query/lease-log role labeled as the book's design reading; footnote c11-m2131 replaced by c11-m2614; SIEM card in `ch11-evidence-flow.flow.yaml` now "M-26-14 retention" (needs re-rendering); deck `presentations/b08-ddi/build.js` slides for Ch03 and Ch11, speaker notes and backup sources updated (deck and narration audio need rebuilding) | OMB M-26-14 PDF (whitehouse.gov, text extracted with pdftotext): rescission paragraph, "Prioritization," "Agency Logging Plan," "Agency Actions," Appendix B items 1–5, Appendix C; CISA Logging Reference Architecture page (cisa.gov/logging, publish date August 20, 2026) |

## 2. Carry-forward ledger

### Series chapter (old Chapter 10, now 11)

| Source § | Went to | Or why not carried |
|---|---|---|
| Front matter, title, subtitle | Front matter (house style) | Subtitle replaced by description |
| "Download this chapter" callout | — | Removed per brief |
| Opening paragraph | Kept; Ch09 ownership link added | — |
| Delegated Administration Across Divisions (+ diagram, callout) | "Delegated administration across divisions" | Callout corrected (claims 2–3); Windows/Azure table added |
| API and Automation | Kept; Terraform/Ansible verified | Legacy-API proxy restated (claim 11) |
| ITSM Integration | Kept; ServiceNow integrations verified | — |
| Certificate Automation (ACME DNS-01) | Kept | cert-manager removed (claim 18) |
| Identity Governance Integration | Kept | — |
| Monitoring, Telemetry and Compliance Evidence | Split: "Monitoring and telemetry" (new subsections) and "Compliance evidence" (series list, extended) | — |
| Sample Evidence Checklist | "Sample evidence checklist", restructured around the five decisions | All series items kept |
| What this chapter establishes | Kept, points 1 and 3 extended | — |
| Footnote `c10-m2131` | `c11-m2131` | Key renamed to chapter number |
| Previous/Next footer | "Continue the book" callout | — |
| Diagram `ch11-delegated-administration` | Kept | Source comment "Chapter 10" corrected to "Chapter 11" |

### DNS Modernization Guide sections carried into this chapter

The complete guide ledger, every section, is in `_verification/10-migration-sequence.md`. The sections whose main home is this chapter:

| Guide § | Went to | Or why not carried |
|---|---|---|
| 4.3 Health check (stale, duplicates, orphaned PTR, scavenging) | Record hygiene | Function code not carried |
| 7.2 SRV record monitoring and scheduled task | SRV record monitoring | Gitea alerting replaced by incident; short loop instead of function |
| 11.4 Scavenging equivalent in Azure DNS | Record hygiene | See Ch10 ledger note |
| 12.1 Azure DNS metrics | Platform metrics and alert thresholds | Verified; sovereign-cloud note added |
| 12.2 DNS Private Resolver metrics | Platform metrics and alert thresholds | Corrected (claim 37) |
| 12.3 Log Analytics integration | Sources of query, lease and change logs | Corrected (claim 28) |
| 12.4 Drift detection | Drift detection | Function not carried; method and verified commands |
| 14 Troubleshooting reference | Troubleshooting reference | Condensed and corrected (claims 50–56) |
| Appendix C function index (monitoring functions) | SRV monitoring; drift detection | Module not carried |
| Appendix D rows: Monitoring and Observability, Security Baseline, Governance and Compliance | Monitoring and telemetry; compliance evidence; delegation | Internal companion documents not named |

### Whitepaper (operations sections)

| Source § | Went to | Or why not carried |
|---|---|---|
| 7.3 DHCP lease analytics and security audit trail | Log sources (DHCP rows); lease-history paragraph | NIOS-specific claims generalized |
| 7.4 Cloud Services Portal RBAC scoped by service, region or object type | Delegated administration (illustrative callout) | Superseded by the verified access-view and access-policy description |
| 7.5 Platform services: REST/WAPI and CSP APIs, Terraform and Ansible, Ecosystem Exchange, audit trail and change approval | API and automation; ITSM; compliance evidence | Partner-by-partner ecosystem table owned by Appendix A |
| 7.6 SOC Insights DNS–DHCP correlation | Lease-history paragraph (as design) | Threat Defense product detail owned by Ch05/Appendix A |
| 7.7 Network discovery and IPAM governance (CM-8) | Compliance evidence (IPAM discovery for CM-8) | Discovery mechanics owned by Ch07 |
| Call to Action — five steps | Ch10 (main home); this chapter's checklist checks the decisions | — |
| Appendix B open vendor questions | — | Questions, not claims; Ch12 owns vendor engagement |

### Diagrams

| Diagram | Status |
|---|---|
| `ch11-delegated-administration.flow.yaml` | Kept; comment corrected to Chapter 11 |
| `ch11-evidence-flow.flow.yaml` | New: three evidence streams and their consumers |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (acme) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-acme |
| 3 | ACME clients named (Posh-ACME, lego) aren't CyberArk-tested; non-FIPS ACME servers | Certificate automation; new section | added: CyberArk tested certbot, win-acme, acme.sh; ACME servers not in FIPS mode | CyberArk 26.1 ACME; Deploying on Windows Server |
