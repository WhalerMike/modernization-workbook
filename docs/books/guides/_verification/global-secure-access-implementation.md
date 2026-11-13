# Verification — Guide: Global Secure Access & Zero Trust Network Engineering

New guide, first pass of 2026-11-11, written for the Zero Trust Assessment closure update (instruction IDs GSA-01 to GSA-12 and the guide's part of closure-map row CM-10). By the program owner's decision of November 11, 2026, the network engineering book the closure update proposed is carried as this implementation guide; it links Book 09 Chapter 05, Book 04, Book 10 Chapter 04 and Book 12 Chapter 03 for what they already cover.

Every Microsoft fact and command was read on Microsoft Learn on November 11, 2026, through the Microsoft Learn documentation service (search, fetch and code-sample search), and each page's `ms.date` was read from its published HTML the same day. Facts Book 09 Chapter 05 verified on November 9, 2026 are cited by link and rely on that chapter's verification log. The CISA Remote User Use Case was read from CISA's PDF (cover: Version 2.2, publication September 2026), and the KSI statements and related controls from fedramp.gov, both on November 11, 2026. No command was run against a tenant for this guide.

## Learn pages read

| Page | URL | ms.date |
|---|---|---|
| Known limitations for Global Secure Access | learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations | 2026-11-03 |
| Microsoft Graph network access APIs (preview): overview | learn.microsoft.com/graph/api/resources/networkaccess-global-secure-access-api-overview?view=graph-rest-beta | 2024-06-05 |
| Update conditionalAccessSettings (beta) | learn.microsoft.com/graph/api/networkaccess-conditionalaccesssettings-update?view=graph-rest-beta | 2024-08-13 |
| crossTenantAccessSettings resource type (beta) | learn.microsoft.com/graph/api/resources/networkaccess-crosstenantaccesssettings?view=graph-rest-beta | 2024-07-22 |
| Update crossTenantAccessSettings (beta) | learn.microsoft.com/graph/api/networkaccess-crosstenantaccesssettings-update?view=graph-rest-beta | 2024-08-13 |
| forwardingProfile resource type (beta) | learn.microsoft.com/graph/api/resources/networkaccess-forwardingprofile?view=graph-rest-beta | 2024-08-01 |
| reports: getDeviceUsageSummary (beta) | learn.microsoft.com/graph/api/networkaccess-reports-getdeviceusagesummary?view=graph-rest-beta | 2024-04-05 |
| compliantNetworkNamedLocation resource type (beta) | learn.microsoft.com/graph/api/resources/compliantnetworknamedlocation?view=graph-rest-beta | 2024-06-05 |
| Configure Microsoft Entra Private Access using Microsoft Graph APIs | learn.microsoft.com/graph/tutorial-entra-private-access | 2025-04-25 |
| Configure Microsoft Entra Internet Access using Microsoft Graph APIs | learn.microsoft.com/graph/tutorial-entra-internet-access | 2025-06-10 |
| Global Secure Access traffic forwarding profiles | learn.microsoft.com/entra/global-secure-access/concept-traffic-forwarding | 2026-09-20 |
| Install the Global Secure Access client for Windows | learn.microsoft.com/entra/global-secure-access/how-to-install-windows-client | 2026-11-03 |
| What is Global Secure Access? | learn.microsoft.com/entra/global-secure-access/overview-what-is-global-secure-access | 2026-04-15 |
| Turn on Universal Tenant Restrictions | learn.microsoft.com/entra/global-secure-access/how-to-universal-tenant-restrictions | 2026-07-29 |
| Enable compliant network check with Conditional Access | learn.microsoft.com/entra/global-secure-access/how-to-compliant-network | 2026-04-03 |
| Tutorial: Enable the compliant network check | learn.microsoft.com/entra/global-secure-access/tutorial-microsoft-traffic-compliant-network | 2026-06-22 |
| Tutorial: Enable the Microsoft traffic profile | learn.microsoft.com/entra/global-secure-access/tutorial-microsoft-traffic-enable-profile | 2026-06-22 |
| Tutorial: Get started with Microsoft traffic labs | learn.microsoft.com/entra/global-secure-access/tutorial-microsoft-traffic-introduction | 2026-06-22 |
| Source IP restoration | learn.microsoft.com/entra/global-secure-access/how-to-source-ip-restoration | 2026-04-03 |
| Global Secure Access deployment guide for Microsoft Traffic | learn.microsoft.com/entra/architecture/gsa-deployment-guide-microsoft-traffic | 2025-01-06 |
| Operate the Microsoft traffic profile | learn.microsoft.com/entra/global-secure-access/how-to-operate-microsoft-traffic | 2026-05-04 |
| Operate Microsoft Entra Internet Access | learn.microsoft.com/entra/global-secure-access/how-to-operate-internet-access | 2026-05-04 |
| Common operations for Global Secure Access | learn.microsoft.com/entra/global-secure-access/how-to-operations-common | 2026-05-04 |
| Global Secure Access operations guide | learn.microsoft.com/entra/global-secure-access/overview-operations | 2026-05-04 |
| Security operations for network access | learn.microsoft.com/entra/global-secure-access/how-to-security-operations | 2026-06-18 |
| Global Secure Access logs and monitoring | learn.microsoft.com/entra/global-secure-access/concept-global-secure-access-logs-monitoring | 2026-03-12 |
| How to use the Global Secure Access traffic logs (preview) | learn.microsoft.com/entra/global-secure-access/how-to-view-traffic-logs | 2026-03-25 |
| Configure Transport Layer Security inspection policies | learn.microsoft.com/entra/global-secure-access/how-to-transport-layer-security | 2026-08-28 |
| Configure TLS inspection with your own certificate | learn.microsoft.com/entra/global-secure-access/how-to-transport-layer-security-settings | 2026-08-28 |
| What is Transport Layer Security inspection? | learn.microsoft.com/entra/global-secure-access/concept-transport-layer-security | 2026-08-28 |
| Tutorial: Enable TLS inspection | learn.microsoft.com/entra/global-secure-access/tutorial-internet-access-tls-inspection | 2026-03-07 |
| Frequently asked questions for TLS inspection | learn.microsoft.com/entra/global-secure-access/faq-transport-layer-security | 2025-05-28 |
| Troubleshoot TLS inspection errors | learn.microsoft.com/entra/global-secure-access/troubleshoot-transport-layer-security | 2026-08-28 |
| How to configure per-app access | learn.microsoft.com/entra/global-secure-access/how-to-configure-per-app-access | 2026-04-29 |
| Configure Private Access for Active Directory domain controllers | learn.microsoft.com/entra/global-secure-access/how-to-configure-domain-controllers | 2026-06-04 |
| Configure Microsoft Entra for Zero Trust: Protect networks | learn.microsoft.com/entra/fundamentals/zero-trust-protect-networks | 2026-04-30 |
| How to use workbooks with Global Secure Access | learn.microsoft.com/entra/global-secure-access/how-to-use-workbooks | 2026-06-04 |
| Enhance threat detection with Global Secure Access in Microsoft Sentinel | learn.microsoft.com/entra/global-secure-access/how-to-sentinel-integration | 2026-06-04 |
| Introduction to the Global Secure Access deployment guide | learn.microsoft.com/entra/architecture/gsa-deployment-guide-intro | 2025-01-06 |
| Conditional Access: Network assignment | learn.microsoft.com/entra/identity/conditional-access/concept-assignment-network | 2026-04-01 |

## Other primary sources read

| Source | URL | Date read |
|---|---|---|
| CISA, TIC 3.0 Remote User Use Case, Version 2.2 (publication September 2026; content July 2025) | cisa.gov/sites/default/files/2026-09/TIC_3.0_Remote_User_Use_Case_September_2026_61.pdf | Nov 11, 2026 |
| CISA, TIC 3.0 Core Guidance Documents (landing page and link list) | cisa.gov/resources-tools/resources/trusted-internet-connections-tic-30-core-guidance-documents | Nov 11, 2026 |
| FedRAMP, Key Security Indicators (Consolidated Rules for 2026) | fedramp.gov/2026/reference/key-security-indicators/ | Nov 11, 2026 |

## Claims

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | GSA available in GCC | Availability; Step 1 | verified | Known limitations, Government Cloud section | Nov 11, 2026 |
| 2 | No feature page read narrows the product-wide statement; preview features' GCC availability not yet specified | Availability | restated-as-design | Feature pages in this log | Nov 11, 2026 |
| 3 | Network access APIs are beta; beta "subject to change"; use in production applications "not supported" | How to read | verified | API overview; beta notice on each page | Nov 11, 2026 |
| 4 | `NetworkAccess.ReadWrite.All`; Global Secure Access Administrator or Security Administrator for settings | How to read | verified | Update conditionalAccessSettings | Nov 11, 2026 |
| 5 | Internet Access and Private Access profiles need P1 or P2 plus Internet Access, Private Access or Suite; the internet profile excludes Microsoft traffic destinations; custom Private Access profiles are preview | Availability; Step 5 | verified | Traffic forwarding profiles | Nov 11, 2026 |
| 6 | Microsoft traffic capabilities included in P1 and P2; Microsoft traffic acquired only by its own profile | Step 4 | verified | Microsoft traffic tutorials | Nov 11, 2026 |
| 7 | Remote networks need at least 50 P1 and Internet Access licenses combined | Availability | verified (by link) | Book 09 Ch05, verified Nov 9, 2026 | Nov 9, 2026 |
| 8 | The traffic logs page is titled "(preview)" | Availability | verified | How to use the traffic logs (preview) | Nov 11, 2026 |
| 9 | Remote User Use Case v2.2: three patterns; SECaaS option directed by client agents, proxy settings and DNS; parity simplified with the same provider; Pattern 3 riskiest and needs the greatest rigor; Pattern 1 option 4 via TLS and MFA | TIC alignment | verified | CISA Remote User Use Case, §6.1–6.3 | Nov 11, 2026 |
| 10 | CISA visibility "must be preserved through telemetry sharing"; agencies may need to augment telemetry in accordance with OMB M-26-14 | TIC alignment; Step 12 | verified | CISA Remote User Use Case, §8–8.1 | Nov 11, 2026 |
| 11 | Mapping of Private Access, the Microsoft traffic profile and Internet Access to the use case's Patterns 1–3 | TIC alignment | restated-as-design | The program's reading | Nov 11, 2026 |
| 12 | Private Access reaches private apps "across hybrid and multicloud environments"; no AWS, Google Cloud or OCI connector procedure found | Comparison | verified; cloud-specific procedure unverifiable | What is Global Secure Access? | Nov 11, 2026 |
| 13 | Client prerequisites: joined, hybrid joined or registered (registered: Private Access only); Windows 10 LTSC 2021 or later, Windows 11, separate Arm64 installer; AVD single-session and Windows 365 supported, multi-session not; local admin to install | Step 3 | verified | Install the client for Windows | Nov 11, 2026 |
| 14 | Intune Win32 values: script behavior, install and uninstall commands, System, return codes 0, 3010, 1618, file detection rule | Step 3 | verified | Install the client for Windows | Nov 11, 2026 |
| 15 | DoH disabled with the settings catalog for Edge and Chrome; Firefox by remediation script | Step 3 | verified | Install the client for Windows | Nov 11, 2026 |
| 16 | Registry values HideSignOutButton, HideDisablePrivateAccessButton, HideDisableButton, RestrictNonPrivilegedUsers; let users run unrestricted first | Step 3 | verified | Install the client for Windows | Nov 11, 2026 |
| 17 | Phased client upgrade procedure | Step 3 | verified | Install the client for Windows | Nov 11, 2026 |
| 18 | No host with a Hyper-V external switch; IPv4 only; no secure DNS, browser DNS over TCP or GPO NRPT | Step 3 | verified | Known limitations | Nov 11, 2026 |
| 19 | getDeviceUsageSummary function, parameters, counts; Global Secure Access Log Reader | Step 3 | verified | getDeviceUsageSummary | Nov 11, 2026 |
| 20 | `trafficForwardingType` values `m365`, `internet`, `private`; PATCH `state` enabled | Steps 4–6 | verified | forwardingProfile; Graph tutorials | Nov 11, 2026 |
| 21 | Assigning groups to a traffic profile: portal only on the pages read | Step 4 | unverifiable (no Graph request found) | Microsoft traffic tutorial | Nov 11, 2026 |
| 22 | Source IP restoration on by default for new tenants; tenants onboarded before June 2025 may need to enable it; caution on disabling | Step 4 | verified | Source IP restoration | Nov 11, 2026 |
| 23 | Deployment guide: source IP comparison test; rollback plan defines circumstances and procedures | Steps 4, 11 | verified | Deployment guide for Microsoft Traffic | Nov 11, 2026 |
| 24 | `SigninLogs` field `IsThroughGlobalSecureAccess` | Step 4 | verified (name); type unverifiable | Common operations, weekly report runbook | Nov 11, 2026 |
| 25 | Filtering policy, filtering profile, policy link and Conditional Access session control requests; "All internet resources with Global Secure Access" app ID | Step 5 | verified | Internet Access Graph tutorial | Nov 11, 2026 |
| 26 | Internet Access limits (256 profiles, 1,000 policies, 1,000 rules, 8,000 destinations; ports 80 and 443; no IPv6, no UDP) | Step 5 | verified | Known limitations | Nov 11, 2026 |
| 27 | QUIC: newer pages keep QUIC on and block it with the preview cloud firewall; the TLS page blocks UDP 443 with Windows Firewall | Step 5 | verified (conflict recorded) | Known limitations; Install client; Configure TLS inspection policies | Nov 11, 2026 |
| 28 | Allow-list changes record an owner approval and an expiration or review date | Step 5 | verified | Common operations, change management | Nov 11, 2026 |
| 29 | Whether report-only Conditional Access applies a security profile | Step 5 | unverifiable | Pages read | Nov 11, 2026 |
| 30 | Private Access app creation from the custom template, `nonwebapp` and `isAccessibleViaZTNAClient`, connector group binding, segments, app role assignment, profile enablement | Step 6 | verified | Private Access Graph tutorial | Nov 11, 2026 |
| 31 | Policy tester in the client's forwarding profile tab | Step 6 | verified | Per-app access | Nov 11, 2026 |
| 32 | Compliant network: authentication and data plane enforcement; signaling; named location; Intune exclusions; emergency access exclusion; caution on disabling signaling; test by disabling the client | Step 7 | verified | Enable compliant network check; compliant network tutorial | Nov 11, 2026 |
| 33 | `#microsoft.graph.compliantNetworkNamedLocation` type | Step 7 | verified | compliantNetworkNamedLocation | Nov 11, 2026 |
| 34 | Compliant network not supported for Private Access apps; Explicit Forward Proxy exclusion | Step 7 | verified | Known limitations | Nov 11, 2026 |
| 35 | Universal CAE: Windows client 1.8.239.0 or later; tokens 60–90 minutes; disconnect about 10 minutes after the signal; strict location caution | Step 7 | verified | Known limitations; Protect networks | Nov 11, 2026 |
| 36 | The program starts the compliant network policy in report-only (Learn's example sets On) | Step 7 | restated-as-design | Book 04 Ch07 practice | Nov 11, 2026 |
| 37 | UTR prerequisites, toggle, four-case example, admin center feature flag | Step 8 | verified | Turn on Universal Tenant Restrictions | Nov 11, 2026 |
| 38 | `networkPacketTaggingStatus` through `PATCH /networkAccess/settings/crossTenantAccess` | Step 8 | verified | Update crossTenantAccessSettings | Nov 11, 2026 |
| 39 | Tenant restriction block query, `ResultType == 5000211` | Step 8 | verified | Operate Microsoft traffic profile | Nov 11, 2026 |
| 40 | TLS: two-tier model; CSR name limits; required extensions; six months' validity; one active certificate; no HTTP/2; no AIA or OCSP; `TlsAction` and `TlsStatus` fields | Step 9 | verified | TLS concept; own certificate | Nov 11, 2026 |
| 41 | "Consider using a dedicated CA for TLS inspection, not your production PKI" | Step 9 | verified | Tutorial: Enable TLS inspection | Nov 11, 2026 |
| 42 | System bypass and recommended bypass categories; establish and communicate a TLS policy to users; disable order | Step 9 | verified | Configure TLS inspection policies | Nov 11, 2026 |
| 43 | Renew 90 days ahead; deploy trust before activation; an expired certificate disables all inspection | Step 9 | verified | Operate Internet Access | Nov 11, 2026 |
| 44 | `TlsStatus` values differ between pages (Success/Failure vs `Inspected`) | Step 9 | verified (conflict recorded) | TLS concept; Operate Internet Access | Nov 11, 2026 |
| 45 | A TLS failure rate above 1% points to systemic problems | Step 9 | verified | Protect networks | Nov 11, 2026 |
| 46 | DC sensor: inbound TCP 1337; one sensor per DC; Audit by default; silent install and token registration commands; `SourceIPAllowList`; EnforceMode; break glass; `klist` test; application SPNs before the DC's own | Step 10 | verified | Configure Private Access for AD domain controllers | Nov 11, 2026 |
| 47 | Built-in phishing-resistant MFA authentication strength ID | Step 10 | verified (by link) | Book 04 Ch03 | Oct 20, 2026 |
| 48 | Change categories; enabling a new traffic profile is a major change | Step 11 | verified | Common operations | Nov 11, 2026 |
| 49 | Remote networks: Microsoft and internet profiles only; Conditional Access only with the client; custom bypass not on remote networks; PAC exclusions for proxies | Step 11 | verified | Known limitations | Nov 11, 2026 |
| 50 | Traffic and remote network health logs retained 30 days; export through diagnostic settings | Step 12 | verified | Logs and monitoring | Nov 11, 2026 |
| 51 | Diagnostic categories and tables; a traffic heartbeat drop covers offboarding, which has no audit signal | Step 12 | verified | Sentinel integration; Security operations; Workbooks | Nov 11, 2026 |
| 52 | RACI roles; at least two people per role | RACI | verified | Common operations; Operations guide | Nov 11, 2026 |
| 53 | "Protect networks" recommendation headings | Control states | verified | Protect networks | Nov 11, 2026 |
| 54 | Related SP 800-53 controls for the fourteen KSIs named | Requirements | verified | fedramp.gov Key Security Indicators | Nov 11, 2026 |
| 55 | Which evidence supports which KSI | Requirements | restated-as-design | The program's mapping | Nov 11, 2026 |
| 56 | Metric targets | Metrics | restated-as-design | The program's starting values | Nov 11, 2026 |

## Conflicts between sources (for the program owner)

1. **QUIC.** The TLS inspection policies page blocks UDP 443 with Windows Firewall; the client and limitations pages (both `ms.date` 2026-11-03) keep QUIC on and block it with the preview cloud firewall for clients. The guide uses the generally available path.
2. **`TlsStatus` values.** Success and Failure on the concept page; `Inspected` in the operations page's query. The guide's query groups by the values the workspace holds.
