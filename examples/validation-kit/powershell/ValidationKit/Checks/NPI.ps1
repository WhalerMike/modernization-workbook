<#
.SYNOPSIS
    Non-person identity track: VK-NPI-01 to VK-NPI-08. Read-only.
    Sources: Attribute-Driven Migration guide, "Non-person identity track"; Book 02, Chapter 09
    (governing service principals) and Chapter 10 (Phase 4); Book 17, Chapters 04 to 06.
#>

$script:VkMicrosoftTenants = @('f8cdef31-a31e-4b4a-93e4-5f571e91255a', '72f988bf-86f1-41af-91ab-2d7cd011db47')
$script:VkGraphAppId = '00000003-0000-0000-c000-000000000000'
# Built-in Azure role definition IDs (Azure built-in roles reference).
$script:VkBroadAzureRoles = @{
    '8e3af657-a8ff-443c-a75c-2fe8c4bcb635' = 'Owner'
    'b24988ac-6180-42a0-ab88-20f7382dd24c' = 'Contributor'
    '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9' = 'User Access Administrator'
}

function Get-VkTenantId {
    # Live, the signed-in tenant from Get-MgContext (no extra permission); fixtures, tenant.json.
    param($Context)
    if ($Context.Mode -eq 'Fixture') { return "$(Get-VkValue (Get-VkData -Context $Context -Name 'tenant' -Single) 'tenantId')" }
    "$((Get-MgContext).TenantId)"
}

function Get-VkApplications {
    param($Context)
    # Permission: Application.Read.All.
    @(Get-VkData -Context $Context -Name 'applications' -Uri '/v1.0/applications?$select=id,appId,displayName,signInAudience,passwordCredentials,keyCredentials&$expand=owners($select=id)&$top=999')
}

function Get-VkServicePrincipals {
    param($Context)
    @(Get-VkData -Context $Context -Name 'servicePrincipals' -Uri '/v1.0/servicePrincipals?$select=id,appId,displayName,servicePrincipalType,appOwnerOrganizationId,accountEnabled&$expand=owners($select=id)&$top=999')
}

function Get-VkOwnTenantServicePrincipals {
    # Application-type service principals registered in this tenant (not Microsoft's, not other tenants').
    param($Context)
    $tenant = Get-VkTenantId $Context
    @(Get-VkServicePrincipals $Context | Where-Object { $_.servicePrincipalType -eq 'Application' -and "$($_.appOwnerOrganizationId)" -ieq $tenant })
}

function Get-VkHumanOwnerCount {
    # Owners that are users. A service principal owner isn't a human owner (Book 02, Chapter 09).
    param($Object)
    @(Get-VkValue $Object 'owners' @() | Where-Object { "$(Get-VkValue $_ '@odata.type' '#microsoft.graph.user')" -eq '#microsoft.graph.user' }).Count
}

function Invoke-VkNpi01 {
    <#
    .SYNOPSIS
        Implements VK-NPI-01: lists app registrations and this tenant's service principals with
        fewer than MinOwners (default 2) human owners.
    .EXAMPLE
        # From the kit folder: against the fictional "fail" fixture tenant (no sign-in).
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi01 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-NPI-01. Application registrations and this tenant's service principals with fewer than MinOwners human owners. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-01' $Context {
        param($Context)
        $min = [int]$Context.Options['MinOwners']
        $rows = [System.Collections.Generic.List[object]]::new()
        foreach ($a in Get-VkApplications $Context) {
            $n = Get-VkHumanOwnerCount $a
            if ($n -lt $min) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $a.displayName -ObjectId $a.appId -Issue $(if ($n -eq 0) { 'App registration with no owner' } else { "App registration with $n owner(s), fewer than $min" }) -Data ([ordered]@{ ObjectType = 'Application'; Owners = $n }))) }
        }
        foreach ($s in Get-VkOwnTenantServicePrincipals $Context) {
            $n = Get-VkHumanOwnerCount $s
            if ($n -lt $min) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $s.displayName -ObjectId $s.appId -Issue $(if ($n -eq 0) { 'Service principal with no owner' } else { "Service principal with $n owner(s), fewer than $min" }) -Data ([ordered]@{ ObjectType = 'ServicePrincipal'; Owners = $n }))) }
        }
        Get-VkOutcome -Rows $rows.ToArray() -Message ('Minimum human owners: {0}' -f $min)
    }
}

