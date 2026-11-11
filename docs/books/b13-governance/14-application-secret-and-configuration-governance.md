---
title: "Chapter 14 — Applications, Secrets and Configuration Drift"
description: "The governance record every application and service principal carries (business owner, technical owner, data classification, permissions justification, credential type, last activity, review date and retirement disposition), and the rule that no high-impact workload is ownerless; secrets governance, with the default prohibition on long-lived client secrets, approved exception criteria, vaulting, expiry limits, rotation windows, the managed-identity preference and source-code scanning; and continuous exports and drift rules for Conditional Access, PIM, authentication methods, Intune, application permissions, Purview, Exchange protection and network access, with the baseline diff and the remediation workflow. Each with the five control states, a How section, change safety, government-cloud availability and the federal requirements it supports."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b13-governance
book: B13
part: How
series-order: 14
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 14 — Applications, Secrets and Configuration Drift

*An application nobody owns, a secret nobody rotates and a policy nobody compares with its baseline decay the same way: quietly, until an assessment or an attacker finds them.*

::: {.callout-note}
## In this chapter
The governance record every application and service principal carries, and how to find the ones that are ownerless, privileged or unknown. Secrets governance: the default prohibition on long-lived client secrets, the exception criteria, vaulting, expiry limits, rotation windows, the managed-identity preference and source-code scanning. Continuous exports and drift rules for eight configuration domains, the baseline diff, and the remediation workflow that turns a difference into a remediation contract. Each section follows the conventions of [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md): the five control states, the How-section template, authority labels, the evidence checklist and change safety.
:::

The earlier chapters of this book describe the machinery: one authoritative record ([Chapter 03](03-one-authoritative-record.md)), change control ([Chapter 04](04-change-control-and-provenance.md)), the drift engine and its remediation contract ([Chapter 06](06-the-drift-engine.md)), and the ticket-to-machine tempo ([Chapter 10](10-ticket-to-machine.md)). This chapter applies that machinery to three things Zero Trust assessments look at closely and governance programs most often leave to individual teams: who owns each application identity, how its credentials are governed, and whether the security configuration of the tenant still matches what was approved.

It doesn't repeat the identity engineering. [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md) explains app registrations, consent, ownership and credentials; the [Non-Person Identity implementation guide](../guides/non-person-identity-implementation.md) inventories, decides, converts and retires each non-person identity gate by gate; and the [service account migration guide](../guides/service-account-migration.md) moves a service account to a gMSA, a dMSA or a Microsoft Entra workload identity. This chapter is the governance layer over them: the fields the record must hold, the rules that keep it true, and the exports that show whether it still is. [Book 18](../b18-application-modernization/index.md) uses the same record as the identity part of its portfolio intake ([Chapter 02](../b18-application-modernization/02-triaging-the-portfolio.md#identity-and-access-intake-fields)) and runs the fixes as factory work packages ([Appendix A](../b18-application-modernization/appendix-a-identity-remediation-work-packages.md)).

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This chapter | Evidence |
|---|---|---|
| Designed | The record's fields, the secrets rules and exception criteria, and the drift rules per domain, approved by the governance board ([Chapter 09](09-who-governs.md)) | The approved decision records and the drift-rule file |
| Configured | The exports run on a schedule; the tenant's application management policy, Key Vault policies and secret scanning are set | Export files with their run log; policy exports |
| Enforced | No high-impact workload without an accountable owner; new secrets blocked except by exception; secret scanning blocks pushes; every drift finding has a remediation contract | The gap report at zero for high-impact rows; the policy's enforcing state; push-protection settings; the contracts |
| Evidenced | The Validate steps in each How section | Test records and the events they produced |
| Operated | The cadences and owners in each Day-two subsection | The owner, the cadence, the drift rule and the last review record |

A finding this chapter addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Apps (the application record and secrets); Infrastructure and SecOps (configuration drift)
- **CISA ZTMM pillar:** Applications and Workloads; Identity for the workload identities; the Visibility and Analytics and Governance cross-cutting capabilities for drift
- **Depends on:** the identity plane's inventory of non-person identities ([Non-Person Identity guide, Step 1](../guides/non-person-identity-implementation.md#step-1-inventory-every-non-person-identity)); the authoritative record ([Chapter 03](03-one-authoritative-record.md)); the audit and sign-in logs that [Book 12](../b12-security-operations/index.md) collects
- **Attack chain interrupted:** Persistence and Privilege Escalation through an unowned application whose credentials or permissions an attacker can add to; Credential Access through a secret left in code or a pipeline; Defense Evasion through an unapproved change to Conditional Access, PIM or mail protection that nobody compares with the baseline
:::

## The application governance record {#application-governance-record}

Every application and service principal in the tenant has a row in the authoritative record, and the row carries eight fields. The tenant knows some of them; only the agency knows the rest. The record joins the two, so a reviewer sees in one place who answers for an application, what it can do and why, and when it will be reviewed or retired.

