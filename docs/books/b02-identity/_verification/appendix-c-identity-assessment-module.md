# Verification — Appendix D, Identity Assessment Module

Source: `docs/operational-guides/identity/identity-modernization.md` (Appendices A–D). All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Graph property names in the attribute table | Attribute mapping | verified | Graph user resource v1.0 |
| 2 | `objectGUID` → `onPremisesImmutableId` unconditionally | Attribute mapping | corrected (only where objectGUID is the source anchor; ConsistencyGuid is default) | how-to-connect-install-existing-tenant |
| 3 | `cn` → `displayName (mapped)` | Attribute mapping | corrected (synced; no separate Graph property) | reference-connect-sync-attributes-synchronized |
| 4 | `pwdLastSet` used to invalidate tokens | Attribute mapping | verified (added) | reference-connect-sync-attributes-synchronized |
| 5 | `lastLogonTimestamp` → `signInActivity.lastSignInDateTime` | Attribute mapping | corrected (not a mapping; separate signal; P1 and AuditLog.Read.All) | Graph user resource |
| 6 | `c`/`co`/`countryCode` | Attribute mapping | corrected (all synced; confirm which feeds `country`) | reference-connect-sync-attributes-synchronized |
| 7 | `thumbnailPhoto` → photo | Attribute mapping | verified (synced to M365 profile photo periodically) | reference-connect-sync-attributes-synchronized |
| 8 | `userCertificate` "CBA uses separate config" | Attribute mapping | verified/restated (synced for Exchange; CBA uses username bindings) | reference-connect-sync-attributes-synchronized |
| 9 | Extension attribute assignments | Extension attributes | restated-as-design | program design |
| 10 | HireDate/TermDate in ext7/ext8 drive workflows | Extension attributes | corrected (LCW reads native employeeHireDate/employeeLeaveDateTime; ext7/8 are AD carriers mapped by sync) | lifecycle-workflow-on-premises |
| 11 | Built-in auth strength listing via Graph (beta) | CA templates | verified | concept-authentication-strengths |
| 12 | GCC uses graph.microsoft.com; graph.microsoft.us is GCC High | CA templates | verified | graph/deployments |
| 13 | CA JSON schema (clientAppTypes, grantControls, sessionControls) | CA templates | unverifiable in full (structure carried from source; CA015 matches Microsoft's sample) | conditional-access/workload-identity |
| 14 | CA013 password change + MFA | CA templates | corrected (riskRemediation; needs Prefer header; auth strength and every-time sign-in frequency applied) | conditionalaccessgrantcontrols; howto-identity-protection-configure-risk-policies |
| 15 | CA015 workload identity JSON, beta endpoint | CA templates | verified | conditional-access/workload-identity |
| 16 | CA002 template family | CA templates | corrected (retired) | security-emergency-access |
| 17 | Export with Get-MgIdentityConditionalAccessPolicy | CA export | verified (cmdlet carried from source; Microsoft.Graph.Identity.SignIns) | — (cmdlet naming per Graph SDK) |
| 18 | MSOnline/AzureAD deprecated Mar 30, 2024; MSOnline retired Apr–May 2025; AzureAD retired early Jul 2025 | Tooling | verified | Entra what's-new archive (Jan 2025) |
| 19 | Convert-MsolDomainToStandard → Remove-MgDomainFederationConfiguration / Update-MgDomain Managed | Tooling | verified | azuread-msoline-cmdlet-map; migrate-from-federation |
| 20 | Eligible vs active via `ScheduleInfo` on role assignments | Module | corrected (property doesn't exist there; use assignment and eligibility schedules) | unifiedroleassignmentschedule; Get-MgRoleManagementDirectoryRoleEligibilitySchedule |
| 21 | `assignmentType` Assigned/Activated | Module | verified | unifiedroleassignmentschedule |
| 22 | Connect-MgGraph `-Environment`, `-NoWelcome` | Module | verified | Connect-MgGraph reference |
| 23 | PIM activation audit activity name | Module | verified | reference-audit-activities |
| 24 | `adminCount` remains 1 after removal | Module | verified | reducing-the-active-directory-attack-surface |
| 25 | Gitea API token header, `/api/v1/`, label IDs | Module | verified | docs.gitea.com/development/api-usage; gitea.com/swagger.v1.json |
| 26 | GET /repos/{owner}/{repo}/labels exists | Module | verified | gitea.com/swagger.v1.json |
| 27 | PowerShellVersion 7.2 | Manifest | restated-as-design (raised to 7.4 as program minimum; not footnoted) | — |
| 28 | ASCII banner spelling a former program name | Module | removed (brief forbids the name) | — |

## Code changes made in restoration

- All code restored from flattened, backslash-escaped text into indented, fenced blocks.
- `Get-FMPUserInventory`: inverted UPN flag logic fixed; optional `-VerifiedDomain`; `ADMINSDHOLDER_PROTECTED` renamed `ADMINCOUNT_SET`.
- `Get-FMPServiceAccountInventory`: stub replaced with the full function; recommendation order fixed.
- `Get-FMPPrivilegedAccessReport`: rebuilt on PIM schedule cmdlets; principal name fallback to `PrincipalId`; UTC time.
- `New-FMPGiteaDriftIssue`: undefined helper `Get-FMPGiteaLabelId` now implemented; code fence built from a variable; `SupportsShouldProcess` added.
- `Invoke-FMPIdentityAssessment`: banner removed; drift output lists names.
- Manifest: `RequiredModules` updated to the modules the code actually calls; placeholder GUID.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Appendix A — Identity attribute mapping reference | Appendix D "Attribute mapping reference" and "Extension attribute assignments" | Empty "Mapping" column replaced with notes |
| Appendix B — CA policy templates (note box) | Appendix D "Conditional Access policy templates" callout | |
| Appendix B — CA001 | Appendix D "CA001" | |
| Appendix B — CA003 | Appendix D "CA003" | |
| Appendix B — CA006 | Appendix D "CA006" | |
| Appendix B — CA008 | Appendix D "CA008" | Travel exception group added |
| Appendix B — CA013 | Appendix D "CA013" | Rebuilt for risk remediation |
| Appendix B — CA015 | Appendix D "CA015" | |
| Appendix B — remaining policies note + export script | Appendix D closing paragraph and export block | CA002 marked retired |
| Appendix C — C.1 Module manifest | Appendix D "Module manifest" | |
| Appendix C — C.2 Get-FMPUserInventory | Appendix D "Module settings and user inventory" | |
| Appendix C — C.2 Get-FMPGroupInventory | Appendix D "Group inventory" | |
| Appendix C — C.2 Get-FMPServiceAccountInventory (stub) | Appendix D "Service account inventory" (full body) | |
| Appendix C — C.2 Get-FMPPrivilegedAccessReport | Appendix D "Privileged access report" | Rewritten |
| Appendix C — C.2 Get-FMPLegacyAuthReport | Appendix D "Legacy authentication report" | |
| Appendix C — C.2 Export-FMPIdentityBaseline | Appendix D "Baseline export" | |
| Appendix C — C.2 Invoke-FMPIdentityAssessment | Appendix D "The orchestrator" | |
| §14.3 New-FMPGiteaDriftIssue (from Ch10's source range) | Appendix D "Drift issues in the Git host" | Consolidated into the module |
| Appendix D — Companion document cross-reference matrix | — | Not carried, per assignment: companion documents aren't B02 pages |
