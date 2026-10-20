# Verification — Appendix A, Conditional Access Policy Templates

Sources: `docs/operational-guides/access-plane/conditional-access-library.md` Appendix A (JSON export templates), Appendix B (named locations), Appendix C (authentication strengths). Every template was checked against the Microsoft Graph v1.0 resource definitions listed below and parsed as JSON (all 28 blocks parse). All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Create needs Policy.Read.All + Policy.ReadWrite.ConditionalAccess; Application.Read.All for app conditions | How to use | verified | conditionalaccessroot-post-policies |
| 2 | GCC uses graph.microsoft.com; GCC High graph.microsoft.us | How to use | verified | graph/deployments |
| 3 | Endpoints list/get/create/update/delete | How to use | verified | conditionalAccessPolicy resource |
| 4 | Authentication strength endpoint `/policies/authenticationStrengthPolicies` | How to use | corrected (source implied the `identity/conditionalAccess/authenticationStrength` beta path only) | authenticationstrengthroot-list-policies |
| 5 | State values enabled/disabled/enabledForReportingButNotEnforced | How to use | verified | conditionalAccessPolicy resource |
| 6 | Role template IDs (15 roles) | CA003 | verified | permissions-reference |
| 7 | Managed admin MFA policy covers 14 roles (list) | How to use | verified | managed-policies |
| 8 | Built-in strength IDs and allowed combinations | How to use; templates | verified | authenticationstrengthroot-list-policies |
| 9 | Schema reference rows (users, guest types, external tenants, applications, client applications, clientAppTypes, locations, platforms, device filter, risk levels, insider risk, authentication flows, grant, session, SIF, persistent browser) | Schema reference | verified | Graph v1.0 resource pages cited per row |
| 10 | riskRemediation/passwordChange constraints; Prefer header | Schema reference | verified | conditionalAccessGrantControls |
| 11 | MFA + auth strength can't combine | Schema reference | verified | concept-authentication-strengths |
| 12 | `easUnsupported` deprecated in favor of `exchangeActiveSync` | Templates | verified | conditionalAccessConditionSet |
| 13 | Get/New/Update-MgIdentityConditionalAccessPolicy cmdlets | Deploying | verified (Update cmdlet page found by search; New/Get in source and Graph docs) | Microsoft Graph PowerShell reference |
| 14 | Source A.2 PowerShell: `Install-Module Microsoft.Graph` + `ConvertFrom-Json` body | Deploying | corrected (rewritten; `-AsHashtable` body; state forced to report-only; placeholder check) | — |
| 15 | Named location JSON shapes; 2,000 ranges; mask > /8 | Named locations | verified | concept-assignment-network; New-MgIdentityConditionalAccessNamedLocation |
| 16 | Source B.2 allowed countries US, CA, GB, DE, FR, AU | Named locations | restated-as-design (program uses US only, consistent with Book 02 CA008) | — |
| 17 | Custom strength shape incl. fido2CombinationConfiguration / allowedAAGUIDs | Custom strength | verified | New-MgPolicyAuthenticationStrengthPolicy |
| 18 | Source C.2 custom strength FIDO2 only | Custom strength | corrected (adds multifactor CBA so PIV holders aren't locked out; aligns with Book 02 Ch10) | — |
| 19 | Source C.1 Passwordless MFA list | (Ch03) | corrected (includes Authenticator phone sign-in, `deviceBasedPush`) | authenticationstrengthroot-list-policies |
| 20 | Source C.1 MFA list included "Federated multi-factor" and standalone methods | (Ch03) | verified | authenticationstrengthroot-list-policies |
| 21 | Windows Azure Service Management API app ID 797f4846-… | CA025, CA027 | verified (appears as Azure management target in Graph and audit-log examples) | conditionalaccessroot-post-policies; troubleshoot-policy-changes-audit-log sample |
| 22 | SharePoint Online app ID 00000003-0000-0ff1-ce00-000000000000; Exchange 00000002-… | CA011 | verified | conditionalaccessroot-post-policies examples |
| 23 | Device Registration Service ID 01cb2876-… | CA021 | verified | concept-authentication-flows |
| 24 | `compliantApplication` corresponds to "require app protection policy" | CA017 | verified-by-inference (Graph lists the value; mapping is Microsoft's standard naming, not stated on the resource page) | conditionalAccessGrantControls |
| 25 | Workload policy uses clientApplications.includeServicePrincipals; object ID of enterprise app | CA015 | verified | workload-identity; conditionalAccessClientApplications |
| 26 | insiderRiskLevels is a string-valued flags property | CA036 | verified | conditionalAccessConditionSet |
| 27 | Application filter: string CSA only | CA030 | verified | concept-filter-for-applications |
| 28 | Application filter rule syntax for CSAs | CA030 | unverifiable (exact rule grammar not found on Learn; left as a placeholder to be exported from the admin center) | — |
| 29 | Source A.3 CA-001 JSON: authenticationStrength with `"displayName"` and `"sessionControls": null` | Templates | corrected (authenticationStrength referenced by id only; null session block dropped) | conditionalAccessGrantControls |
| 30 | Source A.4 CA-010 JSON: users targeted via device group; ext11 rule | Templates | corrected (replaced by CA025 device-filter block) | concept-condition-filters-for-devices |
| 31 | Source A.5 CA-020 JSON: `approvedApplication` | Templates | corrected (retired grant; replaced by CA030/CA031) | migrate-approved-client-app |
| 32 | Admin center may require one exclusion for all-users policies | CA090 | verified (portal behavior noted for all-users policies) | migrate-approved-client-app ("If you don't exclude any accounts, you can't create the policy") |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| main App A intro | Appendix A How to use | — |
| main App A.1 Graph endpoints | Appendix A endpoint table | Delete marked "the program disables instead" |
| main App A.2 PowerShell cmdlets | Appendix A Deploying the templates | Rewritten as a pipeline script (claim 14) |
| main App A.3 CA-001 JSON | Appendix A CA018 (and CA006 shape) | Old CA-001 is now CA018; corrected (claim 29) |
| main App A.4 CA-010 JSON | Appendix A CA025 | Corrected (claim 30) |
| main App A.5 CA-020 JSON | Appendix A CA030 (+ CA031 in reuse table) | Corrected (claim 31) |
| main App B.1 IP named location | Appendix A Named locations | — |
| main App B.2 country named location | Appendix A Named locations | Country list changed (claim 16) |
| main App B.3 PowerShell named locations | Appendix A (cmdlet named; JSON bodies used directly) | Hashtable version not reproduced; same bodies via `-BodyParameter` |
| main App C.1 built-in strengths | Chapter 03 Authentication strengths (table with IDs) | Corrected (claim 19) |
| main App C.2 custom strength + PowerShell | Appendix A Custom authentication strength | Corrected (claim 18) |
