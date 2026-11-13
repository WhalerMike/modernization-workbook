# Verification — Guide: Azure Security Engineering

New guide, first pass of 2026-11-11, written for the Zero Trust Assessment closure update (instruction IDs AZS-01 to AZS-10 and the Azure part of closure-map row CM-11). The workbook's editor chose, on Nov 11, 2026, to carry the instructions' proposed "Book 22, Azure Security Engineering" as this implementation guide instead of a book. Every Microsoft fact was read on Microsoft Learn on 2026-11-11 through the Microsoft Learn documentation service (search, fetch and code-sample search). AWS facts from docs.aws.amazon.com, Google Cloud facts from docs.cloud.google.com, Oracle facts from docs.oracle.com, KSI statements and related controls from fedramp.gov's 2026 KSI theme pages, all read the same day. No personal name, email address or agency detail was sent in any request. Nothing was run against a subscription; the commands are Learn's with Learn's resource names replaced by placeholders, except where the guide says a command is adapted.

Facts carried from the books (Book 10 Chapters 04, 05, 07, 08; Book 12 Chapter 08; Book 11 Chapter 10; the service account and privileged access guides) are cited by link and rely on those pages' own verification logs.

## Claims log: Microsoft Learn (footnoted)

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Azure Government endpoints (Resource Manager, Key Vault, Managed HSM); a listed service has all features unless a variation is listed | Prerequisites, availability table | verified | Compare Azure Government and global Azure, <https://learn.microsoft.com/azure/azure-government/compare-azure-government-global-azure> | Nov 11, 2026 |
| 2 | Front Door Standard and Premium generally available in Azure Government regions US Gov Arizona and US Gov Texas | Availability table, Step 5 | verified (quoted in substance) | Same page, section Networking | Nov 11, 2026 |
| 3 | Front Door Standard, Premium and classic available in Azure Government (US); built-in L3/L4 DDoS | Availability table, Step 5 | verified; no regions named, recorded as a gap | What is Azure Front Door?, <https://learn.microsoft.com/azure/frontdoor/front-door-overview> | Nov 11, 2026 |
| 4 | Front Door classic retires March 31, 2027; no new profiles, domains or managed certificates; HTTPS required on custom domains in Standard and Premium | Availability table, Step 5, Dangers | verified | Migrate Azure Front Door (classic), <https://learn.microsoft.com/azure/frontdoor/migrate-tier> | Nov 11, 2026 |
| 5 | Front Door Private Link: Premium only; supported origin types; approval; region list includes US Gov Arizona, Texas and Virginia; "only available in regions with Availability Zone support"; no mixed origin groups; probes on the private path | Availability table, Step 5 | verified; conflict with #6 recorded | Secure your origin with Private Link in Azure Front Door Premium, <https://learn.microsoft.com/azure/frontdoor/private-link> | Nov 11, 2026 |
| 6 | Azure Government regions: availability zones shown only for US Gov Virginia | Availability table | verified | What is Azure Government?, <https://learn.microsoft.com/azure/azure-government/documentation-government-welcome> | Nov 11, 2026 |
| 7 | Front Door CLI: profile, origin group with probes, WAF policy `--sku Premium_AzureFrontDoor --mode`, managed rules DRS 2.1 and bot manager 1.0, `az afd security-policy create`; managed rules need Premium | Step 4, Step 5 | verified; guide starts in Detection instead of Learn's Prevention | Quickstart: Create an Azure Front Door using Azure CLI, <https://learn.microsoft.com/azure/frontdoor/create-front-door-cli> | Nov 11, 2026 |
| 8 | Origin lock-down: `AzureFrontDoor.Backend` service tag and `X-Azure-FDID` together; tag addresses shared across customers; Application Gateway NSG and custom rule | Step 5, Dangers | verified | Secure traffic to Azure Front Door origins, <https://learn.microsoft.com/azure/frontdoor/origin-security> | Nov 11, 2026 |
| 9 | `az webapp config access-restriction add --service-tag AzureFrontDoor.Backend --http-header x-azure-fdid=` | Step 5 | verified (parameter table) | Tutorial: highly available multi-region app in App Service, <https://learn.microsoft.com/azure/app-service/tutorial-multi-region-app> | Nov 11, 2026 |
| 10 | TLS 1.2 or 1.3 only; predefined `AppGwSslPolicy20220101` | Step 5 | verified | Internet ingress, <https://learn.microsoft.com/azure/networking/design-guide/internet-ingress> | Nov 11, 2026 |
| 11 | `Set-AzApplicationGatewaySslPolicy -PolicyType Predefined -PolicyName "AppGwSslPolicy20220101S"` then `Set-AzApplicationGateway` | Step 5 | verified | Configure TLS policy on Application Gateway using PowerShell, <https://learn.microsoft.com/azure/application-gateway/application-gateway-configure-ssl-policy-powershell> | Nov 11, 2026 |
| 12 | Front Door security recommendations: migrate classic, Private Link origins, restrict direct origin access, current DRS (2.2 based on CRS 3.3.4) | Step 5 | verified | Secure your Azure Front Door deployment, <https://learn.microsoft.com/azure/frontdoor/secure-front-door> | Nov 11, 2026 |
| 13 | Front Door log categories `FrontDoorAccessLog`, `FrontDoorHealthProbeLog`, `FrontDoorWebApplicationFirewallLog`; not enabled by default | Step 4 | verified | Configure Azure Front Door logs; Front Door monitoring data reference | Nov 11, 2026 |
| 14 | Application Gateway: WAF policies, DRS 2.2 latest, validate in log mode, detection before prevention, narrow exceptions; built-in policy names | Step 4 | verified | Secure your Azure Application Gateway, <https://learn.microsoft.com/azure/application-gateway/secure-application-gateway> | Nov 11, 2026 |
| 15 | Application Gateway access and firewall logs; resource-specific tables | Step 4 | verified | Diagnostic logs for Application Gateway | Nov 11, 2026 |
| 16 | `az network application-gateway waf-policy create` defaults `Microsoft_DefaultRuleSet` 2.1; accepted types; bot manager versions 0.1, 1.0, 1.1 | Step 4 | verified | CLI reference az network application-gateway waf-policy | Nov 11, 2026 |
| 17 | `policy-setting update --mode Detection|Prevention --state Enabled --request-body-check true` | Step 4, Rollback | verified | Troubleshoot WAF blocking legitimate requests | Nov 11, 2026 |
| 18 | Rate-limit custom rule commands (Application Gateway and Front Door) | Step 4 | verified; Application Gateway example adapted (grouping by ClientAddr with the /login match, combining two Learn examples) | Configure rate limit custom rules (AG); WAF rate limit (Front Door) | Nov 11, 2026 |
| 19 | WAF in sovereign clouds: supported, but geo-filtering custom rules and bot protection rule sets not supported; detection mode doesn't block | Availability table, Step 4, Dangers | verified (Application Gateway FAQ); Front Door's sovereign limits not stated, recorded as a gap | FAQ for WAF on Application Gateway, <https://learn.microsoft.com/azure/web-application-firewall/ag/application-gateway-waf-faq> | Nov 11, 2026 |
| 20 | Built-in WAF policies (WAF enabled; specified mode) for Front Door and Application Gateway, Audit/Deny/Disabled | Step 4, Step 9 | verified | Azure WAF and Azure Policy | Nov 11, 2026 |
| 21 | WAF log queries for layer-7 analysis | Step 10 | verified | Application (layer 7) DDoS protection | Nov 11, 2026 |
| 22 | Zero Trust network security recommendations (DDoS, Firewall, AG WAF, AFD WAF checks and risk levels; automated by the Zero Trust Assessment) | How to read, Steps 3, 4, 6 | verified | Azure network security Zero Trust recommendations, <https://learn.microsoft.com/azure/networking/security/zero-trust-network-security> | Nov 11, 2026 |
| 23 | Detection logs but forwards; only Prevention blocks; request body inspection | Step 4, Dangers | verified | Zero Trust recommendations for Application Gateway WAF | Nov 11, 2026 |
| 24 | DDoS ZT checks: every public IP in VNets protected; metrics; diagnostic logs | Step 3 | verified | Zero Trust recommendations for Azure DDoS Protection | Nov 11, 2026 |
| 25 | DDoS tier features; Network Protection only: Rapid Response, cost protection, WAF discount, Basic IPs; pricing basis; infrastructure protection free; NAT gateway IPs unsupported | Step 3, Prerequisites | verified | About Azure DDoS Protection tier comparison, <https://learn.microsoft.com/azure/ddos-protection/ddos-protection-sku-comparison> | Nov 11, 2026 |
| 26 | DDoS Protection is L3/L4; L7 needs WAF | Step 3 | verified | What is Azure DDoS Protection? | Nov 11, 2026 |
| 27 | DDoS CLI: plan, link, disable; no move while protected, thresholds reset; dissociate before deleting the plan | Step 3, Rollback, Dangers | verified | QuickStart DDoS Network Protection CLI, <https://learn.microsoft.com/azure/ddos-protection/manage-ddos-protection-cli> | Nov 11, 2026 |
| 28 | `az network public-ip update --ddos-protection-mode Enabled`; `ddosSettings.protectionMode` values | Step 2, Step 3 | verified | QuickStart DDoS IP Protection CLI; IP Protection template | Nov 11, 2026 |
| 29 | Built-in DDoS policies (Modify or Audit; resource logs); Resource Graph inventory; log categories; `DDoSMitigationReports` retirement from about mid-August 2026; Rapid Response severity A; response runbook; simulations; quarterly cost review | Steps 1, 2, 3, 10 | verified | Secure your Azure DDoS Protection deployment, <https://learn.microsoft.com/azure/ddos-protection/secure-ddos-protection> | Nov 11, 2026 |
| 30 | Inventory, IP vs Network Protection, fewer public IPs via Private Link, quarterly reviews | Steps 2, 3 | verified | DDoS Protection cost optimization principles | Nov 11, 2026 |
| 31 | Simulation partners MazeBolt, Red Button, RedWolf; own protected IPs only; Red Button public cloud only; alert threshold 1 | Availability table, Step 3 | verified | Tutorial: DDoS Protection simulation testing, <https://learn.microsoft.com/azure/ddos-protection/test-through-simulations> | Nov 11, 2026 |
| 32 | Metric `IfUnderDDoSAttack`, Maximum, PT1M | Step 3 | verified | Supported metrics for Microsoft.Network/publicIPAddresses | Nov 11, 2026 |
| 33 | The `az monitor metrics alert create` command for the DDoS metric | Step 3 | restated-as-design: built from the CLI's documented syntax and #31-32; Learn's DDoS tutorial creates the alert in the portal | az monitor metrics alert reference | Nov 11, 2026 |
| 34 | Mitigation alerts in Defender for Cloud; recommended metric alerts | Steps 3, 10 | verified | DDoS fundamental best practices | Nov 11, 2026 |
| 35 | Firewall ZT checks; NAT gateway for SNAT; TI deny needs Standard or Premium; IDPS deny; TLS inspection with CA in Key Vault; log categories | Step 6, Prerequisites | verified | Zero Trust recommendations for Azure Firewall, <https://learn.microsoft.com/azure/networking/security/zero-trust-azure-firewall> | Nov 11, 2026 |
| 36 | SKU features; Standard to Premium upgrade without redeployment | Step 6 | verified | Azure Firewall and traffic inspection (design guide) | Nov 11, 2026 |
| 37 | Premium features; Education, Finance, Government, Health categories not TLS-terminated; regions on products-by-region page | Step 6, Availability table | verified | Azure Firewall Premium features implementation guide | Nov 11, 2026 |
| 38 | `az network firewall policy create --sku --threat-intel-mode --idps-mode` | Step 6 | verified | CLI reference az network firewall policy | Nov 11, 2026 |
| 39 | Route table, default route, subnet association | Step 6 | verified | Integrate NAT gateway with Azure Firewall | Nov 11, 2026 |
| 40 | Draft + Deployment commands; extension 1.2.3 or later; deploy replaces applied policy | Prerequisites, Step 6, Dangers | verified | Azure Firewall Draft + Deployment, <https://learn.microsoft.com/azure/firewall/draft-deploy> | Nov 11, 2026 |
| 41 | Azure Government private DNS zone names | Availability table, Step 7 | verified | Azure Private Endpoint private DNS zone values, section Government | Nov 11, 2026 |
| 42 | DNS zone group manages records with the endpoint | Step 7 | verified | Private Endpoint DNS integration scenarios | Nov 11, 2026 |
| 43 | /32 route for a private endpoint through the firewall | Step 7 | verified (Learn's troubleshooting resolution) | Troubleshoot private endpoint connectivity failure | Nov 11, 2026 |
| 44 | CAF pattern: deny public endpoints and `privatelink` zones; DINE zone groups; Private DNS Zone Contributor; ALZ initiative name | Step 7, Dangers | verified | Private Link and DNS integration at scale | Nov 11, 2026 |
| 45 | Key Vault private link CLI (RBAC vault with purge protection, firewall deny, zone, link, endpoint), nslookup validation, public DNS still resolves, on-premises forwarders | Steps 7, 8 | verified | Integrate Key Vault with Azure Private Link, <https://learn.microsoft.com/azure/key-vault/general/private-link-service> | Nov 11, 2026 |
| 46 | Key Vault security recommendations (per-app vaults, RBAC not access policies, PIM, soft delete, purge protection, rotation, logging, Defender, backup, key compromise response) | Step 8, Dangers | verified | Secure your Azure Key Vault, <https://learn.microsoft.com/azure/key-vault/general/secure-key-vault> | Nov 11, 2026 |
| 47 | `az keyvault key rotation-policy update --value`; policy shape (Rotate, Notify, expiry) | Step 8 | verified; periods are an example | Configure key autorotation | Nov 11, 2026 |
| 48 | Key Vault diagnostic setting with `AuditEvent` | Step 8 | verified | Enable Key Vault logging | Nov 11, 2026 |
| 49 | `New-AzManagementGroupHierarchySetting -Authorization -DefaultManagementGroup` | Step 1 | verified | Az PowerShell reference; Protect your resource hierarchy | Nov 11, 2026 |
| 50 | `DoNotEnforce` evaluates without enforcing; remediation still possible | Steps 1, 9 | verified | Azure Policy assignment structure | Nov 11, 2026 |
| 51 | `az policy assignment create` parameters `--enforcement-mode`, `--mi-system-assigned`, `--role`, `--identity-scope` | Step 9 | verified | CLI reference az policy assignment | Nov 11, 2026 |
| 52 | Exemption categories Mitigated and Waiver; `expiresOn`; expired kept for record; `az policy exemption create` parameters | Step 9 | verified | Azure Policy exemption structure; CLI reference | Nov 11, 2026 |
| 53 | Resource Graph public IP starter query | Step 2 | verified; guide's projection adds documented properties | Starter Resource Graph query samples | Nov 11, 2026 |
| 54 | Bicep module for Application Gateway WAF policy (managed rule sets, policy settings) | Step 4 | verified on the Azure Verified Modules README | Azure Verified Modules, bicep-registry-modules | Nov 11, 2026 |

## Claims log: other providers and federal sources

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 55 | Shield Standard automatic; Shield Advanced protections, response team, cost protection; AWS WAF resources | Other clouds | verified | AWS WAF/Shield Developer Guide | Nov 11, 2026 |
| 56 | AWS WAF in GovCloud (US): both regions; only AWS managed rule groups | Other clouds | verified | AWS GovCloud (US) User Guide, AWS WAF | Nov 11, 2026 |
| 57 | Shield Advanced in GovCloud | Other clouds | unverifiable: the GovCloud page for Shield redirected to the guide's welcome page | — | Nov 11, 2026 |
| 58 | Cloud Armor: always-on L3/L4; OWASP CRS preconfigured rules; Enterprise and Adaptive Protection | Other clouds | verified | Google Cloud Armor overview | Nov 11, 2026 |
| 59 | Private Service Connect: internal IPs in consumer VPC for Google APIs and published services | Other clouds | verified | Private Service Connect | Nov 11, 2026 |
| 60 | Assured Workloads FedRAMP High lists Cloud Armor and VPC, not Private Service Connect; Moderate not read | Other clouds | verified for High; Moderate unverifiable (page truncated) | Assured Workloads supported products | Nov 11, 2026 |
| 61 | OCI WAF: regional (load balancer) or edge policy; protection rules; rate limiting | Other clouds | verified | OCI WAF overview | Nov 11, 2026 |
| 62 | OCI Network Firewall: Palo Alto Networks; IDPS, SSL inspection, URL/FQDN filtering; route tables | Other clouds | verified | OCI Network Firewall overview | Nov 11, 2026 |
| 63 | OCI private endpoint: private IP in a VCN subnet for an Oracle service | Other clouds | verified | OCI private access | Nov 11, 2026 |
| 64 | KSI statements and related controls: CNA-MAT (SC-8, SI-10), CNA-RNT (SC-7(5)), CNA-RVP (SC-5), CNA-ULN (SC-7, AC-4(21)), CNA-EIS, SVC-ACM, SVC-ASM (SC-12, IA-5(2)), SVC-SIN (SC-8), IAM-SNU, MLA-EVC, MLA-LET, MLA-OSM, INR-RIR, INR-AAR, RPL-TRC (CP-4) | Requirements | verified | fedramp.gov 2026 KSI theme pages | Nov 11, 2026 |
| 65 | Moderate-baseline membership of the controls named | Requirements | carried from the workbook's reading of SP 800-53B (Book 12 App A, Book 13 App A) | SP 800-53B | Nov 11, 2026 |
| 66 | FIPS 200: minimum requirements met by selecting the SP 800-53 baseline | Steps 2, 3 | verified (standard's purpose statement) | FIPS 200 | Nov 11, 2026 |
| 67 | Firewall logs exported to resource-specific tables; `AZFWThreatIntel` holds the threat intelligence events | Step 6, Validate | verified | Monitoring data reference for Azure Firewall, <https://learn.microsoft.com/azure/firewall/monitor-firewall-reference> | Nov 13, 2026 |
| 68 | Key Vault logs land in `AzureDiagnostics`, filtered by `ResourceProvider == "MICROSOFT.KEYVAULT"`; `ResultSignature` holds the HTTP status, such as `OK` or `Forbidden` | Step 8, Validate | verified | Monitor Azure Key Vault, <https://learn.microsoft.com/azure/key-vault/general/monitor-key-vault> | Nov 13, 2026 |
| 69 | `az policy exemption list --management-group <name> --filter atScopeAndBelow()` lists the exemptions that apply to a management group; `create` takes `--exemption-category` (Mitigated, Waiver) and `--expires-on` | Step 9, evidence checklist | verified | Azure CLI reference, az policy exemption, <https://learn.microsoft.com/cli/azure/policy/exemption> | Nov 13, 2026 |
| 70 | `az monitor log-analytics query` is an extension command; `--workspace` takes the workspace's GUID | Step 10, evidence catalog | verified | Azure CLI reference, az monitor log-analytics, <https://learn.microsoft.com/cli/azure/monitor/log-analytics> | Nov 13, 2026 |

## Restated as design

| # | Item | Why |
|---|---|---|
| D1 | The decision record template, RACI, evidence catalog, metrics and review cadence | Program design; the instructions' six required artifacts |
| D2 | Detection for two weeks before Prevention; firewall Alert before Deny | Program choice built on Learn's "detection first" and "audit first" guidance |
| D3 | The `publicNetworkAccess` inventory query | Program query; property varies by service |
| D4 | The `az monitor metrics alert create` form for the DDoS alert (#33) and the `application-gateway update --set firewallPolicy.id` association | CLI generic syntax, not a Learn sample |
| D5 | Trust boundaries in the reference architecture diagram | Program design from Learn's services |

## Not yet specified

| # | Item | Why |
|---|---|---|
| N1 | Front Door in US Gov Virginia | Learn names only Arizona and Texas |
| N2 | Front Door Private Link in US Gov Arizona and Texas | Learn's region list conflicts with its availability-zone note and the Azure Government zones list |
| N3 | Front Door WAF limits in sovereign clouds | Only the Application Gateway FAQ states them |
| N4 | DDoS IP Protection and simulation partners (other than Red Button) in Azure Government | Not stated |
| N5 | Azure Firewall Premium regions in Azure Government | Learn defers to the products-by-region page |
| N6 | AWS Shield Advanced in GovCloud; OCI Government Cloud WAF and Network Firewall; Google Cloud FedRAMP Moderate package | Not read or not stated |
| N7 | Built-in policy display names and effects in Azure Government | Built-ins differ by cloud; guide has the reader look them up |

## Learn pages read

47 Microsoft Learn pages (including CLI and PowerShell reference pages), listed in the claims log above; rows 67 to 70 were added on Nov 13, 2026, for the sources the Azure Security training labs use.
