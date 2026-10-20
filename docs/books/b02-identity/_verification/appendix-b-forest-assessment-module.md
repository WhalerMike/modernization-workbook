# Verification — Appendix C, Forest Assessment Module

Source: `docs/operational-guides/ad-interaction-guide.md`, Appendix A (module manifest, psm1 outline, installation), Appendix B (schema reference), and the function bodies in §§2.5–12.4 that the psm1 outline referenced. Chapter-level claims are logged in `08-assessing-the-forest.md` in this folder; this log covers cmdlets, parameters, constants and API fields used in the code.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | All ActiveDirectory cmdlets used exist (`Get-ADForest`, `Get-ADDomain`, `Get-ADDomainController`, `Get-ADReplicationSite/SiteLink/Subnet`, `Get-ADOrganizationalUnit`, `Get-ADObject`, `Get-ADRootDSE`, `Get-ADUser`, `Get-ADComputer`, `Get-ADGroup`, `Get-ADGroupMember`, `Get-ADServiceAccount`, `Get-ADTrust`, `Install-ADServiceAccount`, `Test-ADServiceAccount`) | Throughout | verified | [^aB-admodule] |
| 2 | `Test-ADTrust` | Trusts | corrected | Not in module index [^aB-admodule]; `Test-FMPTrust` uses netdom |
| 3 | `netdom trust <trusting> /domain:<trusted> /verify` syntax; admin creds | `Test-FMPTrust` | verified | [^aB-netdom] |
| 4 | PSPKI cmdlet names; no `Get-CACertificate` | Corrections table | verified | [^aB-pspki-gallery] |
| 5 | PSPKI no longer actively supported | Corrections table | verified | [^aB-pspki] |
| 6 | `Get-GPPermission -All -DomainName`; output type GPPermission with Trustee | GPO | verified (partly) | [^aB-gppermission]; `Trustee.SidType` sub-property not confirmed — flagged in text to check with `Get-Member` |
| 7 | `Get-GPOReport -Guid -ReportType Xml/Html -Path -Domain`; `Get-GPInheritance -Target -Domain` | GPO | verified | Chapter footnotes c08-gporeport, c08-gpinheritance |
| 8 | `Get-GPO -All -Domain`, `Backup-GPO -All -Domain -Path` | GPO | verified (cmdlets) | GroupPolicy module index (c08-gpmodule); `-Domain` on these two assumed from the module's common pattern, unverified per-cmdlet |
| 9 | DNSSEC zone setting fields | DNS | verified | [^aB-dnssec] |
| 10 | Scavenging fields; static records never scavenged | DNS | verified | [^aB-scavenging] |
| 11 | `??` operator incompatible with PS 5.1 | DNS | corrected | Replaced with `switch` (language fact; module declares 5.1) |
| 12 | DNS record data property names (`IPv4Address`, `HostNameAlias`, `NameServer`, `PtrDomainName`, `MailExchange`, `DomainName`, `DescriptiveText`, `PrimaryServer`) | `Get-FMPDnsRecordData` | unverifiable | Not individually checked on Learn; unknown types fall to empty string; flagged for test-forest validation |
| 13 | Enrollee supplies subject = 0x1 | PKI | verified | [^aB-nameflag] |
| 14 | Pend all requests = 0x2 | PKI | verified | [^aB-enrollflag] |
| 15 | Enroll extended right GUID `0e10c968-78fb-11d2-90d4-00c04f79dc55` | PKI | verified | [^aB-enroll] |
| 16 | Client Auth `1.3.6.1.5.5.7.3.2`, Smart Card Logon `1.3.6.1.4.1.311.20.2.2` | PKI | verified | [^aB-scl-oids] |
| 17 | PKINIT `1.3.6.1.5.2.3.4` | PKI | verified | [^aB-rfc4556] |
| 18 | Any Purpose `2.5.29.37.0` | PKI | verified | [^aB-rfc5280] |
| 19 | Template attributes `msPKI-Certificate-Name-Flag`, `msPKI-Enrollment-Flag`, `msPKI-RA-Signature`, `msPKI-Template-Schema-Version`, `msPKI-Certificate-Application-Policy`, `pKIExtendedKeyUsage`, `msPKI-Cert-Template-OID` | PKI | verified | Microsoft AD schema attribute pages (ms-PKI-* attributes; ms-PKI-Template-Schema-Version fetched); listed under c08/aC flag footnotes |
| 20 | Enrollment Services / Certificate Templates / CDP / AIA containers | PKI | verified | [^aB-pkicontainers] |
| 21 | `pKIEnrollmentService` holds `certificateTemplates`, `dNSHostName` | PKI | verified | PKI-Enrollment-Service class (Learn adschema), and decommission article; config string `host\CA` per certutil docs [^aB-certutil] |
| 22 | `certutil -config <cfg> -ca.cert <file>`, `-getreg policy\EditFlags` | PKI | verified | [^aB-certutil] |
| 23 | ESC1/2/4/6 conditions and remediation; ESC7 needs CA sensor | PKI | verified | [^aB-mdi-cert] |
| 24 | Unpublished templates can't be requested | PKI | verified | [^aB-mdi-cert] (ESC1 remediation step 2.5) |
| 25 | `PrincipalsAllowedToDelegateToAccount` maps to `msDS-AllowedToActOnBehalfOfOtherIdentity`; valid `-Properties` for `Get-ADComputer` | Computers | verified | [^aB-kcd] |
| 26 | Privileged group list | Users | verified | [^aB-privlevels] |
| 27 | Orphaned adminCount behavior | Users | verified | [^aB-reducing] |
| 28 | 5,000-value cap | Groups | verified | [^aB-maxval] |
| 29 | gMSA class `msDS-GroupManagedServiceAccount` | Users | verified | [^aB-gmsaclass] |
| 30 | MSA class `msDS-ManagedServiceAccount` | Users | unverifiable | Not opened on Learn; follows the schema naming of the gMSA class; misclassification only affects which JSON file an MSA lands in |
| 31 | dMSA is WS2025-only | Users | verified | [^aB-dmsa] |
| 32 | trustAttributes bits incl. 0x80–0x800 | Trusts | verified | [^aB-trustattrs] |
| 33 | ADForestMode / ADDomainMode include Windows2025 values | Schema | verified | [^aB-forestmode], [^aB-domainmode] |
| 34 | Gitea multi-file contents endpoint fields (`branch`, `new_branch`, `message`, `files[].operation/path/content`) | Gitea | verified | [^aB-gitea] |
| 35 | `GET /repos/{owner}/{repo}/labels` returns `id`, `name`; issue `labels` are IDs | Gitea | verified | [^aB-gitea] |
| 36 | Hook `type` enum includes `gitea`; `config` requires `url`, `content_type` | Gitea | verified | [^aB-gitea] |
| 37 | `Authorization: token <value>` | Gitea | verified | [^aB-gitea-usage] |
| 38 | Request size limits on large runs | Gitea | restated-as-design | Advice to batch; no limit value claimed |
| 39 | `New-ScheduledTaskPrincipal -LogonType Password` is a valid value; Task Scheduler supports gMSA | Schedule | verified | [^aB-taskprincipal] |
| 40 | gMSA + `-LogonType Password` runs with no stored password | Schedule | restated-as-design | Not found stated on Learn; text says confirm in a test task |
| 41 | `Install-ADServiceAccount` precache proves password retrieval | Schedule | verified | [^aB-msa-assess] |
| 42 | Source manifest GUID `a1b2c3d4-...` | C.1 | corrected | Placeholder; replaced with instruction to use `New-Guid` |
| 43 | Source ProjectUri `https://github.com/example-org/fmp` | C.1 | removed | Placeholder URL |
| 44 | Example JSON values (hosts, GUIDs, counts) | C.4 | restated-as-design | Illustrative values, `contoso.com` |
| 45 | Win32_OperatingSystem version string compare | Prereqs | corrected | `[version]` cast |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Appendix A.1 Module manifest | C.1 | GUID placeholder replaced; ProjectUri removed; function list updated (Test-FMPTrust, Invoke-FMPFindingIssues, Push-FMPAssessmentToGitea) |
| Appendix A.2 Module file outline (`{ ... }` stubs) | C.2 full bodies, in file order | Classification and environment `.NOTES` removed (no stamps) |
| §2.5 Test-FMPPrerequisites | C.2 Prerequisites | Version compare corrected; PSPKI optional |
| §2.4 directory creation script | C.2 helpers `Initialize-FMPPath`, `Get-FMPDomainPath` | Folded into module |
| §3.1–3.6 topology code and wrapper | C.2 Forest topology | Merged into one function writing all topology files |
| §4.1–4.6 OU code and wrapper | C.2 OU hierarchy | `Get-GPInheritance` replaces regex; delegations added to wrapper |
| §5.1–5.9 GPO code and wrapper | C.2 Group Policy | Site links, damaged empty-GPO line, conflicts output |
| §6.1–6.8 DNS code and wrapper | C.2 DNS | All DCs; `??` removed; health report written |
| §7.1–7.6 PKI code and wrapper | C.2 AD CS | Directory-based discovery; ESC logic corrected; PSPKI calls removed |
| §8.1–8.5 computer code and wrapper | C.2 Computers | Delegation classification and DC flag |
| §9.1–9.7 user/group code and wrappers | C.2 Users, groups and service accounts | Orphan logic; circular nesting rewritten; MSA/gMSA files written |
| §10.1–10.4 trust code and wrapper | C.2 Trusts | Bits from MS-ADTS; direction text corrected; netdom verification split out |
| §11.1 Invoke-FMPADAssessment | C.2 Orchestrator and manifest | Honors `-Domain`; step status in manifest; manifest excludes itself |
| §11.3 git clone commit | Chapter 08 Git integration (alternative) | Not repeated in code |
| §11.5 schedule + Compare-FMPAssessments | C.2 Drift comparison; Optional: webhook and schedule | Keyed comparison added; Bypass removed |
| §12.1 Push-FMPFileToGitea | C.2 Gitea `Push-FMPAssessmentToGitea` | One multi-file commit replaces per-file POST/422/PUT |
| §12.2 branch creation | Folded into `new_branch` of the contents call | — |
| §12.3 New-FMPSecurityIssue, Invoke-FMPFindingIssues | C.2 Gitea | Label IDs resolved; DCs excluded |
| §12.4 webhook | C.2 Optional: webhook and schedule | Secret not regenerated |
| §13.2 service account creation | Chapter 08 Security (gMSA) | User account with typed password not carried |
| Appendix A.3 Installation | C.3 | Regex escaping of module path corrected |
| Appendix B.1 ForestTopology.json table + example | C.4 ForestTopology.json | Fields extended to match code; example expanded |
| Appendix B.2 GPOInventory.json | C.4 GPOInventory.json | Example added |
| Appendix B.3 AssessmentManifest.json | C.4 AssessmentManifest.json | `Steps` field added; example added |
| Appendix B.4 Additional schema files | C.4 Other files table; PKISecurityReport and TrustMap examples | — |
