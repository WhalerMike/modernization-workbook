---
title: "Appendix C — Identity Assessment Module"
description: "Reference material for Chapters 09 and 10: the full Active Directory to Microsoft Entra ID attribute mapping, Conditional Access policy templates in Microsoft Graph JSON, and the FMPIdentityAssessment PowerShell module."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b02-identity
book: B02
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Identity Assessment Module

*The reference material behind the identity chapters: what each attribute becomes, what each policy looks like on the wire, and the code that measures the gap.*

::: {.callout-note}
## In this appendix
The full mapping of commonly used Active Directory user attributes to Microsoft Graph properties, including the program's assignments for the fifteen extension attributes. Conditional Access policy templates in Microsoft Graph JSON for the policy set in [Chapter 09](09-building-the-entra-target.md#the-policy-set). The FMPIdentityAssessment PowerShell module that [Chapter 10](10-migrating-and-governing.md) schedules for drift detection, written against Microsoft Graph PowerShell.
:::

## Attribute mapping reference

The table maps commonly used Active Directory user attributes to Microsoft Graph user properties. Whether an attribute actually flows depends on the sync engine's attribute mappings; Microsoft publishes the list of attributes Connect Sync synchronizes, grouped by workload.[^aC-synced-attributes] Property names are from the Microsoft Graph v1.0 user resource.[^aC-user-resource]

| AD attribute | Microsoft Graph property | Notes |
|---|---|---|
| `sAMAccountName` | `onPremisesSamAccountName` | Read-only in Entra ID for synced users |
| `userPrincipalName` | `userPrincipalName` | Suffix must be a verified domain |
| `mS-DS-ConsistencyGuid` | `onPremisesImmutableId` (Base64) | The default source anchor; the hard-match key |
| `objectGUID` | `onPremisesImmutableId` (Base64), only where `objectGUID` is the configured source anchor | Older installations; can't be changed on the AD object |
| `objectSid` | `onPremisesSecurityIdentifier` | Must be unique in the tenant |
| `distinguishedName` | `onPremisesDistinguishedName` | Read-only; useful for tracing OU placement during the transition |
| `cn` | No separate property | Synced, but not exposed as its own Graph user property |
| `displayName`, `givenName`, `sn` | `displayName`, `givenName`, `surname` | Direct |
| `mail`, `mailNickname`, `proxyAddresses` | `mail`, `mailNickname`, `proxyAddresses` | The primary SMTP address in `proxyAddresses` is a soft-match key |
| `userAccountControl` | `accountEnabled` | The disabled bit becomes a Boolean |
| `pwdLastSet` | `lastPasswordChangeDateTime` | Also used to invalidate issued tokens after a password change[^aC-synced-attributes] |
| `whenCreated` | `createdDateTime` | The date the object reached Entra ID, not the AD creation date |
| `whenChanged` | No equivalent | |
| `lastLogonTimestamp` | No mapping; use `signInActivity/lastSignInDateTime` | A separate signal from Entra ID sign-ins; needs P1 and `AuditLog.Read.All`[^aC-user-resource] |
| `department`, `title`, `company` | `department`, `jobTitle`, `companyName` | Direct |
| `manager`, `directReports` | `manager`, `directReports` (relationships) | Resolved as relationships |
| `telephoneNumber`, `mobile`, `facsimileTelephoneNumber` | `businessPhones`, `mobilePhone`, `faxNumber` | Direct |
| `streetAddress`, `l`, `st`, `postalCode` | `streetAddress`, `city`, `state`, `postalCode` | Direct |
| `c`, `co`, `countryCode` | `country` | All three are synced; confirm which one your mapping writes to `country` |
| `physicalDeliveryOfficeName` | `officeLocation` | Direct |
| `employeeID`, `employeeType` | `employeeId`, `employeeType` | Direct; both usable in Lifecycle Workflows scope rules |
| `memberOf`, `member` | `memberOf`, `members` (relationships) | Resolved by the sync engine |
| `description`, `info` | No user property | Not carried on the user object |
| `servicePrincipalName` | No user property | Service principal objects have `servicePrincipalNames`, a different concept |
| `thumbnailPhoto` | Profile photo | Synced to the Microsoft 365 profile photo periodically[^aC-synced-attributes] |
| `userCertificate` | No user property in Graph v1.0 | Synced for Exchange; certificate-based authentication uses its own username bindings instead |
| `msDS-UserPasswordExpiryTimeComputed` | No equivalent | Cloud password policy is separate |
| `adminCount` | No equivalent | PIM replaces AdminSDHolder protection |
| `accountExpires` | No equivalent | The program copies the HR end date to `extensionAttribute3` |
| `extensionAttribute1`–`15` | `onPremisesExtensionAttributes/extensionAttribute1`–`15` | Program assignments below |

### Extension attribute assignments

The program's assignment of the fifteen extension attributes is the program attribute map in [Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map), which every book uses. Any agency can reassign the slots, but the dynamic groups, Conditional Access personas, workflows and module in this book assume that map. The slots this book reads are:

| Attribute | Program meaning | Used by |
|---|---|---|
| `extensionAttribute2` | Hire date, AD-side carrier | Mapped to `employeeHireDate` by a sync rule |
| `extensionAttribute3` | Leave date, AD-side carrier | Mapped to `employeeLeaveDateTime` by a sync rule |
| `extensionAttribute4` | Region code | Dynamic groups |
| `extensionAttribute5` | Cost center code | License assignment groups |
| `extensionAttribute6` | Division code | Mover trigger; dynamic administrative units |
| `extensionAttribute7` | Account type: `Standard`, `Service`, `Privileged` | Conditional Access Admins persona; service account scoping |
| `extensionAttribute9` | Clearance level | Restricted access packages |
| `extensionAttribute10` | Organization code | Dynamic groups (alongside `department`) |
| `extensionAttribute11` | Worker type code, such as `EMP` or `CTR` | Conditional Access Internals persona |
| `extensionAttribute12` | Position category | Mover trigger; access package auto-assignment |
| `extensionAttribute15` | `DoNotSync` | Excludes an object from sync |

