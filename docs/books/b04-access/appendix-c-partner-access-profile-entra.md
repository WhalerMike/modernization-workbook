---
title: "Appendix C — Partner Access Profile (Microsoft Entra)"
description: "The Microsoft Entra implementation profile for the External Partner Person class: the default route through a connected organization and an access package with sponsor, approver and expiry; the cross-tenant access settings and Conditional Access scope that go with it; cross-tenant synchronization as a recorded exception with a required Guest user type, matching, deletion threshold, quarantine and partner-exit cleanup; the profile record; copy-paste validation tests in Microsoft Graph PowerShell; monitoring; the requirements, KSI and evidence map; and the government-cloud availability check."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b04-access
book: B04
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Partner Access Profile (Microsoft Entra)

*A partner account gets access because a sponsor asked, an approver agreed and a date was set, never because it exists or synchronized.*

::: {.callout-note}
## In this appendix
How the agency's Entra tenant admits External Partner Persons. The default route: a connected organization and an access package. The cross-tenant access settings and the Conditional Access scope that go with it, and why the user type decides which policies apply. Cross-tenant synchronization as an exception, with the settings it must carry. The profile record, ten validation tests as copy-paste commands, monitoring, and the requirements, KSIs and evidence for each step. A government-cloud availability check closes the appendix.
:::

[Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md) defines the External Partner Person class: the partner is authoritative for affiliation and the source credential; the agency for federation trust, access eligibility, authorization, monitoring, review, suspension and termination. This appendix is the Entra profile of that standard, and [Book 03, Appendix D](../b03-hr-identity/appendix-d-partner-identity-record.md) is the vendor-neutral record filled in from it. The Externals persona ([Chapter 03](03-the-conditional-access-model.md#personas)) is the Conditional Access view of the same people.

The profile covers partners whose people sign in through their own Microsoft Entra tenant or through a SAML or WS-Fed identity provider. Hybrid cases, such as Kerberos realm trusts or forest trusts to a partner, stay in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#mapping-ad-trusts-to-cross-tenant-access). The examples use the fictional agency `contoso.example` and the partners `fabrikam.example` (a state agency on Entra ID) and `tailspin.example` (a regulated entity with its own identity provider).

## The default route: a connected organization and an access package

For partners outside the agency's own organization, the route is entitlement management with B2B collaboration guests. Microsoft's own guidance points the same way: "For privacy reasons, cross-tenant synchronization is intended for use within an organization. Consider using entitlement management for inviting B2B collaboration users across organizations."[^aC4-cts-overview] [Chapter 09](09-access-governance.md#guest-access-governance) already governs guests this way, so this section adds only the partner-specific settings.

1. **One connected organization per partner.** Its authentication type can be Entra ID in the same cloud, Entra ID in another cloud, SAML/WS-Fed federation, one-time passcode, or Microsoft account.[^aC4-connected-org] The profile allows the first three. Internal sponsors (agency members) and external sponsors (partner guests already in the directory) can both act as approvers.[^aC4-connected-org] The agency sponsor is a named internal sponsor on every connected organization *(design guidance)*.
2. **Configured, never proposed.** A policy open to "All users" creates *proposed* connected organizations automatically.[^aC4-connected-org] The profile never uses it: each partner policy targets **Specific connected organizations** (`allowedTargetScope` = `specificConnectedOrganizationUsers`).[^aC4-policy-resource] A proposed connected organization is a finding.
3. **One access package per partner use case,** in a catalog enabled for external users, and hidden so only people with the request link find it.[^aC4-em-external] The sponsor sends the link to the partner's point of contact.
4. **Approval, then expiry.** Stage 1 is the agency sponsor. Stage 2 is the resource owner for Tier 1 and Tier 2 applications, using the chains in [Chapter 09](09-access-governance.md#policies-who-may-request-who-approves-how-long). Expiry is at most 365 days, with extension on sponsor approval ([Chapter 09](09-access-governance.md#expiration-and-extension)).
5. **Quarterly sponsor review.** Packages and groups with partner guests are reviewed quarterly by the sponsor, with denied guests removed ([Chapter 09](09-access-governance.md#cadence)).
6. **End with the last assignment.** The default blocks sign-in when a governed guest loses their last assignment and removes the account after 30 days;[^aC4-em-external] the profile keeps it: `externalUserLifecycleAction` = `blockSignInAndDelete`, `durationUntilExternalUserDeletedAfterBlocked` = 30 days.[^aC4-em-settings]
7. **No side doors.** Set "Guests can invite" to **No**, so guests can't invite outside entitlement management.[^aC4-em-external]

Learn advises excluding the Entitlement Management app from Conditional Access policies that affect guests, or device, location or MFA re-registration requirements can block My Access.[^aC4-em-external] CA009 requires MFA of partner users on all resources ([Appendix A](appendix-a-conditional-access-templates.md#policy-templates)). Test T1 shows whether a partner user can still request. If not, record an exclusion of that one app in the exception register; don't loosen CA009 *(design guidance)*.

## Tenant relationship and cross-tenant access settings

Every partner on Entra ID gets an organization-specific entry in cross-tenant access settings. Organizational settings override the defaults, and MFA and device claims from other tenants aren't trusted by default.[^aC4-xtap] The mechanics, and the program's inbound allowlist, are in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#cross-tenant-access-settings). [Book 07, Chapter 09](../b07-pki/09-federal-workforce-credentials.md#federation-with-other-agencies-and-partners) covers PIV-backed partners. The profile values are design guidance:

| Setting | Profile value | Why |
|---|---|---|
| Inbound B2B collaboration | Allowed for the partner tenant only, scoped to the access package's applications | Default-deny for every other tenant (Book 02's allowlist) |
| Outbound B2B collaboration | Not changed by this profile | Agency users visiting the partner are a separate decision |
| B2B direct connect | Blocked | Not part of the partner route |
| Trust MFA | On only where the agreement says the partner enforces MFA at home and Conditional Access still requires the strength | Trusting MFA keeps the agency's MFA policies; it only skips the second prompt[^aC4-xtap] |
| Trust compliant device | Off unless the agreement names the partner's device-compliance standard | The agency can't see the partner's compliance policy |
| Trust hybrid joined device | Off | Same reason |
| Automatic redemption (inbound) | Off on the default route; on only with the sync exception, where it's required[^aC4-cts-overview] | The default route has no reason to suppress the consent prompt |
| Microsoft cloud settings | On only for a partner in another Microsoft cloud | See the government-cloud check |
| Tenant restrictions | Recorded, not set here | They govern agency users' external accounts on agency devices, independent of inbound settings[^aC4-xtap] |

The record holds the partner's immutable tenant ID and the names Entra resolves it to (test T0). A partner domain that resolves to another tenant is a stop condition. Changes to these settings are audited under `CrossTenantAccessSettings`.[^aC4-xtap]

For a partner on SAML/WS-Fed federation, such as `tailspin.example`, Conditional Access can require only the MFA grant, not an authentication strength, so the agreement must establish whether the partner's method is phishing-resistant ([Book 07, Chapter 09](../b07-pki/09-federal-workforce-credentials.md#federation-with-other-agencies-and-partners)).

## Conditional Access linkage

No new policy is needed. Five library policies already carry the partner list `{tenant:partners}`: CA009 (MFA) and CA010 (terms of use) include partner users, while CA011, CA012 and CA038 apply guest limits to everyone *except* partner tenants. The list must be identical in all five; a partner in one and not the others is a drift finding ([Appendix A](appendix-a-conditional-access-templates.md#policy-templates)). A partner enters that list only when its access package goes live, and leaves it at partner exit. The IGO (identity governance officer) owns the list ([Chapter 06](06-who-decides-access.md#the-responsibility-matrix)).

The user type decides which of those policies apply. Conditional Access sorts external users into **B2B collaboration guest users** (user type Guest) and **B2B collaboration member users** (user type Member).[^aC4-ca-external] CA009 and CA010 include both. CA011, CA012 and CA038 match only `b2bCollaborationGuest` and `otherExternalUser`, and CA016 excludes every external type. So the user type matters in four places:

- **Directory permissions.** A Member gets member-level default permissions; a Guest can't enumerate users or groups.[^aC4-user-props]
- **Guest-scoped policies.** An external Member from a tenant missing from the list escapes CA011, CA012 and CA038.
- **Persona and group rules.** The Externals persona is user type Guest from partner tenants ([Chapter 03](03-the-conditional-access-model.md#personas)); groups and reviews scoped to guests miss a Member.
- **Microsoft 365.** Microsoft says its services will use the `member` value to give different experiences over time.[^aC4-cts-overview]

Hence **Guest by default**, Member only by an exception record. The read-only check below proves the list is identical in all five policies and matches the tenants in cross-tenant access settings.

```powershell
# READ-ONLY. Compare the partner tenant list across CA009, CA010, CA011, CA012 and CA038,
# and against the organization-specific entries in cross-tenant access settings.
Connect-MgGraph -Scopes 'Policy.Read.All'
$names = 'CA009','CA010','CA011','CA012','CA038'
$policies = (Invoke-MgGraphRequest -Method GET -Uri 'v1.0/identity/conditionalAccess/policies').value |
    Where-Object { $names -contains ($_.displayName -split '-')[0] }
$lists = foreach ($p in $policies) {
    $u = $p.conditions.users
    $t = if ($u.includeGuestsOrExternalUsers.externalTenants.members) { $u.includeGuestsOrExternalUsers.externalTenants.members }
         else { $u.excludeGuestsOrExternalUsers.externalTenants.members }
    [pscustomobject]@{ Policy = $p.displayName; State = $p.state; Tenants = (($t | Sort-Object) -join ',') }
}
$lists | Format-Table -AutoSize
$partners = (Get-MgPolicyCrossTenantAccessPolicyPartner -All).TenantId | Sort-Object
"Distinct lists across the five policies: " + ($lists.Tenants | Sort-Object -Unique).Count + " (expect 1)"
"Cross-tenant partner entries: " + ($partners -join ',')
```

## The exception profile: cross-tenant synchronization

Cross-tenant synchronization pushes the source tenant's internal members into the target tenant as B2B users.[^aC4-cts-overview] For a partner, the partner is the source and the agency is the target. Allow it only when all of these hold, and record each in the exception record *(design guidance)*:

- the partner's people are internal members of an Entra tenant; sync can't push a source tenant's external users, so a partner on another identity provider can't be synced;[^aC4-cts-overview]
- the population is too large or changes too often for per-person requests, and the reason is written down;
- the agreement covers privacy, consent and data minimization, which Microsoft leaves to the customer;[^aC4-cts-overview]
- the privacy office and records officer have seen the attribute list, and the agency business owner decides, with the sponsor named.

| Part | Configured in | Profile requirement |
|---|---|---|
| Inbound "Allow user synchronization into this tenant" | Agency (target) | On for this partner only; group sync off[^aC4-cts-overview] |
| Inbound automatic redemption | Agency (target) | On; sync requires it at both ends[^aC4-cts-overview] |
| Outbound automatic redemption, job, scope, mappings | Partner (source) | Agreed in writing; the agency verifies the result in its own tenant |

The agency doesn't own the mappings, so it states them as terms and tests the outcome:

- **User type.** The `Member (userType)` mapping is a constant that defaults to **Member**, creating external members. The profile requires **Guest**.[^aC4-cts-configure] An existing guest isn't changed to Member unless **Apply this mapping** is set to **Always**.[^aC4-cts-configure] Ask for Guest with Always, so a later change can't quietly promote anyone *(design guidance)*. Test T2 checks every arriving account. A Member result is a stop condition until an exception record exists.
- **Matching.** Matching uses `AltSecIdFromNetId([netId]) (alternativeSecurityIds)`, which the overview calls `alternativeSecurityIdentifier`; changing it or adding a matching attribute gives a `schemaInvalid` error.[^aC4-cts-configure] Sync can't match an internal user in the target, and an email-invited guest who never redeemed can fail to match.[^aC4-cts-overview][^aC4-cts-configure] Test T5 finds both.
- **Minimum attributes.** List every mapped attribute in the record. Photos and custom security attributes can't be synced.[^aC4-cts-overview] `showInAddressList` defaults to True for people search;[^aC4-cts-overview] set it to False unless the use case needs the partner in the address book *(design guidance)*.
- **Deletion threshold.** Accidental-deletion prevention defaults to 500.[^aC4-cts-configure] Set it below the expected unique population and record the value *(design guidance)*.
- **Quarantine and notice.** An unhealthy job goes into quarantine, and email goes to the notification address within 24 hours.[^aC4-cts-configure] Use a partner mailbox that also forwards to the agency sponsor.
- **On-demand provisioning.** Test one user before starting the job.[^aC4-cts-configure]
- **Cycle.** Cycles start at fixed 40-minute intervals,[^aC4-cts-overview] so a partner leaver keeps access for up to a cycle plus run time. Emergency suspension (test T3) doesn't wait for it.
- **Scope.** Use "Sync only assigned users and groups". Only direct members of an assigned group are in scope; nesting doesn't cascade.[^aC4-cts-configure] Record each group's object ID, owner, direct count and the unique count across groups. A user in two groups counts once.

Sync creates the account; it doesn't grant access. Synced partner persons still receive access through an access package assignment with the default route's expiry and quarterly sponsor review *(design guidance)*.

Deprovisioning follows the source. Deleting or unassigning the user, or a scope-filter change, soft-deletes the user in the target, restorable for 30 days; `accountEnabled = false` at the source blocks sign-in at the target.[^aC4-cts-overview] A sign-in block set in the target lasts only until the source user changes, and then sync re-enables the user.[^aC4-cts-overview] So an agency-side suspension of a synced user also removes their access package assignment *(design guidance)*.

**A severed relationship leaves accounts behind.** If the sync policy is deleted, users it created aren't changed or removed.[^aC4-cts-overview] Turning off inbound sync stops future syncs and "has no impact on existing users who have already been synchronized."[^aC4-sync-update] To end cleanly, the partner unassigns all users while the agency keeps inbound sync on until deprovisioning finishes.[^aC4-cts-overview] The agency then turns sync off and deletes whatever remains (test T10).

**Cloud pair and licensing.** Each synced user needs Entra ID P1 in the source tenant; the target needs no license for sync. Group sync and cross-cloud sync need Entra ID Governance or the Entra Suite in the source.[^aC4-cts-overview] Only one sync instance can exist per source and target pair.[^aC4-cts-overview] Cross-cloud sync between Azure commercial and Azure Government carries users only, and `manager` isn't synced across clouds.[^aC4-cts-overview] Manager sync isn't supported in the US Government cloud at all.[^aC4-cts-overview] Don't let any approval rule depend on a synced manager.

**Preview caution.** The Entra overview read on Nov 6, 2026 lists the cross-cloud pairs as supported and doesn't label them preview.[^aC4-cts-overview] A Microsoft 365 page says cross-cloud sync entered public preview in August 2025.[^aC4-m365-crosscloud] Whether it is generally available is **not verified**. Confirm the support level in the portal and in current documentation before the exception is approved.

## The profile record

One record per partner and use case, kept in the repository beside the configuration ([Chapter 10](10-access-as-code-and-evidence.md)). These are the Entra values that [Book 03, Appendix D](../b03-hr-identity/appendix-d-partner-identity-record.md) asks for.

| Item | Required record |
|---|---|
| Tenant relationship | Partner tenant ID and resolved names (T0); route (default or sync exception); for sync, source and target roles; cloud pair; authorized domains; partner validation date and by whom |
| Cross-tenant access | Inbound scope (users, groups, applications); outbound unchanged or the reason; MFA, compliant-device and hybrid-join trust values with the agreement clause behind each; automatic redemption; Microsoft cloud setting; tenant restrictions note |
| Configuration | Connected organization ID and state; catalog and access package IDs; policy ID, `allowedTargetScope`, approvers, expiry, review settings; for sync, configuration object ID, enabled state, notification address, deletion threshold, quarantine owner and recovery steps |
| Assigned groups (sync only) | Group object IDs, owners, approvers, nesting rule (none), direct and unique counts, overlap, date counted |
| Mappings (sync only) | Matching attribute; `userType` = Guest and its apply setting; `userPrincipalName`, `accountEnabled`, `showInAddressList`, any extensions; null handling; collision rule; any Member exception record |
| Access governance | Access packages and application roles; review cadence and reviewer; expiry; sponsor and resource owner; last-assignment setting |
| Validation | Date and result of T0 to T10, with output files |
| Monitoring | Alert rules, log destination and retention, drift check schedule, owner |

## Validation tests

::: {.callout-warning}
## Test tenant first
Run these in a test tenant with a test partner tenant. Commands marked **WRITES** change state; each says how to undo it. Every other command is read-only. Commands were checked against the Microsoft Graph PowerShell reference on Nov 6, 2026 but haven't been run against a tenant.
:::

Set the values once per session from the profile record. `Get-PartnerUsers` finds partner accounts by the B2B `#EXT#` user principal name; confirm that synced accounts follow the same pattern in the test tenant.

```powershell
# READ-ONLY session setup. CONFIGURE the four values from the profile record.
$PartnerTenantId   = '00000000-0000-0000-0000-000000000000'
$PartnerDomain     = 'fabrikam.example'
$AccessPackageName = 'PRT-Fabrikam-CaseReview'
$TestUserEmail     = 'pp-test01@fabrikam.example'
Connect-MgGraph -Scopes 'Policy.Read.All','CrossTenantInformation.ReadBasic.All','EntitlementManagement.Read.All','User.Read.All','AuditLog.Read.All'
$ap = Get-MgEntitlementManagementAccessPackage -Filter "displayName eq '$AccessPackageName'" -ExpandProperty assignmentPolicies
function Get-PartnerUsers { Get-MgUser -All -Property Id,DisplayName,UserPrincipalName,UserType,AccountEnabled,CreationType,ExternalUserState,CreatedDateTime |
    Where-Object { $_.UserPrincipalName -like "*_$($PartnerDomain)#EXT#@*" } }
```

**T0, relationship.** The tenant ID resolves to the partner, and the trust and redemption values match the record.

```powershell
Find-MgTenantRelationshipTenantInformationByTenantId -TenantId $PartnerTenantId | Format-List TenantId, DisplayName, DefaultDomainName
$p = Get-MgPolicyCrossTenantAccessPolicyPartner -CrossTenantAccessPolicyConfigurationPartnerTenantId $PartnerTenantId
$p.InboundTrust | Format-List IsMfaAccepted, IsCompliantDeviceAccepted, IsHybridAzureAdJoinedDeviceAccepted
$p.AutomaticUserConsentSettings | Format-List InboundAllowed, OutboundAllowed
$ap.AssignmentPolicies | Format-List DisplayName, AllowedTargetScope, Expiration
Get-MgEntitlementManagementSetting | Format-List ExternalUserLifecycleAction, DurationUntilExternalUserDeletedAfterBlocked
```

**T1, create.** **WRITES**: creates a guest and an assignment. Undo with T4. Uses the beta module, as Learn documents for a user not yet in the directory.[^aC4-assignments]

```powershell
Connect-MgGraph -Scopes 'EntitlementManagement.ReadWrite.All'
New-MgBetaEntitlementManagementAccessPackageAssignmentRequest -AccessPackageId $ap.Id -AssignmentPolicyId $ap.AssignmentPolicies[0].Id -TargetEmail $TestUserEmail
Get-PartnerUsers | Format-Table UserPrincipalName, UserType, AccountEnabled, CreationType, ExternalUserState, CreatedDateTime
```

Pass: one account, `UserType` = Guest. Then have the test user open `https://myaccess.microsoft.com/@contoso.example` and confirm the request page loads under CA009.

**T2, update and user type.** Every account from the partner is a Guest. For the sync exception, change the test user's display name at the source and rerun after one cycle.

```powershell
Get-PartnerUsers | Group-Object UserType | Format-Table Name, Count
Get-PartnerUsers | Where-Object UserType -ne 'Guest' | Format-Table UserPrincipalName, UserType, CreatedDateTime
```

Pass: no row in the second table, unless a Member exception record names that user.

**T3, disable (emergency suspension).** **WRITES**: blocks sign-in and revokes sessions. Undo in T9.

```powershell
Connect-MgGraph -Scopes 'User.ReadWrite.All','User.RevokeSessions.All'
$u = Get-PartnerUsers | Where-Object UserPrincipalName -like "$($TestUserEmail.Replace('@','_'))#EXT#@*"
Update-MgUser -UserId $u.Id -AccountEnabled:$false
Revoke-MgUserSignInSession -UserId $u.Id
Get-MgUser -UserId $u.Id -Property AccountEnabled | Format-List AccountEnabled
```

**T4, remove.** **WRITES**: removes the assignment. The guest should be blocked, then deleted after the configured days. Learn's removal pattern is used as published.[^aC4-assignments]

```powershell
$filter = "accessPackage/id eq '$($ap.Id)' and state eq 'Delivered' and target/objectId eq '$($u.Id)'"
$a = Get-MgEntitlementManagementAssignment -Filter $filter -ExpandProperty target -All
New-MgEntitlementManagementAssignmentRequest -BodyParameter @{ requestType = 'adminRemove'; assignment = @{ id = $a.Id } }
Get-MgUser -UserId $u.Id -Property AccountEnabled | Format-List AccountEnabled
```

**T5, collision.** Find duplicate accounts for one person and unredeemed invitations that would block a sync match.

```powershell
Get-PartnerUsers | Group-Object { ($_.UserPrincipalName -split '#EXT#')[0] } | Where-Object Count -gt 1 | Format-Table Name, Count
Get-PartnerUsers | Where-Object ExternalUserState -eq 'PendingAcceptance' | Format-Table UserPrincipalName, CreatedDateTime
```

**T6, negative access.** A partner user without an assignment, and a user from a tenant not on the list, are both denied. Have each try the application, then read their sign-ins.

```powershell
$deniedUserId = '00000000-0000-0000-0000-000000000000'   # CONFIGURE: the test user's object ID
Get-MgAuditLogSignIn -Filter "userId eq '$deniedUserId'" -Top 10 |
    Format-Table CreatedDateTime, AppDisplayName, ConditionalAccessStatus, @{N='Error';E={$_.Status.ErrorCode}}
```

Pass: a non-zero error code or a Conditional Access failure on each attempt.

**T7, MFA.** The test user's sign-in shows CA009 applied and satisfied.

```powershell
Get-MgAuditLogSignIn -Filter "userId eq '$($u.Id)'" -Top 5 | ForEach-Object {
    $when = $_.CreatedDateTime
    $_.AppliedConditionalAccessPolicies | Where-Object DisplayName -like 'CA009*' |
    Select-Object @{N='When';E={$when}}, DisplayName, Result }
```

**T8, device.** If the record trusts compliant devices, sign in from a partner-compliant and a non-compliant device against a device-gated application. Read the results with T7's command, filtering on that policy's name. If device trust is off, confirm `IsCompliantDeviceAccepted` is False in T0's output.

**T9, rollback.** **WRITES**: re-enables the test user, or restores a deleted one within 30 days.

```powershell
Update-MgUser -UserId $u.Id -AccountEnabled:$true
(Invoke-MgGraphRequest -Method GET -Uri 'v1.0/directory/deletedItems/microsoft.graph.user').value |
    Where-Object { $_.userPrincipalName -like "*$PartnerDomain*" } | Select-Object id, userPrincipalName, deletedDateTime
# To restore one: Restore-MgDirectoryDeletedItem -DirectoryObjectId '<id from the list>'
```

**T10, partner exit.** **WRITES**: run it only at the end of the relationship, or on the test partner. Remove every assignment (repeat T4's request per assignment). For sync, wait until the partner reports its scope empty and T2 shows no enabled accounts. Then turn inbound sync off and list what is left to delete.

```powershell
Connect-MgGraph -Scopes 'Policy.ReadWrite.CrossTenantAccess','User.ReadWrite.All'
Invoke-MgGraphRequest -Method PATCH -Uri "v1.0/policies/crossTenantAccessPolicy/partners/$PartnerTenantId/identitySynchronization" -Body @{ userSyncInbound = @{ isSyncAllowed = $false } }
Get-PartnerUsers | Format-Table UserPrincipalName, AccountEnabled, CreationType
# Delete each remaining account after the sponsor confirms the list: Remove-MgUser -UserId '<id>'
```

Then remove the partner from `{tenant:partners}` in the tenant map, redeploy the five policies ([Appendix A](appendix-a-conditional-access-templates.md#deploying-the-templates)), and rerun the Conditional Access check above.

## Monitoring

Native sign-in and audit retention is 30 days on P1 and P2, so logs are streamed to the workspace ([Chapter 09](09-access-governance.md#retention-the-logs-dont-keep-themselves)).

| Signal | Where it is | What to watch |
|---|---|---|
| Provisioning logs (sync only) | The **source** tenant: the partner's | Failed and skipped objects, quarantine, deletion-threshold holds. The agency gets them under the agreement.[^aC4-cts-configure] |
| Target-side sync changes | Agency audit log, actor `Microsoft.Azure.SyncFabric`[^aC4-cts-configure] | Creates, updates and deletes per cycle against the expected unique count |
| Entitlement management | Agency audit log, category `EntitlementManagement` ([Chapter 09](09-access-governance.md#the-records-entra-id-produces)) | Requests, approvals, expiries and removals per partner package |
| Sign-ins and Conditional Access | Agency sign-in log; `ConditionalAccessStatus`, `AppliedConditionalAccessPolicies`[^aC4-signin] | CA009 failures, partner users from unexpected locations, denied attempts after removal |
| Cross-tenant settings changes | Audit category `CrossTenantAccessSettings`[^aC4-xtap] | Any change, alerted to the IGO |
| Drift | The repository and the five-policy check | Partner list mismatch; any `UserType` other than Guest without a record; trust values that differ from the record ([Chapter 07](07-the-conditional-access-policy-library.md#drift)) |

```powershell
# READ-ONLY. Target-side sync activity over the last 7 days.
$since = (Get-Date).ToUniversalTime().AddDays(-7).ToString('yyyy-MM-ddTHH:mm:ssZ')
Get-MgAuditLogDirectoryAudit -Filter "category eq 'UserManagement' and activityDateTime ge $since" -All |
    Where-Object { $_.InitiatedBy.App.DisplayName -eq 'Microsoft.Azure.SyncFabric' } |
    Group-Object ActivityDisplayName | Format-Table Name, Count
```

The alerts, as design guidance: a partner account with `UserType` Member and no record (High); a sync cycle that deletes more than the record's daily expectation (High); a partner list mismatch across the five policies (High); a cross-tenant settings change outside a pull request (Medium).

## Requirements, KSIs and evidence

Control mapping is design guidance; the book-level mapping is in [Book 02, Appendix A](../b02-identity/appendix-a-federal-requirements-crosswalk.md#nist-sp-800-53-rev.-5-control-mapping). Each KSI listed is one whose related SP 800-53 controls include the row's control.[^aC4-ksi-iam][^aC4-ksi-mla] KSIs are indicators for cloud service providers. The agency lines its own evidence up with them; it doesn't report KSIs itself.

| Step | SP 800-53 Rev. 5 | KSI | Evidence the ISSO keeps |
|---|---|---|---|
| Partner entry, inbound scope, trust (T0) | AC-3, AC-20, IA-8 | KSI-IAM-ELP, KSI-IAM-APM | T0 output; the cross-tenant settings file; agreement clause for each trust value |
| Access package, approval, expiry | AC-2, AC-2(2), AC-6(7) | KSI-IAM-AAM, KSI-IAM-APM | Policy export; request and approval audit records; review history |
| Create and user type (T1, T2) | AC-2(2), AC-6 | KSI-IAM-AAM, KSI-IAM-ELP | T1 and T2 output; any Member exception record |
| Suspension, removal, exit (T3, T4, T10) | AC-2(3), PS-4 and PS-5 equivalents for the partner | KSI-IAM-AAM, KSI-IAM-ELP | Commands run, timestamps, the post-state reads, the sponsor's exit confirmation |
| Collision and negative access (T5, T6) | AC-3, IA-8 | KSI-IAM-ELP, KSI-IAM-APM | T5 and T6 output with error codes |
| MFA and device (T7, T8) | IA-2(1), IA-8 | KSI-IAM-APM | Sign-in records showing CA009 applied |
| Monitoring and alerts | AU-6, AC-2(4) | KSI-MLA-RVL, KSI-MLA-LET | Alert rules; weekly sync-activity summary; quarantine notices |
| Drift | CA-7, CM-6 | KSI-MLA-EVC | Five-policy check output; drift report per run |

Privacy and records obligations follow [Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md): the attribute list goes to the privacy office, and system access records sit under GRS 3.2 ([Chapter 09](09-access-governance.md#privacy)). The retention of agreements and review records is the records officer's decision; no period is set here.

## Government-cloud availability check

Read on Nov 6, 2026. Recheck before each new partner.

| Feature | Agency tenant (GCC, Entra in Azure commercial) | Partner in GCC High or DoD (Azure Government) |
|---|---|---|
| Entitlement management, connected organizations | Available; Entra ID Governance is offered in GCC, GCC High and DoD[^aC4-gov-features] | Connected organization of type "Entra ID, in another cloud"[^aC4-connected-org] |
| B2B collaboration | Available | Both tenants enable each other's cloud in Microsoft cloud settings; B2B direct connect isn't supported across clouds[^aC4-xtap] |
| Cross-tenant sync, same cloud | Users and groups (commercial to commercial)[^aC4-cts-overview] | Not applicable: the pair is cross-cloud |
| Cross-tenant sync, cross-cloud | Users only; Governance or Suite license in the source; no `manager`[^aC4-cts-overview] | Same; preview status **not verified** |

Workload support differs from directory support. Microsoft notes that Teams doesn't support external members across clouds.[^aC4-m365-crosscloud] Check each application's government service description before promising a partner access to it.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — PIM Role Settings Reference](appendix-b-pim-role-settings.md) · [Book index](index.md)
:::

[^aC4-cts-overview]: Microsoft Learn, "What is cross-tenant synchronization?" (ms.date 2026-11-02), sections Who should use, Properties, Automatic redemption setting, License requirements and Frequently asked questions, <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/cross-tenant-synchronization-overview> (accessed Nov 6, 2026).
[^aC4-cts-configure]: Microsoft Learn, "Configure cross-tenant synchronization" (ms.date 2026-11-02), Steps 7, 9, 10, 11, 12 and 13 and Troubleshooting, <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/cross-tenant-synchronization-configure> (accessed Nov 6, 2026).
[^aC4-sync-update]: Microsoft Learn, "Update crossTenantIdentitySyncPolicyPartner" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/crosstenantidentitysyncpolicypartner-update?view=graph-rest-1.0> (accessed Nov 6, 2026).
[^aC4-connected-org]: Microsoft Learn, "Manage connected organizations in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-organization> (accessed Nov 6, 2026).
[^aC4-em-external]: Microsoft Learn, "Govern access for external users in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-external-users> (accessed Nov 6, 2026).
[^aC4-em-settings]: Microsoft Learn, "entitlementManagementSettings resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/entitlementmanagementsettings?view=graph-rest-1.0> (accessed Nov 6, 2026).
[^aC4-policy-resource]: Microsoft Learn, "accessPackageAssignmentPolicy resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/accesspackageassignmentpolicy?view=graph-rest-1.0> (accessed Nov 6, 2026).
[^aC4-assignments]: Microsoft Learn, "View, add, and remove assignments for an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-assignments> (accessed Nov 6, 2026).
[^aC4-xtap]: Microsoft Learn, "Overview: Cross-tenant access with Microsoft Entra External ID," <https://learn.microsoft.com/entra/external-id/cross-tenant-access-overview> (accessed Nov 6, 2026).
[^aC4-ca-external]: Microsoft Learn, "Authentication and Conditional Access for External ID," section "Conditional Access for external users," <https://learn.microsoft.com/entra/external-id/authentication-conditional-access> (accessed Nov 6, 2026).
[^aC4-user-props]: Microsoft Learn, "Understand and manage the properties of B2B guest users," and "Multitenant user management introduction," <https://learn.microsoft.com/entra/external-id/user-properties>, <https://learn.microsoft.com/entra/architecture/multi-tenant-user-management-introduction> (accessed Nov 6, 2026).
[^aC4-signin]: Microsoft Learn, "signIn resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/signin?view=graph-rest-1.0> (accessed Nov 6, 2026).
[^aC4-m365-crosscloud]: Microsoft Learn, "Cross-cloud collaboration with Microsoft 365," section "CCB2B – Entra ID level," <https://learn.microsoft.com/microsoft-365/enterprise/cross-cloud-collaboration> (accessed Nov 6, 2026).
[^aC4-gov-features]: Microsoft Learn, "Microsoft Entra feature availability," section "Other Microsoft Entra products," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Nov 6, 2026).
[^aC4-ksi-iam]: FedRAMP, *FedRAMP Consolidated Rules for 2026*, Key Security Indicators, "Identity and Access Management" (KSI-IAM-AAM, KSI-IAM-APM, KSI-IAM-ELP), <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/identity-and-access-management/> (accessed Nov 6, 2026).
[^aC4-ksi-mla]: FedRAMP, *FedRAMP Consolidated Rules for 2026*, Key Security Indicators, "Monitoring, Logging, and Auditing" (KSI-MLA-EVC, KSI-MLA-LET, KSI-MLA-RVL), <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/monitoring-logging-and-auditing/> (accessed Nov 6, 2026).