function Invoke-VkNpi02 {
    <#
    .SYNOPSIS
        Implements VK-NPI-02: lists client secrets and certificates that have expired or expire
        within ExpiringDays, and those valid longer than MaxSecretDays or MaxCertificateDays.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -Option @{ ExpiringDays = 30 }
        Invoke-VkNpi02 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-NPI-02. Secrets and certificates expiring within ExpiringDays (or expired), and lifetimes over MaxSecretDays or MaxCertificateDays. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-02' $Context {
        param($Context)
        $exp = [int]$Context.Options['ExpiringDays']
        $rows = foreach ($a in Get-VkApplications $Context) {
            foreach ($set in @(
                    @{ Kind = 'Secret'; Creds = @(Get-VkValue $a 'passwordCredentials' @()); Max = [int]$Context.Options['MaxSecretDays'] },
                    @{ Kind = 'Certificate'; Creds = @(Get-VkValue $a 'keyCredentials' @()); Max = [int]$Context.Options['MaxCertificateDays'] })) {
                foreach ($c in $set.Creds) {
                    if ($null -eq $c) { continue }
                    $start = ConvertTo-VkUtc (Get-VkValue $c 'startDateTime'); $end = ConvertTo-VkUtc (Get-VkValue $c 'endDateTime')
                    $issues = @()
                    $left = $null; $life = $null
                    if ($end) { $left = Get-VkDays $Context.AsOf $end }
                    if ($start -and $end) { $life = Get-VkDays $start $end }
                    if ($null -ne $left -and $left -lt 0) { $issues += 'Expired' }
                    elseif ($null -ne $left -and $left -le $exp) { $issues += "Expires in $left days" }
                    if ($null -ne $life -and $life -gt $set.Max) { $issues += "Valid for $life days, over the $($set.Max)-day maximum" }
                    if ($issues.Count -gt 0) {
                        ConvertTo-VkFinding -Severity Finding -Object $a.displayName -ObjectId $a.appId -Issue ($issues -join '; ') -Data ([ordered]@{ Kind = $set.Kind; KeyId = (Get-VkValue $c 'keyId'); End = (Format-VkUtc $end); LifetimeDays = $life })
                    }
                }
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('Expiring window {0} days; maximum lifetime {1} days (secrets), {2} days (certificates)' -f $exp, $Context.Options['MaxSecretDays'], $Context.Options['MaxCertificateDays'])
    }
}

function Invoke-VkNpi03 {
    <#
    .SYNOPSIS
        Implements VK-NPI-03: lists apps that hold a client secret, unless secret-exceptions.csv
        records why the app must keep one.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi03 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-03. Apps holding client secrets. Whether a certificate or federated credential is
    possible is a judgment the kit can't make, so every app with a secret is listed unless
    secret-exceptions.csv (AppId, Reason) records why it must keep one. An app that already has
    a certificate or federated credential besides its secret is noted: its secret is likely
    removable.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-03' $Context {
        param($Context)
        $exc = @{}
        foreach ($r in (Read-VkInputCsv -Context $Context -Option 'SecretExceptionsFile')) { if (-not (Test-VkBlank $r.Reason)) { $exc["$($r.AppId)".ToLowerInvariant()] = $r.Reason } }
        $rows = foreach ($a in Get-VkApplications $Context) {
            $secrets = @(Get-VkValue $a 'passwordCredentials' @() | Where-Object { $_ })
            if ($secrets.Count -eq 0) { continue }
            $reason = $exc["$($a.appId)".ToLowerInvariant()]
            if ($reason) {
                ConvertTo-VkFinding -Severity Info -Object $a.displayName -ObjectId $a.appId -Issue 'Secret kept by recorded exception' -Data ([ordered]@{ Reason = $reason })
                continue
            }
            $fic = @(Get-VkData -Context $Context -Name 'federatedIdentityCredentials' -Key $a.id -Uri "/v1.0/applications/$($a.id)/federatedIdentityCredentials")
            $certs = @(Get-VkValue $a 'keyCredentials' @() | Where-Object { $_ }).Count
            ConvertTo-VkFinding -Severity Finding -Object $a.displayName -ObjectId $a.appId -Issue 'App uses a client secret; move it to a managed identity, a federated credential or a certificate' -Data ([ordered]@{ Secrets = $secrets.Count; Certificates = $certs; FederatedCredentials = $fic.Count })
        }
        Get-VkOutcome -Rows @($rows)
    }
}

