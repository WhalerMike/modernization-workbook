---
title: "Appendix A — Conditional Access Policy Templates"
description: "Microsoft Graph JSON templates for the Conditional Access policy library in Chapter 07, with the supporting named locations and authentication strength, a schema reference checked against the Graph v1.0 conditionalAccessPolicy resource, and an illustrative deployment script."
doc-type: workbook-chapter
audience: [Technical]
family: b04-access
book: B04
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Conditional Access Policy Templates

*Templates are the library in a form a pipeline can deploy, review and diff; the chapter says why each policy exists, and this appendix says exactly what it is.*

::: {.callout-note}
## In this appendix
How to read and fill the templates, a reference for the Graph properties they use, an illustrative PowerShell deployment script, the named locations and custom authentication strength the library depends on, and a JSON template for each policy shape in [Chapter 07](07-the-conditional-access-policy-library.md). Policies that differ from a template only in scope are listed in a table at the end.
:::

## How to use the templates

Each template is the request body for `POST /identity/conditionalAccess/policies` on Microsoft Graph v1.0. Creating policies needs the `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess` permissions; policies that reference applications also need `Application.Read.All`.[^aA-create] Microsoft 365 GCC tenants use the worldwide endpoint, `https://graph.microsoft.com`; GCC High uses `https://graph.microsoft.us`.[^aA-clouds]

| Operation | Method and path |
|---|---|
| List policies | `GET /identity/conditionalAccess/policies` |
| Get one policy | `GET /identity/conditionalAccess/policies/{id}` |
| Create | `POST /identity/conditionalAccess/policies` |
| Update | `PATCH /identity/conditionalAccess/policies/{id}` |
| Delete | `DELETE /identity/conditionalAccess/policies/{id}` (the program disables instead) |
| Named locations | `/identity/conditionalAccess/namedLocations` |
| Authentication strengths | `/policies/authenticationStrengthPolicies` |

The methods are those of the `conditionalAccessPolicy` resource.[^aA-policy] The program's conventions:

- **State is always `enabledForReportingButNotEnforced`** (report-only) in source control. Enforcement is a separate, reviewed change that sets `enabled` ([Chapter 07](07-the-conditional-access-policy-library.md#rollout-from-report-only-to-enforcement)). The other value is `disabled`.[^aA-policy]
- **Placeholders are in braces.** `{group:CA-Exclude-EmergencyAccess}` is the object ID of that group; `{location:NL-TrustedNetworks}` is a named location ID; `{tenant:partners}` is a list of partner tenant IDs. The deployment script substitutes them from a per-tenant map, so the same templates serve every tenant.
- **Role IDs are role template IDs,** which are the same in every tenant. The admin role list used below is the fourteen roles in Microsoft's managed admin-MFA policy plus Hybrid Identity Administrator.[^aA-managed][^aA-roles]
- **Built-in authentication strength IDs** are fixed: `…0002` multifactor authentication, `…0003` passwordless MFA, `…0004` phishing-resistant MFA.[^aA-strengths-list]
- **No template uses `approvedApplication`.** That grant became read-only on June 30, 2026.[^aA-approved-app]

## Schema reference

The values the templates use, from the Graph v1.0 resource definitions.

| Property | Values used | Source |
|---|---|---|
| `state` | `enabled`, `disabled`, `enabledForReportingButNotEnforced` | [^aA-policy] |
| `conditions.users` | `includeUsers` (`All`, `None`, `GuestsOrExternalUsers`, or IDs), `excludeUsers`, `include/excludeGroups`, `include/excludeRoles`, `include/excludeGuestsOrExternalUsers` | [^aA-users] |
| `guestOrExternalUserTypes` | Comma-separated: `internalGuest`, `b2bCollaborationGuest`, `b2bCollaborationMember`, `b2bDirectConnectUser`, `otherExternalUser`, `serviceProvider` | [^aA-guests] |
| `externalTenants` | `conditionalAccessAllExternalTenants` with `membershipKind: all`, or `conditionalAccessEnumeratedExternalTenants` with `membershipKind: enumerated` and `members` | [^aA-ext-tenants][^aA-enum-tenants] |
| `conditions.applications` | `includeApplications` (`All`, `Office365`, `MicrosoftAdminPortals`, or app IDs), `excludeApplications`, `includeUserActions` (`urn:user:registersecurityinfo`, `urn:user:registerdevice`), `applicationFilter` | [^aA-apps] |
| `conditions.clientApplications` | `includeServicePrincipals` (IDs or `ServicePrincipalsInMyTenant`), `excludeServicePrincipals` | [^aA-client-apps] |
| `conditions.clientAppTypes` | `all`, `browser`, `mobileAppsAndDesktopClients`, `exchangeActiveSync`, `other` | [^aA-conditions] |
| `conditions.locations` | `includeLocations` (`All`, `AllTrusted`, or IDs), `excludeLocations` | [^aA-locations] |
| `conditions.platforms` | `android`, `iOS`, `windows`, `macOS`, `linux`, `all` | [^aA-platforms] |
| `conditions.devices.deviceFilter` | `mode` `include` or `exclude`; `rule` in dynamic-group syntax | [^aA-filter] |
| Risk levels | `signInRiskLevels`, `userRiskLevels`, `servicePrincipalRiskLevels`: `low`, `medium`, `high`; `insiderRiskLevels`: `minor`, `moderate`, `elevated` | [^aA-conditions] |
| `conditions.authenticationFlows` | `transferMethods`: `deviceCodeFlow`, `authenticationTransfer` | [^aA-flows] |
| `grantControls` | `operator` `AND` or `OR`; `builtInControls` `block`, `mfa`, `compliantDevice`, `domainJoinedDevice`, `compliantApplication`, `passwordChange`, `riskRemediation`; `termsOfUse`; `authenticationStrength` | [^aA-grant] |
| `sessionControls` | `applicationEnforcedRestrictions`, `cloudAppSecurity`, `signInFrequency`, `persistentBrowser`, `disableResilienceDefaults` | [^aA-session] |
| `signInFrequency` | `isEnabled`; `type` `hours` or `days` with `value`; `frequencyInterval` `timeBased` or `everyTime`; `authenticationType` | [^aA-sif] |
| `persistentBrowser` | `isEnabled`; `mode` `always` or `never` | [^aA-persistent] |

Three constraints from the Graph documentation shape the risk templates. `riskRemediation` must be combined with `authenticationStrength` using `AND`; `passwordChange` must be combined with `mfa` using `AND`; and either one needs a `userRiskLevels` condition, all applications, and no conditions other than users, applications and user risk. `riskRemediation` is an evolvable enum member, so requests that read it back need the `Prefer: include-unknown-enum-members` header.[^aA-grant] "Require MFA" (`mfa`) and an authentication strength can't be used in the same policy.[^aA-strengths]

## Deploying the templates

::: {.callout-warning}
The script is illustrative and hasn't been tested against a production tenant. Review it before running it. It only creates or updates policies in report-only state, but it changes tenant configuration, so run it from the pipeline identity the program approves for policy changes, not from an administrator's desktop.
:::

```powershell
#Requires -Modules Microsoft.Graph.Identity.SignIns
# Federal Modernization Program: deploy Conditional Access templates in report-only state.
# Templates live in .\templates\*.json; placeholders are resolved from .\tenant-map.json.

param(
    [string] $TemplatePath = '.\templates',
    [string] $MapPath      = '.\tenant-map.json'
)

Connect-MgGraph -Scopes 'Policy.Read.All', 'Policy.ReadWrite.ConditionalAccess', 'Application.Read.All'

# The map holds placeholder -> value pairs, for example
# { "{group:CA-Exclude-EmergencyAccess}": "00000000-...", "{location:NL-TrustedNetworks}": "..." }
$map = Get-Content -Raw -Path $MapPath | ConvertFrom-Json -AsHashtable

$existing = Get-MgIdentityConditionalAccessPolicy -All

foreach ($file in Get-ChildItem -Path $TemplatePath -Filter '*.json') {
    $json = Get-Content -Raw -Path $file.FullName
    foreach ($key in $map.Keys) {
        $json = $json.Replace($key, $map[$key])
    }
    if ($json -match '\{(group|location|tenant|app|strength|terms|sp):') {
        Write-Warning "Unresolved placeholder in $($file.Name); skipped."
        continue
    }

    $body = $json | ConvertFrom-Json -AsHashtable
    $body['state'] = 'enabledForReportingButNotEnforced'   # never enforce from the pipeline

    $match = $existing | Where-Object { $_.DisplayName -eq $body['displayName'] }
    if ($match) {
        Update-MgIdentityConditionalAccessPolicy -ConditionalAccessPolicyId $match.Id -BodyParameter $body
        Write-Output "Updated (report-only): $($body['displayName'])"
    }
    else {
        New-MgIdentityConditionalAccessPolicy -BodyParameter $body | Out-Null
        Write-Output "Created (report-only): $($body['displayName'])"
    }
}
```

Two cautions. The update branch sets a policy that is already enforced back to report-only, which is intended for the pipeline's review loop but means the pipeline must never run against production policies without the change process that re-enforces them ([Chapter 10](10-access-as-code-and-evidence.md)). And protected actions, if enabled for Conditional Access, require the pipeline identity to satisfy their authentication context ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#protected-actions)). To export the live set for comparison, `Get-MgIdentityConditionalAccessPolicy -All | ConvertTo-Json -Depth 10` produces the same shape.

## Supporting objects

### Named locations

An IP location, marked trusted. CIDR masks must be longer than /8, with up to 2,000 ranges per location.[^aA-network] The ranges are documentation examples.

```json
{
  "@odata.type": "#microsoft.graph.ipNamedLocation",
  "displayName": "NL-TrustedNetworks",
  "isTrusted": true,
  "ipRanges": [
    { "@odata.type": "#microsoft.graph.iPv4CidrRange", "cidrAddress": "203.0.113.0/24" },
    { "@odata.type": "#microsoft.graph.iPv4CidrRange", "cidrAddress": "198.51.100.0/24" }
  ]
}
```

A country location. The source library listed six countries; the program's standard is the United States only, with travel handled by an exclusion group ([Chapter 07](07-the-conditional-access-policy-library.md)).

```json
{
  "@odata.type": "#microsoft.graph.countryNamedLocation",
  "displayName": "NL-TrustedCountries",
  "countriesAndRegions": ["US"],
  "includeUnknownCountriesAndRegions": false
}
```

Both are created with `New-MgIdentityConditionalAccessNamedLocation -BodyParameter`.[^aA-nl-cmdlet] `NL-WorkloadEgress` has the same shape as `NL-TrustedNetworks`, holding only the ranges workloads call from.

### Custom authentication strength

`FMP-Privileged-SeparateDevice`, for CA003 and CA026: FIDO2 security keys from an approved list of models, or certificate-based authentication configured as multifactor. Windows Hello for Business is left out by design ([Chapter 07](07-the-conditional-access-policy-library.md#prerequisites)). The AAGUIDs are placeholders for the key models the agency approves.

```json
{
  "displayName": "FMP-Privileged-SeparateDevice",
  "description": "Approved FIDO2 security keys or multifactor certificate-based authentication (PIV/CAC). For privileged roles.",
  "requirementsSatisfied": "mfa",
  "allowedCombinations": ["fido2", "x509CertificateMultiFactor"],
  "combinationConfigurations": [
    {
      "@odata.type": "#microsoft.graph.fido2CombinationConfiguration",
      "appliesToCombinations": ["fido2"],
      "allowedAAGUIDs": ["{aaguid:approved-key-model-1}", "{aaguid:approved-key-model-2}"]
    }
  ]
}
```

It is created with `New-MgPolicyAuthenticationStrengthPolicy -BodyParameter`, which accepts this shape including the FIDO2 combination configuration.[^aA-strength-cmdlet] The policies reference it as `{strength:FMP-Privileged-SeparateDevice}`. The source library's custom strength allowed FIDO2 only, which would have locked PIV holders out of privileged roles.

## Policy templates

Every template excludes the emergency access group. Templates are grouped by the wave in [Chapter 07](07-the-conditional-access-policy-library.md).

### Wave 1: foundation

CA001, block legacy authentication (MS.AAD.1.1):

```json
{
  "displayName": "CA001-AllUsers-BlockLegacyAuth",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeUsers": ["All"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["exchangeActiveSync", "other"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

CA020, managed device to register security information. The `excludeGuestsOrExternalUsers` block is the "Members" scope used throughout:

```json
{
  "displayName": "CA020-Members-SecurityInfoRegistration-RequireManagedDevice",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}", "{group:CA-Exclude-RegistrationOnboarding}"],
      "excludeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "internalGuest,b2bCollaborationGuest,b2bCollaborationMember,b2bDirectConnectUser,otherExternalUser,serviceProvider",
        "externalTenants": { "@odata.type": "#microsoft.graph.conditionalAccessAllExternalTenants", "membershipKind": "all" }
      }
    },
    "applications": { "includeUserActions": ["urn:user:registersecurityinfo"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["compliantDevice", "domainJoinedDevice"] }
}
```

CA021, block device code flow and authentication transfer. If devices register through device code flow, add the Device Registration Service, `01cb2876-7ebd-4aa4-9cc9-d28bd4d359a9`, to `excludeApplications`.[^aA-flows]

```json
{
  "displayName": "CA021-AllUsers-BlockDeviceCodeFlowAndAuthTransfer",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeUsers": ["All"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}", "{group:CA-Exclude-DeviceCodeFlow}"] },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"],
    "authenticationFlows": { "transferMethods": "deviceCodeFlow,authenticationTransfer" }
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

CA090, the permanent report-only coverage probe. It excludes no one, and the program's pipeline rejects any change that sets its state to `enabled`. (The admin center insists on at least one exclusion for some all-users policies; if the tenant rejects the policy without one, exclude a non-privileged test account and record it.)

```json
{
  "displayName": "CA090-AllUsers-ReportOnly-CoverageProbe",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeUsers": ["All"] },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000004" } }
}
```

### Wave 2: administrators

CA003, phishing-resistant separate-device MFA for administrators, by group and by role (MS.AAD.3.6):

```json
{
  "displayName": "CA003-Admins-RequirePhishResistantMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGroups": ["{group:CA-Persona-Admins}"],
      "includeRoles": [
        "62e90394-69f5-4237-9190-012177145e10",
        "e8611ab8-c189-46e8-94e1-60213ab1f814",
        "7be44c8a-adaf-4e2a-84d6-ab2649e08a13",
        "194ae4cb-b126-40b2-bd5b-6091b380977d",
        "b1be1c3e-b65d-4f19-8427-f6fa0d97feb9",
        "fe930be7-5e62-47db-91af-98c3a49a38b1",
        "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3",
        "158c047a-c907-4556-b7ef-446551a6b5f7",
        "8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2",
        "29232cdf-9323-42fd-ade2-1d097af3e4de",
        "f28a1f50-f6e7-4571-818b-6a12f2af6b6c",
        "c4e39bd9-1100-46d3-8c65-fb160da0071f",
        "729827e3-9c14-49f7-bb1b-9608f156bbb8",
        "b0f54661-2d74-4c50-afa3-1ec803f12efe",
        "966707d0-3269-4727-9be2-8c3a10f19b9d"
      ],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"]
    },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "authenticationStrength": { "id": "{strength:FMP-Privileged-SeparateDevice}" } },
  "sessionControls": { "signInFrequency": { "isEnabled": true, "type": "hours", "value": 4, "frequencyInterval": "timeBased" } }
}
```

The role IDs, in order: Global Administrator, Privileged Role Administrator, Privileged Authentication Administrator, Security Administrator, Conditional Access Administrator, User Administrator, Application Administrator, Cloud Application Administrator, Hybrid Identity Administrator, Exchange Administrator, SharePoint Administrator, Authentication Administrator, Helpdesk Administrator, Billing Administrator and Password Administrator.[^aA-roles] Role targeting applies to active assignments of built-in roles only.[^aA-users-concept]

CA004, compliant device for administrators. Persistent browser control needs all resources:[^aA-session]

```json
{
  "displayName": "CA004-Admins-RequireCompliantDevice",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeGroups": ["{group:CA-Persona-Admins}"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["compliantDevice"] },
  "sessionControls": { "persistentBrowser": { "isEnabled": true, "mode": "never" } }
}
```

CA005, administrators only from trusted networks:

```json
{
  "displayName": "CA005-Admins-BlockUntrustedLocations",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeGroups": ["{group:CA-Persona-Admins}"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "locations": { "includeLocations": ["All"], "excludeLocations": ["{location:NL-TrustedNetworks}"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

CA025, block administration from anything that isn't a PAW. `797f4846-ba00-4fd7-ba43-dac1f8f63013` is the Windows Azure Service Management API.[^aA-create] The filter excludes PAWs with a positive operator, so unregistered and unlabeled devices are blocked.[^aA-filter-concept]

```json
{
  "displayName": "CA025-Admins-BlockNonPAW",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeGroups": ["{group:CA-Persona-Admins}"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["MicrosoftAdminPortals", "797f4846-ba00-4fd7-ba43-dac1f8f63013"] },
    "devices": { "deviceFilter": { "mode": "exclude", "rule": "device.extensionAttribute12 -eq \"PAW\"" } },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

CA027, block the Azure management plane for everyone who doesn't manage Azure or the tenant:

```json
{
  "displayName": "CA027-AllUsers-AzureManagement-BlockNonOperators",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}", "{group:CA-Persona-Admins}", "{group:CA-Access-AzureOperators}"]
    },
    "applications": { "includeApplications": ["797f4846-ba00-4fd7-ba43-dac1f8f63013"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

### Wave 3: everyone

CA006, MFA for Internals during the transition (the shape also serves CA009 with the Externals scope shown below):

```json
{
  "displayName": "CA006-Internals-RequireMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeGroups": ["{group:CA-Persona-Internals}"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000002" } },
  "sessionControls": { "signInFrequency": { "isEnabled": true, "type": "hours", "value": 12, "frequencyInterval": "timeBased" } }
}
```

CA007, compliant or hybrid joined device, with the web-only exception:

```json
{
  "displayName": "CA007-Internals-RequireCompliantOrHybridDevice",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGroups": ["{group:CA-Persona-Internals}"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}", "{group:CA-Persona-WebOnly}"]
    },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["compliantDevice", "domainJoinedDevice"] }
}
```

CA008, United States only, with the travel exception:

```json
{
  "displayName": "CA008-Internals-BlockNonUSLocations",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGroups": ["{group:CA-Persona-Internals}"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}", "{group:CA-Exclude-ApprovedTravel}"]
    },
    "applications": { "includeApplications": ["All"] },
    "locations": { "includeLocations": ["All"], "excludeLocations": ["{location:NL-TrustedCountries}"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

CA009, MFA for partner users. The Externals scope is guest and member B2B users from enumerated partner tenants:

```json
{
  "displayName": "CA009-Externals-RequireMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "b2bCollaborationGuest,b2bCollaborationMember",
        "externalTenants": {
          "@odata.type": "#microsoft.graph.conditionalAccessEnumeratedExternalTenants",
          "membershipKind": "enumerated",
          "members": ["{tenant:partners}"]
        }
      },
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"]
    },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000002" } },
  "sessionControls": { "signInFrequency": { "isEnabled": true, "type": "hours", "value": 8, "frequencyInterval": "timeBased" } }
}
```

CA011, limited guest access. The Guests scope includes guest and other external users from all tenants and excludes the same types from the partner tenants in CA009's list, so Guests means "not from a partner." Guests who use email one-time passcode can't satisfy an authentication strength, so this policy uses `mfa`.[^aA-strengths] `00000003-0000-0ff1-ce00-000000000000` is SharePoint Online.[^aA-create]

```json
{
  "displayName": "CA011-Guests-LimitedAppAccess",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "b2bCollaborationGuest,otherExternalUser",
        "externalTenants": { "@odata.type": "#microsoft.graph.conditionalAccessAllExternalTenants", "membershipKind": "all" }
      },
      "excludeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "b2bCollaborationGuest,otherExternalUser",
        "externalTenants": {
          "@odata.type": "#microsoft.graph.conditionalAccessEnumeratedExternalTenants",
          "membershipKind": "enumerated",
          "members": ["{tenant:partners}"]
        }
      },
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"]
    },
    "applications": { "includeApplications": ["00000003-0000-0ff1-ce00-000000000000", "{app:Microsoft Teams}"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "AND", "builtInControls": ["mfa"], "termsOfUse": ["{terms:Guest}"] },
  "sessionControls": {
    "applicationEnforcedRestrictions": { "isEnabled": true },
    "signInFrequency": { "isEnabled": true, "type": "hours", "value": 1, "frequencyInterval": "timeBased" }
  }
}
```

The partner tenant list is maintained by the partner onboarding process ([Chapter 09](09-access-governance.md)) and is the same list in CA009, CA011, CA012 and CA038; a partner added to one and not the others is a drift finding.

CA016, compliant device for desktop Office, Members only:

```json
{
  "displayName": "CA016-AllUsers-RequireCompliantDevice-OfficeApps",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"],
      "excludeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "internalGuest,b2bCollaborationGuest,b2bCollaborationMember,b2bDirectConnectUser,otherExternalUser,serviceProvider",
        "externalTenants": { "@odata.type": "#microsoft.graph.conditionalAccessAllExternalTenants", "membershipKind": "all" }
      }
    },
    "applications": { "includeApplications": ["Office365"] },
    "platforms": { "includePlatforms": ["windows", "macOS"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["compliantDevice"] }
}
```

CA017, app protection on mobile. `compliantApplication` is the Graph built-in control that corresponds to "require app protection policy" (`approvedApplication` is the retired approved-client-app grant):[^aA-grant][^aA-approved-app]

```json
{
  "displayName": "CA017-Internals-AppProtection-Mobile",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeGroups": ["{group:CA-Persona-Internals}"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["Office365"] },
    "platforms": { "includePlatforms": ["android", "iOS"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["compliantApplication"] }
}
```

CA018, the catch-all MFA baseline, with no resource exclusions:[^aA-apps-concept]

```json
{
  "displayName": "CA018-AllUsers-RequireMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeUsers": ["All"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["mfa"] }
}
```

### Wave 4: risk and workload identities

CA013 in its block form, for tenants in BOD 25-01 scope (MS.AAD.2.1):

```json
{
  "displayName": "CA013-AllUsers-HighUserRisk-RequireRemediation",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeUsers": ["All"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "userRiskLevels": ["high"],
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

The policy keeps its Book 02 display name in both forms so that its history stays continuous; the deployed form is recorded in the change log. CA013 in its remediation form, for tenants outside BOD 25-01, scoped to Members because remediation isn't supported for guests and external users:[^aA-managed]

```json
{
  "displayName": "CA013-AllUsers-HighUserRisk-RequireRemediation",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"],
      "excludeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "internalGuest,b2bCollaborationGuest,b2bCollaborationMember,b2bDirectConnectUser,otherExternalUser,serviceProvider",
        "externalTenants": { "@odata.type": "#microsoft.graph.conditionalAccessAllExternalTenants", "membershipKind": "all" }
      }
    },
    "applications": { "includeApplications": ["All"] },
    "userRiskLevels": ["high"]
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": ["riskRemediation"],
    "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000002" }
  },
  "sessionControls": {
    "signInFrequency": { "isEnabled": true, "frequencyInterval": "everyTime", "authenticationType": "primaryAndSecondaryAuthentication" }
  }
}
```

CA014, step up medium and high sign-in risk:

```json
{
  "displayName": "CA014-AllUsers-MediumSigninRisk-RequireMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeUsers": ["All"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "signInRiskLevels": ["medium", "high"],
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000002" } },
  "sessionControls": {
    "signInFrequency": { "isEnabled": true, "frequencyInterval": "everyTime", "authenticationType": "primaryAndSecondaryAuthentication" }
  }
}
```

CA019, block high sign-in risk (MS.AAD.2.3), is CA014's shape with `"signInRiskLevels": ["high"]`, `builtInControls` `["block"]` and no session controls.

CA015, workload identities only from their egress ranges. Service principals are assigned directly, by the enterprise application's object ID, not through groups:[^aA-workload]

```json
{
  "displayName": "CA015-ServiceAccounts-LocationRestriction",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "clientApplications": { "includeServicePrincipals": ["{sp:workload-1}", "{sp:workload-2}"] },
    "applications": { "includeApplications": ["All"] },
    "locations": { "includeLocations": ["All"], "excludeLocations": ["{location:NL-WorkloadEgress}"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

CA037, high-risk workload identities, uses the same shape with `"servicePrincipalRiskLevels": ["high"]` in place of the location condition. Both need Workload ID Premium.[^aA-workload]

CA036, elevated insider risk (Adaptive Protection integration is in preview):[^aA-adaptive]

```json
{
  "displayName": "CA036-Members-ElevatedInsiderRisk-Block",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"],
      "excludeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "internalGuest,b2bCollaborationGuest,b2bCollaborationMember,b2bDirectConnectUser,otherExternalUser,serviceProvider",
        "externalTenants": { "@odata.type": "#microsoft.graph.conditionalAccessAllExternalTenants", "membershipKind": "all" }
      }
    },
    "applications": { "includeApplications": ["Office365"] },
    "insiderRiskLevels": "elevated",
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

### Wave 5: segments and the end state

CA022, the end state (MS.AAD.3.1):

```json
{
  "displayName": "CA022-Members-RequirePhishResistantMFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}", "{group:CA-Exclude-PhishResistantNotReady}"],
      "excludeGuestsOrExternalUsers": {
        "guestOrExternalUserTypes": "internalGuest,b2bCollaborationGuest,b2bCollaborationMember,b2bDirectConnectUser,otherExternalUser,serviceProvider",
        "externalTenants": { "@odata.type": "#microsoft.graph.conditionalAccessAllExternalTenants", "membershipKind": "all" }
      }
    },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000004" } }
}
```

CA024, browser-only limited session for web-only users:

```json
{
  "displayName": "CA024-WebOnly-LimitedWebSession",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeGroups": ["{group:CA-Persona-WebOnly}"], "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"] },
    "applications": { "includeApplications": ["All"] },
    "clientAppTypes": ["browser"]
  },
  "grantControls": { "operator": "OR", "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000002" } },
  "sessionControls": {
    "applicationEnforcedRestrictions": { "isEnabled": true },
    "persistentBrowser": { "isEnabled": true, "mode": "never" }
  }
}
```

CA030, block production applications for everyone but production operators. The application filter's rule is built in the admin center filter editor against the `FMPAccess` attribute set and copied from an export, because the attribute set and values are tenant-specific; filters for applications accept string custom security attributes only.[^aA-app-filter]

```json
{
  "displayName": "CA030-AllUsers-ProductionApps-BlockUnassigned",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": {
      "includeUsers": ["All"],
      "excludeGroups": ["{group:CA-Exclude-EmergencyAccess}", "{group:CA-Access-ProdOperators}"]
    },
    "applications": {
      "includeApplications": [],
      "applicationFilter": { "mode": "include", "rule": "{rule:FMPAccess Environment equals Production}" }
    },
    "clientAppTypes": ["all"]
  },
  "grantControls": { "operator": "OR", "builtInControls": ["block"] }
}
```

### Policies that reuse a template

| Policy | Reuses | Differences |
|---|---|---|
| CA010-Externals-RequireTermsOfUse | CA009 | `grantControls`: `"termsOfUse": ["{terms:Guest}"]`, operator `OR`; no session controls |
| CA012-Guests-BlockHighRisk | CA011's guest scope | All resources; `"signInRiskLevels": ["high"]`; `block`. Retired once CA019 is enforced |
| CA019-AllUsers-HighSigninRisk-Block | CA014 | `"signInRiskLevels": ["high"]`; `block`; no session controls |
| CA023-WebOnly-BlockDesktopAndMobileClients | CA024 | `"clientAppTypes": ["mobileAppsAndDesktopClients"]`; `block`; no session controls |
| CA026-ServerAdmins-AzureManagement-RequirePhishResistantCompliant | CA003 | Include `{group:CA-Access-ServerAdmins}`; applications `797f4846-ba00-4fd7-ba43-dac1f8f63013` and `{app:Azure Virtual Desktop}`; `operator` `AND` with `compliantDevice` and the custom strength |
| CA028-SharedDevice-KioskApps-RequireCompliant | CA004 | Include `{group:CA-Persona-SharedDevice}`; the kiosk app IDs; `deviceFilter` mode `include`, rule `device.extensionAttribute12 -in ["Kiosk","SharedDevice"]`; sign-in frequency 8 hours instead of persistent browser |
| CA029-Internals-OffNetwork-SessionLimits | CA006 | Locations: include `All`, exclude `{location:NL-TrustedNetworks}`; sign-in frequency 4 hours; persistent browser `never` |
| CA031-ProdOperators-ProductionApps-RequirePhishResistantCompliant | CA030 | Include `{group:CA-Access-ProdOperators}` only; `operator` `AND` with `compliantDevice` and strength `…0004`; sign-in frequency 4 hours |
| CA032-AllUsers-StagingApps-BlockOffNetwork | CA030 | Rule for `Staging`; no operator exclusion; locations include `All`, exclude `{location:NL-TrustedNetworks}` |
| CA033-AllUsers-PowerPlatform-BlockNonMakers | CA027 | Exclude `{group:CA-Access-PowerPlatformMakers}`; applications `{app:Power Apps}`, `{app:Power Automate}` |
| CA034-{Dept}-{App}-RequireCompliantMFA | CA006 | Include `{group:CA-Access-{App}}`; the application ID; `operator` `AND` with `compliantDevice` and strength `…0002`; sign-in frequency 8 hours |
| CA035-AllUsers-{App}-BlockUnassigned | CA027 | Exclude `{group:CA-Access-{App}}`; the application ID |
| CA038-Guests-BlockNonApprovedApps | CA011's guest scope | `"includeApplications": ["All"]`, `"excludeApplications": ["Office365", "{app:guest-approved}"]`; `block`; no session controls |

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Access as Code, and the Evidence It Produces](10-access-as-code-and-evidence.md) · [Book index](index.md) · [Next: Appendix B — PIM Role Settings Reference →](appendix-b-pim-role-settings.md)
:::

[^aA-create]: Microsoft Learn, "Create conditionalAccessPolicy" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/conditionalaccessroot-post-policies?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 20, 2026).
[^aA-policy]: Microsoft Learn, "conditionalAccessPolicy resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccesspolicy?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-managed]: Microsoft Learn, "Microsoft-managed Conditional Access policies," <https://learn.microsoft.com/entra/identity/conditional-access/managed-policies> (accessed Oct 20, 2026).
[^aA-roles]: Microsoft Learn, "Microsoft Entra built-in roles," <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> (accessed Oct 20, 2026).
[^aA-strengths-list]: Microsoft Learn, "List authenticationStrengthPolicies" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/authenticationstrengthroot-list-policies?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-approved-app]: Microsoft Learn, "Migrate approved client app to application protection policy in Conditional Access," <https://learn.microsoft.com/entra/identity/conditional-access/migrate-approved-client-app> (accessed Oct 20, 2026).
[^aA-users]: Microsoft Learn, "conditionalAccessUsers resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessusers?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-guests]: Microsoft Learn, "conditionalAccessGuestsOrExternalUsers resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessguestsorexternalusers?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-ext-tenants]: Microsoft Learn, "conditionalAccessExternalTenants resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessexternaltenants?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-enum-tenants]: Microsoft Learn, "conditionalAccessEnumeratedExternalTenants resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessenumeratedexternaltenants?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-apps]: Microsoft Learn, "conditionalAccessApplications resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessapplications?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-client-apps]: Microsoft Learn, "conditionalAccessClientApplications resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessclientapplications?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-conditions]: Microsoft Learn, "conditionalAccessConditionSet resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessconditionset?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-locations]: Microsoft Learn, "conditionalAccessLocations resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccesslocations?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-platforms]: Microsoft Learn, "conditionalAccessPlatforms resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessplatforms?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-filter]: Microsoft Learn, "conditionalAccessFilter resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessfilter?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-flows]: Microsoft Learn, "Authentication flows as a condition in Conditional Access policy," <https://learn.microsoft.com/entra/identity/conditional-access/concept-authentication-flows> (accessed Oct 20, 2026).
[^aA-grant]: Microsoft Learn, "conditionalAccessGrantControls resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessgrantcontrols?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-session]: Microsoft Learn, "conditionalAccessSessionControls resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccesssessioncontrols?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-sif]: Microsoft Learn, "signInFrequencySessionControl resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/signinfrequencysessioncontrol?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-persistent]: Microsoft Learn, "persistentBrowserSessionControl resource type" (Microsoft Graph v1.0), <https://learn.microsoft.com/graph/api/resources/persistentbrowsersessioncontrol?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^aA-strengths]: Microsoft Learn, "Overview of Conditional Access authentication strengths," <https://learn.microsoft.com/entra/identity/authentication/concept-authentication-strengths> (accessed Oct 20, 2026).
[^aA-network]: Microsoft Learn, "Conditional Access policy: Using network signals," <https://learn.microsoft.com/entra/identity/conditional-access/concept-assignment-network> (accessed Oct 20, 2026).
[^aA-nl-cmdlet]: Microsoft Learn, "New-MgIdentityConditionalAccessNamedLocation" (Microsoft Graph PowerShell), <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/new-mgidentityconditionalaccessnamedlocation?view=graph-powershell-1.0> (accessed Oct 20, 2026).
[^aA-strength-cmdlet]: Microsoft Learn, "New-MgPolicyAuthenticationStrengthPolicy" (Microsoft Graph PowerShell), <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/new-mgpolicyauthenticationstrengthpolicy?view=graph-powershell-1.0> (accessed Oct 20, 2026).
[^aA-users-concept]: Microsoft Learn, "Conditional Access setup: Users, groups, agents, and workload identities," <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-users-groups> (accessed Oct 20, 2026).
[^aA-filter-concept]: Microsoft Learn, "Filter for devices as a condition in Conditional Access policy," <https://learn.microsoft.com/entra/identity/conditional-access/concept-condition-filters-for-devices> (accessed Oct 20, 2026).
[^aA-apps-concept]: Microsoft Learn, "Targeting resources in Conditional Access policies," <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-cloud-apps> (accessed Oct 20, 2026).
[^aA-workload]: Microsoft Learn, "Microsoft Entra Conditional Access for workload identities," <https://learn.microsoft.com/entra/identity/conditional-access/workload-identity> (accessed Oct 20, 2026).
[^aA-adaptive]: Microsoft Learn, "Help dynamically mitigate risks with Adaptive Protection," <https://learn.microsoft.com/purview/insider-risk-management-adaptive-protection> (accessed Oct 20, 2026).
[^aA-app-filter]: Microsoft Learn, "Filter for applications in Conditional Access policy," <https://learn.microsoft.com/entra/identity/conditional-access/concept-filter-for-applications> (accessed Oct 20, 2026).
