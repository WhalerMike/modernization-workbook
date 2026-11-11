---
title: "Appendix B — Identity and Application Detections for Zero Trust Findings"
description: "The detections a Zero Trust assessment's identity and application findings need behind them, as a rule pack for the library in Chapter 11: emergency access use and change, privileged activation, administrator password resets, authentication method changes, tenant creation, federation changes, device code flow, risky users and sign-ins, then new application credentials, owner changes, consent, high-privilege grants, service principal role assignments and risk, and redirect URI changes. Each with its KQL from Microsoft Learn or Microsoft's published rule templates, its data source and its availability in GCC, GCC High and DoD; then the How-section steps, the synthetic tests that prove each rule fires, the evidence an assessor reads and who runs it on day two."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b12-security-operations
book: B12
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Appendix B — Identity and Application Detections for Zero Trust Findings

*A control that can be switched off by the account it protects needs someone watching that account; a detection that has never fired on a test is a hope, not a control.*

::: {.callout-note}
## In this appendix
The detections that sit behind the identity and application findings a Zero Trust assessment raises, written for the rule library in [Chapter 11](11-detection-engineering-and-response.md#a-rule-library-as-code): what each watches, its data source, its KQL (from Microsoft Learn or Microsoft's own rule templates wherever they give one), its authority and its availability in each government cloud. Then the rollout in the order the workbook's How-section template sets, the synthetic tests that show each rule fires, the evidence an assessor can inspect, and the day-two owner.
:::

Zero Trust assessments find configuration: an emergency access account without monitoring, a privileged role assigned permanently, an application with a secret and no owner, user consent left open. [Book 04](../b04-access/index.md) and [Book 13](../b13-governance/index.md) fix the configuration. This appendix is the other half: a configuration can be changed back, an exclusion can be widened and a credential can be added at 2 a.m., so each of these controls needs a detection that sees it happen. In the workbook's terms a detection is how a control reaches the **Operated** state, and the test that makes it fire is part of the **Evidenced** state ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md#control-states)).

The rules extend the library in [Chapter 11](11-detection-engineering-and-response.md). They use the same IDs, the same lifecycle (author, test against history, alert-only, promote, review) and the same response ladder. The telemetry under them is [Chapter 03](03-identity-telemetry.md)'s; the connectors and their cloud availability are [Chapter 05](05-from-log-warehouse-to-detection.md#where-sentinel-runs-and-which-clouds-table-to-read)'s.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** SecOps, for Identity and Apps
- **CISA ZTMM pillar:** Identity, and Applications and Workloads, through the cross-cutting Visibility and Analytics capability
- **Depends on:** Entra diagnostic settings sending every sign-in and audit category to the workspace ([Chapter 03](03-identity-telemetry.md)); the emergency access design and PIM role settings in [Book 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts); the application owner and credential register in [Book 13](../b13-governance/index.md)
- **Attack chain interrupted:** Persistence (a new credential, owner, consent or federation trust), Privilege Escalation (role activation or assignment), Credential Access (device code phishing, authentication method tampering) and Defense Evasion (changes to the accounts that bypass Conditional Access)
:::

## Authority and scope {#authority-and-scope}

**Authority:** Microsoft-recommended for every detection below: each row cites the Learn page or Microsoft rule template that recommends monitoring the event (accessed Nov 11, 2026). Logging and monitoring themselves are mandated for federal systems by OMB M-26-14 and supported here; the specific rules, thresholds and severities are the program's risk-based choices. NIST SP 800-53 Rev. 5 controls are named as the controls a rule *supports* (AC-2(4), AU-6, SI-4 and others in [Appendix A](appendix-a-requirements-mapping.md)), never as controls it settles.

**Applies:** All tenants with Entra diagnostic settings sent to a Log Analytics workspace. License-dependent rows say so (Microsoft Entra ID P2 for user risk, Workload Identities Premium for full workload risk detail). Environment-dependent rows give GCC, GCC High and DoD availability below.

## Prerequisites {#detection-prerequisites}

### Data sources and licenses {#detection-data-sources}

| Table | Entra diagnostic setting category | License | Used by |
|---|---|---|---|
| `SigninLogs` | SignInLogs | Microsoft Entra ID P1 or P2 to stream sign-in logs | DET-30, 37, 39 |
| `AADNonInteractiveUserSignInLogs` | NonInteractiveUserSignInLogs | P1 or P2 | DET-30, 37 |
| `AuditLogs` | AuditLogs | Any | DET-31 to 36, 14, 40 to 43, 45 |
| `AADRiskyUsers`, `AADUserRiskEvents` | RiskyUsers, UserRiskEvents | Microsoft Entra ID P2 | DET-38 |
| `AADRiskyServicePrincipals`, `AADServicePrincipalRiskEvents` | RiskyServicePrincipals, ServicePrincipalRiskEvents | Workload Identities Premium for full detail; without it detections still arrive with limited detail | DET-44 |

The category-to-table names for the risk tables are Microsoft's;[^aB-risk-export] the sign-in license requirement and the Workload ID Premium requirement for the risky service principal tables are as [Chapter 05](05-from-log-warehouse-to-detection.md#microsoft-entra-id) records them. Workload identity risk reaches tenants without the Premium license as detections with limited reporting detail.[^aB-wid-risk]

### Government-cloud availability {#detection-gov-availability}

GCC tenants pair with Microsoft Entra ID in commercial Azure, so their workspace and Sentinel use the commercial column; GCC High and DoD pair with Entra ID in Azure Government ([Chapter 03](03-identity-telemetry.md#sovereign-clouds)).

| Capability | Commercial and GCC | GCC High and DoD (Azure Government) | Source, accessed Nov 11, 2026 |
|---|---|---|---|
| Microsoft Entra ID connector (sign-in and audit tables) | GA | GA | Sentinel feature availability[^aB-sentinel-feature] |
| Microsoft Entra ID Protection connector and risk tables | GA | GA; every listed risk detection available except Microsoft Entra threat intelligence | Sentinel feature availability; Entra feature availability[^aB-sentinel-feature][^aB-entra-gov] |
| Workload Identities Premium (workload risk detail) | Available | Available in Azure for US Government; no free trial there | Entra feature availability; Workload ID FAQ[^aB-entra-gov][^aB-wid-faq] |
| Scheduled and NRT analytics rules, automation rules, watchlists | GA | GA | Sentinel feature availability[^aB-sentinel-feature] |
| Sentinel in the Defender portal | GA features available | GA features available in GCC High and DoD; preview features commercial only | Sentinel feature availability[^aB-sentinel-feature] |
| Azure Monitor log search alert (Learn's emergency access alert method) | Available | Not yet specified on the pages read | Emergency access accounts page[^aB-emergency] |

Every rule below runs in Sentinel's analytics tier. A table moved to the Auxiliary plan or the data lake tier stops raising alerts ([Chapter 12](12-evidence-metrics-and-continuous-monitoring.md#retention-tiers-and-tamper-protected-copies)), so every table above stays on the Analytics plan.

### Watchlists the rules read {#detection-watchlists}

Exclusions and scopes live in Sentinel watchlists, kept outside the queries so a change is a reviewed watchlist edit, not a rule edit ([Chapter 11](11-detection-engineering-and-response.md#example-rules)). The watchlist names are the program's; Sentinel's `_GetWatchlist()` returns each with its `SearchKey` column.[^aB-watchlist]

| Watchlist | `SearchKey` | Owner |
|---|---|---|
| `FMP-EmergencyAccess` | Object ID of each emergency access account | Identity engineering ([Book 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts)) |
| `FMP-PrivilegedAccounts` | Object ID of each account eligible for or holding a Tier 0 or Tier 1 role | Identity engineering |
| `FMP-DeviceCodeApproved` | Object ID of each account approved to use device code flow (for example a Teams device resource account), with its exception reference | Identity engineering, with the exception's risk owner |
| `FMP-ApprovedRedirectDomains` | A DNS domain the agency owns and has approved for redirect URIs | Application owners ([Book 08](../b08-ddi/index.md) for the DNS proof) |

## The identity detections {#identity-detections}

::: {.callout-warning}
## Illustrative code
The queries are adapted from Microsoft Learn and Microsoft's rule templates and checked against the current table schemas, but they haven't been run against a production workspace. Thresholds marked `TUNE` are starting points. Each rule goes through Chapter 11's lifecycle, alert-only first, before it creates incidents.
:::

| ID | Detects | Table | Severity (program) | Microsoft source |
|---|---|---|---|---|
| FMP-DET-30 | Any sign-in by an emergency access account, success or failure | `SigninLogs`, `AADNonInteractiveUserSignInLogs` | High | Learn, emergency access accounts[^aB-emergency] |
| FMP-DET-31 | Any change to, or action by, an emergency access account | `AuditLogs` | High | Learn, privileged accounts guide[^aB-secops-priv] |
| FMP-DET-32 | Activation of a Tier 0 role through PIM | `AuditLogs` | Medium | Learn, privileged accounts guide[^aB-secops-priv] |
| FMP-DET-33 | Password reset or change on a privileged account | `AuditLogs` | High | Learn, privileged accounts guide; Sentinel hunting query `PrivilegedAccountPasswordChanges`[^aB-secops-priv] |
| FMP-DET-34 | Authentication method registered, changed or deleted on a privileged account; any authentication methods policy change | `AuditLogs` | High | Learn, privileged accounts guide; audit activity reference[^aB-secops-priv][^aB-audit-acts] |
| FMP-DET-35 | A new Microsoft Entra tenant created by an identity from this tenant | `AuditLogs` | Medium | Learn, infrastructure guide; default user permissions[^aB-secops-infra][^aB-default-perms] |
| FMP-DET-36 | Federation settings or domain authentication changed | `AuditLogs` | High | Learn, monitor changes to federation configuration[^aB-fed] |
| FMP-DET-37 | Successful device code flow sign-in by an account not approved for it | Both sign-in tables | Medium; High for a privileged account | Learn, applications guide; authentication flows[^aB-secops-apps][^aB-authflows] |
| FMP-DET-38 | User at high risk, or confirmed compromised | `AADRiskyUsers` | High | Learn, export risk data[^aB-risk-export] |
| FMP-DET-39 | Successful sign-in at medium or high risk, or any risk for a privileged account | `SigninLogs` | Medium; High for a privileged account | Learn, privileged accounts guide[^aB-secops-priv] |

The existing rules [FMP-DET-11](11-detection-engineering-and-response.md#example-rules) (PIM activation outside business hours) and FMP-DET-12 (sensitive role assigned outside PIM) stay as they are; DET-32 adds the every-activation record for Tier 0.

**FMP-DET-30, emergency access sign-in.** Microsoft's guidance is to alert every time an emergency access account signs in, because these accounts are used only for drills and real emergencies; its sample query filters `SigninLogs` on the accounts' object IDs.[^aB-emergency] The program reads the IDs from a watchlist and adds the non-interactive table, so token refreshes are seen too. A failed sign-in is included: someone trying the account is as important as someone succeeding.

```kql
// FMP-DET-30 Emergency access account sign-in. NRT.
let Emergency = _GetWatchlist('FMP-EmergencyAccess') | project UserId = tostring(SearchKey);
union SigninLogs, AADNonInteractiveUserSignInLogs
| where UserId in (Emergency)
| project TimeGenerated, Type, UserPrincipalName, UserId, IPAddress, AppDisplayName,
          ResultType, ResultDescription, ConditionalAccessStatus, CorrelationId
```

**FMP-DET-31, emergency access account changed.** Microsoft lists four events on an emergency account that might mean an attacker is trying to compromise the environment: sign-in, password change, permission or role change, and credential or authentication method added or changed.[^aB-secops-priv] The second three are audit events, so the rule matches any audit record that targets one of the accounts or was initiated by one.

```kql
// FMP-DET-31 Emergency access account changed or acting. NRT.
let EmergencyIds = toscalar(_GetWatchlist('FMP-EmergencyAccess') | summarize make_list(tostring(SearchKey)));
AuditLogs
| extend ActorId = tostring(InitiatedBy.user.id)
| mv-apply T = TargetResources on (
    summarize TargetIds = make_set(tostring(T.id)), TargetNames = make_set(tostring(T.userPrincipalName)))
| where set_has_element(EmergencyIds, ActorId) or array_length(set_intersect(TargetIds, EmergencyIds)) > 0
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, OperationName, Category, Result, Initiator, TargetNames, CorrelationId
```

**FMP-DET-32, Tier 0 role activation.** PIM records an activation as "Add member to role completed (PIM activation)," and Microsoft's guidance is to monitor elevation.[^aB-secops-priv] Every Tier 0 activation goes to the queue as a record to reconcile against its ticket; DET-11 raises the off-hours ones higher. The role list is the agency's Tier 0 set from [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md).

```kql
// FMP-DET-32 Tier 0 role activated through PIM. NRT.
let Tier0 = dynamic(["Global Administrator", "Privileged Role Administrator",
                     "Privileged Authentication Administrator", "Security Administrator",
                     "Conditional Access Administrator", "Hybrid Identity Administrator"]);  // TUNE: the agency's Tier 0 list
AuditLogs
| where OperationName == "Add member to role completed (PIM activation)"
| mv-apply R = TargetResources on (
    where R.type =~ "Role"
    | extend RoleName = tostring(R.displayName))
| where RoleName in (Tier0)
| extend Initiator = tostring(InitiatedBy.user.userPrincipalName)
| project TimeGenerated, Initiator, RoleName, Result, ResultReason, CorrelationId
```

`ResultReason` carries the justification the user typed at activation, which the analyst compares with the change ticket ([Book 04, Appendix B](../b04-access/appendix-b-pim-role-settings.md) sets the ticket field where the role requires one).

**FMP-DET-33, privileged account password reset.** Microsoft's guidance is to alert when any administrator account password changes, by an administrator or by self-service, success or failure, and to write the query for privileged accounts.[^aB-secops-priv] The password activities in the audit log include "Reset password (by admin)," "Change password (self-service)," "Reset password (self-service)" and "Admin started password reset."[^aB-audit-acts] Matching on the word catches the variants and new names.

```kql
// FMP-DET-33 Password reset or change on a privileged account. NRT.
let Privileged = _GetWatchlist('FMP-PrivilegedAccounts') | project Id = tostring(SearchKey);
AuditLogs
| where Category == "UserManagement" and OperationName has "password"
| mv-apply T = TargetResources on (
    where tostring(T.type) =~ "User"
    | extend TargetId = tostring(T.id), Target = tostring(T.userPrincipalName))
| where TargetId in (Privileged)
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, OperationName, Target, Initiator, Result, ResultReason, CorrelationId
```

**FMP-DET-34, authentication method changes.** An attacker who adds a method to an account keeps access after a password reset; Microsoft rates changes to a privileged account's authentication methods as high risk.[^aB-secops-priv] The Authentication Methods audit activities include "Admin registered security info," "Admin updated security info," "Admin deleted security info," "User registered security info," "User deleted security info," "User changed default security info" and "User updated security info," and tenant-level changes appear as "Authentication Methods Policy Update" and the "Authentication Strength Policy" create, update and delete activities.[^aB-audit-acts] DET-34a covers privileged accounts; DET-34b covers the tenant policy, for everyone.

```kql
// FMP-DET-34a Security info changed on a privileged account. NRT.
let Privileged = _GetWatchlist('FMP-PrivilegedAccounts') | project Id = tostring(SearchKey);
AuditLogs
| where OperationName has "security info"
| mv-apply T = TargetResources on (
    where tostring(T.type) =~ "User"
    | extend TargetId = tostring(T.id), Target = tostring(T.userPrincipalName))
| where TargetId in (Privileged)
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, OperationName, Target, Initiator, Result, CorrelationId
```

```kql
// FMP-DET-34b Authentication methods or authentication strength policy changed. NRT.
AuditLogs
| where OperationName in ("Authentication Methods Policy Update", "Authentication Methods Policy Reset")
     or OperationName startswith "Authentication Strength Policy"
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, OperationName, Initiator, Result, TargetResources, CorrelationId
```

**FMP-DET-35, tenant creation.** Creating a tenant is recorded in the audit log as category `DirectoryManagement`, activity "Create Company," and the creator becomes that tenant's Global Administrator. Microsoft's Zero Trust guidance pairs the "Restrict non-admin users from creating tenants" setting, with the Tenant Creator role for those who need it, with reviewing these events; the restriction itself belongs to [Book 04](../b04-access/index.md).[^aB-default-perms][^aB-zt-tenants] The infrastructure guide lists the target as the new tenant's ID.[^aB-secops-infra]

```kql
// FMP-DET-35 New tenant created by an identity from this tenant. NRT.
AuditLogs
| where Category == "DirectoryManagement" and OperationName == "Create Company"
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| extend NewTenantId = tostring(TargetResources[0].id)
| project TimeGenerated, Initiator, NewTenantId, Result, CorrelationId
```

**FMP-DET-36, federation change.** Microsoft recommends an alert whenever the federation configuration changes, and gives the query: audit records whose activity is "Set federation settings on domain" or "Set domain authentication."[^aB-fed] The program's version keeps Microsoft's filter and projects the actor. A federation trust added by an attacker lets them mint tokens the tenant accepts, so this rule is High in every agency, federated or not.

```kql
// FMP-DET-36 Federation configuration changed (Microsoft Learn's query, actor projected). NRT.
AuditLogs
| extend TargetResource = parse_json(TargetResources)
| where ActivityDisplayName contains "Set federation settings on domain"
     or ActivityDisplayName contains "Set domain authentication"
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, Domain = tostring(TargetResource[0].displayName), OperationName,
          Initiator, Result, ActivityDisplayName, CorrelationId
```

**FMP-DET-37, device code flow.** Device code flow is meant for input-constrained devices; Microsoft says that when a successful device code sign-in appears without a need for it, investigate.[^aB-secops-apps] In both sign-in tables, `AuthenticationProtocol` records the grant type, with `deviceCode` as one value.[^aB-signinlogs] Microsoft's device code guidance also says to alert on unexpected use by privileged users, emergency access accounts, unfamiliar apps or unexpected locations, and to treat any non-Teams exception as a documented risk acceptance with an owner.[^aB-teams-dcf] Approved users come from the watchlist. Where a Conditional Access policy blocks device code flow ([Book 04](../b04-access/07-the-conditional-access-policy-library.md)), this rule shows what the exclusions still allow.

```kql
// FMP-DET-37 Successful device code sign-in by an account not approved for it. Every 15m, lookback 15m.
let Approved   = _GetWatchlist('FMP-DeviceCodeApproved') | project Id = tostring(SearchKey);
let Privileged = _GetWatchlist('FMP-PrivilegedAccounts') | project Id = tostring(SearchKey);
union SigninLogs, AADNonInteractiveUserSignInLogs
| where TimeGenerated > ago(15m)
| where AuthenticationProtocol == "deviceCode" and ResultType == "0"
| where UserId !in (Approved)
| extend RuleSeverity = iff(UserId in (Privileged), "High", "Medium")
| project TimeGenerated, UserPrincipalName, UserId, AppDisplayName, ResourceDisplayName,
          IPAddress, Location, RuleSeverity, CorrelationId
```

For a session that started with device code flow and later refreshes, the sign-in's `OriginalTransferMethod` shows the original method even when the current protocol doesn't;[^aB-signinlogs][^aB-authflows] analysts read it during investigation.

**FMP-DET-38, risky users.** ID Protection exports risky users and user risk detections to `AADRiskyUsers` and `AADUserRiskEvents`.[^aB-risk-export] The rule raises users at high risk and any user an administrator has confirmed compromised; [FMP-DET-10b](11-detection-engineering-and-response.md#example-rules) already raises user-reported suspicious activity. License-dependent: Microsoft Entra ID P2.

```kql
// FMP-DET-38 User at high risk or confirmed compromised. Every 15m, lookback 1h.
AADRiskyUsers
| where TimeGenerated > ago(1h)
| summarize arg_max(RiskLastUpdatedDateTime, *) by Id
| where RiskState == "confirmedCompromised" or (RiskState == "atRisk" and RiskLevel == "high")
| project RiskLastUpdatedDateTime, UserPrincipalName, RiskLevel, RiskState, RiskDetail
```

**FMP-DET-39, risky sign-ins.** Microsoft rates any ID Protection risk on a privileged account sign-in as worth alerting on.[^aB-secops-priv] For everyone else the program raises successful medium and high risk sign-ins, which risk-based Conditional Access ([Book 04](../b04-access/07-the-conditional-access-policy-library.md)) should already have challenged; a success means the challenge was passed or the policy didn't apply, and both need a look.

```kql
// FMP-DET-39 Successful risky sign-in. Every 15m, lookback 15m.
let Privileged = _GetWatchlist('FMP-PrivilegedAccounts') | project Id = tostring(SearchKey);
SigninLogs
| where TimeGenerated > ago(15m)
| where ResultType == "0"
| where RiskLevelDuringSignIn in ("medium", "high")
     or (UserId in (Privileged) and RiskLevelDuringSignIn in ("low", "medium", "high"))
| extend RuleSeverity = iff(UserId in (Privileged), "High", "Medium")
| project TimeGenerated, UserPrincipalName, RiskLevelDuringSignIn, RiskEventTypes_V2, IPAddress,
          Location, AppDisplayName, ConditionalAccessStatus, RuleSeverity, CorrelationId
```

Without a P2 license the risk fields come back `hidden` or `none`, and this rule sees nothing; that is a licensing decision for the agency to record, not a detection that failed ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

## The application detections {#application-detections}

Microsoft's security operations guide for applications names the events to alert on: credentials added to existing applications, applications assigned to roles, highly privileged permissions granted, end-user and administrator consent, risk-based consent stops, device code and ROPC flows, redirect URI and AppID URI changes, owner changes and sign-out URL changes; each row links a Sentinel template.[^aB-secops-apps] The program starts from those templates.

| ID | Detects | Table | Severity (program) | Microsoft source |
|---|---|---|---|---|
| FMP-DET-14 | New credential on an existing application or service principal (existing rule; query below) | `AuditLogs` | High | Applications guide; template `NewAppOrServicePrincipalCredential`[^aB-secops-apps] |
| FMP-DET-40 | Owner added to or removed from an application or service principal | `AuditLogs` | Medium | Applications guide; template `ChangestoApplicationOwnership`[^aB-secops-apps] |
| FMP-DET-41 | Consent to an application, flagged by admin or user consent | `AuditLogs` | Low (user), High (admin or all principals) | Applications guide; app permission audit logs[^aB-secops-apps][^aB-app-perms] |
| FMP-DET-42 | A highly privileged application permission granted to a service principal | `AuditLogs` | High | Applications guide; template `ServicePrincipalAssignedAppRoleWithSensitiveAccess`[^aB-secops-apps] |
| FMP-DET-43 | A service principal assigned a directory role | `AuditLogs` | High for privileged roles, Medium otherwise | Applications guide; template `ServicePrincipalAssignedPrivilegedRole`[^aB-secops-apps] |
| FMP-DET-44 | A workload identity at risk | `AADServicePrincipalRiskEvents` | Medium; High for a privileged service principal | Learn, workload identity risk; table sample query[^aB-wid-risk][^aB-sp-risk-q] |
| FMP-DET-45 | Redirect URI added or changed to a non-HTTPS, wildcard or unapproved domain | `AuditLogs` | High | Applications guide; template `ApplicationRedirectURLUpdate`[^aB-secops-apps] |

**FMP-DET-14, new application credential.** Microsoft rates credentials added to an existing application as high risk, and notes that application and service principal updates are logged as two entries.[^aB-secops-apps] The audit activities are "Update application - Certificates and secrets management" and "Add service principal credentials."[^aB-audit-acts] An exception for an expected rotation comes from the application's change ticket, not from the query; [Book 13](../b13-governance/index.md) owns the credential register and the replacement of secrets with managed identities or certificates.

```kql
// FMP-DET-14 New credential on an existing application or service principal. NRT.
AuditLogs
| where OperationName in ("Update application - Certificates and secrets management",
                          "Add service principal credentials")
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| mv-apply T = TargetResources on (
    extend AppName = tostring(T.displayName), AppObjectId = tostring(T.id))
| project TimeGenerated, OperationName, AppName, AppObjectId, Initiator, Result, CorrelationId
```

**FMP-DET-40, owner changes.** Microsoft's guidance is to look for any user added as an application owner outside normal change management.[^aB-secops-apps] Removal matters for the opposite reason: an application whose last owner is removed becomes ownerless, which is a governance finding in [Book 13](../b13-governance/index.md). The audit activities are "Add owner to application," "Add owner to service principal," "Remove owner from application" and "Remove owner from service principal."[^aB-audit-acts]

```kql
// FMP-DET-40 Application or service principal owner added or removed. Every 15m, lookback 15m.
AuditLogs
| where TimeGenerated > ago(15m)
| where OperationName in ("Add owner to application", "Add owner to service principal",
                          "Remove owner from application", "Remove owner from service principal")
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| extend Owner = tostring(TargetResources[0].userPrincipalName),
         App   = tostring(TargetResources[1].displayName)
| project TimeGenerated, OperationName, App, Owner, Initiator, Result, CorrelationId
```

Confirm the order of `TargetResources` on a test event (the synthetic test below creates one) before promoting the rule; the owner and the application can appear in either position.

**FMP-DET-41, consent.** "Consent to application" records a user or administrator granting consent; Microsoft's filter separates them on `ConsentContext.IsAdminConsent`, and treats end-user consent as low risk to investigate and administrator consent to privileged permissions as high.[^aB-secops-apps][^aB-app-perms] Where [Book 04](../b04-access/index.md)'s consent governance turns user consent off or limits it to low-risk permissions, every user consent this rule sees is an exception to explain.

```kql
// FMP-DET-41 Consent to application, admin or user. Every 15m, lookback 15m.
AuditLogs
| where TimeGenerated > ago(15m)
| where OperationName == "Consent to application"
| mv-apply T = TargetResources on (
    extend App = tostring(T.displayName), Props = T.modifiedProperties)
| mv-apply P = Props on (
    summarize IsAdmin = take_anyif(tostring(P.newValue), tostring(P.displayName) == "ConsentContext.IsAdminConsent"),
              OnBehalfOfAll = take_anyif(tostring(P.newValue), tostring(P.displayName) == "ConsentContext.OnBehalfOfAll"),
              Scopes = take_anyif(tostring(P.newValue), tostring(P.displayName) == "ConsentAction.Permissions"))
| extend Initiator = tostring(InitiatedBy.user.userPrincipalName)
| extend RuleSeverity = iff(IsAdmin has "True" or OnBehalfOfAll has "True", "High", "Low")
| project TimeGenerated, App, Initiator, IsAdmin, OnBehalfOfAll, Scopes, Result, RuleSeverity, CorrelationId
```

The `ConsentContext.IsAdminConsent` property name is Microsoft's;[^aB-secops-apps] the `OnBehalfOfAll` and `Permissions` property names follow Microsoft's consent templates and should be confirmed on a test consent before promotion.

**FMP-DET-42, highly privileged application permission.** Microsoft's filter is "Add app role assignment to service principal" where the target is an API with sensitive data, such as Microsoft Graph, and `AppRole.Value` is a highly privileged application permission, such as `Directory.ReadWrite.All` or a wide `Mail.*` permission.[^aB-secops-apps]

```kql
// FMP-DET-42 Highly privileged application permission granted. NRT.
let Sensitive = dynamic(["Directory.ReadWrite.All", "RoleManagement.ReadWrite.Directory",
                         "AppRoleAssignment.ReadWrite.All", "Application.ReadWrite.All",
                         "Mail.ReadWrite", "Mail.Send", "Files.ReadWrite.All", "Sites.FullControl.All",
                         "User.ReadWrite.All", "Group.ReadWrite.All"]);   // TUNE: the agency's classification
AuditLogs
| where OperationName == "Add app role assignment to service principal"
| mv-apply T = TargetResources on (
    extend Props = T.modifiedProperties)
| mv-apply P = Props on (
    where tostring(P.displayName) == "AppRole.Value"
    | extend Permission = trim('"', tostring(P.newValue)))
| where Permission in (Sensitive)
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, Permission, Initiator, TargetResources, Result, CorrelationId
```

The sensitive list is the agency's own permission classification, which [Book 04](../b04-access/index.md)'s consent governance maintains; the values above are starting examples drawn from Microsoft's named examples and their peers.

**FMP-DET-43, service principal assigned a role.** Microsoft's filter is target type service principal with activity "Add member to role," "Add eligible member to role" or "Add scoped member to role"; high risk for highly privileged roles, medium otherwise.[^aB-secops-apps]

```kql
// FMP-DET-43 Service principal assigned a directory role. NRT.
let Tier0 = dynamic(["Global Administrator", "Privileged Role Administrator",
                     "Privileged Authentication Administrator", "Application Administrator",
                     "Cloud Application Administrator", "Hybrid Identity Administrator"]);  // TUNE
AuditLogs
| where OperationName in ("Add member to role", "Add eligible member to role", "Add scoped member to role")
| mv-apply T = TargetResources on (
    where tostring(T.type) =~ "ServicePrincipal"
    | extend ServicePrincipal = tostring(T.displayName), Props = T.modifiedProperties)
| mv-apply P = Props on (
    where tostring(P.displayName) =~ "Role.DisplayName"
    | extend RoleName = trim('"', tostring(P.newValue)))
| extend RuleSeverity = iff(RoleName in (Tier0), "High", "Medium")
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, OperationName, ServicePrincipal, RoleName, Initiator, RuleSeverity, CorrelationId
```

**FMP-DET-44, workload identity risk.** ID Protection detects risk on single-tenant, non-Microsoft SaaS and multitenant applications' service principals, not on managed identities.[^aB-wid-risk] Microsoft's sample query for active detections takes the latest record per detection and keeps those at risk.[^aB-sp-risk-q] License-dependent: full risk detail needs Workload Identities Premium.

```kql
// FMP-DET-44 Workload identity at risk (Microsoft's sample, with a lookback). Every 1h, lookback 1d.
AADServicePrincipalRiskEvents
| where TimeGenerated > ago(1d)
| summarize arg_max(LastUpdatedDateTime, *) by RequestId, ServicePrincipalId
| where RiskState == "atRisk"
| project LastUpdatedDateTime, ServicePrincipalDisplayName, ServicePrincipalId, AppId,
          RiskEventType, RiskLevel, IpAddress, DetectionTimingType
```

**FMP-DET-45, redirect URI change.** Microsoft rates redirect URI changes as high risk and says to look for URIs not using HTTPS, wildcards at the end or in the domain, URIs not unique to the application, and URIs on domains the agency doesn't control; the change appears as "Update application" with property name `AppAddress`.[^aB-secops-apps] A redirect to a domain that has lapsed lets whoever registers it receive authorization codes; [Book 08](../b08-ddi/index.md) holds the DNS ownership proof, and [Book 18](../b18-application-modernization/index.md) the per-application cleanup.

```kql
// FMP-DET-45 Redirect URI changed to a risky value. NRT.
let Approved = toscalar(_GetWatchlist('FMP-ApprovedRedirectDomains') | summarize make_list(tostring(SearchKey)));
AuditLogs
| where OperationName == "Update application" and Result == "success"
| mv-apply T = TargetResources on (
    extend App = tostring(T.displayName), Props = T.modifiedProperties)
| mv-apply P = Props on (
    where tostring(P.displayName) == "AppAddress"
    | extend NewValue = tostring(P.newValue), OldValue = tostring(P.oldValue))
| where isnotempty(NewValue) and NewValue != OldValue
| extend Url = extract_all(@"(https?://[^""\s,\]]+)", NewValue)
| mv-expand Url to typeof(string)
| where OldValue !contains Url                                   // only URIs this change added
| extend Host = tostring(parse_url(Url).Host)
| where Url startswith "http://" or Url has "*"
     or not(Host has_any (Approved))
| extend Initiator = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| project TimeGenerated, App, Url, Host, Initiator, CorrelationId
```

`http://localhost` redirects used in development show up here by design; development applications belong in a development tenant, or their localhost URIs in an exception with an owner.

## Rolling the pack out {#rollout}

The steps follow the workbook's How-section template ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md#how-section-template)). Detections don't block anyone, so the risk in rolling them out is noise and missed signal, not lockout.

### Pilot {#rollout-pilot}

Deploy the pack to the workspace with incident creation off, scoped as written. Success is each rule running without error for two weeks and the synthetic test below raising every rule's alert at least once.

### Report-only or audit phase {#rollout-report-only-or-audit-phase}

Chapter 11's alert-only window: alerts without incidents, reviewed daily, every false positive logged with its cause, for at least two weeks ([Chapter 11](11-detection-engineering-and-response.md#rule-lifecycle-and-testing)). Before enabling, run each query over 30 days of history in Log Analytics and record the hit count; a rule that would have fired hundreds of times needs its watchlists, not a higher threshold.

### Enforcement {#rollout-enforcement}

Promote rule by rule: turn on incident creation, record the measured false-positive rate, wire the response. Emergency access (DET-30, 31) and federation (DET-36) promote first, because their expected volume is zero outside drills. Response stays on Chapter 11's ladder: these rules prepare containment at L3 at most, and disabling an emergency access account is never automated ([Chapter 11](11-detection-engineering-and-response.md#the-response-ladder)).

### Rollback {#rollout-rollback}

Disable the rule (a commit that sets `enabled: false`, deployed through the pipeline, or in an emergency the rule's toggle in the portal, recorded afterward as a commit). It takes effect at the next scheduled run. Nothing in the tenant changes, so rollback has no user impact.

### Exclusions {#rollout-exclusions}

Exclusions are watchlist rows with an owner, reason and expiry, never edits to a query. The rule for emergency access is the reverse of Conditional Access: emergency accounts are **excluded** from blocking policies and **included** in every detection. No watchlist may list an emergency access account as an exception to DET-30, 31 or 37.

### Telemetry {#rollout-telemetry}

The rules' own health: Sentinel's `SentinelHealth` table for rule runs where analytics health monitoring is on, the daily check for "AUTO DISABLED" rules, and table freshness for every source table ([Chapter 05](05-from-log-warehouse-to-detection.md#proving-the-connectors-still-deliver)). A rule over a table that stopped arriving is silent, not quiet.

### Evidence {#rollout-evidence}

The synthetic test record, the rule export and the alert-only log, as the checklist below sets out.

### Day-two ownership {#rollout-day-two-ownership}

The rule library is security engineering's; the SOC triages; identity engineering owns the watchlists of emergency, privileged and device-code accounts; application owners answer DET-14, 40, 41 and 45 for their applications ([Chapter 10](10-who-runs-security-operations.md#the-responsibility-matrix)). Each rule is reviewed quarterly with the library, and the synthetic test runs quarterly alongside the emergency access validation that [Book 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts) schedules. An emergency access alert is handled through [Book 15](../b15-day2-operations/index.md)'s incident path, with Microsoft's post-use review: whether the use was a drill, a real emergency or misuse, and what the account did.[^aB-emergency]

## Proving each rule fires {#synthetic-tests}

A detection is evidenced when a deliberate, recorded test produces its alert. Run these in the pilot ring against test objects, then quarterly. Every step is a command; placeholders are explained once:

- `<test-app-object-id>`: the object ID of an application registration created for testing, owned by the detection team
- `<test-user-object-id>`: a test user's object ID, used only as a temporary owner
- `<test-admin-upn>`: a test account in `FMP-PrivilegedAccounts`, holding an eligible role and no standing access
- `<workspace-id>`: the Log Analytics workspace ID
- `Global` in `-Environment`: use `USGov` for GCC High and `USGovDoD` for DoD; GCC uses `Global`.[^aB-connect]

**1. Connect with the least permission the tests need.**

```powershell
Connect-MgGraph -Environment Global -Scopes "Application.ReadWrite.All","UserAuthenticationMethod.ReadWrite.All" -NoWelcome
$App = '<test-app-object-id>'
```

**2. FMP-DET-14: add, then remove, a short-lived secret on the test application.**

```powershell
$Secret = Add-MgApplicationPassword -ApplicationId $App -PasswordCredential @{
    DisplayName = 'FMP-DET-14 synthetic test'; EndDateTime = (Get-Date).AddHours(2) }
Remove-MgApplicationPassword -ApplicationId $App -KeyId $Secret.KeyId
```

`Add-MgApplicationPassword` takes the application's object ID and a password credential, as in Microsoft's example.[^aB-addpwd]

**3. FMP-DET-40: add, then remove, a temporary owner.**

```powershell
$GraphRoot = (Get-MgEnvironment -Name (Get-MgContext).Environment).GraphEndpoint
New-MgApplicationOwnerByRef -ApplicationId $App -OdataId "$GraphRoot/v1.0/directoryObjects/<test-user-object-id>"
Remove-MgApplicationOwnerByRef -ApplicationId $App -DirectoryObjectId '<test-user-object-id>'
```

**4. FMP-DET-45: add an unapproved redirect URI, then restore the original list.**

```powershell
$Before = (Get-MgApplication -ApplicationId $App).Web.RedirectUris
Update-MgApplication -ApplicationId $App -Web @{ RedirectUris = @($Before + 'https://unapproved.contoso.example/signin') }
Update-MgApplication -ApplicationId $App -Web @{ RedirectUris = $Before }
```

**5. FMP-DET-34a: register, then remove, a phone method on the test administrator.** The number is a fictional 555 number.

```powershell
$Phone = New-MgUserAuthenticationPhoneMethod -UserId '<test-admin-upn>' -PhoneType mobile -PhoneNumber '+1 2065550100'
Remove-MgUserAuthenticationPhoneMethod -UserId '<test-admin-upn>' -PhoneAuthenticationMethodId $Phone.Id
```

**6. FMP-DET-37: a device code sign-in with the test administrator** (not in `FMP-DeviceCodeApproved`). Sign in with `<test-admin-upn>` at the prompt; for GCC High or DoD run `az cloud set --name AzureUSGovernment` first. If a Conditional Access policy blocks device code flow, the sign-in fails and the rule (which looks for successes) stays quiet; record that as the policy's test, and test the rule from a pilot account in the policy's exclusion.

```powershell
az login --use-device-code --allow-no-subscriptions
az logout
```

**7. FMP-DET-30 and 31: the quarterly emergency access drill.** Microsoft asks for the accounts to be validated at least every 90 days;[^aB-emergency] the drill's sign-in is the test event for DET-30, and the drill's password or method check is the test event for DET-31. [Book 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts) runs the drill; this appendix only records the alert.

**8. FMP-DET-32 and 33:** activate an eligible Tier 0 role for `<test-admin-upn>` through PIM with a ticket number in the justification, and reset its password from the admin center. Both are routine actions the rules must see.

**9. Rules that can't be tested by doing the thing in production.** Creating a tenant (DET-35), changing federation (DET-36), real risk (DET-38, 39, 44) and admin consent to a privileged permission (DET-41, 42, 43) aren't run in production. Test them in a non-production tenant whose logs go to a test workspace with the same rules, or by replaying the query over history to show it parses and returns the expected shape:

```powershell
$Query = Get-Content -Raw '.\rules\FMP-DET-36.kql'
Invoke-AzOperationalInsightsQuery -WorkspaceId '<workspace-id>' -Query $Query -Timespan (New-TimeSpan -Days 90) |
    Select-Object -ExpandProperty Results
```

**10. Confirm every alert, and keep the result.**

```kql
SecurityAlert
| where TimeGenerated > ago(4h)
| where AlertName startswith "FMP-DET-"
| project TimeGenerated, AlertName, AlertSeverity, CompromisedEntity, Status, SystemAlertId
| order by AlertName asc
```

Export the result with the date, tester and the commands run; a rule with no row is a failed test, and goes back to authoring.

## Evidence {#detection-evidence}

**Evidence checklist**

- [ ] **Configuration:** the rule files (YAML or ARM) in the repository at the deployed commit, and the four watchlists exported with their owners and expiry dates
- [ ] **Operational:** the incident and alert history for each rule over the review period, the alert-only false-positive log, and the daily auto-disabled and table-freshness checks, kept at the analytics retention [Chapter 12](12-evidence-metrics-and-continuous-monitoring.md#retention-tiers-and-tamper-protected-copies) sets
- [ ] **Test:** the synthetic test record from step 10, per rule: action, expected alert, observed alert ID, date, tester
- [ ] **Exception:** every watchlist exception row with its approver and expiry; the licensing record for any rule that can't run (no P2, no Workload ID Premium)
- [ ] **Assessor-ready artifact:** an assessment-results observation per rule linking the four above, in the package [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) assembles

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | The two detection tables and the watchlists | The rule library's design record and watchlist owners |
| Configured | Pilot and alert-only phase | The deployed rule export, incident creation off |
| Enforced | Not applicable: a detection doesn't enforce. The preventive controls it watches are enforced in [Book 04](../b04-access/index.md) | — |
| Evidenced | Proving each rule fires | The synthetic test record and the alerts it produced |
| Operated | Day-two ownership | Quarterly review, alert history, auto-disable and freshness checks |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Where this sits in the closure map {#closure-map}

For the emergency access finding family, this appendix carries the alert (DET-30 and 31) and the alert test; [Book 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts) carries the two cloud-only accounts and the quarterly test, and [Book 15](../b15-day2-operations/index.md) the help-desk and incident handling. For the audit and visibility family, this appendix and [Chapter 02](02-the-evidence-contract.md#data-and-endpoint-telemetry) carry identity, application, device and endpoint telemetry and its synthetic tests; Purview audit depth (audit tiers, retention policies and searches inside Purview) belongs to [Book 20, Information Protection & Microsoft Purview](../b20-information-protection/index.md), whose [Chapter 10](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#how-turn-on-retain-and-test-purview-audit) turns on, retains and tests Purview Audit, and Defender XDR hunting depth to the [Defender XDR implementation guide](../guides/defender-xdr-implementation.md).

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Requirements Mapping](appendix-a-requirements-mapping.md) · [Book index](index.md)
:::

[^aB-emergency]: Microsoft Learn, "Manage emergency access accounts in Microsoft Entra ID," sections "Monitor sign-in and audit logs" (sample `SigninLogs` queries by object ID; Azure Monitor log search alert, severity 0), "Prepare a post-mortem team" and "Security guardrails summary" (validate at least every 90 days), <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Nov 11, 2026).
[^aB-secops-priv]: Microsoft Learn, "Security operations for privileged accounts in Microsoft Entra ID," sections "Emergency access accounts" (alert on sign-in, password change, role change, credential or authentication method change), "Privileged account sign-in" (ID Protection risk; password change by admin or self-service, write the query for privileged accounts; template `PrivilegedAccountPasswordChanges`) and "Assignment and elevation," <https://learn.microsoft.com/entra/architecture/security-operations-privileged-accounts> (accessed Nov 11, 2026).
[^aB-secops-apps]: Microsoft Learn, "Microsoft Entra security operations guide for applications" (credentials, role assignment, highly privileged permissions with `AppRole.Value`, end-user consent with `ConsentContext.IsAdminConsent`, device code and ROPC flows, redirect URI `AppAddress`, ownership; linked Sentinel templates), <https://learn.microsoft.com/entra/architecture/security-operations-applications> (accessed Nov 11, 2026).
[^aB-secops-infra]: Microsoft Learn, "Security operations for infrastructure," section "Monitoring for creation of new Microsoft Entra tenants" (Directory Management, Create Company; target shows the created tenant ID), <https://learn.microsoft.com/entra/architecture/security-operations-infrastructure> (accessed Nov 11, 2026).
[^aB-audit-acts]: Microsoft Learn, "Microsoft Entra audit log categories and activities," sections "Authentication Methods," "Core Directory" (ApplicationManagement activities) and "Self-service password management," <https://learn.microsoft.com/entra/identity/monitoring-health/reference-audit-activities> (accessed Nov 11, 2026).
[^aB-default-perms]: Microsoft Learn, "What are the default user permissions in Microsoft Entra ID?," "Restrict non-admin users from creating tenants" (recorded as category DirectoryManagement, activity Create Company; creator becomes Global Administrator; Tenant Creator role), <https://learn.microsoft.com/entra/fundamentals/users-default-permissions> (accessed Nov 11, 2026).
[^aB-zt-tenants]: Microsoft Learn, "Configure Microsoft Entra for Zero Trust: Protect tenants and isolate production systems," recommendation "Permissions to create new tenants are limited to the Tenant Creator role," <https://learn.microsoft.com/entra/fundamentals/zero-trust-protect-tenants> (accessed Nov 11, 2026).
[^aB-fed]: Microsoft Learn, "Monitor changes to federation configuration in your Microsoft Entra ID," section "Set up alerts to monitor the trust relationship" (the `AuditLogs` query on "Set federation settings on domain" and "Set domain authentication"), <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-monitor-federation-changes> (accessed Nov 11, 2026).
[^aB-authflows]: Microsoft Learn, "Conditional Access: Authentication flows," section "Sign-in logs" (authentication protocol filter; original transfer method), <https://learn.microsoft.com/entra/identity/conditional-access/concept-authentication-flows> (accessed Nov 11, 2026).
[^aB-teams-dcf]: Microsoft Learn, "Restrict device code flow for Microsoft Teams devices with Conditional Access," sections "If you use device code flow outside Teams devices" and "Maintain the policy after enforcement," <https://learn.microsoft.com/entra/identity/conditional-access/policy-teams-devices-device-code-flow> (accessed Nov 11, 2026).
[^aB-signinlogs]: Microsoft Learn, Azure Monitor Logs table reference, "SigninLogs" (`AuthenticationProtocol` values including `deviceCode`; `OriginalTransferMethod`; `ResultType`), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/signinlogs>, and "AADNonInteractiveUserSignInLogs," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/aadnoninteractiveusersigninlogs> (both accessed Nov 11, 2026).
[^aB-risk-export]: Microsoft Learn, "How To: Export risk data," section "Log Analytics" (diagnostic categories RiskyUsers, UserRiskEvents, RiskyServicePrincipals, ServicePrincipalRiskEvents and their tables), <https://learn.microsoft.com/entra/id-protection/howto-export-risk-data> (accessed Nov 11, 2026).
[^aB-wid-risk]: Microsoft Learn, "Securing workload identities" (detections for single-tenant, non-Microsoft SaaS and multitenant apps; managed identities not in scope; full detail for Workload Identities Premium, limited detail without), <https://learn.microsoft.com/entra/id-protection/concept-workload-identity-risk> (accessed Nov 11, 2026).
[^aB-wid-faq]: Microsoft Learn, "Frequently asked questions about Microsoft Entra Workload ID" (free trial unavailable in Azure Government), <https://learn.microsoft.com/entra/workload-id/workload-identities-faqs> (accessed Nov 11, 2026).
[^aB-sp-risk-q]: Microsoft Learn, "Queries for the AADServicePrincipalRiskEvents table," "Active service principal risk detections," <https://learn.microsoft.com/azure/azure-monitor/reference/queries/aadserviceprincipalriskevents> (accessed Nov 11, 2026).
[^aB-app-perms]: Microsoft Learn, "View activity logs of application permissions," section "Audit logs" (Add app role assignment, Add delegated permission grant, Consent to application), <https://learn.microsoft.com/entra/identity/enterprise-apps/app-perms-audit-logs> (accessed Nov 11, 2026).
[^aB-sentinel-feature]: Microsoft Learn, "Microsoft Sentinel feature support for Azure commercial/other clouds" (Defender portal statement; Analytics, Data collection, Incidents and Watchlists tables), <https://learn.microsoft.com/azure/sentinel/feature-availability> (accessed Nov 11, 2026).
[^aB-entra-gov]: Microsoft Learn, "Microsoft Entra feature availability" (Azure for US Government; ID Protection risk detections, Microsoft Entra threat intelligence not available; Workload Identities Premium available), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Nov 11, 2026).
[^aB-watchlist]: Microsoft Learn, "Build queries or detection rules with watchlists in Microsoft Sentinel," <https://learn.microsoft.com/azure/sentinel/watchlists-queries> (accessed Nov 11, 2026).
[^aB-connect]: Microsoft Learn, "Connect-MgGraph," `-Environment` (Global, USGov, USGovDoD), <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph> (accessed Nov 11, 2026).
[^aB-addpwd]: Microsoft Learn, "Add-MgApplicationPassword," Microsoft.Graph.Applications module, <https://learn.microsoft.com/powershell/module/microsoft.graph.applications/add-mgapplicationpassword> (accessed Nov 11, 2026).
