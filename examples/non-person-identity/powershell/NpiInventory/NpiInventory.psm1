#Requires -Version 7.1
<#
    NpiInventory: Chapter 01 of the developer workbook "Building Non-Person Identity".

    One register of every non-person identity: Active Directory user accounts used as service
    accounts, MSAs, gMSAs and dMSAs; app registrations, service principals, managed identities and
    their federated credentials; Microsoft Graph application permissions and delegated consent
    grants. Each row gets an owner count, its credential kind, a risk, a candidate target from
    Book 02's migration path matrix, a stale lead that is never acted on, and SQL Server accounts
    are tagged for the Data Platform plan. Read only: GET and Get-AD* through NpiCore's reader.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:AdUserProperties = @(
    'SamAccountName', 'UserPrincipalName', 'Description', 'Enabled', 'PasswordNeverExpires', 'PasswordLastSet', 'LastLogonDate',
    'ServicePrincipalName', 'MemberOf', 'TrustedForDelegation', 'TrustedToAuthForDelegation', 'msDS-AllowedToDelegateTo', 'userAccountControl', 'ObjectGUID'
)
$script:AdServiceAccountProperties = @(
    'Enabled', 'ObjectClass', 'ServicePrincipalName', 'MemberOf', 'PrincipalsAllowedToRetrieveManagedPassword', 'HostComputers', 'LastLogonDate', 'ObjectGUID'
)
$script:StaleNote = 'Lead only: confirm against domain controller and Entra sign-in logs before any change. This run retires nothing.'

function Get-NpiRegisterConfig {
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'register.json'))
    $c = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    $c['_path'] = (Resolve-Path -LiteralPath $Path).Path
    $c
}

function Get-NpiServiceUserLdapFilter {
    <#
    The one LDAP query for user objects that may be service accounts: Learn's three criteria (an
    SPN; trusted for delegation, constrained or not; a password that never expires) plus the naming
    convention and description Learn recommends. userAccountControl bits as in Learn's sample:
    0x10000 DONT_EXPIRE_PASSWORD, 0x80000 TRUSTED_FOR_DELEGATION, 0x1000000 TRUSTED_TO_AUTH_FOR_DELEGATION.
    #>
    param($Config = (Get-NpiRegisterConfig))
    $names = ($Config.namingPatterns | ForEach-Object { "(sAMAccountName=$_)" }) -join ''
    '(&(objectCategory=person)(objectClass=user)(|(servicePrincipalName=*)(msDS-AllowedToDelegateTo=*)' +
    '(userAccountControl:1.2.840.113556.1.4.803:=65536)(userAccountControl:1.2.840.113556.1.4.803:=524288)' +
    "(userAccountControl:1.2.840.113556.1.4.803:=16777216)$names(description=$($Config.descriptionPattern))))"
}

function Get-NpiValue { param($Hash, [string]$Key) if ($Hash -is [hashtable] -and $Hash.ContainsKey($Key)) { $Hash[$Key] } else { $null } }

function Join-NpiList { param($Items) (@($Items | Where-Object { $null -ne $_ -and "$_" -ne '' }) -join '; ') }

function Get-NpiDataPlatformMatch {
    param([string]$Name, [string[]]$Spns, $Config)
    foreach ($s in $Spns) { foreach ($p in $Config.dataPlatform.spnPrefixes) { if ($s -like "$p*") { return "SPN $s" } } }
    foreach ($p in $Config.dataPlatform.namePatterns) { if ($Name -like $p) { return "name matches $p" } }
    $null
}