| Field | What it holds | Where it comes from | Authority |
|---|---|---|---|
| **Business owner** | The accountable person for the application as a business capability, who approves its access and answers for its retirement | The record, mastered from the system inventory; mirrored in the app's `serviceManagementReference`, not in the Entra Owners list | Risk-based recommended: the program keeps the approver out of Owners because an owner can add a credential and act as the app ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#ownership)) |
| **Technical owner** | Two named people who configure the app in Entra ID | The Entra Owners list, checked against the record | Microsoft-recommended: keep owners minimal, review them every few months, and keep at least two where possible[^c14g-best] |
| **Data classification** | The highest classification of data the app can read or write, and the system's FIPS 199 impact level | The record (system security plan and data inventory) | Mandated in substance: FIPS 199 categorization of the system the app belongs to ([Book 18, Chapter 02](../b18-application-modernization/02-triaging-the-portfolio.md#the-six-triage-criteria)); the per-app field is the program's design |
| **Permissions justification** | For each application permission and tenant-wide delegated grant, why it is needed and who approved it | The record; the grants themselves from the tenant | Risk-based recommended, supporting AC-6 least privilege for processes acting on behalf of users[^c14g-sp80053] |
| **Credential type** | Managed identity, federated credential, certificate, client secret or none, with each credential's expiry | The tenant | Microsoft-recommended order: managed identity, then federation, then certificate, never a secret ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials)) |
| **Last activity** | The most recent sign-in as client or resource, delegated or app-only | The tenant's service principal sign-in activity report | Risk-based recommended; the report is in preview (see Prerequisites) |
| **Review date** | When owners, permissions and credentials were last certified, and when they next are | The record, from the access review or attestation | Risk-based recommended; cadence by risk tier ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#risk-tiers-set-the-approval-chain)) |
| **Retirement disposition** | Keep, convert (to a managed identity or federation), retire, or retire with the system, with a date | The record; for a portfolio application, [Book 18's](../b18-application-modernization/02-triaging-the-portfolio.md#the-six-dispositions) disposition | Risk-based recommended |

: The eight fields every application and service principal carries {.striped .hover}

**The program's rule:** no high-impact workload is ownerless. An application is *high-impact* when its system is FIPS 199 high in any objective, or when it holds an application permission or directory role on the program's high-privilege list ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#risk-tiers-set-the-approval-chain) holds the tiers). It is *ownerless* when the record names no business owner, or the Owners list holds fewer than one person still employed in that role. An ownerless high-impact application is the closure map's "ownerless privileged app," and it is handled first.

**Unknown workloads.** A service principal in the tenant with no row in the record is an *unknown workload*. The program's response follows the orphan rule in the [Non-Person Identity guide](../guides/non-person-identity-implementation.md#orphans): the identity governance office takes interim ownership, the app is treated as Tier 1, and once the finding is confirmed a person deactivates it (nothing is deleted) and the 30-day claim window starts. Deactivation stops new tokens; existing tokens stay valid until they expire. Where an unknown workload can't be deactivated yet because something depends on it, restrict it instead: require assignment on its service principal, so only assigned users and clients get tokens,[^c14g-assign] and, for single-tenant service principals with Workload ID Premium, add a Conditional Access policy for workload identities ([Non-Person Identity guide, Step 4](../guides/non-person-identity-implementation.md#step-4-cut-privilege)).

### Prerequisites

- **The record.** The system inventory or CMDB holds the eight fields keyed by `appId` (the program's `<record.csv>` below: one row per application, with the columns `AppId`, `SystemId`, `Impact`, `BusinessOwner`, `TechnicalOwner`, `DataClassification`, `PermissionJustification`, `ReviewDate` and `RetirementDisposition`). The [Non-Person Identity guide's record](../guides/non-person-identity-implementation.md#the-record-each-identity-joins-to) is the same record; this chapter adds data classification, permissions justification, last activity and retirement disposition to it.
- **Roles.** Reading needs Global Reader, or Reports Reader plus Application Administrator read scopes; the export below uses the Graph scopes `Application.Read.All`, `Directory.Read.All` and `AuditLog.Read.All`. Run it as an app registration with a certificate, or a managed identity, never a secret.
- **Licenses.** Reading app registrations, service principals and grants is free. The service principal sign-in activity report reads with `AuditLog.Read.All` and the Reports Reader, Security Reader or Security Administrator role.[^c14g-spactivity] Workload ID Premium is needed only for Conditional Access for workload identities and its app health recommendations ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#what-workload-id-premium-adds)).
- **Government clouds.** Microsoft Graph's application, service principal and grant APIs serve all three US government environments; a GCC tenant uses the worldwide endpoint, GCC High `graph.microsoft.us` and DoD `dod-graph.microsoft.us`.[^c14g-graph-clouds] The service principal sign-in activity API is **preview**, in Graph beta, and listed for the global service only, not for US Government L4 or L5 (accessed Nov 11, 2026);[^c14g-spactivity] in GCC High and DoD, last activity comes from the service principal and managed identity sign-in logs instead ([Book 12](../b12-security-operations/index.md)), and the field is marked *measured from logs*.

### Pilot

Run the export and the gap report on one system's applications first, chosen because its owner is engaged and it has both first-party and vendor apps. Success: every row joins, the owner agrees with the gaps the report lists, and nothing in the report contradicts what the owner knows.

### Report-only or audit phase

The export and the gap report change nothing. Run them weekly for four weeks across the tenant before any app is deactivated or restricted, and read three numbers from them: unknown workloads, ownerless high-impact apps and stale apps (no activity in 90 days, the program's threshold, *design guidance*). Each week's report goes to the identity governance office, which confirms or dismisses each row.

**Step 1. Export what the tenant knows.** Connect, then run the export. Replace `<out-dir>` with a folder the evidence store collects from.

```powershell
#Requires -Modules Microsoft.Graph.Applications, Microsoft.Graph.Identity.SignIns, Microsoft.Graph.Beta.Reports
# Commercial and GCC: no -Environment. GCC High: -Environment USGov. DoD: -Environment USGovDoD.
Connect-MgGraph -Scopes 'Application.Read.All','Directory.Read.All','AuditLog.Read.All' -NoWelcome
$out = '<out-dir>'; New-Item -ItemType Directory -Force -Path $out | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd'

# The program's starting list of high-privilege application permissions (Book 04, Chapter 06 holds the full table).
$highPriv = @('RoleManagement.ReadWrite.Directory','AppRoleAssignment.ReadWrite.All','Application.ReadWrite.All',
              'Directory.ReadWrite.All','Group.ReadWrite.All','User.ReadWrite.All','Mail.ReadWrite','Mail.Send',
              'Sites.FullControl.All','Files.ReadWrite.All','Policy.ReadWrite.ConditionalAccess')

# Last activity per appId (preview; global service only — leave empty in GCC High and DoD).
$activity = @{}
try { Get-MgBetaReportServicePrincipalSignInActivity -All |
        ForEach-Object { $activity[$_.AppId] = $_.LastSignInActivity.LastSignInDateTime } } catch { }

$resourceCache = @{}
$rows = foreach ($sp in Get-MgServicePrincipal -All -Property 'id,appId,displayName,servicePrincipalType,accountEnabled,appRoleAssignmentRequired,appOwnerOrganizationId') {
    $app = Get-MgApplication -Filter "appId eq '$($sp.AppId)'" -Property 'id,signInAudience,serviceManagementReference,passwordCredentials,keyCredentials,web,spa,publicClient' -ErrorAction SilentlyContinue
    $owners = if ($app) { Get-MgApplicationOwner -ApplicationId $app.Id -All } else { Get-MgServicePrincipalOwner -ServicePrincipalId $sp.Id -All }
    $grants = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -All
    $perms = foreach ($g in $grants) {
        if (-not $resourceCache[$g.ResourceId]) { $resourceCache[$g.ResourceId] = Get-MgServicePrincipal -ServicePrincipalId $g.ResourceId -Property 'appRoles' }
        ($resourceCache[$g.ResourceId].AppRoles | Where-Object Id -eq $g.AppRoleId).Value }
    $delegated = Get-MgOauth2PermissionGrant -Filter "clientId eq '$($sp.Id)'" -All
    $secrets = @($app.PasswordCredentials); $certs = @($app.KeyCredentials)
    $redirects = @($app.Web.RedirectUris) + @($app.Spa.RedirectUris) + @($app.PublicClient.RedirectUris) | Where-Object { $_ }
    [pscustomobject]@{
        AppId = $sp.AppId; DisplayName = $sp.DisplayName; Type = $sp.ServicePrincipalType
        HomeTenant = if ($app) { 'this tenant' } else { $sp.AppOwnerOrganizationId }
        Enabled = $sp.AccountEnabled; AssignmentRequired = $sp.AppRoleAssignmentRequired
        ServiceManagementReference = $app.ServiceManagementReference
        OwnerCount = @($owners).Count
        CredentialType = if ($sp.ServicePrincipalType -eq 'ManagedIdentity') { 'managed identity' } elseif ($secrets.Count) { 'client secret' } elseif ($certs.Count) { 'certificate' } else { 'none or federated' }
        Secrets = $secrets.Count; Certificates = $certs.Count
        NextExpiry = (@($secrets.EndDateTime) + @($certs.EndDateTime) | Where-Object { $_ } | Sort-Object | Select-Object -First 1)
        AppPermissions = ($perms | Sort-Object -Unique) -join ' '
        HighPrivilege = [bool]($perms | Where-Object { $_ -in $highPriv })
        TenantWideDelegated = (($delegated | Where-Object ConsentType -eq 'AllPrincipals').Scope -join ' ').Trim()
        RedirectUris = $redirects -join ' '
        WildcardOrHttpRedirect = [bool]($redirects | Where-Object { $_ -match '\*' -or ($_ -like 'http://*' -and $_ -notmatch '^http://(localhost|127\.0\.0\.1)') })
        LastActivity = $activity[$sp.AppId]
    }
}
$rows | Export-Csv -Path "$out\app-governance-tenant-$stamp.csv" -NoTypeInformation
```

The export is the same read as [Book 04, Chapter 05's inventory](../b04-access/05-applications-and-workload-identities.md#a-read-only-inventory-to-start-from), widened to every service principal (so vendor apps and managed identities appear) and to the fields this record needs. Treat the file as sensitive: it is a map of what each app can do.

**Step 2. Join it to the record and list the gaps.** Replace `<record.csv>` with the record's export.

```powershell
$tenant = Import-Csv "$out\app-governance-tenant-$stamp.csv"
$record = Import-Csv '<record.csv>'; $byApp = @{}; $record | ForEach-Object { $byApp[$_.AppId] = $_ }
$today = Get-Date
$gaps = foreach ($t in $tenant) {
    $r = $byApp[$t.AppId]
    $high = $t.HighPrivilege -eq 'True' -or ($r -and $r.Impact -eq 'High')
    $issues = @()
    if (-not $r) { $issues += 'unknown workload' }
    else {
        foreach ($f in 'BusinessOwner','TechnicalOwner','DataClassification','ReviewDate','RetirementDisposition') { if (-not $r.$f) { $issues += "missing $f" } }
        if ($t.AppPermissions -and -not $r.PermissionJustification) { $issues += 'permissions not justified' }
        if ($r.ReviewDate -and [datetime]$r.ReviewDate -lt $today) { $issues += 'review overdue' }
    }
    if ($t.HomeTenant -eq 'this tenant' -and [int]$t.OwnerCount -lt 2) { $issues += 'fewer than two technical owners' }
    if ($high -and (-not $r -or -not $r.BusinessOwner -or [int]$t.OwnerCount -eq 0)) { $issues += 'OWNERLESS HIGH-IMPACT' }
    if ($t.LastActivity -and [datetime]$t.LastActivity -lt $today.AddDays(-90)) { $issues += 'no activity in 90 days' }
    if ($issues) { [pscustomobject]@{ AppId = $t.AppId; DisplayName = $t.DisplayName; HighImpact = $high; Issues = $issues -join '; ' } }
}
$gaps | Sort-Object @{e={$_.Issues -like '*OWNERLESS*'};desc=$true}, HighImpact -Descending |
    Export-Csv -Path "$out\app-governance-gaps-$stamp.csv" -NoTypeInformation
$record | Where-Object { $_.AppId -notin $tenant.AppId } | Export-Csv "$out\app-governance-record-only-$stamp.csv" -NoTypeInformation
```

The last line lists record rows with no service principal: retired apps the record still carries, which is drift in the record, not the tenant ([Chapter 06](06-the-drift-engine.md#what-the-engine-compares-against)).

### Enforcement

Enforcement is three rules, each turned on after the four-week audit phase:

1. **At intake.** No app registration is created, and no admin consent is granted, until its record row has all eight fields. The request carries them ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#governing-app-registrations), stage 1); the ticket-to-machine lane refuses a request without them ([Chapter 10](10-ticket-to-machine.md)).
2. **Weekly.** Every `OWNERLESS HIGH-IMPACT` row opens a P2 drift finding (identity class, [Chapter 06](06-the-drift-engine.md#severity)) assigned to the identity governance office, which names an owner within the finding's window or starts the orphan rule. Every `unknown workload` row starts the orphan rule.
3. **On the review date.** Owners, permissions and credentials are certified through an access review or the owner's attestation ([Non-Person Identity guide, access reviews of owners](../guides/non-person-identity-implementation.md#access-reviews-of-owners)); a missed review sets the row's review date overdue, which the gap report raises.

Deactivating or restricting an app is the step that can break something. It moves through the rings under [Change safety](#change-safety).

### Rollback

Reactivate a deactivated app registration, or set the service principal's **Enabled for users to sign-in?** back to Yes, by the identity governance office through PIM; both take effect at once and keep the configuration ([Non-Person Identity guide, decommissioning](../guides/non-person-identity-implementation.md#decommissioning-disable-first-then-delete)). To undo assignment-required:

```powershell
Update-MgServicePrincipal -ServicePrincipalId '<sp-object-id>' -AppRoleAssignmentRequired:$false
```

`<sp-object-id>` is the service principal's object ID from the export. Record the rollback in the finding's remediation contract.

### Exclusions

Microsoft first-party service principals and the tenant's own platform identities (the governance pipeline's own managed identity, the backup service) are excluded from deactivation, not from the record: each still gets a row with a business owner. Every other exclusion is an entry in the exception register with an approver and an expiry, reviewed by the governance board ([Chapter 09](09-who-governs.md#who-accepts-exceptions)). Emergency access accounts are user accounts and aren't in scope; nothing here changes Conditional Access exclusions for them.

### Telemetry

- Entra audit log: **Add owner to application**, **Remove owner from application**, **Update application** (including `isDisabled` for deactivation), **Add service principal**, consent and app role assignment events. [Book 12](../b12-security-operations/index.md) carries the detections for application credential, owner and consent changes.
- Service principal and managed identity sign-in logs, for last activity in clouds without the activity report.
- The weekly gap report's three counts, trended.

### Evidence

**Evidence checklist**

- [ ] **Configuration:** the tenant export and the record export for the run, with their hashes, kept in the evidence store
- [ ] **Operational:** the weekly gap reports, and the drift findings and remediation contracts opened from them
- [ ] **Test:** a test app registration created without a record row is refused at intake; a test service principal with no row appears as `unknown workload` in the next report (expected and observed, date, tester)
- [ ] **Exception:** the exception register rows for excluded apps, with approver and expiry
- [ ] **Assessor-ready artifact:** the closure-chain entry for each assessment finding about application owners ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)), pointing at the gap report that shows no ownerless high-impact rows and the review records

### Day-two ownership

The identity governance office owns the record's application rows and the weekly report; each business owner owns their rows' accuracy. Cadence: the export weekly, certification on the risk tier's cadence (quarterly for Tier 1, *design guidance*), and the record reconciled at each [Book 18](../b18-application-modernization/10-running-the-portfolio-in-waves.md#keeping-the-triage-current) re-triage. The drift signal is a rising count of ownerless or unknown rows. The support path for an owner who can't be found is the governance board.

## Secrets governance {#secrets-governance}

A client secret is a password an application keeps. Microsoft's guidance is not to use them, and to prefer managed identities, then federated credentials, then certificates ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials)). The tenant enforces the order with an application management policy, set up in the [Non-Person Identity guide, Step 3](../guides/non-person-identity-implementation.md#step-3-set-the-credential-rules); this section is the governance around it: what an exception needs, where a secret lives, how long it lasts, how quickly it is rotated, how it is replaced, and how secrets are kept out of code.

| Rule | The program's position | Authority |
|---|---|---|
| **Default prohibition** | No new client secrets or symmetric keys on any application created after the policy's effective date; certificates capped at 180 days | Microsoft-recommended settings for the application management policy ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#enforcing-the-order-with-app-management-policies)); ScubaGear checks related SHOULD policies MS.AAD.5.5v1 to 5.7v1, none a BOD 25-01 required configuration |
| **Managed-identity preference** | A workload on Azure or an Arc-enabled server uses a managed identity; one with its own OIDC issuer uses a federated credential; a certificate only where neither applies | Microsoft-recommended ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials)); conversion follows the [service account migration guide, Migration C](../guides/service-account-migration.md#migration-c) and the [Non-Person Identity guide, Step 5](../guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run) |
| **Approved exception** | Only when all four criteria below hold | Risk-based recommended (the program's criteria) |
| **Vaulting** | Every secret and private key in Azure Key Vault or an HSM, never in a file share, a pipeline variable or code | Microsoft-recommended for keys and secrets; supports IA-5(7), which asks that unencrypted static authenticators not be embedded in applications or other static storage[^c14g-sp80053] |
| **Expiry limits** | An excepted secret lasts at most 180 days; never renewed automatically on the app registration without the owner's approval | Risk-based recommended; the 180 days follows ScubaGear's MS.AAD.5.6v1 password-lifetime check |
| **Rotation windows** | See the table below | Risk-based recommended |
| **Source-code scanning** | Secret scanning with push protection on every repository that holds the agency's code or infrastructure as code | Microsoft-recommended: monitor pipelines so credentials never reach a repository[^c14g-best] |

: Secrets rules {.striped .hover}

**Exception criteria.** An application may hold a client secret only when all four hold, and the exception names them: (1) the software can't use a certificate, a federated credential or a managed identity, shown by the vendor's documentation or a test, not by assertion; (2) the app is not Tier 1, or the CISO approves a Tier 1 exception personally; (3) a replacement date is set, at most one year out, tied to a vendor release, a [Book 18](../b18-application-modernization/index.md) disposition or a conversion wave; and (4) the secret is vaulted and rotated within the windows below. The identity governance office and the CISO approve, as [Book 04, Chapter 06](../b04-access/06-who-decides-access.md#exceptions) sets out, and the exception is per-application, recorded in the application management policy as an app-specific exemption and in the exception register.

| Event | Rotation window (program design) | Who acts |
|---|---|---|
| Scheduled rotation of an excepted secret | Before 80% of its lifetime has elapsed, and no later than 30 days before expiry | The app's technical owner; raised automatically |
| Certificate renewal | 30 days before expiry, with the new credential uploaded to the app registration before the old one is removed | Technical owner; [Non-Person Identity guide, Step 3](../guides/non-person-identity-implementation.md#step-3-set-the-credential-rules) item 5 |
| Secret found in code, a log or a ticket | Within 24 hours: revoke the credential on the app, issue a new one, and treat the exposure as an incident | Technical owner and the security operations center |
| Owner leaves | Within the owner-change window; credentials the departing owner could read are rotated | New owner |
| Suspected compromise | Immediately: remove the credential, then investigate | Security operations center |

: Rotation windows {.striped .hover}

These windows are the program's choice. SP 800-53 IA-5 leaves the time period for changing authenticators to the organization;[^c14g-sp80053] Key Vault's own rotation pattern publishes its near-expiry event 30 days before a secret expires,[^c14g-kv-rotate] which is why the scheduled window ends there.

### Prerequisites

- The application management policy from the [Non-Person Identity guide, Step 3](../guides/non-person-identity-implementation.md#step-3-set-the-credential-rules); application management policies are a free capability of Workload ID ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#enforcing-the-order-with-app-management-policies)).
- Azure Key Vault in the agency's subscription. The Key Vault built-in Azure Policy definitions used below have Audit as their default effect and support Deny.[^c14g-kv-policy] Whether each built-in is present in Azure Government isn't stated on the Learn page; the lookup in Step 3 returns nothing if a definition isn't there, which is the check (government availability *not yet specified* on Learn, Nov 11, 2026).
- Secret scanning: for GitHub repositories, GitHub's secret scanning with push protection, enabled per repository by an admin or an organization owner or security manager;[^c14g-gh-api] for Azure Repos, GitHub Advanced Security for Azure DevOps (or GitHub Secret Protection for Azure DevOps), which Microsoft makes available only for Azure DevOps Services and Git repositories.[^c14g-ghazdo] Both are **license-dependent**. Azure DevOps Services government-cloud availability isn't stated on the Learn page (*not yet specified*, Nov 11, 2026); an agency on Azure DevOps Server uses a pipeline secret scanner instead.

### Pilot

Pick one system whose apps hold secrets and whose owner will convert at least one. Run the inventory, file the exceptions for the rest, turn on push protection for its repositories, and run one conversion through the [Non-Person Identity guide's parallel run](../guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run). Success: the inventory matches what the owner knows, each remaining secret has an exception with a replacement date, and the converted app runs on its new credential with the secret removed.

### Report-only or audit phase

**Step 1. Read the tenant's default policy** (no change), and keep the output as configuration evidence.[^c14g-amp-tutorial]

```powershell
Connect-MgGraph -Scopes 'Policy.Read.All' -NoWelcome
Get-MgPolicyDefaultAppManagementPolicy | ConvertTo-Json -Depth 10 | Set-Content "<out-dir>\app-mgmt-policy-$(Get-Date -Format yyyyMMdd).json"
```

If `isEnabled` is `false`, the default prohibition isn't in force; set it through the Non-Person Identity guide, Step 3, not here.

**Step 2. Build the secret inventory and the dated replacement plan.** It reads the Step 1 export of the application record and the exception register (`<exceptions.csv>`, columns `AppId`, `ExceptionId`, `Approver`, `Expires`, `ReplacementDate`, `Target`).

```powershell
$exceptions = @{}; Import-Csv '<exceptions.csv>' | ForEach-Object { $exceptions[$_.AppId] = $_ }
$plan = foreach ($app in Get-MgApplication -All -Property 'appId,displayName,passwordCredentials') {
    foreach ($s in $app.PasswordCredentials) {
        $e = $exceptions[$app.AppId]
        $lifetime = if ($s.StartDateTime -and $s.EndDateTime) { [int]($s.EndDateTime - $s.StartDateTime).TotalDays }
        [pscustomobject]@{
            AppId = $app.AppId; DisplayName = $app.DisplayName; KeyId = $s.KeyId; Hint = $s.Hint
            Expires = $s.EndDateTime; LifetimeDays = $lifetime
            DaysToExpiry = if ($s.EndDateTime) { [int]($s.EndDateTime - (Get-Date)).TotalDays }
            ExceptionId = $e.ExceptionId; Target = $e.Target; ReplacementDate = $e.ReplacementDate
            Finding = @(
                if (-not $e) { 'no exception' }
                if ($lifetime -gt 180) { 'lifetime over 180 days' }
                if ($s.EndDateTime -and $s.EndDateTime -lt (Get-Date)) { 'expired but still present' }
                if ($e -and $e.ReplacementDate -and [datetime]$e.ReplacementDate -lt (Get-Date)) { 'replacement date passed' }
            ) -join '; '
        }
    }
}
$plan | Sort-Object DaysToExpiry | Export-Csv "<out-dir>\secret-inventory-$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation
```

The file is the *secret inventory and dated replacement plan*: every secret, its expiry, its exception and the date it is to be replaced. It holds no secret values; `Hint` is the first characters Entra ID shows, enough to match a secret in a vault.

**Step 3. Audit the vaults.** Assign the Key Vault built-ins in Audit mode at the management group the vaults sit under. `<mg>` is the management group name; in Azure Government run `az cloud set --name AzureUSGovernment` first.

```bash
assign() {   # $1 = the built-in's display name, $2 = its parameters
  def=$(az policy definition list --query "[?displayName=='$1'].name" -o tsv)
  if [ -z "$def" ]; then echo "not available in this cloud: $1"; return; fi
  az policy assignment create --name "kv-$(echo "$def" | cut -c1-12)" --display-name "$1 (audit)"      --policy "$def" --scope "/providers/Microsoft.Management/managementGroups/<mg>" --params "$2"
}
assign "Key Vault secrets should have an expiration date" '{"effect":{"value":"Audit"}}'
assign "Secrets should have the specified maximum validity period" '{"effect":{"value":"Audit"},"maximumValidityInDays":{"value":180}}'
assign "Secrets should have more than the specified number of days before expiration" '{"effect":{"value":"Audit"},"minimumDaysBeforeExpiration":{"value":30}}'
az policy assignment list --scope "/providers/Microsoft.Management/managementGroups/<mg>" --query "[?starts_with(name,'kv-')].{name:name, display:displayName}" -o table
```

**Step 4. Turn on secret scanning.** For each GitHub repository (`<owner>/<repo>`):[^c14g-gh-api]

```bash
gh api -X PATCH "repos/<owner>/<repo>" \
  -F "security_and_analysis[secret_scanning][status]=enabled" \
  -F "security_and_analysis[secret_scanning_push_protection][status]=enabled"
gh api "repos/<owner>/<repo>" --jq '.security_and_analysis'
```

For Azure Repos, enablement is a portal step: **Organization settings** > **Repositories** > **Enable all** for Advanced Security (or Secret Protection) > **Begin billing**, and select **Automatically enable Advanced Security for new projects**. Push protection and repository scanning start when the product is turned on; push protection evaluates only pushes made after that, and repository scanning finds secrets already in history.[^c14g-ghazdo]

### Enforcement

- **Vaults:** after four weeks in Audit with no unexplained non-compliant secrets, move the three assignments to Deny, one management group at a time: delete each Audit assignment, then re-run the three `assign` lines from Step 3 with `"Deny"` in place of `"Audit"`.

  ```bash
  for a in $(az policy assignment list --scope "/providers/Microsoft.Management/managementGroups/<mg>" --query "[?starts_with(name,'kv-')].name" -o tsv); do
    az policy assignment delete --name "$a" --scope "/providers/Microsoft.Management/managementGroups/<mg>"; done
  ```
- **Repositories:** push protection blocks from the start. Bypassing it (on Azure Repos, the `skip-secret-scanning:true` commit message) still raises an alert;[^c14g-ghazdo-scan] every bypass is reviewed within one business day.
- **Tenant:** the application management policy's prohibition is already enforcing for new apps; the replacement plan's dates enforce it for old ones. A secret with no exception, or past its replacement date, is a P2 authorization-class drift finding ([Chapter 06](06-the-drift-engine.md#the-programs-drift-model-five-classes)).

### Rollback

Move a Key Vault assignment back to Audit the same way: delete it and re-run its `assign` line with `"Audit"`, which the platform team can do in minutes. Push protection is disabled per repository by setting the two statuses to `disabled` with the same `gh api` call, only with the CISO's approval. An app-specific exemption to the application management policy is the rollback for one application that a policy change broke; never disable the tenant default.

### Exclusions

Exemptions are per application and expire; there is no tenant-wide exclusion. Emergency access accounts hold no application credentials and are out of scope. A Key Vault that holds only break-glass material for a recovery procedure may carry a policy exemption with its approver and review date.

### Telemetry

- Entra audit log: **Update application – Certificates and secrets management** for every credential added or removed; [Book 12](../b12-security-operations/index.md) carries the detection for new application credentials.
- Key Vault `SecretNearExpiry` and `SecretExpired` events, sent to Event Grid, and Key Vault diagnostic logs.
- Secret scanning alerts and push-protection bypasses.
- Azure Policy compliance state for the three assignments.

### Evidence

**Evidence checklist**

- [ ] **Configuration:** the default application management policy export; the three policy assignments; each repository's `security_and_analysis` output or the Azure DevOps setting
- [ ] **Operational:** the secret inventory and dated replacement plan, weekly; Key Vault near-expiry events and the rotations they triggered; secret scanning alert history
- [ ] **Test:** a test push containing a documented test token is blocked; a test vault secret with no expiry is flagged (Audit) or refused (Deny); an attempt to add a client secret to a new test app is refused by the tenant policy (expected and observed, date, tester)
- [ ] **Exception:** each secret exception with its four criteria, approvers, expiry and replacement date
- [ ] **Assessor-ready artifact:** for each credential finding, the closure-chain entry with the inventory row before and after and the replacement proof (the app's sign-in on its new credential and the removal event for the secret)

### Day-two ownership

The identity governance office owns the exception register and the replacement plan; technical owners own their rotations; the platform team owns the vault policies; the DevSecOps lead owns secret scanning. Cadence: the inventory weekly, exceptions reviewed at expiry and at least every 180 days, and the plan reviewed monthly by the governance board until the count of secrets reaches the agreed floor. The drift signal is any secret without an exception or past its date.

## Configuration drift exports {#configuration-drift-exports}

[Chapter 06](06-the-drift-engine.md) compares the estate with the record, and [Chapter 02](02-drift-is-the-primary-threat.md) argues drift is the primary threat. For the tenant's security configuration, comparison needs two things the platforms don't give by default: a dated export of each control's settings, and a rule that says which differences matter. This section gives both for eight domains.

| Domain | What is exported | Export source | Drift rule (program design) | Class and default severity ([Chapter 06](06-the-drift-engine.md)) |
|---|---|---|---|---|
| Conditional Access | Policies and named locations | Graph v1.0 `identity/conditionalAccess/policies`, `namedLocations` | Any change to state, conditions, grant or session controls, or exclusions not in an approved change; any policy moved to Off or Report-only | Authorization; P1 when an enforced policy weakens, otherwise P2 |
| PIM | Role settings (rules) for directory roles | Graph v1.0 `policies/roleManagementPolicies` with `rules`[^c14g-pim] | Activation duration, approval, justification, authentication context or notification rule differs from the baseline | Authorization; P2 |
| Authentication methods | The methods policy and authentication strengths | Graph v1.0 `policies/authenticationMethodsPolicy`, `policies/authenticationStrengthPolicies` | A method enabled or a target added outside a change; a strength weakened | Authorization; P2 |
| Intune | Compliance policies, configuration profiles and settings-catalog policies | Graph v1.0 `deviceManagement/deviceCompliancePolicies`, `deviceConfigurations`; beta `configurationPolicies`[^c14g-intune] | A setting differs from the baseline or an assignment changed | Semantic; P2 |
| Application permissions | Each service principal's application permissions and tenant-wide delegated grants | The application record export ([Step 1](#application-governance-record) above) | A new grant not in the record's permissions justification | Authorization; P2, P1 when the grant is on the high-privilege list |
| Purview | Sensitivity labels and label policies, DLP policies and rules, retention policies | Security & Compliance PowerShell `Get-Label`, `Get-LabelPolicy`, `Get-DlpCompliancePolicy`, `Get-DlpComplianceRule`, `Get-RetentionCompliancePolicy`[^c14g-scc] | A policy disabled, moved to simulation, or its scope narrowed | Semantic; P2 |
| Exchange protection | Anti-phishing, anti-spam, anti-malware, Safe Links and Safe Attachments policies, transport rules, DKIM, audit configuration | Exchange Online PowerShell `Get-AntiPhishPolicy`, `Get-HostedContentFilterPolicy`, `Get-MalwareFilterPolicy`, `Get-SafeLinksPolicy`, `Get-SafeAttachmentPolicy`, `Get-TransportRule`, `Get-DkimSigningConfig`, `Get-AdminAuditLogConfig`[^c14g-scc] | A protection weakened, a transport rule added that bypasses filtering, DKIM disabled, unified audit ingestion off | Authorization for bypass rules and audit off (P1); semantic otherwise (P2) |
| Network access | Global Secure Access traffic forwarding profiles and their policies | Graph beta `networkAccess/forwardingProfiles?$expand=policies`[^c14g-gsa] | A profile disabled or a forwarding rule changed outside a change | Semantic; P2 |

: Eight domains: what is exported and what counts as drift {.striped .hover}

Safe Links and Safe Attachments need Defender for Office 365 (**license-dependent**); Global Secure Access needs its own licensing, and its engineering is in the Global Secure Access implementation guide (listed on the [Books page](../index.md)) and [Book 09](../b09-network/index.md). An export that returns nothing because a product isn't licensed is recorded as *not applicable*, not as a pass.

**Two ways to collect.** Microsoft now offers configuration monitoring as a service, and the scripted export below works everywhere. The program uses the service where it is available and the script where it isn't, and keeps both outputs in the same evidence store.

- **Tenant Configuration Management (TCM).** Microsoft Graph's Tenant Configuration Management APIs, surfaced in the Entra admin center as configuration management under Microsoft Entra Tenant Governance, take snapshots of current settings across Entra, Exchange Online, Intune, Defender, Purview and Teams, hold a JSON baseline, run monitors every six hours and report each drift with the properties that differ.[^c14g-tcm] A tenant can have up to 30 monitors and 800 monitored resources a day, snapshots are kept for seven days, a fixed drift is deleted 30 days after it is resolved, and changing a monitor's baseline deletes its earlier results and drifts,[^c14g-tcm-limits] so the program copies results to its own store on every run. The Basic capacity comes with Entra ID P1 or P2; ID Governance licenses add capacity (**license-dependent**).[^c14g-tcm-lic] It detects and reports; it doesn't deploy or remediate.[^c14g-m365dsc] **Environment-dependent:** the TCM API pages list the global service only, not US Government L4 or L5 (Nov 11, 2026),[^c14g-tcm-cloud] so it is available to GCC tenants, which use the worldwide endpoint, and not to GCC High or DoD. Learn's pages disagree on its stage: the configuration management overview says the APIs are generally available, while the authentication setup page still refers to public preview;[^c14g-tcm][^c14g-tcm-auth] treat it as preview until Learn is consistent.
- **Scripted export.** The script below reads each domain with the platform's own read cmdlets or Graph calls, normalizes the output, and commits it to a Git repository whose history is the baseline record. It runs in every cloud the cmdlets support.

### Prerequisites

- Read roles: Global Reader covers Entra and Intune reads; Security Reader or a View-Only role in Exchange Online and Purview covers their cmdlets; Global Secure Access reads need Global Reader, Global Secure Access Log Reader or Security Administrator with `NetworkAccess.Read.All`.[^c14g-gsa] Run the export as an app registration with a certificate or a managed identity; Exchange Online and Security & Compliance PowerShell support certificate-based app-only sign-in.[^c14g-exo-app]
- PowerShell 7 with `Microsoft.Graph.Authentication` and `ExchangeOnlineManagement`; Git; a private repository for the exports (they describe the tenant's defenses and are Controlled).
- Government clouds: the Graph v1.0 and Intune beta reads, and the Global Secure Access forwarding-profile reads, are listed for the global service and US Government L4 and L5.[^c14g-intune][^c14g-gsa] Exchange Online and Security & Compliance PowerShell connect to GCC High and DoD with their own parameters (in the script). Conditional Access, PIM and authentication-method reads: the national-cloud table on each Learn API page is the source; where a page omits it, record *not yet specified*. TCM: GCC only, as above.

### Pilot

Export one domain, Conditional Access, for four weeks. Compare each week's diff with the change records for that week. Success: every difference matches an approved change or is a real finding, and the normalization removes every difference that is only a timestamp.

### Report-only or audit phase

**Step 1. Create the export repository once.** `<exports>` is a local folder backed by the private repository.

```bash
git init <exports> && cd <exports> && git commit --allow-empty -m "Configuration exports: start"
```

**Step 2. Export the eight domains.** Save as `Export-SecurityConfig.ps1` in the repository's parent folder and run it from the repository folder. Set `$cloud` to `Global` (commercial and GCC), `USGov` (GCC High) or `USGovDoD` (DoD), and `<org>.onmicrosoft.com` to the tenant's initial domain.

```powershell
param([ValidateSet('Global','USGov','USGovDoD')] [string] $cloud = 'Global', [string] $org = '<org>.onmicrosoft.com',
      [string] $appId = '<export-app-id>', [string] $thumb = '<cert-thumbprint>', [string] $tenantId = '<tenant-id>')
$ErrorActionPreference = 'Stop'
$volatile = '^(@odata\..*|modifiedDateTime|lastModifiedDateTime|createdDateTime|WhenChanged.*|WhenCreated.*|Guid|Identity|ExchangeObjectId|DistinguishedName|RunspaceId|.*Version)$'
function Normalize($o) {
    if ($o -is [System.Collections.IDictionary]) { $h = [ordered]@{}; foreach ($k in ($o.Keys | Sort-Object)) { if ($k -notmatch $volatile) { $h[$k] = Normalize $o[$k] } }; return $h }
    if ($o -is [System.Collections.IEnumerable] -and $o -isnot [string]) { return @($o | ForEach-Object { Normalize $_ }) }
    if ($o -is [psobject] -and $o.PSObject.Properties.Count -and $o -isnot [string] -and $o -isnot [ValueType]) {
        $h = [ordered]@{}; foreach ($p in ($o.PSObject.Properties | Sort-Object Name)) { if ($p.Name -notmatch $volatile) { $h[$p.Name] = Normalize $p.Value } }; return $h }
    return $o
}
function Save($name, $data) { New-Item -ItemType Directory -Force -Path (Split-Path $name) | Out-Null
    (Normalize $data) | ConvertTo-Json -Depth 30 | Set-Content -Path $name -Encoding utf8 }
function GraphAll($uri) { $items = @(); while ($uri) { $r = Invoke-MgGraphRequest -Method GET -Uri $uri -OutputType Hashtable; $items += $r.value; $uri = $r.'@odata.nextLink' }; $items }

Connect-MgGraph -Environment $cloud -ClientId $appId -CertificateThumbprint $thumb -TenantId $tenantId -NoWelcome
Save 'entra/conditional-access-policies.json' (GraphAll 'v1.0/identity/conditionalAccess/policies')
Save 'entra/named-locations.json'             (GraphAll 'v1.0/identity/conditionalAccess/namedLocations')
Save 'entra/pim-directory-role-settings.json' (GraphAll "v1.0/policies/roleManagementPolicies?`$filter=scopeId eq '/' and scopeType eq 'DirectoryRole'&`$expand=rules")
Save 'entra/pim-policy-assignments.json'      (GraphAll "v1.0/policies/roleManagementPolicyAssignments?`$filter=scopeId eq '/' and scopeType eq 'DirectoryRole'")
Save 'entra/authentication-methods-policy.json' (Invoke-MgGraphRequest -Method GET -Uri 'v1.0/policies/authenticationMethodsPolicy' -OutputType Hashtable)
Save 'entra/authentication-strengths.json'    (GraphAll 'v1.0/policies/authenticationStrengthPolicies')
Save 'intune/compliance-policies.json'        (GraphAll 'v1.0/deviceManagement/deviceCompliancePolicies?$expand=assignments')
Save 'intune/configuration-profiles.json'     (GraphAll 'v1.0/deviceManagement/deviceConfigurations?$expand=assignments')
Save 'intune/settings-catalog-policies.json'  (GraphAll 'beta/deviceManagement/configurationPolicies?$expand=settings,assignments')
Save 'network/gsa-forwarding-profiles.json'   (GraphAll 'beta/networkAccess/forwardingProfiles?$expand=policies')
if (Test-Path '../app-governance-tenant-latest.csv') {
    Save 'entra/application-permissions.json' (Import-Csv '../app-governance-tenant-latest.csv' | Select-Object AppId, DisplayName, AppPermissions, TenantWideDelegated | Sort-Object AppId) }

$exo = @{ Global = @{}; USGov = @{ ExchangeEnvironmentName = 'O365USGovGCCHigh' }; USGovDoD = @{ ExchangeEnvironmentName = 'O365USGovDoD' } }[$cloud]
Connect-ExchangeOnline -AppId $appId -CertificateThumbprint $thumb -Organization $org -ShowBanner:$false @exo
foreach ($c in 'Get-AntiPhishPolicy','Get-HostedContentFilterPolicy','Get-MalwareFilterPolicy','Get-SafeLinksPolicy',
               'Get-SafeAttachmentPolicy','Get-TransportRule','Get-DkimSigningConfig','Get-AdminAuditLogConfig') {
    try { Save "exchange/$($c.Substring(4)).json" (& $c) } catch { Save "exchange/$($c.Substring(4)).json" @{ notApplicable = $_.Exception.Message } } }
Disconnect-ExchangeOnline -Confirm:$false

$scc = @{ Global = @{}
          USGov = @{ ConnectionUri = 'https://ps.compliance.protection.office365.us/powershell-liveid/'; AzureADAuthorizationEndpointUri = 'https://login.microsoftonline.us/organizations' }
          USGovDoD = @{ ConnectionUri = 'https://compliance.dod.microsoft.com/powershell-liveid'; AzureADAuthorizationEndpointUri = 'https://login.microsoftonline.us/organizations' } }[$cloud]
Connect-IPPSSession -AppId $appId -CertificateThumbprint $thumb -Organization $org -ShowBanner:$false @scc
foreach ($c in 'Get-Label','Get-LabelPolicy','Get-DlpCompliancePolicy','Get-DlpComplianceRule','Get-RetentionCompliancePolicy') {
    try { Save "purview/$($c.Substring(4)).json" (& $c) } catch { Save "purview/$($c.Substring(4)).json" @{ notApplicable = $_.Exception.Message } } }
Disconnect-ExchangeOnline -Confirm:$false
```

Placeholders, explained once: `<export-app-id>` and `<cert-thumbprint>` are the export identity's application ID and certificate; `<tenant-id>` is the tenant's ID. Copy the application record export from the [first section](#application-governance-record) to `app-governance-tenant-latest.csv` beside the repository before the run, so application permissions are compared too.

**Step 3. Commit the run and diff it against the approved baseline.**

```bash
cd <exports>
pwsh ../Export-SecurityConfig.ps1 -cloud Global
git add -A && git commit -m "Export $(date -u +%Y-%m-%dT%H:%MZ)" || echo "no change since the last run"
git tag -l 'baseline-*' | tail -1                       # the approved baseline
git diff --stat "$(git tag -l 'baseline-*' | tail -1)" HEAD
git diff "$(git tag -l 'baseline-*' | tail -1)" HEAD > ../drift-$(date -u +%Y%m%d).diff
```

The first approved run is tagged by the change advisory board's approver: `git tag -a baseline-$(date -u +%Y%m%d) -m "Approved baseline, change <change-id>"`. An approved change later moves the tag the same way, so approved change isn't drift ([Chapter 06](06-the-drift-engine.md#what-the-engine-compares-against)).

**Step 4 (GCC, optional). Take a TCM snapshot to seed a monitor.** The resource names for each workload are on Learn's TCM resource pages; two Entra and Exchange examples:[^c14g-tcm-snap]

```powershell
Connect-MgGraph -Scopes 'ConfigurationMonitoring.ReadWrite.All' -NoWelcome
Invoke-MgGraphRequest -Method POST -Uri 'v1.0/admin/configurationManagement/configurationSnapshots/createSnapshot' -Body (@{
    displayName = 'Security baseline seed'; description = 'Seed for the CA and transport-rule monitor'
    resources = @('microsoft.entra.conditionalaccesspolicy','microsoft.exchange.transportrule') } | ConvertTo-Json)
Invoke-MgGraphRequest -Method GET -Uri 'v1.0/admin/configurationManagement/configurationSnapshotJobs' | ConvertTo-Json -Depth 5
```

When the job shows `succeeded`, create the monitor from it in the Entra admin center (**Tenant Governance** > **Monitors** > **New** > **Import from snapshot**), after granting the TCM service principal its read permissions as Learn describes.[^c14g-tcm-auth] Read drifts with `Invoke-MgGraphRequest -Method GET -Uri 'v1.0/admin/configurationManagement/configurationDrifts'` and save each run's output into `<exports>/tcm/`.

### Enforcement

Detection is enforced; remediation stays with people. Each non-empty diff, and each TCM drift, becomes one finding per changed object, classed and given severity by the table above, and written as a remediation contract ([Chapter 06](06-the-drift-engine.md#the-remediation-contract)). The finding goes through the ticket-to-machine front door ([Chapter 10](10-ticket-to-machine.md)): the owner either approves the change (the baseline tag moves under a change record) or restores the approved setting. Conditional Access enforcement changes stay at L3, gated actuation, permanently ([Chapter 06](06-the-drift-engine.md#what-the-engine-remediates-and-what-it-doesnt)); nothing in this section reverts a policy automatically. Turn on the schedule after the pilot: daily for Conditional Access, PIM and authentication methods, weekly for the rest (*design guidance*).

### Rollback

Stopping the schedule stops collection without touching the tenant. A restore of a drifted setting is itself a change, made from the baseline file in the repository through the platform's own write path, under change control; if the restore causes harm, the backout is the change's own backout plan.

### Exclusions

Settings that change by design (for example a named location of the agency's current egress addresses maintained by the network team) are excluded by path in the normalization, each with an owner and a review date in the drift-rule file. Emergency access accounts' exclusions from Conditional Access are *not* excluded from comparison: a change to them is a P1 finding.

### Telemetry

The export run log and its exit status; the commit history; TCM monitoring results; and the platforms' own audit events that the diff should correlate with (Entra audit log policy and role-setting changes, Exchange admin audit log, Intune audit log, Purview audit). A diff with no matching audit event is itself a finding: the platform changed without a logged change.

### Evidence

**Evidence checklist**

- [ ] **Configuration:** the baseline tag and the exported files it points at; the drift-rule file
- [ ] **Operational:** the commit history of exports, the diffs, TCM monitoring results, and the remediation contracts opened from them
- [ ] **Test:** a deliberate, approved test change in a pilot policy (for example adding a test group to an exclusion) appears in the next diff and opens a finding; restoring it closes the finding (expected and observed, date, tester)
- [ ] **Exception:** the excluded paths with owner and review date
- [ ] **Assessor-ready artifact:** for each control the exports cover, the baseline file, the latest diff and the contracts, packaged as [Chapter 07](07-evidence-over-attestation.md) describes

### Day-two ownership

The governance platform team owns the export, the repository and the schedule; each domain owner (the identity platform owner for Entra, the endpoint owner for Intune, the messaging owner for Exchange, the data protection owner for Purview, the network owner for Global Secure Access) owns their domain's drift rules and findings. The governance board reviews the drift rules quarterly. The signal that the exports themselves have drifted is a run that fails or a domain whose file stops changing while its audit log shows changes.

## Change safety {#change-safety}

Deactivating apps, denying vault secrets and enforcing push protection are the steps here that can break a workload. Exports and reports can't.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The governance platform team's own apps, vaults and repositories | No breakage for two weeks; rollback tested |
| 1 | The pilot system | Owner sign-off; every finding resolved or excepted |
| 2 | Tier 2 and Tier 3 applications and their vaults and repositories | Help-desk and incident volume within the backout triggers for two weeks |
| 3 | Everything in scope, Tier 1 last | Gap report at zero for ownerless high-impact rows; no secret without an exception |

- **Emergency access:** emergency access accounts are user accounts outside this chapter's controls; the drift rules treat any change to their Conditional Access exclusions as P1, tested in the ring 0 test change.
- **Change window:** deactivations and Deny assignments in the agency's standard change window, approved by the change advisory board, with the app's owner and the identity governance office on hand.
- **Backout triggers:** a production workload fails to authenticate; more than two help-desk tickets attributed to the change in the first day; a Tier 1 owner asks for backout.
- **Post-change validation:** the app's next sign-in succeeds on its expected credential (sign-in log), and the next gap report, inventory and diff show the expected change and nothing else.

## Government-cloud availability

| Capability | GCC | GCC High | DoD | Source (accessed Nov 11, 2026) |
|---|---|---|---|---|
| Graph reads of apps, service principals, grants | Yes (worldwide endpoint) | Yes | Yes | Graph national cloud deployments[^c14g-graph-clouds] |
| Service principal sign-in activity (preview, beta) | Yes | No | No | API page[^c14g-spactivity] |
| Application management policies | Not yet specified on the Learn tutorial; covered for Azure Government through Workload ID ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#what-workload-id-premium-adds)) | Same | Same | [^c14g-amp-tutorial] |
| Intune Graph reads (v1.0 and beta settings catalog) | Yes | Yes | Yes | API page[^c14g-intune] |
| Global Secure Access forwarding-profile reads (beta) | Yes | Yes | Yes | API page[^c14g-gsa] |
| Exchange Online and Security & Compliance PowerShell | Yes | Yes (own parameters) | Yes (own parameters) | Connection pages[^c14g-scc] |
| Tenant Configuration Management (TCM) | Yes | No | No | API pages[^c14g-tcm-cloud] |
| GitHub Advanced Security for Azure DevOps | Not yet specified | Not yet specified | Not yet specified | Learn says Azure DevOps Services only[^c14g-ghazdo] |
| Key Vault built-in policies used in Step 3 | Not yet specified (the lookup checks) | Same | Same | [^c14g-kv-policy] |

: Availability by government cloud {.striped .hover}

## Federal requirements this chapter supports

| Requirement | What in this chapter supports it |
|---|---|
| NIST SP 800-53 CM-8, System Component Inventory | The application governance record, joined weekly to the tenant |
| AC-2, Account Management; AC-6, Least Privilege | Owners, permissions justification, review dates, unknown-workload handling |
| IA-5, Authenticator Management; IA-5(7), No Embedded Unencrypted Static Authenticators | Secrets rules, rotation windows, vaulting and secret scanning |
| CM-2, Baseline Configuration; CM-3, Configuration Change Control; CM-6, Configuration Settings | The exported baseline, the baseline tag moved only by approved change, and the drift rules |
| CA-7, Continuous Monitoring | The scheduled exports, gap reports and inventories, on the cadences above |
| FedRAMP 20x indicators, as vocabulary ([Chapter 11](11-reciprocity-and-one-authorization.md#the-2026-key-security-indicators)) | KSI-PIY-GIV Generating Inventories; KSI-IAM-SNU Securing Non-User Authentication; KSI-IAM-ELP Ensuring Least Privilege; KSI-SVC-ASM Automating Secret Management; KSI-MLA-EVC Evaluating Configurations; KSI-CMT-LMC Logging Changes[^c14g-ksi] |

: Requirements this chapter supports {.striped .hover}

The control statements are from NIST's release 5.2.0 catalog.[^c14g-sp80053] These records support the controls; the organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The indicators bind cloud service providers, not agencies; the program uses their names to describe its own measures. [Appendix A](appendix-a-requirements-mapping.md) maps the book's controls as a whole.

## Key takeaways

- Every application and service principal carries eight fields in the record, and no high-impact workload is ownerless; an unknown workload is deactivated under the orphan rule, or restricted until it can be.
- Long-lived client secrets are prohibited by default; an exception meets four criteria and has a replacement date, and the secret inventory is also the dated replacement plan. Conversion follows the service account migration and Non-Person Identity guides.
- Eight configuration domains are exported, normalized and diffed against an approved baseline; each difference becomes a remediation contract and a person decides whether to approve or restore it.
- Tenant Configuration Management adds monitoring where it is available (GCC, preview by one Learn page's account); the scripted export works in every cloud.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 13 — Records, Evidence and Retention](13-records-evidence-and-retention.md) · [Book index](index.md) · [Next: Appendix A — Requirements Mapping: Controls, Mandates and Books →](appendix-a-requirements-mapping.md)
:::

[^c14g-best]: Microsoft Learn, "Security best practices for application properties in Microsoft Entra ID," sections "Credentials (including certificates and secrets)" and "Redirect URIs" (monitor pipelines so credentials aren't committed; maintain ownership of redirect URIs), <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> (accessed Nov 11, 2026).
[^c14g-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5 (release 5.2.0), controls AC-2, AC-6, CA-7, CM-2, CM-3, CM-6, CM-8, IA-5 and IA-5(7) ("Ensure that unencrypted static authenticators are not embedded in applications or other forms of static storage"), read from NIST's OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026).
[^c14g-assign]: Microsoft Learn, "Restrict a Microsoft Entra app to a set of users," sections "Update the app to require user assignment" and "Restrict access to an app (resource) by assigning other services (client apps)" (`Update-MgServicePrincipal -AppRoleAssignmentRequired:$true`; user consent isn't allowed for an app that requires assignment), <https://learn.microsoft.com/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users> (accessed Nov 11, 2026).
[^c14g-spactivity]: Microsoft Learn, "List servicePrincipalSignInActivities" (beta; global service only, not US Government L4 or L5; `AuditLog.Read.All`; Reports Reader, Security Reader or Security Administrator), <https://learn.microsoft.com/graph/api/reportroot-list-serviceprincipalsigninactivities?view=graph-rest-beta>; and "What is the Usage and insights report?," section "Service principal sign-in activity (preview)" (last activity can include partial sign-ins), <https://learn.microsoft.com/entra/identity/monitoring-health/concept-usage-insights-report> (both accessed Nov 11, 2026).
[^c14g-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments" (GCC uses the worldwide endpoints; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us`), <https://learn.microsoft.com/graph/deployments> (accessed Nov 11, 2026).
[^c14g-kv-rotate]: Microsoft Learn, "Automate the rotation of a secret for resources that use one set of authentication credentials" (Key Vault publishes the near-expiry event to Event Grid thirty days before a secret's expiration date), <https://learn.microsoft.com/azure/key-vault/secrets/tutorial-rotation> (accessed Nov 11, 2026).
[^c14g-kv-policy]: Microsoft Learn, "Integrate Azure Key Vault with Azure Policy," section "Available Built-In Policy Definitions" (secrets should have an expiration date; specified maximum validity period; more than the specified number of days before expiration; Audit default, Deny supported), <https://learn.microsoft.com/azure/key-vault/general/azure-policy> (accessed Nov 11, 2026).
[^c14g-gh-api]: GitHub Docs, REST API, "Update a repository" (`security_and_analysis.secret_scanning` and `secret_scanning_push_protection`, `status` enabled or disabled; requires repository admin, or organization owner or security manager), <https://docs.github.com/en/rest/repos/repos#update-a-repository> (accessed Nov 11, 2026).
[^c14g-ghazdo]: Microsoft Learn, "Configure GitHub Advanced Security for Azure DevOps," sections "Enable GitHub Advanced Security" and "Set up secret scanning" (available only for Azure DevOps Services and Git repositories; push protection evaluates pushes after enablement; repository scanning finds secrets in history), <https://learn.microsoft.com/azure/devops/repos/security/configure-github-advanced-security-features> (accessed Nov 11, 2026).
[^c14g-ghazdo-scan]: Microsoft Learn, "Set up secret scanning," section "Push a blocked secret" (`skip-secret-scanning:true` bypasses push protection; an alert is still generated), <https://learn.microsoft.com/azure/devops/repos/security/github-advanced-security-secret-scanning> (accessed Nov 11, 2026).
[^c14g-amp-tutorial]: Microsoft Learn, "Tutorial: Enforce secret and certificate standards using application management policies," section "Read your tenant application management policy" (`Get-MgPolicyDefaultAppManagementPolicy`; `isEnabled` false when no policy applies), <https://learn.microsoft.com/entra/identity/enterprise-apps/tutorial-enforce-secret-standards> (accessed Nov 11, 2026).
[^c14g-pim]: Microsoft Learn, "Configure Microsoft Entra role settings in Privileged Identity Management," section "Manage role settings by using Microsoft Graph" (`policies/roleManagementPolicies?$filter=scopeId eq '/' and scopeType eq 'DirectoryRole'&$expand=rules`), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings> (accessed Nov 11, 2026).
[^c14g-intune]: Microsoft Learn, "List deviceManagementConfigurationPolicies" (Intune beta; available in the global service, US Government L4 and L5; requires an active Intune license), <https://learn.microsoft.com/graph/api/intune-deviceconfigv2-devicemanagementconfigurationpolicy-list?view=graph-rest-beta> (accessed Nov 11, 2026).
[^c14g-scc]: Microsoft Learn, "Connect to Exchange Online PowerShell" (`-ExchangeEnvironmentName O365USGovGCCHigh` or `O365USGovDoD`) and "Connect to Security & Compliance PowerShell" (GCC High and DoD connection URIs), <https://learn.microsoft.com/powershell/exchange/connect-to-exchange-online-powershell> and <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (both accessed Nov 11, 2026).
[^c14g-exo-app]: Microsoft Learn, "App-only authentication for unattended scripts in Exchange Online PowerShell and Security & Compliance PowerShell," section "Connection examples," <https://learn.microsoft.com/powershell/exchange/app-only-auth-powershell-v2> (accessed Nov 11, 2026).
[^c14g-gsa]: Microsoft Learn, "List forwardingProfiles" (Graph beta; global service, US Government L4 and L5; `NetworkAccess.Read.All`; Global Reader, Global Secure Access Log Reader, Global Secure Access Administrator or Security Administrator), <https://learn.microsoft.com/graph/api/networkaccess-networkaccessroot-list-forwardingprofiles?view=graph-rest-beta> (accessed Nov 11, 2026).
[^c14g-tcm]: Microsoft Learn, "Overview of the Tenant Configuration Management APIs in Microsoft Graph" (supported workloads Defender, Entra, Exchange Online, Intune, Purview and Teams), <https://learn.microsoft.com/graph/unified-tenant-configuration-management-concept-overview>; and "Configuration management" (Microsoft Entra Tenant Governance; built on the TCM APIs, "which are generally available"; monitors, drifts and snapshots), <https://learn.microsoft.com/entra/id-governance/tenant-governance/configuration-management> (both accessed Nov 11, 2026).
[^c14g-tcm-limits]: Microsoft Learn, "Use the Tenant Configuration Management APIs in Microsoft Graph," section "API limits" (30 monitors; six-hour interval; 800 resources per day; baseline update deletes results and drifts; fixed drifts deleted after 30 days; snapshots kept seven days; 20,000 resources a month), <https://learn.microsoft.com/graph/api/resources/unified-tenant-configuration-management-api-overview?view=graph-rest-1.0> (accessed Nov 11, 2026).
[^c14g-tcm-lic]: Microsoft Learn, "Licensing for Microsoft Entra Tenant Governance," section "Configuration management" (monitoring and snapshots with Entra ID P1 or P2; ID Governance adds capacity per license), <https://learn.microsoft.com/entra/id-governance/tenant-governance/licensing> (accessed Nov 11, 2026).
[^c14g-m365dsc]: Microsoft Learn, Azure Architecture Center, "Manage Microsoft 365 tenant configuration by using Microsoft365DSC and Azure DevOps," section "Alternatives" (the TCM APIs support snapshots and drift detection, not deployment or remediation), <https://learn.microsoft.com/azure/architecture/example-scenario/devops/manage-microsoft-365-tenant-configuration-microsoft365dsc-devops> (accessed Nov 11, 2026).
[^c14g-tcm-cloud]: Microsoft Learn, "Get configurationBaseline" (national cloud table: global service only), <https://learn.microsoft.com/graph/api/configurationbaseline-get?view=graph-rest-1.0> (accessed Nov 11, 2026).
[^c14g-tcm-auth]: Microsoft Learn, "Set up authentication for Tenant Configuration Management APIs" ("During public preview, organizations must add the TCM service principal to their tenant and grant it the required permissions"), <https://learn.microsoft.com/graph/utcm-authentication-setup> (accessed Nov 11, 2026).
[^c14g-tcm-snap]: Microsoft Learn, "configurationBaseline: createSnapshot" (`POST /admin/configurationManagement/configurationSnapshots/createSnapshot` with `displayName`, `description` and `resources`; `ConfigurationMonitoring.ReadWrite.All`), <https://learn.microsoft.com/graph/api/configurationbaseline-createsnapshot?view=graph-rest-1.0> (accessed Nov 11, 2026).
[^c14g-ksi]: FedRAMP, *FedRAMP Consolidated Rules for 2026*, Key Security Indicator theme pages for policy and inventory, identity and access management, service configuration, monitoring, logging and auditing, and change management, <https://fedramp.gov/2026/providers/20x/key-security-indicators/policy-and-inventory/>, <https://fedramp.gov/2026/providers/20x/key-security-indicators/identity-and-access-management/>, <https://fedramp.gov/2026/providers/20x/key-security-indicators/service-configuration/>, <https://fedramp.gov/2026/providers/20x/key-security-indicators/monitoring-logging-and-auditing/> and <https://fedramp.gov/2026/providers/20x/key-security-indicators/change-management/> (indicator names as cited elsewhere in the workbook; accessed Nov 11, 2026).
