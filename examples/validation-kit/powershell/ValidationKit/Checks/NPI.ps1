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

# Privileged built-in groups a managed service account must not be a direct member of.
$script:VkPrivilegedAdGroups = @('Domain Admins', 'Enterprise Admins', 'Administrators', 'Schema Admins', 'Account Operators', 'Backup Operators', 'Server Operators', 'Print Operators')

function Get-VkAdCommonName {
    # The first RDN value of a distinguished name (CN=DL-gMSA-web-Hosts,OU=... -> DL-gMSA-web-Hosts); a plain name is returned as is.
    param([string]$Value)
    if ($Value -match '^(?:CN|OU)=((?:\\,|[^,])+)') { return ($Matches[1] -replace '\\,', ',') }
    $Value
}

function Test-VkAes256Only {
    # KerberosEncryptionType as Get-ADServiceAccount gives it ('AES256', 'AES128, AES256'), a list,
    # or the msDS-SupportedEncryptionTypes number (low five bits: DES-CBC-CRC 1, DES-CBC-MD5 2, RC4 4, AES128 8, AES256 16).
    param($Value)
    if ($null -eq $Value) { return $false }
    $items = @($Value | ForEach-Object { "$_" -split '[,\s]+' } | Where-Object { $_ })
    if ($items.Count -eq 1 -and $items[0] -match '^\d+$') { return (([int64]$items[0]) -band 0x1F) -eq 0x10 }
    $set = @($items | ForEach-Object { $_.ToUpperInvariant() } | Sort-Object -Unique)
    ($set.Count -eq 1) -and ($set[0] -eq 'AES256')
}

function Get-VkManagedAccountIssue {
    <#
    The VK-NPI-06 rules for a gMSA or dMSA. Returns @{ Finding = @(...); Warn = @(...) }.
    gMSA only (decisions scoped to gMSAs): the retriever group (WD-160) and the service-account OU (WD-161).
    gMSA and dMSA: the name (WD-159), the password interval, AES256 only, privileged group membership.
    WD-154's outbound-only rule isn't checked: Learn documents -RestrictToOutboundAuthenticationOnly
    as a New-ADServiceAccount switch but names no attribute that records it, so it can't be read back.
    #>
    param($Account, [string]$ServiceAccountOU)
    $class = "$($Account.ObjectClass)"
    $isGmsa = $class -eq 'msDS-GroupManagedServiceAccount'
    $finding = @(); $warn = @()

    $name = "$($Account.SamAccountName)" -replace '\$$', ''
    $prefix = if ($isGmsa) { 'gmsa' } else { 'dmsa' }
    if ($name -notmatch "^$prefix-[A-Za-z0-9][A-Za-z0-9-]*$") { $warn += "Name not $prefix-<app> (WD-159)" }
    if ($name.Length -gt 15) { $warn += "Name $($name.Length) characters before the `$ (WD-159 maximum 15)" }

    $interval = Get-VkValue $Account 'ManagedPasswordIntervalInDays'
    if (Test-VkBlank $interval) { $warn += 'Password change interval unknown' }
    elseif ([int]$interval -ne 30) { $warn += "Password change interval $([int]$interval) days, not 30 (set only at creation)" }

    if (-not (Test-VkAes256Only (Get-VkValue $Account 'KerberosEncryptionType'))) {
        $finding += "Kerberos encryption types not AES256 only ($(@(Get-VkValue $Account 'KerberosEncryptionType') -join ', '))"
    }

    $privileged = @(@(Get-VkValue $Account 'MemberOf' @()) | ForEach-Object { Get-VkAdCommonName "$_" } | Where-Object { $script:VkPrivilegedAdGroups -contains $_ })
    if ($privileged.Count -gt 0) { $finding += "Member of a privileged group: $($privileged -join ', ')" }

    if ($isGmsa) {
        $retrievers = @(@(Get-VkValue $Account 'PrincipalsAllowedToRetrieveManagedPassword' @()) | Where-Object { $_ } | ForEach-Object { Get-VkAdCommonName "$_" })
        if ($retrievers.Count -ne 1 -or $retrievers[0] -notmatch '^DL-gMSA-[A-Za-z0-9][A-Za-z0-9-]*-Hosts$') {
            $finding += "Password retrievers not exactly one DL-gMSA-<app>-Hosts group (WD-160): $(if ($retrievers.Count) { $retrievers -join ', ' } else { 'none' })"
        }
        if (-not (Test-VkBlank $ServiceAccountOU)) {
            $dn = "$(Get-VkValue $Account 'DistinguishedName')"
            if (-not $dn.EndsWith(",$($ServiceAccountOU.Trim())", [System.StringComparison]::OrdinalIgnoreCase)) { $warn += 'Not in the service-account OU (WD-161)' }
        }
    }
    @{ Finding = $finding; Warn = $warn }
}