function New-NpiRow {
    # Every row has the same columns, so the register writes to one CSV.
    param([hashtable]$Values)
    $row = [ordered]@{
        IdentityId = $null; Source = $null; Type = $null; Name = $null; ObjectId = $null; AppId = $null; Enabled = $null
        DetectedBy = ''; WorkloadLocation = ''; Hosts = ''
        PasswordNeverExpires = $null; PasswordAgeDays = $null; LastLogon = $null; StaleLead = $false; StaleNote = ''
        SpnCount = 0; Spns = ''; Delegation = 'None'; PrivilegedGroups = ''
        HomeTenant = ''; SignInAudience = ''; OwnerCount = $null; OwnerIds = ''; OwnerTypes = ''; ServiceManagementReference = ''
        Secrets = 0; Certificates = 0; ExpiredCredentials = 0; NextCredentialExpiry = ''; CredentialKind = ''
        FederatedCredentials = 0; FederatedSubjects = ''; GraphAppRoles = ''; HighPrivilegeAppRoles = ''
        DelegatedGrants = 0; TenantWideConsent = $false
        Risk = ''; RiskReasons = ''; CandidateTarget = ''; Handoff = ''; Note = ''
    }
    foreach ($k in $Values.Keys) {
        if (-not $row.Contains($k)) { throw "Unknown register column '$k'" }
        $row[$k] = $Values[$k]
    }
    [pscustomobject]$row
}

# ----------------------------------------------------------------------------- Active Directory

function Get-NpiAdServiceAccount {
    <#
    .SYNOPSIS
        The Active Directory side of the register: one Get-ADUser LDAP query for user accounts that
        match any of Learn's criteria or the naming convention, and one Get-ADServiceAccount for
        MSAs, gMSAs and dMSAs. Computer accounts aren't read (research gaps, row 8).
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][datetime]$AsOf, $Config = (Get-NpiRegisterConfig))
    $rows = [Collections.Generic.List[object]]::new()
    $privileged = @($Config.privilegedAdGroups)
    $privOf = { param($memberOf) @(@($memberOf) | ForEach-Object { if ("$_" -match '^CN=([^,]+),') { $Matches[1] } } | Where-Object { $_ -in $privileged }) }

    $users = Invoke-NpiAdRead -Reader $Reader -CallId 'ad-service-users' -Params @{ LDAPFilter = (Get-NpiServiceUserLdapFilter -Config $Config); Properties = $script:AdUserProperties }
    foreach ($u in $users) {
        $spns = @($u.ServicePrincipalName | Where-Object { $_ })
        $named = $false; foreach ($p in $Config.namingPatterns) { if ($u.SamAccountName -like $p) { $named = $true } }
        $described = [bool]($u.Description -and $u.Description -like $Config.descriptionPattern)
        $deleg = if ($u.TrustedForDelegation) { 'Unconstrained' } elseif ($u.TrustedToAuthForDelegation) { 'ProtocolTransition' } elseif (@($u.'msDS-AllowedToDelegateTo' | Where-Object { $_ }).Count) { 'Constrained' } else { 'None' }
        $detected = @()
        if ($spns.Count) { $detected += 'Spn' }
        if ($deleg -ne 'None') { $detected += 'Delegation' }
        if ($u.PasswordNeverExpires) { $detected += 'PasswordNeverExpires' }
        if ($named -or $described) { $detected += 'Naming' }
        $age = if ($u.PasswordLastSet) { [int][Math]::Floor(($AsOf - $u.PasswordLastSet).TotalDays) } else { -1 }
        $stale = [bool]($u.Enabled -and (-not $u.LastLogonDate -or ($AsOf - $u.LastLogonDate).TotalDays -gt $Config.staleDays))
        $rows.Add((New-NpiRow @{
                    IdentityId = "ad:$($u.ObjectGUID)"; Source = 'AD'; Type = 'Traditional'; Name = $u.SamAccountName; ObjectId = "$($u.ObjectGUID)"
                    Enabled = [bool]$u.Enabled; DetectedBy = (Join-NpiList $detected); WorkloadLocation = 'OnPremises'
                    PasswordNeverExpires = [bool]$u.PasswordNeverExpires; PasswordAgeDays = $age
                    LastLogon = if ($u.LastLogonDate) { $u.LastLogonDate.ToString('yyyy-MM-dd') } else { '' }
                    StaleLead = $stale; StaleNote = if ($stale) { $script:StaleNote } else { '' }
                    SpnCount = $spns.Count; Spns = (Join-NpiList $spns); Delegation = $deleg; PrivilegedGroups = (Join-NpiList (& $privOf $u.MemberOf))
                    CredentialKind = 'Password'
                    Note = if ($detected.Count -eq 1 -and $detected[0] -eq 'PasswordNeverExpires') { 'Detected only by a password that never expires: may be a person; confirm it is a service account' } else { '' }
                }))
    }

    $msas = Invoke-NpiAdRead -Reader $Reader -CallId 'ad-managed-service-accounts' -Params @{ Filter = '*'; Properties = $script:AdServiceAccountProperties }
    foreach ($m in $msas) {
        $type = switch ($m.ObjectClass) {
            'msDS-ManagedServiceAccount' { 'MSA' }
            'msDS-GroupManagedServiceAccount' { 'gMSA' }
            'msDS-DelegatedManagedServiceAccount' { 'dMSA' }
            default { 'UnknownServiceAccount' }
        }
        $spns = @($m.ServicePrincipalName | Where-Object { $_ })
        $hosts = @(@(Get-NpiPropertyValue $m 'PrincipalsAllowedToRetrieveManagedPassword') + @(Get-NpiPropertyValue $m 'HostComputers') | ForEach-Object { if ("$_" -match '^CN=([^,]+),') { $Matches[1] } else { "$_" } } | Sort-Object -Unique)
        $rows.Add((New-NpiRow @{
                    IdentityId = "ad:$($m.ObjectGUID)"; Source = 'AD'; Type = $type; Name = $m.SamAccountName; ObjectId = "$($m.ObjectGUID)"
                    Enabled = [bool]$m.Enabled; DetectedBy = 'ManagedServiceAccount'; WorkloadLocation = 'OnPremises'; Hosts = (Join-NpiList $hosts)
                    PasswordNeverExpires = $false; SpnCount = $spns.Count; Spns = (Join-NpiList $spns)
                    PrivilegedGroups = (Join-NpiList (& $privOf $m.MemberOf)); CredentialKind = 'ManagedByAD'
                    LastLogon = if ($m.LastLogonDate) { $m.LastLogonDate.ToString('yyyy-MM-dd') } else { '' }
                    Note = if ($type -eq 'UnknownServiceAccount') { "Object class $($m.ObjectClass) isn't one the register classifies" } else { '' }
                }))
    }
    $rows.ToArray()
}

