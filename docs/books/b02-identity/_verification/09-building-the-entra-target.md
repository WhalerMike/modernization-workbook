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
