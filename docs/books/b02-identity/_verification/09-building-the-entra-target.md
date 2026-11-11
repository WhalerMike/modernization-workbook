# Verification — Chapter 09, Building the Entra ID Target

Source: `docs/operational-guides/identity/identity-modernization.md` (front matter and §1–§8). All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | GCC uses worldwide endpoints (`graph.microsoft.com`); GCC High uses `graph.microsoft.us` | Purpose and scope | verified | learn.microsoft.com/graph/deployments |
| 2 | MSOnline and AzureAD modules retired; not used | Purpose and scope | verified (detail in Appendix D) | Entra what's-new archive, Jan 2025 |
| 3 | Unverified UPN suffix: Entra ID builds `MailNickName@initial domain` UPN | User objects | verified (added) | plan-connect-userprincipalname |
| 4 | `onPremisesSecurityIdentifier` carries the SID and must be unique | User objects | corrected (source said "preserved for hybrid Kerberos") | how-to-connect-install-existing-tenant |
| 5 | AD supports "1,000+ attributes per user" | User objects | removed | not verified |
| 6 | User attribute mapping table (Graph property names) | User objects | verified | Graph user resource v1.0 |
| 7 | `whenCreated` → `createdDateTime` is the sync date, not AD creation date | User table | verified (added nuance) | lifecycle-workflow-on-premises (createdDateTime note) |
| 8 | On-prem dynamic distribution groups don't sync; recreate with OPATH | Distribution groups | restated-as-design | carried from source; not separately verified (Exchange behavior well established) |
| 9 | Service account type → target table | Service accounts | corrected (MSA → managed identity is only for Azure-hosted workloads; gMSA target split) | managed-identities overview |
| 10 | AU licensing: free to create, P1 per AU admin, P1 per member for dynamic AUs | OUs | corrected (source: "P1 feature") | administrative-units; Entra licensing |
| 11 | Placement vs attributes inversion | Design principle | restated-as-design | program design |
| 12 | SDProp runs every 60 minutes on the PDC emulator | AdminSDHolder | verified | Appendix C: Protected Accounts and Groups |
| 13 | Protected groups list | AdminSDHolder | corrected (source included Cert Publishers; omitted Administrator, krbtgt, Key Admins, Enterprise Key Admins) | Appendix C; Reducing the AD Attack Surface |
| 14 | `adminCount` stays 1 after removal from protected group | AdminSDHolder | verified (added) | Reducing the AD Attack Surface |
| 15 | Protected actions "(preview)" are the Entra equivalent of AdminSDHolder | AdminSDHolder / Protected actions | corrected (not an equivalent; described as complementary; Microsoft's privileged-roles page still labels it preview) | protected-actions-overview; privileged-roles-permissions |
| 16 | Managed identity types; user-assigned recommended | Object model | verified (added) | managed-identities overview |
| 17 | Multi-forest: "each forest requires its own Entra Connect instance" | Tenant boundary | corrected (Connect Sync handles connected forests from one server; Cloud Sync handles disconnected forests) | connect-to-cloud-sync-decision-guide |
| 18 | Licensing table: access reviews P2, entitlement management Governance | Licensing | corrected (both now require Entra ID Governance for member users; some capabilities under P2) | id-governance/licensing-fundamentals |
| 19 | Lifecycle Workflows require Entra ID Governance | Licensing | verified | licensing-fundamentals |
| 20 | Dynamic groups need P1 per unique member | Licensing | verified | groups-dynamic-membership |
| 21 | PIM and PIM for Groups require P2 | Licensing | verified | Entra licensing |
| 22 | Cross-tenant sync users P1, groups Governance | Licensing | verified (added) | Entra licensing |
| 23 | CA for workload identities needs Workload ID Premium | Licensing | verified | conditional-access/workload-identity |
| 24 | Entra Suite contents; Governance needs P1/P2 prerequisite; Gov SKUs in GCC | Licensing | verified (added) | licensing-fundamentals |
| 25 | P1 in M365 E3/E5; P2 in E5 | Licensing | verified | licensing-fundamentals |
| 26 | Risk-based CA requires P2 | Licensing | verified | concept-identity-protection-policies |
| 27 | SSPR row in licensing table | Licensing | removed | not verified in the sources consulted |
| 28 | Dynamic rule operators | Dynamic rules | verified | groups-dynamic-membership |
| 29 | Dynamic membership "minutes to several hours" | Dynamic rules | corrected (restated as "not immediate") | troubleshoot-dynamic-groups |
| 30 | Attribute write permissions as a dynamic-group security boundary | Dynamic rules | verified (added) | groups-dynamic-membership |
| 31 | `memberOf` preview ends November 3, 2026 | Dynamic rules | verified (added) | groups-dynamic-rule-member-of |
| 32 | Cloud Sync is Microsoft's strategic direction, recommended for most | Sync engine | verified (added; reverses source recommendation) | connect-to-cloud-sync-decision-guide |
| 33 | Cloud Sync: no group writeback | Sync matrix | corrected (Cloud Sync provisions groups to AD; Connect GWB v2 discontinued June 30, 2024; v1 only for M365 groups) | group-writeback-cloud-sync; how-to-connect-group-writeback-disable |
| 34 | Cloud Sync: Exchange hybrid "limited" | Sync matrix | corrected (supported) | decision guide; exchange-hybrid-writeback |
| 35 | Cloud Sync scale 150K objects/domain, 50K members/group; Connect 250K members | Sync matrix | verified (added) | decision guide |
| 36 | Device writeback discontinued in favor of Cloud Kerberos Trust | Sync matrix | verified | decision guide |
| 37 | PTA "separate agent" for Cloud Sync | Sync matrix | corrected (Cloud Sync doesn't configure PTA; PTA keeps working) | decision guide |
| 38 | GCC-Moderate support "verify parity" | Sync matrix | corrected (both support US Government clouds) | decision guide |
| 39 | Both engines can run in the same forest with exclusive scopes | Sync recommendation | verified | hybrid common-scenarios |
| 40 | Four filtering methods; order of precedence | Filtering | restated-as-design (Connect Sync behavior; Cloud Sync attribute filtering limited verified) | decision guide |
| 41 | Sync-rule expressions (IIF/InStr/Replace/Join) | Attribute flow | unverifiable (carried as illustrative; Connect declarative provisioning syntax) | — |
| 42 | Staging mode purposes; standby recommended for PHS | Staging | verified | choose-ad-authn |
| 43 | Never two active Connect servers | Staging | verified (Connect: no multiple active instances) | decision guide |
| 44 | PHS/PTA/AD FS comparison | Sign-in method | verified/corrected (PTA validation "in the cloud after agent check"; AD FS infra counts; leaked creds need PHS) | choose-ad-authn |
| 45 | PTA: minimum 3 agents, Tier 0 | Sign-in table | verified | how-to-connect-pta-quick-start |
| 46 | Microsoft recommends PHS; enable it regardless; ransomware recovery example | Sign-in | verified | choose-ad-authn; migrate-from-federation |
| 47 | PHS failover from PTA is automatic ("automatic fallback") | Sign-in | corrected (manual switch) | choose-ad-authn |
| 48 | Leaked credential detection "Yes (P2)" | Sign-in | corrected (detection nonpremium; reports/risk policies P2; needs PHS) | concept-identity-protection-risks |
| 49 | Hard match on sourceAnchor; soft match on UPN/primary SMTP | Soft/hard match | verified | how-to-connect-install-existing-tenant |
| 50 | BlockSoftMatch / BlockCloudObjectTakeoverThroughHardMatch settings | Soft/hard match | verified (added) | existing-tenant |
| 51 | July 1, 2026 hard-match hardening (privileged, onPremisesObjectIdentifier) | Soft/hard match | verified (added) | existing-tenant; tshoot-connect-sync-errors |
| 52 | Match overwrites cloud attributes and password hash | Soft/hard match | verified | existing-tenant |
| 53 | Alternate login ID limited for some M365 workloads | UPN suffixes | verified | plan-connect-user-signin |
| 54 | Email as alternate login ID is preview | UPN suffixes | verified (added) | howto-authentication-use-email-signin |
| 55 | Microsoft recommends UPN match primary SMTP | UPN suffixes | verified | configuring-alternate-login-id (via plan-connect-user-signin) |
| 56 | AGDLP tier mapping; per-group decision table | Groups | restated-as-design | program design |
| 57 | Cloud Sync writes cloud security groups to AD as universal groups | Group decision | verified | group-writeback-cloud-sync / migrate-group-writeback |
| 58 | "Entra ID supports one level of nesting for assigned groups" | Nested groups | corrected (nesting allowed; app assignment and licensing don't cascade; CA follows nesting; restrictions listed) | how-to-manage-groups; CA users-groups |
| 59 | Dynamic groups can't contain groups | Nested groups | verified | groups-dynamic-membership / groups overview |
| 60 | M365 groups can contain only users | M365 groups | verified | how-to-manage-groups (Graph groups overview) |
| 61 | M365 group expiration 90/180/365 days | M365 groups / self-service | corrected (preset or custom ≥30 days; one policy per tenant; 30-day restore) | groups-lifecycle |
| 62 | Access reviews of group membership "P2 feature" | Self-service | corrected (licensing per Governance table) | licensing-fundamentals |
| 63 | Group export script | Groups | corrected (restored; `.ToString()` calls fixed; `@()` restored; member-count logic fixed) | New-MgGroup per Graph PowerShell |
| 64 | Service account migration matrix | Service accounts | restated-as-design (MSA→managed identity row removed for on-prem) | program design |
| 65 | WIF elements: issuer, subject, audience `api://AzureADTokenExchange` | WIF | verified | workload-identity-federation-create-trust |
| 66 | 20 FICs per app; no wildcards; wrong subject fails only at exchange | WIF | verified (added) | workload-identity-federation-considerations |
| 67 | CA for workload identities: single-tenant SPs only; not managed identities; not via groups | CA workload | verified (added) | conditional-access/workload-identity |
| 68 | "Compliance enforcement" bullet for workload CA | CA workload | removed (block is the only grant control) | workload-identity |
| 69 | Service principal governance controls (2 owners, annual rotation, quarterly reviews) | SP governance | restated-as-design | program design |
| 70 | Service account discovery script | Service accounts | corrected (restored; recommendation order fixed; `[CmdletBinding()]` and `::new()` restored) | — |
| 71 | lastLogonTimestamp lag | Discovery | removed (unverified detail) | — |
| 72 | AD privileged group → Entra role mapping | Privileged access | restated-as-design | program design |
| 73 | Fewer than five Global Administrators | Privileged access | verified (added) | privileged-roles-permissions |
| 74 | CA doesn't support AU-scoped or custom role targeting | Privileged access / personas | verified (added) | CA users-groups |
| 75 | PIM activation 1–24 hours | PIM standards | verified | pim-how-to-change-default-settings |
| 76 | PIM ticket field is informational | PIM standards | verified | pim-how-to-change-default-settings |
| 77 | PIM MFA can be satisfied earlier in session; use authentication context | PIM standards | verified (added) | pim-how-to-change-default-settings |
| 78 | Default approvers / lockout risk | PIM standards | verified (added) | pim-how-to-change-default-settings |
| 79 | PIM durations table | PIM | restated-as-design | program design |
| 80 | PIM for Groups: any security/M365 group except dynamic and synced; role-assignable not required since Jan 2023; 500 role-assignable limit | PIM for Groups | corrected (source said enable "Entra roles can be assigned" at creation) | concept-pim-for-groups |
| 81 | PIM for Groups licensing P2/Governance per eligible user | PIM for Groups | verified | groups-assign-member-owner |
| 82 | Break-glass: two accounts, cloud-only `onmicrosoft.com` | Emergency access | verified | security-emergency-access |
| 83 | One account uses a password in a safe | Emergency access | corrected (both use passkey FIDO2 or CBA, satisfying mandatory MFA) | security-emergency-access |
| 84 | Exclude from all CA policies | Emergency access | corrected (exclude from policies that block/restrict; report-only don't need it) | security-emergency-access |
| 85 | Validate quarterly | Emergency access | verified (Microsoft: at least every 90 days) | security-emergency-access |
| 86 | Permanent active GA in PIM | Emergency access | verified | security-emergency-access |
| 87 | Protected actions list included "deleting a tenant" | Protected actions | corrected (removed; actual list: CA policies, cross-tenant settings, hard deletion, named locations, protected action management) | protected-actions-overview |
| 88 | Protected actions need P1; CA Admin or Security Admin configures | Protected actions | verified (added) | protected-actions-overview |
| 89 | Persona definitions | CA framework | restated-as-design | program design |
| 90 | "GCC-Moderate services are US-only" → block non-US | Named locations | corrected (restated as program choice; GCC provides US data residency, not sign-in restriction) | microsoft-365/copilot/gov-overview |
| 91 | Built-in authentication strengths and their methods | Auth strengths | verified/corrected (three built-ins; "Passwordless MFA" contents; Authenticator not phishing-resistant) | concept-authentication-strengths |
| 92 | Can't combine "require MFA" with "require authentication strength" | Auth strengths | verified (added) | concept-authentication-strengths |
| 93 | Authenticator not phishing-resistant; pair with managed devices | Auth strengths | verified | memo-22-09-multi-factor-authentication |
| 94 | CA policy table | Policy set | restated-as-design | program design |
| 95 | CA002 "grant with no controls" for break-glass | Policy set | corrected (retired; exemption is the exclusion) | security-emergency-access |
| 96 | CA013 require password change + MFA | Policy set | corrected (require risk remediation; precedence; not for guests) | howto-identity-protection-configure-risk-policies; concept-identity-protection-policies |
| 97 | CA012 guests user risk | Policy set | corrected (sign-in risk; remediation not supported for guests) | concept-identity-protection-policies |
| 98 | Report-only → pilot → waves | Testing | restated-as-design | program design |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, title block, document governance box (Controlled, Gitea, FOUO) | — | Not carried: classification stamps and governance boilerplate are excluded by the brief |
| Table of contents | — | Replaced by chapter headings |
| 1.1 Purpose | Ch09 "Purpose and scope" | |
| 1.2 Classification and boundary | Ch09 "Purpose and scope" (GCC endpoint and feature-availability note) | Classification language dropped per brief |
| 1.3 Companion document cross-references | — | Not carried: companion documents aren't B02 pages; replaced by links to Chapters 04, 05, 07, 08 and workbook material |
| 1.4 Assumptions and prerequisites | Ch09 "Purpose and scope" | Gitea generalized to Git |
| 2 (intro) | Ch09 "Decomposing the Active Directory identity landscape" | |
| 2.1 User objects (incl. attribute table) | Ch09 "User objects"; full table in Appendix D | |
| 2.2 Security groups (scope table) | Ch09 "Security groups" | |
| 2.3 Distribution groups | Ch09 "Distribution groups" | |
| 2.4 Service accounts | Ch09 "Service accounts" | |
| 2.5 Computer objects | Ch09 "Computer objects" (links Chapter 04) | Companion guide reference dropped |
| 2.6 Organizational units + design principle box | Ch09 "Organizational units" + callout | |
| 2.7 AdminSDHolder and protected groups | Ch09 "AdminSDHolder and protected groups" | List corrected |
| 3.1 Entra ID object model | Ch09 "The object model" | |
| 3.2 Tenant vs forest boundary | Ch09 "Tenant boundary and forest boundary" | |
| 3.3 Licensing tiers + licensing box | Ch09 "Licensing for governance features" | Table rebuilt from current Microsoft licensing |
| 3.4 Dynamic group rule syntax + note | Ch09 "Dynamic group rule syntax" | |
| 4.1 Connect Sync vs Cloud Sync matrix + recommendation | Ch09 "Cloud Sync or Connect Sync" | Recommendation reversed per current Microsoft guidance |
| 4.2 Filtering strategies | Ch09 "Filtering" | |
| 4.3 Attribute flow and transformations | Ch09 "Attribute flow and transformations" | |
| 4.4 Staging mode + warning | Ch09 "Staging mode and recovery" + warning | |
| 4.5 Authentication method decision matrix + recommendation | Ch09 "Choosing the sign-in method" | |
| 4.6 Soft vs hard match | Ch09 "Soft match and hard match" | Expanded with 2026 hardening |
| 4.7 UPN suffix mismatches and alternate login ID | Ch09 "UPN suffixes and alternate login ID" | DNS guide reference generalized |
| 4.7 Diagram 1 placeholder (sync architecture) | Ch09 figure `ch09-sync-auth-decision` | Replaced by house-style decision diagram |
| 5.1 AGDLP mapping | Ch09 "Mapping the AGDLP tiers" | |
| 5.2 Group decision framework | Ch09 "The per-group decision" | |
| 5.3 Dynamic group conversion | Ch09 "Converting static groups to dynamic groups" | |
| 5.4 Nested group flattening | Ch09 "Nested groups" | Nesting rule corrected |
| 5.5 Microsoft 365 groups | Ch09 "Microsoft 365 groups" | |
| 5.6 Self-service group management | Ch09 "Self-service group management" | |
| 5.7 Group export and migration script | Ch09 "Exporting AD groups and creating cloud groups" | Restored and fixed |
| 6.1 Migration path matrix | Ch09 "The migration path matrix" | |
| 6.2 Workload identity federation | Ch09 "Workload identity federation" | |
| 6.3 CA for workload identities | Ch09 "Conditional Access for workload identities" | |
| 6.4 Service principal governance | Ch09 "Governing service principals" | |
| 6.5 Service account discovery script | Ch09 "Discovering service accounts"; also in Appendix D module | |
| 7.1 Privileged group → PIM role mapping | Ch09 "Mapping AD privileged groups to Entra roles" | |
| 7.2 PIM configuration standards | Ch09 "PIM configuration standards" | |
| 7.3 PIM role assignment table | Ch09 "PIM configuration standards" table | MFA column replaced by authentication-context statement |
| 7.4 Privileged access groups | Ch09 "PIM for Groups" | Renamed to current feature name |
| 7.5 Break-glass accounts | Ch09 "Emergency access accounts" | |
| 7.6 Protected actions | Ch09 "Protected actions" | |
| 7.6 Diagram 2 placeholder (PIM activation workflow) | — | Not drawn: two diagrams per chapter; the activation flow is described in prose |
| 8.1 Design philosophy | Ch09 "Design approach" | |
| 8.2 Persona definitions | Ch09 "Design approach" table | |
| 8.3 Named locations | Ch09 "Named locations" | |
| 8.4 Authentication strength policies | Ch09 "Authentication strengths" | |
| 8.5 CA policy table | Ch09 "The policy set" | CA002 retired; CA012/CA013 changed |
| 8.6 Testing methodology + critical box | Ch09 "Testing and rollout" + callout | |
| (new) AD → Entra object mapping figure | Ch09 figure `ch09-ad-to-entra-objects` | |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: attribute-mapping text and table row link the program attribute map; account-type sync rule target `extensionAttribute10` -> `extensionAttribute7`; personas: Internals `extensionAttribute6` {Employee, Contractor} -> `extensionAttribute11` {`EMP`, `CTR`}, Admins `extensionAttribute10` -> `extensionAttribute7`. `extensionAttribute15` = `DoNotSync` unchanged. AD *group* export still reads group `extensionAttribute1`/`2` (group objects, not the user map); unchanged. |

## Revision 2026-10-21 — consistency round 2

Internal-consistency fixes from the Book 02 deck review. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| K1 | Service account forms "three" -> "four"; dMSA row added to the AD-type table, matching Chapter 08's four kinds | Service accounts (lines 99, 106) | factual; new note | c09-dmsa <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-overview> (Windows Server 2025; supersedes a traditional account; disables the original password; machine-bound) |
| K2 | Migration matrix: on-premises Kerberos target now "gMSA, or a dMSA on a Windows Server 2025 domain" (matches Chapter 08); MSA row notes an MSA or gMSA can't be migrated to a dMSA; dMSA row added | Migration path matrix (lines 500-502) | factual; new note | c09-dmsa <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-overview> ("You can't migrate from a managed service account or a gMSA to a dMSA") |
| K3 | Location policy restated per persona to match the policy set: Internals outside the US blocked (CA008, travel exceptions), Admins trusted networks only (CA005), workload identities trusted networks (CA015), Externals and guests not location-blocked. Replaces "for all personas" | Named locations (line 744) | design consistency; no new note | Program design; CA table and Appendix C CA008 JSON |
| K4 | Callout added: Connect Sync must be 2.6.84.0+ with application-based authentication by April 7, 2027, or all sync services fail; existing servers aren't switched to app-based auth automatically from 2.6.84.0 (run the wizard); upgrading over an existing ADSync database needs 2.6.91.0+. Carries the B02 deck date into the chapter that owns the sync-engine decision | Cloud Sync or Connect Sync (line 265) | factual; new notes | c09-connect-hardening <https://learn.microsoft.com/entra/identity/hybrid/connect/harden-update-ad-fs-pingfederate>; c09-connect-versions <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-version-history> (2.6.84.0 release notes: updated feature 4, known issue 1) |
| K5 | Managed identities in the service account tables left as is: Chapter 08 now agrees they are a target for Azure-hosted workloads | Service accounts; matrix | no change | — |

## Revision 2026-10-29 — four tracks and companion-guide alignment

Track signposts added (HR track: user objects, groups, OUs; non-person identity track: service accounts and "Modernizing service accounts"; Intune and Arc tracks: computer objects, Book 05). The core user attribute table was extended with the AD-to-Entra mapping from the series' shared attribute content (corrected per the series brief), and a model-differences table was added after the placement-versus-attributes callout. All sources fetched on Microsoft Learn on Oct 29, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| T1 | `pwdLastSet` is not mapped to `lastPasswordChangeDateTime`; Connect syncs it as a mechanical property used to invalidate issued tokens | User attribute table | corrected (old row: `pwdLastSet` -> `lastPasswordChangeDateTime`, "Password age"; now "nearest equivalent, not synced") | c09-sync-attributes <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-sync-attributes-synchronized>; c09-user-resource (lastPasswordChangeDateTime: last password change or creation) |
| T2 | `lastLogonTimestamp` has no synced equivalent; `signInActivity` is Entra's own record, and its details need P1/P2 and AuditLog.Read.All | User attribute table | verified (added) | c09-user-resource <https://learn.microsoft.com/graph/api/resources/user?view=graph-rest-1.0> |
| T3 | `onPremisesDistinguishedName` is read-only and populated only for synced users; dynamic rules can read it | User attribute table | verified (added; the shared content said only "never use it for policy", which stays as program design) | c09-user-resource; c09-dynamic-properties (supported string properties include `onPremisesDistinguishedName`) |
| T4 | Entra `country` corresponds to AD `co`; Connect also syncs `c` | User attribute table | verified (shared-content row corrected from `c` to `co` per the brief) | c09-sync-attributes (`c` and `co` both listed); c09-entra-to-ad <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-configure-entra-to-active-directory> (AD `co` mapped from Entra `country`) |
| T5 | `usageLocation` is a two-letter code used for license assignment | User attribute table | verified | c09-sync-attributes; c09-dynamic-properties |
| T6 | Source anchor: Connect uses ms-DS-ConsistencyGuid for users from 1.1.524.0 and writes objectGUID into it when empty; Cloud Sync uses ms-DS-ConsistencyGuid with fallback to objectGUID and it can't be changed | User attribute table | verified (added) | c09-source-anchor <https://learn.microsoft.com/entra/identity/hybrid/connect/plan-connect-design-concepts#using-ms-ds-consistencyguid-as-sourceanchor>; c09-cloud-sync-faq <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/reference-cloud-sync-faq> |
| T7 | extensionAttribute1-15: up to 1,024 characters each, also known as Exchange custom attributes 1-15; read-only in Graph for synced users; for a cloud-only user previously synced, read-only in Graph but managed through Exchange | User attribute table | verified (added) | c09-user-resource (onPremisesExtensionAttributes) |
| T8 | Rules can read employeeId; can't read employeeType or manager as a property (the direct-reports rule uses manager); multi-value extension properties aren't supported, single-valued directory extensions are | User attribute table | verified | c09-dynamic-properties <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> |
| T9 | `altSecurityIdentities` isn't in the default attribute set; reaches certificateUserIds only through added Connect Sync rules; 10 or fewer values; for synced users only Connect can write certificateUserIds | User attribute table | verified (shared content "synced to certificateUserIds" corrected to "only through a sync rule you configure"; "up to 10 values" worded as Learn's prerequisite on the synced account) | c09-cbu-mapping <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificateuserids> |
| T10 | servicePrincipalName has no Entra equivalent; adminCount has none | User attribute table | restated-as-design | program design; AdminSDHolder section already sourced |
| T11 | AD schema additions are forest-wide and can't be removed, only disabled (defunct) | Model-differences table | verified (added) | c09-ad-schema <https://learn.microsoft.com/windows/win32/ad/impact-of-schema-changes> |
| T12 | Some Graph filters need advanced queries | Model-differences table | verified (added) | c09-advanced-queries <https://learn.microsoft.com/graph/aad-advanced-queries> (for example, `employeeType eq` is advanced-only) |
| T13 | Custom security attributes have their own roles; Global Administrator can't read or assign them by default | Model-differences table | verified (added) | c09-csa-roles <https://learn.microsoft.com/entra/fundamentals/custom-security-attributes-overview> |
| T14 | Track assignments (HR / non-person / Intune and Arc); "where an object sits does half the work" | Decomposition; Service accounts; Computer objects; Migration path matrix; model differences | restated-as-design | series framing; companion guide #four-tracks, #non-person-identity-track |
| H1 | HISG compares four approaches: federation, PTA, password sync, cloud primary authentication; on-premises identity plays a secondary role in cloud primary | What CISA's hybrid identity guidance adds | verified (added Oct 31, 2026) | c09-hisg, HISG §3.1.1–3.1.5 <https://www.cisa.gov/resources-tools/services/hybrid-identity-solutions-guidance-hisg> |
| H2 | In federation, PTA and password sync the source of identity is the on-premises directory; HISG treats them as transitional | Same | verified (added) | HISG §3.1.1–3.1.3 security considerations; §3.1.5 |
| H3 | HISG primary recommendation: cloud-based passwordless via PKI/PIV/CAC or FIDO2/WebAuthn; move from on-premises federation to cloud primary | Same | verified (added) | HISG §1.4 |
| H4 | HISG warns a hash-function mismatch could leave a weaker algorithm in use | Same | verified (added) | HISG §3.1.3 security considerations |
| H5 | PHS salts the AD hash per user and runs PBKDF2 with 1,000 iterations of HMAC-SHA256; the stored hash can't be used for on-premises pass-the-hash | Same | verified (added) | c09-phs-hash <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-password-hash-synchronization> |

## Revision 2026-11-08 — consistency read before the baseline edition

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| C1 | Access review cadence for app owners follows the application's risk tier, written R1 (quarterly) and R2 (semi-annually) | §Applications and service principals, Reviews | corrected (Old: "risk Tier 1" and "Tier 2". New: R1 and R2, the notation Book 04 now uses so a risk tier can't be read as a privilege tier) | Book 04 Chapter 04 §Three different tiers; Chapter 06 §Risk tiers set the approval chain; Chapter 09 §Cadence |
| C2 | App ownership: registry owner (with backup by tier) plus two technical people on the Entra Owners list | §Governing service principals | corrected (Old: "at least two human owners") | Book 04 Chapter 05 §Ownership; Chapter 06 §Risk tiers |

## Revision 2026-11-09 — Learn citation pass

Microsoft Learn pages the coverage map listed as covered but uncited, read on Nov 9, 2026 and attached as footnotes at the sentences they support. No text changed. Pages that only repeat an existing citation, landing pages, and pages that fit only code blocks stay uncited.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | Connect Sync handles connected forests from one server; one active Connect Sync server per tenant, plus staging servers | Tenant boundary; One active Connect Sync server | verified (Learn read Nov 9, 2026) | c09-topologies <https://learn.microsoft.com/entra/identity/hybrid/connect/plan-connect-topologies> |
| L2 | A staging-mode server imports and synchronizes without exporting | Staging mode and recovery | verified (Learn read Nov 9, 2026) | c09-topologies <https://learn.microsoft.com/entra/identity/hybrid/connect/plan-connect-topologies> |
| L3 | Cloud Sync is a lightweight agent with cloud-held configuration; handles disconnected forests; multiple active agents give availability | Tenant boundary; Cloud Sync or Connect Sync; Staging mode | verified (Learn read Nov 9, 2026) | c09-what-cloud-sync <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/what-is-cloud-sync> |
| L4 | Cloud Sync device sync for hybrid join is enabled separately | Engine comparison table | verified (Learn read Nov 9, 2026) | c09-device-sync <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/device-sync> |
| L5 | On-demand provisioning exists in Cloud Sync, not Connect Sync | Engine comparison table | verified (Learn read Nov 9, 2026) | c09-on-demand <https://learn.microsoft.com/entra/identity/hybrid/on-demand-provision> |
| L6 | Same | Engine comparison table | verified (Learn read Nov 9, 2026) | c09-on-demand <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-on-demand-provision> |
| L7 | Cloud Sync replaces Group Writeback v2 and can run alongside Connect Sync for that job; v1 remains for Microsoft 365 groups | Corrections to older guidance | verified (Learn read Nov 9, 2026) | c09-gwb-migrate <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/migrate-group-writeback> |
| L8 | Cloud Sync handles Exchange hybrid writeback | Corrections to older guidance | verified (Learn read Nov 9, 2026) | c09-exchange-hybrid <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/exchange-hybrid> |
| L9 | Same (both engines can write back Exchange hybrid attributes) | Corrections to older guidance | verified (Learn read Nov 9, 2026) | c09-exchange-hybrid <https://learn.microsoft.com/entra/identity/hybrid/exchange-hybrid-writeback> |
| L10 | Plan to migrate existing Connect Sync installations to Cloud Sync | Recommendation callout | verified (Learn read Nov 9, 2026) | c09-migrate-cloud-sync <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/migrate-azure-ad-connect-to-cloud-sync> |
| L11 | Both engines can run in the same forest, moving populations in stages | Recommendation callout | verified (Learn read Nov 9, 2026) | c09-coexist <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/tutorial-pilot-aadc-aadccp> |
| L12 | Same (piloting Cloud Sync in an existing hybrid forest) | Recommendation callout | verified (Learn read Nov 9, 2026) | c09-coexist <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/plan-cloud-sync-topologies> |
| L13 | Attribute-based filtering with an `extensionAttribute15` scoping condition; group-based filtering is for pilots | Filtering | verified (Learn read Nov 9, 2026) | c09-filtering <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-configure-filtering> |
| L14 | Custom sync rules take precedence over default rules by precedence number | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-sync-rule-precedence <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-create-custom-sync-rule> |
| L15 | Same (lower value wins a conflict) | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-sync-rule-precedence <https://learn.microsoft.com/entra/identity/hybrid/connect/concept-azure-ad-connect-sync-default-configuration> |
| L16 | Same | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-sync-rule-precedence <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-change-the-configuration> |
| L17 | Cloud Sync uses an expression builder for attribute mappings | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-cloud-sync-expressions <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-expression-builder> |
| L18 | Same | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-cloud-sync-expressions <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-attribute-mapping> |
| L19 | Same | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-cloud-sync-expressions <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/reference-expressions> |
| L20 | Connect Sync's declarative provisioning expression language (IIF, InStr, Replace, Join and other functions) | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-declarative-expr <https://learn.microsoft.com/entra/identity/hybrid/connect/concept-azure-ad-connect-sync-declarative-provisioning-expressions> |
| L21 | Same | Attribute flow and transformations | verified (Learn read Nov 9, 2026) | c09-declarative-expr <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-sync-functions-reference> |
| L22 | PTA agent servers are treated as Tier 0 | Sign-in method table | verified (Learn read Nov 9, 2026) | c09-pta-security <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-pta-security-deep-dive> |
| L23 | PTA enforces on-premises account state at sign-in | Sign-in method table | verified (Learn read Nov 9, 2026) | c09-pta <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-pta> |
| L24 | PTA alone doesn't support leaked-credential detection | Sign-in method table | verified (Learn read Nov 9, 2026) | c09-pta-limits <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-pta-current-limitations> |
| L25 | SSO from Entra joined or hybrid joined devices (PRT), or Seamless SSO with PHS or PTA | Sign-in method table | verified (Learn read Nov 9, 2026) | c09-seamless-sso <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sso> |
| L26 | PTA doesn't fail over to PHS automatically | Choosing the sign-in method | verified (Learn read Nov 9, 2026) | c09-pta-failover <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-pta-faq> |
| L27 | Turn PHS on as a fallback and for leaked-credential detection | Recommendation: PHS everywhere | verified (Learn read Nov 9, 2026) | c09-phs-backup <https://learn.microsoft.com/entra/identity/hybrid/connect/whatis-phs> |
| L28 | Same (PHS as backup for AD FS) | Recommendation: PHS everywhere | verified (Learn read Nov 9, 2026) | c09-phs-backup <https://learn.microsoft.com/entra/identity/hybrid/connect/tutorial-phs-backup> |
| L29 | Keep soft match blocked except during a planned matching window | Soft match and hard match | verified (Learn read Nov 9, 2026) | c09-sync-features <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-syncservice-features> |
| L30 | Add a routable, verified suffix and match the UPN to the primary SMTP address | UPN suffixes and alternate login ID | verified (Learn read Nov 9, 2026) | c09-upn-changes <https://learn.microsoft.com/entra/identity/hybrid/connect/howto-troubleshoot-upn-changes> |
| L31 | Alternate login ID isn't compatible with all Microsoft 365 workloads | UPN suffixes and alternate login ID | verified (Learn read Nov 9, 2026) | c09-alt-login-id <https://learn.microsoft.com/windows-server/identity/ad-fs/operations/configuring-alternate-login-id> |
| L32 | Cloud Sync group provisioning writes cloud security groups to AD as universal groups for Kerberos apps | The per-group decision | verified (Learn read Nov 9, 2026) | c09-govern-onprem-groups <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/govern-on-premises-groups> |
| L33 | Same | The per-group decision | verified (Learn read Nov 9, 2026) | c09-govern-onprem-groups <https://learn.microsoft.com/entra/id-governance/scenarios/provision-entra-to-active-directory-groups> |
| L34 | On-premises dynamic distribution groups don't sync | Distribution groups | verified (Learn read Nov 9, 2026) | c09-sync-groups <https://learn.microsoft.com/entra/identity/hybrid/connect/concept-azure-ad-connect-sync-user-and-contacts> |

## Revision 2026-11-09 — Learn gap additions (operations reference for the Connect Sync servers)

New closing section "Operations reference: the Connect Sync servers that stay" (entra-core gap 2), with a pointer from "Staging mode and recovery". Learn pages read Nov 9, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| O1 | Domain-joined, full GUI, no Server Core; 2025 or 2022 recommended; writable DCs only | §The server | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-prerequisites> |
| O2 | 2019 minimum, 2016 gone by Jan 12, 2027 | §The server | restated-as-design (program assumption) | — |
| O3 | Tier 0; deny NTLM, Windows LAPS, MFA, soft/hard match takeover disabled | §The server | verified | how-to-connect-install-prerequisites |
| O4 | .NET 4.7.2 and TLS 1.2 minimums; install fails without TLS 1.2 from 2.0 | §The server | verified (the prerequisites page also mentions 4.6.2 in one place; 4.7.2 from its banner and the hardening page) | how-to-connect-install-prerequisites; harden-update-ad-fs-pingfederate |
| O5 | Proxy in machine.config, not miiserver.exe.config | §The server | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/tshoot-connect-connectivity> |
| O6 | LocalDB 10 GB (~100,000 objects); full SQL from 100,000; up to SQL 2022; no Azure SQL; case-insensitive collation; one engine per instance | §The database | verified | how-to-connect-install-prerequisites |
| O7 | SQL delegated install, collation, no nested logins | §The database | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-sql-delegation> |
| O8 | LocalDB full symptoms, recovery, purge interval; swing migration as the lasting fix | §The database | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/tshoot-connect-recover-from-localdb-10gb-limit> |
| O9 | Database move steps and `/useexistingdatabase`; staging mode after reinstall; credentials re-entered | §The database | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-move-db> |
| O10 | AD DS connector account rules (MSOL_, no VSA/MSA/gMSA, no EA/DA since 1.4.18.0) | §The accounts | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-accounts-permissions>; how-to-connect-install-custom |
| O11 | Set-ADSyncRestrictedPermissions | §The accounts | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-adsyncconfig> |
| O12 | ADSync service account types; set only at install; password change only | §The accounts | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/concept-adsync-service-account> |
| O13 | Encryption-key abandon procedure only for 1.1.443.0 and older | §The accounts | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-change-serviceacct-pass> |
| O14 | Ports table | §The ports | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-ports> |
| O15 | Connectivity test, 403 and 407 meanings | §The ports | verified | tshoot-connect-connectivity |
| O16 | 1.x non-functional; 2.x retire 12 months after a newer release | §Upgrades | verified | reference-connect-version-history |
| O17 | In-place (no rollback) vs swing (safest; OS changes; retire old servers) | §Upgrades | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-upgrade-previous-version> |
| O18 | Swing migration as the program default | §Upgrades | restated-as-design | — |
| O19 | Automatic upgrade conditions; Get-ADSyncAutoUpgrade -Detail | §Upgrades | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-automatic-upgrade> |
| O20 | No active-active; order of the switch; writeback breaks with two active; csexport and CSExportAnalyzer; PHS catch-up, don't restart | §Switching | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-staging-server> |
| O21 | Configuration export JSON path, on-demand export, import behavior and limitations | §Export and import | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-import-export-config> |
| O22 | Uninstall from Control Panel | §Uninstalling | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-uninstall> |
| O23 | Azure Government from 1.1.180; `*.windows.net` auto-detection; AzureInstance = 4 for offline servers with a custom install; endpoints | §Government clouds | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-instances> |
| O24 | PHS through a firewall needs 1.1.644.0 and `*.msappproxy.us` on 443 | §Government clouds | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-government-cloud> |
| O25 | GCC uses commercial; GCC High vs DoD not distinguished | §Government clouds | verified (absence); shown as not yet specified | reference-connect-instances; reference-connect-government-cloud |
| O26 | Registry commands (New-Item, Set-ItemProperty DWord) | §Government clouds | restated-as-design (the page gives the value, not a command) | — |

## Zero Trust Assessment closure additions (Nov 11, 2026)

Added for the Zero Trust Assessment closure update (B02-01, B02-02). Each row uses the verification-log row from [Book 00, Appendix D](../../b00-orientation/appendix-d-control-states-and-evidence.md#block-verification-row). Learn pages were read on the date shown; `ms.date` wasn't exposed by the fetch tool, so the read date is the date recorded.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| Z1 | Microsoft recommends cloud authentication; a federation server compromise lets attackers forge tokens for any user | Managed or federated decision | verified | Learn, Configure Microsoft Entra for Zero Trust: Protect identities and secrets, https://learn.microsoft.com/entra/fundamentals/zero-trust-protect-identities | Nov 11, 2026 |
| Z2 | Federated authentication, cloud authentication, CBA, Conditional Access, Connect sync and cloud sync, Connect Health available in Azure for US Government; Workload ID Premium available there | Managed or federated decision; sync hardening | verified | Learn, Microsoft Entra feature availability, https://learn.microsoft.com/entra/identity/authentication/feature-availability | Nov 11, 2026 |
| Z3 | Decision tree questions 1-4 and the federated-domain conditions table | Managed or federated decision | restated-as-design | Program design from the cited Learn pages and Appendix D | Nov 11, 2026 |
| Z4 | AutoCertificateRollover; Entra ID polls metadata 35 days before expiry; 35-day and 15-day action rows; Update-MgDomainFederationConfiguration after manual renewal | Federated-domain conditions; rollover check | verified | Learn, Renew federation certificates for Microsoft 365 and Microsoft Entra ID, https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-fed-o365-certs | Nov 11, 2026 |
| Z5 | Connect Health for AD FS agents on every AD FS and proxy server; P1; Azure Government endpoints | Federated-domain conditions | verified | Learn, Microsoft Entra Connect Health agents for AD FS; Connect Health Alert Catalog | Nov 11, 2026 |
| Z6 | Emergency rotation: two certificates (-Urgent first); Update-MgDomainFederationConfiguration; Remove-ADFSCertificate; TLS replacement; partner update; refresh-token revocation; possible outage | Compromise recovery procedure | verified | Learn, Emergency rotation of the AD FS certificates, https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-emergency-ad-fs-certificate-rotation | Nov 11, 2026 |
| Z7 | Conversion can take up to 60 minutes per domain (migration guide) and up to 4 hours to take full effect (AD FS FAQ); both figures cited, not reconciled | Compromise recovery procedure | verified (both sources cited; the owner's open decision on which to plan to is not settled here) | Learn, Migrate from federation to cloud authentication; Learn, AD FS to Microsoft Entra FAQ | Nov 11, 2026 |
| Z8 | Annual recovery test in a test tenant; decision record template; signers per Chapter 06 matrix | Compromise recovery; decision record | restated-as-design | Program design; Chapter 06 responsibility matrix | Nov 11, 2026 |
| Z9 | Zero Trust checks: Connect Sync with service principal credentials; directory sync account locked to named locations | Sync identity hardening | verified | Learn, Configure Microsoft Entra for Zero Trust: Protect identities and secrets | Nov 11, 2026 |
| Z10 | Application-based authentication: single-tenant app, certificate, 90-day default, TPM recommended, versions 2.5.3.0/2.5.76.0, wizard tasks, Get-ADSyncEntraConnectorCredential, legacy account removal, rollback with Add-ADSyncAADServiceAccount (15 minutes), events 1011/1012, Application Administrator elevation note | Sync identity hardening | verified | Learn, Authenticate to Microsoft Entra ID by using application identity, https://learn.microsoft.com/entra/identity/hybrid/connect/authenticate-application-id | Nov 11, 2026 |
| Z11 | Application-based authentication's government-cloud availability isn't distinguished on its page | Sync identity hardening, Applies | verified (absence); shown as not yet specified | Same page | Nov 11, 2026 |
| Z12 | Add-ADSyncAADServiceAccount resets the connector account password | Inventory table | verified | Learn, Change the Microsoft Entra Connector account password | Nov 11, 2026 |
| Z13 | AD DS connector password changed only in AD fails with event 6000; Add-ADSyncADDSConnectorAccount resets it in AD and the sync engine; annual cadence | Inventory table | verified; cadence restated-as-design | Learn, Changing the AD DS connector account password; ADSync PowerShell Reference | Nov 11, 2026 |
| Z14 | Cloud Sync gMSA; Set-AADCloudSyncRestrictedPermissions | Inventory table | verified | Learn, Microsoft Entra provisioning agent gMSA PowerShell cmdlets; Accounts for integrating with Active Directory | Nov 11, 2026 |
| Z15 | No Learn-documented tenant object for the Cloud Sync agent that Conditional Access can target | Inventory table | unverifiable (absence on the pages read); stated as what Learn doesn't document | Same pages | Nov 11, 2026 |
| Z16 | Location policy pattern for users; Connect Sync account named among exclusions from user policies | Report-only phase | verified | Learn, Block access by location | Nov 11, 2026 |
| Z17 | Workload-identity location policy: select service principals directly; Block only; Workload ID Premium | Report-only phase | verified | Learn, Conditional Access for workload identities | Nov 11, 2026 |
| Z18 | Three Connect account recommendations, preview | Telemetry | verified | Learn, What are Microsoft Entra recommendations? | Nov 11, 2026 |
| Z19 | KQL alert rules, alert test by on-demand rotation, rings, day-two cadence | Telemetry; Enforcement; Day-two | restated-as-design | Program design | Nov 11, 2026 |

## Zero Trust closure update, Phase 4 (Nov 11, 2026)

Conventions from [Book 00, Appendix D](../../b00-orientation/appendix-d-control-states-and-evidence.md) applied to this page's procedure sections: control states, How-template gaps, authority labels, evidence checklist, change safety and assessment mapping. Product claims below were re-read on Microsoft Learn on Nov 11, 2026.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| P4-1 | PIM standards: authority labels; rollout, rings, evidence and control states kept in Book 04 (Appendix B, Chapter 08, privileged access guide) | PIM configuration standards | restated-as-design (cross-reference) | Book 04 | Nov 11, 2026 |
| P4-2 | Emergency access reference architecture, evidence and control states in Book 04, Chapter 04 | Emergency access accounts | restated-as-design (cross-reference) | Book 04 | Nov 11, 2026 |
| P4-3 | CA testing and rollout: authority label; change safety, rollback, evidence and control states in Book 04, Chapter 07; Microsoft's one-week report-only is a deployment tip | Testing and rollout | restated-as-design (cross-reference; Book 04 carries the Learn source) | Book 04, Chapter 07 | Nov 11, 2026 |