function Get-NpiPropertyValue { param($Object, [string]$Name) if ($Object.PSObject.Properties[$Name]) { $Object.$Name } else { $null } }

# ----------------------------------------------------------------------------- Microsoft Entra

function Get-NpiCredentialSummary {
    param($Passwords, $Keys, [datetime]$AsOf)
    $pw = @($Passwords | Where-Object { $_ }); $kc = @($Keys | Where-Object { $_ })
    $ends = @(@($pw) + @($kc) | ForEach-Object { if ($_.endDateTime) { [datetime]::Parse($_.endDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } })
    $expired = @($ends | Where-Object { $_ -lt $AsOf }).Count
    $next = @($ends | Where-Object { $_ -ge $AsOf } | Sort-Object | Select-Object -First 1)
    [pscustomobject]@{
        Secrets = $pw.Count; Certificates = $kc.Count; Expired = $expired
        Next = if ($next.Count) { $next[0].ToString('yyyy-MM-dd') } else { '' }
        Kind = if ($pw.Count -and $kc.Count) { 'SecretAndCertificate' } elseif ($pw.Count) { 'Secret' } elseif ($kc.Count) { 'Certificate' } else { 'None' }
    }
}

function Get-NpiOwnerSummary {
    param([object[]]$Owners)
    $Owners = @($Owners | Where-Object { $null -ne $_ })
    $types = @($Owners | ForEach-Object {
            switch (Get-NpiValue $_ '@odata.type') {
                '#microsoft.graph.user' { 'user' }
                '#microsoft.graph.servicePrincipal' { 'servicePrincipal' }
                default { 'unknown' }
            }
        })
    [pscustomobject]@{ Count = $Owners.Count; Ids = (Join-NpiList ($Owners | ForEach-Object { $_.id })); Types = (Join-NpiList $types) }
}

function Get-NpiEntraWorkloadIdentity {
    <#
    .SYNOPSIS
        The Microsoft Entra side of the register: app registrations with owners and federated
        credentials, every service principal by type, managed identities (user-assigned ones with
        their federated credentials from Resource Manager), Microsoft Graph application permissions
        and delegated consent grants.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][datetime]$AsOf, $Config = (Get-NpiRegisterConfig), [switch]$SkipAzure)
    $rows = [Collections.Generic.List[object]]::new()
    $highPriv = @($Config.highPrivilegeGraphAppRoles)

    # Microsoft Graph's application permissions held by each service principal, by name.
    $graphSp = Invoke-NpiGetOne -Reader $Reader -CallId 'graph-resource-sp' -Bind @{ appId = $Config.microsoftGraphAppId } -Query '$select=id,appId,appRoles'
    $roleName = @{}; foreach ($r in @($graphSp.appRoles)) { $roleName[$r.id] = $r.value }
    $assigned = Invoke-NpiList -Reader $Reader -CallId 'graph-app-role-assigned-to' -Bind @{ id = $graphSp.id }
    $rolesBySp = @{}
    foreach ($a in $assigned) {
        if ($a.principalType -ne 'ServicePrincipal') { continue }
        $n = if ($roleName.ContainsKey($a.appRoleId)) { $roleName[$a.appRoleId] } else { "unknown:$($a.appRoleId)" }
        if (-not $rolesBySp.ContainsKey($a.principalId)) { $rolesBySp[$a.principalId] = [Collections.Generic.List[string]]::new() }
        $rolesBySp[$a.principalId].Add($n)
    }
    $grants = Invoke-NpiList -Reader $Reader -CallId 'graph-oauth2-grants'
    $grantsBySp = @{}
    foreach ($g in $grants) { if (-not $grantsBySp.ContainsKey($g.clientId)) { $grantsBySp[$g.clientId] = [Collections.Generic.List[object]]::new() }; $grantsBySp[$g.clientId].Add($g) }

    $permCols = {
        param([string]$SpId)
        $roles = @(if ($SpId -and $rolesBySp.ContainsKey($SpId)) { $rolesBySp[$SpId] | Sort-Object -Unique })
        $gs = @(if ($SpId -and $grantsBySp.ContainsKey($SpId)) { $grantsBySp[$SpId] })
        @{
            GraphAppRoles = (Join-NpiList $roles); HighPrivilegeAppRoles = (Join-NpiList ($roles | Where-Object { $_ -in $highPriv }))
            DelegatedGrants = $gs.Count; TenantWideConsent = [bool](@($gs | Where-Object { $_.consentType -eq 'AllPrincipals' }).Count)
        }
    }

    $sps = Invoke-NpiList -Reader $Reader -CallId 'graph-service-principals' -Query '$select=id,appId,displayName,servicePrincipalType,appOwnerOrganizationId,accountEnabled,alternativeNames,passwordCredentials,keyCredentials,signInAudience'
    $spByAppId = @{}; foreach ($sp in $sps) { if ($sp.appId) { $spByAppId[$sp.appId] = $sp } }

    $apps = Invoke-NpiList -Reader $Reader -CallId 'graph-applications' -Query '$select=id,appId,displayName,signInAudience,passwordCredentials,keyCredentials,serviceManagementReference'
    foreach ($app in $apps) {
        $owners = Get-NpiOwnerSummary (Invoke-NpiList -Reader $Reader -CallId 'graph-application-owners' -Bind @{ id = $app.id } -Query '$select=id')
        $fics = @(Invoke-NpiList -Reader $Reader -CallId 'graph-application-fics' -Bind @{ id = $app.id })
        $cred = Get-NpiCredentialSummary $app.passwordCredentials $app.keyCredentials $AsOf
        $sp = if ($spByAppId.ContainsKey($app.appId)) { $spByAppId[$app.appId] } else { $null }
        # List applications also returns agent identity blueprints, marked by @odata.type (Learn).
        $isBlueprint = "$(Get-NpiValue $app '@odata.type')" -eq '#microsoft.graph.agentIdentityBlueprint'
        $values = @{
            IdentityId = "app:$($app.appId)"; Source = 'Entra'; Type = $(if ($isBlueprint) { 'AgentIdentityBlueprint' } else { 'AppRegistration' }); Name = $app.displayName; ObjectId = $app.id; AppId = $app.appId
            Note = $(if ($isBlueprint) { 'An agent identity blueprint; its sponsors and agent identities are read in Chapter 09' } else { '' })
            Enabled = if ($sp) { [bool]$sp.accountEnabled } else { $null }; HomeTenant = 'Own'; SignInAudience = "$($app.signInAudience)"
            OwnerCount = $owners.Count; OwnerIds = $owners.Ids; OwnerTypes = $owners.Types; ServiceManagementReference = "$(Get-NpiValue $app 'serviceManagementReference')"
            Secrets = $cred.Secrets; Certificates = $cred.Certificates; ExpiredCredentials = $cred.Expired; NextCredentialExpiry = $cred.Next
            CredentialKind = if ($fics.Count -and $cred.Kind -eq 'None') { 'Federated' } elseif ($fics.Count) { "$($cred.Kind)+Federated" } else { $cred.Kind }
            FederatedCredentials = $fics.Count; FederatedSubjects = (Join-NpiList ($fics | ForEach-Object { "$($_.issuer) | $($_.subject)" }))
        }
        foreach ($kv in (& $permCols $(if ($sp) { $sp.id } else { $null })).GetEnumerator()) { $values[$kv.Key] = $kv.Value }
        $rows.Add((New-NpiRow $values))
    }

    foreach ($sp in $sps) {
        if ($sp.appId -eq $Config.microsoftGraphAppId) { continue }
        $spType = "$($sp.servicePrincipalType)"
        $own = ("$(Get-NpiValue $sp 'appOwnerOrganizationId')" -eq $TenantId)
        $alt = @(Get-NpiValue $sp 'alternativeNames')
        $rid = @($alt | Where-Object { "$_" -like '/subscriptions/*' } | Select-Object -First 1)
        $values = @{ Source = 'Entra'; Name = $sp.displayName; ObjectId = $sp.id; AppId = $sp.appId; Enabled = [bool]$sp.accountEnabled; SignInAudience = "$(Get-NpiValue $sp 'signInAudience')" }
        switch ($spType) {
            'ManagedIdentity' {
                $user = [bool]($rid -and $rid[0] -match '/providers/Microsoft\.ManagedIdentity/userAssignedIdentities/[^/]+$')
                $values.IdentityId = "mi:$($sp.id)"; $values.Type = if ($user) { 'ManagedIdentityUserAssigned' } else { 'ManagedIdentitySystemAssigned' }
                $values.HomeTenant = 'Own'; $values.WorkloadLocation = 'Azure'; $values.Hosts = if ($rid) { "$($rid[0])" } else { '' }; $values.CredentialKind = 'ManagedByAzure'
                if ($user) {
                    if ($SkipAzure) { $values.Note = 'Federated credentials not read (-SkipAzure)' }
                    elseif ($rid[0] -notmatch '^/subscriptions/[0-9a-fA-F-]{36}/resourceGroups/[^/]+/providers/Microsoft\.ManagedIdentity/userAssignedIdentities/[^/]+$') { $values.Note = "Federated credentials not read: unexpected resource ID $($rid[0])" }
                    else {
                        $fics = @(Invoke-NpiList -Reader $Reader -CallId 'arm-uami-fics' -Bind @{ resourceId = $rid[0] })
                        $values.FederatedCredentials = $fics.Count
                        $values.FederatedSubjects = (Join-NpiList ($fics | ForEach-Object { "$($_.properties.issuer) | $($_.properties.subject)" }))
                        if ($fics.Count) { $values.CredentialKind = 'ManagedByAzure+Federated' }
                    }
                }
            }
            'Legacy' {
                $owners = Get-NpiOwnerSummary (Invoke-NpiList -Reader $Reader -CallId 'graph-service-principal-owners' -Bind @{ id = $sp.id } -Query '$select=id')
                $cred = Get-NpiCredentialSummary $sp.passwordCredentials $sp.keyCredentials $AsOf
                $values.IdentityId = "sp:$($sp.id)"; $values.Type = 'LegacyServicePrincipal'; $values.HomeTenant = 'Own'
                $values.OwnerCount = $owners.Count; $values.OwnerIds = $owners.Ids; $values.OwnerTypes = $owners.Types
                $values.Secrets = $cred.Secrets; $values.Certificates = $cred.Certificates; $values.ExpiredCredentials = $cred.Expired; $values.NextCredentialExpiry = $cred.Next; $values.CredentialKind = $cred.Kind
            }
            'ServiceIdentity' {
                $values.IdentityId = "sp:$($sp.id)"; $values.Type = 'AgentIdentity'; $values.HomeTenant = if ($own) { 'Own' } else { 'External' }
                $values.Note = 'An agent identity (servicePrincipalType ServiceIdentity); sponsors and blueprint are read in Chapter 09'
            }
            'Application' {
                $values.IdentityId = "sp:$($sp.id)"; $values.HomeTenant = if ($own) { 'Own' } else { 'External' }
                $values.Type = if ($own) { 'ServicePrincipal' } else { 'ExternalServicePrincipal' }
                $cred = Get-NpiCredentialSummary $sp.passwordCredentials $sp.keyCredentials $AsOf
                $values.Secrets = $cred.Secrets; $values.Certificates = $cred.Certificates; $values.ExpiredCredentials = $cred.Expired; $values.NextCredentialExpiry = $cred.Next
                $values.CredentialKind = if ($own) { 'OnAppRegistration' } else { 'HomeTenant' }
                if ($cred.Kind -ne 'None') { $values.CredentialKind = "$($values.CredentialKind)+ServicePrincipal$($cred.Kind)" }
            }
            default {
                $values.IdentityId = "sp:$($sp.id)"; $values.Type = 'UnknownServicePrincipal'; $values.HomeTenant = if ($own) { 'Own' } else { 'External' }
                $values.Note = "servicePrincipalType '$spType' isn't one the register classifies"
            }
        }
        # An own-tenant app's permissions are reported once, on its app registration row.
        if ($values.Type -ne 'ServicePrincipal') { foreach ($kv in (& $permCols $sp.id).GetEnumerator()) { $values[$kv.Key] = $kv.Value } }
        else { $values.Note = 'Permissions, owners and credentials are on its app registration row' }
        $rows.Add((New-NpiRow $values))
    }
    $rows.ToArray()
}

