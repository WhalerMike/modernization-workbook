---
title: "Appendix A — Identity Remediation Work Packages"
description: "The identity remediation factory's six work packages as copy-paste procedures: owner assignment, permission reduction, secret-to-managed-identity conversion, redirect URI cleanup with DNS proof and an OAuth regression test, assignment enforcement, and the post-change test that seals one standard evidence pack per application. Each follows the workbook's How-section template, with change safety, rollback, government-cloud availability and the federal requirements it supports, and links the service account migration and Non-Person Identity guides for the conversion engineering rather than repeating it."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b18-application-modernization
book: B18
part: Appendix
series-order: 90
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Appendix A — Identity Remediation Work Packages

*The same six steps, in the same order, for every application whose identity is a risk: name its owners, cut its permissions, replace its secrets, clean its redirect URIs, require assignment, and prove it still works.*

::: {.callout-note}
## In this appendix
The procedures behind [Chapter 10's identity remediation factory](10-running-the-portfolio-in-waves.md#identity-remediation-factory): what each work package needs, the dry run, the commands, the validation and the rollback, and the evidence pack each application leaves. The applications come from the attack-path rank in [Chapter 02](02-triaging-the-portfolio.md#identity-and-access-intake-fields); their governance record is [Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md). The conversion engineering is in the [service account migration guide](../guides/service-account-migration.md) and the [Non-Person Identity guide](../guides/non-person-identity-implementation.md), and this appendix links them rather than repeating them.
:::

The work packages are the program's design; the attack-path score and wave thresholds that order the applications ([Chapter 02](02-triaging-the-portfolio.md#identity-and-access-intake-fields)), the 90-day stale-app rule and the secret rotation windows are its settled position ([WD-148](../../about/decision-register.md#wd-148)). Each is small enough to run for one application in one change window, and each leaves the same evidence, so fifty applications through the factory produce fifty packs an assessor can read the same way. They follow [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md): the How-section subsections below apply to all six, and each work package adds its own steps, validation and evidence.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This appendix | Evidence |
|---|---|---|
| Designed | The application's intake row and rank, and the work packages chosen for it, approved by its business owner | The rank file and the change record |
| Configured | Each work package's change, made in the application's change window | The before-and-after export for each work package |
| Enforced | WP5 turns on assignment; WP2 and WP3 remove the grants and secrets for good | The service principal's `appRoleAssignmentRequired`; the removal events |
| Evidenced | WP6, the post-change test | The regression test record and the sign-in log extract |
| Operated | The application's row back in the governance record, reviewed on its tier's cadence ([Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#app-day-two-ownership)) | The next weekly gap report and the review record |

A finding these work packages address is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Apps, with Identity for the workload identities
- **CISA ZTMM pillar:** Applications and Workloads; Identity
- **Depends on:** the governance record and its weekly gap report ([Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#application-governance-record)); the agency's domain ownership record ([Book 08](../b08-ddi/index.md)); sign-in and Microsoft Graph activity logs ([Book 12](../b12-security-operations/index.md))
- **Attack chain interrupted:** Persistence through an owner or credential added to an unowned app; Privilege Escalation through an over-granted application permission; Credential Access through a secret or an authorization code sent to a redirect URI on a domain someone else now controls
:::

## Prerequisites {#wp-prerequisites}

- **Tools.** PowerShell 7 with the Microsoft Graph PowerShell SDK (`Microsoft.Graph.Applications`, `Microsoft.Graph.Identity.SignIns`, `Microsoft.Graph.Beta.Reports`).
- **Inputs.** The application's row in `portfolio-identity-rank.csv` ([Chapter 02](02-triaging-the-portfolio.md#identity-and-access-intake-fields)) and in the governance record, and a change record. The placeholders used throughout: `<app-id>` is the application (client) ID; `<sp-object-id>` the service principal's object ID; `<out-dir>` the application's evidence folder, `<evidence-root>\<app-id>\<yyyymmdd>`; `<change-id>` the change record.
- **Roles, activated through PIM for the change window.** Cloud Application Administrator or Application Administrator for app registrations and service principals (owners, credentials, redirect URIs, assignment); Privileged Role Administrator only where an app role assignment to Microsoft Graph is removed; Reports Reader or Security Reader for sign-in logs.
- **Licenses.** The changes are free. Reading sign-in logs through Microsoft Graph and collecting Microsoft Graph activity logs need Entra ID P1 or P2.[^b18aA-graph-activity] Group-based assignment to an application needs P1 or P2.[^b18aA-50105] Conditional Access for workload identities, if WP5 adds it, needs Workload ID Premium ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#what-workload-id-premium-adds)).
- **GCC endpoints.** Connect each session to the worldwide endpoints, and use the matching Graph root wherever a command builds a URL:

  ```powershell
  $graph = 'https://graph.microsoft.com'   # GCC uses the worldwide Graph endpoint
  Connect-MgGraph -Scopes 'Application.ReadWrite.All','AppRoleAssignment.ReadWrite.All','DelegatedPermissionGrant.ReadWrite.All','AuditLog.Read.All' -NoWelcome
  $app = Get-MgApplication -Filter "appId eq '<app-id>'"
  $sp  = Get-MgServicePrincipal -Filter "appId eq '<app-id>'"
  New-Item -ItemType Directory -Force -Path '<out-dir>' | Out-Null
  ```

  GCC uses the worldwide endpoint.[^b18aA-graph-clouds] The application, service principal, owner, grant and app role assignment APIs used here serve the worldwide endpoint; Microsoft Graph activity logs are listed for the global service.[^b18aA-graph-activity] The service principal sign-in activity report is preview ([Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#app-prerequisites)).

## Pilot {#wp-pilot}

Run all six work packages on three applications from the top of the rank: one first-party line-of-business app with a client secret, one with an application permission to Microsoft Graph, and one vendor (multitenant) app. Success: each comes out with a sealed evidence pack, no unplanned outage, and its rank below the wave threshold; the runbook is revised from what went wrong before the first factory wave.

## Report-only or audit phase {#wp-report-only-or-audit-phase}

Every work package starts with the same read-only snapshot, and WP2 and WP4 each have a dry-run step that reads logs before anything changes. Take the snapshot first:

```powershell
Get-MgApplication -ApplicationId $app.Id | ConvertTo-Json -Depth 10 | Set-Content '<out-dir>\before-application.json'
Get-MgServicePrincipal -ServicePrincipalId $sp.Id | ConvertTo-Json -Depth 10 | Set-Content '<out-dir>\before-serviceprincipal.json'
Get-MgApplicationOwner -ApplicationId $app.Id -All | Select-Object Id, AdditionalProperties | ConvertTo-Json -Depth 5 | Set-Content '<out-dir>\before-owners.json'
Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -All | ConvertTo-Json -Depth 5 | Set-Content '<out-dir>\before-app-permissions.json'
Get-MgOauth2PermissionGrant -Filter "clientId eq '$($sp.Id)'" -All | ConvertTo-Json -Depth 5 | Set-Content '<out-dir>\before-delegated-grants.json'
Get-MgServicePrincipalAppRoleAssignedTo -ServicePrincipalId $sp.Id -All | ConvertTo-Json -Depth 5 | Set-Content '<out-dir>\before-assignments.json'
```

The snapshot is also the rollback source for every work package.

## WP1 Owner assignment {#wp1-owner-assignment}

**Entry:** the rank or the gap report shows no business owner, no technical owner, or fewer than two technical owners. The business owner is named by the system's owner and recorded in the governance record; the technical owners are the two people who will configure the app ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#ownership)).

1. Point the app at its record entry, so a contact survives any one person leaving. `<record-id>` is the record's identifier for the application.

   ```powershell
   Update-MgApplication -ApplicationId $app.Id -ServiceManagementReference '<record-id>'
   ```

2. Add each technical owner to the app registration and the enterprise application. `<owner-object-id>` is the person's user object ID.

   ```powershell
   foreach ($o in '<owner-object-id-1>','<owner-object-id-2>') {
       New-MgApplicationOwnerByRef -ApplicationId $app.Id -BodyParameter @{ '@odata.id' = "$graph/v1.0/directoryObjects/$o" }
       New-MgServicePrincipalOwnerByRef -ServicePrincipalId $sp.Id -BodyParameter @{ '@odata.id' = "$graph/v1.0/directoryObjects/$o" } }
   ```

3. Remove owners who have left the role or the agency. `<stale-owner-object-id>` comes from `before-owners.json`.

   ```powershell
   Remove-MgApplicationOwnerDirectoryObjectByRef -ApplicationId $app.Id -DirectoryObjectId '<stale-owner-object-id>'
   Remove-MgServicePrincipalOwnerDirectoryObjectByRef -ServicePrincipalId $sp.Id -DirectoryObjectId '<stale-owner-object-id>'
   ```

**Validate:** `(Get-MgApplicationOwner -ApplicationId $app.Id -All).Count` returns 2, the governance record names the business owner, and the next gap report shows no owner gap. For an orphaned application nobody will own, WP1 stops here and the [Non-Person Identity guide's orphan rule](../guides/non-person-identity-implementation.md#orphans) takes over: deactivate, then a 30-day claim window.

## WP2 Permission reduction {#wp2-permission-reduction}

**Entry:** an application permission or tenant-wide delegated grant without a justification in the record, or one the app doesn't use. Least privilege applies to processes acting on behalf of users as well as to users ([Non-Person Identity guide, Step 4](../guides/non-person-identity-implementation.md#step-4-cut-privilege)).

1. **Dry run: what does the app actually call?** With Microsoft Graph activity logs sent to the Log Analytics workspace,[^b18aA-graph-activity] run in the workspace (`<app-id>` as above):

   ```kusto
   MicrosoftGraphActivityLogs
   | where TimeGenerated > ago(30d) and AppId == "<app-id>"
   | summarize Calls = count(), LastCall = max(TimeGenerated) by RequestMethod, Path = tostring(split(RequestUri, "?")[0])
   | order by Calls desc
   ```

   Compare the paths with the permissions in `before-app-permissions.json`. A permission the paths don't need is a candidate for removal; the app's technical owner confirms it before step 2. Thirty days covers most cycles; an app with a quarterly or annual job needs its owner's word for that job, recorded.

2. **Remove an application permission** on the enterprise application. `<assignment-id>` is the `Id` in `before-app-permissions.json` for the permission being removed.

   ```powershell
   Remove-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -AppRoleAssignmentId '<assignment-id>'
   ```

3. **Narrow or remove a delegated grant.** `<grant-id>` is the `Id` in `before-delegated-grants.json`; `<kept-scopes>` is the space-separated list of scopes to keep.

   ```powershell
   Update-MgOauth2PermissionGrant -OAuth2PermissionGrantId '<grant-id>' -Scope '<kept-scopes>'
   # or, to remove the grant entirely:
   Remove-MgOauth2PermissionGrant -OAuth2PermissionGrantId '<grant-id>'
   ```

4. **Stop it coming back.** Remove the permission from the app registration's requested permissions too, so a later admin consent doesn't re-grant it. `<permission-id>` is the app role or scope ID removed in step 2 or 3.

   ```powershell
   $rra = foreach ($r in (Get-MgApplication -ApplicationId $app.Id -Property requiredResourceAccess).RequiredResourceAccess) {
       @{ resourceAppId = $r.ResourceAppId
          resourceAccess = @($r.ResourceAccess | Where-Object Id -ne '<permission-id>' | ForEach-Object { @{ id = $_.Id; type = $_.Type } }) } }
   Update-MgApplication -ApplicationId $app.Id -RequiredResourceAccess $rra
   ```

Removing a permission from the registration doesn't revoke an existing grant, which is why step 2 or 3 comes first, and tokens already issued stay valid until they expire ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#admin-consent)). **Validate:** the app runs its full business cycle; the after-export shows the permission gone from both places; the record's permissions justification lists only what remains.

## WP3 Secret to managed identity {#wp3-secret-to-managed-identity}

**Entry:** a client secret, or a certificate where a managed identity or a federated credential would do. Microsoft's order is a managed identity, then a federated credential, then a certificate, and never a secret ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials)); the program's secrets rules are in [Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#secrets-governance).

1. **Choose the target** from the decision table in the [Non-Person Identity guide, Step 2](../guides/non-person-identity-implementation.md#step-2-decide-each-identitys-target): a managed identity where the workload runs on Azure or an Arc-enabled server, a federated credential where it has its own OIDC issuer, a certificate otherwise.
2. **Convert with a parallel run**, following the guide that matches the workload: the [service account migration guide, Migration C](../guides/service-account-migration.md#migration-c) for a workload moving from an AD account to a Microsoft Entra workload identity (C1 user-assigned managed identity, C2 an Arc-enabled server's identity, C3 a certificate, C4 workload identity federation), or the [Non-Person Identity guide, Step 5](../guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run) for an app registration. Those guides hold the commands; don't improvise them here.
3. **Prove the new credential is in use.** Read the app's service principal sign-ins for the parallel-run window (Graph beta; Entra ID P1 or P2):[^b18aA-signin]

   ```powershell
   Get-MgBetaAuditLogSignIn -Filter "appId eq '<app-id>' and signInEventTypes/any(t: t eq 'servicePrincipal') and createdDateTime ge $((Get-Date).AddDays(-7).ToString('yyyy-MM-ddTHH:mm:ssZ'))" -All |
       Group-Object ClientCredentialType, ServicePrincipalCredentialKeyId | Select-Object Count, Name |
       Export-Csv '<out-dir>\wp3-credential-use.csv' -NoTypeInformation
   ```

   `ClientCredentialType` reads `clientSecret`, `certificate`, `federatedIdentityCredential`, `managedIdentity` or `clientAssertion`; `ServicePrincipalCredentialKeyId` names the key used.[^b18aA-signin] Managed identity sign-ins appear in the managed identity sign-in log; filter on `managedIdentity` instead for a converted workload. Remove the secret only when no sign-in in the window used it.

4. **Remove the secret.** `<key-id>` is the secret's `KeyId` from `before-application.json` or the secret inventory.

   ```powershell
   Remove-MgApplicationPassword -ApplicationId $app.Id -KeyId '<key-id>'
   ```

**Validate:** the app runs on its new credential for a full business cycle; the after-export shows no `passwordCredentials`; the secret inventory no longer lists it; its exception, if it had one, is closed.

## WP4 Redirect URI cleanup {#wp4-redirect-uri-cleanup}

**Entry:** a wildcard, a non-loopback `http` URI, a host on a domain the agency can't show it controls, a host that doesn't resolve, or a URI no sign-in has used. Microsoft recommends keeping ownership of every redirect URI, monitoring their DNS records, avoiding wildcards and insecure schemes, and keeping the list small;[^b18aA-best] the OAuth 2.0 specification asks that a redirection endpoint be an absolute URI,[^b18aA-rfc6749] and Microsoft strongly recommends following it rather than using a wildcard.[^b18aA-reply] Redirect URIs belong on the application object, never on the service principal.[^b18aA-reply] DNS ownership of the agency's domains is [Book 08's](../b08-ddi/index.md); this work package asks it for proof.

1. **List the URIs and test each host.** `<owned-domains.txt>` is the agency's list of domains it controls, one per line, as in [Chapter 02](02-triaging-the-portfolio.md#identity-and-access-intake-fields).

   ```powershell
   $owned = Get-Content '<owned-domains.txt>' | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ }
   $uris = @($app.Web.RedirectUris | ForEach-Object { [pscustomobject]@{ Platform = 'web'; Uri = $_ } }) +
           @($app.Spa.RedirectUris | ForEach-Object { [pscustomobject]@{ Platform = 'spa'; Uri = $_ } }) +
           @($app.PublicClient.RedirectUris | ForEach-Object { [pscustomobject]@{ Platform = 'publicClient'; Uri = $_ } })
   $check = foreach ($u in $uris) {
       $h = try { ([uri]$u.Uri).Host.ToLower() } catch { '' }
       $loop = $h -in 'localhost','127.0.0.1'
       $cname = if (-not $loop -and $h -and (Get-Command Resolve-DnsName -ErrorAction SilentlyContinue)) { (Resolve-DnsName $h -Type CNAME -ErrorAction SilentlyContinue | Where-Object Type -eq 'CNAME').NameHost }
       [pscustomobject]@{ Platform = $u.Platform; Uri = $u.Uri; Host = $h
           Wildcard = $u.Uri -match '\*'; InsecureHttp = ($u.Uri -like 'http://*' -and -not $loop)
           OwnedDomain = $loop -or [bool]($owned | Where-Object { $h -eq $_ -or $h.EndsWith(".$_") })
           Resolves = $loop -or [bool](try { [System.Net.Dns]::GetHostAddresses($h) } catch { $null })
           CnameTarget = $cname }
   }
   $check | Export-Csv '<out-dir>\wp4-redirect-check.csv' -NoTypeInformation; $check | Format-Table -AutoSize
   ```

   `Resolve-DnsName` exists on Windows; elsewhere, `CnameTarget` stays empty and the domain owner checks it with the DNS tools [Book 08](../b08-ddi/index.md) uses. A CNAME that points at a cloud resource name the agency no longer owns is a dangling record: Microsoft's guidance is to remove it, or reclaim the resource, before anything else, and to investigate whether anything was sent to it.[^b18aA-dangling]

2. **Dry run: which URIs are used?** With Microsoft Graph activity logs or sign-in logs, an unused URI is hard to see directly; the program's practice is to ask the technical owner which URIs each environment uses, and to move development and test URIs to a separate app registration, as Microsoft advises.[^b18aA-reply] Record the answer in the change.

3. **Keep only the approved URIs.** `<keep-web>`, `<keep-spa>` and `<keep-public>` are the URIs to keep on each platform, each on an owned domain with `https` (or loopback for a native client).

   ```powershell
   Update-MgApplication -ApplicationId $app.Id `
       -Web @{ RedirectUris = @('<keep-web>') } -Spa @{ RedirectUris = @('<keep-spa>') } -PublicClient @{ RedirectUris = @('<keep-public>') }
   ```

   Leave a platform's list empty (`@()`) when it has none. Where a wildcard served many subdomains, Microsoft's alternative is one shared redirect URI with the destination carried, protected, in the `state` parameter;[^b18aA-reply] that is an application change for its developers, scheduled before the wildcard is removed.

4. **OAuth regression test.** For each kept web or SPA URI, start a sign-in with it and confirm the identity platform accepts it; then confirm a removed URI is refused. `<tenant-id>` is the tenant's ID.

   ```powershell
   $login = 'https://login.microsoftonline.com'   # GCC uses the worldwide sign-in endpoint
   foreach ($test in @(@{ Uri = '<keep-web>'; Expect = 'accepted' }, @{ Uri = '<removed-uri>'; Expect = 'AADSTS50011' })) {
       $url = "$login/<tenant-id>/oauth2/v2.0/authorize?client_id=<app-id>&response_type=code&scope=openid&redirect_uri=$([uri]::EscapeDataString($test.Uri))&state=regression"
       $body = (Invoke-WebRequest -Uri $url -MaximumRedirection 0 -SkipHttpErrorCheck).Content
       [pscustomobject]@{ Uri = $test.Uri; Expected = $test.Expect; Observed = if ($body -match 'AADSTS50011') { 'AADSTS50011' } else { 'accepted' } }
   } | Export-Csv '<out-dir>\wp4-oauth-regression.csv' -NoTypeInformation
   ```

   `AADSTS50011` is the error the identity platform returns when a request's redirect URI isn't registered on the app.[^b18aA-reply] The test proves registration only; the technical owner then completes one real sign-in through each kept URI and records it.

**Validate:** every remaining host is on an owned domain and resolves, no wildcard or non-loopback `http` URI remains, the regression file shows the expected results, and the owner's real sign-in succeeded.

## WP5 Assignment enforcement {#wp5-assignment-enforcement}

**Entry:** **Assignment required?** is off on an application that only some users or client apps should reach. With it on, only assigned users and applications get tokens; with it off, every user in the tenant can sign in and other applications can obtain tokens for it, and invited external users can too.[^b18aA-props] Global Administrators aren't held to the assignment requirement.[^b18aA-props]

1. **Assign the groups and clients that need access first.** `<group-object-id>` is each group's object ID; `<app-role-id>` is the role to assign, or the all-zero default access ID `00000000-0000-0000-0000-000000000000` when the app has no roles. <!-- identifiers-ok: the documented default-access role ID, not a tenant value -->

   ```powershell
   New-MgServicePrincipalAppRoleAssignedTo -ServicePrincipalId $sp.Id -BodyParameter @{
       principalId = '<group-object-id>'; resourceId = $sp.Id; appRoleId = '<app-role-id>' }
   ```

   For a client application that calls this one as a resource, assign the client's service principal the same way, using its object ID as `principalId`; Microsoft documents this as an API-only step.[^b18aA-assign]

2. **Turn assignment on.**[^b18aA-assign]

   ```powershell
   Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AppRoleAssignmentRequired:$true
   ```

   User consent isn't allowed for an app that requires assignment, so grant tenant-wide admin consent for the permissions the app keeps (WP2) before this step.[^b18aA-assign]

**Validate:** an assigned test user signs in; an unassigned, non-administrator test user gets `AADSTS50105`;[^b18aA-50105] an unassigned client app gets `AADSTS501051`; use the affected identity to test, never a Global Administrator.[^b18aA-50105]

## WP6 Post-change test and the evidence pack {#wp6-post-change-test}

**Entry:** every application, after the work packages it needed.

1. **Read the sign-ins since the change.** `<change-time>` is the change's start, in UTC.

   ```powershell
   Get-MgBetaAuditLogSignIn -Filter "appId eq '<app-id>' and createdDateTime ge <change-time>" -All |
       Select-Object CreatedDateTime, @{n='Error';e={$_.Status.ErrorCode}}, ClientCredentialType, ConditionalAccessStatus |
       Export-Csv '<out-dir>\wp6-signins-after.csv' -NoTypeInformation
   Get-MgBetaAuditLogSignIn -Filter "appId eq '<app-id>' and signInEventTypes/any(t: t eq 'servicePrincipal') and createdDateTime ge <change-time>" -All |
       Select-Object CreatedDateTime, @{n='Error';e={$_.Status.ErrorCode}}, ClientCredentialType |
       Export-Csv '<out-dir>\wp6-sp-signins-after.csv' -NoTypeInformation
   ```

   Any error code other than `0` that started after the change is a backout trigger until explained.

2. **Take the after-snapshot**, the same six commands as the [report-only snapshot](#wp-report-only-or-audit-phase) with `after-` in place of `before-`.

3. **Rebuild the intake row.** Re-run [Book 13, Chapter 14, Step 1](../b13-governance/14-application-secret-and-configuration-governance.md#application-governance-record) and the [Chapter 02 ranking](02-triaging-the-portfolio.md#identity-and-access-intake-fields), and copy the application's new row to `<out-dir>\rank-after.csv`.

4. **Seal the pack.** Write a hash manifest of every file, and record the regression test.

   ```powershell
   Get-ChildItem '<out-dir>' -File | Where-Object Name -ne 'SHA256SUMS.txt' |
       ForEach-Object { "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name } |
       Set-Content '<out-dir>\SHA256SUMS.txt'
   [pscustomobject]@{ AppId = '<app-id>'; Change = '<change-id>'; WorkPackages = '<WP1 WP2 ...>'; Expected = '<expected outcome>'
       Observed = '<observed outcome>'; Tester = '<role>'; Date = (Get-Date -Format 'yyyy-MM-dd') } |
       Export-Csv '<out-dir>\test-record.csv' -NoTypeInformation
   ```

**The standard evidence pack** for every application is that folder: `before-*.json` and `after-*.json`, the work package outputs (`wp3-credential-use.csv`, `wp4-redirect-check.csv`, `wp4-oauth-regression.csv`), the sign-ins after the change, `rank-after.csv`, `test-record.csv` and `SHA256SUMS.txt`, with the change record ID in the test record. [Book 13, Chapter 07](../b13-governance/07-evidence-over-attestation.md) describes how it joins the evidence chain.

**Validate:** the rank in `rank-after.csv` is below the wave threshold, or the remainder is an approved exception; the governance record matches the after-snapshot.

## Enforcement {#wp-enforcement}

The work packages run in the rings under [Change safety](#wp-change-safety). WP5 is the one enforcement switch; WP2, WP3 and WP4 remove access for good once validated. After an application's pack is sealed, the governance record's weekly gap report and drift exports ([Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#configuration-drift-exports)) keep it from drifting back: a new grant without a justification, a new secret without an exception or a new owner gap opens a finding.

## Rollback {#wp-rollback}

Every work package is reversed from its `before-` files, by the identity platform team through PIM, in minutes:

| Work package | Rollback |
|---|---|
| WP1 | `New-MgApplicationOwnerByRef` for a removed owner; `Update-MgApplication -ServiceManagementReference` to the prior value |
| WP2 | `New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -BodyParameter @{ principalId = $sp.Id; resourceId = '<resource-sp-id>'; appRoleId = '<app-role-id>' }` from `before-app-permissions.json`; `Update-MgOauth2PermissionGrant` back to the prior `Scope`; `Update-MgApplication -RequiredResourceAccess` from `before-application.json` |
| WP3 | Keep the old credential until the parallel run ends; once removed, a secret can't be restored, so the rollback is a new short-lived secret under an emergency exception while the cause is fixed |
| WP4 | `Update-MgApplication -Web/-Spa/-PublicClient` with the lists from `before-application.json`; never re-add a URI on a domain that failed the ownership check |
| WP5 | `Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AppRoleAssignmentRequired:$false` |

: Rollback by work package {.striped .hover}

Every rollback is recorded in the change and in the pack.

## Exclusions {#wp-exclusions}

Microsoft first-party service principals are out of scope for WP2 to WP5; a vendor's multitenant app is in scope for WP1, WP2 and WP5 on its enterprise application, and its redirect URIs and credentials belong to the vendor, so WP3 and WP4 become a request to the vendor with a date. An application excused from a work package has an exception with its approver and expiry in the governance record. Emergency access accounts aren't application identities and aren't touched; nothing here changes Conditional Access exclusions.

## Telemetry {#wp-telemetry}

Entra audit log events for owner changes, app role assignment and grant removals, credential removal (**Update application – Certificates and secrets management**), redirect URI and `appRoleAssignmentRequired` updates; sign-in logs for the app and its service principal; Microsoft Graph activity logs for what the app calls. [Book 12](../b12-security-operations/index.md) carries the detections for application credential, owner, consent and redirect URI changes.

## Evidence {#wp-evidence}

**Evidence checklist**

- [ ] **Configuration:** the `before-` and `after-` exports for each application
- [ ] **Operational:** the sign-ins after the change; the next weekly gap report showing the application clean
- [ ] **Test:** `test-record.csv`, `wp4-oauth-regression.csv` and the WP5 assigned and unassigned tests, each with expected and observed outcome, date and tester
- [ ] **Exception:** any work package excused, with approver and expiry; any emergency secret under WP3's rollback
- [ ] **Assessor-ready artifact:** the sealed pack with `SHA256SUMS.txt`, referenced from the closure-chain entry of each related assessment finding ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain))

## Day-two ownership {#wp-day-two-ownership}

The identity platform team runs the work packages; the application's technical owner tests and signs off; the identity governance office approves WP1 and exceptions; the steward tracks the identity line's throughput with the rest of the factory ([Chapter 10](10-running-the-portfolio-in-waves.md#metrics)). After the pack is sealed, the application is governed by [Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#app-day-two-ownership) and re-ranked at each re-triage.

## Change safety {#wp-change-safety}

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | One identity platform team app in a test tenant or test registration | All six work packages and every rollback run cleanly |
| 1 | The three pilot applications | Sealed packs; no unplanned outage; runbook revised |
| 2 | The first factory wave (rank 8 or more), lowest business impact first | Backout triggers not reached for two weeks |
| 3 | Later waves | The wave's packs sealed; the rank file shows them below threshold |

- **Emergency access:** not touched by these work packages; confirm in the change that no Conditional Access policy changed.
- **Change window:** the application's own change window, with its technical owner on hand; WP5 and WP4 outside the application's peak hours.
- **Backout triggers:** a sign-in error code that began with the change; the application's own health check failing; more than two help-desk tickets for the application in the first day; the business owner asks.
- **Post-change validation:** WP6, after each work package and again after the last.

## GCC availability {#wp-government-clouds}

| Capability | GCC | Source (accessed Nov 11, 2026) |
|---|---|---|
| Graph application, service principal, owner, grant and assignment operations | Yes (worldwide endpoint) | [^b18aA-graph-clouds] |
| Microsoft Graph activity logs | Yes | [^b18aA-graph-activity] |
| Sign-in logs through Graph beta (`clientCredentialType`) | Requires P1 or P2; cloud availability not stated on the resource page (*not yet specified*) | [^b18aA-signin] |
| Service principal sign-in activity report | Yes (preview) | [Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#app-prerequisites) |

: Availability in GCC {.striped .hover}

## Federal requirements these work packages support {#wp-federal-requirements}

| Requirement | Work package |
|---|---|
| NIST SP 800-53 AC-2, Account Management | WP1 (owners named for each account), WP5 (who may use the app) |
| AC-6, Least Privilege | WP2, WP5 |
| IA-5, Authenticator Management; IA-5(7), No Embedded Unencrypted Static Authenticators | WP3 |
| CM-8, System Component Inventory | WP1, WP6 (the record matches the tenant) |
| SC-7, Boundary Protection, and SI-4, System Monitoring, in part | WP4 (no tokens sent to hosts outside the agency's control), WP6 |
| CA-7, Continuous Monitoring | WP6 and the gap report afterward |

: Requirements these work packages support {.striped .hover}

Control names are from NIST's release 5.2.0 catalog.[^b18aA-sp80053] The packs support these controls; the organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. [Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#c14-federal-requirements) maps the related FedRAMP indicators.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Running the Portfolio in Waves](10-running-the-portfolio-in-waves.md) · [Book index](index.md)
:::

[^b18aA-graph-activity]: Microsoft Learn, "Access Microsoft Graph activity logs" (available in the global service; requires Entra ID P1 or P2; Security Administrator configures the diagnostic settings; `AppId` and `RequestUri` columns), <https://learn.microsoft.com/graph/microsoft-graph-activity-logs-overview> (accessed Nov 11, 2026).
[^b18aA-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Nov 11, 2026).
[^b18aA-50105]: Microsoft Learn, "Error AADSTS50105 — The signed-in user isn't assigned to a role for the application" (group-based assignment needs Entra ID P1 or P2; the requirement doesn't apply to Global Administrators, so test with the affected user), <https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts50105-user-not-assigned-role> (accessed Nov 11, 2026).
[^b18aA-signin]: Microsoft Learn, "signIn resource type" (Graph beta; P1 or P2 to read sign-in logs through Graph; `clientCredentialType` values; `servicePrincipalCredentialKeyId`; `signInEventTypes` filter), <https://learn.microsoft.com/graph/api/resources/signin?view=graph-rest-beta> (accessed Nov 11, 2026).
[^b18aA-best]: Microsoft Learn, "Security best practices for application properties in Microsoft Entra ID," section "Redirect URIs," <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> (accessed Nov 11, 2026).
[^b18aA-rfc6749]: D. Hardt, ed., RFC 6749, *The OAuth 2.0 Authorization Framework*, IETF, October 2012, §3.1.2 ("The redirection endpoint URI MUST be an absolute URI"), <https://www.rfc-editor.org/rfc/rfc6749#section-3.1.2> (accessed Nov 11, 2026).
[^b18aA-reply]: Microsoft Learn, "Redirect URI (reply URL) outline and restrictions" (`AADSTS50011` for an unregistered redirect URI; separate registrations for development and production; redirect URIs on the application object only; wildcard restrictions and the state-parameter alternative), <https://learn.microsoft.com/entra/identity-platform/reply-url> (accessed Nov 11, 2026).
[^b18aA-dangling]: Microsoft Learn, "Prevent dangling DNS entries and avoid subdomain takeover," sections "Identify dangling DNS entries" and "Remediate dangling DNS entries," <https://learn.microsoft.com/azure/security/fundamentals/subdomain-takeover> (accessed Nov 11, 2026).
[^b18aA-props]: Microsoft Learn, "Properties of an enterprise application," section "Assignment required," <https://learn.microsoft.com/entra/identity/enterprise-apps/application-properties> (accessed Nov 11, 2026).
[^b18aA-assign]: Microsoft Learn, "Restrict a Microsoft Entra app to a set of users" (assigning client apps to a resource app is API-only; `Update-MgServicePrincipal -AppRoleAssignmentRequired:$true`; user consent isn't allowed when assignment is required), <https://learn.microsoft.com/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users> (accessed Nov 11, 2026).
[^b18aA-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5 (release 5.2.0), read from NIST's OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026).
