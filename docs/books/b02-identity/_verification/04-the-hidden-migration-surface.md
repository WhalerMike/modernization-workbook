# Verification — Chapter 04, The Hidden Migration Surface

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch) and the FedRAMP Marketplace dataset.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AD anchors eleven object types; most fail silently | Opening, eleven-types table | restated-as-design | Program dependency inventory |
| 2 | Entra ID has app registrations/service principals, not SPNs; cross-tenant sync creates/removes B2B users across an org's tenants (no forest trusts) | Eleven types | verified | c04-cross-tenant |
| 3 | Eight core concepts | Core concepts table | restated-as-design | Program canon |
| 4 | Priority tiers, risk statements | Priority matrix | restated-as-design | Program adapter specs |
| 5 | Registry gaps DM_015/016/085/090; DM_090 ID collides with validation checklist | Gaps table | restated-as-design (collision flagged) | Source index vs adapters page |
| 6 | DC locator queries DNS SRV records such as `_ldap._tcp.<domain>`, plus KDC and GC records | IPAM | verified | c04-dc-locator |
| 7 | "InfoBlox NIOS (FedRAMP authorized)" | IPAM | corrected: FedRAMP Certified Moderate is Infoblox Government Cloud (FR2017257053), not NIOS | c04-fedramp-marketplace |
| 8 | Smart card logon relies on trust anchored in the domain | PKI | restated-as-design (softened from "PIV depends on ADCS") | — |
| 9 | Intune provisions certs via SCEP, PKCS, imported PKCS + trusted root profile; 802.1X/VPN use; SCEP with Microsoft CA needs NDES + Certificate Connector | PKI | verified | c04-intune-certs |
| 10 | Auto-enrollment migrates to "Intune/SCEP/EST" | PKI | corrected: EST is not an Intune provisioning method | c04-intune-certs |
| 11 | Microsoft Cloud PKI: two-tier cloud CA, BYOCA, SCEP issuance, hosted CDP/AIA | PKI | verified (added) | c04-cloud-pki |
| 12 | "Entra CBA" listed as a CA implementation | PKI | corrected: CBA is a relying party; all CAs in chain must be uploaded | c04-cba-ca |
| 13 | CBA CDP must be internet-facing HTTP; OCSP/LDAP URLs not supported; no CRL = no revocation check | PKI | verified (added) | c04-cba-ca, c04-cba-setup |
| 14 | Cloud Kerberos trust is the only hybrid WHfB option needing no certificates; recommended over key trust | PKI | verified (added) | c04-whfb-plan |
| 15 | NPS authenticates 802.1X/VPN against AD groups | RADIUS | verified | c04-radius-entra |
| 16 | "Entra RADIUS Proxy" as an implementation | RADIUS | removed: no such Microsoft product; Entra ID has no native RADIUS | c04-radius-entra |
| 17 | NPS extension: NPS does primary auth against AD, Entra does MFA; uses on-prem UPN by default | RADIUS | verified (added) | c04-radius-entra, c04-nps-ext |
| 18 | Microsoft recommends moving VPNs to SAML federation with Entra ID | RADIUS | verified (added) | c04-radius-entra |
| 19 | Cisco ISE / Aruba ClearPass as replacements | RADIUS | restated-as-design (program registry entries) | — |
| 20 | 30-day NPS validation window; 30-day LDAP discovery window; waves | RADIUS, LDAP | restated-as-design | — |
| 21 | Event 2887 daily summary; Event 2889 per-client with `16 LDAP Interface Events` = 2; only unsigned/clear-text binds | LDAP | verified (added) | c04-ldap-signing |
| 22 | Registry path `HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics`; set back to 0 afterward | LDAP code | verified | c04-ldap-gpo |
| 23 | Event 2889 `Properties[0]` is the client address with port | LDAP code | unverifiable (illustrative; flagged under the code warning) | — |
| 24 | Entra ID has no LDAP endpoint; Entra DS supports LDAP bind/read, LDAPS, Kerberos, NTLM; writes only for objects created in managed domain; standalone domain | LDAP | verified | c04-entra-ds |
| 25 | Cloud-only users must change password for Entra DS; Cloud Sync not supported with Entra DS | LDAP | verified (added) | c04-entra-ds-hashes |
| 26 | App proxy KCD for IWA apps; connectors domain-joined | LDAP | verified (added) | c04-app-proxy-kcd |
| 27 | Sync engine retirement criteria (six) and "12-point checklist" | Sync engine | restated-as-design | Program adapter spec |
| 28 | "All service accounts migrated to Entra service principals" | Sync engine | restated-as-design ("Entra ID workload identity") | — |
| 29 | Microsoft recommends Cloud Sync where it fits; new features land there | Sync engine | verified | c04-connect-v2 |
| 30 | Cloud Sync: disconnected forests, multiple agents, 50K-member groups, 150K objects/domain; Connect: advanced rules, cross-forest refs | Sync engine | verified (added) | c04-cloud-sync-compare |
| 31 | Connect and Cloud Sync can't sync the same objects side by side; OU scoping for migration | Sync engine | verified (added) | c04-cloud-sync-faq |
| 32 | Group SOA conversion; both clients stop syncing; reversible | Sync engine | verified (added) | c04-group-soa |
| 33 | User SOA via `onPremisesSyncBehavior` | Sync engine | verified (added) | c04-user-soa |
| 34 | Cloud Sync provisions groups to AD; no client provisions users to AD | Sync engine | verified (added) | c04-cloud-sync-compare |
| 35 | Co-management's seven workloads | Devices | verified | c04-comanage |
| 36 | Group Policy analytics imports GPOs, reports MDM support, migrates to Settings Catalog | Devices | verified | c04-gpa |
| 37 | Kerberos maximum skew 5 minutes | NTP | verified | c04-kerberos-skew |
| 38 | "Every domain-joined machine syncs from the PDC emulator" | NTP | corrected: members use a DC in their domain; DCs chain to PDC; forest-root PDC is top | c04-w32time |
| 39 | Non-domain-joined computers default to `time.windows.com` | NTP | verified | c04-w32time |
| 40 | Intune policy to redirect w32tm | NTP | verified/corrected: ADMX_W32Time "Configure Windows NTP Client", default `time.windows.com,0x09`; recommendation restated as design (choose source deliberately) | c04-w32time-csp |
| 41 | Manually specified NTP sources are unauthenticated | NTP | verified (added) | c04-w32time |
| 42 | Domain-based DFS path `\\domain\root`, config in AD DS | DFS | verified | c04-dfs-types |
| 43 | Azure Files with Entra Kerberos: cloud-only no DC; hybrid needs DC line of sight for ACLs | DFS | verified (added) | c04-azfiles-kerb |
| 44 | Standalone namespace + root consolidation keeps `\\oldserver\share`; recommended for Azure Files migration | DFS | verified (added) | c04-azfiles-dfs |
| 45 | Entra Kerberos cloud TGT + partial TGT; on-prem leg needs users synced from AD | Kerberos bridge | verified (added) | c04-entra-kerberos |
| 46 | Six phases, gates, N/A net-new; canon phase mapping (DNS 11→6, PKI 6→6) | Phases | restated-as-design | Program canon |
| 47 | Registry fields, schema file, MOD_→FMP_ | Registration | restated-as-design | Program canon |
| 48 | DM_090 validation gate table | Validation | restated-as-design (assembled from each adapter's criteria) | — |
| 49 | Inventory categories and outputs | Inventory | restated-as-design | Program inventory artifact |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| directory-migration.md — intro (OrgMod flagship journey, adopt alone or with Federal Compliance) | — | Program-positioning text, not needed in a book chapter; OrgMod naming not used elsewhere in B02 |
| directory-migration.md — The Hidden Migration Surface | Opening prose | Merged with adapters.md "The Hidden Surface" |
| directory-migration.md — The Eleven AD Dependency Object Types | "The eleven AD dependency object types" table | Row 10 renamed "SPNs and service identities"; Entra equivalents note added |
| directory-migration.md — Eight Adapter Interfaces (six-part structure) | "The adapter interface" | — |
| directory-migration.md — CRITICAL / HIGH / MEDIUM tables | "The adapter priority matrix" + per-adapter sections | Merged with adapters.md matrix (duplicate) |
| directory-migration.md — The Eight Core Concepts | "The core concepts behind every adapter" | — |
| directory-migration.md — The Six Migration Phases (incl. N/A net-new, DNS 11→6, PKI 6→6) | "The six migration phases", "Canon phase mapping" | "[the program decision]" placeholders removed |
| directory-migration.md — Adapter Registration Schema | "Adapter registration" | — |
| directory-migration.md — Source Files | "Adapter registration" (last paragraph) | Bracketed file links converted to plain paths |
| adapters.md — The Hidden Surface (eight service bullets) | Opening prose and per-adapter sections | Duplicate of directory-migration.md |
| adapters.md — Adapter Priority Matrix | "The adapter priority matrix" | — |
| adapters.md — IPAM | "IPAM: DNS, DHCP, and IP management" | NIOS FedRAMP claim corrected |
| adapters.md — PKI | "PKI and certificate services" | EST and Entra CBA corrected; Cloud PKI, CBA CRL, cloud Kerberos trust added |
| adapters.md — RADIUS / NPS | "RADIUS and Network Policy Server" | "Entra RADIUS Proxy" removed; NPS extension caveat added |
| adapters.md — LDAP Proxy | "LDAP proxy" | DC event logging and code added; Entra DS constraints added |
| adapters.md — Sync Engine | "Sync engine" | Connect vs Cloud Sync and SOA facts added |
| adapters.md — Device Management | "Device management" | Co-management workloads added |
| adapters.md — NTP | "NTP and time services" | PDC claim corrected; fix restated |
| adapters.md — DFS | "DFS and file services" | Azure Files and root consolidation detail added |
| adapters.md — Post-Migration Validation (DM_090) | "Post-migration validation" | Gate table added |
| adapters.md — Source callout | "Adapter registration" | — |
| identity-directory-transformation-inventory.md — Purpose | "The transformation inventory" | — |
| identity-directory-transformation-inventory.md — Inventory categories | "The transformation inventory" table | — |
| identity-directory-transformation-inventory.md — Output | "The transformation inventory" closing paragraph | "Cleaned extraction" footer dropped |
| operational-guides/directory-migration/index.md — intro | Adapter interface intro | — |
| operational-guides/directory-migration/index.md — Leaves table (D.1–D.12) | "Gaps in the adapter registry" | DM_090 collision flagged |
| operational-guides/directory-migration/index.md — Canon Phase Mapping Requirement | "Canon phase mapping" | DNS/PKI reference guides named, not linked (outside B02; editor to decide links) |

## Diagrams

- `docs/images/diagrams/b02-identity/src/ch04-dependency-surface.flow.yaml` (replaces no PNG; sources had none)
- `docs/images/diagrams/b02-identity/src/ch04-adapter-sequence.flow.yaml`

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Sync retirement criterion names the authoritative source per population: HR for employees, the agency-designated source for contractors and vendors (Book 03 Ch06), invitation and entitlement management for guests | Sync engine retirement criteria | restated-as-design | Book 03 Ch06 (internal) |