# ----------------------------------------------------------------------------- classification

function Get-NpiRisk {
    <#
    Design guidance: the project plan's rule (HIGH = password never expires or over-privileged),
    with Book 02, Chapter 09's 365-day password age, and over-privileged meaning a privileged AD
    group, unconstrained delegation, or a high-privilege Microsoft Graph application permission.
    #>
    param($Row, $Config)
    $reasons = [Collections.Generic.List[string]]::new()
    if ($Row.Enabled -eq $true) {
        if ($Row.PasswordNeverExpires) { $reasons.Add('password never expires') }
        if ($Row.Type -eq 'Traditional' -and $Row.PasswordAgeDays -gt $Config.passwordAgeHighDays) { $reasons.Add("password not changed in $($Row.PasswordAgeDays) days") }
        if ($Row.PrivilegedGroups) { $reasons.Add("member of $($Row.PrivilegedGroups)") }
        if ($Row.Delegation -eq 'Unconstrained') { $reasons.Add('trusted for unconstrained delegation') }
        if ($Row.HighPrivilegeAppRoles) { $reasons.Add("holds $($Row.HighPrivilegeAppRoles)") }
    }
    if ($reasons.Count) { return [pscustomobject]@{ Risk = 'HIGH'; Reasons = ($reasons -join '; ') } }
    $medium = $Row.Enabled -eq $true -and ($Row.Type -in @('Traditional', 'MSA', 'gMSA', 'LegacyServicePrincipal', 'UnknownServiceAccount', 'UnknownServicePrincipal') -or $Row.Secrets -gt 0)
    if ($medium) {
        $why = if ($Row.Secrets -gt 0) { 'holds a client secret' } elseif ($Row.Type -eq 'Traditional') { 'stored password' } else { "$($Row.Type)" }
        return [pscustomobject]@{ Risk = 'MEDIUM'; Reasons = $why }
    }
    [pscustomobject]@{ Risk = 'LOW'; Reasons = $(if ($Row.Enabled -eq $false) { 'disabled' } else { '' }) }
}