function Invoke-VkNpi04 {
    <#
    .SYNOPSIS
        Implements VK-NPI-04: lists single-tenant service principals that no enabled Conditional
        Access policy for workload identities includes, or that one excludes.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi04 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-04. Single-tenant service principals (registered here, sign-in audience AzureADMyOrg)
    that no enabled Conditional Access policy for workload identities includes, or that one
    excludes. Policies apply only when the service principal is assigned directly or through
    ServicePrincipalsInMyTenant; managed identities aren't covered and aren't counted here.
    Workload ID Premium is required for these policies.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-04' $Context {
        param($Context)
        # Permission: Policy.Read.All.
        $policies = @(Get-VkData -Context $Context -Name 'caPolicies' -Uri '/v1.0/identity/conditionalAccess/policies' | Where-Object { $_.state -eq 'enabled' })
        $audience = @{}
        foreach ($a in Get-VkApplications $Context) { $audience["$($a.appId)".ToLowerInvariant()] = "$($a.signInAudience)" }
        $sps = @(Get-VkOwnTenantServicePrincipals $Context | Where-Object { $aud = $audience["$($_.appId)".ToLowerInvariant()]; (Test-VkBlank $aud) -or $aud -eq 'AzureADMyOrg' })
        $include = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        $exclude = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        $all = $false
        foreach ($p in $policies) {
            $ca = Get-VkValue (Get-VkValue $p 'conditions') 'clientApplications'
            foreach ($i in @(Get-VkValue $ca 'includeServicePrincipals' @())) { if ("$i" -eq 'ServicePrincipalsInMyTenant') { $all = $true } elseif ($i) { [void]$include.Add("$i") } }
            foreach ($e in @(Get-VkValue $ca 'excludeServicePrincipals' @())) { if ($e) { [void]$exclude.Add("$e") } }
        }
        $rows = foreach ($s in $sps) {
            $covered = ($all -or $include.Contains("$($s.id)")) -and -not $exclude.Contains("$($s.id)")
            if (-not $covered) {
                $why = 'Not included in any enabled policy for workload identities'
                if ($exclude.Contains("$($s.id)")) { $why = 'Excluded from the enabled policies for workload identities' }
                ConvertTo-VkFinding -Severity Finding -Object $s.displayName -ObjectId $s.id -Issue $why -Data ([ordered]@{ AppId = $s.appId })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} single-tenant service principal(s); {1} enabled policy(ies) read' -f $sps.Count, $policies.Count)
    }
}

