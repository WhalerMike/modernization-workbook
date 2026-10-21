# Verification — Chapter 09, Data Protection and Classification

Checked October 21, 2026 by writer W5. Sources: `docs/compliance/Vol_III_Book_05_Data_Protection_Purview.md` (9,020 words) and `docs/compliance/Vol_VI_Book_05_Data_Protection_Deployment.md` (1,160 words). 32 CFR Part 2002 was retrieved as XML from the eCFR versioner API (as in effect October 1, 2026) and its text extracted; NARA's CUI "About" page and the CUI Registry category list and category-detail pages (Privacy, Federal Taxpayer Information, Health Information, General Law Enforcement) were fetched directly from archives.gov. Microsoft claims came from the Microsoft Learn MCP tools; cmdlet parameter details were read from Microsoft's published cmdlet-help markdown (MicrosoftDocs/office-docs-powershell and Azure/azure-powershell repositories), which is the source of the Learn cmdlet pages. NIST SP 800-53 Rev. 5.2.0 and SP 800-53B baseline profiles came from NIST's OSCAL JSON; the CMVP FIPS 140-3 transition page from csrc.nist.gov; FedRAMP KSI text and Marketplace data from fedramp.gov. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Classification-gap findings (no scheme, per-container sharing, no Teams DLP, unowned keys, container-level access) | Classification gap | restated-as-design | Framing patterns from the program's assessments, labeled as such |
| 2 | Source: "Standard audit logs are mutable by a Global Administrator" | Gap list | removed | Not verifiable on Microsoft Learn |
| 3 | Label stored "in clear text in the metadata"; "stays with the content" | CASB | verified | Learn, "Learn about sensitivity labels" |
| 4 | Source: label "travels … as an encrypted property of the Office Open XML container" | CASB | corrected | Same page: clear-text metadata |
| 5 | Source: CASB "queries the file's label … through the Microsoft Graph API" | CASB | corrected / restated | Learn documents Defender for Cloud Apps session policies filtering on sensitivity label at upload/download; Graph mechanism not stated |
| 6 | EO 13556; NARA is Executive Agent; ISOO issued 32 CFR 2002 | CUI framework | verified | archives.gov/cui/about |
| 7 | All unclassified info requiring controls is CUI; agencies may not apply other controls | CUI framework | verified (new) | 32 CFR 2002.1(c) |
| 8 | CUI Basic / CUI Specified definitions; uncontrolled unclassified info under FISMA | CUI framework | verified | 32 CFR 2002.4(j), (r), (ss) |
| 9 | Source: framework "defines four operative categories" (Public, Internal, CUI-Basic, CUI-Specified) | CUI framework | corrected | 32 CFR 2002 defines CUI Basic and CUI Specified; Public/Internal are program tiers for uncontrolled info |
| 10 | CUI Basic at no less than moderate confidentiality; SP 800-53 applies; SP 800-171 for non-federal systems | CUI framework | verified | 32 CFR 2002.14(g), (h) |
| 11 | Banner marking: CUI or CONTROLLED; category markings mandatory for Specified, optional for Basic unless agency policy; no alternative markings | CUI framework | verified (new) | 32 CFR 2002.20(b) |
| 12 | Source: Privacy Act records are CUI Specified (CUI//SP-PRVCY) | Registry table | corrected | CUI Registry, Privacy: 5 USC 552a(b) listed as Basic; banner CUI, alternative CUI//PRVCY |
| 13 | Federal taxpayer information: 26 USC 6103 Specified; CUI//SP-TAX | Registry table | verified | CUI Registry, Federal Taxpayer Information |
| 14 | Health information: SP-HLTH for specified authorities, CUI for basic | Registry table | verified | CUI Registry, Health Information |
| 15 | Source: "Law Enforcement Sensitive (authority: agency-specific)" | Registry table | corrected | Registry category is General Law Enforcement (LEI), Basic for listed authorities |
| 16 | Source: "PII not covered by Privacy Act" as a CUI Basic example; "pre-decisional budget documents" | CUI framework | removed | Not checked against a specific registry category; replaced by registry-verified examples |
| 17 | Label taxonomy table (tiers, markings, encryption, holders) | Mapping | restated-as-design | Program design built on items 7–15 |
| 18 | Encryption permissions to users or email-enabled security, distribution or M365 groups; not non-mail-enabled security groups | Mapping rules | verified (new) | Learn, "Restrict access … to apply encryption" |
| 19 | Label encrypted-content expiry parameter accepts days or Never | Mapping rules; code | verified | New-Label help (EncryptionContentExpiredOnDateInDaysOrNever) |
| 20 | Source: CUI-Specified labels expire content after 365 / 90 days | Mapping; code | corrected / restated | Expiry made a records-officer decision; code uses Never |
| 21 | Content markings inserted by Office apps; labels applied outside Office (incl. SharePoint/OneDrive auto-labeling) apply metadata and encryption, not markings | Mapping rules | verified (new) | Learn, "Manage sensitivity labels in Office apps" |
| 22 | `Connect-IPPSSession` GCC needs no ConnectionUri; GCC High URIs | Code | verified | Connect-IPPSSession help |
| 23 | Source: `-LabelActions` hashtable for content marking | Code | corrected | New-Label help: LabelActions "reserved for internal Microsoft use"; replaced by ApplyContentMarkingHeader* |
| 24 | New-Label requires Name, DisplayName, Tooltip; ParentId accepts name; ContentType values; EncryptionProtectionType Template; EncryptionRightsDefinitions syntax | Code | verified | New-Label help |
| 25 | Usage-right encodings VIEW, VIEWRIGHTSDATA, DOCEDIT, EDIT, PRINT, EXTRACT, REPLY, REPLYALL, FORWARD, OBJMODEL | Code | verified | Learn, "Configure usage rights for the Azure Rights Management service" |
| 26 | Source: label policy with SharePointLocation, OneDriveLocation, TeamsLocation | Code | corrected | New-LabelPolicy help: SharePointLocation reserved for internal use; no Teams or OneDrive location; scope via ExchangeLocation (mailboxes or All) |
| 27 | Source: label display names "CUI // Basic", "CUI // SP" | Code | corrected | Not valid CUI markings (32 CFR 2002.20); display names and headers now CUI, CUI//SP-TAX |
| 28 | Built-in U.S. SITs (SSN, ITIN, bank account, driver's license, U.S./U.K. passport), DEA number, IP address | SITs | verified | Learn SIT entity definitions list |
| 29 | Source: built-in "U.S. Employer Identification Number" SIT | SITs | corrected | Not in the entity definitions list; custom SIT required |
| 30 | Source custom SIT built as hashtable → JSON with New-DlpSensitiveInformationType | SITs | corrected | Custom SITs import as XML rule packages via New-DlpSensitiveInformationTypeRulePackage -FileData; script not carried |
| 31 | Trainable classifiers: 50–500 positive, 150–1,500 negative; custom English only; seeded from SharePoint folders | Classifiers | verified / corrected | Learn, trainable classifiers get-started and learn-about. Source gave "50–500 sample documents" only |
| 32 | Source: "Plan for 3–4 weeks of training and validation" | Classifiers | removed | Not documented; Learn states processing within 24 hours and a preview shortened workflow |
| 33 | Auto-labeling for Exchange, SharePoint, OneDrive and Office apps available in GCC and GCC High; ML classifiers client-side available | Auto-labeling | verified (new) | Learn, Purview GCC and GCC High planning pages, Step 4 |
| 34 | Auto-label Mode values and meaning | Auto-labeling code | verified | New-AutoSensitivityLabelPolicy help |
| 35 | Auto-label rule requires -Workload (Exchange, SharePoint, OneDriveForBusiness); ContentContainsSensitiveInformation syntax with minCount/minConfidence | Auto-labeling code | verified / corrected | New-AutoSensitivityLabelRule help. Source omitted -Workload, used `confidenceLevel` and `-SentToScope` (not a parameter) |
| 36 | Source: "SharePoint scanner" crawls libraries for service-side labeling | Auto-labeling | corrected | Restated as service-side auto-labeling policies; "scanner" is the on-premises scanner product |
| 37 | DLP for files and email, Teams, endpoint DLP, on-premises scanner, Defender for Cloud Apps integration available in GCC and GCC High | DLP | verified (new) | Learn Purview GCC and GCC High pages |
| 38 | Device onboarding shared with Defender for Endpoint; Windows 10/11, macOS; Windows Server 2019+ with server support off by default | DLP | verified / corrected | Learn, device onboarding overview; endpoint DLP get started. Source said Endpoint DLP "requires the device to be onboarded to Defender for Endpoint" |
| 39 | Defender for Cloud Apps session policies require apps onboarded to Conditional Access app control | DLP surfaces | verified | Learn, information protection policies page |
| 40 | Minimum DLP baseline table | DLP | restated-as-design | Program design; source's "50 files in 10 minutes" threshold generalized |
| 41 | Source: `-ContentContainsSensitivityLabel` parameter | DLP code | corrected | Not a parameter; labels go in ContentContainsSensitiveInformation groups with type Sensitivity (New-DlpComplianceRule help example) |
| 42 | Source: `-Severity`, `-GenerateAlert SecurityManager`, `-SentToScope` | DLP code | corrected | Help: ReportSeverityLevel; GenerateAlert takes email or SiteAdmin; SentToScope not a parameter (AccessScope used) |
| 43 | Endpoint restriction settings Print, CopyPaste, RemovableMedia, NetworkShare; values Audit, Block, Ignore, Warn; Block/Warn need NotifyUser | DLP code | verified / corrected | New-DlpComplianceRule help. Source used CopyToClipboard, CopyToRemovableMedia, CopyToNetworkShare, UploadToCloud and "AuditOnly" |
| 44 | BlockAccessScope PerUser blocks external users | DLP code | verified | New-DlpComplianceRule help |
| 45 | DLP policy Mode values incl. TestWithNotifications | DLP code | verified | New-DlpCompliancePolicy help |
| 46 | FMP-DET-05 and FMP-DET-06 detections | DLP; deployment | verified (internal) | Chapter 11 rule table in this book |
| 47 | RMS tenant key is the root key; options Microsoft-managed, BYOK, DKE supplement | Keys | verified | Learn, "Managing the root key for your Azure Rights Management service" |
| 48 | BYOK: RSA 2048 only; get, decrypt, sign; Premium for HSM; dedicated vault recommended; govus region guidance | Keys | verified (new) | Learn, "Bring your own key for the Azure Rights Management service root key" |
| 49 | Source table: "Yes — AIP BYOK" per CUI tier | Keys | corrected | BYOK replaces the tenant key for all label encryption; per-label key choice is DKE |
| 50 | Customer Key: two subscriptions, vault per workload in each, soft delete + purge protection 90 days, RSA up to 4,096, keys must not expire, onboarding service rejects expiring keys | Keys | verified (new) | Learn, "Set up Customer Key" |
| 51 | Availability key fallback logged as CustomerKeyServiceEncryption / "Fallback to availability key" | Keys | verified (new) | Learn, availability key page |
| 52 | Source: SharePoint BYOK and Exchange Customer Key from a single Key Vault key | Keys | corrected | Customer Key requires two keys in two vaults in two subscriptions per workload |
| 53 | DKE: two keys, both required; loses eDiscovery, search/indexing, Office web/coauthoring, Copilot | Keys | verified (new) | Learn, "What is Double Key Encryption (DKE)?" |
| 54 | Customer Key, BYOK, DKE available in GCC and GCC High | Keys | verified | Learn Purview GCC and GCC High pages, Encryption rows |
| 55 | Key Vault Premium: FIPS 140-3 Level 3 Marvell LiquidSecurity HSMs; Managed HSM single-tenant FIPS 140-3 Level 3, customer-held security domain | Keys | verified / corrected | Learn, About Azure Key Vault; Managed HSM control-your-data. Source said "FIPS 140-3 validated; 140-2 modules while CMVP Active" |
| 56 | Source: "pending the 2026-09-21 Historical transition" | Keys | corrected (stale) | CSRC FIPS 140-3 transition page: 140-2 validations to Historical List September 21, 2026 (timeline shows September 22); CMVP supports use for existing systems |
| 57 | Source: "Premium tier with HSM-protected keys is required to satisfy SC-12 and SC-13 at Moderate" | Keys | restated | No such requirement found; chapter says SC-13 depends on the validated module |
| 58 | New-AzKeyVault has no -EnableSoftDelete / -EnableRbacAuthorization; RBAC default; -DisableRbacAuthorization; -EnablePurgeProtection; -SoftDeleteRetentionInDays | Keys code | verified / corrected | New-AzKeyVault help |
| 59 | Add-AzKeyVaultKey -Destination HSM, -KeyType, -Size (2048/3072/4096 for RSA) | Keys code | verified | Add-AzKeyVaultKey help |
| 60 | Set-AzKeyVaultKeyRotationPolicy -PolicyPath with JSON (lifetimeActions, attributes.expiryTime) | Keys code | verified / corrected | Set-AzKeyVaultKeyRotationPolicy help example 1. Source passed hashtables to -KeyRotationLifetimeAction |
| 61 | TDE server identity role "Key Vault Crypto Service Encryption User" (RBAC) or get/wrapKey/unwrapKey | Keys code | corrected | Learn, Azure SQL TDE with CMK, permissions. Source used "Key Vault Crypto User" |
| 62 | Add-AzSqlServerKeyVaultKey and Set-AzSqlServerTransparentDataEncryptionProtector -AutoRotationEnabled; rotation within 24 hours | Keys code | verified | Az.Sql help; Learn, rotate the TDE protector |
| 63 | Connect-AzAccount -Environment AzureUSGovernment | Keys code | verified | Learn, Connect to Azure Government with PowerShell |
| 64 | Source: "12-month cryptoperiod … within the recommended cryptoperiods of NIST SP 800-57 Part 1" | Keys | restated-as-design | SP 800-57 not opened; 12 months stated as program choice |
| 65 | AWS KMS and CloudHSM in both AWS FedRAMP offerings | Other clouds | verified (new) | products.json certified_services |
| 66 | Source: "the Purview Data Map reaches multi-cloud sources" | Other clouds | corrected / restated | Labeling in Data Map is preview (Learn); program doesn't rely on it for evidence |
| 67 | Source: OCI Vault / Dedicated KMS; External Key Store / HYOK pattern | Other clouds | removed | Not verified this pass; chapter keeps the per-platform custody principle generically |
| 68 | Source: Audit (Premium) provides immutable storage and cryptographic signatures bound to a trusted timestamp, satisfying AU-10 | Non-repudiation | removed / corrected | Learn audit solutions overview lists retention policies, longer retention, intelligent insights, API bandwidth; no signing or immutability feature |
| 69 | Audit (Premium) one-year default for some workloads, ten years with add-on; available in GCC and GCC High | Non-repudiation | verified | Learn audit solutions overview; Purview GCC/GCC High pages |
| 70 | Source: "Standard audit log retention is 90 days" (control table) | Non-repudiation | corrected (not carried) | Audit (Standard) is 180 days (Learn comparison table); retention detail left to Ch04, which states the same |
| 71 | AU-10 and SC-12(1) in High baseline only; AC-16 in no baseline | Non-repudiation; control map | verified | SP 800-53B Moderate and High OSCAL profiles, release 5.2.0 |
| 72 | AU-10 design (export to write-once storage) | Non-repudiation | restated-as-design | Program design |
| 73 | Deployment sequence; honest limits | Deployment; limits | restated-as-design | Vol VI Book 05 design positions |
| 74 | Source KSI mapping: KSI-CNA for classification and payload boundary, KSI-SVC for keys, KSI-MLA for audit | KSI | corrected | Current indicators: KSI-SVC-SIN, KSI-SVC-ASM, KSI-SVC-RUD, KSI-MLA-LET; text and related controls quoted from fedramp.gov KSI page; KSI-CNA indicators cover privileges, intended state, attack surface, traffic, availability |
| 75 | Source deployment step: retention "meets the OMB M-26-14 event-logging maturity level" | Deployment | corrected (not carried) | M-26-14 sets searchable/retrievable windows, not maturity levels (settled fact in brief); retention linked to Ch04 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol III Bk 05 front matter, FOUO banner, Draft Proposal callout, Date Code | — | Stamps dropped per brief |
| Series Context | Opening paragraphs | Recast with workbook book links |
| What This Document Addresses | Opening | Carried; control list updated (AC-16 added, MP narrowed, AU-10 and SC-17 moved) |
| Enforcement Dimensions callout | Opening | Merged into the pipe-versus-payload framing; "required for a complete FedRAMP Moderate authorization" claim dropped (no source) |
| The Classification Gap — What an Assessor Finds | "The classification gap" | Carried as framing patterns; AU-10 mutability finding removed (claim 2) |
| Why CASB Alone Is Insufficient | Same heading | Carried and corrected (claims 3–5); Vol I Book 06 reference → Book 09 Ch05 |
| Federal Data Classification Taxonomy — The Federal CUI Framework | "The federal CUI framework" | Carried and corrected (claims 6–16) |
| Mapping to Microsoft Purview Sensitivity Labels (table) | "Mapping CUI to sensitivity labels" | Carried and corrected; new diagram |
| Creating the Label Taxonomy in the Compliance Portal (script) | "The label taxonomy as code" | Script rewritten and verified (claims 22–27) |
| Label Policy Scope callout | Correction paragraph after the script | Corrected (claim 26) |
| Automatic Labeling — The Labeling Gap | Automatic labeling intro | Carried |
| Sensitive Information Types (table) | SIT paragraph | Table replaced by verified list; NIST-control-relevance column dropped (unsourced mapping) |
| Custom SIT script | SIT paragraph | Not carried: format wrong (claim 30); correct mechanism described |
| Trainable Classifiers + training-data warning | Trainable classifiers | Carried and corrected (claims 31–32) |
| Auto-Labeling Policies + script | Auto-labeling policies | Script rewritten (claims 34–35); Exchange outbound rule not carried (needed parameters not verified) |
| Simulation Mode First callout | Auto-labeling paragraph | Carried |
| DLP Policy Architecture — Three Enforcement Surfaces | DLP surfaces table | Carried and corrected (claim 38) |
| Core DLP Policies table + script | Minimum baseline table and DLP script | Carried; script rewritten (claims 41–45) |
| Endpoint DLP Configuration + script + warning | Endpoint part of DLP script; onboarding paragraph | Carried and corrected (claims 38, 43) |
| Azure Key Vault — Federal Key Management Hierarchy (root CA, issuing CA, CMK, DEK) | Keys section; Book 07 | CMK/DEK carried; root and issuing CA content belongs to Book 07 (PKI) |
| Creating and Configuring Azure Key Vault with HSM + script | Key Vault script | Rewritten (claims 58–59); USGov region comment generalized; agency-meta placeholders removed |
| Assigning Managed Identity Access + script | Key Vault script (role assignment) | Corrected role (claim 61); break-glass Key Vault Administrator and diagnostic-setting parts not carried (break-glass is Book 04; resource-log emission is Ch04) |
| Configuring SQL Server TDE with CMK + script | Key Vault script | Carried and verified (claim 62); Arc SQL → Book 06 |
| Key Rotation Policy + script | Rotation JSON and text | Corrected (claims 60, 64); Customer Key no-expiry warning added |
| Immediate Rotation on Suspected Compromise callout | — | Not carried: procedure (rotate, re-point protector, keep old version until re-encrypted) partly conflicts with "always latest version" TDE behavior; incident handling belongs to Ch11 |
| Non-Repudiation and Audit Integrity — AU-10 | "Non-repudiation is a separate question" | Carried and corrected (claims 68–72) |
| Enabling Purview Audit Premium + script | — | Not carried: retention policies and licensing are Ch04's scope; `Set-AdminAuditLogConfig` and `New-UnifiedAuditLogRetentionPolicy` usage not re-verified here |
| High-Value Audit Events table | Non-repudiation paragraph (MailItemsAccessed, search events) | Summarized; full event treatment in Ch04 |
| Querying Purview Audit Logs + script | — | Not carried; Ch04 covers audit retrieval |
| AU-10 vs AU-12 callout | Non-repudiation section | Merged |
| Certificate Practice Statement — SC-17, RFC 3647 structure, InfoBlox + Key Vault, Trust-Anchor Management, CRL/OCSP script | Pointer to Book 07 Ch05 and the GitHub compliance volume | PKI is Book 07's subject; RFC 3647 outline stays in the volume |
| Multi-Cloud Key Management table and doctrine | "Keys on other clouds" | Carried in part (claims 65–67) |
| NIST Control Closure Table + Closure Necessity quote | "The control map for this chapter" | Condensed and corrected (AC-16, SC-12(1), MP interpretation); "necessity anchors" language dropped (internal series doctrine) |
| Interpretive note on the MP family | Paragraph after the control map | Carried |
| FedRAMP 20x KSI Alignment callout | KSI section | Carried and corrected (claim 74) |
| Vol VI Bk 05 — What This Document Addresses | Taxonomy-as-code intro | Carried |
| Vol VI — The Federal CUI Taxonomy as Code (table) | Mapping table | Merged with Vol III table |
| Vol VI — Illustrative artifact script | Label script | Merged and corrected (ParentId by name, no undefined `$agencyDomainRights`) |
| Vol VI — Deployable Artifacts (multi-CSP substitution table) | Keys on other clouds; taxonomy as code | Substitution products (Macie, Symantec/Forcepoint DLP, Terraform, CloudTrail Lake) not carried: not verified this pass; mechanism kept |
| Vol VI — Deployment steps | "Deployment sequence" | Carried and corrected (claim 75); "key vault first because labels depend on it" restated (labels don't require BYOK) |
| Vol VI — Closure Necessity | Opening and CASB section | Merged |
| Vol VI — Controls Operationalized | Control map | Merged |
| Vol VI — Honest Limits | "Honest limits" | Carried |
| Vol VI — Cross-References, Provenance | Chapter links; warning callout | Book VI-xx references mapped to Ch02, Ch07, Ch11; provenance note replaced by the illustrative-code callout |