function Get-NpiCandidateTarget {
    <# Book 02, Chapter 09's migration path matrix, as a candidate only; Chapter 03 decides. #>
    param($Row)
    switch ($Row.Type) {
        'Traditional' {
            if ($Row.Enabled -eq $false) { return 'Retirement candidate: confirm against sign-in logs, then the orphan rule or decommission' }
            if ($Row.StaleLead) { return 'Verify use first (stale lead); retirement candidate if unused' }
            if ($Row.SpnCount -gt 0) { return 'gMSA, or a dMSA on a Windows Server 2025 domain (Kerberos service)' }
            return 'Managed identity if the workload runs in Azure; otherwise an app registration with a federated credential or certificate'
        }
        'MSA' { return 'Upgrade to a gMSA (an MSA or gMSA can''t be migrated to a dMSA)' }
        'gMSA' { return 'Keep for on-premises Kerberos; workload identity federation or a managed identity when the workload moves' }
        'dMSA' { return 'Keep the dMSA' }
        'AppRegistration' {
            if ($Row.Secrets -gt 0) { return 'Replace the client secret: managed identity, then federated credential, then certificate' }
            if ($Row.FederatedCredentials -gt 0) { return 'Keep: federated credential' }
            if ($Row.Certificates -gt 0) { return 'Certificate on the rotation schedule; federated credential where the host has an issuer' }
            return 'No credential: confirm it is still needed'
        }
        'ServicePrincipal' { return 'Governed through its app registration' }
        'ExternalServicePrincipal' { return 'Credentials are in the home tenant: review consent and permissions' }
        'LegacyServicePrincipal' { return 'Replace with an app registration and service principal' }
        'ManagedIdentitySystemAssigned' { return 'Keep: managed identity; scope its role assignments (Chapter 07)' }
        'ManagedIdentityUserAssigned' { return 'Keep: managed identity; join it to a record, since it outlives its resources' }
        'AgentIdentity' { return 'AI agent identity: Chapter 09' }
        'AgentIdentityBlueprint' { return 'AI agent identity blueprint: Chapter 09' }
        default { return 'Classify by hand' }
    }
}

