# Verification — Chapter 03, The Platform Foundation

Sources: the series chapter itself (`03-platform-foundation.md`, upgraded in place); the earlier copy `docs/operational-guides/client-server-to-hybrid-cloud/01-platform-foundation.md` (all sections); `docs/operational-guides/client-server-to-hybrid-cloud/02-legacy-ingestion.md` (cmdlet skeletons; the rest is carried by Chapter 10); `docs/whitepapers/modernization-journey.md` Act 4 opening ("structural move") and Principle 4 (control plane, actuation ladder). All sources accessed Oct 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Windows Server 2025 is the current LTSC release, available Nov 2024, extended support to Nov 2034 | The architectural claim | verified (added) | Windows Server release information |
| 2 | Gitea verifies GPG and SSH commit signatures; unverifiable commits are marked | Role 1 | verified | docs.gitea.com/administration/signing |
| 3 | Gitea branch protection can require signed commits | Role 1 (draft) | removed | Only third-party mirrors found; claim not made |
| 4 | URL Rewrite + ARR make IIS a reverse proxy | Role 2 | verified | Reverse Proxy with URL Rewrite v2 and ARR |
| 5 | IIS can require client certificates (`SslRequireCert`) | Role 2 | verified | IIS `<access>` reference |
| 6 | Native HSTS in IIS 10.0 version 1709 | Role 2 | verified | IIS 10.0 v1709 HSTS |
| 7 | IIS 10.0 (Windows Server 2016) supports HTTP/2 over TLS | Role 2 | verified | HTTP/2 on IIS |
| 8 | Gitea's IIS example forwards to 127.0.0.1:3000 | Role 2 | verified | docs.gitea.com/administration/reverse-proxies |
| 9 | Full repository server behind proxy chosen over IIS + git-http-backend | Role 2 | restated-as-design | Program decision (earlier copy) |
| 10 | Arc gives a system-assigned managed identity; ARM creates a service principal; local token endpoint; usable for ARM and other Entra-protected resources | Role 3 | verified | Arc managed-identity-authentication |
| 11 | "Arc onboarding uses a service principal or interactive sign-in, not a client certificate from the enterprise CA" | Role 3 | corrected | azcmagent connect (five auth options incl. SP certificate, access token, Azure CLI); Arc security-onboarding (certificate recommended; Onboarding role; credential only needed at connect) |
| 12 | Earlier copy: host is "Entra-registered" for OAuth inbound/Graph outbound and uses a client certificate for "Arc + Intune enrollment" | Role 3 | corrected | Same Arc sources; Intune doesn't manage Windows Server (Book 01 brief, Book 05 Ch 09) |
| 13 | "PowerShell 7.4+" | Role 4 | corrected | PowerShell Support Lifecycle: 7.4 LTS ends Nov 10, 2026; 7.6 LTS released Mar 18, 2026, supported to Nov 14, 2028 |
| 14 | ActiveDirectory and DnsServer natively compatible with PS7; GroupPolicy and DhcpServer untested with compatibility layer | Role 4, code | verified (added) | PowerShell 7 module compatibility in Windows Server 2025 |
| 15 | "Python 3.12+" | Role 4 | restated-as-design | Now "a supported Python 3 release"; no version pinned |
| 16 | Cmdlets in the illustrative block (Get-ADForest, Get-ADDomain, Get-ADTrust, Get-ADReplicationSiteLink, Get-ADOrganizationalUnit, Get-ADUser, Get-ADServiceAccount, Get-ADDomainController -Discover, Get-DnsServerZone, Get-GPOReport -All -ReportType Xml -Path, Get-DhcpServerInDC) | Role 4, code | verified | Standard ActiveDirectory, DnsServer, GroupPolicy, DhcpServer cmdlets; invented `ConvertTo-Fmp*`, `Analyze-ADCSTemplatePermission`, and third-party `Get-CertificationAuthority`/`Get-CertificateTemplate`/`Get-IssuedCertificate` from the earlier skeleton not carried |
| 17 | Governance/execution separation, separate accounts/stores/logs | Separation | restated-as-design | Program design |
| 18 | NIST SP 800-207 moves defenses from perimeters to users, assets, resources | Control plane | verified | SP 800-207 abstract (csrc) |
| 19 | SP 800-207 separates PE/PA from PEP; ID management system is an input | Control plane | verified | SP 800-207 §3.1 (PDF) |
| 20 | Whitepaper: "NIST SP 800-207 and OMB M-22-09 require" the governance layer to hold and reconcile authoritative state | Control plane | corrected | Restated as what 800-207 actually separates; the governance-layer framing is the program's |
| 21 | CISA ZTMM v2.0 has four stages: Traditional, Initial, Advanced, Optimal | Control plane | verified | ZTMM v2.0 (April 2023) PDF |
| 22 | Mapping of governance postures (record, advise, gated actuation, autonomous) to ZTMM stages | Control plane | restated-as-design | Program's mapping; table says so |
| 23 | Whitepaper: "FedRAMP continuous monitoring and OMB M-22-09 expect agencies to operate at Advanced maturity as the production standard" | Control plane | removed | Not found in M-22-09 or FedRAMP material; restated as program position with an explicit note |
| 24 | Tier 0 includes identity services such as Entra Connect and AD CS | Operational properties | verified | Tier model for AD DS |
| 25 | Enterprise access model expands Tier 0 to the control plane | Operational properties | verified | Enterprise access model |
| 26 | "AppLocker + WDAC" | Operational properties | corrected | App Control for Business (formerly WDAC); Microsoft prefers it to AppLocker (Application Control for Windows; PowerShell App Control page) |
| 27 | M-26-14 requires logs identifying the identity behind operations and privilege changes, central or federated | Operational properties | verified (added) | M-26-14 Appendix B items 2, 5a, 5d |
| 28 | Azure Policy can target resources by tag; machine configuration audits/applies OS settings on Arc servers | Operational properties | verified | Arc policy-reference (tag-scoped built-ins); Machine Configuration overview |
| 29 | Earlier copy: server targeted by "attribute-scoped Intune compliance policy" and placed in an AU | Operational properties | corrected | Intune doesn't manage Windows Server; servers under Arc (brief; Book 05 Ch 09) |
| 30 | Earlier copy: "CIS Level 2, Defender for Servers Plan 2" | Operational properties | restated-as-design | Generalized to "a security baseline … endpoint protection"; specific product tiers not asserted |
| 31 | Earlier copy: "Zero-trust federal environments score a single hardened Tier-0 host lower-risk" | Why one host | removed | No source; the series text already replaced it with a balanced statement |
| 32 | HA design: near-zero RPO, RTO in minutes | Role 1 | restated-as-design | Program decision |
| 33 | Host rebuilt as workgroup Arc-managed server when forest retires | What it is not | restated-as-design | Program design |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series ch. — title/H1 "Chapter 01 — Platform Foundation", bold subtitle | H1 "Chapter 03 — The Platform Foundation", italic thesis, In-this-chapter callout | Renumbered per brief |
| Series ch. — Dependency chain | Dependency chain (kept) | — |
| Series ch. — The architectural claim | The architectural claim | Old `cshc/platform-host.svg` replaced by `ch03-platform-host.flow.yaml` |
| Series ch. — Why one host | Why one host | — |
| Series ch. — The five roles (1–5) | The five roles | Role 3 Arc onboarding corrected; Role 4 versions corrected and code added |
| Series ch. — Separation of governance and execution | Separation of governance and execution + `ch03-decide-and-act` diagram | — |
| Series ch. — Integration surface | Integration surface (+ links to owning books) | — |
| Series ch. — Operational properties | Operational properties | Expanded and sourced |
| Series ch. — What the platform host is not | What the platform host is not | — |
| Series ch. — Cross-references | Build and decision records | Retitled |
| Series ch. — Key takeaways | Key takeaways | Item 2 and 3 extended |
| Series ch. — Authoritative references list | Footnotes | List removed; every entry is now a footnote |
| Series ch. — Previous/Next links | Continue the book callout | Reading order fixed (02 ← 03 → 04) |
| Earlier copy 01 — front matter, "aspirational", canon-source | — | Superseded by book front matter |
| Earlier copy 01 — architectural claim callout ("one host") | The architectural claim | Standby qualification kept from series |
| Earlier copy 01 — Why one host (incl. "lower-risk" scoring, one Intune rule set, one Arc enrollment) | Why one host | Unsourced risk-scoring claim and Intune-on-server detail dropped (claims 29, 31) |
| Earlier copy 01 — Role 1 Gitea, HA RPO/RTO, Azure Blob + GitHub mirror | Role 1 | RPO/RTO kept as design; "Azure Blob and GitHub mirror" generalized to off-premises backup (product-neutral) |
| Earlier copy 01 — Role 2 IIS + loopback 3000; ADR citation; Option A rejected; LDAPS landing point | Role 2 | Port 3000 now sourced to Gitea docs; decision kept as design without internal ADR numbers; "IIS is the LDAPS-aware auth landing point for Gitea source-config" not carried (Gitea's own LDAP authentication source does that; unverified as an IIS role) |
| Earlier copy 01 — Role 3 memberships | Role 3 | Corrected (claims 11–12) |
| Earlier copy 01 — Role 4 PowerShell/Python/API integrators, OSCAL, FMP_158 schema, Pester, named vendors | Role 4 | Versions corrected; internal schema IDs and vendor names (Infoblox, ServiceNow, CyberArk, ScubaGear) generalized to categories, as in the series |
| Earlier copy 01 — Role 5 DM_* adapters, DM_010 | Role 5 | Internal adapter IDs not carried (internal canon); link to Book 02 Ch 04 for the dependency surface |
| Earlier copy 01 — Two-Brain split ("Copilot" governance brain, "Execution Substrate") | Separation of governance and execution | Product-specific "Copilot" naming and the to-be-authored decision not carried; substance identical |
| Earlier copy 01 — Integration surface map incl. GitHub mirror row and adapter IDs | Integration surface | GitHub upstream-mirror row and adapter IDs not carried (implementation-specific) |
| Earlier copy 01 — Operational properties (CIS L2, AppLocker, WDAC, Defender P2, AU, Intune compliance, FMP_163/167 SLA tickets) | Operational properties | Corrected/generalized (claims 26, 29, 30); internal canon IDs dropped |
| Earlier copy 01 — What the platform server is not | What the platform host is not | "DCs go away, server stays" kept as rebuild-as-workgroup |
| Earlier copy 01 — "New" (GitHub/site pointers) | — | Site navigation, stale; not chapter content |
| Earlier copy 01 — Cross-references (build guide 14 phases, ADRs, canon IDs) | Build and decision records | Internal document counts and IDs not carried |
| Earlier copy 02 — cmdlet skeletons, streams 1–10 | Role 4 illustrative code (real cmdlets only) | Invented and third-party cmdlets removed (claim 16); stream descriptions are carried by Chapter 10 (W5) |
| Earlier copy 02 — other sections | — | Owned by Chapter 10; see `10-analyzing-the-estate.md` ledger. W2 verified that Chapter 10 already carries them |
| Whitepaper — Act 4 "structural move" (truth vs in-path enforcer) | The control plane over the data planes | Requirement claim corrected (claim 20) |
| Whitepaper — Principle 4 (active reconciliation, CISA ZT stage table, AO callout) | The control plane over the data planes | Stage mapping labelled as program design; AO expectation claim removed (claim 23) |
| Whitepaper — Figure 13 (rId94.png) | `ch03-decide-and-act.flow.yaml` (separation and gate) and the ladder table | Word extract not reused |
| Whitepaper — Principle 1, Principle 3, mainframe section | Chapter 04 | See its ledger |