Earlier versions of this appendix gave department code, classification and role their own slots. They are the organization code, worker type code and position category of the program map, and the hire and end dates moved to slots 2 and 3, where Microsoft's Oracle HCM worksheet puts them. Where a native property exists, it holds the value and the slot is the copy a rule can read: `department` beside the organization code, `employeeType` beside the worker type code, and `employeeOrgData` beside the division and cost center codes.

Lifecycle Workflows read the native `employeeHireDate` and `employeeLeaveDateTime` properties, not the extension attributes. For synced users, map the HR dates from AD into those properties during sync, as Microsoft documents for Lifecycle Workflows.[^aC-lcw-sync-attributes] Extension attributes 2 and 3 are the AD-side carriers for that mapping.

## Conditional Access policy templates

These templates express policies from [Chapter 09](09-building-the-entra-target.md#the-policy-set) as Microsoft Graph `conditionalAccessPolicy` JSON. Import them with `New-MgIdentityConditionalAccessPolicy -BodyParameter`, or export your own configured policies with the snippet at the end of this section.

::: {.callout-note}
## Placeholders and endpoints
The templates use placeholders such as `<GUID-BreakGlassExclusionGroup>` for group, named location, and authentication strength IDs. Replace every placeholder with your tenant's values before import. List the built-in authentication strengths and their IDs with `GET /policies/authenticationStrengthPolicies?$filter=policyType eq 'builtIn'` (beta).[^aC-auth-strengths] A GCC tenant uses the worldwide Microsoft Graph endpoint, `https://graph.microsoft.com`; `https://graph.microsoft.us` is for GCC High.[^aC-graph-clouds] Every template is created in report-only state (`enabledForReportingButNotEnforced`).
:::

### CA001: block legacy authentication

```json
{
  "displayName": "CA001-AllUsers-BlockLegacyAuth",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["<GUID-BreakGlassExclusionGroup>"]
    },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["exchangeActiveSync", "other"]
  },
  "grantControls": {
    "operator": "OR",
    "builtInControls": ["block"]
  }
}
```

### CA003: admins require phishing-resistant MFA

```json
{
  "displayName": "CA003-Admins-RequirePhishResistantMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGroups": ["<GUID-AdminsGroup>"],
      "excludeGroups": ["<GUID-BreakGlassExclusionGroup>"]
    },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["browser", "mobileAppsAndDesktopClients"]
  },
  "grantControls": {
    "operator": "OR",
    "authenticationStrength": { "id": "<GUID-PhishingResistantMFA>" }
  },
  "sessionControls": {
    "signInFrequency": { "value": 4, "type": "hours", "isEnabled": true }
  }
}
```

### CA006: internals require MFA

```json
{
  "displayName": "CA006-Internals-RequireMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGroups": ["<GUID-InternalsGroup>"],
      "excludeGroups": ["<GUID-BreakGlassExclusionGroup>", "<GUID-AdminsGroup>"]
    },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["browser", "mobileAppsAndDesktopClients"]
  },
  "grantControls": {
    "operator": "OR",
    "authenticationStrength": { "id": "<GUID-MFA>" }
  },
  "sessionControls": {
    "signInFrequency": { "value": 12, "type": "hours", "isEnabled": true }
  }
}
```

### CA008: block sign-ins from outside the United States for internals

```json
{
  "displayName": "CA008-Internals-BlockNonUSLocations",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGroups": ["<GUID-InternalsGroup>"],
      "excludeGroups": ["<GUID-BreakGlassExclusionGroup>", "<GUID-ApprovedTravelExceptions>"]
    },
    "applications": { "includeApplications": ["All"] },
    "locations": {
      "includeLocations": ["All"],
      "excludeLocations": ["<GUID-TrustedCountriesUS>"]
    },
    "clientAppTypes": ["browser", "mobileAppsAndDesktopClients"]
  },
  "grantControls": {
    "operator": "OR",
    "builtInControls": ["block"]
  }
}
```

### CA013: high user risk requires risk remediation

This template replaces the earlier "require password change and MFA" version. `riskRemediation` is a newer member of the grant control enumeration; Microsoft Graph returns it only when the request carries the header `Prefer: include-unknown-enum-members`.[^aC-grant-controls] When you select it in the admin center, the authentication strength and an every-time sign-in frequency are applied automatically and are mandatory,[^aC-risk-policies] so the safest way to get the exact shape for your tenant is to create the policy in the admin center and export it.

```json
{
  "displayName": "CA013-AllUsers-HighUserRisk-RequireRemediation",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["<GUID-BreakGlassExclusionGroup>"]
    },
    "applications": { "includeApplications": ["All"] },
    "userRiskLevels": ["high"],
    "clientAppTypes": ["all"]
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": ["riskRemediation"],
    "authenticationStrength": { "id": "<GUID-MFA>" }
  },
  "sessionControls": {
    "signInFrequency": {
      "isEnabled": true,
      "frequencyInterval": "everyTime",
      "authenticationType": "primaryAndSecondaryAuthentication"
    }
  }
}
```

### CA015: service accounts restricted to trusted networks

Conditional Access for workload identities needs Workload Identities Premium licensing and applies only to single-tenant service principals. Microsoft's sample uses the Graph beta endpoint.[^aC-ca-workload]

```json
{
  "displayName": "CA015-ServiceAccounts-LocationRestriction",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "clientApplications": {
      "includeServicePrincipals": ["ServicePrincipalsInMyTenant"]
    },
    "applications": { "includeApplications": ["All"] },
    "locations": {
      "includeLocations": ["All"],
      "excludeLocations": ["<GUID-TrustedNetworks>"]
    }
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": ["block"]
  }
}
```

The other policies in the set (CA004, CA005, CA007, CA009 through CA012, CA014, CA016, and CA017) follow the same structure. CA002 is retired; the break-glass exemption is the exclusion on every policy. Export your configured policies as JSON for the Git baseline:

::: {.callout-warning}
## Illustrative code
The PowerShell in this appendix is illustrative. It hasn't been tested against a production forest or tenant. Review it, and run it first against a lab forest and a test tenant with read-only permissions. The write operations (creating groups and issues) run only when you call them explicitly.
:::

```powershell
#Requires -Modules Microsoft.Graph.Identity.SignIns
Connect-MgGraph -Scopes 'Policy.Read.All'

$exportPath = "C:\FMP\Exports\CA_Policies_$(Get-Date -Format 'yyyyMMdd').json"
$policies = Get-MgIdentityConditionalAccessPolicy -All
$policies | ConvertTo-Json -Depth 10 | Out-File -FilePath $exportPath -Encoding UTF8
Write-Host "Exported $($policies.Count) Conditional Access policies to $exportPath" -ForegroundColor Green

Disconnect-MgGraph
```

## The FMPIdentityAssessment module

The FMPIdentityAssessment module packages the identity assessment and drift functions used in Chapters 09 and 10. It's a script module (`.psm1`) with a manifest (`.psd1`).

### Tooling: Microsoft Graph PowerShell only

The module uses the `ActiveDirectory` module for the forest and the Microsoft Graph PowerShell SDK for the tenant. It doesn't use the MSOnline or AzureAD modules, and nothing in this book should. Microsoft deprecated both on March 30, 2024. MSOnline was retired, and stopped working, between early April and late May 2025; AzureAD lost support after March 30, 2025 and was retired in early July 2025.[^aC-msonline-retirement] Microsoft's migration guide and cmdlet map cover the replacements,[^aC-graph-migration][^aC-cmdlet-map] and the ones that matter for this book are:

| Retired cmdlet | Microsoft Graph PowerShell replacement |
|---|---|
| `Connect-MsolService`, `Connect-AzureAD` | `Connect-MgGraph` |
| `Get-MsolUser`, `Get-AzureADUser` | `Get-MgUser` |
| `Convert-MsolDomainToStandard` | `Update-MgDomain -AuthenticationType "Managed"` after staged rollout; `Remove-MgDomainFederationConfiguration` to remove the federation settings[^aC-cmdlet-map][^aC-federation-migration] |
| `Convert-MsolDomainToFederated` | `New-MgDomainFederationConfiguration` |
| `Get-AzureADDirectoryRoleMember` | `Get-MgRoleManagementDirectoryRoleAssignment` and the PIM schedule cmdlets |

Role reporting uses the PIM schedule APIs. Active assignments, including activated ones, come from role assignment schedules, whose `assignmentType` is `Assigned` for a standing assignment or `Activated` for one made through PIM;[^aC-assignment-schedule] eligible assignments come from `Get-MgRoleManagementDirectoryRoleEligibilitySchedule` in the `Microsoft.Graph.Identity.Governance` module.[^aC-eligibility-cmdlet] An earlier version of this module tried to tell eligible from active assignments by looking for a `ScheduleInfo` property on `Get-MgRoleManagementDirectoryRoleAssignment` output; that property doesn't exist there, so every assignment was reported as active. The version below fixes it.

### Module manifest

Generate a fresh GUID for your copy with `New-Guid`; the one shown is a placeholder.

```powershell
# FMPIdentityAssessment.psd1
@{
    RootModule        = 'FMPIdentityAssessment.psm1'
    ModuleVersion     = '1.1.0'
    GUID              = '00000000-0000-0000-0000-000000000000'   # replace with New-Guid
    Author            = 'Federal Modernization Program Identity Team'
    Description       = 'Federal Modernization Program identity assessment: Active Directory to Microsoft Entra ID'
    PowerShellVersion = '7.4'
    RequiredModules   = @(
        'ActiveDirectory',
        @{ ModuleName = 'Microsoft.Graph.Authentication';        ModuleVersion = '2.0.0' },
        @{ ModuleName = 'Microsoft.Graph.Identity.Governance';   ModuleVersion = '2.0.0' },
        @{ ModuleName = 'Microsoft.Graph.Identity.DirectoryManagement'; ModuleVersion = '2.0.0' },
        @{ ModuleName = 'Microsoft.Graph.Reports';               ModuleVersion = '2.0.0' }
    )
    FunctionsToExport = @(
        'Get-FMPUserInventory',
        'Get-FMPGroupInventory',
        'Get-FMPServiceAccountInventory',
        'Get-FMPPrivilegedAccessReport',
        'Get-FMPLegacyAuthReport',
        'Export-FMPIdentityBaseline',
        'Invoke-FMPIdentityAssessment',
        'Get-FMPGiteaLabelId',
        'New-FMPGiteaDriftIssue'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
}
```

### Module implementation

The module is shown in sections; together they form `FMPIdentityAssessment.psm1`.

#### Module settings and user inventory

`Get-FMPUserInventory` exports AD users with the attributes that matter for migration and flags the problems Chapter 09 cares about. Pass `-VerifiedDomain` with the tenant's verified domains to test UPN suffixes exactly; without it, the function falls back to a pattern for common non-routable suffixes.

```powershell
# FMPIdentityAssessment.psm1
# Federal Modernization Program identity assessment module, version 1.1.0
#Requires -Version 7.4

$script:ExportBasePath   = 'C:\FMP\Exports'
$script:GraphEnvironment = 'Global'   # GCC uses the worldwide endpoints

function Get-FMPUserInventory {
    [CmdletBinding()]
    param(
        [string]$SearchBase = (Get-ADDomain).DistinguishedName,
        [string]$ExportPath = "$script:ExportBasePath\Users_$(Get-Date -Format 'yyyyMMdd_HHmmss').json",
        [string[]]$VerifiedDomain,
        [switch]$IncludeDisabled
    )

    $filter = if ($IncludeDisabled) { '*' } else { 'Enabled -eq $true' }
    $properties = @(
        'UserPrincipalName', 'DisplayName', 'GivenName', 'Surname', 'Mail', 'Department',
        'Title', 'Company', 'Manager', 'DistinguishedName', 'Enabled', 'PasswordNeverExpires',
        'PasswordLastSet', 'LastLogonDate', 'WhenCreated', 'WhenChanged', 'MemberOf',
        'ServicePrincipalName', 'AdminCount', 'AccountExpirationDate',
        'extensionAttribute2', 'extensionAttribute3', 'extensionAttribute4', 'extensionAttribute5',
        'extensionAttribute6', 'extensionAttribute7', 'extensionAttribute9', 'extensionAttribute10',
        'extensionAttribute11', 'extensionAttribute12'
    )
    $nonRoutablePattern = '\.(local|internal|corp|lan|ad)$'
    $staleCutoff = (Get-Date).AddDays(-90)

    Write-Host "Collecting AD user inventory from: $SearchBase" -ForegroundColor Cyan
    $adUsers = Get-ADUser -Filter $filter -SearchBase $SearchBase -Properties $properties

    $users = foreach ($u in $adUsers) {
        $suffix = if ($u.UserPrincipalName) { ($u.UserPrincipalName -split '@')[1] } else { $null }
        $isRoutable = if (-not $suffix) { $false }
                      elseif ($VerifiedDomain) { $suffix -in $VerifiedDomain }
                      else { $suffix -notmatch $nonRoutablePattern }
        $spnCount = ($u.ServicePrincipalName | Measure-Object).Count

        $flags = [System.Collections.Generic.List[string]]::new()
        if (-not $isRoutable)                { $flags.Add('UPN_REMEDIATION_REQUIRED') }
        if ($u.PasswordNeverExpires)         { $flags.Add('PASSWORD_NEVER_EXPIRES') }
        if ($u.AdminCount -eq 1)             { $flags.Add('ADMINCOUNT_SET') }
        if ($spnCount -gt 0)                 { $flags.Add('HAS_SPN') }
        if (-not $u.LastLogonDate -or $u.LastLogonDate -lt $staleCutoff) { $flags.Add('STALE_ACCOUNT') }

        [PSCustomObject]@{
            SamAccountName       = $u.SamAccountName
            UPN                  = $u.UserPrincipalName
            UPNSuffix            = $suffix
            IsRoutableUPN        = $isRoutable
            DisplayName          = $u.DisplayName
            Mail                 = $u.Mail
            Department           = $u.Department
            Title                = $u.Title
            Enabled              = $u.Enabled
            PasswordNeverExpires = $u.PasswordNeverExpires
            PasswordLastSet      = $u.PasswordLastSet
            LastLogon            = $u.LastLogonDate
            Created              = $u.WhenCreated
            GroupCount           = ($u.MemberOf | Measure-Object).Count
            HasSPN               = ($spnCount -gt 0)
            AdminCount           = $u.AdminCount
            OU                   = ($u.DistinguishedName -split ',', 2)[1]
            ExtensionAttributes  = [PSCustomObject]@{
                Region           = $u.extensionAttribute4
                OrgCode          = $u.extensionAttribute10
                Division         = $u.extensionAttribute6
                PositionCategory = $u.extensionAttribute12
                CostCenter       = $u.extensionAttribute5
                WorkerType       = $u.extensionAttribute11
                HireDate         = $u.extensionAttribute2
                EndDate          = $u.extensionAttribute3
                ClearanceLevel   = $u.extensionAttribute9
                AccountType      = $u.extensionAttribute7
            }
            MigrationFlags       = ($flags -join ',')
        }
    }

    $parent = Split-Path $ExportPath -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    $users | ConvertTo-Json -Depth 5 | Out-File -FilePath $ExportPath -Encoding UTF8

    Write-Host "Exported $(@($users).Count) users to $ExportPath" -ForegroundColor Green
    Write-Host "  UPN remediation required: $(@($users | Where-Object { $_.MigrationFlags -match 'UPN_REMEDIATION' }).Count)" -ForegroundColor Yellow
    Write-Host "  adminCount set:           $(@($users | Where-Object { $_.AdminCount -eq 1 }).Count)" -ForegroundColor Yellow
    Write-Host "  Stale (over 90 days):     $(@($users | Where-Object { $_.MigrationFlags -match 'STALE' }).Count)" -ForegroundColor Yellow

    return $users
}
```

Two fixes from the earlier version: the UPN check was inverted inside `MigrationFlags` (it flagged routable suffixes and passed non-routable ones), and the flag for `adminCount` was named "AdminSDHolder protected." `adminCount` stays at 1 after an account leaves a protected group,[^aC-ad-attack-surface] so the flag now says what it measures.

#### Group inventory

```powershell
function Get-FMPGroupInventory {
    [CmdletBinding()]
    param(
        [string]$SearchBase = (Get-ADDomain).DistinguishedName,
        [string]$ExportPath = "$script:ExportBasePath\Groups_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    )

    Write-Host "Collecting AD group inventory from: $SearchBase" -ForegroundColor Cyan
    $groups = Get-ADGroup -Filter * -SearchBase $SearchBase -Properties Description, GroupScope,
            GroupCategory, ManagedBy, Members, MemberOf, Mail, WhenCreated, WhenChanged |
        Select-Object @{N = 'Name';          E = { $_.Name } },
                      @{N = 'Description';   E = { $_.Description } },
                      @{N = 'Scope';         E = { $_.GroupScope.ToString() } },
                      @{N = 'Category';      E = { $_.GroupCategory.ToString() } },
                      @{N = 'ManagedBy';     E = {
                            if ($_.ManagedBy) { (Get-ADObject $_.ManagedBy -Properties DisplayName).DisplayName }
                            else { 'UNMANAGED' } } },
                      @{N = 'MemberCount';   E = { ($_.Members | Measure-Object).Count } },
                      @{N = 'NestedInCount'; E = { ($_.MemberOf | Measure-Object).Count } },
                      @{N = 'HasMail';       E = { [bool]$_.Mail } },
                      @{N = 'OU';            E = { ($_.DistinguishedName -split ',', 2)[1] } },
                      @{N = 'Created';       E = { $_.WhenCreated } },
                      @{N = 'Modified';      E = { $_.WhenChanged } },
                      @{N = 'MigrationDecision'; E = {
                            $mc = ($_.Members | Measure-Object).Count
                            if ($mc -eq 0) { 'DECOMMISSION' }
                            elseif ($_.GroupCategory -eq 'Distribution') { 'EVALUATE_M365_GROUP' }
                            elseif ($_.Mail) { 'SYNC_MAIL_ENABLED_SECURITY' }
                            else { 'EVALUATE_SYNC_OR_DYNAMIC' } } }

    $groups | ConvertTo-Json -Depth 5 | Out-File -FilePath $ExportPath -Encoding UTF8
    Write-Host "Exported $(@($groups).Count) groups to $ExportPath" -ForegroundColor Green
    return $groups
}
```

#### Service account inventory

The earlier module had only a stub here that pointed elsewhere for the body. The module now carries the full function; it's the same code as [Chapter 09](09-building-the-entra-target.md#discovering-service-accounts), with the export path tied to the module's base path.

```powershell
function Get-FMPServiceAccountInventory {
    [CmdletBinding()]
    param(
        [string]$SearchBase = (Get-ADDomain).DistinguishedName,
        [string]$ExportPath = "$script:ExportBasePath\ServiceAccounts_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    )

    $results = [System.Collections.Generic.List[object]]::new()
    $staleCutoff = (Get-Date).AddDays(-90)

    $svcUsers = Get-ADUser -SearchBase $SearchBase -Filter {
            (ServicePrincipalName -like '*') -or (SamAccountName -like 'svc-*') -or
            (SamAccountName -like 'svc_*') -or (SamAccountName -like 'sa-*') -or
            (Description -like '*service*account*')
        } -Properties UserPrincipalName, DisplayName, Description, ServicePrincipalName,
                      Enabled, PasswordNeverExpires, PasswordLastSet, LastLogonDate,
                      WhenCreated, MemberOf, DistinguishedName

    foreach ($svc in $svcUsers) {
        $spnCount = ($svc.ServicePrincipalName | Measure-Object).Count
        $daysSincePasswordChange = if ($svc.PasswordLastSet) {
            (New-TimeSpan -Start $svc.PasswordLastSet -End (Get-Date)).Days
        } else { -1 }

        $recommendation = switch ($true) {
            (-not $svc.Enabled)                   { 'Disabled: verify and retire'; break }
            ($svc.LastLogonDate -lt $staleCutoff) { 'Stale: verify use and retire if unused'; break }
            ($svc.PasswordNeverExpires)           { 'HIGH RISK: move to a workload identity (federated credential, managed identity, or certificate)'; break }
            ($spnCount -gt 0)                     { 'Kerberos service: convert to gMSA, then evaluate workload identity federation'; break }
            default                               { 'Evaluate the workload; target a managed identity or application registration' }
        }

        $riskLevel = if ($svc.Enabled -and $svc.PasswordNeverExpires) { 'HIGH' }
                     elseif ($daysSincePasswordChange -gt 365)          { 'HIGH' }
                     elseif ($svc.Enabled)                              { 'MEDIUM' }
                     else                                               { 'LOW' }

        $results.Add([PSCustomObject]@{
            Type                    = 'TraditionalServiceAccount'
            SamAccountName          = $svc.SamAccountName
            DisplayName             = $svc.DisplayName
            Description             = $svc.Description
            Enabled                 = $svc.Enabled
            PasswordNeverExpires    = $svc.PasswordNeverExpires
            DaysSincePasswordChange = $daysSincePasswordChange
            SPNCount                = $spnCount
            SPNs                    = ($svc.ServicePrincipalName -join '; ')
            LastLogon               = $svc.LastLogonDate
            GroupMembershipCount    = ($svc.MemberOf | Measure-Object).Count
            OU                      = ($svc.DistinguishedName -split ',', 2)[1]
            RiskLevel               = $riskLevel
            Recommendation          = $recommendation
        })
    }

    $msaAccounts = Get-ADServiceAccount -Filter * -SearchBase $SearchBase -Properties Enabled,
        DistinguishedName, ObjectClass, 'msDS-ManagedPasswordInterval', WhenCreated

    foreach ($msa in $msaAccounts) {
        $isGmsa = ($msa.ObjectClass -eq 'msDS-GroupManagedServiceAccount')
        $results.Add([PSCustomObject]@{
            Type                    = if ($isGmsa) { 'gMSA' } else { 'MSA' }
            SamAccountName          = $msa.SamAccountName
            DisplayName             = $msa.SamAccountName
            Description             = ''
            Enabled                 = $msa.Enabled
            PasswordNeverExpires    = $false
            DaysSincePasswordChange = 0
            SPNCount                = 0
            SPNs                    = ''
            LastLogon               = $null
            GroupMembershipCount    = 0
            OU                      = ($msa.DistinguishedName -split ',', 2)[1]
            RiskLevel               = 'LOW'
            Recommendation          = if ($isGmsa) {
                'Keep for on-premises workloads; plan workload identity federation when the workload moves'
            } else {
                'Upgrade to gMSA first, then evaluate for cloud migration'
            }
        })
    }

    $results | ConvertTo-Json -Depth 5 | Out-File -FilePath $ExportPath -Encoding UTF8
    Write-Host "Service account inventory: $($results.Count) accounts exported to $ExportPath" -ForegroundColor Green
    return $results
}
```

#### Privileged access report

```powershell
function Get-FMPPrivilegedAccessReport {
    [CmdletBinding()]
    param(
        [switch]$Last24Hours,
        [string]$ExportPath = "$script:ExportBasePath\PrivilegedAccess_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    )

    Connect-MgGraph -Scopes 'RoleManagement.Read.Directory', 'AuditLog.Read.All' -Environment $script:GraphEnvironment -NoWelcome

    # Role definitions, for display names
    $roleNames = @{}
    Get-MgRoleManagementDirectoryRoleDefinition -All |
        ForEach-Object { $roleNames[$_.Id] = $_.DisplayName }

    function ConvertTo-FMPRoleRow {
        param($Item, [string]$Kind)
        [PSCustomObject]@{
            RoleName      = $roleNames[$Item.RoleDefinitionId]
            PrincipalName = if ($Item.Principal.AdditionalProperties.displayName) {
                                $Item.Principal.AdditionalProperties.displayName } else { $Item.PrincipalId }
            PrincipalType = ($Item.Principal.AdditionalProperties.'@odata.type' -replace '#microsoft.graph.', '')
            Kind          = $Kind
            Expiration    = $Item.ScheduleInfo.Expiration.Type   # noExpiration means permanent
            EndDateTime   = $Item.ScheduleInfo.Expiration.EndDateTime
            DirectoryScope = $Item.DirectoryScopeId
        }
    }

    # Active assignments: AssignmentType is 'Assigned' (standing) or 'Activated' (via PIM)
    $active = Get-MgRoleManagementDirectoryRoleAssignmentSchedule -All -ExpandProperty Principal |
        ForEach-Object { ConvertTo-FMPRoleRow -Item $_ -Kind "Active-$($_.AssignmentType)" }

    # Eligible assignments
    $eligible = Get-MgRoleManagementDirectoryRoleEligibilitySchedule -All -ExpandProperty Principal |
        ForEach-Object { ConvertTo-FMPRoleRow -Item $_ -Kind 'Eligible' }

    $activations = @()
    if ($Last24Hours) {
        $since = (Get-Date).ToUniversalTime().AddHours(-24).ToString('yyyy-MM-ddTHH:mm:ssZ')
        $auditFilter = "activityDateTime ge $since and activityDisplayName eq 'Add member to role completed (PIM activation)'"
        $activations = Get-MgAuditLogDirectoryAudit -Filter $auditFilter -All |
            Select-Object ActivityDateTime,
                          @{N = 'InitiatedBy'; E = { $_.InitiatedBy.User.UserPrincipalName } },
                          @{N = 'Role';        E = { ($_.TargetResources | Where-Object Type -eq 'Role').DisplayName } }
    }

    $report = [PSCustomObject]@{
        GeneratedAt          = (Get-Date).ToUniversalTime().ToString('o')
        ActiveAssignments    = @($active)
        EligibleAssignments  = @($eligible)
        RecentActivations    = @($activations)
    }
    $report | ConvertTo-Json -Depth 6 | Out-File -FilePath $ExportPath -Encoding UTF8

    $standing = @($active | Where-Object { $_.Kind -eq 'Active-Assigned' -and $_.Expiration -eq 'noExpiration' })
    Write-Host "Privileged access report exported to $ExportPath" -ForegroundColor Green
    Write-Host "  Eligible assignments:          $(@($eligible).Count)"
    Write-Host "  Permanent active assignments:  $($standing.Count) (target: the emergency accounts only)" -ForegroundColor Yellow
    if ($Last24Hours) { Write-Host "  PIM activations, last 24 hours: $(@($activations).Count)" }

    Disconnect-MgGraph | Out-Null
    return $report
}
```

The activation filter uses the activity name from Microsoft's audit activity reference.[^aC-audit-activities] Off-hours analysis (Chapter 10's detection) runs on the exported `RecentActivations`, after converting `ActivityDateTime` from UTC to local time.

