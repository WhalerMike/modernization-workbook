# Verification — Chapter 14, Applications, Secrets and Configuration Drift

New chapter, first pass of Nov 11, 2026, written for the Zero Trust Assessment closure update (Phase 2): instruction IDs B13-01 (application governance fields), B13-02 (secrets governance) and B13-03 (configuration drift exports), and the Book 13 parts of closure-map rows CM-05 (application secrets) and CM-06 (ownerless privileged apps). Status `draft` with `review-status: pending`: Book 13 is a baseline book, and a chapter added after Release 2.0 stays draft until the editor's approval at a baseline cut (CONTRIBUTING.md, "Baseline status"). It follows Book 00, Appendix D's conventions and links Book 04 Chapter 05, the Non-Person Identity guide and the service account migration guide for the identity engineering rather than repeating it.

Primary sources opened on Nov 11, 2026: Microsoft Learn through the Microsoft Learn documentation service (pages below); NIST's SP 800-53 release 5.2.0 OSCAL catalog and Moderate baseline profile (JSON, parsed with a script); GitHub Docs REST reference for repositories; the Azure Policy built-in definition files on GitHub for the three Key Vault secret policies (display names and parameter names). No personal name, email address or agency detail was sent in any request. Nothing from any private assessment is used: no counts, tenant names, application names or identifiers.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Keep owners minimal, review every few months, at least two where possible; owners can add credentials and act as the app | Record; fields table | verified (carried from Book 04 Ch05 notes c05-owners, c05-best-practice) | Book 04 Ch05; Learn "Security best practices for application properties" | Nov 11, 2026 |
| 2 | Microsoft recommends monitoring pipelines so credentials aren't committed; maintain ownership of redirect URIs | Secrets rules; note c14g-best | verified | <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> | Nov 11, 2026 |
| 3 | Requiring assignment restricts token issuance to assigned users and clients; user consent isn't allowed when assignment is required; `Update-MgServicePrincipal -AppRoleAssignmentRequired:$true` | Unknown workloads; Rollback | verified | <https://learn.microsoft.com/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users> | Nov 11, 2026 |
| 4 | Service principal sign-in activity: preview, Graph beta, global service; AuditLog.Read.All; Reports Reader, Security Reader or Security Administrator; last activity can include partial sign-ins | Prerequisites; availability | verified | <https://learn.microsoft.com/graph/api/reportroot-list-serviceprincipalsigninactivities?view=graph-rest-beta>; <https://learn.microsoft.com/entra/identity/monitoring-health/concept-usage-insights-report> | Nov 11, 2026 |
| 5 | GCC uses worldwide Graph | Prerequisites | verified | <https://learn.microsoft.com/graph/deployments> | Nov 11, 2026 |
| 6 | Eight fields, "high-impact" and "ownerless" definitions, 90-day stale threshold, unknown-workload handling | Record | restated-as-design | Program design; orphan rule from the Non-Person Identity guide (D-NP2) | Nov 11, 2026 |
| 7 | Default prohibition: block secrets and symmetric keys, 180-day certificate cap; app management policies free with Workload ID | Secrets rules | verified (carried from Book 04 Ch05 and the Non-Person Identity guide, Step 3) | Book 04 Ch05 notes c05-secret-tutorial, c05-wid-faq | Nov 11, 2026 |
| 8 | ScubaGear MS.AAD.5.5v1–5.7v1 are SHOULD policies, none a BOD 25-01 required configuration | Secrets rules | verified (carried from the Non-Person Identity guide, Step 3, and Book 17 Ch06) | Those pages' sources | Nov 11, 2026 |
| 9 | IA-5(7) statement text; IA-5(7) not in the Moderate baseline (so cited as "supports", no baseline claim) | Secrets rules; requirements | verified | NIST SP 800-53 r5 OSCAL catalog 5.2.0 and Moderate profile | Nov 11, 2026 |
| 10 | Exception criteria (four), 180-day expiry for excepted secrets, rotation windows table | Secrets | restated-as-design | Program design; approvers from Book 04 Ch06 exceptions | Nov 11, 2026 |
| 11 | Key Vault publishes the near-expiry event 30 days before expiry | Rotation windows | verified | <https://learn.microsoft.com/azure/key-vault/secrets/tutorial-rotation> | Nov 11, 2026 |
| 12 | Key Vault built-in policies: expiration date; maximum validity period; days before expiration; Audit default, Deny supported | Secrets Step 3 | verified; **display-name difference noted:** Learn's table says "Secrets should have an expiration date", the built-in definition file's display name is "Key Vault secrets should have an expiration date"; the command uses the definition's display name. Parameter names `maximumValidityInDays` and `minimumDaysBeforeExpiration` from the definition files | <https://learn.microsoft.com/azure/key-vault/general/azure-policy>; GitHub Azure/azure-policy `Secrets_ExpirationSet.json`, `Secrets_ValidityPeriod.json`, `Secrets_Expiry_ByDays.json` | Nov 11, 2026 |
| 13 | Government availability of those built-ins | Prerequisites; availability table | unverifiable on Learn: *not yet specified*; the lookup in Step 3 is the check | — | Nov 11, 2026 |
| 14 | `Get-MgPolicyDefaultAppManagementPolicy`; `isEnabled` false when no policy applies | Secrets Step 1 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/tutorial-enforce-secret-standards> | Nov 11, 2026 |
| 15 | GitHub REST `security_and_analysis.secret_scanning` and `secret_scanning_push_protection` status enabled/disabled; admin or org owner/security manager | Secrets Step 4 | verified | <https://docs.github.com/en/rest/repos/repos#update-a-repository> | Nov 11, 2026 |
| 16 | GitHub Advanced Security for Azure DevOps: Azure DevOps Services and Git only; push protection evaluates pushes after enablement; repository scanning covers history; org-level Enable all / Begin billing / auto-enable new projects | Secrets Step 4 | verified | <https://learn.microsoft.com/azure/devops/repos/security/configure-github-advanced-security-features> | Nov 11, 2026 |
| 17 | `skip-secret-scanning:true` bypasses push protection; an alert is still generated | Secrets enforcement | verified | <https://learn.microsoft.com/azure/devops/repos/security/github-advanced-security-secret-scanning> | Nov 11, 2026 |
| 18 | GHAzDO government availability | Prerequisites; table | unverifiable on Learn: *not yet specified* | — | Nov 11, 2026 |
| 19 | PIM role settings read: roleManagementPolicies filtered DirectoryRole with $expand=rules | Drift table; script | verified | <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings> | Nov 11, 2026 |
| 20 | Intune settings-catalog list: beta; global service; Intune license | Drift table; availability | verified | <https://learn.microsoft.com/graph/api/intune-deviceconfigv2-devicemanagementconfigurationpolicy-list?view=graph-rest-beta> | Nov 11, 2026 |
| 21 | GSA forwardingProfiles list: beta; global service; NetworkAccess.Read.All; roles | Drift table; prerequisites | verified | <https://learn.microsoft.com/graph/api/networkaccess-networkaccessroot-list-forwardingprofiles?view=graph-rest-beta> | Nov 11, 2026 |
| 22 | EXO and SCC default connection for GCC; app-only certificate auth | Script | verified | <https://learn.microsoft.com/powershell/exchange/connect-to-exchange-online-powershell>; <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell>; <https://learn.microsoft.com/powershell/exchange/app-only-auth-powershell-v2> | Nov 11, 2026 |
| 23 | TCM: workloads Defender, Entra, Exchange, Intune, Purview, Teams; monitors, snapshots, drifts | Two ways to collect | verified | <https://learn.microsoft.com/graph/unified-tenant-configuration-management-concept-overview>; <https://learn.microsoft.com/entra/id-governance/tenant-governance/configuration-management> | Nov 11, 2026 |
| 24 | TCM limits: 30 monitors; 6-hour interval; 800 resources/day; baseline update deletes results and drifts; fixed drifts deleted after 30 days; snapshots 7 days; 20,000/month | Two ways to collect | verified | <https://learn.microsoft.com/graph/api/resources/unified-tenant-configuration-management-api-overview?view=graph-rest-1.0> | Nov 11, 2026 |
| 25 | TCM licensing: monitoring and snapshots with Entra ID P1 or P2; ID Governance adds capacity | Two ways to collect | verified | <https://learn.microsoft.com/entra/id-governance/tenant-governance/licensing> | Nov 11, 2026 |
| 26 | TCM detects; doesn't deploy or remediate | Two ways to collect | verified | <https://learn.microsoft.com/azure/architecture/example-scenario/devops/manage-microsoft-365-tenant-configuration-microsoft365dsc-devops> | Nov 11, 2026 |
| 27 | TCM national clouds: global service (GCC uses it) | Two ways to collect; table | verified (configurationBaseline get page) | <https://learn.microsoft.com/graph/api/configurationbaseline-get?view=graph-rest-1.0> | Nov 11, 2026 |
| 28 | TCM release stage | Two ways to collect | **conflict between Learn pages:** "Configuration management" says the APIs are generally available; "Set up authentication for TCM APIs" says "During public preview". Page treats as preview until consistent; flagged for the owner | <https://learn.microsoft.com/entra/id-governance/tenant-governance/configuration-management>; <https://learn.microsoft.com/graph/utcm-authentication-setup> | Nov 11, 2026 |
| 29 | createSnapshot request body and permission; resource names `microsoft.entra.conditionalaccesspolicy`, `microsoft.exchange.transportrule` | Step 4 | verified | <https://learn.microsoft.com/graph/api/configurationbaseline-createsnapshot?view=graph-rest-1.0>; configuration management page | Nov 11, 2026 |
| 30 | Drift rules, classes and default severities per domain; daily/weekly cadence; L3 permanence for CA | Drift exports | restated-as-design | Program design; Ch06 severity and ladder | Nov 11, 2026 |
| 31 | Control names AC-2, AC-6, CA-7, CM-2, CM-3, CM-6, CM-8, IA-5 | Requirements | verified | NIST OSCAL catalog 5.2.0 | Nov 11, 2026 |
| 32 | KSI names (PIY-GIV, IAM-SNU, IAM-ELP, SVC-ASM, MLA-EVC, CMT-LMC); indicators bind providers | Requirements | verified as already cited elsewhere in the workbook (Book 13 Ch11 and others); theme pages listed in c14g-ksi | fedramp.gov 2026 KSI theme pages | Nov 11, 2026 |
| 33 | Conditional Access, PIM and authentication-method read cmdlets' national-cloud tables | Prerequisites | not individually read: *not yet specified* on this page; the page names the Learn API page as the source | — | Nov 11, 2026 |