function Invoke-VkNpi05 {
    <#
    .SYNOPSIS
        Implements VK-NPI-05: lists service principals holding a high-privilege Microsoft Graph
        application permission or any Entra directory role, as Warn rows for a least-privilege review.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi05 -Context $ctx | Select-Object -ExpandProperty Details
    .DESCRIPTION
    #>
    <#
    VK-NPI-05. Service principals holding a Microsoft Graph application permission on the
    high-privilege list (config/high-privilege-graph-roles.json), or any Entra directory role.
    A review list: each row is Warn. Permissions: Application.Read.All for appRoleAssignedTo,
    RoleManagement.Read.Directory for role assignments.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-05' $Context {
        param($Context)
        $high = @(Read-VkInputJson -Context $Context -Option 'HighPrivilegeRolesFile')
        $graph = Get-VkData -Context $Context -Name 'graphServicePrincipal' -Single -Uri "/v1.0/servicePrincipals(appId='$script:VkGraphAppId')?`$select=id,appRoles"
        $roleNames = @{}
        foreach ($r in @(Get-VkValue $graph 'appRoles' @())) { $roleNames["$($r.id)"] = "$($r.value)" }
        $sps = @{}
        foreach ($s in Get-VkServicePrincipals $Context) { $sps["$($s.id)"] = $s }
        $hits = [ordered]@{}
        foreach ($a in @(Get-VkData -Context $Context -Name 'graphAppRoleAssignments' -Uri "/v1.0/servicePrincipals/$($graph.id)/appRoleAssignedTo?`$top=999")) {
            if ("$($a.principalType)" -ne 'ServicePrincipal') { continue }
            $value = $roleNames["$($a.appRoleId)"]
            if ($high -notcontains $value) { continue }
            $k = "$($a.principalId)"
            if (-not $hits.Contains($k)) { $hits[$k] = [System.Collections.Generic.List[string]]::new() }
            $hits[$k].Add("Graph:$value")
        }
        $defs = @{}
        foreach ($d in @(Get-VkData -Context $Context -Name 'directoryRoleDefinitions' -Uri '/v1.0/roleManagement/directory/roleDefinitions?$select=id,displayName')) { $defs["$($d.id)"] = "$($d.displayName)" }
        foreach ($ra in @(Get-VkData -Context $Context -Name 'directoryRoleAssignments' -Uri '/v1.0/roleManagement/directory/roleAssignments?$select=id,principalId,roleDefinitionId,directoryScopeId')) {
            $k = "$($ra.principalId)"
            if (-not $sps.ContainsKey($k)) { continue }
            if (-not $hits.Contains($k)) { $hits[$k] = [System.Collections.Generic.List[string]]::new() }
            $hits[$k].Add("DirectoryRole:$(Get-VkValue $defs "$($ra.roleDefinitionId)" $ra.roleDefinitionId)")
        }
        $rows = foreach ($k in $hits.Keys) {
            $s = $sps[$k]
            ConvertTo-VkFinding -Severity Warn -Object $(if ($s) { $s.displayName } else { $k }) -ObjectId $k -Issue 'High-privilege access: review for least privilege' -Data ([ordered]@{ Grants = @($hits[$k]); Type = $(if ($s) { $s.servicePrincipalType } else { 'unknown' }) })
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} Graph permission(s) on the high-privilege list' -f $high.Count)
    }
}

function Invoke-VkNpi06 {
    <#
    .SYNOPSIS
        Implements VK-NPI-06: lists AD service accounts that are user objects rather than gMSAs or
        dMSAs, flagging passwords that never expire, passwords older than MaxPasswordAgeDays, and SPNs.
    .EXAMPLE
        # In fixture mode it reads adServiceAccounts.json; live, it reads AD unless -SkipAD.
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi06 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-06. AD accounts used as service accounts (a servicePrincipalName, or a name starting
    with ServiceAccountNameHint) that are user objects rather than gMSAs or dMSAs, with their
    flags: password never expires, password older than MaxPasswordAgeDays, SPNs. Live, this is
    one read-only Get-ADUser and one Get-ADServiceAccount; skip it with -SkipAD.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-06' $Context {
        param($Context)
        if ($Context.Mode -eq 'Live' -and $Context.SkipAD) { return Get-VkNotApplicable 'Skipped (-SkipAD); supply an adServiceAccounts.json export with -FixturePath to evaluate one' }
        $hint = "$($Context.Options['ServiceAccountNameHint'])"
        $accounts = @(Get-VkData -Context $Context -Name 'adServiceAccounts' -Source ActiveDirectory -Uri "Get-ADUser -LDAPFilter '(|(servicePrincipalName=*)(sAMAccountName=$hint*))'; Get-ADServiceAccount -Filter *" -Reader {
                $props = 'servicePrincipalName', 'PasswordNeverExpires', 'PasswordLastSet', 'Enabled', 'objectClass'
                foreach ($u in @(Get-ADUser -LDAPFilter "(|(servicePrincipalName=*)(sAMAccountName=$hint*))" -Properties $props)) {
                    if ($u.SamAccountName -eq 'krbtgt') { continue }
                    [pscustomobject]@{ SamAccountName = $u.SamAccountName; ObjectClass = 'user'; Enabled = $u.Enabled; PasswordNeverExpires = $u.PasswordNeverExpires; PasswordLastSet = $u.PasswordLastSet; ServicePrincipalName = @($u.servicePrincipalName) }
                }
                foreach ($m in @(Get-ADServiceAccount -Filter * -Properties objectClass)) {
                    [pscustomobject]@{ SamAccountName = $m.SamAccountName; ObjectClass = "$(@($m.objectClass)[-1])"; Enabled = $m.Enabled; PasswordNeverExpires = $false; PasswordLastSet = $null; ServicePrincipalName = @() }
                }
            })
        if ($accounts.Count -eq 0) { return Get-VkNotApplicable 'No service accounts found' }
        $maxAge = [int]$Context.Options['MaxPasswordAgeDays']
        $rows = foreach ($a in $accounts) {
            if ("$($a.ObjectClass)" -ne 'user') {
                ConvertTo-VkFinding -Severity Info -Object $a.SamAccountName -Issue 'Managed service account' -Data ([ordered]@{ ObjectClass = $a.ObjectClass })
                continue
            }
            $flags = @('Not a gMSA')
            if ($a.PasswordNeverExpires) { $flags += 'Password never expires' }
            $set = ConvertTo-VkUtc $a.PasswordLastSet
            if ($null -eq $set) { $flags += 'Password last set unknown' }
            elseif ((Get-VkDays $set $Context.AsOf) -gt $maxAge) { $flags += "Password $(Get-VkDays $set $Context.AsOf) days old" }
            $spn = @($a.ServicePrincipalName | Where-Object { $_ })
            if ($spn.Count -gt 0) { $flags += "$($spn.Count) SPN(s)" }
            ConvertTo-VkFinding -Severity Finding -Object $a.SamAccountName -Issue ($flags -join '; ') -Data ([ordered]@{ Enabled = $a.Enabled; SPNs = $spn })
        }
        Get-VkOutcome -Rows @($rows) -Message ('Name hint "{0}"; maximum password age {1} days' -f $hint, $maxAge)
    }
}