#### Legacy authentication report

```powershell
function Get-FMPLegacyAuthReport {
    [CmdletBinding()]
    param(
        [int]$DaysBack = 30,
        [string]$ExportPath = "$script:ExportBasePath\LegacyAuth_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    )

    Connect-MgGraph -Scopes 'AuditLog.Read.All' -Environment $script:GraphEnvironment -NoWelcome

    $legacyClients = @('Exchange ActiveSync', 'Authenticated SMTP', 'POP3', 'IMAP4',
                       'Other clients', 'Outlook Anywhere (RPC over HTTP)')
    $startDate = (Get-Date).ToUniversalTime().AddDays(-$DaysBack).ToString('yyyy-MM-ddTHH:mm:ssZ')
    $filter = "createdDateTime ge $startDate and status/errorCode eq 0"

    Write-Host "Scanning sign-in logs for legacy authentication (last $DaysBack days)..." -ForegroundColor Cyan
    $signIns = Get-MgAuditLogSignIn -Filter $filter -All |
        Where-Object { $_.ClientAppUsed -in $legacyClients }

    $report = $signIns |
        Group-Object -Property UserPrincipalName, ClientAppUsed |
        Select-Object @{N = 'UserPrincipalName'; E = { ($_.Name -split ', ')[0] } },
                      @{N = 'ClientApp';         E = { ($_.Name -split ', ')[1] } },
                      @{N = 'SignInCount';       E = { $_.Count } },
                      @{N = 'LastSignIn';        E = { ($_.Group | Sort-Object CreatedDateTime -Descending |
                                                        Select-Object -First 1).CreatedDateTime } },
                      @{N = 'RemediationAction'; E = {
                            switch (($_.Name -split ', ')[1]) {
                                'Authenticated SMTP'  { 'Move to OAuth SMTP, the Microsoft Graph sendMail API, or a supported relay' }
                                'POP3'                { 'Move to the Microsoft Graph mail API or POP with OAuth' }
                                'IMAP4'               { 'Move to the Microsoft Graph mail API or IMAP with OAuth' }
                                'Exchange ActiveSync' { 'Move to Outlook mobile with an Intune app protection policy' }
                                default               { 'Identify the application and move it to modern authentication' }
                            } } }

    $report | ConvertTo-Json -Depth 5 | Out-File -FilePath $ExportPath -Encoding UTF8
    Write-Host "Legacy authentication report exported to $ExportPath" -ForegroundColor Green
    Write-Host "  Users with legacy sign-ins: $(@($report | Select-Object -Unique UserPrincipalName).Count)" -ForegroundColor Yellow
    Write-Host "  Total legacy sign-ins:      $(($report | Measure-Object -Property SignInCount -Sum).Sum)" -ForegroundColor Yellow

    Disconnect-MgGraph | Out-Null
    return $report
}
```

