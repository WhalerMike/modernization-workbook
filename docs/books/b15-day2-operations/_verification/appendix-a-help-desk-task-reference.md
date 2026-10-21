# Verification — Appendix A, Help Desk Task Reference

Writer W3. Source: `docs/operational-guides/helpdesk-entra-operations/help-desk-administrative-responsibilities.md`, shared with Chapter 04. The full section-by-section carry-forward ledger for the source is in `_verification/04-help-desk-authority-in-entra.md`; the ledger below repeats only the sections that landed in this appendix.

Method, October 21, 2026: every role claim checked against Microsoft Learn's "Least privileged roles by task," "Privileged roles and permissions" (who can reset passwords, who can perform sensitive actions) and the role, feature and troubleshooting pages footnoted. Cmdlets checked on the Microsoft Graph PowerShell and ADSync references. Scripts are read-only.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Password Administrator least privileged for non-admin password reset; Helpdesk Admin also can | Credentials | verified | delegate-by-task; privileged-roles-permissions |
| 2 | Synced-user password resets happen in AD or via SSPR writeback | Credentials | restated-as-design, consistent with Ch03's source (ServiceNow spoke limitation) | — |
| 3 | Helpdesk Administrator least privileged to invalidate non-admin refresh tokens | Credentials | verified | delegate-by-task |
| 4 | User Administrator least privileged to reset limited admins; PAA for privileged admins | Credentials | verified | delegate-by-task |
| 5 | AU-scoped roles can't act on admins | Credentials | verified | admin-units-assign-roles |
| 6 | Authentication Administrator least privileged to manage individual user methods; PAA alternative | Credentials | verified | delegate-by-task |
| 7 | Audit activities "Admin deleted security info", "Admin registered security info", "Reset password", "Update StsRefreshTokenValidFrom Timestamp", "Delete application password for user" | Credentials | verified | reference-audit-activities |
| 8 | TAP issue rights (Auth Admin members not self; PAA admins); policy scope | Credentials | verified | TAP how-to |
| 9 | Require re-register deletes methods | Credentials | verified | howto-mfa-userdevicesettings |
| 10 | Restore MFA on remembered devices: Authentication Administrator | Credentials | verified | delegate-by-task |
| 11 | Delete app passwords: Authentication Policy Administrator, Auth Admin also | Credentials | verified | delegate-by-task |
| 12 | Per-user MFA enable/disable: Authentication Administrator; program doesn't use it | Credentials | verified / restated-as-design | delegate-by-task |
| 13 | Methods policy, MFA settings, TAP policy: Authentication Policy Administrator | Credentials | verified | delegate-by-task; TAP how-to |
| 14 | Update all properties except UPN: User Administrator; synced attributes edited in AD | Accounts | verified | delegate-by-task; how-to-create-delete-users |
| 15 | UPN change for non-admins: User or Authentication Administrator per table | Accounts | verified | privileged-roles-permissions |
| 16 | Enable/disable: sensitive action for Auth/User Admin, some users | Accounts | verified | privileged-roles-permissions |
| 17 | Delete users: User Administrator; restorable 30 days | Accounts | verified | delegate-by-task; how-to-create-delete-users |
| 18 | Create guest: Guest Inviter; reset guest invite: Helpdesk Admin | Accounts | verified | delegate-by-task |
| 19 | Assign license: License Administrator (source said User Administrator) | Accounts | corrected | delegate-by-task |
| 20 | Update on-premises sync enabled: Hybrid Identity Administrator | Accounts | verified | delegate-by-task |
| 21 | Audit activities "Update user", "Disable account", "Enable account", "Delete user", "Restore user", "Change user license" | Accounts | verified | reference-audit-activities |
| 22 | Groups Administrator can be AU-scoped and manages groups in the unit; task list names User Administrator for "Add user to group" | Groups | verified | admin-units-assign-roles; delegate-by-task |
| 23 | Enterprise app assignment: custom role appRoleAssignedTo/update; built-in alternatives app owner, Cloud App Admin, App Admin, User Admin | Groups | verified | custom-enterprise-apps; delegate-by-task |
| 24 | Group-based app assignment needs P1 | Groups | verified | assign-user-or-group-access-portal prerequisites |
| 25 | appRoleAssignedTo/read for reading assignments | Groups | verified | custom-enterprise-apps |
| 26 | Audit activities "Add app role assignment to group", "Remove app role assignment from group", "Consent to application" | Groups; diagnostics | verified | reference-audit-activities |
| 27 | Create group: Groups Administrator | Groups | verified | delegate-by-task |
| 28 | Connect Health sync errors: Azure Reader (Owner, Contributor) | Hybrid | verified; source implied an Entra role | delegate-by-task (Connect Health table) |
| 29 | onPremisesImmutableId writable by Auth, User, PAA, GA per table; not Hybrid Identity Admin | Hybrid | verified (source corrected) | Graph users sensitive actions; permissions-reference |
| 30 | Default source anchor = Base64 of mS-DS-ConsistencyGuid or objectGUID | Hybrid; Script 2 | verified | how-to-connect-install-existing-tenant |
| 31 | Hard match blocked for privileged/eligible targets since July 1, 2026 | Hybrid | verified | same |
| 32 | Scheduler default 30 minutes; Start-ADSyncSyncCycle -PolicyType Delta | Hybrid | verified | how-to-connect-sync-feature-scheduler |
| 33 | Sync rules/config: Hybrid Identity Administrator | Hybrid | verified | delegate-by-task (Connect Sync) |
| 34 | Logs: Reports Reader least privileged (source said Application Administrator with PIM) | Diagnostics | corrected | delegate-by-task |
| 35 | Applied CA details: Security Reader; Policy.Read.ConditionalAccess for Graph | Diagnostics; Script 4 | verified | how-to-view-applied-conditional-access-policies |
| 36 | Device compliance check roles | Diagnostics | restated-as-design (reader role; Intune role for detail) | — |
| 37 | Notification triage routes | Diagnostics | restated-as-design; consistent with Book 04 Ch06 (mail from Microsoft escalate-only) | — |
| 38 | UPN change, password update or tenant migration might break OneDrive sync; clear OneAuth and IdentityCache | OneDrive | corrected (source: "always") | troubleshoot cant-sync-after-migration |
| 39 | onedrive.exe /reset path and procedure; full sync after reset | OneDrive | verified | troubleshoot 0x8004de85; 0x8004def7 page |
| 40 | Path limit 400 decoded characters (source: 260 and error 0x8007005A) | OneDrive | corrected; error code removed (not verified) | SharePoint limits |
| 41 | OneDrive created on first browse; pre-provisioning by SharePoint Administrator with SharePoint license; user licensed and allowed to sign in | OneDrive | verified (source's M365 admin center "trigger provisioning" with Global Reader removed) | pre-provision-accounts; Request-SPOPersonalSite |
| 42 | KFM conflict, quota, blocked file types handling | OneDrive | partly not carried: KFM steps and the SharePoint blocked-types path not verified; rows reduced to escalation to SharePoint Administrator | — |
| 43 | Service levels | SLA | restated-as-design | — |
| 44 | Supervisor reporting conditions | Reporting | restated-as-design | — |
| 45 | Cmdlets: Get-MgRoleManagementDirectoryRoleAssignment, Get-MgRoleManagementDirectoryRoleEligibilitySchedule (-Filter), Get-MgUserMemberOf, Get-MgUserOwnedObject, Get-MgGroup, Get-MgDirectoryAdministrativeUnit (IsMemberManagementRestricted), Get-MgDirectoryAdministrativeUnitMember, Get-MgUser, Get-MgUserAuthenticationMethod, Get-MgAuditLogSignIn (AuditLog.Read.All) | Scripts | verified to exist on Learn (Graph PowerShell reference and Book 02 Ch05's verified script); filter behavior not tested against a tenant | Learn cmdlet pages |
| 46 | Get-ADUser with mS-DS-ConsistencyGuid and ObjectGUID | Script 2 | standard ActiveDirectory module usage; not tested | — |

## Carry-forward ledger (sections that landed here)

| Source page § | Went to | Or why not carried |
|---|---|---|
| SAM automation vs help desk manual action | Task tables | Roles corrected |
| Microsoft Security notifications (triage steps and table) | Diagnostics and notifications; escalation matrix | Sender address removed |
| ServiceNow request types | Task rows across all tables | "RITM" → ticket |
| Admin consent triage procedure and decision tree | Notifications paragraph; escalation matrix | Approval chain in Book 04 Ch06 |
| Enterprise app procedures (assign, remove, validate, authorization summary) | Groups and application access | Click path condensed; custom role |
| Hybrid identity (procedure, mismatch identification, Connect Health, Tier 3 escalation) | Hybrid identity table, stop conditions, Script 2 | State-changing procedure moved to identity engineering |
| OneDrive (overview, causes, triage, Entra actions, approvals, workflow, callouts) | OneDrive triage | Corrected path limit, UPN, provisioning; routing triggers left to Ch03/Ch05 |
| Escalation matrix | Escalation matrix | Updated |
| SLA table | Service levels | Labeled design |
| Non-compliance reporting | Conditions a supervisor reports | — |