function Invoke-VkNpi06 {
    <#
    .SYNOPSIS
        Implements VK-NPI-06: lists AD service accounts that are user objects rather than gMSAs or
        dMSAs, flagging passwords that never expire, passwords older than MaxPasswordAgeDays, and SPNs;
        and checks each gMSA and dMSA against the program's standard (WD-159, WD-160, WD-161).
    .EXAMPLE
        # In fixture mode it reads adServiceAccounts.json; live, it reads AD unless -SkipAD.
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi06 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-06. AD accounts used as service accounts (a servicePrincipalName, or a name starting
    with ServiceAccountNameHint) that are user objects rather than gMSAs or dMSAs, with their
    flags: password never expires, password older than MaxPasswordAgeDays, SPNs. Each gMSA and
    dMSA is checked too (Get-VkManagedAccountIssue): name gmsa-<app> or dmsa-<app>, 15 characters
    or fewer (WD-159); password interval 30 days; Kerberos AES256 only; no direct membership of a
    privileged built-in group; for a gMSA, exactly one DL-gMSA-<app>-Hosts retriever group (WD-160)
    and, when ServiceAccountOU is set, a place under that OU (WD-161). A compliant one is an Info row.
    Live, this is one read-only Get-ADUser and one Get-ADServiceAccount; skip it with -SkipAD.
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
                $msaProps = 'objectClass', 'servicePrincipalName', 'PrincipalsAllowedToRetrieveManagedPassword', 'msDS-ManagedPasswordInterval', 'KerberosEncryptionType', 'MemberOf'
                foreach ($m in @(Get-ADServiceAccount -Filter * -Properties $msaProps)) {
                    [pscustomobject]@{ SamAccountName = $m.SamAccountName; ObjectClass = "$(@($m.objectClass)[-1])"; Enabled = $m.Enabled; PasswordNeverExpires = $false; PasswordLastSet = $null
                        ServicePrincipalName = @($m.servicePrincipalName); DistinguishedName = $m.DistinguishedName
                        PrincipalsAllowedToRetrieveManagedPassword = @($m.PrincipalsAllowedToRetrieveManagedPassword | ForEach-Object { "$_" })
                        ManagedPasswordIntervalInDays = $m.'msDS-ManagedPasswordInterval'; KerberosEncryptionType = "$($m.KerberosEncryptionType)"; MemberOf = @($m.MemberOf) }
                }
            })
        if ($accounts.Count -eq 0) { return Get-VkNotApplicable 'No service accounts found' }
        $maxAge = [int]$Context.Options['MaxPasswordAgeDays']
        $ou = "$($Context.Options['ServiceAccountOU'])"
        $rows = foreach ($a in $accounts) {
            if ("$($a.ObjectClass)" -ne 'user') {
                if (@('msDS-GroupManagedServiceAccount', 'msDS-DelegatedManagedServiceAccount') -notcontains "$($a.ObjectClass)") {
                    ConvertTo-VkFinding -Severity Info -Object $a.SamAccountName -Issue 'Managed service account' -Data ([ordered]@{ ObjectClass = $a.ObjectClass })
                    continue
                }
                $i = Get-VkManagedAccountIssue -Account $a -ServiceAccountOU $ou
                $all = @($i.Finding) + @($i.Warn)
                $sev = if ($i.Finding.Count) { 'Finding' } elseif ($i.Warn.Count) { 'Warn' } else { 'Info' }
                $data = [ordered]@{
                    ObjectClass       = $a.ObjectClass
                    Retrievers        = @(@(Get-VkValue $a 'PrincipalsAllowedToRetrieveManagedPassword' @()) | ForEach-Object { Get-VkAdCommonName "$_" })
                    PasswordInterval  = Get-VkValue $a 'ManagedPasswordIntervalInDays'
                    EncryptionTypes   = Get-VkValue $a 'KerberosEncryptionType'
                    SPNs              = @(@(Get-VkValue $a 'ServicePrincipalName' @()) | Where-Object { $_ })
                    DistinguishedName = Get-VkValue $a 'DistinguishedName'
                }
                ConvertTo-VkFinding -Severity $sev -Object $a.SamAccountName -Issue $(if ($all.Count) { $all -join '; ' } else { 'Managed service account' }) -Data $data
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
        $ouNote = if (Test-VkBlank $ou) { 'service-account OU not set (WD-161 not checked)' } else { "service-account OU $ou" }
        Get-VkOutcome -Rows @($rows) -Message ('Name hint "{0}"; maximum password age {1} days; {2}; outbound-only (WD-154) not checked: no documented attribute' -f $hint, $maxAge, $ouNote)
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
        NotApplicable without -IncludePreview.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -IncludePreview
        Invoke-VkNpi09 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-09 (optional, preview). This tenant's application service principals with no sign-in,
    as client or resource, delegated or app-only, in SpInactiveDays days, from Graph's beta
    servicePrincipalSignInActivities report (AuditLog.Read.All; Reports Reader). Runs only with
    -IncludePreview. Learn documents the report for the global service, which GCC uses.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-09' $Context {
        param($Context)
        if (-not $Context.IncludePreview) { return Get-VkNotApplicable 'Optional preview check: run with -IncludePreview' }
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

# ---------------------------------------------------------------------------------------------
# VK-NPI-10: AWS GovCloud (US) and OCI workload identities, from the guide's Step 1g and 1h exports
# ---------------------------------------------------------------------------------------------

function Get-VkCloudValue {
    # A property whatever its case, hyphens or underscores (time-created, timeCreated and time_created
    # match): the OCI CLI's output field names aren't shown on its reference pages.
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    $want = ($Name -replace '[-_]', '').ToLowerInvariant()
    if ($Object -is [System.Collections.IDictionary]) {
        foreach ($k in @($Object.Keys)) { if ((("$k" -replace '[-_]', '').ToLowerInvariant()) -eq $want) { return $Object[$k] } }
        return $null
    }
    foreach ($p in @($Object.PSObject.Properties)) { if ((($p.Name -replace '[-_]', '').ToLowerInvariant()) -eq $want) { return $p.Value } }
    $null
}

function Read-VkCloudExport {
    # One export file under the cloud export folder, logged as evidence: @{ Items = <the array under
    # -Key, or the file's array> }, with no items for an empty file; $null when an -Optional file is absent.
    param([Parameter(Mandatory)][string]$Root, [Parameter(Mandatory)][string]$File, [string]$Key, [switch]$Optional)
    $p = Join-Path $Root $File
    if (-not (Test-Path -LiteralPath $p -PathType Leaf)) {
        if ($Optional) { return $null }
        throw "Missing export $File (the implementation guide's Step 1g or 1h writes it)"
    }
    Trace-VkQuery -Source 'Input' -Query "cloud export: $($File -replace '\\', '/')"
    $text = [System.IO.File]::ReadAllText($p)
    if (Test-VkBlank $text) { return @{ Items = @() } }
    # Assigned first: Windows PowerShell 5.1's ConvertFrom-Json writes a JSON array as one object.
    $o = ConvertFrom-Json -InputObject $text
    # A one-item JSON array comes back as the item itself, so the key counts only when the object has it.
    $want = ($Key -replace '[-_]', '').ToLowerInvariant()
    if ($Key -and $o -isnot [array] -and @($o.PSObject.Properties | Where-Object { (($_.Name -replace '[-_]', '').ToLowerInvariant()) -eq $want }).Count) {
        $v = Get-VkCloudValue $o $Key
        return @{ Items = @(@($v) | Where-Object { $null -ne $_ }) }
    }
    @{ Items = @(@($o) | Where-Object { $null -ne $_ }) }
}

function Get-VkCloudTagGap {
    # The program's tag keys (WD-172: SystemId, Owner1, Owner2, Sponsor) missing from an AWS tag list
    # (Key, Value pairs) or from an OCI object's freeform tags and defined tags (any namespace, or the
    # one OciTagNamespace names).
    param($AwsTags, $OciObject, [string[]]$Keys, [string]$Namespace)
    $have = @{}
    foreach ($t in @($AwsTags)) { if ($null -ne $t -and -not (Test-VkBlank (Get-VkValue $t 'Value'))) { $have["$(Get-VkValue $t 'Key')"] = $true } }
    if ($null -ne $OciObject) {
        $free = Get-VkCloudValue $OciObject 'freeformTags'
        if ($null -ne $free) { foreach ($p in @($free.PSObject.Properties)) { if (-not (Test-VkBlank $p.Value)) { $have[$p.Name] = $true } } }
        $defined = Get-VkCloudValue $OciObject 'definedTags'
        if ($null -ne $defined) {
            foreach ($ns in @($defined.PSObject.Properties)) {
                if (-not (Test-VkBlank $Namespace) -and $ns.Name -ne $Namespace) { continue }
                foreach ($p in @($ns.Value.PSObject.Properties)) { if (-not (Test-VkBlank $p.Value)) { $have[$p.Name] = $true } }
            }
        }
    }
    @($Keys | Where-Object { -not $have.ContainsKey($_) })
}

function Get-VkCloudCredentialSeverity {
    # Finding with no recorded exception or after its replace-by date; Warn while a recorded one runs.
    param($Exceptions, [string]$Cloud, [string]$CredentialId, $AsOf)
    $e = $null
    foreach ($x in @($Exceptions)) { if ($null -ne $x -and "$($x.Cloud)" -eq $Cloud -and "$($x.CredentialId)" -eq $CredentialId) { $e = $x; break } }
    if ($null -eq $e) { return @{ Severity = 'Finding'; Note = 'no exception recorded' } }
    if (Test-VkBlank $e.ReplaceBy) { return @{ Severity = 'Finding'; Note = "exception $($e.ExceptionRecord) has no replace-by date" } }
    $by = ConvertTo-VkUtc $e.ReplaceBy
    if ($by -lt (ConvertTo-VkUtc $AsOf)) { return @{ Severity = 'Finding'; Note = "exception $($e.ExceptionRecord) ended $($by.ToString('yyyy-MM-dd'))" } }
    @{ Severity = 'Warn'; Note = "under exception $($e.ExceptionRecord) until $($by.ToString('yyyy-MM-dd'))" }
}

function Invoke-VkNpi10 {
    <#
    .SYNOPSIS
        Implements VK-NPI-10: the AWS GovCloud (US) and OCI gate criteria from the files the
        implementation guide's Steps 1g and 1h export (WD-171). Reads files only; never calls AWS or OCI.
    .EXAMPLE
        # Fixture mode reads <fixture>\cloud\aws and <fixture>\cloud\oci.
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkNpi10 -Context $ctx
    .EXAMPLE
        # Live: point it at the folder that holds the exports' aws and oci folders.
        $ctx = Get-VkRunContext -InputPath D:\Inputs -Option @{ CloudExportPath = 'D:\Exports\2026-11-24' }
        Invoke-VkNpi10 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-NPI-10. Findings: every active IAM access key, service-specific credential, OCI API signing key,
    auth token and customer secret key with no current exception in CloudExceptionsFile (a Warn while
    one runs); an active root user access key; an OCI API key older than OciApiKeyMaxAgeDays (Oracle:
    rotate every 90 days or less); a customer-managed role, a workload IAM user, an OCI user holding a
    credential or a dynamic group missing any of CloudTagKeys (WD-172); a role trusting an OIDC provider
    with no sub condition; an enabled IAM Roles Anywhere trust anchor with no enabled imported CRL
    (GovCloud has no CRL distribution point checking). A Warn when iam-tags.json or
    roles-anywhere-crls.json wasn't exported. Developer workbook Chapter 13's kit gives the full
    findings (NPI-AWS-01 to -16, NPI-OCI-01 to -10) from the same files.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-NPI-10' $Context {
        param($Context)
        $root = "$($Context.Options['CloudExportPath'])"
        if (Test-VkBlank $root) {
            if ($Context.Mode -eq 'Fixture') { $root = Join-Path $Context.FixturePath 'cloud' }
            elseif ($Context.InputPath) { $root = Join-Path $Context.InputPath 'cloud' }
            else { return Get-VkNotApplicable 'No AWS or OCI exports: set -Option @{ CloudExportPath = ''<folder with aws and oci>'' }' }
        } else { $root = ConvertTo-VkFullPath $root }
        $hasAws = Test-Path -LiteralPath (Join-Path $root 'aws') -PathType Container
        $hasOci = Test-Path -LiteralPath (Join-Path $root 'oci') -PathType Container
        if (-not ($hasAws -or $hasOci)) { return Get-VkNotApplicable "No aws or oci export folder under $root" }
        $keys = @($Context.Options['CloudTagKeys'])
        $ns = "$($Context.Options['OciTagNamespace'])"
        $maxAge = [int]$Context.Options['OciApiKeyMaxAgeDays']
        $exceptions = Read-VkInputCsv -Context $Context -Option 'CloudExceptionsFile'
        if ($null -eq $exceptions) { $exceptions = @() }
        $rows = [System.Collections.Generic.List[object]]::new()
        $notes = [System.Collections.Generic.List[string]]::new()

        if ($hasAws) {
            $reportPath = Join-Path $root 'aws/credential-report.csv'
            if (-not (Test-Path -LiteralPath $reportPath -PathType Leaf)) { throw 'Missing export aws/credential-report.csv (the implementation guide''s Step 1g writes it)' }
            Trace-VkQuery -Source 'Input' -Query 'cloud export: aws/credential-report.csv'
            $reportRows = @(Import-Csv -LiteralPath $reportPath)
            $keysFile = @((Read-VkCloudExport -Root $root -File 'aws/access-keys.json' -Key 'AccessKeyMetadata').Items)
            $ssc = @((Read-VkCloudExport -Root $root -File 'aws/service-specific-credentials.json' -Key 'ServiceSpecificCredentials').Items)
            $roles = @((Read-VkCloudExport -Root $root -File 'aws/roles.json' -Key 'Roles').Items)
            $anchors = @((Read-VkCloudExport -Root $root -File 'aws/roles-anywhere-trust-anchors.json' -Key 'trustAnchors').Items)
            $tagDoc = Read-VkCloudExport -Root $root -File 'aws/iam-tags.json' -Optional
            $crls = Read-VkCloudExport -Root $root -File 'aws/roles-anywhere-crls.json' -Key 'crls' -Optional
            $tags = @{}
            if ($null -ne $tagDoc) { foreach ($t in @($tagDoc.Items)) { $tags["$(Get-VkValue $t 'Type')|$(Get-VkValue $t 'Name')"] = @(Get-VkValue $t 'Tags' @()) } }
            else { $rows.Add((ConvertTo-VkFinding -Severity Warn -Object 'AWS account' -Issue 'aws/iam-tags.json not exported: no role or user was checked for the program''s tags (ListUsers and ListRoles return none; the guide''s Step 1g writes the file)')) }

            foreach ($r in $reportRows) {
                if ("$($r.arn)" -match ':root$') {
                    foreach ($n in 1, 2) { if ("$(Get-VkValue $r "access_key_$($n)_active")" -eq 'true') { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object 'root user' -ObjectId "$($r.arn)" -Issue "Root user access key $n is active")) } }
                }
            }
            $workloadUsers = @{}
            foreach ($k in $keysFile) {
                if ("$(Get-VkValue $k 'Status')" -ne 'Active') { continue }
                $u = "$(Get-VkValue $k 'UserName')"; $id = "$(Get-VkValue $k 'AccessKeyId')"; $workloadUsers[$u] = $true
                $s = Get-VkCloudCredentialSeverity -Exceptions $exceptions -Cloud aws -CredentialId $id -AsOf $Context.AsOf
                $rows.Add((ConvertTo-VkFinding -Severity $s.Severity -Object $u -ObjectId $id -Issue "Active IAM access key, a long-lived secret: $($s.Note)" -Data ([ordered]@{ Created = (Format-VkUtc (Get-VkValue $k 'CreateDate')); AgeDays = (Get-VkDays (Get-VkValue $k 'CreateDate') $Context.AsOf) })))
            }
            foreach ($c in $ssc) {
                if ("$(Get-VkValue $c 'Status')" -ne 'Active') { continue }
                $u = "$(Get-VkValue $c 'UserName')"; $id = "$(Get-VkValue $c 'ServiceSpecificCredentialId')"; $workloadUsers[$u] = $true
                $s = Get-VkCloudCredentialSeverity -Exceptions $exceptions -Cloud aws -CredentialId $id -AsOf $Context.AsOf
                $rows.Add((ConvertTo-VkFinding -Severity $s.Severity -Object $u -ObjectId $id -Issue "Active service-specific credential for $(Get-VkValue $c 'ServiceName'): $($s.Note)"))
            }
            if ($null -ne $tagDoc) {
                foreach ($u in @($workloadUsers.Keys | Sort-Object)) {
                    $gap = @(Get-VkCloudTagGap -AwsTags $tags["User|$u"] -Keys $keys)
                    if ($gap.Count) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $u -Issue "IAM user with a long-lived credential is missing tag(s) $($gap -join ', ')")) }
                }
            }
            $oidcRoles = 0
            foreach ($role in $roles) {
                $name = "$(Get-VkValue $role 'RoleName')"
                if ("$(Get-VkValue $role 'Path')".StartsWith('/aws-service-role/')) { continue }
                if ($null -ne $tagDoc) {
                    $gap = @(Get-VkCloudTagGap -AwsTags $tags["Role|$name"] -Keys $keys)
                    if ($gap.Count) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $name -ObjectId "$(Get-VkValue $role 'Arn')" -Issue "Role is missing tag(s) $($gap -join ', ')")) }
                }
                $doc = Get-VkValue $role 'AssumeRolePolicyDocument'
                if ($doc -is [string]) { $doc = ConvertFrom-Json -InputObject ([uri]::UnescapeDataString($doc)) }
                foreach ($st in @(Get-VkValue $doc 'Statement' @())) {
                    if ("$(Get-VkValue $st 'Effect')" -ne 'Allow') { continue }
                    foreach ($fed in @(Get-VkValue (Get-VkValue $st 'Principal') 'Federated' @())) {
                        if ("$fed" -notmatch ':oidc-provider/(.+)$') { continue }
                        $iss = $Matches[1]; $oidcRoles++
                        $hasSub = $false
                        $cond = Get-VkValue $st 'Condition'
                        if ($null -ne $cond) { foreach ($op in @($cond.PSObject.Properties)) { foreach ($ck in @($op.Value.PSObject.Properties)) { if ($ck.Name -ieq "$($iss):sub") { $hasSub = $true } } } }
                        if (-not $hasSub) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $name -ObjectId "$fed" -Issue "Trusts OIDC provider $iss with no $($iss):sub condition")) }
                    }
                }
            }
            foreach ($a in $anchors) {
                if ((Get-VkValue $a 'enabled') -ne $true) { continue }
                $arn = "$(Get-VkValue $a 'trustAnchorArn')"
                if ($null -eq $crls) { $rows.Add((ConvertTo-VkFinding -Severity Warn -Object "$(Get-VkValue $a 'name')" -ObjectId $arn -Issue 'aws/roles-anywhere-crls.json not exported: can''t tell whether a CRL is imported')); continue }
                $ok = @(@($crls.Items) | Where-Object { "$(Get-VkValue $_ 'trustAnchorArn')" -eq $arn -and (Get-VkValue $_ 'enabled') -eq $true })
                if (-not $ok.Count) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object "$(Get-VkValue $a 'name')" -ObjectId $arn -Issue 'Enabled IAM Roles Anywhere trust anchor with no enabled imported CRL (GovCloud has no CRL distribution point checking)')) }
            }
            $notes.Add("AWS: $($roles.Count) role(s), $($keysFile.Count) access key(s), $oidcRoles OIDC trust(s), $($anchors.Count) trust anchor(s)")
        }

        if ($hasOci) {
            $users = @((Read-VkCloudExport -Root $root -File 'oci/oci-users.json' -Key 'data').Items)
            $creds = @((Read-VkCloudExport -Root $root -File 'oci/oci-user-credentials.json' -Key 'data').Items)
            $groups = @((Read-VkCloudExport -Root $root -File 'oci/oci-dynamic-groups.json' -Key 'data').Items)
            $byName = @{}
            foreach ($u in $users) { $byName["$(Get-VkCloudValue $u 'name')"] = $u }
            foreach ($entry in $creds) {
                $name = "$(Get-VkCloudValue $entry 'User')"
                $held = 0
                foreach ($k in @(Get-VkCloudValue $entry 'ApiKeys')) {
                    if ($null -eq $k -or "$(Get-VkCloudValue $k 'lifecycleState')" -ne 'ACTIVE') { continue }
                    $held++
                    $fp = "$(Get-VkCloudValue $k 'fingerprint')"
                    $age = Get-VkDays (Get-VkCloudValue $k 'timeCreated') $Context.AsOf
                    $s = Get-VkCloudCredentialSeverity -Exceptions $exceptions -Cloud oci -CredentialId $fp -AsOf $Context.AsOf
                    $rows.Add((ConvertTo-VkFinding -Severity $s.Severity -Object $name -ObjectId $fp -Issue "Active OCI API signing key, $age days old: $($s.Note)"))
                    if ($age -gt $maxAge) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $name -ObjectId $fp -Issue "OCI API signing key older than $maxAge days (Oracle: rotate every 90 days or less)")) }
                }
                foreach ($kind in @(@('AuthTokens', 'auth token'), @('CustomerSecretKeys', 'customer secret key'))) {
                    foreach ($t in @(Get-VkCloudValue $entry $kind[0])) {
                        if ($null -eq $t -or "$(Get-VkCloudValue $t 'lifecycleState')" -ne 'ACTIVE') { continue }
                        $held++
                        $id = "$(Get-VkCloudValue $t 'id')"
                        $s = Get-VkCloudCredentialSeverity -Exceptions $exceptions -Cloud oci -CredentialId $id -AsOf $Context.AsOf
                        $rows.Add((ConvertTo-VkFinding -Severity $s.Severity -Object $name -ObjectId $id -Issue "Active OCI $($kind[1]), which doesn't expire: $($s.Note)"))
                    }
                }
                if ($held) {
                    $gap = @(Get-VkCloudTagGap -OciObject $byName[$name] -Keys $keys -Namespace $ns)
                    if ($gap.Count) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $name -Issue "OCI user with a long-lived credential is missing tag(s) $($gap -join ', ')")) }
                }
            }
            foreach ($g in $groups) {
                $gap = @(Get-VkCloudTagGap -OciObject $g -Keys $keys -Namespace $ns)
                if ($gap.Count) { $rows.Add((ConvertTo-VkFinding -Severity Finding -Object "$(Get-VkCloudValue $g 'name')" -ObjectId "$(Get-VkCloudValue $g 'id')" -Issue "Dynamic group is missing tag(s) $($gap -join ', ')")) }
            }
            $notes.Add("OCI: $($users.Count) user(s), $($groups.Count) dynamic group(s)")
        }
        Get-VkOutcome -Rows $rows.ToArray() -Message ("{0}; tags {1}; exceptions {2}" -f ($notes -join '; '), ($keys -join ', '), $(if (@($exceptions).Count) { @($exceptions).Count } else { 'none' }))
    }
}