#### Baseline export

```powershell
function Export-FMPIdentityBaseline {
    [CmdletBinding()]
    param(
        [string]$SearchBase = (Get-ADDomain).DistinguishedName,
        [string]$BaselinePath = "$script:ExportBasePath\Baseline_$(Get-Date -Format 'yyyyMMdd_HHmmss')",
        [string[]]$VerifiedDomain
    )

    if (-not (Test-Path $BaselinePath)) { New-Item -ItemType Directory -Path $BaselinePath -Force | Out-Null }
    Write-Host "=== Federal Modernization Program identity baseline export ===" -ForegroundColor Cyan
    Write-Host "Output directory: $BaselinePath" -ForegroundColor Cyan

    $users  = Get-FMPUserInventory -SearchBase $SearchBase -ExportPath "$BaselinePath\users.json" -VerifiedDomain $VerifiedDomain
    $groups = Get-FMPGroupInventory -SearchBase $SearchBase -ExportPath "$BaselinePath\groups.json"
    $svc    = Get-FMPServiceAccountInventory -SearchBase $SearchBase -ExportPath "$BaselinePath\service_accounts.json"

    [PSCustomObject]@{
        GeneratedAt         = (Get-Date).ToUniversalTime().ToString('o')
        SearchBase          = $SearchBase
        Domain              = (Get-ADDomain).DNSRoot
        Forest              = (Get-ADForest).Name
        UserCount           = @($users).Count
        GroupCount          = @($groups).Count
        ServiceAccountCount = @($svc).Count
        ModuleVersion       = '1.1.0'
    } | ConvertTo-Json | Out-File -FilePath "$BaselinePath\metadata.json" -Encoding UTF8

    Write-Host "`n=== Baseline export complete: $BaselinePath ===" -ForegroundColor Green
}
```

#### Drift issues in the Git host

These two functions open a drift issue through the Gitea REST API: a token in an `Authorization: token <value>` header, endpoints under `/api/v1/`, and label IDs as integers on the new issue.[^aC-gitea-api][^aC-gitea-swagger] The Markdown code fence inside the issue body is built from a variable so that the body doesn't depend on PowerShell's backtick escaping.

```powershell
function Get-FMPGiteaLabelId {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Name,
        [string]$GiteaBaseUrl = $env:FMP_GITEA_URL,
        [string]$RepoOwner    = $env:FMP_GITEA_OWNER,
        [string]$RepoName     = 'fmp-identity-baseline',
        [string]$ApiToken     = $env:FMP_GITEA_TOKEN
    )
    $headers = @{ Authorization = "token $ApiToken" }
    $labels = Invoke-RestMethod -Uri "$GiteaBaseUrl/api/v1/repos/$RepoOwner/$RepoName/labels" -Headers $headers -Method Get
    ($labels | Where-Object name -eq $Name | Select-Object -First 1).id
}