function Invoke-VkNpi07 {
    <#
    .SYNOPSIS
        Implements VK-NPI-07: inventories managed identities and their Azure role assignments;
        Owner, Contributor or User Access Administrator at subscription or management group scope
        is a Warn row for review.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi07 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-07. Managed identities (Graph) and their Azure role assignments (Resource Graph), as
    an inventory. Owner, Contributor or User Access Administrator at subscription or management
    group scope is a Warn row for review.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-07' $Context {
        param($Context)
        $mis = @(Get-VkData -Context $Context -Name 'managedIdentities' -Uri "/v1.0/servicePrincipals?`$filter=servicePrincipalType eq 'ManagedIdentity'&`$select=id,appId,displayName,alternativeNames&`$top=999")
        if ($mis.Count -eq 0) { return Get-VkNotApplicable 'No managed identities' }
        $ras = @(Get-VkData -Context $Context -Name 'azureRoleAssignments' -Source ResourceGraph -Uri "authorizationresources | where type =~ 'microsoft.authorization/roleassignments' | project principalId = tostring(properties.principalId), roleDefinitionId = tostring(properties.roleDefinitionId), scope = tostring(properties.scope)")
        $rows = foreach ($mi in $mis) {
            $mine = @($ras | Where-Object { "$($_.principalId)" -ieq "$($mi.id)" })
            $roles = @($mine | ForEach-Object {
                    $rid = ("$($_.roleDefinitionId)" -split '/')[-1]
                    $name = Get-VkValue $script:VkBroadAzureRoles $rid $rid
                    "$name@$($_.scope)"
                })
            $broad = @($mine | Where-Object {
                    $script:VkBroadAzureRoles.ContainsKey(("$($_.roleDefinitionId)" -split '/')[-1]) -and
                    ("$($_.scope)" -match '^/subscriptions/[^/]+/?$' -or "$($_.scope)" -match '(?i)^/providers/Microsoft\.Management/managementGroups/')
                })
            $sev = 'Info'; $issue = 'Managed identity'
            if ($broad.Count -gt 0) { $sev = 'Warn'; $issue = 'Managed identity with a broad role at subscription or management group scope' }
            ConvertTo-VkFinding -Severity $sev -Object $mi.displayName -ObjectId $mi.id -Issue $issue -Data ([ordered]@{ Resource = (@(Get-VkValue $mi 'alternativeNames' @()) | Where-Object { "$_" -like '/subscriptions/*' } | Select-Object -First 1); Roles = $roles })
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} managed identity(ies), {1} role assignment(s) read' -f $mis.Count, $ras.Count)
    }
}