## What Learn didn't specify (government clouds)

- Key Vault built-in secret policies in Azure Government.
- GitHub Advanced Security for Azure DevOps (Azure DevOps Services) in any government environment.
- Application management policy availability for GCC on the tutorial page.
- National-cloud tables for the Conditional Access, PIM and authentication-methods read APIs were not opened for this pass.

## Not tested

The scripts are written from Learn's documented cmdlets and endpoints and haven't been run against a tenant. They are read-only except the Key Vault policy assignments, the GitHub `PATCH`, and the TCM snapshot request.

## Zero Trust closure, Phase 4, November 11, 2026

Added `#standing-privilege-exceptions` (CM-02, Book 13 part): approval routes, expiry and review cadence, drift rules against Book 04's export, control states and evidence checklist; footnote `c14g-pim-exc`.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| P4-1 | Keep zero permanently active assignments except emergency access accounts | Standing privilege exceptions | verified (new) | Learn, "Plan a Privileged Identity Management deployment," Type of assignments, https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-deployment-plan | Nov 11, 2026 |
| P4-2 | Emergency accounts hold Global Administrator as permanent active; validate at least every 90 days | Standing privilege exceptions | verified (new) | Learn, "Manage emergency access accounts in Microsoft Entra ID," Security guardrails summary, https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access | Nov 11, 2026 |
| P4-3 | Approvers, expiry limits (one year, six months) and drift severities | Standing privilege exceptions | restated-as-design | Program design, reusing Chapter 09's exception routes and Book 04's register categories | Nov 11, 2026 |