function New-FMPGiteaDriftIssue {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][string]$DriftSummary,
        [Parameter(Mandatory)][ValidateSet('Low', 'Medium', 'High', 'Critical')][string]$Severity,
        [Parameter(Mandatory)][string]$DiffContent,
        [string]$GiteaBaseUrl = $env:FMP_GITEA_URL,
        [string]$RepoOwner    = $env:FMP_GITEA_OWNER,
        [string]$RepoName     = 'fmp-identity-baseline',
        [string]$ApiToken     = $env:FMP_GITEA_TOKEN
    )

    $severityLabel = "priority/$($Severity.ToLower())"
    $labelIds = @(
        Get-FMPGiteaLabelId -Name $severityLabel  -GiteaBaseUrl $GiteaBaseUrl -RepoOwner $RepoOwner -RepoName $RepoName -ApiToken $ApiToken
        Get-FMPGiteaLabelId -Name 'identity-drift' -GiteaBaseUrl $GiteaBaseUrl -RepoOwner $RepoOwner -RepoName $RepoName -ApiToken $ApiToken
    ) | Where-Object { $_ }

    $fence = '```'
    $detected = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss') + ' UTC'
    $issueBody = @"
## Identity drift detection report

**Detected:** $detected
**Severity:** $Severity
**Summary:** $DriftSummary