function Get-NpiRegister {
    <#
    .SYNOPSIS
        The whole register: AD and Entra rows, each with a risk, a candidate target and a Data
        Platform hand-off where it applies. Returns @{ Rows; Evidence }.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][string]$TenantId,
        [Parameter(Mandatory)][datetime]$AsOf,
        $Config = (Get-NpiRegisterConfig),
        [switch]$SkipAd,
        [switch]$SkipAzure
    )
    $rows = [Collections.Generic.List[object]]::new()
    if (-not $SkipAd) { foreach ($r in (Get-NpiAdServiceAccount -Reader $Reader -AsOf $AsOf -Config $Config)) { $rows.Add($r) } }
    foreach ($r in (Get-NpiEntraWorkloadIdentity -Reader $Reader -TenantId $TenantId -AsOf $AsOf -Config $Config -SkipAzure:$SkipAzure)) { $rows.Add($r) }
    foreach ($r in $rows) {
        $risk = Get-NpiRisk -Row $r -Config $Config
        $r.Risk = $risk.Risk; $r.RiskReasons = $risk.Reasons
        $r.CandidateTarget = Get-NpiCandidateTarget -Row $r
        if ($r.Source -eq 'AD') {
            $dp = Get-NpiDataPlatformMatch -Name $r.Name -Spns @("$($r.Spns)" -split '; ' | Where-Object { $_ }) -Config $Config
            if ($dp) { $r.Handoff = 'DataPlatform'; $r.CandidateTarget = "Data Platform plan ($dp): $($r.CandidateTarget)" }
        }
    }
    [pscustomobject]@{ Rows = $rows.ToArray(); Evidence = $Reader.Evidence.ToArray() }
}

