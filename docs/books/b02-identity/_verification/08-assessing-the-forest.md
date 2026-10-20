# Verification — Chapter 08, Assessing the Forest

Source: `docs/operational-guides/ad-interaction-guide.md` (the source's Appendix A module and Appendix B schema went to Appendix C; see `appendix-b-forest-assessment-module.md` in this folder).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Windows Server 2025 and Windows 11 24H2 are build 26100; 25H2 is 26200 | Prerequisites | verified | [^c08-builds] Windows release information pages |
| 2 | RSAT on client = Features on Demand; on server = `Install-WindowsFeature`; discover with `Get-WindowsFeature -Name RSAT*` | Prerequisites | verified | [^c08-rsat] |
| 3 | Capability names `Rsat.ActiveDirectory.DS-LDS.Tools`, `Rsat.GroupPolicy.Management.Tools`, `Rsat.Dns.Tools`, `Rsat.CertificateServices.Tools` (`~~~~0.0.1.0`) | Module table | verified | [^c08-fod] |
| 4 | Server feature name `RSAT-AD-PowerShell` | Module table | verified | [^c08-rbcd-hop] |
| 5 | Server feature names `GPMC`, `RSAT-DNS-Server`, `RSAT-ADCS-Mgmt` | Module table | restated-as-design | Not found on Learn; chapter tells readers to confirm with `Get-WindowsFeature`; AD CS row generalized to "AD CS management tools" |
| 6 | `ADCSAdministration` module required | Prerequisites | corrected | Not used by any collector; removed from requirements |
| 7 | PSPKI no longer actively supported; 4.4.1 published June 2026 | Prerequisites | verified | [^c08-pspki], [^c08-pspki-gallery] |
| 8 | Add assessment account to DnsAdmins for DNS read | Rights | corrected | DnsAdmins is privileged; MDI flags non-privileged members [^c08-dnsadmins] |
| 9 | "Cert Publishers or delegated read on PKI containers" | Rights | corrected | Cert Publishers is for publishing certificates; replaced with read on Public Key Services and each CA (design) |
| 10 | Domain Admin "recommended for initial discovery" | Rights | restated-as-design | Program position: no standing DA; trust verification only, under JIT |
| 11 | `netdom` verification needs domain admin credentials | Rights, Trusts | verified | [^c08-netdom] netdom query `/verify` note |
| 12 | Five FSMO roles: two forest-wide, three per domain | Topology | verified | [^c08-fsmo] |
| 13 | Forest-root PDC emulator is authoritative time source | Topology | verified | [^c08-fsmo] |
| 14 | `Get-ADDomainController` returns `OperationMasterRoles` | Topology | verified | [^c08-manage-fsmo] |
| 15 | `ADForestMode` includes `Windows2025Forest` | Functional levels | verified | [^c08-forestmode] |
| 16 | WS2025 functional level = DomainLevel/ForestLevel 10; no new level for 2019/2022; required for 32k pages | Functional levels | verified | [^c08-ws2025], [^c08-fl] |
| 17 | Only WS2025 DCs can run at the WS2025 level | Functional levels | verified | [^c08-fl] interoperability matrix |
| 18 | WS2025 DC needs domain at WS2016 level or higher | Functional levels | verified | [^c08-fl-upgrade] |
| 19 | Raising forest to 2025 raises all domains when all DCs are 2025 | Functional levels | verified | [^c08-raise-fl] |
| 20 | `Get-ADReplicationSite/SiteLink/Subnet` exist | Sites | verified | [^c08-admodule] |
| 21 | Unmapped subnets send clients to arbitrary DCs | Sites | restated-as-design | Stated as operational reasoning, no external fact claimed beyond DC location dependence |
| 22 | `Get-GPInheritance` returns direct links, applied links in precedence, inheritance blocked | OU/GPO links | verified | [^c08-gpinheritance] |
| 23 | gPLink `linkOptions` 0x1 disabled, 0x2 enforced | OU/GPO links | verified | [^c08-gpscope] |
| 24 | Block inheritance stored in `gPOptions`; enforced link applies through a block | OU/GPO links | verified | [^c08-gpprocessing] |
| 25 | Source regex was case-sensitive for `cn=` | OU/GPO links | corrected | Design fix (case-insensitive match) |
| 26 | `Get-GPO`, `Get-GPOReport`, `Get-GPPermission`, `Backup-GPO`, `Get-GPInheritance` are GroupPolicy cmdlets | GPO | verified | [^c08-gpmodule] |
| 27 | `Get-GPOReport` XML/HTML includes links, security filtering, WMI filtering, delegation, settings | GPO | verified | [^c08-gporeport] |
| 28 | `Get-GPPermission -All` returns every principal with permissions | GPO | verified | [^c08-gppermission] |
| 29 | Source link analysis missed site-linked GPOs | GPO | corrected | Design fix; site containers added |
| 30 | Intune migration flags conflicting settings | GPO | verified | [^c08-gpa-migrate] |
| 31 | Group Policy analytics imports XML, < 4 MB, Unicode | GPO | verified | [^c08-gpa] |
| 32 | Source queried DNS on GCs only | DNS | corrected | Design fix (all DCs) |
| 33 | `Get-DnsServerDnsSecZoneSetting` fields | DNS | verified | [^c08-dnssec] |
| 34 | `Get-DnsServerScavenging` returns aging/scavenging; zero-timestamp records are static and never scavenged | DNS | verified | [^c08-scavenging] |
| 35 | 90-day stale DNS threshold | DNS | restated-as-design | Review trigger, not deletion rule |
| 36 | `??` operator needs PowerShell 7 | DNS | corrected | Replaced with `switch` (PS 5.1 module) |
| 37 | Public Key Services containers and their purposes | AD CS | verified | [^c08-pkicontainers] |
| 38 | `certutil -ADCA`, `-CAInfo`, `-ping`, `-getreg`; `-config` string | AD CS | verified | [^c08-certutil] |
| 39 | `certutil -config -` is interactive | AD CS | corrected | Replaced with explicit config string; behavior of "-" as picker is common knowledge, not separately footnoted (low risk) |
| 40 | PSPKI cmdlets `Get-CACertificate`, `Get-CACrlDistributionPoint`, `Get-CAAuthorityInformationAccess` | AD CS | corrected | Gallery lists `Get-CRLDistributionPoint`, `Get-AuthorityInformationAccess`, no `Get-CACertificate` [^c08-pspki-gallery] |
| 41 | ESC naming from SpecterOps 2021 research (ESC1–8), tooling through ESC16 | AD CS | verified | [^c08-specterops] (Certify docs; PDF not opened, only cited by title/date from search summary) |
| 42 | MDI assesses ESC1, ESC2, ESC4, ESC6, ESC7 and definitions | AD CS | verified | [^c08-mdi-cert] |
| 43 | ESC6 remediation command | AD CS | verified | [^c08-mdi-cert] |
| 44 | Source ESC1 tested Digital Signature key usage | AD CS | corrected | Must test authentication EKU [^c08-mdi-cert] |
| 45 | Enrollee-supplies-subject 0x1; pend-all-requests 0x2 | AD CS | verified | [^c08-nameflag], [^c08-enrollflag] |
| 46 | EKU OIDs Client Auth, Smart Card Logon | AD CS | verified | [^c08-scl-oids] |
| 47 | PKINIT client auth OID 1.3.6.1.5.2.3.4 | AD CS | verified | [^c08-rfc4556] |
| 48 | anyExtendedKeyUsage = id-ce-extKeyUsage 0 (2.5.29.37.0) | AD CS | verified | [^c08-rfc5280] |
| 49 | Entra CBA authenticates X.509 against PKI without AD FS | AD CS | verified | [^c08-cba] |
| 50 | ESC1/ESC2 relevant only if template is published | AD CS | verified | [^c08-mdi-cert] (unpublished templates can't be requested) |
| 51 | `lastLogonTimestamp` updated only when older than sync interval; lag up to ~14 days | Computers | verified | [^c08-lastlogon] |
| 52 | 90-day stale threshold used by MDI | Computers | verified | [^c08-mdi-accounts] |
| 53 | Source delegation classification (protocol transition without targets; no RBCD) | Computers | corrected | [^c08-kcd], [^c08-rbcd-hop] |
| 54 | RBCD stored in `msDS-AllowedToActOnBehalfOfOtherIdentity`, exposed as `PrincipalsAllowedToDelegateToAccount` | Computers | verified | [^c08-rbcd-hop], [^c08-kcd] |
| 55 | Unconstrained delegation less secure than CredSSP; MDI reports on non-DC entities | Computers | verified | [^c08-rbcd-hop], [^c08-mdi-accounts] |
| 56 | DCs are expected to have unconstrained delegation | Computers | restated-as-design | Inferred from MDI scoping to non-DC entities; stated as "exclude them, as Defender for Identity does" |
| 57 | Privileged group list | Users | verified | [^c08-privlevels] |
| 58 | SDProp runs every 60 minutes on PDC emulator | Users | verified | [^c08-adminsdholder] |
| 59 | adminCount stays 1 after removal; inheritance stays disabled | Users | verified | [^c08-reducing] |
| 60 | Source orphan check used direct MemberOf match | Users | corrected | Design fix (recursive) |
| 61 | dMSA is WS2025, machine-bound, disables original password, defends Kerberoasting | Service accounts | verified | [^c08-dmsa] |
| 62 | gMSA for multi-server services; supports Task Scheduler | Service accounts, Drift | verified | [^c08-gmsa] |
| 63 | "Managed Identities" as service account target | Service accounts | corrected | Azure feature outside boundary; replaced with gMSA/dMSA on prem, workload identities in cloud (design) |
| 64 | LDAP returns at most 5,000 values per multivalued attribute | Groups | verified | [^c08-maxval] |
| 65 | Max 1,015 group memberships per principal | Groups | verified | [^c08-limits] |
| 66 | TDO stored in System container with partner name, SID, type, transitivity | Trusts | verified | [^c08-trusts] |
| 67 | `Get-ADTrust -Filter *` | Trusts | verified | [^c08-getadtrust] |
| 68 | trustAttributes bit values 0x1–0x40 and later bits | Trusts | verified | [^c08-trustattrs] |
| 69 | Access flows from trusted to trusting; inbound = this domain's users reach partner resources | Trusts | corrected | Source text was reversed; [^c08-trustdir] (Entra DS trust direction table; forest trust page) |
| 70 | `Test-ADTrust` cmdlet | Trusts | corrected | Not in ActiveDirectory module index [^c08-admodule]; replaced with netdom |
| 71 | `netdom trust ... /verify`, `netdom query trust /verify` (outbound only) | Trusts | verified | [^c08-netdom] |
| 72 | TrustMap → "Entra cross-tenant access settings" | Trusts | corrected | A trust doesn't convert; it identifies a partner for B2B/cross-tenant design [^c08-crosstenant] |
| 73 | Cross-tenant access settings govern B2B collaboration and direct connect | Trusts | verified | [^c08-crosstenant] |
| 74 | Microsoft on-demand assessments can run as sMSA/gMSA; Install-ADServiceAccount precache | Drift, Security | verified | [^c08-msa-assess] |
| 75 | KDS root key check `Get-KdsRootKey`; `New-ADServiceAccount -PrincipalsAllowedToRetrieveManagedPassword` | Security | verified | [^c08-msa-assess] |
| 76 | Gitea API `/api/v1`, `Authorization: token` | Gitea | verified | [^c08-gitea-usage] |
| 77 | Query-parameter tokens deprecated | Gitea | verified | [^c08-gitea-swagger] (securityDefinitions) |
| 78 | Branch endpoint fields; `old_branch_name` deprecated | Gitea | verified | [^c08-gitea-swagger] |
| 79 | Multi-file `POST /contents` with operations | Gitea | verified | [^c08-gitea-swagger] (ChangeFilesOptions / ChangeFileOperation) |
| 80 | `PUT .../contents/{filepath}` updates with sha | Gitea | verified | [^c08-gitea-swagger] |
| 81 | Issue `labels` = list of IDs | Gitea | verified | [^c08-gitea-swagger] (CreateIssueOption) |
| 82 | Hook fields `type`, `config` (url, content_type), `events`, `branch_filter` | Gitea | verified | [^c08-gitea-swagger] |
| 83 | Source's 422-then-PUT retry logic | Gitea | removed | Replaced by single multi-file commit; spec lists 422 as generic error |
| 84 | AD module cmdlets connect to ADWS on 9389 | Security, Troubleshooting | verified | [^c08-adws] |
| 85 | Port list (389/636/3268/3269/88/53/445/135/49152–65535) | Security | verified | [^c08-ports] |
| 86 | WinRM 5985/5986 | Security | verified | [^c08-winrm] |
| 87 | Source omitted ADWS and SMB | Security | corrected | [^c08-adws], [^c08-ports] |
| 88 | Retention 12/36 months, BitLocker, event log source, logs path | Security | restated-as-design | Program design rules |
| 89 | Source "Controlled" classification stamp | Security | removed | Brief: no classification stamps; replaced with "treat as sensitive" |
| 90 | `-ExecutionPolicy Bypass` | Security | corrected | Design: signed module under AllSigned/RemoteSigned |
| 91 | `TrustedHosts` hosts aren't authenticated; Kerberos domain doesn't need it | Troubleshooting | verified | [^c08-trustedhosts] |
| 92 | LDAP MaxPageSize default 1,000; raise only temporarily | Troubleshooting | verified | [^c08-ldappage] |
| 93 | Source advised raising MaxPageSize and wildcard TrustedHosts | Troubleshooting | corrected | Removed as unsafe |
| 94 | Weekly cadence, one branch and commit per run, two auto-issue classes | Pipeline | restated-as-design | Program design |
| 95 | GCC-Moderate boundary statement, FedRAMP framing in source header | Scope | removed | Boundary framing not needed for an on-prem assessment; no claim kept |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter figures 1–4 (old PNGs: topology model, pipeline data flow, OU/GPO linkage, Gitea sequence) | Replaced by `ch08-topology-discovery`, `ch08-assessment-pipeline`, `ch08-gpo-analysis` | The Gitea sequence is covered by the pipeline diagram and the endpoint table; no separate diagram |
| Title block, document control table, version, classification line | — | Document metadata; classification stamps not carried per brief |
| Table of contents | — | Replaced by chapter structure |
| 1.1 Purpose | Opening prose ("evidence-producing process") | Determinism and idempotence claims softened to "same layout, comparable runs" |
| 1.2 Scope — in scope | "What the assessment covers" table | — |
| 1.3 Scope — out of scope (sync config, Intune mapping, Azure) | Out-of-scope paragraph with links to Ch09 and GPO sunset program | Companion guide names replaced with B02 chapters and workbook pages |
| 1.3 Environment boundary callout (GCC-Moderate, Controlled) | — | Classification stamp and boundary statement dropped (see claims 89, 95) |
| 2.1 OS requirements | Prerequisites → Platform and modules | Version check corrected in Appendix C |
| 2.2 Required modules table | Module table | ADCSAdministration removed; PSPKI optional |
| 2.3 Required permissions | Rights table | DnsAdmins and Cert Publishers corrected; DA restated |
| 2.4 Output directory structure + creation script | Output layout tree; creation handled by `Initialize-FMPPath` in Appendix C | Standalone script folded into module |
| 2.5 Prerequisite verification script | Appendix C `Test-FMPPrerequisites`; chapter mention | — |
| 3.1 Forest-level discovery | Topology section; Appendix C | — |
| 3.2 Domain-level discovery | Topology section; Appendix C | — |
| 3.3 DC enumeration | Topology code sample; Appendix C | FSMO attribution simplified to `OperationMasterRoles` |
| 3.4 Site topology | Sites subsection; Appendix C | — |
| 3.5 FSMO role summary | Operations master roles subsection; Appendix C | — |
| 3.6 `Get-FMPForestTopology` wrapper | Appendix C | — |
| 4.1 Full OU enumeration | OU section item 1; Appendix C | — |
| 4.2 Recursive OU tree builder | Appendix C `Build-OUTree` | — |
| 4.3 OU-to-GPO link mapping | OU section; `Get-GPInheritance` code sample; Appendix C | Regex parsing replaced by `Get-GPInheritance` |
| 4.4 OU delegation analysis | OU section; Appendix C | — |
| 4.5 Visual tree renderer | Appendix C `Show-OUTree` | — |
| 4.6 `Get-FMPOUHierarchy` wrapper | Appendix C | Source wrapper omitted delegations; restored |
| 5 Critical-section callout | GPO section opening prose | — |
| 5.1 GPO enumeration | GPO "What to collect" table; Appendix C | — |
| 5.2 GPO report export | Table; Appendix C | — |
| 5.3 GPO link analysis | Table; site-link correction; Appendix C | — |
| 5.4 GPO settings decomposition | "Classify before you migrate"; Appendix C `Export-FMPGPOSettings` | — |
| 5.5 Unlinked and empty GPO detection | Classification list; Appendix C | Damaged `[xml]` line restored |
| 5.6 Conflicting GPO detection | Classification list; Appendix C `Find-GPOConflicts` | — |
| 5.7 GPO permission analysis | Table; Appendix C | — |
| 5.8 GPO backup | Table; Appendix C (`-SkipBackup` switch added) | — |
| 5.9 `Get-FMPGPOInventory` wrapper | Appendix C | — |
| 5.10 GPO output files table | Output layout; schema section; Appendix C schema | — |
| 6.1 DNS zone inventory | DNS table; Appendix C | GC-only scope corrected |
| 6.2 DNS record inventory | DNS table; Appendix C | `??` corrected |
| 6.3 Conditional forwarders and stub zones | DNS table; Appendix C | — |
| 6.4 DNSSEC status | DNS table; Appendix C | — |
| 6.5 Stale record detection | DNS stale paragraph; Appendix C | — |
| 6.6 SRV record validation | DNS table; Appendix C | — |
| 6.7 Scavenging configuration | DNS table; Appendix C | — |
| 6.8 `Get-FMPDNSAssessment` wrapper | Appendix C | Source wrapper didn't write DNSHealthReport.json; now does |
| 7.1 Enterprise CA discovery | AD CS Discovery; Appendix C | Replaced `certutil -config -` and PSPKI with directory query |
| 7.2 CA configuration enumeration | Appendix C (`certutil -ca.cert`) | `Get-CACertificate` removed |
| 7.3 Certificate template inventory | Appendix C (directory attributes) | PSPKI `Settings` properties replaced |
| 7.4 ESC security analysis + warning callout | Escalation patterns table and text; code sample; Appendix C | ESC1 logic corrected; ESC2/4/6 kept; ESC7 noted as not collected |
| 7.5 CRL and AIA configuration | Appendix C (directory CDP/AIA objects) | PSPKI cmdlet names corrected; HTTP locations noted as CA registry |
| 7.6 `Get-FMPPKIAssessment` wrapper | Appendix C | — |
| 8.1 Computer extraction | Computer section; Appendix C | — |
| 8.2 OS classification | Appendix C (`ComputersByOS.csv`) | — |
| 8.3 Stale computer detection | Staleness subsection; Appendix C | — |
| 8.4 Delegation analysis + unconstrained warning | Kerberos delegation subsection; Appendix C | Classification corrected; RBCD added; DCs excluded |
| 8.5 `Get-FMPComputerInventory` wrapper | Appendix C | — |
| 9.1 User extraction | Users section; Appendix C | — |
| 9.2 Privileged user identification | Privileged users subsection; Appendix C | — |
| 9.3 AdminSDHolder protected accounts | Privileged users subsection; Appendix C | Orphan logic corrected |
| 9.4 Service account identification | Service accounts table; Appendix C | dMSA added |
| 9.5 Group analysis | Groups subsection; Appendix C | 5,000-value and 1,015 limits added |
| 9.6 Circular nesting detection | Groups subsection; Appendix C | Rewritten with a queue |
| 9.7 User/group wrappers | Appendix C | — |
| 10.1 Trust enumeration | Trusts section; attribute table; Appendix C | Bit table sourced from MS-ADTS |
| 10.2 Trust validation | Verification subsection; Appendix C `Test-FMPTrust` | `Test-ADTrust` removed |
| 10.3 Trust direction analysis | Direction and posture subsection; Appendix C | Direction text corrected |
| 10.4 `Get-FMPTrustMap` wrapper | Appendix C | — |
| 11.1 Master orchestrator | Orchestration subsection; Appendix C | `-Domain` now honored; step failures recorded |
| 11.2 Pipeline output structure | Output layout tree | Merged with 2.4 (duplicate) |
| 11.3 Assessment data to Gitea (git clone) | Git integration (local-clone alternative paragraph) | — |
| 11.4 Artifact-to-planning mapping | "From artifact to plan" table | Trust and service-account rows corrected |
| 11.5 Drift detection (task + compare) | Drift subsection; Appendix C | Bypass removed; keyed compare added |
| 12.1 Posting results via API | Git integration table; Appendix C `Push-FMPAssessmentToGitea` | One multi-file commit |
| 12.2 Assessment branches | Git integration table; Appendix C | `old_ref_name` used |
| 12.3 Issues for critical findings | Git integration text; Appendix C | Label IDs resolved; DCs excluded |
| 12.4 Webhook configuration | Git integration table; Appendix C | Secret created once, not per run |
| 13.1 Minimum permissions by function | Rights table | — |
| 13.2 Creating the service account | Security → The assessment account | User-with-password replaced by gMSA |
| 13.3 Credential handling + warning | Security → assessment account | Token-in-file corrected |
| 13.4 Network requirements | Network paths table | ADWS and SMB added |
| 13.5 Data classification and handling | Handling list | Classification label dropped; rules kept as design |
| 14 Troubleshooting table | Troubleshooting table | TrustedHosts wildcard and MaxPageSize advice removed |
| Appendix A (module manifest, psm1 outline, installation) | Appendix C §C.1–C.3 | — |
| Appendix B (schema reference, example) | Chapter "Output schema reference" summary; Appendix C §C.4 | — |
| Appendix C C.1 Function reference | Quick reference table | Gitea functions renamed/added |
| Appendix C C.2 Run checklist | Run checklist | Trust verification step added |
| Appendix C C.3 Single-command run | Run checklist step 4 | — |
| Appendix D Companion document cross-reference | In-text links to Ch04, Ch05, Ch07, Ch09, Ch10 and workbook GPO, DNS, PKI pages | Companion guide titles (Server Build Guide, CLI Guide, Git ADR, Project Plan) not carried: not B02 pages and not verifiable as existing workbook pages |
| Closing footer (title, classification, repo URL) | — | Metadata |