### Diff

${fence}json
$DiffContent
${fence}

### Recommended actions

- Review the diff for unauthorized changes.
- Cross-check against change management records.
- Fix the source record or rule for unauthorized drift; update the baseline only for approved changes.
- Commit the updated baseline to Git.

*Generated by Invoke-FMPIdentityAssessment*
"@

    $body = @{
        title  = "[Identity Drift] $DriftSummary - $(Get-Date -Format 'yyyy-MM-dd')"
        body   = $issueBody
        labels = @($labelIds)
    } | ConvertTo-Json -Depth 5

    $headers = @{ Authorization = "token $ApiToken"; 'Content-Type' = 'application/json' }
    $uri = "$GiteaBaseUrl/api/v1/repos/$RepoOwner/$RepoName/issues"

    if ($PSCmdlet.ShouldProcess($uri, 'Create drift issue')) {
        try {
            $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
            Write-Host "Created issue #$($response.number): $($response.title)" -ForegroundColor Green
            return $response
        }
        catch {
            Write-Error "Failed to create the drift issue: $_"
        }
    }
}
```

#### The orchestrator

`Invoke-FMPIdentityAssessment` runs the inventories, the Entra ID reports, and, with `-Compare`, a user-level drift comparison against a previous baseline. `-CommitToGitea` opens an issue when drift is found; committing the new baseline to the repository is a separate `git` step in the scheduled job. The earlier version printed an ASCII-art banner of a former program name; it's been replaced with a plain header.

```powershell
function Invoke-FMPIdentityAssessment {
    [CmdletBinding()]
    param(
        [string]$SearchBase = (Get-ADDomain).DistinguishedName,
        [string[]]$VerifiedDomain,
        [switch]$Compare,
        [string]$PreviousBaselinePath,
        [switch]$CommitToGitea
    )

    Write-Host "Federal Modernization Program: identity modernization assessment v1.1.0" -ForegroundColor Cyan
    $assessmentPath = "$script:ExportBasePath\Assessment_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

    Write-Host "`n[1/4] Active Directory inventory" -ForegroundColor Yellow
    Export-FMPIdentityBaseline -SearchBase $SearchBase -BaselinePath $assessmentPath -VerifiedDomain $VerifiedDomain

    Write-Host "`n[2/4] Entra ID privileged access" -ForegroundColor Yellow
    Get-FMPPrivilegedAccessReport -ExportPath "$assessmentPath\privileged_access.json" | Out-Null

    Write-Host "`n[3/4] Legacy authentication" -ForegroundColor Yellow
    Get-FMPLegacyAuthReport -ExportPath "$assessmentPath\legacy_auth.json" | Out-Null

    if ($Compare -and $PreviousBaselinePath) {
        Write-Host "`n[4/4] Drift comparison" -ForegroundColor Yellow
        $currentUsers  = Get-Content "$assessmentPath\users.json" -Raw | ConvertFrom-Json
        $previousUsers = Get-Content "$PreviousBaselinePath\users.json" -Raw | ConvertFrom-Json

        $newUsers     = $currentUsers  | Where-Object { $_.SamAccountName -notin $previousUsers.SamAccountName }
        $removedUsers = $previousUsers | Where-Object { $_.SamAccountName -notin $currentUsers.SamAccountName }

        $drift = [PSCustomObject]@{
            NewUsers      = @($newUsers).Count
            RemovedUsers  = @($removedUsers).Count
            TotalCurrent  = @($currentUsers).Count
            TotalPrevious = @($previousUsers).Count
            NewUserNames     = @($newUsers.SamAccountName)
            RemovedUserNames = @($removedUsers.SamAccountName)
            DriftDetected = (@($newUsers).Count + @($removedUsers).Count) -gt 0
        }
        $drift | ConvertTo-Json -Depth 4 | Out-File -FilePath "$assessmentPath\drift_report.json" -Encoding UTF8
        Write-Host "Drift: $($drift.NewUsers) new, $($drift.RemovedUsers) removed" -ForegroundColor $(if ($drift.DriftDetected) { 'Yellow' } else { 'Green' })

        if ($CommitToGitea -and $drift.DriftDetected) {
            $total = $drift.NewUsers + $drift.RemovedUsers
            $severity = if ($total -gt 50) { 'High' } elseif ($total -gt 10) { 'Medium' } else { 'Low' }
            New-FMPGiteaDriftIssue -DriftSummary "$($drift.NewUsers) new users, $($drift.RemovedUsers) removed users" `
                -Severity $severity -DiffContent (Get-Content "$assessmentPath\drift_report.json" -Raw)
        }
    }
    else {
        Write-Host "`n[4/4] Skipped: no comparison baseline given" -ForegroundColor DarkGray
    }

    Write-Host "`n=== Assessment complete: $assessmentPath ===" -ForegroundColor Green
    Write-Host "Next: review the output and commit it to the identity-baseline branch." -ForegroundColor Cyan
}
```

The comparison covers user additions and removals only. Attribute-level drift, group membership drift, and the Conditional Access policy diff are listed as planned scheduled tasks in [Chapter 10](10-migrating-and-governing.md#scheduled-tasks); until they're built, compare those exports in Git directly.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — Forest Assessment Module](appendix-b-forest-assessment-module.md) · [Book index](index.md)
:::

[^aC-synced-attributes]: Microsoft Learn, "Microsoft Entra Connect Sync: Attributes synchronized to Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-sync-attributes-synchronized> (accessed Oct 20, 2026).
[^aC-user-resource]: Microsoft Learn, "user resource type," <https://learn.microsoft.com/graph/api/resources/user?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aC-lcw-sync-attributes]: Microsoft Learn, "Managing users synchronized from Active Directory Domain Services to Microsoft Entra ID with Lifecycle workflows," <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-on-premises> (accessed Oct 20, 2026).
[^aC-auth-strengths]: Microsoft Learn, "Conditional Access authentication strengths," <https://learn.microsoft.com/entra/identity/authentication/concept-authentication-strengths> (accessed Oct 20, 2026).
[^aC-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 20, 2026).
[^aC-grant-controls]: Microsoft Learn, "conditionalAccessGrantControls resource type," <https://learn.microsoft.com/graph/api/resources/conditionalaccessgrantcontrols?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aC-risk-policies]: Microsoft Learn, "Configure and enable risk policies," <https://learn.microsoft.com/entra/id-protection/howto-identity-protection-configure-risk-policies> (accessed Oct 20, 2026).
[^aC-ca-workload]: Microsoft Learn, "Microsoft Entra Conditional Access for workload identities," <https://learn.microsoft.com/entra/identity/conditional-access/workload-identity> (accessed Oct 20, 2026).
[^aC-msonline-retirement]: Microsoft Learn, "Archive for Microsoft Entra releases and announcements" (January 2025: MSOnline and AzureAD PowerShell retirement), <https://learn.microsoft.com/entra/fundamentals/whats-new-archive> (accessed Oct 20, 2026).
[^aC-graph-migration]: Microsoft Learn, "Upgrade from Azure AD PowerShell to Microsoft Graph PowerShell," <https://learn.microsoft.com/powershell/microsoftgraph/migration-steps?view=graph-powershell-1.0> (accessed Oct 20, 2026).
[^aC-cmdlet-map]: Microsoft Learn, "Find Azure AD PowerShell and MSOnline cmdlets in Microsoft Graph PowerShell," <https://learn.microsoft.com/powershell/microsoftgraph/azuread-msoline-cmdlet-map?view=graph-powershell-1.0> (accessed Oct 20, 2026).
[^aC-federation-migration]: Microsoft Learn, "Migrate from federation to cloud authentication," <https://learn.microsoft.com/entra/identity/hybrid/connect/migrate-from-federation-to-cloud-authentication> (accessed Oct 20, 2026).
[^aC-eligibility-cmdlet]: Microsoft Learn, "Get-MgRoleManagementDirectoryRoleEligibilitySchedule," <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.governance/get-mgrolemanagementdirectoryroleeligibilityschedule?view=graph-powershell-1.0> (accessed Oct 20, 2026).
[^aC-ad-attack-surface]: Microsoft Learn, "Reducing the Active Directory Attack Surface," <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/reducing-the-active-directory-attack-surface> (accessed Oct 20, 2026).
[^aC-audit-activities]: Microsoft Learn, "Microsoft Entra audit log categories and activities," <https://learn.microsoft.com/entra/identity/monitoring-health/reference-audit-activities> (accessed Oct 20, 2026).
[^aC-gitea-api]: Gitea, "API Usage," <https://docs.gitea.com/development/api-usage> (accessed Oct 20, 2026).
[^aC-gitea-swagger]: Gitea, API specification (`CreateIssueOption`), <https://gitea.com/swagger.v1.json> (accessed Oct 20, 2026).
[^aC-assignment-schedule]: Microsoft Learn, "unifiedRoleAssignmentSchedule resource type," <https://learn.microsoft.com/graph/api/resources/unifiedroleassignmentschedule?view=graph-rest-1.0> (accessed Oct 20, 2026).
