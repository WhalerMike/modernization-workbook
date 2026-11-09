---
title: "Appendix C — Partner Access Profile (Microsoft Entra)"
description: "The Microsoft Entra implementation profile for the External Partner Person class: the default route through a connected organization and an access package with sponsor, approver and expiry; the cross-tenant access settings and Conditional Access scope that go with it; cross-tenant synchronization as a recorded exception with a required Guest user type, matching, deletion threshold, quarantine and partner-exit cleanup; the profile record; copy-paste validation tests in Microsoft Graph PowerShell; monitoring; the tenant strategy (multitenant organizations and templates, Tenant Governance discovery and delegated administration, tenant restrictions v2); the requirements, KSI and evidence map; and the government-cloud availability check."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b04-access
book: B04
part: Appendix
series-order: 92
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Partner Access Profile (Microsoft Entra)

*A partner account gets access because a sponsor asked, an approver agreed and a date was set, never because it exists or synchronized.*

::: {.callout-note}
## In this appendix
How the agency's Entra tenant admits External Partner Persons. The default route: a connected organization and an access package. The cross-tenant access settings and the Conditional Access scope that go with it, and why the user type decides which policies apply. Cross-tenant synchronization as an exception, with the settings it must carry. The profile record, ten validation tests as copy-paste commands, and monitoring. Then the tenant strategy for tenants the agency itself owns or finds: multitenant organizations and their templates, Tenant Governance discovery and delegated administration, and tenant restrictions v2. The requirements, KSIs and evidence for each step, and a government-cloud availability check, close the appendix.
:::

[Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md) defines the External Partner Person class: the partner is authoritative for affiliation and the source credential; the agency for federation trust, access eligibility, authorization, monitoring, review, suspension and termination. This appendix is the Entra profile of that standard, and [Book 03, Appendix D](../b03-hr-identity/appendix-d-partner-identity-record.md) is the vendor-neutral record filled in from it. The Externals persona ([Chapter 03](03-the-conditional-access-model.md#personas)) is the Conditional Access view of the same people.

The profile covers partners whose people sign in through their own Microsoft Entra tenant or through a SAML or WS-Fed identity provider. Hybrid cases, such as Kerberos realm trusts or forest trusts to a partner, stay in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#mapping-ad-trusts-to-cross-tenant-access). The examples use the fictional agency `contoso.example` and the partners `fabrikam.example` (a state agency on Entra ID) and `tailspin.example` (a regulated entity with its own identity provider).

## The default route: a connected organization and an access package

For partners outside the agency's own organization, the route is entitlement management with B2B collaboration guests. Microsoft's own guidance points the same way: "For privacy reasons, cross-tenant synchronization is intended for use within an organization. Consider using entitlement management for inviting B2B collaboration users across organizations."[^aC4-cts-overview] [Chapter 09](09-access-governance.md#guest-access-governance) already governs guests this way, so this section adds only the partner-specific settings.

1. **One connected organization per partner.** Its authentication type can be Entra ID in the same cloud, Entra ID in another cloud, SAML/WS-Fed federation, one-time passcode, or Microsoft account.[^aC4-connected-org] The profile allows the first three. Internal sponsors (agency members) and external sponsors (partner guests already in the directory) can both act as approvers.[^aC4-connected-org] The agency sponsor is a named internal sponsor on every connected organization *(design guidance)*.
2. **Configured, never proposed.** A policy open to "All users" creates *proposed* connected organizations automatically.[^aC4-connected-org] The profile never uses it: each partner policy targets **Specific connected organizations** (`allowedTargetScope` = `specificConnectedOrganizationUsers`).[^aC4-policy-resource] A proposed connected organization is a finding.
3. **One access package per partner use case,** in a catalog enabled for external users, and hidden so only people with the request link find it.[^aC4-em-external] The sponsor sends the link to the partner's point of contact.
4. **Approval, then expiry.** Stage 1 is the agency sponsor. Stage 2 is the resource owner for R1 and R2 applications (the application risk tiers of [Chapter 06](06-who-decides-access.md#risk-tiers-set-the-approval-chain)), using the chains in [Chapter 09](09-access-governance.md#policies-who-may-request-who-approves-how-long). Expiry is at most 365 days, with extension on sponsor approval ([Chapter 09](09-access-governance.md#expiration-and-extension)).
5. **Quarterly sponsor review.** Packages and groups with partner guests are reviewed quarterly by the sponsor, with denied guests removed ([Chapter 09](09-access-governance.md#cadence)).
6. **End with the last assignment.** The default blocks sign-in when a governed guest loses their last assignment and removes the account after 30 days;[^aC4-em-external] the profile keeps it: `externalUserLifecycleAction` = `blockSignInAndDelete`, `durationUntilExternalUserDeletedAfterBlocked` = 30 days.[^aC4-em-settings]
7. **No side doors.** Set "Guests can invite" to **No**, so guests can't invite outside entitlement management.[^aC4-em-external]

Learn advises excluding the Entitlement Management app from Conditional Access policies that affect guests, or device, location or MFA re-registration requirements can block My Access.[^aC4-em-external] CA009 requires MFA of partner users on all resources ([Appendix A](appendix-a-conditional-access-templates.md#policy-templates)). Test T1 shows whether a partner user can still request. If not, record an exclusion of that one app in the exception register; don't loosen CA009 *(design guidance)*.

## Tenant relationship and cross-tenant access settings

Every partner on Entra ID gets an organization-specific entry in cross-tenant access settings. Organizational settings override the defaults, and MFA and device claims from other tenants aren't trusted by default.[^aC4-xtap][^aC4-xtap-b2b] The mechanics, and the program's inbound allowlist, are in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#cross-tenant-access-settings). [Book 07, Chapter 09](../b07-pki/09-federal-workforce-credentials.md#federation-with-other-agencies-and-partners) covers PIV-backed partners. The profile values are design guidance:

| Setting | Profile value | Why |
|---|---|---|
| Inbound B2B collaboration | Allowed for the partner tenant only, scoped to the access package's applications | Default-deny for every other tenant (Book 02's allowlist) |
| Outbound B2B collaboration | Not changed by this profile | Agency users visiting the partner are a separate decision |
| B2B direct connect | Blocked | Not part of the partner route |
| Trust MFA | On only where the agreement says the partner enforces MFA at home and Conditional Access still requires the strength | Trusting MFA keeps the agency's MFA policies; it only skips the second prompt[^aC4-xtap] |
| Trust compliant device | Off unless the agreement names the partner's device-compliance standard | The agency can't see the partner's compliance policy |
| Trust hybrid joined device | Off | Same reason |
| Automatic redemption (inbound) | Off on the default route; on only with the sync exception, where it's required[^aC4-cts-overview] | The default route has no reason to suppress the consent prompt |
| Microsoft cloud settings | On only for a partner in another Microsoft cloud | Enabling a cloud blocks all B2B collaboration with it until a tenant from that cloud is added by tenant ID[^aC4-cross-cloud]; see the government-cloud check |
| Tenant restrictions | Recorded, not set here | They govern agency users' external accounts on agency devices, independent of inbound settings[^aC4-xtap][^aC4-trv2]; see [the tenant strategy](#tenant-strategy-multitenant-organizations-and-tenant-governance) |

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

## Tenant strategy: multitenant organizations and Tenant Governance

Everything above is about tenants the agency doesn't own. An agency can also own more than one tenant: a component's or subagency's tenant, a tenant inherited in a reorganization or transfer of function, a nonproduction tenant for testing tenant-wide changes, or an isolated tenant for a critical system. Some tenants exist that nobody approved, created by staff for a trial or a proof of concept. This section sets the program's tenant strategy and the Entra features that carry it.

### How many tenants

Microsoft's tenant estate guidance names five logical tenant roles: the primary production tenant, collaborating production tenants, isolated tenants for critical production systems, isolated tenants for business partner access, and nonproduction tenants. Its rule is to operate as few tenants as security, compliance and operational requirements allow, because every additional tenant adds administration, its own account lifecycle and attack surface, and splitting people who still work together across tenants degrades collaboration and feature support.[^aC4-estate] Where several tenants source identities from the same Active Directory forest, the shared source can undermine the isolation the extra tenant was meant to give.[^aC4-estate-hybrid]

The program's position, as design guidance:

- **One primary production tenant per Microsoft cloud.** Each additional tenant needs a tenant record naming its Learn pattern, the requirement that outweighs the overhead, its owner, its administration pattern (below) and its exit.
- **The agency's own people are not partners.** People homed in a tenant the agency owns are its workforce, not External Partner Persons, so the sync exception above doesn't govern them. Cross-tenant synchronization is the intended tool within an organization;[^aC4-cts-overview] whether they arrive as Member or Guest is a tenant-strategy decision recorded in the tenant record, not a partner exception record.
- **An extra tenant for partners is a design choice, not a default.** Learn describes an isolated partner tenant (sometimes called an extranet tenant) as a valid pattern.[^aC4-estate] The default route in this appendix keeps partners in the primary tenant behind access packages; a separate partner tenant is a tenant record with its own reason.

### Three features, three jobs

| Feature | What it does | Where the program uses it |
|---|---|---|
| Cross-tenant access settings and cross-tenant synchronization | Per-pair inbound, outbound and trust settings; one-way provisioning of B2B users between tenants[^aC4-xtap][^aC4-cts-overview] | Every tenant pair, owned or partner (the sections above) |
| Multitenant organization | A tenant group that draws a boundary around the tenants the organization owns, marks external members from inside it as in-organization, and improves Teams and Viva Engage collaboration across them[^aC4-mto] | Agency-owned production tenants whose people work together in Microsoft 365; never partners |
| Tenant Governance (preview) | Discovery of related tenants, directional governance relationships with cross-tenant delegated administration, configuration monitoring, and governed creation of new tenants[^aC4-tg-overview][^aC4-tg-api] | Finding every tenant connected to the agency's, and administering the ones it owns |

Microsoft calls Tenant Governance and the multitenant organization complementary: Tenant Governance is for discovery, cross-tenant administration and configuration monitoring, the multitenant organization for end-user collaboration in Microsoft 365, and the two tenant lists stay independent of each other.[^aC4-tg-faq]

### Multitenant organization and its templates

One tenant creates the multitenant organization and becomes its owner; it adds other tenants as pending, and each becomes active only when its own administrator joins, which can take up to two hours to process. Any member can leave at any time. A tenant can belong to only one multitenant organization; there can be up to 100 active tenants; a multitenant organization isn't allowed between a Cloud Solution Provider and its customers. It needs Entra ID P1: one license per employee per multitenant organization, and at least one in each tenant.[^aC4-mto]

Joining doesn't bypass cross-tenant access settings. Each pair of tenants needs settings in both directions. When a tenant joins, any missing pair settings are generated unconfigured, which means they pass through each tenant's defaults. The optional **policy templates** pre-set trust (MFA, compliant and hybrid-joined device claims), B2B collaboration and direct connect, automatic redemption and inbound user sync for every pair at join time. A template value of `null` leaves the pair's value alone; a defined value overwrites it. `templateApplicationLevel` chooses whether the template touches new partners, existing partners, both or neither. Forming the multitenant organization in the Microsoft 365 admin center sets automatic redemption inbound and outbound and inbound user sync to `true`. There's no template for leaving: when a tenant leaves, every remaining tenant's administrator re-examines that pair by hand.[^aC4-mto-templates]

Microsoft's limitations page adds what matters for planning. Teams collaboration assumes reciprocally provisioned B2B **members**. Cross-tenant synchronization makes new users members by default but leaves existing guests as guests unless the mapping is set to apply always. Contact objects that collide with provisioned users aren't converted. Purview and Intune don't yet support multitenant organization capabilities, and resetting redemption for a B2B user is disabled inside one.[^aC4-mto-limits]

The program's rules, as design guidance:

1. **Agency-owned tenants only.** A partner tenant never joins the agency's multitenant organization, so in-organization external members are always the agency's own people.
2. **Templates are reviewed before the first join.** Because a configured template overwrites every pair's settings when a tenant joins, the template values sit in the repository with the cross-tenant settings ([Chapter 10](10-access-as-code-and-evidence.md)), and `templateApplicationLevel` is `newPartners` unless the tenant record says otherwise.
3. **Members get member policies.** In-organization members are matched by member-scoped Conditional Access, not by the guest policies CA011, CA012 and CA038. Test with a pilot user from each tenant that the expected policies apply (the sign-in log's `AppliedConditionalAccessPolicies`) before Teams collaboration is announced.
4. **Leaving is a change.** A tenant leaving is a pull request that resets its pair settings in every remaining tenant.

```powershell
# READ-ONLY. The multitenant organization, its tenants, and the two templates.
Connect-MgGraph -Scopes 'MultiTenantOrganization.Read.All','Policy.Read.All'
Get-MgTenantRelationshipMultiTenantOrganization | Format-List DisplayName, State, CreatedDateTime
(Invoke-MgGraphRequest -Method GET -Uri 'v1.0/tenantRelationships/multiTenantOrganization/tenants').value |
    ForEach-Object { [pscustomobject]@{ TenantId = $_.tenantId; Name = $_.displayName; Role = $_.role; State = $_.state } } |
    Format-Table -AutoSize
Get-MgPolicyCrossTenantAccessPolicyTemplateMultiTenantOrganizationPartnerConfiguration | Format-List
Get-MgPolicyCrossTenantAccessPolicyTemplateMultiTenantOrganizationIdentitySynchronization | Format-List
```

Learn's cmdlet page lists `MultiTenantOrganization.ReadWrite.All` as the least-privileged permission for reading the tenant list. If the read-only scope is refused, ask the IGO before consenting to the write scope.[^aC4-mto-graph] The template reads need `Policy.Read.All` and Security Reader or Global Reader.[^aC4-mto-template-graph]

### Tenant Governance: finding tenants and administering them

Tenant Governance is in preview.[^aC4-tg-api] Its four parts map to the program's tenant strategy:

- **Related tenants (discovery).** Once a Tenant Governance Administrator or Global Administrator turns it on, Entra surfaces tenants connected to the agency's by B2B collaboration, multitenant applications and shared billing accounts, with order-of-magnitude activity metrics. Turning it on can't be undone. A related tenant isn't proof of ownership: it may be a partner, a SaaS provider, a Microsoft-managed tenant, or an unsanctioned tenant a member of staff created.[^aC4-tg-related][^aC4-tg-discovery]
- **Governance relationships.** A directional relationship in which a governing tenant governs a governed tenant, set up by a three-step handshake (invitation, request with a governance policy template, acceptance). One tenant can govern many, many can govern one, but a tenant can't be both governing and governed. The governed tenant can always end the relationship.[^aC4-tg-relationships][^aC4-tg-faq]
- **Cross-tenant delegated administration.** The governance policy template maps Entra built-in roles to security groups in the governing tenant; the governed tenant gets group proxies with those roles (granular delegated admin privileges, GDAP), so administrators use their home accounts and no local or B2B admin accounts are needed. Azure and Defender roles are separate assignments the governed tenant makes afterwards. The governed tenant sees governing administrators in its own sign-in and audit logs. PIM for Groups in the governing tenant is the supported way to make those memberships just in time.[^aC4-tg-delegated][^aC4-tg-faq] A Tenant Governance relationship can't coexist with a Partner Center GDAP relationship between the same two tenants.[^aC4-tg-faq]
- **Configuration management and secure tenant creation.** Monitors compare a tenant's configuration with a JSON baseline every six hours, and new add-on tenants can be created already governed.[^aC4-tg-overview] The program's drift baseline already uses configuration management ([Chapter 10](10-access-as-code-and-evidence.md)).

Learn's tenant estate guidance compares three ways to administer several tenants: cross-tenant delegated administration, B2B admin accounts, and local admin accounts in each tenant. It notes that the target tenant's Conditional Access and audit logs apply in every case.[^aC4-estate] The program's choice, as design guidance: delegated administration through a governance relationship for agency-owned production and nonproduction tenants, with the governing groups managed by PIM for Groups under the tier model ([Chapter 04](04-privileged-roles-and-tiers.md)); local accounts only for a tenant whose record requires isolation from every other tenant (an isolated critical-system tenant); B2B admin accounts not used.

**Unsanctioned tenants.** Discovery turns up tenants nobody approved. The IGO reviews each related tenant that isn't a known partner or Microsoft-managed: a tenant the agency owns is brought under a governance relationship or retired; one whose administrators won't accept governance is quarantined. Microsoft's FAQ points to the quarantine procedure in that case, which blocks the other tenant's users and applications from agency resources.[^aC4-tg-faq] [Chapter 09](09-access-governance.md#tenant-hygiene-unsanctioned-tenants-and-microsoft-365-groups) carries the quarantine steps.

```http
# READ-ONLY (beta, preview). Related tenants with their discovery metrics.
GET https://graph.microsoft.com/beta/directory/tenantGovernance/relatedTenants
```

The request is Learn's first step for investigating related tenants.[^aC4-tg-api] Run it in Graph Explorer or through `Invoke-MgGraphRequest` as a Tenant Governance reader, and keep the output with the tenant records.

### Tenant restrictions v2: the outbound edge

The partner route controls who comes in. Tenant restrictions control which external tenants agency users can sign in to from agency devices and networks; they're configured in cross-tenant access settings but operate separately from inbound and outbound settings.[^aC4-trv2] Version 1 was a proxy header allowlist (`Restrict-Access-To-Tenants`) that protected only the authentication plane. Version 2 is a cloud policy: a default policy, plus a partner policy per allowed tenant. It's signalled by universal tenant restrictions through Global Secure Access, by a proxy header, or by Windows device management, which also gives data-plane protection on managed Windows devices.[^aC4-trv2] Migrating means keeping the v2 default that blocks external tenants, creating a partner policy for each tenant on the v1 allowlist, and removing the v1 headers from the proxy.[^aC4-trv2-migration]

The program sets tenant restrictions v2 as the outbound counterpart of the partner list *(design guidance)*: default block; a partner policy for each agency-owned tenant and each partner tenant whose access package lists outbound use; and the Microsoft account tenant blocked. Signalling uses Windows device management on managed devices. Universal tenant restrictions waits on Global Secure Access, which Learn doesn't yet support in GCC High or DoD ([Chapter 07](07-the-conditional-access-policy-library.md)).

### Government clouds

| Feature | Agency tenant in GCC (Entra in Azure commercial) | Tenants in GCC High or DoD (Azure Government) |
|---|---|---|
| Multitenant organization | Learn conflicts: its limitations page lists "multitenant organizations in Microsoft 365 Government" and "in Azure Government" as unsupported, and in the same list says multitenant organizations are available in GCC, GCC High and DoD with same-cloud tenants only[^aC4-mto-limits] | Same conflict; cross-cloud multitenant organizations aren't supported[^aC4-mto-limits] |
| Multitenant organization templates (Graph) | Global service[^aC4-mto-template-graph] | Not available in US Government L4 or L5[^aC4-mto-template-graph] |
| B2B collaboration across clouds | Commercial and Azure Government can collaborate once both enable each other in Microsoft cloud settings; B2B direct connect isn't supported across clouds[^aC4-cross-cloud][^aC4-b2b-gov] | Within Azure Government, B2B works only between tenants that both support it (`tenant_region_scope` `USGOV`)[^aC4-b2b-gov] |
| Tenant Governance | Not yet specified | Not yet specified |
| Tenant restrictions v2 | Not yet specified | Not yet specified |

Until Microsoft resolves the multitenant organization conflict in writing, the program doesn't plan Teams collaboration on a multitenant organization in a government cloud. It uses the cross-tenant settings and synchronization above, and confirms the support level with Microsoft before any tenant joins.

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
| Tenant strategy: tenant records, multitenant organization, governance relationships, tenant restrictions | AC-2, AC-6(5), AC-20, CM-8 | KSI-IAM-ELP | Tenant records; template and tenant-list reads; related-tenant review with the IGO's decision per tenant; governance policy templates and PIM for Groups settings; tenant restrictions v2 policy export |

Privacy and records obligations follow [Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md): the attribute list goes to the privacy office, and system access records sit under GRS 3.2 ([Chapter 09](09-access-governance.md#privacy)). The retention of agreements and review records is the records officer's decision; no period is set here.

## Government-cloud availability check

Read on Nov 6, 2026. Recheck before each new partner.

| Feature | Agency tenant (GCC, Entra in Azure commercial) | Partner in GCC High or DoD (Azure Government) |
|---|---|---|
| Entitlement management, connected organizations | Available; Entra ID Governance is offered in GCC, GCC High and DoD[^aC4-gov-features] | Connected organization of type "Entra ID, in another cloud"[^aC4-connected-org] |
| B2B collaboration | Available | Both tenants enable each other's cloud in Microsoft cloud settings; B2B direct connect isn't supported across clouds; the partner is added by tenant ID, not domain, and invited by UPN[^aC4-xtap][^aC4-cross-cloud][^aC4-b2b-gov] |
| Cross-tenant sync, same cloud | Users and groups (commercial to commercial)[^aC4-cts-overview] | Not applicable: the pair is cross-cloud |
| Cross-tenant sync, cross-cloud | Users only; Governance or Suite license in the source; no `manager`[^aC4-cts-overview] | Same; preview status **not verified** |
| Multitenant organization | See [the tenant strategy](#tenant-strategy-multitenant-organizations-and-tenant-governance): same-cloud only; Learn's statements conflict[^aC4-mto-limits] | Cross-cloud multitenant organization not supported[^aC4-mto-limits] |
| Tenant Governance (preview) | Not yet specified | Not yet specified |

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
[^aC4-xtap-b2b]: Microsoft Learn, "Manage cross-tenant access settings for B2B collaboration," <https://learn.microsoft.com/entra/external-id/cross-tenant-access-settings-b2b-collaboration> (accessed Nov 9, 2026).
[^aC4-cross-cloud]: Microsoft Learn, "Enable B2B collaboration across Microsoft clouds" (Microsoft cloud settings), <https://learn.microsoft.com/entra/external-id/cross-cloud-settings> (accessed Nov 9, 2026).
[^aC4-b2b-gov]: Microsoft Learn, "Microsoft Entra B2B in government and national clouds," <https://learn.microsoft.com/entra/external-id/b2b-government-national-clouds> (accessed Nov 9, 2026).
[^aC4-trv2]: Microsoft Learn, "Set up tenant restrictions v2," sections Tenant restrictions v2 overview, Compare tenant restrictions v1 and v2, and Tenant restrictions vs. inbound and outbound settings, <https://learn.microsoft.com/entra/external-id/tenant-restrictions-v2> (accessed Nov 9, 2026).
[^aC4-trv2-migration]: Microsoft Learn, "Set up tenant restrictions v2," section Migrate tenant restrictions v1 policies to v2 on the proxy, <https://learn.microsoft.com/entra/external-id/tenant-restrictions-v2>; "Plan a Tenant Restrictions v1 Migration to Tenant Restrictions v2," <https://learn.microsoft.com/entra/external-id/tenant-restrictions-migration> (accessed Nov 9, 2026).
[^aC4-estate]: Microsoft Learn, "Microsoft Entra tenant estate guidance introduction," sections Tenant architecture patterns, When to integrate an app or workload with an existing tenant, Tenant lifecycle governance and Multitenant administration patterns, <https://learn.microsoft.com/entra/architecture/tenant-estate-guide>; "Microsoft Entra tenant estate guidance for business partner access," <https://learn.microsoft.com/entra/architecture/tenant-estate-business-partner> (accessed Nov 9, 2026).
[^aC4-estate-hybrid]: Microsoft Learn, "Microsoft Entra tenant estate guidance for hybrid identity and isolation," <https://learn.microsoft.com/entra/architecture/tenant-estate-hybrid-identity> (accessed Nov 9, 2026).
[^aC4-mto]: Microsoft Learn, "What is a multitenant organization in Microsoft Entra ID?," sections How does a multitenant organization work, Tenant role and state, Constraints, Limits and License requirements, <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/multi-tenant-organization-overview> (accessed Nov 9, 2026).
[^aC4-mto-templates]: Microsoft Learn, "Multitenant organization optional policy templates," <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/multi-tenant-organization-templates>; "Configure multitenant organization policy templates using the Microsoft Graph API," <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/multi-tenant-organization-configure-templates> (accessed Nov 9, 2026).
[^aC4-mto-limits]: Microsoft Learn, "Limitations in multitenant organizations," sections Scope, Cross-tenant synchronization in Microsoft Entra admin center, Microsoft apps, and B2B users or B2B members, <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/multi-tenant-organization-known-issues> (accessed Nov 9, 2026).
[^aC4-mto-graph]: Microsoft Learn, "Configure a multitenant organization using PowerShell or Microsoft Graph API," <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/multi-tenant-organization-configure-graph>; "Get-MgTenantRelationshipMultiTenantOrganizationTenant" and "Get-MgTenantRelationshipMultiTenantOrganization" (Microsoft Graph PowerShell), <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/get-mgtenantrelationshipmultitenantorganizationtenant>, <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/get-mgtenantrelationshipmultitenantorganization> (accessed Nov 9, 2026).
[^aC4-mto-template-graph]: Microsoft Learn, "Get multiTenantOrganizationPartnerConfigurationTemplate" (Microsoft Graph v1.0; national cloud table and permissions), <https://learn.microsoft.com/graph/api/multitenantorganizationpartnerconfigurationtemplate-get?view=graph-rest-1.0> (accessed Nov 9, 2026).
[^aC4-tg-overview]: Microsoft Learn, "What is Microsoft Entra Tenant Governance?," <https://learn.microsoft.com/entra/id-governance/tenant-governance/overview> (accessed Nov 9, 2026).
[^aC4-tg-faq]: Microsoft Learn, "Frequently asked questions for Microsoft Entra Tenant Governance," <https://learn.microsoft.com/entra/id-governance/tenant-governance/faq> (accessed Nov 9, 2026).
[^aC4-tg-related]: Microsoft Learn, "Related tenants in Tenant Governance," <https://learn.microsoft.com/entra/id-governance/tenant-governance/related-tenants> (accessed Nov 9, 2026).
[^aC4-tg-discovery]: Microsoft Learn, "Enable tenant discovery," <https://learn.microsoft.com/entra/id-governance/tenant-governance/how-to-enable-tenant-discovery> (accessed Nov 9, 2026).
[^aC4-tg-api]: Microsoft Learn, "Investigate related tenant signals by using Microsoft Graph (preview)" (states that Tenant Governance is in preview), <https://learn.microsoft.com/entra/id-governance/tenant-governance/how-to-investigate-related-tenants-api> (accessed Nov 9, 2026).
[^aC4-tg-relationships]: Microsoft Learn, "Governance relationships," <https://learn.microsoft.com/entra/id-governance/tenant-governance/governance-relationships> (accessed Nov 9, 2026).
[^aC4-tg-delegated]: Microsoft Learn, "Cross-tenant delegated administration," <https://learn.microsoft.com/entra/id-governance/tenant-governance/cross-tenant-delegated-administration> (accessed Nov 9, 2026).