function Test-NpiRegister {
    <#
    .SYNOPSIS
        The register's findings, NPI-INV-01 to NPI-INV-09, each with a stable ID (rule:identity).
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Register, $Config = (Get-NpiRegisterConfig))
    $f = [Collections.Generic.List[object]]::new()
    foreach ($r in @($Register.Rows)) {
        $k = $r.IdentityId; $n = "$($r.Name) ($($r.Type))"
        if ($r.Risk -eq 'HIGH') { $f.Add((New-NpiFinding 'NPI-INV-01' 'Finding' $k $n "HIGH risk: $($r.RiskReasons). Candidate: $($r.CandidateTarget)")) }
        if ($r.StaleLead) { $f.Add((New-NpiFinding 'NPI-INV-02' 'Warn' $k $n "No logon since $(if ($r.LastLogon) { $r.LastLogon } else { 'ever' }). $($r.StaleNote)")) }
        if ($r.Type -in @('AppRegistration', 'LegacyServicePrincipal') -and $r.OwnerCount -lt 2) { $f.Add((New-NpiFinding 'NPI-INV-03' 'Warn' $k $n "$($r.OwnerCount) owner(s); Chapter 02 checks who they are against the two-human-owner rule")) }
        if ($r.Secrets -gt 0) { $f.Add((New-NpiFinding 'NPI-INV-04' 'Warn' $k $n "Holds $($r.Secrets) client secret(s)")) }
        if ($r.ExpiredCredentials -gt 0) { $f.Add((New-NpiFinding 'NPI-INV-05' 'Warn' $k $n "$($r.ExpiredCredentials) expired credential(s) still on the object; remove unused credentials")) }
        if ($r.TenantWideConsent) { $f.Add((New-NpiFinding 'NPI-INV-06' 'Warn' $k $n 'Holds a delegated grant consented for all users (consentType AllPrincipals)')) }
        if ($r.Handoff -eq 'DataPlatform') { $f.Add((New-NpiFinding 'NPI-INV-07' 'Info' $k $n 'SQL Server account: handed to the Data Platform plan (task N0.4)')) }
        if ($r.Note -like 'Detected only by a password that never expires*') { $f.Add((New-NpiFinding 'NPI-INV-08' 'Warn' $k $n $r.Note)) }
        if ($r.Type -in @('UnknownServiceAccount', 'UnknownServicePrincipal')) { $f.Add((New-NpiFinding 'NPI-INV-09' 'Warn' $k $n $r.Note)) }
    }
    $f.ToArray()
}

Export-ModuleMember -Function Get-NpiRegisterConfig, Get-NpiServiceUserLdapFilter, Get-NpiAdServiceAccount, Get-NpiEntraWorkloadIdentity, Get-NpiRisk,
    Get-NpiCandidateTarget, Get-NpiRegister, Test-NpiRegister, New-NpiRow