function Invoke-VkNpi08 {
    <#
    .SYNOPSIS
        Implements VK-NPI-08: lists agent identities (Microsoft Entra Agent ID) with no sponsor.
        NotApplicable when the tenant exposes no agent identities.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi08 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-08. Agent identities (Microsoft Entra Agent ID) with no sponsor. The list needs
    AgentIdentity.Read.All; Learn lists only AgentIdentity.ReadWrite.All (application) for the
    per-agent sponsors call, so the kit doesn't request it: it asks for sponsors through $expand
    on the list, and if the tenant doesn't return them the row says the sponsor wasn't readable.
    NotApplicable when the tenant exposes no agent identities.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-08' $Context {
        param($Context)
        $agents = Get-VkData -Context $Context -Name 'agentIdentities' -Optional -Uri '/v1.0/servicePrincipals/microsoft.graph.agentIdentity?$select=id,displayName,accountEnabled&$expand=sponsors($select=id)'
        if ($null -eq $agents -or @($agents).Count -eq 0) { return Get-VkNotApplicable 'No agent identities exposed by this tenant (or the Agent ID endpoint is not available in its cloud)' }
        $rows = foreach ($a in @($agents)) {
            $p = $a.PSObject.Properties['sponsors']
            if (-not $p) {
                ConvertTo-VkFinding -Severity Warn -Object $a.displayName -ObjectId $a.id -Issue 'Sponsor not readable with the kit''s read permission; confirm in the admin center'
            } elseif (@($p.Value | Where-Object { $_ }).Count -eq 0) {
                ConvertTo-VkFinding -Severity Finding -Object $a.displayName -ObjectId $a.id -Issue 'Agent identity with no sponsor'
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} agent identity(ies)' -f @($agents).Count)
    }
}

function Invoke-VkNpi09 {
    <#
    .SYNOPSIS
        Implements VK-NPI-09 (optional, preview): lists this tenant's application service
        principals with no sign-in in SpInactiveDays days, from Graph's beta sign-in activity report.
        NotApplicable without -IncludePreview, and in GCC High and DoD.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -IncludePreview
        Invoke-VkNpi09 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-09 (optional, preview). This tenant's application service principals with no sign-in,
    as client or resource, delegated or app-only, in SpInactiveDays days, from Graph's beta
    servicePrincipalSignInActivities report (AuditLog.Read.All; Reports Reader). Runs only with
    -IncludePreview. Learn documents the report for the global service, which GCC uses, but not
    for US Government L4 or L5.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-09' $Context {
        param($Context)
        if (-not $Context.IncludePreview) { return Get-VkNotApplicable 'Optional preview check: run with -IncludePreview' }
        if (@('gcchigh', 'dod') -contains $Context.Cloud) { return Get-VkNotApplicable 'The service principal sign-in activity report is not documented for US Government L4 or L5' }
        $days = [int]$Context.Options['SpInactiveDays']
        $acts = @{}
        foreach ($a in @(Get-VkData -Context $Context -Name 'spSignInActivities' -Uri '/beta/reports/servicePrincipalSignInActivities?$top=999')) {
            $acts["$($a.appId)".ToLowerInvariant()] = ConvertTo-VkUtc (Get-VkValue (Get-VkValue $a 'lastSignInActivity') 'lastSignInDateTime')
        }
        $rows = foreach ($s in Get-VkOwnTenantServicePrincipals $Context) {
            $last = $acts["$($s.appId)".ToLowerInvariant()]
            if ($null -eq $last) {
                ConvertTo-VkFinding -Severity Finding -Object $s.displayName -ObjectId $s.appId -Issue 'No sign-in activity recorded' -Data ([ordered]@{ LastSignIn = 'none' })
            } elseif ((Get-VkDays $last $Context.AsOf) -gt $days) {
                ConvertTo-VkFinding -Severity Finding -Object $s.displayName -ObjectId $s.appId -Issue "No sign-in in more than $days days" -Data ([ordered]@{ LastSignIn = (Format-VkUtc $last); DaysIdle = (Get-VkDays $last $Context.AsOf) })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('Microsoft Graph beta report; inactivity threshold {0} days' -f $days)
    }
}
